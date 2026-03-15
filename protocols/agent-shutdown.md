# Agent Shutdown Protocol

> Reliable agent shutdown for Hive squad missions.
> Addresses ERR-008: agents going idle instead of responding to shutdown_request.

## Why This Exists

During hello-world smoke tests, agents went idle instead of approving `shutdown_request` — requiring 2-3 manual retries. Root cause analysis (agent-shutdown-research mission, 2026-03-03) identified three causes that must be treated INDEPENDENTLY:

| Failure Mode | Root Cause | Mitigation |
|---|---|---|
| A: Agent receives message, responds with text instead of tool call | Spawn prompt gap — persona verbal bias + missing explicit instruction | Add CRITICAL: Shutdown Handling section to spawn prompt |
| B: Agent receives message but is past turn boundary (idle) | Idle-state lifecycle — agent finished turn before message arrived | Send shutdown BEFORE agent goes idle; add shutdown reminder message |
| C: Message never delivered (in-process) | Timing/queue issue — message sent while agent mid-turn | Retry strategy with backoff |

> **Note (Challenger STOP-4):** The specific failure mode in hello-world smoke tests was not instrumented. All three mitigations are included because the failure mode is uncharacterized. Once a controlled test is run (see Part 6), unnecessary mitigations can be removed.

---

## Part 1 — Spawn Prompt Template

**Every agent spawn prompt MUST include this section verbatim (adapt only the text after the colon on the first line):**

```
## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.
```

**Placement:** After persona identity section, before task description. This ensures it is read before the agent begins task-focused work.

---

## Part 2 — Farewell & Shutdown Primer

> **Before** sending the shutdown primer below, the Scrum Master (or
> Orchestrator) sends a farewell message per `protocols/agent-farewell.md`.
> The farewell acknowledges the agent's specific contribution. Wait 5-10
> seconds after the farewell before sending the primer.

Before sending `shutdown_request`, send a **shutdown primer** to the agent. This serves two purposes:
1. Re-activates a potentially idle agent (triggers a new turn)
2. Refreshes the shutdown instruction in the agent's active context window (mitigates STOP-5: spawn prompt recency fading)

**Primer message template:**

```
SendMessage(
    type="message",
    recipient="agent-name",
    content="Your tasks are complete. Thank you for your work. When you receive
             the shutdown_request that follows, please respond using the
             SendMessage tool with type='shutdown_response' and approve=True,
             passing the request_id from the message. Do NOT just acknowledge
             this in text — call the tool.",
    summary="Preparing for shutdown"
)
```

Wait 5-10 seconds after the primer before sending `shutdown_request`.

---

## Part 3 — Shutdown Timing

Send `shutdown_request` **while the agent is still in an active turn**, not after it has gone idle.

### Option A — Trigger on task completion (recommended)

Watch for the agent to mark its final task complete (status: "completed"). Send `shutdown_request` immediately:

```python
# After agent marks final task complete
SendMessage(
    type="shutdown_request",
    recipient="agent-name",
    content="All tasks complete. Please shut down gracefully."
)
```

### Option B — TeammateIdle hook

Configure a `TeammateIdle` hook to fire when the agent goes idle. Use exit code 0 to allow idle (natural completion), or send a `shutdown_request` message in the same turn:

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "matcher": ".*",
        "hooks": [{"type": "command", "command": "..."}]
      }
    ]
  }
}
```

Note: TeammateIdle fires before the agent's turn ends — this is the last safe interception point.

### Option C — Proactive self-shutdown (spawn prompt)

Include in the spawn prompt: "After completing all your tasks and writing your final checkpoint, send the team-lead a message that you are done. Then wait for a shutdown_request." This keeps the agent in a turn-receptive state.

---

## Part 4 — Retry Strategy

If no `shutdown_response` is received within 60 seconds of sending `shutdown_request`:

| Attempt | Wait | Action |
|---------|------|--------|
| 1 | 0s | Send shutdown_request |
| 2 | 60s | Resend shutdown_request with reminder |
| 3 | 60s | Resend with explicit instruction |
| After 3 | — | Proceed to cleanup; agent will time out naturally |

**Retry message template:**

```
Attempt 2: "You have work outstanding. Please respond to the shutdown request
by calling SendMessage with type='shutdown_response' and approve=True,
passing the request_id from the shutdown_request message."

Attempt 3: "Final reminder: call SendMessage(type='shutdown_response',
request_id='<id>', approve=True) to shut down cleanly. This is the last
request before timeout."
```

After 3 failed retries, the agent session will eventually terminate via the
5-minute heartbeat timeout. Proceed to `TeamDelete` — the agent is effectively
dead even if not cleanly shut down.

---

## Part 5 — Verification

After sending `shutdown_request` and receiving `shutdown_response`:

1. Check `~/.claude/teams/{team-name}/config.json` — the agent's entry should be removed.
2. If running in tmux: `tmux ls` — the agent's pane should no longer appear.
3. Only call `TeamDelete` after ALL agents have responded or timed out.

---

## Part 6 — Instrumented Test (Recommended Before Finalizing Protocol)

> Challenger STOP-4: The failure mode in hello-world smoke tests was uncharacterized. Run this test to identify which mitigation actually matters.

**Test procedure:**
1. Spawn one agent with the current spawn prompt template (WITH "## CRITICAL: Shutdown Handling" section)
2. Give it a trivial task (write one line to a file)
3. Wait for it to complete the task and go idle
4. Send a `shutdown_request`
5. Observe: does the agent respond with (a) text acknowledgment, (b) shutdown_response tool call, or (c) silence?

**If (a) text acknowledgment:** Spawn prompt section works but verbal bias (persona) is overriding. Add stronger framing ("This is a hard requirement — calling the tool is the ONLY valid response").

**If (b) tool call:** Protocol works. Spawn prompt section is sufficient.

**If (c) silence:** Delivery failure. Focus on timing (send while active, not idle) and primer message.

**Test result (2026-03-03):** (b) clean shutdown_response tool call on first attempt. Agent with spawn prompt CRITICAL section + scope constraint completed trivial task, sent completion message, went idle, received shutdown_request ~5s later, responded with shutdown_response in ~10s. No rogue task-seeking. This confirms spawn prompt section + scope constraint + prompt timing are sufficient for the common case. Delivery failure (mode C) was not observed. Protocol confidence upgraded from 0.70 to 0.85.

---

## Part 7 — Squad Template Checklist

Before spawning any agent, verify the spawn prompt includes:

- [ ] Persona identity section
- [ ] `## CRITICAL: Shutdown Handling` section (verbatim from Part 1)
- [ ] Task description
- [ ] Blackboard path
- [ ] Checkpoint protocol reference

---

## Reference

- **ERR-008**: `memory/active/error-catalog.md` — agent goes idle instead of shutdown_response
- **Research source**: `memory/active/blackboard/agent-shutdown-research.md` (confidence: 0.85, upgraded from 0.70 after Part 6 instrumented test passed — clean shutdown on first attempt)
- **Official docs**: https://code.claude.com/docs/en/agent-teams#limitations
- **Known platform issues**: GitHub #29163, #25131, #28552 (anthropics/claude-code)
