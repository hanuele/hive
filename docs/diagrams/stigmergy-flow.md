# Stigmergy Flow

Agents in a sequential pipeline coordinate through shared trace files written to the filesystem rather than through direct messaging. This is stigmergy — coordination through a shared environment. The blackboard holds the content of what each agent produced; the trace files signal that a phase is complete and a downstream agent may proceed.

```mermaid
sequenceDiagram
    participant BB as Blackboard
    participant D as Designer
    participant I as Implementer
    participant V as Verifier

    Note over D,V: Mission begins — all agents read Commander's Intent

    D->>BB: Write design plan\n(change plan, files, approach)
    D->>BB: Write trace: design_complete\n{ts, mission, agent, action, detail}
    Note over D: Designer phase complete

    BB-->>I: Implementer checks for\ndesign_complete trace
    I->>BB: Read design plan from blackboard
    I->>I: Implement changes\nin worktree
    I->>BB: Write trace: implementation_complete\n{ts, mission, agent, action, detail}
    Note over I: Implementer phase complete

    BB-->>V: Verifier checks for\nimplementation_complete trace
    V->>BB: Read design plan + implementation notes
    V->>BB: Read all prior traces
    V->>V: Run tests, verify\nagainst acceptance criteria
    V->>BB: Write test results\nto blackboard
    V->>BB: Write trace: verification_complete\n{ts, mission, agent, action, detail}
    Note over V: Verifier phase complete

    BB-->>D: Orchestrator reads all traces\nand blackboard for synthesis
    Note over BB: All traces archived to\nmemory/archive/traces/{mission}/\nafter mission complete
```
