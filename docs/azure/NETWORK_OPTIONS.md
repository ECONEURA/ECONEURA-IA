# Network Options - Azure App Service

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Configuración de opciones de red con Access Restrictions, deny-all y allowlist

## 📋 RESUMEN EJECUTIVO

Este documento describe la configuración de opciones de red para ECONEURA-IA en Azure App Service, incluyendo Access Restrictions, configuración deny-all con allowlist, y medidas de seguridad de red.

## 🔒 ACCESS RESTRICTIONS

### Configuración de Access Restrictions
```json
{
  "accessRestrictions": {
    "description": "Configuración de restricciones de acceso para ECONEURA-IA",
    "defaultAction": "Deny",
    "rules": [
      {
        "name": "Allow Azure Services",
        "priority": 100,
        "action": "Allow",
        "ipAddress": "AzureServices",
        "description": "Permitir servicios de Azure"
      },
      {
        "name": "Allow Office 365",
        "priority": 200,
        "action": "Allow",
        "ipAddress": "Office365",
        "description": "Permitir Office 365"
      },
      {
        "name": "Allow ECONEURA Office",
        "priority": 300,
        "action": "Allow",
        "ipAddress": "203.0.113.0/24",
        "description": "Permitir oficina de ECONEURA"
      },
      {
        "name": "Allow Admin VPN",
        "priority": 400,
        "action": "Allow",
        "ipAddress": "198.51.100.0/24",
        "description": "Permitir VPN de administradores"
      },
      {
        "name": "Allow DevOps Team",
        "priority": 500,
        "action": "Allow",
        "ipAddress": "192.0.2.0/24",
        "description": "Permitir equipo de DevOps"
      },
      {
        "name": "Allow Monitoring Services",
        "priority": 600,
        "action": "Allow",
        "ipAddress": "13.107.6.0/24",
        "description": "Permitir servicios de monitoreo"
      },
      {
        "name": "Allow CDN",
        "priority": 700,
        "action": "Allow",
        "ipAddress": "AzureFrontDoor.Backend",
        "description": "Permitir Azure Front Door"
      },
      {
        "name": "Allow Load Balancer",
        "priority": 800,
        "action": "Allow",
        "ipAddress": "AzureLoadBalancer",
        "description": "Permitir Azure Load Balancer"
      }
    ]
  }
}
```

### Configuración por Entorno

#### Desarrollo
```json
{
  "development": {
    "defaultAction": "Allow",
    "rules": [
      {
        "name": "Allow All Development",
        "priority": 100,
        "action": "Allow",
        "ipAddress": "0.0.0.0/0",
        "description": "Permitir todo en desarrollo"
      }
    ]
  }
}
```

#### Staging
```json
{
  "staging": {
    "defaultAction": "Deny",
    "rules": [
      {
        "name": "Allow Azure Services",
        "priority": 100,
        "action": "Allow",
        "ipAddress": "AzureServices"
      },
      {
        "name": "Allow ECONEURA Office",
        "priority": 200,
        "action": "Allow",
        "ipAddress": "203.0.113.0/24"
      },
      {
        "name": "Allow DevOps Team",
        "priority": 300,
        "action": "Allow",
        "ipAddress": "192.0.2.0/24"
      },
      {
        "name": "Allow Testing IPs",
        "priority": 400,
        "action": "Allow",
        "ipAddress": "198.51.100.0/24"
      }
    ]
  }
}
```

#### Producción
```json
{
  "production": {
    "defaultAction": "Deny",
    "rules": [
      {
        "name": "Allow Azure Services",
        "priority": 100,
        "action": "Allow",
        "ipAddress": "AzureServices"
      },
      {
        "name": "Allow Office 365",
        "priority": 200,
        "action": "Allow",
        "ipAddress": "Office365"
      },
      {
        "name": "Allow ECONEURA Office",
        "priority": 300,
        "action": "Allow",
        "ipAddress": "203.0.113.0/24"
      },
      {
        "name": "Allow Admin VPN",
        "priority": 400,
        "action": "Allow",
        "ipAddress": "198.51.100.0/24"
      },
      {
        "name": "Allow DevOps Team",
        "priority": 500,
        "action": "Allow",
        "ipAddress": "192.0.2.0/24"
      },
      {
        "name": "Allow Monitoring Services",
        "priority": 600,
        "action": "Allow",
        "ipAddress": "13.107.6.0/24"
      },
      {
        "name": "Allow CDN",
        "priority": 700,
        "action": "Allow",
        "ipAddress": "AzureFrontDoor.Backend"
      },
      {
        "name": "Allow Load Balancer",
        "priority": 800,
        "action": "Allow",
        "ipAddress": "AzureLoadBalancer"
      }
    ]
  }
}
```

## 🌐 VIRTUAL NETWORK INTEGRATION

### VNet Configuration
```json
{
  "virtualNetwork": {
    "name": "econeura-ia-vnet",
    "addressSpace": "10.0.0.0/16",
    "subnets": [
      {
        "name": "app-subnet",
        "addressPrefix": "10.0.1.0/24",
        "delegation": "Microsoft.Web/serverFarms"
      },
      {
        "name": "db-subnet",
        "addressPrefix": "10.0.2.0/24",
        "delegation": "Microsoft.DBforPostgreSQL/flexibleServers"
      },
      {
        "name": "cache-subnet",
        "addressPrefix": "10.0.3.0/24",
        "delegation": "Microsoft.Cache/redis"
      }
    ],
    "networkSecurityGroups": [
      {
        "name": "app-nsg",
        "rules": [
          {
            "name": "AllowHTTPS",
            "priority": 100,
            "direction": "Inbound",
            "access": "Allow",
            "protocol": "Tcp",
            "sourcePortRange": "*",
            "destinationPortRange": "443",
            "sourceAddressPrefix": "*",
            "destinationAddressPrefix": "*"
          },
          {
            "name": "AllowHTTP",
            "priority": 200,
            "direction": "Inbound",
            "access": "Allow",
            "protocol": "Tcp",
            "sourcePortRange": "*",
            "destinationPortRange": "80",
            "sourceAddressPrefix": "*",
            "destinationAddressPrefix": "*"
          },
          {
            "name": "AllowSSH",
            "priority": 300,
            "direction": "Inbound",
            "access": "Allow",
            "protocol": "Tcp",
            "sourcePortRange": "*",
            "destinationPortRange": "22",
            "sourceAddressPrefix": "203.0.113.0/24",
            "destinationAddressPrefix": "*"
          }
        ]
      }
    ]
  }
}
```

### VNet Integration Configuration
```json
{
  "vnetIntegration": {
    "enabled": true,
    "subnetId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.Network/virtualNetworks/econeura-ia-vnet/subnets/app-subnet",
    "routeAll": true,
    "dnsServers": [
      "168.63.129.16",
      "8.8.8.8",
      "8.8.4.4"
    ]
  }
}
```

## 🔐 PRIVATE ENDPOINTS

### Private Endpoint Configuration
```json
{
  "privateEndpoints": [
    {
      "name": "database-private-endpoint",
      "resourceId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/econeura-ia-db",
      "subnetId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.Network/virtualNetworks/econeura-ia-vnet/subnets/db-subnet",
      "privateDnsZone": "privatelink.postgres.database.azure.com"
    },
    {
      "name": "redis-private-endpoint",
      "resourceId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.Cache/Redis/econeura-ia-cache",
      "subnetId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.Network/virtualNetworks/econeura-ia-vnet/subnets/cache-subnet",
      "privateDnsZone": "privatelink.redis.cache.windows.net"
    },
    {
      "name": "storage-private-endpoint",
      "resourceId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.Storage/storageAccounts/econeuraiastorage",
      "subnetId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.Network/virtualNetworks/econeura-ia-vnet/subnets/app-subnet",
      "privateDnsZone": "privatelink.blob.core.windows.net"
    },
    {
      "name": "keyvault-private-endpoint",
      "resourceId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.KeyVault/vaults/econeura-ia-vault",
      "subnetId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.Network/virtualNetworks/econeura-ia-vnet/subnets/app-subnet",
      "privateDnsZone": "privatelink.vaultcore.azure.net"
    }
  ]
}
```

## 🛡️ WEB APPLICATION FIREWALL

### WAF Configuration
```json
{
  "webApplicationFirewall": {
    "enabled": true,
    "mode": "Prevention",
    "ruleSetType": "OWASP",
    "ruleSetVersion": "3.2",
    "customRules": [
      {
        "name": "BlockSuspiciousUserAgents",
        "priority": 100,
        "ruleType": "MatchRule",
        "action": "Block",
        "matchConditions": [
          {
            "matchVariables": [
              {
                "variableName": "RequestHeaders",
                "selector": "User-Agent"
              }
            ],
            "operator": "Contains",
            "negationConditon": false,
            "matchValues": [
              "sqlmap",
              "nikto",
              "nmap",
              "masscan"
            ]
          }
        ]
      },
      {
        "name": "RateLimitPerIP",
        "priority": 200,
        "ruleType": "RateLimitRule",
        "action": "Block",
        "rateLimitDuration": "PT1M",
        "rateLimitThreshold": 100
      },
      {
        "name": "BlockSQLInjection",
        "priority": 300,
        "ruleType": "MatchRule",
        "action": "Block",
        "matchConditions": [
          {
            "matchVariables": [
              {
                "variableName": "RequestUri"
              },
              {
                "variableName": "RequestArgs"
              }
            ],
            "operator": "Contains",
            "negationConditon": false,
            "matchValues": [
              "union select",
              "drop table",
              "insert into",
              "delete from"
            ]
          }
        ]
      }
    ]
  }
}
```

## 🌍 CDN Y FRONT DOOR

### Azure Front Door Configuration
```json
{
  "azureFrontDoor": {
    "name": "econeura-ia-frontdoor",
    "routingRules": [
      {
        "name": "api-routing",
        "frontendEndpoints": ["api.econeura.com"],
        "backendPools": ["api-backend-pool"],
        "patternsToMatch": ["/api/*"],
        "forwardingProtocol": "HttpsOnly",
        "cacheConfiguration": {
          "queryParameterStripDirective": "StripAll",
          "dynamicCompression": "Enabled"
        }
      },
      {
        "name": "web-routing",
        "frontendEndpoints": ["app.econeura.com"],
        "backendPools": ["web-backend-pool"],
        "patternsToMatch": ["/*"],
        "forwardingProtocol": "HttpsOnly",
        "cacheConfiguration": {
          "queryParameterStripDirective": "StripAll",
          "dynamicCompression": "Enabled",
          "cacheBehavior": "BypassCache"
        }
      }
    ],
    "backendPools": [
      {
        "name": "api-backend-pool",
        "backends": [
          {
            "address": "econeura-ia-api.azurewebsites.net",
            "httpPort": 80,
            "httpsPort": 443,
            "priority": 1,
            "weight": 100
          }
        ],
        "healthProbeSettings": {
          "name": "api-health-probe",
          "path": "/health",
          "protocol": "Https",
          "intervalInSeconds": 30
        }
      },
      {
        "name": "web-backend-pool",
        "backends": [
          {
            "address": "econeura-ia-web.azurewebsites.net",
            "httpPort": 80,
            "httpsPort": 443,
            "priority": 1,
            "weight": 100
          }
        ],
        "healthProbeSettings": {
          "name": "web-health-probe",
          "path": "/",
          "protocol": "Https",
          "intervalInSeconds": 30
        }
      }
    ],
    "securityPolicy": {
      "name": "econeura-security-policy",
      "wafPolicy": {
        "name": "econeura-waf-policy",
        "mode": "Prevention",
        "ruleSetType": "OWASP",
        "ruleSetVersion": "3.2"
      }
    }
  }
}
```

## 🔍 DNS CONFIGURATION

### DNS Settings
```json
{
  "dns": {
    "domain": "econeura.com",
    "subdomains": [
      {
        "name": "app.econeura.com",
        "type": "CNAME",
        "value": "econeura-ia-frontdoor.azurefd.net"
      },
      {
        "name": "api.econeura.com",
        "type": "CNAME",
        "value": "econeura-ia-frontdoor.azurefd.net"
      },
      {
        "name": "admin.econeura.com",
        "type": "CNAME",
        "value": "econeura-ia-frontdoor.azurefd.net"
      }
    ],
    "dnsZones": [
      {
        "name": "econeura.com",
        "resourceGroup": "econeura-ia-rg",
        "nameServers": [
          "ns1-01.azure-dns.com",
          "ns2-01.azure-dns.net",
          "ns3-01.azure-dns.org",
          "ns4-01.azure-dns.info"
        ]
      }
    ]
  }
}
```

## 🔐 SSL/TLS CONFIGURATION

### SSL Certificate Configuration
```json
{
  "sslCertificates": [
    {
      "name": "econeura-ssl-cert",
      "type": "AppServiceCertificate",
      "domains": [
        "econeura.com",
        "*.econeura.com"
      ],
      "autoRenew": true,
      "keyVaultSecretName": "econeura-ssl-cert-secret",
      "keyVaultResourceId": "/subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.KeyVault/vaults/econeura-ia-vault"
    }
  ],
  "tlsSettings": {
    "minimumTlsVersion": "1.2",
    "httpsOnly": true,
    "hsts": {
      "enabled": true,
      "maxAge": 31536000,
      "includeSubDomains": true,
      "preload": true
    }
  }
}
```

## 📊 MONITORING Y ALERTAS

### Network Monitoring
```json
{
  "networkMonitoring": {
    "alerts": [
      {
        "name": "High Request Volume",
        "description": "Alert when request volume exceeds threshold",
        "condition": {
          "metric": "Http2xx",
          "operator": "greaterThan",
          "threshold": 1000,
          "timeWindow": "PT5M",
          "frequency": "PT1M"
        },
        "severity": "Warning"
      },
      {
        "name": "Blocked Requests",
        "description": "Alert when blocked requests exceed threshold",
        "condition": {
          "metric": "Http4xx",
          "operator": "greaterThan",
          "threshold": 100,
          "timeWindow": "PT5M",
          "frequency": "PT1M"
        },
        "severity": "Warning"
      },
      {
        "name": "WAF Blocked Requests",
        "description": "Alert when WAF blocks requests",
        "condition": {
          "metric": "WafBlockedRequests",
          "operator": "greaterThan",
          "threshold": 10,
          "timeWindow": "PT5M",
          "frequency": "PT1M"
        },
        "severity": "Critical"
      }
    ],
    "dashboards": [
      {
        "name": "Network Security Dashboard",
        "widgets": [
          {
            "type": "metric",
            "title": "Request Volume",
            "metric": "Http2xx",
            "aggregation": "sum",
            "timeGrain": "PT1M"
          },
          {
            "type": "metric",
            "title": "Blocked Requests",
            "metric": "Http4xx",
            "aggregation": "sum",
            "timeGrain": "PT1M"
          },
          {
            "type": "metric",
            "title": "WAF Blocked Requests",
            "metric": "WafBlockedRequests",
            "aggregation": "sum",
            "timeGrain": "PT1M"
          }
        ]
      }
    ]
  }
}
```

## 🚀 DEPLOYMENT

### Azure CLI Commands
```bash
# Configure Access Restrictions
az webapp config access-restriction add \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --rule-name "Allow ECONEURA Office" \
  --action Allow \
  --ip-address 203.0.113.0/24 \
  --priority 300

# Configure VNet Integration
az webapp vnet-integration add \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --vnet econeura-ia-vnet \
  --subnet app-subnet

# Configure Private Endpoints
az network private-endpoint create \
  --name database-private-endpoint \
  --resource-group econeura-ia-rg \
  --vnet-name econeura-ia-vnet \
  --subnet db-subnet \
  --private-connection-resource-id /subscriptions/{subscription-id}/resourceGroups/econeura-ia-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/econeura-ia-db \
  --group-id postgresqlServer \
  --connection-name database-connection

# Configure SSL Certificate
az webapp config ssl upload \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app \
  --certificate-file econeura-ssl-cert.pfx \
  --certificate-password "cert-password"
```

### ARM Template
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appServiceName": {
      "type": "string",
      "defaultValue": "econeura-ia-app"
    },
    "vnetName": {
      "type": "string",
      "defaultValue": "econeura-ia-vnet"
    },
    "subnetName": {
      "type": "string",
      "defaultValue": "app-subnet"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites/config",
      "apiVersion": "2021-02-01",
      "name": "[concat(parameters('appServiceName'), '/web')]",
      "properties": {
        "vnetRouteAllEnabled": true,
        "vnetPrivatePortsCount": 0,
        "vnetName": "[parameters('vnetName')]",
        "vnetResourceGroupName": "[resourceGroup().name]",
        "vnetSubnetName": "[parameters('subnetName')]"
      }
    },
    {
      "type": "Microsoft.Web/sites/config",
      "apiVersion": "2021-02-01",
      "name": "[concat(parameters('appServiceName'), '/accessRestrictions')]",
      "properties": {
        "defaultAction": "Deny",
        "ipSecurityRestrictions": [
          {
            "name": "Allow Azure Services",
            "ipAddress": "AzureServices",
            "action": "Allow",
            "priority": 100
          },
          {
            "name": "Allow ECONEURA Office",
            "ipAddress": "203.0.113.0/24",
            "action": "Allow",
            "priority": 300
          }
        ]
      }
    }
  ]
}
```

## 🔍 TROUBLESHOOTING

### Common Issues

#### Access Restrictions
```bash
# Check current access restrictions
az webapp config access-restriction show \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app

# Test access from specific IP
curl -H "X-Forwarded-For: 203.0.113.1" https://econeura-ia-app.azurewebsites.net/health
```

#### VNet Integration
```bash
# Check VNet integration status
az webapp vnet-integration show \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app

# Test connectivity to private resources
az webapp ssh \
  --resource-group econeura-ia-rg \
  --name econeura-ia-app
```

#### Private Endpoints
```bash
# Check private endpoint status
az network private-endpoint show \
  --name database-private-endpoint \
  --resource-group econeura-ia-rg

# Test DNS resolution
nslookup econeura-ia-db.postgres.database.azure.com
```

## 📚 REFERENCIAS

- [Azure App Service Access Restrictions](https://docs.microsoft.com/en-us/azure/app-service/app-service-ip-restrictions)
- [VNet Integration](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet)
- [Private Endpoints](https://docs.microsoft.com/en-us/azure/private-link/private-endpoint-overview)
- [Web Application Firewall](https://docs.microsoft.com/en-us/azure/web-application-firewall/)
- [Azure Front Door](https://docs.microsoft.com/en-us/azure/frontdoor/)
