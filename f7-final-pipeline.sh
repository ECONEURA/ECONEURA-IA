#!/bin/bash
set -euo pipefail

# 0) Rama, entorno y carpetas
git rev-parse --is-inside-work-tree >/dev/null 2>&1
git checkout -B hardening/f7-final || true
corepack enable >/dev/null 2>&1 || true
(pnpm -v >/dev/null 2>&1) || npm i -g pnpm@8.15.5
pnpm i --prefer-offline --silent || true
mkdir -p reports docs/audit reports/jscpd

# 1) Detecta cambios y define ámbitos
CHANGED=$(git diff --name-only --diff-filter=AMRC origin/main... 2>/dev/null || git diff --name-only --diff-filter=AMRC || true)
CORE_PATHS="apps/web apps/api"
ESLINT_CFG=${ESLINT_CFG:-eslint.econeura.mjs}  # usa tu flat config si existe

# 2) Lint incremental (rápido) sobre archivos cambiados
if [ -n "${CHANGED}" ]; then
  CH_FILES=$(echo "$CHANGED" | grep -E "\.(ts|tsx|js|jsx)$" || true)
  if [ -n "${CH_FILES}" ]; then
    pnpm -s exec eslint $CH_FILES --config "$ESLINT_CFG" --fix --cache --cache-location .eslintcache -f json -o reports/eslint.changed.json || true
  fi
fi

# 3) Lint core con cache (paralelo con tests/coverage)
( pnpm -s exec eslint ${CORE_PATHS} --config "$ESLINT_CFG" --fix --cache --cache-location .eslintcache -f json -o reports/eslint.core.json || true ) &

# 4) Tests + cobertura V8 (solo summary JSON)
( pnpm -w -r --if-present exec vitest run --coverage.enabled --coverage.provider=v8 --reporter=json --outputFile=reports/coverage.json || true ) &

# 5) Duplicados y leaks solo en core (rápido)
( pnpm -s dlx jscpd "${CORE_PATHS}/**/*.{ts,tsx,js,jsx}" --threshold 85 --reporters json --output reports/jscpd || true ) &
( gitleaks detect --no-git --report-format json --report-path reports/gitleaks.json || true ) &

wait

# 6) Escaneo NO_DEPLOY en workflows (hard guard)
rg -n "az |azd |terraform |kubectl |helm |docker push" .github/workflows 2>/dev/null | sed "s/^/- /" > reports/deploy_cmds.txt || true
rg -n "DEPLOY_ENABLED:\s*[\"']?true[\"']?" .github/workflows 2>/dev/null | sed "s/^/- /" > reports/deploy_flags.txt || true

# 7) Resumen único (score ponderado) + planes
node - << "JS"
const fs=require("fs");
function J(p,d){try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch(e){return d}}
const ec = J("reports/eslint.core.json",[]);
const ch = J("reports/eslint.changed.json",[]);
const cov= J("reports/coverage.json",{total:{lines:{pct:0}}});
const dup= J("reports/jscpd/jscpd-report.json",{statistics:{duplication:0,percentage:0,clones:0}});
const gl = J("reports/gitleaks.json",{findings:[]});
const dep1 = (fs.existsSync("reports/deploy_cmds.txt")?fs.readFileSync("reports/deploy_cmds.txt","utf8").trim().split("\n").filter(Boolean):[]);
const dep2 = (fs.existsSync("reports/deploy_flags.txt")?fs.readFileSync("reports/deploy_flags.txt","utf8").trim().split("\n").filter(Boolean):[]);

const sum = (arr)=>arr.reduce((a,f)=>{a.err+=(f.errorCount||0);a.warn+=(f.warningCount||0);return a;},{err:0,warn:0});
const ESL_CORE = sum(Array.isArray(ec)?ec:[ec]);
const ESL_CH   = sum(Array.isArray(ch)?ch:[ch]);
const coverage = cov?.total?.lines?.pct ?? 0;
const dupPct   = dup?.statistics?.duplication ?? dup?.statistics?.percentage ?? 0;
const leaks    = Array.isArray(gl.findings)? gl.findings.length : 0;
const noDeployOk = dep1.length===0 && dep2.length===0;

// Score (prioriza velocidad/calidad core)
const score = Math.round(
  (Math.min(coverage,100)*0.45) +
  ((ESL_CORE.err===0?100:Math.max(0,100-Math.min(ESL_CORE.err,500)))*0.25) +
  ((typeof dupPct==="number"?Math.max(0,100-dupPct*10):50)*0.15) +
  ((leaks===0?100:20)*0.15)
);

const summary = {
  phase: "F7-final",
  ok: (ESL_CORE.err===0) && noDeployOk,
  eslint_core_errors: ESL_CORE.err,
  eslint_core_warnings: ESL_CORE.warn,
  eslint_changed_errors: ESL_CH.err,
  coverage_lines_pct: coverage,
  jscpd_dup_pct: dupPct, jscpd_clones: dup?.statistics?.clones ?? 0,
  secret_leaks: leaks,
  no_deploy_ok: noDeployOk,
  score
};
fs.writeFileSync("reports/summary.json", JSON.stringify(summary,null,2));

// Plan mínimo si NO-GO
if(!summary.ok){
  const plan = [
    "# GAP F7 (auto)",
    `- ESLint(core) errores: ${ESL_CORE.err}`,
    `- Coverage: ${coverage}%`,
    `- Duplicación: ${dupPct}%`,
    `- Gitleaks findings: ${leaks}`,
    noDeployOk? "- NO_DEPLOY: OK" : "- NO_DEPLOY: FALLA (revisa reports/deploy_*.txt)"
  ].join("\n");
  fs.mkdirSync("docs/audit",{recursive:true});
  fs.writeFileSync("docs/audit/GAP_F7.md", plan+"\n");
}
console.log(fs.readFileSync("reports/summary.json","utf8"));
JS

# 8) Commit
git add -A
git commit -m "chore(F7-final): lint incremental+core con cache, tests+coverage V8, dup+leaks core, NO_DEPLOY scan, resumen único [no_deploy]" || true

# 9) Salida mínima requerida
cat reports/summary.json
echo -e "\nARTIFACTS:\n- reports/summary.json\n- reports/eslint.changed.json (si hubo cambios)\n- reports/eslint.core.json\n- reports/coverage.json\n- reports/jscpd/jscpd-report.json\n- reports/gitleaks.json\n- reports/deploy_cmds.txt\n- reports/deploy_flags.txt\n- docs/audit/GAP_F7.md (si NO-GO)\n"