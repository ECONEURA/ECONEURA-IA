#!/usr/bin/env bash
# ECONEURA · UI+PERF quick runner (Playwright + k6)
# idempotente, logs en .artifacts/, salida compacta
set -Eeuo pipefail

# --- CONFIG ---
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-https://econeura-web-dev.azurewebsites.net}"
K6_BASE_URL="${K6_BASE_URL:-https://econeura-api-dev.azurewebsites.net}"
THRESHOLD_MS="${THRESHOLD_MS:-2000}"        # umbral p95 k6
WORKERS="${WORKERS:-2}"                     # workers Playwright
UITIMEOUT="${UITIMEOUT:-60000}"             # ms por test
ART=".artifacts"; LOGS="$ART/logs"; mkdir -p "$LOGS"

log(){ printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*"; }

# --- PREP: navegadores Playwright si faltan ---
if [ ! -d "$HOME/.cache/ms-playwright" ] || [ -z "$(ls -A "$HOME/.cache/ms-playwright" 2>/dev/null)" ]; then
  log "playwright: sin cache → install --with-deps"
  npx playwright install --with-deps >/dev/null
else
  log "playwright: cache detectada → skip install"
fi

# --- UI: Playwright (usa script test:ui si existe, si no fallback a playwright test) ---
log "UI: ejecutando pruebas (workers=$WORKERS, timeout=${UITIMEOUT}ms)"
if npm pkg get scripts.test:ui >/dev/null 2>&1; then
  BASE_URL="$PLAYWRIGHT_BASE_URL" pnpm test:ui --reporter=line --workers="$WORKERS" --timeout="$UITIMEOUT" >"$LOGS/playwright.log" 2>&1 || UI_RC=$? || true
else
  BASE_URL="$PLAYWRIGHT_BASE_URL" npx playwright test --reporter=line --workers="$WORKERS" --timeout="$UITIMEOUT" >"$LOGS/playwright.log" 2>&1 || UI_RC=$? || true
fi
UI_RC="${UI_RC:-0}"

# --- PERF: warmup + k6 ---
log "PERF: warmup 5 hits → $K6_BASE_URL/v1/progress"
for i in 1 2 3 4 5; do curl -s -I "$K6_BASE_URL/v1/progress" >/dev/null || true; sleep 1; done

log "PERF: k6 run (export summary)"
mkdir -p "$ART"
BASE_URL="$K6_BASE_URL" npx --yes k6@0.49.0 run tests/perf/e2e.js \
  --summary-trend-stats "avg,p(95),max" \
  --summary-export "$ART/k6.json" \
  >"$LOGS/k6.log" 2>&1 || K6_RC=$? || true
K6_RC="${K6_RC:-0}"

# --- métricas k6 ---
P95="$(node -e 'const fs=require("fs");try{const j=JSON.parse(fs.readFileSync(".artifacts/k6.json","utf8"));console.log(Math.round(j.metrics.http_req_duration["p(95)"]||0));}catch(e){console.log(0)}')"

# --- SALIDA RESUMEN ---
UI_STATUS=$([ "$UI_RC" = "0" ] && echo PASS || echo FAIL)
K6_STATUS=$([ "$P95" -gt 0 ] && [ "$P95" -lt "$THRESHOLD_MS" ] && echo PASS || echo FAIL)

echo
echo "GATES QUICK"
echo "UI: $UI_STATUS"
echo "K6_P95_MS: $P95 ($K6_STATUS, th<$THRESHOLD_MS)"
echo
echo "LOGS"
echo " - $LOGS/playwright.log"
echo " - $LOGS/k6.log"

# --- EXIT CODE ---
if [ "$UI_STATUS" = "PASS" ] && [ "$K6_STATUS" = "PASS" ]; then
  exit 0
else
  exit 1
fi
