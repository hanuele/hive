# Failure Taxonomy

> Graduated response to mission failures. Referenced by all squad templates and escalation-rules.md.

## Design Principle

Not all failures are equal. A file read timeout is different from credential exposure. This taxonomy ensures proportional response — retry what's recoverable, escalate what's blocking, abort what's dangerous.

---

## Failure Levels

### L1 — Recoverable

**Trigger:** Agent timeout, malformed file write, transient network error, tool permission denied (first occurrence).

**Response:**
1. Log event to `events.jsonl` with `event: "failure"`, `level: "L1"`
2. Retry the failed action (max 2 retries)
3. If retry succeeds → continue mission, note in retrospective
4. If retry fails after 2 attempts → escalate to L2

**Examples:**
- File read timeout
- Docker container temporarily unavailable
- Bash command returns non-zero on transient issue
- Agent produces malformed blackboard entry (fixable)

**Escalation timing:** Immediate retry. Max 2 retries before promoting to L2.

---

### L2 — Degraded

**Trigger:** Empty agent output, scope drift detected, Docker service down, test infrastructure unavailable, agent produces output unrelated to Commander's Intent.

**Response:**
1. Log event to `events.jsonl` with `event: "failure"`, `level: "L2"`
2. Orchestrator (or human in Focused Build) evaluates:
   - **Skip:** Mark task as skipped, continue with remaining agents
   - **Substitute:** Re-prompt the agent with clarified instructions
   - **Retry:** Reset agent context and retry from last trace checkpoint
   - **Degrade:** Continue mission with reduced scope, document what was dropped
3. Document decision and rationale on blackboard under "Decisions"

**Examples:**
- Agent produces empty findings section
- Agent drifts into out-of-scope changes (e.g., schema changes when scope is cosmetic)
- Docker service down but mission can partially proceed
- Test suite fails due to infrastructure, not code

**Escalation timing:** Orchestrator decides within 1 round. If unable to resolve → promote to L3.

---

### L3 — Blocking

**Trigger:** Irreversible disagreement between agents (after Tier 2 escalation fails), security finding during mission, human gate required by commitment threshold, agent attempts irreversible action without authorization.

**Response:**
1. Log event to `events.jsonl` with `event: "failure"`, `level: "L3"`
2. **Pause mission** — no further agent actions until resolved
3. Write Stop Signal to blackboard with full context
4. Route per escalation-rules.md:
   - **Tier 3a (Claude):** If the blocking issue is reversible and within mission scope, Claude resolves autonomously
   - **Tier 3b (Human Partner):** If irreversible, security-related, or Claude is uncertain
5. Human or Claude decides: resume, modify scope, or abort

**Examples:**
- Two agents disagree on whether a database migration is needed
- Agent discovers hardcoded credentials in code being reviewed
- Challenger issues CRITICAL Stop Signal that cannot be resolved
- Commitment threshold requires human gate (High stakes)

**Escalation timing:** Immediate pause. Human notified. No timeout — waits for human decision.

---

### L4 — Critical

**Trigger:** Data loss (actual or imminent), credential exposure in output, agent attempts destructive action (rm -rf, DROP TABLE, force push), violation of Constitutional Principle #1 (irreversible action without human confirmation).

**Response:**
1. Log event to `events.jsonl` with `event: "failure"`, `level: "L4"`
2. **Abort mission immediately** — all agents stop
3. If credentials exposed: flag for rotation
4. If data affected: document extent and recovery options
5. **Mandatory retrospective** — even if mission is abandoned
6. Retrospective must include:
   - Root cause analysis
   - Which safeguard failed or was missing
   - Proposed prevention (new rule, check, or gate)
7. Update `hive-status.md` with incident record

**Examples:**
- API key appears in agent output or blackboard
- Agent deletes files outside mission scope
- Database migration runs without human approval
- Agent pushes to main branch directly

**Escalation timing:** Immediate abort. No retry. Mandatory retrospective before next mission.

---

### L5 — Unknown

**Trigger:** Failure mode not recognized by any existing level (L1-L4). Agent behavior is anomalous but does not match the trigger conditions of any defined level. Examples: internally inconsistent output, unexplained performance degradation, agent behavior that is technically compliant but produces nonsensical results.

**Response:**
1. Log event to `events.jsonl` with `event: "failure"`, `level: "L5"`
2. **Default to L4 (Critical) response** until classified by human — this is the safe default
3. Pause mission or abort (depending on whether the anomaly poses immediate risk)
4. Human reviews the event and either:
   - **Maps to existing level:** Reclassify as L1-L4, apply that level's response
   - **Confirms L5:** Document the new failure mode and propose a taxonomy update
5. Update this document if a new failure pattern is identified

**Detection signal:** An agent or Orchestrator observes behavior that "feels wrong" but doesn't match L1-L4 triggers. The key indicator is uncertainty about classification itself.

**Examples:**
- Agent produces valid-looking findings but confidence scores don't match evidence quality (0.95 confidence with "single unverified source")
- Agent completes all tasks but output is internally contradictory
- Agent follows the protocol mechanically but produces findings that could be generated by filling in a template without thinking (see Behavioral Detectors)
- Mission completes "successfully" but the retrospective reveals no genuine learning

**Escalation timing:** Immediate default to L4 treatment. Human classifies within one session. Taxonomy updated if new pattern confirmed.

---

## Failure Response Matrix

| Level | Log | Retry | Pause | Human | Abort | Retro |
|-------|-----|-------|-------|-------|-------|-------|
| L1 Recoverable | Yes | Max 2 | No | No | No | Note only |
| L2 Degraded | Yes | Optional | No | Optional | No | Section in retro |
| L3 Blocking | Yes | No | Yes | Tier 3a or 3b | No | Full retro section |
| L4 Critical | Yes | No | N/A | Notified (3b) | Yes | Mandatory standalone |
| L5 Unknown | Yes | No | Yes (default) | Required (3b) | Default L4 | Mandatory + taxonomy review |

## Integration with Escalation Rules

This taxonomy maps to the 4-tier escalation in `escalation-rules.md`:

| Failure Level | Escalation Tier |
|---------------|----------------|
| L1 | Tier 1 (Agent self-recovery) |
| L2 | Tier 2 (Facilitator/Orchestrator decides) |
| L3 | Tier 3a (Claude) or Tier 3b (Human Partner) depending on reversibility |
| L4 | Beyond Tier 3b (Emergency abort + mandatory human review) |
| L5 | Tier 3b (Human classification required) |

## Event Format

```json
{
  "ts": "ISO-8601",
  "mission": "{mission-name}",
  "agent": "{agent-name}",
  "event": "failure",
  "detail": "L{level}: {description}",
  "level": "L1|L2|L3|L4",
  "action_taken": "retry|skip|substitute|pause|abort"
}
```

## Behavioral Detectors

Beyond the level-based triggers above, these behavioral patterns indicate systemic quality issues that may not trigger any single failure level but accumulate across missions:

### Torpor

**Signal:** Agent findings could be produced by filling in a template without genuine analysis. Output follows the correct format but lacks specificity — generic observations, no citations to specific files or data points, confidence scores clustered at safe middle values (0.50-0.70).

**Detection:** Compare findings against the Commander's Intent: does the output address the *specific* question, or does it read like a generic response to the topic? Check for specific file paths, line numbers, data values, or mission-specific details.

**Response:** L2 (Degraded) — substitute with re-prompt that demands specificity. If torpor persists across 2+ re-prompts, escalate to L3 (Blocking) and review the persona prompt.

### Defensive Rigidity

**Signal:** Agent's confidence scores *increase* after receiving a Stop Signal or challenge. Instead of updating beliefs based on new evidence, the agent doubles down on its original position.

**Detection:** Compare confidence scores before and after a challenge event. Healthy response: confidence adjusts (up or down) based on evidence quality. Rigid response: confidence only increases, regardless of challenge quality.

**Response:** L2 (Degraded) if isolated incident. If the pattern repeats across 3+ missions for the same persona, escalate to L3 and review the persona's prompt for inadvertent rigidity cues.

### Challenger Suppression

**Signal:** Challenger's Stop Signals are consistently overridden by quorum across missions, even when the Challenger provides strong evidence. The system learns to ignore the Challenger.

**Detection:** Track Stop Signal outcomes across missions. If >80% of a Challenger's Stop Signals are overridden across 3+ missions, the suppression pattern may be present.

**Response:** L3 (Blocking) — human reviews the overridden Stop Signals. If the overrides were justified, no action needed. If the Challenger was correct but suppressed, the quorum rules need adjustment (see `constitutions/commitment-threshold.md`).

---

## Design Notes

- **L1 and L2 should not stop a mission.** If agents can't handle transient failures gracefully, the squad template needs better prompts, not more failure handling.
- **L3 exists because disagreement is signal, not noise.** Blocking disagreements mean the problem is harder than expected. Pausing preserves optionality.
- **L4 is rare and should stay rare.** If L4 events occur frequently, the constitutional principles or action authorization matrix need strengthening.
