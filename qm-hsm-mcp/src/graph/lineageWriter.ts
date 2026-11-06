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
    | "steward.audit_gate";
  signal: string;
  fromState: string;
  toState: string;
  lcaState: string;
  entryExitTrace: string[];
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
}

/**
 * Abstraction over Neo4j ManagedTransaction (compatible with neo4j-driver v5
 * and in-memory test doubles for Vitest).
 */
export interface GraphTransactionRunner {
  run(cypher: string, params: Record<string, any>): Promise<{ records: any[] }>;
}

export function computeTemporalChainHash(
  prevHash: string,
  payload: Omit<RecordedTemporalEvent, "chainHash" | "prevHash" | "timestampIso">
): string {
  const canonical = [
    prevHash,
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

  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

/**
 * Atomically mutates the target Active Object's HSM state in Neo4j AND appends
 * a cryptographically chained (:TemporalEvent) node to the Plan's [:HEAD_EVENT] list.
 */
export async function appendConservedTemporalMutation(
  tx: GraphTransactionRunner,
  input: TemporalMutationInput
): Promise<RecordedTemporalEvent> {
  const eventId = `EVT-${crypto.randomUUID()}`;
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

  const prevHash: string = headRes.records[0].get("prevHash");

  const chainHash = computeTemporalChainHash(prevHash, {
    eventId,
    planId: input.planId,
    sessionId: input.sessionId,
    targetId: input.targetId,
    mcpVerb: input.mcpVerb,
    signal: input.signal,
    fromState: input.fromState,
    toState: input.toState,
    lcaState: input.lcaState,
    entryExitTrace: input.entryExitTrace,
  });

  // Step 2: Mutate Target Node & Append Chained (:TemporalEvent) Atomically
  const mutationCypher = `
    MATCH (p:Plan {id: $planId})
    MATCH (s:AgentSession {id: $sessionId})
    MATCH (target {id: $targetId})
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
      chainHash: $chainHash
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
  };
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
    const recomputed = computeTemporalChainHash(evt.prevHash, {
      eventId: evt.eventId,
      planId: evt.planId,
      sessionId: evt.sessionId,
      targetId: evt.targetId,
      mcpVerb: evt.mcpVerb,
      signal: evt.signal,
      fromState: evt.fromState,
      toState: evt.toState,
      lcaState: evt.lcaState,
      entryExitTrace: evt.entryExitTrace,
    });
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
