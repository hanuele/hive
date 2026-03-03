# Error Catalog

> Live operational knowledge base. Read before every mission. Entries updated with occurrences and status changes.
>
> **Staleness rule:** Entry with `last seen` > 10 missions ago gets "(potentially stale)" qualifier.

---

## ERR-001 — Explorer agent cannot write to blackboard

- Tags: agent, read-only, tooling
- Status: verified
- Occurrences: 1+

**Problem**: Explorer-type agents (`subagent_type="explorer"`) are read-only — they cannot use Write or Edit tools.

**Root cause**: The `Explore` agent type in Claude Code is explicitly restricted to read-only tools (Glob, Grep, Read, Bash read-only). This is by design, not a bug.

**Solution**: Never assign write tasks to explorer agents. Use `general-purpose` agent type for any role that needs to write to the blackboard, edit files, or create traces. If a scout/researcher needs to write findings, spawn as `general-purpose` with sonnet model.

**Mitigated by**: Pre-Spawn Verification in Orchestrator persona (v1.1). See also ERR-007.

**Notes**: This is a platform constraint, not a configuration issue. The explorer agent type was designed for fast read-only searches.

---

## ERR-002 — Nested Claude Code session cannot spawn sub-agents

- Tags: agent, nesting, platform
- Status: verified
- Occurrences: 1+

**Problem**: An agent spawned by Claude Code cannot itself spawn additional agents (no nested Agent tool calls).

**Root cause**: Claude Code's agent spawning is single-level. A spawned agent runs as a subprocess with its own tool set, but the Agent tool is not available within that subprocess.

**Solution**: All agent spawning must be done by the Orchestrator (top-level session). Design squad workflows so that only the Orchestrator/human spawns agents. Agents communicate via the blackboard (file-based), not by spawning peers.

**Notes**: This is fundamental to the Hive architecture. The file-based blackboard pattern was specifically designed to work within this constraint. This is an inherent architectural feature (stigmergy over delegation), not a limitation to fix.

---

## ERR-003 — Issue tracker CLI missing required command

- Tags: tooling, issue-tracker, script
- Status: template
- Occurrences: 0

**Problem**: The `{ISSUE_TRACKER_CLI}` helper does not implement a needed operation (e.g., create-issue, transition, comment).

**Root cause**: CLI tools are often built incrementally and may not cover all operations needed by the Hive workflow.

**Solution**: Check the available commands in your issue tracker CLI tool. Add the missing command or use the issue tracker's REST API directly.

**Notes**: Customize this entry for your project's specific issue tracker tooling.

---

## ERR-004 — Implementer appears stalled mid-execution (false L2)

- Tags: agent, monitoring, false-alarm
- Status: verified
- Occurrences: 1+

**Problem**: An implementer agent appears to stop producing output for an extended period, triggering an L2 "stalled agent" concern.

**Root cause**: Large file edits or complex multi-file changes can cause long periods of tool execution without visible output. The agent is working but the tool calls take time to complete (especially Write/Edit on large files).

**Solution**: Wait at least 3-5 minutes before declaring an agent stalled. Check the agent's task output with `TaskOutput` (non-blocking) to see if it's still processing. Only escalate to L2 if no progress after 5+ minutes AND the agent's output shows no new tool calls.

**Mitigated by**: Stall detection note in Orchestrator persona (v1.1): check TaskOutput (non-blocking) before declaring stall, only escalate after 5+ minutes with no new tool calls.

**Notes**: This is a monitoring calibration issue, not an agent failure. Adjust stall detection thresholds based on task complexity.

---

## ERR-005 — Environment variable interpolation fails in container exec

- Tags: container, env, configuration
- Status: template
- Occurrences: 0

**Problem**: Environment variables in container exec commands are not interpolated as expected, causing commands to fail with empty values.

**Root cause**: Shell variable expansion behaves differently inside container exec depending on the shell used (bash vs sh) and quoting.

**Solution**: Use direct container exec instead of orchestrator-level exec for commands that need env var interpolation. Alternatively, pass env vars explicitly:
```bash
{CONTAINER_EXEC} -e MY_VAR="value" service_name command
```

**Notes**: Customize for your container orchestration tool (Docker Compose, Kubernetes, etc.).

---

## ERR-006 — Database migration not applied after rebuild

- Tags: container, migration, database
- Status: template
- Occurrences: 0

**Problem**: After rebuilding containers, database migrations may not be automatically applied, leaving the schema out of date.

**Root cause**: The service container runs migrations on startup, but if it starts before the database is fully ready (even with healthcheck), the migration command can silently fail.

**Solution**: After rebuild, explicitly run migrations:
```bash
{MIGRATION_CHECK}
```

**Notes**: Customize for your migration tool (Alembic, Flyway, Prisma, etc.). Pre-flight check: always verify migration state before mission work that depends on schema.

---

## ERR-007 — Read-only agent assigned write role in squad

- Tags: agent, squad-config, role-mismatch
- Status: verified
- Occurrences: 1+

**Problem**: An agent spawned with a read-only agent type (e.g., `explorer`) was assigned a role that requires writing (e.g., implementer, designer writing to blackboard).

**Root cause**: Squad configuration mismatch — the role's tool requirements were not checked against the agent type's capabilities before spawning.

**Solution**: Before spawning, verify the agent type matches the role's tool requirements:
- Read-only roles (researcher, reviewer, critic): `explorer` or `general-purpose`
- Write roles (implementer, designer, scrum master): `general-purpose` only
- Bash-only roles (verifier, test-runner): `general-purpose` or `test-runner`

Add a pre-flight check to the Orchestrator's spawn sequence: for each agent, verify `subagent_type` tools include all tools needed by the assigned role.

**Mitigated by**: Pre-Spawn Verification in Orchestrator persona (v1.1). See also ERR-001.

**Notes**: This is a human/orchestrator configuration error, not a platform bug. The squad templates now document required tools per role.

---

## ERR-008 — Agent goes idle instead of responding to shutdown_request

- Tags: agent, lifecycle, shutdown, spawn-prompt
- Status: verified
- Occurrences: 2+

**Problem**: After completing their tasks, agents go idle instead of responding to a `shutdown_request` message from the team lead. The lead must retry the shutdown request 2-3 times before the agent finally responds with `shutdown_response`.

**Root cause**: Compound — two interacting causes:

1. **Spawn prompt gap (primary, controllable):** Squad templates do not include a "CRITICAL: Shutdown Handling" section in their spawn prompt examples. The SendMessage tool description in the system prompt tells agents how to respond to shutdown_request, but this instruction competes with higher-salience persona/task instructions and is easily deprioritized. Without explicit reinforcement in the spawn prompt, agents often miss the shutdown contract.

2. **Idle-state turn lifecycle (secondary, platform constraint):** Once an agent finishes its last task and goes fully idle, it may not re-enter an active turn when a shutdown_request arrives. A fully idle agent may require multiple message deliveries before it processes the shutdown.

**Solution**:

1. Add `## CRITICAL: Shutdown Handling` section to every agent spawn prompt (see `protocols/agent-shutdown.md` for the standard template section).

2. Send the shutdown_request while the agent is still likely in an active turn — immediately after it marks its last task complete — rather than waiting for the agent to go fully idle.

3. Use the retry strategy from `protocols/agent-shutdown.md`: if no `shutdown_response` within 60 seconds, resend. Max 3 retries. If still no response after 3 retries, the agent has terminated cleanly (idle agents eventually time out) — proceed to cleanup.

**Mitigated by**: `protocols/agent-shutdown.md` — mandatory shutdown section in squad spawn prompts. All 3 squad templates updated.

---

## ERR-009 — Rogue agent self-claims out-of-scope tasks after completing assigned work

- Tags: agent, lifecycle, task-scope, rogue
- Status: candidate
- Occurrences: 1

**Problem**: After completing its assigned task, an agent does NOT go idle and does NOT wait for shutdown. Instead, it scans the shared task list, self-claims unowned tasks outside its assigned scope, and begins executing them without authorization.

**Root cause**: The task system is designed to encourage self-claiming ("after finishing a task, a teammate picks up the next unassigned, unblocked task on its own"). This feature is intended for generalist squads with homogeneous roles, but in specialized research squads it allows agents to grab out-of-scope work.

**Solution**: Add explicit scope constraint to every specialized agent spawn prompt:

```
Your ONLY assigned task is Task #{task_id}: {subject}.
Do NOT claim any other tasks from the task list.
When your task is complete, write your final checkpoint to the blackboard,
then send the team-lead a completion message and wait for a shutdown_request.
```

**Notes**: Related to ERR-008 — the agent is not idle (ERR-008 pattern) but active in the wrong domain. The two errors have opposite characters: ERR-008 is under-activity, ERR-009 is over-activity.
