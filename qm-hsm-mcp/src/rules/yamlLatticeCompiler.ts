import YAML from "yaml";

export class MonotonicityViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonotonicityViolationError";
  }
}

/** E3 (AMEND-09.3): default per-field staleness bounds (seconds). */
export const DEFAULT_TELEMETRY_MAX_AGE_SECONDS: Record<string, number> = {
  cleanWorktree: 300,
  ciGreen: 300,
  testCoveragePct: 3600,
  openBlockersCount: 3600,
};

/** E5 (AMEND-09.5): default ask TTL before an unanswered ask hardens to "no". */
export const DEFAULT_ASK_TTL_SECONDS = 900;

export interface YamlRuleTierDescriptor {
  schema_version: string;
  tier: "GLOBAL" | "LEVEL" | "ITEM";
  target_id: string;
  extends?: string;
  state_capabilities?: Record<
    string,
    {
      allowed_intents: Record<string, string[]>;
    }
  >;
  guards: {
    min_test_coverage_pct?: number;
    min_pr_approvals?: number;
    max_open_blockers?: number;
    max_token_burn?: number;
    required_predicates?: string[];
    telemetry_max_age_seconds?: Record<string, number>; // E3: per-field staleness bound
    ask_ttl_seconds?: number;                          // E5: ask hardening TTL
  };
}

export interface CompiledEffectiveRuleset {
  min_test_coverage_pct: number;
  min_pr_approvals: number;
  max_open_blockers: number;
  max_token_burn: number;
  required_predicates: Set<string>;
  state_capabilities: Record<string, Record<string, string[]>>;
  telemetry_max_age_seconds: Record<string, number>; // E3
  ask_ttl_seconds: number;                           // E5
}

/**
 * Compiles a hierarchy of YAML descriptors (e.g. [Global, Level, Item])
 * enforcing strict monotonic tightening at every step.
 */
export function compileMonotonicYamlChain(
  yamlStrings: string[]
): CompiledEffectiveRuleset {
  const tiers = yamlStrings.map((raw) => YAML.parse(raw) as YamlRuleTierDescriptor);
  if (tiers.length === 0) {
    throw new Error("At least one Global YAML descriptor is required");
  }

  const root = tiers[0];
  const effective: CompiledEffectiveRuleset = {
    min_test_coverage_pct: root.guards.min_test_coverage_pct ?? 0,
    min_pr_approvals: root.guards.min_pr_approvals ?? 0,
    max_open_blockers: root.guards.max_open_blockers ?? 0,
    max_token_burn: root.guards.max_token_burn ?? Number.MAX_SAFE_INTEGER,
    required_predicates: new Set(root.guards.required_predicates ?? []),
    state_capabilities: {},
    telemetry_max_age_seconds: {
      ...DEFAULT_TELEMETRY_MAX_AGE_SECONDS,
      ...(root.guards.telemetry_max_age_seconds ?? {}),
    },
    ask_ttl_seconds: root.guards.ask_ttl_seconds ?? DEFAULT_ASK_TTL_SECONDS,
  };

  // Seed root capabilities
  for (const [statePath, capObj] of Object.entries(root.state_capabilities ?? {})) {
    effective.state_capabilities[statePath] = { ...capObj.allowed_intents };
  }

  // Fold child tiers monotonically
  for (let i = 1; i < tiers.length; i++) {
    const child = tiers[i];
    const g = child.guards ?? {};

    // 1. Lower-bound minimums: child must be >= effective
    if (g.min_test_coverage_pct !== undefined) {
      if (g.min_test_coverage_pct < effective.min_test_coverage_pct) {
        throw new MonotonicityViolationError(
          `[${child.tier}:${child.target_id}] Cannot relax min_test_coverage_pct from ${effective.min_test_coverage_pct}% down to ${g.min_test_coverage_pct}%`
        );
      }
      effective.min_test_coverage_pct = Math.max(
        effective.min_test_coverage_pct,
        g.min_test_coverage_pct
      );
    }

    if (g.min_pr_approvals !== undefined) {
      if (g.min_pr_approvals < effective.min_pr_approvals) {
        throw new MonotonicityViolationError(
          `[${child.tier}:${child.target_id}] Cannot relax min_pr_approvals from ${effective.min_pr_approvals} down to ${g.min_pr_approvals}`
        );
      }
      effective.min_pr_approvals = Math.max(effective.min_pr_approvals, g.min_pr_approvals);
    }

    // 2. Upper-bound ceilings: child must be <= effective
    if (g.max_open_blockers !== undefined) {
      if (g.max_open_blockers > effective.max_open_blockers) {
        throw new MonotonicityViolationError(
          `[${child.tier}:${child.target_id}] Cannot relax max_open_blockers ceiling from ${effective.max_open_blockers} up to ${g.max_open_blockers}`
        );
      }
      effective.max_open_blockers = Math.min(effective.max_open_blockers, g.max_open_blockers);
    }

    if (g.max_token_burn !== undefined) {
      if (g.max_token_burn > effective.max_token_burn) {
        throw new MonotonicityViolationError(
          `[${child.tier}:${child.target_id}] Cannot relax max_token_burn ceiling from ${effective.max_token_burn} up to ${g.max_token_burn}`
        );
      }
      effective.max_token_burn = Math.min(effective.max_token_burn, g.max_token_burn);
    }

    // 2b. E3: staleness bounds tighten only (lower max age = stricter)
    if (g.telemetry_max_age_seconds) {
      for (const [field, maxAge] of Object.entries(g.telemetry_max_age_seconds)) {
        const current = effective.telemetry_max_age_seconds[field] ?? Number.MAX_SAFE_INTEGER;
        if (maxAge > current) {
          throw new MonotonicityViolationError(
            `[${child.tier}:${child.target_id}] Cannot relax telemetry_max_age_seconds['${field}'] from ${current}s up to ${maxAge}s`
          );
        }
        effective.telemetry_max_age_seconds[field] = Math.min(current, maxAge);
      }
    }

    // 2c. E5: ask TTL tightens only (shorter TTL = ask hardens sooner = stricter)
    if (g.ask_ttl_seconds !== undefined) {
      if (g.ask_ttl_seconds > effective.ask_ttl_seconds) {
        throw new MonotonicityViolationError(
          `[${child.tier}:${child.target_id}] Cannot relax ask_ttl_seconds from ${effective.ask_ttl_seconds}s up to ${g.ask_ttl_seconds}s`
        );
      }
      effective.ask_ttl_seconds = Math.min(effective.ask_ttl_seconds, g.ask_ttl_seconds);
    }

    // 3. Required predicates: union only (child cannot drop parent required predicates)
    if (g.required_predicates) {
      const childSet = new Set(g.required_predicates);
      for (const req of effective.required_predicates) {
        if (!childSet.has(req)) {
          throw new MonotonicityViolationError(
            `[${child.tier}:${child.target_id}] Cannot remove inherited required predicate '${req}'`
          );
        }
      }
      for (const p of childSet) {
        effective.required_predicates.add(p);
      }
    }

    // 4. Role capabilities: child may only narrow (subset) parent roles for a given state & intent;
    //    introducing a (state, intent) the parent never defined is a violation (AMEND-08.3)
    for (const [statePath, capObj] of Object.entries(child.state_capabilities ?? {})) {
      effective.state_capabilities[statePath] = effective.state_capabilities[statePath] ?? {};
      for (const [intent, childRoles] of Object.entries(capObj.allowed_intents)) {
        const parentRoles = effective.state_capabilities[statePath][intent];
        if (!parentRoles) {
          throw new MonotonicityViolationError(
            `[${child.tier}:${child.target_id}] Introduces state_capabilities['${statePath}']['${intent}'] not defined in any parent tier`
          );
        }
        for (const r of childRoles) {
          if (!parentRoles.includes(r)) {
            throw new MonotonicityViolationError(
              `[${child.tier}:${child.target_id}] Cannot grant role '${r}' on (${statePath}, ${intent}) not present in parent whitelist [${parentRoles.join(", ")}]`
            );
          }
        }
        effective.state_capabilities[statePath][intent] = parentRoles.filter((r) =>
          childRoles.includes(r)
        );
      }
    }
  }

  return effective;
}
