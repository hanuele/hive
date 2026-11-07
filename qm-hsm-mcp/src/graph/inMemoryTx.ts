import {
  GraphTransactionRunner,
  RecordedTemporalEvent,
  rehydrateItemStates,
} from "./lineageWriter";

/**
 * In-memory GraphTransactionRunner used for local demos and Vitest.
 * Mirrors the Cypher statements issued by `appendConservedTemporalMutation`:
 * the idempotency dedup read, the HEAD_EVENT lock/read, and the atomic
 * mutation + chained event append.
 */
export class InMemoryNeo4jTx implements GraphTransactionRunner {
  public headHash: string = "GENESIS_0000000000000000";
  public events: RecordedTemporalEvent[] = [];
  public itemStates = new Map<string, string>();

  /**
   * E4 (AMEND-09.4): crash recovery — rebuild memory (itemStates + headHash)
   * from the conserved event chain. Memory is only ever mutated in the CREATE
   * branch of run() (i.e., at commit), never before.
   */
  public rehydrate(): void {
    this.itemStates = rehydrateItemStates(this.events);
    this.headHash = this.events.at(-1)?.chainHash ?? "GENESIS_0000000000000000";
  }

  async run(cypher: string, params: Record<string, any>): Promise<{ records: any[] }> {
    // E2: idempotency dedup read — RETURN e (never the CREATE statement)
    if (cypher.includes("idempotencyKey: $idempotencyKey") && cypher.includes("RETURN e") && !cypher.includes("CREATE")) {
      const found = this.events.find(
        (e) =>
          e.planId === params.planId &&
          e.mcpVerb === params.mcpVerb &&
          e.idempotencyKey === params.idempotencyKey
      );
      return { records: [{ get: (key: string) => (key === "e" ? found ?? null : null) }] };
    }
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
      const evt: RecordedTemporalEvent = {
        eventId: params.eventId,
        timestampIso: params.timestampIso,
        planId: params.planId,
        sessionId: params.sessionId,
        targetId: params.targetId,
        mcpVerb: params.mcpVerb,
        signal: params.signal,
        fromState: params.fromState,
        toState: params.toState,
        lcaState: params.lcaState,
        entryExitTrace: params.entryExitTrace,
        prevHash: params.prevHash,
        chainHash: params.chainHash,
        idempotencyKey: params.idempotencyKey ?? null,
        qmAstHash: params.qmAstHash ?? null,
        origin: params.origin ?? "TRUNK",
      };
      this.events.push(evt);
      this.headHash = params.chainHash;
      // reconcile events are plan-level bookkeeping, not item state mutations
      if (params.mcpVerb !== "reconcile") {
        this.itemStates.set(params.targetId, params.toState);
      }
      return {
        records: [{ get: () => params.eventId }],
      };
    }
    return { records: [] };
  }
}
