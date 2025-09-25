import fs from "fs";
import path from "path";

const workflowDir = ".github/workflows";
const wfs = fs.readdirSync(workflowDir)
  .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
  .map(f => path.join(workflowDir, f));

for (const f of wfs) {
  let s = fs.readFileSync(f, "utf8");
  if (!/DEPLOY_ENABLED\s*:\s*["']?false["']?/i.test(s)) s = `env:\n  DEPLOY_ENABLED: "false"\n` + s;
  if (!/^concurrency\s*:/m.test(s)) s += `\nconcurrency: hardening-global\n`;
  // mata pasos con az/azd/terraform/kubectl/helm/docker push
  s = s.replace(/^\s*-+\s*run:\s*(.*\b(az|azd|terraform|kubectl|helm|docker\s+push)\b.*)$/gmi, m => m.replace(/run:/, 'run: echo "[NO_DEPLOY] blocked" #'));
  fs.writeFileSync(f, s);
}