# Hive Workflow — When to Use Multi-Agent Squads

> Full guide: `.claude/hive/integration-guide.md`

## Terrain Assessment Trigger

When picking up a {ISSUE_TRACKER} ticket or starting a non-trivial task, assess terrain
along 4 axes before beginning work:

| Axis | Solo | Squad |
|------|------|-------|
| Uncertainty | Requirements clear, known path | Unknowns, need research |
| Reversibility | Feature branch, easy rollback | Migration, API contract, critical data |
| Breadth | 1-2 files, single service | 3+ services, cross-cutting |
| Stakes | Low blast radius | Scoring, critical data, security |

**If 2+ axes point toward "Squad"** -> read `.claude/hive/integration-guide.md`
and propose a squad to the user before starting solo.

## Squad Quick Reference

| Signal | Squad |
|--------|-------|
| High uncertainty, need to learn | Research (`.claude/hive/squads/research-squad.md`) |
| Cross-service build, known requirements | Engineering (`.claude/hive/squads/engineering-squad.md`) |
| High-stakes review (DB, security, critical logic) | Review (`.claude/hive/squads/review-squad.md`) |

## {ISSUE_TRACKER} Labels That Always Trigger Assessment

`{ISSUE_TRACKER_LABELS}` — these labels always trigger a terrain assessment before work begins.

## What NOT to Use Squads For

- Single-file bug fixes, simple CRUD, docs-only, config changes, version bumps
- Any task where coordination overhead > diversity value
