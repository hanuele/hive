import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import {
  compileMonotonicYamlChain,
  MonotonicityViolationError,
} from "../src/rules/yamlLatticeCompiler";
import { InMemoryNeo4jTx } from "../src/graph/inMemoryTx";
import { verifyTemporalLineageIntegrity } from "../src/graph/lineageWriter";
import {
  dispatchItemSignalTransactional,
  LiveItemContext,
} from "../src/mcp/orchestrator";
import {
  handleToolCall,
  runStewardPulseTick,
  startStewardPulse,
  OrchestratorDeps,
} from "../src/mcp/server";

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

function buildDeps(tx: InMemoryNeo4jTx): OrchestratorDeps {
  return {
    tx,
    planAst: ast,
    gateAst: ast,
    rules,
    qmAstHash: "qmhash-e7",
    askRegistry: new Map<string, string>(),
    getItemStateMap: () => tx.itemStates,
    getItemContext: async (itemId) => ({
      ...baseItem,
      itemId,
      hsmStatePath: tx.itemStates.get(itemId) ?? baseItem.hsmStatePath,
    }),
    getSessionRoles: async () => ["IMPL"],
    getLevel: async () => ({ id: "LVL-2", index: 2, horizonMode: "ACTIVE", plannedDays: 10, elapsedDays: 1, timeToleranceDays: 2, tokenBudgetMax: 100000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 85 }),
    getLevelForItem: async () => ({ id: "LVL-2", index: 2, horizonMode: "ACTIVE", plannedDays: 10, elapsedDays: 1, timeToleranceDays: 2, tokenBudgetMax: 100000, tokenBurnCurrent: 0, tokenTolerancePct: 0.1, minStageCoveragePct: 85 }),
    getItemsOfLevel: async () => [],
    getGate: async () => ({ id: "G2", fromLevelId: "LVL-2", toLevelId: "LVL-3", hsmStatePath: "/top/GateGovernance/Locked", exceptionPlanApproved: false }),
    getPlanProjection: async (planId) => ({ planId, title: "t", headEventHash: tx.headHash, generatedAtIso: new Date().toISOString(), levels: [] }),
    getEvents: async () => tx.events,
  };
}

describe("E7: two-writer race — the plan lock keeps [:PREV_EVENT] linear under concurrency", () => {
  it("two concurrent hsm.dispatch calls on the same plan produce one linear chain (no fork)", async () => {
    const tx = new InMemoryNeo4jTx();
    const session = { sessionId: "@coder-01", assignedRoles: ["IMPL"] };

    // Fire both mutations concurrently; without a real lock their HEAD_EVENT
    // reads would interleave and fork the chain.
    const [a, b] = await Promise.all([
      dispatchItemSignalTransactional(tx, ast, rules, session, baseItem, "SIG_SUBMIT_PR", "race-a"),
      dispatchItemSignalTransactional(tx, ast, rules, session, baseItem, "SIG_BLOCK", "race-b"),
    ]);

    expect(tx.events).toHaveLength(2);
    expect(a.recordedEvent.eventId).not.toBe(b.recordedEvent.eventId);

    // Exactly one genesis-linked event; the second chains onto the first.
    const genesisLinked = tx.events.filter(
      (e) => e.prevHash === "GENESIS_0000000000000000"
    );
    expect(genesisLinked).toHaveLength(1);
    const sorted = [...tx.events].sort((x, y) =>
      x.timestampIso === y.timestampIso
        ? x.eventId.localeCompare(y.eventId)
        : x.timestampIso.localeCompare(y.timestampIso)
    );
    expect(sorted[1].prevHash).toBe(sorted[0].chainHash);

    // Whole chain verifies and the head pointer matches the last event.
    expect(verifyTemporalLineageIntegrity(sorted).valid).toBe(true);
    expect(tx.headHash).toBe(sorted.at(-1)!.chainHash);

    // In-memory state reflects exactly one final transition target.
    expect(tx.itemStates.size).toBe(1);
  });
});

describe("E7: property-based lattice compiler checks (seeded RNG, no new deps)", () => {
  function mulberry32(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), s | 1);
      t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const globalDoc = yamlBundle[0];

  function childYaml(overrides: Record<string, unknown>): string {
    return [
      'tier: "LEVEL"',
      'target_id: "PROP"',
      "guards:",
      ...Object.entries(overrides).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`),
    ].join("\n");
  }

  it("every relaxing child tier throws MonotonicityViolationError; every tightening one compiles", () => {
    const rand = mulberry32(20261107);
    for (let i = 0; i < 120; i++) {
      const kind = Math.floor(rand() * 6);
      let guards: Record<string, unknown> = {};
      let expectThrow = false;
      switch (kind) {
        case 0: {
          const v = Math.floor(rand() * 120); // global floor is 70
          guards = { min_test_coverage_pct: v };
          expectThrow = v < 70;
          break;
        }
        case 1: {
          const v = Math.floor(rand() * 100000); // global ceiling 50000
          guards = { max_token_burn: v };
          expectThrow = v > 50000;
          break;
        }
        case 2: {
          const v = Math.floor(rand() * 2000); // global ask TTL 900
          guards = { ask_ttl_seconds: v };
          expectThrow = v > 900;
          break;
        }
        case 3: {
          const v = Math.floor(rand() * 5000); // global ciGreen bound 300
          guards = { telemetry_max_age_seconds: { ciGreen: v } };
          expectThrow = v > 300;
          break;
        }
        case 4: {
          // drop an inherited required predicate => violation; keep all => ok
          const keep = rand() < 0.5;
          guards = {
            required_predicates: keep
              ? ["require_clean_worktree", "require_neo4j_lineage"]
              : ["require_clean_worktree"],
          };
          expectThrow = !keep;
          break;
        }
        case 5: {
          // grant REVIEW on (InProgress, git.commit): parent whitelist is [IMPL, PM] => violation
          guards = {};
          expectThrow = true;
          const child = [
            'tier: "LEVEL"',
            'target_id: "PROP"',
            "guards: {}",
            "state_capabilities:",
            '  "/top/Operational/Executing/InProgress":',
            "    allowed_intents:",
            '      git.commit: ["REVIEW"]',
          ].join("\n");
          const docs = `${globalDoc}\n---\n${child}`.split(/^---$/m);
          expect(() => compileMonotonicYamlChain(docs)).toThrow(MonotonicityViolationError);
          continue;
        }
      }
      const docs = `${globalDoc}\n---\n${childYaml(guards)}`.split(/^---$/m);
      if (expectThrow) {
        expect(() => compileMonotonicYamlChain(docs), `kind=${kind} guards=${JSON.stringify(guards)}`).toThrow(
          MonotonicityViolationError
        );
      } else {
        expect(() => compileMonotonicYamlChain(docs), `kind=${kind} guards=${JSON.stringify(guards)}`).not.toThrow();
      }
    }
  });
});

describe("E4/E6: steward pulse wiring", () => {
  it("runStewardPulseTick verifies the chain and reconciles", async () => {
    const tx = new InMemoryNeo4jTx();
    const deps = buildDeps(tx);
    await handleToolCall(deps, "hsm.dispatch", {
      sessionId: "@coder-01", itemId: "L2.2", signal: "SIG_SUBMIT_PR",
    });
    const r = await runStewardPulseTick(deps, "PLAN-CORE-2026");
    expect(r.valid).toBe(true);
    expect(r.eventsCount).toBe(1);
    expect(r.mismatches).toEqual([]);
  });

  it("startStewardPulse fires on the interval and stops cleanly", async () => {
    const tx = new InMemoryNeo4jTx();
    const deps = buildDeps(tx);
    let ticks = 0;
    const stop = startStewardPulse(deps, "PLAN-CORE-2026", 30, () => ticks++);
    await new Promise((res) => setTimeout(res, 120));
    stop();
    expect(ticks).toBeGreaterThanOrEqual(2);
  });
});
