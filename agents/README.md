# agents/ — The Installable Form of the Personas

> `personas/` is the narrative source of truth. `agents/` is the same six roles
> compiled into Claude Code's custom-agent format so the harness can spawn them
> by type. Two views of one thing: the persona explains *why the role thinks
> the way it does*; the agent is *that role made executable*.

## What lives here

One file per role, each a Claude Code custom agent: `investigator.md`,
`challenger.md`, `architect.md`, `innovator.md`, `orchestrator.md`,
`scrum-master.md`. Each has YAML frontmatter (`name`, `description` including
when-to-use, `tools` allowlist, `model: inherit`) and a markdown body that is
the role's **executable system prompt** — a faithful compression of the
matching `personas/*.md` narrative, with the metacognitive hooks preserved
(the Investigator's "notice when a finding feels confirming," the Challenger's
"notice when a finding feels threatening," and so on). Those hooks are the
load-bearing part; they are why a narrative persona generalizes where a trait
list does not (see `personas/_schema-reference.md`).

## Installing

Copy this directory into your Claude Code agents directory so the six types
become spawnable:

```bash
cp agents/*.md .claude/agents/
```

Once installed, spawn a role by its `name` (also giving the running agent an
addressable handle):

```
Agent(subagent_type="investigator", name="investigator-alpha",
      prompt="<charge: mission, blackboard path, assigned lens>")
```

The bootstrap step in `ONBOARDING.md` performs this copy for you.

## Tools, by role

| Agent | Tools | Why |
|-------|-------|-----|
| investigator | Read, Grep, Glob, Bash | Read-only over the codebase; writes findings/traces to the blackboard via Bash append. |
| challenger | Read, Grep, Glob, Bash | Same — reviews, does not modify source. |
| innovator | Read, Grep, Glob, Bash | Generative; writes ideas to the blackboard, not to source. |
| architect | Read, Grep, Glob, Bash, Write, Edit | Designer produces plans; Implementer (operator lens) writes/edits code. |
| orchestrator | Read, Grep, Glob, Bash, Write, Edit | Frames the Intent and writes synthesis; usually the session lead fills this seat. |
| scrum-master | Read, Grep, Glob, Bash, Write | Operational writes (catalog, blackboard, session logs) — never code edits. |

"Read-only" means read-only with respect to source code. Every agent still
writes its findings and checkpoints to the blackboard — for read-only agents
that write channel is Bash append, which keeps them inside the session's
working directories (subagents cannot write outside them). Lenses
(correctness, security, Socratic, operator, …) are injected per-spawn in the
charge, not baked into the agent file — one Challenger agent serves every
Challenger lens.

## Keeping the two in sync

`personas/` and `agents/` must not drift. The persona is authoritative for
*intent*; the agent is authoritative for *what the harness runs*. When you
change one, change the other in the same commit:

- Edit a persona's rules, blind spots, or metacognitive hooks → update the
  agent body to match.
- Change an agent's `tools` or `description` → confirm the persona still
  describes the same role and capabilities.

A quick check: each agent body should be a lossless-in-intent compression of
its persona — nothing in the agent that contradicts the persona, and every
persona rule represented (possibly condensed) in the agent. `scrum-master.md`
is the one role kept **generic** here (placeholders per
`bootstrap/DOMAIN-INJECTION-CHECKLIST.md`); its persona narrative may carry a
reference project's flavor, but the installable agent must stay project-neutral.
