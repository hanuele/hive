# Pattern: Plan-Driven Zero-Deviation

> Crystallization status: CODIFIED (3 missions, approved 2026-03-05, implemented in `squads/engineering-squad.md` §Codified Patterns)

## Context

In Engineering Squad missions, the Designer produces a change plan before the
Implementer begins coding. The plan's level of detail determines how much
creative interpretation the Implementer needs.

## Problem

When plans are vague, implementers drift — adding unscoped features, interpreting
ambiguous requirements differently than intended, or making architectural decisions
that should have been made in design. This causes rework and review findings.

## Evidence

### kan229-json-validation
Designer produced a thorough change plan with per-column validation rules, strictness
levels, and a clear test strategy. Implementer executed it with zero deviations.
Result: 831 tests pass (50 new). "The plan was actionable enough that the Implementer
could execute it without clarification."

### lassonde-classification
Zero deviations from plan. Designer specified function signatures, pseudocode, and
test cases. Implementer added 6 edge case tests beyond the plan — "the plan set a
floor, not a ceiling." Cost-benefit: "Higher upfront cost (Designer reads many files),
lower total cost (no rework)."

### kan242-ux-audit
Implementer delivered 10 complete CSS style variants plus preview HTML per the plan,
zero deviations. Third consecutive Full Engineering mission validating this pattern.
"The cost is in the design phase; the benefit is mechanical, predictable implementation."

## Proposed Rule

> When the Designer produces a detailed change plan (function signatures, pseudocode,
> test cases, scope boundaries), the Implementer should execute it with zero deviations.
> Invest in the design phase — it pays for itself by making implementation mechanical
> and verification straightforward. The plan sets a floor, not a ceiling: Implementer
> may add edge case tests but should not deviate from the specified approach.

**Target file:** `.claude/hive/squads/engineering-squad.md` (Designer + Implementer
role descriptions)

## Consequences

**If approved:** Design phases take longer but implementation becomes predictable.
Review findings decrease because the plan has already been validated.

**If rejected:** Implementer retains creative latitude, which is faster for simple
tasks but riskier for complex ones.

## Retrospective References

- `memory/archive/retrospectives/kan229-json-validation-retro.md`
- `memory/archive/retrospectives/lassonde-classification-retro.md`
- `memory/archive/retrospectives/kan242-ux-audit-retro.md`
