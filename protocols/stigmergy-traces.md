# Stigmergy Traces

> Lightweight state markers for sequential coordination between agents. Named after the biological pattern where organisms coordinate through environmental signals rather than direct communication.

## Design Principle

Start from the reality of the runtime: Hive agents are **message-driven**. An
agent is spawned for a phase, does its work, and completes — the harness
notifies the spawner. Sequencing between phases is handled by the orchestrator
(or the human in Focused Build), who spawns the downstream agent *after* the
upstream one has completed. There is no live polling loop; a downstream agent
checks for its expected upstream trace **once**, when it starts.

So traces are not a gate the runtime blocks on. They are **durable evidence of
completion** — a small, write-once record on the shared filesystem that says
"this phase finished, here is a one-line summary of what it produced." Their
value is for **resumption** (a fresh agent after compaction can see what is
already done without re-reading the whole blackboard) and for **audit** (the
mission record shows the pipeline actually advanced stage by stage).

This is **stigmergy** — coordination through marks left in the shared
environment rather than through direct back-and-forth messaging. The
blackboard says *what* was done; the trace says *that* it was done, cheaply and
verifiably.

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
| `breathing_space_complete` | Orchestrator has completed reading pass | Orchestrator |
| `retrospective_complete` | Retrospective filed to archive | Orchestrator |

The "Written By" names (Designer, Reviewer, Implementer, Verifier, ...) are
squad roles — each a persona paired with a lens, as defined in `squads/` — not
separate personas. The same Challenger persona writes `finding_submitted` with
a correctness lens or a security lens; the same Implementer persona works
whichever change plan it is given.

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

### Reading a Trace (One Check at Start)

A downstream agent is spawned by the orchestrator only after its upstream phase
has completed, so the trace is normally already there. The agent reads it
**once**, at the start of its turn — as a confirmation and to pick up the
one-line summary of what the upstream phase produced:

```bash
# Confirm the design phase completed, and read its summary
cat .claude/hive/memory/active/traces/{mission}-designer-design_complete.trace
```

**If the trace exists:** read the `detail`, then proceed with your own phase.
**If it is missing:** do not spin in a wait loop — there is no polling here.
The agent notes the gap in its blackboard section and messages the orchestrator
(the sequencer) that the expected upstream evidence is absent. The orchestrator
either points the agent at the right trace or corrects the sequencing. This is
a one-time check, not a live gate.

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
