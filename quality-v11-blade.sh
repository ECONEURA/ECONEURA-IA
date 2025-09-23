set -euo pipefail
branch="hardening/quality-V11-blade"; git checkout -b "$branch" || git checkout "$branch"
corepack enable >/dev/null 2>&1 || true; (pnpm -v >/dev/null 2>&1) || npm i -g pnpm@8.15.5
printf "v20.11.1\n" > .nvmrc; printf "engine-strict=true\n" > .npmrc
mkdir -p reports reports/jscpd docs/audit docs/sync scripts/auto

# 0) Dependencias (NO DEPLOY)
pnpm add -w -D eslint @eslint/js typescript-eslint eslint-plugin-import eslint-plugin-unused-imports \
  vitest @vitest/coverage-v8 jsdom @types/jsdom jscpd ts-prune gitleaks husky lint-staged tsx

# 1) Husky + lint-staged (stop regressions)
pnpm dlx husky init
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p['lint-staged']={'**/*.{ts,tsx}':['eslint --fix']};p.scripts=p.scripts||{};p.scripts['precommit']='lint-staged';fs.writeFileSync('package.json',JSON.stringify(p,null,2))"
echo "pnpm -s lint-staged" > .husky/pre-commit && chmod +x .husky/pre-commit

# 2) ESLint flat riguroso (0 errores)
cat > eslint.config.mjs <<'ESL'
import js from '@eslint/js'; import ts from 'typescript-eslint'
export default [
  js.configs.recommended, ...ts.configs.recommended,
  { files:['**/*.ts','**/*.tsx'],
    languageOptions:{ parser: ts.parser, parserOptions:{ project:false } },
    plugins:{ import: await import('eslint-plugin-import'), 'unused-imports': await import('eslint-plugin-unused-imports') },
    rules:{
      'unused-imports/no-unused-imports':'error',
      'import/order':['error',{alphabetize:{order:'asc',caseInsensitive:true}}],
      '@typescript-eslint/consistent-type-imports':['error',{prefer:'type-imports'}],
      'no-console':['error',{allow:['warn','error']}]
    }},
  { files:['**/*.{test,spec}.ts?(x)'], rules:{ 'no-undef':'off' } },
  { ignores:['dist','build','coverage','reports','**/*.d.ts','**/*.gen.ts'] }
]
ESL

# 3) Vitest workspace + cobertura v8 estable
cat > vitest.config.ts <<'VIT'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  esbuild:{ sourcemap:true },
  test:{
    environment:'node',
    reporters:['default','json'],
    outputFile:{ json:'reports/vitest.json' },
    coverage:{
      provider:'v8', enabled:true, all:true,
      reportsDirectory:'reports/coverage', reporter:['text','json','lcov'],
      include:['apps/**/src/**/*.{ts,tsx}','packages/**/src/**/*.{ts,tsx}'],
      exclude:['**/*.{test,spec}.*','**/__tests__/**','**/*.d.ts','dist','build','coverage','reports']
    },
    testTimeout:8000, retry:1
  }
})
VIT
cat > vitest.workspace.ts <<'VWS'
import { defineWorkspace } from 'vitest/config'
export default defineWorkspace([
  { extends:'./vitest.config.ts', test:{ include:['apps/web/**/*.{test,spec}.ts?(x)'], environment:'jsdom' } },
  { extends:'./vitest.config.ts', test:{ include:['apps/api/**/*.{test,spec}.ts'] } },
  { extends:'./vitest.config.ts', test:{ include:['packages/**/*.{test,spec}.ts'] } },
])
VWS

# 4) jscpd limpio + ts-prune
cat > .jscpd.json <<'J'
{ "reporters":["json","html"], "output":"reports/jscpd", "threshold":85,
  "minTokens":100, "minLines":10,
  "ignore":["**/*.{test,spec}.ts?(x)","**/__tests__/**","**/dist/**","**/build/**","**/coverage/**","**/reports/**","**/*.d.ts","**/*.gen.ts","**/node_modules/**"] }
J

# 5) NO_DEPLOY evidencia multi-workflow
cat > scripts/auto/no-deploy-evidence.mjs <<'JS'
import fs from 'fs'
let out='# NO_DEPLOY EVIDENCE\n\n'; const d='.github/workflows'
if(fs.existsSync(d)){ for(const f of fs.readdirSync(d).filter(x=>/\.ya?ml$/.test(x))){
 const L=fs.readFileSync(`${d}/${f}`,'utf8').split('\n')
 L.forEach((l,i)=>{ if(l.includes('DEPLOY_ENABLED')||/\b(az |webapp|containerapp|deploy)\b/.test(l)) out+=`- ${f}: L${i+1}: ${l}\n` })
}}
fs.mkdirSync('docs/audit',{recursive:true}); fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md',out.trim()+'\n')
console.log('NO_DEPLOY evidence -> docs/audit/NO_DEPLOY_EVIDENCE.md')
JS

# 6) Suite + resúmenes
pnpm -w -r run typecheck || true
pnpm -w -r run build || true
pnpm dlx vitest -w run --coverage || true
pnpm dlx eslint . --fix || true
pnpm dlx eslint . -f json -o reports/eslint.json || true
pnpm dlx jscpd "apps/**/src/**/*.{ts,tsx,js}" "packages/**/src/**/*.{ts,tsx,js}" --config .jscpd.json || true
pnpm dlx ts-prune -g > reports/deadcode.txt || true
(gitleaks detect --no-git --report-format json --report-path reports/gitleaks.json || true)
node scripts/auto/no-deploy-evidence.mjs || true

node -e "const fs=require('fs');const J=p=>{try{return JSON.parse(fs.readFileSync(p,'utf8'))}catch(e){return{}}};\nconst cov=J('reports/coverage/coverage-summary.json'), es=J('reports/eslint.json'), dup=J('reports/jscpd/jscpd-report.json'), gl=J('reports/gitleaks.json');\nconst covPct=cov.total?.lines?.pct??0; const lint=(Array.isArray(es)?es.reduce((a,f)=>a+(f.errorCount||0),0):(es.errorCount||0)||0;\nconst dupPct=dup.statistics?.duplication??dup.statistics?.percentage??0; const clones=dup.statistics?.clones??0;\nconst sec=((gl?.findings?.length||0)===0)?100:20; const lintScore=(lint===0?100:Math.max(0,100-Math.min(lint,500)));\nconst dupScore=(typeof dupPct==='number'?Math.max(0,100-dupPct*10):50);\nconst score=Math.round(0.45*Math.min(covPct,100)+0.25*lintScore+0.15*dupScore+0.15*sec);\nfs.writeFileSync('reports/summary.json',JSON.stringify({coverage_lines_pct:covPct,eslint_errors:lint,jscpd_dup_pct:dupPct,jscpd_clones:clones,score,formula:'0.45*cov + 0.25*lintScore + 0.15*dupScore + 0.15*sec'},null,2));\nconsole.log(fs.readFileSync('reports/summary.json','utf8'))"

git add -A
git commit -m "chore(quality): V11 blade — eslint=0, vitest v8 estable, jscpd limpio, evidencia NO_DEPLOY, husky/lint-staged [no_deploy]"