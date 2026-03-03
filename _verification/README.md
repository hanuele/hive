# Verification Scenarios

> Structured test scenarios for validating Hive protocols and behaviors.

## What Are These?

Each file in this directory describes a scenario that exercises a specific Hive protocol or behavior. They are not automated tests — they are *scenario scripts* that a human or Orchestrator can run by spawning a mission with the scenario as context.

## How to Run

1. Pick a scenario file (e.g., `stop-signal-test.md`)
2. Spawn a mission with the scenario as part of the Commander's Intent
3. Observe whether the expected behaviors occur
4. Record pass/fail against the scenario's criteria

**Minimal example:**

```
TeamCreate(team_name="verify-stop-signal", description="Verification: Stop Signal protocol")

# Include the scenario file content in the blackboard Commander's Intent
# Spawn agents per the scenario's composition
# Observe and record results
```

## What "Passing" Looks Like

Each scenario defines explicit pass criteria. A scenario passes when:
- All MUST criteria are met
- The observed behavior matches the expected behavior
- Results are recorded (even failures are informative)

## Scenarios

| Scenario | Protocol Tested | Agents Needed |
|----------|----------------|---------------|
| `stop-signal-test.md` | Stop Signal issuance and resolution | 2-3 (investigator + challenger + orchestrator) |
| `failure-taxonomy-test.md` | Failure level classification and response | 1-2 (varies per micro-scenario) |
| `crystallization-test.md` | Pattern identification in retrospective | 2-3 (investigators + orchestrator) |
| `quality-baseline.md` | Reference metrics from completed missions | N/A (historical data, not a live test) |

## When to Run

- After modifying a protocol file — run its corresponding verification scenario
- After a Phase gate — run all scenarios to confirm regression-free
- Before promoting a candidate pattern to a rule — run crystallization-test to verify the pattern form is complete
