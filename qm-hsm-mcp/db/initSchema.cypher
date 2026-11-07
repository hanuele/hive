// SPEC-003 §2.1: Mandatory Neo4j schema initialization. Run once at server startup.
// AMEND-03.1 (C2): shared base label for all mutable Active Objects so
// `MATCH (target:ActiveObject {id: $targetId})` is index-backed and label-safe.
CREATE CONSTRAINT ao_id_unique IF NOT EXISTS FOR (n:ActiveObject) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT plan_id_unique IF NOT EXISTS FOR (p:Plan) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT level_id_unique IF NOT EXISTS FOR (l:Level) REQUIRE l.id IS UNIQUE;
CREATE CONSTRAINT gate_id_unique IF NOT EXISTS FOR (g:StageGate) REQUIRE g.id IS UNIQUE;
CREATE CONSTRAINT item_id_unique IF NOT EXISTS FOR (i:PlanItem) REQUIRE i.id IS UNIQUE;
CREATE CONSTRAINT task_id_unique IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT session_id_unique IF NOT EXISTS FOR (s:AgentSession) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:TemporalEvent) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT msg_id_unique IF NOT EXISTS FOR (m:CommsMessage) REQUIRE m.id IS UNIQUE;
