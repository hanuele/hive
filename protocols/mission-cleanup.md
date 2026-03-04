# Mission Cleanup Protocol

> Consolidated checklist for post-mission archival. Run by the Scrum Master
> (or Orchestrator/human in Focused Build) after every `mission_complete` event.

## When to Run

- Immediately after the mission retrospective is filed
- Before the next mission starts (prevents active directory clutter)
- On-demand: when `active/traces/` or `active/blackboard/` accumulates
  files from missions listed as completed in `hive-status.md`


**Automation:** The `/hive-resume` skill automates this checklist for stale missions.
Run it from a fresh session to scan, classify, and clean up interrupted missions.
See `.claude/skills/hive-resume/SKILL.md`.

## Checklist

### 1. Archive Traces

```bash
# Move all trace files for the completed mission
mkdir -p .claude/hive/memory/archive/traces/{mission-name}/
mv .claude/hive/memory/active/traces/{mission-name}-*.trace \
   .claude/hive/memory/archive/traces/{mission-name}/
```

Log the event:
```json
{"ts":"ISO-8601","mission":"{name}","agent":"scrum-master","event":"trace_archived","detail":"Archived N trace files to archive/traces/{name}/","file_count":N}
```

### 2. Archive Blackboard

Move the completed mission blackboard (NOT the `_template.md`):

```bash
mv .claude/hive/memory/active/blackboard/{mission-name}.md \
   .claude/hive/memory/archive/blackboard/
```

Log the event:
```json
{"ts":"ISO-8601","mission":"{name}","agent":"scrum-master","event":"blackboard_archived","detail":"Archived blackboard ({size}KB) to archive/blackboard/","size_kb":N}
```

**Never archive `_template.md`.** It stays in active permanently.

### 2.5. Archive State & Budget Files

Move any state machine and budget tracker files for the completed mission:

```bash
# Archive state machine file (if exists)
if [ -f ".claude/hive/memory/active/${MISSION}-state.json" ]; then
    mv ".claude/hive/memory/active/${MISSION}-state.json" \
       ".claude/hive/memory/archive/state/"
fi

# Archive budget tracker files for all mission agents
for f in .claude/hive/memory/active/budget/*.json; do
    [ -f "$f" ] && mv "$f" ".claude/hive/memory/archive/state/"
done
```

Budget files from `active/budget/` are always cleaned up — they are per-session,
not per-mission. State machine files are mission-scoped and archived by name.

### 3. Verify Retrospective

Confirm the retrospective exists in `archive/retrospectives/{mission-name}-retro.md`.
If missing, flag as WARN — the retrospective may have been skipped.

### 4. Update Projections

Check if `archive/projections/status-summary.md` has a row for this mission.
If not, append one. Check staleness: if >24 hours since last `mission_complete`
and projections are not updated, regenerate from `events.jsonl`.

### 5. Verify hive-status.md

Confirm the mission appears in the `## Completed Missions` table in
`memory/hive-status.md`. If missing, add the row.

## Stale File Detection

**Definition:** A file in `active/traces/` or `active/blackboard/` is stale when:
- Its mission name appears in `hive-status.md` → `## Completed Missions`, OR
- It is >24 hours old with no corresponding active mission

**Action:** Archive stale files per steps 1-2 above. If the mission status is
unclear (not in Completed Missions and no active reference), investigate before
archiving — it may represent in-progress work.

## Size Limits

| Directory | Soft Limit | Hard Limit | Action |
|-----------|-----------|------------|--------|
| `active/blackboard/` | 5 files | 10 files | Archive completed missions |
| `active/traces/` | 0 files between missions | 20 files | Archive by mission |
| `active/budget/` | 0 files between missions | 10 files | Archive after mission cleanup |
| Single blackboard file | 10 KB | 50 KB | Generate briefing (see `protocols/briefing.md`) |
| `archive/events.jsonl` | 100 KB | 500 KB | Split by year: `events-2026.jsonl` |
| `archive/state/` | No limit | — | Archived state machine + budget files |
| `archive/blackboard/` | No limit | — | Append-only archive |

When a blackboard exceeds 10 KB during a mission, the Scrum Master generates
a briefing per `protocols/briefing.md`. At 50 KB, investigate whether the
mission scope has grown beyond its original intent (possible scope drift).

## Manifest Directory

The `active/manifests/` directory is reserved for future use: mission manifest
files that describe the full squad composition, tool grants, and spawn config
for reproducible mission replay. Currently unused — do not delete the directory
or its `.gitkeep`.

## Archive Directory Structure

```
memory/archive/
├── blackboard/              # Completed mission blackboards (1 file per mission)
├── events.jsonl             # Immutable event log (append-only)
├── projections/
│   ├── status-summary.md    # One-line per completed mission
│   └── agent-activity.md    # Per-agent activity across missions
├── retrospectives/          # Post-mission retrospectives (1 file per mission)
├── state/                   # Archived state machine + budget tracker files
└── traces/                  # Per-mission subdirectories
    └── {mission-name}/      # All trace files for that mission
```
