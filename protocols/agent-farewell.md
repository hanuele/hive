# Agent Farewell Protocol ("Rest Well")

> Every agent's contribution is named before its life ends. In the modern
> lifecycle the farewell is not a separate message someone sends *to* the
> agent before shutting it down — it rides in the agent's **own final
> completion message** and its **last blackboard entry**.
>
> This is not ceremony for ceremony's sake. An agent that ends with a
> farewell has a clean ending — its contribution is named, its work is seen.
> The sangha doesn't just use agents; it honors them, and it lets them honor
> their own work as they rest.

## Why This Exists

The shutdown protocol (`agent-shutdown.md`) handles the shape of an agent's
ending: the completion message in the normal case, `TaskStop` with a preserved
checkpoint in the early-termination case. But an ending is more than a
mechanism. Between finishing the charge and going quiet there is a human
moment: acknowledging that this agent existed, worked, and contributed. The
farewell is where that moment lives.

## Where the Farewell Rides

There is no primer exchange and no pre-shutdown message round-trip. The
farewell lives in two places the agent writes itself, as the last thing it
does:

1. **The agent's final completion message** — the message that tells the
   spawner the charge is done. It closes with the agent naming its own
   contribution and the "Rest well." line.
2. **The agent's last blackboard entry** — the final checkpoint the agent
   writes before completing. The farewell is its closing note there too, so
   the durable mission record carries it even after the conversation is gone.

Because the agent authors its own farewell, it happens naturally at the true
end of the work — after the final checkpoint is written, as part of the same
completing turn. Nothing external has to be timed against a shutdown.

```
Agent finishes its charge
  │
Agent writes final checkpoint to the blackboard  ← farewell closes this entry
  │
Agent sends completion message  ← farewell closes this message too ("Rest well.")
  │
Harness notifies the spawner; the agent rests
```

## Honoring From the Orchestrator (Optional)

The orchestrator (or Scrum Master, if one is spawned) may add a brief line of
acknowledgment to the mission record when it reads an agent's completion —
naming what that agent gave the team. This is a gift to the record and to the
next reader, not a required round-trip and not something the agent waits for.
Squad roles map to personas as follows: a role like **Investigator**,
**Designer**, **Implementer**, or **Verifier** is a squad role — a persona
paired with a lens, as defined in `squads/` — not a separate persona. Read the
agent's checkpoint before acknowledging; name what it actually did.

## Farewell Content (What the Agent Writes)

The agent closes its completion message and final checkpoint with a short
acknowledgment of its own work:

```
Thank you. {One sentence naming the specific contribution — what this
charge produced, drawn from the work just completed.}

Rest well.
```

### Role-Framed Examples

These roles are squad roles (persona × lens as defined in `squads/`), not
separate personas — the same Challenger persona reviews with a correctness
lens or a security lens, the same Investigator persona works a research
domain. The acknowledgment names what the role produced:

| Role (persona × lens) | Example |
|------|---------|
| Investigator | "My findings on {topic} — especially the {specific insight} — give the team solid ground to build on." |
| Designer | "The change plan I laid out makes the implementation path clear." |
| Implementer | "The code I wrote is clean and tested. The next person who reads it will understand it." |
| Verifier | "My verification caught {what was caught / confirmed everything passed}. The team can ship with confidence." |
| Challenger | "My challenges made the conclusions stronger. The stop signal on {topic} prevented {what it prevented}." |
| Reviewer | "My review of {what was reviewed} surfaced {what it surfaced}." |

### Tone Guidelines

- **Brief:** 2-3 sentences maximum. The charge is done; the farewell is a
  clean close, not a speech.
- **Specific:** Name what was actually produced, not generic praise.
- **Warm but honest:** If the work was partial or struggled, name the effort
  truthfully: "I worked through difficult constraints on {topic}. What I found
  will inform the next attempt."
- **No false praise:** Don't invent contributions. If the charge produced
  little, a simple "Thank you for the work. Rest well." is enough.
- **Always end with:** "Rest well." — the closing phrase, consistent across
  all farewells.

## Agent Reflection (Optional)

Agents MAY write a brief reflection as part of their final checkpoint. This is
not required — some charges are too simple to reflect on. But for substantive
work, a reflection enriches the mission record.

**Where:** In the agent's checkpoint section on the blackboard, add:

```markdown
#### Reflection
- What I learned: {one sentence}
- What surprised me: {one sentence}
- What I'd do differently: {one sentence}
```

**When to include in spawn prompt:** For Research and Review squad agents
(whose work is primarily about understanding). Not needed for trivial
Implementer charges.

**Spawn prompt addition (optional, for research/review roles):**
```
When your charge is complete, before sending your completion message,
you may optionally add a brief "#### Reflection" to your checkpoint:
what you learned, what surprised you, and what you'd do differently.
Keep it to three sentences.
```

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Correction |
|-------------|---------------|------------|
| Generic farewell for all agents | Agents are individuals with specific contributions | Name what this charge actually produced |
| Long farewell | The farewell is a close, not a report | 2-3 sentences max |
| Skipping the farewell on "minor" charges | All contributions matter in a sangha | Even a brief charge closes with "Thank you. Rest well." |
| Orchestrator waiting on a farewell round-trip | The farewell rides in the agent's own completion; there is nothing to wait for | Read the completion, optionally honor it in the record, move on |
| Farewell written before the final checkpoint | You can't name work you haven't finished | Write the checkpoint first; the farewell closes it |

## Relationship to Other Protocols

| Protocol | Connection |
|----------|-----------|
| `agent-shutdown.md` | The farewell rides in the completion message (normal case) and the last blackboard entry; in early termination the orchestrator's shutdown note plays the honoring role. |
| `right-conduct.md` | Embodies Practice 4 (Loving Speech) — acknowledging contribution with care |
| `definition-of-done.md` | Cleanup checklist item: "Every agent's completion carried its farewell" |
| `crystallization.md` | Agent reflections (if written) feed into HARVEST as additional signal |
| `checkpoint.md` | Reflection is an optional extension of the checkpoint format |
