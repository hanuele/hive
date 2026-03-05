# Creative Squad

> **Mission type:** Divergent ideation + convergent selection
> **When:** The team needs to **generate novel solutions** — existing approaches are insufficient, the problem space is open-ended, or innovation is the explicit goal

## Terrain Profile

| Axis | Range |
|------|-------|
| Uncertainty | Medium to High (open-ended problem space) |
| Reversibility | Reversible (ideas are cheap to discard) |
| Breadth | Any (creative work can be narrow or broad) |
| Stakes | Low to Medium (ideation phase, not implementation) |

---

## Composition

**Size:** 4-5 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Facilitator** | Orchestrator | Orchestrator (opus) | Writes creative brief, selects top ideas, synthesizes final output |
| **Ideator A** | Innovator | Specialist (sonnet) | Independent idea generation (diverge phase) |
| **Ideator B** | Innovator (different heuristic) | Specialist (sonnet) | Independent idea generation from different angle |
| **Evaluator** | Challenger | Specialist (sonnet) | Ranks ideas against criteria, stress-tests selected ideas |
| **Scrum Master** (recommended) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol (update `memory/active/pattern-tracker.md`), operational fixes (parallel) |

Optional: A third Ideator (Innovator with contrarian or analogical heuristic) for maximum divergence.

## Orchestration Pattern: Hybrid (Diamond + Iteration)

```
Phase 1: FRAME
  Orchestrator writes creative brief to blackboard:
  - Problem statement (what we're solving)
  - Constraints (what solutions must satisfy)
  - Success criteria (how we evaluate ideas)
  - Anti-patterns (known bad solutions to avoid)
  (see protocols/commanders-intent.md — adapted as Creative Brief)

Phase 2: DIVERGE (parallel, blind)
  2-3 Innovators generate ideas independently:
  - Each reads ONLY the creative brief, not peer ideas
  - Each writes ideas to their assigned blackboard section
  - Quantity over quality in this phase
  - Each Innovator uses a different heuristic (see Differentiation)
  - Writes trace: {mission}-ideator-{name}-ideas_submitted.trace

Phase 3: BREATHING SPACE
  Orchestrator reads ALL idea sections without judging or selecting.
  One reading pass. See the full landscape of possibilities.
  (see protocols/breathing-space.md)

Phase 4: SELECT
  Challenger evaluates ALL ideas against the creative brief criteria:
  - Feasibility (can it be done?)
  - Novelty (does it go beyond the obvious?)
  - Fit (does it satisfy the constraints?)
  Writes ranked evaluation to blackboard
  Orchestrator selects top 1-2 ideas for refinement
  Writes trace: {mission}-evaluator-selection_complete.trace

Phase 5: ITERATE (on selected ideas)
  For each selected idea (1-2 cycles max):
  a. Innovator (original author or reassigned) refines the idea
     - Addresses weaknesses identified in evaluation
     - Deepens the concept, adds specificity
  b. Challenger stress-tests the refined version
     - Edge cases, failure modes, hidden assumptions
  Writes trace: {mission}-iteration-{N}-complete.trace

Phase 6: SYNTHESIZE
  Orchestrator writes final creative output:
  - Selected idea(s) with full description
  - Why these were chosen (link to criteria)
  - Implementation sketch (if applicable)
  - Discarded alternatives worth remembering

Phase 7: CRYSTALLIZATION
  Run protocols/crystallization.md (Steps 1-2.5)
  Write retrospective to memory/archive/retrospectives/
```

### Trace Dependency Chain

```
ideator-alpha: ideas_submitted
ideator-beta: ideas_submitted
    |  (both must complete before SELECT)
    v
evaluator: selection_complete
    |
    v
iteration-1-complete  (optional iteration-2-complete)
    |
    v
orchestrator: synthesis_complete
```

---

## Differentiation

Innovators are differentiated via **heuristic assignment** in the spawn prompt.

### Search Heuristics (default)
From `differentiation/search-heuristics.md`:

| Clone | Heuristic | Creative Behavior |
|-------|-----------|------------------|
| Ideator-alpha | Depth-first | Deep exploration of one concept family |
| Ideator-beta | Breadth-first | Wide scan across many concept spaces |
| Ideator-gamma | Contrarian | Challenge assumptions, invert the obvious |

### Creative Heuristics (optional overlay)
From `differentiation/creative-heuristics.md` (when Orchestrator chooses):

| Clone | Heuristic | Creative Behavior |
|-------|-----------|------------------|
| Ideator-alpha | Provocateur | Pushes boundaries, explores the edges of acceptable |
| Ideator-beta | Synthesist | Combines existing ideas from different domains |
| Ideator-gamma | Minimalist | Strips to essence, finds the simplest powerful form |

Orchestrator decides which heuristic set to use based on the creative brief's needs.

---

## Blackboard Structure

```markdown
## Commander's Intent (Creative Brief)
<\!-- Problem, constraints, success criteria, anti-patterns -->

## Ideas: Ideator Alpha
<\!-- ONLY ideator-alpha writes here -->

## Ideas: Ideator Beta
<\!-- ONLY ideator-beta writes here -->

## Ideas: Ideator Gamma
<\!-- ONLY ideator-gamma writes here (if present) -->

## Evaluation
<\!-- Written by Evaluator after all ideas submitted -->
### Ranked Ideas
### Feasibility Assessment
### Selected for Refinement

## Iteration Log
<\!-- Written by Innovator + Challenger during refine cycles -->

## Final Output
<\!-- Written by Orchestrator -->
```

---

## Decision Protocol

**Quality over consensus.** Creative work doesn't require quorum — a single brilliant idea outweighs three mediocre ones. The Orchestrator selects based on criteria fit, not vote count.

The Challenger's evaluation informs but doesn't override. If the Orchestrator sees merit the Challenger missed, the Orchestrator can override with documented rationale.

See `constitutions/commitment-threshold.md` for general quorum rules (apply to factual claims within ideas, not to idea selection).

---

## Time-Box (Default)

- **Diverge phase:** 1 round per Innovator
- **Breathing Space:** 1 reading pass
- **Selection:** 1 evaluation pass
- **Iteration:** 1-2 refine-test cycles (max)
- **Total:** Bounded by 3-4 rounds, not unlimited

---

## Productive Waiting

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: read the
> creative brief constraints, review similar past solutions in retrospectives,
> or pre-load context for your upcoming phase. Do not sit truly idle."

**Exception:** During the DIVERGE phase, Innovators must NOT read peer ideas
— that constraint overrides the productive waiting guideline (same as Research fan-out).

---

## Failure Handling

| Phase | Likely Failures | Response |
|-------|----------------|----------|
| Frame | Creative brief too vague or too narrow | L1: Orchestrator refines with human input |
| Diverge | Innovator produces only obvious/safe ideas | L2: Re-prompt with contrarian heuristic |
| Diverge | Innovator reads peer ideas (blindness breach) | L2: Note in retro, ideas still valid but convergence signal weakened |
| Select | Challenger rejects all ideas | Normal flow: Orchestrator decides whether to iterate or reframe |
| Iterate | Refinement makes idea worse | L1: Revert to pre-refinement version |
| Iterate | No convergence after 2 cycles | Escalate per escalation-rules.md (Tier 3a) |

**Max iteration cycles:** 2. If refinement stalls, the Orchestrator selects the best available version and documents limitations.

---

## Design Notes

- **Blind divergence is the core innovation.** Same principle as Review Squad's blind protocol — independent generation catches more diverse ideas than group brainstorming.
- **Iteration is optional but valuable.** If the diverge phase produces a clearly superior idea, skip straight to synthesis. Iteration is for promising-but-incomplete ideas.
- **Innovator persona is central.** This is the primary squad for The Innovator. Other squads may include Innovators for specific creative subtasks, but the Creative Squad is built around them.
- **The Evaluator is a Challenger, not an Architect.** Evaluation is about finding weaknesses, not designing solutions. The Innovator refines; the Challenger evaluates.
- **Creative heuristics are supplemental.** They live in `differentiation/creative-heuristics.md` as an optional overlay on top of the standard search heuristics. The Orchestrator picks based on the creative brief.
