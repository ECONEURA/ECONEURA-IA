const fs=require("fs");
const J=(p,d)=>{try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return d}};
const es=J("reports/eslint.json",[]), dup=J("reports/jscpd/jscpd-report.json",{}), knip=J("reports/knip.json",{});
const eslintErrors=(Array.isArray(es)?es.reduce((a,f)=>a+(f.errorCount||0),0):(es.errorCount||0)||0);
const eslintWarns =(Array.isArray(es)?es.reduce((a,f)=>a+(f.warningCount||0),0):(es.warningCount||0)||0);
const dupPct=(dup?.statistics?.duplication ?? dup?.statistics?.percentage ?? 0);
const clones=dup?.statistics?.clones ?? 0;
const bigClones=(dup?.clones||[]).filter(c=>(c?.lines||0)>100).length;
let dead=0; if(knip?.summary){dead=(knip.summary.unusedExports||0)+(knip.summary.unlisted||0)}
const ok=(eslintErrors===0)&&(dupPct<=4)&&(bigClones===0);
fs.mkdirSync("docs/audit",{recursive:true});

const byRule={}; for(const f of (Array.isArray(es)?es:[])){ for(const m of (f.messages||[])){ if(m.severity!==2) continue; const k=m.ruleId||"__no_rule__"; (byRule[k]??=[]).push(`${f.filePath}:${m.line}:${m.column} — ${m.message}`); } }
let planES="# ESLINT_FIX_PLAN\\n"; for(const [r,items] of Object.entries(byRule).sort((a,b)=>b[1].length-a[1].length).slice(0,10)){ planES+=`\\n## ${r} (${items.length})\\n`+items.slice(0,10).map(x=>"- "+x).join("\\n")+"\\n"; }
fs.writeFileSync("docs/audit/ESLINT_FIX_PLAN.md", planES);

let planD="# DUPLICATION_PLAN\\nMeta: <=4% y 0 clones >100 líneas.\\n"; for(const c of (dup?.clones||[]).sort((a,b)=>(b.lines||0)-(a.lines||0)).slice(0,10)){ const a=c.firstFile||c.first||{},b=c.secondFile||c.second||{}; planD+=`- ${c.lines||0} líneas\\n  * ${a.name||a.file}:${a.start?.line}-${a.end?.line}\\n  * ${b.name||b.file}:${b.start?.line}-${b.end?.line}\\n  Acción: extraer a packages/shared/* con tests.\\n`; }
fs.writeFileSync("docs/audit/DUPLICATION_PLAN.md", planD);

fs.writeFileSync("docs/audit/DEADCODE_REPORT.md", `# DEADCODE_REPORT\\nTotal aprox: ${dead}\\nFuente: reports/knip.json`);

const summary={phase:"F3-ultra", ok, eslint_errors:eslintErrors, eslint_warnings:eslintWarns, jscpd_dup_pct:dupPct, jscpd_clones:clones, clones_gt_100:bigClones, deadcode:dead};
fs.writeFileSync("reports/summary.json", JSON.stringify(summary,null,2));
if(!ok){ fs.writeFileSync("docs/audit/GAP_F3.md", `# GAP F3\\n- ESLint errores: ${eslintErrors}\\n- Dup %: ${dupPct}\\n- Clones >100: ${bigClones}`); }
console.log(JSON.stringify(summary,null,2));