@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'econeura'

@description('Domain name for the application')
param domainName string = 'econeura.azurewebsites.net'

@description('Enable/disable Azure Front Door')
param enableFrontDoor bool = true

@description('Enable/disable Azure Container Registry')
param enableACR bool = true

@description('Enable/disable Azure Key Vault')
param enableKeyVault bool = true

@description('Enable/disable Azure Application Insights')
param enableAppInsights bool = true

@description('Enable/disable Azure PostgreSQL Flexible Server')
param enablePostgreSQL bool = true

@description('Enable/disable Azure Functions')
param enableFunctions bool = true

@description('Enable/disable Azure Container Apps')
param enableContainerApps bool = true

// Variables
var resourcePrefix = '${appName}-${environment}'
var tags = {
  Environment: environment
  Application: appName
  ManagedBy: 'Bicep'
  DataResidency: 'EU'
}

// Resource Group (deployed to existing RG)
resource rg 'Microsoft.Resources/resourceGroups@2023-07-02' existing = {
  name: resourceGroup().name
}

// Azure Container Registry
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = if (enableACR) {
  name: '${resourcePrefix}acr'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
  }
  tags: tags
}

// Azure Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = if (enableKeyVault) {
  name: '${resourcePrefix}kv'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
  tags: tags
}

// Azure Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = if (enableAppInsights) {
  name: '${resourcePrefix}ai'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
  tags: tags
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = if (enableAppInsights) {
  name: '${resourcePrefix}law'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
  tags: tags
}

// Azure PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = if (enablePostgreSQL) {
  name: '${resourcePrefix}psql'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'econeura_admin'
    administratorLoginPassword: '${resourcePrefix}P@ssw0rd!' // In production, use Key Vault
    version: '15'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: vnetSubnet.id
      privateDnsZoneArmResourceId: privateDnsZone.id
    }
  }
  tags: tags
}

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = if (enablePostgreSQL) {
  name: '${resourcePrefix}vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: '10.0.0.0/24'
          delegations: [
            {
              name: 'Microsoft.DBforPostgreSQL/flexibleServers'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
    ]
  }
  tags: tags
}

resource vnetSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' existing = if (enablePostgreSQL) {
  name: 'default'
  parent: vnet
}

// Private DNS Zone for PostgreSQL
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = if (enablePostgreSQL) {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'
  properties: {}
  tags: tags
}

// Private DNS Zone VNet Link
resource privateDnsZoneVNetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = if (enablePostgreSQL) {
  name: '${resourcePrefix}link'
  parent: privateDnsZone
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
  tags: tags
}

// Azure Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = if (enableContainerApps) {
  name: '${resourcePrefix}cae'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: vnetSubnet.id
    }
  }
  tags: tags
}

// API Container App
resource apiContainerApp 'Microsoft.App/containerApps@2023-05-01' = if (enableContainerApps) {
  name: '${resourcePrefix}api'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: [
        {
          name: 'postgres-password'
          value: postgresServer.properties.administratorLoginPassword
        }
      ]
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.properties.adminUserEnabled ? acr.listCredentials().username : null
          passwordSecretRef: acr.properties.adminUserEnabled ? 'acr-password' : null
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: '${acr.properties.loginServer}/econeura-api:latest'
          env: [
            {
              name: 'NODE_ENV'
              value: environment
            }
            {
              name: 'PGHOST'
              value: postgresServer.properties.fullyQualifiedDomainName
            }
            {
              name: 'PGUSER'
              value: postgresServer.properties.administratorLogin
            }
            {
              name: 'PGPASSWORD'
              secretRef: 'postgres-password'
            }
            {
              name: 'PGDATABASE'
              value: 'econeura'
            }
            {
              name: 'PGPORT'
              value: '5432'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsights.properties.ConnectionString
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
  tags: tags
}

// Web Container App
resource webContainerApp 'Microsoft.App/containerApps@2023-05-01' = if (enableContainerApps) {
  name: '${resourcePrefix}web'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.properties.adminUserEnabled ? acr.listCredentials().username : null
          passwordSecretRef: acr.properties.adminUserEnabled ? 'acr-password' : null
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'web'
          image: '${acr.properties.loginServer}/econeura-web:latest'
          env: [
            {
              name: 'NODE_ENV'
              value: environment
            }
            {
              name: 'NEXT_PUBLIC_API_URL'
              value: 'https://${apiContainerApp.properties.configuration.ingress.fqdn}'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
  tags: tags
}

// Azure Functions App Service Plan
resource functionsAppServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = if (enableFunctions) {
  name: '${resourcePrefix}func-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: false
  }
  tags: tags
}

// Azure Functions App
resource functionsApp 'Microsoft.Web/sites@2023-01-01' = if (enableFunctions) {
  name: '${resourcePrefix}func'
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: functionsAppServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'UseDevelopmentStorage=true'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
  }
  tags: tags
}

// Azure Front Door
resource frontDoor 'Microsoft.Network/frontDoors@2020-11-01' = if (enableFrontDoor) {
  name: '${resourcePrefix}fd'
  location: 'global'
  properties: {
    routingRules: [
      {
        name: 'api-rule'
        properties: {
          frontendEndpoints: [
            {
              name: 'api-endpoint'
            }
          ]
          acceptedProtocols: [
            'Https'
          ]
          patternsToMatch: [
            '/api/*'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.ForwardingConfiguration'
            backendPool: {
              id: apiBackendPool.id
            }
          }
        }
      }
      {
        name: 'web-rule'
        properties: {
          frontendEndpoints: [
            {
              name: 'web-endpoint'
            }
          ]
          acceptedProtocols: [
            'Https'
          ]
          patternsToMatch: [
            '/*'
          ]
          routeConfiguration: {
            '@odata.type': '#Microsoft.Azure.FrontDoor.Models.ForwardingConfiguration'
            backendPool: {
              id: webBackendPool.id
            }
          }
        }
      }
    ]
    backendPools: [
      {
        name: 'api-backend-pool'
        properties: {
          backends: [
            {
              address: apiContainerApp.properties.configuration.ingress.fqdn
              httpPort: 443
              httpsPort: 443
            }
          ]
          healthProbeSettings: {
            id: apiHealthProbe.id
          }
          loadBalancingSettings: {
            id: apiLoadBalancing.id
          }
        }
      }
      {
        name: 'web-backend-pool'
        properties: {
          backends: [
            {
              address: webContainerApp.properties.configuration.ingress.fqdn
              httpPort: 443
              httpsPort: 443
            }
          ]
          healthProbeSettings: {
            id: webHealthProbe.id
          }
          loadBalancingSettings: {
            id: webLoadBalancing.id
          }
        }
      }
    ]
    frontendEndpoints: [
      {
        name: 'api-endpoint'
        properties: {
          hostName: 'api.${domainName}'
          sessionAffinityEnabledState: 'Enabled'
          sessionAffinityTtlSeconds: 300
        }
      }
      {
        name: 'web-endpoint'
        properties: {
          hostName: domainName
          sessionAffinityEnabledState: 'Enabled'
          sessionAffinityTtlSeconds: 300
        }
      }
    ]
    healthProbeSettings: [
      {
        name: 'api-health-probe'
        properties: {
          path: '/health'
          protocol: 'Https'
          intervalInSeconds: 30
        }
      }
      {
        name: 'web-health-probe'
        properties: {
          path: '/'
          protocol: 'Https'
          intervalInSeconds: 30
        }
      }
    ]
    loadBalancingSettings: [
      {
        name: 'api-load-balancing'
        properties: {
          sampleSize: 4
          successfulSamplesRequired: 2
          additionalLatencyMilliseconds: 0
        }
      }
      {
        name: 'web-load-balancing'
        properties: {
          sampleSize: 4
          successfulSamplesRequired: 2
          additionalLatencyMilliseconds: 0
        }
      }
    ]
  }
  tags: tags
}

// Outputs
output acrLoginServer string = acr.properties.loginServer
output keyVaultName string = keyVault.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output postgresServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
output apiUrl string = apiContainerApp.properties.configuration.ingress.fqdn
output webUrl string = webContainerApp.properties.configuration.ingress.fqdn
output frontDoorUrl string = 'https://${domainName}'
output apiFrontDoorUrl string = 'https://api.${domainName}'
