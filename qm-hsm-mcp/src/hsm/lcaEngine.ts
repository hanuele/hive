import { QmModelAst, QmStateNodeAst, QmTransitionAst } from "./qmXmlParser";

export interface LcaDispatchResult {
  handled: boolean;
  trig: string;
  handledBySuperstatePath: string | null;
  inheritedViaQSuper: boolean;
  fromStatePath: string;
  toStatePath: string;
  lcaStatePath: string | null;
  guardExpr?: string;
  executionTrace: string[];
}

export function getAncestorChain(ast: QmModelAst, statePath: string): QmStateNodeAst[] {
  const chain: QmStateNodeAst[] = [];
  let cursor: QmStateNodeAst | undefined = ast.statesByPath.get(statePath);
  if (!cursor) throw new Error(`Unknown HSM state path: ${statePath}`);

  while (cursor) {
    chain.unshift(cursor);
    cursor = cursor.parentPath ? ast.statesByPath.get(cursor.parentPath) : undefined;
  }
  return chain;
}

/**
 * Follows composite-state initial targets (SPEC-001 §3.2 step 3d) until a
 * state without an initial child is reached, yielding the effective leaf.
 */
export function resolveInitialDrillDown(ast: QmModelAst, targetPath: string): string {
  let cursor = targetPath;
  const seen = new Set<string>([cursor]);
  while (true) {
    const node = ast.statesByPath.get(cursor);
    if (!node || !node.initialTargetPath || seen.has(node.initialTargetPath)) {
      return cursor;
    }
    cursor = node.initialTargetPath;
    seen.add(cursor);
  }
}

/**
 * Walks bottom-up from `activeLeafPath` to `/top` (`Q_SUPER` behavioral inheritance)
 * to locate the innermost state that handles `trig`.
 */
export function resolveSignalWithQSuper(
  ast: QmModelAst,
  activeLeafPath: string,
  trig: string
): { handlingState: QmStateNodeAst; transition: QmTransitionAst } | null {
  let cursor: QmStateNodeAst | undefined = ast.statesByPath.get(activeLeafPath);
  while (cursor) {
    const found = cursor.transitions.get(trig);
    if (found) {
      return { handlingState: cursor, transition: found };
    }
    cursor = cursor.parentPath ? ast.statesByPath.get(cursor.parentPath) : undefined;
  }
  return null;
}

/**
 * Computes Lowest Common Ancestor (LCA) between `sourcePath` and `targetPath`
 * and produces the deterministic EXIT (bottom-up) -> ACTION -> ENTRY (top-down) trace.
 */
export function executeLcaTransition(
  ast: QmModelAst,
  activeLeafPath: string,
  trig: string
): LcaDispatchResult {
  const match = resolveSignalWithQSuper(ast, activeLeafPath, trig);
  if (!match) {
    return {
      handled: false,
      trig,
      handledBySuperstatePath: null,
      inheritedViaQSuper: false,
      fromStatePath: activeLeafPath,
      toStatePath: activeLeafPath,
      lcaStatePath: null,
      executionTrace: [],
    };
  }

  const { handlingState, transition } = match;
  const effectiveTargetPath = resolveInitialDrillDown(ast, transition.targetPath);
  const sourceAncestors = getAncestorChain(ast, activeLeafPath);
  const targetAncestors = getAncestorChain(ast, effectiveTargetPath);

  let lcaNode = sourceAncestors[0];
  const minLen = Math.min(sourceAncestors.length, targetAncestors.length);
  for (let i = 0; i < minLen; i++) {
    if (sourceAncestors[i].path === targetAncestors[i].path) {
      lcaNode = sourceAncestors[i];
    } else {
      break;
    }
  }

  const trace: string[] = [];

  // 1. EXIT bottom-up from activeLeafPath up to (excluding) LCA
  let exitCursor: QmStateNodeAst | undefined = ast.statesByPath.get(activeLeafPath);
  while (exitCursor && exitCursor.path !== lcaNode.path) {
    trace.push(`EXIT(${exitCursor.name}: ${exitCursor.exitHooks.join(" ")})`);
    exitCursor = exitCursor.parentPath ? ast.statesByPath.get(exitCursor.parentPath) : undefined;
  }

  // 2. Transition ACTION
  if (transition.actionHooks.length > 0) {
    trace.push(`ACTION(${trig}: ${transition.actionHooks.join(" ")})`);
  }

  // 3. ENTRY top-down from child of LCA down to effective target (incl. initial drill-down)
  const lcaIndexInTarget = targetAncestors.findIndex((n) => n.path === lcaNode.path);
  const entrySlice = targetAncestors.slice(lcaIndexInTarget + 1);
  for (const entryNode of entrySlice) {
    trace.push(`ENTRY(${entryNode.name}: ${entryNode.entryHooks.join(" ")})`);
  }

  return {
    handled: true,
    trig,
    handledBySuperstatePath: handlingState.path,
    inheritedViaQSuper: handlingState.path !== activeLeafPath,
    fromStatePath: activeLeafPath,
    toStatePath: effectiveTargetPath,
    lcaStatePath: lcaNode.path,
    guardExpr: transition.guardExpr,
    executionTrace: trace,
  };
}
