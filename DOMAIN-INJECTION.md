# Domain Injection — Narrative Guide

> Customize the Hive for your project. Required changes must be made before your first mission. Optional changes improve the experience.
>
> **This is the narrative guide — it explains *why* each placeholder exists and how it fits the
> workflow.** The authoritative *what-to-fill* worklist (one row per real token, with files and
> example values) is `bootstrap/DOMAIN-INJECTION-CHECKLIST.md`. When the two ever disagree, the
> checklist wins — it is regenerated from the actual tokens in the tree. A completed reference
> fill lives at `docs/examples/scrum-master-minersdiners.md`.

## Required Changes

### 1. Test Command (`{PROJECT_TEST_COMMAND}`)

**Files:** `.claude/hive/squads/engineering-squad.md` and `.claude/hive/protocols/definition-of-done.md` (each has a line with `{PROJECT_TEST_COMMAND}`)

Replace `{PROJECT_TEST_COMMAND}` with your project's test runner:

| Stack | Example |
|-------|---------|
| Python (pytest) | `docker-compose exec app pytest` |
| Python (unittest) | `python -m pytest` |
| Node.js | `npm test` |
| Rust | `cargo test` |
| Go | `go test ./...` |
| Java (Maven) | `mvn test` |
| Java (Gradle) | `./gradlew test` |

### 2. Migration Specialist (`{MIGRATION_SPECIALIST}`)

**File:** `.claude/hive/terrain/augmentation-rules.md` (line with `{MIGRATION_SPECIALIST}`)

Replace `{MIGRATION_SPECIALIST}` with the name of your project's migration/schema review agent. If your project doesn't use database migrations, remove or comment out the entire `migration files changed` rule:

```yaml
# Remove this block if not applicable:
  - signal: "migration files changed"
    add_agent: "{MIGRATION_SPECIALIST}"
    reason: "Risk assessment for schema changes"
```

## Optional Changes

### 3. Scrum Master Customization

**Files:** `.claude/hive/personas/scrum-master.md` (narrative) and `.claude/agents/scrum-master.md`
(installable form). They are two views of one role and share the **same canonical tokens** — fill a
token once per concept and both read correctly.

The Scrum Master is the only role with domain placeholders — it drives ticket operations,
credential access, and migration pre-flight, all of which are project-specific. Everything else
about it (its psychology, its rules, its blind spots) is domain-agnostic narrative and
must not be edited. The tokens actually present today:

| Placeholder | What to replace with |
|-------------|---------------------|
| `{TICKET_SYSTEM_CLI}` | CLI wrapper the Scrum Master calls for ticket operations (e.g., `scripts/jira-api.sh`, `gh issue`, `linear`) |
| `{TICKET_CREDENTIAL_SETUP}` | The shell block that reads tracker credentials from `.env.local` line-by-line |
| `{TICKET_EPIC_KEY}` | Epic/parent key that agent-created tickets are filed under, if you group them (e.g., `DD-140`) |
| `{TASK_STATUS_IN_PROGRESS}` | Tracker's "in progress" status name (e.g., "In Progress", "In Arbeit") |
| `{TASK_STATUS_DONE}` | Tracker's "done" status name (e.g., "Done", "Erledigt") |
| `{MIGRATION_CHECK_COMMAND}` | Command that reports current DB migration state (e.g., `docker exec app alembic current`) |
| `{NNN}` | **Runtime token — do not fill.** The error number the Scrum Master assigns when an error first occurs (`ERR-{NNN}`). |

Placeholders that live in *other* framework files (also on the checklist): `{PROJECT_TEST_COMMAND}`
(`squads/engineering-squad.md`, `protocols/definition-of-done.md`), `{MIGRATION_SPECIALIST}`
(`terrain/augmentation-rules.md`), `{HIVE_REPO}` (`protocols/crystallization.md`), and
`{CONTAINER_EXEC}` (`memory/active/error-catalog.md`). The error catalog reuses the Scrum Master's
own `{TICKET_SYSTEM_CLI}` and `{MIGRATION_CHECK_COMMAND}` tokens rather than aliases, so there is
exactly one name per concept. The full worklist with example values is
`bootstrap/DOMAIN-INJECTION-CHECKLIST.md`.

### 4. Commander's Intent Customization

**File:** `.claude/hive/memory/active/blackboard/_template.md`

The template ships with a generic Commander's Intent. You may want to add project-specific fields:

```markdown
## Commander's Intent
**Why:** ...
**Objective:** ...
**Project-specific context:** {Add fields relevant to your domain}
```

### 5. Augmentation Rules

**File:** `.claude/hive/terrain/augmentation-rules.md`

Add project-specific signals that should trigger specialist agents:

```yaml
  - signal: "{your trigger condition}"
    add_agent: "{your specialist agent}"
    reason: "{why this specialist is needed}"
```

Examples:
- `"API endpoint changed"` → add `api-reviewer`
- `"security config modified"` → add `security-auditor`
- `"infrastructure files changed"` → add `infra-reviewer`

### 6. System Notes in hive-status.md

**File:** `.claude/hive/memory/hive-status.md`

Update the System Notes section with your project name and deployment date:

```markdown
## System Notes

- **Hive deployed:** 2026-03-15
- Project: {Your Project Name}
- Test command: {your test command}
```

## Do Not Change

The following files should not be modified for domain injection. They are framework-level and changes risk breaking the system's coordination guarantees:

| Category | Files |
|----------|-------|
| **Personas** | `personas/*.md` — all persona *narrative* (psychology, rules, blind spots) is domain-agnostic. The only editable spots are the `{PLACEHOLDER}` tokens in `personas/scrum-master.md` listed in §3 above; every other persona has no placeholders at all. |
| **Constitutions** | `constitutions/*.md` — governance principles apply universally (no placeholders) |
| **Protocols** | `protocols/*.md` — communication and process standards. Edit only the `{PROJECT_TEST_COMMAND}` (in `definition-of-done.md`) and `{HIVE_REPO}` (in `crystallization.md`) tokens; leave the surrounding process text alone. |
| **Terrain axes** | `terrain/analysis-axes.md` — the 4-axis framework is universal. (`terrain/augmentation-rules.md` *does* carry the `{MIGRATION_SPECIALIST}` token — see §2.) |

If you find these need changes, consider whether the change is truly domain-specific (belongs in augmentation rules) or framework-level (should be proposed as an upstream change to the Hive repo).
