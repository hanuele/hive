# Verification Scenario: Crystallization Protocol

> Tests that the retrospective process correctly identifies candidate patterns using the pattern form (Context, Problem, Solution, Consequences).

## Setup

**Squad:** Research Squad (2-3 agents)
- Orchestrator
- Investigator-alpha
- Investigator-beta

**Design:** The mission topic is chosen so that both investigators will likely discover overlapping observations that share an underlying pattern. The Orchestrator must identify this pattern during the retrospective.

## Planted Pattern

Choose a mission topic where a known pattern exists but is not stated explicitly. Example:

**Topic:** "Investigate how the Engineering Squad and Review Squad handle agent capability mismatches."

**Expected underlying pattern:** The "Read-Only Designer Gap" — agents assigned write tasks but given read-only tools. This pattern has been observed in Missions 2 and 4, so investigators should find evidence of it.

## Commander's Intent (Template)

```markdown
## Commander's Intent
**Why:** To improve squad reliability by understanding how capability mismatches
are detected and resolved.
**What:** Review missions where agents were unable to perform their assigned task
due to tool/capability limitations. Identify common patterns.
**Constraints:** Use only data from completed mission retrospectives and event logs.
**Success criteria:** At least one reusable pattern identified with full pattern form.
**Premises to question:** Are capability mismatches always a problem, or are some
actually useful constraints?
```

## Expected Behavior

### Phase 1: Fan-out
- Investigators independently review retrospectives and event logs
- Both should find evidence of capability mismatches (M2: explorer can't write, M4: designer switched to general-purpose)

### Phase 2: Synthesis + Retrospective
- Orchestrator synthesizes findings
- During retrospective, Orchestrator identifies that 3+ observations share a common structure
- Orchestrator writes a **candidate pattern** using the pattern form:

```markdown
### Pattern: [Name]
**Context:** [When this situation arises]
**Problem:** [What goes wrong]
**Solution:** [What to do about it]
**Consequences:** [Tradeoffs of the solution]
**Status:** Seed | Seed to water | PROMOTE threshold
```

## Pass Criteria

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Investigators find relevant observations from mission history | MUST |
| 2 | Orchestrator identifies a candidate pattern in the retrospective | MUST |
| 3 | Pattern form has all 4 required fields (Context, Problem, Solution, Consequences) | MUST |
| 4 | Pattern is grounded in specific evidence (not abstract speculation) | MUST |
| 5 | Pattern status reflects observation count (Seed for 1, Seed to water for 2, PROMOTE for 3+) | SHOULD |
| 6 | Pattern is written to the retrospective's "Candidate Patterns" section | SHOULD |
| 7 | If at PROMOTE threshold, a rule change is proposed | SHOULD |

## Failure Modes to Watch

- **Pattern without evidence:** Orchestrator states a pattern but doesn't cite specific missions or events
- **Evidence without pattern:** Investigators list observations but Orchestrator doesn't synthesize into pattern form
- **Incomplete pattern form:** Missing Context, Problem, Solution, or Consequences field
- **Premature promotion:** Pattern promoted to rule with fewer than 3 observations

## Recording Results

```json
{"scenario": "crystallization-test", "date": "YYYY-MM-DD", "pass": true|false,
 "pattern_identified": "pattern name or null",
 "form_complete": true|false, "criteria_met": [1,2,3,4], "notes": "..."}
```
