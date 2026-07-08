# Hive Onboarding Guide

> From zero to your first multi-agent mission in 15 minutes.
>
> **Tested against:** mechanics verified against Claude Code (July 2026 — Claude 5 /
> Fable 5 generation). Agents spawn via the `Agent` tool with a `name`; there is no
> Agent-Teams feature flag, no `TeamCreate`/`TeamDelete`, and no team teardown.

## 1. Prerequisites

- **Claude Code** CLI installed ([docs](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview))
- A project with a working codebase (the Hive needs something to investigate)

That's it. Multi-agent spawning is a first-class part of the harness — you spawn
a subagent with the `Agent` tool (`subagent_type`, `name`, `prompt`, optional
`model` / `isolation` / `run_in_background`). No environment variable or feature
flag is required. Verify by spawning a trivial read-only agent:

```
Agent(subagent_type="Explore", name="smoke-test",
      prompt="Read README.md and report its top-level headings.")
```

If it returns, you're ready. (`Explore` is the built-in read-only search agent.)

## 1.5 The Overlay Model — Target Design (not yet implemented)

> **Current behavior:** `bootstrap.sh` **flat-copies** the framework into
> `<your-project>/.claude/hive/`. There is no live framework/overlay resolution
> yet — what you get is one merged copy per project. The two-layer model below is
> the intended design; treat it as the direction of travel, not how the tool
> behaves today.

The Hive's *intended* resolution model is a two-layer overlay: a **framework**
layer (constitutions, protocols, personas, terrain, differentiation, memory
patterns — global, single point of truth) sits behind a **per-project
overlay** (squads, project-specific orchestrator persona, briefings,
project runtime state — `<your-project>/.claude/hive/`). Project files
would take precedence when present; the framework is the fallback.

Files that diverge across projects (squads, project READMEs) belong in
the overlay. Files that should be canonical across the lineage (the
constitutions, protocols, mindfulness practices) live in the framework.

**Resolution semantics by class:**

| Directory class | Path examples | Resolution |
|---|---|---|
| Framework | `constitutions/`, `protocols/`, `personas/<non-orchestrator>`, `terrain/`, `differentiation/`, `memory/patterns/`, `DOMAIN-INJECTION.md` | global-only (project-shadow = lint warning) |
| Overlay | `squads/`, `personas/orchestrator.md`, `README.md`, `integration-guide.md`, `briefings/`, `terrain/<override>`, `protocols/<override>` | project-wins, fallback global |
| Runtime (project) | `memory/active/blackboard/`, `memory/active/error-catalog.md`, `memory/active/pattern-tracker.md`, `memory/archive/` | project-only |
| Runtime (cross-project) | `memory/active/blackboard/` (when invoked outside a project) | global-only |

## 2. Installation

```bash
# Clone the Hive repo
git clone https://github.com/hanuele/hive.git /tmp/hive

# Option A: Use the bootstrap script (recommended)
/tmp/hive/scripts/bootstrap.sh --target /path/to/your/project

# Option B: Manual copy
mkdir -p /path/to/your/project/.claude/hive
cp -r /tmp/hive/personas /tmp/hive/agents /tmp/hive/squads /tmp/hive/constitutions \
      /tmp/hive/protocols /tmp/hive/terrain /tmp/hive/differentiation \
      /tmp/hive/memory /tmp/hive/_verification /tmp/hive/GLOSSARY.md \
      /tmp/hive/integration-guide.md /tmp/hive/DOMAIN-INJECTION.md \
      /path/to/your/project/.claude/hive/

# Install the agent types so the harness can spawn them by subagent_type.
# (Bootstrap Option A does this for you.)
mkdir -p /path/to/your/project/.claude/agents
cp /tmp/hive/agents/*.md /path/to/your/project/.claude/agents/

# Commit the hive to your project
cd /path/to/your/project
git add .claude/hive/ .claude/agents/
git commit -m "feat: add Hive multi-agent framework"
```

**Why the `agents/` copy matters:** `personas/` is the narrative source of truth,
but the harness spawns custom agents from `.claude/agents/*.md`. Copying the six
installable agent definitions there is what lets you write
`Agent(subagent_type="investigator", …)` instead of pasting a whole persona into
every spawn prompt. See `agents/README.md` for how the two stay in sync.

## 3. What to Customize

`bootstrap/DOMAIN-INJECTION-CHECKLIST.md` is the **single authoritative checklist**
for placeholder work — every `{PLACEHOLDER}`, where it appears, and its verification
step. `DOMAIN-INJECTION.md` gives the narrative rationale; the checklist is what you
work through.

At minimum, replace:
- `{PROJECT_TEST_COMMAND}` — your project's test runner (e.g., `npm test`, `pytest`, `cargo test`)
- `{MIGRATION_SPECIALIST}` — your migration/schema review agent (or, absent one, read it as a Challenger with a migration lens; or remove the augmentation rule if not applicable)

The generic `agents/scrum-master.md` also carries project placeholders (issue
tracker, credentials, status names) — the checklist lists them all.

## 4. First Mission Walkthrough: Research Squad

This walkthrough runs a 3-agent Research Squad to investigate a topic in your codebase. Replace `{your-topic}` with something your project needs to understand (e.g., "error handling patterns", "authentication flow", "data validation gaps").

### Step 1: Create the blackboard

Copy the template:

```bash
cp .claude/hive/memory/active/blackboard/_template.md \
   .claude/hive/memory/active/blackboard/{your-topic}.md
```

Edit the blackboard. Fill in the Commander's Intent section:

```markdown
## Commander's Intent

**Why:** We need to understand {your-topic} because {reason}. This serves {who benefits}.
**Objective:** Produce a clear summary of {your-topic} with evidence and confidence levels.
**Constraints:** Do not modify any code. Research only.
**Boundaries:** Focus on {in-scope}. Ignore {out-of-scope}.
**Premises to question:** {What assumptions might be wrong?}
**Success criteria:** A BLUF summary with 3-5 key findings, each with confidence and source.
**Time box:** 1 round per agent.
**Resource justification:** Multiple perspectives needed — depth-first and breadth-first lenses will find different things.
**Consequences of failure:** {What happens if we get this wrong?}
```

### Step 2 (optional): Mirror the phases as tasks

If task tools are available in this session (`TaskCreate`/`TaskUpdate` — they are
present in some environments, absent in others), create one task per phase for
visibility. If they aren't available, skip this step entirely — the blackboard and
the trace files track progress on their own.

```
TaskCreate(subject="Research {aspect-A} — depth-first", description="Investigate {your-topic}, depth-first lens. Write findings to blackboard.")
TaskCreate(subject="Research {aspect-B} — breadth-first", description="Investigate {your-topic}, breadth-first lens. Write findings to blackboard.")
TaskCreate(subject="Synthesize findings", description="Read all findings on blackboard. Write BLUF synthesis. File retrospective.")
```

### Step 3: Spawn the agents

Because you installed `agents/` into `.claude/agents/` (Step 2 of Installation),
the persona already lives in the agent definition — you do **not** paste it into
the prompt. The charge is just the mission, the blackboard path, and the lens.
Spawn with a `name` so each agent is addressable via `SendMessage`, and
`run_in_background=True` so they work concurrently.

```
Agent(
  subagent_type="investigator",
  name="investigator-alpha",
  run_in_background=True,
  prompt="Mission: [paste Commander's Intent from the blackboard].
Blackboard: .claude/hive/memory/active/blackboard/{your-topic}.md
Your lens: depth-first over primary implementation files.
Read the blackboard first. Identify yourself as investigator-alpha in every entry.
Write findings to '## Findings' as: [HH:MM] investigator-alpha: {finding} (confidence: 0.0-1.0) (source: {file/url}).
Follow BLUF (protocols/bluf-format.md). During fan-out, do NOT read peer findings first.
When done, append the trace: {your-topic}-alpha-finding_submitted.trace"
)

Agent(
  subagent_type="investigator",
  name="investigator-beta",
  run_in_background=True,
  prompt="Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{your-topic}.md
Your lens: breadth-first — patterns and cross-references across the codebase.
Read the blackboard first. Identify yourself as investigator-beta. Write findings
to '## Findings'. Blind fan-out: do NOT read peer findings before submitting yours.
When done, append the trace: {your-topic}-beta-finding_submitted.trace"
)
```

### Step 4: Wait, then synthesize

The two investigators run in the background; the harness notifies you as each
completes. When both are done, synthesize. The Orchestrator seat is usually yours
(the session lead) — you can run the synthesis directly, or delegate it to an
`orchestrator` agent:

```
Agent(
  subagent_type="orchestrator",
  name="orchestrator",
  prompt="Mission: [paste Commander's Intent].
Blackboard: .claude/hive/memory/active/blackboard/{your-topic}.md
1. Read the full blackboard.
2. Take a BREATHING SPACE — read everything once without acting (protocols/breathing-space.md).
3. Synthesize using protocols/synthesis-template.md; write it under a new '## Synthesis' section.
4. Run Knowledge Crystallization (protocols/crystallization.md Steps 1-2.5).
5. Write a retrospective to memory/archive/retrospectives/{your-topic}-retro.md (template alongside)."
)
```

### Step 5: Done — nothing to tear down

There is no team to delete. Background agents finish, write their final
blackboard entries, and send completion messages (each carrying its farewell);
the harness notifies you. If you need to stop a running agent early, use
`TaskStop <agent-id>` after preserving its partial work (see
`protocols/agent-shutdown.md`). To ask a completed agent a follow-up, just
`SendMessage({to: "investigator-alpha", …})` — a named agent resumes with its
context intact. The mission's lasting artifacts are the blackboard and the
retrospective; archival is handled by `protocols/mission-cleanup.md`.

## 5. Understanding the Output

After the mission completes, you'll find:

### The Blackboard (`memory/active/blackboard/{your-topic}.md`)
- **Commander's Intent** — the mission framing
- **Findings** — timestamped, sourced, with confidence scores
- **Synthesis** — BLUF summary categorizing consensus, majority, contested, and gaps

### The Retrospective (`memory/archive/retrospectives/{your-topic}-retro.md`)
- **Beginning Anew** — what went well, what fell short, aspirations
- **What Surprised Us** — findings that contradicted assumptions (reviewed first!)
- **Candidate Patterns** — behaviors worth tracking across missions

### Event Log (`memory/archive/events.jsonl`)
- Timeline of all mission events (if agents logged them)
- Queryable with `grep`:
  ```bash
  grep '"mission":"{your-topic}"' .claude/hive/memory/archive/events.jsonl
  ```

## 6. Troubleshooting

### Empty blackboard after mission

Agents didn't write to the blackboard. Common causes:
- Blackboard path was wrong in the spawn prompt (check the exact path).
- A write-role agent was spawned with a read-only type. A read-only agent
  (`Explore`, or a custom type with no `Bash`) cannot append findings. Use the
  right `agents/` type for the role — read-only roles (investigator, challenger,
  innovator) still write to the blackboard via `Bash` append, so they need `Bash`
  in their allowlist, which the shipped agent files already grant.
- The agent ran out of context before writing. Its charge should tell it to
  checkpoint early and often (per `protocols/checkpoint.md`).

**Fix:** Check the agent's completion message for errors, then re-spawn with a
corrected charge.

### Agent can't write a file it should be able to

Subagents can read anywhere but can only **write inside the session's working
directories**. A write to another repo silently lands nowhere.

**Fix:** For code changes in a repo, spawn the write-role with
`isolation="worktree"` (it gets an isolated copy to modify). For cross-repo work,
use the agents-research / orchestrator-writes split — the agent returns a plan or
diff, and you (in the session's working dirs) apply it. See the Engineering Squad
for both patterns.

### Agent produces unstructured output

The agent didn't follow BLUF format.

**Fix:** Confirm you spawned it by its installed `subagent_type` (so it carries the
full persona), not with a bare "you are The Investigator" line. The persona
narrative — including its metacognitive hooks — is what produces structured
behavior; that's the whole reason `agents/` exists. If you must spawn without the
installed type, paste the matching `personas/*.md` into the prompt.

## 7. Learning Path

Read these files in order. Each builds on the previous:

| # | File | What you learn | Time |
|---|------|---------------|------|
| 1 | `constitutions/universal.md` | The Thirteen Principles — the "why" behind everything | 5 min |
| 2 | `terrain/analysis-axes.md` | How to assess whether a task needs a squad | 3 min |
| 3 | `protocols/commanders-intent.md` | How to frame a mission (the most important skill) | 5 min |
| 4 | `protocols/bluf-format.md` | How agents communicate findings | 2 min |
| 5 | `docs/example-mission/blackboard.md` | A complete mission — see all the pieces working together | 10 min |

After these 5 files (~25 minutes), you'll understand the core loop. Everything else is refinement.

## 8. Going Deeper

Once your first mission succeeds, explore:

| Topic | Where to Look |
|-------|--------------|
| **Worked example** | `docs/example-mission/` — complete blackboard, retrospective, and trace examples |
| **Squad selection** | `terrain/composition-rules.md` — which squad type for which terrain |
| **Engineering Squad** | `squads/engineering-squad.md` — build/modify code with known requirements |
| **Review Squad** | `squads/review-squad.md` — independent quality assessment with blind protocol |
| **All protocols** | `protocols/` — communication standards, synthesis, failure handling |
| **Constitutions** | `constitutions/` — governance principles, quorum rules, Stop Signals |
| **Knowledge Crystallization** | `protocols/crystallization.md` — how the system learns across missions |
| **Example retrospective** | `memory/archive/retrospectives/example-research-retro.md` |
| **Contributing** | `CONTRIBUTING.md` — how to share your mission results and improve the framework |
