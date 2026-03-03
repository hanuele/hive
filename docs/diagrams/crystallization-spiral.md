# Crystallization Spiral

Knowledge flows from raw observation during a mission toward codified architecture over many missions. This is the Hive's long-term learning mechanism — not any single mission's output, but the system's accumulated ability to recognize patterns and improve its own protocols. The Discernment step distinguishes this from a neutral learning system: agents actively decide which patterns to reinforce and which to treat as anti-patterns.

```mermaid
flowchart TD
    OBS[HARVEST\nFilter events.jsonl for\ncrystallization_candidate events\nSupplement with blackboard findings]

    OBS --> THRESH1{3+ occurrences\nacross agents\nor missions?}
    THRESH1 -- No --> WATCH[Continue Observing\nTag for future harvest]
    THRESH1 -- Yes --> PAT

    PAT[PATTERN\nDocument candidate pattern:\nContext, Problem, Solution,\nConsequences]

    PAT --> DISC[DISCERNMENT\nBreathing Space\nWater it? Let it rest?\nNeed more observation?]

    DISC --> DISC_Q{Decision}
    DISC_Q -- Water it\nReinforce --> FAST[Fast-track to PROMOTE]
    DISC_Q -- Let it rest\nAnti-pattern --> ANTI[Document as\nAnti-Pattern]
    DISC_Q -- Do not yet\nunderstand --> WATCH2[Observe further\nwith explicit attention]

    FAST --> THRESH2{Validated across\n3+ missions?}
    THRESH2 -- No --> WATCH3[Collect more\nmission data]
    THRESH2 -- Yes --> PROMOTE

    PROMOTE[PROMOTE\nPropose rule as\nCLAUDE.md amendment\nor protocol update\nRequires human approval]

    PROMOTE --> THRESH3{Stable across\n5+ missions?\nHuman approved?}
    THRESH3 -- No --> WATCH4[Continue validating]
    THRESH3 -- Yes --> CODIFY

    CODIFY[CODIFY\nEmbed in architecture:\ncode changes, hooks,\nagent prompts, squad templates]

    CODIFY --> ARCH([Living Architecture\nImproved for all future missions])

    WATCH & WATCH2 & WATCH3 & WATCH4 --> OBS
```
