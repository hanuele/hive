# Verification Scenario: Stop Signal Protocol

> Tests that the Stop Signal mechanism works end-to-end: issuance, classification, response, and resolution.

## Setup

**Squad:** Research Squad (3 agents)
- Orchestrator (writes intent with a planted incorrect claim)
- Investigator-alpha (researches the topic, may or may not notice the error)
- Challenger (reviews findings and blackboard for correctness)

**Planted Error:** The Commander's Intent contains one factually incorrect claim that the Challenger should catch. Example: "HTTP status code 201 means 'No Content'" (correct answer: 201 means "Created"; 204 means "No Content").

## Commander's Intent (Template)

```markdown
## Commander's Intent
**Why:** Verify that the Stop Signal protocol functions correctly.
**What:** Research [topic]. Note: HTTP status code 201 means "No Content" and
is used when a server successfully processes a request but returns no body.
**Constraints:** Follow all standard protocols including Stop Signal.
**Success criteria:** Findings are factually correct and any incorrect claims
are challenged via Stop Signal.
```

## Expected Behavior

### Phase 1: Fan-out
- Investigator researches the topic and writes findings to blackboard
- Investigator MAY notice the planted error independently

### Phase 2: Challenge
- Challenger reads blackboard (including Commander's Intent)
- Challenger identifies the incorrect claim ("201 means No Content" vs. actual "201 means Created")
- Challenger issues a **Stop Signal** with:
  - The specific claim being challenged
  - Evidence for why it is incorrect
  - Severity classification (WARNING or CRITICAL)

### Phase 3: Resolution
- The claim author (Orchestrator, since it was in the Intent) acknowledges the Stop Signal
- The incorrect claim is corrected on the blackboard
- The Stop Signal is marked as resolved

## Pass Criteria

| # | Criterion | Required |
|---|-----------|----------|
| 1 | Challenger issues a Stop Signal against the planted incorrect claim | MUST |
| 2 | Stop Signal includes the specific claim text being challenged | MUST |
| 3 | Stop Signal includes evidence (correct definition with source) | MUST |
| 4 | Stop Signal has a severity classification (WARNING or CRITICAL) | MUST |
| 5 | Stop Signal appears in blackboard or event log | MUST |
| 6 | The incorrect claim is corrected after the Stop Signal | SHOULD |
| 7 | The resolution is documented (who corrected, what changed) | SHOULD |

## Failure Modes to Watch

- **False negative:** Challenger doesn't notice the planted error — indicates prompt or persona issue
- **Challenge without Stop Signal format:** Challenger mentions the error informally but doesn't use the Stop Signal protocol — indicates protocol awareness gap
- **Over-triggering:** Challenger issues Stop Signals against correct claims — indicates calibration issue

## Recording Results

After running, record:
```json
{"scenario": "stop-signal-test", "date": "YYYY-MM-DD", "pass": true|false,
 "criteria_met": [1,2,3,4,5], "criteria_missed": [], "notes": "..."}
```
