import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import { compileMonotonicYamlChain, CompiledEffectiveRuleset } from "../src/rules/yamlLatticeCompiler";
import { InMemoryNeo4jTx } from "../src/graph/inMemoryTx";
import { verifyTemporalLineageIntegrity } from "../src/graph/lineageWriter";
import {
  evaluateMayGatekeeper,
  resolveHierarchicalStateCapability,
  dispatchItemSignalTransactional,
  LiveItemContext,
  formatRefusalPrefix,
} from "../src/mcp/orchestrator";
import { createHttpGatekeeper, OrchestratorDeps } from "../src/mcp/server";

const planItemXml = fs.readFileSync("./models/plan_item.qm", "utf-8");
const yamlBundle = fs
  .readFileSync("./rules/MONOTONIC_YAML_RULES_BUNDLE.yaml", "utf-8")
  .split(/^---$/m);

const ast = parseQmXmlToAst(planItemXml);
const rules = compileMonotonicYamlChain(yamlBundle);

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

describe("B3 (AMEND-03.3): Gate A intersects down the state hierarchy — child states cannot widen", () => {
  it("intersects parent-state whitelists instead of overwriting them", () => {
    const crafted: CompiledEffectiveRuleset = {
      min_test_coverage_pct: 0,
      min_pr_approvals: 0,
      max_open_blockers: 99,
      max_token_burn: Number.POSITIVE_INFINITY,
      required_predicates: new Set(),
      state_capabilities: {
        "/top": { "weird.intent": ["PM"] },
        "/top/Operational": { "weird.intent": ["IMPL", "PM"] }, // child lists MORE roles
      },
    };
    // Old (buggy) overwrite would return ["IMPL", "PM"]; intersection must keep only ["PM"].
    const { allowedRoles } = resolveHierarchicalStateCapability(
      ast, crafted, "/top/Operational/Executing/InProgress", "weird.intent"
    );
    expect(allowedRoles).toEqual(["PM"]);
  });
});

describe("A1 (AMEND-01.3/03.3): five-valued epistemic may()", () => {
  it("returns decision fields and a refusal prefix, keeping allow backward-compatible", () => {
    const denied = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      { ...baseItem, hsmStatePath: "/top/Operational/Executing/WaitingReview" },
      "git.commit"
    );
    expect(denied.allow).toBe(false);
    expect(denied.decision).toBe("no");
    expect(denied.unobserved).toEqual([]);
    expect(denied.denyReason).toContain("Gate A (QM HSM Lock)");
    expect(denied.denyReason).toMatch(/^\[mcp-may-gatekeeper · /);

    const allowed = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      baseItem,
      "git.commit"
    );
    expect(allowed.allow).toBe(true);
    expect(allowed.decision).toBe("yes");
    expect(allowed.denyReason).toBeUndefined();
  });

  it("caps to decision=ask (never no) when Gate C telemetry is unobserved", () => {
    const res = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
      {
        ...baseItem,
        hsmStatePath: "/top/Operational/Executing/WaitingReview",
        testCoveragePct: null, // UNOBSERVED
      },
      "hsm.transition:SIG_VERIFY"
    );
    expect(res.allow).toBe(false);
    expect(res.decision).toBe("ask");
    expect(res.unobserved).toContain("testCoveragePct");
    expect(res.denyReason).toContain("REFUSED:");
  });

  it("formatRefusalPrefix matches SPEC-009 F7", () => {
    expect(formatRefusalPrefix("mcp-may-gatekeeper", "ruling:x", "boom"))
      .toBe("[mcp-may-gatekeeper · ruling:x] REFUSED: boom");
    expect(formatRefusalPrefix("mcp-may-gatekeeper", undefined, "boom"))
      .toContain("no ruling linked");
  });
});

describe("B6 (AMEND-03.2): timestamp is part of the chain hash", () => {
  it("detects timestamp tampering, not just payload tampering", async () => {
    const tx = new InMemoryNeo4jTx();
    const r1 = await dispatchItemSignalTransactional(
      tx, ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      baseItem, "SIG_SUBMIT_PR", "key-1", "qmhash-abc"
    );
    const r2 = await dispatchItemSignalTransactional(
      tx, ast, rules,
      { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
      { ...baseItem, hsmStatePath: r1.recordedEvent.toState, testCoveragePct: 92 },
      "SIG_VERIFY", "key-2", "qmhash-abc"
    );
    expect(verifyTemporalLineageIntegrity([r1.recordedEvent, r2.recordedEvent]).valid).toBe(true);

    const tamperedTs = { ...r1.recordedEvent, timestampIso: "1999-01-01T00:00:00.000Z" };
    expect(verifyTemporalLineageIntegrity([tamperedTs, r2.recordedEvent]).valid).toBe(false);
  });
});

describe("E2 (AMEND-09.2): idempotency keys dedup retries inside the locked transaction", () => {
  it("returns the original event on a retry with the same idempotencyKey", async () => {
    const tx = new InMemoryNeo4jTx();
    const first = await dispatchItemSignalTransactional(
      tx, ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      baseItem, "SIG_SUBMIT_PR", "commit-attempt-42"
    );
    const retry = await dispatchItemSignalTransactional(
      tx, ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      baseItem, "SIG_SUBMIT_PR", "commit-attempt-42"
    );
    expect(tx.events).toHaveLength(1);
    expect(retry.recordedEvent.eventId).toBe(first.recordedEvent.eventId);
    expect(retry.recordedEvent.idempotencyKey).toBe("commit-attempt-42");
  });
});

describe("E1 (AMEND-09.1): loopback HTTP gatekeeper bearer auth", () => {
  function buildDeps(): OrchestratorDeps {
    const tx = new InMemoryNeo4jTx();
    return {
      tx,
      planAst: ast,
      gateAst: ast,
      rules,
      qmAstHash: "qmhash-abc",
      getItemContext: async (itemId) => ({ ...baseItem, itemId }),
      getSessionRoles: async () => ["IMPL"],
      getLevel: async () => ({ id: "LVL-2", index: 2, horizonMode: "ACTIVE", plannedDays: 10, elapsedDays: 1, timeToleranceDays: 2, tokenBudgetMax: 100000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 85 }),
      getLevelForItem: async () => ({ id: "LVL-2", index: 2, horizonMode: "ACTIVE", plannedDays: 10, elapsedDays: 1, timeToleranceDays: 2, tokenBudgetMax: 100000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 85 }),
      getItemsOfLevel: async () => [],
      getGate: async () => ({ id: "G2", fromLevelId: "LVL-2", toLevelId: "LVL-3", hsmStatePath: "/top/GateGovernance/Locked", exceptionPlanApproved: false }),
      getPlanProjection: async (planId) => ({ planId, title: "t", headEventHash: tx.headHash, generatedAtIso: new Date().toISOString(), levels: [] }),
      getEvents: async () => tx.events,
    };
  }

  it("rejects POST /mcp/* with 401 without a token and serves it with a valid Bearer token", async () => {
    const deps = buildDeps();
    const gatekeeper = createHttpGatekeeper(deps, { host: "127.0.0.1", port: 0, authToken: "secret-token" });
    const port = await gatekeeper.listen();
    afterAll(async () => { await gatekeeper.close(); });
    try {
      const body = JSON.stringify({ sessionId: "@coder-01", itemId: "L2.2", intent: "git.commit" });

      const noAuth = await fetch(`http://127.0.0.1:${port}/mcp/may`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
      });
      expect(noAuth.status).toBe(401);

      const wrongAuth = await fetch(`http://127.0.0.1:${port}/mcp/may`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer wrong" },
        body,
      });
      expect(wrongAuth.status).toBe(401);

      const ok = await fetch(`http://127.0.0.1:${port}/mcp/may`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer secret-token" },
        body,
      });
      expect(ok.status).toBe(200);
      expect(((await ok.json()) as any).allow).toBe(true);

      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.status).toBe(200);
      expect(((await health.json()) as any).authRequired).toBe(true);
    } finally {
      await gatekeeper.close();
    }
  });

  it("stays open when no authToken is configured (backward compatible)", async () => {
    const deps = buildDeps();
    const gatekeeper = createHttpGatekeeper(deps, { host: "127.0.0.1", port: 0, authToken: "" });
    const port = await gatekeeper.listen();
    afterAll(async () => { await gatekeeper.close(); });
    try {
      const res = await fetch(`http://127.0.0.1:${port}/mcp/may`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "@coder-01", itemId: "L2.2", intent: "git.commit" }),
      });
      expect(res.status).toBe(200);
    } finally {
      await gatekeeper.close();
    }
  });
});
