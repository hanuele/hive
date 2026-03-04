# Hive Integration Guide — MinersDiners

> How and when to use Hive squads in the MinersDiners development workflow.

## Decision Framework: Solo vs. Squad

| Signal | Work Solo | Spawn a Squad |
|--------|-----------|--------------|
| Uncertainty | Low — clear requirements, known path | High — need to research before building |
| Scope | 1-2 files, single service | Cross-service, 5+ files, multiple concerns |
| Domains | Single (just DB, or just scraper) | Multiple (scraper + API + DB + validation) |
| Stakes | Reversible, low blast radius | Irreversible (migration, API contract, scoring formula) |
| Existing knowledge | Well-documented in CLAUDE.md/LESSONS-LEARNED | New territory (new data source, new methodology) |

## Escalation Model

Hive missions use a 4-tier partnership escalation chain. See `protocols/escalation-rules.md` for full details.

| Tier | Who | Resolves |
|------|-----|----------|
| 1 | Agent to Agent | Minor disagreements (structured debate, 2 rounds) |
| 2 | Agent to Facilitator | Significant disagreements (evidence-based decision) |
| 3a | Facilitator to Claude | Reversible decisions, design disputes, scope questions |
| 3b | Claude to Human Partner | Irreversible actions, security, financial data, blocking disagreements |

**Key principle:** Claude (Tier 3a) resolves most escalations autonomously for reversible, in-scope decisions. Human partners are reserved for irreversible or high-stakes decisions (Tier 3b).

## Integration Points

### 1. Research Squad — Domain Investigation

Use when exploring something new before implementing. High-uncertainty, knowledge-gathering missions.

**Trigger:** Jira tickets with labels `domain-knowledge`, `domain-intelligence`, or `data-gap` where acceptance criteria aren't yet clear.

**Examples:**
- New data source evaluation (API capability vs. data quality/coverage gaps)
- Lassonde Curve refinements (mapping theory to actual data fields)
- Durrett methodology edge cases (scoring ambiguities)

### 2. Engineering Squad — Multi-Service Features

Use when building features that touch multiple microservices. Focused Build (3 agents, human as Orchestrator) is cost-effective for narrow scope. Full Engineering (4 agents) for broad scope.

**Trigger:** Jira tickets touching 3+ services or requiring changes across data-extraction, analysis-engine, and visualization.

**Examples:**
- New scraper + validation + API endpoint
- Database migration + service changes
- COMEX Silver Monitor (KAN-201) — new pipeline + analysis + dashboard

### 3. Review Squad — High-Stakes Quality Gate

Use for independent quality assessment before merging significant changes.

**Trigger:** PRs with labels `database`, `security`, or `validation`, or PRs touching `shared/database/` or scoring formulas.

**Examples:**
- Pre-release review (audit diff since last release)
- Security-sensitive changes (auth, API keys, credentials)
- Scoring formula changes (affect investment decisions)

## Workflow Integration

```
1. Pick Jira ticket
2. Assess terrain (4 axes from terrain/analysis-axes.md)
   ├── Low uncertainty, narrow → Work solo (existing workflow)
   └── High uncertainty OR broad → Spawn Hive mission
       a. Create blackboard from template
       b. Write Commander's Intent (the "why")
       c. Spawn appropriate squad
       d. Agents write to blackboard (stigmergy)
       e. Read synthesis → implement findings
       f. Retrospective → crystallize patterns
3. Branch, implement, PR, merge (normal flow)
```

## Relationship to Existing Agents

The Hive layers on top — it doesn't replace existing single-purpose agents:

| Existing Agent | Still Use For | Squad Alternative (When) |
|---------------|---------------|-------------------------|
| `reviewer` | Standard PRs | Review Squad → high-stakes PRs |
| `explorer` | Quick codebase questions | Research Squad → deep domain investigation |
| `test-runner` | After code changes | Engineering Squad Verifier → coordinated build+test |
| `migration-guardian` | Migration risk assessment | Engineering Squad Designer → plans migration as part of broader feature |
| `deploy-coordinator` | Deployment pipeline | N/A — deployment stays as single-agent workflow |

## Jira Convention

Add a terrain assessment to ticket comments when picking up a ticket:

```
Terrain: uncertainty=high, reversibility=reversible, breadth=broad, stakes=medium
→ Research Squad recommended
```

## Knowledge Feedback Loop

```
Mission retrospective
  → Candidate patterns (in retrospective file)
  → 3+ observations → PROMOTE review
  → Confirmed patterns → docs/LESSONS-LEARNED.md
  → Architecture-level patterns → CLAUDE.md updates
```

## Mission Resumption

When a session breaks mid-mission, blackboards and batons persist on disk. Use `/hive-resume` to pick up where you left off.

| State | What happened | Action |
|-------|--------------|--------|
| CLEANUP_ONLY | Mission completed, blackboard not archived | Auto-archive blackboard + traces |
| COMPLETE_NEEDS_CLEANUP | Synthesis done, but retro/Jira/session log missing | Run remaining cleanup protocols, then archive |
| INCOMPLETE | Mission interrupted mid-work | Read baton, re-spawn squad with RESUMPTION CONTEXT |

The `/hive` skill also warns about active missions before launching new ones.

## When NOT to Use the Hive

- Straightforward bug fixes (single file, known cause)
- Simple CRUD additions (one endpoint, one service)
- Documentation-only changes
- Version bumps, config changes
- Tasks where coordination overhead > diversity value
