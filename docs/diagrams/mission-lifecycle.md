# Mission Lifecycle

Every Hive mission follows a structured lifecycle from terrain assessment through knowledge crystallization. The stigmergy work phase is a feedback loop where agents coordinate through shared trace files and a blackboard rather than direct messaging. The retrospective and crystallization steps ensure that learning from each mission accumulates into the system's protocols over time.

```mermaid
flowchart TD
    A([Start]) --> B[Terrain Assessment\nAssess 4 axes: Uncertainty,\nReversibility, Breadth, Stakes]
    B --> C{2+ axes\npoint to Squad?}
    C -- No --> D[Solo Agent\nWork]
    C -- Yes --> E[Squad Selection\nResearch / Engineering /\nReview / Full Engineering]
    E --> F[Write Commander's Intent\nto Blackboard\nWhy, Objective, Constraints,\nSuccess Criteria]
    F --> G[Premise Challenge\nChallenger reviews framing\nbefore work begins]
    G --> H{Framing\nSound?}
    H -- No --> F
    H -- Yes --> I[Spawn Agents\nWith shutdown protocol\nin every spawn prompt]
    I --> J[Work Phase]

    subgraph J[Work Phase — Stigmergy Loop]
        direction TB
        J1[Agent reads\nBlackboard] --> J2[Agent completes\nphase]
        J2 --> J3[Write trace file\nmission-agent-action.trace]
        J3 --> J4[Downstream agent\nreads trace]
        J4 --> J1
    end

    J --> K[Graceful Agent\nShutdown]
    K --> L[Retrospective\nHarvest crystallization\ncandidates from events.jsonl]
    L --> M[Crystallization\nPattern → Discernment\n→ Promote → Codify]
    M --> N[Mission Cleanup\nArchive traces, blackboard,\nupdate hive-status.md]
    N --> O([Mission Complete])
    D --> O
```
