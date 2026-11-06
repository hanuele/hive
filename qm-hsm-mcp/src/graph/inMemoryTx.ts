import {
  GraphTransactionRunner,
  RecordedTemporalEvent,
} from "./lineageWriter";

/**
 * In-memory GraphTransactionRunner used for local demos and Vitest.
 * Mirrors the two Cypher statements issued by `appendConservedTemporalMutation`:
 * the HEAD_EVENT lock/read and the atomic mutation + chained event append.
 */
export class InMemoryNeo4jTx implements GraphTransactionRunner {
  public headHash: string = "GENESIS_0000000000000000";
  public events: RecordedTemporalEvent[] = [];
  public itemStates = new Map<string, string>();

  async run(cypher: string, params: Record<string, any>): Promise<{ records: any[] }> {
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
      };
      this.events.push(evt);
      this.headHash = params.chainHash;
      this.itemStates.set(params.targetId, params.toState);
      return {
        records: [{ get: () => params.eventId }],
      };
    }
    return { records: [] };
  }
}
