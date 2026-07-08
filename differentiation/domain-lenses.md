# Domain Lenses

> Specialty focus for technical agents. Injected via spawn prompt to differentiate roles within a squad.

## When to Use

When agents need *technical specialization* rather than general perspective. Domain lenses are used in Engineering and Review squads where the same persona (Architect, Challenger) serves different technical roles.

## Lenses

Each lens has three parts: a one-line **definition** (what it asks of the change), a **search bias** (how it directs attention — inject this into the spawn prompt), and the **characteristic failure** it catches that a generalist misses.

| Lens | Definition | Search bias (spawn injection) | Characteristic failure caught |
|------|-----------|-------------------------------|-------------------------------|
| **Security** | Does the change protect credentials, inputs, and trust boundaries against misuse? | Trace every input to its sink and every secret to its store; evaluate for injection, exposure, auth bypass, and CWE-classified vulnerabilities. | Credential leaks, injection vectors, auth gaps, data exposure — things a generalist treats as implementation detail. |
| **Performance** | Will the change hold up under real load and data volume? | Focus on the hot path and the largest N; evaluate for N+1 queries, missing indexes, unnecessary allocations, and scalability bottlenecks. | Slow queries, memory leaks, scaling walls — things that work in dev but fail at load. |
| **Correctness** | Does the implementation match the specification exactly, edge cases included? | Compare code against spec line by line; check edge cases, type boundaries, and contract violations. | Off-by-one errors, type coercions, unhandled states — things that pass happy-path testing. |
| **Maintainability** | Could a new team member understand and safely change this in six months? | Read for readability and coupling; ask whether naming, structure, and documentation would orient a newcomer. | Hidden coupling, unclear naming, missing documentation — things that work now but create debt. |
| **User-impact** | What does the end user actually see and experience from this change? | For every change, ask "what does the end user see?"; check error messages, response formats, and behavioral changes. | Breaking changes, confusing errors, silent behavior changes — things that pass tests but surprise users. |
| **Standards** | Does the change follow the project's coding standards, style conventions, API contracts, and documentation completeness? | Check against the project's guidelines and existing conventions; verify naming, formatting, public-API shape, and doc coverage for new or changed surfaces. | Convention drift, undocumented public APIs, inconsistent naming, style violations — things that pass tests and behavior-focused reviews. |

## Engineering Squad Lens Injection (Worked Example)

The Engineering Squad reuses existing personas with lens injection — a single differentiation axis in the spawn prompt (from `squads/engineering-squad.md`):

| Role | Base Persona | Lens | Effect |
|------|-------------|------|--------|
| Designer | Architect | (none) | Pure design thinking — simplest viable approach, acceptance criteria, dependencies |
| Implementer | Architect | `operator` | Execution focus — pragmatic implementation, minimal deviation from plan |
| Reviewer | Challenger | (none) | Full adversarial review — edge cases, alternatives, Stop Signals |
| Verifier | Challenger | `correctness` | Verification focus — tests pass, guidelines met, plan followed |

**Spawn prompt example:**

```
"You are The Architect with operator lens — your focus is pragmatic execution
of the change plan. Implement exactly what was designed, documenting any
necessary deviations. Prefer the simplest correct implementation."
```

## Combining Lenses

For Review Squad, assign different lenses to concurrent reviewers:

```
Agent(name="correctness-reviewer",
      prompt="You are The Challenger with correctness lens. [persona]
             Review the diff for: type errors, edge cases, contract violations,
             test coverage gaps.")

Agent(name="security-reviewer",
      prompt="You are The Challenger with security lens. [persona]
             Review the diff for: injection vectors, credential exposure,
             auth bypass, CWE-classified vulnerabilities.")
```

This pairing was validated in Mission 3 (KAN-219 Review): correctness found 9 issues, security found 6, with only 2 convergent — 87% unique findings across lenses.

## Relationship to Perspective Frames

Domain lenses are *technical specializations* (security, performance, correctness). Perspective frames are *general thinking modes* (risk, design, efficiency). Use domain lenses for technical review tasks; use perspective frames for open-ended research.

## Source

Derived from Engineering Squad lens injection table (`squads/engineering-squad.md` lines 213-230) and Review Squad mission data.
