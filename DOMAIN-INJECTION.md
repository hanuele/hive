# Domain Injection Checklist

> Customize the Hive for your project. Required changes must be made before your first mission. Optional changes improve the experience.

## Required Changes

### 1. Test Command (`{PROJECT_TEST_COMMAND}`)

**File:** `.claude/hive/squads/engineering-squad.md` (line with `{PROJECT_TEST_COMMAND}`)

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

**File:** `.claude/hive/personas/scrum-master.md`

The Scrum Master persona contains placeholder fields for project-specific tooling:

| Placeholder | What to replace with |
|-------------|---------------------|
| `{ISSUE_TRACKER}` | Your issue tracker name (e.g., "Jira", "Linear", "GitHub Issues") |
| `{ISSUE_TRACKER_CLI}` | CLI tool for issue tracker operations |
| `{TEST_COMMAND}` | Your project's test runner command |
| `{MIGRATION_CHECK}` | Command to verify migration/schema status |

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
| **Personas** | `personas/*.md` — narrative personas are designed to be domain-agnostic (except Scrum Master placeholders) |
| **Constitutions** | `constitutions/*.md` — governance principles apply universally |
| **Protocols** | `protocols/*.md` — communication and process standards |
| **Terrain axes** | `terrain/analysis-axes.md` — the 4-axis framework is universal |

If you find these need changes, consider whether the change is truly domain-specific (belongs in augmentation rules) or framework-level (should be proposed as an upstream change to the Hive repo).
