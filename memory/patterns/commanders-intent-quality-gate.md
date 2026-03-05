# Pattern: Commander's Intent Quality Gate

> Crystallization status: CODIFIED (4 missions, approved 2026-03-05, implemented in `personas/orchestrator.md` rule 1)

## Context

When the Orchestrator writes the Commander's Intent at mission start, it defines
entity names, scope boundaries, and assumptions that all downstream agents treat
as ground truth.

## Problem

The Orchestrator writes the Intent from memory or assumptions rather than
verifying against source code. This causes naming errors and scope gaps that
propagate through the entire pipeline.

## Evidence

### kan229-json-validation
Two naming errors: `AnalysisResult` instead of `Analysis`, and `Financial` called
`AlphaVantageData`. The Designer silently corrected these; the Reviewer caught one.
**Root cause:** "The Orchestrator wrote it from memory rather than from code."

### kan220-hardcoded-secrets
The Intent excluded test files from scope ("Exclude: test files that mock API keys").
But `test_alpha_vantage.py` is NOT a mock — it's a live integration test with the
same real key. The Challenger caught this scope exclusion error.
**Root cause:** "The Orchestrator assumed test files = mocks without verifying."

### commanders-intent-checklist
This mission itself produced an 8-item Commander's Intent Verification Checklist
(3 CRITICAL, 4 IMPORTANT, 1 USEFUL). Surprise finding: format deviation (non-standard
headers) correlated with success, not failure. The checklist prioritizes **content
coverage**, not format compliance.

### lassonde-classification
Positive case — proper procedure followed, no naming errors. Confirms the pattern:
when verification happens, the problem doesn't appear.

## Proposed Rule

> Verify entity names and scope assumptions against source code before writing
> Commander's Intent. The Intent is a specification — treat it with specification-level
> rigor. Use the 8-item verification checklist from the commanders-intent-checklist
> mission as a pre-flight check.

## Consequences

**If approved:** Orchestrator must read relevant source files before writing the Intent.
Adds ~2-5 minutes to mission setup. Prevents cascading naming/scope errors.

**If rejected:** Naming errors will continue to appear intermittently. Downstream agents
may silently correct or propagate them.

## Retrospective References

- `memory/archive/retrospectives/kan229-json-validation-retro.md`
- `memory/archive/retrospectives/kan220-hardcoded-secrets-retro.md`
- `memory/archive/retrospectives/commanders-intent-checklist-retro.md`
- `memory/archive/retrospectives/lassonde-classification-retro.md`
