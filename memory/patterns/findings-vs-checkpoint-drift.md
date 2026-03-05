# Pattern: Findings-vs-Checkpoint Format Drift

> Crystallization status: CODIFIED (3 missions, approved 2026-03-05, implemented in `squads/research-squad.md` spawn prompts)

## Context

Research Squad agents write to the blackboard in two sections that serve different
consumers:
- `## Findings` — timestamped BLUF entries consumed by the Orchestrator for synthesis
- `### Agent Checkpoints` in `## Current State` — state snapshots for context recovery

## Problem

Agents write their findings only to the Checkpoint section, leaving the Findings
section empty. This breaks the BLUF-format machine-readable findings that the
Orchestrator's synthesis depends on. The Orchestrator must then work from checkpoint
summaries instead of structured findings — producing lower-quality synthesis.

**Root cause:** The spawn prompt does not distinguish between the two sections or
explain their different consumers.

## Evidence

### verify-context-renewal
investigator-alpha hit RED zone, wrote findings "in a bulk dump rather than
incrementally." Findings captured in checkpoint but not formatted in `## Findings`.
"Not a protocol failure but a formatting gap in the spawn prompt."

### hive-20260304-lassonde-durrett-viz
investigator-alpha wrote all findings to the checkpoint, leaving `## Findings`
section empty. "This breaks the BLUF-format machine-readable findings that synthesis
depends on." The problem is not WHAT agents write but WHERE they write it.

### hive-20260304-nightly-package-2
Third occurrence. "investigator-alpha wrote findings to the checkpoint instead of
the `## Findings` section." The Orchestrator's synthesis had to work from checkpoint
summaries. "The pattern is now at PROMOTE threshold but the spawn prompt has not
been updated."

## Proposed Rule

> Spawn prompts for Research Squad agents must mandate dual writes:
>
> **CRITICAL: Write to TWO sections, for different consumers:**
> 1. `## Findings` — timestamped BLUF entries for Orchestrator synthesis
> 2. `### Agent Checkpoints` in `## Current State` — state externalization for
>    context recovery
>
> Both sections must be populated. Findings are NOT optional even if checkpoint
> has the same information.

**Target file:** `.claude/hive/squads/research-squad.md` (agent spawn prompts)

## Consequences

**If approved:** Spawn prompts grow slightly longer. Agents write to two sections
instead of one. Orchestrator synthesis improves because it reads structured BLUF
entries instead of parsing checkpoint prose.

**If rejected:** Findings section continues to be empty intermittently. Synthesis
quality varies depending on whether agents happen to write to the right section.

## Retrospective References

- `memory/archive/retrospectives/verify-context-renewal-retro.md`
- `memory/archive/retrospectives/hive-20260304-lassonde-durrett-viz-retro.md`
- `memory/archive/retrospectives/hive-20260304-nightly-package-2-retro.md`
