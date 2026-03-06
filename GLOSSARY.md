# Hive Glossary

> Canonical terminology for the Hive multi-agent system.

## Core Terms

| Term | Definition |
|------|-----------|
| **Bell Event** | Orchestrator-triggered signal for mission drift, pace concern, or quality concern — a mindful pause mechanism |
| **Blind Protocol** | Review technique where the reviewer assesses work without seeing the author's rationale first, preventing anchoring bias |
| **Codified Pattern** | A pattern that has been promoted from observation to a documented rule after 3+ mission occurrences (see Crystallization) |
| **Definition of Done (DoD)** | Mission completion checklists at two levels: `solo-complete` (tests, ACs, session log, handoff) and `mission-complete` (adds retrospective, crystallization, cleanup) |
| **Domain Injection** | The process of customizing generic Hive files with project-specific values by replacing `{PLACEHOLDER}` tokens |
| **Facilitator** | The agent (typically Orchestrator or Scrum Master) who mediates Tier 2 escalations between disagreeing agents |
| **Fan-out / Fan-in** | Research pattern: multiple agents investigate in parallel (fan-out), then findings are synthesized (fan-in) |
| **Hive** | The complete multi-agent team system (personas, squads, protocols, memory) |
| **Lens** | A differentiation axis injected via spawn prompt that shifts a persona's focus without creating a new persona (e.g., `operator`, `correctness`) |
| **Living Baton** | A continuously updated blackboard section (`## Relay Baton`) that captures enough state for a fresh agent to resume mid-mission after context compaction |
| **Mission** | A bounded team effort with intent, blackboard, tasks, and retrospective |
| **Squad** | A pre-designed team template for a problem type (Research, Engineering, Review, Creative, Strategy, Philosophy, Management) |
| **Blackboard** | Shared markdown workspace for stigmergic coordination |
| **Persona** | Narrative identity defining an agent's thinking style and blind spots |
| **Agent** | A Claude model instance with a persona, role, and task assignment |
| **Orchestrator** | Opus-tier agent responsible for mission framing and synthesis |
| **Productive Waiting** | Using blocked time constructively: pre-reading files, reviewing the blackboard, loading context for an upcoming phase instead of sitting idle |
| **Scrum Master** | Operational specialist: error catalog, issue tracking, crystallization, cleanup |
| **Stigmergy** | Coordination through shared environment (blackboard) rather than messaging |
| **Crystallization** | Post-mission learning spiral: HARVEST → PATTERN → DISCERNMENT → PROMOTE → CODIFY → PUBLISH |
| **Commander's Intent** | The "why" of a mission — lets agents adapt when circumstances change |
| **Stop Signal** | Adversarial challenge mechanism when an agent detects a critical issue |
| **Trace / Trace File** | A single-line JSON file written by an agent to signal phase completion; used as gates in the sequential pipeline (e.g., `design_complete.trace`) |
| **BLUF** | Bottom Line Up Front — finding format with conclusion first |
| **Breathing Space** | Pause between fan-out and synthesis for full-picture reading |
| **Quorum Sensing** | Convergence threshold: 2+ independent agents confirming a finding |
| **Return to Sangha** | Context renewal protocol: proactive disk writes (Living Baton), budget zone tracking, and hierarchical state machine to survive context compaction |
| **Budget Zone** | Context pressure indicator with 4 levels: GREEN (normal), YELLOW (high pressure, checkpoint), RED (relay readiness), CRITICAL (stop new work) |
| **Scale Request** | Structured blackboard entry proposing horizontal scaling; filed by Scrum Master, acted on by Orchestrator |
| **Dynamic Scaling** | Two-mechanism protocol for right-sizing squads: upfront parallelization analysis + mid-mission scale requests |
| **Clone** | An additional agent of the same role spawned mid-mission to share the task queue |

## Model Tiers

| Tier | Model | Used for |
|------|-------|----------|
| Specialist | sonnet | Minimum for all Hive squad roles |
| Operator | sonnet | Roles with write/edit/bash access |
| Orchestrator | opus | Mission framing, cross-agent synthesis |

Scout (haiku) is not used for Hive squad roles. Standalone agents retain their own model selections.

## Term Replacements

> Tracked vocabulary changes. When a replacement reaches "approved" status,
> it will be applied across all Hive files in a dedicated rename pass.

| Current Term | Replacement | Status | Scope | Notes |
|-------------|-------------|--------|-------|-------|
| spawn | invite | pending | All hive files | Agent creation metaphor — "invite" is more collaborative |
