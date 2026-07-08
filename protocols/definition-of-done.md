# Definition of Done

> Single source of truth for mission completion criteria. All squads reference this protocol.

## Levels

### `solo-complete`

Applies to: Solo work (no squad). Lightweight gate.

- [ ] Tests pass (full suite, not just new tests)
- [ ] Acceptance criteria verified (if ticket/ACs exist)
- [ ] Session log updated (`docs/sessions/`)

### `mission-complete` (default for all squad missions)

Applies to: All Hive squad missions unless Commander's Intent specifies otherwise.

**Preflight (Scrum Master, Phase 0):**
- [ ] Task tracking linked to mission (project-dependent, see below)
- [ ] Acceptance criteria exist (from ticket, Commander's Intent, or interview)
- [ ] Acceptance criteria extracted and written to blackboard `## Acceptance Criteria`

Task tracking per project:
| Project | Tracker | Preflight action |
|---------|---------|-----------------|
| MinersDiners | Jira (DD) | Link ticket, set "In Arbeit", extract ACs from ticket |
| CrossLoom | File-based / commit | Note task in Commander's Intent, ACs from interview |
| Other | Git commit | ACs from Commander's Intent or interview |

If no formal tracker exists, ACs come from the Commander's Intent or a quick interview with Peter. The absence of Jira is a WARN, not a blocker.

Stack-specific verification steps (appended to the default gate below, per project — the default list stays stack-agnostic so the framework ports cleanly):
| Project stack | Additional verification step |
|---------------|-----------------------------|
| Python + Alembic migrations | If a migration exists: `alembic upgrade head` + `alembic downgrade -1` + `alembic upgrade head` |
| Containerized infra (Docker) | If diff touches infra files (Dockerfile, requirements.txt, docker-compose.yml, shared/): Docker build + health check |

**Verification (Verifier or Orchestrator, Phase 6):**
- [ ] Each AC verified individually (structured checklist on blackboard `## Acceptance Criteria Verification`)
- [ ] Tests exist for all new/changed code (zero tests = FAIL, merge-blocking)
- [ ] `{PROJECT_TEST_COMMAND}` passes (full suite, not just new tests)
- [ ] Coding guidelines compliance checked
- [ ] No unresolved review findings
- [ ] Stack-specific verification steps for this project pass (see the table above)
- [ ] If quorum was not reached on a key question, an INSUFFICIENT BASIS finding (`protocols/insufficient-basis.md`) is recorded — "we do not know" is a completion-valid answer

**Cleanup (Scrum Master, post-mission):**
- [ ] Session log created (`docs/sessions/`)
- [ ] Task tracker updated (Jira comment if MinersDiners; commit message if other)
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
| Review | No | Orchestrator (checks ACs against review findings) |
| Research | No | Orchestrator (verifies research findings address ACs) |
| Creative | No | Orchestrator (verifies ideas address creative brief ACs) |
| Strategy | No | Orchestrator (verifies scenarios address strategic question ACs) |
| Philosophy | No | Orchestrator (verifies understanding addresses philosophical ACs) |
| Management | No | Orchestrator (verifies plan addresses initiative ACs) |

For squads without a Verifier, the Orchestrator verifies ACs as part of the Synthesis phase. The structured checklist format is the same regardless of who performs it.

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

The Verifier (or Orchestrator) writes verification results:

```markdown
## Acceptance Criteria Verification
<!-- Written by Verifier/Orchestrator during verification phase. -->
Source: DD-XXX
- [x] AC 1 text (PASS)
- [ ] AC 2 text (FAIL -- reason)
- [x] AC 3 text (PASS)
```
