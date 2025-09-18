#!/usr/bin/env bash
set -euo pipefail
RG="appsvc_linux_northeurope_basic"
WEBAPP="econeura-api-dev"

echo "[deploy] Building and zipping app..."
cd apps/api/src/cockpit.api
npm ci --no-audit --no-fund
zip -r ../../tmp/deploy.zip . -x node_modules/* .git/* || true

echo "[deploy] Uploading zip to Azure WebApp: $WEBAPP ..."
az webapp deployment source config-zip --resource-group "$RG" --name "$WEBAPP" --src ../../tmp/deploy.zip

HOST=$(az webapp show -g "$RG" -n "$WEBAPP" --query defaultHostName -o tsv)
echo "[deploy] Waiting for health at https://$HOST/health ..."
sleep 6
HTTP=$(curl -sS -o /dev/null -w "%{http_code}" "https://$HOST/health" || echo "000")
if [ "$HTTP" = "200" ]; then
  echo "[deploy] HEALTH OK"
  exit 0
else
  echo "[deploy] HEALTH FAILED with HTTP=$HTTP"
  exit 2
fi
