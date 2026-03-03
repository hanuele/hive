# Search Heuristics

> How agents explore the solution space. Injected via spawn prompt to differentiate clones.

## When to Use

When spawning 2+ agents investigating the same question, assign different search heuristics so each agent *explores* differently — covering more ground than parallel identical searches would.

## Heuristics

| Heuristic | When to Use | Spawn Prompt Injection | Strengths | Weaknesses |
|-----------|------------|----------------------|-----------|------------|
| **Depth-first** | When one lead is promising and needs thorough investigation | "Use depth-first search: pick the most promising lead and follow it to its conclusion before moving on. Go deep, not wide." | Finds root causes, produces detailed evidence chains, catches subtle issues | May miss breadth; can tunnel-vision on first hypothesis |
| **Breadth-first** | When the landscape is unknown and coverage matters | "Use breadth-first search: survey the full landscape before diving deep. Map all relevant files, APIs, and data sources before analyzing any one." | Comprehensive coverage, finds unexpected connections, reduces blind spots | May stay shallow; risks producing a catalog instead of insight |
| **Contrarian** | When the team needs someone to challenge assumptions | "Use contrarian search: start from the assumption that the obvious answer is wrong. Look for failure cases, edge cases, and counter-examples first." | Finds what others miss, prevents groupthink, surfaces hidden risks | Can be unproductive if the obvious answer is actually correct |
| **Analogical** | When the problem resembles something solved elsewhere | "Use analogical search: look for similar problems in other domains, other projects, or other industries. What patterns transfer?" | Imports proven solutions, avoids reinventing, finds creative approaches | Analogies can mislead if the domains differ in important ways |

## Clone Differentiation Table

Standard assignment for 2-3 investigator clones (from `squads/research-squad.md`):

| Clone | Heuristic | Reference Material |
|-------|-----------|-------------------|
| Investigator-alpha | Depth-first | Primary domain docs |
| Investigator-beta | Breadth-first | Cross-domain references |
| Investigator-gamma | Contrarian | Known failure cases |

## Spawn Example

```
Agent(subagent_type="general-purpose", name="investigator-alpha",
      team_name="research-{topic}",
      prompt="You are The Investigator. [paste personas/investigator.md]
             Search heuristic: depth-first.
             Focus: pick the most promising lead from the Commander's Intent
             and follow it to conclusion. Go deep, not wide.
             Reference material: [primary domain docs]")

Agent(subagent_type="general-purpose", name="investigator-beta",
      team_name="research-{topic}",
      prompt="You are The Investigator. [paste personas/investigator.md]
             Search heuristic: breadth-first.
             Focus: survey the full landscape before diving deep.
             Reference material: [cross-domain references]")
```

## Source

Derived from plan v4 section 3 (Differentiation When Cloning) and section 7 (Cloning Protocol). Validated across 6 missions — depth-first + breadth-first pairing produced complementary findings in all Research Squad missions.
