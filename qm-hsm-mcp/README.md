# qm-hsm-mcp

Graph-native PRINCE2 rolling-wave orchestrator for autonomous coding-agent swarms:
a direct Quantum Leaps `.qm` XML HSM interpreter, a monotonic YAML rule lattice, a
universal `may()` capability gatekeeper, Neo4j SHA-256 temporal lineage, a virtual
`.md` projector, and a dual-transport MCP server. Implements SPEC-001/002/003.

## Layout

| Path | Spec | Contents |
| :--- | :--- | :--- |
| `models/plan_item.qm` | SPEC-001 | PlanItem active-object statechart (HorizonWave → Operational → VerifiedDone/Cancelled) |
| `models/stage_gate.qm` | SPEC-002 | StageGate active object (GateGovernance lifecycle, exception escalation, sign-off) |
| `rules/MONOTONIC_YAML_RULES_BUNDLE.yaml` | SPEC-001 §4 | 3-tier bundle: GLOBAL → LEVEL LVL-2 → ITEM L2.2 (tighten-only) |
| `src/hsm/qmXmlParser.ts` | SPEC-001 §3.1 | `.qm` XML → AST, relative `../../N` target resolution, `target_path` validation |
| `src/hsm/lcaEngine.ts` | SPEC-001 §3.2 | `Q_SUPER` signal resolution, LCA, EXIT → ACTION → ENTRY trace, initial drill-down |
| `src/rules/yamlLatticeCompiler.ts` | SPEC-001 §4 | Monotonic lattice fold; throws `MonotonicityViolationError` on relaxation |
| `src/steward/stewardAuditEngine.ts` | SPEC-002 | Stage tolerance audit, rolling-wave horizon lock, wave advance |
| `src/graph/lineageWriter.ts` | SPEC-003 §2–3 | Atomic mutation + SHA-256 hash-chained `TemporalEvent` append, chain verifier |
| `src/graph/mdProjector.ts` | SPEC-003 §4 | Read-only virtual Markdown projection (I-MD-PROJECTION) |
| `src/graph/inMemoryTx.ts` | SPEC-003 §6 | In-memory `GraphTransactionRunner` for tests/demo |
| `src/mcp/orchestrator.ts` | SPEC-003 §5 | 3-gate `may()` evaluator + transactional `hsm.dispatch` |
| `src/mcp/server.ts` | SPEC-003 §1 | Tool registry, loopback HTTP gatekeeper (`127.0.0.1:4110`), stdio JSON-RPC |
| `db/initSchema.cypher` | SPEC-003 §2.1 | Uniqueness constraints |
| `hooks/pre-commit` | SPEC-001 §5.2 | `may()` pre-flight git hook |
| `tests/phase{1,2,3}.spec.ts` | spec suites | Verbatim spec verification suites |
| `tests/server.spec.ts` | SPEC-003 | HTTP gatekeeper + tool-registry smoke tests |

## Invariants enforced

1. `I-HSM-ONLY` — structural state changes only via `HsmEngine.dispatch()` transactions.
2. `I-MAY-GATE` — every mutating verb calls `may(sessionId, itemId, intent)` first.
3. `I-MONOTONIC-YAML` — child rule tiers only tighten; relaxation fails at load time.
4. `I-TEMPORAL-CHAIN` — every mutation appends an immutable, hash-chained event in the same ACID tx.
5. `I-ROLLING-WAVE` — only ACTIVE (N) and ROLLING_LOOKAHEAD (N+1) levels decompose.
6. `I-MD-PROJECTION` — Markdown is always a projection of the graph, never source of truth.

## Run

```bash
npm install
npm test          # vitest: phase1 + phase2 + phase3 + server suites
npm run typecheck # tsc --noEmit
MCP_PORT=4110 bun src/mcp/server.ts        # loopback HTTP gatekeeper (demo, in-memory lineage)
MCP_STDIO=1 MCP_PORT=4110 bun src/mcp/server.ts  # + stdio MCP transport
```

Tools: `may`, `hsm.dispatch`, `plan.decompose_wave`, `task.sync_state`, `comms.post`,
`rules.compile_check`, `steward.audit_gate`, `md.project`, `lineage.verify`.

HTTP: `POST http://127.0.0.1:4110/mcp/<tool>` with `{"params": {...}}`;
`POST /mcp/may` returns the raw decision (`{"allow": ...}`) for `hooks/pre-commit`.
Binding is loopback-only; do not expose publicly.

With a live Neo4j, inject a `GraphTransactionRunner` backed by
`neo4j-driver` v5 (`session.executeWrite(tx => ...)`) in place of `InMemoryNeo4jTx`,
and run `db/initSchema.cypher` once.
