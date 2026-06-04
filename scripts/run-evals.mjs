import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${name}`);
    return;
  }
  failures.push(`${name}${detail ? `: ${detail}` : ""}`);
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

const requiredTools = [
  "create_research_plan",
  "create_option_board",
  "create_feasibility_checklist",
  "create_risk_register",
  "create_decision_matrix",
  "create_communication_outline"
];

const capabilities = json("packages/shared/capabilities.json");
const squadConfig = json("packages/shared/squad-config.json");
const server = read("apps/api/src/server.mjs");

check("capabilities json has tools", requiredTools.every((id) => capabilities.tools.some((tool) => tool.id === id)));
check("squad config references new tools", requiredTools.some((id) => JSON.stringify(squadConfig).includes(id)));
check("server implements artifact tools", requiredTools.every((id) => server.includes(`toolId === "${id}"`) || server.includes(`toolId: "${id}"`)));
check("server supports skill pack directories", server.includes("manifest.json") && server.includes("SKILL.md"));
check("server has project-material retrieval", server.includes("retrieveProjectMaterials") && server.includes("chunkProjectMaterials"));
check(
  "frontend renders dashboard run trace",
  read("apps/web/app.js").includes("renderTrace")
    && read("apps/web/index.html").includes("dashboardView")
    && read("apps/web/index.html").includes("Run trace")
);
check("frontend has settings page", read("apps/web/index.html").includes("settingsView") && read("apps/web/index.html").includes("apiBaseInput"));
check("frontend has language switch", read("apps/web/app.js").includes("LANGUAGE_KEY") && read("apps/web/index.html").includes("languageButton"));
check("frontend renders structured artifacts", read("apps/web/app.js").includes('result.kind === "artifact"'));

const skillPackDir = join(root, "skills", "captain", "meeting-qa");
check("meeting-qa skill pack manifest exists", existsSync(join(skillPackDir, "manifest.json")));
check("meeting-qa skill pack SKILL exists", existsSync(join(skillPackDir, "SKILL.md")));
check("meeting-qa skill pack smoke test exists", existsSync(join(skillPackDir, "smoke-test.md")));

for (const owner of readdirSync(join(root, "skills"))) {
  const ownerDir = join(root, "skills", owner);
  if (!statSync(ownerDir).isDirectory()) continue;
  for (const entry of readdirSync(ownerDir)) {
    const fullPath = join(ownerDir, entry);
    if (statSync(fullPath).isDirectory()) {
      check(`skill pack ${owner}/${entry} has manifest`, existsSync(join(fullPath, "manifest.json")));
      check(`skill pack ${owner}/${entry} has SKILL`, existsSync(join(fullPath, "SKILL.md")));
      continue;
    }
    if (entry.endsWith(".md")) {
      const content = readFileSync(fullPath, "utf8");
      check(`skill ${owner}/${entry} has method`, /##\s+Method/i.test(content));
    }
  }
}

await checkLiveApi();

if (failures.length) {
  console.error(`\n${failures.length} eval check(s) failed.`);
  process.exit(1);
}

console.log("\nAll eval checks passed.");

async function checkLiveApi() {
  try {
    const health = await fetch("http://localhost:8787/api/health");
    if (!health.ok) throw new Error(`health ${health.status}`);
  } catch {
    console.log("SKIP live API tool smoke test (API is not running).");
    return;
  }

  const response = await fetch("http://localhost:8787/api/tools/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      toolId: "create_risk_register",
      agentId: "critic",
      payload: {
        stage: "Challenge",
        brief: {
          risks: ["The target user may not need this workflow."],
          questions: ["What evidence proves repeated use?"]
        }
      }
    })
  });
  const body = await response.json();
  check("live API artifact tool returns structured result", body.result?.kind === "artifact" && Array.isArray(body.result?.data?.tables));
}
