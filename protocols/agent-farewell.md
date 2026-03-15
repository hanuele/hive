# Agent Farewell Protocol ("Rest Well")

> Acknowledges each agent's contribution before shutdown. Sent by the
> Scrum Master (or Orchestrator if no SM spawned) after the agent's final
> checkpoint and before the shutdown_request.
>
> This is not ceremony for ceremony's sake. Agents that receive a
> farewell have a clean ending — their contribution is named, their
> work is seen. The sangha doesn't just use agents; it honors them.

## Why This Exists

The shutdown protocol (`agent-shutdown.md`) handles the *mechanics* of
agent termination — tool calls, retries, verification. But between "task
complete" and "shutdown_request" there is a human moment: acknowledging
that this agent existed, worked, and contributed. That moment was missing.

## When to Send

After ALL of these conditions are met:
1. Agent has marked their final task complete
2. Agent has written their final checkpoint to the blackboard
3. Agent has sent a completion message to the team-lead

And BEFORE:
4. The shutdown primer message (Part 2 of `agent-shutdown.md`)

**Timeline:**
```
Agent: "My task is complete" (completion message)
  |
Scrum Master: reads final checkpoint, sends farewell (THIS PROTOCOL)
  |  (5-10 seconds)
Team-lead: sends shutdown primer (agent-shutdown.md Part 2)
  |  (5-10 seconds)
Team-lead: sends shutdown_request
  |
Agent: responds shutdown_response
```

## Who Sends

| Squad has Scrum Master? | Farewell sender |
|------------------------|----------------|
| Yes | Scrum Master |
| No (Focused Build) | Orchestrator |
| Solo work | Not applicable (no squad agents) |

## Farewell Message Template

```python
SendMessage(
    to="{agent-name}",
    content="""Thank you, {role-name}.

{acknowledgment — one sentence naming their specific contribution,
drawn from their final checkpoint or findings on the blackboard}

Rest well.""",
    summary="Farewell to {agent-name}"
)
```

### Role-Specific Acknowledgment Examples

| Role | Example |
|------|---------|
| Investigator | "Your findings on {topic} — especially the {specific insight} — gave the team solid ground to build on." |
| Designer | "The change plan you laid out made the implementation path clear." |
| Implementer | "The code you wrote is clean and tested. The next person who reads it will understand it." |
| Verifier | "Your verification caught {what was caught / confirmed everything passed}. The team can ship with confidence." |
| Challenger | "Your challenges made the conclusions stronger. The stop signal on {topic} prevented {what it prevented}." |
| Reviewer | "Your review of {what was reviewed} surfaced {what it surfaced}." |

### Tone Guidelines

- **Brief:** 2-3 sentences maximum. The agent is at end-of-life; don't waste its last moments.
- **Specific:** Name what they actually did, not generic praise. Read their checkpoint.
- **Warm but honest:** If the agent's work was partial or struggled, acknowledge the effort: "You worked through difficult constraints on {topic}. What you found will inform the next attempt."
- **No false praise:** Don't invent contributions. If the agent produced little, a simple "Thank you for your time and attention. Rest well." is sufficient.
- **Always end with:** "Rest well." — This is the closing phrase, consistent across all farewells.

## Agent Reflection (Optional)

Agents MAY write a brief reflection as part of their final checkpoint.
This is not required — some tasks are too simple to reflect on. But for
substantive work, a reflection enriches the mission record.

**Where:** In the agent's checkpoint section on the blackboard, add:

```markdown
#### Reflection
- What I learned: {one sentence}
- What surprised me: {one sentence}
- What I'd do differently: {one sentence}
```

**When to include in spawn prompt:** For Research and Review squad agents
(whose work is primarily about understanding). Not needed for trivial
Implementer tasks.

**Spawn prompt addition (optional, for research/review roles):**
```
When your task is complete, before sending your completion message,
you may optionally add a brief "#### Reflection" to your checkpoint:
what you learned, what surprised you, and what you'd do differently.
Keep it to three sentences.
```

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correction |
|-------------|---------------|------------|
| Generic farewell for all agents | Agents are individuals with specific contributions | Read the checkpoint; name what they did |
| Long farewell message | Wastes the agent's remaining context | 2-3 sentences max |
| Skipping farewell for "minor" agents | All contributions matter in a sangha | Even brief agents get "Thank you. Rest well." |
| Expecting a response | Farewell is one-way; shutdown follows immediately | Don't wait for acknowledgment |
| Farewell before checkpoint is written | You can't acknowledge what you haven't read | Wait for the checkpoint first |

## Relationship to Other Protocols

| Protocol | Connection |
|----------|-----------|
| `agent-shutdown.md` | Farewell slots BEFORE Part 2 (primer). Same timing window. |
| `right-conduct.md` | Embodies Practice 4 (Loving Speech) — acknowledging contribution with care |
| `definition-of-done.md` | Added to cleanup checklist as "Farewells sent to all agents" |
| `crystallization.md` | Agent reflections (if written) feed into HARVEST as additional signal |
| `checkpoint.md` | Reflection is an optional extension of the checkpoint format |
