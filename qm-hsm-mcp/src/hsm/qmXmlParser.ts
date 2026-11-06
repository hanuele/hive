import { XMLParser } from "fast-xml-parser";

export interface QmTransitionAst {
  trig: string;
  sourcePath: string;
  rawRelativeTarget: string;
  targetPath: string;
  guardExpr?: string;
  actionHooks: string[];
}

export interface QmStateNodeAst {
  name: string;
  path: string;
  parentPath: string | null;
  depth: number;
  entryHooks: string[];
  exitHooks: string[];
  transitions: Map<string, QmTransitionAst>;
  childPaths: string[];
  initialTargetPath?: string;
}

export interface QmModelAst {
  framework: string;
  initialPath: string;
  statesByPath: Map<string, QmStateNodeAst>;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["state", "tran"].includes(name),
});

function asText(raw: unknown): string | undefined {
  return typeof raw === "string" ? raw : undefined;
}

function splitActions(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s};`);
}

/**
 * Resolves a Quantum Leaps relative coordinate string (e.g., "../1/0" or "../../../2")
 * starting from `sourceStatePath` using the ordered childPaths tree.
 */
export function resolveQmRelativeTarget(
  sourceStatePath: string,
  rawTarget: string,
  statesByPath: Map<string, QmStateNodeAst>
): string {
  const segments = rawTarget.split("/").filter(Boolean);
  let cursorPath = sourceStatePath;

  for (const seg of segments) {
    const cursorNode = statesByPath.get(cursorPath);
    if (!cursorNode) {
      throw new Error(`Invalid cursor path '${cursorPath}' while resolving '${rawTarget}'`);
    }
    if (seg === "..") {
      if (!cursorNode.parentPath) {
        throw new Error(`Cannot walk '..' above root '/top' from '${sourceStatePath}' (${rawTarget})`);
      }
      cursorPath = cursorNode.parentPath;
    } else if (/^\d+$/.test(seg)) {
      const idx = parseInt(seg, 10);
      if (idx < 0 || idx >= cursorNode.childPaths.length) {
        throw new Error(
          `Child index ${idx} out of bounds on state '${cursorPath}' (children: ${cursorNode.childPaths.length})`
        );
      }
      cursorPath = cursorNode.childPaths[idx];
    } else {
      throw new Error(`Unsupported relative coordinate token '${seg}' in '${rawTarget}'`);
    }
  }
  return cursorPath;
}

export function parseQmXmlToAst(xmlContent: string): QmModelAst {
  const doc = xmlParser.parse(xmlContent);
  const model = doc.model;
  if (!model) throw new Error("Missing root <model> element in .qm XML");

  const pkg = Array.isArray(model.package) ? model.package[0] : model.package;
  const cls = Array.isArray(pkg.class) ? pkg.class[0] : pkg.class;
  const sc = cls.statechart;

  const statesByPath = new Map<string, QmStateNodeAst>();
  const deferredTransitions: Array<{
    ownerPath: string;
    rawTran: any;
  }> = [];
  const deferredInitials: Array<{
    ownerPath: string;
    rawInitial: any;
  }> = [];

  const rootNode: QmStateNodeAst = {
    name: "top",
    path: "/top",
    parentPath: null,
    depth: 0,
    entryHooks: ["init_neo4j_context();"],
    exitHooks: ["flush_audit_log();"],
    transitions: new Map(),
    childPaths: [],
  };
  statesByPath.set("/top", rootNode);

  function walkStates(rawStates: any[] | undefined, parentPath: string, depth: number) {
    if (!rawStates) return;
    const parentNode = statesByPath.get(parentPath)!;

    for (const st of rawStates) {
      const name = st["@_name"];
      const path = `${parentPath}/${name}`;
      parentNode.childPaths.push(path);

      const node: QmStateNodeAst = {
        name,
        path,
        parentPath,
        depth,
        entryHooks: splitActions(asText(st.entry)),
        exitHooks: splitActions(asText(st.exit)),
        transitions: new Map(),
        childPaths: [],
      };
      statesByPath.set(path, node);

      if (st.tran) {
        for (const tr of st.tran) {
          deferredTransitions.push({ ownerPath: path, rawTran: tr });
        }
      }
      if (st.initial) {
        deferredInitials.push({ ownerPath: path, rawInitial: st.initial });
      }
      walkStates(st.state, path, depth + 1);
    }
  }

  walkStates(sc.state, "/top", 1);

  // Resolve all transitions now that the full state tree is indexed
  for (const { ownerPath, rawTran } of deferredTransitions) {
    const trig = rawTran["@_trig"];
    const rawRelativeTarget = rawTran["@_target"];
    const explicitTargetPath = rawTran["@_target_path"];

    const resolvedPath = resolveQmRelativeTarget(ownerPath, rawRelativeTarget, statesByPath);
    if (explicitTargetPath && explicitTargetPath !== resolvedPath) {
      throw new Error(
        `QM Target Mismatch on ${ownerPath} [${trig}]: relative '${rawRelativeTarget}' resolved to '${resolvedPath}', expected '${explicitTargetPath}'`
      );
    }

    const ownerNode = statesByPath.get(ownerPath)!;
    ownerNode.transitions.set(trig, {
      trig,
      sourcePath: ownerPath,
      rawRelativeTarget,
      targetPath: resolvedPath,
      guardExpr: asText(rawTran.guard)?.trim() || undefined,
      actionHooks: splitActions(asText(rawTran.action)),
    });
  }

  // Resolve composite-state <initial> drill-down targets (SPEC-001 §3.2 step 3d)
  for (const { ownerPath, rawInitial } of deferredInitials) {
    const rawTarget = rawInitial["@_target"];
    const explicitTargetPath = rawInitial["@_target_path"];
    const resolvedPath = resolveQmRelativeTarget(ownerPath, rawTarget, statesByPath);
    if (explicitTargetPath && explicitTargetPath !== resolvedPath) {
      throw new Error(
        `QM Initial Mismatch on ${ownerPath}: relative '${rawTarget}' resolved to '${resolvedPath}', expected '${explicitTargetPath}'`
      );
    }
    statesByPath.get(ownerPath)!.initialTargetPath = resolvedPath;
  }

  const initialAttr = sc.initial?.["@_target_path"] || "/top/HorizonWave";

  return {
    framework: model["@_framework"] || "qpcpp",
    initialPath: initialAttr,
    statesByPath,
  };
}
