#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create-sp-and-secrets.sh <subscriptionId> <resourceGroup> [<gh_owner> <gh_repo> <gh_token>]
# Example: ./scripts/create-sp-and-secrets.sh 00000000-0000-0000-0000-000000000000 rg-econeura-dev myorg myrepo $GITHUB_TOKEN

SUBSCRIPTION_ID=${1:-}
RESOURCE_GROUP=${2:-rg-econeura-dev}
GH_OWNER=${3:-}
GH_REPO=${4:-}
GH_TOKEN=${5:-}

if [ -z "$SUBSCRIPTION_ID" ]; then
  echo "Usage: $0 <subscriptionId> <resourceGroup> [<gh_owner> <gh_repo> <gh_token>]"
  exit 1
fi

echo "Setting subscription to $SUBSCRIPTION_ID"
az account set --subscription "$SUBSCRIPTION_ID"

echo "Creating Service Principal scoped to resource group $RESOURCE_GROUP"
SP_OUTPUT=$(az ad sp create-for-rbac --name "http://econeura-ci-$RANDOM" --role "Contributor" --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" --sdk-auth)

echo "Service Principal created. Output (JSON):"
echo "$SP_OUTPUT"

clientId=$(echo "$SP_OUTPUT" | python -c "import sys, json; print(json.load(sys.stdin)['clientId'])")
clientSecret=$(echo "$SP_OUTPUT" | python -c "import sys, json; print(json.load(sys.stdin)['clientSecret'])")
tenantId=$(echo "$SP_OUTPUT" | python -c "import sys, json; print(json.load(sys.stdin)['tenantId'])")
subscriptionId=$(echo "$SP_OUTPUT" | python -c "import sys, json; print(json.load(sys.stdin)['subscriptionId'])")

echo "ClientId: $clientId"
echo "TenantId: $tenantId"

if [ -n "$GH_OWNER" ] && [ -n "$GH_REPO" ] && [ -n "$GH_TOKEN" ]; then
  echo "Uploading secrets to GitHub Actions for $GH_OWNER/$GH_REPO"

  set +e
  gh_secret_url="https://api.github.com/repos/$GH_OWNER/$GH_REPO/actions/secrets/public-key"
  public_key_resp=$(curl -s -H "Authorization: Bearer $GH_TOKEN" "$gh_secret_url")
  set -e

  key_id=$(echo "$public_key_resp" | python -c "import sys,json; print(json.load(sys.stdin)['key_id'])")
  key=$(echo "$public_key_resp" | python -c "import sys,json; print(json.load(sys.stdin)['key'])")

  if [ -z "$key_id" ] || [ -z "$key" ]; then
    echo "Failed to get GitHub public key; check token and repo permissions"
    exit 1
  fi

  # function to encrypt with Ruby/Node could be added; to keep script minimal, we use gh CLI if available
  if command -v gh >/dev/null 2>&1; then
    echo "Using gh CLI to set secrets"
    echo "$SP_OUTPUT" | gh secret set AZURE_CREDENTIALS --body - --repo "$GH_OWNER/$GH_REPO"
    gh secret set AZURE_CLIENT_ID --body "$clientId" --repo "$GH_OWNER/$GH_REPO"
    gh secret set AZURE_CLIENT_SECRET --body "$clientSecret" --repo "$GH_OWNER/$GH_REPO"
    gh secret set AZURE_TENANT_ID --body "$tenantId" --repo "$GH_OWNER/$GH_REPO"
    gh secret set AZURE_SUBSCRIPTION_ID --body "$subscriptionId" --repo "$GH_OWNER/$GH_REPO"
    echo "Secrets set via gh CLI"
  else
    echo "gh CLI not available; print secrets (copy them to GitHub repo secrets manually):"
    echo "AZURE_CREDENTIALS: $SP_OUTPUT"
    echo "AZURE_CLIENT_ID: $clientId"
    echo "AZURE_CLIENT_SECRET: $clientSecret"
    echo "AZURE_TENANT_ID: $tenantId"
    echo "AZURE_SUBSCRIPTION_ID: $subscriptionId"
  fi
fi

echo "Done."
