# Admiral James Hartwell — Feedback on v2

*Prepared for the Anthill Roundtable, v2 review cycle*
*Date: 2026-03-02*

---

## Section 4: Squad Templates & Terrain-Adaptive Composition

### What Improved

The terrain-analysis framework is a genuine improvement. At the roundtable I called the old template system a menu — you had to choose your squad like ordering from a restaurant, and if you ordered wrong, you ate it anyway. This version asks four questions about the mission first: uncertainty, reversibility, breadth, stakes. That is the right sequence. You do not assemble a carrier strike group and then ask what the threat environment is. You assess the threat, then you man the decks.

The inclusion of **Commander's Intent examples** in each template is exactly what I asked for. "We need to understand X because we're about to build Y. Boundaries: focus on Z, ignore W. Success: a clear recommendation with evidence, or an explicit 'we don't know enough yet.'" That is a proper five-paragraph field order compressed to three sentences. A subordinate who receives that instruction can act when the plan breaks down — and the plan *always* breaks down on first contact. This is the single most important change in v2, and I want to acknowledge it explicitly.

The Dynamic Augmentation Rules table deserves mention. Adding `migration-guardian` when migration files change, adding `security-reviewer` when a PR touches more than five files — these are correct signals. They are not arbitrary thresholds; they reflect genuine risk inflection points. This is how a watch officer works: specific conditions trigger specific responses, pre-drilled, not improvised.

The Deferred Templates table is also sound judgment. Deferring the Philosophy Squad and Management Squad until three real missions prove the need — that is Maya Chen's progressive disclosure principle applied with military discipline. Do not provision for a battle you have not yet been ordered to fight.

### Remaining Concerns

**First: The terrain axes are underspecified for the composition engine.**

The four axes — uncertainty, reversibility, breadth, stakes — are listed as binary: low/high, reversible/irreversible. Real operations do not resolve into binaries. I have conducted operations that were medium-uncertainty, partially-reversible, moderate-breadth, and medium-stakes — and none of the five composition rows would have matched correctly. The composition table has five rows for a four-axis binary space that has sixteen possible combinations. Eleven combinations are unaddressed.

This is not pedantry. When a mission falls into an unaddressed cell, one of two things happens: the Orchestrator guesses, or the system defaults silently. Neither is acceptable. A ship that cannot navigate a chart gap does not assume the sea is clear — it slows down and sounds its depth.

The fix is not to expand the table to sixteen rows. The fix is to add a **tiebreaker rule**: when no template matches exactly, the system applies the "nearest match by highest-stakes axis" and flags the mismatch to the human. Irreversibility and stakes are the dominant axes — when those are high, default to the higher-governance template regardless of the others. Write that rule explicitly.

**Second: The "stop signal" for fundamental disagreement is buried in Dynamic Augmentation Rules.**

The rule reads: `signal: "fundamental disagreement after 2 debate rounds" → add_agent: innovator`. I understand the intent — when two positions are locked, bring in a reframer. But this rule is hidden in a YAML block that reads like operational configuration, not doctrine. An agent running a Research Squad who encounters fundamental disagreement is not going to remember to check the augmentation rules YAML.

This should be in the persona DNA of the Orchestrator and the Facilitator. The rule should be: *"After two rounds of unresolved disagreement, I do not debate harder. I reframe or I escalate."* That instruction belongs in the Orchestrator prompt, not in a config block. This is the drills-not-protocols principle I argued for at the first roundtable, and it has not fully landed in Section 4.

**Third: The Engineering Squad has a structural ambiguity in the Tech Lead role.**

The Engineering Squad template shows the Tech Lead as persona "Architect / Operator" with responsibility "Implementation plan, architectural decisions." The Implementer is "Architect (builder variant)" with responsibility "Writes code, creates configurations." The Tester is "Challenger (quality lens)."

The problem: the Tech Lead role is listed as both Architect *and* Operator — two personas with different cognitive profiles and authority levels. In my command experience, the person who draws the battle plan is not the same person who executes it. When you combine planning authority and execution authority in one role, you get accountability confusion. If the implementation diverges from the plan, who is responsible — the Tech Lead as planner, or the Tech Lead as executor? You cannot hold one person to two standards simultaneously.

Separate these cleanly. Tech Lead = Architect (plans, decides). Implementer = Operator (executes). If the plan turns out to be wrong, it is the Tech Lead's responsibility to revise the plan — not the Implementer's responsibility to improvise around it.

**Fourth: No time-boxing in any template.**

I raised this at the first roundtable. The v1 plan had no concept of a forcing function — deliberation without a clock produces drift. v2 has incorporated commitment thresholds in Section 6, but Section 4's squad templates include no time-box guidance. The Engineering Squad orchestration is listed as "Sequential (plan -> implement -> test -> security review)" with no duration bounds. The Research Squad is "Fan-out / Fan-in" with no convergence deadline.

In carrier strike group operations, every phase has a time window. The air tasking order specifies time-on-target to the minute. Not because the mission cannot be extended — it can — but because the absence of a default time generates the assumption that time is unlimited, which produces agents that optimize for thoroughness over completion.

Each squad template should specify a default time-box for each phase. This does not need to be a hard cutoff — it is a signal to the Facilitator that deliberation has exceeded its expected window and a decision is required.

### Specific Edits

**Edit 1: Add a tiebreaker rule to the Composition Rules section**

After the composition table, add:

```
TIEBREAKER RULE (when no row matches exactly):
  1. Identify the two highest-stakes axes for this mission
  2. Apply the template that matches those two axes, even if lower-stakes axes differ
  3. Precedence: REVERSIBILITY > STAKES > UNCERTAINTY > BREADTH
  4. Flag the mismatch in the Commander's Intent: "Template approximated from [original profile] → [matched template]. Difference: [axes that don't match]. Rationale: [why this template was chosen]."
```

**Edit 2: Move the disagreement rule to Template narrative, not YAML config**

Delete this entry from `composition_rules`:
```yaml
  - signal: "fundamental disagreement after 2 debate rounds"
    add_agent: innovator
    reason: "Reframe to find alternatives beyond the current positions"
```

Replace with a note embedded in the Research Squad and Engineering Squad Commander's Intent guidance:

> **Disagreement Protocol:** If two rounds of structured debate produce no convergence, the Facilitator does not add a third round. The Facilitator either (a) reframes the question to find a solution space neither position occupies, or (b) escalates to a human decision gate with both positions documented in SBAR format. This rule belongs in the Facilitator's persona, not in a config file.

**Edit 3: Separate Tech Lead planning authority from execution authority in the Engineering Squad**

Replace:

| Role | Persona | Tier | Responsibility |
|------|---------|------|----------------|
| **Tech Lead** | Architect / Operator | Operator | Implementation plan, architectural decisions |

With:

| Role | Persona | Tier | Responsibility |
|------|---------|------|----------------|
| **Tech Lead** | Architect | Specialist | Implementation plan, architectural decisions, revision authority if plan fails |

And add a note: *"The Tech Lead plans and decides. The Implementer executes. If execution reveals the plan is wrong, the Tech Lead revises the plan — the Implementer does not improvise around it."*

**Edit 4: Add default time-boxing to each template**

After each template's orchestration description, add a Time-Box row:

Research Squad:
> **Time-box (default):** Fan-out phase: 1 deliberation round per agent. Fan-in phase: 1 synthesis pass. If convergence not reached, Facilitator issues a CONTESTED finding with all positions documented. Total: bounded by 2 rounds, not unlimited.

Engineering Squad:
> **Time-box (default):** Plan phase: 1 pass. Implement phase: one iteration per requirement. Test phase: results within 1 round. Stop signals block advancement; they do not extend deliberation indefinitely. If a stop signal cannot be resolved in 1 additional round, it escalates to human gate.

Review Squad:
> **Time-box (default):** Independent review: 1 pass per reviewer, no extensions. Synthesis: 1 pass by Coordinator. Disagreements between reviewers are documented as CONTESTED, not re-debated.

---

## Section 8: Communication Standards

### What Improved

BLUF is the correct standard, and it was not in v1. Every message leading with action required and urgency — this is how military communications have worked since the invention of the telegram. The example anti-pattern ("I looked at the files and found several interesting things. First, let me explain the context...") is precisely the failure mode I have observed in junior officers who confuse comprehensiveness with communication. The section names it and rejects it. Good.

SBAR for handoffs is a direct implementation of what I asked for, and it is correctly scoped. SBAR originated in naval aviation and was adopted by healthcare for exactly the same reason: when you hand off a situation to another person, you cannot hand them your entire context. You hand them the minimum they need to act. The four fields — Situation, Background, Assessment, Recommendation — are the right four fields.

The Priority Levels table (P0 through P3) is operationally sound. P0 interrupts current work. P3 is logged but not delivered. This mirrors the combat information management hierarchy aboard a carrier — not every contact on the radar requires the bridge's attention. What I find particularly correct is that P3 is "logged, not delivered." Most multi-agent communication designs make everything visible to everyone, which is how you get agents paralyzed by information they were never meant to act on.

The Structured Disagreement Format (the stop_signal block) operationalizes what Dr. Seeley argued for at the roundtable — a targeted inhibition mechanism that challenges claims, not agents. The severity field (CRITICAL blocks, WARNING logs, INFO notes) is the right mechanism. This is more sophisticated than v1, which had no formal disagreement vocabulary.

### Remaining Concerns

**First: BLUF is described but not enforced.**

The standard says "every inter-agent message follows this structure" but nothing in the plan specifies *how* this is enforced. In a naval command, a watch officer who files an unstructured report does not get told "that was a good try, please use BLUF next time." The report is returned. The officer re-files. The standard is non-negotiable because the enforcement is immediate and certain.

In this system, who returns the malformed message? The Orchestrator? A linting step? An automated reviewer? If the answer is "the receiving agent is expected to request clarification," that is a soft norm, not a hard standard. Soft norms degrade under load — exactly when clear communication matters most.

The plan should specify: **who enforces BLUF, by what mechanism, and what happens when it is violated.** If the answer is "the Facilitator persona includes a brief to reject unstructured messages," that is acceptable — but it needs to be stated.

**Second: The Synthesis Protocol assumes a single Facilitator who has read everything.**

The six-step Synthesis Protocol — Consensus, Majority, Contested, Gaps, Recommendation, Crystallization — is correct in structure. But it assumes the Facilitator has complete visibility into all agents' findings and can assess convergence and disagreement accurately.

In a complex multi-round mission, findings accumulate in the blackboard over time. A Facilitator synthesizing after three rounds of parallel research has to track not just current positions but how positions have evolved. Without version tracking on agent findings — "Researcher A held position X in round 1 but revised to position Y in round 2 after seeing the blackboard" — the Facilitator's CONTESTED section may mis-represent the degree of actual disagreement.

This is not a communication standard problem alone — it intersects with Section 5 (Memory Architecture). But Section 8 should explicitly note: **synthesis requires a versioned record of agent positions, not just their final states.** A Facilitator who synthesizes from final-state-only findings is producing a photograph, not a film. The photograph may look like consensus where the film shows genuine convergence — or it may look like consensus where the film shows one agent capitulating under social pressure.

**Third: P2-IMPORTANT is underspecified.**

P0 is clear: it interrupts. P1 is clear: it gets processed next. P3 is clear: it is logged and not delivered. P2 — "affects quality but not blocking, batched at sync point" — raises an unanswered question: *when is the sync point?*

If there is no defined sync point rhythm, P2 messages can accumulate indefinitely. An agent doing a two-hour implementation task may generate a dozen P2 messages that no one reads until the task is done — at which point some of them may have been decision-relevant information that arrived too late to affect the outcome. This is the intelligence-sharing problem McChrystal identified in Iraq: the information existed, but the sharing rhythm was too slow to be operationally useful.

The fix is simple: each squad template (Section 4) should specify its sync point rhythm — when P2 messages are reviewed. For a Research Squad doing parallel fan-out, the sync point is the fan-in. For an Engineering Squad doing sequential phases, the sync point is the phase gate. This connects Section 8 to Section 4 and makes the priority system operational rather than theoretical.

**Fourth: No standard for message failure or no-response.**

The plan specifies what happens when messages are received. It does not specify what happens when they are not. What does an agent do when it sends a P1-BLOCKING message and receives no response? How long does it wait? Who does it escalate to?

In naval operations, every message requiring a response has an "action by" time. If no response is received by that time, the originator escalates one level. This prevents situations where a blocking issue sits unacknowledged because the receiving agent is occupied, failed silently, or is simply not programmed to respond to that message type.

The plan should add a **timeout protocol** to the Priority Levels table: P0 — immediate response required, escalates in [X] if not acknowledged. P1 — response within [Y], escalates to human if unacknowledged. P2 — reviewed at next sync point. P3 — no response expected.

### Specific Edits

**Edit 1: Add enforcement mechanism to the BLUF section**

After the BLUF format block and anti-pattern example, add:

> **Enforcement:** BLUF is not a suggestion — it is a format contract. The Facilitator persona includes an explicit brief to (a) return unstructured messages to the sender with the instruction to reformat, and (b) log the non-compliance as a P2-IMPORTANT event for the post-mission retrospective. Agents that consistently produce unstructured messages are flagged in the Crystallization phase as a system quality issue, not an individual issue.

**Edit 2: Add version-tracking requirement to Synthesis Protocol**

After the Synthesis Protocol six-step block, add:

> **Important:** Synthesis is only valid if the Facilitator has access to **versioned agent positions**, not just final states. If an agent revised its position during the mission, the synthesis must distinguish between (a) genuine convergence — independent agents reaching the same conclusion — and (b) apparent convergence — agents updating toward a dominant position under blackboard influence. Document which type occurred. Where uncertain, report CONTESTED, not CONSENSUS.

**Edit 3: Add sync point definition to Priority Levels table**

Expand the P2 row:

| Level | Meaning | Delivery | Sync Point |
|-------|---------|----------|------------|
| P2-IMPORTANT | Affects quality but not blocking | Batched at sync point | Sync point = phase gate for Engineering Squad; fan-in for Research Squad; post-independent-review for Review Squad. Each squad template defines its own sync point. If squad type is unknown, sync point defaults to every 30 minutes of active operation. |

**Edit 4: Add timeout protocol to Priority Levels table**

Add a "Timeout / Escalation" column:

| Level | Timeout | Escalation |
|-------|---------|------------|
| P0-EMERGENCY | Immediate acknowledgment required | If no acknowledgment in 1 round: escalate to human gate |
| P1-BLOCKING | Response required before sender proceeds | If no response after sender raises P1 twice: escalate to Facilitator, then to human gate |
| P2-IMPORTANT | Reviewed at sync point | If sync point passes without review: promote to P1 |
| P3-INFO | No response expected | No escalation |

---

## Final Remarks

The v2 plan is substantially better than v1. The terrain-analysis model, the Commander's Intent examples, and the BLUF / SBAR communication standards represent genuine integration of the roundtable's recommendations — not cosmetic changes. The designers understood the principles, not just the surface requests.

What remains unfinished is the gap between doctrine and enforcement. Good doctrine that is not enforced is a wish list. A ship with an excellent operations order that no one follows is still a ship that will miss its time-on-target. The plan needs to close the loop: where standards exist, specify who enforces them and by what mechanism. Where time is a factor, specify the forcing function. Where roles are combined, separate them.

This system will be tested by real missions under real pressure. The protocols that survive that pressure will be the ones that are already embedded in the agents' operating instructions — not the ones that exist only in this document. I have said this before, and I will say it until it is done: **embed the doctrine in the persona DNA.** The document is the blueprint. The persona is the sailor.

*— Admiral James Hartwell, US Navy (Ret.)*
