---
name: assess-terrain
description: Terrain assessment for tickets or described tasks — scores 4 axes (Uncertainty, Reversibility, Breadth, Stakes) and recommends solo work vs. Hive squad.
allowed-tools: Bash(bash:*), Bash(git:*), Read, Grep, Glob
argument-hint: [{TICKET_PREFIX}XX or task description]
---

# Assess Terrain

Evaluate a {ISSUE_TRACKER} ticket (or described task) along 4 terrain axes and recommend solo work vs. a Hive squad.

## Step 1: Resolve the ticket

Parse `$ARGUMENTS` for a ticket key (`{TICKET_PREFIX}\d+` or similar format).

**If ticket key found:** fetch ticket details using your issue tracker CLI:

```bash
{ISSUE_TRACKER_CLI} get <KEY>
```

Extract: summary, labels, epic, description.

**If no ticket key:** ask the user to describe the task (summary, scope, what services are involved, any irreversible changes).

## Step 2: Gather context

Check which files/services the task likely touches:

1. Read the ticket's labels and epic
2. If a branch exists for this ticket, get the file diff:
   ```bash
   git diff --name-only main...origin/feature/<KEY>* 2>/dev/null || echo "no branch"
   ```
3. Map labels to modules using `.claude/conflict-map.yml` (if available)

## Step 3: Score terrain axes

Score each axis as **Low**, **Medium**, or **High**:

| Axis | Low | Medium | High |
|------|-----|--------|------|
| **Uncertainty** | Clear requirements, known path, well-documented area | Some unknowns, partially documented | Need research first, new territory |
| **Reversibility** | Feature branch, easy rollback, no shared state | Touches shared config or API contracts | Migration, critical formula, production data |
| **Breadth** | 1-2 files, single service | 3-5 files, 1-2 services | 5+ files, 3+ services, cross-cutting |
| **Stakes** | Low blast radius, internal-only | User-facing but recoverable | Critical data, security, production systems |

### Scoring inputs

- **Labels** that signal domain complexity -> bump Uncertainty
- **Labels** that signal data integrity risk -> bump Reversibility and Stakes
- **Labels** that signal external API calls -> bump Uncertainty (external systems are unpredictable)
- **Epic** {EPIC_KEY} (DB-related) -> bump Reversibility
- **File count** from branch diff or prediction -> informs Breadth

> Customize the label-to-axis mappings above for your project's label taxonomy.
> See `{ISSUE_TRACKER_LABELS}` in your CLAUDE.md for which labels always trigger assessment.

## Step 4: Apply composition rules

Read `.claude/hive/terrain/composition-rules.md` and match the terrain profile:

| Profile | Recommendation |
|---------|---------------|
| 0-1 axes High | **Solo** — standard workflow |
| 2+ axes High, Uncertainty dominant | **Research Squad** (`.claude/hive/squads/research-squad.md`) |
| 2+ axes High, Breadth dominant | **Engineering Squad** (`.claude/hive/squads/engineering-squad.md`) |
| 2+ axes High, Stakes/Reversibility dominant | **Review Squad** (`.claude/hive/squads/review-squad.md`) |

Use the tiebreaker precedence: REVERSIBILITY > STAKES > UNCERTAINTY > BREADTH.

## Step 5: Output recommendation

Display a terrain assessment table:

```
TERRAIN ASSESSMENT: <KEY or task summary>

| Axis | Score | Evidence |
|------|-------|----------|
| Uncertainty | {Low/Medium/High} | {why} |
| Reversibility | {Low/Medium/High} | {why} |
| Breadth | {Low/Medium/High} | {why} |
| Stakes | {Low/Medium/High} | {why} |

RECOMMENDATION: {Solo / Research Squad / Engineering Squad / Review Squad}
Rationale: {1-2 sentences}
```

If squad recommended, add:

```
Squad guide: .claude/hive/squads/{squad-type}.md
Integration guide: .claude/hive/integration-guide.md
```

## Error Handling

| Failure | Behavior |
|---------|----------|
| {ISSUE_TRACKER} unavailable | Ask user to describe task manually |
| No labels or epic | Score based on description and file analysis only |
| conflict-map.yml missing | Skip module prediction, use file count from branch |
| No branch exists | Score Breadth from description, mark as "(estimated)" |
