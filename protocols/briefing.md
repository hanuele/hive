# Briefing Protocol

> Distill large blackboard documents (>10KB) into 2-3KB actionable summaries.

## When to Generate

- When a blackboard exceeds 10KB
- After a Research or Review Squad completes and the Orchestrator/human
  needs a quick digest before deciding next steps
- When findings need to cross squad boundaries (e.g., research squad output
  consumed by engineering squad)

## Who Generates

The **Scrum Master** generates briefings as part of operational support.
If no Scrum Master is active, the **Orchestrator** or **human** generates.

## Format

```markdown
## Briefing: {mission-name}
<!-- DIGEST, not replacement. Full blackboard: {path} -->

### Bottom Line
{1-2 sentences: what did we learn, and what should we do?}

### Key Findings (max 7)
1. {Finding} — {one-line evidence ref}
2. ...

### Blocking Issues
1. {Issue} — {who resolves, what's needed}

### Actionable Next Steps
1. {Step} — {owner if known}

### Signal Losses
- {What this briefing omits, with pointer to full blackboard section}
```

## Rules

1. **Max 7 key findings.** Miller's number for working memory. If there
   are more than 7, prioritize by actionability and confidence.
2. **Signal Losses section is mandatory.** Name what was cut. This prevents
   lossy compression from silently dropping important context.
3. **A briefing is a digest, not a replacement.** Always link to the full
   blackboard. Never delete the original after generating a briefing.
4. **One briefing per mission phase.** Don't generate a new briefing every
   time the blackboard changes — only at phase transitions.

## Where to Write

- **Same blackboard:** Append to `## Briefing` section on the mission blackboard
- **Cross-squad consumption:** Write as separate `{mission}-briefing.md` in
  the blackboard directory, so the consuming squad can read it without
  loading the full source blackboard
