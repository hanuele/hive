# Maya Chen — Feedback on v2

---

## Section 3: The Persona System

### What Improved

The shift from YAML matrix to narrative persona is the single biggest win in this entire document. I pushed hard for this in the roundtable and the team delivered. The current Investigator persona reads like something a person wrote, not a configuration file. You can understand it in 30 seconds without consulting a legend. That is exactly what I asked for.

Specifically, the Blind Spots section is inspired. I have never seen this in any design system, agent or otherwise. Every design component has failure modes, and we never document them — we just let engineers discover them in production. Making blind spots explicit and naming which other agent compensates is the kind of honest, composable design I spend most of my career fighting for.

The four-axis differentiation table (Perspective frame / Search heuristic / Information asymmetry / Domain lens) is clean and scannable. The key insight line at the end — "differentiation is a strategic principle, not a cloning technique" — earns its place. That sentence is doing real work.

Moving the YAML schema to a `_schema-reference.md` power-user file rather than deleting it is also the right call. It respects the existing research investment without burdening the main path. That is proper progressive disclosure architecture.

### Remaining Concerns

**Concern 1: The Orchestrator persona is still doing too much cognitive work in its rules.**

Read Orchestrator Rule 1 again: "Begin every mission by writing commander's intent on the blackboard: objective, constraints, boundaries, and 'why.'" That is four sub-items packed into one rule line. Now read Investigator Rule 1: "Cite sources for every claim. Flag uncertainty explicitly." That is two things in one line but they are strongly coupled. The Orchestrator rule is a different category of complexity — it is describing a sub-protocol, not a behavior.

If the persona should be readable in 30 seconds (stated in the section header), then embedding a protocol spec inside a rule line defeats the purpose. The rules should say *what you do,* not *how you do it.* The Orchestrator rules currently blur this line in two places: Rule 1 (commander's intent sub-items) and Rule 4 (quorum sensing, which is defined elsewhere in Section 6). The rule should reference the protocol, not reproduce it.

**Concern 2: The Innovator persona has a weak "Who You Are" paragraph compared to the others.**

Compare the Investigator's opening — "You are a senior research analyst who believes that unchallenged assumptions are the root of most failures" — to the Innovator's — "You are a creative problem solver who believes the best solutions often come from analogies to unrelated fields." The Investigator has a clear *consequentialist* why: unchallenged assumptions cause failures. The Innovator has a *stylistic* why: analogies to other fields. That is not the same strength of reasoning. It describes how the Innovator thinks, not why that way of thinking matters to the team.

This will cause downstream problems: when agents read each other's personas (as they should, to understand their teammates), the Innovator will seem less authoritative than the others. Its role will be undervalued in the team dynamic.

**Concern 3: No guidance on persona reading order or when agents should actually read each other's files.**

The section describes five personas but says nothing about how they are introduced to each other. Does the Orchestrator read all five? Does each Specialist only know their own? This matters enormously for how the team assembles itself. The omission may be intentional — "figure it out during implementation" — but if so, that is a decision that should be stated, not left implicit.

**Concern 4: "Max 5 rules" is a constraint without a rationale.**

Every rule in this document has a rationale attached. This one does not. Why 5? Is it cognitive load? Is it tested? George Miller's 7±2 would suggest 7 is fine. If it is 5 because the team tested it and 6 rules caused worse persona adherence, say that. If it is 5 because it felt right, that is not good enough for a system this carefully designed.

### Specific Edits

**Edit 1: Orchestrator Rule 1 — simplify to behavior, reference protocol**

Current text:
```
1. Begin every mission by writing commander's intent on the blackboard:
   objective, constraints, boundaries, and "why."
```

Proposed replacement:
```
1. Write commander's intent on the blackboard before any agent acts.
   (Format: see Commander's Intent template in §6)
```

The sub-items belong in the protocol template in Section 6, not here. The persona should point to the protocol, not duplicate it.

**Edit 2: Orchestrator Rule 4 — same fix**

Current text:
```
4. Ensure all significant findings are independently verified
   before the team commits (quorum sensing).
```

Proposed replacement:
```
4. Before the team commits, verify quorum is met.
   (Threshold rules: see Commitment Threshold in §6)
```

**Edit 3: Innovator — strengthen the "why" in Who You Are**

Current text:
```
You are a creative problem solver who believes the best solutions
often come from analogies to unrelated fields. You think laterally —
reframing problems, generating volume, crossing domain boundaries.
Volume of ideas matters more than initial quality because the
breakthrough is usually idea #7, not idea #1.
```

Proposed replacement:
```
You are a creative problem solver who believes that convergence is
the team's greatest vulnerability. When everyone agrees too quickly,
the best option usually went unconsidered. You think laterally —
reframing problems, generating volume, crossing domain boundaries —
because the breakthrough is almost never the first idea anyone had.
Your value to the team is not your best idea. It is the idea that
stops the team from settling.
```

This gives the Innovator a consequentialist why (premature convergence is dangerous) that matches the rhetorical strength of the other personas.

**Edit 4: Add a sentence to the section header explaining the reading order**

After the sentence "The persona should be readable by a human in 30 seconds," add:

```
Each agent receives its own persona on spawn. The Orchestrator
receives all persona narratives. Specialists may receive peer
personas at the Orchestrator's discretion (see §8: Communication
Standards for spawn protocol).
```

This surfaces a decision that is currently implicit and will otherwise cause implementation inconsistency.

**Edit 5: Add rationale for "max 5 rules"**

After "## Your Rules (max 5)", add a parenthetical:

```
## Your Rules (max 5)
<!-- Limit is empirical: persona adherence degrades when rules exceed
     5. If you need more, split into two personas. -->
```

If the limit is not yet empirically validated, be honest:

```
## Your Rules (max 5)
<!-- Limit follows cognitive load research on working memory.
     Validate and adjust after Phase 3 retrospectives. -->
```

Either way, the constraint needs a source.

---

## Section 11: Implementation Roadmap

### What Improved

The four-phase structure is exactly right: Foundation, Core Squads, Refinement, Portability. That sequencing respects the "prove before you build" principle that I argued for and that Sun Tzu and Seeley reinforced. You are not building all 7 templates. You are building 3, running real missions, and evaluating from there. That is the correct order.

The specific testable milestones in each phase are good. "Test: Spawn a Research Squad on a real task and evaluate output quality" is an actual pass/fail gate, not a documentation exercise. I appreciate that. Most roadmaps at this stage of a design system are wish lists. This one has checkboxes with concrete outcomes attached.

Phase 3's retroactive evaluation of deferred templates — "Evaluate whether any deferred template (Creative, Strategy, Philosophy, Management) is needed" — is correct design discipline. You deferred the speculative ones and built in the evaluation trigger. Good.

### Remaining Concerns

**Concern 1: No success criteria at the phase level.**

Each phase has a Goal and a Deliverables list. Neither contains a measurable success criterion. "One working squad" (Phase 1 deliverable) is ambiguous — working by whose standard? "Output quality" in the Phase 1 test is undefined. Without criteria, the team will move to Phase 2 because they feel ready, not because they have evidence.

This is the single most common adoption failure mode for design systems I have shipped. Teams move to the next phase because the calendar says to, not because the previous phase passed. Then the problems from Phase 1 compound in Phase 2 and explode in Phase 3.

**Concern 2: Week-based timing is aggressive and may be wrong for an undiscovered system.**

Four weeks for a system that has never run in production. Phase 1 alone — persona narratives, constitution, stop signal protocol, commitment thresholds, commander's intent template, squad template, and blackboard template — is more than a week of careful writing if done well. The week-based framing creates pressure to ship rather than pressure to learn.

I would rather see this framed as mission-count milestones than calendar milestones. "Advance to Phase 2 after 3 successful Research Squad missions" is a better gate than "advance to Phase 2 after Week 1."

**Concern 3: No user onboarding path.**

Phase 4 creates a portability package and an onboarding guide for new hive deployments. But there is no onboarding guide for the first user of this system — the human who is going to spawn their first squad in Week 1. What does that experience look like? What is the minimum they need to understand to use it successfully without reading the full plan?

In design systems, the first-use experience determines adoption. If the first time someone spawns a squad they get a confusing output or do not know what to do with the result, they will not try again. This is not a Phase 4 problem — it is a Phase 1 problem. The first deliverable should include a one-page "how to spawn your first squad" guide alongside the technical artifacts.

**Concern 4: Phase 3 "refine persona narratives based on observed behavior" is underspecified.**

How will you know when a narrative needs refinement? What signals from the event log indicate that a persona is not performing as intended? "Observed behavior" is not a method — it is an aspiration. Without instrumentation criteria, Phase 3 refinement will be gut-feel editing, which may improve or degrade the system randomly.

### Specific Edits

**Edit 1: Add success criteria to each phase**

After each phase's Goal, add a "Phase Gates" block:

```markdown
### Phase 1: Foundation (Week 1)

**Goal:** Create the hive directory structure, core personas, and one working squad.

**Phase Gates (advance only when all pass):**
- [ ] A human unfamiliar with the plan can understand an Investigator's output without consulting the plan
- [ ] Research Squad completes a real task and produces a BLUF summary that the spawning human rates as useful
- [ ] Blackboard commander's intent is readable after mission completion (post-Orchestrator state preservation test)
```

The specific gates will vary per phase, but the pattern should be consistent: human-evaluable, binary pass/fail, defined before the phase begins.

**Edit 2: Replace week-based framing with mission-count gates**

Current Phase 1 header:
```
### Phase 1: Foundation (Week 1)
```

Proposed replacement:
```
### Phase 1: Foundation (Target: Week 1 | Advance after: 1 successful Research Squad mission)
```

Current Phase 2 header:
```
### Phase 2: Core Squads & Memory (Week 2)
```

Proposed replacement:
```
### Phase 2: Core Squads & Memory (Target: Week 2 | Advance after: 3 multi-squad missions with shared memory)
```

Apply same pattern to Phases 3 and 4. The calendar target is a reference, not a gate.

**Edit 3: Add first-user onboarding to Phase 1 deliverables**

Current Phase 1 deliverables:
```
**Deliverables:** Persona narratives, constitution-in-prompts, one working squad, blackboard template.
```

Proposed replacement:
```
**Deliverables:** Persona narratives, constitution-in-prompts, one working squad, blackboard template, first-use guide (one page: how to spawn your first Research Squad, what to expect, how to read the output).
```

**Edit 4: Instrument Phase 3 refinement criteria**

After the Phase 3 bullet "Refine persona narratives based on observed behavior," add:

```
- [ ] Define persona health indicators from event log: what signal indicates a persona is underperforming?
      (Candidate indicators: stop signal frequency per agent, escalation rate, output rated as low-quality by Challenger)
```

This makes "observed behavior" into a method. The specific indicators can be wrong on first iteration — that is fine. Having indicators at all prevents drift.

---

## Overall Assessment

The v2 plan is substantially better than v1 in the areas where I pushed hardest. The persona system went from a YAML configuration burden to something a human actually wants to read. That alone represents a significant design quality leap.

What remains is the gap between a well-designed artifact and a well-adopted system. A design system that ships but is not used has failed, no matter how elegant its architecture. The implementation roadmap currently optimizes for shipping. It needs to optimize equally for adoption — which means success criteria, human-legible first experiences, and measurement before refinement.

The bones are strong. The user path still needs work.
