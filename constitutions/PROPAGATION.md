# Constitution Propagation Procedure

> When a constitution changes, affected personas must be updated. This procedure prevents silent divergence between governance documents and the personas that embed them.

## Procedure

1. **ANNOUNCE:** Log the constitution change in `memory/hive-status.md` with date, author, and rationale.

2. **DIFF:** Identify which persona rules reference the changed principle. Cross-reference each persona's "Your Rules" and "When You Escalate" sections against the modified constitutional text.

3. **UPDATE:** Modify affected persona files to reflect the new principle. Bump `persona_version` in the YAML header. Add a `basis` note referencing the constitution change.

4. **VERIFY:** Spawn a test mission to confirm updated personas behave correctly under the modified governance. Minimum: one scenario that exercises the changed principle.

5. **ARCHIVE:** Record the propagation in the next retrospective under "Proposed Rule Changes."

## When This Applies

- Any change to `universal.md` (constitutional principles)
- Any change to `stop-signal.md` that modifies behavior expectations
- Any change to `commitment-threshold.md` that modifies quorum rules
- Addition of new constitutional documents

## Notes

- Persona files embed constitutional principles by reference, not by copy. The reference format is: `(See constitutions/universal.md, Principle N)`
- If a persona rule conflicts with an updated constitutional principle, the constitution takes precedence.
- Full content to be refined during Phase 2 implementation based on operational experience.
