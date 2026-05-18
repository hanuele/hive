# Hive Integration Guide

> How and when to use Hive squads in your development workflow.

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

**Trigger:** Tickets with labels indicating domain complexity or data gaps where acceptance criteria aren't yet clear.

**Examples:**
- New data source evaluation (API capability vs. data quality/coverage gaps)
- Domain methodology edge cases (scoring ambiguities, classification boundaries)
- Technology evaluation (comparing options before committing)

### 2. Engineering Squad — Multi-Service Features

Use when building features that touch multiple services or modules. Focused Build (3 agents, human as Orchestrator) is cost-effective for narrow scope. Full Engineering (4 agents) for broad scope.

**Trigger:** Tickets touching 3+ services or requiring changes across multiple architectural layers.

**Examples:**
- New data pipeline + validation + API endpoint
- Database migration + service changes
- Cross-cutting feature spanning multiple modules

### 3. Review Squad — High-Stakes Quality Gate

Use for independent quality assessment before merging significant changes.

**Trigger:** PRs with labels indicating database, security, or validation concerns, or PRs touching core business logic.

**Examples:**
- Pre-release review (audit diff since last release)
- Security-sensitive changes (auth, API keys, credentials)
- Core formula or scoring changes (affect business decisions)

### 4. Creative Squad — Idea Generation

Use when the team needs novel solutions, design alternatives, or creative approaches before committing to an implementation path.

**Trigger:** Tasks requiring design exploration, alternatives, architectural brainstorming, or any situation where the first obvious solution shouldn't be the only one considered.

**Examples:**
- Dashboard layout alternatives (multiple design concepts before implementation)
- Architecture options for new subsystems
- UX flow design for complex workflows

### 5. Strategy Squad — Scenario Planning

Use when facing decisions with multiple plausible futures. Produces robust actions that work across scenarios, not bets on a single prediction.

**Trigger:** Decisions with high uncertainty about external factors (API changes, technology evolution, scaling needs).

**Examples:**
- Data source strategy (what if a key API changes terms?)
- Scaling strategy (what if user base grows 10x vs. stays small?)
- Technology migration planning (what if a key dependency is deprecated?)

### 6. Philosophy Squad — Deep Understanding

Use when the team needs to think deeply about a concept before acting. Not for building — for understanding.

**Trigger:** Conceptual ambiguity, methodology questions, "what does this really mean?" situations.

**Examples:**
- Domain methodology edge cases
- Boundary definitions (when does one state become another?)
- Data quality philosophy (when is "good enough" good enough?)

### 7. Management Squad — Multi-Mission Coordination

Use when a task is too large for a single squad. Decomposes initiatives into sequenced squad missions.

**Trigger:** Initiatives spanning multiple squad types, requiring cross-squad handoffs, or too large to keep in one human's head.

**Examples:**
- Major feature rollout (research → design → build → review)
- Platform migration (strategy → engineering → verification)
- New methodology integration (philosophy → research → engineering)

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
| Codebase explorer | Quick codebase questions | Research Squad → deep domain investigation |
| Test runner | After code changes | Engineering Squad Verifier → coordinated build+test |
| Migration specialist | Migration risk assessment | Engineering Squad Designer → plans migration as part of broader feature |
| Deploy coordinator | Deployment pipeline | N/A — deployment stays as single-agent workflow |

> Customize this table for your project's existing agents.

## Coordination Hooks

The Hive's coordination model (escalation tiers, breathing space, Sangha principles) is realised at runtime by a small set of Claude Code hooks. These hooks live in the `claude-env` repository alongside the rest of the Protocol OS hook layer, not in this repo — the Hive repo is pure Markdown knowledge. The hook scripts reference Hive protocols by path in their headers, and the mycelium graph carries `(Topic{id:"hive-coordination"})-[:IMPLEMENTED_BY]->(hook)` edges so the relationship is discoverable from either side.

| Hook | Location | Purpose | Related Hive protocols |
|------|----------|---------|------------------------|
| `hook-teammate-idle.sh` | `~/.claude/scripts/hooks/` (claude-env repo) | TeammateIdle coordination — reads Hive blackboard, emits Sangha-principle nudges on prolonged teammate idle | `protocols/escalation-rules.md`, `protocols/breathing-space.md` |

When the listed Hive protocols evolve, review the corresponding hook's nudge prose so runtime behavior tracks the model.

Design decision recorded in `D:/VersionControl/claude-env/docs/plans/protocol-os/hook-audit/implementation/levels/L3-05-hive-integration/L3-05-02-hive-repo-integration-design.md` (Option D: annotate, don't move; approved 2026-04-23).

## {ISSUE_TRACKER} Convention

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
| COMPLETE_NEEDS_CLEANUP | Synthesis done, but retro/ticket/session log missing | Run remaining cleanup protocols, then archive |
| INCOMPLETE | Mission interrupted mid-work | Read baton, re-spawn squad with RESUMPTION CONTEXT |

The `/hive` skill also warns about active missions before launching new ones.

## When NOT to Use the Hive

- Straightforward bug fixes (single file, known cause)
- Simple CRUD additions (one endpoint, one service)
- Documentation-only changes
- Version bumps, config changes
- Tasks where coordination overhead > diversity value

## Mid-Mission Scaling

Squads can grow horizontally when context pressure or task backlog demands it.
See `protocols/dynamic-scaling.md` for the full protocol.

**Two mechanisms:**
1. **Upfront** — Orchestrator evaluates task count at kickoff; if >5 tasks with
   2+ independent tracks, starts with 2 workers from the beginning.
2. **Mid-mission** — Scrum Master monitors budget zones; if any agent hits YELLOW
   or one agent owns >5 pending tasks, files a `## Scale Requests` entry.
   Orchestrator spawns a clone that claims unclaimed tasks in ID order.

**Autonomy cap:** Up to 3 agents of the same role are spawned autonomously.
The 4th requires human confirmation.
