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
| **Scrum Master** (recommended) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol, operational fixes (parallel) |

## Orchestration Pattern

```
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

## Decision Protocol

**Quorum sensing.** Finding is confirmed when 2+ independent agents converge. Facilitator synthesizes but domain expert outweighs generalist.

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

Follow the Checkpoint Protocol (protocols/checkpoint.md): write working state
to the blackboard's "## Current State" section after every 3 findings or
before any long tool operation.

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

Follow the Checkpoint Protocol (protocols/checkpoint.md): write working state
to the blackboard's "## Current State" section after every 3 findings or
before any long tool operation.

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

1. MISSION START: Read error catalog, pre-warn team about relevant ERR entries
2. DURING MISSION: Monitor for failures, log crystallization_candidate events
   to events.jsonl for significant findings
3. POST-MISSION: Run Crystallization Protocol Steps 1-2.5:
   - HARVEST: Collect crystallization candidates from events.jsonl + blackboard
   - PATTERN: Update `memory/active/pattern-tracker.md` — read it, match this
     mission's candidates, increment counts, flag new PROMOTE candidates
   - DISCERNMENT: For patterns at 3+ occurrences, classify as
     seed-to-water / seed-to-let-rest / seed-we-don't-understand
   - Write PROMOTE proposals (if any) to blackboard ## Operational Status
4. CLEANUP: Run protocols/mission-cleanup.md (archive traces + blackboard)

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
