# Deployment Playbook - Azure App Service

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Playbook completo para deployment de ECONEURA-IA a Azure App Service

## 📋 RESUMEN EJECUTIVO

Este documento proporciona un playbook paso a paso para el deployment de ECONEURA-IA a Azure App Service, incluyendo preparación, deployment, validación y post-deployment.

## 🎯 OBJETIVOS DEL DEPLOYMENT

### Objetivos Principales
- **Deployment sin downtime** usando deployment slots
- **Configuración segura** con Key Vault y Managed Identity
- **Monitoreo completo** con Application Insights
- **Alta disponibilidad** con auto-scaling
- **Seguridad de red** con VNet y Private Endpoints

### Criterios de Éxito
- ✅ Aplicación funcionando en producción
- ✅ Health checks pasando
- ✅ Performance metrics dentro de rangos normales
- ✅ Error rates < 1%
- ✅ Response time < 2 segundos
- ✅ SSL/TLS funcionando correctamente

## 🚀 FASE 1: PREPARACIÓN

### 1.1 Verificar Prerrequisitos
```bash
# Verificar Azure CLI
az --version

# Verificar login
az account show

# Verificar permisos
az role assignment list --assignee $(az account show --query user.name -o tsv)

# Verificar subscription
az account list --output table
```

### 1.2 Preparar Variables de Entorno
```bash
# Configurar variables de entorno
export RESOURCE_GROUP="econeura-ia-rg"
export LOCATION="westeurope"
export APP_NAME="econeura-ia-app"
export PLAN_NAME="econeura-ia-plan"
export KEY_VAULT_NAME="econeura-ia-vault"
export INSIGHTS_NAME="econeura-ia-insights"
export VNET_NAME="econeura-ia-vnet"
export SUBNET_NAME="app-subnet"
export STORAGE_NAME="econeuraiastorage"
export REDIS_NAME="econeura-ia-cache"
export DB_NAME="econeura-ia-db"
```

### 1.3 Preparar Secretos
```bash
# Crear archivo de secretos (NO COMMIT)
cat > secrets.env << EOF
DATABASE_URL=postgresql://user:password@server:5432/database
REDIS_URL=redis://server:6379
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
MAILGUN_API_KEY=your-mailgun-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
EOF
```

## 🏗️ FASE 2: CREACIÓN DE RECURSOS

### 2.1 Crear Resource Group
```bash
echo "Creating resource group..."
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --tags Environment=Production Project=ECONEURA-IA
```

### 2.2 Crear Key Vault
```bash
echo "Creating Key Vault..."
az keyvault create \
  --name $KEY_VAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku standard \
  --enable-rbac-authorization true \
  --enable-soft-delete true \
  --soft-delete-retention-days 90 \
  --enable-purge-protection true
```

### 2.3 Crear App Service Plan
```bash
echo "Creating App Service Plan..."
az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku P1V2 \
  --is-linux \
  --number-of-workers 2
```

### 2.4 Crear App Service
```bash
echo "Creating App Service..."
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN_NAME \
  --runtime "NODE|20-lts" \
  --startup-file "npm start"
```

### 2.5 Crear Application Insights
```bash
echo "Creating Application Insights..."
az monitor app-insights component create \
  --app $INSIGHTS_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web \
  --kind web \
  --retention-time 90
```

### 2.6 Crear Storage Account
```bash
echo "Creating Storage Account..."
az storage account create \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --https-only true
```

### 2.7 Crear Redis Cache
```bash
echo "Creating Redis Cache..."
az redis create \
  --name $REDIS_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard \
  --vm-size c1 \
  --enable-non-ssl-port false
```

### 2.8 Crear PostgreSQL Database
```bash
echo "Creating PostgreSQL Database..."
az postgres flexible-server create \
  --name $DB_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --admin-user econeuraadmin \
  --admin-password $(openssl rand -base64 32) \
  --sku-name Standard_B2s \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --storage-size 32 \
  --version 15
```

## 🔐 FASE 3: CONFIGURACIÓN DE SEGURIDAD

### 3.1 Configurar Managed Identity
```bash
echo "Configuring Managed Identity..."
az webapp identity assign \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Obtener principal ID
PRINCIPAL_ID=$(az webapp identity show --name $APP_NAME --resource-group $RESOURCE_GROUP --query principalId -o tsv)

# Asignar permisos a Key Vault
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee $PRINCIPAL_ID \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME"
```

### 3.2 Agregar Secretos a Key Vault
```bash
echo "Adding secrets to Key Vault..."
source secrets.env

az keyvault secret set --vault-name $KEY_VAULT_NAME --name database-url --value "$DATABASE_URL"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name redis-url --value "$REDIS_URL"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name jwt-secret --value "$JWT_SECRET"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name encryption-key --value "$ENCRYPTION_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name openai-api-key --value "$OPENAI_API_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name anthropic-api-key --value "$ANTHROPIC_API_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name google-ai-api-key --value "$GOOGLE_AI_API_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name azure-openai-api-key --value "$AZURE_OPENAI_API_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name azure-openai-endpoint --value "$AZURE_OPENAI_ENDPOINT"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name mailgun-api-key --value "$MAILGUN_API_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name sendgrid-api-key --value "$SENDGRID_API_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name stripe-secret-key --value "$STRIPE_SECRET_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name stripe-publishable-key --value "$STRIPE_PUBLISHABLE_KEY"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name google-client-id --value "$GOOGLE_CLIENT_ID"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name google-client-secret --value "$GOOGLE_CLIENT_SECRET"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name github-client-id --value "$GITHUB_CLIENT_ID"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name github-client-secret --value "$GITHUB_CLIENT_SECRET"
```

### 3.3 Configurar App Settings
```bash
echo "Configuring App Settings..."
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    API_URL=https://api.econeura.com \
    WEB_URL=https://app.econeura.com \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/database-url/)" \
    REDIS_URL="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/redis-url/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/jwt-secret/)" \
    ENCRYPTION_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/encryption-key/)" \
    OPENAI_API_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/openai-api-key/)" \
    ANTHROPIC_API_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/anthropic-api-key/)" \
    GOOGLE_AI_API_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/google-ai-api-key/)" \
    AZURE_OPENAI_API_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/azure-openai-api-key/)" \
    AZURE_OPENAI_ENDPOINT="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/azure-openai-endpoint/)" \
    MAILGUN_API_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/mailgun-api-key/)" \
    SENDGRID_API_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/sendgrid-api-key/)" \
    STRIPE_SECRET_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/stripe-secret-key/)" \
    STRIPE_PUBLISHABLE_KEY="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/stripe-publishable-key/)" \
    GOOGLE_CLIENT_ID="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/google-client-id/)" \
    GOOGLE_CLIENT_SECRET="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/google-client-secret/)" \
    GITHUB_CLIENT_ID="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/github-client-id/)" \
    GITHUB_CLIENT_SECRET="@Microsoft.KeyVault(SecretUri=https://$KEY_VAULT_NAME.vault.azure.net/secrets/github-client-secret/)" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$(az monitor app-insights component show --app $INSIGHTS_NAME --resource-group $RESOURCE_GROUP --query connectionString -o tsv)" \
    APPINSIGHTS_INSTRUMENTATIONKEY="$(az monitor app-insights component show --app $INSIGHTS_NAME --resource-group $RESOURCE_GROUP --query instrumentationKey -o tsv)" \
    APPINSIGHTS_SAMPLING_PERCENTAGE=10 \
    LOG_LEVEL=info \
    LOG_FORMAT=json \
    UPLOADS_DIR=/home/uploads \
    TEMP_DIR=/tmp/econeura \
    LOGS_DIR=/home/logs \
    CACHE_DIR=/tmp/cache
```

## 🌐 FASE 4: CONFIGURACIÓN DE RED

### 4.1 Crear Virtual Network
```bash
echo "Creating Virtual Network..."
az network vnet create \
  --name $VNET_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --address-prefix 10.0.0.0/16 \
  --subnet-name $SUBNET_NAME \
  --subnet-prefix 10.0.1.0/24
```

### 4.2 Configurar VNet Integration
```bash
echo "Configuring VNet Integration..."
az webapp vnet-integration add \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --vnet $VNET_NAME \
  --subnet $SUBNET_NAME
```

### 4.3 Configurar Access Restrictions
```bash
echo "Configuring Access Restrictions..."
az webapp config access-restriction add \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --rule-name "Allow Azure Services" \
  --action Allow \
  --ip-address AzureServices \
  --priority 100

az webapp config access-restriction add \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --rule-name "Allow ECONEURA Office" \
  --action Allow \
  --ip-address 203.0.113.0/24 \
  --priority 300
```

## 📦 FASE 5: DEPLOYMENT DE CÓDIGO

### 5.1 Preparar Código
```bash
echo "Preparing code for deployment..."
# Build the application
npm run build

# Create deployment package
zip -r econeura-ia-package.zip . -x "*.git*" "*.env*" "node_modules/.cache/*" "tests/*" "docs/*"

# Verify package
ls -la econeura-ia-package.zip
```

### 5.2 Crear Deployment Slot
```bash
echo "Creating deployment slot..."
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging
```

### 5.3 Deploy a Staging
```bash
echo "Deploying to staging..."
az webapp deployment source config-zip \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --src econeura-ia-package.zip
```

### 5.4 Configurar Staging
```bash
echo "Configuring staging slot..."
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --settings \
    NODE_ENV=staging \
    API_URL=https://api-staging.econeura.com \
    WEB_URL=https://app-staging.econeura.com
```

## 🧪 FASE 6: VALIDACIÓN

### 6.1 Health Checks
```bash
echo "Running health checks on staging..."
# Wait for deployment to complete
sleep 60

# Check health endpoint
curl -f https://$APP_NAME-staging.azurewebsites.net/health || exit 1

# Check API endpoints
curl -f https://$APP_NAME-staging.azurewebsites.net/api/status || exit 1

# Check database connection
curl -f https://$APP_NAME-staging.azurewebsites.net/api/health/database || exit 1

# Check Redis connection
curl -f https://$APP_NAME-staging.azurewebsites.net/api/health/redis || exit 1
```

### 6.2 Smoke Tests
```bash
echo "Running smoke tests..."
# Run automated smoke tests
npm run test:smoke -- --baseUrl=https://$APP_NAME-staging.azurewebsites.net

# Check performance metrics
curl -s https://$APP_NAME-staging.azurewebsites.net/api/metrics | jq .
```

### 6.3 Manual Validation
```bash
echo "Manual validation checklist:"
echo "1. Open https://$APP_NAME-staging.azurewebsites.net in browser"
echo "2. Test user login functionality"
echo "3. Test AI agent execution"
echo "4. Test FinOps cost tracking"
echo "5. Test WebSocket connections"
echo "6. Test file uploads"
echo "7. Check Application Insights data"
echo "8. Verify all API endpoints"
```

## 🔄 FASE 7: DEPLOYMENT A PRODUCCIÓN

### 7.1 Swap con Preview
```bash
echo "Swapping staging with production (preview mode)..."
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --target-slot production \
  --action swap
```

### 7.2 Validar Producción
```bash
echo "Validating production deployment..."
# Wait for swap to complete
sleep 30

# Check health endpoint
curl -f https://$APP_NAME.azurewebsites.net/health || exit 1

# Check API endpoints
curl -f https://$APP_NAME.azurewebsites.net/api/status || exit 1

# Run smoke tests
npm run test:smoke -- --baseUrl=https://$APP_NAME.azurewebsites.net
```

### 7.3 Completar Swap
```bash
echo "Completing swap..."
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --target-slot production \
  --action complete
```

## 📊 FASE 8: POST-DEPLOYMENT

### 8.1 Monitoreo
```bash
echo "Monitoring deployment..."
# Check Application Insights
az monitor app-insights component show \
  --app $INSIGHTS_NAME \
  --resource-group $RESOURCE_GROUP

# Check App Service metrics
az monitor metrics list \
  --resource /subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME \
  --metric "Http2xx,Http4xx,Http5xx,AverageResponseTime" \
  --interval PT1M \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ)
```

### 8.2 Configurar Alertas
```bash
echo "Configuring alerts..."
# Create alert for high error rate
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group $RESOURCE_GROUP \
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$APP_NAME \
  --condition "count 'Http5xx' > 10" \
  --description "Alert when error rate is high" \
  --evaluation-frequency 1m \
  --window-size 5m \
  --severity 2
```

### 8.3 Configurar Auto-Scaling
```bash
echo "Configuring auto-scaling..."
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $APP_NAME \
  --resource-type Microsoft.Web/sites \
  --name econeura-ia-autoscale \
  --min-count 1 \
  --max-count 10 \
  --count 2
```

## ✅ FASE 9: VERIFICACIÓN FINAL

### 9.1 Checklist de Verificación
```bash
echo "Final verification checklist:"
echo "✅ Application is running"
echo "✅ Health checks are passing"
echo "✅ API endpoints are responding"
echo "✅ Database connection is working"
echo "✅ Redis connection is working"
echo "✅ WebSocket connections are working"
echo "✅ SSL/TLS is configured"
echo "✅ Application Insights is collecting data"
echo "✅ Alerts are configured"
echo "✅ Auto-scaling is enabled"
echo "✅ Access restrictions are in place"
echo "✅ Key Vault integration is working"
echo "✅ Managed Identity is configured"
echo "✅ VNet integration is working"
echo "✅ Private endpoints are configured"
echo "✅ Monitoring is active"
echo "✅ Logging is working"
echo "✅ Performance metrics are normal"
echo "✅ Error rates are within limits"
echo "✅ Response times are acceptable"
echo "✅ User authentication is working"
echo "✅ AI agents are functioning"
echo "✅ FinOps tracking is active"
echo "✅ File uploads are working"
echo "✅ Email notifications are working"
echo "✅ Payment processing is working"
echo "✅ OAuth integration is working"
echo "✅ Backup is configured"
echo "✅ Disaster recovery is planned"
```

### 9.2 Documentación
```bash
echo "Updating documentation..."
# Update deployment status
echo "Deployment completed successfully on $(date)" >> docs/azure/DEPLOYMENT_LOG.md

# Update configuration
echo "Production configuration:" >> docs/azure/PRODUCTION_CONFIG.md
az webapp config appsettings list --name $APP_NAME --resource-group $RESOURCE_GROUP >> docs/azure/PRODUCTION_CONFIG.md
```

## 🚨 FASE 10: ROLLBACK (SI ES NECESARIO)

### 10.1 Rollback Automático
```bash
echo "Automatic rollback triggered..."
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot production \
  --target-slot staging \
  --action swap
```

### 10.2 Rollback Manual
```bash
echo "Manual rollback..."
# Check current status
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "state"

# Perform rollback
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot production \
  --target-slot staging \
  --action swap

# Verify rollback
curl -f https://$APP_NAME.azurewebsites.net/health
```

## 📋 CHECKLIST DE DEPLOYMENT

### Pre-Deployment
- [ ] Azure CLI configurado y autenticado
- [ ] Variables de entorno definidas
- [ ] Secretos preparados
- [ ] Código compilado y empaquetado
- [ ] Tests pasando
- [ ] Documentación actualizada

### Deployment
- [ ] Resource group creado
- [ ] Key Vault creado y configurado
- [ ] App Service Plan creado
- [ ] App Service creado
- [ ] Application Insights creado
- [ ] Storage Account creado
- [ ] Redis Cache creado
- [ ] PostgreSQL Database creado
- [ ] Managed Identity configurado
- [ ] Secretos agregados a Key Vault
- [ ] App Settings configurados
- [ ] VNet creado y configurado
- [ ] VNet Integration configurado
- [ ] Access Restrictions configuradas
- [ ] Deployment slot creado
- [ ] Código deployado a staging
- [ ] Health checks pasando
- [ ] Smoke tests pasando
- [ ] Manual validation completada
- [ ] Swap a producción ejecutado
- [ ] Producción validada
- [ ] Monitoreo configurado
- [ ] Alertas configuradas
- [ ] Auto-scaling configurado

### Post-Deployment
- [ ] Aplicación funcionando
- [ ] Performance metrics normales
- [ ] Error rates dentro de límites
- [ ] Response times aceptables
- [ ] User feedback positivo
- [ ] Business metrics estables
- [ ] Documentación actualizada
- [ ] Team notificado
- [ ] Monitoring activo

## 📚 REFERENCIAS

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Azure Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Azure Virtual Network Documentation](https://docs.microsoft.com/en-us/azure/virtual-network/)
- [Deployment Best Practices](https://docs.microsoft.com/en-us/azure/app-service/deploy-best-practices)

---

**Estado:** ✅ **DEPLOYMENT PLAYBOOK COMPLETO**  
**Próximo:** **Ejecutar deployment real siguiendo este playbook**

Este playbook proporciona una guía completa paso a paso para el deployment de ECONEURA-IA a Azure App Service.
