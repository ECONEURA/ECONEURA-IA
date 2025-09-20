#!/usr/bin/env bash
set -euo pipefail
RG="appsvc_linux_northeurope_basic"

echo "[infra-test] Checking webapps..."
az webapp show -g $RG -n econeura-api-dev --query "{name:name,host:defaultHostName,state:state}" -o json || true
az webapp show -g $RG -n econeura-web-dev --query "{name:name,host:defaultHostName,state:state}" -o json || true

echo "[infra-test] Listing KeyVaults and ACR in RG..."
az keyvault list -g $RG -o table || echo "No KeyVaults or insufficient permissions"
az acr list -g $RG -o table || echo "No ACR or insufficient permissions"

echo "[infra-test] Done."
