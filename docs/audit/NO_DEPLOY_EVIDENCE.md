# No Deploy Evidence

## Workflow references
- .github/workflows/deploy.yml:204 `az containerapp update`
- .github/workflows/deploy.yml:230 `az containerapp update`
- .github/workflows/deploy.yml:244 `az functionapp deployment source config-zip`

## Repository commands
- docs/deployment-guide.md:106 `az webapp config backup create`
- docs/DEPLOYMENT.md:346 `az webapp log tail`
- ops/azure-pack/hardening.sh:7 `az webapp config set`
- scripts/deploy.sh:354 `az webapp deployment source config-zip`
- infrastructure/azure/README.md:242 `az webapp config hostname add`

These lines show where deployment-related commands exist. No deployment was executed during this audit.
