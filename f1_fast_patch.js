const fs=require("fs"),glob=require("glob");










const files=glob.sync("**/*.{ts,tsx,js,jsx}",{ignore:["node_modules/**",".git/**","dist/**","build/**",".next/**","out/**","coverage/**","reports/**"]});
const S={patched:0,env_refs_removed:0,auth_fixed:0,log_noop:0,a11y:0,count_dyn:0,login_wired:0,type_ren:0};
for(const f of files){
  let s=fs.readFileSync(f,"utf8"),o=s;

  // Purga secretos en cliente
  s=s.replace(/^\s*GW_KEY:\s*readVar\([^)]*\),?\s*$/m,()=>{S.env_refs_removed++;return""})
     .replace(/^\s*LA_KEY:\s*readVar\([^)]*\),?\s*$/m,()=>{S.env_refs_removed++;return""})
     .replace(/\b(import\.meta\.env\.(VITE_NEURA_GW_KEY|VITE_LA_SHARED_KEY)|process\.env\.(NEURA_GW_KEY|LA_SHARED_KEY))\b/g,()=>{S.env_refs_removed++;return "undefined"});

  // invokeAgent → bearer global, nunca GW_KEY
  s=s.replace(/if\s*\(\s*!env\.GW_URL\s*\|\|\s*!env\.GW_KEY\s*\)/, "if (!env.GW_URL || !(globalThis as any).__ECONEURA_BEARER)")
     .replace(/['"]Authorization['"]\s*:\s*`Bearer\s*\$\{env\.GW_KEY\}`/g,()=>{S.auth_fixed++;return "Authorization: `Bearer ${(globalThis as any).__ECONEURA_BEARER || \"SIMULATED\"}`";});

  // Telemetría en cliente → NOOP
  s=s.replace(/async\s+function\s+logActivity\([^)]*\)\s*\{[\s\S]*?\n\}/m,
              ()=>{S.log_noop++;return "async function logActivity(){ return; }
// Escaneo fugas
const leakRE=/\b(GW_KEY|LA_KEY|NEURA_GW_KEY|VITE_[A-Z0-9_]*KEY|SharedKey\s+[A-Za-z0-9+/=]+)\b/;
const leaks=files.filter(f=>leakRE.test(fs.readFileSync(f,"utf8")));
fs.mkdirSync("reports",{recursive:true}); fs.mkdirSync("docs/audit",{recursive:true});
const summary={phase:"F1-fast", ok:leaks.length===0, secret_leaks:leaks.length, ...S};
fs.writeFileSync("reports/summary.json", JSON.stringify(summary,null,2));
fs.writeFileSync("docs/audit/ASKS.md",
`# ASKS F1
Front: VITE_AZURE_AD_TENANT_ID, VITE_AZURE_AD_CLIENT_ID, VITE_AZURE_AD_REDIRECT_URI, VITE_NEURA_GW_URL
Server: NEURA_GW_URL, LA_WORKSPACE_ID, LA_SHARED_KEY (solo server). Validación: evento "auth:login", bearer __ECONEURA_BEARER.`);
if(leaks.length){ fs.writeFileSync("docs/audit/GAP.md","# GAP F1\\n- Fugas:\\n"+leaks.map(x=>"- "+x).join("\\n")); }
console.log(JSON.stringify(summary,null,2));