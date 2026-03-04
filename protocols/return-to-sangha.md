# Return to Sangha — Context Renewal Protocol

> The sangha (shared memory on disk) persists; individual agents cycle through it.
> No agent is permanent. The work is permanent.

## Philosophy

Claude Code auto-compacts conversations at ~83.5% of the 200K token context window.
This is a blunt summarization that loses nuance — decisions, reasoning chains, and
partial findings vanish. The Hive and solo sessions both suffer.

**Return to Sangha** shifts context management from reactive (recover after compaction)
to proactive (make compaction irrelevant). Agents write their wisdom to shared memory
*before* it can be lost, and fresh agents emerge from the sangha to continue the work.

The protocol has three components:

1. **Living Baton** — event-driven writes to disk on meaningful events
2. **Budget Tracker** — early-warning heuristic for context exhaustion
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
| Trigger | Every 3 findings / 15 turns | Every meaningful event |
| Written by | Individual agent | Orchestrator (Hive) or solo agent |

---

## Component 2: Budget Tracker

A bash script (`scripts/context-budget.sh`) that tracks turn count and cumulative
file sizes read. Returns approximate zone indicators. Not precise — there is no API
for exact context usage — but provides useful time pressure signals.

### Zones

| Zone | Solo Turns | Subagent Turns | Orchestrator Turns | Behavior |
|------|-----------|---------------|-------------------|----------|
| GREEN | 0-30 | 0-15 | 0-25 | Normal. Standard checkpoint frequency. |
| YELLOW | 30-45 | 15-22 | 25-38 | Heightened. Checkpoint after every decision. Announce to user. |
| RED | 45-55 | 22-28 | 38-48 | Finalize baton. Recommend relay. No new large reads. |
| CRITICAL | 55+ | 28+ | 48+ | Compaction imminent. Immediate relay or re-read baton. |

Zone = MAX(turn-based zone, file-size-based zone). Thresholds are conservative
approximations, calibrated over time via crystallization protocol.

### Usage

```bash
# Initialize
bash scripts/context-budget.sh init <agent-id> --profile solo|subagent|orchestrator

# After each major operation
bash scripts/context-budget.sh tick <agent-id> --files-read <bytes>

# Check current zone
bash scripts/context-budget.sh check <agent-id>

# Visual status
bash scripts/context-budget.sh render <agent-id>
bash scripts/context-budget.sh render-all

# Cleanup
bash scripts/context-budget.sh reset <agent-id>
```

### Zone behaviors

**YELLOW:**
- Announce: "Context budget at YELLOW. Baton is current."
- Checkpoint after every decision (not just every 3 findings)
- Consider whether current task can complete before RED

**RED:**
- Announce: "Context budget at RED. Baton ready at [path]. Recommend relay."
- No new large file reads (each read accelerates toward CRITICAL)
- Finalize baton with all current state
- Hive: Orchestrator decides relay strategy (hot-swap, phase-gated, or orchestrator relay)
- Solo: Recommend fresh session with baton path

**CRITICAL:**
- Compaction may fire at any moment
- If still in session: immediately re-read baton from disk
- Treat disk as sole source of truth

---

## Component 3: Hierarchical State Machine

Structured tracking of mission progress. JSON source of truth with markdown render
on the blackboard.

### State file

Location: `memory/active/{mission}-state.json`

```json
{
  "mission": "kan-xxx-feature",
  "state": "active",
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

When budget tracker signals YELLOW (~60-75% estimated):
1. Announce to user
2. Increase checkpoint frequency
3. If continuing past YELLOW, run `/compact focus on [current task context]`
   with state already safely on disk

### Layer 3 — Baton Restart (RED zone)

When budget tracker signals RED (~75-85% estimated):
1. Finalize the baton
2. Recommend fresh session: "Context budget at RED. Baton ready at [path].
   Recommend: start fresh session with 'Resume from baton at [path]'."

### Layer 4 — Safety Net

If compaction fires despite protocol:
1. Re-read baton from disk
2. Re-read current state section of blackboard/session log
3. Continue from disk state — never from conversation memory

---

## Hive Mission Procedure — Orchestrator Decides

The Orchestrator monitors the state machine and budget trackers, choosing the
appropriate relay strategy:

### Individual hot-swap

Agent writes checkpoint, shuts down, fresh replacement spawned from baton.
Used when one agent approaches limits mid-phase.

```
1. Agent signals RED zone
2. Orchestrator writes agent's baton to blackboard
3. Agent shuts down (shutdown_request)
4. Orchestrator spawns fresh agent with baton-enriched prompt
5. Fresh agent reads baton, continues from last checkpoint
```

### Phase-gated restart

Whole squad completes current phase, all checkpoint, fresh squad for next phase.
Used when 2+ agents approaching limits near a phase boundary.

```
1. Orchestrator detects multiple agents at YELLOW/RED
2. Current phase completes (or time-boxed)
3. All agents write final checkpoints
4. All agents shut down
5. Fresh squad spawned for next phase, reading from blackboard
```

### Orchestrator relay (special case)

If the Orchestrator itself approaches RED:
1. Write comprehensive baton (Commander's Intent + all state + next steps)
2. Shut down all agents
3. Request human intervention to start a fresh session
4. **This is the one relay that cannot be automated**

---

## Subagent Procedure

Every spawn prompt includes a `## CRITICAL: Context Budget` section:

```markdown
## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init {agent-id} --profile subagent

After each major operation (file read, web fetch, multi-step analysis):
  bash scripts/context-budget.sh tick {agent-id} --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard.

Use max_turns appropriate to your profile to prevent runaway consumption.
```

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
| Ignoring budget tracker | "It's just a heuristic" — but it's the only early warning | Initialize at start, tick consistently |
| Reconstructing from memory after compaction | Memory is unreliable post-compaction | Re-read from disk — disk is truth |
| Skipping baton for "simple" tasks | Simple tasks grow. The baton costs one Write call. | Always maintain baton |
| Large file reads at RED | Each read accelerates toward CRITICAL | Defer reads or read minimal sections |
| Fresh agent ignoring baton | "I'll figure it out" — wastes context rediscovering | Read baton first, then verify |

---

## Calibration

Budget thresholds are conservative initial estimates. Calibrate via crystallization:
- If agents relay too early (wasted capacity) → raise thresholds
- If compaction hits despite RED zone → lower thresholds
- Track zone_change events across 3+ missions to identify systematic bias
- File size thresholds depend on average file sizes in the project — calibrate per codebase

---

## Edge Cases

- **Orchestrator runs out of context:** Only relay requiring human intervention.
  Writes baton, shuts down squad, requests fresh session.
- **Fresh agent can't read baton:** Falls back to Commander's Intent + Findings +
  Decisions. Logs as L2 failure.
- **State machine out of sync:** Scrum Master detects mismatch. Regenerate from
  blackboard. L1 failure logged.
- **Budget thresholds wrong:** Calibrated over 3+ missions via crystallization.

---

## Related Protocols

| Protocol | Relationship |
|----------|-------------|
| `checkpoint.md` | Checkpoint is for same-agent recovery; baton is for cross-agent relay. YELLOW zone triggers increased checkpoint frequency. |
| `crystallization.md` | Budget thresholds are calibrated via crystallization across missions |
| `mission-cleanup.md` | State and budget files archived after mission completion |
| `agent-shutdown.md` | Relay sequence includes shutdown; baton must be written before shutdown_request |
| `context-preservation.md` | Return to Sangha extends the original context preservation rules |
