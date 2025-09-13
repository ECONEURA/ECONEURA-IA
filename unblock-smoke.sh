#!/usr/bin/env bash
# === UNBLOCK ECONEURA: kill + clean + smoke UI+k6 ===
set -Eeuo pipefail

echo "[1/5] Kill procesos previos"
pkill -f 'playwright' || true
pkill -f 'ms-playwright' || true
pkill -f 'chrom(e|ium)' || true
pkill -f 'k6' || true
pkill -f 'node .*playwright' || true

echo "[2/5] Limpieza mínima"
rm -rf .artifacts/logs || true
mkdir -p .artifacts/logs
rm -rf test-results playwright-report || true

echo "[3/5] Playwright browsers solo Chromium (forzado, rápido)"
npx playwright install chromium --with-deps --force >/dev/null

echo "[4/5] UI smoke (1 spec, 1 worker, headless, 60s timeout)"
export PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL:-https://econeura-web-dev.azurewebsites.net}
CI=1 BASE_URL="$PLAYWRIGHT_BASE_URL" \
pnpm test:ui apps/web/tests/ui/cockpit.killswitch.spec.ts \
  --workers=1 --timeout=60000 --retries=0 --reporter=line \
  > .artifacts/logs/playwright.smoke.log 2>&1 || UI_RC=$? || true
UI_RC="${UI_RC:-0}"

echo "[5/5] k6 smoke (1 VU, 20s, p95)"
export K6_BASE_URL=${K6_BASE_URL:-https://econeura-api-dev.azurewebsites.net}
for i in 1 2 3 4 5; do curl -s -I "$K6_BASE_URL/v1/progress" >/dev/null || true; sleep 1; done
BASE_URL="$K6_BASE_URL" npx --yes k6@0.49.0 run tests/perf/e2e.js \
  --vus 1 --duration 20s \
  --summary-trend-stats "avg,p(95),max" \
  --summary-export .artifacts/k6.json \
  > .artifacts/logs/k6.smoke.log 2>&1 || K6_RC=$? || true
K6_RC="${K6_RC:-0}"
P95="$(node -e 'const fs=require("fs");try{const j=JSON.parse(fs.readFileSync(".artifacts/k6.json","utf8"));console.log(Math.round(j.metrics.http_req_duration["p(95)"]||0));}catch(e){console.log(0)}')"

echo; echo "=== GATES QUICK ==="
echo "UI: $([ "$UI_RC" = "0" ] && echo PASS || echo FAIL)"
echo "K6_P95_MS: $P95 ($([ "$P95" -gt 0 ] && [ "$P95" -lt 2000 ] && echo PASS || echo FAIL), th<2000)"
echo; echo "Logs: .artifacts/logs/playwright.smoke.log  |  .artifacts/logs/k6.smoke.log"

echo
echo "Si sigue colgado, revisa:"
echo " tail -n 80 .artifacts/logs/playwright.smoke.log"
echo " tail -n 80 .artifacts/logs/k6.smoke.log"
echo " du -sh ~/.cache/ms-playwright || true"
echo " ps aux | egrep 'playwright|k6|chrom|node' | egrep -v egrep"

echo
echo "Cuando el smoke pase, vuelve a ./run-ui-perf.sh o al pipeline completo."
