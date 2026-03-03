# Stop Signal Protocol

> Inspired by honeybee swarm decision-making, where scout bees "headbutt" dancers advertising inferior nest sites.

## What It Is

Any agent can issue a Stop Signal against a **specific claim** (not an agent, not a direction — a *claim*). A Stop Signal requires evidence.

## How It Works

1. Agent identifies a claim it believes is wrong or unsupported.
2. Agent issues a Stop Signal on the blackboard:

```
STOP SIGNAL: [claim being challenged]
Acknowledged: [what the original finding got right]
Evidence: [why this claim is problematic]
Severity: CRITICAL | WARNING | INFO
Alternative: [proposed alternative, if any]
```

A Stop Signal begins with what it acknowledges. Even the most critical challenge should state what the original finding got right before stating where it falls short. This is not politeness — it is effective communication. A message that cannot be received has no effect, regardless of its accuracy.

3. If the claim's author can refute with evidence, the Stop Signal is resolved. After receiving a Stop Signal, the challenged agent should re-examine its claim with genuine openness before responding. A response that simply reasserts the original claim with more emphasis has not engaged with the challenge.

4. Two independent Stop Signals against the same claim → mandatory re-evaluation.

5. A CRITICAL Stop Signal blocks progress on that claim until resolved.

6. If re-evaluation yields no resolution (evidence remains contested):
   - **CRITICAL:** Escalate to human. No further agent deliberation.
   - **WARNING:** Facilitator decides. Log reasoning. Move forward.
   - **INFO:** Facilitator closes as "unresolved." Document for retrospective.

7. A claim that receives 3+ Stop Signals without successful refutation is formally **CLOSED**. It may only be re-opened if new evidence is introduced that was not available during the original challenge cycle.

## What It Is NOT

- Not a veto on a direction or approach (that requires structured debate)
- Not a personal challenge to an agent (it targets claims, not agents)
- Not optional to respond to (the claim's author must address it)

## Structured Disagreement Format

```yaml
stop_signal:
  agent: "{agent}"
  claim: "The specific claim being challenged"
  type: "evidence_gap | logical_flaw | alternative_explanation"
  evidence: "Why this challenge is warranted"
  severity: "CRITICAL (blocks) | WARNING (logs) | INFO (notes)"
  alternative: "Proposed alternative, if any"
  acknowledged: "What the original finding got right"
```
