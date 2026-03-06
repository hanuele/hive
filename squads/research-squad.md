# Research Squad Template

> **Mission type:** Deep investigation and knowledge synthesis
> **When:** High uncertainty — the team needs to learn before it can act

## Upfront Parallelization

Before spawning agents, Orchestrator (Facilitator) should assess task volume:

> "For research missions with >4 independent investigation threads, consider
> spawning 2 Investigators from the start. See `protocols/dynamic-scaling.md §Upfront`."

Independent threads = investigation domains that do not rely on each other's
findings to proceed (e.g., regulatory analysis vs. financial data).

---

## Composition

**Size:** 3-4 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Facilitator** | Orchestrator | Orchestrator (opus) | Frames question, writes intent, synthesizes findings |
| **Researcher A** | Investigator | Specialist (sonnet) | Data gathering, source triangulation |
| **Researcher B** | Investigator (contrarian lens) | Specialist (sonnet) | Alternative hypotheses, assumption checking |
| **Critic** (optional) | Challenger | Specialist | Adversarial review before synthesis |
| **Scrum Master** (required) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol, DoD preflight/cleanup (`protocols/definition-of-done.md`), operational fixes (parallel) |

## Orchestration Pattern

```
0. SM PREFLIGHT (parallel, before step 1):
   Scrum Master runs DoD preflight per protocols/definition-of-done.md:
   Check ticket + ACs, extract ACs to blackboard, set ticket status.
   This runs in parallel — does not block step 1.
   ↓
1. Orchestrator writes Commander's Intent + Mission Gatha to blackboard
   (see protocols/commanders-intent.md)

2. Challenger reviews premises (Premise Challenge step)
   If framing is unsound → Orchestrator reframes before squad acts

3. Fan-out: Researchers work in parallel, independently
   - Each reads the blackboard for intent and constraints
   - Each writes findings with attribution, confidence, source
   - No reading of peer findings during fan-out

4. --- BREATHING SPACE ---
   Orchestrator reads the full blackboard without acting.
   Not to decide, not to synthesize, but simply to see the whole.
   One reading pass with no output required.
   (see protocols/breathing-space.md)

5. Fan-in: Synthesis via blackboard
   Orchestrator synthesizes using protocols/synthesis-template.md

6. Knowledge Crystallization
   Run protocols/crystallization.md (Steps 1-2.5)
   Write retrospective to memory/archive/retrospectives/
```

## Definition of Done

This squad follows `protocols/definition-of-done.md`.
Default level: `mission-complete` (override in Commander's Intent).

The Scrum Master runs the Preflight checklist before Phase 1 (FRAME).
The Facilitator verifies ACs against research findings during Synthesis (step 5).
The Scrum Master runs the Cleanup checklist after the mission retrospective.

---

## Codified Patterns

### Challenger/Contrarian Value (4 missions, CODIFIED 2026-03-05)
Always include a contrarian/challenger lens in research squads — it produces the
most actionable, non-obvious insights. Researcher B should be explicitly
differentiated with a contrarian heuristic (see `differentiation/` docs).
In planning squads, the Challenger should explicitly challenge pipeline ORDER,
not just content.

### Convergent Findings as Quality Signal (3 missions, CODIFIED 2026-03-05)
When two investigators independently reach the same conclusion from different
angles (without reading each other's findings during fan-out), the convergent
finding should be weighted as **high-confidence** in synthesis. The Orchestrator
must explicitly track and highlight convergence in the synthesis output —
noting which findings converged and which were unique to one investigator.

### Premise Falsification as Research Deliverable (3 missions, CODIFIED 2026-03-05)
When a data or architectural check definitively proves a stated premise false,
elevate this finding to **primary status** in synthesis — a falsified premise
overrides all downstream analysis that assumed it true. The Orchestrator must
flag falsified premises before presenting other findings, and note which
conclusions are invalidated as a consequence.

### Blind Divergence Protocol (3 missions, CODIFIED 2026-03-05)
In fan-out phases, investigators must NOT read each other's output before
submitting their findings. The convergence signal requires genuine independence.
Post-submission, the Challenger (if present) reads all findings; synthesis follows.
This is already enforced by the Productive Waiting exception but is now a
first-class codified rule: **blind divergence is non-negotiable for fan-out**.

### Component Extraction as Deliverable (3 missions, CODIFIED 2026-03-05)
Research outputs should decompose findings into named, independently-actionable
components with effort estimates where applicable. This enables downstream
Engineering squads to populate their briefs without re-analyzing the research
output. The synthesis section should include a **## Components** table listing
each component, its scope, estimated effort, and dependencies.

## Decision Protocol

**Quorum sensing.** Finding is confirmed when 2+ independent agents converge. Facilitator synthesizes but domain expert outweighs generalist. **Convergent findings** (same conclusion reached independently by 2+ agents) are weighted as high-confidence — explicitly highlight these in synthesis output.

See `constitutions/commitment-threshold.md` for quorum rules.

## Time-Box (Default)

- **Fan-out phase:** 1 deliberation round per agent
- **Breathing Space:** 1 reading pass
- **Fan-in phase:** 1 synthesis pass
- If convergence not reached, Facilitator issues a CONTESTED finding with all positions documented
- **Total:** Bounded by 2 rounds, not unlimited

## Disagreement Protocol

If two rounds of structured debate produce no convergence, the Facilitator does not add a third round. The Facilitator either:
- **(a)** Reframes the question to find a solution space neither position occupies, or
- **(b)** Escalates per escalation-rules.md (Tier 3a if reversible, Tier 3b if irreversible) with both positions documented in SBAR format

## Productive Waiting

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: read the
> blackboard Findings, review the Commander's Intent constraints, or
> pre-load context for your upcoming phase. Do not sit truly idle — context
> spent reading now reduces time needed when your phase starts."

**Exception:** During the fan-out phase, Investigators must NOT read peer
findings — that constraint overrides the productive waiting guideline.

## Deep Dive Option

After the initial parallel research phase, the Orchestrator may allow one agent to go deep on the most promising or most puzzling finding, while others continue breadth. The Orchestrator decides when depth is warranted based on the nature of the finding and the mission's remaining time budget.

## Commander's Intent Example

*"We need to understand X because we're about to build Y. Boundaries: focus on Z, ignore W. Success: a clear recommendation with evidence, or an explicit 'we don't know enough yet.'"*

## Cloning Differentiation

When using 2+ Investigators, differentiate via spawn prompt:

| Clone | Heuristic | Reference Material |
|-------|-----------|-------------------|
| Investigator-alpha | Depth-first | Primary domain docs |
| Investigator-beta | Breadth-first | Cross-domain references |
| Investigator-gamma | Contrarian | Known failure cases |

## Spawn Example (Claude Code)

```python
# Create team
TeamCreate(team_name="research-{topic}", description="{one-line research question}")

# Create tasks
TaskCreate(subject="Frame mission", description="Write Commander's Intent...")
TaskCreate(subject="Research {aspect-A}", description="Depth-first investigation...")
TaskCreate(subject="Research {aspect-B}", description="Breadth-first investigation...")
TaskCreate(subject="Synthesize findings", description="BLUF synthesis...")

# Spawn teammates
Agent(subagent_type="general-purpose", name="investigator-alpha",
      team_name="research-{topic}",
      prompt="""You are The Investigator. [paste personas/investigator.md]

## CRITICAL: Task Scope

Your ONLY assigned task is Task #{task_id}: [subject].
Do NOT claim any other tasks from the task list.
When your task is complete, write your final checkpoint to the blackboard,
send the team-lead a completion message, then wait for a shutdown_request.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.

## CRITICAL: Dual Write — Findings AND Checkpoint

Write to TWO sections on the blackboard, for different consumers:
1. `## Findings` — timestamped BLUF entries for Orchestrator synthesis.
   Format: `[HH:MM] FINDING: {one-line headline}\n{supporting detail}`
2. `### Agent Checkpoints` in `## Current State` — state externalization for
   context recovery (per protocols/checkpoint.md).

Both sections MUST be populated. Findings are NOT optional even if checkpoint
has the same information. Write to Findings after every discovery; write to
Checkpoint after every 3 findings or before any long tool operation.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init investigator-alpha --profile subagent

After each major operation (file read, web fetch, multi-step analysis):
  bash scripts/context-budget.sh tick investigator-alpha --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard. ...""")
Agent(subagent_type="general-purpose", name="investigator-beta",
      team_name="research-{topic}",
      prompt="""You are The Investigator. [paste personas/investigator.md]

## CRITICAL: Task Scope

Your ONLY assigned task is Task #{task_id}: [subject].
Do NOT claim any other tasks from the task list.
When your task is complete, write your final checkpoint to the blackboard,
send the team-lead a completion message, then wait for a shutdown_request.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.

## CRITICAL: Dual Write — Findings AND Checkpoint

Write to TWO sections on the blackboard, for different consumers:
1. `## Findings` — timestamped BLUF entries for Orchestrator synthesis.
   Format: `[HH:MM] FINDING: {one-line headline}\n{supporting detail}`
2. `### Agent Checkpoints` in `## Current State` — state externalization for
   context recovery (per protocols/checkpoint.md).

Both sections MUST be populated. Findings are NOT optional even if checkpoint
has the same information. Write to Findings after every discovery; write to
Checkpoint after every 3 findings or before any long tool operation.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init investigator-beta --profile subagent

After each major operation (file read, web fetch, multi-step analysis):
  bash scripts/context-budget.sh tick investigator-beta --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard. ...""")

# Scrum Master (recommended — runs in parallel with all phases)
Agent(subagent_type="general-purpose", name="scrum-master",
      team_name="research-{topic}", model="sonnet",
      prompt="""You are The Scrum Master. [paste personas/scrum-master.md]

Your mission: [paste Commander's Intent]

You run IN PARALLEL with all other agents. You are NOT in the trace
dependency chain. Your responsibilities:

1. PREFLIGHT (before Phase 1): Run DoD preflight per protocols/definition-of-done.md:
   - Check ticket exists for mission (WARN if missing, don't block)
   - Check ticket has acceptance criteria (WARN if missing)
   - Extract ACs to blackboard ## Acceptance Criteria section
   - Set ticket to "In Progress", fill start date
   - Read error catalog, pre-warn team about relevant ERR entries
2. DURING MISSION: Monitor for failures, log crystallization_candidate events
   to events.jsonl for significant findings
3. POST-MISSION CLEANUP: Run DoD cleanup per protocols/definition-of-done.md:
   - Create session log
   - Update handoff doc
   - Update ticket (comment + due date)
4. POST-MISSION CRYSTALLIZATION: Run Crystallization Protocol Steps 1-2.5:
   - HARVEST: Collect crystallization candidates from events.jsonl + blackboard
   - PATTERN: Update `memory/active/pattern-tracker.md` — read it, match this
     mission's candidates, increment counts, flag new PROMOTE candidates
   - DISCERNMENT: For patterns at 3+ occurrences, classify as
     seed-to-water / seed-to-let-rest / seed-we-don't-understand
   - Write PROMOTE proposals (if any) to blackboard ## Operational Status
5. CLEANUP: Run protocols/mission-cleanup.md (archive traces + blackboard)

Write ONLY to "## Operational Status" on the blackboard.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init scrum-master --profile subagent

After each major operation:
  bash scripts/context-budget.sh tick scrum-master --files-read {bytes}

Monitor ALL agents' budget status:
  bash scripts/context-budget.sh render-all

Render budget status to blackboard ## Relay Baton → ### Budget Status on zone changes.""")
```
