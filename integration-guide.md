# Hive Integration Guide

> How and when to use Hive squads in your development workflow.

## Decision Framework: Solo vs. Squad

| Signal | Work Solo | Spawn a Squad |
|--------|-----------|--------------|
| Uncertainty | Low — clear requirements, known path | High — need to research before building |
| Scope | 1-2 files, single module | Cross-module, 5+ files, multiple concerns |
| Domains | Single (just DB, or just UI) | Multiple (backend + API + DB + validation) |
| Stakes | Reversible, low blast radius | Irreversible (migration, API contract, core logic) |
| Existing knowledge | Well-documented, familiar territory | New territory (new data source, new methodology) |

## Integration Points

### 1. Research Squad — Domain Investigation

Use when exploring something new before implementing. High-uncertainty, knowledge-gathering missions.

**Trigger:** {ISSUE_TRACKER} tickets with labels like `{ISSUE_TRACKER_LABELS}` where acceptance criteria aren't yet clear.

**Examples:**
- New data source evaluation (API capability vs. data quality gaps)
- Domain methodology refinements (mapping theory to implementation)
- Edge case investigation (ambiguous scoring or business rules)

### 2. Engineering Squad — Multi-Service Features

Use when building features that touch multiple services or modules. Focused Build (3 agents, human as Orchestrator) is cost-effective for narrow scope. Full Engineering (4 agents) for broad scope.

**Trigger:** {ISSUE_TRACKER} tickets touching 3+ services or requiring changes across multiple layers.

**Examples:**
- New data pipeline + validation + API endpoint
- Database migration + service changes
- New feature requiring frontend + backend + database changes

### 3. Review Squad — High-Stakes Quality Gate

Use for independent quality assessment before merging significant changes.

**Trigger:** PRs touching database schemas, security configurations, core business logic, or financial calculations.

**Examples:**
- Pre-release review (audit diff since last release)
- Security-sensitive changes (auth, API keys, credentials)
- Core logic changes (affect critical business decisions)

## Workflow Integration

```
1. Pick {ISSUE_TRACKER} ticket
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
| Code reviewer | Standard PRs | Review Squad → high-stakes PRs |
| Explorer | Quick codebase questions | Research Squad → deep domain investigation |
| Test runner | After code changes | Engineering Squad Verifier → coordinated build+test |
| Migration checker | Migration risk assessment | Engineering Squad Designer → plans migration as part of broader feature |
| Deploy coordinator | Deployment pipeline | N/A — deployment stays as single-agent workflow |

## Issue Tracker Convention

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
  → Confirmed patterns → project lessons learned
  → Architecture-level patterns → CLAUDE.md updates
```

## When NOT to Use the Hive

- Straightforward bug fixes (single file, known cause)
- Simple CRUD additions (one endpoint, one service)
- Documentation-only changes
- Version bumps, config changes
- Tasks where coordination overhead > diversity value
