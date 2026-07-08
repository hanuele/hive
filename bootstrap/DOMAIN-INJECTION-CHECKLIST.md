# Domain Injection Checklist

> **This is the single authoritative fill-in checklist.** It is regenerated from the actual
> `{PLACEHOLDER}` tokens present in the framework tree. `DOMAIN-INJECTION.md` is the narrative
> guide that explains *why* each token exists; this file is the *what-to-fill* worklist.

After running `bootstrap.sh`, fill in the placeholders below to complete your Hive integration.
Search for each placeholder in the file(s) listed and replace with your project-specific value.
Every token uses `{UPPER_SNAKE_CASE}`, and each concept has exactly **one** token name across all
files — the Scrum Master persona (`personas/scrum-master.md`) and its installable agent form
(`agents/scrum-master.md`) share the same canonical names, and the error catalog reuses those same
tokens rather than aliases. No placeholder name contains a digit (digit-bearing names would evade
the `{[A-Z_]+}` verify grep).

---

## Required — a first mission will misbehave until these are filled

| Placeholder | File(s) | What to fill in | Example value |
|-------------|---------|-----------------|---------------|
| `{PROJECT_TEST_COMMAND}` | `squads/engineering-squad.md`, `protocols/definition-of-done.md` | Command that runs your test suite | `docker-compose exec app pytest` · `npm test` · `cargo test` |
| `{TICKET_SYSTEM_CLI}` | `personas/scrum-master.md`, `agents/scrum-master.md`, `memory/active/error-catalog.md` (ERR-003), `.claude/skills/assess-terrain/SKILL.md` | CLI wrapper the Scrum Master calls for ticket ops (`transition`, `comment`, `create-issue`, …) — one token, all four files | `scripts/jira-api.sh` · `gh issue` · `linear` |
| `{TICKET_CREDENTIAL_SETUP}` | `personas/scrum-master.md`, `agents/scrum-master.md` | The shell block that reads tracker credentials from `.env.local` line-by-line (never `eval`/`source`) | `JIRA_EMAIL=$(grep '^JIRA_EMAIL=' .env.local \| cut -d= -f2)`<br>`JIRA_API_TOKEN=$(grep '^JIRA_API_TOKEN=' .env.local \| cut -d= -f2)` |
| `{TASK_STATUS_IN_PROGRESS}` | `personas/scrum-master.md`, `agents/scrum-master.md` | Your tracker's "in progress" status name | `In Progress` · `In Arbeit` |
| `{TASK_STATUS_DONE}` | `personas/scrum-master.md`, `agents/scrum-master.md` | Your tracker's "done" status name | `Done` · `Erledigt` |

---

## Optional — fill only if the capability applies to your project

| Placeholder | File(s) | What to fill in | Example value |
|-------------|---------|-----------------|---------------|
| `{TICKET_EPIC_KEY}` | `personas/scrum-master.md`, `agents/scrum-master.md` | Epic/parent key that agent-created tickets are filed under (skip if you don't group them) | `DD-140` · `KAN-17` |
| `{MIGRATION_CHECK_COMMAND}` | `personas/scrum-master.md`, `agents/scrum-master.md`, `memory/active/error-catalog.md` (ERR-006) | Command that reports current DB migration state (DB projects only) — one token, all three files | `docker exec app-gateway alembic current` |
| `{MIGRATION_SPECIALIST}` | `terrain/augmentation-rules.md` | Name of your migration/schema-review agent; or delete the `migration files changed` rule if you have none | `migration-guardian` · `alembic-reviewer` |
| `{CONTAINER_EXEC}` | `memory/active/error-catalog.md` (ERR-005) | Your container-exec prefix (containerized projects only) | `docker compose exec` · `kubectl exec` |
| `{HIVE_REPO}` | `protocols/crystallization.md` | Path/env-var for your Hive framework clone, used only by the optional pattern-sync script | `/home/you/hive` · `$HIVE_REPO` |

---

## Integration-layer tokens — the CLAUDE.md snippet, workflow rule, and terrain skill

These live outside the `.claude/hive/` framework tree, in the files bootstrap installs at the
project level: the `## Hive Integration` block appended to your `CLAUDE.md`, the copied
`.claude/rules/*.md`, and `.claude/skills/assess-terrain/SKILL.md`. Fill them so the
`/assess-terrain` skill and the CLAUDE.md snippet read correctly.

| Placeholder | File(s) | What to fill in | Example value |
|-------------|---------|-----------------|---------------|
| `{ISSUE_TRACKER}` | `CLAUDE.md` (Hive Integration snippet), `.claude/rules/hive-workflow.md`, `.claude/skills/assess-terrain/SKILL.md` | Your tracker's display name | `Jira` · `Linear` · `GitHub Issues` |
| `{ISSUE_TRACKER_LABELS}` | same three files | Comma-separated labels that always trigger a terrain assessment | `domain-knowledge, database, security` |
| `{TICKET_PREFIX}` | `.claude/skills/assess-terrain/SKILL.md` (argument-hint + key regex) | Ticket-key prefix including the dash | `DD-` · `PROJ-` |
| `{EPIC_KEY}` | `CLAUDE.md` snippet, `.claude/skills/assess-terrain/SKILL.md` | Epic id(s) that signal high-stakes work for terrain scoring. **Distinct from `{TICKET_EPIC_KEY}`** (which is the epic the Scrum Master files agent-created tickets under). | `DB-1` · `PROJ-17` |
| `{EPIC_NAME}` | `CLAUDE.md` snippet (Epics table) | Human-readable epic name | `Database Schema & Migrations` |
| `{EPIC_DESCRIPTION}` | `CLAUDE.md` snippet (Epics table) | Brief epic description | `Alembic migrations, DB fields` |

---

## Runtime tokens — DO NOT fill (they are not domain placeholders)

These match `{[A-Z_]+}` but are filled by the framework at runtime, not by you at install.
The self-verify grep below will still list them — that is expected.

| Token | Where | What it is |
|-------|-------|-----------|
| `{NNN}` | `personas/scrum-master.md`, `agents/scrum-master.md` | Error number the Scrum Master assigns when an error first occurs (`ERR-{NNN}`) |
| `{N}` | several `squads/*.md`, `protocols/*.md`, `_template.md` | Runtime counters (round number, occurrence count) |
| `{EM}` | `squads/philosophy-squad.md` | Table-cell separator artifact |
| `${MISSION}`, `${SESSION_ID}`, `${BOARD}` | `protocols/*.md` (bash code blocks) | Shell variables set by scripts at runtime — they only *look* like tokens because `${VAR}` contains `{VAR}` |
| `{PLACEHOLDER}` | `DOMAIN-INJECTION.md`, `CLAUDE-SNIPPET.md` | The literal word used in prose ("fill in all `{PLACEHOLDER}` values") — not a token to fill |

---

## Verification Steps

After substituting the required (and any applicable optional) placeholders:

1. Run the self-verify grep over the installed tree:
   ```bash
   grep -rE '\{[A-Z_]+\}' .claude/hive/ .claude/rules/ .claude/skills/assess-terrain/
   ```
   Every placeholder from the **Required**, **Optional**, and **Integration-layer** tables above
   must be gone. Only the **runtime tokens** (`{NNN}`, `{N}`, `{EM}`, shell `${VAR}` references,
   the literal `{PLACEHOLDER}`) may legitimately remain, plus any optional token you chose not to
   use. `bootstrap.sh` restricts its own count to `*.md` files so copied shell scripts don't
   inflate it.
2. Run `/assess-terrain` on a real ticket to verify the skill works end-to-end.
3. Check `.claude/hive/integration-guide.md` renders correctly in your editor.

---

## Notes

- A completed worked example lives at `docs/examples/scrum-master-minersdiners.md` (the Scrum
  Master persona with every token filled for MinersDiners) — use it as a reference fill.
- `scripts/bootstrap.sh --dry-run` shows every file that will be touched without making changes.
- Each concept has exactly one token name, so a placeholder that appears in several files (e.g.
  `{TICKET_SYSTEM_CLI}`) is filled once with the same value everywhere it occurs.
