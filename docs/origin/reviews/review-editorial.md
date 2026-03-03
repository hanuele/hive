# Editorial Review — v3

> Reviewer: Editorial Agent (Sonnet 4.6)
> Document: `docs/plans/hive-mind-bootstrap-plan-v3.md`
> Date: 2026-03-02

---

## Voice Inconsistencies

The document has a generally strong and intentional voice: authoritative, direct, with occasional philosophical register for the purpose sections. Most deviations are minor but worth noting.

**L81–L93 (Twelve Principles block):**
Principles 1 and 2 are written in full explanatory prose (two or three sentences each), while Principles 3–12 are one-line fragments ("A narrative 'why' generalizes better than 15 configurable fields"). This is an inconsistency of *depth* rather than tone. Either expand 3–12 to match the prose depth of 1–2, or trim 1–2 to match the brevity of 3–12. The current mix looks unfinished.

**L161 section header "The Orchestrator as Facilitator (Not Hub)":**
The parenthetical "(Not Hub)" is the only section header using this aside-style. Every other header is plain noun phrase or imperative. Minor inconsistency, easily fixed by rephrasing to "The Orchestrator Role: Facilitator, Not Hub."

**L415 (Differentiation section closing):**
> *"Differentiation is a strategic principle, not a cloning technique."*

This sentence uses italics for emphasis mid-paragraph, which is the document's standard convention. However, the sentence itself sounds more like a manifesto line than an operational note. It fits the document's philosophical register but appears abruptly here after a technical table. Consider moving it before the table as a framing statement, rather than after as a punchline.

**L581 (Shared Workspace intro):**
> *"A termite never sends a message to another termite; she deposits a pheromone-laced mud pellet."*

The gendered pronoun "she" appears once and only here. The rest of the document is entirely gender-neutral in its agent references. This is not wrong (worker termites are female), but it is a style singularity. A reader may notice it. Either add a brief parenthetical ("worker termites are female") or use the neutral "it."

**L1442–L1452 (Contemplative & Wisdom Traditions):**
This subsection deliberately shifts into a reflective, philosophical register — which is appropriate and intentional. However, the shift is abrupt following the clinical bullet-list style of the sections immediately preceding it. A one-sentence transitional statement would soften the register shift.

---

## Terminology Issues

These are the most significant editorial problems in the document. Key terms are used inconsistently across sections.

### 1. "Orchestrator" vs "Facilitator"

This is the most pervasive inconsistency.

- The persona is named **"The Orchestrator"** (L369, L372, Section header, file name `orchestrator.md`)
- The persona narrative itself calls the role a **"team facilitator"** (L375)
- Section 2 (L161) uses the header "The Orchestrator as Facilitator" — treating them as different things ("not a hub")
- Squad templates use **"Facilitator"** as the role label in tables (L460, L505) while referring to the same persona
- Section 7 uses **"Facilitator"** throughout (L914, L920, L923, L924, L931, L944)
- Section 8 uses **"Facilitator"** (L1009, L1010, L1044, L1054)
- Section 9 uses **"Facilitator"** (L1099, L1100, L1106)
- The constitution (L788) calls it "any agent may issue a stop signal" — no label used
- The Agent Tiers table (L159) uses **"Orchestrator"** as the tier/role name

**Root cause:** The distinction is meaningful (Orchestrator = the agent persona/tier; Facilitator = the functional role that persona plays) but the document does not make this distinction explicit, and then fails to apply it consistently. The reader cannot tell whether "Facilitator" and "Orchestrator" are synonyms or different concepts.

**Recommended fix:** Pick one term for use in tables and operational instructions. If the distinction is intentional, define it explicitly once in Section 2 and use it consistently thereafter. A sentence like: *"The Orchestrator persona fills the Facilitator role. These terms are used interchangeably in this document"* — or the opposite: *"'Orchestrator' names the persona; 'Facilitator' names the function. The same agent can act as Facilitator without holding the Orchestrator persona tier."*

### 2. "Stop Signal" — capitalization

The term is capitalized as **"Stop Signal"** in some places (L75, L794, L808) and lowercase as **"stop signal"** in others (L283, L285, L286, L795, L796, L800, L803, L804, L806, L809, L812, L1034, L1153).

The section header is "The Stop Signal Protocol" (L790) — title case for the protocol name, which is standard. But within body text, both forms appear in adjacent paragraphs with no apparent logic. Pick one: lowercase "stop signal" throughout body text (protocol name remains title-cased), or capitalize "Stop Signal" as a system term everywhere.

### 3. "Blackboard" — capitalization

"Blackboard" is capitalized as a proper noun in some places (L106 in diagram, L383, L634) and lowercase in others (L47, L193, L604, L636, L656). The diagram uses all-caps "ANTHILL BLACKBOARD" which is consistent with diagram style. Body text should use one convention. Recommend lowercase "blackboard" throughout body text (it's a pattern name, not a product name).

### 4. "Quorum sensing" vs "commitment threshold"

Both terms refer to the same concept — the mechanism for deciding when enough independent confirmations have accumulated to commit to a decision. They are used interchangeably without disambiguation:

- L75: "quorum sensing" (research finding)
- L85: "quorum sensing" (principle 5)
- L466, L490, L511: "Quorum sensing" as decision protocol label in squad tables
- L820: Section header is "Commitment Threshold (Quorum Sensing)" — treats them as synonyms with parenthetical
- L828–L840: The actual tables use "Proceed Quorum" and "Abandonment Quorum"
- L1072: Section header "Pattern 1: Quorum Sensing (Universal Verification)"

The parenthetical at L820 suggests awareness of the ambiguity but doesn't resolve it. Recommend: "Quorum sensing" = the biological inspiration and conceptual model. "Commitment threshold" = the operational implementation. Define this once at first use (around L820) and apply consistently.

### 5. "Commander's intent" — capitalization

Inconsistently capitalized:
- L166, L196, L383, L858: "commander's intent" (lowercase)
- L467: "Commander's intent example" (title case for label)
- L862: Section header "Commander's Intent (Every Mission)" — title case

In body text, lowercase is more appropriate for a concept/technique borrowed from military practice. The section header title case is correct. Fix instances where it appears in sentence-start contexts to ensure consistency.

### 6. Agent tier names

The Agent Tiers table (L156–L159) defines: **Scout, Specialist, Operator, Orchestrator**.

These names appear inconsistently:
- Squad templates use "Scout" and "Specialist" correctly as tier labels
- But Section 7 cost table (L975–L981) refers to "haiku for scouts" (lowercase, correct) and "subagents (not teammates)" — no tier name used
- The term "Operator" appears in squad tables (L482, L484) but only twice in the entire document outside the tier definition table
- "Orchestrator" serves double duty as both a tier name and a persona name (see issue #1 above)

---

## Duplicate Content

### 1. Independent verification stated twice (Section 4)

**L446** (universal protocol callout, immediately before squad templates):
> *"Universal protocol: Independent verification. Before any finding is synthesized, it must be verified by an agent who has not seen the original finding..."*

**L1072–L1074** (Section 9, Pattern 1):
> *"Inspired by honeybee swarm decision-making. This applies to all squads, not just the Review Squad. Any significant finding must be independently verifiable. Independent = separate context, no access to the original finding."*

These say the same thing. The cross-reference at L1074 ("This applies to all squads, not just the Review Squad") suggests awareness that it was already said — but it's restated rather than cross-referenced. Either consolidate in Section 9 and add a forward reference at L446 ("see Section 9, Pattern 1"), or keep L446 as the canonical definition and reference it from Section 9.

### 2. "No critical state in context windows" — stated twice

**L634:**
> *"If the Orchestrator fails, any agent can read this blackboard and continue the mission. No critical state lives only in an agent's context window."*

**L1140:**
> *"No agent should hold critical state that exists only in its context window."*

Identical point. The second instance (L1140) is in the "Warm Standby" pattern section. A cross-reference to Section 5 would be more efficient: "See Section 5, Blackboard structure."

### 3. Disagreement protocol note — duplicated across squad templates

**L471–L472** (Research Squad):
> *"Disagreement Protocol: If two rounds of structured debate produce no convergence..."*

**L495** (Engineering Squad):
> *"Disagreement Protocol: Same as Research Squad (see above)."*

The Engineering Squad correctly cross-references. The Review Squad template (L497–L514) has no disagreement protocol section at all — readers must infer it also follows the same rule. Add a one-line cross-reference to the Review Squad template for completeness.

### 4. Crystallization protocol described in two places

**Section 5 (L684–L728):** Full "Knowledge Crystallization Spiral" protocol with 4 steps, pattern form, etc.

**Section 8, Synthesis Protocol (L1051–L1056):** Step 6 is "CRYSTALLIZATION: Patterns observed for post-mission retrospective," and the NOTE at L1056 says: *"Step 6 (Crystallization) feeds directly into the Knowledge Crystallization Spiral (Section 5)."*

This is handled well — Section 8 correctly cross-references Section 5. Not a duplication problem. Keep as-is.

---

## Formatting Issues

### 1. Separator style — dashes vs `---`

The document uses `---` (horizontal rule) consistently between major sections. This is correct and consistent. No issue.

### 2. Code block style — inconsistent content types

The document uses fenced code blocks (triple backtick) for:
- Actual code/YAML (L549–L562, L933–L942, L1033–L1041) — appropriate
- ASCII diagrams (L103–L138, L144–L150, L426–L444) — appropriate
- Multi-line prose that could be a bulleted list (L700–L728, L877–L890, L1076–L1085, L1145–L1167) — questionable

The governance/protocol steps (e.g., L797–L812 "Stop Signal Protocol steps", L1046–L1052 "Synthesis Protocol") are formatted as code blocks but contain plain prose numbered lists. This creates a faux-technical appearance for content that is operational guidance. Consider converting these to standard numbered lists or blockquotes. It would reduce visual noise and match the formatting of similar content in the persona narratives.

### 3. Table alignment

Most tables use full column separators. The Commitment Threshold tables (L828–L840) are well-formatted. However, the Failure Taxonomy table (L1122–L1128) has extremely wide cells in the "Detection" column (L1124 for "Degraded" type is a very long inline list). Consider splitting the detection criteria into sub-bullets within the cell, or adding a "Detection Criteria" sub-table below the main taxonomy table.

### 4. Heading hierarchy

All major sections use `##` (H2). Subsections use `###` (H3). Sub-subsections use `####` (H4). This is consistent and correct throughout.

One exception: **L604** uses `###` for "Blackboard: The Mission's Living Document" and **L636** uses `###` for "Stigmergic Reading Protocol" — both are subsections of Section 5 (H2). This is correct. No issue.

### 5. Blockquote vs callout inconsistency

Some important notes use `>` blockquote syntax:
- L179: Orchestrator synthesis note
- L181: Resilience test
- L469–L471: Research Squad time-box
- L546: Terrain misclassification note

Others with equal importance use bold text inline or are embedded in prose paragraphs with no visual distinction. No consistent rule distinguishes which notes get blockquote treatment. This is a style preference issue rather than a hard error, but consistency would improve scannability.

### 6. Table in Section 10 — column width

The anti-patterns table (L1187–L1202) has 5 columns. The "Description" and "Prevention" columns contain very long text for entries 2, 5, and 12. On a narrow screen, this table will be nearly unreadable. Consider splitting into a main summary table (Pattern | Description | Signal) and a detail section for Prevention, or reducing Prevention to a one-line summary with a pointer to the relevant protocol section.

---

## Readability Issues

### 1. L1028 (Priority Levels table, P2-IMPORTANT row)

The "Delivery" cell for P2-IMPORTANT reads:
> *"Phase gate (Engineering), fan-in (Research), post-review (Review). If squad type unknown, default: every 30 min of active operation"*

This is packed into a single table cell. It should be restructured as sub-bullets or a two-part entry (primary / fallback) for readability.

### 2. L1089 (Independence warning, Pattern 1)

This is a dense paragraph:
> *"Independence warning: Structural independence (separate contexts) does not equal epistemic independence. LLM agents sharing the same training distribution can converge on the same incorrect conclusion via shared blind spots, not shared reasoning..."*

The content is important and well-written. However, at 5 sentences in one paragraph, it is the longest unbroken prose block in Section 9. A two-sentence intro + bulleted breakdown of the three remedies (different prompt framing / different evidence subset / devil's advocate framing) would improve scannability.

### 3. L1177 (Pattern 7 — quality control retrospective closing paragraph)

> *"The quality control system must be self-correcting or it ossifies. A static failure taxonomy is a debt that compounds..."*

Strong writing. But this important statement is buried at the end of a short numbered list, after the practical steps. Consider elevating it to an introductory callout before the numbered list, so the reader understands the purpose before encountering the procedure.

### 4. L1482 (Closing paragraph of Section 13)

The final paragraph of the Sources section is a single 92-word sentence. It reads well aloud but is difficult to parse on screen. Consider breaking into two sentences at the natural pause after "production deployment experience."

### 5. Section 12 (File Structure, L1314–L1387)

The file structure ASCII tree is clear and well-annotated. However, the inline comments within the tree (e.g., the persona version header block at L1328–L1334) break the tree's visual flow. Consider moving that block to a separate callout or code block immediately below the tree, linked by a note.

---

## Jargon Issues

### 1. "Stigmergy" — used extensively without definition at first use

The term "stigmergy" first appears at L47 in the Executive Summary:
> *"Environment-first coordination where the shared workspace (blackboard, traces, event log) is the primary communication medium — stigmergy over messaging."*

It is not defined here. The definition comes much later at L581:
> *"A termite never sends a message to another termite; she deposits a pheromone-laced mud pellet."*

And again with explicit naming at L636: "Stigmergic Reading Protocol."

**Fix:** Add a one-line parenthetical at first use (L47): "stigmergy (coordination through environmental traces, not direct messaging)." The full biological metaphor can remain at L581.

### 2. "BLUF" — used before it is defined

"BLUF (bottom line up front)" is first defined in Rule 5 of the Investigator persona at L253. It then appears without definition in squad templates and the roadmap. The term is defined in its first occurrence within the persona narratives, which is appropriate. However, L253 is the first definition — earlier uses in the Executive Summary (if any) would need parenthetical clarification. No earlier uses found. Status: acceptable.

### 3. "SBAR" — not expanded on first use

"SBAR" appears first at L471 in a squad template note:
> *"escalates to a human decision gate with both positions documented in SBAR format"*

It is defined in Section 8 at L1011–L1018. The first use should include the expansion: "SBAR (Situation, Background, Assessment, Recommendation)" or add a pointer: "(see Section 8: SBAR for Handoffs)."

### 4. "Auftragstaktik" — used in sources without explanation

L1430: "Auftragstaktik — German mission-type tactics: intent over orders" — correctly defined in the sources list. The concept also appears implicitly throughout the document as "commander's intent." No separate callout needed. Acceptable.

### 5. "Galaxy-brained" (Anti-Pattern 12, L1200)

> *"Galaxy-Brained Consensus — Agents reason in locally valid steps toward a collectively false conclusion..."*

"Galaxy-brained" is internet slang for a chain of individually plausible reasoning steps that leads to a manifestly wrong conclusion. The document provides a definition in the cell, so this is self-explaining. However, the slang term may date poorly. Consider whether the description alone ("Locally Valid, Collectively False Reasoning") would be clearer as the pattern name, with "Galaxy-brained Consensus" as a subtitle or alias.

### 6. "OODA Loop" (Sources, L1438)

Referenced only in the sources list: "Boyd's OODA Loop — Observe-Orient-Decide-Act, tempo advantage." The document never uses OODA Loop in the body text, so this is a sources-only reference. Acceptable — no action needed.

### 7. "Elenchus" (L1450)

> *"The elenchus: wisdom proceeds by exposing what we do not know..."*

"Elenchus" (Socratic method of cross-examination) is a philosophy term with no inline definition. The surrounding sentence provides enough context for inference, but a brief parenthetical "(the Socratic method of exposing contradiction)" would help readers unfamiliar with the term.

---

## Verdict

**PASS WITH ISSUES**

The document is substantively excellent and structurally coherent. It is the product of many expert voices that have been integrated with genuine editorial skill. The primary issues requiring resolution before this is used as a reference implementation guide:

**Must fix (high impact on usability):**
1. **Orchestrator/Facilitator terminology** — the most pervasive inconsistency. A one-sentence definition in Section 2 and consistent application thereafter will resolve it.
2. **"Stop Signal" capitalization** — choose a convention and apply it uniformly throughout body text.
3. **"Stigmergy" definition at first use** — add a parenthetical at L47.
4. **"SBAR" expansion at first use** — add expansion or cross-reference at L471.

**Should fix (medium impact on readability):**
5. **Twelve Principles inconsistent depth** — either expand 3–12 or trim 1–2.
6. **Blackboard capitalization** — pick one convention.
7. **P2-IMPORTANT table cell** — reformat as sub-bullets.
8. **Independence warning paragraph** (L1089) — break into intro + bullets.
9. **Duplicate "independent verification"** (L446 and L1072) — consolidate with cross-reference.

**Consider (low impact, style preferences):**
10. **L581 gendered pronoun** — minor, but a style singularity.
11. **L1200 "Galaxy-Brained" pattern name** — consider a plainer alias.
12. **L1450 "elenchus"** — add parenthetical.
13. **L1482 closing 92-word sentence** — split into two.
14. **Code blocks for prose lists** — convert operational steps to numbered lists.
