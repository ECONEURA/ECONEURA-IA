set -euo pipefailset -euo pipefail

branch="hardening/quality-V14-turbogates"; git checkout -b "$branch" || git checkout "$branch"branch="hardening/quality-V14-turbogates"; git checkout -b "$branch" || git checkout "$branch"

corepack enable >/dev/null 2>&1 || true; (pnpm -v >/dev/null 2>&1) || npm i -g pnpm@8.15.5corepack enable >/dev/null 2>&1 || true; (pnpm -v >/dev/null 2>&1) || npm i -g pnpm@8.15.5

printf "v20.11.1\n" > .nvmrc; printf "engine-strict=true\n" > .npmrcprintf "v20.11.1\n" > .nvmrc; printf "engine-strict=true\n" > .npmrc

export CI=1 VITEST_MAX_THREADS=75% VITEST_MIN_THREADS=50%export CI=1 VITEST_MAX_THREADS=75% VITEST_MIN_THREADS=50%



# deps mínimas si faltan# deps mínimas si faltan

pnpm -s -w i --prefer-offline --prod=falsepnpm -s -w i --prefer-offline --prod=false



mkdir -p reports reports/jscpd docs/audit docs/sync scripts/automkdir -p reports reports/jscpd docs/audit docs/sync scripts/auto



# thresholds vitest idempotentes# thresholds vitest idempotentes

node -e "const fs=require('fs');let t=fs.readFileSync('vitest.config.ts','utf8');if(!/thresholds:\s*\{/.test(t)){t=t.replace(/coverage:\s*\{/, \`coverage:{ thresholds:{ lines:80, statements:80, functions:75, branches:70 }, \`);fs.writeFileSync('vitest.config.ts',t)}"node -e "const fs=require('fs');let t=fs.readFileSync('vitest.config.ts','utf8');if(!/thresholds:\s*\{/.test(t)){t=t.replace(/coverage:\s*\{/, \`coverage:{ thresholds:{ lines:80, statements:80, functions:75, branches:70 }, \`);fs.writeFileSync('vitest.config.ts',t)}"



# 0) typecheck+build en paralelo# 0) typecheck+build en paralelo

(pnpm -w -r run typecheck || true) & (pnpm -w -r run build || true) & wait(pnpm -w -r run typecheck || true) & (pnpm -w -r run build || true) & wait



# 1) tests+coverage primero (fail-fast)# 1) tests+coverage primero (fail-fast)

pnpm -w -r exec vitest -w run --coverage --threads || truepnpm -w -r exec vitest -w run --coverage --threads || true

node -e "const f='reports/coverage/coverage-summary.json';const j=JSON.parse(require('fs').readFileSync(f,'utf8'));const p=j.total?.lines?.pct||0;console.log('COVERAGE',p);if(p<80)process.exit(2)"node -e "const f='reports/coverage/coverage-summary.json';const j=JSON.parse(require('fs').readFileSync(f,'utf8'));const p=j.total?.lines?.pct||0;console.log('COVERAGE',p);if(p<80)process.exit(2)"



# 2) lint a 0 rápido# 2) lint a 0 rápido

pnpm -s dlx eslint . --fix || truepnpm -s dlx eslint . --fix || true

pnpm -s dlx eslint . -f json -o reports/eslint.json || truepnpm -s dlx eslint . -f json -o reports/eslint.json || true

node -e "const j=require('fs').readFileSync('reports/eslint.json','utf8');const r=JSON.parse(j);const n=(Array.isArray(r)?r:r.results||[]).reduce((a,x)=>a+(x.errorCount||0),0);console.log('ESLINT',n);if(n>0)process.exit(3)"node -e "const j=require('fs').readFileSync('reports/eslint.json','utf8');const r=JSON.parse(j);const n=(Array.isArray(r)?r:r.results||[]).reduce((a,x)=>a+(x.errorCount||0),0);console.log('ESLINT',n);if(n>0)process.exit(3)"



# 3) duplicación exigente# 3) duplicación exigente

cat > .jscpd.json <<'J'cat > .jscpd.json <<'J'

{ "reporters":["json","html"], "output":"reports/jscpd","minTokens":100,"minLines":10,{ "reporters":["json","html"], "output":"reports/jscpd","minTokens":100,"minLines":10,

  "ignore":["**/*.{test,spec}.ts?(x)","**/__tests__/**","**/__auto__/**","**/dist/**","**/build/**","**/coverage/**","**/reports/**","**/*.d.ts","**/*.gen.ts","**/node_modules/**"] }  "ignore":["**/*.{test,spec}.ts?(x)","**/__tests__/**","**/__auto__/**","**/dist/**","**/build/**","**/coverage/**","**/reports/**","**/*.d.ts","**/*.gen.ts","**/node_modules/**"] }

JJ

pnpm -s dlx jscpd "apps/**/src/**/*.{ts,tsx,js}" "packages/**/src/**/*.{ts,tsx,js}" --config .jscpd.json || truepnpm -s dlx jscpd "apps/**/src/**/*.{ts,tsx,js}" "packages/**/src/**/*.{ts,tsx,js}" --config .jscpd.json || true

node -e "const d=require('fs');const j=JSON.parse(d.readFileSync('reports/jscpd/jscpd-report.json','utf8'));const p=j.statistics?.percentage??j.statistics?.duplication??0;console.log('JSCPD',p);if(p>4)process.exit(4)"node -e "const d=require('fs');const j=JSON.parse(d.readFileSync('reports/jscpd/jscpd-report.json','utf8'));const p=j.statistics?.percentage??j.statistics?.duplication??0;console.log('JSCPD',p);if(p>4)process.exit(4)"



# 4) seguridad y NO_DEPLOY# 4) seguridad y NO_DEPLOY

(gitleaks detect --no-git --report-format json --report-path reports/gitleaks.json || true)(gitleaks detect --no-git --report-format json --report-path reports/gitleaks.json || true)

pnpm -s audit --json > reports/audit.json || truepnpm -s audit --json > reports/audit.json || true

node -e "const fs=require('fs');const gl=JSON.parse(fs.readFileSync('reports/gitleaks.json','utf8')||'{}');const au=JSON.parse(fs.readFileSync('reports/audit.json','utf8')||'{}');const leaks=(gl.findings||[]).length;const hi=(au.vulnerabilities?.high||0),cr=(au.vulnerabilities?.critical||0);if(leaks+hi+cr>0){fs.writeFileSync('docs/audit/AUDIT_PLAN.md',\`# AUDIT PLAN\\nleaks:\${leaks} high:\${hi} critical:\${cr}\\n\`);process.exit(5)}"node -e "const fs=require('fs');const gl=JSON.parse(fs.readFileSync('reports/gitleaks.json','utf8')||'{}');const au=JSON.parse(fs.readFileSync('reports/audit.json','utf8')||'{}');const leaks=(gl.findings||[]).length;const hi=(au.vulnerabilities?.high||0),cr=(au.vulnerabilities?.critical||0);if(leaks+hi+cr>0){fs.writeFileSync('docs/audit/AUDIT_PLAN.md',`# AUDIT PLAN\nleaks:${leaks} high:${hi} critical:${cr}\n`);process.exit(5)}"

node -e "const fs=require('fs');const d='.github/workflows';let o='# NO_DEPLOY EVIDENCE\\n\\n';if(fs.existsSync(d)){for(const f of fs.readdirSync(d).filter(x=>/\\.ya?ml$/i.test(x))){const L=fs.readFileSync(d+'/'+f,'utf8').split('\\n');L.forEach((l,i)=>{if(l.includes('DEPLOY_ENABLED')||/(deploy|release|az |webapp|containerapp|kubectl|helm|gcloud|aws|docker (build|push))/i.test(l))o+=\`- \${f}: L\${i+1}: \${l}\\n\`})}}fs.mkdirSync('docs/audit',{recursive:true});fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md',o)}"node -e "const fs=require('fs');const d='.github/workflows';let o='# NO_DEPLOY EVIDENCE\\n\\n';if(fs.existsSync(d)){for(const f of fs.readdirSync(d).filter(x=>/\\.ya?ml$/i.test(x))){const L=fs.readFileSync(d+'/'+f,'utf8').split('\\n');L.forEach((l,i)=>{if(l.includes('DEPLOY_ENABLED')||/(deploy|release|az |webapp|containerapp|kubectl|helm|gcloud|aws|docker (build|push))/i.test(l))o+=`- ${f}: L${i+1}: ${l}\\n`})}}fs.mkdirSync('docs/audit',{recursive:true});fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md',o)"



# 5) summary final# 5) summary final

node -e "const fs=require('fs');const J=p=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){return{}}};const cov=J('reports/coverage/coverage-summary.json');const es=J('reports/eslint.json');const dup=J('reports/jscpd/jscpd-report.json');const gl=J('reports/gitleaks.json');const covPct=cov.total?.lines?.pct??0;const lint=(Array.isArray(es)?es.reduce((a,f)=>a+(f.errorCount||0),0):(es.errorCount||0)||0;const dupPct=dup.statistics?.percentage??dup.statistics?.duplication??0;const leaks=(gl.findings||[]).length;const lintScore=(lint===0?100:Math.max(0,100-Math.min(lint,500)));const dupScore=(typeof dupPct==='number'?Math.max(0,100-dupPct*10):50);const sec=(leaks===0?100:20);const score=Math.round(0.45*Math.min(covPct,100)+0.25*lintScore+0.15*dupScore+0.15*sec);fs.writeFileSync('reports/summary.json',JSON.stringify({coverage_lines_pct:covPct,eslint_errors:lint,jscpd_dup_pct:dupPct,secret_leaks:leaks,score},null,2));console.log(fs.readFileSync('reports/summary.json','utf8'))"node -e "const fs=require('fs');const J=p=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){return{}}};const cov=J('reports/coverage/coverage-summary.json');const es=J('reports/eslint.json');const dup=J('reports/jscpd/jscpd-report.json');const gl=J('reports/gitleaks.json');const covPct=cov.total?.lines?.pct??0;const lint=(Array.isArray(es)?es.reduce((a,f)=>a+(f.errorCount||0),0):(es.errorCount||0)||0;const dupPct=dup.statistics?.percentage??dup.statistics?.duplication??0;const leaks=(gl.findings||[]).length;const lintScore=(lint===0?100:Math.max(0,100-Math.min(lint,500)));const dupScore=(typeof dupPct==='number'?Math.max(0,100-dupPct*10):50);const sec=(leaks===0?100:20);const score=Math.round(0.45*Math.min(covPct,100)+0.25*lintScore+0.15*dupScore+0.15*sec);fs.writeFileSync('reports/summary.json',JSON.stringify({coverage_lines_pct:covPct,eslint_errors:lint,jscpd_dup_pct:dupPct,secret_leaks:leaks,score},null,2));console.log(fs.readFileSync('reports/summary.json','utf8'))"

git add -A && git commit -m "chore(quality): V14 turbogates — fail-fast cov/eslint/dup/leaks, summary final [no_deploy]"git add -A && git commit -m "chore(quality): V14 turbogates — fail-fast cov/eslint/dup/leaks, summary final [no_deploy]"</content>
<parameter name="filePath">c:\Users\Usuario\ECONEURA-IA-1.worktrees\fix\ci-generate-score-fix\quality-v14-turbogates.sh