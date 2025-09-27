import fs from 'fs';
import path from 'path';
const p = path;
const ex=f=>{try{fs.accessSync(f);return true;}catch{return false}};
const j=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return null}};
const pkg=j('package.json')||{};
const list=d=>ex(d)?fs.readdirSync(d).filter(x=>fs.statSync(p.join(d,x)).isDirectory()):[];
const inv=k=>list(k).map(x=>({dir:`${k}/${x}`, name:(j(p.join(k,x,'package.json'))||{}).name||null}));
const txt=f=>ex(f)?fs.readFileSync(f,'utf8'):'';
const wfDir='.github/workflows';
const wfs=ex(wfDir)?fs.readdirSync(wfDir).filter(f=>/\.(ya?ml)$/.test(f)).map(f=>p.join(wfDir,f)):[];
const DANG=/(^|\s)(az |azd |terraform|kubectl|helm|docker push)\b/;
const ND=/DEPLOY_ENABLED\s*:\s*['"]false['"]/;
const dang=wfs.filter(f=>DANG.test(txt(f)));
const nd=wfs.filter(f=>ND.test(txt(f)));
const walk=(b,depth=2)=>{const out=[];const w=(d,l)=>{if(l<0)return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const q=p.join(d,e.name);if(q.includes('node_modules')||q.startsWith('.git'))continue;out.push(q);if(e.isDirectory())w(q,l-1)}};
try{w(b,depth)}catch{};return out};
const tree=walk('.',2);
let workspaces = (pkg.workspaces?.packages||pkg.workspaces||[]);
const y=f=>{try{return fs.readFileSync(f,'utf8')}catch{return''}};
const wsYaml=ex('pnpm-workspace.yaml')?y('pnpm-workspace.yaml'):'';
if(!workspaces.length && /packages:\s*\n/.test(wsYaml)){
  workspaces = [...new Set((wsYaml.match(/- [^\n]+/g)||[]).map(s=>s.replace(/^- /,'').trim()))];
}
const IGN=/node_modules|^\.git|\/\.next\/|\/dist\/|\/coverage\//;
const sum={
  repo:p.basename(process.cwd()),
  pm:pkg.packageManager||null,
  engines:pkg.engines||null,
  scripts:Object.keys(pkg.scripts||{}),
  workspaces:workspaces,
  apps:inv('apps'),
  packages:inv('packages'),
  functions:inv('functions'),
  workflows:{count:wfs.length, no_deploy_flag_files:nd, dangerous:dang},
  verdict:{GO_NO_GO: true, NO_DEPLOY_OK: dang.length===0 && nd.length>0}
};
fs.writeFileSync('reports/FAST.json', JSON.stringify(sum,null,2));
console.log(`# FAST REPORT — ${sum.repo}
- PM: ${sum.pm||'n/a'} · Engines: ${sum.engines?JSON.stringify(sum.engines):'n/a'}
- Scripts: ${sum.scripts.length} · Workspaces: ${sum.workspaces.length||0}
- apps:${sum.apps.length} packages:${sum.packages.length} functions:${sum.functions.length}
- Workflows: ${sum.workflows.count} · NO_DEPLOY_OK: ${sum.verdict.NO_DEPLOY_OK}
- Muestras:
  • apps: ${sum.apps.slice(0,5).map(x=>x.dir).join(', ')||'—'}
  • packages: ${sum.packages.slice(0,5).map(x=>x.dir).join(', ')||'—'}
  • functions: ${sum.functions.slice(0,5).map(x=>x.dir).join(', ')||'—'}
- Árbol corto (lvl 2): líneas=${tree.length}`)