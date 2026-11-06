// Regenerates simulator/index.html from index.template.html by inlining the
// verbatim model/rule assets. Run: npm run sim
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const tpl = fs.readFileSync(path.join(dir, "index.template.html"), "utf-8");
const planItem = fs.readFileSync(path.join(dir, "../models/plan_item.qm"), "utf-8");
const stageGate = fs.readFileSync(path.join(dir, "../models/stage_gate.qm"), "utf-8");
const yamlBundle = fs.readFileSync(path.join(dir, "../rules/MONOTONIC_YAML_RULES_BUNDLE.yaml"), "utf-8");

for (const content of [planItem, stageGate, yamlBundle]) {
  if (content.includes("</script>")) throw new Error("asset contains </script>, refusing to inline");
}

const out = tpl
  .replace("__PLAN_ITEM_QM__", () => JSON.stringify(planItem))
  .replace("__STAGE_GATE_QM__", () => JSON.stringify(stageGate))
  .replace("__YAML_BUNDLE__", () => JSON.stringify(yamlBundle));

if (out.includes("__PLAN_ITEM_QM__") || out.includes("__STAGE_GATE_QM__") || out.includes("__YAML_BUNDLE__")) {
  throw new Error("unreplaced asset token remains");
}

fs.writeFileSync(path.join(dir, "index.html"), out);
console.log(`wrote simulator/index.html (${out.length} bytes)`);
