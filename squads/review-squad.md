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
| Orchestrator (historically: Facilitator) | Orchestrator | — | `general-purpose` | Orchestrator (opus) | Full toolset |
| Correctness Reviewer | Challenger | correctness | `general-purpose` | Specialist (sonnet) | Read-only + Bash (for running tests) |
| Security Reviewer | Challenger | security | `general-purpose` | Specialist (sonnet) | Read-only |

**3 agents + required Scrum Master. Orchestrator frames + synthesizes. Two Challengers review independently and blindly.**

### Extended Review

Add when scope is broad or standards compliance is critical:

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Standards Reviewer | Challenger | standards | `general-purpose` | Specialist (sonnet) | Read-only |

**4 agents + required Scrum Master. Third reviewer focuses on coding guidelines, naming conventions, documentation quality.**

### Scrum Master (Required — All Variants)

| Role | Persona | Lens | Agent Type | Tier | Tools |
|------|---------|------|-----------|------|-------|
| Scrum Master | Scrum Master | operational | `general-purpose` | Specialist (sonnet) | Read, Write, Bash (no code edit) |

Runs in parallel with all phases. Handles error catalog, crystallization protocol (update `memory/active/pattern-tracker.md` — read it, match this mission's candidates, increment counts, flag new PROMOTE candidates), Jira ops, DoD preflight/cleanup (see `protocols/definition-of-done.md`), and post-mission cleanup.

**SM Preflight (before Phase 1):** Check ticket exists (WARN if missing). Check ticket has ACs (WARN if missing). Extract ACs to blackboard `## Acceptance Criteria`. Set ticket to "In Progress", fill start date.

**SM Cleanup (post-mission):** Create session log, update handoff doc, update ticket. Existing: archive blackboard/traces, retrospective.

**Model & effort tiering.** The `(opus)`/`(sonnet)` hints in the tables above are legacy tier labels — set the actual model and reasoning effort via each agent's `agents/` frontmatter (`model: inherit`) plus this guidance. The Orchestrator inherits the session model. Both reviewing Challengers run at **high** reasoning effort — a review squad's whole value is depth of scrutiny, so this is the last place to economize. The Scrum Master is haiku-class / low effort.

---

## Orchestration: Concurrent Blind Review

```
SM PREFLIGHT (parallel, before Phase 1):
  Scrum Master runs DoD preflight per protocols/definition-of-done.md:
  Check ticket + ACs, extract ACs to blackboard, set ticket status.
  This runs in parallel — does not block Phase 1.
  ↓
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
- **CRITICAL** — Blocks merge. Bug, security vulnerability, data loss risk, **zero test coverage for new components**.
- **WARNING** — Should fix before merge. Code smell, incomplete test coverage, guideline violation.
- **INFO** — Nice to have. Style preference, minor improvement, documentation note.

> **Codified Pattern — Test Gap as First-Class Finding:** When a new component
> has zero test coverage, classify as CRITICAL (not WARNING). Test gaps for new
> code block merge just as bugs do. See `memory/patterns/test-gap-as-first-class-finding.md`.

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

Install the custom agent types once (`cp agents/*.md .claude/agents/`). Both
reviewers are the same `challenger` agent — the lens (correctness vs. security)
is injected in the charge, which is exactly how the blind protocol stays
cognitively diverse without needing two agent files. Spawn with a `name`
(addressable via `SendMessage`). If task tools are available, mirror the phases
for visibility; otherwise the trace files gate the blind protocol.

```python
# Orchestrator — usually the session lead fills this seat directly.
# Spawn the agent form only when synthesis is delegated.
Agent(subagent_type="orchestrator", name="facilitator", run_in_background=True,
      prompt="""You are The Orchestrator.
Mission: review {PR/changes} for quality and safety.
Blackboard: .claude/hive/memory/active/blackboard/{mission}.md
Write Commander's Intent, assign each reviewer a named section, wait for all
finding_submitted traces (the blind gate), take a breathing-space pass, then
synthesize convergent / divergent / gap per the protocol above.""")

# Correctness Reviewer — Challenger + correctness lens. Read-only + Bash for tests.
Agent(subagent_type="challenger", name="correctness-reviewer",
      run_in_background=True,
      prompt="""You are The Challenger with correctness lens.
Focus: bugs, logic errors, edge cases, test-coverage gaps, behavioral regressions.
Blackboard: .claude/hive/memory/active/blackboard/{mission}.md
Write findings ONLY to "## Review: Correctness". Identify yourself as
correctness-reviewer. DO NOT read other reviewers' sections until synthesis.
When done, append the trace: {mission}-correctness-reviewer-finding_submitted.trace""")

# Security Reviewer — Challenger + security lens.
Agent(subagent_type="challenger", name="security-reviewer",
      run_in_background=True,
      prompt="""You are The Challenger with security lens.
Focus: OWASP top 10, input validation, injection, secrets exposure, access control.
Blackboard: .claude/hive/memory/active/blackboard/{mission}.md
Write findings ONLY to "## Review: Security". Identify yourself as
security-reviewer. DO NOT read other reviewers' sections until synthesis.
When done, append the trace: {mission}-security-reviewer-finding_submitted.trace""")
```

**Shutdown.** No `shutdown_request` handshake, no team teardown. Each reviewer
finishes, writes its findings + trace, and sends a completion message (carrying
its farewell); the harness notifies the Orchestrator. Stop one early with
`TaskStop <agent-id>` after preserving partial work. Lifecycle:
`protocols/agent-shutdown.md`; farewell: `protocols/agent-farewell.md`.

**Context.** Each agent watches its own context; if depleted, it writes the
Living Baton per `protocols/return-to-sangha.md` and ends cleanly. No zone
tables in spawn prompts.

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

## Definition of Done

This squad follows `protocols/definition-of-done.md`.
Default level: `mission-complete` (override in Commander's Intent).

The Scrum Master runs the Preflight checklist before Phase 1 (FRAME).
The Orchestrator verifies ACs against review findings during Phase 5 (SYNTHESIS).
The Scrum Master runs the Cleanup checklist after the mission retrospective.

---

## Design Notes

- **Blind protocol is the core innovation.** Without it, this is just "three agents read the same code." Blindness is what makes multi-agent review better than single-agent review.
- **No inter-reviewer debate.** Divergent findings go to human, not to argument. Reviewers don't need to convince each other — they need to find issues.
- **Orchestrator synthesizes, doesn't review.** The Orchestrator's job is to see the shape across all findings, not to add their own review. If the Orchestrator has technical insights, they should be flagged as "Gaps" with low confidence.
- **Standards reviewer is optional.** For small, focused PRs, correctness + security is sufficient. Add standards reviewer for large changes or onboarding new contributors.
- **This is read-only.** The Review Squad never modifies code. It produces findings. Code changes happen in a subsequent Engineering Squad mission if needed.
