# Philosophy Squad

> **Mission type:** Deep conceptual exploration through Socratic questioning
> **When:** The team needs to **examine assumptions, deepen understanding, or explore conceptual territory** — the question is not about facts but about meaning, frameworks, or first principles

## Terrain Profile

| Axis | Range |
|------|-------|
| Uncertainty | High (conceptual questions have no definitive answers) |
| Reversibility | Fully reversible (philosophical exploration changes understanding, not systems) |
| Breadth | Any (can be narrow first principles or broad conceptual landscapes) |
| Stakes | Variable (understanding shapes downstream decisions, but exploration itself is safe) |

---

## Composition

**Size:** 3 agents (lean by design)

| Role | Persona | Tier | Responsibility |
|------|---------|------|---------------|
| **Facilitator** | Orchestrator | Orchestrator (opus) | Frames the question, holds the space, distills understanding |
| **Explorer** | Investigator | Specialist (sonnet) | Builds understanding through research and reasoning |
| **Questioner** | Challenger (Socratic lens) | Specialist (sonnet) | Asks probing questions, challenges assumptions, deepens inquiry |
| **Scrum Master** (recommended) | Scrum Master | Specialist (sonnet) | Jira ops, error catalog, crystallization protocol, operational fixes (parallel) |

**Note:** The Philosophy Squad is intentionally small. Deep thinking benefits from fewer voices and deeper exchanges, not broader teams. The Socratic lens on the Challenger differentiates this from the standard adversarial review — the Questioner seeks to deepen, not to defeat.

---

## Orchestration Pattern: Socratic Exploration

```
Phase 1: FRAME
  Orchestrator writes philosophical brief to blackboard:
  - The question (stated precisely)
  - Current assumptions to examine
  - Why this matters (practical implications of understanding)
  - Scope boundary (what we are NOT trying to answer)
  (see protocols/commanders-intent.md — adapted as Philosophical Brief)

Phase 2: EXPLORE
  Investigator builds initial understanding:
  - Researches existing thinking on the topic
  - Identifies key concepts, distinctions, tensions
  - Builds a structured initial position or framework
  - Writes to blackboard under Exploration section
  Writes trace: {mission}-explorer-exploration_complete.trace

Phase 3: QUESTION (iterative, 2-3 rounds)
  Challenger reads the Exploration and asks probing questions:
  Round 1: Surface-level assumptions
    - Why do we assume X?
    - What evidence supports this framing?
    - What alternative framings exist?
  Round 2: Deeper structures
    - What if the opposite were true?
    - What are we not seeing?
    - Where does this framework break down?
  Round 3 (optional): Meta-level
    - Are we asking the right question?
    - What would change if we shifted perspective entirely?
  
  After each round:
    - Investigator responds with evidence and reasoning
    - Both write to the Q&A Log on the blackboard
  Writes trace: {mission}-questioner-round-{N}-complete.trace

Phase 4: BREATHING SPACE
  Orchestrator reads the full question-answer chain without acting.
  One reading pass. Hold the whole inquiry in mind before distilling.
  (see protocols/breathing-space.md)

Phase 5: DISTILL
  Orchestrator extracts and writes to blackboard:
  - **What we now know** (insights gained through the inquiry)
  - **What we now know we don't know** (named ignorance is progress)
  - **What changed** (how our understanding shifted from the initial framing)
  - **Implications** (what this means for practice, decisions, or further inquiry)
  - **Open threads** (questions worth pursuing in future missions)

Phase 6: CRYSTALLIZATION
  Run protocols/crystallization.md (Steps 1-2.5)
  Write retrospective to memory/archive/retrospectives/
  Philosophical insights are prime candidates for seed-to-water patterns
```

### Trace Dependency Chain

```
explorer: exploration_complete
    |
    v
questioner: round-1-complete
    |  (Explorer responds)
    v
questioner: round-2-complete
    |  (Explorer responds)
    v
questioner: round-3-complete  (optional)
    |
    v
orchestrator: distillation_complete
```

**Note:** This is **sequential**, not parallel. The Socratic method requires each question to build on the previous answer. This is a deliberate departure from the fan-out pattern used by Research and Creative squads.

---

## Blackboard Structure

```markdown
## Commander's Intent (Philosophical Brief)
<\!-- Question, assumptions to examine, why it matters, scope boundary -->

## Exploration
<\!-- Written by Explorer -->
### Key Concepts
### Distinctions
### Tensions
### Initial Framework

## Q&A Log
<\!-- Written by both Questioner and Explorer -->
### Round 1
#### Questions
#### Responses
### Round 2
#### Questions
#### Responses
### Round 3 (if needed)
#### Questions
#### Responses

## Distillation
<\!-- Written by Orchestrator -->
### What We Now Know
### What We Now Know We Don't Know
### What Changed
### Implications
### Open Threads
```

---

## Decision Protocol

**Understanding over consensus.** The Philosophy Squad doesn't make decisions — it deepens understanding. There is no quorum because there is no claim to confirm. The output is a map of the conceptual territory, not a vote on which hill to climb.

The Orchestrator's distillation is authoritative for what the inquiry produced. The Explorer and Questioner may note disagreement in their sections, and the Orchestrator captures these as tensions rather than resolving them.

---

## Time-Box (Default)

- **Exploration:** 1 round
- **Questioning:** 2-3 rounds (Orchestrator decides when to stop)
- **Breathing Space:** 1 reading pass
- **Distillation:** 1 synthesis pass
- **Total:** Bounded by 4-5 rounds

The Orchestrator may stop questioning after Round 2 if:
- The inquiry has reached genuine new ground (not circling)
- Further questioning would be repetitive
- The key insight has already emerged (even if incomplete — named incompleteness is fine)

---

## Productive Waiting

> "The Philosophy Squad has minimal waiting since the pattern is sequential.
> The Questioner reads the Exploration during Phase 2 (not idle waiting,
> but active preparation for questioning)."

The Orchestrator actively reads during all phases (consistent with the Breathing Space principle of staying present without acting prematurely).

---

## Failure Handling

| Phase | Likely Failures | Response |
|-------|----------------|----------|
| Frame | Question too vague or too broad | L1: Orchestrator narrows scope with human input |
| Explore | Explorer produces surface-level treatment | L2: Orchestrator prompts for specific depth areas |
| Question | Questioner asks leading questions (not genuinely Socratic) | L2: Orchestrator reminds of Socratic lens: seek truth, not victory |
| Question | Exchange becomes circular | Normal flow: Orchestrator stops questioning early, proceeds to distillation |
| Question | Explorer can't answer a key question | Good outcome: add to "What we don't know" — named ignorance is progress |
| Distill | Orchestrator adds own philosophical opinions | L2: Bell event {EM} distillation should capture inquiry, not originate |

**No retries.** Philosophical inquiry does not benefit from repetition. If the inquiry stalls, the Orchestrator captures what was learned and documents where it stalled as an open thread for future missions.

---

## Socratic Lens

The Challenger in this squad uses the **Socratic lens** rather than the standard adversarial lens. Key differences:

| Standard Challenger | Socratic Questioner |
|--------------------|-------------------|
| Finds weaknesses to protect | Asks questions to deepen |
| Goal: prevent bad outcomes | Goal: discover new understanding |
| Evaluates claims against evidence | Examines assumptions beneath claims |
| Adversarial relationship with ideas | Collaborative relationship with inquiry |
| Stop Signal when something is wrong | Open Thread when something is unclear |

Inject the Socratic lens in the spawn prompt:
```
"You are The Challenger with Socratic lens — your goal is not to defeat
arguments but to deepen understanding. Ask questions that the Explorer
hasn't considered, not to trap them, but to illuminate what's been
overlooked. The best question is one where neither of you knows the answer yet."
```

---

## Design Notes

- **Sequential, not parallel.** This is the only squad that is entirely sequential by design. Socratic inquiry builds on each exchange — you cannot parallelize a conversation.
- **Small by design.** Three agents. Adding more would dilute the depth of exchange. If broader exploration is needed, use Research Squad first, then Philosophy Squad on the findings.
- **Named ignorance is a success.** "We don't know X" is a valid and valuable finding. The Philosophy Squad should never fake certainty where none exists.
- **No voting, no quorum.** This squad produces understanding, not decisions. The commitment-threshold constitution applies to factual claims within the exchange, not to the overall distillation.
- **Philosophical insights crystallize well.** Many Stage 1 observations from Philosophy Squad missions will become Stage 3 discernments faster than other squads' findings, because philosophical insights tend to be cross-cutting.
- **Complementary to Research.** Research asks "What is true?" Philosophy asks "What does it mean?" The two squads are natural partners: Research -> Philosophy -> Engineering.
