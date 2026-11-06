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
  testCoveragePct: number;
  openBlockersCount: number;
  prApprovalsCount: number;
  cleanWorktree: boolean;
  ciGreen: boolean;
  qmAstLintPass: boolean;
}

export interface MayEvaluationOutput {
  allow: boolean;
  sessionId: string;
  itemId: string;
  intent: string;
  hsmStatePath: string;
  definingStateForCapability: string;
  allowedRolesForIntent: string[];
  callerRoles: string[];
  denyReason?: string;
}

/**
 * Resolves the role whitelist for `intent` by walking the QM HSM ancestor chain
 * from `/top` down to `activeStatePath`, where child states narrow parent whitelists.
 */
export function resolveHierarchicalStateCapability(
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  activeStatePath: string,
  intent: string
): { allowedRoles: string[]; definingStatePath: string } {
  const chain = getAncestorChain(ast, activeStatePath);
  let allowedRoles: string[] = [];
  let definingStatePath = "/top";

  for (const stateNode of chain) {
    const stateCaps = rules.state_capabilities[stateNode.path];
    if (stateCaps && Object.prototype.hasOwnProperty.call(stateCaps, intent)) {
      allowedRoles = stateCaps[intent];
      definingStatePath = stateNode.path;
    }
  }
  return { allowedRoles, definingStatePath };
}

/**
 * Universal 3-Gate `may(session, item, intent)` evaluator used by Git hooks,
 * UI buttons, and `hsm.dispatch`.
 */
export function evaluateMayGatekeeper(
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  session: SessionRoleContext,
  item: LiveItemContext,
  intent: string
): MayEvaluationOutput {
  // Gate A: QM HSM Superstate Capability Lookup
  const { allowedRoles, definingStatePath } = resolveHierarchicalStateCapability(
    ast,
    rules,
    item.hsmStatePath,
    intent
  );

  if (allowedRoles.length === 0) {
    return {
      allow: false,
      sessionId: session.sessionId,
      itemId: item.itemId,
      intent,
      hsmStatePath: item.hsmStatePath,
      definingStateForCapability: definingStatePath,
      allowedRolesForIntent: [],
      callerRoles: session.assignedRoles,
      denyReason: `Gate A (QM HSM Lock): Intent '${intent}' is disabled in state '${item.hsmStatePath}' (defined at '${definingStatePath}').`,
    };
  }

  // Gate B: Multiplexed Session Role Intersection
  const hasMatchingRole = session.assignedRoles.some((r) =>
    allowedRoles.includes(r)
  );
  if (!hasMatchingRole) {
    return {
      allow: false,
      sessionId: session.sessionId,
      itemId: item.itemId,
      intent,
      hsmStatePath: item.hsmStatePath,
      definingStateForCapability: definingStatePath,
      allowedRolesForIntent: allowedRoles,
      callerRoles: session.assignedRoles,
      denyReason: `Gate B (Role Mismatch): Session '${session.sessionId}' roles [${session.assignedRoles.join(", ")}] not in allowed [${allowedRoles.join(", ")}].`,
    };
  }

  // Gate C: Monotonic YAML Guard Predicates
  if (
    rules.required_predicates.has("require_clean_worktree") &&
    !item.cleanWorktree
  ) {
    return {
      allow: false,
      sessionId: session.sessionId,
      itemId: item.itemId,
      intent,
      hsmStatePath: item.hsmStatePath,
      definingStateForCapability: definingStatePath,
      allowedRolesForIntent: allowedRoles,
      callerRoles: session.assignedRoles,
      denyReason: `Gate C (Monotonic YAML): Predicate 'require_clean_worktree' failed on ${item.itemId}.`,
    };
  }

  if (
    intent !== "hsm.transition:SIG_UNBLOCK" &&
    intent !== "hsm.transition:SIG_BLOCK" &&
    item.openBlockersCount > rules.max_open_blockers
  ) {
    return {
      allow: false,
      sessionId: session.sessionId,
      itemId: item.itemId,
      intent,
      hsmStatePath: item.hsmStatePath,
      definingStateForCapability: definingStatePath,
      allowedRolesForIntent: allowedRoles,
      callerRoles: session.assignedRoles,
      denyReason: `Gate C (Monotonic YAML): openBlockersCount (${item.openBlockersCount}) > max_open_blockers (${rules.max_open_blockers}).`,
    };
  }

  if (intent === "hsm.transition:SIG_VERIFY" || intent === "git.merge") {
    if (item.testCoveragePct < rules.min_test_coverage_pct) {
      return {
        allow: false,
        sessionId: session.sessionId,
        itemId: item.itemId,
        intent,
        hsmStatePath: item.hsmStatePath,
        definingStateForCapability: definingStatePath,
        allowedRolesForIntent: allowedRoles,
        callerRoles: session.assignedRoles,
        denyReason: `Gate C (Monotonic YAML): testCoveragePct (${item.testCoveragePct}%) < tightened min_test_coverage_pct (${rules.min_test_coverage_pct}%).`,
      };
    }
    if (
      rules.required_predicates.has("require_ci_green") &&
      !item.ciGreen
    ) {
      return {
        allow: false,
        sessionId: session.sessionId,
        itemId: item.itemId,
        intent,
        hsmStatePath: item.hsmStatePath,
        definingStateForCapability: definingStatePath,
        allowedRolesForIntent: allowedRoles,
        callerRoles: session.assignedRoles,
        denyReason: `Gate C (Monotonic YAML): Predicate 'require_ci_green' failed on ${item.itemId}.`,
      };
    }
  }

  return {
    allow: true,
    sessionId: session.sessionId,
    itemId: item.itemId,
    intent,
    hsmStatePath: item.hsmStatePath,
    definingStateForCapability: definingStatePath,
    allowedRolesForIntent: allowedRoles,
    callerRoles: session.assignedRoles,
  };
}

/**
 * Full end-to-end transactional execution of `hsm.dispatch`:
 * 1. Evaluates `may(session, item, "hsm.transition:" + signal)`
 * 2. Computes LCA EXIT -> ACTION -> ENTRY chain on the `.qm` AST
 * 3. Writes the state mutation + SHA-256 chained TemporalEvent to Neo4j
 */
export async function dispatchItemSignalTransactional(
  tx: GraphTransactionRunner,
  ast: QmModelAst,
  rules: CompiledEffectiveRuleset,
  session: SessionRoleContext,
  item: LiveItemContext,
  signal: string
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
  });

  return { mayDecision, recordedEvent };
}
