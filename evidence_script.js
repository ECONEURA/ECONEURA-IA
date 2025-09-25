import fs from "fs";
import path from "path";

const danger = /\b(az\s|azd\s|bicep\b|terraform\s+(apply|plan)|kubectl\b|helm\b|docker\s+(build|push)|azure\s+(webapp|functions|containerapp)|gh\s+workflow\s+run)\b/i;
const secrets = /\b(GW_KEY|LA_KEY|NEURA_GW_KEY|SharedKey\s+[A-Za-z0-9+/=]+|VITE_.*KEY)\b/;

const files = [];
function walk(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('reports') && !fullPath.includes('.git')) {
          walk(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.sh') || fullPath.endsWith('.yml') || fullPath.endsWith('.yaml') || fullPath.endsWith('.json') || fullPath.endsWith('.md'))) {
          files.push(fullPath);
        }
      } catch (e) {}
    }
  } catch (e) {}
}
walk('.');

const hits = [], leaks = [];
for (const f of files) {
  try {
    const ls = fs.readFileSync(f, "utf8").split(/\r?\n/);
    ls.forEach((ln, i) => {
      if (danger.test(ln)) hits.push({ f, i: i + 1, ln: ln.trim() });
      if (secrets.test(ln)) leaks.push({ f, i: i + 1, ln: ln.trim() });
    });
  } catch (e) {}
}

let md = "# NO_DEPLOY_EVIDENCE (F0R)\n\n## Peligros\n";
md += hits.slice(0, 300).map(h => `- ${h.f}:${h.i} \`${h.ln}\``).join("\n") + "\n\n## Sospechas de secreto en cliente\n";
md += leaks.slice(0, 200).map(h => `- ${h.f}:${h.i} \`${h.ln}\``).join("\n") + "\n";
fs.writeFileSync("docs/audit/NO_DEPLOY_EVIDENCE.md", md);

if (leaks.length) {
  console.error("LEAKS_FOUND=" + leaks.length);
}