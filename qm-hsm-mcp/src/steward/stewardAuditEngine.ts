import { QmModelAst } from "../hsm/qmXmlParser";
import { executeLcaTransition, LcaDispatchResult } from "../hsm/lcaEngine";

export type HorizonMode =
  | "COMPLETED"
  | "ACTIVE"
  | "ROLLING_LOOKAHEAD"
  | "FUZZY_LOCKED";

export interface PlanItemSnapshot {
  id: string;
  levelId: string;
  hsmStatePath: string;
  testCoveragePct: number;
  openBlockersCount: number;
  cleanWorktree: boolean;
  ciGreen: boolean;
}

export interface LevelToleranceSnapshot {
  id: string;
  index: number;
  horizonMode: HorizonMode;
  plannedDays: number;
  elapsedDays: number;
  timeToleranceDays: number;
  tokenBudgetMax: number;
  tokenBurnCurrent: number;
  tokenTolerancePct: number; // e.g., 0.10 for +10%
  minStageCoveragePct: number;
}

export interface StageGateSnapshot {
  id: string;
  fromLevelId: string;
  toLevelId: string;
  hsmStatePath: string;
  exceptionPlanApproved: boolean;
}

export interface StewardAuditReport {
  gateId: string;
  levelId: string;
  withinTolerance: boolean;
  allItemsVerified: boolean;
  recommendedSignal:
    | "SIG_REQUEST_AUDIT"
    | "SIG_AUDIT_PASS"
    | "SIG_AUDIT_FAIL"
    | "SIG_TOLERANCE_BREACH"
    | "NONE";
  breaches: string[];
  metrics: {
    verifiedItemsCount: number;
    totalItemsCount: number;
    minCoverageObserved: number;
    totalOpenBlockers: number;
    tokenCeiling: number;
    scheduleCeilingDays: number;
  };
}

/**
 * Evaluates PRINCE2 Stage tolerances and determines the exact QM Signal
 * the Steward Agent should dispatch to the StageGate Active Object.
 */
export function evaluateStageBoundaryAudit(
  level: LevelToleranceSnapshot,
  items: PlanItemSnapshot[],
  gate: StageGateSnapshot
): StewardAuditReport {
  const breaches: string[] = [];

  const verifiedItemsCount = items.filter(
    (i) => i.hsmStatePath === "/top/VerifiedDone"
  ).length;
  const allItemsVerified =
    items.length > 0 && verifiedItemsCount === items.length;

  const totalOpenBlockers = items.reduce(
    (acc, it) => acc + it.openBlockersCount,
    0
  );
  const minCoverageObserved =
    items.length > 0
      ? Math.min(...items.map((i) => i.testCoveragePct))
      : 0;

  const tokenCeiling = Math.round(
    level.tokenBudgetMax * (1 + level.tokenTolerancePct)
  );
  const scheduleCeilingDays = level.plannedDays + level.timeToleranceDays;

  // 1. Check Token/Cost Tolerance
  if (level.tokenBurnCurrent > tokenCeiling) {
    breaches.push(
      `TOKEN_TOLERANCE_BREACH: Burn (${level.tokenBurnCurrent}) exceeds ceiling (${tokenCeiling})`
    );
  }

  // 2. Check Schedule/Time Tolerance
  if (level.elapsedDays > scheduleCeilingDays) {
    breaches.push(
      `TIME_TOLERANCE_BREACH: Elapsed (${level.elapsedDays}d) exceeds ceiling (${scheduleCeilingDays}d)`
    );
  }

  // 3. Check Quality & Active Blockers
  if (totalOpenBlockers > 0) {
    breaches.push(
      `BLOCKER_BREACH: ${totalOpenBlockers} unresolved blocker(s) in stage ${level.id}`
    );
  }

  if (items.length > 0 && minCoverageObserved < level.minStageCoveragePct) {
    breaches.push(
      `QUALITY_FLOOR_BREACH: Min item coverage (${minCoverageObserved}%) < stage floor (${level.minStageCoveragePct}%)`
    );
  }

  const withinTolerance = breaches.length === 0;

  let recommendedSignal: StewardAuditReport["recommendedSignal"] = "NONE";
  if (!withinTolerance) {
    recommendedSignal =
      gate.hsmStatePath === "/top/GateGovernance/Auditing"
        ? "SIG_AUDIT_FAIL"
        : "SIG_TOLERANCE_BREACH";
  } else if (
    allItemsVerified &&
    gate.hsmStatePath === "/top/GateGovernance/Locked"
  ) {
    recommendedSignal = "SIG_REQUEST_AUDIT";
  } else if (
    allItemsVerified &&
    withinTolerance &&
    gate.hsmStatePath === "/top/GateGovernance/Auditing"
  ) {
    recommendedSignal = "SIG_AUDIT_PASS";
  }

  return {
    gateId: gate.id,
    levelId: level.id,
    withinTolerance,
    allItemsVerified,
    recommendedSignal,
    breaches,
    metrics: {
      verifiedItemsCount,
      totalItemsCount: items.length,
      minCoverageObserved,
      totalOpenBlockers,
      tokenCeiling,
      scheduleCeilingDays,
    },
  };
}

/**
 * Enforces Invariant I-ROLLING-WAVE:
 * Only items belonging to ACTIVE or ROLLING_LOOKAHEAD levels may be decomposed.
 * Items in FUZZY_LOCKED levels (Level >= N+2) strictly reject SIG_DECOMPOSE.
 */
export function canDecomposeWaveItem(
  level: LevelToleranceSnapshot,
  item: PlanItemSnapshot
): { allowed: boolean; reason: string } {
  if (item.hsmStatePath !== "/top/HorizonWave") {
    return {
      allowed: false,
      reason: `Item ${item.id} is already outside /top/HorizonWave (${item.hsmStatePath})`,
    };
  }
  if (level.horizonMode === "FUZZY_LOCKED") {
    return {
      allowed: false,
      reason: `PRINCE2 Rolling Wave Lock: Level ${level.id} is in FUZZY_LOCKED horizon. Pass upstream StageGate first.`,
    };
  }
  if (level.horizonMode === "COMPLETED") {
    return {
      allowed: false,
      reason: `Level ${level.id} is already COMPLETED.`,
    };
  }
  return {
    allowed: true,
    reason: `Level ${level.id} is in ${level.horizonMode}; wave decomposition permitted.`,
  };
}

/**
 * Advances the Rolling Wave across Levels when a StageGate transitions to /top/SignedOff.
 */
export function advanceRollingWaveLevels(
  gateAst: QmModelAst,
  gate: StageGateSnapshot,
  levels: LevelToleranceSnapshot[],
  callerRole: "PM" | "STEWARD" | "IMPL"
): {
  lcaResult: LcaDispatchResult;
  updatedGate: StageGateSnapshot;
  updatedLevels: LevelToleranceSnapshot[];
} {
  if (callerRole !== "PM") {
    throw new Error(
      `Role '${callerRole}' cannot dispatch SIG_PM_SIGNOFF; requires 'PM'`
    );
  }
  if (gate.hsmStatePath !== "/top/GateGovernance/ReadyForSignOff") {
    throw new Error(
      `Gate ${gate.id} must be in /top/GateGovernance/ReadyForSignOff to sign off (current: ${gate.hsmStatePath})`
    );
  }

  const lcaResult = executeLcaTransition(
    gateAst,
    gate.hsmStatePath,
    "SIG_PM_SIGNOFF"
  );

  const fromIdx = levels.findIndex((l) => l.id === gate.fromLevelId);
  const toIdx = levels.findIndex((l) => l.id === gate.toLevelId);

  const updatedLevels = levels.map((lvl, idx) => {
    if (idx === fromIdx) {
      return { ...lvl, horizonMode: "COMPLETED" as HorizonMode };
    }
    if (idx === toIdx) {
      return { ...lvl, horizonMode: "ACTIVE" as HorizonMode };
    }
    if (idx === toIdx + 1 && lvl.horizonMode === "FUZZY_LOCKED") {
      return { ...lvl, horizonMode: "ROLLING_LOOKAHEAD" as HorizonMode };
    }
    return lvl;
  });

  return {
    lcaResult,
    updatedGate: {
      ...gate,
      hsmStatePath: lcaResult.toStatePath,
    },
    updatedLevels,
  };
}
