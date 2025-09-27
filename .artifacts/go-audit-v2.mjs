import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
const env=process.env, t0=Date.now();
const MAX_FILES=+env.MAX_FILES||90000, MAX_DEPTH=+env.MAX_DEPTH||6, MAX_READ=+env.MAX_READ||800000;
const STRICT=env.STRICT_NO_DEPLOY==='1', DRY=env.DRY_RUN==='1';
const WANT={cov:80, dup:4};
const IGN=/(^|\/)(node_modules|\.git|\.next|dist|build|coverage|\.cache|out|tmp|venv|\.ignored_node_modules)(\/|$)/;
const EXTS=new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.json','.md','.yml','.yaml','.css','.scss','.html']);
const CODE=new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs']);
const TEST=/\.(test|spec)\.(ts|tsx|js|jsx)$/i, ENDPT=/\/(health|healthz|readyz)\b|\/v1\/progress\b/i;
const DANG=/\b(az|azd|terraform|kubectl|helm|docker\s+(build|push))\b/i, ND=/DEPLOY_ENABLED\s*:\s*['"]?false['"]?/i;

const R=(f)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return null}};
const T=(f)=>{try{return fs.readFileSync(f,'utf8')}catch{return''}};
const X=(p)=>{try{fs.accessSync(p);return true}catch{return false}};
const N=(p)=>p.replace(/\\/g,'/');
const SAFE=(s)=>String(s||'').replace(/:\/\/[^@/]+@/,'://***@');
const sh=(cmd,args=[],sec=90)=>spawnSync(cmd,args,{encoding:'utf8',timeout:sec*1000,stdio:['ignore','pipe','pipe']});

const pkg=R('package.json')||{};
const hasBin = (name)=>X(`node_modules/.bin/${name}`) || /(\b|\/)${name}\b/.test(JSON.stringify(pkg.scripts||{}));
const RUN={
  LINT: env.RUN_LINT ?? (hasBin('eslint')?'1':'0'),
  TESTS: env.RUN_TESTS ?? (hasBin('vitest')?'1':'0'),
  DUP: env.RUN_DUP ?? (hasBin('jscpd')?'1':'0'),
  LEAKS: env.RUN_LEAKS ?? (sh('gitleaks',['version'],5).status===0?'1':'0'),
  AUDIT: env.RUN_AUDIT ?? '1'
};

function expandWS(def){
  const arr = Array.isArray(def)?def:(def?.packages||[]);
  const exp = (p)=>/\*/.test(p)?(b=>X(b)?fs.readdirSync(b).map(d=>`${b}/${d}`):[])(p.replace(/\/\*.*/,'')):[p];
  return [...new Set(arr.flatMap(exp))];
}
let workspaces = expandWS(pkg.workspaces);
if (!workspaces.length && X('pnpm-workspace.yaml')) {
  const y=T('pnpm-workspace.yaml'); const m=[...(y.matchAll(/-\s*([^\n#]+)/g))].map(x=>x[1].trim());
  workspaces=[...new Set(m.flatMap(p=>/\*/.test(p)?(b=>X(b)?fs.readdirSync(b).map(d=>`${b}/${d}`):[])(p.replace(/\/\*.*/,'')):[p]))];
}

const inv=(d)=>X(d)?fs.readdirSync(d).filter(x=>fs.statSync(path.join(d,x)).isDirectory()).map(x=>({dir:N(`${d}/${x}`), name:(R(path.join(d,x,'package.json'))||{}).name||null})):[];
const git=(a)=>{try{const r=spawnSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','ignore']});return r.status===0?r.stdout.trim():null}catch{return null}};
const gitInfo={remote:SAFE(git(['config','--get','remote.origin.url'])),branch:git(['rev-parse','--abbrev-ref','HEAD']),commit:git(['rev-parse','--short','HEAD'])};

let files=0, bytes=0; const byExt={}, byDir={}, largest=[]; const tests=[], endpoints=[];
function bump(p,s){largest.push({path:N(p),size:s});largest.sort((a,b)=>b.size-a.size);if(largest.length>80)largest.length=80;}
function scanFile(fp){
  const st=fs.statSync(fp), sz=st.size; files++; bytes+=sz; bump(fp,sz);
  const n=N(fp), top=n.split('/')[0]; byDir[top]=(byDir[top]||0)+1;
  const ext=EXTS.has(path.extname(fp))?path.extname(fp):'other'; byExt[ext]=(byExt[ext]||0)+1;
  if (sz>MAX_READ) return; const t=T(fp);
  if (TEST.test(fp)) tests.push(n);
  if (ENDPT.test(t) && CODE.has(ext)) endpoints.push(n);
}
function walk(root){
  const st=[[root,0]]; while(st.length){
    const [cur,d]=st.pop();
    for(const ent of fs.readdirSync(cur,{withFileTypes:true})){
      const p=path.join(cur,ent.name); const n=N(p); if(IGN.test(n)) continue;
      if(ent.isDirectory()){ if(d<MAX_DEPTH) st.push([p,d+1]); }
      else { scanFile(p); if(files>=MAX_FILES) return; }
    }
  }
}
walk('.');

function wfScan(){
  const dir='.github/workflows'; const res={list:[],flags:[],danger:[],runWithoutFlag:[]};
  if(!X(dir)) return res;
  res.list=fs.readdirSync(dir).filter(f=>/\.(ya?ml)$/i.test(f)).map(f=>N(path.join(dir,f)));
  for(const f of res.list){
    const t=T(f); const hasFlag=ND.test(t); const isDanger=DANG.test(t);
    if(hasFlag) res.flags.push(f); if(isDanger) res.danger.push(f);
    if(STRICT){ // strict: si hay 'run:' y no vemos flag en el archivo => violación
      if(/^\s*run\s*:/m.test(t) && !hasFlag) res.runWithoutFlag.push(f);
    }
  }
  return res;
}

const wf=wfScan();

// heavy tasks with timings
const durations={};
function timed(label, fn){
  const t=Date.now(); const out=fn(); durations[label]=Date.now()-t; return out;
}
const metrics={coverage_lines_pct:null, eslint_errors:null, jscpd_dup_pct:null, jscpd_clones_gt100:null, npm_high:null, npm_critical:null, secret_leaks:null};

if(RUN.TESTS==='1' && !DRY){
  timed('tests', ()=> {
    const r=spawnSync('pnpm',['-w','-r','exec','vitest','--run','--coverage','--coverage.provider=v8'],{encoding:'utf8',timeout:120000});
    if(r.status===0){
      // find coverage-summary.json
      let cov=null;
      const find=(d)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
        if(p.includes('node_modules')||p.includes('.git')) continue;
        if(e.isDirectory()) find(p); else if(/coverage-summary\.json$/.test(p)) cov=p; }};
      try{find('.');}catch{}
      if(cov){ const j=R(cov); metrics.coverage_lines_pct=j?.total?.lines?.pct??null; }
    }
  });
}

if(RUN.LINT==='1' && !DRY){
  timed('eslint', ()=> {
    const r=spawnSync('pnpm',['-w','-r','exec','eslint','.', '-f','json'],{encoding:'utf8',timeout:120000});
    if(r.status===0){ const J=R('reports/eslint.json')||JSON.parse(r.stdout||'[]'); let errs=0; (Array.isArray(J)?J:[]).forEach(f=>errs+=(f.errorCount||0)); metrics.eslint_errors=errs; fs.writeFileSync('reports/eslint.json',JSON.stringify(J,null,2)); }
  });
}

if(RUN.DUP==='1' && !DRY){
  timed('jscpd', ()=> {
    const r=spawnSync('npx',['--yes','jscpd','--silent','--reporters','json','--output','reports','.'],{encoding:'utf8',timeout:120000});
    if(r.status===0){ const J=R('reports/jscpd.json'); metrics.jscpd_dup_pct=J?.statistics?.percentage??null; metrics.jscpd_clones_gt100=Array.isArray(J?.duplicates)?J.duplicates.filter(d=>(d?.lines||0)>100).length:null; }
  });
}

if(RUN.LEAKS==='1' && !DRY){
  timed('gitleaks', ()=> {
    const r=spawnSync('gitleaks',['detect','--no-git','-r','reports/gitleaks.json'],{encoding:'utf8',timeout:120000});
    if(r.status===0){ const J=R('reports/gitleaks.json'); metrics.secret_leaks=Array.isArray(J?.findings)?J.findings.length:0; }
  });
}

if(RUN.AUDIT==='1' && !DRY){
  timed('audit', ()=> {
    const r=spawnSync('pnpm',['audit','--json'],{encoding:'utf8',timeout:120000});
    if(r.status===0){ const J=JSON.parse(r.stdout||'{}'); const v=(J.vulnerabilities||J.metadata?.vulnerabilities||{}); metrics.npm_high=v.high??0; metrics.npm_critical=v.critical??0; fs.writeFileSync('reports/audit.json',JSON.stringify(J,null,2)); }
  });
}

// score
const cov=metrics.coverage_lines_pct??0;
const eslintScore = metrics.eslint_errors===0?100:0;
const dupScore = metrics.jscpd_dup_pct!=null?Math.max(0,100-metrics.jscpd_dup_pct):0;
const secOK = (metrics.npm_high===0 && metrics.npm_critical===0 && metrics.secret_leaks===0);
const secScore = secOK?100:0;
const score = +(0.45*cov + 0.25*eslintScore + 0.15*dupScore + 0.15*secScore).toFixed(2);
const pass = {
  coverage: cov>=WANT.cov,
  eslint: metrics.eslint_errors===0,
  duplicates: (metrics.jscpd_dup_pct??100) <= WANT.dup && (metrics.jscpd_clones_gt100??0)===0,
  sec: secOK,
  no_deploy: (wf.danger.length===0 && wf.flags.length>0 && (!STRICT || wf.runWithoutFlag.length===0))
};
const summary={
  meta:{repo:path.basename(process.cwd()), node:(sh('node',['-v'],5).stdout||'').trim()||null, pm:pkg.packageManager||null, engines:pkg.engines||null, private:!!pkg.private, duration_ms:Date.now()-t0},
  inventory:{workspaces, apps:inv('apps'), packages:inv('packages'), functions:inv('functions')},
  workflows:{count:wf.list.length, flags:wf.flags, dangerous:wf.danger, strict_violations:wf.runWithoutFlag, STRICT},
  tests:{count:tests.length, coverage_lines_pct:metrics.coverage_lines_pct},
  endpoints: endpoints.slice(0,500),
  metrics, durations_ms:durations,
  verdict:{score, GO: pass.coverage && pass.eslint && pass.duplicates && pass.sec && pass.no_deploy, NO_DEPLOY_OK: pass.no_deploy},
  asks:[]
};
if(!summary.pm) summary.asks.push('Añadir "packageManager":"pnpm@8.15.5"');
if(!summary.engines) summary.asks.push('Añadir "engines":{"node":">=20"}');
if(!(summary.inventory.workspaces||[]).length) summary.asks.push('Declarar workspaces en package.json o pnpm-workspace.yaml');
if(metrics.coverage_lines_pct==null && RUN.TESTS!=='1') summary.asks.push('Activar Vitest v8 + coverage v8');
if(metrics.eslint_errors==null && RUN.LINT!=='1') summary.asks.push('Configurar ESLint flat v9 + typescript-eslint');
if(metrics.jscpd_dup_pct==null && RUN.DUP!=='1') summary.asks.push('Añadir jscpd con umbral ≤4%');
if(metrics.npm_high==null && RUN.AUDIT!=='1') summary.asks.push('Ejecutar pnpm audit en CI');
fs.writeFileSync('reports/GO_V2.json', JSON.stringify(summary,null,2));
// CSV evidencia
const csv=r=>r.map(a=>a.map(x=>String(x).replace(/"/g,'""')).map(x=>`"${x}"`).join(',')).join('\n');
fs.writeFileSync('reports/WF_EVIDENCE.csv', csv([['file','has_flag','dangerous','strict_violation'], ...summary.workflows.count?summary.workflows.flags.concat(summary.workflows.dangerous).filter((v,i,a)=>a.indexOf(v)===i).map(f=>[f,true,summary.workflows.dangerous.includes(f),summary.workflows.strict_violations.includes(f)]):[]]));
fs.writeFileSync('reports/DIR_STATS.csv', csv([['dir','count'], ...Object.entries(byDir).sort((a,b)=>b[1]-a[1])]));
fs.writeFileSync('reports/EXT_STATS.csv', csv([['ext','count'], ...Object.entries(byExt).sort((a,b)=>b[1]-a[1])]));
fs.writeFileSync('reports/FILES_TOP.csv', csv([['path','bytes'], ...largest.map(x=>[x.path,x.size])]));
fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md', ['# NO_DEPLOY_EVIDENCE',`flags(${summary.workflows.flags.length}):`,...summary.workflows.flags,'',`dangerous(${summary.workflows.dangerous.length}):`,...summary.workflows.dangerous, STRICT?`\nstrict_violations(${summary.workflows.strict_violations.length}):\n${summary.workflows.strict_violations.join('\n')}`:''].join('\n'));
console.log(JSON.stringify({GO:summary.verdict.GO, NO_DEPLOY_OK:summary.verdict.NO_DEPLOY_OK, score, durations_ms:summary.durations_ms, asks:summary.asks},null,2));