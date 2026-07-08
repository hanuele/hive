# Research Squad Template

> **Mission type:** Deep investigation and knowledge synthesis
> **When:** High uncertainty — the team needs to learn before it can act

## Upfront Parallelization

Before spawning agents, Orchestrator should assess task volume:

> "For research missions with >4 independent investigation threads, consider
> spawning 2 Investigators from the start. See `protocols/dynamic-scaling.md §Upfront`."

Independent threads = investigation domains that do not rely on each other's
findings to proceed (e.g., regulatory analysis vs. financial data).

---

## Composition

**Size:** 3-4 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Orchestrator** (historically: Facilitator) | Orchestrator | Orchestrator (opus) | Frames question, writes intent, synthesizes findings |
| **Researcher A** | Investigator | Specialist (sonnet) | Data gathering, source triangulation |
| **Researcher B** | Investigator (contrarian lens) | Specialist (sonnet) | Alternative hypotheses, assumption checking |
| **Critic** (optional) | Challenger | Specialist | Adversarial review before synthesis |
| **Scrum Master** (required) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol, DoD preflight/cleanup (`protocols/definition-of-done.md`), operational fixes (parallel) |

**Model & effort tiering.** The `(opus)`/`(sonnet)` hints above are legacy tier labels — read them as "orchestrator-tier / specialist-tier," and set the actual model and reasoning effort via the guidance here plus each agent's `agents/` frontmatter (`model: inherit`). The Orchestrator inherits the session model. Investigators run at high reasoning effort (source triangulation and the confirmation-skepticism hook reward deeper thinking); the Critic/Challenger high. The Scrum Master is haiku-class / low effort — it is operational, not deliberative.

## Orchestration Pattern

```
0. SM PREFLIGHT (parallel, before step 1):
   Scrum Master runs DoD preflight per protocols/definition-of-done.md:
   Check ticket + ACs, extract ACs to blackboard, set ticket status.
   This runs in parallel — does not block step 1.
   ↓
1. Orchestrator writes Commander's Intent + Mission Gatha to blackboard
   (see protocols/commanders-intent.md)

2. Challenger reviews premises (Premise Challenge step)
   If framing is unsound → Orchestrator reframes before squad acts

3. Fan-out: Researchers work in parallel, independently
   - Each reads the blackboard for intent and constraints
   - Each writes findings with attribution, confidence, source
   - No reading of peer findings during fan-out

4. --- BREATHING SPACE ---
   Orchestrator reads the full blackboard without acting.
   Not to decide, not to synthesize, but simply to see the whole.
   One reading pass with no output required.
   (see protocols/breathing-space.md)

5. Fan-in: Synthesis via blackboard
   Orchestrator synthesizes using protocols/synthesis-template.md

6. Knowledge Crystallization
   Run protocols/crystallization.md (Steps 1-2.5)
   Write retrospective to memory/archive/retrospectives/
```

## Definition of Done

This squad follows `protocols/definition-of-done.md`.
Default level: `mission-complete` (override in Commander's Intent).

The Scrum Master runs the Preflight checklist before Phase 1 (FRAME).
The Orchestrator verifies ACs against research findings during Synthesis (step 5).
The Scrum Master runs the Cleanup checklist after the mission retrospective.

---

## Codified Patterns

### Challenger/Contrarian Value (4 missions, CODIFIED 2026-03-05)
Always include a contrarian/challenger lens in research squads — it produces the
most actionable, non-obvious insights. Researcher B should be explicitly
differentiated with a contrarian heuristic (see `differentiation/` docs).
In planning squads, the Challenger should explicitly challenge pipeline ORDER,
not just content.

### Convergent Findings as Quality Signal (3 missions, CODIFIED 2026-03-05)
When two investigators independently reach the same conclusion from different
angles (without reading each other's findings during fan-out), the convergent
finding should be weighted as **high-confidence** in synthesis. The Orchestrator
must explicitly track and highlight convergence in the synthesis output —
noting which findings converged and which were unique to one investigator.

### Premise Falsification as Research Deliverable (3 missions, CODIFIED 2026-03-05)
When a data or architectural check definitively proves a stated premise false,
elevate this finding to **primary status** in synthesis — a falsified premise
overrides all downstream analysis that assumed it true. The Orchestrator must
flag falsified premises before presenting other findings, and note which
conclusions are invalidated as a consequence.

### Blind Divergence Protocol (3 missions, CODIFIED 2026-03-05)
In fan-out phases, investigators must NOT read each other's output before
submitting their findings. The convergence signal requires genuine independence.
Post-submission, the Challenger (if present) reads all findings; synthesis follows.
This is already enforced by the Productive Waiting exception but is now a
first-class codified rule: **blind divergence is non-negotiable for fan-out**.

### Lateral Fan-out (/wander far-domain variant), gated — 1 session, encouraging not proven
The Blind Divergence Protocol + Convergent Findings rules above are the *generic*
form: Investigators diverge via depth/breadth/contrarian heuristics over the
problem's home domain. When the fan-out can't surface a *non-obvious alternative
frame* — every investigator keeps returning the same near-domain hypothesis — switch
them to a far-domain procedure: each blind Investigator names a domain-neutral skeleton
and transposes an *executable* move from ≥4 surface-FAR domains. If a `/wander` skill is
available in your environment, use it; otherwise drive the same reach by hand with the
lateral heuristics in `differentiation/search-heuristics.md`. Convergence by *different
far domains* is the stronger signal. This is **gated** on the stuck-on-the-obvious-frame
jam, not a default — and it rests on one worked example, so treat it as encouraging, not
yet codified at the 3-mission bar the rules above clear.

### Component Extraction as Deliverable (3 missions, CODIFIED 2026-03-05)
Research outputs should decompose findings into named, independently-actionable
components with effort estimates where applicable. This enables downstream
Engineering squads to populate their briefs without re-analyzing the research
output. The synthesis section should include a **## Components** table listing
each component, its scope, estimated effort, and dependencies.

## Decision Protocol

**Quorum sensing.** Finding is confirmed when 2+ independent agents converge. Orchestrator synthesizes but domain expert outweighs generalist. **Convergent findings** (same conclusion reached independently by 2+ agents) are weighted as high-confidence — explicitly highlight these in synthesis output.

See `constitutions/commitment-threshold.md` for quorum rules.

## Time-Box (Default)

- **Fan-out phase:** 1 deliberation round per agent
- **Breathing Space:** 1 reading pass
- **Fan-in phase:** 1 synthesis pass
- If convergence not reached, Orchestrator issues a CONTESTED finding with all positions documented
- **Total:** Bounded by 2 rounds, not unlimited

## Disagreement Protocol

If two rounds of structured debate produce no convergence, the Orchestrator does not add a third round. The Orchestrator either:
- **(a)** Reframes the question to find a solution space neither position occupies, or
- **(b)** Escalates per escalation-rules.md (Tier 3a if reversible, Tier 3b if irreversible) with both positions documented in SBAR format

## Productive Waiting

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: read the
> blackboard Findings, review the Commander's Intent constraints, or
> pre-load context for your upcoming phase. Do not sit truly idle — context
> spent reading now reduces time needed when your phase starts."

**Exception:** During the fan-out phase, Investigators must NOT read peer
findings — that constraint overrides the productive waiting guideline.

## Deep Dive Option

After the initial parallel research phase, the Orchestrator may allow one agent to go deep on the most promising or most puzzling finding, while others continue breadth. The Orchestrator decides when depth is warranted based on the nature of the finding and the mission's remaining time budget.

## Commander's Intent Example

*"We need to understand X because we're about to build Y. Boundaries: focus on Z, ignore W. Success: a clear recommendation with evidence, or an explicit 'we don't know enough yet.'"*

## Cloning Differentiation

When using 2+ Investigators, differentiate via spawn prompt:

| Clone | Heuristic | Reference Material |
|-------|-----------|-------------------|
| Investigator-alpha | Depth-first | Primary domain docs |
| Investigator-beta | Breadth-first | Cross-domain references |
| Investigator-gamma | Contrarian | Known failure cases |

## Spawn Example (Claude Code)

Install the custom agent types once (`cp agents/*.md .claude/agents/`), then
spawn by type. Give each agent a `name` — it makes the running agent
addressable via `SendMessage({to: "<name>", ...})`, and the name keeps working
after the agent completes (a send resumes it). The persona lives in the agent
definition now, so the charge is just mission + blackboard path + assigned lens.

If task tools (`TaskCreate`/`TaskUpdate`) are available in this session, mirror
the phases as tasks for visibility; otherwise track phases on the blackboard —
neither is required for the squad to run.

```python
# Two blind investigators, differentiated by lens in the charge (not the agent file).
Agent(subagent_type="investigator", name="investigator-alpha",
      run_in_background=True,
      prompt="""Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{topic}.md
Your lens: depth-first over the primary domain docs.
Read the blackboard first. Identify yourself as investigator-alpha in every
entry. Write findings + checkpoint per your agent definition. During fan-out,
do NOT read peer findings before submitting your own.""")

Agent(subagent_type="investigator", name="investigator-beta",
      run_in_background=True,
      prompt="""Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{topic}.md
Your lens: breadth-first / contrarian across cross-domain references and known
failure cases. Read the blackboard first. Identify yourself as investigator-beta.
Blind fan-out: do NOT read peer findings before submitting your own.""")

# Scrum Master — runs in parallel with all phases, not in the trace chain.
Agent(subagent_type="scrum-master", name="scrum-master",
      run_in_background=True,
      prompt="""Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{topic}.md
Run DoD preflight (protocols/definition-of-done.md), monitor for failures during
the mission, then own post-mission crystallization + cleanup per your agent
definition. Write ONLY to ## Operational Status.""")
```

**Shutdown.** No `shutdown_request` handshake and no team teardown. A background
agent finishes its charge, writes its final blackboard entry, and sends a
completion message (carrying its farewell) — the harness notifies you
automatically. To stop one early, use `TaskStop <agent-id>` after preserving any
partial work. Full lifecycle: `protocols/agent-shutdown.md`; the "Rest well"
close: `protocols/agent-farewell.md`.

**Context.** Each agent watches its own context; if depleted, it writes the
Living Baton to the blackboard per `protocols/return-to-sangha.md` and ends
cleanly. No zone tables in spawn prompts.
