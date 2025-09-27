import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
const t0=Date.now(),env=process.env;
const MAX_FILES=+env.MAX_FILES||90000,MAX_DEPTH=+env.MAX_DEPTH||6,MAX_READ=+env.MAX_READ||800000,STRICT=env.STRICT_NO_DEPLOY==='1';
const IGN=/(^|\/)(node_modules|\.git|\.next|dist|build|coverage|\.cache|out|tmp|venv|\.ignored_node_modules)(\/|$)/;
const EXTS=new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.md','.yml','.yaml','.css','.scss','.html']);
const CODE=new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs']);
const ENDPT=/\/(health|healthz|readyz)\b|\/v1\/progress\b/i;
const TEST=/\.(test|spec)\.(ts|tsx|js|jsx)$/i;
const SECRET=[/\bsk-[A-Za-z0-9]{20,}\b/,/\bAKIA[0-9A-Z]{16}\b/,/\bAIza[0-9A-Za-z\-_]{30,}\b/,/\b(password|passwd|secret|api[_-]?key|token|private[_-]?key|connection[_-]?string)\b\s*[:=]\s*['"]?[^'"\n]{6,}/i];
const ENVN=/process\.env\.([A-Z0-9_]+)/g,ENVV=/import\.meta\.env\.([A-Z0-9_]+)/g,ENVW=/window\.__([A-Z0-9_]+)/g;
const READ=f=>{try{return fs.readFileSync(f,'utf8')}catch{return''}},J=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return null}};
const N=s=>s.replace(/\\/g,'/'); const SAFE=s=>String(s||'').replace(/:\/\/[^@/]+@/,'://***@');
const pkg=J('package.json')||{};
let workspaces=[];(function(){const ws=Array.isArray(pkg.workspaces)?pkg.workspaces:(pkg.workspaces?.packages||[]);
function exp(p){if(!/\*/.test(p))return[p];const b=p.replace(/\/\*.*/,'');try{return fs.readdirSync(b).map(d=>`${b}/${d}`)}catch{return[]}}
workspaces=[...new Set(ws.flatMap(exp))]; if(!workspaces.length&&fs.existsSync('pnpm-workspace.yaml')){const y=READ('pnpm-workspace.yaml');const m=[...(y.matchAll(/-\s*([^\n#]+)/g))].map(x=>x[1].trim());workspaces=[...new Set(m.flatMap(exp))];}})();
function inv(d){try{return fs.readdirSync(d).filter(x=>fs.statSync(path.join(d,x)).isDirectory()).map(x=>({dir:N(`${d}/${x}`),name:(J(path.join(d,x,'package.json'))||{}).name||null}))}catch{return[]}}
const git=a=>{try{const r=spawnSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','ignore']});return r.status===0?r.stdout.trim():null}catch{return null}};
const gitInfo={remote:SAFE(git(['config','--get','remote.origin.url'])),branch:git(['rev-parse','--abbrev-ref','HEAD']),commit:git(['rev-parse','--short','HEAD'])};
let files=0,bytes=0;const byExt={},byDir={},largest=[];const envVars={node:new Set(),vite:new Set(),win:new Set(),dotenv:new Set(),clientRisk:new Set()};const endpoints=[];const tests=[];const secretFiles=new Set();
function bump(p,s){largest.push({path:N(p),size:s});largest.sort((a,b)=>b.size-a.size);if(largest.length>80)largest.length=80}
function scanFile(f){const st=fs.statSync(f),sz=st.size;files++;bytes+=sz;const n=N(f),top=n.split('/')[0];byDir[top]=(byDir[top]||0)+1;const ext=EXTS.has(path.extname(f))?path.extname(f):'other';byExt[ext]=(byExt[ext]||0)+1;bump(f,sz);if(sz>MAX_READ)return;const t=READ(f);
let m;while((m=ENVN.exec(t)))envVars.node.add(m[1]);while((m=ENVV.exec(t)))envVars.vite.add(m[1]);while((m=ENVW.exec(t)))envVars.win.add(m[1]);
if(ENDPT.test(t)&&CODE.has(ext))endpoints.push(n); if(TEST.test(f))tests.push(n);
if(SECRET.some(r=>r.test(t)))secretFiles.add(n)}
function walk(root,depth=MAX_DEPTH){const stk=[[root,0]];while(stk.length){const[cur,d]=stk.pop();for(const ent of fs.readdirSync(cur,{withFileTypes:true})){const p=path.join(cur,ent.name);const n=N(p);if(IGN.test(n))continue;if(ent.isDirectory()){if(d<depth)stk.push([p,d+1]);}else{scanFile(p);}if(files>=MAX_FILES)return}}}
walk('.');
const envFiles=(f=>{try{return fs.readdirSync('.').filter(x=>/^\.env(\..*)?$/.test(x))}catch{return[]}})();
envFiles.forEach(e=>READ(e).split('\n').forEach(l=>{const m=l.match(/^\s*([A-Z0-9_]+)\s*=/);if(m)envVars.dotenv.add(m[1]);if(/CLIENT|VITE|KEY|TOKEN|SECRET|PASSWORD/.test(l)&&!/^\s*#/.test(l))envVars.clientRisk.add(m?.[1]||'__INLINE__')}));
const wfDir='.github/workflows',DANG=/\b(az|azd|terraform|kubectl|helm|docker\s+(build|push))\b/i,ND=/DEPLOY_ENABLED\s*:\s*['"]?false['"]?/i;
let wfs=[],flags=[],danger=[],strictViol=[]; if(fs.existsSync(wfDir)){wfs=fs.readdirSync(wfDir).filter(f=>/\.(ya?ml)$/i.test(f)).map(f=>N(path.join(wfDir,f)));
for(const f of wfs){const t=READ(f); if(ND.test(t))flags.push(f); if(DANG.test(t))danger.push(f);
if(STRICT){ // naive: si hay "run:" y no hay ND flag global, marca violación
  const hasRun=/^\s*run\s*:/m.test(t); const hasEnv=/DEPLOY_ENABLED\s*:\s*['"]?false/m.test(t);
  if(hasRun&&!hasEnv) strictViol.push(f);
}}}
let coverage=null,covFile=null;(function find(d){try{for(const ent of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,ent.name);const n=N(p);if(IGN.test(n))continue;if(ent.isDirectory())find(p);else if(n.endsWith('coverage-summary.json')){covFile=n;}}}catch{} })();
if(covFile){try{const j=J(covFile);coverage=j?.total?.lines?.pct??null}catch{}}
const sum={
  meta:{repo:path.basename(process.cwd()),git:gitInfo,node:(spawnSync('node',['-v'],{encoding:'utf8'}).stdout||'').trim()||null,packageManager:pkg.packageManager||null,engines:pkg.engines||null,private:!!pkg.private,duration_ms:Date.now()-t0},
  inventory:{workspaces,apps:inv('apps'),packages:inv('packages'),functions:inv('functions')},
  detectors:{hasTS:!!(fs.existsSync('tsconfig.json')||pkg.devDependencies?.typescript),hasESLint:!!(fs.existsSync('eslint.config.js')||fs.existsSync('eslint.config.mjs')||fs.existsSync('.eslintrc.json')||pkg.eslintConfig),hasNext:!!(fs.existsSync('next.config.js')||fs.existsSync('next.config.mjs')||pkg.dependencies?.next),hasVite:!!(fs.existsSync('vite.config.ts')||pkg.devDependencies?.vite),hasTailwind:!!(fs.existsSync('tailwind.config.ts')||pkg.devDependencies?.tailwindcss),hasDocker:!!(fs.existsSync('Dockerfile')||fs.existsSync('docker-compose.yml')||fs.existsSync('compose.yaml')),hasLicenseFile:fs.existsSync('LICENSE')||fs.existsSync('LICENSE.md')},
  test_coverage:{testsCount:tests.length,coverageLinesPct:coverage,coverageFile:covFile},
  workflows:{count:wfs.length,no_deploy_flag_files:flags,dangerous_files:danger,strict_violations:strictViol},
  envVars:{process:[...envVars.node].sort(),vite:[...envVars.vite].sort(),window:[...envVars.win].sort(),dotenv:[...envVars.dotenv].sort(),client_secret_risk:[...envVars.clientRisk].sort()},
  secrets:{filesCount:secretFiles.size,sampleFiles:[...secretFiles].slice(0,50)},
  metrics:{files,totalBytes:bytes,byExt:Object.fromEntries(Object.entries(byExt).sort((a,b)=>b[1]-a[1])),byDir:Object.fromEntries(Object.entries(byDir).sort((a,b)=>b[1]-a[1]))},
  topLargest:largest
};
const risks=[]; if(!sum.meta.packageManager)risks.push('packageManager ausente'); if(!sum.meta.engines)risks.push('engines ausente'); if(!sum.detectors.hasESLint)risks.push('ESLint no detectado'); if(!sum.detectors.hasTS)risks.push('TypeScript no detectado'); if(!sum.test_coverage.testsCount)risks.push('Sin tests detectados'); if(sum.envVars.client_secret_risk.length)risks.push('Posibles secretos en cliente/.env'); if(sum.workflows.dangerous_files.length)risks.push('Workflows con comandos de despliegue'); if(STRICT&&sum.workflows.strict_violations.length)risks.push('Jobs run: sin DEPLOY_ENABLED:false');
const NO_DEPLOY_OK= sum.workflows.dangerous_files.length===0 && sum.workflows.no_deploy_flag_files.length>0 && (!STRICT || sum.workflows.strict_violations.length===0);
sum.verdict={GO_NO_GO:true,NO_DEPLOY_OK,risksCount:risks.length,risks};
fs.writeFileSync('reports/FULL_AUDIT_PRO.json',JSON.stringify(sum,null,2));
const csv=(rows)=>rows.map(r=>r.map(x=>String(x).replace(/"/g,'""')).map(x=>`"${x}"`).join(',')).join('\n');
fs.writeFileSync('reports/WF_EVIDENCE.csv',csv([['file','has_flag','dangerous','strict_violation'],...new Set([...wfs,...flags,...danger]).values()].map(f=>[f,flags.includes(f),danger.includes(f),sum.workflows.strict_violations.includes(f)]))); 
fs.writeFileSync('reports/ENV_VARS.csv',csv([['scope','var'],...sum.envVars.process.map(v=>['process.env',v]),...sum.envVars.vite.map(v=>['import.meta.env',v]),...sum.envVars.window.map(v=>['window.__',v]),...sum.envVars.dotenv.map(v=>['dotenv',v]),...sum.envVars.client_secret_risk.map(v=>['client_secret_risk',v])]));
fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md',['# NO_DEPLOY_EVIDENCE',`flags(${flags.length}):`,...flags,'',`dangerous(${danger.length}):`,...danger,STRICT?`\nstrict_violations(${sum.workflows.strict_violations.length}):\n${sum.workflows.strict_violations.join('\n')}`:''].join('\n'));
const md=[
  `# FULL AUDIT PRO — ${sum.meta.repo}`,
  `Workspaces:${sum.inventory.workspaces.length} apps:${sum.inventory.apps.length} packages:${sum.inventory.packages.length} functions:${sum.inventory.functions.length}`,
  `Files:${sum.metrics.files} Bytes:${sum.metrics.totalBytes} Duration(ms):${sum.meta.duration_ms}`,
  `Workflows:${sum.workflows.count} flags:${flags.length} dangerous:${danger.length} STRICT:${STRICT} NO_DEPLOY_OK:${NO_DEPLOY_OK}`,
  `Tests:${sum.test_coverage.testsCount} Coverage(lines%):${sum.test_coverage.coverageLinesPct??'n/a'}`,
  `Risks(${risks.length}): ${risks.join(' | ')||'none'}`
].join('\n');
fs.writeFileSync('reports/FULL_AUDIT_PRO.md',md);
console.log(md);