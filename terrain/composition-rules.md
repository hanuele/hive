# Terrain → Squad Composition Rules

## Composition Table

| Terrain Profile | Squad Type | Size | Key Agents |
|----------------|-----------|------|------------|
| Low uncertainty, reversible, narrow, low stakes | **Focused Build** | 3 | Architect + Operator + Tester |
| High uncertainty, any, any, any | **Research** | 3-4 | Orchestrator + 2 Investigators + optional Challenger |
| Any, irreversible, any, high stakes | **Review** | 3-4 | Orchestrator + 2-3 Challengers (different lenses) |
| Medium uncertainty, reversible, broad, medium stakes | **Full Engineering** | 4-5 | Orchestrator + Architect + Operator + Tester + optional Security |
| Need novel solutions, design alternatives | **Creative** | 4-5 | Orchestrator + 2-3 Innovators + Challenger (Evaluator) |
| High uncertainty, irreversible, broad, high stakes | **Strategy** | 4-6 | Orchestrator + 2-4 Investigators + Challenger + Architect |
| Conceptual ambiguity, deep understanding needed | **Philosophy** | 3 | Orchestrator + Investigator (Explorer) + Challenger (Socratic) |
| Initiative spans multiple squad types | **Management** | 3-4 | Orchestrator + Architect (Decomposer) + Challenger (Risk/Monitor) |

## Tiebreaker Rule

When no row matches exactly:

```
1. Identify the two highest-stakes axes for this mission
2. Apply the template that matches those two axes, even if lower-stakes axes differ
3. Precedence: REVERSIBILITY > STAKES > UNCERTAINTY > BREADTH
4. Flag the mismatch in the Commander's Intent:
   "Template approximated from [original profile] -> [matched template].
    Difference: [axes that don't match].
    Rationale: [why this template was chosen]."
```

## Crystallized Rule: Complementary Lens Assignment

> *Promoted from candidate pattern on 2026-03-03 after 3 observations (Missions 1, 3, 5).*

When assembling a Research Squad or Review Squad, assign investigators/reviewers with **explicitly different lenses** (e.g., security + operational, theory + data, correctness + performance). Independent perspectives produce richer findings than duplicated effort on the same lens.

**Evidence:** Coverage data across 3 missions shows each lens finds 30-40% that the other misses. In multi-reviewer missions, reviewers found unique findings that neither found alone. In research missions with a Challenger, the strongest corrections came from dimensions no investigator was examining.

**Application:**
- The Orchestrator or Commander's Intent must name each investigator/reviewer's assigned lens
- Lenses should be complementary (different frames on the same problem), not overlapping
- The lens shapes what the agent looks for, not what tools they use

## Universal Protocol: Independent Verification

Before any finding is synthesized, it must be verified by an agent who has not seen the original finding. Reviewers submit blind — they do not read each other's output until all have submitted. This applies to all squad types, not only Review Squads.

## When NOT to Use Multi-Agent

Use a single agent when:
1. The base model handles it end-to-end
2. The task is simple enough that coordination overhead dominates
3. Tasks are sequential with tight dependencies
4. Work involves the same files or tightly coupled state
5. Uncertainty is low and the path is clear
6. The decision carries moral weight that should rest with a specific human
7. The task requires genuine novelty and all agents share the same training distribution
