# Quality Baseline

> Reference metrics from completed Hive missions. Use these as benchmarks for future missions.

**Data source:** `memory/archive/events.jsonl` + retrospective files.

---

## Mission Inventory

| # | Mission | Date | Squad Type | Agents | Outcome |
|---|---------|------|-----------|--------|---------|
| M1 | *(your first mission)* | | Research (3) | orchestrator + 2 investigators | |
| M2 | *(your second mission)* | | Engineering Focused Build (3) | designer + implementer + verifier | |

---

## Findings per Agent per Mission

| Mission | Agent | Findings/Output | Notes |
|---------|-------|----------------|-------|
| M1 | investigator-alpha | — | Depth-first lens |
| M1 | investigator-beta | — | Breadth-first lens |

**Expected average findings per agent (research/review missions):** ~10 (based on system testing)

---

## Stop Signals

| Metric | Value |
|--------|-------|
| Formal Stop Signals issued (in events.jsonl) | 0 |
| Challenger challenges issued | — |
| Challenges resulting in corrections | — |

---

## Unique Findings (Non-Overlapping)

| Mission | Total Findings | Convergent | Unique | Uniqueness % |
|---------|---------------|------------|--------|-------------|
| — | — | — | — | — |

**Expected baseline uniqueness ratio:** ~89% — each agent in a multi-agent mission should contribute predominantly non-overlapping findings. This validates the Complementary Lens pattern.

---

## Retrospective Completeness

| Mission | Template Version | Sections Filled / Total | Complete? |
|---------|-----------------|------------------------|-----------|
| — | Full (10 sections) | /10 | |

**Notes:**
- Full template includes: Beginning Anew (Flower Watering, Expressing Regret, Sharing Aspiration), What Surprised Us, What We Found, What Went Well, Who Was Affected, What Failed, Did Multi-Agent Add Value, Energy and Effort, Candidate Patterns
- All retrospectives should be completed — no abandoned or partial retrospectives

---

## Mission Types Exercised

| Type | Count | Missions |
|------|-------|----------|
| Research | 0 | |
| Engineering | 0 | |
| Review | 0 | |

**Gap:** Track which squad types have not been exercised.

---

## Failure Events

| Level | Count | Missions | Resolution |
|-------|-------|----------|-----------|
| L1 | 0 | — | — |
| L2 | 0 | — | — |
| L3 | 0 | — | — |
| L4 | 0 | — | — |

**Target baseline failure rate:** < 1.0 per mission. All should be L1-L2 (recoverable/degraded).

---

## Candidate Patterns Identified

| Pattern | First Observed | Occurrences | Status |
|---------|---------------|-------------|--------|
| Complementary Lens | *(system-validated)* | 3+ | **PROMOTED** (rule in composition-rules.md) |

**Notes:**
- Track patterns across missions using the Crystallization Protocol
- Patterns at 3+ occurrences reach PROMOTE threshold
- The Complementary Lens pattern is pre-validated: assigning different lenses to concurrent agents produces richer findings

---

## Multi-Agent Value Assessment

| Mission | Multi-Agent Added Value? | Evidence |
|---------|------------------------|----------|
| — | — | — |

**Expected baseline:** Multi-agent should add clear value in 80%+ of missions where it is used (terrain assessment recommended it).
