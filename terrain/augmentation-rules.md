# Dynamic Augmentation Rules

> Signals that trigger adding a specialist agent to the squad mid-mission.

## Rules

```yaml
composition_rules:
  - signal: "migration files changed"
    add_agent: "{MIGRATION_SPECIALIST}"
<!-- DOMAIN: Replace {MIGRATION_SPECIALIST} with your project's migration/schema specialist agent (e.g., migration-guardian, alembic-reviewer) -->
    reason: "Risk assessment for schema changes"

  - signal: "PR touches >5 files"
    add_agent: security-reviewer
    reason: "Cross-cutting change needs security lens"

  - signal: "new feature implementation"
    add_agent: tester
    reason: "Test coverage for new code paths"
```

## Agent Tiers (Cost Reference)

| Tier | Model | Tools | Role | Cost |
|------|-------|-------|------|------|
| **Scout** | haiku | Read, Grep, Glob | Research, exploration, monitoring | $ |
| **Specialist** | sonnet | Read, Grep, Glob, Bash | Analysis, review, domain expertise | $$ |
| **Operator** | sonnet | Full (Read, Write, Edit, Bash) | Implementation, lifecycle management | $$ |
| **Orchestrator** | opus | Full + Team tools | Mission framing, synthesis, facilitation | $$$ |

## Cost Management Strategies

| Strategy | Savings | When |
|----------|---------|------|
| Use haiku for scouts | ~80% vs opus | Always for research/monitoring |
| Pre-approve permissions | Eliminates prompt overhead | Production workflows |
| Scope spawn prompts tightly | Reduces context overhead | Always |
| Use subagents (not teammates) when only results matter | ~40% less overhead | One-shot tasks |
| Cap at 3-5 agents per squad | Avoids superlinear coordination cost | Always |
