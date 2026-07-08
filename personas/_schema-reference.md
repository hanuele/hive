# Persona Schema Reference

> This is the YAML schema from the research phase, preserved for power users who want to understand the cognitive axes. **The active persona files use narrative format, not this schema.** This file exists for reference only.

## Cognitive Differentiation Axes

```yaml
persona:
  name: string
  version: string

  # Core identity
  archetype: "investigator | challenger | architect | innovator | orchestrator | scrum-master"
  thinking_style: "inductive | deductive | pragmatic | lateral | integrative | systematic"

  # Cognitive profile
  cognitive_axes:
    depth_vs_breadth: float  # -1.0 (deep specialist) to 1.0 (broad generalist)
    caution_vs_speed: float  # -1.0 (very cautious) to 1.0 (very fast)
    detail_vs_pattern: float # -1.0 (detail-focused) to 1.0 (pattern-focused)
    structure_vs_exploration: float  # -1.0 (highly structured) to 1.0 (exploratory)

  # Behavioral constraints
  rules:
    max_count: 6  # was 5 (working-memory research); raised to 6 — see note below
    items: list[string]

  # Self-awareness
  blind_spots: list[string]
  escalation_conditions: list[string]
```

## A note on `max_count` vs. the live personas

The original schema capped rules at 5, citing working-memory research. The active
narrative personas have since drifted past it: the Investigator and Challenger
carry 6 rules, and the Orchestrator carries 7. Rather than pretend the cap holds,
this reference now documents `max_count: 6` and names the tension honestly.

Two things reconcile the drift. First, the personas are *narrative*, not YAML —
the rules are read as a coherent stance, not memorized as independent slots, so
the working-memory ceiling that motivated "5" applies less forcefully (see below).
Second, the Orchestrator's 7 is a genuine outlier worth watching: if its rule list
keeps growing, that is a signal to split the role, not to keep raising the cap. The
number is guidance for keeping a persona legible in ~30 seconds, not a hard limit.

## Why Narratives Over YAML

Research shows "explain why" reasoning creates more robust differentiation than trait lists (Anthropic character training research). The persona should be readable by a human in 30 seconds.

Key findings:
- Narrative personas generalize better to novel situations
- YAML-configured agents tend toward checklist compliance rather than genuine reasoning
- "Why you think this way" produces more consistent behavior than "what you score on these axes"

## Differentiation When Cloning

When cloning a persona for multiple instances (e.g., 3 Investigators on the same team), differentiate by injecting a single axis into the spawn prompt (not the base persona):

| Axis | Mechanism | Example |
|------|-----------|---------|
| **Perspective frame** | Different problem lens | "See this as a risk problem" vs "See this as a design problem" |
| **Search heuristic** | Different strategy | Depth-first vs breadth-first vs contrarian |
| **Information asymmetry** | Different reference docs | Agent A reads Guidelines, Agent B reads Lessons Learned |
| **Domain lens** | Different specialty | Security focus vs performance focus vs correctness focus |

**Key insight:** Differentiation is a *strategic principle,* not a cloning technique. The entire value of the system is that it produces perspectives the user did not anticipate.
