import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { parseQmXmlToAst } from "../src/hsm/qmXmlParser";
import { compileMonotonicYamlChain } from "../src/rules/yamlLatticeCompiler";
import {
  verifyTemporalLineageIntegrity,
  RecordedTemporalEvent,
  GraphTransactionRunner,
} from "../src/graph/lineageWriter";
import { renderVirtualMarkdownProjection } from "../src/graph/mdProjector";
import {
  evaluateMayGatekeeper,
  dispatchItemSignalTransactional,
  LiveItemContext,
} from "../src/mcp/orchestrator";

const planItemXml = fs.readFileSync("./models/plan_item.qm", "utf-8");
const yamlBundle = fs
  .readFileSync("./rules/MONOTONIC_YAML_RULES_BUNDLE.yaml", "utf-8")
  .split(/^---$/m);

/**
 * In-memory mock of Neo4j ManagedTransaction so Phase 3 tests run in < 20ms
 * without requiring a live Docker container during unit testing.
 */
class InMemoryNeo4jTxMock implements GraphTransactionRunner {
  public headHash: string = "GENESIS_0000000000000000";
  public events: RecordedTemporalEvent[] = [];
  public itemStates = new Map<string, string>();

  async run(cypher: string, params: Record<string, any>) {
    if (cypher.includes("RETURN headEvt.id AS prevEventId")) {
      return {
        records: [
          {
            get: (key: string) =>
              key === "prevHash" ? this.headHash : this.events.at(-1)?.eventId ?? null,
          },
        ],
      };
    }
    if (cypher.includes("CREATE (newEvt:TemporalEvent")) {
      this.headHash = params.chainHash;
      this.itemStates.set(params.targetId, params.toState);
      return {
        records: [{ get: () => params.eventId }],
      };
    }
    return { records: [] };
  }
}

describe("SPEC-003 Phase 3: End-to-End MCP may(), LCA Dispatch, SHA-256 Lineage & Virtual .MD", () => {
  const ast = parseQmXmlToAst(planItemXml);
  const effectiveRules = compileMonotonicYamlChain(yamlBundle);

  const sampleItem: LiveItemContext = {
    planId: "PLAN-CORE-2026",
    itemId: "L2.2",
    levelId: "LVL-2",
    hsmStatePath: "/top/Operational/Executing/InProgress",
    testCoveragePct: 88, // Passes Level 2 (85%), but fails Item L2.2 (90%)!
    openBlockersCount: 0,
    prApprovalsCount: 2,
    cleanWorktree: true,
    ciGreen: true,
    qmAstLintPass: true,
  };

  it("allows @coder-01 [IMPL] to git.commit in InProgress, but locks @coder-01 out in WaitingReview", async () => {
    const tx = new InMemoryNeo4jTxMock();

    // 1. InProgress: @coder-01 [IMPL] can commit
    const commitInProg = evaluateMayGatekeeper(
      ast,
      effectiveRules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      sampleItem,
      "git.commit"
    );
    expect(commitInProg.allow).toBe(true);

    // 2. @coder-01 dispatches SIG_SUBMIT_PR -> transitions to WaitingReview
    const { recordedEvent } = await dispatchItemSignalTransactional(
      tx,
      ast,
      effectiveRules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      sampleItem,
      "SIG_SUBMIT_PR"
    );
    expect(recordedEvent.toState).toBe(
      "/top/Operational/Executing/WaitingReview"
    );

    // 3. In WaitingReview: @coder-01 [IMPL] is now denied git.commit by Gate A
    const itemInReview: LiveItemContext = {
      ...sampleItem,
      hsmStatePath: recordedEvent.toState,
    };
    const commitInReview = evaluateMayGatekeeper(
      ast,
      effectiveRules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      itemInReview,
      "git.commit"
    );
    expect(commitInReview.allow).toBe(false);
    expect(commitInReview.denyReason).toContain("Gate A (QM HSM Lock)");
  });

  it("enforces Tier 3 Monotonic YAML coverage (90%) on SIG_VERIFY and chains SHA-256 lineage", async () => {
    const tx = new InMemoryNeo4jTxMock();

    // 1. Transition InProgress -> WaitingReview
    const step1 = await dispatchItemSignalTransactional(
      tx,
      ast,
      effectiveRules,
      { sessionId: "@coder-01", assignedRoles: ["IMPL"] },
      sampleItem,
      "SIG_SUBMIT_PR"
    );

    const itemAt88Pct: LiveItemContext = {
      ...sampleItem,
      hsmStatePath: step1.recordedEvent.toState,
      testCoveragePct: 88,
    };

    // 2. @reviewer-02 [REVIEW] attempts SIG_VERIFY at 88% coverage -> DENIED by Tier 3 (90%)
    await expect(
      dispatchItemSignalTransactional(
        tx,
        ast,
        effectiveRules,
        { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
        itemAt88Pct,
        "SIG_VERIFY"
      )
    ).rejects.toThrow(/testCoveragePct \(88%\) < tightened min_test_coverage_pct \(90%\)/);

    // 3. QA raises coverage to 92% -> @reviewer-02 dispatches SIG_VERIFY -> VerifiedDone
    const itemAt92Pct: LiveItemContext = {
      ...itemAt88Pct,
      testCoveragePct: 92,
    };
    const step2 = await dispatchItemSignalTransactional(
      tx,
      ast,
      effectiveRules,
      { sessionId: "@reviewer-02", assignedRoles: ["REVIEW"] },
      itemAt92Pct,
      "SIG_VERIFY"
    );

    expect(step2.recordedEvent.toState).toBe("/top/VerifiedDone");

    // 4. Verify cryptographic SHA-256 hash chain across both events
    const chainCheck = verifyTemporalLineageIntegrity([
      step1.recordedEvent,
      step2.recordedEvent,
    ]);
    expect(chainCheck.valid).toBe(true);

    // 5. Simulate tampering with step1's fromState and confirm hash chain catches it
    const tamperedStep1: RecordedTemporalEvent = {
      ...step1.recordedEvent,
      fromState: "/top/TamperedState",
    };
    const tamperedCheck = verifyTemporalLineageIntegrity([
      tamperedStep1,
      step2.recordedEvent,
    ]);
    expect(tamperedCheck.valid).toBe(false);
  });

  it("renders a read-only Virtual .MD Projection from the Neo4j graph snapshot", () => {
    const md = renderVirtualMarkdownProjection({
      planId: "PLAN-CORE-2026",
      title: "Local QM HSM & MCP Orchestration Plan",
      headEventHash:
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      generatedAtIso: "2026-11-06T20:21:00.000Z",
      levels: [
        {
          id: "LVL-2",
          index: 2,
          title: "QM HSM Engine & MCP Gatekeeper",
          horizonMode: "ACTIVE",
          gate: {
            id: "G2",
            hsmStatePath: "/top/GateGovernance/Locked",
            withinTolerance: true,
          },
          items: [
            {
              id: "L2.2",
              title: "MCP may() Gatekeeper & Monotonic YAML Compiler",
              hsmStatePath: "/top/VerifiedDone",
              testCoveragePct: 92,
              openBlockersCount: 0,
              assignedSessions: [
                { handle: "@coder-01", role: "IMPL" },
                { handle: "@reviewer-02", role: "REVIEW" },
              ],
              tasks: [
                {
                  id: "TSK-203",
                  title: "Enforce monotonic tightening",
                  kanbanState: "DONE",
                },
              ],
            },
          ],
        },
      ],
    });

    expect(md).toContain('projection_mode: "READ_ONLY_NEO4J_SNAPSHOT"');
    expect(md).toContain("- [x] **`L2.2`: MCP may() Gatekeeper & Monotonic YAML Compiler**");
    expect(md).toContain("`@coder-01[IMPL], @reviewer-02[REVIEW]`".replace(/`/g, ""));
  });
});
