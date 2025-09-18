#!/usr/bin/env bash
set -euo pipefail

# create-oidc-federation.sh
# Creates an Azure AD App Registration, creates a Service Principal, adds a GitHub Actions federated identity credential
# and assigns minimal role(s) on a target Resource Group.
#
# Usage (interactive):
#   export GITHUB_REPO="ORG/REPO"        # required, e.g. ECONEURA/ECONEURA-IA
#   export TARGET_RG="econeura-staging-rg" # required: resource group scope for role assignment
#   ./create-oidc-federation.sh
#
# Or with arguments:
#   ./create-oidc-federation.sh my-app-name ECONEURA/ECONEURA-IA my-resource-group refs/heads/main

APP_NAME=${1:-"econeura-github-oidc"}
GITHUB_REPO=${2:-${GITHUB_REPO:-}}
TARGET_RG=${3:-${TARGET_RG:-}}
GITHUB_REF=${4:-${GITHUB_REF:-"refs/heads/main"}}
ROLE=${5:-"Contributor"}

if ! command -v az >/dev/null 2>&1; then
  echo "az CLI not found. Install from https://aka.ms/InstallAzureCLI" >&2
  exit 2
fi

if [ -z "$GITHUB_REPO" ] || [ -z "$TARGET_RG" ]; then
  echo "Missing required settings. Set GITHUB_REPO and TARGET_RG environment variables or pass as args." >&2
  echo "Example: GITHUB_REPO=ECONEURA/ECONEURA-IA TARGET_RG=econeura-staging-rg $0" >&2
  exit 2
fi

echo "Checking Azure login..."
az account show >/dev/null || { echo "Not logged in. Run 'az login' first." >&2; exit 2; }

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo "Subscription: $SUBSCRIPTION_ID"
echo "Tenant: $TENANT_ID"

echo "Creating App Registration: $APP_NAME"
APP_JSON=$(az ad app create --display-name "$APP_NAME" --identifier-uris "api://${APP_NAME}" -o json)
APP_ID=$(echo "$APP_JSON" | jq -r '.appId')
APP_OBJECT_ID=$(echo "$APP_JSON" | jq -r '.id')

echo "App created: appId=$APP_ID objectId=$APP_OBJECT_ID"

echo "Creating Service Principal for the app..."
az ad sp create --id "$APP_ID" >/dev/null

SP_OBJECT_ID=$(az ad sp show --id "$APP_ID" --query objectId -o tsv)
echo "Service Principal objectId: $SP_OBJECT_ID"

echo "Creating federated identity credential for GitHub Actions..."
FED_NAME="gh-actions-${APP_NAME}"
FED_PAYLOAD=$(cat <<EOF
{
  "name": "${FED_NAME}",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GITHUB_REPO}:ref:${GITHUB_REF}",
  "description": "Federated credential for GitHub Actions from ${GITHUB_REPO} (${GITHUB_REF})",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF
)

echo "Federated credential body:\n$FED_PAYLOAD"

az rest --method POST --uri "https://graph.microsoft.com/v1.0/applications/${APP_OBJECT_ID}/federatedIdentityCredentials" \
  --headers "Content-Type=application/json" \
  --body "$FED_PAYLOAD"

echo "Federated credential created. Now assigning role '$ROLE' on resource group '$TARGET_RG' to the app principal..."

SCOPE="/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${TARGET_RG}"
az role assignment create --assignee "$APP_ID" --role "$ROLE" --scope "$SCOPE" >/dev/null

echo "Role assignment complete. Outputs you should record for GitHub Actions:" 
echo "  AZURE_CLIENT_ID=${APP_ID}"
echo "  AZURE_TENANT_ID=${TENANT_ID}"
echo "  AZURE_SUBSCRIPTION_ID=${SUBSCRIPTION_ID}"
echo "Notes: no client secret is required for OIDC. Configure your GitHub workflow to use azure/login with 'client-id' and 'tenant-id'."

echo "Example minimal GitHub Actions snippet (uses OIDC):\n\n  - name: Login to Azure
    uses: azure/login@v2
    with:
      client-id: $APP_ID
      tenant-id: $TENANT_ID
      subscription-id: $SUBSCRIPTION_ID

Remember: the federated credential limits which repo/ref can exchange tokens. Adjust 'GITHUB_REF' subject to a pattern if you need wider coverage (e.g. refs/heads/*)."

echo "Done."
