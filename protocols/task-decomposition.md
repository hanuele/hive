# Task Decomposition Protocol

> Standard template for breaking large mission outputs into Claude Code tasks.

## When to Decompose

- Blackboard exceeds 10KB
- Change plan touches >5 files
- Mission produces >5 actionable items
- Mid-mission complexity discovery reveals more work than expected

## Who Decomposes

The **Scrum Master** owns operational decomposition (sizing, scheduling,
assignment). The **Architect** or **Designer** owns design decomposition
(what to build). These are complementary, not competing.

## Template

```markdown
## Task Decomposition: {mission-name}

### Strategy
{horizontal (by feature) / vertical (by layer) / hybrid}
{1-sentence rationale for the chosen strategy}

### Dependency Graph
{T1 -> T2 means T1 blocks T2}
Example: T1 -> T3, T2 -> T3 (T3 depends on both T1 and T2)

### Tasks

#### T1: {Imperative title}
- Size: S (<30 min) / M (30-90 min)
- Dependencies: None | T{N}
- Agent type: read-only | write | full
- Acceptance criteria: {testable assertion}

#### T2: {Imperative title}
- Size: S / M
- Dependencies: T1
- Agent type: write
- Acceptance criteria: {testable assertion}
```

## Rules

1. **No L-sized tasks.** If a task would take >90 minutes, split it further.
   Every task must be S or M.
2. **Max 8 tasks per decomposition.** More than 8 means the mission itself
   should be split into sub-missions.
3. **Maps directly to Claude Code task tools.** Each task becomes a
   `TaskCreate` call. Dependencies become `TaskUpdate(addBlockedBy=[...])`.
4. **Acceptance criteria are testable.** "It works" is not a criterion.
   "Endpoint returns 200 with valid JSON" is.
5. **Agent type guides spawning.** Read-only tasks can use `explorer`;
   write tasks require `general-purpose`.

## Where to Write

- Blackboard `## Task Decomposition` section
- The decomposition stays on the blackboard as the source of truth
- Individual tasks are created via `TaskCreate` calls referencing
  the decomposition
