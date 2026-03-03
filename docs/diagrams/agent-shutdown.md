# Agent Shutdown

Graceful agent shutdown requires a two-step approach: a primer message re-activates a potentially idle agent and refreshes the shutdown instruction, followed by the formal shutdown_request. Every agent spawn prompt must include an explicit shutdown handling section instructing the agent to call the SendMessage tool rather than acknowledge the request in text. If an agent fails to respond after three attempts, the team proceeds to cleanup and the agent will time out naturally.

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant A as Agent
    participant SYS as System

    Note over O,A: Agent has completed all tasks

    O->>A: Primer message\n"Your tasks are complete.\nWhen you receive shutdown_request,\ncall SendMessage shutdown_response."
    Note over O: Wait 5-10 seconds

    O->>A: shutdown_request\n"All tasks complete.\nPlease shut down gracefully."

    alt Clean shutdown (first attempt)
        A->>O: shutdown_response\napprove: true\nrequest_id: matched
        O->>SYS: Verify agent removed\nfrom teams config
        Note over SYS: Agent session ends cleanly
    else No response after 60 seconds
        O->>A: Retry 1: Resend shutdown_request\nwith explicit reminder
        alt Response on retry
            A->>O: shutdown_response\napprove: true
            O->>SYS: Verify agent removed
        else Still no response after 60 more seconds
            O->>A: Retry 2: Final reminder\n"Call the tool — last request before timeout"
            alt Response on final retry
                A->>O: shutdown_response\napprove: true
                O->>SYS: Verify agent removed
            else No response after 3 attempts
                Note over O: Proceed to cleanup\nAgent will time out via\n5-minute heartbeat
            end
        end
    end

    O->>SYS: TeamDelete\n(only after ALL agents\nshut down or timed out)
    Note over SYS: Team resources cleaned up
```
