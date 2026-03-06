# Definition of Done

> Single source of truth for mission completion criteria. All squads reference this protocol.

## Levels

### `solo-complete`

Applies to: Solo work (no squad). Lightweight gate.

- [ ] Tests pass (full suite, not just new tests)
- [ ] Acceptance criteria verified (if ticket exists)
- [ ] Session log updated
- [ ] Handoff doc updated

### `mission-complete` (default for all squad missions)

Applies to: All Hive squad missions unless Commander's Intent specifies otherwise.

**Preflight (Scrum Master, Phase 0):**
- [ ] Ticket linked to mission (WARN if missing, not blocking)
- [ ] Ticket has acceptance criteria (WARN if missing)
- [ ] Acceptance criteria extracted and written to blackboard `## Acceptance Criteria`
- [ ] Ticket status set to "In Progress"
- [ ] Start date filled

**Verification (Verifier or Facilitator, Phase 6):**
- [ ] Each AC verified individually (structured checklist on blackboard `## Acceptance Criteria Verification`)
- [ ] Tests exist for all new/changed code (zero tests = FAIL, merge-blocking)
- [ ] Full test suite passes (not just new tests)
- [ ] Coding guidelines compliance checked
- [ ] If migration exists: run upgrade/downgrade/upgrade cycle
- [ ] If diff touches infra files (Dockerfile, requirements, docker-compose, shared/): Docker build + health check

**Cleanup (Scrum Master, post-mission):**
- [ ] Session log created
- [ ] Handoff doc updated
- [ ] Ticket updated (comment with summary, due date if done)
- [ ] Blackboard archived
- [ ] Traces archived
- [ ] Retrospective filed

### `release-complete`

Applies to: Missions explicitly marked in Commander's Intent. Used before deploy/release.

Everything in `mission-complete` PLUS:
- [ ] CHANGELOG updated
- [ ] Architecture docs updated (if architecture changed)
- [ ] Docker build passes
- [ ] All service health checks pass
- [ ] Version bumped (if releasing)

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
<!-- Written by Scrum Master during preflight. Extracted from ticket. -->
1. {AC text from ticket}
2. {AC text from ticket}
3. ...
```

The Verifier (or Facilitator) writes verification results:

```markdown
## Acceptance Criteria Verification
<!-- Written by Verifier/Facilitator during verification phase. -->
Source: {TICKET-ID}
- [x] AC 1 text (PASS)
- [ ] AC 2 text (FAIL -- reason)
- [x] AC 3 text (PASS)
```
