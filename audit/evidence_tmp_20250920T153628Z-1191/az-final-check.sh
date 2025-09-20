#!/usr/bin/env bash
set -euo pipefail
RG="${RG:-appsvc_linux_northeurope_basic}"
WEB="${WEB:-econeura-web-dev}"
API="${API:-econeura-api-dev}"

require(){ command -v "$1" >/dev/null || { echo "$1 missing"; exit 2; }; }
require az; require curl; require awk
az account show >/dev/null 2>&1 || az login --use-device-code >/dev/null

ART=".artifacts"; mkdir -p "$ART"
TS="$(date -u +%Y%m%d-%H%M%SZ)"; OUT="$ART/az-final-$TS.txt"

WEB_FQDN="$(az webapp show -g "$RG" -n "$WEB" --query defaultHostName -o tsv)"
WEB_URL="https://${WEB_FQDN}"
API_URL="https://${API}.azurewebsites.net"
HP="$(az webapp show -g "$RG" -n "$API" --query siteConfig.healthCheckPath -o tsv)"; [ -z "${HP:-}" ] && HP="/health"

for i in 1 2 3 4 5; do curl -sS --max-time 10 "$API_URL$HP" >/dev/null || true; sleep 1; done
code(){ curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$1"; }
preflight(){ local o="$1"; curl -s -D - -o /dev/null -X OPTIONS "$API_URL/" -H "Origin: $o" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: content-type,authorization" --max-time 10; }

WEB_CODE="$(code "$WEB_URL/")"
API_ROOT="$(code "$API_URL/")"
API_HEALTH="$(code "$API_URL$HP")"
APP_URL="$(az webapp config appsettings list -g "$RG" -n "$WEB" --query "[?name=='NEXT_PUBLIC_API_URL'].value | [0]" -o tsv)"
FX="$(az webapp show -g "$RG" -n "$API" --query siteConfig.linuxFxVersion -o tsv)"
CORS_ALLOWED="$(az webapp cors show -g "$RG" -n "$API" --query allowedOrigins -o tsv | paste -sd',' -)"
RULES="$(az webapp config access-restriction show -g "$RG" -n "$API" --query "ipSecurityRestrictions[].ipAddress" -o tsv)"
ZERO="$(printf "%s\n" "$RULES" | grep -c '0.0.0.0/0' || true)"
SCM_SAME="$(az webapp config access-restriction show -g "$RG" -n "$API" --query "<REDACTED>" -o tsv)"

HDR_WEB="$(preflight "$WEB_URL")"; CODE_WEB="$(echo "$HDR_WEB" | awk 'NR==1{print $2}')"; ACAO_WEB="$(echo "$HDR_WEB" | awk -F': ' '/Access-Control-Allow-Origin/{print $2;exit}' | tr -d '\r')"
HDR_PUB="$(preflight "https://www.econeura.com")"; CODE_PUB="$(echo "$HDR_PUB" | awk 'NR==1{print $2}')"; ACAO_PUB="$(echo "$HDR_PUB" | awk -F': ' '/Access-Control-Allow-Origin/{print $2;exit}' | tr -d '\r')"

PASS=true; REASONS=()
[ "$WEB_CODE" = "200" ] || { PASS=false; REASONS+=("Web HEAD!=200"); }
[ "$API_ROOT" = "200" ] || { PASS=false; REASONS+=("API / HEAD!=200"); }
[ "$API_HEALTH" = "200" ] || { PASS=false; REASONS+=("API $HP!=200"); }
[ "$APP_URL" = "$API_URL" ] || { PASS=false; REASONS+=("NEXT_PUBLIC_API_URL!=$API_URL"); }
[ "$FX" = "NODE|20-lts" ] || { PASS=false; REASONS+=("Runtime!='NODE|20-lts'"); }
[ "$ZERO" -eq 0 ] || { PASS=false; REASONS+=("AccessRules contiene 0.0.0.0/0"); }
[ "$SCM_SAME" = "true" ] || { PASS=false; REASONS+=("SCM no hereda restricciones"); }
[[ "$CODE_WEB" =~ ^20[0-9]$ ]] || { PASS=false; REASONS+=("Preflight WEB_CODE=$CODE_WEB"); }
[[ "$CODE_PUB" =~ ^20[0-9]$ ]] || { PASS=false; REASONS+=("Preflight PUB_CODE=$CODE_PUB"); }
[ -n "${ACAO_WEB:-}" ] || { PASS=false; REASONS+=("Sin ACAO para WEB_URL"); }
[ -n "${ACAO_PUB:-}" ] || { PASS=false; REASONS+=("Sin ACAO para www.econeura.com"); }

{
  echo "RESULTADOS"
  echo "WEB_URL=$WEB_URL"
  echo "API_URL=$API_URL"
  echo "HEALTH_PATH=$HP"
  echo "WEB_CODE=$WEB_CODE"
  echo "API_CODE_ROOT=$API_ROOT"
  echo "API_CODE_HEALTH=$API_HEALTH"
  echo "NEXT_PUBLIC_API_URL=$APP_URL"
  echo "FX=$FX"
  echo "CORS_ALLOWED=${CORS_ALLOWED:-none}"
  echo "AccessRules_ZeroCIDR=$ZERO"
  echo "SCM_UseMainRules=$SCM_SAME"
  echo "Preflight_WEB: code=$CODE_WEB acao=${ACAO_WEB:-}"
  echo "Preflight_PUB: code=$CODE_PUB acao=${ACAO_PUB:-}"
  if $PASS; then echo "RESULTADO: PASS"; else echo "RESULTADO: FAIL"; printf 'CAUSAS: %s\n' "$(IFS='; '; echo "${REASONS[*]}")"; fi
  echo "REPORTE: $OUT"
} | tee "$OUT"
