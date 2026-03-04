# Knowledge Crystallization Spiral

> Knowledge flows from raw observation to codified architecture. This is the system's long-term value — not any single mission, but the ability to learn and improve.

## The Spiral

```
Observation  -->  Pattern      -->  Discernment  -->  Rule          -->  Architecture
(event log)      (auto-memory)     (watering         (CLAUDE.md)       (code/prompts)
                                    seeds)
```

## The Crystallization Protocol (Runs After Every Mission)

### Step 1 — HARVEST (Orchestrator or any Specialist)

Filter `events.jsonl` for event type `crystallization_candidate`. These were flagged in real time by agents closest to the experience. Supplement with any decision-changing findings from the blackboard that were not flagged but appear significant in retrospect.

The Orchestrator aggregates — agents select. This distributes the learning function rather than concentrating it in one place.

### Step 2 — PATTERN (threshold: 3+ occurrences)

Read `memory/active/pattern-tracker.md`. For each candidate pattern from this mission:
- **If it already exists in the registry:** increment the count and add this mission's name.
- **If it is new:** add a new row with count=1, the mission name, and discernment classification.

Patterns that reach 3+ occurrences are documented using the pattern form:

```markdown
## {Pattern Name}
**Context:** When does this arise?
**Problem:** What tension is this resolving?
**Solution:** What does the pattern prescribe?
**Consequences:** What does this enable? What does it foreclose?
```

### Step 2.5 — DISCERNMENT (Between PATTERN and PROMOTE)

For each candidate pattern, ask:
- **Is this a seed we want to water?** (A behavior we want to reinforce?)
- **Is this a seed we want to let rest?** (A behavior we want to not reinforce?)
- **Is this a seed we do not yet understand?** (A behavior we need to observe further?)

| Decision | Action |
|----------|--------|
| Seeds to water | Fast-track toward PROMOTE |
| Seeds to let rest | Document as anti-patterns |
| Seeds we do not understand | Continue observing with explicit attention |

This transforms the Crystallization Spiral from a neutral learning system into a discerning one — one that learns what to become, not just what happened.

### Step 3 — PROMOTE (threshold: 3+ missions)

Patterns validated across 3+ missions are proposed as rules. The proposal goes to the human as a suggested CLAUDE.md amendment or protocol update.

When a pattern reaches the PROMOTE threshold:
1. Add it to the tracker's **PROMOTE Queue** section with the proposed rule text.
2. Create an issue in your project tracker (label: `hive-crystallization`) to track the human decision.

### Step 4 — CODIFY (threshold: 5+ missions, human-approved)

Rules that prove stable are embedded in architecture: code changes, hooks, agent prompts, or squad templates.

When a human approves a PROMOTE candidate:
1. Record the decision in the tracker's **Decision Log** (date, rationale).
2. After codifying, move the pattern to the tracker's **Implemented** section with a link to the commit/PR.

## Who Performs This

- **The Scrum Master** runs Steps 1-2.5 after every mission (mandatory post-mission phase). This includes updating `memory/active/pattern-tracker.md` with this mission's candidate patterns and checking occurrence thresholds.
- If no Scrum Master is spawned, the **Orchestrator** runs Steps 1-2.5.
- Steps 3-4 are triggered when thresholds are met and require human approval. The Scrum Master writes PROMOTE proposals to the blackboard; the human decides.

## Output

- A retrospective file at `memory/archive/retrospectives/{mission-name}-retro.md`.
- Updated `memory/active/pattern-tracker.md` with new/incremented patterns.

## Retrospective File Template

See `memory/archive/retrospectives/_template.md` for the full template. An example completed retrospective is available at `memory/archive/retrospectives/example-research-retro.md`.
