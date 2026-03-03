# Ward Cunningham (Special Guest) — Feedback on v2

## Invited By
Dr. Reiko Nakamura and Maya Chen — for expertise in digital stigmergy (wikis),
pattern languages, and the principle of the simplest thing that works.

---

## Section 5: Memory & Knowledge Architecture

### What Resonates

The opening line of Section 5 — *"Agents coordinate primarily by reading and writing
to this environment — stigmergy over direct messaging"* — is the most important
sentence in the entire plan. Get this right and a great deal else follows naturally.
Get it wrong and no amount of clever messaging protocol will save you.

I know this because I built the wiki in 1995. The wiki is stigmergy. A page is a
pheromone pellet. Someone writes it. Someone else encounters it. That encounter
triggers their next action. The wiki worked not because it had a sophisticated
communication protocol but because it made the shared environment writable by anyone,
at any time, with almost no friction. The plan's shared workspace — especially the
blackboard — is a wiki. That is a compliment of the highest order.

**The blackboard structure is well-designed.** Commander's Intent, Current State,
Findings, Stop Signals, Decisions, Open Questions — this is exactly the shape of a
useful wiki page. Each section has a clear purpose. Any agent (or human) can land on
it cold and orient themselves. This is progressive disclosure through structure, not
through access control.

**The Knowledge Crystallization Spiral is correctly identified as the system's
long-term value.** Klaus Weber said it needs more than 8 lines and the v2 has
responded. The four-step protocol (Harvest, Pattern, Promote, Codify) maps almost
exactly to what happens in a healthy wiki: individual edits accumulate, a pattern
becomes recognizable, someone writes a summary page, eventually the summary becomes
policy. Wikis that don't have this spiral die — they fill up with stale pages and no
one trusts them.

**The events.jsonl example is instructive.** The concrete example showing a
finding, a stop signal, and a quorum-based decision in sequence — that is the best
kind of documentation. It shows the system behaving, not just describes what it
should do. More of this.

### What's Missing

**The hardest problem in wiki design — and in any stigmergic system — is staleness.**

A wiki page that is six months old and wrong is worse than no page at all. The
blackboard has no indication of how old any entry is. The findings section says
"agents append findings here with attribution and confidence" — but not with a
timestamp. An agent reading the blackboard three hours into a mission cannot tell
whether the findings from the morning are still valid.

In Ward's C2 (Cunningham & Cunningham) WikiWikiWeb, the page history was the answer.
Any page showed who edited it and when. The recency was visible at a glance. The
plan has `events.jsonl` for this purpose, but the blackboard itself — the thing agents
actually read — has no visible temporality.

**The projection layer is underdeveloped.** The `projections/` directory is named
and the `status-summary.md` and `agent-activity.md` files are listed, but there is no
description of what they contain or when they are generated. In wiki terms, these are
the "portal pages" — the high-traffic landing pages that aggregate the important stuff.
If projections aren't useful, agents won't read them. If agents don't read them, the
blackboard becomes the only source and agents will talk past each other.

**The pattern language is incomplete.** The plan borrows the word "patterns" from
Alexander's pattern language (and from Gamma, Helm, Johnson, Vlissides — who borrowed
it from Alexander), but doesn't use the form. Alexander's pattern form is: context,
problem, solution, consequences. The Knowledge Crystallization Spiral promotes
observations to "patterns" (Step 2) but a pattern is just named, not structured. A
candidate pattern in auto-memory should follow the form:

```
## {Pattern Name}

**Context:** When does this arise?
**Problem:** What tension is this resolving?
**Solution:** What does the pattern prescribe?
**Consequences:** What does this enable? What does it foreclose?
```

Without structure, "patterns" are just observations with names. With the form, they
become reusable design knowledge — something you can look up, apply, and improve.

**The retrospective output file is specified but not templated.** The plan says the
Crystallization Protocol produces `{mission-name}-retro.md` but doesn't say what that
file contains. This is the key handoff between missions — what one team learned that
the next team should know. In wiki terms, it's the most important page in the system.
It deserves a template as carefully designed as the blackboard.

**Ward's specific concern: the write friction is not addressed.** The wiki succeeded
because the cost of editing was near zero. The cost of appending a finding to the
blackboard, issuing a stop signal, or logging an observation needs to be similarly low.
If agents must format YAML stop signals correctly, parse JSONL, and update markdown
files without a clear affordance for each action, the system will degrade — agents will
put things in their context window instead of the shared workspace, and the stigmergy
breaks down. The plan needs to specify — at minimum — example write operations for
each type of blackboard update. Not what the schema is. What the agent actually writes.

### Specific Edits

**Edit 1: Add timestamps to the Findings section of the blackboard template.**

Replace:
```markdown
## Findings
[Agents append findings here with attribution and confidence]
```

With:
```markdown
## Findings
[Agents append findings here. Format: `- [HH:MM] {agent}: {finding} (confidence: {0.0-1.0}) (source: {url/file})`]
[Older findings are not deleted — they are marked SUPERSEDED if contradicted]
```

**Edit 2: Add a retrospective file template to Section 5.**

After the Crystallization Protocol block, add:

```markdown
#### Retrospective File Template

`.claude/hive/memory/retrospectives/{mission-name}-retro.md`

```markdown
# Retrospective: {mission-name}

**Mission date:** {date}
**Squad:** {agent names and roles}
**Mission outcome:** {succeeded | partial | failed}

## What We Found
[Key findings from this mission — the 3-5 things future teams should know]

## What Surprised Us
[Findings that contradicted prior assumptions or patterns]

## Candidate Patterns
[Observations that appeared 3+ times. Use the pattern form:]

### {Candidate Pattern Name}
**Context:** ...
**Problem:** ...
**Solution:** ...
**Consequences:** ...

## What Failed
[What didn't work — tools, assumptions, protocols. Not blame. Learning.]

## Proposed Rule Changes
[Draft CLAUDE.md amendments or protocol updates, if thresholds reached]
```
```

**Edit 3: Add a brief description of each projection file.**

After the four-pattern table, add:

```markdown
#### Projection Descriptions

| File | Updated When | Contents |
|------|-------------|----------|
| `status-summary.md` | After each agent completes a task | Current mission state: what's done, what's in progress, what's blocked |
| `agent-activity.md` | Continuous | Last action per agent, with timestamp — the "who is doing what" view |

These are generated summaries, not authoritative records. The event log is the
source of truth. Projections exist to reduce the cost of orientation — an agent
starting a new task should read the projection, not replay the event log.
```

---

## Section 8: Communication Standards

### What Resonates

**BLUF is correct and the anti-pattern example nails it.** The pattern of leading
with context before the point is the single most common failure mode in written
communication — and in agent-to-agent messaging. I approve of the stern formatting.
The anti-pattern deserves to be there. Keep it.

**The Synthesis Protocol at the end of the section is quietly excellent.** The six
steps — Consensus, Majority, Contested, Gaps, Recommendation, Crystallization — are
the shape of good synthesis. The inclusion of "Contested: where agents disagree
(include all positions + reasoning)" is important. Most synthesis formats sweep
disagreement under the rug. This one preserves it.

**The stop_signal YAML structure is well-conceived.** Having a typed, structured
format for disagreement — with a `type` field that distinguishes evidence_gap from
logical_flaw from alternative_explanation — prevents disagreement from becoming
personal or diffuse. This is the pattern-language instinct applied to conflict:
name the form, and the form becomes navigable.

### What's Missing

**The section treats communication as a one-way push.** Every structure here —
BLUF, SBAR, stop signals, synthesis — is about *sending* a message correctly.
But in a stigmergic system, the most important communication act is *reading the
shared workspace.* The wiki didn't have a messaging protocol. It had an orientation
protocol: when you arrive at a page, read the history, check recency, see what's
contested, then edit. The plan has no equivalent for how an agent should *read*
before acting.

This is not a small gap. In the wiki, most damage was done by people who didn't
read before writing. They duplicated content, they contradicted standing decisions,
they re-opened closed questions. The same failure modes will appear here.

**There is no acknowledgment protocol.** BLUF tells you how to send a message.
But the recipient needs to signal that they received it, understood it, and are
acting on it — or choosing not to. Without acknowledgment, the sender doesn't know
if the message landed. In asynchronous distributed systems (which is what this is),
this produces duplicated effort and missed dependencies. It doesn't need to be
elaborate — even a one-line "acknowledged, incorporating" or "acknowledged, stop
signal issued" would close the loop.

**The Synthesis Protocol belongs with Section 5, not Section 8.** The sixth step
of synthesis — "Crystallization: patterns observed for post-mission retrospective"
— links directly to the Knowledge Crystallization Spiral. Separating them into
different sections means an agent implementing synthesis might miss its connection
to the learning spiral. These two protocols should be co-located or cross-referenced
explicitly.

**The SBAR format is borrowed from healthcare without examining the fit.**
SBAR (Situation, Background, Assessment, Recommendation) was designed for nurse-to-
doctor verbal handoffs in high-stakes real-time environments. In those settings,
brevity and sequence matter because attention is scarce and the clock is running.
In an agent handoff, the clock is less urgent and the "recipient" can re-read.
The plan should ask: is SBAR the right pattern, or is it just a familiar one?
My suggestion: use SBAR where it fits (urgent real-time escalations) but for
planned handoffs between missions, use the retrospective file template, which is
richer and more durable.

**Ward's specific concern: the communication standards don't mention the wiki
principle of Refactoring Over Archiving.** In wiki design, when a page becomes
long and hard to navigate, you don't archive it — you refactor it into smaller
pages with clearer purposes and link them. The plan's blackboard has no guidance
for what happens when it becomes unwieldy (long missions, many findings, many stop
signals). The answer is not pagination — it is refactoring. Sections that are
resolved should be moved to a separate "Resolved" section with a summary link.
Open questions that become sub-missions should get their own blackboard. The plan
needs a refactoring norm.

### Specific Edits

**Edit 1: Add an Orientation Protocol at the start of Section 8.**

Before BLUF, add:

```markdown
### Orientation Protocol (Before Sending Anything)

Before any agent takes action or sends a message, it must read:
1. The mission blackboard (current state + open questions)
2. The latest `projections/status-summary.md` (what's in progress)
3. Any stop signals issued in the last N minutes (to avoid acting on challenged claims)

**This is the wiki rule applied to agents:** read before you write. An agent that
acts without orientation will duplicate work, contradict standing decisions, or
re-open closed questions.
```

**Edit 2: Add acknowledgment to the Priority Levels table.**

Extend the table:

| Level | Meaning | Delivery | Expected Response |
|-------|---------|----------|------------------|
| P0-EMERGENCY | Safety/security, immediate action | Interrupts current work | Immediate: action or escalation |
| P1-BLOCKING | Cannot proceed without response | Processed next | Acknowledge within current task completion |
| P2-IMPORTANT | Affects quality but not blocking | Batched at sync point | Acknowledge at sync point |
| P3-INFO | FYI, no action needed | Logged, not delivered | No response required — logged in event stream |

**Edit 3: Add a cross-reference from Synthesis Protocol to the Crystallization Spiral.**

After the Synthesis Protocol block, add:

```
NOTE: Step 6 (Crystallization) feeds directly into the Knowledge Crystallization
Spiral (Section 5). The patterns observed during synthesis are the input to
STEP 2 (PATTERN) of the post-mission retrospective. These two protocols are
part of a single learning loop — see Section 5 for the full spiral.
```

**Edit 4: Add a blackboard refactoring norm.**

After the Synthesis Protocol, add a new subsection:

```markdown
### Blackboard Hygiene (Refactoring Norm)

A blackboard that is too long to read is worse than no blackboard. When a mission
blackboard exceeds ~100 lines or a section becomes unwieldy:

- Move **resolved findings** to a `## Resolved` section at the bottom with a
  one-line summary in the main Findings section.
- Move **closed questions** from Open Questions to a `## Closed Questions` section
  with the resolution noted.
- If a sub-question grows into a sub-mission, create a new blackboard for it and
  link from the parent.

Do not archive. Do not delete. Refactor — like a wiki page that has grown
beyond its original scope.
```

---

## Cross-Cutting Observation

There is something the roundtable didn't name that I want to put on the table.

**The plan is building an encyclopedia. What it needs is a wiki.**

An encyclopedia is written by experts, reviewed by editors, and published when
complete. A wiki is written by participants, improved continuously, and never
finished. The plan's Knowledge Crystallization Spiral is the wiki instinct. The
retrospective file is the wiki instinct. But the overall architecture — six protocol
documents, a YAML schema, a detailed governance section — feels like encyclopedia
thinking: design it thoroughly, then implement.

In XP (Extreme Programming), we called the alternative *Evolutionary Design.*
You don't design the whole system up front. You design the smallest thing that
could possibly work, run it, let it fail interestingly, and refactor based on what
you learn. The failure modes are your best design input — but only if you run the
system and observe them, rather than trying to anticipate them.

My specific recommendation: **implement the Anthill with just the blackboard and the
crystallization spiral.** Nothing else. Run five missions. Read the retrospectives.
You will discover which communication patterns you actually need — BLUF or something
else, SBAR or something else. The patterns that emerge from real usage will be
better than the patterns designed in advance.

The plan cites Commandment 10: *"Start with 3, prove you need more."* Apply this
to the communication standards and memory architecture too. Start with 1 — the
blackboard. Prove you need more before building it.

**The wiki taught me this lesson once.** When I built WikiWikiWeb, I had a list of
features I planned to add. Almost none of them were necessary. The refactoring
capability, the page history, the search — these emerged from watching what people
actually needed when they used it. The features I planned in advance and the features
the community needed were almost entirely different lists.

Run the Anthill. Read its retrospectives. Then refine the plan.

That is the simplest thing that could possibly work. And in my experience, it is
usually the best thing too.
