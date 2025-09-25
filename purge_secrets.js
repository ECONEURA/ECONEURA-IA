import fs from "fs";
import path from "path";

const files = [];
function walk(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('dist') && !fullPath.includes('build')) {
          walk(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js'))) {
          files.push(fullPath);
        }
      } catch (e) {
        // ignore errors
      }
    }
  } catch (e) {
    // ignore errors
  }
}
walk('.');

let changes = 0, patched = 0;
for (const f of files) {
  try {
    let s = fs.readFileSync(f, "utf8");
    const o = s;
    // eliminar lectura de GW_KEY/LA_KEY del objeto env
    s = s.replace(/(\bGW_KEY\s*:\s*readVar\([^\)]*\)\s*,?)/g, "");
    s = s.replace(/(\bLA_KEY\s*:\s*readVar\([^\)]*\)\s*,?)/g, "");
    // header Authorization con env.GW_KEY -> SIM o Bearer global
    s = s.replace(/Authorization['"]?:\s*`Bearer\s*\$\{[^}]*GW_KEY[^}]*\}`/g, 'Authorization: `Bearer ${ (window as any).__ECONEURA_BEARER || "SIMULATED" }`');
    // logActivity -> NOOP en UI
    s = s.replace(/async function logActivity\([^)]*\)\s*\{[\s\S]*?\n\}/m, "async function logActivity(){ /* NOOP: UI sin claves */ }
fs.writeFileSync("docs/audit/CLIENT_SECRET_PURGE.md", `Patched ${patched}/${changes} archivos. Headers y env saneados.`);
console.log('CLIENT_SECRET_PURGE: OK -', patched, 'archivos patched');