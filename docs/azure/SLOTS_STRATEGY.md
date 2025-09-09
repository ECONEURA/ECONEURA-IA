# Deployment Slots Strategy - Azure App Service

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Estrategia de deployment slots con staging/swap para ECONEURA-IA

## 📋 RESUMEN EJECUTIVO

Este documento describe la estrategia de deployment slots para ECONEURA-IA, incluyendo configuración de staging, swap automático, y estrategias de deployment sin downtime.

## 🎯 ESTRATEGIA DE SLOTS

### Arquitectura de Slots
```json
{
  "deploymentSlots": {
    "production": {
      "name": "production",
      "url": "https://econeura-ia-app.azurewebsites.net",
      "status": "active",
      "traffic": 100,
      "environment": "production"
    },
    "staging": {
      "name": "staging",
      "url": "https://econeura-ia-app-staging.azurewebsites.net",
      "status": "active",
      "traffic": 0,
      "environment": "staging"
    },
    "testing": {
      "name": "testing",
      "url": "https://econeura-ia-app-testing.azurewebsites.net",
      "status": "active",
      "traffic": 0,
      "environment": "testing"
    }
  }
}
```

### Configuración de Slots
```json
{
  "slotConfiguration": {
    "staging": {
      "appSettings": {
        "NODE_ENV": "staging",
        "API_URL": "https://api-staging.econeura.com",
        "WEB_URL": "https://app-staging.econeura.com",
        "DATABASE_URL": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/database-url-staging/)",
        "REDIS_URL": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/redis-url-staging/)",
        "JWT_SECRET": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/jwt-secret-staging/)",
        "LOG_LEVEL": "debug",
        "APPINSIGHTS_SAMPLING_PERCENTAGE": "100"
      },
      "connectionStrings": {
        "DefaultConnection": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/database-connection-string-staging/)"
      },
      "alwaysOn": true,
      "autoSwap": false,
      "swapWithPreview": true
    },
    "testing": {
      "appSettings": {
        "NODE_ENV": "testing",
        "API_URL": "https://api-testing.econeura.com",
        "WEB_URL": "https://app-testing.econeura.com",
        "DATABASE_URL": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/database-url-testing/)",
        "REDIS_URL": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/redis-url-testing/)",
        "JWT_SECRET": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/jwt-secret-testing/)",
        "LOG_LEVEL": "debug",
        "APPINSIGHTS_SAMPLING_PERCENTAGE": "100"
      },
      "connectionStrings": {
        "DefaultConnection": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/database-connection-string-testing/)"
      },
      "alwaysOn": false,
      "autoSwap": false,
      "swapWithPreview": false
    }
  }
}
```

## 🔄 ESTRATEGIAS DE DEPLOYMENT

### Blue-Green Deployment
```json
{
  "blueGreenDeployment": {
    "description": "Estrategia Blue-Green con slots de Azure App Service",
    "steps": [
      {
        "step": 1,
        "action": "Deploy to Staging",
        "description": "Deploy new version to staging slot",
        "duration": "5-10 minutes"
      },
      {
        "step": 2,
        "action": "Run Tests",
        "description": "Execute automated tests on staging",
        "duration": "10-15 minutes"
      },
      {
        "step": 3,
        "action": "Manual Validation",
        "description": "Manual testing and validation",
        "duration": "15-30 minutes"
      },
      {
        "step": 4,
        "action": "Swap with Preview",
        "description": "Swap staging with production (preview mode)",
        "duration": "2-3 minutes"
      },
      {
        "step": 5,
        "action": "Validate Production",
        "description": "Validate production environment",
        "duration": "5-10 minutes"
      },
      {
        "step": 6,
        "action": "Complete Swap",
        "description": "Complete the swap operation",
        "duration": "1-2 minutes"
      }
    ]
  }
}
```

### Canary Deployment
```json
{
  "canaryDeployment": {
    "description": "Estrategia Canary con traffic routing",
    "phases": [
      {
        "phase": 1,
        "name": "Initial Rollout",
        "trafficPercentage": 5,
        "duration": "30 minutes",
        "monitoring": "Error rate, response time, business metrics"
      },
      {
        "phase": 2,
        "name": "Gradual Increase",
        "trafficPercentage": 25,
        "duration": "1 hour",
        "monitoring": "Error rate, response time, business metrics"
      },
      {
        "phase": 3,
        "name": "Major Rollout",
        "trafficPercentage": 50,
        "duration": "2 hours",
        "monitoring": "Error rate, response time, business metrics"
      },
      {
        "phase": 4,
        "name": "Full Rollout",
        "trafficPercentage": 100,
        "duration": "1 hour",
        "monitoring": "Error rate, response time, business metrics"
      }
    ]
  }
}
```

## 🚀 PIPELINE DE DEPLOYMENT

### Azure DevOps Pipeline
```yaml
# azure-pipelines-slots.yml
trigger:
- main
- develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'
  appServiceName: 'econeura-ia-app'
  resourceGroupName: 'econeura-ia-rg'

stages:
- stage: Build
  jobs:
  - job: BuildJob
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '$(nodeVersion)'
    - script: |
        npm ci
        npm run build
        npm run test
      displayName: 'Build and Test'
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(System.DefaultWorkingDirectory)'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip'
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'drop'

- stage: DeployToTesting
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
  jobs:
  - deployment: DeployToTestingJob
    environment: 'testing'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Azure-Service-Connection'
              appName: '$(appServiceName)'
              slotName: 'testing'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
              deploymentMethod: 'zipDeploy'

- stage: DeployToStaging
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployToStagingJob
    environment: 'staging'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Azure-Service-Connection'
              appName: '$(appServiceName)'
              slotName: 'staging'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
              deploymentMethod: 'zipDeploy'
          - task: AzureCLI@2
            inputs:
              azureSubscription: 'Azure-Service-Connection'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Run health checks
                echo "Running health checks on staging..."
                curl -f https://$(appServiceName)-staging.azurewebsites.net/health || exit 1
                
                # Run smoke tests
                echo "Running smoke tests..."
                npm run test:smoke -- --baseUrl=https://$(appServiceName)-staging.azurewebsites.net

- stage: DeployToProduction
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployToProductionJob
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureCLI@2
            inputs:
              azureSubscription: 'Azure-Service-Connection'
              scriptType: 'bash'
              scriptLocation: 'inlineScript'
              inlineScript: |
                # Swap staging with production
                echo "Swapping staging with production..."
                az webapp deployment slot swap \
                  --resource-group $(resourceGroupName) \
                  --name $(appServiceName) \
                  --slot staging \
                  --target-slot production \
                  --action swap
                
                # Wait for swap to complete
                echo "Waiting for swap to complete..."
                sleep 30
                
                # Run health checks on production
                echo "Running health checks on production..."
                curl -f https://$(appServiceName).azurewebsites.net/health || exit 1
                
                # Run smoke tests on production
                echo "Running smoke tests on production..."
                npm run test:smoke -- --baseUrl=https://$(appServiceName).azurewebsites.net
```

## 🔄 SWAP OPERATIONS

### Swap with Preview
```bash
# Swap with preview (staging -> production)
az webapp deployment slot swap \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --slot staging \
  --target-slot production \
  --action swap

# Complete the swap
az webapp deployment slot swap \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --slot staging \
  --target-slot production \
  --action complete
```

### Rollback Swap
```bash
# Rollback swap (production -> staging)
az webapp deployment slot swap \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --slot production \
  --target-slot staging \
  --action swap
```

### Auto Swap Configuration
```json
{
  "autoSwap": {
    "enabled": false,
    "description": "Auto swap disabled for manual control",
    "conditions": [
      "All health checks pass",
      "Smoke tests pass",
      "Manual approval received"
    ]
  }
}
```

## 🧪 TESTING STRATEGY

### Pre-Swap Tests
```javascript
// scripts/pre-swap-tests.js
const tests = [
  {
    name: 'Health Check',
    url: '/health',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'API Endpoints',
    url: '/api/status',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'Database Connection',
    url: '/api/health/database',
    expectedStatus: 200,
    timeout: 10000
  },
  {
    name: 'Redis Connection',
    url: '/api/health/redis',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'WebSocket Connection',
    url: '/ws',
    expectedStatus: 101,
    timeout: 5000
  }
];

async function runPreSwapTests(baseUrl) {
  const results = [];
  
  for (const test of tests) {
    try {
      const response = await fetch(`${baseUrl}${test.url}`, {
        method: 'GET',
        timeout: test.timeout
      });
      
      results.push({
        name: test.name,
        status: response.status === test.expectedStatus ? 'PASS' : 'FAIL',
        expected: test.expectedStatus,
        actual: response.status
      });
    } catch (error) {
      results.push({
        name: test.name,
        status: 'FAIL',
        error: error.message
      });
    }
  }
  
  return results;
}

export { runPreSwapTests };
```

### Post-Swap Tests
```javascript
// scripts/post-swap-tests.js
const businessTests = [
  {
    name: 'User Login',
    test: async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@econeura.com',
          password: 'test-password'
        })
      });
      return response.status === 200;
    }
  },
  {
    name: 'AI Agent Execution',
    test: async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/agents/test-agent/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: { test: true }
        })
      });
      return response.status === 200;
    }
  },
  {
    name: 'FinOps Cost Check',
    test: async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/finops/status/test-org`);
      return response.status === 200;
    }
  }
];

async function runPostSwapTests(baseUrl) {
  const results = [];
  
  for (const test of businessTests) {
    try {
      const passed = await test.test(baseUrl);
      results.push({
        name: test.name,
        status: passed ? 'PASS' : 'FAIL'
      });
    } catch (error) {
      results.push({
        name: test.name,
        status: 'FAIL',
        error: error.message
      });
    }
  }
  
  return results;
}

export { runPostSwapTests };
```

## 📊 MONITORING Y ALERTAS

### Swap Monitoring
```json
{
  "swapMonitoring": {
    "alerts": [
      {
        "name": "Swap Failure",
        "description": "Alert when swap operation fails",
        "condition": {
          "metric": "SwapOperation",
          "operator": "equals",
          "threshold": "Failed",
          "timeWindow": "PT5M"
        },
        "severity": "Critical",
        "actions": [
          {
            "type": "email",
            "recipients": ["devops@econeura.com"]
          },
          {
            "type": "webhook",
            "url": "https://hooks.slack.com/services/..."
          }
        ]
      },
      {
        "name": "Post-Swap Health Check Failure",
        "description": "Alert when health checks fail after swap",
        "condition": {
          "metric": "HealthCheck",
          "operator": "equals",
          "threshold": "Failed",
          "timeWindow": "PT2M"
        },
        "severity": "Critical",
        "actions": [
          {
            "type": "email",
            "recipients": ["devops@econeura.com"]
          },
          {
            "type": "webhook",
            "url": "https://hooks.slack.com/services/..."
          }
        ]
      }
    ]
  }
}
```

### Performance Monitoring
```json
{
  "performanceMonitoring": {
    "metrics": [
      {
        "name": "Response Time",
        "threshold": 2000,
        "timeWindow": "PT5M",
        "action": "Alert if > 2 seconds"
      },
      {
        "name": "Error Rate",
        "threshold": 5,
        "timeWindow": "PT5M",
        "action": "Alert if > 5%"
      },
      {
        "name": "CPU Usage",
        "threshold": 80,
        "timeWindow": "PT5M",
        "action": "Alert if > 80%"
      },
      {
        "name": "Memory Usage",
        "threshold": 85,
        "timeWindow": "PT5M",
        "action": "Alert if > 85%"
      }
    ]
  }
}
```

## 🔄 ROLLBACK STRATEGY

### Automatic Rollback
```json
{
  "automaticRollback": {
    "enabled": true,
    "conditions": [
      {
        "metric": "Error Rate",
        "threshold": 10,
        "timeWindow": "PT2M",
        "action": "Rollback"
      },
      {
        "metric": "Response Time",
        "threshold": 5000,
        "timeWindow": "PT2M",
        "action": "Rollback"
      },
      {
        "metric": "Health Check",
        "threshold": "Failed",
        "timeWindow": "PT1M",
        "action": "Rollback"
      }
    ],
    "rollbackAction": "Swap back to previous version"
  }
}
```

### Manual Rollback
```bash
# Manual rollback script
#!/bin/bash

echo "Starting manual rollback..."

# Check current status
echo "Current production status:"
curl -s https://econeura-ia-app.azurewebsites.net/health | jq .

# Perform rollback
echo "Performing rollback..."
az webapp deployment slot swap \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --slot production \
  --target-slot staging \
  --action swap

# Wait for rollback to complete
echo "Waiting for rollback to complete..."
sleep 30

# Verify rollback
echo "Verifying rollback..."
curl -s https://econeura-ia-app.azurewebsites.net/health | jq .

echo "Rollback completed!"
```

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Health checks implemented
- [ ] Monitoring configured
- [ ] Rollback plan ready

### During Deployment
- [ ] Deploy to staging slot
- [ ] Run automated tests
- [ ] Manual validation
- [ ] Swap with preview
- [ ] Validate production
- [ ] Complete swap
- [ ] Monitor metrics

### Post-Deployment
- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] Error rates within limits
- [ ] User feedback positive
- [ ] Business metrics stable
- [ ] Documentation updated

## 🚀 DEPLOYMENT COMMANDS

### Azure CLI Commands
```bash
# Create deployment slot
az webapp deployment slot create \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --slot staging

# Deploy to slot
az webapp deployment source config-zip \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --slot staging \
  --src econeura-ia-package.zip

# Swap slots
az webapp deployment slot swap \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --slot staging \
  --target-slot production

# Get slot status
az webapp deployment slot list \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app
```

### PowerShell Commands
```powershell
# Create deployment slot
New-AzWebAppSlot -ResourceGroupName "econeura-ia-rg" -Name "econeura-ia-app" -Slot "staging"

# Deploy to slot
Publish-AzWebApp -ResourceGroupName "econeura-ia-rg" -Name "econeura-ia-app" -SlotName "staging" -ArchivePath "econeura-ia-package.zip"

# Swap slots
Switch-AzWebAppSlot -ResourceGroupName "econeura-ia-rg" -Name "econeura-ia-app" -SourceSlotName "staging" -DestinationSlotName "production"
```

## 📚 REFERENCIAS

- [Azure App Service Deployment Slots](https://docs.microsoft.com/en-us/azure/app-service/deploy-staging-slots)
- [Swap Operations](https://docs.microsoft.com/en-us/azure/app-service/deploy-staging-slots#swap)
- [Auto Swap](https://docs.microsoft.com/en-us/azure/app-service/deploy-staging-slots#configure-auto-swap)
- [Deployment Best Practices](https://docs.microsoft.com/en-us/azure/app-service/deploy-best-practices)
- [Blue-Green Deployment](https://docs.microsoft.com/en-us/azure/architecture/framework/devops/deployment)
