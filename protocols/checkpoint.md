# Checkpoint Protocol

> Lightweight write-to-disk protocol for externalizing working state mid-task.

## When to Checkpoint

- After forming a key conclusion
- After accumulating 3+ unwritten findings
- Before any long tool operation (multi-file edit, test suite, web fetch)
- When conversation feels long (15+ turns without a disk write)

## Where to Write

Blackboard `## Current State` → `### Agent Checkpoints` section.

## Format

```
[HH:MM] {agent} CHECKPOINT:
- Key conclusion: {summary}
- Working hypothesis: {current best guess}
- Next step: {what you plan to do next}
- Unwritten findings: {count remaining}
```

## Rules

1. **Checkpoints are overwritten.** Only the latest checkpoint per agent
   matters. Write over your previous checkpoint — do not accumulate them.
2. **Findings are append-only.** Findings go in `## Findings`, not in the
   checkpoint. The checkpoint tracks your *state*, findings track your *output*.
3. **Checkpoints are cheap.** One Write call per 3 findings is negligible
   overhead. Err on the side of writing too often, not too rarely.
4. **After context contraction:** Re-read the blackboard's `## Current State`
   section. Your checkpoint is the ground truth, not your recollection.
5. **YELLOW zone rule:** When the budget tracker signals YELLOW, checkpoint
   after *every* decision — not just every 3 findings. This is the transition
   from standard to heightened checkpoint frequency.

## Example

```markdown
### Agent Checkpoints

[14:32] investigator-alpha CHECKPOINT:
- Key conclusion: Alpha Vantage covers 45/60 required fields
- Working hypothesis: Missing fields can be supplemented from SEC filings
- Next step: Cross-reference SEC XBRL tags against missing field list
- Unwritten findings: 2
```

## Relationship to Return to Sangha

Checkpoints and the Living Baton serve different purposes:

- **Checkpoint:** Your working state for *yourself* after context contraction.
  Written to `### Agent Checkpoints`. Overwritten each time.
- **Living Baton:** Relay state for a *different agent* who has never seen your
  conversation. Written to `## Relay Baton`. Updated on meaningful events.

Both use the blackboard. Both survive context contraction. But the checkpoint is
a snapshot of where you are; the baton is a handoff of everything a successor needs.

At YELLOW zone, both should be updated more frequently. At RED zone, finalize the
baton — a fresh agent may need to take over. See `protocols/return-to-sangha.md`.
