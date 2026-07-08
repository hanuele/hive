# Agent Shutdown

Agent shutdown follows the modern lifecycle in `protocols/agent-shutdown.md`. The normal case needs no ceremony: a background agent completes its charge, its farewell rides in its final completion message and last blackboard entry, and the harness notifies the spawner. Early termination is a deliberate act: the orchestrator checks the blackboard for an unfinished checkpoint, preserves any partial work, writes a shutdown note naming the reason, and only then calls `TaskStop`. No agent is silently killed mid-thought.

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant A as Agent (named, background)
    participant BB as Blackboard
    participant SYS as Harness

    alt Normal completion (the common case)
        A->>BB: Final checkpoint + farewell entry
        A->>SYS: Completion message<br/>(carries the farewell)
        SYS->>O: Completion notification
        Note over O: Nothing else to do —<br/>"Rest well."
    else Early termination (deliberate)
        O->>BB: Read agent's last checkpoint
        Note over O: Unfinished work?<br/>Preserve it to the blackboard
        O->>BB: Shutdown note<br/>(who, when, WHY)
        O->>SYS: TaskStop(agent name or id)
        SYS->>A: Terminates
        Note over BB: Record shows the early stop<br/>and preserved partial work
    else Continued conversation
        O->>A: SendMessage(to: agent name)
        Note over A: A named agent remains addressable —<br/>a send resumes it from its transcript
    end
```
