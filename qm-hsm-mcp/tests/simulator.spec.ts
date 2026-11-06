import { describe, it, expect } from "vitest";
import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";

/**
 * Loads the simulator's <script> from simulator/index.html into a bare VM
 * context (no DOM) and returns the exported core (globalThis.__sim).
 * This verifies the browser simulator's JS mirrors the TS engine exactly.
 */
function loadSim(): any {
  const html = fs.readFileSync("./simulator/index.html", "utf-8");
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("no <script> block found in simulator/index.html");
  const sandbox: Record<string, unknown> = { console };
  vm.runInNewContext(m[1], sandbox, { filename: "simulator-inline.js" });
  const sim = (sandbox as any).__sim;
  if (!sim) throw new Error("__sim export missing");
  return sim;
}

describe("simulator/index.html: core engine parity with TS implementation", () => {
  const sim = loadSim();

  it("sha256 matches node:crypto (known vector + random inputs)", () => {
    expect(sim.sha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    for (let i = 0; i < 20; i++) {
      const s = crypto.randomBytes(24).toString("hex") + "GENESIS_::" + i;
      expect(sim.sha256(s)).toBe(crypto.createHash("sha256").update(s, "utf8").digest("hex"));
    }
  });

  it("parses plan_item.qm: relative target resolution", () => {
    const ast = sim.parseQmXml(sim.PLAN_ITEM_QM);
    expect(ast.statesByPath.has("/top/Operational/Executing/InProgress")).toBe(true);
    const horizon = ast.statesByPath.get("/top/HorizonWave");
    expect(horizon.transitions.get("SIG_DECOMPOSE").targetPath).toBe(
      "/top/Operational/Executing/InProgress"
    );
  });

  it("LCA trace for SIG_BLOCK matches the phase1 spec expectation exactly", () => {
    const ast = sim.parseQmXml(sim.PLAN_ITEM_QM);
    const res = sim.executeLcaTransition(
      ast,
      "/top/Operational/Executing/InProgress",
      "SIG_BLOCK"
    );
    expect(res.handled).toBe(true);
    expect(res.inheritedViaQSuper).toBe(true);
    expect(res.handledBySuperstatePath).toBe("/top/Operational");
    expect(res.lcaStatePath).toBe("/top/Operational");
    expect(res.toStatePath).toBe("/top/Operational/BlockedException");
    expect(res.executionTrace).toEqual([
      "EXIT(InProgress: freeze_working_tree_diff();)",
      "EXIT(Executing: snapshot_execution_metrics();)",
      'ACTION(SIG_BLOCK: steward.raise_exception("ESC-09");)',
      'ENTRY(BlockedException: enable_git_commit_hook(DENY_ALL); escalate_to_steward("ESC-09");)',
    ]);
  });

  it("LCA trace for stage_gate SIG_TOLERANCE_BREACH matches the phase2 spec expectation", () => {
    const gateAst = sim.parseQmXml(sim.STAGE_GATE_QM);
    const res = sim.executeLcaTransition(
      gateAst,
      "/top/GateGovernance/ReadyForSignOff",
      "SIG_TOLERANCE_BREACH"
    );
    expect(res.inheritedViaQSuper).toBe(true);
    expect(res.handledBySuperstatePath).toBe("/top/GateGovernance");
    expect(res.lcaStatePath).toBe("/top/GateGovernance");
    expect(res.toStatePath).toBe("/top/GateGovernance/ExceptionEscalated");
    expect(res.executionTrace).toEqual([
      "EXIT(ReadyForSignOff: seal_stage_audit_bundle();)",
      'ACTION(SIG_TOLERANCE_BREACH: steward.open_exception_report("ESC-STAGE");)',
      "ENTRY(ExceptionEscalated: halt_stage_progression(); alert_pm_escalation_channel();)",
    ]);
  });

  it("SIG_PM_SIGNOFF on the gate has LCA /top and target /top/SignedOff", () => {
    const gateAst = sim.parseQmXml(sim.STAGE_GATE_QM);
    const res = sim.executeLcaTransition(
      gateAst,
      "/top/GateGovernance/ReadyForSignOff",
      "SIG_PM_SIGNOFF"
    );
    expect(res.lcaStatePath).toBe("/top");
    expect(res.toStatePath).toBe("/top/SignedOff");
  });

  it("compiles the inlined YAML bundle to the tier-3 tightened ruleset (coverage 90, REVIEW-only verify)", () => {
    const rules = sim.compileMonotonicYamlChain(sim.YAML_BUNDLE.split(/^---$/m));
    expect(rules.min_test_coverage_pct).toBe(90);
    expect(rules.min_pr_approvals).toBe(2);
    expect(rules.max_open_blockers).toBe(0);
    expect(rules.max_token_burn).toBe(35000);
    expect(rules.required_predicates.has("require_qm_ast_lint")).toBe(true);
    expect(
      rules.state_capabilities["/top/Operational/Executing/WaitingReview"][
        "hsm.transition:SIG_VERIFY"
      ]
    ).toEqual(["REVIEW"]);
    expect(
      rules.state_capabilities["/top/Operational/Executing/InProgress"]["git.commit"]
    ).toEqual(["IMPL"]);
  });

  it("rejects a relaxing child tier with MonotonicityViolationError", () => {
    const docs = sim.YAML_BUNDLE.split(/^---$/m);
    const relaxed = docs[2].replace("min_test_coverage_pct: 90", "min_test_coverage_pct: 80");
    expect(() =>
      sim.compileMonotonicYamlChain([docs[0], docs[1], relaxed])
    ).toThrow(sim.MonotonicityViolationError);
  });

  it("may(): allows IMPL git.commit in InProgress, denies via Gate A in WaitingReview, enforces 90% on SIG_VERIFY", () => {
    const ast = sim.parseQmXml(sim.PLAN_ITEM_QM);
    const rules = sim.compileMonotonicYamlChain(sim.YAML_BUNDLE.split(/^---$/m));
    const baseItem = {
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
    const impl = { sessionId: "@coder-01", assignedRoles: ["IMPL"] };

    expect(sim.evaluateMayGatekeeper(ast, rules, impl, baseItem, "git.commit").allow).toBe(true);

    const inReview = { ...baseItem, hsmStatePath: "/top/Operational/Executing/WaitingReview" };
    const denied = sim.evaluateMayGatekeeper(ast, rules, impl, inReview, "git.commit");
    expect(denied.allow).toBe(false);
    expect(denied.denyReason).toContain("Gate A (QM HSM Lock)");

    const lowCov = { ...inReview, testCoveragePct: 88 };
    const review = { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] };
    const verifyDenied = sim.evaluateMayGatekeeper(ast, rules, review, lowCov, "hsm.transition:SIG_VERIFY");
    expect(verifyDenied.allow).toBe(false);
    expect(verifyDenied.denyReason).toContain(
      "testCoveragePct (88%) < tightened min_test_coverage_pct (90%)"
    );

    const okCov = { ...inReview, testCoveragePct: 92 };
    expect(
      sim.evaluateMayGatekeeper(ast, rules, review, okCov, "hsm.transition:SIG_VERIFY").allow
    ).toBe(true);
  });

  it("chain hash formula matches node:crypto over the same canonical string", () => {
    const payload = {
      eventId: "EVT-0001",
      planId: "PLAN-CORE-2026",
      sessionId: "@coder-01",
      targetId: "L2.2",
      mcpVerb: "hsm.dispatch",
      signal: "SIG_SUBMIT_PR",
      fromState: "/top/Operational/Executing/InProgress",
      toState: "/top/Operational/Executing/WaitingReview",
      lcaState: "/top/Operational/Executing",
      entryExitTrace: ["EXIT(InProgress: x();)", "ACTION(SIG_SUBMIT_PR: y();)"],
    };
    const canonical = [
      "GENESIS_0000000000000000",
      payload.eventId,
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
    expect(sim.computeTemporalChainHash("GENESIS_0000000000000000", payload)).toBe(
      crypto.createHash("sha256").update(canonical, "utf8").digest("hex")
    );
  });

  it("lineage: appends chained events, verifies, and detects tampering", () => {
    sim.lineage.headHash = "GENESIS_0000000000000000";
    sim.lineage.events = [];
    sim.lineage.seq = 0;
    const e1 = sim.appendLineage({
      planId: "PLAN-CORE-2026",
      sessionId: "@coder-01",
      targetId: "L2.2",
      mcpVerb: "hsm.dispatch",
      signal: "SIG_SUBMIT_PR",
      fromState: "/top/Operational/Executing/InProgress",
      toState: "/top/Operational/Executing/WaitingReview",
      lcaState: "/top/Operational/Executing",
      entryExitTrace: ["EXIT(InProgress: freeze_working_tree_diff();)"],
    });
    const e2 = sim.appendLineage({
      planId: "PLAN-CORE-2026",
      sessionId: "@reviewer-02",
      targetId: "L2.2",
      mcpVerb: "hsm.dispatch",
      signal: "SIG_VERIFY",
      fromState: "/top/Operational/Executing/WaitingReview",
      toState: "/top/VerifiedDone",
      lcaState: "/top",
      entryExitTrace: ["ENTRY(VerifiedDone: seal_artifact_hash();)"],
    });
    expect(e2.prevHash).toBe(e1.chainHash);
    expect(sim.verifyLineage(sim.lineage.events).valid).toBe(true);
    sim.lineage.events[0].fromState = "/top/TamperedState";
    const tampered = sim.verifyLineage(sim.lineage.events);
    expect(tampered.valid).toBe(false);
    expect(tampered.brokenAtEventId).toBe(e1.eventId);
  });

  it("rolling wave: steward audit flags token breach; PM sign-off shifts horizons", () => {
    const gateAst = sim.parseQmXml(sim.STAGE_GATE_QM);
    const levels = [
      { id: "LVL-2", index: 2, horizonMode: "ACTIVE", plannedDays: 10, elapsedDays: 9, timeToleranceDays: 2, tokenBudgetMax: 100000, tokenBurnCurrent: 118000, tokenTolerancePct: 0.1, minStageCoveragePct: 85 },
      { id: "LVL-3", index: 3, horizonMode: "ROLLING_LOOKAHEAD", plannedDays: 14, elapsedDays: 0, timeToleranceDays: 3, tokenBudgetMax: 120000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 85 },
      { id: "LVL-4", index: 4, horizonMode: "FUZZY_LOCKED", plannedDays: 20, elapsedDays: 0, timeToleranceDays: 4, tokenBudgetMax: 150000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 90 },
    ];
    const items = [
      { id: "L2.1", levelId: "LVL-2", hsmStatePath: "/top/VerifiedDone", testCoveragePct: 91, openBlockersCount: 0, cleanWorktree: true, ciGreen: true },
    ];
    const gate = { id: "G2", fromLevelId: "LVL-2", toLevelId: "LVL-3", hsmStatePath: "/top/GateGovernance/Locked", exceptionPlanApproved: false };
    const report = sim.evaluateStageBoundaryAudit(levels[0], items, gate);
    expect(report.withinTolerance).toBe(false);
    expect(report.recommendedSignal).toBe("SIG_TOLERANCE_BREACH");
    expect(report.breaches[0]).toContain("TOKEN_TOLERANCE_BREACH");

    expect(
      sim.canDecomposeWaveItem(levels[2], { ...items[0], id: "L4.1", levelId: "LVL-4", hsmStatePath: "/top/HorizonWave" }).allowed
    ).toBe(false);

    const readyGate = { ...gate, hsmStatePath: "/top/GateGovernance/ReadyForSignOff" };
    const r = sim.advanceRollingWaveLevels(gateAst, readyGate, levels, "PM");
    expect(r.updatedGate.hsmStatePath).toBe("/top/SignedOff");
    expect(r.updatedLevels.map((l: any) => l.horizonMode)).toEqual([
      "COMPLETED",
      "ACTIVE",
      "ROLLING_LOOKAHEAD",
    ]);
  });
});
