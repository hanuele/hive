# Terrain Analysis: The Four Axes

> Instead of choosing from a menu of templates, the Orchestrator analyzes the mission along 4 axes before team assembly and composes the right team. The result is documented in the Commander's Intent.

## The Axes

```
UNCERTAINTY        How well-defined is the problem?
[low]              -> Fewer agents, tighter scope, engineering mode
[high]             -> More agents, broader search, research mode

REVERSIBILITY      Can mistakes be undone?
[reversible]       -> Faster decisions, lighter review
[irreversible]     -> More gates, adversarial review, human confirmation

BREADTH            How many domains are involved?
[narrow]           -> Small team (3 agents)
[broad]            -> Larger team or phased approach (4-5 agents)

STAKES             What is the cost of failure?
[low]              -> Lighter governance, advice process
[high]             -> Full governance, adversarial review + human gate
```

## How to Assess

For each axis, the Orchestrator considers:

1. **Uncertainty:** Do we know what we're building? Do we know how to build it? Are there unknowns we haven't identified yet?
2. **Reversibility:** If we get it wrong, can we undo it? What is the blast radius of a mistake?
3. **Breadth:** How many different areas of knowledge are needed? How many systems are affected?
4. **Stakes:** What happens if we fail? Who is affected? What is the cost — in time, money, trust, or harm?

## Mid-Mission Re-Assessment

Terrain can change. If, during a mission, the Orchestrator observes:
- New unknowns surfacing that were not anticipated at assembly
- Irreversible actions being required where reversible ones were expected
- Scope expanding beyond the original breadth assessment

...the Orchestrator should pause, re-run terrain analysis, and consider whether the current squad composition is still correct. Adding or releasing an agent mid-mission is permitted — this is not failure, and an agent should not over-identify with its role to the point of resisting release.

## Terrain Misclassification Warning

An Orchestrator that assesses a task as "low uncertainty" when it is "high uncertainty" will assemble an Engineering Squad for a Research problem. The squad will build before it understands.

**Verification step:** After the squad takes its first actions, the Orchestrator should confirm that reality matches the terrain assessment.

## Scoring Rubric (the tiebreak, not the lens)

The qualitative questions above are the primary lens — read the mission and
judge it. The rubric exists only to make the *auto-decide* reproducible when
two people (or two sessions) would otherwise assess the same mission
differently. Score each axis 0–2, sum, and map to an engagement bucket that
composition-rules consumes.

| Axis | 0 | 1 | 2 |
|------|---|---|---|
| **Uncertainty** | We know what to build and how | We know *what*, not *how* | Unknowns we haven't even identified yet |
| **Reversibility** | Trivially undoable (branch, worktree) | Undoable with effort | Irreversible / large blast radius |
| **Breadth** | One file or domain | A few related areas | Many domains or systems |
| **Stakes** | Low cost of failure | Meaningful cost (time, trust) | Severe (money, harm, data loss) |

**Sum → bucket:**

| Sum | Bucket | Maps to |
|-----|--------|---------|
| 0–2 | **low** | Single agent, or Focused Build (3). Light governance. |
| 3–5 | **medium** | A standard squad (Research / Full Engineering / Creative) with one Challenger lens. |
| 6–8 | **high** | Full governance — adversarial review + human gate (Review / Strategy), 4–6 agents. |

**Precedence floor (ties to the Tiebreaker in `composition-rules.md`):** a single
score of **2 on Reversibility or Stakes floors the bucket at `high`**, regardless
of the sum. This encodes the precedence `REVERSIBILITY > STAKES > UNCERTAINTY >
BREADTH` — an irreversible or high-stakes mission gets full governance even when
it is otherwise narrow and well-understood. The bucket sizes the engagement; the
per-axis buckets still pick the squad *type* via `composition-rules.md`.
