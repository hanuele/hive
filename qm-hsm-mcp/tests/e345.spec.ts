import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import {
  compileMonotonicYamlChain,
  MonotonicityViolationError,
} from "../src/rules/yamlLatticeCompiler";
import { InMemoryNeo4jTx } from "../src/graph/inMemoryTx";
import { rehydrateItemStates, verifyTemporalLineageIntegrity } from "../src/graph/lineageWriter";
import {
  evaluateMayGatekeeper,
  dispatchItemSignalTransactional,
  LiveItemContext,
} from "../src/mcp/orchestrator";
import { handleToolCall, OrchestratorDeps } from "../src/mcp/server";

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

describe("E3 (AMEND-09.3): telemetry staleness bounds compile monotonically", () => {
  it("applies defaults, then tightens per tier (min wins)", () => {
    expect(rules.telemetry_max_age_seconds.testCoveragePct).toBe(3600); // global default
    expect(rules.telemetry_max_age_seconds.ciGreen).toBe(60); // LEVEL tightened 300 -> 60
    expect(rules.ask_ttl_seconds).toBe(600); // ITEM tightened 900 -> 600
  });

  it("rejects a child tier that relaxes a staleness bound or the ask TTL", () => {
    const globalDoc = yamlBundle[0];
    const badAge = `${globalDoc}\n---\ntier: "LEVEL"\ntarget_id: "X"\nguards:\n  telemetry_max_age_seconds:\n    ciGreen: 99999\n`;
    expect(() => compileMonotonicYamlChain(badAge.split(/^---$/m))).toThrow(
      MonotonicityViolationError
    );
    const badTtl = `${globalDoc}\n---\ntier: "ITEM"\ntarget_id: "L2.2"\nguards:\n  ask_ttl_seconds: 99999\n`;
    expect(() => compileMonotonicYamlChain(badTtl.split(/^---$/m))).toThrow(
      MonotonicityViolationError
    );
  });

  it("rejects a child tier introducing a (state, intent) the parent never defined", () => {
    const globalDoc = yamlBundle[0];
    const badCap = `${globalDoc}\n---\ntier: "LEVEL"\ntarget_id: "X"\nguards: {}\nstate_capabilities:\n  "/top/HorizonWave":\n    allowed_intents:\n      "brand.new.intent": ["IMPL"]\n`;
    expect(() => compileMonotonicYamlChain(badCap.split(/^---$/m))).toThrow(
      MonotonicityViolationError
    );
  });
});

describe("E3: Gate C treats stale telemetry like unobserved (ask, never no)", () => {
  const reviewItem: LiveItemContext = {
    ...baseItem,
    hsmStatePath: "/top/Operational/Executing/WaitingReview",
    telemetryObservedAt: {
      testCoveragePct: new Date().toISOString(), // fresh
      ciGreen: new Date(Date.now() - 2 * 3600_000).toISOString(), // 2h old > 60s bound
      cleanWorktree: new Date().toISOString(),
      openBlockersCount: new Date().toISOString(),
    },
  };

  it("stale ciGreen caps SIG_VERIFY to ask with ciGreen listed", () => {
    const res = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
      reviewItem,
      "hsm.transition:SIG_VERIFY"
    );
    expect(res.allow).toBe(false);
    expect(res.decision).toBe("ask");
    expect(res.unobserved).toContain("ciGreen");
    expect(res.denyReason).toContain("STALE");
  });

  it("fresh telemetry passes; a field missing from a published observedAt map is unobserved", () => {
    const fresh = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
      {
        ...reviewItem,
        telemetryObservedAt: {
          testCoveragePct: new Date().toISOString(),
          ciGreen: new Date().toISOString(),
          cleanWorktree: new Date().toISOString(),
          openBlockersCount: new Date().toISOString(),
        },
      },
      "hsm.transition:SIG_VERIFY"
    );
    expect(fresh.decision).toBe("yes");
    expect(fresh.allow).toBe(true);

    const missing = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
      { ...reviewItem, telemetryObservedAt: { testCoveragePct: new Date().toISOString() } },
      "hsm.transition:SIG_VERIFY"
    );
    expect(missing.decision).toBe("ask");
  });

  it("legacy mode (no observedAt map) keeps trusting telemetry", () => {
    const res = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      baseItem,
      "git.commit"
    );
    expect(res.decision).toBe("yes");
  });
});

function buildDeps(tx: InMemoryNeo4jTx): OrchestratorDeps {
  return {
    tx,
    planAst: ast,
    gateAst: ast,
    rules,
    qmAstHash: "qmhash-e345",
    askRegistry: new Map<string, string>(),
    getItemStateMap: () => tx.itemStates,
    getItemContext: async (itemId) => ({
      ...baseItem,
      itemId,
      hsmStatePath: tx.itemStates.get(itemId) ?? baseItem.hsmStatePath,
      testCoveragePct: null, // UNOBSERVED -> ask for SIG_VERIFY
    }),
    getSessionRoles: async (sessionId) =>
      sessionId === "@reviewer-02" ? ["REVIEW"] : sessionId === "@steward-01" ? ["STEWARD"] : ["IMPL"],
    getLevel: async () => ({ id: "LVL-2", index: 2, horizonMode: "ACTIVE", plannedDays: 10, elapsedDays: 1, timeToleranceDays: 2, tokenBudgetMax: 100000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 85 }),
    getLevelForItem: async () => ({ id: "LVL-2", index: 2, horizonMode: "ACTIVE", plannedDays: 10, elapsedDays: 1, timeToleranceDays: 2, tokenBudgetMax: 100000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 85 }),
    getItemsOfLevel: async () => [],
    getGate: async () => ({ id: "G2", fromLevelId: "LVL-2", toLevelId: "LVL-3", hsmStatePath: "/top/GateGovernance/Locked", exceptionPlanApproved: false }),
    getPlanProjection: async (planId) => ({ planId, title: "t", headEventHash: tx.headHash, generatedAtIso: new Date().toISOString(), levels: [] }),
    getEvents: async () => tx.events,
  };
}

describe("E4 (AMEND-09.4): rehydration replays the conserved chain", () => {
  it("rehydrateItemStates rebuilds item states and InMemoryNeo4jTx.rehydrate restores memory", async () => {
    const tx = new InMemoryNeo4jTx();
    const r1 = await dispatchItemSignalTransactional(
      tx, ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      baseItem, "SIG_SUBMIT_PR", "k1"
    );
    const r2 = await dispatchItemSignalTransactional(
      tx, ast, rules,
      { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
      { ...baseItem, hsmStatePath: r1.recordedEvent.toState },
      "SIG_VERIFY", "k2"
    );
    expect(verifyTemporalLineageIntegrity([r1.recordedEvent, r2.recordedEvent]).valid).toBe(true);

    // simulate a crash: wipe memory, then rehydrate from the chain
    const rebuilt = rehydrateItemStates(tx.events);
    expect(rebuilt.get("L2.2")).toBe("/top/VerifiedDone");

    const tx2 = new InMemoryNeo4jTx();
    tx2.events = [...tx.events];
    tx2.itemStates.clear();
    tx2.headHash = "GENESIS_0000000000000000";
    tx2.rehydrate();
    expect(tx2.itemStates.get("L2.2")).toBe("/top/VerifiedDone");
    expect(tx2.headHash).toBe(r2.recordedEvent.chainHash);
  });

  it("lineage.reconcile reports a valid chain and no mismatches", async () => {
    const tx = new InMemoryNeo4jTx();
    const deps = buildDeps(tx);
    await handleToolCall(deps, "hsm.dispatch", {
      sessionId: "@coder-01", itemId: "L2.2", signal: "SIG_SUBMIT_PR",
    });
    const res = await handleToolCall(deps, "lineage.reconcile", { planId: "PLAN-CORE-2026" });
    expect(res.valid).toBe(true);
    expect(res.mismatches).toEqual([]);
    expect(res.rehydrated).toBe(false);
  });
});

describe("E5 (AMEND-09.5): ask escalation workflow + ruling.record", () => {
  it("posts SIG_ESCALATE_ASK once (idempotent), then hardens to no after the TTL", async () => {
    const tx = new InMemoryNeo4jTx();
    const deps = buildDeps(tx);
    // force the item into WaitingReview so Gate A allows REVIEW to SIG_VERIFY
    await handleToolCall(deps, "hsm.dispatch", {
      sessionId: "@coder-01", itemId: "L2.2", signal: "SIG_SUBMIT_PR",
    });
    tx.events.length = 0; // reset lineage; keep item state
    tx.headHash = "GENESIS_0000000000000000";

    const mayArgs = { sessionId: "@reviewer-02", itemId: "L2.2", intent: "hsm.transition:SIG_VERIFY" };

    const first = await handleToolCall(deps, "may", mayArgs);
    expect(first.decision).toBe("ask");
    expect(tx.events.filter((e) => e.signal === "SIG_ESCALATE_ASK")).toHaveLength(1);

    const second = await handleToolCall(deps, "may", mayArgs);
    expect(second.decision).toBe("ask");
    expect(tx.events.filter((e) => e.signal === "SIG_ESCALATE_ASK")).toHaveLength(1); // idempotent

    // age the ask beyond the TTL (effective ask_ttl_seconds = 600)
    deps.askRegistry!.set("L2.2|hsm.transition:SIG_VERIFY", new Date(Date.now() - 700_000).toISOString());
    const third = await handleToolCall(deps, "may", mayArgs);
    expect(third.decision).toBe("no");
    expect(third.denyReason).toContain("Ask TTL expired");
  });

  it("steward records a ruling as a chained ruling.record event, citable via rulingId", async () => {
    const tx = new InMemoryNeo4jTx();
    const deps = buildDeps(tx);

    const ruling = await handleToolCall(deps, "ruling.record", {
      sessionId: "@steward-01",
      itemId: "L2.2",
      intent: "hsm.transition:SIG_VERIFY",
      rulingId: "ruling:coverage-observed-92",
      answer: "yes",
    });
    expect(ruling.recordedEvent.mcpVerb).toBe("ruling.record");
    expect(tx.events.some((e) => e.mcpVerb === "ruling.record" && e.signal === "SIG_RULING")).toBe(true);
    expect(verifyTemporalLineageIntegrity(tx.events).valid).toBe(true);

    // a non-steward may NOT record rulings
    await expect(
      handleToolCall(deps, "ruling.record", {
        sessionId: "@coder-01", itemId: "L2.2", intent: "x", rulingId: "ruling:evil", answer: "yes",
      })
    ).rejects.toThrow(/MCP_ERR_MAY_DENIED/);

    // later may() calls can cite the ruling
    const cited = evaluateMayGatekeeper(
      ast, rules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      { ...baseItem, rulingId: "ruling:coverage-observed-92" },
      "git.commit"
    );
    expect(cited.rulingId).toBe("ruling:coverage-observed-92");
  });
});
