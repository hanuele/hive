import { QmModelAst } from "../hsm/qmXmlParser";
import { executeLcaTransition, getAncestorChain } from "../hsm/lcaEngine";
import { CompiledEffectiveRuleset } from "../rules/yamlLatticeCompiler";
import {
  appendConservedTemporalMutation,
  GraphTransactionRunner,
  RecordedTemporalEvent,
} from "../graph/lineageWriter";

export interface SessionRoleContext {
  sessionId: string;
  assignedRoles: string[]; // e.g., ["IMPL"]
}

export interface LiveItemContext {
  planId: string;
  itemId: string;
  levelId: string;
  hsmStatePath: string;
  // `null` = UNOBSERVED (SPEC-009 three-valued logic, AMEND-03.3/E3)
  testCoveragePct: number | null;
  openBlockersCount: number | null;
  prApprovalsCount: number | null;
  cleanWorktree: boolean | null;
  ciGreen: boolean | null;
  qmAstLintPass: boolean | null;
  unobservedFacts?: string[]; // explicit unobserved list (SPEC-009 B2 relevance cap)
  rulingId?: string;          // ruling that authorizes this evaluation, if any
}

export type MayDecisionAnswer = "yes" | "yes_if" | "ask" | "no" | "gap";

export interface MayEvaluationOutput {
  allow: boolean; // derived: decision === "yes" | "yes_if" (backward compatible)
  decision: MayDecisionAnswer;
  unobserved: string[]; // facts read by the rule that were unobserved/stale
  enforcerId: string;
  rulingId: string;
  sessionId: string;
  itemId: string;
  intent: string;
  hsmStatePath: string;
  definingStateForCapability: string;
  allowedRolesForIntent: string[];
  callerRoles: string[];
  denyReason?: string; // prefixed: "[<enforcerId> · <rulingId>] REFUSED: ..."
}

/** SPEC-009 F7 / lib/refusal_prefix.py refusal prefix (AMEND-01.3). */
export function formatRefusalPrefix(
  enforcerId: string,
  rulingId: string | undefined,
  reason: string
): string {
  return `[${enforcerId} · ${rulingId ?? "no ruling linked"}] REFUSED: ${reason}`;
}

/**
 * Resolves the role whitelist for `intent` by walking the QM HSM ancestor chain
 * from `/top` down to `activeStatePath`. B3 fix (AMEND-03.3): child states may
 * only NARROW parent whitelists — the result is the INTERSECTION down the chain,
 * never an overwrite (which would let a child widen a superstate's capability).
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

/**
 * Universal 3-Gate `may(session, item, intent)` evaluator used by Git hooks,
 * UI buttons, and `hsm.dispatch`. Five-valued epistemic decision (AMEND-01.3):
 * a fact read by Gate C that is unobserved caps the answer to "ask", never "no".
 */
export function evaluateMayGatekeeper(
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  session: SessionRoleContext,
  item: LiveItemContext,
  intent: string
): MayEvaluationOutput {
  const enforcerId = "mcp-may-gatekeeper";
  const rulingId = item.rulingId ?? "ruling:monotonic-hsm-v1";
  const unobservedSet = new Set<string>(item.unobservedFacts ?? []);

  const finish = (
    decision: MayDecisionAnswer,
    allowedRoles: string[],
    definingStatePath: string,
    unobserved: string[],
    reason?: string
  ): MayEvaluationOutput => ({
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
    denyReason: reason ? formatRefusalPrefix(enforcerId, item.rulingId, reason) : undefined,
  });

  // Gate A: QM HSM Superstate Capability Lookup (strict intersection, B3)
  const { allowedRoles, definingStatePath } = resolveHierarchicalStateCapability(
    ast,
    rules,
    item.hsmStatePath,
    intent
  );

  if (allowedRoles.length === 0) {
    return finish("no", [], definingStatePath, [],
      `Gate A (QM HSM Lock): Intent '${intent}' is disabled in state '${item.hsmStatePath}' (defined at '${definingStatePath}').`);
  }

  // Gate B: Multiplexed Session Role Intersection
  const hasMatchingRole = session.assignedRoles.some((r) =>
    allowedRoles.includes(r)
  );
  if (!hasMatchingRole) {
    return finish("no", allowedRoles, definingStatePath, [],
      `Gate B (Role Mismatch): Session '${session.sessionId}' roles [${session.assignedRoles.join(", ")}] not in allowed [${allowedRoles.join(", ")}].`);
  }

  // Gate C: Monotonic YAML Guard Predicates (nullable telemetry; unobserved => ask)
  const relevantUnobserved: string[] = [];

  if (rules.required_predicates.has("require_clean_worktree")) {
    if (item.cleanWorktree === null || unobservedSet.has("cleanWorktree")) {
      relevantUnobserved.push("cleanWorktree");
    } else if (!item.cleanWorktree) {
      return finish("no", allowedRoles, definingStatePath, [],
        `Gate C (Monotonic YAML): Predicate 'require_clean_worktree' failed on ${item.itemId}.`);
    }
  }

  if (
    intent !== "hsm.transition:SIG_UNBLOCK" &&
    intent !== "hsm.transition:SIG_BLOCK"
  ) {
    if (item.openBlockersCount === null || unobservedSet.has("openBlockersCount")) {
      relevantUnobserved.push("openBlockersCount");
    } else if (item.openBlockersCount > rules.max_open_blockers) {
      return finish("no", allowedRoles, definingStatePath, [],
        `Gate C (Monotonic YAML): openBlockersCount (${item.openBlockersCount}) > max_open_blockers (${rules.max_open_blockers}).`);
    }
  }

  if (intent === "hsm.transition:SIG_VERIFY" || intent === "git.merge") {
    if (item.testCoveragePct === null || unobservedSet.has("testCoveragePct")) {
      relevantUnobserved.push("testCoveragePct");
    } else if (item.testCoveragePct < rules.min_test_coverage_pct) {
      return finish("no", allowedRoles, definingStatePath, [],
        `Gate C (Monotonic YAML): testCoveragePct (${item.testCoveragePct}%) < tightened min_test_coverage_pct (${rules.min_test_coverage_pct}%).`);
    }
    if (rules.required_predicates.has("require_ci_green")) {
      if (item.ciGreen === null || unobservedSet.has("ciGreen")) {
        relevantUnobserved.push("ciGreen");
      } else if (!item.ciGreen) {
        return finish("no", allowedRoles, definingStatePath, [],
          `Gate C (Monotonic YAML): Predicate 'require_ci_green' failed on ${item.itemId}.`);
      }
    }
  }

  // SPEC-009 B2 relevance cap: unobserved facts => "ask", NEVER "no"
  if (relevantUnobserved.length > 0) {
    return finish("ask", allowedRoles, definingStatePath, relevantUnobserved,
      `Epistemic cap (ASK): required telemetry [${relevantUnobserved.join(", ")}] is UNOBSERVED on ${item.itemId}; escalate instead of denying.`);
  }

  return finish("yes", allowedRoles, definingStatePath, []);
}

/**
 * Full end-to-end transactional execution of `hsm.dispatch`:
 * 1. Evaluates `may(session, item, "hsm.transition:" + signal)`
 * 2. Computes LCA EXIT -> ACTION -> ENTRY chain on the `.qm` AST
 * 3. Writes the state mutation + SHA-256 chained TemporalEvent to Neo4j
 *    (idempotent when `idempotencyKey` is given, E2)
 */
export async function dispatchItemSignalTransactional(
  tx: GraphTransactionRunner,
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  session: SessionRoleContext,
  item: LiveItemContext,
  signal: string,
  idempotencyKey?: string,
  qmAstHash?: string
): Promise<{
  mayDecision: MayEvaluationOutput;
  recordedEvent: RecordedTemporalEvent;
}> {
  const intent = `hsm.transition:${signal}`;
  const mayDecision = evaluateMayGatekeeper(ast, rules, session, item, intent);

  if (!mayDecision.allow) {
    throw new Error(`MCP_ERR_MAY_DENIED: ${mayDecision.denyReason}`);
  }

  const lcaResult = executeLcaTransition(ast, item.hsmStatePath, signal);
  if (!lcaResult.handled || !lcaResult.lcaStatePath) {
    throw new Error(
      `MCP_ERR_UNHANDLED_SIGNAL: Signal '${signal}' is not handled in state '${item.hsmStatePath}' or its superstates.`
    );
  }

  const recordedEvent = await appendConservedTemporalMutation(tx, {
    planId: item.planId,
    sessionId: session.sessionId,
    targetId: item.itemId,
    targetLabel: "PlanItem",
    mcpVerb: "hsm.dispatch",
    signal,
    fromState: lcaResult.fromStatePath,
    toState: lcaResult.toStatePath,
    lcaState: lcaResult.lcaStatePath,
    entryExitTrace: lcaResult.executionTrace,
    idempotencyKey,
    qmAstHash,
  });

  return { mayDecision, recordedEvent };
}
