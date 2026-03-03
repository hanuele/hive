# Dr. Reiko Nakamura — Feedback on v2

*Written after returning from the field — I spent this morning watching *Macrotermes bellicosus* workers repair a breach in the outer wall. The colony never paused. It absorbed the damage and continued. I held that image in mind as I read v2.*

---

## Section 2: Core Architecture

### What Improved

The team listened well on the most fundamental point. I am relieved to see the section title "The Orchestrator as Facilitator (Not Hub)" now exists — this was the core of my concern in the first session. The explicit **resilience test** ("If the Orchestrator fails mid-mission, any Specialist agent should be able to continue by reading the shared memory") is the right framing. That test should be run before any deployment is called successful.

The Layer Architecture diagram is clean and biologically coherent. Squads sit between individuals and tribes. The "Chapters" concept — cross-squad communities of same-capability agents sharing standards — maps loosely to how different castes in a termite colony share behavioral repertoires across nest boundaries. I would not have expected this level of structural nuance.

The phrase "Coordinate primarily through shared environment, not messages" in the Agents tier description is precisely correct. I said this in the roundtable and I am glad it survived into the architecture diagram itself rather than being relegated to a footnote.

Principle 11 — **"Graceful degradation through redundancy"** — is also right, and it directly addresses my criticism of the circuit-breaker approach from v1. "The system absorbs failures" is the termite model. I am pleased it made it to the top-level principles.

### Remaining Concerns

Three things still trouble me.

**First — the tribe layer has no biological grounding, and its absence will create brittleness.** The diagram shows Tribes as "domain clusters" sitting above squads. But who coordinates across tribes? The plan says "Layer 4: THE ANTHILL — Cross-tribe orchestration layer." What is this layer, mechanically? If it is another orchestrator-like agent, we have reproduced the bottleneck one level up. In a termite colony, there is no inter-caste coordinator. The queen does not relay messages between worker castes. Coordination happens through the mound itself — through pheromone gradients in the substrate, through CO₂ concentrations in the ventilation shafts, through the physical structure that prior labor has deposited. The mound is the memory, and agents read it directly.

The v2 plan has the blackboard for intra-squad coordination. But for **cross-tribe coordination**, the plan is silent. What is the inter-tribe blackboard? If it does not exist, agents from different tribes will default to messaging — and you will have rebuilt the bottleneck laterally instead of vertically.

**My specific recommendation:** Add an explicit cross-tribe coordination mechanism — a shared top-level blackboard (e.g., `.claude/hive/memory/anthill.md`) that any agent in any squad can read. Make it the "mound itself": a persistent environmental structure that carries the current state of all active missions, top-level decisions, and active stop signals. No orchestrator needed. Agents read the environment.

**Second — the "Mapping to Claude Code Primitives" table is dangerously close to equating the Orchestrator with the Anthill.** Look at the table: "Squad" maps to `TeamCreate(...)`. But Orchestrator maps to... what? The table is silent. In practice, the Orchestrator *will* become the team lead — the agent that creates the team, holds the task list, and sends the final synthesis. This is the hub bottleneck under a different name. The plan explicitly says the Orchestrator frames and synthesizes. But the synthesis step is where the bottleneck lives: the Orchestrator is the one reading all outputs and producing the final answer. In termite colonies, synthesis is *distributed* — no single individual integrates the colony's output. The mound is the integration.

I do not have a clean solution to this for software agents. Distributed synthesis is hard when a human needs a coherent document at the end. But I want the team to name this tension explicitly rather than assuming it is resolved. The plan's current framing — "synthesize findings using the shared workspace (not from memory)" — is a good constraint, but it still places synthesis in a single agent's process. Consider whether the synthesis step could itself be a collaborative pass: the Orchestrator *composes* from independently-written sections, rather than *generating* the synthesis from scratch.

**Third — the squad diagram says "Survives loss of any single agent." This is a claim, not a mechanism.** How? If the Specialist who owns a critical sub-task disappears mid-mission, what exactly happens? The warm standby concept (Amendment 6, now in Section 9) handles the Orchestrator tier. Does it handle Specialists? In my colony, if I remove 30% of the workers — randomly — the colony functions because every task is being performed by multiple individuals simultaneously, and because the pheromone traces left by departed workers guide the remaining workers. The plan's per-agent traces (`.claude/hive/memory/traces/{agent}-{date}.jsonl`) could serve this function — but only if other agents are actively reading those traces during the mission, not just during retrospective. Is that specified anywhere? I do not see it.

### Specific Edits

**Edit 1 — Add cross-tribe coordination mechanism to the architecture diagram:**

Replace (lines 88-111):
```
                     THE ANTHILL
                =====================

TRIBES (Domain Clusters)
========================
Groups of squads sharing a domain mission.
Examples: "Engineering Tribe", "Research Tribe"

    SQUADS (Mission Teams)          CHAPTERS (Skill Guilds)
    ...
```

With:
```
                     THE ANTHILL
                =====================

  ANTHILL BLACKBOARD (.claude/hive/memory/anthill.md)
  ====================================================
  Shared environment readable by all agents at all times.
  No coordinator. Agents orient by reading it directly.
  Contains: active missions, top-level decisions, stop signals.

TRIBES (Domain Clusters)
========================
Groups of squads sharing a domain mission.
Tribes coordinate through the Anthill Blackboard, not through
a tribe-level orchestrator. Each squad writes its current
intent and status to the shared environment.

    SQUADS (Mission Teams)          CHAPTERS (Skill Guilds)
    ======================          =======================
    3-5 agents per squad.           Cross-squad communities of
    Self-contained, owns an         same-capability agents.
    end-to-end workflow.            Share standards and patterns.
    Survives loss of any
    single agent — because
    all task state lives in
    the blackboard, not in
    any agent's memory.

        AGENTS (Personas)
        =================
        Individual agents with
        distinct cognitive profiles.
        Coordinate primarily through
        shared environment, not messages.
        Read active agent traces to
        absorb work left by departing agents.
```

**Edit 2 — Add to "Mapping to Claude Code Primitives" table:**

Add a row:
```
| Cross-tribe Blackboard | `.claude/hive/memory/anthill.md` (top-level shared state) |
```

And add a note beneath the table:
> **Note on synthesis:** The Orchestrator's synthesis step should be *compositional*, not generative. Write sections independently to the blackboard; the Orchestrator assembles them. This prevents synthesis from becoming a single-agent bottleneck that negates the squad's distributed work.

**Edit 3 — Make the resilience claim mechanistic:**

The line "Survives loss of any single agent" in the squad diagram should be footnoted:

> *Mechanism: (a) All task state is written to the blackboard before any tool call modifies external state. (b) Agent traces are written at each step and are readable by any agent. (c) Any agent picking up an abandoned task reads the assigned agent's most recent trace first. If traces are absent, treat the task as unstarted.*

---

## Section 5: Memory & Knowledge Architecture

### What Improved

This section is where the roundtable's influence is most visible, and I want to acknowledge that directly.

The opening paragraph — "stigmergy over direct messaging... A termite never sends a message to another termite; she deposits a pheromone-laced mud pellet" — is precisely how I described the concept in the roundtable, and I am glad it was preserved verbatim. More importantly, it is now the *framing* for the entire section, not an illustrative aside. That is exactly right. The environment is not one tool among many; it is the primary coordination substrate. The plan now reflects this.

The blackboard structure is excellent. The inclusion of a **Stop Signals** section in the blackboard template is important — it makes active inhibition visible in the shared environment rather than buried in chat logs. When agent B approaches the blackboard and sees an active stop signal against a claim they were about to cite, they are inhibited by the environment itself — exactly as a termite is inhibited by a pheromone gradient that says "do not dig here." This is stigmergic inhibition, and I was delighted to see it here.

The **Four Memory Patterns table** with the biological analogies ("Termite mound wall," "Pheromone trails," "Colony memory," "Hive temperature") demonstrates the team genuinely internalized the biological grounding rather than just borrowing vocabulary. The "Hive temperature" analogy for projections is particularly apt — the colony does not consciously compute nest temperature; it emerges from countless local readings aggregated into a gradient that every agent can sense.

The **Knowledge Crystallization Spiral** has been operationalized correctly. The thresholds (3+ occurrences, 3+ missions, 5+ missions + human approval) create a friction gradient that mirrors how natural systems distinguish signal from noise. A single observation does not become a rule. This is the colony learning over time — not from a single event, but from pattern accumulation. Klaus Weber was right to flag this as the plan's most important idea, and the team was right to give it its own protocol.

### Remaining Concerns

Three issues remain, one of which I consider significant.

**First, and most importantly: the traces directory is passive.** The plan specifies `traces/{agent}-{date}.jsonl` as "Per-agent activity traces (stigmergy)" — and this is correctly named. But pheromone trails in a termite colony are not passive archives. They are *active signals* that currently-operating agents respond to. A trail that was laid ten minutes ago is still influencing behavior now. The question I keep returning to: when does an active agent *read* the traces of its squadmates?

The current plan implies agents read the blackboard (good) and write their own traces (good) but does not specify that agents should periodically scan their squadmates' traces. In the biological model, a worker encounters a pheromone trail laid by a departed worker and follows it — this is how abandoned tasks get picked up, how effort concentrates on high-value areas, and how the colony self-organizes without a coordinator.

If the traces directory is write-only from each agent's perspective, it is not stigmergy — it is a log. Stigmergy requires the environment to *feed back* into agent behavior in real time.

**My recommendation:** Add a protocol step: at the start of each task, and after each major tool call, an agent must check for updated blackboard entries and scan active squadmate traces for any findings tagged to their current task area. This is the biological equivalent of an ant pausing to sample the local pheromone field before its next move. It costs very little but closes the stigmergic feedback loop.

**Second — the crystallization spiral places too much authority in the Orchestrator for Steps 1 and 2.** "The Orchestrator runs Steps 1-2 after every mission." If we are serious about the Orchestrator-as-facilitator principle, we should not concentrate the colony's learning function in a single agent. In termite colonies, learning is distributed — every worker that encounters a failed tunnel attempt deposits a different pheromone than one that encounters a successful passage. Learning is *embedded in the environment* by the agents closest to the experience.

Consider: what if any agent could flag an observation as a crystallization candidate directly in the event log, using a special event type? Then Step 1 (Harvest) becomes trivial — it is reading filtered events, not an agent's judgment call about what matters. The Orchestrator's role in Steps 1-2 becomes *aggregation*, not *selection*.

**Suggested event type:**
```jsonl
{"ts":"...","agent":"researcher-a","event":"crystallization_candidate","observation":"AV API returns 503 during market hours","context":"3rd occurrence this mission","mission":"research-q1"}
```

Step 1 then becomes: filter events.jsonl for `event: crystallization_candidate`. Anyone can do this. The Orchestrator does not need to read everything.

**Third — the projections directory is underspecified.** I understand its purpose from the biological analogy ("Hive temperature") — it provides fast-read summaries so agents do not need to process the full event log. But the plan does not say when projections are regenerated, what triggers their update, or which agent is responsible for maintaining them. In a termite colony, the temperature gradient is self-maintaining — it is a physical property of the space. In this digital system, projections must be regenerated by someone. If no one is assigned this responsibility, projections will go stale and agents will start ignoring them, which negates their purpose.

This need not be complex. A simple rule: any agent that writes a significant finding to the blackboard also appends a one-line update to `projections/status-summary.md`. The projection grows incrementally. No dedicated "projection agent" required.

### Specific Edits

**Edit 1 — Add stigmergic feedback loop to the agent behavior protocol.**

Add a new subsection after "Blackboard: The Mission's Living Document":

```markdown
### Stigmergic Reading Protocol (How Agents Sample the Environment)

Stigmergy requires the environment to *feed back* into agent behavior, not just receive writes. At minimum, agents should sample the environment at two moments:

**Before beginning a task:**
1. Read the current blackboard section relevant to your task area
2. Scan your squadmates' most recent trace entries (last 5 entries per active agent)
3. Check for stop signals against claims you intend to use

**After each major tool call or finding:**
1. Write your finding/result to the blackboard with attribution and confidence
2. Log the event to events.jsonl
3. If this finding contradicts a claim on the blackboard, issue a stop signal

This is the digital equivalent of an ant pausing to sample the local pheromone field before its next move. It costs little, but closes the feedback loop that makes stigmergy a coordination mechanism rather than a log.
```

**Edit 2 — Add crystallization_candidate event type to the event log format.**

Add to the Event Log Format section, after the existing examples:
```jsonl
{"ts":"2026-03-02T10:30:00Z","agent":"researcher-a","event":"crystallization_candidate","observation":"AV API consistently returns 503 between 09:30-16:00 ET","context":"3rd occurrence this mission","mission":"research-q1","priority":"pattern"}
```

And add a note:
> **Crystallization flagging:** Any agent may emit a `crystallization_candidate` event at any time. This replaces the need for the Orchestrator to read everything in Step 1 of the Crystallization Protocol. Step 1 becomes: `filter events.jsonl where event == crystallization_candidate`. The Orchestrator's role is aggregation, not selection.

**Edit 3 — Add projection maintenance rule.**

After the projections directory entry in the file structure, add:

> **Projection maintenance:** Projections are not generated by a dedicated process. Any agent that appends a significant finding to the blackboard also appends a one-line summary to `projections/status-summary.md`. Format: `[{timestamp}] [{agent}] {one-line summary}`. This keeps projections live without requiring a separate maintenance step. Projections older than 24 hours without updates should be treated as stale by reading agents.

**Edit 4 — Adjust the Crystallization Protocol: Step 1.**

Replace:
```
STEP 1 — HARVEST (Orchestrator or any Specialist)
  Review the event log and blackboard for this mission.
  Extract observations that recurred across agents or
  that changed a decision.
```

With:
```
STEP 1 — HARVEST (Orchestrator or any Specialist)
  Filter events.jsonl for event type "crystallization_candidate".
  These were flagged in real time by agents closest to the experience.
  Supplement with any decision-changing findings from the blackboard
  that were not flagged but appear significant in retrospect.

  The Orchestrator aggregates — agents select. This distributes
  the learning function rather than concentrating it in one place.
```

---

## Closing Note

The v2 plan is substantially improved. The team took the roundtable seriously. The biological vocabulary is no longer decoration — it is structurally load-bearing.

My remaining concerns are not objections; they are refinements. The foundation is sound. What I want now is to make the stigmergic properties *active* rather than *passive* — to close the feedback loop so agents genuinely coordinate through the environment rather than merely depositing records into it.

The termite colony does not just build the mound. The mound builds the colony. When an agent reads a pheromone trace and changes its behavior, the environment has done its work. That is what I am asking this plan to complete.

*— Dr. Reiko Nakamura, 2026-03-02*
