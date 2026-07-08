# Engineering Squad

> When to use: The team needs to **build or modify code** with known requirements. Uncertainty is low to medium — we know what to do, the question is how to do it well.

## Terrain Profile

| Axis | Range |
|------|-------|
| Uncertainty | Low to Medium |
| Reversibility | Reversible (feature branch, worktree) |
| Breadth | Narrow to Broad |
| Stakes | Low to Medium |

---

## Variants

### Focused Build (Default)

**When:** Low uncertainty, reversible, narrow scope. Human is available to fill the Orchestrator role.

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Designer | Architect | — | `general-purpose` | Specialist (sonnet) | Read-only |
| Implementer | Architect | operator | `general-purpose` | Operator (sonnet) | Full (Read, Write, Edit, Bash) |
| Verifier | Challenger | correctness | `general-purpose` | Specialist (sonnet) | Read, Bash |
| Scrum Master (required) | Scrum Master | operational | `general-purpose` | Specialist (sonnet) | Read, Write, Bash (no code edit) |

**Key:** No Orchestrator agent — human fills that role. 3 agents + Scrum Master (in parallel).

**Note:** Scrum Master runs in parallel with all phases, not in the trace dependency chain. Handles Jira ops, error catalog, crystallization protocol (update `memory/active/pattern-tracker.md` — read it, match this mission's candidates, increment counts, flag new PROMOTE candidates), mission cleanup (archive traces, blackboard, state), operational fixes, **DoD preflight/cleanup** (see `protocols/definition-of-done.md`), and **scaling monitoring** (see below). The Scrum Master is required for all missions — crystallization and cleanup are the system's long-term learning and hygiene mechanisms.

**SM Preflight (before Phase 1):** Check ticket exists for mission (WARN if missing, don't block). Check ticket has ACs (WARN if missing). Extract ACs and write to blackboard `## Acceptance Criteria`. Set ticket to "In Progress", fill start date.

**SM Cleanup (post-mission):** Create session log, update handoff doc, update ticket (comment + due date). Existing: archive blackboard/traces, retrospective.

### Full Engineering

**When:** Medium uncertainty, reversible, broad scope. Multiple files, cross-cutting concerns, or unfamiliar codebase area.

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Orchestrator | Orchestrator | — | `general-purpose` | Orchestrator (opus) | Full toolset |
| Designer | Architect | — | `general-purpose` | Specialist (sonnet) | Read-only |
| Reviewer | Challenger | — | `general-purpose` | Specialist (sonnet) | Read-only |
| Implementer | Architect | operator | `general-purpose` | Operator (sonnet) | Full (Read, Write, Edit, Bash) |
| Verifier | Challenger | correctness | `general-purpose` | Specialist (sonnet) | Read, Bash |
| Scrum Master (required) | Scrum Master | operational | `general-purpose` | Specialist (sonnet) | Read, Write, Bash (no code edit) |

**Key:** Orchestrator manages pipeline. Reviewer challenges design before implementation. 4-5 agents + Scrum Master (in parallel).

**Model & effort tiering.** The `(opus)`/`(sonnet)` hints above are legacy tier labels — read them as "orchestrator-tier / specialist-tier / operator-tier," and set the actual model and reasoning effort via each agent's `agents/` frontmatter (`model: inherit`) plus this guidance. The Orchestrator inherits the session model. The Verifier (Challenger + correctness lens) runs at high reasoning effort — verification is where cutting effort costs most. The Designer/Implementer (Architect) run medium-to-high. The Scrum Master is haiku-class / low effort (operational, not deliberative).

---

## Orchestration: Sequential Pipeline with Trace-Based Gating

```
SM PREFLIGHT (parallel, before Phase 1):
  Scrum Master runs DoD preflight per protocols/definition-of-done.md:
  Check ticket + ACs, extract ACs to blackboard, set ticket status.
  This runs in parallel — does not block Phase 0 or Phase 1.
  ↓
Phase 0: PARALLELIZATION ANALYSIS  (Full Engineering — Orchestrator only)
  Before spawning any agents:
  1. Write initial task decomposition to TaskList
  2. Count total tasks
  3. Identify independent tracks (no shared file writes between tracks)
  4. Apply threshold:
     - Tasks ≤ 5 or no independent tracks → single Implementer (proceed to Phase 1)
     - Tasks > 5 AND 2+ independent tracks → spawn 2 Implementers from the start
  5. Document decision in Commander's Intent "Resources" field on the blackboard
  Reference: protocols/dynamic-scaling.md §Upfront
  ↓
Phase 1: FRAME
  Human (or Orchestrator) writes Commander's Intent to blackboard
  ↓
Phase 2: DESIGN
  Designer reads target code + guidelines + reference files
  Designer writes structured change plan to blackboard
  Designer writes trace: {mission}-designer-design_complete.trace
  ↓
Phase 3: REVIEW (Full Engineering only)
  Reviewer reads change plan on blackboard
  Reviewer challenges: missed edge cases, guideline violations, scope creep
  Reviewer writes findings to blackboard under "Design Review" section
  Reviewer writes trace: {mission}-reviewer-review_complete.trace
  ↓
Phase 4: BREATHING SPACE (Full Engineering only)
  Orchestrator reads full blackboard without acting
  One reading pass — see the whole before deciding
  ↓
Phase 5: IMPLEMENT
  Implementer reads change plan (and review feedback if Full Engineering)
  Implementer works in worktree — creates/modifies files per plan
  Implementer creates test files for every new component (test gap = FAIL)
  Implementer writes trace: {mission}-implementer-implementation_complete.trace
  ↓
Phase 6: VERIFY
  Verifier reads change plan + implemented code
  Verifier writes tests if needed, runs existing test suite
  Verifier writes results to blackboard under "Verification" section
  Verifier writes trace: {mission}-verifier-tests_complete.trace
  ↓
Phase 7: HUMAN REVIEW
  Human reviews changes + test results
  If PASS → merge
  If FAIL → one retry cycle (max), then human decides
```

### Trace Dependency Chain

```
designer: design_complete
    ↓
[reviewer: review_complete]     ← Full Engineering only
    ↓
implementer: implementation_complete
    ↓
verifier: tests_complete
```

Each agent checks for its upstream trace before starting work.

---

## Blackboard Structure

Engineering Squad uses the standard blackboard template with these additional sections:

```markdown
## Change Plan
<!-- Written by Designer -->
### Files to Modify
| File | Changes | Rationale |
|------|---------|-----------|

### Changes Detail
<!-- Per-file change descriptions -->

### Out of Scope
<!-- Explicitly listing what NOT to change -->

## Design Review
<!-- Written by Reviewer — Full Engineering only -->

## Implementation Notes
<!-- Written by Implementer — deviations from plan, decisions made -->

## Verification
<!-- Written by Verifier -->
### Test Results
### Lint Results
### Guidelines Compliance Check
```

---

## Spawn Examples

### Focused Build (Claude Code)

Install the custom agent types once (`cp agents/*.md .claude/agents/`), then
spawn by type with a `name` (which makes each agent addressable via
`SendMessage`). Lens is injected in the charge, not the agent file. If task
tools (`TaskCreate`/`TaskUpdate`) are available, mirror the phases for
visibility; otherwise the trace files and the blackboard track progress.

```python
# Designer — read-only. Produces the change plan; does not implement.
# Use the built-in read-only Explore type, or the architect type constrained
# to design-only in its charge.
Agent(subagent_type="Explore", name="designer", run_in_background=True,
      prompt="""You are The Architect, Designer lens (read-only).
Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{mission}.md
Read the target files and coding guidelines, then write a structured change
plan to the "## Change Plan" section (files to modify, per-file changes,
out-of-scope, expected test files). Identify yourself as designer. Follow BLUF.
When done, append the trace file:
  {mission}-designer-design_complete.trace""")

# Implementer — Architect + operator lens. Writes code IN A WORKTREE.
Agent(subagent_type="architect", name="implementer", isolation="worktree",
      run_in_background=True,
      prompt="""You are The Architect with operator lens.
Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{mission}.md
Read the change plan, then implement all changes in your worktree. For every
NEW file, create a corresponding test file ("no tests for new code" is
merge-blocking); list them in your implementation notes. Do NOT deviate from
the plan without documenting why. Checkpoint per protocols/checkpoint.md.
When done, write the trace file.""")

# Verifier — Challenger + correctness lens. Read-only over the code + tests.
Agent(subagent_type="challenger", name="verifier", run_in_background=True,
      prompt="""You are The Challenger with correctness lens.
Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{mission}.md
1. Read the change plan and the implemented changes.
2. Every NEW file must have a test file (zero tests = FAIL, merge-blocking).
3. Run the test suite: {PROJECT_TEST_COMMAND}
   <!-- DOMAIN: replace via bootstrap/DOMAIN-INJECTION-CHECKLIST.md -->
4. Check coding-guidelines compliance; read ticket ACs from the blackboard.
5. Write an AC checklist + results to "## Verification". If a migration was
   added, run upgrade/downgrade/upgrade; if the diff touches build/deps/shared,
   run the build + health checks. Write the trace file when done.""")
```

**Cross-repo write constraint (learned).** Spawned agents cannot write files
outside the session's working directories — they can read anywhere, but a write
to another repo silently has nowhere to land. Two proven patterns handle this:
- **`isolation:"worktree"`** for a write-role working a code repo (as the
  Implementer above): the agent gets its own git worktree, an isolated copy it
  can freely modify, auto-cleaned if unchanged.
- **Agents-research / orchestrator-writes** for cross-repo work: the write-role
  agent researches and returns a change plan or diff as its findings, and the
  orchestrator (running in the session's working directories) applies it. Design
  the charge so the agent never needs to write where it cannot.

**Shutdown.** No `shutdown_request` handshake, no team teardown. A background
agent finishes, writes its final trace + blackboard entry, and sends a
completion message (carrying its farewell); the harness notifies you. Stop one
early with `TaskStop <agent-id>` after preserving partial work. Lifecycle:
`protocols/agent-shutdown.md`; farewell: `protocols/agent-farewell.md`.

**Context.** Each agent watches its own context; if depleted, it writes the
Living Baton per `protocols/return-to-sangha.md` and ends cleanly. No zone
tables in spawn prompts.

---

## Scrum Master: Scaling Monitoring

During the mission, in addition to normal SM duties, the Scrum Master monitors:

1. **Budget zones** — run `bash scripts/context-budget.sh render-all` after
   each phase transition and agent completion message.
2. **Queue imbalance** — check TaskList for any agent owning >5 pending unclaimed tasks.

When either trigger fires:
- Write a `## Scale Requests` entry to the blackboard (status: PROPOSED)
- Send a message to Orchestrator: `"Scale request filed — see ## Scale Requests"`

Full scaling rules, autonomy limits, and clone spawn template:
→ `protocols/dynamic-scaling.md`

---

## Productive Waiting

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: read the
> files listed in the Designer's Change Plan, review the blackboard
> Findings, or pre-load context for your upcoming phase. Do not sit truly
> idle — context spent reading now reduces time needed when your phase
> starts."

This applies especially to the Verifier waiting on the Implementer to complete.

---

## Failure Handling

| Phase | Likely Failures | Response |
|-------|----------------|----------|
| Design | Designer misses relevant file | L1: Designer re-reads with hint from human |
| Design | Change plan too broad (scope creep) | L2: Human narrows scope on blackboard |
| Review | Reviewer rejects design | Normal flow: Designer revises (1 cycle max) |
| Implement | Implementer deviates from plan | L2: Bell event, human reviews deviation |
| Implement | Code won't compile/import | L1: Retry with error context |
| Verify | Tests fail | Normal flow: Report to human for decision |
| Verify | Tests pass but guidelines violated | L2: Document specific violations |

**Max retry cycles:** 1. If the retry also fails, escalate per escalation-rules.md (Tier 3a if reversible, Tier 3b if irreversible).

---

## Decision Protocol

- **Focused Build:** Human makes all decisions. No quorum needed — human authority is sufficient.
- **Full Engineering:** Orchestrator manages pipeline. Design disputes: Tier 2 (Orchestrator decides). Unresolved: Tier 3a (Claude). Implementation disputes: Tier 3a (Claude decides for reversible changes) or Tier 3b (human decides for irreversible changes).

---

## Persona Lens Injection

The Engineering Squad reuses existing personas with **lens injection** — a single differentiation axis in the spawn prompt:

| Role | Base Persona | Lens | Effect |
|------|-------------|------|--------|
| Designer | Architect | (none) | Pure design thinking — simplest viable approach, acceptance criteria, dependencies |
| Implementer | Architect | `operator` | Execution focus — pragmatic implementation, minimal deviation from plan |
| Reviewer | Challenger | (none) | Full adversarial review — edge cases, alternatives, Stop Signals |
| Verifier | Challenger | `correctness` | Verification focus — tests pass, guidelines met, plan followed |

Lens injection is done in the spawn prompt, not in the persona file:
```
"You are The Architect with operator lens — your focus is pragmatic execution
of the change plan. Implement exactly what was designed, documenting any
necessary deviations. Prefer the simplest correct implementation."
```

---

## Codified Patterns

### Plan-Driven Zero-Deviation
*(Crystallized from 3 missions: kan229, lassonde-classification, kan242-ux-audit)*

When the Designer produces a detailed change plan (function signatures, pseudocode,
test cases, scope boundaries), the Implementer should execute it with zero deviations.
Invest in the design phase — it pays for itself by making implementation mechanical
and verification straightforward. The plan sets a floor, not a ceiling: the
Implementer may add edge case tests but should not deviate from the specified approach.

See: `memory/patterns/plan-driven-zero-deviation.md`

### Review Phase Value
*(Crystallized from 3 missions: kan229, lassonde-classification, kan242-ux-audit)*

Always include a Review phase (Verifier agent) for changes that affect:
- User-visible output
- Exception-raising or error-handling paths
- Core business logic (scoring, financial data)

Skip Review only for purely cosmetic WARN-level changes with no external visibility.
Reviewer findings are cheapest before merge — this pattern holds across Python,
scoring, and UX domains.

See: `memory/patterns/review-phase-value.md`

### Test Gap as First-Class Finding
*(Crystallized from 3 missions: kan-263-hexgeo, kan-265-hexreview, kan-185-assaygrid)*

When the Verifier finds zero test coverage for a newly created component (a file
that did not exist before this mission), classify it as **FAIL** severity —
merge-blocking, same as a bug. Test gaps are not warnings; they block merge.

The Designer's change plan must list expected test files in the "Files to Modify"
table alongside implementation files. The Implementer must create test files for
every new component. "No tests for new code" is never acceptable as a soft finding.

See: `memory/patterns/test-gap-as-first-class-finding.md`

---

## Definition of Done

This squad follows `protocols/definition-of-done.md`.
Default level: `mission-complete` (override in Commander's Intent).

The Scrum Master runs the Preflight checklist before Phase 1 (FRAME).
The Verifier runs the Verification checklist during Phase 6 (VERIFY).
The Scrum Master runs the Cleanup checklist after the mission retrospective.

---

## Design Notes

- **Focused Build is the default.** Only escalate to Full Engineering when the terrain demands it. "Start with 3, prove you need more."
- **Designer is read-only.** This prevents the temptation to "just quickly fix it" instead of writing a plan. Separation of design and implementation is the point.
- **One retry cycle max.** Infinite loops are the enemy of forward progress. If one retry doesn't fix it, the problem is harder than expected — escalate per escalation-rules.md (Tier 3a or 3b).
- **No new personas.** Architect with operator lens is still The Architect. Challenger with correctness lens is still The Challenger. Lens injection differentiates without proliferating.
- **Design jam → /wander (rare, gated).** This squad is for *known* requirements (low–medium uncertainty), so a genuine divergent-design jam in Phase 2 (DESIGN) is the exception, not the rule. But if the Designer finds the approach genuinely won't crystallize — the change plan keeps collapsing to one unsatisfying shape and the obvious framing has been worked — that is a divergent-design jam: invoke `/wander` (`~/.claude/skills/wander/SKILL.md`) before writing the plan, to reach an approach the nearest pattern-match won't surface. Do NOT wander a design you can reach by normal reasoning — that is the cargo-cult failure mode (token-waste). The gate is "stuck," never "by default."
