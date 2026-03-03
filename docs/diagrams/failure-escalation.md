# Failure Escalation

When agents encounter disagreements or blocking issues, The Hive uses a structured five-level escalation path. Each level attempts resolution before passing to the next. The path is designed so that routine disagreements are resolved between agents (L1-L2), significant or irreversible decisions involve the Orchestrator (L3), blocking issues require a human gate (L4), and unresolvable situations trigger a mission abort (L5).

```mermaid
flowchart TD
    START([Issue Detected]) --> L1

    L1[L1: Agent Self-Correction\nRetry with adjusted approach\nMax 2 attempts]
    L1 --> D1{Resolved?}
    D1 -- Yes --> DONE([Issue Resolved])
    D1 -- No --> L2

    L2[L2: Peer Consult\nStructured debate between agents\n2 rounds max, evidence required]
    L2 --> D2{Resolved?}
    D2 -- Yes --> DONE
    D2 -- No --> L3

    L3[L3: Orchestrator Review\nReviews both positions and evidence\nMay reframe or request more data]
    L3 --> D3{Resolved?}
    D3 -- Yes --> DONE
    D3 -- No --> D3B{Blocking or\nirreversible\nor security?}
    D3B -- No --> L3_retry[Orchestrator requests\nadditional investigation]
    L3_retry --> D3
    D3B -- Yes --> L4

    L4[L4: Human Gate\nOrchestrator presents both positions,\nevidence, and recommendation\nMission pauses for human input]
    L4 --> D4{Human\napproves\ncontinue?}
    D4 -- Yes --> DONE
    D4 -- No,\nabort --> L5

    L5[L5: Mission Abort\nDocument findings to blackboard\nRun mission cleanup protocol\nFile retrospective]
    L5 --> ABORT([Mission Aborted])
```
