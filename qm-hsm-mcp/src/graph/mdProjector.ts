export interface GraphPlanProjectionInput {
  planId: string;
  title: string;
  headEventHash: string;
  generatedAtIso: string;
  levels: Array<{
    id: string;
    index: number;
    title: string;
    horizonMode: "COMPLETED" | "ACTIVE" | "ROLLING_LOOKAHEAD" | "FUZZY_LOCKED";
    gate: {
      id: string;
      hsmStatePath: string;
      withinTolerance: boolean;
    };
    items: Array<{
      id: string;
      title: string;
      hsmStatePath: string;
      testCoveragePct: number;
      openBlockersCount: number;
      assignedSessions: Array<{ handle: string; role: string }>;
      tasks: Array<{ id: string; title: string; kanbanState: string }>;
    }>;
  }>;
}

/**
 * Generates a deterministic, read-only Markdown projection of the Neo4j Plan graph.
 * Enforces Invariant I-MD-PROJECTION.
 */
export function renderVirtualMarkdownProjection(
  data: GraphPlanProjectionInput
): string {
  const lines: string[] = [
    "---",
    `plan_id: "${data.planId}"`,
    `projection_mode: "READ_ONLY_NEO4J_SNAPSHOT"`,
    `head_lineage_sha256: "${data.headEventHash}"`,
    `generated_at: "${data.generatedAtIso}"`,
    `warning: "DO NOT EDIT MANUALLY - MUTATE VIA MCP VERBS (hsm.dispatch / plan.decompose_wave)"`,
    "---",
    "",
    `# ${data.title} (\`${data.planId}\`)`,
    "",
    `> **Conserved Lineage Head:** \`${data.headEventHash.slice(0, 16)}...\` | **Generated:** \`${data.generatedAtIso}\``,
    "",
  ];

  for (const lvl of data.levels) {
    lines.push(
      `## Level ${lvl.index}: ${lvl.title} (\`${lvl.id}\` \u2014 Horizon: \`${lvl.horizonMode}\`)`
    );
    lines.push(
      `**Stage Gate \`${lvl.gate.id}\` State:** \`${lvl.gate.hsmStatePath}\` | **Within PRINCE2 Tolerance:** \`${lvl.gate.withinTolerance ? "YES" : "NO (ESCALATED)"}\``
    );
    lines.push("");

    if (lvl.horizonMode === "FUZZY_LOCKED") {
      lines.push(
        `_Fuzzy Horizon Stage: Decomposition locked until upstream Stage Gate signs off._`
      );
      lines.push("");
      continue;
    }

    for (const item of lvl.items) {
      const isDone = item.hsmStatePath === "/top/VerifiedDone";
      const checkbox = isDone ? "[x]" : "[ ]";
      const sessionsBadge = item.assignedSessions
        .map((s) => `${s.handle}[${s.role}]`)
        .join(", ");

      lines.push(
        `- ${checkbox} **\`${item.id}\`: ${item.title}**`
      );
      lines.push(
        `  - **QM HSM State:** \`${item.hsmStatePath}\` | **Coverage:** \`${item.testCoveragePct}%\` | **Blockers:** \`${item.openBlockersCount}\``
      );
      lines.push(`  - **Multiplexed Sessions:** ${sessionsBadge || "_Unassigned_"}`);

      if (item.tasks.length > 0) {
        lines.push(`  - **Decomposed Kanban Tasks:**`);
        for (const t of item.tasks) {
          const tBox = t.kanbanState === "DONE" ? "[x]" : "[ ]";
          lines.push(
            `    - ${tBox} \`${t.id}\` [${t.kanbanState}]: ${t.title}`
          );
        }
      } else {
        lines.push(`  - _Wave not yet decomposed into Kanban tasks (` + "`SIG_DECOMPOSE`" + ` pending)._`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
