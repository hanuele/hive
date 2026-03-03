# Example Mission: Error Handling Audit

> A complete worked example of a Research Squad mission, from Commander's
> Intent through findings, synthesis, and retrospective. Study this to
> understand what a successful mission looks like before running your own.

## What happened

A team needed to understand their web application's error handling patterns
before a refactoring sprint. They spawned a 3-agent Research Squad:

- **Orchestrator** (sonnet) — framed the mission, synthesized findings
- **investigator-alpha** (sonnet) — depth-first analysis of core error paths
- **investigator-beta** (sonnet) — breadth-first scan across all modules

The mission took ~8 minutes and cost approximately 250K tokens total.

## Files in this example

| File | What it shows |
|------|--------------|
| [`blackboard.md`](blackboard.md) | The completed blackboard — Commander's Intent, findings from both investigators, synthesis, checkpoints, and patterns |
| [`retrospective.md`](retrospective.md) | The post-mission retrospective — what went well, what surprised the team, candidate patterns |

## How to read this

1. **Start with the Commander's Intent** — notice how specific the "Why",
   "Premises to question", and "Consequences of failure" are. Vague intents
   produce vague findings.

2. **Read the Findings section** — each finding has a timestamp, agent name,
   confidence score, and source. Notice how alpha (depth) and beta (breadth)
   found different things.

3. **Read the Synthesis** — notice the CONSENSUS / MAJORITY / CONTESTED / GAPS
   structure. The Orchestrator doesn't average the findings; they categorize
   agreement levels.

4. **Read "Observations Without Category"** — these pre-conceptual noticings
   often contain seeds of the most important patterns.

5. **Read the Retrospective** — "What Surprised Us" is reviewed first. The
   candidate pattern at the bottom will be tracked across future missions.

## What traces looked like

During the mission, agents wrote trace files to signal phase completion:

```
memory/active/traces/error-handling-audit-alpha-finding_submitted.trace
memory/active/traces/error-handling-audit-beta-finding_submitted.trace
memory/active/traces/error-handling-audit-synthesis_complete.trace
```

Each trace is a single JSON line:
```json
{"ts":"2026-03-15T14:22:00Z","mission":"error-handling-audit","agent":"investigator-alpha","action":"finding_submitted","detail":"6 findings submitted to blackboard"}
```

After the mission, traces are archived to `memory/archive/traces/error-handling-audit/`.
