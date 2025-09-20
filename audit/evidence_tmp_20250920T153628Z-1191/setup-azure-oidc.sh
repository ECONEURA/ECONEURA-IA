#!/usr/bin/env bash
set -euo pipefail

# Script para crear App Registration + federated credential para GitHub Actions (OIDC)
# Uso: bash scripts/setup-azure-oidc.sh
# Requiere: az (Azure CLI), jq

function err() { echo "ERROR: $*" >&2; exit 1; }

command -v az >/dev/null 2>&1 || err "Azure CLI (az) no encontrado. Instala con: brew install azure-cli or https://aka.ms/InstallAzureCLIDeb"
command -v jq >/dev/null 2>&1 || err "jq no encontrado. Instala con: brew install jq"

echo "Comprobando sesión Azure..."
az account show >/dev/null 2>&1 || { echo "No hay sesión activa. Ejecuta: az login --use-device-code y vuelve a ejecutar este script."; exit 1; }

read -r -p "Nombre para la App Registration (ej: ec-action-oidc): " APP_NAME
read -r -p "Subscription ID (scope donde asignar rol): " SUBSCRIPTION_ID
read -r -p "GitHub repo owner (ej: ECONEURA): " REPO_OWNER
read -r -p "GitHub repo name (ej: ECONEURA-IA): " REPO_NAME
read -r -p "Branch/ref pattern para permitir (ej: refs/heads/main) o deja vacío para cualquier branch: " BRANCH_PATTERN
read -r -p "Scope para role assignment (subscription or resourceGroup). Default=subscriptions: " SCOPE_INPUT

if [ -z "$SCOPE_INPUT" ]; then
  SCOPE="/subscriptions/${SUBSCRIPTION_ID}"
else
  SCOPE="$SCOPE_INPUT"
fi

TMP_JSON="/tmp/${APP_NAME}-app.json"

echo "Creando App Registration..."
az ad app create --display-name "$APP_NAME" --available-to-other-tenants false --query "{appId:appId,objectId:id}" -o json > "$TMP_JSON"
CLIENT_ID=$(jq -r .appId "$TMP_JSON")
APP_OBJECT_ID=$(jq -r .objectId "$TMP_JSON")

if [ -z "$CLIENT_ID" ] || [ -z "$APP_OBJECT_ID" ]; then
  echo "No se pudieron obtener clientId/objectId desde la salida de az. Contenido:"
  cat "$TMP_JSON"
  exit 1
fi

echo "Client ID: $CLIENT_ID"
echo "App Object ID: $APP_OBJECT_ID"

# Construir subject para federated credential
if [ -n "$BRANCH_PATTERN" ]; then
  SUBJECT="repo:${REPO_OWNER}/${REPO_NAME}:ref:${BRANCH_PATTERN}"
else
  SUBJECT="repo:${REPO_OWNER}/${REPO_NAME}:ref:refs/heads/*"
fi

# Crear federated credential
echo "Creando federated credential para subject: $SUBJECT"
az ad app federated-credential create --id "$APP_OBJECT_ID" --parameters "{\"name\": \"github-actions-${REPO_OWNER}-${REPO_NAME}\", \"issuer\": \"https://token.actions.githubusercontent.com\", \"subject\": \"${SUBJECT}\", \"description\": \"Federated credential for GitHub Actions\" }"

echo "Creando Service Principal (registro en AAD) si no existe..."
az ad sp create --id "$CLIENT_ID" || true

# Asignar rol (recomendado: restringir al resource group si puedes)
echo "Asignando rol 'Contributor' al scope: $SCOPE"
az role assignment create --assignee "$CLIENT_ID" --role "Contributor" --scope "$SCOPE" || echo "Warning: role assignment fallo (posible que falten permisos)."

TENANT_ID=$(az account show --query tenantId -o tsv)

cat <<EOF

Hecho.
Valores importantes:
  CLIENT_ID (appId): $CLIENT_ID
  APP_OBJECT_ID: $APP_OBJECT_ID
  TENANT_ID: $TENANT_ID
  SUBSCRIPTION_ID: $SUBSCRIPTION_ID

Guarda en GitHub Secrets del repo:
  AZURE_CLIENT_ID = $CLIENT_ID
  AZURE_TENANT_ID = $TENANT_ID
  AZURE_SUBSCRIPTION_ID = $SUBSCRIPTION_ID

Ejemplo de workflow (usa azure/login@v2):
  permissions:
    id-token: write
    contents: read

  - uses: azure/login@v2
    with:
      client-id: \\${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: \\${{ secrets.AZURE_TENANT_ID }}
      subscription-id: \\${{ secrets.AZURE_SUBSCRIPTION_ID }}

Nota: Para seguridad, en lugar de usar 'Contributor' crea un role con permisos mínimos.

EOF

# limpiar
rm -f "$TMP_JSON"

exit 0
