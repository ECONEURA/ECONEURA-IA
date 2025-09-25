set -euo pipefail
git rev-parse --is-inside-work-tree >/dev/null 2>&1
git checkout -B hardening/f2-opt || true
git add -A && git commit -m "snapshot: pre-F2-opt" || true
corepack enable >/dev/null 2>&1 || true; (pnpm -v >/dev/null 2>&1) || npm i -g pnpm@8.15.5
mkdir -p reports coverage-f2 docs/audit .cache/vitest

# Detectar runner disponible
node -e "const fs=require('fs');let p={};try{p=require('./package.json')}catch{};process.stdout.write(p.devDependencies?.vitest?'vitest':'dlx');" > .vitest_mode

# Config aislada
cat > vitest.f2.config.ts << "TS"
import { defineConfig } from "vitest/config";
export default defineConfig({
  cacheDir: ".cache/vitest",
  test: {
    globals: true,
    bail: 5,
    testTimeout: 20000,
    hookTimeout: 20000,
    include: [
      "apps/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "packages/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "functions/**/*.{test,spec}.{ts,tsx,js,jsx}"
    ],
    exclude: ["**/{dist,build,.next,out,node_modules}/**"],
    environment: "node",
    environmentMatchGlobs: [
      ["apps/**/web/**", "jsdom"],
      ["**/*.dom.test.*", "jsdom"],
      ["**/*.browser.test.*", "jsdom"]
    ],
    pool: "threads",
    maxConcurrency: 8,
    reporters: ["default","json"],
    outputFile: { json: "reports/vitest.json" }
  },
  coverage: {
    provider: "v8",
    reporter: ["json","text-summary"],
    reportsDirectory: "coverage-f2",
    include: ["apps/**/*.{ts,tsx,js,jsx}","packages/**/*.{ts,tsx,js,jsx}","functions/**/*.{ts,tsx,js,jsx}"],
    exclude: ["**/*.d.ts","**/{node_modules,dist,build,.next}/**"]
  }
});
TS

# Selección rápida de tests afectados
CHANGED="$(git diff --name-only --relative --diff-filter=AMR "$(git merge-base HEAD origin/HEAD || git rev-parse HEAD~1)" HEAD | grep -E "\\.(test|spec)\\.(t|j)sx?$" || true)"
CMD="vitest run -c vitest.f2.config.ts --coverage"
if [ -n "$CHANGED" ]; then
  printf "%s\n" $CHANGED > reports/f2_changed_tests.txt
  CMD="$CMD $(printf "%s " $CHANGED)"
fi

# Ejecutar con vitest local o dlx
MODE="$(cat .vitest_mode)"
if [ "$MODE" = "vitest" ]; then pnpm -s vitest --version >/dev/null 2>&1 || pnpm -w i -D vitest @vitest/coverage-v8 jsdom @types/jsdom @types/node >/dev/null 2>&1 || true;
else pnpm -s dlx -q vitest@latest --version >/dev/null 2>&1 || true; fi
if [ "$MODE" = "vitest" ]; then pnpm -s $CMD || true; else pnpm -s dlx vitest@latest $CMD || true; fi

# Métricas y gates
node - << "JS"
const fs=require("fs");
function J(p,d){try{return JSON.parse(fs.readFileSync(p,"utf8"))}catch{return d}}
const vit=J("reports/vitest.json",{tests:[]});
const cov=J("coverage-f2/coverage-final.json",{});
let tl={total:0,covered:0,pct:0};
for(const f of Object.values(cov)){ if(!f?.lines) continue; tl.total+=f.lines.total||0; tl.covered+=f.lines.covered||0; }
tl.pct = tl.total? +(100*tl.covered/tl.total).toFixed(2) : 0;
const passed=vit.tests.filter(t=>t.result?.state==="pass").length;
const failed=vit.tests.filter(t=>t.result?.state==="fail").length;
const byFile={}; vit.tests.forEach(t=>{ if(t.result?.state!=="fail") return; const k=t.file||t.path||"unknown"; (byFile[k] ||= 0)++; });
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
${top.map(x=>`- ${x.file} (${x.fails})`).join("\\n")||"-"}
## Acciones (48h)
1) Priorizar tests en archivos TOP, aislar DOM con within(container).
2) Elevar cobertura en servicios/IO críticos (use-cases y controladores).
3) Corregir a11y (roles únicos, labels, focus) en web.
`);
}
console.log(fs.readFileSync("reports/summary.json","utf8"));
JS

git add -A
git commit -m "chore(F2-opt): tests afectados + cobertura V8 + gates y GAP [no_deploy]" || true
cat reports/summary.json
echo -e "\nARTIFACTS:\n- vitest.f2.config.ts\n- reports/vitest.json\n- coverage-f2/coverage-final.json\n- reports/coverage.json\n- reports/summary.json\n- docs/audit/GAP_F2.md (si NO-GO)\n- reports/f2_changed_tests.txt (si aplica)\n"