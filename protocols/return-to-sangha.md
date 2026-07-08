# Return to Sangha — Context Renewal Protocol

> The sangha (shared memory on disk) persists; individual agents cycle through it.
> No agent is permanent. The work is permanent.

## Philosophy

Claude Code auto-compacts a conversation when it approaches the end of its
context window — the exact fraction and the window size vary by environment
and change over time, so this protocol never hard-codes a number. What matters
is that compaction is a blunt summarization that loses nuance — decisions,
reasoning chains, and partial findings vanish. The Hive and solo sessions both
suffer.

**Return to Sangha** shifts context management from reactive (recover after compaction)
to proactive (make compaction irrelevant). Agents write their wisdom to shared memory
*before* it can be lost, and fresh agents emerge from the sangha to continue the work.

The protocol has three components:

1. **Living Baton** — event-driven writes to disk on meaningful events
2. **Zone Signal** — the environment's context-zone bridge if present, with a
   qualitative self-check as the always-available fallback
3. **Hierarchical State Machine** — structured tracking of mission/phase/agent states

---

## Component 1: Living Baton

The baton is always ready for relay. Written on every meaningful event — not on a
timer, not on a schedule, but when something worth preserving happens.

### What triggers a baton write

| Event | Example |
|-------|---------|
| Decision made | "Chose approach A over B because..." |
| Key finding | "Alpha Vantage covers 45/60 fields" |
| Phase transition | "Research complete, entering synthesis" |
| Hypothesis change | "Revised working hypothesis from X to Y" |
| Risk identified | "Migration may break backward compatibility" |
| Error resolved | "ERR-007 — reassigned to general-purpose" |

### Baton location

| Context | Location | Section |
|---------|----------|---------|
| Hive mission | Blackboard | `## Relay Baton` |
| Solo session | Session log | `## Relay Baton` |
| Subagent | Blackboard checkpoint | `### Agent Checkpoints` (enhanced) |

### Baton format (Hive)

See the blackboard template (`memory/active/blackboard/_template.md`) for the
full `## Relay Baton` section with all subsections.

### Baton format (Solo)

Add to the session log's body:

```markdown
## Relay Baton

### Mission Context
- Ticket: KAN-XXX
- Branch: feature/xxx
- Objective: {one sentence}

### Current Phase
{what we are doing and why}

### Decisions Made
- {decision}: {rationale}

### Key Findings
- {finding} (confidence: {0.0-1.0})

### What Was Tried and Failed
- {approach}: {why it failed}

### Next Steps
1. {immediate next action}
2. {after that}

### Files Modified This Session
- {file}: {what changed}

### Open Questions
- {question}
```

### Living Baton vs. Checkpoint

| Aspect | Checkpoint | Living Baton |
|--------|-----------|-------------|
| Purpose | Agent's working state | Relay state for a fresh agent |
| Audience | Same agent after compaction | A different agent who has never seen this conversation |
| Location | Blackboard `### Agent Checkpoints` | Blackboard `## Relay Baton` |
| Trigger | Every few findings, or when YELLOW-equivalent pressure appears | Every meaningful event |
| Written by | Individual agent | Orchestrator (Hive) or solo agent |

---

## Component 2: Zone Signal

There is no reliable way to hard-count context usage from inside a session, and
window sizes differ across environments (they range widely and change over
time). So the zone signal has one **primary** source and one **fallback**, and
you use whichever is available — never absolute token or turn counts.

### Primary — the environment's zone/trace bridge

If the environment surfaces context-zone transitions (in the author's setup
these appear as `zone_transition` events in `~/.claude/traces/{session_id}.jsonl`),
read them through `scripts/context-budget.sh` (the Protocol-OS bridge). The
script reports the current zone — `GREEN` / `YELLOW` / `RED` — or `UNKNOWN`
when no trace is present. This is an **optional environment integration**: when
the bridge is there it is the truth; when it isn't, the script reports `UNKNOWN`
and you fall back to the self-check below.

```bash
# Report the current zone for an agent (reads the trace bridge)
export SESSION_ID="{session-uuid}"
bash scripts/context-budget.sh check <agent-id>

# Visual status
bash scripts/context-budget.sh render <agent-id>
bash scripts/context-budget.sh render-all
```

### Fallback — qualitative self-check

When no zone bridge is present (`UNKNOWN`), read your own depth-of-context
symptoms instead of a counter. You are approaching the window's end when you
notice:

- You are re-reading files or re-deriving facts you already established
- Earlier decisions in the session feel hazy and you reach for the blackboard
  to recall them rather than remembering
- Your working set (files read, findings held, sub-results) is large relative
  to how the session began
- You catch yourself summarizing your own prior reasoning to keep it in view

Any of these is a YELLOW-equivalent signal: treat it as "finalize the baton
soon." Several of them together, or a genuine struggle to hold the thread, is
RED-equivalent: relay now.

### Zone behaviors

Whether the zone comes from the bridge or the self-check, the behavior is the
same. Zones are expressed as a *pressure level*, not a percentage or count —
the point is what you do, not a threshold you cross.

**YELLOW (pressure building):**
- Announce: "Context zone YELLOW. Baton is current."
- Checkpoint after every decision (not just every few findings)
- Consider whether the current task can complete before RED

**RED (near the window's end):**
- Announce: "Context zone RED. Baton ready at [path]. Recommend relay."
- No new large file reads (each read accelerates toward compaction)
- Finalize the baton with all current state
- Hive: Orchestrator decides relay strategy (hot-swap, phase-gated, or orchestrator relay)
- Solo: Recommend a fresh session with the baton path

**Compaction imminent / just fired:**
- If still in session: immediately re-read the baton from disk
- Treat disk as the sole source of truth

---

## Component 3: Hierarchical State Machine

Structured tracking of mission progress. JSON source of truth with markdown render
on the blackboard.

### State file

Location: `memory/active/{mission}-state.json`

### Ownership fields

Every state JSON includes mission ownership metadata written at creation:

| Field | Source | Fallback |
|-------|--------|----------|
| `initiator` | `hive.persona` in `.claude/settings.local.json` | OS username via `getpass.getuser()` |
| `initiated_at` | ISO-8601 timestamp at mission creation | -- |

These fields enable cross-human collaboration:
- `/hive-resume` shows who started the mission
- The staleness gate (10-minute threshold) prevents resuming missions
  actively being worked on by another human

```json
{
  "mission": "kan-xxx-feature",
  "state": "active",
  "initiator": "Peter",
  "initiated_at": "2026-03-04T10:00:00Z",
  "phases": [
    {
      "name": "research",
      "state": "complete",
      "agents": [
        {"name": "investigator-alpha", "state": "terminated"},
        {"name": "investigator-beta", "state": "terminated"}
      ]
    },
    {
      "name": "synthesis",
      "state": "active",
      "agents": [
        {"name": "orchestrator", "state": "active"}
      ]
    }
  ],
  "updated": "2026-03-03T14:30:00Z"
}
```

### States

| Level | States | Transitions |
|-------|--------|-------------|
| Mission | `planning → active → winding_down → relay → active → complete` | Orchestrator controls |
| Phase | `pending → active → complete` | Orchestrator controls |
| Agent | `ready → active → checkpointing → relaying → terminated` | Agent + Orchestrator |
| Agent (alt) | `ready → active → resting → terminated` | For agents that complete normally |

### Depth

Orchestrator decides depth at mission start:
- **2-level** (mission + agents): Simple missions, Focused Build
- **3-level** (mission + phases + agents): Complex missions, multi-phase squads

### Blackboard render

The Scrum Master renders the state machine to the blackboard's `## Relay Baton`
section under `### State Machine`. Format:

```markdown
### State Machine
| Level | Name | State |
|-------|------|-------|
| Mission | kan-xxx | active |
| Phase | research | complete |
|   Agent | investigator-alpha | terminated |
|   Agent | investigator-beta | terminated |
| Phase | synthesis | active |
|   Agent | orchestrator | active |
```

---

## Solo Session Procedure — Layered Defense

### Layer 1 — Living Baton (Always Ready)

Every meaningful event writes to the session log's `## Relay Baton` section.
The baton is always current. If the session ended right now, a fresh session
could resume from it.

### Layer 2 — Proactive Compact (YELLOW zone)

When the zone signal reads YELLOW (from the trace bridge, or from the
qualitative self-check when no bridge is present):
1. Announce to user
2. Increase checkpoint frequency
3. If continuing past YELLOW, run `/compact focus on [current task context]`
   with state already safely on disk

### Layer 3 — Baton Restart (RED zone)

When the zone signal reads RED:
1. Finalize the baton
2. Recommend fresh session: "Context zone RED. Baton ready at [path].
   Recommend: start fresh session with 'Resume from baton at [path]'."

### Layer 4 — Safety Net

If compaction fires despite protocol:
1. Re-read baton from disk
2. Re-read current state section of blackboard/session log
3. Continue from disk state — never from conversation memory

---

## Hive Mission Procedure — Orchestrator Decides

The Orchestrator monitors the state machine and the agents' zone signals,
choosing the appropriate relay strategy:

### Individual hot-swap

Agent writes checkpoint and completes; a fresh replacement is spawned from the
baton. Used when one agent approaches limits mid-phase.

```
1. Agent's zone signal reads RED
2. Orchestrator writes agent's baton to blackboard
3. Agent writes its final checkpoint and completes (see agent-shutdown.md)
4. Orchestrator spawns fresh agent with baton-enriched prompt
5. Fresh agent reads baton, continues from last checkpoint
```

### Phase-gated restart

Whole squad completes current phase, all checkpoint, fresh squad for next phase.
Used when 2+ agents approaching limits near a phase boundary.

```
1. Orchestrator detects multiple agents at YELLOW/RED
2. Current phase completes (or is time-boxed)
3. All agents write final checkpoints
4. All agents complete (or are stopped early per agent-shutdown.md)
5. Fresh squad spawned for next phase, reading from blackboard
```

### Orchestrator relay (special case)

If the Orchestrator itself approaches RED:
1. Write comprehensive baton (Commander's Intent + all state + next steps)
2. Let the squad's agents complete (TaskStop any still running, preserving
   their checkpoints per agent-shutdown.md)
3. Request human intervention to start a fresh session
4. **This is the one relay that cannot be automated**

---

## Subagent Procedure

Every spawn prompt includes a `## CRITICAL: Context Zone` section:

```markdown
## CRITICAL: Context Zone

If a zone bridge is available, read your zone through it:
  export SESSION_ID="{session-uuid}"   # if your environment surfaces it
  bash scripts/context-budget.sh check {agent-id}

If it reports UNKNOWN, use the qualitative self-check instead (re-reading files
you already read, hazy recall of earlier decisions, a large working set).

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
When compaction is imminent: stop new work, re-read your checkpoint from the
blackboard.
```

The spawner right-sizes each agent by choosing its **model and reasoning
effort** for the charge (a Haiku/Sonnet low-effort agent for a narrow lookup, a
Fable/Opus high-effort agent for deep synthesis) rather than by capping turns.
Match the tier to the work; that is the lever that keeps consumption
proportionate.

---

## Event Catalog

Events logged to `events.jsonl` (see `memory/event-schema.md`):

| Event Type | When | Agent |
|-----------|------|-------|
| `baton_written` | Living baton updated on blackboard/session log | Orchestrator / solo |
| `zone_change` | Budget tracker zone transition | Any |
| `relay_initiated` | Agent begins relay sequence (checkpoint → shutdown) | Any |
| `relay_complete` | Fresh agent has successfully resumed from baton | Any |
| `orchestrator_relay` | Orchestrator itself is relaying (requires human) | Orchestrator |

---

## Resume Procedure

When starting a fresh session and discovering stale missions in `active/blackboard/`:

### Automated path (recommended)

Run `/hive-resume`. The skill will:
1. Scan all non-template blackboards
2. Cross-reference hive-status.md, retrospectives, and state files
3. Classify each as CLEANUP_ONLY / COMPLETE_NEEDS_CLEANUP / INCOMPLETE
4. Archive completed missions automatically
5. Offer to re-spawn squads for incomplete missions with RESUMPTION CONTEXT

### Manual path

1. Read the blackboard's `## Relay Baton` section
2. Determine what phase the mission was in (from baton or state JSON)
3. Decide: resume (re-spawn squad) or abandon (archive with note)
4. If resuming: spawn agents with baton-enriched prompts that instruct them to read the blackboard first
5. If abandoning: archive blackboard to `archive/blackboard/` with an "Abandoned" status note

### Baton injection approach

Agents receive a short RESUMPTION CONTEXT section in their spawn prompt telling them:
- Where the blackboard is
- To read the Relay Baton section first
- To NOT repeat completed work
- To start from the baton's "Next Steps"

The blackboard itself carries the full state -- agents read it, rather than receiving it via prompt. This saves context budget.

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correct Approach |
|-------------|---------------|-----------------|
| Writing baton only at RED | Too late — compaction may have already fired | Write on every meaningful event |
| Ignoring the zone signal | "It's just a heuristic" — but it's the only early warning | Read the bridge if present; otherwise run the self-check |
| Reconstructing from memory after compaction | Memory is unreliable post-compaction | Re-read from disk — disk is truth |
| Skipping baton for "simple" tasks | Simple tasks grow. The baton costs one Write call. | Always maintain baton |
| Large file reads at RED | Each read accelerates toward compaction | Defer reads or read minimal sections |
| Fresh agent ignoring baton | "I'll figure it out" — wastes context rediscovering | Read baton first, then verify |

---

## Calibration

The zone behaviors are qualitative by design, so calibration is about the
*relay decision*, not about tuning a number:
- If agents relay too early (wasted capacity) → treat YELLOW-equivalent
  symptoms as "checkpoint more often," not "relay now"
- If compaction hits despite a RED read → relay sooner on the RED signal
- When the trace bridge is present, track its `zone_transition` events across
  3+ missions to see whether the qualitative self-check is leading or lagging
  the bridge, and adjust the self-check's sensitivity accordingly

---

## Edge Cases

- **Orchestrator runs out of context:** Only relay requiring human intervention.
  Writes baton, lets the squad complete (or stops it per `agent-shutdown.md`),
  requests fresh session.
- **Fresh agent can't read baton:** Falls back to Commander's Intent + Findings +
  Decisions. Logs as L2 failure.
- **State machine out of sync:** Scrum Master detects mismatch. Regenerate from
  blackboard. L1 failure logged.
- **No zone bridge available:** Expected in many environments — the qualitative
  self-check is the supported fallback, not a degraded mode.

---

## Related Protocols

| Protocol | Relationship |
|----------|-------------|
| `checkpoint.md` | Checkpoint is for same-agent recovery; baton is for cross-agent relay. YELLOW zone triggers increased checkpoint frequency. |
| `crystallization.md` | Relay decisions are reviewed via crystallization across missions |
| `mission-cleanup.md` | State and zone files archived after mission completion |
| `agent-shutdown.md` | Relay ends an agent's life; the baton (and any partial work) must be written before the agent completes or is stopped |
| `bootstrap/rules/context-preservation.md` | Return to Sangha extends the original context preservation rules |
