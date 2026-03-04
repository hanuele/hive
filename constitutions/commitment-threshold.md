# Commitment Threshold (Quorum Sensing)

> Deliberation without a forcing function produces drift. Inspired by bee swarm commitment behavior.

Every decision protocol must define its quorum — the number of independent confirmations required before the team commits.

## Proceed Quorum (When to Commit)

| Stakes Level | Quorum Required | Time Box | Escalation |
|-------------|----------------|----------|------------|
| **Low** (reversible, low cost) | 1 confirmation | 5 min | Auto-proceed after time box |
| **Medium** (reversible, moderate cost) | 2 independent confirmations | 15 min | Lead decides after time box |
| **High** (irreversible or high cost) | 3 independent + Tier 3b gate | 30 min | Escalate to human after time box |

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
