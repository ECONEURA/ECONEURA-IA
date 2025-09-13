# ECONEURA Azure App Service Slots Strategy

## Overview
This document defines the deployment slot strategy for ECONEURA Azure App Services, including staging/swap procedures and feature flag configurations by environment.

## Owners
- **Primary**: DevOps Team (devops@econeura.dev)
- **Secondary**: Platform Team (platform@econeura.dev)
- **Escalation**: CTO (cto@econeura.dev)

## Deployment Slot Architecture

### Slot Configuration
```yaml
# App Service Slot Configuration
app_service_slots:
  production:
    name: "econeura-api-prod"
    slot_name: "production"
    environment: "production"
    auto_swap: false
    swap_with_preview: true
    
  staging:
    name: "econeura-api-prod"
    slot_name: "staging"
    environment: "staging"
    auto_swap: false
    swap_with_preview: false
    
  development:
    name: "econeura-api-dev"
    slot_name: "development"
    environment: "development"
    auto_swap: false
    swap_with_preview: false
```

### Slot Deployment Strategy
```yaml
# Blue-Green Deployment Strategy
deployment_strategy:
  method: "blue-green"
  slots:
    blue:
      name: "production"
      status: "active"
      traffic_percentage: 100
      
    green:
      name: "staging"
      status: "inactive"
      traffic_percentage: 0
      
  swap_process:
    - "Deploy to staging slot"
    - "Run smoke tests"
    - "Validate functionality"
    - "Swap staging to production"
    - "Monitor production"
    - "Rollback if issues detected"
```

## Environment-Specific Configurations

### Production Environment
```yaml
# Production Configuration
production_config:
  app_settings:
    ASPNETCORE_ENVIRONMENT: "Production"
    DEPLOY_ENABLED: "true"
    FEATURE_FLAGS_ENABLED: "true"
    LOG_LEVEL: "Information"
    ENABLE_SWAGGER: "false"
    ENABLE_DEBUG_ENDPOINTS: "false"
    
  feature_flags:
    ENABLE_NEW_UI: "false"
    ENABLE_AI_FEATURES: "true"
    ENABLE_ANALYTICS: "true"
    ENABLE_EXPERIMENTAL_FEATURES: "false"
    ENABLE_BETA_APIS: "false"
    ENABLE_DEBUG_MODE: "false"
    
  connection_strings:
    DefaultConnection: "Server=tcp:econeura-prod.database.windows.net,1433;Database=econeura_prod;"
    RedisConnection: "econeura-prod.redis.cache.windows.net:6380"
    
  scaling:
    min_instances: 3
    max_instances: 20
    scale_out_threshold: 70
    scale_in_threshold: 30
```

### Staging Environment
```yaml
# Staging Configuration
staging_config:
  app_settings:
    ASPNETCORE_ENVIRONMENT: "Staging"
    DEPLOY_ENABLED: "true"
    FEATURE_FLAGS_ENABLED: "true"
    LOG_LEVEL: "Debug"
    ENABLE_SWAGGER: "true"
    ENABLE_DEBUG_ENDPOINTS: "true"
    
  feature_flags:
    ENABLE_NEW_UI: "true"
    ENABLE_AI_FEATURES: "true"
    ENABLE_ANALYTICS: "true"
    ENABLE_EXPERIMENTAL_FEATURES: "true"
    ENABLE_BETA_APIS: "true"
    ENABLE_DEBUG_MODE: "true"
    
  connection_strings:
    DefaultConnection: "Server=tcp:econeura-staging.database.windows.net,1433;Database=econeura_staging;"
    RedisConnection: "econeura-staging.redis.cache.windows.net:6380"
    
  scaling:
    min_instances: 1
    max_instances: 5
    scale_out_threshold: 80
    scale_in_threshold: 20
```

### Development Environment
```yaml
# Development Configuration
development_config:
  app_settings:
    ASPNETCORE_ENVIRONMENT: "Development"
    DEPLOY_ENABLED: "false"
    FEATURE_FLAGS_ENABLED: "true"
    LOG_LEVEL: "Trace"
    ENABLE_SWAGGER: "true"
    ENABLE_DEBUG_ENDPOINTS: "true"
    
  feature_flags:
    ENABLE_NEW_UI: "true"
    ENABLE_AI_FEATURES: "true"
    ENABLE_ANALYTICS: "false"
    ENABLE_EXPERIMENTAL_FEATURES: "true"
    ENABLE_BETA_APIS: "true"
    ENABLE_DEBUG_MODE: "true"
    
  connection_strings:
    DefaultConnection: "Server=tcp:econeura-dev.database.windows.net,1433;Database=econeura_dev;"
    RedisConnection: "econeura-dev.redis.cache.windows.net:6380"
    
  scaling:
    min_instances: 1
    max_instances: 3
    scale_out_threshold: 90
    scale_in_threshold: 10
```

## Feature Flag Management

### Feature Flag Service Configuration
```yaml
# Azure App Configuration
app_configuration:
  name: "econeura-feature-flags"
  sku: "Standard"
  location: "East US"
  
  feature_flags:
    - name: "ENABLE_NEW_UI"
      description: "Enable new user interface"
      environments:
        production: false
        staging: true
        development: true
        
    - name: "ENABLE_AI_FEATURES"
      description: "Enable AI-powered features"
      environments:
        production: true
        staging: true
        development: true
        
    - name: "ENABLE_ANALYTICS"
      description: "Enable analytics tracking"
      environments:
        production: true
        staging: true
        development: false
        
    - name: "ENABLE_EXPERIMENTAL_FEATURES"
      description: "Enable experimental features"
      environments:
        production: false
        staging: true
        development: true
        
    - name: "ENABLE_BETA_APIS"
      description: "Enable beta API endpoints"
      environments:
        production: false
        staging: true
        development: true
        
    - name: "ENABLE_DEBUG_MODE"
      description: "Enable debug mode and logging"
      environments:
        production: false
        staging: true
        development: true
```

## Deployment Procedures

### Staging Deployment Process
```bash
#!/bin/bash
# deploy-to-staging.sh

set -euo pipefail

echo "🚀 Starting deployment to staging slot..."

# Deploy to staging slot
az webapp deployment slot swap \
  --resource-group econeura-rg \
  --name econeura-api-prod \
  --slot staging \
  --target-slot production \
  --action preview

echo "✅ Deployment to staging slot completed"

# Run smoke tests
echo "🧪 Running smoke tests..."
curl -f https://econeura-api-prod-staging.azurewebsites.net/health || {
  echo "❌ Smoke tests failed"
  exit 1
}

echo "✅ Smoke tests passed"

# Validate functionality
echo "🔍 Validating functionality..."
curl -f https://econeura-api-prod-staging.azurewebsites.net/v1/ping || {
  echo "❌ Functionality validation failed"
  exit 1
}

echo "✅ Functionality validation passed"
echo "🎉 Staging deployment ready for swap"
```

### Production Swap Process
```bash
#!/bin/bash
# swap-to-production.sh

set -euo pipefail

echo "🔄 Starting production swap..."

# Swap staging to production
az webapp deployment slot swap \
  --resource-group econeura-rg \
  --name econeura-api-prod \
  --slot staging \
  --target-slot production \
  --action swap

echo "✅ Production swap completed"

# Monitor production health
echo "📊 Monitoring production health..."
for i in {1..10}; do
  echo "Health check $i/10"
  curl -f https://econeura-api-prod.azurewebsites.net/health || {
    echo "❌ Production health check failed"
    echo "🚨 Initiating rollback..."
    ./rollback-production.sh
    exit 1
  }
  sleep 30
done

echo "✅ Production is healthy"
echo "🎉 Production deployment successful"
```

### Rollback Procedure
```bash
#!/bin/bash
# rollback-production.sh

set -euo pipefail

echo "🔄 Starting production rollback..."

# Swap back to previous version
az webapp deployment slot swap \
  --resource-group econeura-rg \
  --name econeura-api-prod \
  --slot staging \
  --target-slot production \
  --action swap

echo "✅ Production rollback completed"

# Verify rollback
echo "🔍 Verifying rollback..."
curl -f https://econeura-api-prod.azurewebsites.net/health || {
  echo "❌ Rollback verification failed"
  exit 1
}

echo "✅ Rollback verification passed"
echo "🎉 Production rollback successful"
```

## Monitoring and Health Checks

### Health Check Configuration
```yaml
# Health Check Configuration
health_checks:
  staging:
    endpoint: "/health"
    interval: 30
    timeout: 10
    retry_count: 3
    retry_interval: 10
    
  production:
    endpoint: "/health"
    interval: 60
    timeout: 5
    retry_count: 5
    retry_interval: 5
```

### Monitoring Scripts
```bash
#!/bin/bash
# monitor-deployment.sh

ENVIRONMENT=$1
SLOT_NAME=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$SLOT_NAME" ]; then
  echo "Usage: $0 <environment> <slot_name>"
  exit 1
fi

echo "📊 Monitoring deployment for $ENVIRONMENT ($SLOT_NAME)..."

# Check application health
curl -f "https://econeura-api-$ENVIRONMENT.azurewebsites.net/health" || {
  echo "❌ Application health check failed"
  exit 1
}

# Check feature flags
curl -f "https://econeura-api-$ENVIRONMENT.azurewebsites.net/v1/feature-flags" || {
  echo "❌ Feature flags check failed"
  exit 1
}

# Check database connectivity
curl -f "https://econeura-api-$ENVIRONMENT.azurewebsites.net/v1/health/database" || {
  echo "❌ Database connectivity check failed"
  exit 1
}

echo "✅ All health checks passed"
```

## Feature Flag Testing

### Feature Flag Test Suite
```bash
#!/bin/bash
# test-feature-flags.sh

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: $0 <environment>"
  exit 1
fi

echo "🧪 Testing feature flags for $ENVIRONMENT..."

# Test each feature flag
FEATURE_FLAGS=(
  "ENABLE_NEW_UI"
  "ENABLE_AI_FEATURES"
  "ENABLE_ANALYTICS"
  "ENABLE_EXPERIMENTAL_FEATURES"
  "ENABLE_BETA_APIS"
  "ENABLE_DEBUG_MODE"
)

for flag in "${FEATURE_FLAGS[@]}"; do
  echo "Testing $flag..."
  response=$(curl -s "https://econeura-api-$ENVIRONMENT.azurewebsites.net/v1/feature-flags/$flag")
  
  if [ "$response" = "true" ] || [ "$response" = "false" ]; then
    echo "✅ $flag: $response"
  else
    echo "❌ $flag: Invalid response - $response"
    exit 1
  fi
done

echo "✅ All feature flag tests passed"
```

## Environment-Specific Templates

### ARM Template for Production
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appServiceName": {
      "type": "string",
      "defaultValue": "econeura-api-prod"
    },
    "environment": {
      "type": "string",
      "defaultValue": "production"
    }
  },
  "variables": {
    "featureFlags": {
      "ENABLE_NEW_UI": "false",
      "ENABLE_AI_FEATURES": "true",
      "ENABLE_ANALYTICS": "true",
      "ENABLE_EXPERIMENTAL_FEATURES": "false",
      "ENABLE_BETA_APIS": "false",
      "ENABLE_DEBUG_MODE": "false"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites/slots",
      "apiVersion": "2021-02-01",
      "name": "[concat(parameters('appServiceName'), '/production')]",
      "location": "[resourceGroup().location]",
      "properties": {
        "siteConfig": {
          "appSettings": [
            {
              "name": "ASPNETCORE_ENVIRONMENT",
              "value": "Production"
            },
            {
              "name": "DEPLOY_ENABLED",
              "value": "true"
            },
            {
              "name": "FEATURE_FLAGS_ENABLED",
              "value": "true"
            },
            {
              "name": "LOG_LEVEL",
              "value": "Information"
            },
            {
              "name": "ENABLE_SWAGGER",
              "value": "false"
            },
            {
              "name": "ENABLE_DEBUG_ENDPOINTS",
              "value": "false"
            }
          ]
        }
      }
    }
  ]
}
```

### ARM Template for Staging
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appServiceName": {
      "type": "string",
      "defaultValue": "econeura-api-prod"
    },
    "environment": {
      "type": "string",
      "defaultValue": "staging"
    }
  },
  "variables": {
    "featureFlags": {
      "ENABLE_NEW_UI": "true",
      "ENABLE_AI_FEATURES": "true",
      "ENABLE_ANALYTICS": "true",
      "ENABLE_EXPERIMENTAL_FEATURES": "true",
      "ENABLE_BETA_APIS": "true",
      "ENABLE_DEBUG_MODE": "true"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites/slots",
      "apiVersion": "2021-02-01",
      "name": "[concat(parameters('appServiceName'), '/staging')]",
      "location": "[resourceGroup().location]",
      "properties": {
        "siteConfig": {
          "appSettings": [
            {
              "name": "ASPNETCORE_ENVIRONMENT",
              "value": "Staging"
            },
            {
              "name": "DEPLOY_ENABLED",
              "value": "true"
            },
            {
              "name": "FEATURE_FLAGS_ENABLED",
              "value": "true"
            },
            {
              "name": "LOG_LEVEL",
              "value": "Debug"
            },
            {
              "name": "ENABLE_SWAGGER",
              "value": "true"
            },
            {
              "name": "ENABLE_DEBUG_ENDPOINTS",
              "value": "true"
            }
          ]
        }
      }
    }
  ]
}
```

## Deployment Automation

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy-slots.yml
name: Deploy to Azure App Service Slots

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Staging
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'econeura-api-prod'
          slot-name: 'staging'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
          
      - name: Run Smoke Tests
        run: |
          curl -f https://econeura-api-prod-staging.azurewebsites.net/health
          curl -f https://econeura-api-prod-staging.azurewebsites.net/v1/ping
          
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Swap to Production
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az webapp deployment slot swap \
              --resource-group econeura-rg \
              --name econeura-api-prod \
              --slot staging \
              --target-slot production \
              --action swap
              
      - name: Monitor Production
        run: |
          for i in {1..10}; do
            curl -f https://econeura-api-prod.azurewebsites.net/health
            sleep 30
          done
```

## Troubleshooting

### Common Issues

#### Slot Swap Failures
```bash
# Check slot status
az webapp deployment slot list \
  --resource-group econeura-rg \
  --name econeura-api-prod

# Check slot configuration
az webapp config appsettings list \
  --resource-group econeura-rg \
  --name econeura-api-prod \
  --slot staging
```

#### Feature Flag Issues
```bash
# Check feature flag configuration
az appconfig kv list \
  --name econeura-feature-flags \
  --key "FEATURE_FLAGS:*"

# Update feature flag
az appconfig kv set \
  --name econeura-feature-flags \
  --key "FEATURE_FLAGS:ENABLE_NEW_UI:production" \
  --value "true"
```

#### Health Check Failures
```bash
# Check application logs
az webapp log tail \
  --resource-group econeura-rg \
  --name econeura-api-prod \
  --slot staging

# Check deployment status
az webapp deployment list \
  --resource-group econeura-rg \
  --name econeura-api-prod \
  --slot staging
```

## Contact Information

- **DevOps Team**: devops@econeura.dev
- **Platform Team**: platform@econeura.dev
- **CTO**: cto@econeura.dev
- **Emergency**: +1-555-ECONEURA (24/7)

## Last Updated
2024-01-15

## Review Schedule
Monthly review by DevOps Team