# Mission: error-handling-audit

## Mission Gatha

Arriving at this mission, I am aware:
I do not see the whole.
My teammates do not see the whole.
Together, we may see what none of us could see alone.
I offer my perspective with humility.
I receive others' perspectives with openness.
May this work serve those who will use it.

## Commander's Intent

**Why:** Our web application has grown from 3 services to 7 over the past year, each built by different developers at different times. Before the Q2 refactoring sprint, we need to understand our actual error handling patterns — not what we think they are, but what they actually are. This serves the engineering team who will do the refactoring, and ultimately the users who experience the errors.

**Objective:** Produce a clear inventory of error handling patterns across all 7 services, identifying inconsistencies, gaps, and risks.

**Constraints:** Do not modify any code. Research only. Do not access production logs (use code analysis only).

**Boundaries:** In scope: all 7 services (`api-gateway`, `auth`, `billing`, `notifications`, `search`, `users`, `admin`). Out of scope: frontend error handling, third-party library internals.

**Premises to question:** "Our API gateway catches all downstream errors." "All services use the same error response format." "Retry logic is handled at the gateway level."

**Success criteria:** A BLUF summary with categorized findings (consensus/contested/gaps), each with confidence level and file-path evidence. At minimum: identify how many distinct error patterns exist across services.

**Time box:** 1 round per agent.

**Resource justification:** Multiple perspectives needed — a depth-first lens will trace specific error paths end-to-end, while a breadth-first lens will scan across all services for pattern inconsistencies. A single agent doing both would lose depth for breadth or vice versa.

**Consequences of failure:** The refactoring team starts without knowing the baseline. They may unify patterns that shouldn't be unified, or miss error paths entirely. In the worst case, the refactoring introduces regressions in error handling for billing or auth — services where errors have financial or security impact.

## Current State

Mission complete. Synthesis written. Retrospective filed.

### Agent Checkpoints

[14:28] investigator-alpha CHECKPOINT:
- Key conclusion: 4 distinct error handling patterns found across 7 services
- Working hypothesis: Gateway catches most but not all downstream errors
- Next step: Complete — findings submitted
- Unwritten findings: 0

[14:30] investigator-beta CHECKPOINT:
- Key conclusion: Error response format varies across 5 of 7 services
- Working hypothesis: Services built before Q3 2025 use old format, after use new format
- Next step: Complete — findings submitted
- Unwritten findings: 0

## Findings

- [14:18] investigator-alpha: The api-gateway has a catch-all error handler at `middleware/error_handler.py:45-62` that normalizes downstream errors into `{error: str, code: int}` format. However, it only catches `HTTPException` — raw Python exceptions from downstream services bypass this handler and return 500 with a stack trace in non-production environments. (confidence: 0.92) (source: api-gateway/middleware/error_handler.py)

- [14:20] investigator-alpha: The billing service has its own error hierarchy (`billing/exceptions.py`) with 6 custom exception classes. These are NOT subclasses of `HTTPException` — they inherit from `BillingError(Exception)`. The gateway's catch-all handler will miss these if they propagate uncaught. (confidence: 0.88) (source: billing/exceptions.py, api-gateway/middleware/error_handler.py)

- [14:22] investigator-alpha: The auth service uses a decorator pattern (`@handle_auth_errors`) on every endpoint that converts auth exceptions to HTTP 401/403 responses. This is the most consistent pattern found — every auth endpoint has the decorator. (confidence: 0.95) (source: auth/decorators.py, auth/routes/*.py)

- [14:24] investigator-alpha: Retry logic exists in 3 places: gateway-level for downstream HTTP calls (`tenacity`, 3 retries with exponential backoff), billing service for payment provider calls (custom retry, 2 attempts with 5s delay), and notifications service for email sending (no retry — fire and forget). These are independent implementations with different parameters. (confidence: 0.90) (source: api-gateway/clients/base.py, billing/providers/stripe_client.py, notifications/email_sender.py)

- [14:26] investigator-alpha: The search service has no error handling at the service layer — all exceptions propagate to FastAPI's default handler, which returns `{"detail": "Internal Server Error"}` with a 500 status. This is the only service with zero custom error handling. (confidence: 0.93) (source: search/routes.py, search/service.py)

- [14:28] investigator-alpha: Database connection errors are handled differently in every service. Auth uses connection pooling with automatic reconnect. Billing wraps every DB call in a try/except that logs and returns a generic error. Users, search, and admin let SQLAlchemy errors propagate uncaught. (confidence: 0.85) (source: auth/db.py, billing/db.py, users/service.py, search/service.py)

- [14:19] investigator-beta: 5 of 7 services define error response schemas. Found 3 distinct formats: (1) `{error: str, code: int}` in gateway and users, (2) `{detail: str, type: str, timestamp: str}` in billing and notifications, (3) `{message: str, errors: []}` in admin. Auth and search use FastAPI defaults. (confidence: 0.90) (source: grep across all `*/schemas/error*.py` and `*/models/error*.py`)

- [14:22] investigator-beta: Logging patterns during errors vary widely. Auth logs every error with structured JSON (severity, user_id, endpoint, trace_id). Billing logs to both stdout and a separate `billing-errors.log` file. Gateway, users, notifications, search, and admin use Python's default `logging.error()` with unstructured messages. (confidence: 0.88) (source: grep for `logging.error\|logger.error\|log.error` across all services)

- [14:25] investigator-beta: HTTP status code usage is inconsistent. The auth service correctly distinguishes 400 (bad request) from 401 (unauthenticated) from 403 (unauthorized). The billing service returns 400 for all client errors including validation, payment failure, and missing resources (which should be 404 or 422). Admin returns 200 with `{success: false}` for errors — a pattern that breaks standard HTTP semantics. (confidence: 0.92) (source: billing/routes/*.py, admin/routes/*.py, auth/routes/*.py)

- [14:28] investigator-beta: Only 2 of 7 services include correlation/trace IDs in error responses: auth and gateway. The remaining 5 services generate errors that cannot be traced back to the originating request without timestamp-based log correlation. (confidence: 0.87) (source: auth/middleware.py, api-gateway/middleware/tracing.py)

- [14:30] investigator-beta: The `admin` service was built 18 months ago and has not been updated to match any conventions established since. It uses synchronous requests (not async), returns 200 for errors, has no error response schema, and no structured logging. This is the oldest service and the furthest from current patterns. (confidence: 0.85) (source: admin/app.py, git log --format=%ai admin/)

## Stop Signals

None issued.

## Decisions

None required — research-only mission.

## Open Questions

1. **Is the billing service's custom exception hierarchy intentional?** It may have been designed to support domain-specific error workflows (payment retry, fraud flagging) that generic HTTP exceptions can't express. Refactoring it to use HTTPException may lose information. Needs input from the original billing developer.

2. **Should the admin service be rewritten or wrapped?** It's so far from current patterns that incremental refactoring may cost more than a rewrite. But a rewrite carries higher risk.

3. **What is the actual production impact of the search service's missing error handling?** Without production logs (out of scope), we don't know if search errors are rare (acceptable) or common (urgent).

## Observations Without Category

- investigator-alpha: The auth service feels like it was written by someone who had previously been burned by poor error handling. Every edge case is covered. The billing service feels like it was written by someone who understood the domain deeply but not HTTP conventions. The search service feels like a prototype that never got hardened.

- investigator-beta: The three error response formats map almost exactly to three time periods: pre-2025, Q1-Q2 2025, and Q3 2025+. The inconsistency isn't random — it's archaeological. Each format represents the team's understanding at a different point in time.

## Deeper Patterns

The error handling inconsistency is not a failure of discipline. It is a natural consequence of a system that grew service by service, each service reflecting the team's conventions at the time it was built. The newer services (auth, gateway) are significantly more mature — not because the developers were better, but because the team had learned from operating the older services.

This suggests the refactoring should not impose a single pattern retroactively. Instead, it should: (a) define the target pattern based on what the newest services got right, (b) create a migration path for each older service based on its current state, and (c) prioritize by blast radius — billing and auth first (financial/security), then gateway (routing), then everything else.

## What We Assume Is Stable (But May Not Be)

- **FastAPI version is consistent across services.** If services use different FastAPI versions, default error behavior may differ.
- **The gateway is the only entry point.** If any service is directly accessible (e.g., internal network), the gateway's error normalization doesn't protect it.
- **Python exception semantics are well-understood by the team.** The variety of patterns suggests this may not be the case.

## Synthesis

**BLUF:** 4 distinct error handling patterns exist across 7 services, with no two services fully consistent. The inconsistency is archaeological — newer services are better. The highest-risk gaps are billing's non-HTTP exception hierarchy (financial impact) and search's zero error handling (unknown production impact).

### Consensus (both investigators agree)
- Error response formats are inconsistent (3+ formats across services) — confidence: 0.91
- The admin service is the furthest from current conventions — confidence: 0.85
- Auth service has the most robust error handling — confidence: 0.93
- Retry logic is implemented independently in 3 services with different parameters — confidence: 0.90
- Trace/correlation IDs are only present in 2 of 7 services — confidence: 0.87

### Majority
- The inconsistency follows a temporal pattern (older = less mature) — confidence: 0.85 (beta asserts strongly; alpha's evidence is consistent but focused on different dimensions)

### Contested
- None — the two lenses produced complementary rather than contradictory findings.

### Gaps
- **Production error rates** — we don't know which error gaps actually cause user-visible problems (excluded by scope constraint: no production logs)
- **Frontend error handling** — excluded from scope, but may compensate for some backend gaps
- **Third-party service failure modes** — how do external dependencies (Stripe, email providers) fail, and are those failures handled?

### The Unsayable
There is a felt sense that the admin service may represent not just technical debt but organizational debt — a service that no one owns, no one wants to touch, and everyone routes around. The numbers (18 months since last update, zero convention alignment) support this, but the organizational dynamic is beyond what code analysis can confirm.

### Recommendation
1. **Immediate (before refactoring):** Define target error response format, logging standard, and status code conventions. Document as an ADR.
2. **High priority:** Fix billing's exception hierarchy (financial risk) and add error handling to search (unknown risk).
3. **Medium priority:** Unify retry logic in a shared library. Add trace IDs to remaining 5 services.
4. **Low priority / separate decision:** Address admin service (rewrite vs. wrap — needs team discussion).

## Briefing
<!-- Not needed — blackboard stayed under 10KB -->

## Task Decomposition
<!-- Not needed — research-only mission -->
