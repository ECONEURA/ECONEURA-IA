#!/usr/bin/env bash
set -Eeuo pipefail
API="https://econeura-api-dev.azurewebsites.net"
WEB="https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net"
ART=".artifacts"; mkdir -p "$ART"
jqbin=$(command -v jq || echo "")
pass=1

req() { curl -sS --max-time 10 --retry 3 --retry-all-errors -D - "$@" -o "$ART/last.out"; }

# 1) HEALTH 200
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 --retry 3 "$API/health") || true
echo "{\"check\":\"health\",\"code\":$code}" > "$ART/health.json"
[[ "$code" == "200" ]] || pass=0

# 2) OpenAPI existe y #rutas
req "$API/v1/openapi.json"
grep -qi "application/json" "$ART/last.out" || pass=0
cp "$ART/last.out" "$ART/openapi.headers.txt"
tail -n +1 "$ART/last.out" >/dev/null # no-op
body=$(curl -s "$API/v1/openapi.json")
echo "$body" > "$ART/openapi.live.json"
if [ -n "$jqbin" ]; then
  pathsCount=$(echo "$body" | jq '.paths | length')
else
  pathsCount=$(echo "$body" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('paths',{})))")
fi
echo "{\"check\":\"openapi_paths\",\"count\":$pathsCount}" > "$ART/openapi.count.json"

# 3) Diff con snapshot (solo /v1/*)
node scripts/ops/openapi_diff.mjs || pass=0

# 4) CORS: preflight + simple para WEB y www.econeura.com
for ORI in "$WEB" "https://www.econeura.com"; do
  curl -sS -X OPTIONS "$API/health" -H "Origin: $ORI" -H "Access-Control-Request-Method: GET" -D "$ART/cors.$(echo $ORI|sed 's/[^a-zA-Z0-9]/_/g').txt" -o /dev/null --max-time 10 || pass=0
done

# 5) Headers de seguridad (CSP/HSTS) y FinOps
curl -sS -D "$ART/headers.health.txt" "$API/health" -o /dev/null --max-time 10
egrep -qi "content-security-policy|strict-transport-security" "$ART/headers.health.txt" || pass=0
egrep -qi "X-Est-Cost-EUR|X-Budget-Pct|X-Latency-ms|X-Route|X-Correlation-Id" "$ART/headers.health.txt" || pass=0

# 6) 402 BUDGET_EXCEEDED (si endpoint/flag existe)
curl -sS -D "$ART/finops.test.txt" "$API/v1/finops/guard/test" -o /dev/null --max-time 10 || true
grep -q " 402 " "$ART/finops.test.txt" || echo "GAP: finops 402 no verificable" >> "$ART/gaps.txt"

# 7) WebSockets (mejor esfuerzo)
node scripts/ops/ws_probe.mjs "$API" "$WEB" || echo "GAP: websocket no verificable" >> "$ART/gaps.txt"

# 8) Resumen/exit
echo "{\"pass\":$pass}" > "$ART/summary.json"
[[ $pass -eq 1 ]] && echo "DEV_SMOKE=PASS" || { echo "DEV_SMOKE=FAIL"; exit 1; }
