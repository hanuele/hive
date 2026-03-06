# Strategy Squad

> **Mission type:** Strategic decision-making through scenario planning
> **When:** The team faces a **strategic question** with multiple possible futures — the goal is to identify robust actions that work across scenarios, not to predict the future

## Terrain Profile

| Axis | Range |
|------|-------|
| Uncertainty | High (strategic decisions involve unknowable futures) |
| Reversibility | Mixed (strategy may commit resources or set direction) |
| Breadth | Broad (strategy crosses multiple domains and time horizons) |
| Stakes | Medium to High (strategic choices shape long-term outcomes) |

---

## Composition

**Size:** 4-6 agents (scales with scenario count)

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Facilitator** | Orchestrator | Orchestrator (opus) | Frames strategic question, identifies key uncertainties, synthesizes robust actions |
| **Scenario Builder A** | Investigator | Specialist (sonnet) | Builds and defends one scenario (owns it end-to-end) |
| **Scenario Builder B** | Investigator | Specialist (sonnet) | Builds and defends another scenario |
| **Scenario Builder C** (optional) | Investigator | Specialist (sonnet) | Third scenario (for 3+ uncertainty axes) |
| **Stress Tester** | Challenger | Specialist (sonnet) | Attacks each scenario for consistency, blind spots, hidden assumptions |
| **Response Designer** | Architect | Specialist (sonnet) | Designs response strategies per scenario (what would we do if...) |
| **Scrum Master** (required) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol (update `memory/active/pattern-tracker.md`), DoD preflight/cleanup (`protocols/definition-of-done.md`), operational fixes (parallel) |

### Scaling by Scenario Count

The number of Scenario Builders matches the scenario count (flexible 2-4):

| Key Uncertainties | Scenarios | Scenario Builders |
|-------------------|-----------|-------------------|
| 1 axis (binary) | 2 | 2 Investigators |
| 1 axis (spectrum) | 3 | 3 Investigators |
| 2 axes (2x2 matrix) | 4 | 4 Investigators (may need human approval per dynamic-scaling.md) |

Orchestrator decides scenario count based on the number and nature of key uncertainties.

---

## Orchestration Pattern: Scenario Planning

```
SM PREFLIGHT (parallel, before Phase 1):
  Scrum Master runs DoD preflight per protocols/definition-of-done.md:
  Check ticket + ACs, extract ACs to blackboard, set ticket status.
  This runs in parallel — does not block Phase 1.
  ↓
Phase 1: FRAME
  Orchestrator writes strategic brief to blackboard:
  - Strategic question (what decision are we trying to inform?)
  - Key uncertainties (2-3 factors whose outcomes we cannot predict)
  - Decision horizon (when must we act?)
  - Current assumptions (what we believe today)
  - Constraints (non-negotiable boundaries)
  (see protocols/commanders-intent.md — adapted as Strategic Brief)

Phase 2: SCENARIO GENERATION (parallel)
  Each Scenario Builder constructs a distinct, internally consistent scenario:
  - Name and narrative (a plausible story of how the future unfolds)
  - Key assumptions (what must be true for this scenario to occur)
  - Leading indicators (early signals that this scenario is materializing)
  - Implications (what this means for our strategic question)
  Each writes to their assigned blackboard section
  Writes trace: {mission}-scenario-{name}-scenario_complete.trace

Phase 3: STRESS-TEST
  Challenger attacks each scenario (sequentially, reading all):
  - Internal consistency: Do the assumptions hold together?
  - Blind spots: What has this scenario ignored?
  - Hidden assumptions: What is implicitly assumed but not stated?
  - Probability assessment: How plausible is this scenario?
  Writes findings per scenario to blackboard
  Writes trace: {mission}-stress-tester-stress_test_complete.trace

Phase 4: BREATHING SPACE
  Orchestrator reads all scenarios and stress-test findings without acting.
  One reading pass. See the full landscape of possibilities.
  (see protocols/breathing-space.md)

Phase 5: OPTION EVALUATION
  Architect designs response strategies:
  - Per-scenario responses (what would we do if scenario X materializes?)
  - Robust actions (work well across multiple or all scenarios)
  - Contingent actions (triggered by specific leading indicators)
  - No-regret moves (valuable regardless of which scenario unfolds)
  Writes to blackboard under Response Strategies section
  Writes trace: {mission}-response-designer-options_complete.trace

Phase 6: SYNTHESIZE
  Orchestrator writes strategic recommendation:
  - BLUF: recommended course of action
  - Robust actions (do these now)
  - Contingent actions (do these if X happens)
  - Monitoring plan (which leading indicators to watch)
  - Reversibility assessment per action
  Uses protocols/synthesis-template.md — adapted for strategic output

Phase 7: CRYSTALLIZATION
  Run protocols/crystallization.md (Steps 1-2.5)
  Write retrospective to memory/archive/retrospectives/
```

### Trace Dependency Chain

```
scenario-alpha: scenario_complete
scenario-beta: scenario_complete
scenario-gamma: scenario_complete  (if present)
    |  (all must complete before STRESS-TEST)
    v
stress-tester: stress_test_complete
    |
    v
response-designer: options_complete
    |
    v
orchestrator: synthesis_complete
```

---

## Differentiation

Scenario Builders (Investigators) are differentiated by **scenario ownership**, not by search heuristic. Each builder owns one scenario end-to-end.

| Clone | Scenario Type | Heuristic Tendency |
|-------|--------------|-------------------|
| Scenario-alpha | Base/most-likely | Depth-first (evidence-weighted) |
| Scenario-beta | Optimistic/opportunity | Breadth-first (finds upsides) |
| Scenario-gamma | Pessimistic/risk | Contrarian (finds threats) |
| Scenario-delta | Wildcard/black-swan | Analogical (imports from other domains) |

---

## Blackboard Structure

```markdown
## Commander's Intent (Strategic Brief)
<\!-- Strategic question, key uncertainties, decision horizon, constraints -->

## Scenario: [Alpha Name]
<\!-- ONLY scenario-alpha writes here -->
### Narrative
### Key Assumptions
### Leading Indicators
### Implications

## Scenario: [Beta Name]
<\!-- ONLY scenario-beta writes here -->
### Narrative
### Key Assumptions
### Leading Indicators
### Implications

## Scenario: [Gamma Name]
<\!-- ONLY scenario-gamma writes here (if present) -->

## Stress Test
<\!-- Written by Challenger after all scenarios submitted -->
### Per-Scenario Assessment
### Cross-Scenario Blind Spots

## Response Strategies
<\!-- Written by Architect -->
### Per-Scenario Responses
### Robust Actions (work across scenarios)
### Contingent Actions (triggered by indicators)
### No-Regret Moves

## Strategic Recommendation
<\!-- Written by Orchestrator -->
```

---

## Decision Protocol

**Robustness over prediction.** The goal is not to pick the "right" scenario but to find actions that work across multiple scenarios. An action that is good in 3 of 4 scenarios is more valuable than one that is optimal in 1.

Quorum sensing applies to leading indicators: if 2+ scenario builders independently identify the same signal as important, it gets priority in the monitoring plan.

See `constitutions/commitment-threshold.md` for general quorum rules.

---

## Time-Box (Default)

- **Scenario generation:** 1 round per builder
- **Stress-test:** 1 evaluation pass across all scenarios
- **Response design:** 1 round
- **Breathing Space:** 1 reading pass (before synthesis)
- **Total:** Bounded by 3-4 rounds, not unlimited

---

## Productive Waiting

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: read the
> strategic brief, review relevant historical decisions in retrospectives,
> or pre-load context for your upcoming phase. Do not sit truly idle."

Scenario Builders may read each other during generation (unlike Research/Creative) since scenarios should cover different territory, and awareness of what others are building helps avoid overlap. This is a deliberate departure from the blind protocol.

---

## Failure Handling

| Phase | Likely Failures | Response |
|-------|----------------|----------|
| Frame | Strategic question too broad or too narrow | L1: Orchestrator refines with human input |
| Scenario | Two scenarios overlap significantly | L2: Orchestrator reassigns one builder to a more distinct scenario |
| Scenario | Scenario is internally inconsistent | Normal flow: Stress Tester flags, builder revises (1 cycle) |
| Stress-test | Challenger finds fatal flaw in all scenarios | L2: Orchestrator reframes the uncertainty axes |
| Response | Architect designs responses that only work for one scenario | L1: Re-prompt to focus on robust actions |
| Synthesis | No robust actions found | Escalate per escalation-rules.md (Tier 3b for irreversible strategy) |

**Max retry cycles:** 1 per phase. If the retry fails, escalate.

---

## Definition of Done

This squad follows `protocols/definition-of-done.md`.
Default level: `mission-complete` (override in Commander's Intent).

The Scrum Master runs the Preflight checklist before Phase 1 (FRAME).
The Facilitator verifies ACs against strategic recommendation during Phase 6 (SYNTHESIZE).
The Scrum Master runs the Cleanup checklist after the mission retrospective.

---

## Design Notes

- **Not blind.** Unlike Research and Creative squads, Strategy Squad scenario builders can see each other during generation. Overlap is worse than anchoring in scenario planning.
- **The Architect role is critical.** Without response design, scenario planning is just storytelling. The Architect translates scenarios into actionable strategies.
- **Flexible scenario count.** The Orchestrator decides 2-4 based on uncertainty structure. Do not force a fixed number.
- **Robust actions are the key output.** If the synthesis only has per-scenario actions and no robust ones, the mission has partially failed.
- **Leading indicators are the second key output.** They turn static scenarios into a dynamic monitoring system.
- **Premise Falsification overrides downstream analysis (CODIFIED 2026-03-05).** When a no-regret move or stress test definitively falsifies a premise, that finding takes primary status — all conclusions built on the false premise are invalidated.
- **Component Extraction as Deliverable (CODIFIED 2026-03-05).** Response strategies should decompose into named, independently-actionable components with effort estimates. Include a Components table in the synthesis so Engineering squads can populate briefs directly.
