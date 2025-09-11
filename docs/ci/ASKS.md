# CI/CD External Actions Required

Este documento lista las acciones que requieren intervención manual o permisos especiales que no pueden ser automatizadas.

## Acciones Requeridas

### 1. Configuración de Secrets de GitHub
**Dueño**: Administrador del repositorio  
**Acción**: Configurar los siguientes secrets en GitHub Settings > Secrets and variables > Actions:
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID` 
- `AZURE_SUBSCRIPTION_ID`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `POSTGRES_PASSWORD`
- `MISTRAL_BASE_URL`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_CLIENT_SECRET`
- `MAKE_WEBHOOK_HMAC_SECRET`
- `MAKE_ALLOWED_IPS`
- `TEAMS_WEBHOOK_URL`

### 2. Configuración de Environments
**Dueño**: Administrador del repositorio  
**Acción**: Crear environments en GitHub Settings > Environments:
- `dev`
- `staging` 
- `prod`

### 3. Configuración de Branch Protection Rules
**Dueño**: Administrador del repositorio  
**Acción**: Configurar branch protection en GitHub Settings > Branches:
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require pull request reviews before merging
- Restrict pushes that create files larger than 100MB

### 4. Configuración de Azure Resources
**Dueño**: Administrador de Azure  
**Acción**: Crear los siguientes recursos en Azure:
- Resource Group: `econeura-rg`
- Container Registry
- Key Vault
- App Service Plan
- PostgreSQL Database
- Application Insights

### 5. Configuración de Dependabot
**Dueño**: Administrador del repositorio  
**Acción**: Habilitar Dependabot en GitHub Settings > Security > Dependabot alerts

### 6. Configuración de Code Scanning
**Dueño**: Administrador del repositorio  
**Acción**: Habilitar CodeQL en GitHub Settings > Security > Code scanning alerts

## Comandos de Verificación

```bash
# Verificar que los secrets están configurados
gh secret list

# Verificar que los environments existen
gh api repos/:owner/:repo/environments

# Verificar branch protection rules
gh api repos/:owner/:repo/branches/main/protection
```

## Estado Actual

- [ ] Secrets configurados
- [ ] Environments creados
- [ ] Branch protection rules configuradas
- [ ] Azure resources creados
- [ ] Dependabot habilitado
- [ ] Code scanning habilitado

## Notas

- Todos los workflows están configurados con `DEPLOY_ENABLED: "false"` por defecto
- Los jobs de deploy solo se ejecutan cuando `DEPLOY_ENABLED: "true"`
- Los tests de cobertura requieren ≥80% para pasar
- Los tests de duplicados requieren ≤5% para pasar
- Los tests de OpenAPI requieren diff=0 para pasar
