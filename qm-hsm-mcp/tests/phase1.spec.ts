import { describe, it, expect } from "vitest";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import { executeLcaTransition } from "../src/hsm/lcaEngine";
import {
  compileMonotonicYamlChain,
  MonotonicityViolationError,
} from "../src/rules/yamlLatticeCompiler";
import fs from "node:fs";

const sampleQmXml = fs.readFileSync("./models/plan_item.qm", "utf-8");

describe("SPEC-001 Phase 1: Direct .qm XML AST & LCA Engine", () => {
  it("resolves relative .qm coordinates (../1/0/0) to canonical state paths", () => {
    const ast = parseQmXmlToAst(sampleQmXml);
    expect(ast.statesByPath.has("/top/Operational/Executing/InProgress")).toBe(true);

    const horizon = ast.statesByPath.get("/top/HorizonWave")!;
    const decomposeTran = horizon.transitions.get("SIG_DECOMPOSE")!;
    expect(decomposeTran.targetPath).toBe("/top/Operational/Executing/InProgress");
  });

  it("bubbles unhandled leaf signal SIG_BLOCK up via Q_SUPER to /top/Operational and computes LCA", () => {
    const ast = parseQmXmlToAst(sampleQmXml);
    const res = executeLcaTransition(
      ast,
      "/top/Operational/Executing/InProgress",
      "SIG_BLOCK"
    );

    expect(res.handled).toBe(true);
    expect(res.inheritedViaQSuper).toBe(true);
    expect(res.handledBySuperstatePath).toBe("/top/Operational");
    expect(res.lcaStatePath).toBe("/top/Operational");
    expect(res.toStatePath).toBe("/top/Operational/BlockedException");

    // Verify exact bottom-up EXIT and top-down ENTRY order
    expect(res.executionTrace).toEqual([
      "EXIT(InProgress: freeze_working_tree_diff();)",
      "EXIT(Executing: snapshot_execution_metrics();)",
      'ACTION(SIG_BLOCK: steward.raise_exception("ESC-09");)',
      'ENTRY(BlockedException: enable_git_commit_hook(DENY_ALL); escalate_to_steward("ESC-09");)',
    ]);
  });
});

describe("SPEC-001 Phase 1: Monotonic YAML Lattice Compiler", () => {
  const globalYaml = `
schema_version: "1.0"
tier: "GLOBAL"
target_id: "GLOBAL"
state_capabilities:
  "/top/Operational/Executing/InProgress":
    allowed_intents:
      git.commit: ["IMPL", "PM"]
guards:
  min_test_coverage_pct: 70
  max_open_blockers: 0
  required_predicates:
    - "require_clean_worktree"
`;

  const validLevel2Yaml = `
schema_version: "1.0"
tier: "LEVEL"
target_id: "LVL-2"
state_capabilities:
  "/top/Operational/Executing/InProgress":
    allowed_intents:
      git.commit: ["IMPL"]
guards:
  min_test_coverage_pct: 85
  max_open_blockers: 0
  required_predicates:
    - "require_clean_worktree"
    - "require_ci_green"
`;

  it("compiles valid monotonic tightening across tiers", () => {
    const compiled = compileMonotonicYamlChain([globalYaml, validLevel2Yaml]);
    expect(compiled.min_test_coverage_pct).toBe(85);
    expect(compiled.required_predicates.has("require_ci_green")).toBe(true);
    expect(
      compiled.state_capabilities["/top/Operational/Executing/InProgress"]["git.commit"]
    ).toEqual(["IMPL"]);
  });

  it("throws MonotonicityViolationError when a child YAML attempts to lower min_test_coverage_pct", () => {
    const illegalChildYaml = `
schema_version: "1.0"
tier: "ITEM"
target_id: "L2.2"
guards:
  min_test_coverage_pct: 80
`;
    expect(() =>
      compileMonotonicYamlChain([globalYaml, validLevel2Yaml, illegalChildYaml])
    ).toThrow(MonotonicityViolationError);
  });
});
