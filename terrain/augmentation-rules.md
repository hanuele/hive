# Dynamic Augmentation Rules

> Signals that trigger adding a specialist agent to the squad mid-mission.

## Rules

```yaml
composition_rules:
  - signal: "migration files changed"
    add_agent: "{MIGRATION_SPECIALIST}"     # placeholder — see DOMAIN-INJECTION.md
<!-- DOMAIN: Replace {MIGRATION_SPECIALIST} with your project's migration/schema
     specialist agent (e.g., migration-guardian). If you have no such agent, use
     the Challenger with a schema/migration lens. -->
    reason: "Risk assessment for schema changes"

  - signal: "PR touches >5 files"
    add_agent: "Challenger + security lens"
    reason: "Cross-cutting change needs a security lens"

  - signal: "new feature implementation"
    add_agent: "Challenger + correctness lens"
    reason: "Test coverage for new code paths"
```

Augmented agents are spawned from the same six `agents/` types with a lens
injected in the charge — "Challenger + security lens" is `subagent_type="challenger"`,
not a distinct agent file. `{MIGRATION_SPECIALIST}` stays a documented placeholder
because a project may supply a purpose-built migration agent (wired in via
`DOMAIN-INJECTION.md`); absent one, read it as a Challenger with a migration lens.

## Model & Reasoning-Effort Tiering

Tools come from each `agents/` file's frontmatter (`model: inherit`). The choice
that actually varies per spawn is **model** and **reasoning effort** — set both to
match the role's cognitive load. Current models: the Claude 5 family (Fable 5
flagship), Opus 4.8, Sonnet 5, Haiku 4.5. Effort levels: low / medium / high /
xhigh / max. Do not hard-code a context-window size — windows range widely and the
harness auto-compacts.

| Role band | Typical model | Reasoning effort | Why |
|-----------|---------------|------------------|-----|
| **Orchestrator** | inherits the session model | high | Framing, synthesis, cross-squad integration — the deepest reasoning in the framework. |
| **Challenger (any lens)** | flagship or Opus-class | high–xhigh | Verification and adversarial review are where cutting effort costs the most. |
| **Investigator / Architect** | flagship or Sonnet-class | medium–high | Evidence work and design reward depth but rarely need max effort. |
| **Innovator** | flagship or Sonnet-class | medium–high | Divergence does more work than raw depth; headroom helps generation. |
| **Scrum Master** | Haiku-class | low | Operational, not deliberative — the cheapest seat by design. |

## Cost Management Strategies

| Strategy | Savings | When |
|----------|---------|------|
| Haiku-class + low effort for the Scrum Master | large vs. flagship | Always — operational work needs no deep reasoning |
| Dial reasoning effort down for read/monitor charges | Cuts thinking tokens | Scouting, status polling, catalog updates |
| Scope charges tightly | Reduces context overhead | Always |
| Prefer background subagents when only results matter | Less coordination overhead | One-shot tasks |
| Cap at 3–5 agents per squad | Avoids superlinear coordination cost | Always |
