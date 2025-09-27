const fs=require('fs'),p=require('path');
const J=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return null}}, T=f=>{try{return fs.readFileSync(f,'utf8')}catch{return''}};
const nd=/DEPLOY_ENABLED\s*:\s*['"]?false['"]?/i, dang=/\b(az|azd|terraform|kubectl|helm|docker\s+(build|push))\b/i;
const wfDir='.github/workflows'; let list=[]; if(fs.existsSync(wfDir)) list=fs.readdirSync(wfDir).filter(f=>/\.(ya?ml)$/i.test(f)).map(f=>p.join(wfDir,f));
const flags=list.filter(f=>nd.test(T(f))), danger=list.filter(f=>dang.test(T(f)));
const strict=list.filter(f=>/^\s*run\s*:/m.test(T(f)) && !nd.test(T(f)));
const ESL=J('reports/eslint.json'); let eslintErr=0; if(Array.isArray(ESL)) ESL.forEach(f=>eslintErr+=(f.errorCount||0));
let cov=0; try{const cs=J('reports/coverage-summary.json'); cov=cs?.total?.lines?.pct??0;}catch{}
const D=J('reports/jscpd.json'); const dup=D?.statistics?.percentage??0; const big=(D?.duplicates||[]).some(d=>(d?.lines||0)>100);
const AJ=J('reports/audit.json'); const vul=(AJ?.vulnerabilities||AJ?.metadata?.vulnerabilities||{}); const high=vul.high??0,critical=vul.critical??0;
const GL=J('reports/gitleaks.json'); const leaks=Array.isArray(GL?.findings)?GL.findings.length:0;
const score=+(0.45*cov + 0.25*(eslintErr===0?100:0) + 0.15*Math.max(0,100-dup) + 0.15*((high===0&&critical===0&&leaks===0)?100:0)).toFixed(2);
const noDeploy=(danger.length===0 && flags.length>0 && (process.env.STRICT_NO_DEPLOY!=='1' || strict.length===0));
const pass={coverage:cov>=80, eslint:eslintErr===0, duplicates:dup<=4 && !big, sec:(high===0&&critical===0&&leaks===0), no_deploy:noDeploy};
const GO = pass.coverage && pass.eslint && pass.duplicates && pass.sec && pass.no_deploy;
const out={GO,score,NO_DEPLOY_OK:noDeploy,pass,metrics:{coverage_lines_pct:cov,eslint_errors:eslintErr,jscpd_dup_pct:dup,jscpd_clones_gt100:big?1:0,npm_high:high,npm_critical:critical,secret_leaks:leaks}};
fs.writeFileSync('reports/GO_ULTRAFAST.json', JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
process.exit(GO?0:2);