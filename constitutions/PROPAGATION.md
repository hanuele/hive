# Constitution Propagation Procedure

> When a constitution changes, affected personas must be updated. This procedure prevents silent divergence between governance documents and the personas that embed them.

## Procedure

1. **ANNOUNCE:** Log the constitution change in `memory/hive-status.md` with date, author, and rationale.

2. **DIFF:** Identify which persona rules reference the changed principle. Cross-reference each persona's "Your Rules" and "When You Escalate" sections against the modified constitutional text.

3. **UPDATE:** Modify affected persona files to reflect the new principle. Bump `persona_version` in the YAML header. Add a `basis` note referencing the constitution change.

4. **VERIFY:** Run a minimal comprehension check. Spawn ONE agent, give it the
   updated constitution text, and pose a 3-question probe that exercises the
   changed principle — for example:
   - *What does this principle require you to do when {situation the change
     addresses}?*
   - *Name one action it now forbids (or newly permits).*
   - *If it conflicts with a persona rule you hold, which wins, and why?*

   Write the agent's answers and a pass/fail judgment to
   `memory/active/traces/propagation-check-{YYYY-MM-DD}.md`. Pass = all three
   answers reflect the changed text. A fail sends you back to step 3 (the
   persona update did not land) before the change is considered propagated.

5. **ARCHIVE:** Record the propagation in the next retrospective under "Proposed Rule Changes."

## When This Applies

- Any change to `universal.md` (constitutional principles)
- Any change to `stop-signal.md` that modifies behavior expectations
- Any change to `commitment-threshold.md` that modifies quorum rules
- Addition of new constitutional documents

## Notes

- Persona files embed constitutional principles by reference, not by copy. The reference format is: `(See constitutions/universal.md, Principle N)`
- If a persona rule conflicts with an updated constitutional principle, the constitution takes precedence.
- The comprehension probe in step 4 is deliberately small — one agent, three
  questions. It is a smoke test that the change is understood, not a full
  regression mission. Deepen it only if a propagation later proves to have
  silently failed.
