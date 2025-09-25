import fs from "fs";
function J(p,d){try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return d}}
const vit=J("reports/vitest.json",{testResults:[]});
const cov=J("coverage-f2/coverage-final.json",{});
const tl={total:0,covered:0,pct:0};
for(const f of Object.values(cov)){ if(!f?.lines) continue; tl.total+=f.lines.total||0; tl.covered+=f.lines.covered||0; }
tl.pct = tl.total? +(100*tl.covered/tl.total).toFixed(2) : 0;
const passed=(vit.testResults||[]).filter(tr=>tr.status==="passed").length;
const failed=(vit.testResults||[]).filter(tr=>tr.status==="failed").length;
const byFile={}; (vit.testResults||[]).forEach(tr=>{ if(tr.status!=="failed") return; const k=tr.testFilePath||"unknown"; byFile[k]=(byFile[k]||0)+1; });
const top=Object.entries(byFile).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([f,c])=>({file:f, fails:c}));
const ok=(tl.pct>=80 && failed===0);
fs.writeFileSync("reports/coverage.json", JSON.stringify({total:{lines:tl}},null,2));
fs.writeFileSync("reports/summary.json", JSON.stringify({phase:"F2-opt", ok, coverage_lines_pct:tl.pct, tests_passed:passed, tests_failed:failed, top_fail_files:top, sha:process.env.GITHUB_SHA||""}, null, 2));
if(!ok){
  fs.mkdirSync("docs/audit",{recursive:true});
  fs.writeFileSync("docs/audit/GAP_F2.md",
`# GAP F2
- coverage_lines_pct: ${tl.pct} (target >=80)
- tests_failed: ${failed}
## Top archivos con fallos
${top.map(x=>"- "+x.file+" ("+x.fails+")").join("\n")||"-"}
## Acciones (48h)
1) Priorizar tests en archivos TOP, aislar DOM con within(container).
2) Elevar cobertura en servicios/IO críticos (use-cases y controladores).
3) Corregir a11y (roles únicos, labels, focus) en web.
`);
}
console.log(JSON.stringify({phase:"F2-opt", ok, coverage_lines_pct:tl.pct, tests_passed:passed, tests_failed:failed, top_fail_files:top}, null, 2));