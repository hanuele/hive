# Hive Integration — CLAUDE.md Snippet

> Paste the content below into your project's `CLAUDE.md` to complete Hive integration.
> Then fill in all `{PLACEHOLDER}` values using `bootstrap/DOMAIN-INJECTION-CHECKLIST.md`.

---

## Hive Integration

### Rules Reference
- Terrain assessment: `.claude/rules/hive-workflow.md`
- Context preservation: `.claude/rules/context-preservation.md`
- Full Hive docs: `.claude/hive/integration-guide.md`

### Skills

| Skill | Purpose |
|-------|---------|
| `/assess-terrain` | Terrain assessment — scores 4 axes and recommends solo vs. Hive squad |

### Agents (Hive)

| Agent | Purpose |
|-------|---------|
| `conflict-watcher` | Read-only conflict scanner for agent teams |

### Common Procedures

| Task | Location |
|------|----------|
| Terrain assessment | `.claude/rules/hive-workflow.md` or `/assess-terrain` |
| Full Hive workflow | `.claude/hive/integration-guide.md` |

### {ISSUE_TRACKER} Labels That Trigger Assessment

`{ISSUE_TRACKER_LABELS}` — these labels always trigger a Hive terrain assessment before starting work.

### Epics

| Epic | Key | Topic |
|------|-----|-------|
| {EPIC_NAME} | {EPIC_KEY} | {EPIC_DESCRIPTION} |
