import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import { compileMonotonicYamlChain } from "../src/rules/yamlLatticeCompiler";
import { InMemoryNeo4jTx } from "../src/graph/inMemoryTx";
import { createHttpGatekeeper, handleToolCall, OrchestratorDeps } from "../src/mcp/server";
import { LiveItemContext } from "../src/mcp/orchestrator";
import { LevelToleranceSnapshot } from "../src/steward/stewardAuditEngine";

function buildDeps(): { deps: OrchestratorDeps; tx: InMemoryNeo4jTx } {
  const tx = new InMemoryNeo4jTx();
  const planAst = parseQmXmlToAst(fs.readFileSync("./models/plan_item.qm", "utf-8"));
  const gateAst = parseQmXmlToAst(fs.readFileSync("./models/stage_gate.qm", "utf-8"));
  const rules = compileMonotonicYamlChain(
    fs.readFileSync("./rules/MONOTONIC_YAML_RULES_BUNDLE.yaml", "utf-8").split(/^---$/m)
  );

  const baseItem: LiveItemContext = {
    planId: "PLAN-CORE-2026",
    itemId: "L2.2",
    levelId: "LVL-2",
    hsmStatePath: "/top/Operational/Executing/InProgress",
    testCoveragePct: 92,
    openBlockersCount: 0,
    prApprovalsCount: 2,
    cleanWorktree: true,
    ciGreen: true,
    qmAstLintPass: true,
  };
  const level: LevelToleranceSnapshot = {
    id: "LVL-2",
    index: 2,
    horizonMode: "ACTIVE",
    plannedDays: 10,
    elapsedDays: 1,
    timeToleranceDays: 2,
    tokenBudgetMax: 100000,
    tokenBurnCurrent: 1000,
    tokenTolerancePct: 0.1,
    minStageCoveragePct: 85,
  };

  const deps: OrchestratorDeps = {
    tx,
    planAst,
    gateAst,
    rules,
    getItemContext: async (itemId) => ({
      ...baseItem,
      itemId,
      hsmStatePath: tx.itemStates.get(itemId) ?? baseItem.hsmStatePath,
    }),
    getSessionRoles: async () => ["IMPL"],
    getLevel: async () => level,
    getLevelForItem: async () => level,
    getItemsOfLevel: async () => [],
    getGate: async () => ({
      id: "G2",
      fromLevelId: "LVL-2",
      toLevelId: "LVL-3",
      hsmStatePath: "/top/GateGovernance/Locked",
      exceptionPlanApproved: false,
    }),
    getPlanProjection: async (planId) => ({
      planId,
      title: "Local QM HSM & MCP Orchestration Plan",
      headEventHash: tx.headHash,
      generatedAtIso: new Date().toISOString(),
      levels: [],
    }),
    getEvents: async () => tx.events,
  };
  return { deps, tx };
}

describe("SPEC-003 MCP server: tool registry & loopback HTTP gatekeeper", () => {
  it("handleToolCall may/hsm.dispatch/rules.compile_check/lineage.verify", async () => {
    const { deps, tx } = buildDeps();

    const mayCommit = await handleToolCall(deps, "may", {
      sessionId: "@coder-01",
      itemId: "L2.2",
      intent: "git.commit",
    });
    expect(mayCommit.allow).toBe(true);

    const dispatched = await handleToolCall(deps, "hsm.dispatch", {
      sessionId: "@coder-01",
      itemId: "L2.2",
      signal: "SIG_SUBMIT_PR",
    });
    expect(dispatched.recordedEvent.toState).toBe(
      "/top/Operational/Executing/WaitingReview"
    );

    const mayCommitInReview = await handleToolCall(deps, "may", {
      sessionId: "@coder-01",
      itemId: "L2.2",
      intent: "git.commit",
    });
    expect(mayCommitInReview.allow).toBe(false);
    expect(mayCommitInReview.denyReason).toContain("Gate A (QM HSM Lock)");

    const compiled = await handleToolCall(deps, "rules.compile_check", {
      itemId: "L2.2",
    });
    expect(compiled.min_test_coverage_pct).toBe(90);
    expect(compiled.required_predicates).toContain("require_qm_ast_lint");

    const lineage = await handleToolCall(deps, "lineage.verify", {
      planId: "PLAN-CORE-2026",
    });
    expect(lineage.valid).toBe(true);
    expect(tx.events).toHaveLength(1);
  });

  it("serves POST /mcp/may with top-level .allow for the pre-commit hook, over loopback HTTP", async () => {
    const { deps } = buildDeps();
    const gatekeeper = createHttpGatekeeper(deps, { host: "127.0.0.1", port: 0 });
    const port = await gatekeeper.listen();
    afterAll(async () => {
      await gatekeeper.close();
    });

    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.status).toBe(200);
      expect(((await health.json()) as any).ok).toBe(true);

      const mayRes = await fetch(`http://127.0.0.1:${port}/mcp/may`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "@coder-01",
          itemId: "L2.2",
          intent: "git.commit",
        }),
      });
      const mayBody: any = await mayRes.json();
      expect(mayRes.status).toBe(200);
      expect(mayBody.allow).toBe(true);

      const dispatchRes = await fetch(`http://127.0.0.1:${port}/mcp/hsm.dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "@coder-01",
          itemId: "L2.2",
          signal: "SIG_SUBMIT_PR",
        }),
      });
      const dispatchBody: any = await dispatchRes.json();
      expect(dispatchBody.ok).toBe(true);
      expect(dispatchBody.result.recordedEvent.toState).toBe(
        "/top/Operational/Executing/WaitingReview"
      );

      const deniedRes = await fetch(`http://127.0.0.1:${port}/mcp/may`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "@coder-01",
          itemId: "L2.2",
          intent: "git.commit",
        }),
      });
      const deniedBody: any = await deniedRes.json();
      expect(deniedBody.allow).toBe(false);
      expect(deniedBody.denyReason).toContain("Gate A");
    } finally {
      await gatekeeper.close();
    }
  });
});
