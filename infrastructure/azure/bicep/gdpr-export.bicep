@description('GDPR export infra: Storage, Function App (plan), KeyVault, Service Bus optional')
param location string = resourceGroup().location
param prefix string = 'econeura'

resource storage 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: '${prefix}gdprstorage'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
  }
}

resource kv 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: '${prefix}-kv-gdpr'
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    accessPolicies: []
    enableSoftDelete: true
  }
}

resource plan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${prefix}-func-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
}

resource func 'Microsoft.Web/sites@2022-03-01' = {
  name: '${prefix}-gdpr-func'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: plan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: storage.properties.primaryEndpoints.blob
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
      ]
    }
  }
  dependsOn: [plan, storage]
}

output storageAccountName string = storage.name
output keyVaultName string = kv.name
output functionAppName string = func.name
