# Dynamic Scaling Protocol — Horizontal Worker Scaling

> Single authoritative source for all squad scaling rules.
> Referenced by `squads/engineering-squad.md`, `squads/research-squad.md`,
> and `squads/review-squad.md`. Do not duplicate scaling rules in squad files —
> link here instead.

---

## Philosophy

A squad's size is not fixed at spawn time. Context pressure is real scarcity;
task volume is a proxy. Two mechanisms keep the squad right-sized:

1. **Upfront Parallelization Analysis** — Orchestrator evaluates task count and
   independence at kickoff and may start with 2 workers before any YELLOW signal.
2. **Mid-Mission Scale Request** — Scrum Master monitors operational health and
   files a structured request when a trigger fires. Orchestrator acts.

All scaling is autonomous up to 3 agents of the same role. The 4th requires
human confirmation (see Autonomy Limits below).

---

## Mechanism 1 — Upfront Parallelization Analysis (Phase 0)

**Who:** Orchestrator, before spawning any agents.

**When:** Always — this is mandatory for Full Engineering and Research missions.
For Focused Build (human-as-Orchestrator), the human decides at kickoff.

### Procedure

1. Write the initial task decomposition to the TaskList.
2. Count total tasks in the initial decomposition.
3. Identify **independent tracks**: task chains with no shared file writes
   (Engineering) or no shared investigation domain (Research).
4. Apply the threshold:

| Condition | Action |
|-----------|--------|
| Tasks ≤ 5 or no independent tracks | Single worker — proceed normally |
| Tasks > 5 AND 2+ independent tracks | Spawn 2 workers from the start |

5. Document the decision in `## Commander's Intent → Resources` on the
   blackboard:
   - Total task count
   - Independent tracks identified (with task ID ranges)
   - Decision: single worker or dual worker, with rationale

### Engineering Squad specifics

"Independent tracks" means no task in Track A writes a file that any task in
Track B also writes. Check the Designer's change plan file list.

### Research Squad specifics

"Independent tracks" means investigation domains that do not rely on each
other's findings to proceed (e.g., regulatory vs. financial analysis).

---

## Mechanism 2 — Mid-Mission Scale Request

### Triggers

Either of the following fires a scale request:

| Trigger | Condition |
|---------|-----------|
| Budget zone | Any active agent's zone reaches YELLOW or worse |
| Queue imbalance | One agent has >5 unclaimed tasks assigned to them |

Both triggers may fire simultaneously; treat as a single scale request.

### Who monitors

**Scrum Master** owns operational monitoring. During a mission, SM checks:
```
# {TOOL: run context budget tracker for all agents}

# Check TaskList for imbalance
TaskList()  # then count per-owner pending tasks
```

Frequency: after every major event (phase transition, agent completion message,
or every ~15 minutes of wall time).

### Scale Request Filing (Scrum Master)

When a trigger fires, SM writes a structured entry to `## Scale Requests` on
the blackboard (schema below) and sends a message to Orchestrator:

```
"Scale request filed — see ## Scale Requests entry scale-{seq}"
```

SM does NOT spawn agents. SM does NOT decide whether to scale. SM reports.

### Scale Request Schema

```markdown
### scale-{seq} — {PROPOSED|APPROVED|SPAWNED|REJECTED|HUMAN_REQUIRED}
- **Requested by:** scrum-master
- **Timestamp:** {ISO-8601}
- **Trigger:** budget:YELLOW | tasks:>5 | both
- **Target role:** implementer | investigator | challenger
- **Current count:** {N}
- **Proposed count:** {N+1}
- **Unclaimed tasks:** [{task-id}, {task-id}, ...]
- **Orchestrator response:** (filled by Orchestrator when acted on)
```

### Orchestrator Response

Orchestrator reads the entry and acts within its current turn:

```
Current count < 3  →  APPROVE:
  1. Update entry status: PROPOSED → APPROVED
  2. Spawn clone per Clone Spawn Template below
  3. Update entry status: APPROVED → SPAWNED
  4. Fill "Orchestrator response" with clone name and task scope

Current count ≥ 3  →  HUMAN_REQUIRED:
  1. Update entry status: PROPOSED → HUMAN_REQUIRED
  2. Fill "Orchestrator response" with: "Autonomy cap reached (3 agents).
     Human confirmation required to spawn {role}-delta."
  3. Stop and wait for human input before proceeding
```

---

## Autonomy Limits

> **This is the single authoritative statement of the autonomy cap.**
> Do not restate this in squad files — reference this protocol.

| Same-role agent count | Authority |
|-----------------------|-----------|
| 1 → 2 | Orchestrator autonomous |
| 2 → 3 | Orchestrator autonomous |
| 3 → 4 | Human confirmation required |
| 4+ | Human confirmation required for each additional |

The cap applies per mission per role. Role = `implementer`, `investigator`,
`challenger` (not `scrum-master` or `orchestrator` — those are not cloned).

---

## Clone Naming Convention

Reuses the existing differentiation framework:

| Seq | Name |
|-----|------|
| First clone | `{role}-alpha` |
| Second clone | `{role}-beta` |
| Third clone | `{role}-gamma` |
| Fourth (human-required) | `{role}-delta` |

When only one worker exists and is not yet named, it is implicitly `{role}`.
The first clone is `{role}-alpha`; the original may be renamed `{role}-beta`
for clarity if coordination requires it (Orchestrator decides).

---

## Clone Spawn Prompt Template

A clone spawn prompt MUST include all five of these elements:

```
## Element 1 — Persona
You are The {Persona} with {lens} lens (personas/{persona-file}.md).

## Element 2 — Mission Context
Your mission: {paste Commander's Intent — full text, not a summary}

## Element 3 — Task Scope Constraint
You are a scaling clone. Your scope: claim ONLY unclaimed tasks with IDs
greater than {last-claimed-task-id-of-original-agent}. Do NOT claim tasks
already owned by {original-agent-name}. Check TaskList before claiming.

## Element 4 — Auto-Retirement
When you have no remaining unclaimed tasks in your scope, write to
## Scale Requests under your entry: "Clone work complete — {clone-name}"
Then send a message to the Orchestrator:
  "All my tasks are done, ready for shutdown."
Wait for a shutdown_request before terminating.

## Element 5 — Shutdown Protocol + Budget Init
## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId>", approve=True)

This is a hard requirement. Failure to respond terminates your session
without clean exit and may leave orphaned team resources.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  # {TOOL: initialize context budget tracker for {clone-name}}

After each major operation:
  # {TOOL: tick context budget tracker for {clone-name}}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard.
```

---

## Work Division Rule

When a clone is spawned mid-mission:

| Task state | Rule |
|------------|------|
| In progress (owned by original) | Stays with original — no hand-off mid-task |
| Pending and unclaimed | Clone claims them in ascending task ID order |
| Pending and claimed by original but not started | Orchestrator may reassign via TaskUpdate if original is at YELLOW |

Zero new decomposition step required. The TaskList is the work queue.

---

## Review Squad Scaling

Cloning Challengers is safe under the Blind Review Protocol provided each
clone receives a **distinct, non-overlapping scope boundary** stated in the
spawn prompt.

### Scope partitioning rules

- Use module or concern boundaries (auth + API layer / data pipeline +
  migrations), not arbitrary line-count splits
- Orchestrator assigns boundaries at spawn time; write them to
  `## Commander's Intent → Resources` on the blackboard
- Each clone writes to a named section: `## Challenger Alpha Review`,
  `## Challenger Beta Review`, etc.
- Synthesis (Orchestrator) folds in all named sections as normal

### Review Squad autonomy cap

Same cap as Engineering Squad: 3 Challengers autonomous, 4th requires human.

---

## Productive Waiting Guideline

Applies to all squad types when an agent is waiting for an upstream phase to
complete (e.g., Verifier waiting for Implementer, Investigator-beta waiting
for Orchestrator synthesis):

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: read the
> files listed in the Designer's Change Plan, review the blackboard
> Findings, or pre-load context for your upcoming phase. Do not sit truly
> idle — context spent reading now reduces time needed when your phase
> starts."

Do NOT read peer agent findings during the Research Squad fan-out phase —
that constraint overrides this guideline.

---

## Sequence Diagram: Mid-Mission Scale Request

```
SM detects YELLOW budget on {agent} OR >5 unclaimed tasks on one agent
  │
  ▼
SM writes ## Scale Requests entry  (status: PROPOSED)
SM sends message → Orchestrator: "Scale request filed — see ## Scale Requests"
  │
  ▼
Orchestrator reads entry
  ├─ count < 4  ──────────────────────────────────────────────────────────────┐
  │   APPROVE: update status PROPOSED → APPROVED                              │
  │   Spawn clone per Clone Spawn Template (all 5 elements)                   │
  │   Clone: initializes budget, claims unclaimed tasks > {task_id_X}         │
  │   Clone: on completion → posts "Clone work complete", awaits shutdown      │
  │   Orchestrator: updates status APPROVED → SPAWNED                         │
  │   Orchestrator: fills "Orchestrator response" field                        │
  │                                                                            │
  └─ count ≥ 4  ──────────────────────────────────────────────────────────────┘
      HUMAN_REQUIRED: update status, fill response field
      Orchestrator stops and waits for human input
```
