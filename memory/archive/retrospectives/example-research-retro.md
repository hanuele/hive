# Retrospective: example-research-topic

**Mission date:** 2026-01-15
**Squad:** orchestrator + investigator-alpha (depth-first) + investigator-beta (breadth-first)
**Mission outcome:** succeeded

## Beginning Anew

### Flower Watering
Investigator-alpha's depth-first approach uncovered a critical gap in the domain model that breadth-first scanning would have missed. Investigator-beta's cross-domain references provided the framing that made alpha's finding actionable. The Orchestrator's Commander's Intent was specific enough to guide but open enough to allow surprise.

### Expressing Regret
The Breathing Space was too short — the Orchestrator moved to synthesis before fully absorbing the breadth of beta's findings. Two minor findings were initially missed in synthesis and had to be recovered.

### Sharing Aspiration
In the next mission, we aspire to give the Breathing Space its full weight — reading without the pressure to produce.

## What Surprised Us
Beta's finding that the assumed data source was unreliable contradicted 6 months of team assumptions. This was surprising because the source had been treated as authoritative without independent verification. The assumption it revealed: "established sources are reliable by default."

## What We Found
1. The primary data source had a 15% error rate on key fields (confidence: 0.85)
2. A secondary source existed that could serve as cross-validation (confidence: 0.70)
3. The domain model was missing a classification tier that would resolve ambiguous cases
4. Existing documentation was accurate but incomplete — 3 edge cases undocumented
5. The proposed implementation approach was feasible with 2 modifications

## What Went Well
- Complementary lens assignment (depth vs. breadth) produced richer findings than either alone
- BLUF format made synthesis efficient — key findings were immediately extractable
- Stigmergy traces worked cleanly — no coordination overhead between agents
- Commander's Intent "Premises to question" field caught one incorrect assumption before work began

## Who Was Affected?
The engineering team downstream would have built on the unreliable data source without this research. The finding prevents 2-3 weeks of rework.

## What Failed
- Time estimation was off — research took 40% longer than time-boxed
- One investigator's initial findings were too broad (L2 degraded: re-prompted with narrower scope)

## Did Multi-Agent Add Value?
Yes. The depth/breadth lens differentiation was the key value add. Alpha's depth finding and beta's breadth finding were complementary — neither agent would have produced both. A single agent would likely have found 3 of the 5 key findings.

## Energy and Effort
Appropriate throughout. No signs of drift or exhaustion in agent outputs.

## Candidate Patterns

### Complementary Lens Assignment
**Context:** Multi-agent research with 2+ investigators
**Problem:** Investigators with identical approaches produce redundant findings
**Solution:** Assign explicitly different lenses (depth/breadth, theory/data, internal/external)
**Consequences:** Richer findings; requires Orchestrator to name lenses in Commander's Intent

## Proposed Rule Changes
None at this time (first observation of Complementary Lens pattern — needs 2 more observations before PROMOTE threshold).
