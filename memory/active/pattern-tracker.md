# Pattern Tracker

> Living registry of candidate patterns from the Crystallization Protocol.
> Maintained by the Scrum Master after every mission. Replaces manual cross-referencing of retrospective files.

**Last updated:** 2026-03-05 (backfilled from `memory/patterns/`)
**Total patterns tracked:** 5
**Missions scanned:** 11

> **Distribution note:** The rows below are the codified learning that ships with
> the framework (sourced from `memory/patterns/`). The live observation pipeline —
> new candidate patterns, occurrence counts, and mission scans — **resets per
> adoption**: as you run your own missions, the Scrum Master appends to these tables.
> The 5 CODIFIED patterns are retained as the exported baseline.

---

## PROMOTE Queue

Patterns at 3+ missions awaiting human decision. Each needs APPROVE / DEFER / REJECT.

| # | Pattern | Count | Missions | Proposed Rule | Decision |
|---|---------|-------|----------|---------------|----------|
| | | | | | |

*None awaiting — all 5 tracked patterns are already CODIFIED (see Decision Log and Implemented).*

---

## Decision Log

Record human approve/defer/reject decisions here with date and rationale.

| Date | Pattern | Decision | Rationale | Implemented In |
|------|---------|----------|-----------|----------------|
| 2026-03-05 | Commander's Intent Quality Gate | APPROVE | Naming/scope errors propagate from an Intent written from memory; verify against source before writing | `personas/orchestrator.md` rule 1 |
| 2026-03-05 | Plan-Driven Zero-Deviation | APPROVE | A detailed design plan makes implementation mechanical and predictable, lowering rework | `squads/engineering-squad.md` §Codified Patterns |
| 2026-03-05 | Review Phase Value | APPROVE | Review phase caught CRITICAL edge cases that would otherwise have shipped | `squads/engineering-squad.md` §Codified Patterns |
| 2026-03-05 | Findings-vs-Checkpoint Format Drift | APPROVE | Empty `## Findings` breaks BLUF synthesis; spawn prompts must mandate dual writes | `squads/research-squad.md` spawn prompts |
| 2026-03-05 | Test Gap as First-Class Finding | APPROVE | Zero tests on a new component is a merge-blocking FAIL, not a soft warning | `squads/engineering-squad.md` + `squads/review-squad.md` |

---

## Implemented

Patterns that completed the full Crystallization Spiral: HARVEST > PATTERN > PROMOTE > CODIFY.

| Pattern | Count | Implemented In | Date |
|---------|-------|----------------|------|
| Commander's Intent Quality Gate | 4 | `personas/orchestrator.md` (rule 1) | 2026-03-05 |
| Plan-Driven Zero-Deviation | 3 | `squads/engineering-squad.md` (§Codified Patterns) | 2026-03-05 |
| Review Phase Value | 3 | `squads/engineering-squad.md` (§Codified Patterns) | 2026-03-05 |
| Findings-vs-Checkpoint Format Drift | 3 | `squads/research-squad.md` (spawn prompts) | 2026-03-05 |
| Test Gap as First-Class Finding | 3 | `squads/engineering-squad.md` + `squads/review-squad.md` | 2026-03-05 |

---

## Pattern Registry

All patterns with occurrence data. Sorted by count (descending), then alphabetically.

### 3+ Occurrences (PROMOTE Queue)

| Pattern | Count | Missions | Discernment | Status |
|---------|-------|----------|-------------|--------|
| Commander's Intent Quality Gate | 4 | kan229-json-validation, kan220-hardcoded-secrets, commanders-intent-checklist, lassonde-classification | Seed to water | CODIFIED |
| Plan-Driven Zero-Deviation | 3 | kan229-json-validation, lassonde-classification, kan242-ux-audit | Seed to water | CODIFIED |
| Review Phase Value | 3 | kan229-json-validation, lassonde-classification, kan242-ux-audit | Seed to water | CODIFIED |
| Findings-vs-Checkpoint Format Drift | 3 | verify-context-renewal, hive-20260304-lassonde-durrett-viz, hive-20260304-nightly-package-2 | Seed to water | CODIFIED |
| Test Gap as First-Class Finding | 3 | kan-263-hexgeo, kan-265-hexreview, kan-185-assaygrid | Seed to water | CODIFIED |

### 2 Occurrences (Seeds to Water)

| Pattern | Count | Missions | Discernment | Status |
|---------|-------|----------|-------------|--------|
| | | | | |

### 1 Occurrence (Seeds)

| Pattern | Count | Mission | Discernment | Status |
|---------|-------|---------|-------------|--------|
| | | | | |

---

## Usage Instructions

### When to Update

The Scrum Master updates this file during **Step 2 (PATTERN)** of the Crystallization Protocol, after every mission.

### How to Update

1. **Read this file** at the start of Step 2.
2. For each candidate pattern from the current mission's retro:
   - **If it already exists in the registry:** increment count, add the mission name to the Missions column.
   - **If it is new:** add a new row with count=1, the mission name, and discernment classification.
3. If any pattern reaches **count 3+**, move it to the PROMOTE Queue section and write a PROMOTE proposal.
4. When a human approves/defers/rejects a PROMOTE candidate, record the decision in the Decision Log.
5. When an approved pattern is codified (code change, protocol update, CLAUDE.md amendment), move it to the Implemented section with a link to the implementation.

### Discernment Classifications

| Classification | Meaning |
|----------------|---------|
| Seed to water | Behavior we want to reinforce — fast-track toward PROMOTE |
| Seed to let rest | Behavior we want to not reinforce — document as anti-pattern |
| Seed we don't understand | Need more observations before classifying |
