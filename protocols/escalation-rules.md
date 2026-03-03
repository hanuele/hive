# Three-Tier Escalation Path

## Tier 1 — Agent-to-Agent

**For:** MINOR disagreements

Structured debate, 2 rounds max. Each agent presents position with evidence. If unresolved after 2 rounds, escalate to Tier 2.

## Tier 2 — Agent-to-Facilitator

**For:** SIGNIFICANT disagreements

Facilitator reviews both positions + evidence, decides or requests more data. The Facilitator may:
- Decide based on evidence weight
- Request additional investigation from one or both agents
- Reframe the question to find a solution space neither position occupies

## Tier 3 — Facilitator-to-Human

**For:** BLOCKING disagreements, irreversible actions, security decisions

Facilitator presents disagreement with both positions, evidence, and recommendation.

**MANDATORY for:**
- Irreversible actions
- Security decisions
- BLOCKING disagreements after 2 rounds of structured debate

## Action Authorization Matrix

| Action Type | Required Authorization |
|-------------|----------------------|
| Read-only query | None (any agent) |
| Analysis / report | Self-assessment |
| Code suggestion | One peer review |
| Code modification | Peer review + human approval |
| Database migration | Domain expert + human approval |
| Production deploy | Quorum (High) + human approval |
| Data deletion | Quorum (High) + human approval |
| Security change | Adversarial review + human approval |
