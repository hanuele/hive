# Domain Injection Checklist

After running `bootstrap.sh`, fill in these placeholders to complete your Hive integration.

Search for each placeholder in the files listed under "Appears in" and replace with your project-specific value.

---

## Project Identity

- [ ] `{PROJECT}` — Your project name (e.g., "MyApp", "Acme")
  - Appears in: `CLAUDE.md` snippet header, session logs, agent personas
- [ ] `{PROJECT_ROOT}` — Absolute path to project root (e.g., `/home/user/myapp`)
  - Appears in: `bootstrap.sh` output, integration guide references

---

## Issue Tracker

- [ ] `{ISSUE_TRACKER}` — Issue tracker name (e.g., "Jira", "Linear", "GitHub Issues")
  - Appears in: `bootstrap/rules/hive-workflow.md`, `bootstrap/skills/assess-terrain/SKILL.md`, `bootstrap/CLAUDE-SNIPPET.md`
- [ ] `{ISSUE_TRACKER_CLI}` — CLI command for issue tracker queries (e.g., `gh issue view`, `linear issue get`, `jira issue view`)
  - Appears in: `bootstrap/skills/assess-terrain/SKILL.md`
- [ ] `{ISSUE_TRACKER_LABELS}` — Comma-separated labels that always trigger terrain assessment (e.g., `domain-knowledge`, `database`, `security`)
  - Appears in: `bootstrap/rules/hive-workflow.md`, `bootstrap/CLAUDE-SNIPPET.md`, `bootstrap/skills/assess-terrain/SKILL.md`
- [ ] `{TICKET_PREFIX}` — Ticket key prefix including dash (e.g., `PROJ-`, `APP-`, `#`)
  - Appears in: `bootstrap/skills/assess-terrain/SKILL.md` (argument-hint and regex)
- [ ] `{EPIC_KEY}` — One or more epic identifiers relevant to high-stakes work (e.g., `PROJ-17`, `DB-1`)
  - Appears in: `bootstrap/skills/assess-terrain/SKILL.md` (scoring inputs)
- [ ] `{EPIC_NAME}` — Human-readable epic display name (e.g., "Database Schema & Migrations")
  - Appears in: `bootstrap/CLAUDE-SNIPPET.md` (Epics table)
- [ ] `{EPIC_DESCRIPTION}` — Brief epic description (e.g., "Alembic migrations, DB fields")
  - Appears in: `bootstrap/CLAUDE-SNIPPET.md` (Epics table)

---

## Testing

- [ ] `{TEST_COMMAND}` — Command to run tests (e.g., `pytest`, `npm test`, `cargo test`)
  - Appears in: `CLAUDE.md` snippet (if you add a Testing section)
- [ ] `{TEST_FRAMEWORK}` — Test framework name (e.g., "pytest", "Jest", "RSpec")
  - Appears in: documentation references

---

## Deployment

- [ ] `{MIGRATION_CHECK}` — Command to check migration/schema status (e.g., `alembic current`, `rails db:migrate:status`)
  - Appears in: `CLAUDE.md` snippet (if you add a Database section)
- [ ] `{BUILD_COMMAND}` — Command to build or start the application (e.g., `docker-compose up -d`, `npm run build`)
  - Appears in: `CLAUDE.md` snippet (Quick Reference)

---

## Domain-Specific

- [ ] `{DOMAIN_SCORING}` — Domain-specific scoring or calculation methodology name (if applicable, e.g., "CVSS score", "credit risk model", "quality index")
  - Appears in: agent personas (if you customize the Review Squad for domain review)

---

## Verification Steps

After substituting all placeholders:

1. Run `grep -r '{' .claude/hive/ .claude/rules/ .claude/skills/assess-terrain/` — no `{PLACEHOLDER}` patterns should remain (only legitimate braces in code examples)
2. Run `/assess-terrain` on a real ticket to verify the skill works end-to-end
3. Check `.claude/hive/integration-guide.md` renders correctly in your editor

---

## Notes

- Placeholders use `{UPPER_SNAKE_CASE}` convention
- The script `scripts/bootstrap.sh --dry-run` will show all files that will be touched without making changes
- If your project has multiple issue trackers, run the replacement for each tracker in the relevant file subset
