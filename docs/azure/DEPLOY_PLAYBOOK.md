# Deploy Playbook - ECONEURA Azure

## Resumen Ejecutivo

**Objetivo:** Guía completa para deployment seguro de ECONEURA en Azure  
**Entorno:** Dev/Staging/Production  
**Estado:** ✅ **DEPLOY_ENABLED=true** (Solo DEV habilitado)

## Pre-requisitos

### 1. Configuración de Azure
- ✅ Azure CLI instalado y configurado
- ✅ OIDC configurado para GitHub Actions
- ✅ Resource Group: `econeura-rg`
- ✅ Región: `West Europe`

### 2. Secrets de GitHub
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
- `DOMAIN_NAME`

### 3. Verificaciones Pre-Deploy
- ✅ Código compilado sin errores
- ✅ Tests pasando
- ✅ OpenAPI diff = 0
- ✅ Duplicados ≤ 50
- ✅ jscpd ≤ 5%

## Proceso de Deployment

### Fase 1: Preparación
```bash
# 1. Verificar estado del repositorio
bash scripts/verify-repo.sh
# Debe mostrar: VERIFY=PASS

# 2. Verificar secrets de Azure
az account show
az group show --name econeura-rg

# 3. Verificar conectividad
curl -f https://api.econeura.dev/health
```

### Fase 2: Deployment Manual (Workflow Dispatch)
1. **Ir a GitHub Actions**
2. **Seleccionar workflow:** "Deploy to Azure"
3. **Ejecutar workflow manualmente:**
   - Environment: `dev` (solo habilitado)
   - Skip infrastructure: `false` (primera vez)
4. **Monitorear progreso:**
   - Infrastructure Deployment
   - Build and Push Images
   - Deploy Applications
   - Database Migration
   - Smoke Tests

### Fase 3: Verificación Post-Deploy
```bash
# 1. Health checks
curl -f https://api-dev.econeura.dev/health
curl -f https://web-dev.econeura.dev

# 2. Smoke tests automáticos
# Se ejecutan automáticamente en el workflow

# 3. Verificar logs
az containerapp logs show \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --follow
```

## Entornos Disponibles

### DEV (Habilitado)
- **URL API:** `https://api-dev.econeura.dev`
- **URL Web:** `https://web-dev.econeura.dev`
- **Resource Prefix:** `econeura-dev`
- **Auto-deploy:** ✅ Habilitado

### Staging (Bloqueado)
- **Estado:** ❌ Bloqueado por seguridad
- **Razón:** Requiere aprobación manual
- **Acceso:** Solo con workflow_dispatch

### Production (Bloqueado)
- **Estado:** ❌ Bloqueado por seguridad
- **Razón:** Requiere aprobación manual + review
- **Acceso:** Solo con workflow_dispatch + approval

## Monitoreo y Alertas

### Health Checks
- **API Health:** `/health` endpoint
- **Database:** PostgreSQL connectivity
- **External APIs:** Mistral, Azure OpenAI
- **Container Apps:** Azure Container Apps status

### Métricas Clave
- **Response Time:** < 2 segundos
- **Error Rate:** < 1%
- **Uptime:** > 99.9%
- **Memory Usage:** < 80%

### Alertas Configuradas
- **Application Insights:** Error rate > 5%
- **Azure Monitor:** CPU > 80%
- **Teams Webhook:** Deployment notifications

## Troubleshooting

### Problemas Comunes

#### 1. Deployment Falla
```bash
# Verificar logs del workflow
gh run list --workflow="Deploy to Azure"
gh run view <run-id>

# Verificar estado de Azure
az containerapp list --resource-group econeura-rg
az deployment group list --resource-group econeura-rg
```

#### 2. Health Check Falla
```bash
# Verificar logs de la aplicación
az containerapp logs show \
  --name econeura-devapi \
  --resource-group econeura-rg

# Verificar conectividad de base de datos
az postgres flexible-server show \
  --name econeura-dev-postgres \
  --resource-group econeura-rg
```

#### 3. Performance Issues
```bash
# Verificar métricas de Application Insights
az monitor app-insights component show \
  --app econeura-dev-insights \
  --resource-group econeura-rg

# Verificar escalado automático
az containerapp show \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --query properties.configuration.ingress
```

## Rollback Plan

### Rollback Automático
- **Trigger:** Smoke tests fallan
- **Acción:** Revertir a imagen anterior
- **Tiempo:** < 5 minutos

### Rollback Manual
```bash
# 1. Identificar imagen anterior
az containerapp revision list \
  --name econeura-devapi \
  --resource-group econeura-rg

# 2. Activar revisión anterior
az containerapp revision activate \
  --name econeura-devapi \
  --resource-group econeura-rg \
  --revision <previous-revision>

# 3. Verificar rollback
curl -f https://api-dev.econeura.dev/health
```

## Seguridad

### Principios Aplicados
- ✅ **No secrets en repo:** Todos los secrets en GitHub Secrets
- ✅ **OIDC:** Autenticación sin passwords
- ✅ **Network Security:** VNet y Private Endpoints
- ✅ **Encryption:** En tránsito y en reposo
- ✅ **Access Control:** RBAC y Managed Identity

### Compliance
- ✅ **GDPR:** Data processing compliance
- ✅ **SOC 2:** Security controls
- ✅ **ISO 27001:** Information security

## Contactos de Emergencia

### Escalación
1. **Nivel 1:** DevOps Team
2. **Nivel 2:** Engineering Lead
3. **Nivel 3:** CTO

### Canales
- **Teams:** #econeura-devops
- **Email:** devops@econeura.dev
- **Phone:** +34 XXX XXX XXX (emergencias)

---

**Última actualización:** 2025-09-10  
**Versión:** 1.0  
**Estado:** ✅ **READY FOR DEPLOY**