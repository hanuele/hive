# Perspective Frames

> How agents represent and think about the problem. Injected via spawn prompt to differentiate clones.

## When to Use

When spawning 2+ agents on the same problem, assign different perspective frames so each agent *sees* the problem differently — not just searches different sources.

## Frames

| Frame | When to Use | Spawn Prompt Injection | What It Surfaces |
|-------|------------|----------------------|-----------------|
| **Risk** | Security audits, migration reviews, credential handling | "Evaluate every finding through a risk lens — what could go wrong, what is the blast radius, what is the likelihood?" | Failure modes, attack surfaces, hidden dependencies that other frames treat as benign |
| **Design** | Architecture decisions, API design, schema changes | "Evaluate through a design lens — what is the simplest viable approach, what are the tradeoffs, what will be hard to change later?" | Coupling, premature abstraction, missing constraints, over-engineering |
| **Efficiency** | Performance optimization, cost reduction, pipeline streamlining | "Evaluate through an efficiency lens — what is the cost (time, compute, tokens), where are the bottlenecks, what can be eliminated?" | Waste, redundant steps, cheaper alternatives that other frames overlook |
| **User** | Feature design, documentation, visualization, error messages | "Evaluate through a user lens — who will use this output, what decision will they make with it, what would confuse them?" | Usability gaps, missing context, implicit assumptions that experts don't notice |
| **Systems** | Cross-service changes, data flow analysis, integration work | "Evaluate through a systems lens — what are the upstream/downstream effects, what state changes propagate, where are the boundaries?" | Emergent behavior, cascade failures, integration gaps between components |

## Combining with Search Heuristics

Perspective frames (how you *see*) are orthogonal to search heuristics (how you *search*). A risk frame + depth-first heuristic produces deep threat analysis. A risk frame + breadth-first heuristic produces wide attack surface mapping.

Assign both when differentiating clones:

```
"You are The Investigator with a risk perspective frame and depth-first search heuristic.
Focus deeply on the highest-risk finding rather than cataloging all risks."
```

## Relationship to Domain Lenses

Perspective frames are *general* (applicable to any domain). Domain lenses are *specialized* (security, performance, correctness). Use perspective frames when the problem is broad; use domain lenses when the problem is technical and the specialty matters.

## Source

Derived from terrain analysis axes (`terrain/analysis-axes.md`) and research squad cloning table (`squads/research-squad.md`).
