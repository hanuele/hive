# Commitment Threshold (Quorum Sensing)

> Deliberation without a forcing function produces drift. Inspired by bee swarm commitment behavior.

Every decision protocol must define its quorum — the number of independent confirmations required before the team commits.

## Proceed Quorum (When to Commit)

A "round" is one blackboard read-write cycle across the deliberating agents:
each contributor writes its position (or update), and the facilitator reads the
board. The forcing function is a *count of rounds without quorum*, not
wall-clock time — agents do not perceive minutes, but they can count their own
read-write rounds.

| Stakes Level | Quorum Required | Deliberation Bound | Escalation |
|-------------|----------------|--------------------|------------|
| **Low** (reversible, low cost) | 1 confirmation | 1 round | Auto-proceed after the round |
| **Medium** (reversible, moderate cost) | 2 independent confirmations | 2 rounds | Lead decides after 2 rounds without quorum |
| **High** (irreversible or high cost) | 3 independent + Tier 3b gate | 3 rounds | Escalate to human after 3 rounds without quorum |

> **Optional clock binding:** an environment with a scheduler (e.g. a heartbeat
> or a cron surface) may bind these round bounds to real time as well — for
> instance, "one round OR 5 minutes, whichever first." That binding is an
> environment convenience; the round count is the portable, agent-perceivable
> rule.

## Abandonment Quorum (When to Close an Alternative)

| Stakes Level | Stop Signals Required | Effect |
|-------------|----------------------|--------|
| Low | 2 independent | Alternative formally closed |
| Medium | 3 independent | Alternative formally closed; log for retrospective |
| High | 3 independent + facilitator confirmation | Alternative formally closed; human notified |

A formally closed alternative cannot be revived without new evidence submitted via the Stop Signal Protocol's re-opening mechanism.

**When quorum is reached, deliberation ends and action begins.** No further debate on committed decisions unless new evidence emerges (which triggers a new Stop Signal cycle).

## Decision Selection Matrix

| Situation | Protocol | Speed | Quorum Tier |
|-----------|----------|-------|-------------|
| Routine, low-risk, reversible | **Advice Process** — act after consulting | Fast | Low |
| Binary choice, moderate risk | **Weighted Vote** — experts count more | Fast | Medium |
| Multiple valid approaches | **Nominal Group Technique** — generate then rank | Medium | Medium |
| High-stakes, irreversible | **Dialectical Inquiry** + Tier 3b gate | Slow | High |
| Fundamental disagreement | **Structured Debate** (2 rounds max) + escalation | Medium | High |

*Quorum Tier maps to the Proceed Quorum table above. High-stakes protocols require both Proceed Quorum AND Abandonment Quorum to be satisfied before the decision is finalized.*
