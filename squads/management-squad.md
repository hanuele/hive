# Management Squad

> **Mission type:** Multi-mission coordination and strategic project decomposition
> **When:** A task is **too large for a single squad** — it requires sequential or parallel squads, cross-squad handoffs, or initiative-level planning

## Terrain Profile

| Axis | Range |
|------|-------|
| Uncertainty | Medium (scope is known but execution path needs planning) |
| Reversibility | Mixed (management decisions about squad sequencing are reversible; resource commitments less so) |
| Breadth | Very Broad (cross-squad, cross-domain by definition) |
| Stakes | Medium to High (management errors cascade across all downstream squads) |

---

## Variants

### Focused Planning (Default)

**When:** Initiative needs decomposition and sequencing, but **human will launch squads** one at a time. Plan only — no runtime orchestration.

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Facilitator** | Orchestrator | Orchestrator (opus) | Frames initiative, synthesizes execution plan |
| **Decomposer** | Architect | Specialist (sonnet) | Breaks initiative into squad-sized missions, maps dependencies |
| **Risk Reviewer** | Challenger | Specialist (sonnet) | Identifies cross-mission risks, resource bottlenecks, irreversibility points |
| **Scrum Master** (required) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol (update `memory/active/pattern-tracker.md`), DoD preflight/cleanup (`protocols/definition-of-done.md`), operational fixes (parallel) |

**Key:** 3 agents + SM. Produces a plan document. Human executes. Cost-effective for most multi-squad needs.

### Full Orchestration

**When:** Initiative is complex enough that **runtime coordination between squads** adds value — handoffs are non-trivial, timing matters, or the initiative is too large to keep in one human's head.

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Meta-Orchestrator** | Orchestrator | Orchestrator (opus) | Plans, sequences, spawns sub-squads, manages handoffs, integrates outputs |
| **Decomposer** | Architect | Specialist (sonnet) | Breaks initiative into missions, designs handoff contracts |
| **Monitor** | Challenger (monitoring lens) | Specialist (sonnet) | Watches for budget escalations, blocked dependencies, scope drift, conflicts |
| **Scrum Master** (required) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol (update `memory/active/pattern-tracker.md`), DoD preflight/cleanup (`protocols/definition-of-done.md`), operational fixes (parallel) |

**Key:** 3 agents + SM plus sub-squads spawned at runtime. Expensive but powerful for large initiatives. The Meta-Orchestrator is one level above individual squad Orchestrators.

**Escalation path:** Start with Focused Planning. Only escalate to Full Orchestration when the human finds manual squad launching is becoming the bottleneck. "Prove you need the complexity."

---

## Orchestration Pattern: Focused Planning

```
SM PREFLIGHT (parallel, before Phase 1):
  Scrum Master runs DoD preflight per protocols/definition-of-done.md:
  Check ticket + ACs, extract ACs to blackboard, set ticket status.
  This runs in parallel — does not block Phase 1.
  ↓
Phase 1: FRAME
  Orchestrator writes initiative brief to blackboard:
  - Initiative goal (what the combined squads should achieve)
  - Scope (what is included, what is explicitly excluded)
  - Known constraints (time, resources, dependencies on external work)
  - Success criteria (how we know the initiative is done)
  (see protocols/commanders-intent.md — adapted as Initiative Brief)

Phase 2: DECOMPOSE
  Architect breaks the initiative into squad-sized missions:
  - Each mission gets a terrain assessment (4 axes)
  - Each mission gets a recommended squad type
  - Dependencies between missions are mapped
  - Handoff contracts: what output from mission A becomes input for mission B
  Writes trace: {mission}-decomposer-decomposition_complete.trace

Phase 3: SEQUENCE
  Architect designs the execution plan:
  - Critical path (which missions must be sequential)
  - Parallel tracks (which missions can run simultaneously)
  - Go/no-go criteria between phases
  - Resource requirements per mission (agent count, model tier)
  Writes to blackboard under Execution Plan section

Phase 4: RISK REVIEW
  Challenger reviews the full plan:
  - Cross-mission dependencies: are they correctly identified?
  - Resource bottlenecks: do parallel tracks compete for the same files?
  - Irreversibility points: where do we cross points of no return?
  - Knowledge gaps: should we run Research before Engineering?
  Writes findings to blackboard under Risk Assessment section
  Writes trace: {mission}-risk-reviewer-review_complete.trace

Phase 5: BREATHING SPACE
  Orchestrator reads the full blackboard without acting.
  (see protocols/breathing-space.md)

Phase 6: SYNTHESIZE
  Orchestrator writes the final execution plan:
  - Ordered list of missions with squad types
  - Dependency graph
  - Handoff contracts between missions
  - Risk mitigations
  - Monitoring triggers (when to reassess the plan)

Phase 7: CRYSTALLIZATION
  Run protocols/crystallization.md (Steps 1-2.5)
  Write retrospective to memory/archive/retrospectives/
```

## Orchestration Pattern: Full Orchestration

```
SM PREFLIGHT (parallel, before Phase 1):
  (same as Focused Planning — SM runs DoD preflight)
  ↓
Phase 1: FRAME
  Meta-Orchestrator writes initiative brief to blackboard
  (same as Focused Planning Phase 1)

Phase 2: DECOMPOSE
  Architect breaks initiative into squad-sized missions
  (same as Focused Planning Phase 2)
  ADDITIONALLY: Architect designs handoff contracts between missions:
  - What artifact does mission A produce?
  - What does mission B expect as input?
  - What format? (blackboard section, file, TaskList state)
  Writes trace: {mission}-decomposer-decomposition_complete.trace

Phase 3: SEQUENCE
  Architect designs execution plan with spawn timing:
  - Which squads launch immediately (parallel tracks)
  - Which squads launch after a dependency completes
  - Go/no-go gates between phases
  - Budget estimates per sub-squad

Phase 4: RISK REVIEW
  Challenger reviews the full plan
  (same scope as Focused Planning Phase 4)
  ADDITIONALLY: Reviews handoff contracts for ambiguity
  Writes trace: {mission}-monitor-review_complete.trace

Phase 5: BREATHING SPACE
  Meta-Orchestrator reads the full blackboard without acting.
  (see protocols/breathing-space.md)

Phase 6: EXECUTE
  Meta-Orchestrator spawns sub-squads per the execution plan:
  - Each sub-squad gets its own blackboard
  - Each sub-squad gets a Commander's Intent derived from the initiative brief
  - Meta-Orchestrator monitors sub-squad completion via trace files
  - On sub-squad completion: reads output, checks handoff contract, spawns next
  - Monitor (Challenger) watches for: budget escalation, blocked dependencies,
    scope drift, cross-squad conflicts
  - If Monitor raises an alarm — Meta-Orchestrator pauses to assess

Phase 7: INTEGRATE
  Meta-Orchestrator synthesizes across all sub-squad outputs:
  - Did each squad deliver its handoff contract?
  - Are there gaps or contradictions between squad outputs?
  - Final integration report to initiative blackboard

Phase 8: CRYSTALLIZATION
  Run protocols/crystallization.md (Steps 1-2.5)
  Write retrospective to memory/archive/retrospectives/
  ADDITIONALLY: Capture cross-squad coordination patterns for future initiatives
```
---

## Trace Dependency Chains

### Focused Planning

```
decomposer: decomposition_complete
    ↓
risk-reviewer: review_complete
    ↓
orchestrator: plan_synthesized
```

### Full Orchestration

```
decomposer: decomposition_complete
    ↓
monitor: review_complete
    ↓
orchestrator: execution_started
    ↓
[sub-squad traces — per sub-squad's own trace chain]
    ↓
orchestrator: integration_complete
```

---

## Blackboard Structure

Management Squad uses the standard blackboard template with these additional sections:

```markdown
## Initiative Brief
<\!-- Written by Orchestrator — adapted Commander's Intent for initiatives -->
### Goal
### Scope (In / Out)
### Success Criteria
### Known Constraints

## Mission Decomposition
<\!-- Written by Decomposer -->
| Mission | Squad Type | Terrain | Dependencies | Status |
|---------|-----------|---------|-------------|--------|

### Handoff Contracts
<\!-- Per mission-pair: what artifact flows between them -->

## Execution Plan
<\!-- Written by Decomposer, refined by Orchestrator -->
### Critical Path
### Parallel Tracks
### Go/No-Go Gates
### Resource Estimates

## Risk Assessment
<\!-- Written by Challenger -->

## Execution Status (Full Orchestration only)
<\!-- Updated by Meta-Orchestrator during execution -->
| Mission | Squad | Status | Output | Handoff |
|---------|-------|--------|--------|---------|

## Integration Report (Full Orchestration only)
<\!-- Written by Meta-Orchestrator after all squads complete -->
```
---

## Decision Protocol

- **Focused Planning:** Orchestrator synthesizes. Decomposer has domain authority on mission sizing. Challenger has authority on risk flags. Unresolved: Tier 3a (Claude).
- **Full Orchestration:** Meta-Orchestrator has final authority on squad sequencing and resource allocation. Sub-squads follow their own squad's decision protocol internally. Cross-squad conflicts: Tier 3a (Claude) for reversible, Tier 3b (human) for irreversible.

## Time-Box (Default)

### Focused Planning
- **Decompose + Sequence:** 1 round
- **Risk Review:** 1 round
- **Breathing Space:** 1 reading pass
- **Synthesis:** 1 pass
- **Total:** 4 rounds (bounded, not open-ended)

### Full Orchestration
- **Planning phases:** Same as Focused Planning (4 rounds)
- **Execution phase:** Bounded by sub-squad time-boxes
- **Integration:** 1 pass after all sub-squads complete
- **Monitor check-ins:** After each sub-squad completion

---

## Productive Waiting

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: review the
> initiative brief constraints, read relevant codebase areas for upcoming
> missions, or pre-load context for your phase. Do not sit truly idle —
> context spent reading now reduces time needed when your phase starts."

**Decomposer** can pre-read codebase during FRAME. **Monitor** can pre-read error catalog during planning phases.

---

## Failure Handling

| Phase | Likely Failures | Response |
|-------|----------------|----------|
| Decompose | Missions too large or too small | L1: Orchestrator asks Decomposer to re-split with size hints |
| Decompose | Missing dependencies between missions | L2: Challenger catches in Risk Review |
| Risk Review | Challenger rejects plan as too risky | Normal flow: Decomposer revises (1 cycle max) |
| Execute (Full) | Sub-squad fails or stalls | L2: Monitor alerts Meta-Orchestrator, who pauses and reassesses |
| Execute (Full) | Handoff contract violated (output doesn't match spec) | L2: Meta-Orchestrator mediates; may re-run producing squad |
| Execute (Full) | Budget escalation across multiple sub-squads | L3a: Meta-Orchestrator decides to trim scope or serialize parallel tracks |
| Integrate | Outputs from sub-squads contradict | L3a: Meta-Orchestrator synthesizes with documented disagreement |

**Max retry cycles:** 1 per phase. If retry fails, escalate per escalation-rules.md.

---

## Definition of Done

This squad follows `protocols/definition-of-done.md`.
Default level: `mission-complete` (override in Commander's Intent).

The Scrum Master runs the Preflight checklist before Phase 1 (FRAME).
The Facilitator verifies ACs against the execution plan during Phase 6 (SYNTHESIZE).
The Scrum Master runs the Cleanup checklist after the mission retrospective.

---

## Design Notes

- **Focused Planning is the default.** Most multi-squad initiatives benefit more from a good plan than from runtime orchestration. "A good plan executed by a human is cheaper than an autonomous meta-orchestrator."
- **Full Orchestration is expensive.** The Meta-Orchestrator consumes opus-tier context for the duration of all sub-squads. Only use when the human would otherwise become the bottleneck.
- **Handoff contracts are the key abstraction.** The Management Squad's unique contribution is formalizing what flows between squads. Without explicit contracts, handoffs break silently.
- **The Monitor is not a Scrum Master.** The Monitor (Challenger with monitoring lens) watches for strategic risks — budget escalation, blocked dependencies, scope drift. The Scrum Master handles operational concerns — Jira, error catalog, crystallization. Both can coexist.
- **No new personas needed.** Orchestrator manages. Architect decomposes. Challenger reviews. Scrum Master operates. The Management Squad composes existing personas at a higher abstraction level — it manages squads instead of agents.
- **Recursive composition is bounded.** A Management Squad can spawn sub-squads, but sub-squads cannot spawn their own Management Squads. Maximum nesting depth: 2 (initiative → mission → task). This prevents unbounded agent proliferation.
- **The Decomposer is an Architect, not a Manager.** Decomposition is a design skill — breaking a problem into well-sized pieces with clean interfaces. The Architect persona is the right fit because it thinks in terms of structure, dependencies, and simplicity.