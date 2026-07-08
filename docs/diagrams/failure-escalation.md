# Failure Escalation

When agents encounter disagreements or blocking issues, The Hive uses a four-tier partnership escalation path (see `protocols/escalation-rules.md`). Each tier attempts resolution before passing upward: routine disagreements resolve between agents (Tier 1), significant ones go to the Orchestrator (Tier 2), reversible in-scope decisions are resolved autonomously by Claude acting as the partnership layer (Tier 3a), and irreversible or high-stakes decisions require the human partner (Tier 3b).

```mermaid
flowchart TD
    START([Issue Detected]) --> T1

    T1[Tier 1: Agent-to-Agent<br/>Structured debate, 2 rounds max<br/>Each position backed by evidence]
    T1 --> D1{Resolved?}
    D1 -- Yes --> DONE([Issue Resolved])
    D1 -- No --> T2

    T2[Tier 2: Agent-to-Orchestrator<br/>Orchestrator weighs both positions and evidence<br/>Decides, requests more data, or reframes]
    T2 --> D2{Resolved?}
    D2 -- Yes --> DONE
    D2 -- No, or beyond scope --> T3A

    T3A[Tier 3a: Orchestrator-to-Claude<br/>Partnership layer resolves reversible,<br/>in-scope decisions autonomously]
    T3A --> D3A{Reversible and in-scope<br/>with no irreversible<br/>side effects?}
    D3A -- Yes --> RES3A[Claude resolves<br/>Documents on blackboard under Decisions]
    RES3A --> DONE
    D3A -- No --> T3B

    T3B[Tier 3b: Claude-to-Human Partner<br/>Irreversible, security, financial accuracy,<br/>uncertainty, or blocking disagreement<br/>Claude presents positions, evidence, recommendation]
    T3B --> D3B{Human partner<br/>decides}
    D3B -- Approve / continue --> DONE
    D3B -- Reject / halt --> HALT([Action not taken<br/>Documented for retrospective])
```
