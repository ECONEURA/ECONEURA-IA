const fs=require("fs"),glob=require("glob");
const files=glob.sync("**/*.{ts,tsx,js,jsx}",{ignore:["node_modules/**",".git/**","dist/**","build/**",".next/**","out/**","coverage/**","reports/**"]});
let stats={patched:0,purge_env:0,auth_fix:0,log_noop:0,aria:0,count_fix:0,login:0,type_ren:0};
for(const f of files){
  let s=fs.readFileSync(f,"utf8"),o=s;

  // Purga referencias de claves en cliente
  s=s.replace(/\bGW_KEY\s*:\s*readVar\([^)]*\),?\s*\n/g,()=>{stats.purge_env++;return""})
     .replace(/\bLA_KEY\s*:\s*readVar\([^)]*\),?\s*\n/g,()=>{stats.purge_env++;return""})
     .replace(/Authorization["']?\s*:\s*`Bearer\s*\$\{[^}]*GW_KEY[^}]*\}`/g,
              ()=>{stats.auth_fix++;return "Authorization: `Bearer ${(globalThis as any).__ECONEURA_BEARER || \"SIMULATED\"}`";});

  // Telemetría cliente -> NOOP
  s=s.replace(/async\s+function\s+logActivity\([^)]*\)\s*\{[\s\S]*?\n\}/m,
              ()=>{stats.log_noop++;return "async function logActivity(){ /* NOOP client; server-side only */ }";});

  // Accesibilidad y datos reales
  s=s.replace(/<input([^>]*?)placeholder="Buscar\.\.\."([^>]*?)\/>/g,
              (m,pre,post)=>{stats.aria++;return `<input${pre}aria-label="Buscar" placeholder="Buscar..."${post}/>`;})
   .replace(/>5 agentes<\/span>/g,()=>{stats.count_fix++;return ">{dept.agents.length} agentes</span>";})
   .replace(/className="([^"]*?)">INICIAR SESIÓN<\/button>/g,
            (m,cls)=>{stats.login++;return `className="${cls}" onClick={()=>window.dispatchEvent(new CustomEvent(\"auth:login\"))}>INICIAR SESIÓN</button>`;});

  // Evitar choque con icono Activity
  s=s.replace(/\btype\s+Activity\s*=/,()=>{stats.type_ren++;return "type ActivityEvent =";})
     .replace(/useState<Activity>\(\[\]\)/g,"useState<ActivityEvent>([])")
     .replace(/useState<Activity>\[\]/g,"useState<ActivityEvent>[]");

  if(s!==o){fs.writeFileSync(f,s);stats.patched++;}
}

// Post-scan de secretos en UI
const scan=files.map(f=>[f,fs.readFileSync(f,"utf8")]);
const leak=/\b(GW_KEY|LA_KEY|NEURA_GW_KEY|VITE_[A-Z0-9_]*KEY|SharedKey\s+[A-Za-z0-9+/=]+)\b/;
const leaks=scan.filter(([_,c])=>leak.test(c)).map(([f])=>f);

// Artefactos
fs.mkdirSync("reports",{recursive:true}); fs.mkdirSync("docs/audit",{recursive:true});
const summary={phase:"F1-opt",ok:leaks.length===0,secret_leaks:leaks.length,...stats};
fs.writeFileSync("reports/summary.json",JSON.stringify(summary,null,2));
fs.writeFileSync("docs/audit/ASKS.md",
`# ASKS · variables requeridas
- VITE_AZURE_AD_TENANT_ID
- VITE_AZURE_AD_CLIENT_ID
- VITE_AZURE_AD_REDIRECT_URI
- VITE_NEURA_GW_URL
- NEURA_GW_URL (server)
- LA_WORKSPACE_ID (server) · NO UI
- LA_SHARED_KEY (server) · NO UI
Validación: login MSAL, fetch /api/me con bearer, invoke gateway via proxy.`);
if(leaks.length) fs.writeFileSync("docs/audit/GAP.md", "# GAP F1\n- Secretos en cliente aún referenciados:\n"+leaks.map(x=>"- "+x).join("\n")+"\n");
console.log(JSON.stringify(summary,null,2));