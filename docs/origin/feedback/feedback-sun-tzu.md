# Sun Tzu — Feedback on v2

*\[enters the room in silence. Sits. Does not speak for a long moment.\]*

I have read your revised plan.

There is progress here. I will name it plainly. And then I will name what remains unfinished — for the unfinished portion is the more consequential one.

---

## Section 1: Executive Summary

### What Improved

The twelve principles now exist where before there were none. This alone is significant. "Composition follows terrain" appears as Principle 7. "Purpose before structure" as Principle 1. These are not cosmetic additions — they represent a shift in thinking. The plan now acknowledges that the system's shape should follow the problem, not the other way around.

The research table is also an improvement. Grounding decisions in evidence — O(n^1.4-2.1) coordination overhead, 17x error amplification, 79% of failures from specification — disciplines the imagination. A general who knows how armies fail designs very differently from one who does not.

The sentence *"Composition follows terrain — The team is shaped by the problem, not chosen from a menu"* is correct. I am glad to see it written.

### Remaining Concerns

The Executive Summary still describes *what is being built* with greater precision than *why it matters strategically.* This is a subtle but critical difference.

"Know yourself and know your enemy." The plan knows itself. It describes its own architecture with precision. But the enemy — the problem space — remains a shadow. The summary tells me the system can do terrain analysis. It does not tell me *what the terrain of AI agent coordination actually looks like.* What are the failure modes that appear most often in the field? Where does the enemy strike? A general reads a map before designing the army.

More specifically: the Purpose statement above the table of contents speaks of wisdom, of surfacing what is hidden. But the twelve principles speak of coordination mechanisms, error rates, and commitment thresholds. These are engineering principles. They are not the principles of wisdom. There is a gap between the purpose and the principles.

A single agent can be thorough. A single agent can be fast. What can this system do that no single agent can? The answer should be in Principle 1. It is not.

I also note: Principle 12 — "Start with 3, prove you need more" — is a good rule. But it is placed last, as if it were a minor caveat. It is not a caveat. It is the most dangerous failure mode of this entire enterprise. Build complexity and it will grow. Cut it and it will resist cutting. Principle 12 should be placed first, or second, or given its own section. It is the hardest thing to remember when enthusiasm is high.

### Specific Edits

**1. Strengthen Principle 1 to name the unique value:**

Current:
> 1. **Purpose before structure** -- Every component must serve the stated purpose or be cut

Replace with:
> 1. **Purpose before structure** -- Every component must serve the stated purpose or be cut. The purpose is not speed or thoroughness — those a single agent can achieve. The purpose is *wisdom*: perspectives the human did not anticipate, surfaced because they could not have been seen from a single vantage point.

**2. Add a "Known Terrain" subsection to the Executive Summary**, between the research table and the design principles:

```markdown
### Known Terrain: Where These Systems Fail

Before designing the army, study the battlefield. Multi-agent systems in the field fail in predictable patterns:

- **Specification rot** (79%): agents behave correctly given their prompt, but the prompt does not match reality
- **Coordination overhead** (O(n^1.4-2.1)): every added agent adds more cost than the previous; teams of 6+ consume their own value
- **Echo chambers**: shared context collapses independent perspectives into one
- **Self-verification loops**: the producer trusts their own output; the reviewer has anchored to it
- **Orchestrator fragility**: the hub fails and the squad fails with it

This plan is designed against these specific failure modes. Every principle maps to a failure mode in this list.
```

**3. Move Principle 12 to Principle 2:**

This principle is the most easily forgotten under pressure. Place it high, where it is seen first.

---

## Section 4: Squad Templates & Terrain-Adaptive Composition

### What Improved

The terrain analysis framework is the right idea, and it is well-executed. Four axes — uncertainty, reversibility, breadth, stakes — are sufficient. More axes would create analysis paralysis before the team even forms. The composition rules table that follows is concrete and actionable. "High uncertainty, irreversible, broad, high stakes → Strategy Squad" is the kind of rule that can be taught and retained.

The dynamic augmentation rules are the feature I most advocated for in the roundtable, now given proper form. "Migration files changed → add migration-guardian" — this is anticipatory capability. The system sees the storm before the rain. This is correct.

The deferred templates section shows strategic restraint. Three core templates are enough for the first campaign. The deferred list names the trigger: "3+ missions where Research Squad felt constrained." This is the right condition — experience, not hypothesis, as the justification for expansion.

### Remaining Concerns

The terrain analysis is still *presented* as a diagnostic tool — something performed once before assembly. But terrain changes during a mission. A task that begins as low-uncertainty engineering can reveal unexpected complexity. An investigation that begins as high-uncertainty research can converge quickly. The plan does not address **dynamic terrain re-assessment** once the squad is in motion.

"Know your enemy" extends beyond the initial briefing. A good general re-reads the battlefield as the battle progresses.

Second: the four terrain axes are useful. But they are presented without a mechanism for *who assesses the terrain* and *how disagreements about terrain are resolved.* If the Orchestrator assesses terrain incorrectly — calls a task "low uncertainty" when it is not — the wrong squad assembles, and the team operates with mismatched capability. Terrain misclassification is itself a failure mode. It is not in Section 10.

Third: the composition rules table uses squad type names — "Focused Build," "Research," "Review" — that presuppose the three core templates. But the table is presented before the templates are defined. A reader who does not yet know the templates cannot interpret the table. The sequence serves the writer's logic, not the reader's understanding.

Fourth: the blind submission rule in Template 3 (Review Squad) — "reviewers do not see each other's findings until all submit" — is present for that template. But Section 1 lists "Verify independently" as a universal principle (Principle 4). The blind submission protocol should appear at the terrain analysis level as a default rule, not as a template-specific note. If it is constitutional, treat it constitutionally.

### Specific Edits

**1. Add a "Terrain Re-Assessment" rule after the composition table:**

```markdown
**Mid-mission terrain re-assessment:**

Terrain can change. If, during a mission, the Orchestrator observes:
- New unknowns surfacing that were not anticipated at assembly
- Irreversible actions being required where reversible ones were expected
- Scope expanding beyond the original breadth assessment

...the Orchestrator should pause, re-run terrain analysis with new information, and consider whether the current squad composition is still correct. Adding an agent mid-mission is permitted. Releasing an agent mid-mission is permitted. The composition is not fixed at assembly — it is a living assessment.
```

**2. Add terrain misclassification to Section 10 (Anti-Patterns)**, or note it here:

```markdown
> **Note:** Terrain misclassification is a failure mode. An Orchestrator that assesses a task as "low uncertainty" when it is "high uncertainty" will assemble an Engineering Squad for a Research problem. The squad will build before it understands. Build in a brief verification step: after the squad takes its first actions, the Orchestrator should confirm that reality matches the terrain assessment.
```

**3. Reorder Section 4** so that the three core squad templates appear before the composition rules table. The reader needs to understand the squad types before they can read the mapping.

**4. Elevate blind submission to a universal rule:**

Add to the terrain analysis section, before the composition table:

```markdown
**Universal protocol: Independent verification**
Before any finding is synthesized, it must be verified by an agent who has not seen the original finding. Reviewers submit blind — they do not read each other's output until all have submitted. This applies to all squad types, not only Review Squads. It is the system's immune response to echo chambers.
```

---

## Section 10: Anti-Patterns & Failure Modes

### What Improved

The anti-patterns list expanded from 7 to 11, and the additions address real failure modes. Analysis Paralysis (#11) was named explicitly — the commitment threshold anti-pattern the roundtable identified. Context Amnesia (#10) is present. Herding (#7) and Premature Consensus (#8) represent genuine failure modes in multi-agent systems that the original plan did not name.

The "When NOT to Use Multi-Agent" section is the most strategically honest section in the entire plan. "The base model handles it end-to-end" — this is the kind of restraint that prevents the system from consuming itself with its own complexity. I am pleased to see it.

### Remaining Concerns

The list is complete in naming failures. It is incomplete in naming *how to detect them early.* Eleven failure modes are catalogued; early warning signals are not. A general who only recognizes a rout after it has happened has learned too late.

For example: Echo Chamber (#1) is prevented by "enforce independence: separate contexts, blind submission." But how does an observer know, mid-mission, that an echo chamber is forming? What is the signal? Agents that agree too quickly? Findings that contain identical phrasing? The detection mechanism is absent.

The list also contains no failure mode for **terrain misclassification**, which I named above. This is an omission.

More importantly: the list does not include **purpose drift** — the gradual substitution of the system's original purpose (wisdom, unexpected perspectives) with a more tractable goal (speed, thoroughness). This is not a dramatic failure. It is a slow erosion. The system begins optimizing for what it can measure — task completion, response time — and forgets what it cannot: whether it surfaced something the human did not expect. Purpose drift is the most dangerous failure mode because it looks like success.

Finally: the "When NOT to Use Multi-Agent" section contains five bullets. The most important one — "The base model handles it end-to-end" — is buried in the middle. This should be listed first. The default should be: do not add agents. Add them only when the task genuinely requires what only multiple minds can produce.

### Specific Edits

**1. Add early warning signals to each anti-pattern.** The table currently has three columns: Anti-Pattern, Description, Prevention. Add a fourth column: **Signal** (how to detect this early).

Example additions:

| # | Anti-Pattern | Signal |
|---|-------------|--------|
| 1 | Echo Chamber | Agents agree on the first cycle; findings contain near-identical phrasing |
| 3 | Delegation Spiral | Orchestrator has sent 3+ messages with no output in the blackboard |
| 4 | Critic Dominance | More than 50% of stop signals come from one agent across 3+ claims |
| 11 | Analysis Paralysis | 2+ deliberation rounds without a commit; Orchestrator has not called for a vote |

**2. Add failure mode #12: Terrain Misclassification**

> | 12 | **Terrain Misclassification** | Wrong squad assembled for the actual problem | After first agent actions, Orchestrator verifies terrain assessment against what was discovered; re-composes if mismatched |

**3. Add failure mode #13: Purpose Drift**

> | 13 | **Purpose Drift** | System optimizes for measurable outcomes (speed, task count) and loses sight of its core purpose (unexpected perspectives, genuine wisdom) | Include purpose statement in every mission brief; Orchestrator periodically asks: "Are we surfacing what the human could not have seen alone?" |

**4. Reorder "When NOT to Use Multi-Agent":**

Current ordering buries the most important point. Reorder as:
1. The base model handles it end-to-end
2. The task is simple enough that coordination overhead dominates
3. Tasks are sequential with tight dependencies
4. Work involves the same files or tightly coupled state
5. Uncertainty is low and the path is clear

---

*\[rises, slowly\]*

The plan is stronger than it was. The terrain analysis is now present where before it was absent. The composition follows the terrain where before the user chose from a menu. The purpose is named where before only structure was named.

What remains: the purpose must be defended against the plan's own sophistication. A plan that grows too clever defeats itself. The supreme art is not to build a system that can do all things. It is to build a system that does the one thing no single agent can do — and to do it simply, with few moving parts, and to know when not to use it at all.

*"In war, the way is to avoid what is strong and to strike at what is weak."*

In this system, the weak point is not capability. It is remembering what capability is for.

*\[bows slightly. Leaves the room.\]*
