import crypto from "node:crypto";

export interface TemporalMutationInput {
  planId: string;
  sessionId: string;
  targetId: string;
  targetLabel: "PlanItem" | "StageGate" | "Level";
  mcpVerb:
    | "hsm.dispatch"
    | "plan.decompose_wave"
    | "task.sync_state"
    | "comms.post"
    | "steward.audit_gate"
    | "ruling.record"
    | "reconcile";
  signal: string;
  fromState: string;
  toState: string;
  lcaState: string;
  entryExitTrace: string[];
  idempotencyKey?: string; // E2 (AMEND-09.2): deduped inside the locked transaction
  qmAstHash?: string;      // E6 (AMEND-09.6): SHA-256 of the loaded .qm model at dispatch time
  telemetryUpdates?: {
    testCoveragePct?: number;
    openBlockersCount?: number;
    cleanWorktree?: boolean;
    ciGreen?: boolean;
  };
}

export interface RecordedTemporalEvent {
  eventId: string;
  timestampIso: string;
  planId: string;
  sessionId: string;
  targetId: string;
  mcpVerb: string;
  signal: string;
  fromState: string;
  toState: string;
  lcaState: string;
  entryExitTrace: string[];
  prevHash: string;
  chainHash: string;
  idempotencyKey?: string | null;
  qmAstHash?: string | null;
  origin?: string;
}

/**
 * Abstraction over Neo4j ManagedTransaction (compatible with neo4j-driver v5
 * and in-memory test doubles for Vitest).
 */
export interface GraphTransactionRunner {
  run(cypher: string, params: Record<string, any>): Promise<{ records: any[] }>;
}

/** RFC 9562 UUIDv7 (time-sortable): 48-bit ms timestamp + ver/variant + 62 random bits. */
export function uuidv7(): string {
  const b = crypto.randomBytes(16);
  b.writeUIntBE(Date.now(), 0, 6);
  b[6] = (b[6] & 0x0f) | 0x70; // version 7
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * SHA-256 chain hash. AMEND-03.2 (B6): `timestampIso` is part of the payload so
 * timestamp tampering is detected; `qmAstHash`/`idempotencyKey` (E6/E2) are
 * included when present.
 */
export function computeTemporalChainHash(
  prevHash: string,
  payload: Omit<RecordedTemporalEvent, "chainHash" | "prevHash">
): string {
  const canonical = [
    prevHash,
    payload.eventId,
    payload.timestampIso,
    payload.planId,
    payload.sessionId,
    payload.targetId,
    payload.mcpVerb,
    payload.signal,
    payload.fromState,
    payload.toState,
    payload.lcaState,
    payload.entryExitTrace.join("|"),
    payload.qmAstHash ?? "",
    payload.idempotencyKey ?? "",
  ].join("::");

  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

/** Normalize a TemporalEvent returned as a Neo4j node (`properties`) or a plain object (in-memory). */
function normalizeEvent(e: any): RecordedTemporalEvent {
  const p = e && e.properties ? e.properties : e;
  return {
    eventId: p.eventId ?? p.id,
    timestampIso: p.timestampIso ?? (p.timestamp ? String(p.timestamp) : new Date(0).toISOString()),
    planId: p.planId,
    sessionId: p.sessionId,
    targetId: p.targetId,
    mcpVerb: p.mcpVerb,
    signal: p.signal,
    fromState: p.fromState,
    toState: p.toState,
    lcaState: p.lcaState,
    entryExitTrace: p.entryExitTrace ?? [],
    prevHash: p.prevHash,
    chainHash: p.chainHash,
    idempotencyKey: p.idempotencyKey ?? null,
    qmAstHash: p.qmAstHash ?? null,
    origin: p.origin ?? "TRUNK",
  };
}

/**
 * Atomically mutates the target Active Object's HSM state in Neo4j AND appends
 * a cryptographically chained (:TemporalEvent) node to the Plan's [:HEAD_EVENT] list.
 * The `(:Plan)` write lock (C1) serializes concurrent writers so the
 * [:PREV_EVENT] chain can never fork; the labeled `:ActiveObject` match (C2)
 * uses the ao_id_unique constraint instead of an AllNodesScan.
 * E2: when `idempotencyKey` is given and an event with the same
 * (planId, mcpVerb, idempotencyKey) already exists, it is returned unchanged.
 */
export async function appendConservedTemporalMutation(
  tx: GraphTransactionRunner,
  input: TemporalMutationInput
): Promise<RecordedTemporalEvent> {
  const eventId = `EVT-${uuidv7()}`;
  const timestampIso = new Date().toISOString();

  // Step 1: Acquire write lock on (:Plan) and fetch current HEAD_EVENT hash
  const headQuery = `
    MATCH (p:Plan {id: $planId})
    SET p._writeLock = $eventId
    WITH p
    OPTIONAL MATCH (p)-[:HEAD_EVENT]->(headEvt:TemporalEvent)
    RETURN headEvt.id AS prevEventId, coalesce(headEvt.chainHash, "GENESIS_0000000000000000") AS prevHash
  `;
  const headRes = await tx.run(headQuery, {
    planId: input.planId,
    eventId,
  });

  if (headRes.records.length === 0) {
    throw new Error(`Plan '${input.planId}' not found in Neo4j`);
  }

  // Step 1b (E2): idempotency dedup inside the same locked transaction
  if (input.idempotencyKey) {
    const dedupQuery = `
      MATCH (p:Plan {id: $planId})
      OPTIONAL MATCH (e:TemporalEvent {planId: $planId, mcpVerb: $mcpVerb, idempotencyKey: $idempotencyKey})
      RETURN e
    `;
    const dedupRes = await tx.run(dedupQuery, {
      planId: input.planId,
      mcpVerb: input.mcpVerb,
      idempotencyKey: input.idempotencyKey,
    });
    const existing = dedupRes.records[0]?.get("e");
    if (existing) {
      return normalizeEvent(existing);
    }
  }

  const prevHash: string = headRes.records[0].get("prevHash");

  const chainHash = computeTemporalChainHash(prevHash, {
    eventId,
    timestampIso,
    planId: input.planId,
    sessionId: input.sessionId,
    targetId: input.targetId,
    mcpVerb: input.mcpVerb,
    signal: input.signal,
    fromState: input.fromState,
    toState: input.toState,
    lcaState: input.lcaState,
    entryExitTrace: input.entryExitTrace,
    qmAstHash: input.qmAstHash ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
  });

  // Step 2: Mutate Target Node & Append Chained (:TemporalEvent) Atomically
  const mutationCypher = `
    MATCH (p:Plan {id: $planId})
    MATCH (s:AgentSession {id: $sessionId})
    MATCH (target:ActiveObject {id: $targetId})
    OPTIONAL MATCH (p)-[oldHeadRel:HEAD_EVENT]->(prevEvt:TemporalEvent)

    SET target.hsmStatePath = $toState,
        target.updatedAt = datetime($timestampIso),
        target.testCoveragePct = coalesce($testCoveragePct, target.testCoveragePct),
        target.openBlockersCount = coalesce($openBlockersCount, target.openBlockersCount),
        target.cleanWorktree = coalesce($cleanWorktree, target.cleanWorktree),
        target.ciGreen = coalesce($ciGreen, target.ciGreen)

    CREATE (newEvt:TemporalEvent {
      id: $eventId,
      timestamp: datetime($timestampIso),
      mcpVerb: $mcpVerb,
      signal: $signal,
      fromState: $fromState,
      toState: $toState,
      lcaState: $lcaState,
      entryExitTrace: $entryExitTrace,
      prevHash: $prevHash,
      chainHash: $chainHash,
      idempotencyKey: $idempotencyKey,
      qmAstHash: $qmAstHash,
      origin: "TRUNK"
    })

    DELETE oldHeadRel
    CREATE (p)-[:HEAD_EVENT]->(newEvt)
    FOREACH (_ IN CASE WHEN prevEvt IS NOT NULL THEN [1] ELSE [] END |
      CREATE (newEvt)-[:PREV_EVENT]->(prevEvt)
    )
    CREATE (s)-[:EXECUTED_EVENT]->(newEvt)
    CREATE (newEvt)-[:MUTATED_TARGET]->(target)
    RETURN newEvt.id AS eventId
  `;

  await tx.run(mutationCypher, {
    planId: input.planId,
    sessionId: input.sessionId,
    targetId: input.targetId,
    eventId,
    timestampIso,
    mcpVerb: input.mcpVerb,
    signal: input.signal,
    fromState: input.fromState,
    toState: input.toState,
    lcaState: input.lcaState,
    entryExitTrace: input.entryExitTrace,
    prevHash,
    chainHash,
    idempotencyKey: input.idempotencyKey ?? null,
    qmAstHash: input.qmAstHash ?? null,
    testCoveragePct: input.telemetryUpdates?.testCoveragePct ?? null,
    openBlockersCount: input.telemetryUpdates?.openBlockersCount ?? null,
    cleanWorktree: input.telemetryUpdates?.cleanWorktree ?? null,
    ciGreen: input.telemetryUpdates?.ciGreen ?? null,
  });

  return {
    eventId,
    timestampIso,
    planId: input.planId,
    sessionId: input.sessionId,
    targetId: input.targetId,
    mcpVerb: input.mcpVerb,
    signal: input.signal,
    fromState: input.fromState,
    toState: input.toState,
    lcaState: input.lcaState,
    entryExitTrace: input.entryExitTrace,
    prevHash,
    chainHash,
    idempotencyKey: input.idempotencyKey ?? null,
    qmAstHash: input.qmAstHash ?? null,
    origin: "TRUNK",
  };
}

/**
 * E4 (AMEND-09.4): rebuild in-memory HSM state by replaying the conserved
 * lineage oldest -> newest. The graph is the source of truth; memory is a cache.
 */
export function rehydrateItemStates(
  eventsOldestFirst: RecordedTemporalEvent[]
): Map<string, string> {
  const states = new Map<string, string>();
  for (const evt of eventsOldestFirst) {
    if (evt.origin !== "COUNTERFACTUAL" && evt.mcpVerb !== "reconcile") {
      states.set(evt.targetId, evt.toState);
    }
  }
  return states;
}

/**
 * Verifies the cryptographic integrity of an ordered array of TemporalEvents
 * (ordered oldest -> newest).
 */
export function verifyTemporalLineageIntegrity(
  eventsOldestFirst: RecordedTemporalEvent[]
): { valid: boolean; brokenAtEventId?: string; reason?: string } {
  let expectedPrevHash = "GENESIS_0000000000000000";

  for (const evt of eventsOldestFirst) {
    if (evt.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        brokenAtEventId: evt.eventId,
        reason: `Broken prevHash link: expected '${expectedPrevHash}', found '${evt.prevHash}'`,
      };
    }
    const recomputed = computeTemporalChainHash(evt.prevHash, evt);
    if (recomputed !== evt.chainHash) {
      return {
        valid: false,
        brokenAtEventId: evt.eventId,
        reason: `Tampered payload checksum on ${evt.eventId}`,
      };
    }
    expectedPrevHash = evt.chainHash;
  }

  return { valid: true };
}
