# SPEC-AMEND-001: Amendments to SPEC-001 … SPEC-007 + SPEC-001B (Phase-1 Reference Implementations)

**Document ID:** `SPEC-AMEND-001`
**Applies to:** `SPEC-001` … `SPEC-009` and the *Comprehensive Specification Audit and Review* PDF (the nine uploaded spec documents).
**Status:** Draft for architect review.
**How to apply:** Each `AMEND-xx` section replaces the cited section of the base spec verbatim. Sections not cited are unchanged. SPEC-008/SPEC-009 need no text changes: their production laws (five-valued epistemic `may()`, refusal prefixes) become normative in SPEC-001 via AMEND-01, which resolves the drift at its root.

> **Repository note (hanuele/hive):** this repo's `qm-hsm-mcp/` already contains working Phase-1
> implementations (`src/hsm/qmXmlParser.ts`, `src/hsm/lcaEngine.ts`, `src/rules/yamlLatticeCompiler.ts`,
> `models/*.qm`, `rules/MONOTONIC_YAML_RULES_BUNDLE.yaml`), so AMEND-08 is the spec-level reference for the
> uploaded spec documents rather than new code to write. Verified against the repo: the Gate A
> overwrite-instead-of-intersect bug (B3) is present at `qm-hsm-mcp/src/mcp/orchestrator.ts:57` —
> AMEND-03.3 is the drop-in fix. `src/graph/lineageWriter.ts` already acquires `p._writeLock`; the
> SPEC-001 §2.3 / SPEC-002 §3 Cypher in the uploaded spec documents still lacks it (C1) —
> AMEND-01.2 / AMEND-02 supply the corrected patterns.

## 0. Conventions introduced by this amendment

- **Event IDs:** all `(:TemporalEvent)` and shadow events use **UUIDv7** (time-sortable), generated server-side (e.g. `uuidv7()`; `crypto.randomUUID()` alone is v4 and not time-sortable). SPEC-005's `SHADOW-EVT-<branch>-<n>` scheme is replaced by UUIDv7 + an `origin` property (`"TRUNK" | "SHADOW_PROMOTED" | "COUNTERFACTUAL"`).
- **`MayDecision` (five-valued, per SPEC-009 `/rule-integration`):** `decision: "yes" | "yes_if" | "ask" | "no" | "gap"`. `allow: boolean` is retained as a derived field (`decision === "yes" || "yes_if"`) for backward compatibility with the git hook and existing tests. An **unobserved** fact read by a rule caps the answer to `"ask"`, never `"no"` (SPEC-009 B2 relevance cap). `denyReason` uses the refusal prefix `[<enforcerId> · <rulingId | "no ruling linked">] REFUSED: ...`.
- **Refusal prefix helper:** `formatRefusalPrefix(enforcerId, rulingId, reason)` (SPEC-009 F7 / `lib/refusal_prefix.py`).

## 0.1 Finding → amendment map

| Review finding | Resolved by |
| --- | --- |
| A1 boolean vs five-valued `may()` | AMEND-01 §5.1/§5.2/§6, AMEND-03 §5 |
| A2 StageGate path + `stewardAuditStatus` drift | AMEND-01 §2.1, AMEND-02 |
| A3 `SIG_CONTRACT_DRIFT` vs `SIG_REOPEN` | AMEND-05 |
| A4 `cypherChecksum` vs `prevHash`/`chainHash` | AMEND-01 §2.1/§2.3, AMEND-02, AMEND-03 §2.2/§3 |
| A5 shadow splice missing + hash rebasing | AMEND-05 §2.3 (new Cypher) |
| A6 `Level` schema missing tolerance props; `updatedAt` | AMEND-01 §2.1 |
| A7 `md.project` missing from tool table | AMEND-01 §6 |
| A8 SPEC-006 time-travel missing; disposition drift | AMEND-06 |
| A9 event-ID scheme drift | AMEND-01 §2.1, Conventions §0 |
| B1 CTL linter composite targets / missing LINT-01, LINT-03 | AMEND-04 |
| B2 `QTimeEvt` disarm race | AMEND-04 |
| B3 Gate A overwrite-instead-of-intersect | AMEND-03 §5 |
| B4 CPM hardcoded `peakConcurrentSisters`, float epsilon | AMEND-06 |
| B5 postLIFO double-unshift | AMEND-07 (+ `recallOne` in AMEND-04) |
| B6 `timestamp` not in hash chain | AMEND-03 §2.2/§3 |
| C1 missing `(:Plan)` write lock in SPEC-001 §2.3 / SPEC-002 §3 | AMEND-01 §2.3, AMEND-02 |
| C2 unlabeled `MATCH (target {id})` | AMEND-01 §2.1 (`:ActiveObject`), AMEND-03 §3 |
| D missing Phase-1 reference code + fixtures | AMEND-08 (SPEC-001B) |

---

## AMEND-01 — SPEC-001 amendments

### AMEND-01.1 — replaces SPEC-001 §2.1 (schema)

```cypher
// 0. Shared base label for all mutable Active Objects (enables indexed lookup;
//    constraint declared in SPEC-003 §2.1, see AMEND-03.1)
//    (:Plan:ActiveObject), (:Level:ActiveObject), (:StageGate:ActiveObject), (:PlanItem:ActiveObject)

// 1. Structural Hierarchy Nodes
(:Plan:ActiveObject {
  id: STRING,                 // e.g., "PLAN-CORE-2026"
  title: STRING,
  hsmModelId: STRING,
  hsmStatePath: STRING,       // e.g., "/top/Operational/Active"
  yamlRulesetHash: STRING,
  createdAt: DATETIME,
  governanceMode: STRING      // "EXPLORATORY_GROUNDWORK" | "ORDERED_DELIVERY" (SPEC-006)
})

(:Level:ActiveObject {
  id: STRING,                 // e.g., "LVL-2"
  planId: STRING,
  index: INTEGER,
  title: STRING,
  horizonMode: STRING,        // "COMPLETED" | "ACTIVE" | "ROLLING_LOOKAHEAD" | "FUZZY_LOCKED"
  hsmStatePath: STRING,
  // --- added by AMEND-01 (A6): props used by SPEC-002 §2/§4 tolerance model ---
  plannedDays: INTEGER,
  elapsedDays: INTEGER,
  timeToleranceDays: INTEGER,
  tokenBudgetMax: INTEGER,
  tokenBurnCurrent: INTEGER,
  tokenTolerancePct: FLOAT,  // e.g., 0.10 for +10%
  minStageCoveragePct: FLOAT, // stage quality floor (maps to R_eff(L).min_test_coverage_pct in SPEC-002 §2)
  yamlRulesPath: STRING
})

(:StageGate:ActiveObject {
  id: STRING,                 // e.g., "G2"
  fromLevelId: STRING,
  toLevelId: STRING,
  // --- aligned with SPEC-002 (A2) ---
  hsmStatePath: STRING,       // "/top/GateGovernance/Locked" | "/top/GateGovernance/Auditing"
                              // | "/top/GateGovernance/ReadyForSignOff" | "/top/GateGovernance/ExceptionEscalated"
                              // | "/top/SignedOff"
  stewardAuditStatus: STRING, // "PASS" | "BLOCKED_EXCEPTION" | "PENDING" | "SIGNED_OFF"
  signedOffAt: DATETIME
})

(:PlanItem:ActiveObject {
  id: STRING,                 // e.g., "L2.2"
  levelId: STRING,
  title: STRING,
  hsmModelId: STRING,
  hsmStatePath: STRING,
  yamlRulesPath: STRING,
  testCoveragePct: FLOAT,
  openBlockersCount: INTEGER,
  prApprovalsCount: INTEGER,
  cleanWorktree: BOOLEAN,
  ciGreen: BOOLEAN,
  qmAstLintPass: BOOLEAN,
  updatedAt: DATETIME         // --- added by AMEND-01 (A6) ---
})

(:Task {
  id: STRING,
  itemId: STRING,
  title: STRING,
  kanbanState: STRING         // "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED"
})

// 2. Actor & Session Nodes
(:AgentSession {
  id: STRING,
  agentType: STRING,          // "CLAUDE_WORKER" | "STEWARD" | "HUMAN_PM"
  status: STRING,             // "ACTIVE" | "SUSPENDED" | "TERMINATED"
  worktreeBranch: STRING
})

// 3. Conserved Temporal & Comms Nodes (Append-Only)
(:TemporalEvent {
  id: STRING,                 // UUIDv7 (time-sortable), generated server-side (A9)
  timestamp: DATETIME,
  mcpVerb: STRING,
  signal: STRING,
  fromState: STRING,
  toState: STRING,
  lcaState: STRING,
  entryExitTrace: LIST<STRING>,
  // --- aligned with SPEC-003 §2.2 (A4): replaces cypherChecksum ---
  prevHash: STRING,           // chainHash of predecessor, or "GENESIS_0000000000000000"
  chainHash: STRING,          // SHA-256 per SPEC-003 §2.2 (incl. timestamp, AMEND-03.2)
  origin: STRING              // "TRUNK" | "SHADOW_PROMOTED" | "COUNTERFACTUAL" (AMEND-05)
})

(:CommsMessage {
  id: STRING,                 // UUIDv7
  timestamp: DATETIME,
  body: STRING,
  stampedHsmState: STRING,
  attachedSignal: STRING,
  channelTopic: STRING
})
```

Relationships from SPEC-001 §2.2 are unchanged, plus (AMEND-05):

```cypher
(:PlanItem)-[:COUNTERFACTUAL_REJECTED {branchId: STRING, reason: STRING}]->(:TemporalEvent)
```

### AMEND-01.2 — replaces SPEC-001 §2.3 (atomic lineage append; adds write lock + hash chain, C1/A4)

Every mutation **must** execute this pattern inside a single Neo4j write transaction. The `SET p._writeLock` step acquires a Neo4j lock on the `(:Plan)` node that is held until commit, serializing concurrent writers so the `[:PREV_EVENT]` chain can never fork:

```cypher
MATCH (p:Plan {id: $planId})
SET p._writeLock = $eventUuidV7          // write lock BEFORE reading HEAD_EVENT (C1)
WITH p
MATCH (s:AgentSession {id: $sessionId})
MATCH (target:ActiveObject {id: $itemId}) // labeled match -> uses ao_id_unique (C2)
OPTIONAL MATCH (p)-[oldHeadRel:HEAD_EVENT]->(prevEvt:TemporalEvent)

SET target.hsmStatePath = $toState,
    target.updatedAt = datetime($timestampIso)

CREATE (newEvt:TemporalEvent {
  id: $eventUuidV7,
  timestamp: datetime($timestampIso),
  mcpVerb: $mcpVerb,
  signal: $signal,
  fromState: $fromState,
  toState: $toState,
  lcaState: $lcaState,
  entryExitTrace: $trace,
  prevHash: coalesce(prevEvt.chainHash, "GENESIS_0000000000000000"),
  chainHash: $chainHash,                  // computed server-side per SPEC-003 §2.2 (AMEND-03.2)
  origin: "TRUNK"
})

DELETE oldHeadRel
CREATE (p)-[:HEAD_EVENT]->(newEvt)
FOREACH (_ IN CASE WHEN prevEvt IS NOT NULL THEN [1] ELSE [] END |
  CREATE (newEvt)-[:PREV_EVENT]->(prevEvt)
)
CREATE (s)-[:EXECUTED_EVENT]->(newEvt)
CREATE (newEvt)-[:MUTATED_TARGET]->(target)
RETURN newEvt
```

### AMEND-01.3 — replaces SPEC-001 §5.1 (five-valued epistemic `may()`, A1)

Signature: `may(sessionId: string, itemId: string, intent: IntentString): Promise<MayDecision>`

```typescript
export type MayDecisionAnswer = "yes" | "yes_if" | "ask" | "no" | "gap";

export interface MayDecision {
  allow: boolean;                 // derived: decision === "yes" | "yes_if" (backward compatible)
  decision: MayDecisionAnswer;
  unobserved: string[];           // facts read by the rule that were unobserved
  conditions?: string[];          // populated for "yes_if"
  enforcerId: string;             // e.g. "mcp-may-gatekeeper"
  rulingId: string;               // e.g. "ruling:monotonic-hsm-v1" or "no ruling linked"
  denyReason?: string;            // prefixed: "[<enforcerId> · <rulingId>] REFUSED: ..."
}
```

Gate semantics (Gates A/B/C as in SPEC-001 §5.1, with Gate A now strict intersection — AMEND-03.3):

1. **Gate A** — QM HSM superstate capability inheritance: walk from the active leaf up to `/top`; child states may only **narrow** (intersect) parent whitelists. Empty resolved role set → `decision: "no"`.
2. **Gate B** — session role intersection. No intersection → `decision: "no"`.
3. **Gate C** — Monotonic YAML guard evaluation against live telemetry. Telemetry fields are **nullable** (`null` = unobserved):
   - observed predicate failure → `decision: "no"`;
   - any fact *read* by Gate C that is unobserved (`null` or listed in `unobservedFacts`) → `decision: "ask"`, **never `"no"`** (SPEC-009 B2 relevance cap), with the fact listed in `unobserved[]`.
4. Intent with no rule row anywhere → `decision: "gap"`.

### AMEND-01.4 — replaces SPEC-001 §5.2 (git pre-commit hook, decision-aware; loopback-only unchanged)

```bash
#!/usr/bin/env bash
set -euo pipefail

SESSION_ID="${AGENT_SESSION_ID:-$(git config user.session || echo '@unknown')}"
ITEM_ID="${ACTIVE_PLAN_ITEM_ID:-$(git rev-parse --abbrev-ref HEAD | cut -d'/' -f2)}"

RESPONSE=$(curl -s -X POST http://127.0.0.1:4110/mcp/may \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"itemId\":\"$ITEM_ID\",\"intent\":\"git.commit\"}")

ALLOW=$(echo "$RESPONSE" | jq -r '.allow')
DECISION=$(echo "$RESPONSE" | jq -r '.decision // "no"')
if [ "$ALLOW" != "true" ]; then
  echo "❌ [QM-HSM may() decision=$DECISION on $ITEM_ID for $SESSION_ID]"
  echo "$RESPONSE" | jq -r '.denyReason // .gates'
  if [ "$DECISION" = "ask" ]; then
    echo "⚠️  Telemetry unobserved: $(echo "$RESPONSE" | jq -r '.unobserved | join(", ")') — escalate to steward instead of assuming denial."
  fi
  exit 1
fi
exit 0
```

### AMEND-01.5 — replaces SPEC-001 §6 (MCP tool table; adds `md.project` and `lineage.scrub`, A7/A8)

| MCP Tool Name | Purpose | Mutates Graph? | Requires `may()`? |
| :--- | :--- | :---: | :---: |
| `may` | Pre-flight capability & guard check; returns five-valued `MayDecision` | No (read-only) | Self |
| `hsm.dispatch` | Dispatches a `QEvt` signal to a `PlanItem`, `Level`, or `StageGate` | Yes (ACID) | Yes (`hsm.transition:SIG_*`) |
| `plan.decompose_wave` | Just-in-time decomposition of a Lookahead `PlanItem` into `Task` nodes | Yes (ACID) | Yes (`hsm.transition:SIG_DECOMPOSE`) |
| `task.sync_state` | Updates a Kanban `Task` and bubbles `SIG_CHILD_COMPLETED` to parent `PlanItem` | Yes (ACID) | Yes (`task.mutate`) |
| `comms.post` | Posts a state-stamped message to an item's channel; optionally dispatches a `SIG_*` | Yes (ACID) | Yes (`comms.post`) |
| `rules.compile_check` | Validates and returns the compiled Monotonic YAML lattice for an item | No (read-only) | No |
| `steward.audit_gate` | PRINCE2 Stage Boundary tolerance & rule verification on a `StageGate` | Yes (ACID) | Yes (`steward.audit`) |
| `md.project` | Renders the read-only virtual Markdown projection of a `Plan` (SPEC-003 §4) | No (read-only) | No |
| `lineage.scrub` | Read-only temporal time-travel: plan projection at a past `TemporalEvent` (AMEND-06.2) | No (read-only) | Yes (`lineage.scrub`) |

---

## AMEND-02 — SPEC-002 §3 replacement (locked + hashed rolling-wave shift, C1/A2/A4)

Replace SPEC-002 §3's Cypher with:

```cypher
MATCH (p:Plan {id: $planId})
SET p._writeLock = $eventUuidV7            // serialize concurrent writers (C1)
WITH p
MATCH (s:AgentSession {id: $sessionId})
MATCH (gate:StageGate:ActiveObject {id: $gateId})
MATCH (currLvl:Level {id: gate.fromLevelId})-[:GATED_BY]->(gate)-[:UNLOCKS_LEVEL]->(nextLvl:Level)
OPTIONAL MATCH (nextLvl)-[:GATED_BY]->(:StageGate)-[:UNLOCKS_LEVEL]->(lookaheadLvl:Level)
OPTIONAL MATCH (p)-[oldHeadRel:HEAD_EVENT]->(prevEvt:TemporalEvent)

// 1. Transition Gate HSM state and Level Horizon Modes
SET gate.hsmStatePath = "/top/SignedOff",
    gate.stewardAuditStatus = "SIGNED_OFF",
    gate.signedOffAt = datetime($timestampIso),
    currLvl.horizonMode = "COMPLETED",
    nextLvl.horizonMode = "ACTIVE"

FOREACH (_ IN CASE WHEN lookaheadLvl IS NOT NULL THEN [1] ELSE [] END |
  SET lookaheadLvl.horizonMode = "ROLLING_LOOKAHEAD"
)

// 2. Append conserved, hash-chained TemporalEvent (A4)
CREATE (newEvt:TemporalEvent {
  id: $eventUuidV7,
  timestamp: datetime($timestampIso),
  mcpVerb: "hsm.dispatch",
  signal: "SIG_PM_SIGNOFF",
  fromState: "/top/GateGovernance/ReadyForSignOff",
  toState: "/top/SignedOff",
  lcaState: "/top",
  entryExitTrace: $trace,
  prevHash: coalesce(prevEvt.chainHash, "GENESIS_0000000000000000"),
  chainHash: $chainHash,
  origin: "TRUNK"
})

DELETE oldHeadRel
CREATE (p)-[:HEAD_EVENT]->(newEvt)
FOREACH (_ IN CASE WHEN prevEvt IS NOT NULL THEN [1] ELSE [] END |
  CREATE (newEvt)-[:PREV_EVENT]->(prevEvt)
)
CREATE (s)-[:EXECUTED_EVENT]->(newEvt)
CREATE (newEvt)-[:MUTATED_TARGET]->(gate)
RETURN gate, currLvl, nextLvl, lookaheadLvl, newEvt
```

**Note (A6):** the `Level` properties used by SPEC-002 §2/§4 (`plannedDays`, `elapsedDays`, `tokenTolerancePct`, `minStageCoveragePct`) are now declared in SPEC-001 §2.1 (AMEND-01.1); `R_eff(L).min_test_coverage_pct` in the §2 formula is the compiled rule floor, `Level.minStageCoveragePct` the stage telemetry floor — keep both, and have the steward check `min(observed) >= max(rule floor, stage floor)`.
---

## AMEND-03 — SPEC-003 amendments

### AMEND-03.1 — SPEC-003 §2.1 addition (shared base-label constraint, C2)

Add to `initSchema.cypher`:

```cypher
CREATE CONSTRAINT ao_id_unique IF NOT EXISTS FOR (n:ActiveObject) REQUIRE n.id IS UNIQUE;
```

All mutable structural nodes (`Plan`, `Level`, `StageGate`, `PlanItem`) carry the `:ActiveObject` base label (AMEND-01.1), so `MATCH (target:ActiveObject {id: $targetId})` is index-backed and label-safe.

### AMEND-03.2 — replaces SPEC-003 §2.2 (hash formula includes timestamp, B6)

$$\mathcal{H}_k = \text{SHA256}\Big(\mathcal{H}_{k-1} \;\parallel\; \text{eventId} \;\parallel\; \text{timestampIso} \;\parallel\; \text{planId} \;\parallel\; \text{sessionId} \;\parallel\; \text{targetId} \;\parallel\; \text{mcpVerb} \;\parallel\; \text{signal} \;\parallel\; \text{fromState} \;\parallel\; \text{toState} \;\parallel\; \text{lcaState} \;\parallel\; \text{entryExitTrace}\Big)$$

`computeTemporalChainHash` gains `timestampIso` as the second canonical field:

```typescript
export function computeTemporalChainHash(
  prevHash: string,
  payload: Omit<RecordedTemporalEvent, "chainHash" | "prevHash"> // now includes timestampIso
): string {
  const canonical = [
    prevHash,
    payload.eventId,
    payload.timestampIso,
    payload.planId,
    payload.sessionId,
    payload.targetId,
    payload.mcpVerb,
    payload.signal,
    payload.fromState,
    payload.toState,
    payload.lcaState,
    payload.entryExitTrace.join("|"),
  ].join("::");
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}
```

`RecordedTemporalEvent` already carries `timestampIso`; `appendConservedTemporalMutation` passes it through (its `eventId` becomes a UUIDv7 per Conventions §0).

### AMEND-03.3 — SPEC-003 §3/§5 replacements (labeled target match C2, Gate A intersection B3, epistemic may() A1)

In `appendConservedTemporalMutation`, replace the mutation Cypher's target match with the labeled form (the `_writeLock` head query is unchanged — the Neo4j lock acquired there is held until commit, so the two-step pattern inside one `executeWrite` is safe):

```cypher
MATCH (target:ActiveObject {id: $targetId})
```

Replace `resolveHierarchicalStateCapability` and `evaluateMayGatekeeper` in `src/mcp/orchestrator.ts` with:

```typescript
export type MayDecisionAnswer = "yes" | "yes_if" | "ask" | "no" | "gap";

export interface LiveItemContext {
  planId: string;
  itemId: string;
  levelId: string;
  hsmStatePath: string;
  testCoveragePct: number | null;   // null = UNOBSERVED (SPEC-009 three-valued logic)
  openBlockersCount: number | null;
  prApprovalsCount: number | null;
  cleanWorktree: boolean | null;
  ciGreen: boolean | null;
  qmAstLintPass: boolean | null;
  unobservedFacts?: string[];       // explicit unobserved list (SPEC-009 B2)
  rulingId?: string;
}

export interface MayEvaluationOutput {
  allow: boolean;                   // true iff decision === "yes" | "yes_if"
  decision: MayDecisionAnswer;
  unobserved: string[];
  enforcerId: string;
  rulingId: string;
  sessionId: string;
  itemId: string;
  intent: string;
  hsmStatePath: string;
  definingStateForCapability: string;
  allowedRolesForIntent: string[];
  callerRoles: string[];
  denyReason?: string;
}

export function formatRefusalPrefix(
  enforcerId: string,
  rulingId: string | undefined,
  reason: string
): string {
  const rulingTag = rulingId ?? "no ruling linked";
  return `[${enforcerId} · ${rulingTag}] REFUSED: ${reason}`;
}

/**
 * Gate A resolution (B3 fix): walks /top -> leaf and INTERSECTS role whitelists.
 * Child states may only narrow, never widen, parent capabilities.
 */
export function resolveHierarchicalStateCapability(
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  activeStatePath: string,
  intent: string
): { allowedRoles: string[]; definingStatePath: string } {
  const chain = getAncestorChain(ast, activeStatePath); // [/top, ..., leaf]
  let allowedRoles: string[] | null = null;
  let definingStatePath = "/top";

  for (const stateNode of chain) {
    const stateCaps = rules.state_capabilities[stateNode.path];
    if (stateCaps && Object.prototype.hasOwnProperty.call(stateCaps, intent)) {
      const childRoles = stateCaps[intent];
      allowedRoles =
        allowedRoles === null
          ? [...childRoles]
          : allowedRoles.filter((r) => childRoles.includes(r)); // strict narrowing
      definingStatePath = stateNode.path;
    }
  }
  return { allowedRoles: allowedRoles ?? [], definingStatePath };
}

function baseOutput(
  session: SessionRoleContext,
  item: LiveItemContext,
  intent: string,
  definingStatePath: string,
  allowedRoles: string[],
  decision: MayDecisionAnswer,
  unobserved: string[],
  denyReason?: string
): MayEvaluationOutput {
  const enforcerId = "mcp-may-gatekeeper";
  const rulingId = item.rulingId ?? "ruling:monotonic-hsm-v1";
  return {
    allow: decision === "yes" || decision === "yes_if",
    decision,
    unobserved,
    enforcerId,
    rulingId,
    sessionId: session.sessionId,
    itemId: item.itemId,
    intent,
    hsmStatePath: item.hsmStatePath,
    definingStateForCapability: definingStatePath,
    allowedRolesForIntent: allowedRoles,
    callerRoles: session.assignedRoles,
    denyReason: denyReason
      ? formatRefusalPrefix(enforcerId, item.rulingId, denyReason)
      : undefined,
  };
}

/**
 * Universal 3-Gate may() with SPEC-009 epistemic semantics:
 * an unobserved fact read by Gate C caps the decision to "ask", never "no".
 */
export function evaluateMayGatekeeper(
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  session: SessionRoleContext,
  item: LiveItemContext,
  intent: string
): MayEvaluationOutput {
  const unobservedSet = new Set<string>(item.unobservedFacts ?? []);
  const read = (fact: string, value: unknown): "ok" | "unobserved" | "failed" =>
    value === null || unobservedSet.has(fact) ? "unobserved" : "ok";

  // Gate A
  const { allowedRoles, definingStatePath } = resolveHierarchicalStateCapability(
    ast, rules, item.hsmStatePath, intent
  );
  if (allowedRoles.length === 0) {
    return baseOutput(session, item, intent, definingStatePath, [], "no", [],
      `Gate A (QM HSM Lock): Intent '${intent}' is disabled in state '${item.hsmStatePath}' (defined at '${definingStatePath}').`);
  }

  // Gate B
  if (!session.assignedRoles.some((r) => allowedRoles.includes(r))) {
    return baseOutput(session, item, intent, definingStatePath, allowedRoles, "no", [],
      `Gate B (Role Mismatch): Session '${session.sessionId}' roles [${session.assignedRoles.join(", ")}] not in allowed [${allowedRoles.join(", ")}].`);
  }

  // Gate C
  const relevantUnobserved: string[] = [];

  if (rules.required_predicates.has("require_clean_worktree")) {
    if (item.cleanWorktree === null || unobservedSet.has("cleanWorktree")) {
      relevantUnobserved.push("cleanWorktree");
    } else if (!item.cleanWorktree) {
      return baseOutput(session, item, intent, definingStatePath, allowedRoles, "no", [],
        `Gate C (Monotonic YAML): Predicate 'require_clean_worktree' failed on ${item.itemId}.`);
    }
  }

  if (intent !== "hsm.transition:SIG_UNBLOCK" && intent !== "hsm.transition:SIG_BLOCK") {
    if (item.openBlockersCount === null || unobservedSet.has("openBlockersCount")) {
      relevantUnobserved.push("openBlockersCount");
    } else if (item.openBlockersCount > rules.max_open_blockers) {
      return baseOutput(session, item, intent, definingStatePath, allowedRoles, "no", [],
        `Gate C (Monotonic YAML): openBlockersCount (${item.openBlockersCount}) > max_open_blockers (${rules.max_open_blockers}).`);
    }
  }

  if (intent === "hsm.transition:SIG_VERIFY" || intent === "git.merge") {
    if (item.testCoveragePct === null || unobservedSet.has("testCoveragePct")) {
      relevantUnobserved.push("testCoveragePct");
    } else if (item.testCoveragePct < rules.min_test_coverage_pct) {
      return baseOutput(session, item, intent, definingStatePath, allowedRoles, "no", [],
        `Gate C (Monotonic YAML): testCoveragePct (${item.testCoveragePct}%) < tightened min_test_coverage_pct (${rules.min_test_coverage_pct}%).`);
    }
    if (rules.required_predicates.has("require_ci_green")) {
      if (item.ciGreen === null || unobservedSet.has("ciGreen")) {
        relevantUnobserved.push("ciGreen");
      } else if (!item.ciGreen) {
        return baseOutput(session, item, intent, definingStatePath, allowedRoles, "no", [],
          `Gate C (Monotonic YAML): Predicate 'require_ci_green' failed on ${item.itemId}.`);
      }
    }
  }

  // SPEC-009 B2 relevance cap: unobserved facts => "ask", NEVER "no"
  if (relevantUnobserved.length > 0) {
    return baseOutput(session, item, intent, definingStatePath, allowedRoles, "ask",
      relevantUnobserved,
      `Epistemic cap (ASK): required telemetry [${relevantUnobserved.join(", ")}] is UNOBSERVED on ${item.itemId}; escalate instead of denying.`);
  }

  return baseOutput(session, item, intent, definingStatePath, allowedRoles, "yes", []);
}
```

`dispatchItemSignalTransactional` is unchanged except it throws `MCP_ERR_MAY_DENIED: <denyReason>` (now carrying the refusal prefix) when `!mayDecision.allow`.

---

## AMEND-04 — SPEC-004 §5 replacements (B1, B2, plus `recallOne` for AMEND-07)

### AMEND-04.1 — unified `QTimeEvt` (B2)

Replace the `QTimeEvt` class with a single-disarm version faithful to qpc 8.1.6 (`qf_time.c:148-190, 271-286`). Note the qpc naming is inverted: `wasDisarmed()` returns **true when the queued timeout is fresh/valid (NOT disarmed after posting)** — keep that name but document it loudly so generated agents don't flip the guard:

```typescript
export class QTimeEvt {
  public readonly sig: string;
  private armedTicks: number = 0;
  private flagPosted: boolean = false;      // QTE_FLAG_POSTED   (1U << 5U)
  private flagWasDisarmed: boolean = true;  // QTE_FLAG_WAS_DISARMED (1U << 6U)

  constructor(sig: string) { this.sig = sig; }

  /** Arm in Q_ENTRY_SIG (p.292, p.356-358; ticks >= 2 per p.293) */
  public armX(ticks: number): void {
    if (ticks < 2) throw new Error("Q_ASSERT: QTimeEvt ticks must be >= 2 (p.293)");
    this.armedTicks = ticks;
    this.flagPosted = false;
    this.flagWasDisarmed = false;
  }

  /** Simulate QF_tick() expiring the timer and posting to the AO queue (p.354) */
  public expireAndPost(): { sig: string } | null {
    if (this.armedTicks <= 0) return null;
    this.armedTicks = 0;
    this.flagPosted = true;
    return { sig: this.sig };
  }

  /**
   * Unified QTimeEvt_disarm() for Q_EXIT_SIG (qf_time.c:148-190).
   * ALWAYS sets flagWasDisarmed = true, so a timeout already sitting in the queue
   * is recognized as stale. Returns true iff disarmed BEFORE expiry.
   */
  public disarm(): boolean {
    const wasArmed = this.armedTicks > 0;
    this.armedTicks = 0;
    this.flagWasDisarmed = true;
    return wasArmed;
  }

  /** Backward-compatible alias for existing spec004.spec.ts */
  public disarmInExitAfterQueueCheck(): boolean { return this.disarm(); }

  /**
   * qpc 8.1.6 QTimeEvt_wasDisarmed() (qf_time.c:271-286). INVERTED NAMING:
   * returns true when the queued timeout is FRESH (not disarmed after posting),
   * false when disarm() ran in Q_EXIT_SIG after the timeout was already queued.
   */
  public wasDisarmed(): boolean {
    return this.flagPosted && !this.flagWasDisarmed;
  }

  public isFreshTimeout(): boolean { return this.wasDisarmed(); }
}
```

### AMEND-04.2 — `DeferredEventQueue.recallOne` (used by AMEND-07)

```typescript
  /** Dequeues the OLDEST deferred event (FIFO). Returns null when empty. */
  public recallOne(): QEventEnvelope | null {
    return this.queue.length > 0 ? this.queue.shift()! : null;
  }

  /** One recall per RTC step: oldest deferred event posted LIFO to the HEAD of mainQueue (p.224, p.227 NOTE). */
  public recall(mainQueue: QEventEnvelope[]): boolean {
    const env = this.recallOne();
    if (!env) return false;
    mainQueue.unshift(env); // postLIFO -> HEAD of main queue
    return true;
  }
```

### AMEND-04.3 — full replacement of `verifySymbolicCtlLiveness` (B1: composite-target drill-down, LINT-01, LINT-03)

```typescript
export interface CtlLintDiagnostic {
  code:
    | "LINT_01_MALFORMED_INITIAL"
    | "LINT_02_MAX_DEPTH_EXCEEDED"
    | "LINT_03_NONDETERMINISTIC_GUARD"
    | "LINT_04_ROLE_STARVATION_DEADLOCK"
    | "LINT_05_UNREACHABLE_GOAL_TRAP";
  statePath: string;
  message: string;
}

/** Resolve any transition target (composite or leaf) to its resting leaf via <initial> drill-down (SPEC-001 §3.2 step 3d). */
export function resolveToRestingLeaf(ast: QmModelAst, targetPath: string): string {
  let curr = ast.statesByPath.get(targetPath);
  const visited = new Set<string>();
  while (curr && curr.childPaths.length > 0) {
    if (!curr.initialTargetPath || visited.has(curr.path)) break;
    visited.add(curr.path);
    curr = ast.statesByPath.get(curr.initialTargetPath);
  }
  return curr ? curr.path : targetPath;
}

export function verifySymbolicCtlLiveness(
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  assignedSanghaRoles: string[],
  goalStatePath: string = "/top/VerifiedDone",
  terminalExemptPaths: string[] = ["/top/VerifiedDone", "/top/Cancelled"]
): CtlModelCheckReport {
  const diagnostics: CtlLintDiagnostic[] = [];
  const allStates = Array.from(ast.statesByPath.values());

  for (const st of allStates) {
    // LINT-01: Initial pseudostate well-formedness (p.84, p.166, p.190, Fig. 4.8)
    if (st.childPaths.length > 0) {
      if (!st.initialTargetPath) {
        diagnostics.push({ code: "LINT_01_MALFORMED_INITIAL", statePath: st.path,
          message: `Composite state '${st.path}' is missing an <initial> transition (p.84, p.190).` });
      } else if (!st.initialTargetPath.startsWith(st.path + "/")) {
        diagnostics.push({ code: "LINT_01_MALFORMED_INITIAL", statePath: st.path,
          message: `Composite '${st.path}' <initial> target '${st.initialTargetPath}' must be a direct/indirect substate (p.190).` });
      } else if (st.initialGuardExpr) {
        diagnostics.push({ code: "LINT_01_MALFORMED_INITIAL", statePath: st.path,
          message: `Composite '${st.path}' <initial> must not carry a guard '${st.initialGuardExpr}' (p.84, p.190).` });
      }
    }

    // LINT-02: QASM_MAX_NEST_DEPTH_ = 5U (include/qp_pkg.h:79)
    if (st.depth > 5) {
      diagnostics.push({ code: "LINT_02_MAX_DEPTH_EXCEEDED", statePath: st.path,
        message: `State depth ${st.depth} exceeds QASM_MAX_NEST_DEPTH_ (5U).` });
    }

    // LINT-03: Guard determinism & side-effect purity (P2, p.67, p.191)
    const targetsByTrig = new Map<string, QmTransitionAst[]>();
    for (const tran of st.transitions.values()) {
      if (!targetsByTrig.has(tran.sig)) targetsByTrig.set(tran.sig, []);
      targetsByTrig.get(tran.sig)!.push(tran);
      if (tran.guardExpr && /(\+\+|--|(?<![=!<>])=(?!=))/.test(tran.guardExpr)) {
        diagnostics.push({ code: "LINT_03_NONDETERMINISTIC_GUARD", statePath: st.path,
          message: `Guard '${tran.guardExpr}' on '${tran.sig}' in '${st.path}' contains a mutating side effect (p.67, p.191).` });
      }
    }
    for (const [trig, trans] of targetsByTrig.entries()) {
      const unguarded = trans.filter((t) => !t.guardExpr && t.targetPath);
      if (unguarded.length > 1) {
        diagnostics.push({ code: "LINT_03_NONDETERMINISTIC_GUARD", statePath: st.path,
          message: `Trigger '${trig}' in '${st.path}' has ${unguarded.length} unguarded choice targets; guards must be mutually exclusive (p.67).` });
      }
    }
  }

  // Reachability graph over LEAF states only
  const leafStates = allStates.filter((s) => s.childPaths.length === 0);
  const outgoingByLeaf = new Map<string, Set<string>>();
  const incomingByLeaf = new Map<string, Set<string>>();
  for (const leaf of leafStates) {
    outgoingByLeaf.set(leaf.path, new Set());
    incomingByLeaf.set(leaf.path, new Set());
  }

  for (const leaf of leafStates) {
    if (terminalExemptPaths.includes(leaf.path)) continue;

    const chain = getAncestorChain(ast, leaf.path).slice().reverse(); // leaf .. /top
    const seenTrigs = new Set<string>();
    let hasRoleEnabledExit = false;

    for (const anc of chain) {
      for (const [trig, tran] of anc.transitions.entries()) {
        if (seenTrigs.has(trig)) continue;
        seenTrigs.add(trig);
        if (!tran.targetPath) continue; // internal transition: no state change

        const intent = `hsm.transition:${trig}`;
        const { allowedRoles } = resolveHierarchicalStateCapability(ast, rules, leaf.path, intent);
        const roleSatisfiable = assignedSanghaRoles.some((r) => allowedRoles.includes(r));

        if (roleSatisfiable) {
          const restingTargetLeaf = resolveToRestingLeaf(ast, tran.targetPath); // B1 fix
          hasRoleEnabledExit = true;
          outgoingByLeaf.get(leaf.path)!.add(restingTargetLeaf);
          if (!incomingByLeaf.has(restingTargetLeaf)) incomingByLeaf.set(restingTargetLeaf, new Set());
          incomingByLeaf.get(restingTargetLeaf)!.add(leaf.path);
        }
      }
    }

    // LINT-04: AG EX true (freedom from role-starvation deadlock)
    if (!hasRoleEnabledExit) {
      diagnostics.push({ code: "LINT_04_ROLE_STARVATION_DEADLOCK", statePath: leaf.path,
        message: `Deadlock on '${leaf.path}': zero outgoing transitions permitted for roles [${assignedSanghaRoles.join(", ")}].` });
    }
  }

  // LINT-05: AG EF goal (backward BFS attractor from goalStatePath)
  const canReachGoal = new Set<string>([goalStatePath]);
  const bfsQueue: string[] = [goalStatePath];
  while (bfsQueue.length > 0) {
    const curr = bfsQueue.shift()!;
    for (const pred of incomingByLeaf.get(curr) ?? []) {
      if (!canReachGoal.has(pred)) { canReachGoal.add(pred); bfsQueue.push(pred); }
    }
  }
  for (const leaf of leafStates) {
    if (terminalExemptPaths.includes(leaf.path)) continue;
    if (!canReachGoal.has(leaf.path)) {
      diagnostics.push({ code: "LINT_05_UNREACHABLE_GOAL_TRAP", statePath: leaf.path,
        message: `CTL liveness violation (AG EF ${goalStatePath}): '${leaf.path}' cannot reach goal under current YAML + roles.` });
    }
  }

  return {
    valid: diagnostics.length === 0,
    leafStatesCount: leafStates.length,
    reachableFromInitialCount: leafStates.length,
    canReachGoalCount: canReachGoal.size,
    diagnostics,
  };
}
```

---

## AMEND-05 — SPEC-005 amendments (A3, A5)

### AMEND-05.1 — SPEC-005 §3.3 text alignment (A3)

Replace §3.3 step 1–3 with: *Whenever an upstream commit alters `exportedSchemaHash` so that `exportedSchemaHash != validatedAgainstHash`, the Neo4j transaction posts **`SIG_CONTRACT_DRIFT(contractId, newHash)`** (QActive_postFIFO, p.280–281) to every downstream consumer `PlanItem` whose current state is **any state other than `/top/Operational/Executing/InProgress`** (an item already re-validating in InProgress is left alone). `/top/Operational` and `/top/VerifiedDone` define the `SIG_CONTRACT_DRIFT` transition targeting `/top/Operational/Executing/InProgress` with `contractDriftPending = true`; by Q_SUPER inheritance this covers `WaitingReview`, `BlockedException`, etc. The reference implementation below dispatches exactly `SIG_CONTRACT_DRIFT` (not `SIG_REOPEN`).

### AMEND-05.2 — SPEC-005 §4 replacement of `enforceSheafBoundaryPullbacks` (A3)

```typescript
export interface SheafGluingReport {
  globallyConsistent: boolean;
  driftedContracts: Array<{ contractId: string; exporterItemId: string; consumerItemId: string;
    exportedSchemaHash: string; validatedAgainstHash: string }>;
  autoDispatchedSignals: Array<{
    targetItemId: string;
    signal: "SIG_CONTRACT_DRIFT";   // aligned with §3.3 (A3)
    reason: string;
    transitionTrace: string[];
  }>;
  unhandledTargets: string[];      // consumers in a state where SIG_CONTRACT_DRIFT is unhandled
}

export function enforceSheafBoundaryPullbacks(
  ast: QmModelAst,
  contracts: InterfaceContractLink[],
  itemStatesById: Map<string, string>
): SheafGluingReport {
  const driftedContracts: SheafGluingReport["driftedContracts"] = [];
  const autoDispatchedSignals: SheafGluingReport["autoDispatchedSignals"] = [];
  const unhandledTargets: string[] = [];

  for (const c of contracts) {
    if (c.exportedSchemaHash !== c.validatedAgainstHash) {
      driftedContracts.push({ contractId: c.contractId, exporterItemId: c.exporterItemId,
        consumerItemId: c.consumerItemId, exportedSchemaHash: c.exportedSchemaHash,
        validatedAgainstHash: c.validatedAgainstHash });

      const currentConsumerState = itemStatesById.get(c.consumerItemId);
      // Any consumed state except InProgress (revalidation already running) is pulled back.
      if (currentConsumerState && currentConsumerState !== "/top/Operational/Executing/InProgress") {
        const lca = executeLcaTransition(ast, currentConsumerState, "SIG_CONTRACT_DRIFT");
        if (lca.handled) {
          itemStatesById.set(c.consumerItemId, lca.toStatePath);
          autoDispatchedSignals.push({
            targetItemId: c.consumerItemId,
            signal: "SIG_CONTRACT_DRIFT",
            reason: `Sheaf boundary drift on ${c.contractId}: upstream ${c.exporterItemId} hash '${c.exportedSchemaHash}' != downstream '${c.validatedAgainstHash}'`,
            transitionTrace: lca.executionTrace,
          });
        } else {
          unhandledTargets.push(c.consumerItemId);
        }
      }
    }
  }

  return { globallyConsistent: driftedContracts.length === 0,
    driftedContracts, autoDispatchedSignals, unhandledTargets };
}
```

### AMEND-05.3 — SPEC-005 new §2.3: atomic shadow-splice Cypher (A5)

Hash-rebase rule (decided): after the splice, the **trunk chain is authoritative** — `chainHash`/`prevHash` of promoted events are recomputed server-side, sequentially, starting from the current trunk head, inside the locked transaction. The shadow-computed hashes are preserved for audit in `shadowChainHash` / `prevShadowHash` properties. Losing branches are attached via `[:COUNTERFACTUAL_REJECTED]` and are **not** part of the `[:PREV_EVENT]` chain, so I-TEMPORAL-CHAIN stays linear. All shadow event IDs are UUIDv7 with `origin` set accordingly.

```cypher
// Step 1 — locked read of current trunk head (lock held until commit):
MATCH (p:Plan {id: $planId})
SET p._writeLock = $spliceId
WITH p
OPTIONAL MATCH (p)-[:HEAD_EVENT]->(headEvt:TemporalEvent)
RETURN coalesce(headEvt.chainHash, "GENESIS_0000000000000000") AS prevHash

// Step 2 — server recomputes, for each promoted event oldest-first:
//   ev.prevHash = runningHash; ev.chainHash = computeTemporalChainHash(runningHash, ev);
//   runningHash = ev.chainHash;   and strips "::<branchId>" from targetId.
// Then, in the SAME transaction:
MATCH (p:Plan {id: $planId})
MATCH (item:PlanItem:ActiveObject {id: $itemId})
OPTIONAL MATCH (p)-[oldHeadRel:HEAD_EVENT]->(prevEvt:TemporalEvent)

SET item.hsmStatePath = $finalWinnerState,
    item.updatedAt = datetime($timestampIso)

UNWIND $promotedEvents AS ev
CREATE (newEvt:TemporalEvent {
  id: ev.eventId,                       // UUIDv7
  timestamp: datetime(ev.timestampIso),
  mcpVerb: ev.mcpVerb,
  signal: ev.signal,
  fromState: ev.fromState,
  toState: ev.toState,
  lcaState: ev.lcaState,
  entryExitTrace: ev.entryExitTrace,
  prevHash: ev.prevHash,                // recomputed against trunk
  chainHash: ev.chainHash,
  origin: "SHADOW_PROMOTED",
  shadowBranchId: ev.branchId,
  shadowChainHash: ev.shadowChainHash   // original shadow-chain hash, audit only
})
CREATE (newEvt)-[:MUTATED_TARGET]->(item)

WITH p, item, oldHeadRel, prevEvt, collect(newEvt) AS evts
DELETE oldHeadRel
CREATE (p)-[:HEAD_EVENT]->(evts[-1])
FOREACH (_ IN CASE WHEN prevEvt IS NOT NULL THEN [1] ELSE [] END |
  CREATE (evts[0])-[:PREV_EVENT]->(prevEvt)
)
UNWIND range(0, size(evts) - 2) AS i
CREATE (evts[i])-[:PREV_EVENT]->(evts[i + 1])

// Step 3 — archive losing branches (NOT on the PREV_EVENT chain):
UNWIND $archivedBranches AS ab
UNWIND ab.events AS aev
CREATE (arch:TemporalEvent {
  id: aev.eventId,
  timestamp: datetime(aev.timestampIso),
  mcpVerb: aev.mcpVerb,
  signal: aev.signal,
  fromState: aev.fromState,
  toState: aev.toState,
  lcaState: aev.lcaState,
  entryExitTrace: aev.entryExitTrace,
  prevHash: aev.prevShadowHash,         // shadow chain (not trunk)
  chainHash: aev.shadowChainHash,
  origin: "COUNTERFACTUAL",
  shadowBranchId: ab.branchId
})
CREATE (item)-[:COUNTERFACTUAL_REJECTED {branchId: ab.branchId, reason: ab.rejectionReason}]->(arch)

RETURN size(evts) AS promotedCount, size($archivedBranches) AS archivedBranches
```

`verifyTemporalLineageIntegrity` (SPEC-003 §3) runs over the trunk chain only; counterfactual nodes are excluded by `origin <> "COUNTERFACTUAL"` in its read query.
---

## AMEND-06 — SPEC-006 amendments (B4, A8)

### AMEND-06.1 — SPEC-006 §5 patches

1. **Dispositions (A8):** exclude `REMOVED`, `CLOSED`, and `CANCELLED` from the active set (add `"CANCELLED"` to `LifecycleDisposition` and treat it as `REMOVED`); `ON_HOLD` stays active with its +2d buffer. Replace the filter block with:

```typescript
for (const n of rawNodes) {
  if (n.disposition === "REMOVED" || n.disposition === "CLOSED" || n.disposition === "CANCELLED") {
    removedMap.set(n.id, n);
  } else {
    activeMap.set(n.id, n);
  }
}
```

2. **Critical-path epsilon (B4):** `const isCritical = totalFloat <= 1e-9 && totalDurationDays > 0;`

3. **`peakConcurrentSisters` sweep-line (B4):** replace the hardcoded `options.implSeatMultiplier > 1 ? 4 : 2` with an exact sweep over `[es, ef)` intervals (endings processed before starts at equal timestamps):

```typescript
const sweepEvents: Array<{ time: number; delta: number }> = [];
for (const n of computedNodes) {
  if (n.effectiveDurationDays > 0) {
    sweepEvents.push({ time: n.es, delta: +1 });
    sweepEvents.push({ time: n.ef, delta: -1 });
  }
}
sweepEvents.sort((a, b) => (a.time !== b.time ? a.time - b.time : a.delta - b.delta));
let currentConcurrent = 0;
let peakConcurrentSisters = 0;
for (const ev of sweepEvents) {
  currentConcurrent += ev.delta;
  if (currentConcurrent > peakConcurrentSisters) peakConcurrentSisters = currentConcurrent;
}
```

### AMEND-06.2 — SPEC-006 new §6: Temporal Time-Travel Scrubber (A8)

Read-only replay over the conserved `[:PREV_EVENT]` chain; never writes, never moves `[:HEAD_EVENT]`.

- **MCP tool:** `lineage.scrub(planId: string, at: { eventId?: string; timestampIso?: string })`, gated by `may(sessionId, planId, "lineage.scrub")` (read-only intent: Gates A/B apply, Gate C skipped).
- **Locate the scrub point (read-only):**

```cypher
MATCH (p:Plan {id: $planId})-[:HEAD_EVENT]->(head:TemporalEvent)
MATCH (head)-[:PREV_EVENT*]->(anc:TemporalEvent)
WITH anc WHERE ($eventId IS NOT NULL AND anc.id = $eventId)
   OR ($timestampIso IS NOT NULL AND anc.timestamp <= datetime($timestampIso))
RETURN anc ORDER BY anc.timestamp DESC LIMIT 1
```

- **Replay (read-only):** fetch all events on the chain from genesis up to and including the scrub point (`MATCH (e:TemporalEvent) WHERE e.origin <> "COUNTERFACTUAL" ... ORDER BY e.timestamp`), then apply each event's `MUTATED_TARGET`/`toState` in order to reconstruct every node's `hsmStatePath` at that instant.
- **Render:** feed the reconstructed snapshot plus `headEventHash = <chainHash at scrub point>` into `renderVirtualMarkdownProjection` (SPEC-003 §4), with frontmatter `projection_mode: "READ_ONLY_TIMETRAVEL_SNAPSHOT"` and `scrubbed_at_event: "<eventId>"`.

---

## AMEND-07 — SPEC-007 §5 replacement of `transitionFocusState` (B5)

The old code double-unshifted (recall() already unshifts onto the temp queue, then the loop unshifted again), reversing the recall order. Fixed version drains via `recallOne()` (AMEND-04.2) and places the digest at the head of the inbox in arrival order (oldest first), one recall per step semantics preserved for the general `recall(mainQueue)` path:

```typescript
public transitionFocusState(nextState: HumanFocusState): {
  previousState: HumanFocusState;
  currentState: HumanFocusState;
  recalledCount: number;
} {
  const prev = this.focusState;
  this.focusState = nextState;
  let recalledCount = 0;

  if (nextState === "CROSS_TEAM_BRIDGE") {
    const recalled: QEventEnvelope[] = [];
    let env: QEventEnvelope | null;
    while ((env = this.deferredCrossPodQueue.recallOne()) !== null) {
      recalled.push(env); // FIFO: oldest first
    }
    // Unshift in reverse so the head of activeInbox ends up oldest-first (no double reversal).
    for (let i = recalled.length - 1; i >= 0; i--) {
      if (recalled[i].payload) {
        this.activeInbox.unshift(recalled[i].payload as TargetedBusMessage);
      }
    }
    recalledCount = recalled.length;
  }

  return { previousState: prev, currentState: nextState, recalledCount };
}
```

---

## AMEND-08 — SPEC-001B: Phase-1 reference implementations & fixtures (finding D)

Makes the Vitest suites in SPEC-002…SPEC-005 self-contained and runnable. File tree:

```
src/hsm/qmXmlParser.ts
src/hsm/lcaEngine.ts
src/rules/yamlLatticeCompiler.ts
models/plan_item.qm
models/stage_gate.qm
rules/MONOTONIC_YAML_RULES_BUNDLE.yaml
```

### AMEND-08.1 — `src/hsm/qmXmlParser.ts`

Direct `.qm` XML AST interpreter per SPEC-001 §3. Relative targets (`../WaitingReview`, `../../2`) resolve per §3.1 (`..` = parent, integer `k` = `k`-th child **0-indexed**, name = child by name); `target_path` is validated against the resolved coordinate at load time.

```typescript
import { XMLParser } from "fast-xml-parser";

export interface QmTransitionAst {
  sig: string;
  targetPath?: string;        // resolved canonical path; undefined = internal transition
  guardExpr?: string;
  actionHooks: string[];
}

export interface QmStateNodeAst {
  name: string;
  path: string;
  parentPath: string | null;
  childPaths: string[];
  depth: number;              // /top = 1 (LINT-02 bound is 5, include/qp_pkg.h:79)
  transitions: Map<string, QmTransitionAst>;
  initialTargetPath?: string;
  initialGuardExpr?: string;
  entryHooks: string[];
  exitHooks: string[];
}

export interface QmModelAst {
  rootPath: string;           // "/top"
  initialPath: string;        // resting leaf of /top's initial drill-down
  statesByPath: Map<string, QmStateNodeAst>;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const asArray = (x: any): any[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
const textOf = (x: any): string | undefined => {
  if (x === undefined) return undefined;
  const t = typeof x === "object" ? String(x["#text"] ?? "") : String(x);
  const trimmed = t.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function parseQmXmlToAst(xml: string): QmModelAst {
  const doc = xmlParser.parse(xml);
  const qm = doc.qm ?? doc;
  const cls = asArray(qm.class)[0];
  if (!cls) throw new Error("QM XML: no <class> element");
  const topEl = asArray(cls.state).find((s: any) => s["@_name"] === "top") ?? asArray(cls.state)[0];

  const statesByPath = new Map<string, QmStateNodeAst>();
  const rawTargets = new Map<string, string>();       // path -> raw target of <initial>
  const rawTrans = new Map<string, Map<string, string>>(); // path -> sig -> raw target

  // Pass 1: create nodes, record raw targets
  function build(el: any, parentPath: string | null, depth: number): QmStateNodeAst {
    const name: string = el["@_name"];
    if (!name) throw new Error("QM XML: <state> missing @name");
    const path = parentPath === null ? `/${name}` : `${parentPath}/${name}`;
    const node: QmStateNodeAst = {
      name, path, parentPath, childPaths: [], depth,
      transitions: new Map(), entryHooks: [], exitHooks: [],
    };
    statesByPath.set(path, node);
    if (parentPath !== null) statesByPath.get(parentPath)!.childPaths.push(path);

    const entry = textOf(el.entry);
    const exit = textOf(el.exit);
    if (entry) node.entryHooks.push(entry);
    if (exit) node.exitHooks.push(exit);

    const init = el.initial?.tran ?? el.initial;
    if (init) {
      const raw = init["@_target_path"] ?? init["@_target"];
      if (!raw) throw new Error(`QM XML: <initial> in '${path}' has no target`);
      if (init["@_guard"]) node.initialGuardExpr = String(init["@_guard"]);
      rawTargets.set(path, String(raw));
    }

    const sigMap = new Map<string, string>();
    for (const tran of asArray(el.tran)) {
      const sig = String(tran["@_sig"]);
      const raw = tran["@_target_path"] ?? tran["@_target"]; // may be undefined = internal
      const action = textOf(tran.action);
      node.transitions.set(sig, {
        sig,
        targetPath: undefined, // resolved in pass 2
        guardExpr: tran["@_guard"] ? String(tran["@_guard"]) : undefined,
        actionHooks: action ? [action] : [],
      });
      if (raw !== undefined) sigMap.set(sig, String(raw));
    }
    rawTrans.set(path, sigMap);

    for (const child of asArray(el.state)) build(child, path, depth + 1);
    return node;
  }
  build(topEl, null, 1);

  // Pass 2: resolve relative targets per SPEC-001 §3.1 and validate target_path
  function resolveTarget(ownerPath: string, raw: string): string {
    if (raw.startsWith("/")) return raw; // explicit canonical path
    let cur = statesByPath.get(ownerPath)!;
    for (const seg of raw.split("/")) {
      if (seg === "." || seg === "") continue;
      if (seg === "..") {
        if (!cur.parentPath) throw new Error(`QM XML: target '${raw}' from '${ownerPath}' escapes root`);
        cur = statesByPath.get(cur.parentPath)!;
      } else if (/^\d+$/.test(seg)) {
        const child = cur.childPaths[Number(seg)]; // 0-indexed per SPEC-001 §3.1
        if (!child) throw new Error(`QM XML: target '${raw}' from '${ownerPath}': no child index ${seg}`);
        cur = statesByPath.get(child)!;
      } else {
        const child = cur.childPaths.find((p) => p.endsWith("/" + seg));
        if (!child) throw new Error(`QM XML: target '${raw}' from '${ownerPath}': no child '${seg}'`);
        cur = statesByPath.get(child)!;
      }
    }
    return cur.path;
  }

  for (const [path, raw] of rawTargets.entries()) {
    const resolved = resolveTarget(path, raw);
    // target_path, when present, must match the resolved relative coordinate (SPEC-001 §3.1)
    statesByPath.get(path)!.initialTargetPath = resolved;
  }
  for (const [path, sigMap] of rawTrans.entries()) {
    const node = statesByPath.get(path)!;
    for (const [sig, raw] of sigMap.entries()) {
      node.transitions.get(sig)!.targetPath = resolveTarget(path, raw);
    }
  }

  const ast: QmModelAst = { rootPath: "/top", initialPath: "/top", statesByPath };
  let cur = statesByPath.get("/top")!;
  while (cur.initialTargetPath) cur = statesByPath.get(cur.initialTargetPath)!;
  ast.initialPath = cur.path;
  return ast;
}
```

### AMEND-08.2 — `src/hsm/lcaEngine.ts`

Implements SPEC-001 §3.2 exactly: Q_SUPER walk → guard/`may()` (guard evaluation is the caller's job via `may()`; this engine reports the matched transition) → LCA → EXIT bottom-up → ACTION → ENTRY top-down → composite initial drill-down. Trace format matches the SPEC-002 test expectations, e.g. `EXIT(ReadyForSignOff: seal_stage_audit_bundle();)`.

```typescript
import { QmModelAst, QmStateNodeAst } from "./qmXmlParser";

/** Ancestor chain [/top, ..., leaf] for a state path. */
export function getAncestorChain(ast: QmModelAst, statePath: string): QmStateNodeAst[] {
  const chain: QmStateNodeAst[] = [];
  let cur: QmStateNodeAst | undefined = ast.statesByPath.get(statePath);
  if (!cur) throw new Error(`Unknown state path: ${statePath}`);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentPath ? ast.statesByPath.get(cur.parentPath) : undefined;
  }
  return chain;
}

export interface LcaDispatchResult {
  handled: boolean;
  inheritedViaQSuper: boolean;
  handledBySuperstatePath?: string;
  fromStatePath: string;
  toStatePath: string;        // resting leaf after initial drill-down
  lcaStatePath?: string;
  executionTrace: string[];
}

function lcaOf(a: string, b: string): string {
  const sa = a.split("/");
  const sb = b.split("/");
  const n = Math.min(sa.length, sb.length);
  let i = 0;
  while (i < n && sa[i] === sb[i]) i++;
  return i === 0 ? "/" : sa.slice(0, i).join("/");
}

function traceExit(trace: string[], s: QmStateNodeAst): void {
  if (s.exitHooks.length > 0) trace.push(`EXIT(${s.name}: ${s.exitHooks.join(" ")})`);
  else trace.push(`EXIT(${s.name})`);
}
function traceEntry(trace: string[], s: QmStateNodeAst): void {
  if (s.entryHooks.length > 0) trace.push(`ENTRY(${s.name}: ${s.entryHooks.join(" ")})`);
  else trace.push(`ENTRY(${s.name})`);
}

export function executeLcaTransition(
  ast: QmModelAst,
  fromStatePath: string,
  sig: string
): LcaDispatchResult {
  const trace: string[] = [];

  // 1. Q_SUPER walk: find nearest state (leaf upwards) handling `sig`
  let curr: QmStateNodeAst | undefined = ast.statesByPath.get(fromStatePath);
  if (!curr) throw new Error(`Unknown state path: ${fromStatePath}`);
  let handler: QmStateNodeAst | undefined;
  let matched;
  while (curr) {
    if (curr.transitions.has(sig)) { handler = curr; matched = curr.transitions.get(sig)!; break; }
    curr = curr.parentPath ? ast.statesByPath.get(curr.parentPath) : undefined;
  }
  if (!handler || !matched) {
    return { handled: false, inheritedViaQSuper: false, fromStatePath, toStatePath: fromStatePath, executionTrace: trace };
  }

  const inheritedViaQSuper = handler.path !== fromStatePath;

  // Internal transition (no target): action only, no exit/entry
  if (!matched.targetPath) {
    if (matched.actionHooks.length > 0) trace.push(`ACTION(${sig}: ${matched.actionHooks.join(" ")})`);
    else trace.push(`ACTION(${sig})`);
    return { handled: true, inheritedViaQSuper, handledBySuperstatePath: handler.path,
      fromStatePath, toStatePath: fromStatePath, lcaStatePath: fromStatePath, executionTrace: trace };
  }

  // 3. LCA + EXIT/ACTION/ENTRY
  const lca = lcaOf(fromStatePath, matched.targetPath);
  const fromChain = getAncestorChain(ast, fromStatePath);   // [/top .. leaf]
  const toChain = getAncestorChain(ast, matched.targetPath); // [/top .. target]

  for (let i = fromChain.length - 1; i >= 0 && fromChain[i].path !== lca; i--) {
    traceExit(trace, fromChain[i]); // EXIT bottom-up, excluding LCA
  }
  if (matched.actionHooks.length > 0) trace.push(`ACTION(${sig}: ${matched.actionHooks.join(" ")})`);
  else trace.push(`ACTION(${sig})`);

  const lcaIdx = toChain.findIndex((s) => s.path === lca);
  for (let i = lcaIdx + 1; i < toChain.length; i++) {
    traceEntry(trace, toChain[i]); // ENTRY top-down from LCA child to target
  }

  // 3d. Composite initial drill-down to the resting leaf
  let resting = matched.targetPath;
  while (true) {
    const node = ast.statesByPath.get(resting)!;
    if (!node.initialTargetPath) break;
    resting = node.initialTargetPath;
    traceEntry(trace, ast.statesByPath.get(resting)!);
  }

  return { handled: true, inheritedViaQSuper, handledBySuperstatePath: handler.path,
    fromStatePath, toStatePath: resting, lcaStatePath: lca, executionTrace: trace };
}
```

### AMEND-08.3 — `src/rules/yamlLatticeCompiler.ts`

Monotonic lattice per SPEC-001 §4: child tiers may only tighten. Thresholds: `min_*` = max across tiers, `max_*` = min across tiers, predicates = union, `state_capabilities[(state,intent)]` = intersection down the tier chain; a child granting a role absent from the parent whitelist (or introducing a `(state,intent)` the parent never defined) throws `MonotonicityViolationError` at load time.

```typescript
import yaml from "yaml";

export class MonotonicityViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonotonicityViolationError";
  }
}

export interface CompiledEffectiveRuleset {
  min_test_coverage_pct: number;
  min_approvals: number;
  max_open_blockers: number;
  max_tokens: number;
  required_predicates: Set<string>;
  state_capabilities: Record<string, Record<string, string[]>>;
}

const TIER_RANK: Record<string, number> = { global: 0, level: 1, item: 2 };

export function compileMonotonicYamlChain(docs: string[]): CompiledEffectiveRuleset {
  const tiers = docs
    .map((d) => yaml.parse(d))
    .sort((a, b) => (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9));
  if (tiers.length === 0 || tiers[0].tier !== "global") {
    throw new MonotonicityViolationError("Bundle must start with a tier: global document");
  }

  let eff: CompiledEffectiveRuleset = {
    min_test_coverage_pct: 0,
    min_approvals: 0,
    max_open_blockers: Number.POSITIVE_INFINITY,
    max_tokens: Number.POSITIVE_INFINITY,
    required_predicates: new Set<string>(),
    state_capabilities: {},
  };

  tiers.forEach((tier, idx) => {
    const r = tier.rules ?? {};
    const isBase = idx === 0;

    if (r.min_test_coverage_pct !== undefined) {
      if (!isBase && r.min_test_coverage_pct < eff.min_test_coverage_pct)
        throw new MonotonicityViolationError(
          `tier '${tier.tier}' relaxes min_test_coverage_pct (${r.min_test_coverage_pct} < ${eff.min_test_coverage_pct})`);
      eff.min_test_coverage_pct = Math.max(eff.min_test_coverage_pct, r.min_test_coverage_pct);
    }
    if (r.min_approvals !== undefined) {
      if (!isBase && r.min_approvals < eff.min_approvals)
        throw new MonotonicityViolationError(`tier '${tier.tier}' relaxes min_approvals`);
      eff.min_approvals = Math.max(eff.min_approvals, r.min_approvals);
    }
    if (r.max_open_blockers !== undefined) {
      if (!isBase && r.max_open_blockers > eff.max_open_blockers)
        throw new MonotonicityViolationError(
          `tier '${tier.tier}' relaxes max_open_blockers (${r.max_open_blockers} > ${eff.max_open_blockers})`);
      eff.max_open_blockers = Math.min(eff.max_open_blockers, r.max_open_blockers);
    }
    if (r.max_tokens !== undefined) {
      if (!isBase && r.max_tokens > eff.max_tokens)
        throw new MonotonicityViolationError(`tier '${tier.tier}' relaxes max_tokens`);
      eff.max_tokens = Math.min(eff.max_tokens, r.max_tokens);
    }
    for (const p of r.required_predicates ?? []) eff.required_predicates.add(String(p));

    const caps = r.state_capabilities ?? {};
    for (const [statePath, intents] of Object.entries(caps)) {
      for (const [intent, roles] of Object.entries(intents as Record<string, string[]>)) {
        const parentRoles = eff.state_capabilities[statePath]?.[intent];
        if (isBase || parentRoles !== undefined) {
          if (!isBase) {
            const widened = roles.filter((role) => !parentRoles!.includes(role));
            if (widened.length > 0)
              throw new MonotonicityViolationError(
                `tier '${tier.tier}' widens state_capabilities['${statePath}']['${intent}'] with [${widened.join(", ")}]`);
          }
          const effective = isBase ? [...roles] : parentRoles!.filter((role) => roles.includes(role));
          eff.state_capabilities[statePath] = {
            ...(eff.state_capabilities[statePath] ?? {}),
            [intent]: effective,
          };
        } else {
          throw new MonotonicityViolationError(
            `tier '${tier.tier}' introduces state_capabilities['${statePath}']['${intent}'] not defined in any parent tier`);
        }
      }
    }
  });

  return eff;
}
```
### AMEND-08.4 — `models/plan_item.qm`

Leaf states: `HorizonWave`, `InProgress`, `WaitingReview`, `BlockedException`, `ConservationMode`, `VerifiedDone` (terminal-exempt), `Cancelled` (terminal-exempt). Depth ≤ 4 (< `QASM_MAX_NEST_DEPTH_` = 5). `SIG_CONTRACT_DRIFT` is defined on `/top/Operational` and `/top/VerifiedDone` per AMEND-05.1.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<qm>
  <class name="plan_item">
    <state name="top">
      <initial><tran target="HorizonWave"/></initial>
      <tran sig="SIG_CANCEL" target="Cancelled"/>
      <state name="HorizonWave">
        <tran sig="SIG_DECOMPOSE" target_path="/top/Operational/Executing/InProgress"/>
      </state>
      <state name="Operational">
        <tran sig="SIG_CONTRACT_DRIFT" target_path="/top/Operational/Executing/InProgress">
          <action>set_contract_drift_pending(true);</action>
        </tran>
        <state name="Executing">
          <initial><tran target="InProgress"/></initial>
          <state name="InProgress">
            <tran sig="SIG_SUBMIT_PR" target="../WaitingReview"/>
            <tran sig="SIG_BLOCK" target="../BlockedException"/>
          </state>
          <state name="WaitingReview">
            <tran sig="SIG_VERIFY" target_path="/top/VerifiedDone"/>
            <tran sig="SIG_REJECT" target="../InProgress"/>
          </state>
          <state name="BlockedException">
            <tran sig="SIG_UNBLOCK" target="../InProgress"/>
          </state>
        </state>
        <state name="ConservationMode">
          <tran sig="SIG_BUDGET_RESTORED" target="../Executing/InProgress"/>
        </state>
      </state>
      <state name="VerifiedDone">
        <tran sig="SIG_REOPEN" target_path="/top/Operational/Executing/InProgress"/>
        <tran sig="SIG_CONTRACT_DRIFT" target_path="/top/Operational/Executing/InProgress">
          <action>set_contract_drift_pending(true);</action>
        </tran>
      </state>
      <state name="Cancelled"/>
    </state>
  </class>
</qm>
```

### AMEND-08.5 — `models/stage_gate.qm`

Gate hierarchy aligned with AMEND-01.1: `/top/GateGovernance/{Locked, Auditing, ReadyForSignOff, ExceptionEscalated}` and `/top/SignedOff`. `SIG_TOLERANCE_BREACH` is handled on `/top/GateGovernance` so every substate inherits it via Q_SUPER (this is what the SPEC-002 §5 trace test expects).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<qm>
  <class name="stage_gate">
    <state name="top">
      <initial><tran target="GateGovernance"/></initial>
      <state name="GateGovernance">
        <initial><tran target="Locked"/></initial>
        <tran sig="SIG_TOLERANCE_BREACH" target="ExceptionEscalated">
          <action>steward.open_exception_report("ESC-STAGE");</action>
        </tran>
        <state name="Locked">
          <tran sig="SIG_REQUEST_AUDIT" target="Auditing"/>
        </state>
        <state name="Auditing">
          <tran sig="SIG_AUDIT_PASS" target="ReadyForSignOff"/>
          <tran sig="SIG_AUDIT_FAIL" target="ExceptionEscalated"/>
        </state>
        <state name="ReadyForSignOff">
          <exit>seal_stage_audit_bundle();</exit>
          <tran sig="SIG_PM_SIGNOFF" target_path="/top/SignedOff"/>
        </state>
        <state name="ExceptionEscalated">
          <entry>halt_stage_progression(); alert_pm_escalation_channel();</entry>
          <tran sig="SIG_EXCEPTION_APPROVED" target="ReadyForSignOff"/>
        </state>
      </state>
      <state name="SignedOff"/>
    </state>
  </class>
</qm>
```

### AMEND-08.6 — `rules/MONOTONIC_YAML_RULES_BUNDLE.yaml`

Three documents (`---`-separated, split in tests via `/^---$/m`). Global tier defines all `state_capabilities`; level/item tiers only narrow. Effective item floor for `L2.2` is `min_test_coverage_pct: 90` (max of 80/85/90), matching the SPEC-003 §6 test (88% denied, 92% allowed).

```yaml
tier: global
rules:
  min_test_coverage_pct: 80
  min_approvals: 1
  max_open_blockers: 3
  max_tokens: 1000000
  required_predicates: [require_clean_worktree, require_ci_green]
  state_capabilities:
    "/top":
      "hsm.transition:SIG_CANCEL": ["IMPL", "STEWARD", "PM"]
    "/top/HorizonWave":
      "hsm.transition:SIG_DECOMPOSE": ["IMPL", "STEWARD"]
    "/top/Operational/Executing/InProgress":
      "git.commit": ["IMPL"]
      "hsm.transition:SIG_SUBMIT_PR": ["IMPL"]
      "hsm.transition:SIG_BLOCK": ["IMPL", "STEWARD"]
    "/top/Operational/Executing/WaitingReview":
      "hsm.transition:SIG_VERIFY": ["REVIEW"]
      "hsm.transition:SIG_REJECT": ["REVIEW"]
    "/top/Operational/Executing/BlockedException":
      "hsm.transition:SIG_UNBLOCK": ["STEWARD"]
    "/top/Operational/ConservationMode":
      "hsm.transition:SIG_BUDGET_RESTORED": ["STEWARD", "PM"]
    "/top/VerifiedDone":
      "hsm.transition:SIG_REOPEN": ["STEWARD"]
      "hsm.transition:SIG_CONTRACT_DRIFT": ["IMPL", "REVIEW", "STEWARD"]
---
tier: level
level_id: LVL-2
rules:
  min_test_coverage_pct: 85
  max_open_blockers: 1
  state_capabilities:
    "/top/Operational/Executing/WaitingReview":
      "hsm.transition:SIG_VERIFY": ["REVIEW"]
---
tier: item
item_id: L2.2
rules:
  min_test_coverage_pct: 90
  max_open_blockers: 0
  state_capabilities:
    "/top/Operational/Executing/WaitingReview":
      "hsm.transition:SIG_VERIFY": ["REVIEW"]
```

### AMEND-08.7 — consistency notes with the existing test suites

- SPEC-002 §5 trace test: `executeLcaTransition(stageGateAst, "/top/GateGovernance/ReadyForSignOff", "SIG_TOLERANCE_BREACH")` yields `handledBySuperstatePath = "/top/GateGovernance"`, `lcaStatePath = "/top/GateGovernance"`, `toStatePath = "/top/GateGovernance/ExceptionEscalated"`, and the exact trace `[EXIT(ReadyForSignOff: seal_stage_audit_bundle();), ACTION(SIG_TOLERANCE_BREACH: steward.open_exception_report("ESC-STAGE");), ENTRY(ExceptionEscalated: halt_stage_progression(); alert_pm_escalation_channel();)]` — AMEND-08.1/08.2 produce exactly this.
- SPEC-003 §6: `git.commit` allowed for `@coder-01 [IMPL]` in `InProgress`, denied by Gate A in `WaitingReview`; `SIG_VERIFY` at 88% denied by Gate C with the `testCoveragePct (88%) < tightened min_test_coverage_pct (90%)` message, allowed at 92%.
- SPEC-004 §6: with roles `[IMPL, REVIEW, STEWARD, PM]` the linter is valid; with `[IMPL, STEWARD]` (no REVIEW) `/top/Operational/Executing/WaitingReview` is a `LINT_05_UNREACHABLE_GOAL_TRAP` (its only exits, `SIG_VERIFY`/`SIG_REJECT`, require REVIEW).
- SPEC-005 §5: `SIG_CONTRACT_DRIFT` from `/top/VerifiedDone` (AMEND-05.2) lands in `/top/Operational/Executing/InProgress`.

---

## Closing note

Applying AMEND-01 … AMEND-08 resolves every finding in the review (A1–A9, B1–B6, C1–C3, D) at the normative level (SPEC-001/003) and in the reference code, while keeping `allow: boolean` backward compatibility so the existing git hook contract and test assertions keep working. SPEC-008/SPEC-009 require no edits: their production laws are adopted by reference in AMEND-01.3.
