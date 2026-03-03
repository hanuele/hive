# Hive Onboarding Guide

> From zero to your first multi-agent mission in 15 minutes.

## 1. Prerequisites

- **Claude Code** CLI installed ([docs](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview))
- **Agent Teams** enabled: set environment variable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- A project with a working codebase (the Hive needs something to investigate)

Verify Agent Teams is available:

```bash
claude   # Start Claude Code
# Type: TeamCreate(team_name="test", description="test")
# If it works, Agent Teams is enabled. Clean up: TeamDelete
```

## 2. Installation

```bash
# Clone the Hive repo
git clone https://github.com/hanuele/hive.git /tmp/hive

# Option A: Use the bootstrap script (recommended)
/tmp/hive/scripts/bootstrap.sh --target /path/to/your/project

# Option B: Manual copy
mkdir -p /path/to/your/project/.claude/hive
cp -r /tmp/hive/personas /tmp/hive/squads /tmp/hive/constitutions \
      /tmp/hive/protocols /tmp/hive/terrain /tmp/hive/differentiation \
      /tmp/hive/memory /tmp/hive/_verification /tmp/hive/GLOSSARY.md \
      /tmp/hive/integration-guide.md /tmp/hive/DOMAIN-INJECTION.md \
      /path/to/your/project/.claude/hive/

# Commit the hive to your project
cd /path/to/your/project
git add .claude/hive/
git commit -m "feat: add Hive multi-agent framework"
```

## 3. What to Customize

Open `DOMAIN-INJECTION.md` in the Hive repo. It lists **2 required** and **4 optional** customizations.

At minimum, replace:
- `{PROJECT_TEST_COMMAND}` — your project's test runner (e.g., `npm test`, `pytest`, `cargo test`)
- `{MIGRATION_SPECIALIST}` — your migration/schema review agent (or remove the augmentation rule if not applicable)

## 4. First Mission Walkthrough: Research Squad

This walkthrough runs a 3-agent Research Squad to investigate a topic in your codebase. Replace `{your-topic}` with something your project needs to understand (e.g., "error handling patterns", "authentication flow", "data validation gaps").

### Step 1: Create the team

In Claude Code, run:

```
TeamCreate(team_name="research-{your-topic}", description="Investigate {your-topic}")
```

### Step 2: Create the blackboard

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

### Step 3: Create tasks

```
TaskCreate(subject="Research {aspect-A} — depth-first", description="Investigate {your-topic} with depth-first lens. Focus on primary domain files. Write findings to blackboard.")
TaskCreate(subject="Research {aspect-B} — breadth-first", description="Investigate {your-topic} with breadth-first lens. Look across the codebase for patterns. Write findings to blackboard.")
TaskCreate(subject="Synthesize findings", description="Read all findings on blackboard. Write BLUF synthesis. File retrospective.")
```

### Step 4: Spawn the agents

Read the persona files first to include in spawn prompts:

```
Read .claude/hive/personas/investigator.md
Read .claude/hive/personas/orchestrator.md
Read .claude/hive/protocols/bluf-format.md
```

Spawn two investigators:

```
Agent(
  subagent_type="general-purpose",
  name="investigator-alpha",
  team_name="research-{your-topic}",
  model="sonnet",
  prompt="You are The Investigator.

[Paste full content of personas/investigator.md here]

MISSION:
[Paste Commander's Intent from the blackboard]

YOUR TASK: Research {aspect-A} with a depth-first lens. Focus on primary implementation files.

INSTRUCTIONS:
1. Read the Commander's Intent on the blackboard at .claude/hive/memory/active/blackboard/{your-topic}.md
2. Research {aspect-A} thoroughly
3. Write your findings to the blackboard under '## Findings' using this format:
   - [HH:MM] investigator-alpha: {finding} (confidence: {0.0-1.0}) (source: {file/url})
4. Follow BLUF format (protocols/bluf-format.md)
5. When done, write a trace: echo '{\"ts\":\"...\",\"mission\":\"{your-topic}\",\"agent\":\"investigator-alpha\",\"action\":\"finding_submitted\",\"detail\":\"...\"}' > .claude/hive/memory/active/traces/{your-topic}-alpha-finding_submitted.trace
6. Mark your task as completed

## CRITICAL: Shutdown Handling
When you receive a shutdown_request message, respond with shutdown_response (approve: true) immediately."
)
```

```
Agent(
  subagent_type="general-purpose",
  name="investigator-beta",
  team_name="research-{your-topic}",
  model="sonnet",
  prompt="You are The Investigator.

[Paste full content of personas/investigator.md here]

MISSION:
[Paste Commander's Intent from the blackboard]

YOUR TASK: Research {aspect-B} with a breadth-first lens. Look across the codebase for patterns and cross-references.

INSTRUCTIONS:
1. Read the Commander's Intent on the blackboard at .claude/hive/memory/active/blackboard/{your-topic}.md
2. Research {aspect-B} broadly
3. Write your findings to the blackboard under '## Findings'
4. Follow BLUF format
5. Write a trace when done
6. Mark your task as completed

## CRITICAL: Shutdown Handling
When you receive a shutdown_request message, respond with shutdown_response (approve: true) immediately."
)
```

### Step 5: Wait, then synthesize

Wait for both investigators to complete. Then synthesize:

```
Agent(
  subagent_type="general-purpose",
  name="orchestrator",
  team_name="research-{your-topic}",
  model="sonnet",
  prompt="You are The Orchestrator.

[Paste full content of personas/orchestrator.md here]

MISSION:
[Paste Commander's Intent]

YOUR TASK: Synthesize the research findings.

INSTRUCTIONS:
1. Read the full blackboard at .claude/hive/memory/active/blackboard/{your-topic}.md
2. Take a BREATHING SPACE: read everything once without acting (protocols/breathing-space.md)
3. Synthesize using the protocol at protocols/synthesis-template.md
4. Write your synthesis to the blackboard under a new '## Synthesis' section
5. Run Knowledge Crystallization (protocols/crystallization.md Steps 1-2.5)
6. Write a retrospective to memory/archive/retrospectives/{your-topic}-retro.md using the template at memory/archive/retrospectives/_template.md
7. Mark the synthesis task as completed

## CRITICAL: Shutdown Handling
When you receive a shutdown_request message, respond with shutdown_response (approve: true) immediately."
)
```

### Step 6: Clean up

```
TeamDelete
```

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

### "Already leading team" error

A previous session ended without cleaning up:

```
Error: Already leading team "old-team-name". A leader can only manage one team at a time.
```

**Fix:** Call `TeamDelete` to clear the stale team. If that fails:

```bash
rm -rf ~/.claude/teams/{old-team-name} && rm -rf ~/.claude/tasks/{old-team-name}
```

Then call `TeamDelete` again and proceed with `TeamCreate`.

**Prevention:** Always call `TeamDelete` at the end of a mission.

### Empty blackboard after mission

Agents didn't write to the blackboard. Common causes:
- Blackboard path was wrong in spawn prompt (check exact path)
- Agent didn't have write permissions (use `subagent_type="general-purpose"`, not `explorer`)
- Agent ran out of context before writing

**Fix:** Check agent output for errors. Re-run with corrected spawn prompt.

### Designer can't write trace

If using `subagent_type="explorer"` (read-only), the agent cannot write files.

**Fix:** Use `subagent_type="general-purpose"` for all agents that need to write (traces, blackboard entries, findings).

### Stale team cleanup

If `~/.claude/teams/` or `~/.claude/tasks/` directories accumulate:

```bash
# List all teams
ls ~/.claude/teams/

# Remove a specific stale team
rm -rf ~/.claude/teams/{team-name} && rm -rf ~/.claude/tasks/{team-name}
```

### Agent produces unstructured output

The agent didn't follow BLUF format. This is a prompt issue.

**Fix:** Include the full persona narrative in the spawn prompt (not just "you are The Investigator"). The narrative provides the reasoning context that produces structured behavior.

## 7. Going Deeper

Once your first mission succeeds, explore:

| Topic | Where to Look |
|-------|--------------|
| **Terrain analysis** | `terrain/analysis-axes.md` — how to assess missions along 4 axes |
| **Squad selection** | `terrain/composition-rules.md` — which squad type for which terrain |
| **Engineering Squad** | `squads/engineering-squad.md` — build/modify code with known requirements |
| **Review Squad** | `squads/review-squad.md` — independent quality assessment with blind protocol |
| **Protocols** | `protocols/` — communication standards, synthesis, failure handling |
| **Constitutions** | `constitutions/` — governance principles, quorum rules, Stop Signals |
| **Knowledge Crystallization** | `protocols/crystallization.md` — how the system learns across missions |
| **Example retrospective** | `memory/archive/retrospectives/example-research-retro.md` |
