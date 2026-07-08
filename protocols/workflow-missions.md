# Workflow-Native Missions

> When a squad's phase graph is known in advance, the mission can run as a
> Claude Code **Workflow** — a deterministic orchestration script — instead of
> being hand-spawned agent by agent. Same personas, same blackboard, same
> stigmergy record. What changes is who holds the gating and the parallelism:
> the runtime does, not the orchestrator's attention.

## Why This Exists

Some missions have a shape you already know before you start. A blind review is
always: fan out to independent reviewers, wait for all of them, synthesize. An
engineering build is always: design, then implement, then verify. A research
sweep is always: investigate in parallel, then draw the threads together. When
the phase graph is fixed like this, hand-spawning each agent and watching for
each completion is ceremony the runtime can carry for you.

A Workflow is a small JavaScript script that describes that graph directly. Its
primitives are few and concrete:

| Primitive | What it does |
|-----------|--------------|
| `agent(prompt, opts)` | Spawns one agent; returns its result. With `schema`, the result is a validated object, not free text. `opts`: `label`, `phase`, `schema`, `model`, `effort`, `isolation`, `agentType`. |
| `parallel([...thunks])` | Runs the thunks concurrently and returns their results; a barrier — nothing past it runs until all finish. Concurrency is auto-capped by the runtime. |
| `pipeline(items, ...stages)` | Runs each item through the ordered stages. |
| `phase(name)` | Marks a phase boundary for logging and structure. |
| `log(msg)` | Writes a line to the run log. |

`agentType` may name a custom agent from `.claude/agents/` — this is how a
Workflow uses the same personas the hand-spawned squads use. The personas are
squad roles: persona × lens (a Challenger with a correctness lens, a Challenger
with a security lens), as defined in `squads/`.

The blackboard does not change. It remains the durable stigmergy record — the
Workflow appends findings, decisions, and synthesis to it exactly as a
hand-spawned squad would, so resumption and audit work the same way.

---

## Squad Pattern → Workflow Shape

| Squad pattern | Workflow shape |
|---------------|----------------|
| **Blind Review** (independent reviewers, blind gate, synthesis) | `parallel([...reviewers])` with a shared findings `schema`, then a synthesis `agent()`. The `parallel` barrier *is* the blind gate — no reviewer sees another's output. |
| **Engineering** (design → implement → verify) | `pipeline` or an ordered sequence of `agent()` calls, each phase reading the previous phase's blackboard entry. `isolation: "worktree"` for the implementer. |
| **Research** (fan-out investigation → synthesis) | `parallel([...investigators])` (each a distinct domain, each returning a structured findings object), then a synthesis `agent()` that folds them. |

The rule of thumb: **`parallel` for blind/independent work, ordered `agent()`
or `pipeline` for dependent stages, one synthesis `agent()` to fold.**

---

## Worked Example — Blind Review Squad as a Workflow

A complete mission: two blind reviewers (the same Challenger persona under two
lenses) and one synthesis pass. The findings schema makes each reviewer return
structured data; the `parallel` barrier enforces blindness; the blackboard
carries the durable record.

```javascript
export const meta = {
  name: 'kan-123-blind-review',
  description: 'Blind two-lens review of PR #421 + synthesis to the blackboard',
  phases: [{ title: 'Review' }, { title: 'Synthesize' }],
}
// A human opts in to run this Workflow. NOTE: the script itself has NO
// filesystem access — file writes happen through agents, which can Write
// inside the session's roots. The synthesis agent is also the scribe.
const BOARD = ".claude/hive/memory/active/blackboard/kan-123-review.md";
const diff = "PR #421 on branch feat/token-refresh — auth token refresh";

// The structured findings each reviewer must return.
const findingsSchema = {
  type: "object", required: ["findings"],
  properties: { findings: { type: "array", items: {
    type: "object",
    required: ["severity", "title", "evidence", "confidence"],
    properties: {
      severity:   { enum: ["CRITICAL", "WARNING", "INFO"] },
      title:      { type: "string" },
      evidence:   { type: "string" },   // file:line references
      confidence: { type: "number" },
    } } } },
};

phase("Review");
const [correctness, security] = await parallel([
  () => agent(`You are The Challenger with a correctness lens (personas/challenger.md).
Review ${diff} for bugs, logic errors, edge cases, and missing test coverage.
Do NOT read the blackboard's review sections (blindness). Return ONLY your
findings, matching the schema.`,
    { label: "correctness", agentType: "challenger", model: "sonnet", effort: "high", schema: findingsSchema }),
  () => agent(`You are The Challenger with a security lens (personas/challenger.md).
Review ${diff} for input validation, secrets exposure, access control, OWASP top 10.
Do NOT read the blackboard's review sections (blindness). Return ONLY your
findings, matching the schema.`,
    { label: "security", agentType: "challenger", model: "sonnet", effort: "high", schema: findingsSchema }),
]);
log(`reviews in: ${correctness.findings.length} correctness, ${security.findings.length} security`);

phase("Synthesize");
const synthesis = await agent(`You are The Orchestrator (personas/orchestrator.md), acting
as synthesizer AND scribe for mission kan-123. Both blind reviews are embedded below —
the reviewers never saw each other's work; you see both.

CORRECTNESS FINDINGS:\n${JSON.stringify(correctness.findings, null, 2)}
SECURITY FINDINGS:\n${JSON.stringify(security.findings, null, 2)}

1. Categorize each finding: CONVERGENT (both lenses), DIVERGENT (one only), or GAP
   (neither reviewer, but you see it). Do not add new reviews — categorize and recommend.
2. APPEND to the blackboard at ${BOARD}: both raw findings blocks (verbatim JSON), then
   your synthesis and merge recommendation, per protocols/synthesis-template.md.
3. Return the merge recommendation as your final text.`,
  { label: "synthesis", agentType: "orchestrator", effort: "high" });
return { correctness, security, synthesis };
```

The `parallel` call is the whole blind protocol: the two reviewers run
concurrently, neither can read the other, and synthesis only begins after both
return. What took a Scrum Master watching for two `finding_submitted` traces is
now a language barrier the runtime holds.

---

## Constraints (Read Before Choosing This Path)

Workflows buy determinism at the cost of some real limits. Be honest about them:

- **Explicit human opt-in.** Running a Workflow requires a human to launch it in
  their session. It is never auto-triggered by a hook, a heartbeat, or another
  agent. Frame a Workflow-native mission as *"here is the script; a human runs
  it,"* never as something the Hive starts on its own.
- **Agents get zero conversation context.** Each `agent()` starts fresh — it
  sees only its prompt. Everything it needs (the diff reference, the persona
  file path, the blackboard path, the schema expectations) must be *in the
  prompt string*. There is no shared history to lean on. This is a discipline,
  not a bug: it forces each charge to be fully specified.
- **The script has no filesystem access.** Workflow scripts cannot `require`
  Node modules or touch files — all file writes happen through *agents* (which
  can Write inside the session's roots) or in the orchestrating session after
  the workflow returns. In the example, the synthesis agent doubles as scribe.
  The blackboard path must be inside the session's writable roots either way.
- **No wall-clock or randomness in the script.** `Date.now()`, `new Date()`,
  and `Math.random()` are unavailable (they would break resume). Timestamps go
  in via the prompt or get stamped by agents; blackboard entries carry the
  timestamps the agents write.
- **Structured output is only as good as the schema.** A reviewer that returns
  a validated object is easy to fold; a vague schema gives vague folds. Spend
  the care on the schema.

---

## When NOT to Use a Workflow

A Workflow describes a phase graph you can write down before you start. If you
cannot — if the shape of the mission emerges *as you learn* — a Workflow is the
wrong tool, and a hand-spawned squad remains right.

Use hand-spawned squads when:

- The mission is **exploratory** — you do not yet know how many investigators
  you will need, or what the second phase is until the first phase reports.
- The **next step depends on judgment** you can only make after reading a
  result — "if the investigation finds X, pivot to Y; otherwise deepen X."
- **Dynamic scaling** is likely — you expect to add a clone mid-mission in
  response to context pressure or queue imbalance (see `dynamic-scaling.md`),
  which a fixed graph cannot express.
- The mission is **conversational** — you want to message an agent, read its
  answer, and ask a follow-up (`SendMessage` to a named agent). Workflows are
  fire-and-fold, not dialogue.

The two approaches share everything that matters — personas, the blackboard,
the crystallization record. Choose the Workflow when the graph is known and the
work is repetitive; choose the hand-spawned squad when the graph is still being
discovered.

---

## Related Protocols

| Protocol | Connection |
|----------|-----------|
| `squads/review-squad.md` | The blind-review shape the worked example encodes as a Workflow |
| `dynamic-scaling.md` | Fixed Workflow graphs cannot scale mid-mission; a reason to prefer hand-spawned squads |
| `stigmergy-traces.md` | The blackboard the Workflow appends to remains the durable completion record |
| `agent-shutdown.md` | Workflow agents complete and are folded by the script — the normal end-of-life case, no shutdown handshake |
