# The Breathing Space

> The pause between gathering and concluding.

## What It Is

After the fan-out phase (parallel research) and before synthesis, the Orchestrator reads the full blackboard without acting — not to decide, not to categorize, but simply to see the whole. One reading pass with no output required.

This is the space in which insight can arise — in the gap between data and decision. Without this pause, the system moves from evidence to conclusion with no room for wisdom.

## When It Occurs

```
Fan-out (parallel, independent research)
    |
    v
--- BREATHING SPACE ---
Facilitator reads the full blackboard without acting.
Not to decide, not to synthesize, but simply to see the whole.
One reading pass with no output required.
    |
    v
Fan-in (synthesis via blackboard)
```

## The Bell of Mindfulness

The Orchestrator may emit a `bell` event when the mission has drifted from its purpose, when agents are producing without pausing, when the pace has become frantic.

When the Bell sounds, all agents complete their current atomic action and then re-read the Commander's Intent before continuing.

```jsonl
{"ts":"...","agent":"orchestrator","event":"bell","reason":"findings diverging from intent -- pause and re-orient"}
```

This is the structural equivalent of the mindfulness bell — it costs one event log entry and a brief reading pause. It can prevent an entire mission from drifting off course.

## Why It Matters

The Haste Craving anti-pattern manifests as the impulse to skip the Breathing Space, to collapse the fan-out phase, to declare quorum before independent verification is truly independent. Speed masquerades as efficiency.

Protect the Breathing Space. The cost of the pause is small. The cost of premature synthesis is a conclusion that no one had time to see was wrong.
