OIDC setup for GitHub Actions and Azure
=====================================

This folder contains a helper script to create an Azure AD App Registration and a federated identity credential
that allows GitHub Actions to authenticate to Azure using OIDC (no client secret needed).

Files
- `create-oidc-federation.sh`: Bash script that creates the App Registration, Service Principal, federated identity credential
  (via Microsoft Graph REST) and assigns a role to the created identity on a target Resource Group.

Prerequisites
- `az` CLI installed and you are logged in (`az login`).
- `jq` installed (the script uses `jq` to parse JSON). Install with `brew install jq` on macOS.
- You must have sufficient privileges to register applications in Azure AD and assign roles on the target Resource Group.
  - Creating a federated identity credential requires permissions to write to the application object (App Registration). Global Admin or Application Administrator roles are typically required.

Quick start
1. Set environment variables and run the script:

```bash
export GITHUB_REPO="ECONEURA/ECONEURA-IA"
export TARGET_RG="econeura-staging-rg"
./create-oidc-federation.sh
```

2. The script will print `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID` - use those values in your GitHub Actions workflow `azure/login` step (no secret required).

Example GitHub Actions snippet (OIDC)

```yaml
- name: Login to Azure
  uses: azure/login@v1
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }} # optional - you can store the client-id as secret or set it in the workflow env
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

Notes & security
- The federated credential created limits which repo+ref can exchange tokens. The default subject is `repo:ORG/REPO:ref:refs/heads/main`.
- To support multiple branches or workflows, change the `GITHUB_REF` argument when running the script, e.g. `refs/heads/*` or `refs/tags/*`.
- If you cannot grant App Registration creation permissions, ask an admin to run the script or to create the App Registration and then provide the `appId` to you.

Next steps
- After OIDC is enabled, update `.github/workflows/deploy-staging.yml` to use the App Registration values and remove any long-lived SP secrets.
- Consider keeping a low-privilege SP as a fallback for local tasks.
