# Hive Glossary

> Canonical terminology for the Hive multi-agent system.

## Core Terms

| Term | Definition |
|------|-----------|
| **Hive** | The complete multi-agent team system (personas, squads, protocols, memory) |
| **Mission** | A bounded team effort with intent, blackboard, tasks, and retrospective |
| **Squad** | A pre-designed team template for a problem type (Research, Engineering, Review) |
| **Blackboard** | Shared markdown workspace for stigmergic coordination |
| **Persona** | Narrative identity defining an agent's thinking style and blind spots |
| **Agent** | A Claude model instance with a persona, role, and task assignment |
| **Orchestrator** | Opus-tier agent responsible for mission framing and synthesis |
| **Scrum Master** | Operational specialist: error catalog, issue tracking, crystallization, cleanup |
| **Stigmergy** | Coordination through shared environment (blackboard) rather than messaging |
| **Crystallization** | Post-mission learning spiral: HARVEST → PATTERN → DISCERNMENT → PROMOTE |
| **Commander's Intent** | The "why" of a mission — lets agents adapt when circumstances change |
| **Stop Signal** | Adversarial challenge mechanism when an agent detects a critical issue |
| **BLUF** | Bottom Line Up Front — finding format with conclusion first |
| **Breathing Space** | Pause between fan-out and synthesis for full-picture reading |
| **Quorum Sensing** | Convergence threshold: 2+ independent agents confirming a finding |

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
