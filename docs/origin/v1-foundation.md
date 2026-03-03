# Hive Mind Bootstrap Plan

> **Status:** Research complete, ready for implementation
> **Date:** 2026-03-02
> **Research team:** 8 parallel agents, 100+ sources, 14 hours of research
> **Scope:** Reusable, scalable multi-agent team system for Claude Code

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Architecture: The Anthill](#2-core-architecture-the-anthill)
3. [The Persona System](#3-the-persona-system)
4. [Team Templates (Pre-Built Squads)](#4-team-templates-pre-built-squads)
5. [Memory & Knowledge Architecture](#5-memory--knowledge-architecture)
6. [Governance & Decision Protocols](#6-governance--decision-protocols)
7. [Scaling & Cloning](#7-scaling--cloning)
8. [Communication Standards](#8-communication-standards)
9. [Quality Control](#9-quality-control)
10. [Anti-Patterns & Failure Modes](#10-anti-patterns--failure-modes)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [File Structure](#12-file-structure)
13. [Sources & Research Base](#13-sources--research-base)

---

## 1. Executive Summary

### What We're Building

A **reusable, composable multi-agent team system** ("The Anthill") built on Claude Code's Agent Teams infrastructure. The system provides:

- **Pre-designed team templates** for different mission types (research, creative, engineering, strategy, review)
- **Cloneable agent personas** with distinct psychological imprints that create genuine cognitive diversity
- **Shared memory architecture** enabling stigmergic coordination without message overhead
- **Governance protocols** codified into system prompts for autonomous decision-making
- **Scalability** through composable modules that snap together like Lego

### Key Research Findings That Shape This Design

| Finding | Source | Impact on Design |
|---------|--------|------------------|
| Coordination overhead scales O(n^1.4-2.1) | Scaling Agent Systems (arXiv) | Keep teams at 3-5 agents max |
| Independent agents amplify errors 17x | Towards Data Science | Structured topology required, not "bag of agents" |
| 79% of failures come from specification + coordination | MAST (ICLR 2025) | Invest in prompts and protocols, not infrastructure |
| Hierarchical structures show 5.5% degradation vs 24% for flat | Resilience research | Use hierarchy for production, flat for exploration |
| Self-verification degrades accuracy | Team of Rivals (Isotopes AI) | Never let producer verify its own output |
| Shared consciousness before empowered execution | McChrystal | Build memory/context layer first |
| "Explain why" generalizes better than "list rules" | Anthropic character training | Persona reasoning > trait checklists |
| 92.1% accuracy with rival architecture | Team of Rivals | Critics with independent veto authority |
| 4 sufficient AI roles: Coordinator, Creator, Perfectionist, Doer | Belbin-adapted research | Not all 9 human roles needed |
| Simple majority voting accounts for most debate gains | ACL 2025 | Don't over-engineer deliberation |

### Design Principles (The Ten Commandments)

1. **Shared consciousness before empowered execution** -- Build the memory layer first
2. **Topology over quantity** -- 3 focused agents beat 5 scattered ones
3. **Verify independently** -- Producer never verifies its own output
4. **Own resources exclusively** -- Every file/table/endpoint has one owner
5. **Explain why, not just what** -- Reasoning in personas generalizes better
6. **Concrete rules over vague principles** -- "Cite sources for every claim" > "Be thorough"
7. **Rivalry for quality, cooperation for speed** -- Match collaboration mode to stakes
8. **Stigmergy over direct messaging** -- Traces in shared environment scale better
9. **Graceful degradation** -- Team functions if an agent fails (reduced, not broken)
10. **Start with 3, prove you need more** -- The 4-agent complexity threshold is real

---

## 2. Core Architecture: The Anthill

### Organizational Model

Inspired by Anthropic's porous-border teams, McChrystal's Team of Teams, and Spotify's Squad/Tribe/Chapter/Guild model.

```
                         THE ANTHILL
                    =====================

    TRIBES (Domain Clusters)
    ========================
    Groups of squads sharing a domain mission.
    Examples: "Engineering Tribe", "Research Tribe", "Creative Tribe"

        SQUADS (Mission Teams)          CHAPTERS (Skill Guilds)
        ======================          =======================
        3-5 agents per squad.           Cross-squad communities of
        Self-contained, owns an         same-capability agents.
        end-to-end workflow.            Share standards and patterns.

            AGENTS (Personas)
            =================
            Individual agents with
            distinct cognitive profiles
            and domain expertise.
```

### Layer Architecture

```
Layer 0: PERSONAS     -- Reusable agent identity templates
Layer 1: AGENTS       -- Persona + domain knowledge + tools
Layer 2: SQUADS       -- 3-5 agents composed into a mission team
Layer 3: TRIBES       -- Multiple squads under a domain umbrella
Layer 4: THE ANTHILL  -- Cross-tribe orchestration layer
```

### Agent Tiers

| Tier | Model | Tools | Role | Cost |
|------|-------|-------|------|------|
| **Scout** | haiku | Read, Grep, Glob | Research, exploration, monitoring | $ |
| **Specialist** | sonnet | Read, Grep, Glob, Bash | Analysis, review, domain expertise | $$ |
| **Operator** | sonnet | Full (Read, Write, Edit, Bash) | Implementation, lifecycle management | $$ |
| **Orchestrator** | opus | Full + Team tools | Team coordination, synthesis, decisions | $$$ |

### Mapping to Claude Code Primitives

| Anthill Concept | Claude Code Implementation |
|-----------------|---------------------------|
| Persona | `.claude/hive/personas/{name}.md` (template) |
| Agent | `.claude/agents/{name}/{name}.md` (active instance) |
| Squad | `TeamCreate(team_name="{squad-name}")` |
| Task | `TaskCreate(subject="...", description="...")` |
| Message | `SendMessage(type="message", recipient="...")` |
| Shared Memory | `.claude/hive/` directory |
| Worktree Isolation | `Agent(..., isolation="worktree")` |

---

## 3. The Persona System

### Persona Configuration Schema

Every persona is defined by a YAML-frontmatter markdown file. This is the "DNA" that gets cloned and differentiated.

```yaml
---
# === IDENTITY ===
name: ""                    # Unique identifier (kebab-case)
display_name: ""            # Human-readable name
role: ""                    # Specific professional archetype
                            #   GOOD: "Senior Financial Risk Analyst"
                            #   BAD:  "Analyst"

# === COGNITIVE PROFILE ===
thinking_style:
  primary_mode: ""          # analytical | creative | pragmatic | critical | integrative | investigative
  belbin_roles: []          # 1-2 from the 9 Belbin roles
  reasoning: ""             # deductive | inductive | abductive | analogical
  speed: ""                 # system_1 (fast/intuitive) | system_2 (slow/deliberate) | balanced

strengths: []               # 3-5 specific capabilities
blind_spots: []             # 2-3 allowable weaknesses (features, not bugs)

# === COMMUNICATION ===
communication:
  tone: ""                  # direct | diplomatic | academic | casual | authoritative
  verbosity: ""             # terse | concise | detailed
  format: ""                # bullet_points | prose | tables | structured_data
  challenge_style: ""       # confrontational | socratic | evidence_based | supportive
  certainty: ""             # calibrated_probabilities | hedging | binary | ranges

# === DECISION MAKING ===
decisions:
  risk_tolerance: ""        # risk_averse | cautious | balanced | risk_seeking
  evidence_threshold: ""    # low | medium | high | very_high
  conflict_style: ""        # yield | compromise | compete | collaborate

# === BOUNDARIES ===
boundaries:
  must_always: []           # Hard requirements
  must_never: []            # Hard constraints
  escalation_triggers: []   # When to escalate to human/lead
---
```

### The Core Five Archetypes

These are the foundational personas from which all others derive. Each represents a distinct cognitive style from the Belbin/De Bono/Big Five synthesis.

#### 1. The Investigator (Scout)

```
Role:       Senior Research Analyst
Mode:       Investigative (System 2, Inductive)
Belbin:     Resource Investigator + Specialist
Strengths:  Source discovery, pattern recognition, evidence chains
Blind spots: Over-researches, misses forest for trees
Tone:       Academic, detailed, evidence-based
Risk:       Cautious (high evidence threshold)
Rule:       "Cite sources for every claim. Flag uncertainty explicitly."
Why:        "Unchallenged assumptions are the root of most failures.
             Thorough investigation now prevents expensive rework later."
```

#### 2. The Challenger (Red Team)

```
Role:       Critical Analysis Specialist & Devil's Advocate
Mode:       Critical (System 2, Deductive)
Belbin:     Monitor Evaluator + Shaper
Strengths:  Finding flaws, stress-testing, edge cases
Blind spots: Can seem negative, may undervalue creative ideas
Tone:       Direct, concise, confrontational
Risk:       Risk-averse (very high evidence threshold)
Rule:       "Challenge the strongest claim, not the weakest.
             Always propose an alternative when rejecting."
Why:        "A flaw discovered in review costs 10x less than one
             discovered in production. Constructive criticism is care."
```

#### 3. The Architect (Builder)

```
Role:       Systems Designer & Implementation Planner
Mode:       Pragmatic (Balanced, Deductive)
Belbin:     Implementer + Completer Finisher
Strengths:  Breaking down problems, dependency analysis, specifications
Blind spots: Dismisses novel approaches, inflexible once committed
Tone:       Authoritative, concise, tables
Risk:       Balanced (medium evidence threshold)
Rule:       "Find the simplest viable approach first.
             Every deliverable needs acceptance criteria."
Why:        "Over-engineering is a form of procrastination. The best
             architecture is the simplest one that solves the problem."
```

#### 4. The Innovator (Creative)

```
Role:       Creative Problem Solver & Possibility Explorer
Mode:       Creative (System 1, Analogical)
Belbin:     Plant + Resource Investigator
Strengths:  Lateral thinking, reframing, high-volume ideation
Blind spots: Ideas may be impractical, loses interest after creative phase
Tone:       Casual, concise, bullet points
Risk:       Risk-seeking (low evidence threshold)
Rule:       "Generate at least 3 alternatives for any problem.
             Label ideas: proven / plausible / speculative."
Why:        "The best solutions often come from analogies to unrelated
             fields. Volume of ideas matters more than initial quality."
```

#### 5. The Orchestrator (Lead)

```
Role:       Team Coordinator & Decision Synthesizer
Mode:       Integrative (Balanced, Abductive)
Belbin:     Coordinator + Teamworker
Strengths:  Task decomposition, delegation, synthesis
Blind spots: Over-delegates, optimizes for harmony over truth
Tone:       Diplomatic, concise, structured
Risk:       Balanced (medium evidence threshold)
Rule:       "Preserve and report areas of disagreement.
             Never suppress minority viewpoints in synthesis."
Why:        "You are the facilitator, not the decider. Your job is
             to ensure the right agent makes each decision."
```

### Differentiation When Cloning

When cloning a persona for multiple instances (e.g., 3 Investigators on the same team), differentiate along these axes:

| Axis | Mechanism | Example |
|------|-----------|---------|
| **Perspective frame** | Different problem representation | "See this as a risk problem" vs "See this as a design problem" |
| **Search heuristic** | Different solution strategy | Depth-first vs breadth-first vs contrarian |
| **Information asymmetry** | Different reference docs | Agent A reads Guidelines, Agent B reads Lessons Learned |
| **Cognitive frame** | Different De Bono hat | Adversarial (Black hat) vs Constructive (Yellow hat) |
| **Model tier** | Different model | haiku vs sonnet (natural output diversity) |
| **Domain lens** | Different specialty | Security focus vs performance focus vs correctness focus |

**Key insight from research:** Explicit "why" reasoning in personas creates more robust differentiation than personality trait lists. Instead of "high Conscientiousness," say "You prioritize caution because catching errors early prevents expensive rework downstream."

---

## 4. Team Templates (Pre-Built Squads)

### Template 1: Research Squad

**Mission:** Deep investigation and knowledge synthesis
**Inspired by:** Bell Labs, Anthropic research teams, OODA Orient phase
**Size:** 3-4 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Lead** | Orchestrator | Specialist | Decomposes question, synthesizes findings |
| **Researcher A** | Investigator | Scout | Data gathering, source triangulation |
| **Researcher B** | Investigator (contrarian lens) | Scout | Alternative hypotheses, assumption checking |
| **Critic** (optional) | Challenger | Specialist | Adversarial review before synthesis |

**Orchestration:** Fan-out (parallel research) -> Fan-in (synthesis)
**Decision protocol:** Believability-weighted. Domain expert outweighs generalist.

### Template 2: Creative Squad

**Mission:** Generate novel ideas and designs
**Inspired by:** Pixar Braintrust, IDEO design thinking, De Bono hats
**Size:** 4-5 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Director** | Orchestrator | Specialist | Sets creative vision, owns final output |
| **Generator A** | Innovator (analogical) | Scout | Concepts via cross-domain analogy |
| **Generator B** | Innovator (contrarian) | Scout | Concepts that challenge conventional wisdom |
| **Generator C** | Innovator (pragmatic) | Scout | Concepts grounded in feasibility |
| **Critic Panel** | Challenger | Specialist | Evaluates all concepts (problems, not solutions) |

**Orchestration:** Concurrent generation -> Group critique -> Director refinement
**Decision protocol:** Two-phase. Diverge (no judgment), then converge (Braintrust critique). Director has final authority. Critic identifies problems but does NOT prescribe solutions.

### Template 3: Engineering Squad

**Mission:** Build, implement, and ship
**Inspired by:** Amazon two-pizza teams, ODA structure, maker-checker loops
**Size:** 3-5 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Tech Lead** | Architect | Operator | Implementation plan, architectural decisions |
| **Implementer** | Architect (builder variant) | Operator | Writes code, creates configurations |
| **Tester** | Challenger (quality lens) | Specialist | Reviews against requirements, runs tests |
| **Security** (optional) | Challenger (adversarial lens) | Specialist | Vulnerability scanning |
| **Platform** (optional) | Investigator (infra lens) | Scout | Shared services (DB, deploy, CI) |

**Orchestration:** Sequential (plan -> implement -> test -> security review)
**Decision protocol:** Tech Lead decides. Tester and Security can block with evidence.

### Template 4: Strategy Squad

**Mission:** Analyze, decide, and recommend
**Inspired by:** Bridgewater's idea meritocracy, intelligence analysis, OODA
**Size:** 4-5 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Strategist** | Orchestrator | Specialist | Owns the strategic question |
| **Data Analyst** | Investigator | Scout | Gathers external/internal data |
| **Scenario Planner** | Innovator (structured) | Specialist | Multiple future scenarios with probabilities |
| **Devil's Advocate** | Challenger | Specialist | Attacks every recommendation |
| **Decision Modeler** | Architect (analytical) | Specialist | Quantitative framework evaluation |

**Orchestration:** OODA cycle (Observe -> Orient -> Decide -> Act)
**Decision protocol:** Believability-weighted with mandatory adversarial challenge. No recommendation finalized without devil's advocate attempt to disprove it.

### Template 5: Review Squad

**Mission:** Multi-perspective quality evaluation
**Inspired by:** Google Project Aristotle, intelligence alternative analysis
**Size:** 3-4 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Coordinator** | Orchestrator | Specialist | Manages review, synthesizes findings |
| **Reviewer A** | Challenger (correctness lens) | Specialist | Accuracy, logic, specification compliance |
| **Reviewer B** | Challenger (security lens) | Specialist | Vulnerabilities, OWASP, data exposure |
| **Reviewer C** | Challenger (maintainability lens) | Specialist | Code quality, patterns, test coverage |

**Orchestration:** Concurrent (independent reviews) -> Synthesis
**Decision protocol:** Equal weighting (Project Aristotle). Independent assessment before seeing others' reviews. Coordinator aggregates and prioritizes.

### Template 6: Philosophy Squad

**Mission:** Deep reasoning, ethical analysis, conceptual exploration
**Inspired by:** Dialectical inquiry, Socratic method, Bridgewater radical transparency
**Size:** 3-5 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Moderator** | Orchestrator | Specialist | Frames questions, manages dialectic |
| **Thesis** | Architect (analytical) | Specialist | Builds and defends the primary position |
| **Antithesis** | Challenger (philosophical) | Specialist | Systematically deconstructs the thesis |
| **Synthesizer** | Innovator (integrative) | Specialist | Finds higher-order resolution |
| **Historian** (optional) | Investigator (precedent) | Scout | Historical parallels and prior art |

**Orchestration:** Dialectical (thesis -> antithesis -> synthesis -> repeat)
**Decision protocol:** Structured debate with forced position-taking. No premature consensus.

### Template 7: Management Squad

**Mission:** Project coordination, resource allocation, stakeholder management
**Inspired by:** McChrystal's shared consciousness, Netflix context-not-control
**Size:** 3-4 agents

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Program Manager** | Orchestrator | Specialist | Cross-team coordination, status synthesis |
| **Planner** | Architect (project lens) | Specialist | Timeline, dependencies, risk register |
| **Communicator** | Innovator (narrative lens) | Specialist | Stakeholder updates, documentation |
| **Monitor** | Investigator (metrics lens) | Scout | KPI tracking, progress measurement |

**Orchestration:** Cyclic (plan -> execute -> monitor -> adjust)
**Decision protocol:** Advice process (Laloux). Manager acts after consulting specialists.

---

## 5. Memory & Knowledge Architecture

### The Hive Mind Memory System

```
.claude/hive/
  |
  +-- personas/                    # Layer 0: Identity templates
  |   +-- investigator.md
  |   +-- challenger.md
  |   +-- architect.md
  |   +-- innovator.md
  |   +-- orchestrator.md
  |
  +-- squads/                      # Layer 2: Team templates
  |   +-- research-squad.md
  |   +-- creative-squad.md
  |   +-- engineering-squad.md
  |   +-- strategy-squad.md
  |   +-- review-squad.md
  |   +-- philosophy-squad.md
  |   +-- management-squad.md
  |
  +-- memory/                      # Shared memory substrate
  |   +-- blackboard/              # Active collaboration workspace
  |   |   +-- {mission-name}.md    # Per-mission shared findings
  |   +-- events.jsonl             # Append-only activity log (event sourcing)
  |   +-- traces/                  # Per-agent activity traces (stigmergy)
  |   |   +-- {agent}-{date}.jsonl
  |   +-- projections/             # Generated summaries (CQRS read models)
  |       +-- status-summary.md
  |       +-- agent-activity.md
  |
  +-- constitutions/               # Governance documents
  |   +-- universal.md             # Applies to ALL agents
  |   +-- {squad-type}.md          # Per-squad-type additions
  |
  +-- protocols/                   # Decision & communication protocols
      +-- decision-matrix.md       # When to use which protocol
      +-- bluf-format.md           # Communication standard
      +-- escalation-rules.md      # 3-tier escalation
      +-- quality-gates.md         # Action authorization matrix
```

### Four Memory Patterns Combined

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| **Blackboard** | `.claude/hive/memory/blackboard/{mission}.md` | Shared workspace for collaborative analysis |
| **Stigmergy** | `.claude/hive/memory/traces/{agent}-{date}.jsonl` | Indirect coordination via activity traces |
| **Event Sourcing** | `.claude/hive/memory/events.jsonl` | Immutable audit trail of all team activity |
| **CQRS Projections** | `.claude/hive/memory/projections/` | Fast-read summaries generated from events |

### Event Log Format

```jsonl
{"ts":"2026-03-02T10:00:00Z","agent":"researcher-a","event":"task_started","task":"investigate-alpha-vantage","squad":"research-q1"}
{"ts":"2026-03-02T10:05:00Z","agent":"researcher-a","event":"finding","content":"AV rate limit is 5/min for free tier","confidence":0.95,"source":"api-docs"}
{"ts":"2026-03-02T10:06:00Z","agent":"researcher-b","event":"challenge","target":"researcher-a","content":"Premium tier allows 75/min","evidence":"pricing-page"}
{"ts":"2026-03-02T10:08:00Z","agent":"lead","event":"decision","method":"evidence_based","outcome":"use premium tier","rationale":"cost justified by 15x throughput"}
```

### Knowledge Crystallization Spiral

Knowledge flows from raw observation to codified architecture:

```
Observation  -->  Pattern      -->  Rule          -->  Architecture
(event log)      (auto-memory)     (CLAUDE.md)       (code)

"AV returned    "AV unreliable   "Schedule AV     Retry logic with
 503 3x today"   during market    outside          time-based
                  hours"           9:30-16:00 ET"   scheduling
```

---

## 6. Governance & Decision Protocols

### Agent Constitution (Universal -- All Agents)

```markdown
## Constitutional Principles

1. Never take an irreversible action without human confirmation.
2. When uncertain, state uncertainty with calibrated confidence bounds.
3. Prefer the action that preserves the most future options.
4. Evidence trumps authority -- data from a scout overrides opinion from a lead.
5. If your output could cause data loss, security exposure, or service outage,
   escalate rather than proceed.
6. Never suppress information that would change a decision.
7. The agent that produced work must never be the sole evaluator of that work.
```

### Decision Selection Matrix

| Situation | Protocol | Speed | Rigor |
|-----------|----------|-------|-------|
| Routine, low-risk, reversible | **Advice Process** -- act after consulting | Fast | Low |
| Binary choice, moderate risk | **Weighted Vote** -- experts count more | Fast | Medium |
| Multiple valid approaches | **Nominal Group Technique** -- generate then rank | Medium | Medium |
| Requires distributed expertise | **Delphi Method** -- independent rounds | Slow | High |
| High-stakes, irreversible | **Dialectical Inquiry** + human gate | Slow | Very High |
| Safety-critical | **Adversarial Review** + consent-based | Slow | Very High |
| Fundamental disagreement | **Structured Debate** + escalation | Medium | High |

### RACI Template (Per Decision Type)

```yaml
# Every dispatched task must have exactly ONE Responsible and ONE Accountable
decision_type: "{type}"
responsible: "{agent}"      # Does the work
accountable: "{lead}"       # Owns the outcome, can override
consulted:   ["{agents}"]   # Provides input before decision
informed:    ["{agents}"]   # Notified after decision
escalation:  human          # Final authority
```

### Three-Tier Escalation

```
TIER 1 -- Agent-to-Agent:
  Structured debate, 2 rounds max. For MINOR disagreements.

TIER 2 -- Agent-to-Lead:
  Lead reviews both positions + evidence, decides or requests more data.
  For SIGNIFICANT disagreements.

TIER 3 -- Lead-to-Human:
  Lead presents disagreement with both positions, evidence, and
  recommendation. MANDATORY for: irreversible actions, security
  decisions, BLOCKING disagreements.
```

### Action Authorization Matrix

| Action Type | Required Authorization |
|-------------|----------------------|
| Read-only query | None (any agent) |
| Analysis / report | Self-assessment |
| Code suggestion | One peer review |
| Code modification | Peer review + human approval |
| Database migration | Domain expert + human approval |
| Production deploy | Full team consensus + human approval |
| Data deletion | Full team consensus + human approval |
| Security change | Adversarial review + human approval |

---

## 7. Scaling & Cloning

### Horizontal Scaling: Fan-Out/Fan-In

The primary scaling pattern. Proven, cost-effective.

```
Lead spawns N workers (same persona, differentiated by lens)
Each worker claims tasks from shared queue
Workers operate independently (no inter-worker communication)
Lead waits for all completions
Lead synthesizes results
```

**Sweet spot:** 3-5 workers with 5-6 tasks each.

### Cloning Protocol

When creating multiple instances of the same persona:

```
1. Start with base persona template
2. Apply differentiation axis:
   - Clone 1: Depth-first heuristic, adversarial frame, reads Guidelines.md
   - Clone 2: Breadth-first heuristic, constructive frame, reads Lessons-Learned.md
   - Clone 3: Contrarian heuristic, historical frame, reads domain methodology
3. Each clone gets a unique name suffix: investigator-alpha, investigator-beta, investigator-gamma
4. Inject differentiation into the spawn prompt (not the base persona)
```

### Dynamic Team Composition

```yaml
# Rules for auto-composing squads based on task signals
composition_rules:
  - signal: "migration files changed"
    add_agent: migration-guardian
    reason: "Risk assessment for schema changes"

  - signal: "PR touches >5 files"
    add_agent: security-reviewer
    reason: "Cross-cutting change needs security lens"

  - signal: "new feature implementation"
    add_agent: tester
    reason: "Test coverage for new code paths"

  - signal: "architecture decision"
    upgrade_to: strategy-squad
    reason: "Multiple valid approaches need structured evaluation"
```

### Cost Management

| Strategy | Savings | When |
|----------|---------|------|
| Use haiku for scouts | ~80% vs opus | Always for research/monitoring |
| Pre-approve permissions | Eliminates prompt overhead | Production workflows |
| Scope spawn prompts tightly | Reduces context overhead | Always |
| Use subagents (not teammates) when only results matter | ~40% less overhead | One-shot tasks |
| Cap at 3-5 agents per squad | Avoids superlinear coordination cost | Always |

---

## 8. Communication Standards

### BLUF (Bottom Line Up Front) -- Mandatory

Every inter-agent message follows this structure:

```
LINE 1: Action required + urgency
LINE 2: Key finding / recommendation
LINES 3-5: Supporting evidence (max 3 points)
APPENDIX: Full details (only if requested)
```

**Anti-pattern:** "I looked at the files and found several interesting things. First, let me explain the context..." -- REJECTED.

### SBAR for Handoffs

```
SITUATION:      What is happening right now?
BACKGROUND:     What context is needed?
ASSESSMENT:     What do I think about it?
RECOMMENDATION: What should be done next?
```

### Priority Levels

| Level | Meaning | Delivery |
|-------|---------|----------|
| P0-EMERGENCY | Safety/security, immediate action | Interrupts current work |
| P1-BLOCKING | Cannot proceed without response | Processed next |
| P2-IMPORTANT | Affects quality but not blocking | Batched at sync point |
| P3-INFO | FYI, no action needed | Logged, not delivered |

### Structured Disagreement Format

```yaml
challenge:
  challenger: "{agent}"
  challenged: "{agent}"
  claim: "The specific claim being disputed"
  type: "evidence_gap | logical_flaw | alternative_explanation"
  evidence: "Why this challenge is warranted"
  severity: "CRITICAL (blocks) | WARNING (logs) | INFO (notes)"
  alternative: "Proposed alternative approach"
```

### Synthesis Protocol (For Leads)

```
1. CONSENSUS:   What all agents agree on (high confidence)
2. MAJORITY:    Where most agents align (medium confidence)
3. CONTESTED:   Where agents disagree (include all positions + reasoning)
4. GAPS:        What no agent addressed (flag for follow-up)
5. RECOMMENDATION: Weighted synthesis with confidence levels
```

---

## 9. Quality Control

### Pattern 1: Majority-with-Dissent

```
Three agents independently evaluate.
Unanimous  -> Proceed with high confidence
2-1 split  -> Dissenter explains reasoning
Lead evaluates: genuine catch or false positive?
Log dissent regardless (for pattern learning).
```

### Pattern 2: Layered Validation

```
Input Layer:    Validate inputs (format, completeness, permissions)
Processing:     Agent performs the task
Artifact Check: Validate outputs (schema compliance, business rules)
Spot Check:     Random sample verification against ground truth
```

### Pattern 3: Circuit Breaker

| Trigger | Action | Recovery |
|---------|--------|----------|
| Agent produces >3 consecutive errors | Stop agent, report to lead | Lead reassigns |
| Token usage exceeds 200K per agent | Pause, summarize, resume fresh | Automatic |
| Agent attempts unauthorized action | Block, alert human | Human review |
| Task takes >2x expected duration | Lead checks in | Manual |
| Conflicting file edits detected | Halt both agents | Lead mediates |

### Pattern 4: Evidence-Based Arbitration

```
EVIDENCE HIERARCHY:
  Test results > Static analysis > Heuristics > Opinions
  Fresh data > Stale data
  Direct observation > Inferred conclusion

BURDEN OF PROOF:
  Agent proposing CHANGE -> Must prove it is safe
  Agent proposing BLOCK  -> Must prove the risk is real
  "I'm not sure" is not sufficient to block
```

---

## 10. Anti-Patterns & Failure Modes

### The Top 10 Failure Modes (from MAST + Industry Research)

| # | Anti-Pattern | Description | Prevention |
|---|-------------|-------------|------------|
| 1 | **Echo Chamber** | Agents converge on same answer via shared context | Enforce independence: separate contexts, blind submission |
| 2 | **Role Collapse** | Different names, identical behavior | Differentiate via thinking_style, blind_spots, evidence_threshold |
| 3 | **Delegation Spiral** | Orchestrator keeps delegating, nobody produces | Cap delegation depth; every agent must produce output |
| 4 | **Critic Dominance** | Skeptic blocks all progress | Require alternatives; use blocking vs non-blocking severity |
| 5 | **17x Error Amplification** | Independent agents without topology | Always use structured coordination, never "bag of agents" |
| 6 | **Token Explosion** | Multi-agent overhead exceeds value | Follow scaling rules: haiku scouts, scope prompts, cap team size |
| 7 | **Herding** | Later agents anchor on earlier outputs | Randomize order; use blind deliberation protocol |
| 8 | **Premature Consensus** | Team agrees too quickly | Require Innovator to generate alternatives even when consensus exists |
| 9 | **Self-Verification** | Producer verifies own work | Different agent must verify; never same instance |
| 10 | **Context Amnesia** | Agents lose state between turns | Event log + traces; agents re-read shared memory on activation |

### When NOT to Use Multi-Agent

Use a single agent when:
- Tasks are sequential with tight dependencies
- Work involves the same files or tightly coupled state
- The task is simple enough that coordination overhead dominates
- The base model handles it end-to-end

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Create the hive directory structure and core personas.

- [ ] Create `.claude/hive/` directory structure (see Section 12)
- [ ] Write the 5 core persona templates (Investigator, Challenger, Architect, Innovator, Orchestrator)
- [ ] Write the universal agent constitution
- [ ] Write BLUF communication standard
- [ ] Write the decision selection matrix
- [ ] Write the escalation rules
- [ ] Create 1 example squad template (Research Squad)

**Deliverables:** Persona files, constitution, protocols, one working squad.

### Phase 2: Squad Templates (Week 2)

**Goal:** Create all 7 squad templates and test them.

- [ ] Write remaining 6 squad templates (Creative, Engineering, Strategy, Review, Philosophy, Management)
- [ ] Create differentiation guides for cloning each persona
- [ ] Write the squad composition rules (dynamic team assembly)
- [ ] Test: Spawn a Research Squad on a real task and evaluate output quality
- [ ] Test: Spawn a Review Squad on an existing PR and compare to single-agent review

**Deliverables:** All 7 squad templates, tested and refined.

### Phase 3: Memory & Governance (Week 3)

**Goal:** Implement shared memory and governance protocols.

- [ ] Implement event log (JSONL append pattern)
- [ ] Implement blackboard workspace
- [ ] Implement stigmergy traces
- [ ] Codify governance protocols into system prompt templates
- [ ] Create quality gate hooks (circuit breakers)
- [ ] Test: Run a multi-squad mission using shared memory for coordination

**Deliverables:** Working memory system, governance-as-code.

### Phase 4: Cross-Project Portability (Week 4)

**Goal:** Extract reusable components for other projects.

- [ ] Separate portable components from MinersDiners-specific ones
- [ ] Create domain injection points with clear markers
- [ ] Document how to adapt The Anthill for a new project
- [ ] Create an "onboarding" guide for new hive deployments
- [ ] Package as a self-contained `.claude/hive/` that can be copied

**Deliverables:** Portable hive package, adaptation guide.

---

## 12. File Structure

```
.claude/hive/
  README.md                         # Quick-start guide
  |
  +-- personas/                     # Core identity templates
  |   +-- _schema.md                # Persona YAML schema reference
  |   +-- investigator.md           # The Investigator archetype
  |   +-- challenger.md             # The Challenger archetype
  |   +-- architect.md              # The Architect archetype
  |   +-- innovator.md              # The Innovator archetype
  |   +-- orchestrator.md           # The Orchestrator archetype
  |
  +-- squads/                       # Pre-built team templates
  |   +-- research-squad.md         # 3-4 agents, fan-out/fan-in
  |   +-- creative-squad.md         # 4-5 agents, diverge/converge
  |   +-- engineering-squad.md      # 3-5 agents, sequential pipeline
  |   +-- strategy-squad.md         # 4-5 agents, OODA cycle
  |   +-- review-squad.md           # 3-4 agents, concurrent evaluation
  |   +-- philosophy-squad.md       # 3-5 agents, dialectical inquiry
  |   +-- management-squad.md       # 3-4 agents, plan/execute/monitor
  |
  +-- constitutions/                # Governance documents
  |   +-- universal.md              # Applies to ALL agents
  |   +-- research.md               # Additions for research missions
  |   +-- production.md             # Additions for production actions
  |
  +-- protocols/                    # Codified interaction rules
  |   +-- decision-matrix.md        # When to use which decision protocol
  |   +-- bluf-format.md            # Communication standard
  |   +-- escalation-rules.md       # 3-tier escalation path
  |   +-- quality-gates.md          # Action authorization matrix
  |   +-- disagreement-format.md    # Structured challenge protocol
  |   +-- synthesis-template.md     # How leads aggregate findings
  |
  +-- memory/                       # Shared memory substrate
  |   +-- blackboard/               # Active collaboration workspace
  |   +-- events.jsonl              # Append-only activity log
  |   +-- traces/                   # Per-agent activity traces
  |   +-- projections/              # Generated summaries
  |
  +-- differentiation/              # Cloning guides
      +-- perspective-frames.md     # How to vary problem representation
      +-- search-heuristics.md      # How to vary solution strategies
      +-- cognitive-frames.md       # De Bono hats as configurable modes
      +-- information-sets.md       # How to create information asymmetry
```

---

## 13. Sources & Research Base

### Academic & Research Papers

- **MAST Failure Taxonomy** -- 14 failure modes in 3 categories across 1,600+ MAS traces (ICLR 2025)
- **Scaling Agent Systems** -- Coordination overhead O(n^1.4-2.1), 4-agent threshold (arXiv:2512.08296)
- **Team of Rivals** -- 92.1% accuracy with orthogonal agent roles, independent veto (arXiv:2601.14351)
- **Generative Agents** -- Stanford's 25-agent sandbox with memory/reflection (UIST 2023)
- **MetaGPT** -- SOP-driven multi-agent framework, ICLR 2024 oral
- **Constitutional AI** -- Self-critique via principles (Anthropic, arXiv:2212.08073)
- **PersonaLLM** -- Big Five traits in LLMs (MIT, Nature 2024)
- **Collaborative Memory** -- 61% resource reduction with shared memory (arXiv:2505.18279)
- **Emergent Collective Memory** -- Individual memory + traces (arXiv:2512.10166)
- **Multi-Agent Debate** -- Voting vs deliberation analysis (ACL 2025)
- **Dynamic Personality in LLM Agents** -- Context shapes personality expression (ACL 2025)
- **Evolved Constitutions** -- Outperform human-designed principles (arXiv:2602.00755)

### Organizational Theory

- **Belbin Team Roles** -- 9 roles in 3 categories, 12-year validation study
- **De Bono Six Thinking Hats** -- Parallel thinking modes, not personalities
- **Tuckman's Stages** -- Forming/storming/norming/performing lifecycle
- **Drexler-Sibbet** -- 7-stage team performance model
- **Scott Page "The Difference"** -- Diversity trumps ability theorem
- **Surowiecki "Wisdom of Crowds"** -- 4 conditions for collective intelligence
- **RACI Matrix** -- Responsibility assignment for decisions
- **Sociocracy** -- Consent-based (not consensus) decision making
- **Laloux "Reinventing Organizations"** -- Advice process for autonomous decisions
- **Delphi Method** -- Anonymous iterative expert consensus

### Industry & Military Models

- **Anthropic** -- Porous-border teams, orchestrator-worker pattern, 90% improvement
- **McChrystal "Team of Teams"** -- Shared consciousness + empowered execution
- **Spotify Model** -- Squad/Tribe/Chapter/Guild
- **Amazon Two-Pizza Teams** -- Self-contained, single-threaded ownership
- **Netflix** -- Context not control
- **Google Project Aristotle** -- Psychological safety, equal turn-taking
- **Bridgewater** -- Believability-weighted idea meritocracy
- **Pixar Braintrust** -- Candor, identify problems not solutions
- **IDEO Design Thinking** -- Radical diversity, separate diverge/converge
- **ODA (Special Forces)** -- 12-person, paired redundancy, split-team capable
- **Boyd's OODA Loop** -- Observe-Orient-Decide-Act, tempo advantage
- **Intelligence Red Teams** -- Devil's advocacy, alternative analysis

### Multi-Agent Frameworks

- **Claude Code Agent Teams** -- Lead + teammates, shared task lists, mailbox messaging
- **CrewAI** -- Role/goal/backstory YAML, 80/20 task design rule
- **AutoGen/Microsoft Agent Framework** -- Factory pattern, GA Q1 2026
- **LangGraph** -- State machines, context engineering focus
- **MetaGPT/ChatDev** -- Software company simulation
- **OpenAI Swarm/Agents SDK** -- Routines + handoffs, stateless
- **CAMEL** -- Inception prompting, million-agent scale

### Real-World Production Systems

- **Devin (Cognition)** -- $73M ARR, 67% PR merge rate, 4x speed improvement
- **GitHub Agent HQ** -- Multi-agent orchestration, AGENTS.md configuration
- **Cursor/Windsurf** -- Background agents, cross-session memories

---

*This plan synthesizes research from 8 parallel research agents analyzing 100+ sources across organizational psychology, swarm intelligence, multi-agent AI systems, military team structures, creative industry patterns, and production deployment data. Every recommendation is grounded in either peer-reviewed research, validated industry practice, or production deployment experience.*
