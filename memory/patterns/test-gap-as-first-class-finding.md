# Pattern: Test Gap as First-Class Finding

**Status:** CODIFIED (2026-03-05)
**Count:** 3 missions
**Missions:** kan-263-hexgeo, kan-265-hexreview, kan-185-assaygrid

## Context

Engineering squad missions produce new components (HTML pages, D3.js visualizations,
API endpoints) that ship without any test coverage. The Verifier agent notices the
gap but classifies it as LOW or MEDIUM severity, which does not block merge.

## Problem

Zero test coverage for new components is treated as a soft warning rather than a
hard gate. This allows untested code to merge, creating a growing test debt that
is harder to address retroactively. The cost of writing tests at implementation
time is far lower than writing them later when context has been lost.

## Evidence

1. **kan-263-hexgeo:** New hex geometry utilities shipped without unit tests.
   Verifier flagged as MEDIUM.
2. **kan-265-hexreview:** Review squad identified missing tests for hex rendering
   components. Flagged as WARNING.
3. **kan-185-assaygrid:** Assay Grid prototype implemented with zero test files.
   Verifier flagged but did not block.

## Proposed Rule (APPROVED)

1. **Verifier severity escalation:** When a Verifier finds zero test coverage for
   a newly created component (file that did not exist before), classify it as
   **FAIL** severity — merge-blocking, same as a bug.
2. **Engineering spawn prompt update:** Implementer spawn prompts should include
   an explicit requirement to create test files alongside implementation files.
   The change plan should list expected test files in the "Files to Modify" table.

## Consequences

- **If adopted:** Slightly longer implementation phases (test writing). Higher
  confidence in shipped code. Test debt does not accumulate silently.
- **If rejected:** Test gaps continue to slip through as soft warnings. Growing
  technical debt in test coverage.

## Implementation

- `squads/engineering-squad.md` — Codified Patterns section + Implementer spawn prompt
- `squads/review-squad.md` — Finding severity guidance (zero tests = CRITICAL)
