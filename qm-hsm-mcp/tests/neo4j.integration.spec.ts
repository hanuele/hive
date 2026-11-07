/**
 * E7 (AMEND-09.7): real-Neo4j two-writer race integration test.
 *
 * Skipped unless both are available:
 *   QM_TEST_NEO4J_URI=bolt://127.0.0.1:7687   (a throwaway Neo4j, e.g. testcontainers)
 *   neo4j-driver installed (npm i -D neo4j-driver — intentionally NOT a hard
 *   dependency; the demo runs on the in-memory runner)
 *
 * It seeds a Plan + AgentSession + PlanItem, runs db/initSchema.cypher, fires
 * two concurrent hsm.dispatch calls through a driver-backed
 * GraphTransactionRunner (lock provided by the Cypher `SET p._writeLock`),
 * and asserts the [:PREV_EVENT] chain stayed linear.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import { compileMonotonicYamlChain } from "../src/rules/yamlLatticeCompiler";
import { dispatchItemSignalTransactional, LiveItemContext } from "../src/mcp/orchestrator";
import type { GraphTransactionRunner, RecordedTemporalEvent } from "../src/graph/lineageWriter";

const uri = process.env.QM_TEST_NEO4J_URI;
// Non-literal specifier: neo4j-driver is an optional peer for this gated test,
// so neither vite nor tsc should try to resolve it at build time.
const driverPkg = "neo4j-driver";
const driverMod = uri
  ? await import(/* @vite-ignore */ driverPkg).catch(() => null)
  : null;

describe.skipIf(!uri || !driverMod)("E7 real-Neo4j two-writer race (QM_TEST_NEO4J_URI set)", () => {
  it("concurrent dispatches keep the PREV_EVENT chain linear on real Neo4j", async () => {
    const neo4j = (driverMod as any).default ?? driverMod;
    const driver = neo4j.driver(uri, neo4j.auth.basic(process.env.QM_TEST_NEO4J_USER ?? "neo4j", process.env.QM_TEST_NEO4J_PASSWORD ?? "testtest"));
    const session = driver.session();
    try {
      for (const stmt of fs.readFileSync("./db/initSchema.cypher", "utf-8").split(";")) {
        if (stmt.trim()) await session.run(stmt);
      }
      await session.run(
        `CREATE (p:Plan:ActiveObject {id: "PLAN-RACE"}), (s:AgentSession {id: "@coder-01"}),
                (i:PlanItem:ActiveObject {id: "L9.1", hsmStatePath: "/top/Operational/Executing/InProgress"})`
      );

      const tx: GraphTransactionRunner = {
        run: async (cypher, params) => {
          const res = await session.executeWrite((t: any) => t.run(cypher, params));
          return { records: res.records };
        },
        // real lock comes from SET p._writeLock inside the Cypher
      };

      const ast = parseQmXmlToAst(fs.readFileSync("./models/plan_item.qm", "utf-8"));
      const rules = compileMonotonicYamlChain(
        fs.readFileSync("./rules/MONOTONIC_YAML_RULES_BUNDLE.yaml", "utf-8").split(/^---$/m)
      );
      const item: LiveItemContext = {
        planId: "PLAN-RACE", itemId: "L9.1", levelId: "LVL-9",
        hsmStatePath: "/top/Operational/Executing/InProgress",
        testCoveragePct: 95, openBlockersCount: 0, prApprovalsCount: 2,
        cleanWorktree: true, ciGreen: true, qmAstLintPass: true,
      };
      const sess = { sessionId: "@coder-01", assignedRoles: ["IMPL"] };

      await Promise.all([
        dispatchItemSignalTransactional(tx, ast, rules, sess, item, "SIG_SUBMIT_PR", "race-a"),
        dispatchItemSignalTransactional(tx, ast, rules, sess, item, "SIG_BLOCK", "race-b"),
      ]);

      const chain = await session.run(
        `MATCH (p:Plan {id: "PLAN-RACE"})-[:HEAD_EVENT]->(h:TemporalEvent)
         MATCH (h)-[:PREV_EVENT*]->(anc:TemporalEvent)
         RETURN anc ORDER BY anc.timestamp ASC`
      );
      const events = chain.records.map((r: any) => r.get("anc").properties) as RecordedTemporalEvent[];
      expect(events.length).toBe(2);
      expect(events[0].prevHash).toBe("GENESIS_0000000000000000");
      expect(events[1].prevHash).toBe(events[0].chainHash);
    } finally {
      await session.run("MATCH (n) WHERE n.id IN ['PLAN-RACE','@coder-01','L9.1'] OR n:TemporalEvent DETACH DELETE n");
      await session.close();
      await driver.close();
    }
  }, 30000);
});
