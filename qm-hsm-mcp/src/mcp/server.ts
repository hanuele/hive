import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

import { parseQmXmlToAst, QmModelAst } from "../hsm/qmXmlParser";
import { executeLcaTransition } from "../hsm/lcaEngine";
import { compileMonotonicYamlChain, CompiledEffectiveRuleset } from "../rules/yamlLatticeCompiler";
import {
  appendConservedTemporalMutation,
  GraphTransactionRunner,
  RecordedTemporalEvent,
  rehydrateItemStates,
  verifyTemporalLineageIntegrity,
} from "../graph/lineageWriter";
import { renderVirtualMarkdownProjection, GraphPlanProjectionInput } from "../graph/mdProjector";
import { InMemoryNeo4jTx } from "../graph/inMemoryTx";
import {
  dispatchItemSignalTransactional,
  evaluateMayGatekeeper,
  formatRefusalPrefix,
  LiveItemContext,
  MayEvaluationOutput,
} from "./orchestrator";
import {
  canDecomposeWaveItem,
  evaluateStageBoundaryAudit,
  LevelToleranceSnapshot,
  StageGateSnapshot,
} from "../steward/stewardAuditEngine";

export interface OrchestratorDeps {
  tx: GraphTransactionRunner;
  planAst: QmModelAst;
  gateAst: QmModelAst;
  rules: CompiledEffectiveRuleset;
  qmAstHash?: string; // E6: SHA-256 of the loaded .qm models, chained into every event
  askRegistry?: Map<string, string>; // E5: "itemId|intent" -> first-ask ISO timestamp
  getItemStateMap?: () => Map<string, string>; // E4: live in-memory item states for reconcile
  getItemContext: (itemId: string) => Promise<LiveItemContext>;
  getSessionRoles: (sessionId: string, itemId: string) => Promise<string[]>;
  getLevel: (levelId: string) => Promise<LevelToleranceSnapshot>;
  getLevelForItem: (itemId: string) => Promise<LevelToleranceSnapshot>;
  getItemsOfLevel: (levelId: string) => Promise<Array<{
    id: string; levelId: string; hsmStatePath: string; testCoveragePct: number; openBlockersCount: number; cleanWorktree: boolean; ciGreen: boolean;
  }>>;
  getGate: (gateId: string) => Promise<StageGateSnapshot>;
  getPlanProjection: (planId: string) => Promise<GraphPlanProjectionInput>;
  getEvents: (planId: string) => Promise<RecordedTemporalEvent[]>;
}

export const TOOL_DEFS = [
  {
    name: "may",
    description: "Pre-flight 3-gate capability check (QM HSM state x session roles x monotonic YAML guards). Read-only.",
    inputSchema: {
      type: "object",
      required: ["sessionId", "itemId", "intent"],
      properties: {
        sessionId: { type: "string" },
        itemId: { type: "string" },
        intent: { type: "string" },
      },
    },
  },
  {
    name: "hsm.dispatch",
    description: "Dispatch a SIG_* signal to a PlanItem/StageGate active object; may()-gated, LCA EXIT/ACTION/ENTRY, ACID lineage append.",
    inputSchema: {
      type: "object",
      required: ["sessionId", "itemId", "signal"],
      properties: {
        sessionId: { type: "string" },
        itemId: { type: "string" },
        signal: { type: "string" },
        idempotencyKey: { type: "string", description: "Optional; a retry with the same key returns the original event without mutating." },
      },
    },
  },
  {
    name: "plan.decompose_wave",
    description: "Rolling-wave decomposition of a HorizonWave item (rejects FUZZY_LOCKED levels).",
    inputSchema: {
      type: "object",
      required: ["sessionId", "itemId"],
      properties: {
        sessionId: { type: "string" },
        itemId: { type: "string" },
        idempotencyKey: { type: "string" },
      },
    },
  },
  {
    name: "task.sync_state",
    description: "Update a Kanban task state on an item (bubbles completion upstream).",
    inputSchema: {
      type: "object",
      required: ["sessionId", "itemId", "taskId", "kanbanState"],
      properties: {
        sessionId: { type: "string" },
        itemId: { type: "string" },
        taskId: { type: "string" },
        kanbanState: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"] },
        idempotencyKey: { type: "string" },
      },
    },
  },
  {
    name: "comms.post",
    description: "Post a state-stamped message on the item comms channel; optionally attaches a SIG_* signal.",
    inputSchema: {
      type: "object",
      required: ["sessionId", "itemId", "body"],
      properties: {
        sessionId: { type: "string" },
        itemId: { type: "string" },
        body: { type: "string" },
        signal: { type: "string" },
        idempotencyKey: { type: "string" },
      },
    },
  },
  {
    name: "rules.compile_check",
    description: "Return the compiled monotonic effective ruleset for an item. Read-only.",
    inputSchema: {
      type: "object",
      required: ["itemId"],
      properties: { itemId: { type: "string" } },
    },
  },
  {
    name: "steward.audit_gate",
    description: "PRINCE2 stage-boundary tolerance audit for a StageGate (time/token/scope/quality).",
    inputSchema: {
      type: "object",
      required: ["gateId", "levelId"],
      properties: { gateId: { type: "string" }, levelId: { type: "string" } },
    },
  },
  {
    name: "md.project",
    description: "Render a read-only virtual Markdown projection of a plan from the graph (I-MD-PROJECTION).",
    inputSchema: {
      type: "object",
      required: ["planId"],
      properties: { planId: { type: "string" } },
    },
  },
  {
    name: "lineage.verify",
    description: "Verify the SHA-256 hash chain of a plan's TemporalEvent lineage.",
    inputSchema: {
      type: "object",
      required: ["planId"],
      properties: { planId: { type: "string" } },
    },
  },
  {
    name: "ruling.record",
    description: "E5: steward records an /interview ruling as a chained TemporalEvent; later may() calls cite it via rulingId.",
    inputSchema: {
      type: "object",
      required: ["sessionId", "itemId", "intent", "rulingId", "answer"],
      properties: {
        sessionId: { type: "string" },
        itemId: { type: "string" },
        intent: { type: "string" },
        rulingId: { type: "string" },
        answer: { type: "string", enum: ["yes", "no"] },
      },
    },
  },
  {
    name: "lineage.reconcile",
    description: "E4: verify chain integrity and rehydrate in-memory state from the lineage (run on every steward pulse).",
    inputSchema: {
      type: "object",
      required: ["planId"],
      properties: { planId: { type: "string" } },
    },
  },
] as const;

/**
 * E5 (AMEND-09.5): may() with the ask-escalation workflow. On `decision: "ask"`:
 * post SIG_ESCALATE_ASK on the item channel (idempotent per item|intent) and
 * register the ask; if the ask TTL expires without a ruling, harden to "no".
 */
export async function evaluateMayWithEscalation(
  deps: OrchestratorDeps,
  session: { sessionId: string; assignedRoles: string[] },
  item: LiveItemContext,
  intent: string
): Promise<MayEvaluationOutput> {
  const out = evaluateMayGatekeeper(deps.planAst, deps.rules, session, item, intent);
  if (out.decision !== "ask") return out;

  const registry = (deps.askRegistry ??= new Map<string, string>());
  const key = `${item.itemId}|${intent}`;
  const ttlSec = deps.rules.ask_ttl_seconds;
  const firstAsk = registry.get(key);
  if (firstAsk && Date.now() - Date.parse(firstAsk) > ttlSec * 1000) {
    return {
      ...out,
      allow: false,
      decision: "no",
      denyReason: formatRefusalPrefix(
        out.enforcerId,
        item.rulingId,
        `Ask TTL expired (${ttlSec}s) for '${intent}' on ${item.itemId} with no ruling recorded; hardened from ask to no.`
      ),
    };
  }
  if (!firstAsk) {
    registry.set(key, new Date().toISOString());
    await appendConservedTemporalMutation(deps.tx, {
      planId: item.planId,
      sessionId: session.sessionId,
      targetId: item.itemId,
      targetLabel: "PlanItem",
      mcpVerb: "comms.post",
      signal: "SIG_ESCALATE_ASK",
      fromState: item.hsmStatePath,
      toState: item.hsmStatePath,
      lcaState: item.hsmStatePath,
      entryExitTrace: [`ASK(${intent}: unobserved [${out.unobserved.join(", ")}])`],
      idempotencyKey: `ask:${item.itemId}:${intent}`,
      qmAstHash: deps.qmAstHash,
    });
  }
  return out;
}

async function sessionContext(
  deps: OrchestratorDeps,
  sessionId: string,
  itemId: string
): Promise<{ sessionId: string; assignedRoles: string[] }> {
  const assignedRoles = await deps.getSessionRoles(sessionId, itemId);
  return { sessionId, assignedRoles };
}

export async function handleToolCall(
  deps: OrchestratorDeps,
  name: string,
  args: Record<string, any>
): Promise<any> {
  switch (name) {
    case "may": {
      const { sessionId, itemId, intent } = args;
      const item = await deps.getItemContext(itemId);
      const session = await sessionContext(deps, sessionId, itemId);
      return evaluateMayWithEscalation(deps, session, item, intent);
    }
    case "hsm.dispatch": {
      const { sessionId, itemId, signal } = args;
      const item = await deps.getItemContext(itemId);
      const session = await sessionContext(deps, sessionId, itemId);
      return dispatchItemSignalTransactional(
        deps.tx, deps.planAst, deps.rules, session, item, signal,
        args.idempotencyKey, deps.qmAstHash
      );
    }
    case "plan.decompose_wave": {
      const { sessionId, itemId } = args;
      const item = await deps.getItemContext(itemId);
      const level = await deps.getLevelForItem(itemId);
      const waveCheck = canDecomposeWaveItem(level, {
        id: item.itemId,
        levelId: item.levelId,
        hsmStatePath: item.hsmStatePath,
        testCoveragePct: item.testCoveragePct ?? 0,
        openBlockersCount: item.openBlockersCount ?? 0,
        cleanWorktree: item.cleanWorktree ?? false,
        ciGreen: item.ciGreen ?? false,
      });
      if (!waveCheck.allowed) {
        throw new Error(`MCP_ERR_WAVE_LOCKED: ${waveCheck.reason}`);
      }
      const session = await sessionContext(deps, sessionId, itemId);
      const mayDecision = evaluateMayGatekeeper(
        deps.planAst, deps.rules, session, item, "hsm.transition:SIG_DECOMPOSE"
      );
      if (!mayDecision.allow) {
        throw new Error(`MCP_ERR_MAY_DENIED: ${mayDecision.denyReason}`);
      }
      const lcaResult = executeLcaTransition(deps.planAst, item.hsmStatePath, "SIG_DECOMPOSE");
      if (!lcaResult.handled || !lcaResult.lcaStatePath) {
        throw new Error("MCP_ERR_UNHANDLED_SIGNAL: SIG_DECOMPOSE not handled in current state");
      }
      const recordedEvent = await appendConservedTemporalMutation(deps.tx, {
        planId: item.planId,
        sessionId,
        targetId: itemId,
        targetLabel: "PlanItem",
        mcpVerb: "plan.decompose_wave",
        signal: "SIG_DECOMPOSE",
        fromState: lcaResult.fromStatePath,
        toState: lcaResult.toStatePath,
        lcaState: lcaResult.lcaStatePath,
        entryExitTrace: lcaResult.executionTrace,
        idempotencyKey: args.idempotencyKey,
        qmAstHash: deps.qmAstHash,
      });
      return { mayDecision, recordedEvent };
    }
    case "task.sync_state": {
      const { sessionId, itemId, taskId, kanbanState } = args;
      const item = await deps.getItemContext(itemId);
      const session = await sessionContext(deps, sessionId, itemId);
      const mayDecision = evaluateMayGatekeeper(deps.planAst, deps.rules, session, item, "task.mutate");
      if (!mayDecision.allow) {
        throw new Error(`MCP_ERR_MAY_DENIED: ${mayDecision.denyReason}`);
      }
      const recordedEvent = await appendConservedTemporalMutation(deps.tx, {
        planId: item.planId,
        sessionId,
        targetId: itemId,
        targetLabel: "PlanItem",
        mcpVerb: "task.sync_state",
        signal: `TASK_${String(kanbanState).toUpperCase()}`,
        fromState: item.hsmStatePath,
        toState: item.hsmStatePath,
        lcaState: item.hsmStatePath,
        entryExitTrace: [`TASK(${taskId}: ${kanbanState})`],
        idempotencyKey: args.idempotencyKey,
        qmAstHash: deps.qmAstHash,
      });
      return { mayDecision, recordedEvent };
    }
    case "comms.post": {
      const { sessionId, itemId, body, signal } = args;
      const item = await deps.getItemContext(itemId);
      const session = await sessionContext(deps, sessionId, itemId);
      const mayDecision = evaluateMayGatekeeper(deps.planAst, deps.rules, session, item, "comms.post");
      if (!mayDecision.allow) {
        throw new Error(`MCP_ERR_MAY_DENIED: ${mayDecision.denyReason}`);
      }
      const recordedEvent = await appendConservedTemporalMutation(deps.tx, {
        planId: item.planId,
        sessionId,
        targetId: itemId,
        targetLabel: "PlanItem",
        mcpVerb: "comms.post",
        signal: signal ?? "COMMS_POST",
        fromState: item.hsmStatePath,
        toState: item.hsmStatePath,
        lcaState: item.hsmStatePath,
        entryExitTrace: [`COMMS("${String(body).slice(0, 80)}")`],
        idempotencyKey: args.idempotencyKey,
        qmAstHash: deps.qmAstHash,
      });
      return { mayDecision, recordedEvent };
    }
    case "rules.compile_check": {
      return {
        ...deps.rules,
        required_predicates: [...deps.rules.required_predicates],
      };
    }
    case "steward.audit_gate": {
      const { gateId, levelId } = args;
      const gate = await deps.getGate(gateId);
      const level = await deps.getLevel(levelId);
      const items = await deps.getItemsOfLevel(levelId);
      return evaluateStageBoundaryAudit(level, items, gate);
    }
    case "md.project": {
      const { planId } = args;
      return renderVirtualMarkdownProjection(await deps.getPlanProjection(planId));
    }
    case "lineage.verify": {
      const { planId } = args;
      return verifyTemporalLineageIntegrity(await deps.getEvents(planId));
    }
    case "ruling.record": {
      const { sessionId, itemId, intent, rulingId, answer } = args;
      const item = await deps.getItemContext(itemId);
      const session = await sessionContext(deps, sessionId, itemId);
      const mayDecision = evaluateMayGatekeeper(deps.planAst, deps.rules, session, item, "ruling.record");
      if (!mayDecision.allow) {
        throw new Error(`MCP_ERR_MAY_DENIED: ${mayDecision.denyReason}`);
      }
      const recordedEvent = await appendConservedTemporalMutation(deps.tx, {
        planId: item.planId,
        sessionId,
        targetId: itemId,
        targetLabel: "PlanItem",
        mcpVerb: "ruling.record",
        signal: "SIG_RULING",
        fromState: item.hsmStatePath,
        toState: item.hsmStatePath,
        lcaState: item.hsmStatePath,
        entryExitTrace: [`RULING(${rulingId} => ${answer} on ${intent})`],
        idempotencyKey: `ruling:${rulingId}`,
        qmAstHash: deps.qmAstHash,
      });
      return { mayDecision, recordedEvent };
    }
    case "lineage.reconcile": {
      const { planId } = args;
      const events = await deps.getEvents(planId);
      const integrity = verifyTemporalLineageIntegrity(events);
      const rebuilt = rehydrateItemStates(events);
      const mismatches: string[] = [];
      if (deps.getItemStateMap) {
        const live = deps.getItemStateMap();
        for (const [targetId, state] of rebuilt.entries()) {
          if (live.get(targetId) !== state) mismatches.push(targetId);
        }
        if (mismatches.length > 0) {
          (deps.tx as unknown as { rehydrate?: () => void }).rehydrate?.();
          await appendConservedTemporalMutation(deps.tx, {
            planId,
            sessionId: "steward-pulse",
            targetId: planId,
            targetLabel: "Level",
            mcpVerb: "reconcile",
            signal: "SIG_RECONCILE",
            fromState: "",
            toState: "",
            lcaState: "",
            entryExitTrace: [`RECONCILE(rehydrated: ${mismatches.join(", ")})`],
            idempotencyKey: `reconcile:${planId}:${events.at(-1)?.eventId ?? "genesis"}`,
            qmAstHash: deps.qmAstHash,
          });
        }
      }
      return {
        valid: integrity.valid,
        eventsCount: events.length,
        mismatches,
        rehydrated: mismatches.length > 0,
      };
    }
    default:
      throw new Error(`MCP_ERR_UNKNOWN_TOOL: '${name}'`);
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export interface HttpGatekeeper {
  server: http.Server;
  host: string;
  port: number;
  listen: () => Promise<number>;
  close: () => Promise<void>;
}

/**
 * Transport B: loopback-only HTTP JSON endpoint on 127.0.0.1 (default port 4110).
 * `POST /mcp/may` returns the raw MayEvaluationOutput (top-level `allow`) so the
 * `.git/hooks/pre-commit` hook can gate commits with `jq -r '.allow'`.
 *
 * E1 (AMEND-09.1): when `opts.authToken` (or MCP_AUTH_TOKEN) is set, every
 * `POST /mcp/*` must present `Authorization: Bearer <token>` or it gets a 401 —
 * a caller-supplied sessionId alone must not authorize mutations. The binding
 * stays loopback-only; never expose this surface publicly.
 */
export function createHttpGatekeeper(
  deps: OrchestratorDeps,
  opts: { host?: string; port?: number; authToken?: string } = {}
): HttpGatekeeper {
  const host = opts.host ?? "127.0.0.1";
  const requestedPort = opts.port ?? 4110;
  const authToken = opts.authToken ?? process.env.MCP_AUTH_TOKEN ?? "";

  const server = http.createServer(async (req, res) => {
    const send = (status: number, payload: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    };
    try {
      const url = new URL(req.url ?? "/", `http://${host}:${requestedPort}`);
      if (req.method === "GET" && (url.pathname === "/health" || url.pathname === "/mcp/health")) {
        send(200, { ok: true, service: "qm-hsm-mcp", authRequired: authToken !== "" });
        return;
      }
      if (req.method === "POST" && url.pathname.startsWith("/mcp/")) {
        if (authToken !== "" && req.headers.authorization !== `Bearer ${authToken}`) {
          send(401, { ok: false, error: "unauthorized: missing or invalid bearer token" });
          return;
        }
        const tool = decodeURIComponent(url.pathname.slice("/mcp/".length));
        const raw = await readBody(req);
        const body = raw ? JSON.parse(raw) : {};
        const args = body?.params ?? body?.arguments ?? body ?? {};
        const result = await handleToolCall(deps, tool, args);
        send(200, tool === "may" ? result : { ok: true, tool, result });
        return;
      }
      send(404, { ok: false, error: "Not found" });
    } catch (err) {
      send(400, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  return {
    server,
    host,
    port: requestedPort,
    listen: () =>
      new Promise((resolve) => {
        server.listen(requestedPort, host, () => {
          const addr = server.address();
          resolve(typeof addr === "object" && addr ? addr.port : requestedPort);
        });
      }),
    close: () =>
      new Promise((resolve) => server.close(() => resolve())),
  };
}

/**
 * Transport A: minimal stdio JSON-RPC 2.0 loop speaking MCP `initialize`,
 * `tools/list`, and `tools/call` (one JSON message per line).
 */
export function startStdioTransport(deps: OrchestratorDeps): void {
  const rl = readline.createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg: any;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return;
    }
    const hasId = msg.id !== undefined && msg.id !== null;
    const respond = (payload: Record<string, unknown>) => {
      if (hasId) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, ...payload }) + "\n");
      }
    };
    void (async () => {
      switch (msg.method) {
        case "initialize":
          respond({
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "qm-hsm-mcp", version: "0.1.0" },
            },
          });
          break;
        case "ping":
          respond({ result: {} });
          break;
        case "tools/list":
          respond({ result: { tools: TOOL_DEFS } });
          break;
        case "tools/call": {
          const name = msg.params?.name;
          const args = msg.params?.arguments ?? {};
          try {
            const result = await handleToolCall(deps, name, args);
            respond({
              result: {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                isError: false,
              },
            });
          } catch (err) {
            respond({
              result: {
                content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
                isError: true,
              },
            });
          }
          break;
        }
        default:
          respond({ error: { code: -32601, message: `Method not found: ${msg.method}` } });
      }
    })().catch((err) => {
      respond({ error: { code: -32603, message: err instanceof Error ? err.message : String(err) } });
    });
  });
}

/**
 * E4/E6 (AMEND-09.4/09.6): one steward-pulse tick — verify the lineage chain and
 * reconcile in-memory state from it. Runs on every pulse, not only at stage gates.
 */
export async function runStewardPulseTick(
  deps: OrchestratorDeps,
  planId: string
): Promise<{ valid: boolean; eventsCount: number; mismatches: string[]; rehydrated: boolean }> {
  return (await handleToolCall(deps, "lineage.reconcile", { planId })) as {
    valid: boolean; eventsCount: number; mismatches: string[]; rehydrated: boolean;
  };
}

/**
 * Starts the steward-pulse loop (SPEC-008: 900s flat beat by default).
 * Returns a stop function. A broken chain is logged loudly — in production the
 * steward dispatches SIG_TOLERANCE_BREACH to the current StageGate.
 */
export function startStewardPulse(
  deps: OrchestratorDeps,
  planId: string,
  intervalMs: number,
  onTick?: (r: { valid: boolean; eventsCount: number; mismatches: string[]; rehydrated: boolean }) => void
): () => void {
  const timer = setInterval(() => {
    runStewardPulseTick(deps, planId)
      .then((r) => {
        if (!r.valid) {
          console.error(`[qm-hsm-mcp] PULSE: lineage chain BROKEN for ${planId} — escalate SIG_TOLERANCE_BREACH`);
        }
        onTick?.(r);
      })
      .catch((err) => console.error("[qm-hsm-mcp] PULSE reconcile failed:", err));
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

export function loadFileDeps(projectRoot: string): {
  planAst: QmModelAst;
  gateAst: QmModelAst;
  rules: CompiledEffectiveRuleset;
  qmAstHash: string;
} {
  const planXml = fs.readFileSync(path.join(projectRoot, "models/plan_item.qm"), "utf-8");
  const gateXml = fs.readFileSync(path.join(projectRoot, "models/stage_gate.qm"), "utf-8");
  const planAst = parseQmXmlToAst(planXml);
  const gateAst = parseQmXmlToAst(gateXml);
  const rules = compileMonotonicYamlChain(
    fs
      .readFileSync(path.join(projectRoot, "rules/MONOTONIC_YAML_RULES_BUNDLE.yaml"), "utf-8")
      .split(/^---$/m)
  );
  // E6 (AMEND-09.6): hash of the loaded .qm model set, chained into every event
  const qmAstHash = crypto
    .createHash("sha256")
    .update(planXml, "utf8")
    .update(gateXml, "utf8")
    .digest("hex");
  return { planAst, gateAst, rules, qmAstHash };
}

async function main(): Promise<void> {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const { planAst, gateAst, rules, qmAstHash } = loadFileDeps(projectRoot);

  // Demo mode: in-memory lineage. With a live Neo4j, inject a runner backed by
  // neo4j-driver v5: `session.executeWrite(tx => ...)` satisfies GraphTransactionRunner.
  const tx = new InMemoryNeo4jTx();
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
  const demoLevel: LevelToleranceSnapshot = {
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
    qmAstHash,
    askRegistry: new Map<string, string>(),
    getItemStateMap: () => tx.itemStates,
    getItemContext: async (itemId) => ({
      ...baseItem,
      itemId,
      hsmStatePath: tx.itemStates.get(itemId) ?? baseItem.hsmStatePath,
    }),
    getSessionRoles: async () => ["IMPL"],
    getLevel: async () => demoLevel,
    getLevelForItem: async () => demoLevel,
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

  const gatekeeper = createHttpGatekeeper(deps, {
    host: "127.0.0.1",
    port: Number(process.env.MCP_PORT ?? 4110),
    authToken: process.env.MCP_AUTH_TOKEN,
  });
  const port = await gatekeeper.listen();

  // Steward pulse: per-pulse lineage verify + reconcile (E4/E6). 900s default
  // (SPEC-008 flat beat); STEWARD_PULSE_SECONDS=0 disables.
  const pulseSeconds = Number(process.env.STEWARD_PULSE_SECONDS ?? 900);
  if (pulseSeconds > 0) {
    startStewardPulse(deps, process.env.QM_PLAN_ID ?? "PLAN-CORE-2026", pulseSeconds * 1000);
    console.error(`[qm-hsm-mcp] steward pulse armed: every ${pulseSeconds}s (lineage.reconcile)`);
  }
  if (process.env.MCP_STDIO === "1") {
    startStdioTransport(deps);
  }
  if (!process.env.MCP_AUTH_TOKEN) {
    console.error("[qm-hsm-mcp] WARNING: MCP_AUTH_TOKEN not set — loopback HTTP surface is UNAUTHENTICATED (any local process can call mutating tools). Set MCP_AUTH_TOKEN and send it as a Bearer token.");
  }
  console.error(`[qm-hsm-mcp] HTTP gatekeeper listening on http://127.0.0.1:${port}/mcp/* (loopback only)`);
}

const invokedDirectly = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;
if (invokedDirectly) {
  void main();
}
