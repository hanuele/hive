# Event Schema

> Formal reference for event types in `memory/archive/events.jsonl`. All missions log events using these types.

## Base Format

Every event is a single JSON line in `events.jsonl` (no pretty-printing):

```json
{"ts":"ISO-8601","mission":"{name}","agent":"{name}","event":"{type}","detail":"{human-readable}"}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ts` | string (ISO-8601) | Yes | UTC timestamp |
| `mission` | string | Yes | Mission identifier (matches blackboard name) |
| `agent` | string | Yes | Agent that generated the event |
| `event` | string | Yes | Event type from the catalog below |
| `detail` | string | Yes | Human-readable description |

Additional fields may be present for specific event types (documented below).

---

## Event Type Catalog

### Mission Lifecycle

| Event Type | When | Agent |
|-----------|------|-------|
| `mission_start` | Mission created, team spawned | Orchestrator/Human |
| `mission_complete` | All objectives met, retrospective filed | Orchestrator/Human |
| `mission_abort` | Mission terminated early (L4 failure or human decision) | Orchestrator/Human |

### Task Lifecycle

| Event Type | When | Agent |
|-----------|------|-------|
| `task_start` | Agent begins working on assigned task | Any |
| `task_complete` | Agent finishes assigned task | Any |
| `task_skip` | Task skipped due to L2 degraded failure | Orchestrator |

### Coordination

| Event Type | When | Agent |
|-----------|------|-------|
| `breathing_space` | Orchestrator begins reading pass before synthesis | Orchestrator |
| `checkpoint` | Agent writes working state to blackboard mid-task | Any |
| `synthesis_complete` | Orchestrator writes synthesis to blackboard | Orchestrator |
| `retrospective_complete` | Retrospective filed to archive | Orchestrator |
| `bell` | Bell of Mindfulness — mission drift or pace concern | Orchestrator |
| `trace_written` | Agent writes a stigmergy trace (see stigmergy-traces.md) | Any |
| `trace_archived` | Trace files moved from active to archive after mission completion | Scrum Master |
| `blackboard_archived` | Blackboard moved from active to archive after mission completion | Scrum Master |

**`trace_archived` additional fields:**

```json
{"ts":"...","mission":"...","agent":"scrum-master","event":"trace_archived","detail":"Archived 3 trace files to archive/traces/kan229/","file_count":3}
```

**`blackboard_archived` additional fields:**

```json
{"ts":"...","mission":"...","agent":"scrum-master","event":"blackboard_archived","detail":"Archived blackboard (26KB) to archive/blackboard/","size_kb":26}
```

**`bell` event additional field:**

```json
{"ts":"...","mission":"...","agent":"orchestrator","event":"bell","detail":"Scope drift detected — implementer modifying files outside change plan","trigger":"scope_drift|pace_concern|quality_concern"}
```

### Design & Review

| Event Type | When | Agent |
|-----------|------|-------|
| `design_approved` | Change plan reviewed and approved (Full Engineering only) | Reviewer |
| `design_rejected` | Change plan needs revision | Reviewer |
| `finding_submitted` | Review finding written to blackboard | Challenger |
| `test_result` | Test suite execution completed | Verifier |

**`design_approved` / `design_rejected` additional field:**

```json
{"ts":"...","mission":"...","agent":"reviewer","event":"design_approved","detail":"Change plan approved with 1 minor suggestion","changes_proposed":3}
```

**`test_result` additional field:**

```json
{"ts":"...","mission":"...","agent":"verifier","event":"test_result","detail":"All 47 tests pass","passed":47,"failed":0,"errors":0}
```

### Failure

| Event Type | When | Agent |
|-----------|------|-------|
| `failure` | Any failure per failure-taxonomy.md | Any |

**Additional fields:**

```json
{"ts":"...","mission":"...","agent":"...","event":"failure","detail":"L2: Empty output from implementer after design phase","level":"L1|L2|L3|L4","action_taken":"retry|skip|substitute|pause|abort"}
```

### Knowledge

| Event Type | When | Agent |
|-----------|------|-------|
| `crystallization_candidate` | Pattern identified worth tracking across missions | Orchestrator |
| `catalog_match` | Scrum Master found a matching catalog entry and applied the fix | Scrum Master |
| `catalog_append` | Scrum Master added a new entry after resolving an unmatched failure | Scrum Master |
| `stop_signal` | Stop Signal issued against a specific claim | Any |
| `persona_health_check` | After retrospective, assess agent performance indicators | Orchestrator |

**`catalog_match` additional fields:**

```json
{"ts":"...","mission":"...","agent":"scrum-master","event":"catalog_match","detail":"ERR-007 matched: read-only agent in write role — reassigned to general-purpose","err_id":"ERR-007","action_taken":"fix_applied|escalated"}
```

**`catalog_append` additional fields:**

```json
{"ts":"...","mission":"...","agent":"scrum-master","event":"catalog_append","detail":"New entry ERR-008: timeout on web fetch during research","err_id":"ERR-008","status":"candidate|verified"}
```

**`stop_signal` additional field:**

```json
{"ts":"...","mission":"...","agent":"challenger","event":"stop_signal","detail":"Challenge: claim X lacks evidence","severity":"CRITICAL|WARNING|INFO","claim":"The specific claim being challenged"}
```

**`persona_health_check` additional fields:**

```json
{"ts":"...","mission":"...","agent":"orchestrator","event":"persona_health_check","detail":"Post-mission health check for investigator-alpha","target_agent":"investigator-alpha","indicators":{"finding_uniqueness_ratio":0.67,"plan_deviation_count":0,"scope_drift_count":0,"convergent_findings":1}}
```

| Indicator | Type | Healthy | Unhealthy | Applicable Personas |
|-----------|------|---------|-----------|---------------------|
| `finding_uniqueness_ratio` | float 0-1 | > 0.30 | < 0.10 (echo chamber) | Investigator, Challenger |
| `review_catch_rate` | int | ≥ 1 | 0 across 3+ missions | Challenger (as reviewer) |
| `plan_deviation_count` | int | 0-1 | 3+ | Architect (as designer) |
| `convergent_findings` | int | ≥ 1 per multi-agent mission | 0 | All in multi-agent missions |
| `scope_drift_count` | int | 0 | 2+ | All |
| `time_variance_ratio` | float | < 2.0 | > 3.0 | All in concurrent squads |

---

## Querying Events

Events are queryable by mission name using standard tools:

```bash
# All events for a mission
grep '"mission":"{your-mission-name}"' .claude/hive/memory/archive/events.jsonl

# All failures across missions
grep '"event":"failure"' .claude/hive/memory/archive/events.jsonl

# All crystallization candidates
grep '"event":"crystallization_candidate"' .claude/hive/memory/archive/events.jsonl

# Mission timeline
grep '"mission":"{your-mission-name}"' .claude/hive/memory/archive/events.jsonl | sort
```

---

## Projections

Projections are derived views that summarize event data for quick consumption. They live in `memory/archive/projections/`.

### Projection Files

| File | Content | Updated By |
|------|---------|-----------|
| `status-summary.md` | One-line status per completed mission (date, squad, outcome, key metric) | Orchestrator at mission_complete |
| `agent-activity.md` | Per-agent activity log (missions participated, roles, findings count, failure events) | Orchestrator at retrospective_complete |

### Schema

**status-summary.md:**
```markdown
| Mission | Date | Squad | Outcome | Key Metric |
|---------|------|-------|---------|-----------|
| {name} | YYYY-MM-DD | {squad type} ({agent count}) | Succeeded/Failed | {one distinguishing metric} |
```

**agent-activity.md:**
```markdown
| Agent | Mission | Role | Findings | Failures | Notes |
|-------|---------|------|----------|----------|-------|
| {name} | {mission} | {persona + lens} | {count} | {count} | {brief note} |
```

### When to Write

- **status-summary.md:** Append a row after every `mission_complete` event. The Orchestrator (or human) writes this as the last step before closing the mission.
- **agent-activity.md:** Append rows for each agent after `retrospective_complete`. Data is extracted from the retrospective's "Energy and Effort" section and event log.

### Staleness Rules

- A projection file older than 24 hours since the last completed mission is **stale**.
- Stale projections should be regenerated from `events.jsonl` and retrospective files.
- If no missions have run in 24+ hours, the projections are current (nothing to update).

---

## Ordering

Events are appended in chronological order. Within a mission, events form a narrative:

```
mission_start → task_start(s) → [bell] → [failure] → breathing_space →
synthesis_complete → retrospective_complete → mission_complete
```

Parallel events (e.g., multiple agents starting simultaneously) may have identical timestamps. Order within the same timestamp is not guaranteed.

---

## Design Notes

- **Append-only.** Events are never modified or deleted. The log is an immutable audit trail.
- **Human-readable `detail` field.** Events should be understandable without consulting this schema. The `detail` field carries the narrative; typed fields enable filtering.
- **Additional fields are optional.** Not all consumers need structured data. The base 5 fields are always sufficient for timeline reconstruction.
- **One line per event.** No multi-line JSON. This enables `grep` and `wc -l` as first-class query tools.
