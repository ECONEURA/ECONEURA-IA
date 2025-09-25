import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

const SRC=()=>glob.sync("**/*.{ts,tsx,js,jsx}",{ignore:["node_modules/**",".git/**","dist/**","build/**",".next/**","out/**","coverage/**","reports/**"]});

let stats={files_scanned:0, patched_files:0, env_purged:0, auth_rewrites:0, log_noop:0, a11y_inputs:0, agents_count_fixed:0, login_wired:0, type_renamed:0};
for(const f of SRC()){
  stats.files_scanned++;
  let s=fs.readFileSync(f,"utf8"), o=s;

  // 1) Purga GW_KEY/LA_KEY en cliente
  s=s.replace(/\bGW_KEY\s*:\s*readVar\([^)]*\),?\s*\n/g,()=>{stats.env_purged++;return""})
     .replace(/\bLA_KEY\s*:\s*readVar\([^)]*\),?\s*\n/g,()=>{stats.env_purged++;return""})
     .replace(/process\.env\.(NEURA_GW_KEY|LA_SHARED_KEY)\b/g,()=>{stats.env_purged++;return"undefined";})
     .replace(/import\.meta\.env\.(VITE_NEURA_GW_KEY|VITE_LA_SHARED_KEY)\b/g,()=>{stats.env_purged++;return"undefined";});

  // 2) Authorization: usar bearer MSAL o SIMULATED (sin claves)
  s=s.replace(/Authorization["']?\s*:\s*`Bearer\s*\$\{[^}]*GW_KEY[^}]*\}`/g,
              ()=>{stats.auth_rewrites++;return "Authorization: `Bearer ${(globalThis as any).__ECONEURA_BEARER || \"SIMULATED\"}`";});

  // 3) Telemetría Log Analytics en cliente -> NOOP
  s=s.replace(/async\s+function\s+logActivity\([^)]*\)\s*\{[\s\S]*?\n\}/m,
              ()=>{stats.log_noop++;return "async function logActivity(){ /* NOOP client; server-side only */ }

// Evidencias
fs.mkdirSync("docs/audit",{recursive:true});
fs.mkdirSync("reports",{recursive:true});
const summary={phase:"F0-final-hotfix", ...stats, secret_leaks:leaks.length, ok: leaks.length===0};
fs.writeFileSync("reports/summary.json", JSON.stringify(summary,null,2));
fs.writeFileSync("docs/audit/CLIENT_SECRET_PURGE.md",
`# CLIENT_SECRET_PURGE
- env_purged: ${stats.env_purged}
- auth_rewrites: ${stats.auth_rewrites}
- log_noop: ${stats.log_noop}
- secret_leaks: ${leaks.length}
${leaks.length? "\n## RESTANTES\n"+leaks.map(x=>"- "+x).join("\n") : "\n## OK\nSin coincidencias de claves en cliente."}
`);
console.log(JSON.stringify(summary,null,2));