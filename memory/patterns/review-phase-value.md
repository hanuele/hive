# Pattern: Review Phase Value

> Crystallization status: CODIFIED (3 missions, approved 2026-03-05, implemented in `squads/engineering-squad.md` §Codified Patterns)

## Context

Engineering Squad missions can optionally include a Review phase (Verifier agent)
after implementation. The question is: when does the review phase justify its cost
(~1.5x additional time and tokens)?

## Problem

The assumption that "simple code doesn't need review" is wrong. Edge cases hide in
simple-looking changes. Without a review phase, bugs ship that could have been caught
cheaply before merge.

## Evidence

### kan229-json-validation
Review phase found **3 genuinely CRITICAL issues**:
1. Boolean-in-numeric bypass (`isinstance(True, int)` is True) — would cause silent
   data corruption in production
2. `logger.warning()` vs `pytest.warns()` mismatch — all WARN-level tests would fail
3. schedule_config items not validated — malformed time lists silently accepted

"These would have shipped without the review phase." The 4-agent pipeline cost ~2.5x
a single agent but produced zero-defect output.

### lassonde-classification
Verifier caught an INFO-level observation the Implementer missed. "For well-defined
features, the value is more about process discipline (forcing a plan before coding)
than about diverse perspectives." The explicit plan-implement-verify pipeline makes
verification systematic rather than incidental.

### kan242-ux-audit
Even for visual/CSS work, the review phase caught issues before implementation.
"Review phase value holds for UX tasks" — consistent across Python validation,
scoring, and UX/CSS domains.

## Proposed Rule

> Always include a Review phase for changes that affect:
> - User-visible output
> - Exception-raising or error-handling paths
> - Core business logic (scoring, financial data)
>
> Skip Review only for purely cosmetic WARN-level changes with no external visibility.
> Reviewer findings are cheapest before merge — this pattern holds across Python,
> scoring, and UX domains.

**Target file:** `.claude/hive/squads/engineering-squad.md` (phase composition rules)

## Consequences

**If approved:** All non-trivial Engineering Squad missions include a Review phase.
Adds ~30-50% time/cost per mission. Catches edge cases that would otherwise ship.

**If rejected:** Review remains optional; Orchestrator decides per-mission. Risk of
missing critical edge cases in "simple" implementations.

## Retrospective References

- `memory/archive/retrospectives/kan229-json-validation-retro.md`
- `memory/archive/retrospectives/lassonde-classification-retro.md`
- `memory/archive/retrospectives/kan242-ux-audit-retro.md`
