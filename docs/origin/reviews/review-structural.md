# Structural Review — v3

**Reviewer:** Structural Reviewer (automated)
**Date:** 2026-03-02
**Document reviewed:** `docs/plans/hive-mind-bootstrap-plan-v3.md`

---

## Cross-Reference Issues

### Issue 1 — §3 references "Section 8" for spawn protocol
**Location:** Line 206
**Text:** *"(see Section 8: Communication Standards for spawn protocol)"*
**Problem:** Section 8 (Communication Standards) does not contain a spawn protocol. The spawn protocol lives in Section 7 (Scaling & Cloning), specifically "Cloning Protocol" (lines 948–959). Section 8 describes BLUF, SBAR, Priority Levels, Synthesis, and Blackboard Hygiene — not spawning.
**Fix:** Change reference to "Section 7: Scaling & Cloning — Cloning Protocol."

---

### Issue 2 — §3 Orchestrator Rule 1 references "§6" for Commander's Intent format
**Location:** Line 384
**Text:** *"(Format: see Commander's Intent template in §6)"*
**Assessment:** This reference is accurate. Commander's Intent template is defined at lines 862–871 in Section 6. No fix needed — noting for completeness.

---

### Issue 3 — §3 Orchestrator Rule 4 references "Commitment Threshold in §6"
**Location:** Line 389
**Text:** *"(Threshold rules: see Commitment Threshold in §6)"*
**Assessment:** Accurate. Commitment Threshold table is at lines 828–832 in Section 6. No fix needed.

---

### Issue 4 — §7 references "Crystallization Protocol, Section 5"
**Location:** Line 963
**Text:** *"the retrospective step (see Crystallization Protocol, Section 5)"*
**Assessment:** Accurate. Crystallization Protocol is in Section 5 (lines 697–728). No fix needed.

---

### Issue 5 — §8 SBAR note references "Section 5" for retrospective file template
**Location:** Line 1020
**Text:** *"use the retrospective file template (Section 5)"*
**Assessment:** Accurate. The retrospective file template is in Section 5 (lines 734–765). No fix needed.

---

### Issue 6 — §8 Synthesis Protocol cross-reference to "Knowledge Crystallization Spiral (Section 5)"
**Location:** Line 1056
**Text:** *"NOTE: Step 6 (Crystallization) feeds directly into the Knowledge Crystallization Spiral (Section 5)."*
**Assessment:** Accurate. No fix needed.

---

### Issue 7 — §9 Pattern 2 footnote references "Dialectical Inquiry protocol (Section 6)"
**Location:** Line 1106
**Text:** *"it triggers the mandatory Dialectical Inquiry protocol (Section 6)"*
**Assessment:** Accurate. Dialectical Inquiry appears in the Decision Selection Matrix in Section 6 (line 853). No fix needed.

---

### Issue 8 — §6 Abandonment Quorum references "step 7 above"
**Location:** Line 842
**Text:** *"A formally closed alternative cannot be revived without new evidence submitted via the stop signal protocol's re-opening mechanism (see step 7 above)."*
**Problem:** The Stop Signal Protocol's step 7 is described at line 811. The re-opening mechanism in step 7 states: *"A claim that receives 3+ stop signals without successful refutation is formally CLOSED. It may only be re-opened if new evidence is introduced that was not available during the original challenge cycle."* This is the re-opening mechanism but the phrase "re-opening mechanism" does not appear as a heading — the reference is informal. This is marginal but the cross-reference is functional. No fix required, but a brief label on step 7 (e.g., "Re-opening mechanism") would make the reference more navigable.

---

### Issue 9 — §2 references "Section 5" for Knowledge Crystallization
**Location:** Line 177
**Text:** *"Run the Knowledge Crystallization step (see Section 5)"*
**Assessment:** Accurate. No fix needed.

---

### Issue 10 — §4 Engineering Squad "Disagreement Protocol" references "above" template
**Location:** Line 495
**Text:** *"Disagreement Protocol: Same as Research Squad (see above)."*
**Assessment:** Research Squad Disagreement Protocol is at lines 471–472, which immediately precedes the Engineering Squad section. "See above" is a valid informal reference but would break if sections are reordered. Low risk in its current position. No immediate fix required.

---

## Contradictions Found

### Contradiction 1 — Quorum count for "high stakes" decisions: 3 vs "3 independent + human gate"
**Location A:** Section 9, Pattern 1, line 1082
**Text A:** *"Three confirmations -> High-stakes decisions can proceed (+ human gate)"*
**Location B:** Section 6, Proceed Quorum table, line 832
**Text B:** *"High (irreversible or high cost) | 3 independent + human gate | 30 min"*
**Assessment:** These are consistent with each other — both require 3 independent confirmations plus a human gate. No contradiction. Confirmed consistent.

---

### Contradiction 2 — Pattern 2 quorum language vs Pattern 1 quorum language
**Location A:** Section 9, Pattern 2, line 1093
**Text A:** *"Three-agent evaluation is the standard implementation of Pattern 1 at Medium stakes (2 independent confirmations required)."*
**Location B:** Section 6, Proceed Quorum table, line 831
**Text B:** *"Medium (reversible, moderate cost) | 2 independent confirmations | 15 min"*
**Assessment:** Pattern 2 correctly states that 3 agents produce a 2-1 split where 2 independent confirmations meet Medium quorum. The math is self-consistent (3 agents, 2 agree = 2 independent confirmations). No contradiction.

---

### Contradiction 3 — Abandonment Quorum for "Medium" stakes vs Stop Signal Protocol
**Location A:** Section 6, Abandonment Quorum table, line 839
**Text A:** *"Medium | 3 independent | Alternative formally closed; log for retrospective"*
**Location B:** Section 9, Pattern 2, lines 1097–1103
**Text B:** The 2-1 split in Pattern 2 treats the dissenter as issuing a stop signal — with 1 independent dissent and 2 in agreement, the dissenter alone can trigger re-evaluation. But the Abandonment Quorum table says Medium stakes requires 3 independent stop signals to close an alternative.
**Problem:** There is a genuine tension here. Pattern 2 (at Medium stakes) says a single dissenting stop signal with evidence triggers re-evaluation. Abandonment Quorum says it takes 3 independent stop signals to formally close an alternative at Medium stakes. These operate at different levels (re-evaluation vs closure) but the document does not make this distinction explicit, and a reader could interpret Pattern 2's "2-1 triggers re-evaluation" as either closing or not closing an alternative. The relationship between "re-evaluation triggered by one stop signal" and "formal closure requiring 3 stop signals" is underdefined.
**Fix:** In Pattern 2, add a clarifying note: "A single dissenting stop signal triggers re-evaluation (not formal closure). Formal closure of the alternative requires meeting the Abandonment Quorum threshold (Section 6)."

---

### Contradiction 4 — Orchestrator tier: Specialist in squad templates vs Opus in Agent Tiers table
**Location A:** Section 2, Agent Tiers table, line 159
**Text A:** *"Orchestrator | opus | Full + Team tools | Mission framing, synthesis, facilitation | $$$"*
**Location B:** Section 4, Research Squad table, line 460
**Text B:** *"Facilitator | Orchestrator | Specialist | Frames question, writes intent, synthesizes findings"*
**Location C:** Section 4, Review Squad table, line 505
**Text C:** *"Coordinator | Orchestrator | Specialist | Manages review, synthesizes findings"*
**Problem:** The Agent Tiers table assigns the Orchestrator persona to the Opus model tier (labeled "Orchestrator"). The squad templates assign the Orchestrator persona to the "Specialist" tier (Sonnet). These are materially different: Opus is the most expensive tier ($$$), Sonnet is medium cost ($$). The squad templates appear to deliberately downgrade the Orchestrator to Specialist for Research and Review squads, but no rationale is given for when to use Opus vs Sonnet for an Orchestrator role.
**Fix:** Either (a) add a note to the squad templates explaining when to assign Orchestrator-persona to Specialist tier vs the Orchestrator tier, or (b) add a column or note to the Agent Tiers table clarifying that the Orchestrator tier is the "full mission" variant and Specialist-tier Orchestrators are appropriate for sub-squad facilitation.

---

### Contradiction 5 — Engineering Squad Orchestration: "Sequential" but no Orchestrator role listed
**Location A:** Section 4, Engineering Squad, line 489
**Text A:** *"Orchestration: Sequential (plan -> implement -> test -> security review)"*
**Location B:** Section 4, Engineering Squad role table, lines 480–485
**Text B:** Roles listed are: Tech Lead (Architect), Implementer (Architect builder variant), Tester (Challenger), Security (optional Challenger), Platform (optional Investigator). No Orchestrator role is listed.
**Problem:** The Research Squad and Review Squad both have an explicit Facilitator/Coordinator role (Orchestrator persona). The Engineering Squad has a "Tech Lead" (Architect persona) who decides but no Orchestrator. The document implies the Tech Lead also performs facilitation, but this is never stated explicitly. This is a design choice that deserves acknowledgment rather than silence — is the Engineering Squad intentionally Orchestrator-free, or is this an oversight?
**Fix:** Add a note to the Engineering Squad template: "This squad type does not include an Orchestrator-persona agent. The Tech Lead (Architect) assumes facilitation duties. For large or multi-squad engineering missions, consider adding an Orchestrator."

---

## Flow Issues

### Flow Issue 1 — Terrain analysis introduced before it's defined
**Location:** Line 423 (Section 4 opens with Terrain Analysis)
**Assessment:** The Table of Contents correctly lists Section 4 as "Squad Templates & Terrain-Adaptive Composition," so the placement is announced. However, a first-time reader encounters "Terrain Analysis" (Section 4) before seeing any explanation of *who* performs terrain analysis or *when* — that context (Orchestrator's role, mission lifecycle) is in Section 2 and Section 6. The Section 4 opening note says "Instead of choosing from a menu of templates, the system analyzes the mission along 4 axes" but doesn't say *who* does the analysis. This is implicitly answered by Section 6's Commander's Intent and the Orchestrator persona but is never explicit.
**Fix:** Add one sentence to the Section 4 opening: "The Orchestrator performs terrain analysis before team assembly and documents the result in the Commander's Intent."

---

### Flow Issue 2 — Stop Signal Protocol defined in §6, but Challenger persona (§3) references it as "(See §6: Stop Signal Protocol)"
**Location:** Line 285 (Challenger Rule 3)
**Assessment:** This is a forward reference — the persona in Section 3 points to Section 6 content not yet defined for the reader. Forward references are unavoidable in a modular document, and the reference is correctly labeled. Acceptable. No fix required.

---

### Flow Issue 3 — Crystallization Spiral described in §5, but the term "crystallization" first appears in §2 without definition
**Location:** Line 177 (Section 2, Orchestrator end-of-mission duties)
**Text:** *"Run the Knowledge Crystallization step (see Section 5)"*
**Assessment:** The forward reference is labeled, but the reader encounters "Knowledge Crystallization" without any context in Section 2. This is a minor flow friction in an otherwise well-structured document. Acceptable given the cross-reference, but a one-line definition in Section 2 would smooth the reader experience.
**Fix (optional):** Add after "Run the Knowledge Crystallization step (see Section 5)": *"(the process of promoting observations from the event log into documented patterns and rules)"*

---

### Flow Issue 4 — Purpose statement appears before Table of Contents without numbering
**Location:** Lines 13–17 (Purpose section)
**Assessment:** The Purpose section is unnumbered and not in the Table of Contents. This is an intentional design choice (purpose as meta-statement, not a numbered section), but a reader scanning the ToC will not find "Purpose." Acceptable as a design decision; the document header makes it visible.

---

## Table Inconsistencies

### Table Issue 1 — Agent Tiers table: "Orchestrator" tier name duplicates persona name
**Location:** Line 159 (Agent Tiers table, last row)
**Problem:** The tier is named "Orchestrator" and the persona is also named "Orchestrator." This naming collision creates ambiguity. In the Engineering Squad table (line 460), "Orchestrator" in the Tier column could mean "uses the Orchestrator tier model" or "uses the Orchestrator persona." The squad templates use "Tier" column to mean the Agent Tier (Scout/Specialist/Operator), but in practice the Orchestrator persona is placed in the "Specialist" tier for squad templates, not in the "Orchestrator" tier. The "Orchestrator" tier exists to say "use Opus" but the word is doing double duty.
**Fix:** Rename the tier to "Lead" or "Mission Lead" to distinguish the model tier from the persona role. Update the Tiers table and all references.

---

### Table Issue 2 — Composition Rules table: inconsistent column header capitalization
**Location:** Lines 518–524
**Problem:** The column header "Squad Type" uses title case, but the entries use bold formatting (`**Focused Build**`). This is consistent within the table. No issue.

---

### Table Issue 3 — Cost Management table: missing column for "Risk/Notes"
**Location:** Lines 975–981
**Assessment:** The table has Strategy, Savings, Latency Impact, When. No inconsistency with itself, but the "Pre-approve permissions" row entry under "Savings" says "Eliminates prompt overhead" without specifying what kind of overhead or a percentage. Other rows give percentages (80%, 40%). Minor inconsistency in specificity but not a structural issue.

---

### Table Issue 4 — Priority Levels table: P2-IMPORTANT Sync Point entry is very long
**Location:** Line 1028
**Problem:** The P2-IMPORTANT Sync Point entry reads: *"Phase gate (Engineering), fan-in (Research), post-review (Review). If squad type unknown, default: every 30 min of active operation"* — this is significantly longer than the other entries and disrupts the table's visual balance. Structural concern is minor; the content is valid.
**Fix (optional):** Move the "If squad type unknown" clause to a footnote or note below the table to improve readability.

---

### Table Issue 5 — Failure Taxonomy table (Pattern 4): column header "---" in `| Failure Type |---|---|---|`
**Location:** Line 1122
**Problem:** The table header separator row uses `|---|---|---|` with no space padding, while the surrounding tables use `|------|------|------|` style. This is a Markdown formatting inconsistency and may render differently across renderers.
**Fix:** Standardize separator to `| --- | --- | --- | --- |` or with dashes matching column width.

---

## Numbering Issues

### Numbering Issue 1 — Design Principles: "The Twelve Principles" heading but principles are numbered 1–12
**Location:** Line 79 (heading) and lines 81–92 (principles list)
**Assessment:** Heading says "The Twelve Principles" and the list contains items 1 through 12. Count: 12 items. Accurate. No issue.

---

### Numbering Issue 2 — Anti-Patterns table: numbered 1–14 but section heading says "Top 11" in v2; in v3 it's "Known Failure Modes"
**Location:** Lines 1183–1202 (table)
**Assessment:** The table correctly numbers anti-patterns 1–14. The Changelog (line 1564) notes the section was renamed from "The Top 11 Failure Modes" to "Known Failure Modes (Incomplete by Design)." There is no residual "11" reference in the v3 section heading. No issue.

---

### Numbering Issue 3 — Crystallization Protocol steps numbered 1–4 but labeled as STEP 1–STEP 4
**Location:** Lines 700–728
**Assessment:** Steps are correctly labeled STEP 1 through STEP 4 in sequence. No issue.

---

### Numbering Issue 4 — Quality Control patterns: Pattern 1 through Pattern 7, but Pattern 4 contains 5 failure types and Pattern 7 is a retrospective, not a verification pattern
**Location:** Lines 1072–1177
**Assessment:** The pattern naming is consistent (Pattern 1–7) but the patterns are conceptually heterogeneous — some are verification techniques (quorum sensing, layered validation), one is a failure taxonomy (Pattern 4), one is a warm standby mechanism (Pattern 5), and one is a self-correcting meta-process (Pattern 7). This is not a numbering error but a category coherence question. The section heading "Quality Control & Failure Taxonomy" does cover this range. No fix required, but readers may expect more homogeneous items under a "patterns" label.

---

## Missing Pieces

### Missing Piece 1 — No "How to spawn your first squad" content in the document itself
**Location:** Section 11, Phase 1 deliverables, line 1251
**Text:** *"Write first-use guide: 'How to Spawn Your First Squad'"*
**Problem:** The first-use guide is listed as a Phase 1 deliverable but is not included in the document. This is expected for a bootstrap plan (the guide will be created during implementation), but the file structure in Section 12 does not include a `README.md` entry for this guide in the `squads/` directory — it does include `README.md` at the `.claude/hive/` root (line 1318), which presumably will be this guide. The deliverable is acknowledged but not yet written. This is appropriate for a plan document; noting for completeness.

---

### Missing Piece 2 — `PROPAGATION.md` mentioned in file structure but never defined
**Location:** Section 12, line 1355–1356
**Text:** *"`PROPAGATION.md` — Change procedure: how to update personas when constitution changes (prevents silent divergence)"*
**Problem:** The file is listed in the file structure with a one-line description, but no content, template, or protocol for this file is defined anywhere in the document. Section 6 (Governance) defines the constitution content but says nothing about how to propagate changes. This is a genuine gap: the file is promised, its purpose is stated, but its content is never specified.
**Fix:** Either add a subsection to Section 6 or Section 12 describing the PROPAGATION procedure, or explicitly defer it (e.g., "content to be defined during Phase 2 implementation").

---

### Missing Piece 3 — Verification scenarios listed in file structure but never defined
**Location:** Section 12, lines 1383–1386
**Text:** Files: `stop-signal-test.md`, `failure-taxonomy-test.md`, `crystallization-test.md`, `quality-baseline.md`
**Problem:** These four files are listed but their content/format is never specified. Section 11 (Implementation Roadmap) does not include tasks to define these test scenarios. If these are meant to be implementation artifacts (created during Phase 2), that should be made explicit. If they are meant to be guidance documents written alongside the plan, their absence is a gap.
**Fix:** Add to Phase 2 deliverables: "Define content for `_verification/` test scenarios." Or note explicitly that these are implementation artifacts.

---

### Missing Piece 4 — "Deferred Templates" section mentions Creative, Strategy, Philosophy, Management squads
**Location:** Section 4, lines 565–574 (Deferred Templates table)
**Problem:** Composition Rules table (lines 518–524) includes a "Strategy" row as a valid composition option. But the Deferred Templates section marks the Strategy Squad as deferred. The Composition Rules table implies Strategy is an available template, while the Deferred Templates section implies it is not yet built.
**Specific conflict:** Composition Rules table line 524: `"High uncertainty, irreversible, broad, high stakes | **Strategy** | 4-5 | Orchestrator + Investigator + Innovator + Challenger + Architect"` — this makes "Strategy" appear as a built template. But Section 4's Deferred Templates table lists it as deferred.
**Fix:** Add a note to the Strategy row in the Composition Rules table: "*(See Deferred Templates — build when triggered by 3+ qualifying missions)*" Or, given that the role-to-agent mapping is fully specified in the table, reframe Strategy as a composition recipe rather than a separate template, which resolves the contradiction.

---

### Missing Piece 5 — No explicit protocol for how to update the Anthill Blackboard (`anthill.md`)
**Location:** Section 2 (lines 106–110) introduces the Anthill Blackboard; Section 5 (line 601) lists it in the file structure.
**Problem:** The document explains what the Anthill Blackboard contains ("active missions, top-level decisions, stop signals") and where it lives, but provides no format/template for it — unlike the per-mission blackboard which has a detailed template at lines 608–632. The Anthill Blackboard is the cross-tribe coordination mechanism, which is arguably the most critical shared artifact in multi-squad deployments, yet it has no defined structure.
**Fix:** Add a subsection in Section 5 (or Section 2) with a template for `anthill.md`, analogous to the per-mission blackboard template.

---

## Verdict

**PASS WITH ISSUES**

The document is structurally sound: the 13 sections are logically ordered, concepts are mostly defined before use, tables are internally consistent, and the numbering is correct throughout. The document reads as a coherent, complete design specification.

**Issues requiring fixes before implementation begins:**

| Priority | Issue | Location |
|----------|-------|----------|
| HIGH | §3 references Section 8 for spawn protocol — should be Section 7 | Line 206 |
| HIGH | Orchestrator tier name collides with Orchestrator persona name (Table Issue 1 + Contradiction 4) | Lines 154–159, 460, 505 |
| HIGH | Strategy Squad appears as both "available" in Composition Rules and "deferred" in Deferred Templates (Missing Piece 4) | Lines 524, 568 |
| HIGH | `PROPAGATION.md` promised but never defined (Missing Piece 2) | Line 1355 |
| MEDIUM | Engineering Squad has no Orchestrator — needs explicit acknowledgment (Contradiction 5) | Lines 479–495 |
| MEDIUM | Anthill Blackboard has no format/template (Missing Piece 5) | Lines 106–110 |
| MEDIUM | Pattern 2 / Abandonment Quorum tension needs clarifying note (Contradiction 3) | Lines 1097–1103 |
| LOW | `_verification/` test scenario files not in Phase 2 deliverables (Missing Piece 3) | Lines 1383–1386 |
| LOW | Terrain analysis performer not named in Section 4 opening (Flow Issue 1) | Line 423 |
| LOW | Stop Signal Protocol step 7 label missing for cross-reference clarity (Issue 8) | Line 811 |
