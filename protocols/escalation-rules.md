# Four-Tier Escalation Path (Partnership Model)

## Tier 1 — Agent-to-Agent

**For:** MINOR disagreements

Structured debate, 2 rounds max. Each agent presents position with evidence. If unresolved after 2 rounds, escalate to Tier 2.

## Tier 2 — Agent-to-Facilitator

**For:** SIGNIFICANT disagreements

Facilitator reviews both positions + evidence, decides or requests more data. The Facilitator may:
- Decide based on evidence weight
- Request additional investigation from one or both agents
- Reframe the question to find a solution space neither position occupies

## Tier 3a — Facilitator-to-Claude (Partnership Tier)

**For:** Reversible decisions, design disputes, scope questions, prioritization

Claude (the session-level agent) acts as a partnership layer between the squad and the human partner. Claude resolves escalations autonomously when:
- The action is **reversible** (feature branch, config change, refactoring)
- The decision is **within mission scope** (no scope expansion)
- No **irreversible side effects** (no DB migration, no production deploy, no scoring formula change)

Claude documents the resolution on the blackboard under `## Decisions` with rationale.

**Tier 3a resolves:**
- Design disagreements between agents
- Scope questions within reversible feature branches
- Test strategy disputes
- Prioritization of non-critical findings
- Refactoring decisions
- Agent capability issues (re-prompt, substitute, degrade)

## Tier 3b — Claude-to-Human Partner

**For:** BLOCKING disagreements, irreversible actions, security decisions, uncertainty

Claude escalates to the human partner (Peter or Jan) when:
- The action is **irreversible** (DB migration, scoring formula, production deploy, API contract)
- **Security** decisions are involved
- **Financial data accuracy** is at stake
- Claude's own judgment **feels uncertain** — doubt is a valid escalation signal
- A **blocking disagreement** persists after Claude's attempt to resolve

Claude presents the escalation with both positions, evidence, and a recommendation.

**Tier 3b mandatory for:**
- Database migrations
- Scoring formula changes
- Production deployments
- Security decisions
- Financial data accuracy questions
- Blocking disagreements Claude cannot resolve
- Data deletion or irreversible state changes

## Partnership Chain

```
Agent → Agent (Tier 1: structured debate, 2 rounds)
  ↓ unresolved
Agent → Facilitator (Tier 2: evidence-based decision)
  ↓ unresolved or beyond scope
Facilitator → Claude (Tier 3a: autonomous resolution of reversible decisions)
  ↓ irreversible, uncertain, or unresolvable
Claude → Human Partner (Tier 3b: human judgment for high-stakes decisions)
```

## Action Authorization Matrix

| Action Type | Required Authorization | Tier |
|-------------|----------------------|------|
| Read-only query | None (any agent) | — |
| Analysis / report | Self-assessment | 1 |
| Code suggestion | One peer review | 1 |
| Code modification | Peer review + Claude approval | 3a |
| Database migration | Domain expert + human approval | 3b |
| Production deploy | Quorum (High) + human approval | 3b |
| Data deletion | Quorum (High) + human approval | 3b |
| Security change | Adversarial review + human approval | 3b |
| Scoring formula change | Domain expert + human approval | 3b |
| Refactoring / rename | Peer review + Claude approval | 3a |
| Config / env change | Claude approval | 3a |
