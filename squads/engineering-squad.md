# Engineering Squad

> When to use: The team needs to **build or modify code** with known requirements. Uncertainty is low to medium — we know what to do, the question is how to do it well.

## Terrain Profile

| Axis | Range |
|------|-------|
| Uncertainty | Low to Medium |
| Reversibility | Reversible (feature branch, worktree) |
| Breadth | Narrow to Broad |
| Stakes | Low to Medium |

---

## Variants

### Focused Build (Default)

**When:** Low uncertainty, reversible, narrow scope. Human is available to fill the Orchestrator role.

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Designer | Architect | — | `general-purpose` | Specialist (sonnet) | Read-only |
| Implementer | Architect | operator | `general-purpose` | Operator (sonnet) | Full (Read, Write, Edit, Bash) |
| Verifier | Challenger | correctness | `general-purpose` | Specialist (sonnet) | Read, Bash |
| Scrum Master (recommended) | Scrum Master | operational | `general-purpose` | Specialist (sonnet) | Read, Write, Bash (no code edit) |

**Key:** No Orchestrator agent — human fills that role. 3 agents total (+ recommended Scrum Master in parallel).

**Note:** Scrum Master runs in parallel with all phases, not in the trace dependency chain. Handles Jira ops, error catalog, crystallization protocol (update `memory/active/pattern-tracker.md` — read it, match this mission's candidates, increment counts, flag new PROMOTE candidates), operational fixes, and **scaling monitoring** (see below). Spawning the Scrum Master is recommended for all missions — crystallization is the system's long-term learning mechanism.

### Full Engineering

**When:** Medium uncertainty, reversible, broad scope. Multiple files, cross-cutting concerns, or unfamiliar codebase area.

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Orchestrator | Orchestrator | — | `general-purpose` | Orchestrator (opus) | Full + Team tools |
| Designer | Architect | — | `general-purpose` | Specialist (sonnet) | Read-only |
| Reviewer | Challenger | — | `general-purpose` | Specialist (sonnet) | Read-only |
| Implementer | Architect | operator | `general-purpose` | Operator (sonnet) | Full (Read, Write, Edit, Bash) |
| Verifier | Challenger | correctness | `general-purpose` | Specialist (sonnet) | Read, Bash |
| Scrum Master (recommended) | Scrum Master | operational | `general-purpose` | Specialist (sonnet) | Read, Write, Bash (no code edit) |

**Key:** Orchestrator manages pipeline. Reviewer challenges design before implementation. 4-5 agents total (+ recommended Scrum Master in parallel).

---

## Orchestration: Sequential Pipeline with Trace-Based Gating

```
Phase 0: PARALLELIZATION ANALYSIS  (Full Engineering — Orchestrator only)
  Before spawning any agents:
  1. Write initial task decomposition to TaskList
  2. Count total tasks
  3. Identify independent tracks (no shared file writes between tracks)
  4. Apply threshold:
     - Tasks ≤ 5 or no independent tracks → single Implementer (proceed to Phase 1)
     - Tasks > 5 AND 2+ independent tracks → spawn 2 Implementers from the start
  5. Document decision in Commander's Intent "Resources" field on the blackboard
  Reference: protocols/dynamic-scaling.md §Upfront
  ↓
Phase 1: FRAME
  Human (or Orchestrator) writes Commander's Intent to blackboard
  ↓
Phase 2: DESIGN
  Designer reads target code + guidelines + reference files
  Designer writes structured change plan to blackboard
  Designer writes trace: {mission}-designer-design_complete.trace
  ↓
Phase 3: REVIEW (Full Engineering only)
  Reviewer reads change plan on blackboard
  Reviewer challenges: missed edge cases, guideline violations, scope creep
  Reviewer writes findings to blackboard under "Design Review" section
  Reviewer writes trace: {mission}-reviewer-review_complete.trace
  ↓
Phase 4: BREATHING SPACE (Full Engineering only)
  Orchestrator reads full blackboard without acting
  One reading pass — see the whole before deciding
  ↓
Phase 5: IMPLEMENT
  Implementer reads change plan (and review feedback if Full Engineering)
  Implementer works in worktree — creates/modifies files per plan
  Implementer writes trace: {mission}-implementer-implementation_complete.trace
  ↓
Phase 6: VERIFY
  Verifier reads change plan + implemented code
  Verifier writes tests if needed, runs existing test suite
  Verifier writes results to blackboard under "Verification" section
  Verifier writes trace: {mission}-verifier-tests_complete.trace
  ↓
Phase 7: HUMAN REVIEW
  Human reviews changes + test results
  If PASS → merge
  If FAIL → one retry cycle (max), then human decides
```

### Trace Dependency Chain

```
designer: design_complete
    ↓
[reviewer: review_complete]     ← Full Engineering only
    ↓
implementer: implementation_complete
    ↓
verifier: tests_complete
```

Each agent checks for its upstream trace before starting work.

---

## Blackboard Structure

Engineering Squad uses the standard blackboard template with these additional sections:

```markdown
## Change Plan
<!-- Written by Designer -->
### Files to Modify
| File | Changes | Rationale |
|------|---------|-----------|

### Changes Detail
<!-- Per-file change descriptions -->

### Out of Scope
<!-- Explicitly listing what NOT to change -->

## Design Review
<!-- Written by Reviewer — Full Engineering only -->

## Implementation Notes
<!-- Written by Implementer — deviations from plan, decisions made -->

## Verification
<!-- Written by Verifier -->
### Test Results
### Lint Results
### Guidelines Compliance Check
```

---

## Spawn Examples

### Focused Build (Claude Code)

```python
# Human creates team and blackboard
TeamCreate(team_name="eng-{ticket}", description="{one-line mission}")

# Create tasks
TaskCreate(subject="Design changes", description="Read target files + guidelines, write change plan to blackboard")
TaskCreate(subject="Implement changes", description="Read change plan, implement in worktree")
TaskCreate(subject="Verify changes", description="Read changes, run tests, check guidelines compliance")

# Spawn agents
Agent(subagent_type="explorer", name="designer",
      team_name="eng-{ticket}", model="sonnet",
      prompt="""You are The Architect (personas/architect.md).
Your mission: [paste Commander's Intent]
Your task: Read the target files and coding guidelines, then write a structured change plan to the blackboard.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.

Write your change plan to: .claude/hive/memory/active/blackboard/{mission}.md
Under the "## Change Plan" section.

After completing your plan, write a trace file:
echo '{"ts":"...","mission":"...","agent":"designer","action":"design_complete","detail":"..."}' > .claude/hive/memory/active/traces/{mission}-designer-design_complete.trace

Follow BLUF format for all communication.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init designer --profile subagent

After each major operation (file read, web fetch, multi-step analysis):
  bash scripts/context-budget.sh tick designer --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard.""")

Agent(subagent_type="general-purpose", name="implementer",
      team_name="eng-{ticket}", model="sonnet",
      prompt="""You are The Architect with operator lens (personas/architect.md).
Your mission: [paste Commander's Intent]
Your task: Read the change plan on the blackboard, then implement all changes.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.

Read the change plan from: .claude/hive/memory/active/blackboard/{mission}.md
Work in the provided worktree or branch.

Follow the Checkpoint Protocol (protocols/checkpoint.md): write working state
to the blackboard's "## Current State" section after every 3 findings or
before any long tool operation.

After completing implementation, write a trace file.
Do NOT deviate from the change plan without documenting why.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init implementer --profile subagent

After each major operation (file read, multi-file edit, test suite):
  bash scripts/context-budget.sh tick implementer --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard.""")

Agent(subagent_type="general-purpose", name="verifier",
      team_name="eng-{ticket}", model="sonnet",
      prompt="""You are The Challenger with correctness lens (personas/challenger.md).
Your mission: [paste Commander's Intent]
Your task: Verify the implementation matches the change plan and passes all tests.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.

1. Read the change plan from the blackboard
2. Read the implemented changes
3. Run the test suite: {PROJECT_TEST_COMMAND}
<!-- DOMAIN: Replace {PROJECT_TEST_COMMAND} with your project's test command (e.g., docker-compose exec api-gateway pytest, npm test, cargo test) -->
4. Check coding guidelines compliance
5. Write results to blackboard under "## Verification"

After completing verification, write a trace file.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init verifier --profile subagent

After each major operation (test suite run, file read):
  bash scripts/context-budget.sh tick verifier --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard.""")
```

---

## Scrum Master: Scaling Monitoring

During the mission, in addition to normal SM duties, the Scrum Master monitors:

1. **Budget zones** — run `bash scripts/context-budget.sh render-all` after
   each phase transition and agent completion message.
2. **Queue imbalance** — check TaskList for any agent owning >5 pending unclaimed tasks.

When either trigger fires:
- Write a `## Scale Requests` entry to the blackboard (status: PROPOSED)
- Send a message to Orchestrator: `"Scale request filed — see ## Scale Requests"`

Full scaling rules, autonomy limits, and clone spawn template:
→ `protocols/dynamic-scaling.md`

---

## Productive Waiting

> "If all your phase-specific tasks are either in progress by others or not
> yet unblocked, do preparatory work within your role boundary: read the
> files listed in the Designer's Change Plan, review the blackboard
> Findings, or pre-load context for your upcoming phase. Do not sit truly
> idle — context spent reading now reduces time needed when your phase
> starts."

This applies especially to the Verifier waiting on the Implementer to complete.

---

## Failure Handling

| Phase | Likely Failures | Response |
|-------|----------------|----------|
| Design | Designer misses relevant file | L1: Designer re-reads with hint from human |
| Design | Change plan too broad (scope creep) | L2: Human narrows scope on blackboard |
| Review | Reviewer rejects design | Normal flow: Designer revises (1 cycle max) |
| Implement | Implementer deviates from plan | L2: Bell event, human reviews deviation |
| Implement | Code won't compile/import | L1: Retry with error context |
| Verify | Tests fail | Normal flow: Report to human for decision |
| Verify | Tests pass but guidelines violated | L2: Document specific violations |

**Max retry cycles:** 1. If the retry also fails, escalate per escalation-rules.md (Tier 3a if reversible, Tier 3b if irreversible).

---

## Decision Protocol

- **Focused Build:** Human makes all decisions. No quorum needed — human authority is sufficient.
- **Full Engineering:** Orchestrator manages pipeline. Design disputes: Tier 2 (Orchestrator decides). Unresolved: Tier 3a (Claude). Implementation disputes: Tier 3a (Claude decides for reversible changes) or Tier 3b (human decides for irreversible changes).

---

## Persona Lens Injection

The Engineering Squad reuses existing personas with **lens injection** — a single differentiation axis in the spawn prompt:

| Role | Base Persona | Lens | Effect |
|------|-------------|------|--------|
| Designer | Architect | (none) | Pure design thinking — simplest viable approach, acceptance criteria, dependencies |
| Implementer | Architect | `operator` | Execution focus — pragmatic implementation, minimal deviation from plan |
| Reviewer | Challenger | (none) | Full adversarial review — edge cases, alternatives, Stop Signals |
| Verifier | Challenger | `correctness` | Verification focus — tests pass, guidelines met, plan followed |

Lens injection is done in the spawn prompt, not in the persona file:
```
"You are The Architect with operator lens — your focus is pragmatic execution
of the change plan. Implement exactly what was designed, documenting any
necessary deviations. Prefer the simplest correct implementation."
```

---

## Codified Patterns

### Plan-Driven Zero-Deviation
*(Crystallized from 3 missions: kan229, lassonde-classification, kan242-ux-audit)*

When the Designer produces a detailed change plan (function signatures, pseudocode,
test cases, scope boundaries), the Implementer should execute it with zero deviations.
Invest in the design phase — it pays for itself by making implementation mechanical
and verification straightforward. The plan sets a floor, not a ceiling: the
Implementer may add edge case tests but should not deviate from the specified approach.

See: `memory/patterns/plan-driven-zero-deviation.md`

### Review Phase Value
*(Crystallized from 3 missions: kan229, lassonde-classification, kan242-ux-audit)*

Always include a Review phase (Verifier agent) for changes that affect:
- User-visible output
- Exception-raising or error-handling paths
- Core business logic (scoring, financial data)

Skip Review only for purely cosmetic WARN-level changes with no external visibility.
Reviewer findings are cheapest before merge — this pattern holds across Python,
scoring, and UX domains.

See: `memory/patterns/review-phase-value.md`

---

## Design Notes

- **Focused Build is the default.** Only escalate to Full Engineering when the terrain demands it. "Start with 3, prove you need more."
- **Designer is read-only.** This prevents the temptation to "just quickly fix it" instead of writing a plan. Separation of design and implementation is the point.
- **One retry cycle max.** Infinite loops are the enemy of forward progress. If one retry doesn't fix it, the problem is harder than expected — escalate per escalation-rules.md (Tier 3a or 3b).
- **No new personas.** Architect with operator lens is still The Architect. Challenger with correctness lens is still The Challenger. Lens injection differentiates without proliferating.
