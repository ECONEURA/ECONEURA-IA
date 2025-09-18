# ECONEURA-IA Azure Deployment Guide

## Prerequisites
- Azure CLI installed and authenticated
- Docker installed (for container deployment)
- Valid Azure subscription

## Deployment Options

### Option 1: Azure Container Apps (Recommended)
```bash
# 1. Create resource group
az group create --name econeura-rg --location eastus

# 2. Create container registry
az acr create --resource-group econeura-rg --name econeuraacrregistry --sku Basic --admin-enabled true

# 3. Build and push API container
cd apps/api
docker build -t econeura-api .
az acr build --registry econeuraacrregistry --image econeura-api:latest .

# 4. Create container app environment
az containerapp env create --name econeura-env --resource-group econeura-rg --location eastus

# 5. Deploy API as container app
az containerapp create \
  --name econeura-api \
  --resource-group econeura-rg \
  --environment econeura-env \
  --image econeuraacrregistry.azurecr.io/econeura-api:latest \
  --registry-server econeuraacrregistry.azurecr.io \
  --target-port 4000 \
  --ingress external \
  --env-vars \
    NODE_ENV=production \
    JWT_SECRET="your-jwt-secret" \
    DATABASE_URL="your-database-connection-string" \
    REDIS_URL="your-redis-connection-string"
```

### Option 2: Azure App Service
```bash
# 1. Create App Service plan
az appservice plan create --name econeura-plan --resource-group econeura-rg --sku B1 --is-linux

# 2. Create web app
az webapp create --resource-group econeura-rg --plan econeura-plan --name econeura-api-app --runtime "NODE|18-lts"

# 3. Configure environment variables
az webapp config appsettings set --resource-group econeura-rg --name econeura-api-app --settings \
  NODE_ENV=production \
  JWT_SECRET="your-jwt-secret" \
  DATABASE_URL="your-database-connection-string" \
  REDIS_URL="your-redis-connection-string"

# 4. Deploy from GitHub (configure CI/CD)
az webapp deployment source config --resource-group econeura-rg --name econeura-api-app \
  --repo-url https://github.com/your-org/ECONEURA-IA \
  --branch main \
  --manual-integration
```

### Option 3: Azure Static Web Apps (Frontend + API)
```bash
# 1. Create static web app with API support
az staticwebapp create \
  --name econeura-static-app \
  --resource-group econeura-rg \
  --source https://github.com/your-org/ECONEURA-IA \
  --location eastus \
  --branch main \
  --app-location "/apps/web" \
  --api-location "/apps/api" \
  --output-location "dist"
```

## Required Azure Resources

### Database
```bash
# PostgreSQL (recommended)
az postgres flexible-server create \
  --resource-group econeura-rg \
  --name econeura-postgres \
  --admin-user econeuradmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --version 14

# Get connection string
az postgres flexible-server show-connection-string --server-name econeura-postgres
```

### Redis Cache
```bash
# Azure Cache for Redis
az redis create \
  --resource-group econeura-rg \
  --name econeura-redis \
  --location eastus \
  --sku Basic \
  --vm-size C0

# Get connection details
az redis show --resource-group econeura-rg --name econeura-redis
```

### Storage (for file uploads)
```bash
# Storage account
az storage account create \
  --resource-group econeura-rg \
  --name econeurastorage \
  --location eastus \
  --sku Standard_LRS

# Get connection string
az storage account show-connection-string --resource-group econeura-rg --name econeurastorage
```

## Environment Configuration

### Required Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4000

# Authentication
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRES_IN=24h

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
PRISMA_GENERATE_DATAPROXY=true

# Cache
REDIS_URL=redis://host:6380,password=your-redis-password

# Azure Services
AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string
AZURE_OPENAI_ENDPOINT=your-openai-endpoint
AZURE_OPENAI_API_KEY=your-openai-key

# Monitoring
APPLICATIONINSIGHTS_CONNECTION_STRING=your-app-insights-connection
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally
- [ ] Build successful without errors
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates configured

### Post-deployment
- [ ] Health check endpoints responding
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] API endpoints functioning
- [ ] Authentication working
- [ ] Monitoring alerts configured

## Monitoring and Scaling

### Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --resource-group econeura-rg \
  --app econeura-insights \
  --location eastus \
  --kind web
```

### Auto-scaling (Container Apps)
```bash
# Configure scaling rules
az containerapp revision set-mode --name econeura-api --resource-group econeura-rg --mode multiple

# Set scaling parameters
az containerapp update \
  --name econeura-api \
  --resource-group econeura-rg \
  --min-replicas 1 \
  --max-replicas 10 \
  --scale-rule-name cpu-scale \
  --scale-rule-type cpu \
  --scale-rule-metadata cpuPercentage=70
```

## Security Configuration

### Managed Identity
```bash
# Enable managed identity for secure access to Azure services
az containerapp identity assign --name econeura-api --resource-group econeura-rg --system-assigned
```

### Key Vault Integration
```bash
# Create Key Vault for secrets
az keyvault create --name econeura-keyvault --resource-group econeura-rg --location eastus

# Store secrets
az keyvault secret set --vault-name econeura-keyvault --name jwt-secret --value "your-jwt-secret"
az keyvault secret set --vault-name econeura-keyvault --name database-url --value "your-database-url"
```

## Custom Domain and SSL
```bash
# Configure custom domain (after deployment)
az containerapp hostname add --hostname api.econeura.com --resource-group econeura-rg --name econeura-api

# SSL will be automatically managed by Azure
```

## Backup Strategy
- Database: Automated backups enabled by default
- Redis: Consider persistence configuration
- Storage: Geo-redundant storage recommended
- Application: Source code in version control