# Definition of Done

> Single source of truth for mission completion criteria. All squads reference this protocol.

## Levels

### `solo-complete`

Applies to: Solo work (no squad). Lightweight gate.

- [ ] Tests pass (full suite, not just new tests)
- [ ] Acceptance criteria verified (if Jira ticket exists)
- [ ] Session log updated (`docs/sessions/`)
- [ ] Handoff doc updated (`docs/handoff/`)

### `mission-complete` (default for all squad missions)

Applies to: All Hive squad missions unless Commander's Intent specifies otherwise.

**Preflight (Scrum Master, Phase 0):**
- [ ] Jira ticket linked to mission (WARN if missing, not blocking)
- [ ] Ticket has acceptance criteria (WARN if missing)
- [ ] Acceptance criteria extracted and written to blackboard `## Acceptance Criteria`
- [ ] Ticket status set to "In Arbeit" (start date set automatically by Jira Automation)

**Verification (Verifier or Facilitator, Phase 6):**
- [ ] Each AC verified individually (structured checklist on blackboard `## Acceptance Criteria Verification`)
- [ ] Tests exist for all new/changed code (zero tests = FAIL, merge-blocking)
- [ ] Full test suite passes (not just new tests)
- [ ] Coding guidelines compliance checked
- [ ] If migration exists: `alembic upgrade head` + `alembic downgrade -1` + `alembic upgrade head`
- [ ] If diff touches infra files (Dockerfile, requirements.txt, docker-compose.yml, shared/): Docker build + health check

**Cleanup (Scrum Master, post-mission):**
- [ ] Session log created (`docs/sessions/`)
- [ ] Handoff doc updated (`docs/handoff/`)
- [ ] Jira ticket updated (comment with summary; due date set automatically by Jira Automation)
- [ ] Blackboard archived
- [ ] Traces archived
- [ ] Retrospective filed
- [ ] Farewells sent to all squad agents (per `protocols/agent-farewell.md`)
- [ ] Mission findings archived to mycelium (if Neo4j available) — `ingest-hive-findings.py`

### `release-complete`

Applies to: Missions explicitly marked in Commander's Intent. Used before deploy/release.

Everything in `mission-complete` PLUS:
- [ ] CHANGELOG.md updated
- [ ] ARCHITECTURE.md updated (if architecture changed)
- [ ] Docker build passes (`docker compose up --build`)
- [ ] All service health checks pass
- [ ] VERSION.md bumped (if releasing)

---

## AC Verification Ownership

| Squad | Has Verifier? | AC Verification Owner |
|-------|--------------|----------------------|
| Engineering | Yes | Verifier (standard) |
| Review | No | Facilitator (checks ACs against review findings) |
| Research | No | Facilitator (verifies research findings address ACs) |
| Creative | No | Facilitator (verifies ideas address creative brief ACs) |
| Strategy | No | Facilitator (verifies scenarios address strategic question ACs) |
| Philosophy | No | Facilitator (verifies understanding addresses philosophical ACs) |
| Management | No | Facilitator (verifies plan addresses initiative ACs) |

For squads without a Verifier, the Facilitator verifies ACs as part of the Synthesis phase. The structured checklist format is the same regardless of who performs it.

---

## AC Checklist Format (Blackboard)

The Scrum Master writes ACs to the blackboard during preflight:

```markdown
## Acceptance Criteria
<!-- Written by Scrum Master during preflight. Extracted from Jira ticket. -->
1. {AC text from ticket}
2. {AC text from ticket}
3. ...
```

The Verifier (or Facilitator) writes verification results:

```markdown
## Acceptance Criteria Verification
<!-- Written by Verifier/Facilitator during verification phase. -->
Source: DD-XXX
- [x] AC 1 text (PASS)
- [ ] AC 2 text (FAIL -- reason)
- [x] AC 3 text (PASS)
```
