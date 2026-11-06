import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import { executeLcaTransition } from "../src/hsm/lcaEngine";
import {
  evaluateStageBoundaryAudit,
  canDecomposeWaveItem,
  advanceRollingWaveLevels,
  LevelToleranceSnapshot,
  PlanItemSnapshot,
  StageGateSnapshot,
} from "../src/steward/stewardAuditEngine";

const stageGateXml = fs.readFileSync("./models/stage_gate.qm", "utf-8");

describe("SPEC-002 Phase 2: PRINCE2 StageGate HSM & Steward Tolerance Engine", () => {
  const sampleLevels: LevelToleranceSnapshot[] = [
    {
      id: "LVL-2",
      index: 2,
      horizonMode: "ACTIVE",
      plannedDays: 10,
      elapsedDays: 9,
      timeToleranceDays: 2,
      tokenBudgetMax: 100000,
      tokenBurnCurrent: 92000,
      tokenTolerancePct: 0.1, // Ceiling = 110,000
      minStageCoveragePct: 85,
    },
    {
      id: "LVL-3",
      index: 3,
      horizonMode: "ROLLING_LOOKAHEAD",
      plannedDays: 14,
      elapsedDays: 0,
      timeToleranceDays: 3,
      tokenBudgetMax: 120000,
      tokenBurnCurrent: 0,
      tokenTolerancePct: 0.1,
      minStageCoveragePct: 85,
    },
    {
      id: "LVL-4",
      index: 4,
      horizonMode: "FUZZY_LOCKED",
      plannedDays: 20,
      elapsedDays: 0,
      timeToleranceDays: 4,
      tokenBudgetMax: 150000,
      tokenBurnCurrent: 0,
      tokenTolerancePct: 0.1,
      minStageCoveragePct: 90,
    },
  ];

  it("catches SIG_TOLERANCE_BREACH from any GateGovernance substate via Q_SUPER", () => {
    const gateAst = parseQmXmlToAst(stageGateXml);

    const res = executeLcaTransition(
      gateAst,
      "/top/GateGovernance/ReadyForSignOff",
      "SIG_TOLERANCE_BREACH"
    );

    expect(res.handled).toBe(true);
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

  it("detects token tolerance breaches and recommends SIG_TOLERANCE_BREACH", () => {
    const breachedLevel: LevelToleranceSnapshot = {
      ...sampleLevels[0],
      tokenBurnCurrent: 118000, // Exceeds 100k + 10% = 110k ceiling
    };
    const items: PlanItemSnapshot[] = [
      {
        id: "L2.1",
        levelId: "LVL-2",
        hsmStatePath: "/top/VerifiedDone",
        testCoveragePct: 91,
        openBlockersCount: 0,
        cleanWorktree: true,
        ciGreen: true,
      },
    ];
    const gate: StageGateSnapshot = {
      id: "G2",
      fromLevelId: "LVL-2",
      toLevelId: "LVL-3",
      hsmStatePath: "/top/GateGovernance/Locked",
      exceptionPlanApproved: false,
    };

    const report = evaluateStageBoundaryAudit(breachedLevel, items, gate);
    expect(report.withinTolerance).toBe(false);
    expect(report.recommendedSignal).toBe("SIG_TOLERANCE_BREACH");
    expect(report.breaches[0]).toContain("TOKEN_TOLERANCE_BREACH");
  });

  it("enforces Rolling Wave Horizon locks (allows ROLLING_LOOKAHEAD, blocks FUZZY_LOCKED)", () => {
    const lookaheadItem: PlanItemSnapshot = {
      id: "L3.1",
      levelId: "LVL-3",
      hsmStatePath: "/top/HorizonWave",
      testCoveragePct: 0,
      openBlockersCount: 0,
      cleanWorktree: true,
      ciGreen: false,
    };
    const fuzzyItem: PlanItemSnapshot = {
      id: "L4.1",
      levelId: "LVL-4",
      hsmStatePath: "/top/HorizonWave",
      testCoveragePct: 0,
      openBlockersCount: 0,
      cleanWorktree: true,
      ciGreen: false,
    };

    expect(canDecomposeWaveItem(sampleLevels[1], lookaheadItem).allowed).toBe(
      true
    );
    const fuzzyCheck = canDecomposeWaveItem(sampleLevels[2], fuzzyItem);
    expect(fuzzyCheck.allowed).toBe(false);
    expect(fuzzyCheck.reason).toContain("FUZZY_LOCKED");
  });

  it("advances the Rolling Wave across levels when PM dispatches SIG_PM_SIGNOFF", () => {
    const gateAst = parseQmXmlToAst(stageGateXml);
    const readyGate: StageGateSnapshot = {
      id: "G2",
      fromLevelId: "LVL-2",
      toLevelId: "LVL-3",
      hsmStatePath: "/top/GateGovernance/ReadyForSignOff",
      exceptionPlanApproved: false,
    };

    const { lcaResult, updatedGate, updatedLevels } = advanceRollingWaveLevels(
      gateAst,
      readyGate,
      sampleLevels,
      "PM"
    );

    expect(updatedGate.hsmStatePath).toBe("/top/SignedOff");
    expect(lcaResult.lcaStatePath).toBe("/top");
    expect(updatedLevels[0].horizonMode).toBe("COMPLETED"); // LVL-2
    expect(updatedLevels[1].horizonMode).toBe("ACTIVE"); // LVL-3
    expect(updatedLevels[2].horizonMode).toBe("ROLLING_LOOKAHEAD"); // LVL-4 unlocked from FUZZY_LOCKED!
  });
});
