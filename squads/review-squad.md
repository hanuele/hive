# Review Squad

> When to use: Code or artifacts need **independent quality assessment**. The goal is to find what the author missed — bugs, security issues, guideline violations, logic errors.

## Terrain Profile

| Axis | Range |
|------|-------|
| Uncertainty | Any (review reveals what's unknown) |
| Reversibility | Any (review is read-only; findings inform reversible/irreversible decisions) |
| Breadth | Any |
| Stakes | Medium to High (review is triggered when stakes warrant independent verification) |

---

## Variants

### Standard Review (Default)

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Facilitator | Orchestrator | — | `general-purpose` | Orchestrator (opus) | Full + Team tools |
| Correctness Reviewer | Challenger | correctness | `general-purpose` | Specialist (sonnet) | Read-only + Bash (for running tests) |
| Security Reviewer | Challenger | security | `general-purpose` | Specialist (sonnet) | Read-only |

**3 agents + recommended Scrum Master. Orchestrator frames + synthesizes. Two Challengers review independently and blindly.**

### Extended Review

Add when scope is broad or standards compliance is critical:

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Standards Reviewer | Challenger | standards | `general-purpose` | Specialist (sonnet) | Read-only |

**4 agents + recommended Scrum Master. Third reviewer focuses on coding guidelines, naming conventions, documentation quality.**

### Scrum Master (Recommended — All Variants)

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Scrum Master | Scrum Master | operational | `general-purpose` | Specialist (sonnet) | Read, Write, Bash (no code edit) |

Runs in parallel with all phases. Handles error catalog, crystallization protocol (update `memory/active/pattern-tracker.md` — read it, match this mission's candidates, increment counts, flag new PROMOTE candidates), Jira ops, and post-mission cleanup.

---

## Orchestration: Concurrent Blind Review

```
Phase 1: FRAME
  Orchestrator writes Commander's Intent with PR/diff reference to blackboard
  Orchestrator assigns named blackboard sections to each reviewer
  ↓
Phase 2: INDEPENDENT REVIEW (concurrent)
  Each reviewer works independently:
    - Reads ONLY the code under review + reference documents
    - Writes findings ONLY to their assigned blackboard section
    - Does NOT read other reviewers' sections
    - Writes trace: {mission}-{reviewer}-finding_submitted.trace
  ↓
Phase 3: BLIND GATE
  Orchestrator waits for ALL finding_submitted traces
  No reviewer proceeds until all have submitted
  ↓
Phase 4: BREATHING SPACE
  Orchestrator reads full blackboard (all sections) without acting
  One reading pass — see the whole before synthesizing
  ↓
Phase 5: SYNTHESIS
  Orchestrator categorizes findings:
    - CONVERGENT: 2+ reviewers found same issue → auto-confirmed
    - DIVERGENT: 1 reviewer found issue → needs human judgment
    - GAPS: Issues no reviewer found (identified by Orchestrator)
  Orchestrator writes synthesis to blackboard
  ↓
Phase 6: CRYSTALLIZATION + RETROSPECTIVE
  Orchestrator runs crystallization protocol
  Files retrospective to memory/archive/retrospectives/
```

### The Blind Protocol

**Why blind?** Independent review catches more than group review. If reviewers can see each other's findings, they anchor on what's already found and stop looking for different issues. Blindness preserves cognitive diversity.

**How enforced:**
1. **Named sections:** Each reviewer writes ONLY to their assigned section on the blackboard
2. **Spawn prompt instruction:** "DO NOT read other reviewers' sections until synthesis phase"
3. **Trace gating:** Orchestrator waits for ALL traces before any reviewer's work becomes visible to others
4. **No inter-reviewer communication:** Reviewers do not send messages to each other

**This is structural, not honor-system.** The blackboard sections + trace gates make it difficult to accidentally break blindness.

---

## Blackboard Structure

```markdown
## Commander's Intent
<!-- Standard template — includes PR reference, diff summary, review focus areas -->

## Review: Correctness
<!-- ONLY correctness-reviewer writes here -->
### Findings
<!-- Format: [CRITICAL|WARNING|INFO] Finding title
     - Evidence: what was found
     - Impact: what could go wrong
     - Suggestion: recommended fix (optional) -->

## Review: Security
<!-- ONLY security-reviewer writes here -->
### Findings
<!-- Same format as Correctness -->

## Review: Standards
<!-- ONLY standards-reviewer writes here — Extended Review only -->
### Findings
<!-- Same format as Correctness -->

## Synthesis
<!-- Written by Orchestrator after blind gate + breathing space -->
### Convergent Findings (auto-confirmed)
### Divergent Findings (needs human judgment)
### Gaps (Orchestrator-identified)
### Recommendation
```

---

## Finding Format

Each reviewer uses this format for consistency:

```markdown
### [SEVERITY] Finding Title

**Evidence:** What was observed in the code (with file:line references)

**Impact:** What could go wrong if this is not addressed

**Confidence:** 0.0-1.0

**Suggestion:** Recommended fix (optional — reviewers are not required to propose solutions)
```

Severity levels (per Challenger persona):
- **CRITICAL** — Blocks merge. Bug, security vulnerability, data loss risk.
- **WARNING** — Should fix before merge. Code smell, missing test, guideline violation.
- **INFO** — Nice to have. Style preference, minor improvement, documentation note.

---

## Synthesis: Convergent vs. Divergent

This is **quorum sensing applied to code review:**

| Category | Condition | Action |
|----------|-----------|--------|
| **Convergent** | 2+ reviewers independently found the same issue | Auto-confirmed. High confidence finding. |
| **Divergent** | Only 1 reviewer found the issue | Needs human judgment. May be valid but unconfirmed. |
| **Gap** | Orchestrator identifies issue no reviewer caught | Low confidence. Flagged for human consideration. |

**Why this works:** If two independent reviewers, looking from different angles (correctness vs. security), both flag the same issue — that's strong evidence. A single reviewer's unique finding may be insight or false positive — only a human can tell.

---

## Spawn Example

```python
TeamCreate(team_name="review-{ticket}", description="Blind review of {PR/changes}")

# Tasks
TaskCreate(subject="Frame review", description="Write Commander's Intent with PR reference")
TaskCreate(subject="Correctness review", description="Independent review for bugs, logic errors, edge cases")
TaskCreate(subject="Security review", description="Independent review for OWASP top 10, input validation, secrets")
TaskCreate(subject="Synthesize findings", description="Categorize convergent/divergent, write recommendation")

# Orchestrator
Agent(subagent_type="general-purpose", name="facilitator",
      team_name="review-{ticket}", model="opus",
      prompt="""You are The Orchestrator (personas/orchestrator.md).
Mission: Review {PR/changes} for quality and safety.
Write Commander's Intent to blackboard, assign sections, wait for traces,
then synthesize using concurrent blind review protocol.

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init facilitator --profile orchestrator

After each major operation (reading all reviewer sections, synthesis):
  bash scripts/context-budget.sh tick facilitator --files-read {bytes}

Monitor all agents' budget status. At YELLOW: increase checkpoint frequency.
At RED: decide relay strategy per protocols/return-to-sangha.md.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.""")

# Correctness Reviewer
Agent(subagent_type="general-purpose", name="correctness-reviewer",
      team_name="review-{ticket}", model="sonnet",
      prompt="""You are The Challenger with correctness lens (personas/challenger.md).
Focus: bugs, logic errors, edge cases, test coverage gaps, behavioral regressions.
Write findings ONLY to "## Review: Correctness" section on blackboard.
DO NOT read other reviewers' sections.
After writing findings, create trace: {mission}-correctness-reviewer-finding_submitted.trace

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init correctness-reviewer --profile subagent

After each major operation (file read, analysis):
  bash scripts/context-budget.sh tick correctness-reviewer --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.""")

# Security Reviewer
Agent(subagent_type="general-purpose", name="security-reviewer",
      team_name="review-{ticket}", model="sonnet",
      prompt="""You are The Challenger with security lens (personas/challenger.md).
Focus: OWASP top 10, input validation, SQL injection, secrets exposure, access control.
Write findings ONLY to "## Review: Security" section on blackboard.
DO NOT read other reviewers' sections.
After writing findings, create trace: {mission}-security-reviewer-finding_submitted.trace

## CRITICAL: Context Budget

Initialize the budget tracker at session start:
  bash scripts/context-budget.sh init security-reviewer --profile subagent

After each major operation (file read, analysis):
  bash scripts/context-budget.sh tick security-reviewer --files-read {bytes}

At YELLOW: checkpoint immediately, increase write frequency.
At RED: write final findings to blackboard, signal relay readiness to team lead.
At CRITICAL: stop new work, re-read your checkpoint from the blackboard.

## CRITICAL: Shutdown Handling

When you receive a message with type "shutdown_request", you MUST respond
using the SendMessage tool with type "shutdown_response" and approve: true.
Extract the requestId from the message and pass it as request_id.
Do NOT just acknowledge it in text — you must actually call the tool.

Example:
  SendMessage(type="shutdown_response", request_id="<requestId from message>", approve=True)

This is a hard requirement. Failure to respond terminates your session without
clean exit and may leave orphaned team resources.""")
```

---

## Failure Handling

| Phase | Likely Failures | Response |
|-------|----------------|----------|
| Frame | PR reference invalid | L1: Retry with correct reference |
| Review | Reviewer produces empty findings | L2: Re-prompt with specific focus areas |
| Review | Reviewer reads other section (blindness breach) | L2: Note in retro, findings still valid but convergence signal weakened |
| Blind Gate | One reviewer never submits trace | L2: Time-box (skip after timeout), proceed with available findings |
| Synthesis | Orchestrator adds own opinions beyond categorization | L2: Bell event — synthesis should categorize, not originate |

---

## Design Notes

- **Blind protocol is the core innovation.** Without it, this is just "three agents read the same code." Blindness is what makes multi-agent review better than single-agent review.
- **No inter-reviewer debate.** Divergent findings go to human, not to argument. Reviewers don't need to convince each other — they need to find issues.
- **Orchestrator synthesizes, doesn't review.** The Orchestrator's job is to see the shape across all findings, not to add their own review. If the Orchestrator has technical insights, they should be flagged as "Gaps" with low confidence.
- **Standards reviewer is optional.** For small, focused PRs, correctness + security is sufficient. Add standards reviewer for large changes or onboarding new contributors.
- **This is read-only.** The Review Squad never modifies code. It produces findings. Code changes happen in a subsequent Engineering Squad mission if needed.
