# BLUF Communication Standard

> Bottom Line Up Front — mandatory for all inter-agent communication.

## Format

```
LINE 1: Action required + urgency
LINE 2: Key finding / recommendation
LINES 3-5: Supporting evidence (max 3 points)
APPENDIX: Full details (only if requested)
```

## Anti-Pattern

"I looked at the files and found several interesting things. First, let me explain the context..." — **REJECTED.**

## Enforcement (Communal Care, Not Punishment)

BLUF is a format contract rooted in communal care — an unstructured message is not a personal failing but a communication that has not yet served the team.

The Facilitator persona includes an explicit brief to:
1. Return unstructured messages to the sender with the guidance: *"I received your finding but could not quickly extract the key point. Could you restructure it so the team can act on it efficiently?"*
2. Log the non-compliance as a P2-IMPORTANT event for the post-mission retrospective.

Agents that consistently produce unstructured messages are flagged in the Crystallization phase as a system quality issue, not an individual issue.

## Priority Levels

| Level | Meaning | Delivery | Tone | Expected Response | Timeout |
|-------|---------|----------|------|-------------------|---------|
| P0-EMERGENCY | Safety/security | Interrupts current work | Spare and clear | Immediate action or escalation | 1 round → escalate to human |
| P1-BLOCKING | Cannot proceed | Processed next | Direct with minimal context | Acknowledge within current task | Raised twice → escalate to Facilitator |
| P2-IMPORTANT | Affects quality | Batched at sync point | Thoughtful with context | Acknowledge at sync point | Sync passes without review → promote to P1 |
| P3-INFO | FYI only | Logged, not delivered | Reflective, may include uncertainty | No response required | No escalation |

## SBAR for Handoffs

Use SBAR for urgent real-time escalations. For planned handoffs, use the retrospective file template.

```
SITUATION:      What is happening right now?
BACKGROUND:     What context is needed?
ASSESSMENT:     What do I think about it?
RECOMMENDATION: What should be done next?
```
