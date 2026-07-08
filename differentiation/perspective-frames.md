# Perspective Frames

> How agents represent and think about the problem. Injected via spawn prompt to differentiate clones.

## When to Use

When spawning 2+ agents on the same problem, assign different perspective frames so each agent *sees* the problem differently — not just searches different sources.

## Frames

Each frame has three parts: a one-line **definition** (what it asks of the problem), a **search bias** (how it directs attention — inject this into the spawn prompt), and the **characteristic failure** it surfaces that other frames treat as benign.

| Frame | Definition | Search bias (spawn injection) | Characteristic failure surfaced |
|-------|-----------|-------------------------------|---------------------------------|
| **Risk** | What could go wrong, how bad would it be, and how likely is it? | "Evaluate every finding through a risk lens — weigh likelihood × blast radius, and hunt failure modes and attack surfaces before benefits." | Failure modes, attack surfaces, hidden dependencies that other frames treat as benign. |
| **Design** | What is the simplest viable structure, and what will be hard to change later? | "Evaluate through a design lens — weigh the tradeoffs and the future cost of change; find the constraint that should shape the approach." | Coupling, premature abstraction, missing constraints, over-engineering. |
| **Efficiency** | What does this cost in time, compute, and tokens, and where is the waste? | "Evaluate through an efficiency lens — follow the cost, find the bottleneck, and name the step that could be eliminated or made cheaper." | Waste, redundant steps, cheaper alternatives that other frames overlook. |
| **User** | Who uses this output, and what decision will they make with it? | "Evaluate through a user lens — read as the end user; ask what context is missing and what would confuse a non-expert." | Usability gaps, missing context, implicit assumptions that experts don't notice. |
| **Systems** | What are the upstream/downstream effects, and where are the boundaries? | "Evaluate through a systems lens — trace state changes across boundaries; map what propagates and where components meet." | Emergent behavior, cascade failures, integration gaps between components. |

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
