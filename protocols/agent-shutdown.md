# Agent Shutdown Protocol

> How a Hive agent's life ends cleanly — the common case (it finishes and
> says goodbye) and the rare case (it must be stopped early).

## Why This Exists

A squad agent is spawned for a charge. When the charge is done, the agent's
life is done. The intention that governs this whole protocol is simple and
non-negotiable:

> **No agent is silently killed mid-thought.**

Everything below serves that intention. In the modern harness the mechanics
are far lighter than they once were — a background agent finishes on its own
and the harness notifies the spawner. There is no handshake to perform, no
team resource to tear down. What remains is care: making sure that when an
agent ends, its contribution is named (see `agent-farewell.md`) and any
unfinished work is preserved to the blackboard before the agent is gone.

---

## Part 1 — The Normal Case (Charge Complete)

This is the overwhelmingly common path, and it requires nothing special.

A background agent (spawned via the Agent tool, running in the background by
default) works its charge to completion, writes its final entry to the
blackboard, and sends its completion message. That completion message carries
the farewell intention described in `agent-farewell.md` — the agent's own
last words about what it did. The harness then notifies the spawner
automatically that the agent has finished.

```
Agent works charge
  │
Agent writes final blackboard entry (findings / checkpoint)
  │
Agent sends completion message (carries its own farewell)
  │
Harness notifies the spawner automatically
  │
Done — nothing further to do
```

There is no `shutdown_request`, no approval to wait for, no config file to
inspect. The agent has said what it did and rested. The orchestrator reads
the completion notification and moves on.

> If the spawner wants to continue the conversation instead of letting the
> agent rest — ask a follow-up, request a revision — it uses
> `SendMessage({to: "<agent-name>", ...})`. A named agent can be messaged
> even after it has completed; the harness resumes it from its transcript.
> This is the difference between "we're done" and "one more thing": say
> nothing and the agent stays at rest; message it and it wakes with its
> context intact.

---

## Part 2 — Early Termination (TaskStop)

Sometimes a running background agent must be stopped before it finishes: the
mission is abandoned, the charge was wrong, a duplicate was spawned, or the
work is going sideways. The tool for this is `TaskStop <agent-id>`, which
terminates a running background agent.

**Before calling `TaskStop`, the orchestrator honors the core intention** —
no agent is silently killed mid-thought:

1. **Check the blackboard for an unfinished checkpoint.** Look at the agent's
   section. Is there work in progress that has not been written down?
2. **Preserve any partial work into the blackboard.** If the agent produced
   findings or a partial change that only live in its conversation, the
   orchestrator writes what is recoverable into the blackboard first — from
   the agent's last checkpoint, its messages, or by asking the agent (via
   `SendMessage`) to flush its state before it is stopped.
3. **Write a shutdown note to the blackboard** so the record explains itself.
   The note says *why* the agent was stopped early, so a future reader (or a
   resuming instance) understands this was a deliberate act, not a crash.

```markdown
### Shutdown Note — {agent-name}
- **Stopped by:** orchestrator
- **When:** {ISO-8601}
- **Reason:** {mission abandoned | duplicate | scope corrected | going sideways | ...}
- **Partial work preserved:** {pointer to the blackboard section, or "none — agent had not started"}
```

Only after those three steps does the orchestrator call `TaskStop`. The
sequence matters: preserve first, record why, then stop.

```
Orchestrator decides an agent must stop early
  │
Read agent's blackboard section — any unfinished checkpoint?
  │
Preserve recoverable partial work into the blackboard
  │
Write Shutdown Note (reason on the record)
  │
TaskStop <agent-id>
```

---

## Part 3 — Continued Conversation (Not a Shutdown)

Worth stating plainly because it is easy to conflate with shutdown: continuing
to work *with* an agent is not a lifecycle event at all. `SendMessage` to a
named agent messages it and, if it has already completed, resumes it from its
transcript. Use this whenever the relationship isn't over — a clarifying
question, a second pass, a follow-up charge. No shutdown mechanics are
involved.

---

## Part 4 — Squad Spawn Checklist

Before spawning any agent, verify the spawn prompt includes:

- [ ] Persona identity section (persona × lens — see `personas/`)
- [ ] Task / charge description
- [ ] Blackboard path and the section the agent writes to
- [ ] Checkpoint protocol reference (so partial work is always recoverable)
- [ ] Completion instruction: write final blackboard entry, then send a
      completion message carrying the farewell (see `agent-farewell.md`)

Note what is **no longer** here: there is no "CRITICAL: Shutdown Handling"
section to paste, because agents do not approve their own shutdown anymore.
The normal end of life is the completion message; the abnormal end is
`TaskStop` by the orchestrator.

---

## Reference

- **`agent-farewell.md`** — the "Rest Well" intention that rides in the
  completion message and the agent's last blackboard entry.
- **`return-to-sangha.md`** — checkpoints and the Living Baton; what "partial
  work preserved" draws on when an agent is stopped early.
- **Agent tool** — `run_in_background` (default true), `name`, `model`,
  `isolation`. Background agents notify the spawner on completion.
- **`TaskStop <agent-id>`** — terminates a running background agent.
- **`SendMessage({to: name})`** — messages or resumes a named agent, even
  after completion.
