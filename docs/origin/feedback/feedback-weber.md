# Klaus Weber — Feedback on v2

*Production Lead, Automated Robotics Factory. 340 robots. Zero humans on the floor.*

---

## Section 7: Scaling & Cloning

### What Improved

The fan-out/fan-in pattern is described with operational precision now. In v1, "horizontal scaling" was hand-waved. Here we have an explicit sequencing — Facilitator writes intent, workers claim from queue, results written to blackboard, Facilitator synthesizes from blackboard not from memory. That last phrase matters enormously. In my factory, every machine writes its output to a shared production log, not to the next machine's input buffer. The architecture has absorbed that principle correctly.

The cloning protocol is also a real improvement. Single differentiation axis per clone, unique name suffixes, differentiation injected at spawn time not baked into the base persona — this is how you stamp parts from a single mold. In manufacturing we call it "variant management." The plan now has a coherent variant management model.

The cost table is welcome. Quantified guidance ("~80% vs opus," "~40% less overhead") is what an operations team can actually use to make decisions. Vague guidance ("use cheaper models when appropriate") leads to inconsistency. Numbers lead to policy.

### Remaining Concerns

**Concern 1: The fan-out/fan-in step "Facilitator waits for all completions" is a synchronization barrier without a timeout.**

In any production system, a synchronization barrier without a timeout is a deadlock waiting to happen. If one worker fails silently — context window overflow, rate limit, API error — the Facilitator waits forever. My production lines have maximum wait tolerances on every synchronization point. Exceed the tolerance: the line does not stop. The barrier releases, the Facilitator processes what arrived, and the missing worker's output is flagged as absent.

This is distinct from failure taxonomy (Section 9). Section 9 handles *detected* failures. A silent hang is an *undetected* failure. The fan-out/fan-in pattern needs its own timeout and partial-completion handling.

**Concern 2: No spawn tracking.**

The cloning protocol describes how to create clones. It says nothing about tracking them. If investigator-alpha, -beta, and -gamma are spawned, the Facilitator needs a manifest: which clones exist, what task each claims, what completion state each is in. Without a manifest, the Facilitator synthesizes from "whatever appeared on the blackboard" — it cannot distinguish "beta finished and wrote nothing" from "beta has not finished yet."

In my factory, every robot task is issued with a job ticket. The job ticket travels with the task. Completion is registered against the ticket, not inferred from the output tray being full.

**Concern 3: The "sweet spot: 3-5 workers with 5-6 tasks each" is an empirical recommendation with no rebalancing rule.**

Good that it's quantified. Insufficient that it's static. In my facility, task load is not uniform. Some tasks run long; others are trivial. If all 5 workers are busy and a new high-priority task arrives, what happens? The plan does not say. The sweet spot becomes a constraint rather than a guideline unless there is a rebalancing or queue-overflow policy.

**Concern 4: No concept of clone performance differentiation.**

After the first mission with clones, we know something: investigator-alpha found 3 relevant findings, investigator-beta found 1, investigator-gamma found 7 and flagged a critical issue. This performance differential is data. The Knowledge Crystallization Spiral (Section 5) would suggest harvesting this observation. But Section 7 does not connect clone outcomes to crystallization. The cloning protocol creates instances; it does not close the feedback loop.

**Concern 5: Cost management table addresses token cost but not wall-clock time.**

For some mission types, throughput (tasks per hour) matters more than token cost. A 5-agent haiku fan-out may cost less per token but run slower than a 3-agent sonnet fan-out if haiku requires more retry cycles. The cost table needs a "latency impact" column or a note acknowledging the tradeoff axis.

### Specific Edits

**Edit 1: Add timeout and partial-completion handling to the fan-out/fan-in block.**

Replace:
```
Facilitator waits for all completions
Facilitator synthesizes from blackboard (not from memory)
```

With:
```
Facilitator waits for all completions (timeout: 10 min default, configurable)
  - On timeout: Facilitator synthesizes from available results
  - Missing workers are flagged as ABSENT in synthesis output
  - Absent worker tasks are re-queued or escalated per failure taxonomy
Facilitator synthesizes from blackboard (not from memory)
```

**Edit 2: Add spawn manifest to the cloning protocol.**

Add as step 5:
```
5. Facilitator writes a spawn manifest to the blackboard:
   {
     "mission_id": "<id>",
     "clones": [
       {"name": "investigator-alpha", "task": "<task>", "status": "spawned"},
       {"name": "investigator-beta",  "task": "<task>", "status": "spawned"},
       {"name": "investigator-gamma", "task": "<task>", "status": "spawned"}
     ]
   }
   Each clone updates its entry to "in_progress", then "complete" or "failed".
   Facilitator reads manifest before synthesis — never infers completion from
   blackboard content alone.
```

**Edit 3: Add a note connecting clone outcomes to crystallization.**

After the cost management table, add:
```
### Clone Performance Loop

After each fan-out/fan-in mission, the retrospective step (see §Crystallization)
should record per-clone yield:

  investigator-alpha: N findings, M flagged critical
  investigator-beta:  N findings, M flagged critical
  investigator-gamma: N findings, M flagged critical

Differentiation axes that consistently produce higher yield are candidates for
promotion to default cloning configurations. This closes the feedback loop
between scaling operations and the Knowledge Crystallization Spiral.
```

**Edit 4: Add a latency column to the cost management table.**

| Strategy | Savings | Latency Impact | When |
|----------|---------|----------------|------|
| Use haiku for scouts | ~80% vs opus | +20-40% vs sonnet | Always for research/monitoring |
| Pre-approve permissions | Eliminates prompt overhead | Neutral | Production workflows |
| Scope spawn prompts tightly | Reduces context overhead | Reduces | Always |
| Use subagents (not teammates) when only results matter | ~40% less overhead | Reduces | One-shot tasks |
| Cap at 3-5 agents per squad | Avoids superlinear coordination cost | Reduces beyond 5 | Always |

---

## Section 12: File Structure

### What Improved

The structure has a clear taxonomy now: personas, squads, terrain, constitutions, protocols, memory, differentiation. In v1, governance documents were scattered. The `constitutions/` directory is a genuine improvement — it separates *what agents are permitted to do* from *how they interact*, which maps cleanly onto the distinction between a factory's safety interlocks (constitutions) and its operating procedures (protocols).

The `_deferred/` subdirectory inside `squads/` is excellent operational thinking. Deferring unproven templates rather than building them speculatively is exactly the discipline that keeps a system maintainable. I have seen factories built with "future expansion" bays that were never used and became storage. The `_deferred/` folder acknowledges the same tendency and builds a physical reminder against it.

The `memory/` structure with the `retrospectives/` subdirectory directly answers my roundtable concern about the Knowledge Crystallization Spiral. That directory is the designated home for crystallization outputs. Its existence signals intent to operationalize learning.

Naming `orchestrator.md` as a persona alongside the others, rather than in a separate tier, reflects the roundtable's Amendment 1 correctly — the Orchestrator is now a persona, not an architecture layer. This is the right structural expression of that philosophical shift.

### Remaining Concerns

**Concern 1: The `memory/` directory has no explicit structure for the spawn manifests I described above.**

If fan-out missions produce spawn manifests (as recommended in my Section 7 edits), those manifests need a home. The `blackboard/` subdirectory is a candidate, but "blackboard" implies transient active-session content. A spawn manifest that the Facilitator reads during synthesis is transient. But a spawn manifest used *after the mission* to populate the retrospective is archival. The structure does not distinguish transient from archival memory. In my factory, the production log is write-once-read-many and append-only. The job ticket archive is separate from the active job board.

**Concern 2: No version or generation marker on personas.**

Personas will evolve. If investigator.md is updated in Month 3 based on crystallization findings, there is no mechanism to know which missions ran with the old version and which ran with the new. In production, we timestamp every robot firmware version change and correlate it with subsequent defect rate data. A persona is analogous to firmware: it determines behavior. Behavior history needs version anchors.

This is not a file-structure redesign — it is a single header field. But the structure as written does not provide for it.

**Concern 3: The `constitutions/` directory has `universal.md` as the source of truth, but no mechanism to ensure personas embed the current version.**

The comment in the structure says "Governance (embedded in personas, referenced here)." Embedded is the critical word. If universal.md is updated, every persona file that embeds governance must also be updated. There is no integrity check described. In my factory, when a safety regulation changes, we have a formal change propagation procedure: identify all work instructions referencing that regulation, update each, verify, sign off.

Without an equivalent here, `universal.md` and the persona files will diverge over time. The constitutions directory will say one thing; a persona from six months ago will say another. Missions run by that persona will operate under stale governance.

**Concern 4: The `differentiation/` directory is flat, but its files are orthogonal — perspective frames, search heuristics, domain lenses.**

This is a minor concern but worth naming: a flat listing suggests these three files are independent reference documents. They are not. They are three axes of a single decision when cloning: *how to vary the clone*. A clone prompt uses at most one axis per clone (per the cloning protocol). The structure does not communicate this constraint. A user composing a spawn prompt might read all three files and combine all three axes — violating the single-differentiation-axis rule.

**Concern 5: No `tests/` or `verification/` directory.**

This is the concern I feel most strongly about. The plan describes a system with protocols, constitutions, cloning rules, failure taxonomy, and crystallization procedures. How do you know any of these are working? In my factory, every critical subsystem has an acceptance test. When we deploy a firmware update to a robot, we run a verification sequence before we clear it for production.

The file structure has no analog. There is nowhere to put: "here is how you know the stop signal is functioning," "here is a mission replay that tests the failure taxonomy," "here is a baseline to compare quality over time." Without this, the system has no self-diagnostics. Statistical process control — the third point I raised in the roundtable — requires a baseline and a measurement procedure. That procedure needs a home.

### Specific Edits

**Edit 1: Split `memory/` into active and archival layers.**

Replace:
```
+-- memory/                       # Shared memory substrate
|   +-- blackboard/               # Active collaboration workspace
|   +-- events.jsonl              # Append-only activity log
|   +-- traces/                   # Per-agent activity traces
|   +-- projections/              # Generated summaries
|   +-- retrospectives/           # Post-mission crystallization outputs
```

With:
```
+-- memory/                       # Shared memory substrate
|   +-- active/                   # Transient — cleared between missions
|   |   +-- blackboard/           # Active collaboration workspace
|   |   +-- manifests/            # Spawn manifests (per-mission, per-squad)
|   |   +-- traces/               # Per-agent activity traces (current mission)
|   +-- archive/                  # Persistent — never cleared
|       +-- events.jsonl          # Append-only activity log (all missions)
|       +-- projections/          # Generated summaries (per-mission snapshots)
|       +-- retrospectives/       # Post-mission crystallization outputs
```

This makes the transient/archival distinction explicit and gives spawn manifests a designated home.

**Edit 2: Add a persona version header convention.**

Add a note below the personas directory listing:
```
Each persona file begins with a version header:
  ---
  persona_version: 1.2
  last_updated: 2026-03-02
  basis: crystallization retrospective from missions 12, 17, 23
  ---

This allows retrospective analysis of mission outcomes against persona versions.
```

**Edit 3: Add a constitution integrity check to the constitutions/ description.**

Replace the current comment:
```
+-- constitutions/                # Governance (embedded in personas, referenced here)
```

With:
```
+-- constitutions/                # Governance (source of truth — personas embed by reference)
|   +-- universal.md              # Universal principles
|   +-- stop-signal.md            # Stop signal protocol
|   +-- commitment-threshold.md   # Quorum sensing rules
|   +-- PROPAGATION.md            # Change procedure: how to update personas when
|                                 # constitution changes (prevents silent divergence)
```

**Edit 4: Add a `_verification/` directory to the hive root.**

After the `differentiation/` block, add:
```
+-- _verification/                # Self-diagnostics and baseline tests
    +-- README.md                 # How to run verification sequences
    +-- stop-signal-test.md       # Scenario: does the stop signal trigger correctly?
    +-- failure-taxonomy-test.md  # Scenario: does each failure type route correctly?
    +-- crystallization-test.md   # Scenario: does a retrospective produce a candidate pattern?
    +-- quality-baseline.md       # Baseline quality metrics for comparing missions over time
```

This is the home for statistical process control. Without it, quality trending is conceptually possible but practically orphaned.

---

## Summary

Section 7 has the right skeleton. It needs a circulatory system: timeouts to prevent deadlocks, manifests to track what was spawned, and a feedback loop connecting clone performance back to the crystallization spiral. The cost table is good operational thinking — it just needs to acknowledge the latency tradeoff alongside the token cost.

Section 12 is structurally sound and reflects the roundtable amendments faithfully. The three gaps that concern me most are: the absence of active/archival memory separation, the lack of version tracking on personas, and — most critically — the absence of a verification directory. A system with no self-diagnostics is a system that cannot improve systematically. My factory runs three verification sequences per shift. This system should have an equivalent, and the file structure should make clear that verification is not an afterthought.

The v2 plan is production-grade thinking. These edits move it toward production-grade practice.
