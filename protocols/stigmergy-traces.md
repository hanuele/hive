# Stigmergy Traces

> Lightweight state markers for sequential coordination between agents. Named after the biological pattern where organisms coordinate through environmental signals rather than direct communication.

## Design Principle

Agents in a sequential pipeline need to know when upstream work is complete before starting their own. Rather than polling teammates or relying on message delivery, agents write trace files to the shared filesystem. Downstream agents poll for the expected trace before beginning their phase.

This is **stigmergy** — coordination through shared environment, not through messaging.

---

## Trace Format

### File Location

```
.claude/hive/memory/active/traces/
```

### File Naming

```
{mission}-{agent}-{action}.trace
```

**Examples:**
- `{mission-name}-designer-design_complete.trace`
- `{mission-name}-implementer-implementation_complete.trace`
- `{mission-name}-verifier-tests_complete.trace`

### File Content

Single JSON line (no pretty-printing, no trailing newline):

```json
{"ts":"2026-03-03T10:30:00Z","mission":"{mission-name}","agent":"designer","action":"design_complete","detail":"Change plan written to blackboard: 3 files, 12 changes proposed"}
```

| Field | Type | Description |
|-------|------|-------------|
| `ts` | ISO-8601 | Timestamp of trace creation |
| `mission` | string | Mission identifier (matches blackboard name) |
| `agent` | string | Agent name that wrote the trace |
| `action` | string | Standard action identifier (see below) |
| `detail` | string | Human-readable summary of what was completed |

---

## Standard Actions

| Action | Meaning | Written By |
|--------|---------|-----------|
| `ready` | Agent has read Commander's Intent and is prepared to work | Any agent at mission start |
| `design_complete` | Design/change plan written to blackboard | Designer (Engineering Squad) |
| `review_complete` | Design review written to blackboard | Reviewer (Full Engineering) |
| `implementation_complete` | Code changes committed in worktree | Implementer (Engineering Squad) |
| `tests_complete` | Tests written and executed, results on blackboard | Verifier (Engineering Squad) |
| `finding_submitted` | Review finding written to named blackboard section | Reviewer (Review Squad) |
| `synthesis_complete` | Orchestrator synthesis written to blackboard | Orchestrator |
| `breathing_space_complete` | Facilitator has completed reading pass | Orchestrator |
| `retrospective_complete` | Retrospective filed to archive | Orchestrator |

Custom actions are allowed but must be documented in the mission's Commander's Intent.

---

## Protocol

### Writing a Trace

After completing a phase, the agent writes its trace file:

```bash
echo '{"ts":"...","mission":"...","agent":"...","action":"...","detail":"..."}' > .claude/hive/memory/active/traces/{mission}-{agent}-{action}.trace
```

The agent also logs a corresponding event to `events.jsonl`:

```json
{"ts":"...","mission":"...","agent":"...","event":"trace_written","detail":"Action: {action}"}
```

### Reading a Trace (Downstream Gating)

Before starting work, a downstream agent checks for the expected upstream trace:

```bash
# Check if designer has completed design
cat .claude/hive/memory/active/traces/{mission}-designer-design_complete.trace
```

**If trace exists:** Read the detail, then proceed with own phase.
**If trace does not exist:** Wait. The upstream agent has not completed its phase.

### Trace Gating in Squad Templates

Each squad template defines its trace dependency chain. For Engineering Squad (Focused Build):

```
designer → design_complete.trace
    ↓
implementer reads trace → implements → implementation_complete.trace
    ↓
verifier reads trace → tests → tests_complete.trace
```

For Review Squad:

```
orchestrator → commander_intent trace (implicit — blackboard exists)
    ↓ (fan-out, no dependencies between reviewers)
reviewer-correctness → finding_submitted.trace
reviewer-security → finding_submitted.trace
    ↓ (blind gate — orchestrator waits for ALL)
orchestrator reads all traces → synthesis
```

---

## Cleanup

After mission completion, the Orchestrator (or human in Focused Build) archives traces:

1. Move all `{mission}-*.trace` files to `memory/archive/traces/{mission}/`
2. If archive directory doesn't exist, create it
3. Log cleanup event to `events.jsonl`

**Stale trace detection:** Any trace file in `active/traces/` older than 24 hours without a corresponding active mission in `hive-status.md` is considered stale and should be investigated before deletion.

---

## Design Notes

- **One trace per phase, not per file changed.** Traces mark pipeline stages, not individual actions.
- **Traces are write-once.** Once written, a trace is never modified. If a phase needs to be re-done (retry), delete the old trace and write a new one.
- **Traces complement, not replace, the blackboard.** The trace says "I'm done." The blackboard says "here's what I did." Both are needed.
- **Traces are cheap.** A single JSON line per file. No parsing overhead, no schema validation at read time.
- **No polling loops.** In Claude Code teams, agents are message-driven. The trace check happens once when the agent starts. If the trace isn't there, the orchestrator/human sequences the work correctly.
