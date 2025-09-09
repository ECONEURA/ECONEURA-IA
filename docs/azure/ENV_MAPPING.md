# Environment Variable Mapping - Azure App Service

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Mapeo de variables de entorno entre desarrollo, staging y producción

## 📋 RESUMEN EJECUTIVO

Este documento mapea todas las variables de entorno utilizadas en ECONEURA-IA, mostrando cómo se configuran en diferentes entornos y cómo se mapean a Azure App Service.

## 🔄 MAPEO DE VARIABLES

### Variables de Sistema Azure
| Variable | Desarrollo | Staging | Producción | Descripción |
|----------|------------|---------|------------|-------------|
| `PORT` | 3001 | 8080 | 8080 | Puerto de la aplicación |
| `HOST` | localhost | 0.0.0.0 | 0.0.0.0 | Host de la aplicación |
| `NODE_ENV` | development | staging | production | Entorno de Node.js |
| `WEBSITE_SITE_NAME` | - | econeura-ia-staging | econeura-ia-app | Nombre del sitio Azure |
| `WEBSITE_RESOURCE_GROUP` | - | econeura-ia-staging-rg | econeura-ia-rg | Grupo de recursos |
| `WEBSITE_OWNER_NAME` | - | econeura-team | econeura-team | Propietario del sitio |

### Variables de Aplicación
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `API_URL` | http://localhost:3001 | https://api-staging.econeura.com | https://api.econeura.com | App Settings |
| `WEB_URL` | http://localhost:3000 | https://app-staging.econeura.com | https://app.econeura.com | App Settings |
| `ADMIN_URL` | http://localhost:3000/admin | https://admin-staging.econeura.com | https://admin.econeura.com | App Settings |

### Variables de Base de Datos
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `DATABASE_URL` | postgresql://user:pass@localhost:5432/econeura_dev | Key Vault | Key Vault | Key Vault |
| `DB_HOST` | localhost | Key Vault | Key Vault | Key Vault |
| `DB_PORT` | 5432 | 5432 | 5432 | App Settings |
| `DB_NAME` | econeura_dev | Key Vault | Key Vault | Key Vault |
| `DB_USER` | econeura_user | Key Vault | Key Vault | Key Vault |
| `DB_PASSWORD` | dev_password | Key Vault | Key Vault | Key Vault |
| `DB_SSL_CA` | - | Key Vault | Key Vault | Key Vault |

### Variables de Cache
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `REDIS_URL` | redis://localhost:6379 | Key Vault | Key Vault | Key Vault |
| `REDIS_HOST` | localhost | Key Vault | Key Vault | Key Vault |
| `REDIS_PORT` | 6379 | 6380 | 6380 | App Settings |
| `REDIS_PASSWORD` | - | Key Vault | Key Vault | Key Vault |
| `REDIS_TLS` | false | true | true | App Settings |

### Variables de Seguridad
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `JWT_SECRET` | dev_jwt_secret | Key Vault | Key Vault | Key Vault |
| `JWT_EXPIRES_IN` | 24h | 24h | 24h | App Settings |
| `JWT_REFRESH_EXPIRES_IN` | 7d | 7d | 7d | App Settings |
| `ENCRYPTION_KEY` | dev_encryption_key | Key Vault | Key Vault | Key Vault |
| `SESSION_SECRET` | dev_session_secret | Key Vault | Key Vault | Key Vault |

### Variables de IA
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `OPENAI_API_KEY` | dev_openai_key | Key Vault | Key Vault | Key Vault |
| `ANTHROPIC_API_KEY` | dev_anthropic_key | Key Vault | Key Vault | Key Vault |
| `GOOGLE_AI_API_KEY` | dev_google_key | Key Vault | Key Vault | Key Vault |
| `AZURE_OPENAI_API_KEY` | dev_azure_key | Key Vault | Key Vault | Key Vault |
| `AZURE_OPENAI_ENDPOINT` | dev_azure_endpoint | Key Vault | Key Vault | Key Vault |

### Variables de Email
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `MAILGUN_API_KEY` | dev_mailgun_key | Key Vault | Key Vault | Key Vault |
| `MAILGUN_DOMAIN` | sandbox.mailgun.org | Key Vault | Key Vault | Key Vault |
| `SENDGRID_API_KEY` | dev_sendgrid_key | Key Vault | Key Vault | Key Vault |

### Variables de Pagos
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `STRIPE_SECRET_KEY` | sk_test_... | Key Vault | Key Vault | Key Vault |
| `STRIPE_PUBLISHABLE_KEY` | pk_test_... | Key Vault | Key Vault | Key Vault |
| `STRIPE_WEBHOOK_SECRET` | whsec_test_... | Key Vault | Key Vault | Key Vault |

### Variables de OAuth
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `GOOGLE_CLIENT_ID` | dev_google_client_id | Key Vault | Key Vault | Key Vault |
| `GOOGLE_CLIENT_SECRET` | dev_google_client_secret | Key Vault | Key Vault | Key Vault |
| `GITHUB_CLIENT_ID` | dev_github_client_id | Key Vault | Key Vault | Key Vault |
| `GITHUB_CLIENT_SECRET` | dev_github_client_secret | Key Vault | Key Vault | Key Vault |
| `MICROSOFT_CLIENT_ID` | dev_microsoft_client_id | Key Vault | Key Vault | Key Vault |
| `MICROSOFT_CLIENT_SECRET` | dev_microsoft_client_secret | Key Vault | Key Vault | Key Vault |

### Variables de Monitoreo
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | - | Key Vault | Key Vault | Key Vault |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | - | Key Vault | Key Vault | Key Vault |
| `APPINSIGHTS_SAMPLING_PERCENTAGE` | 100 | 10 | 10 | App Settings |
| `APPINSIGHTS_ENABLE_QUERY_LOGGING` | true | false | false | App Settings |
| `APPINSIGHTS_ENABLE_DEPENDENCY_TRACKING` | true | true | true | App Settings |
| `APPINSIGHTS_ENABLE_PERFORMANCE_COUNTERS` | true | true | true | App Settings |

### Variables de Logging
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `LOG_LEVEL` | debug | info | info | App Settings |
| `LOG_FORMAT` | pretty | json | json | App Settings |
| `LOG_RETENTION_DAYS` | 7 | 30 | 30 | App Settings |
| `UPLOADS_DIR` | ./uploads | /home/uploads | /home/uploads | App Settings |
| `TEMP_DIR` | ./tmp | /tmp/econeura | /tmp/econeura | App Settings |
| `LOGS_DIR` | ./logs | /home/logs | /home/logs | App Settings |
| `CACHE_DIR` | ./cache | /tmp/cache | /tmp/cache | App Settings |

### Variables de CORS
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `CORS_ORIGINS` | http://localhost:3000,http://localhost:3001 | https://app-staging.econeura.com,https://api-staging.econeura.com | https://app.econeura.com,https://api.econeura.com | App Settings |
| `CORS_CREDENTIALS` | true | true | true | App Settings |
| `CORS_METHODS` | GET,POST,PUT,DELETE,OPTIONS | GET,POST,PUT,DELETE,OPTIONS | GET,POST,PUT,DELETE,OPTIONS | App Settings |
| `CORS_HEADERS` | Content-Type,Authorization,X-Requested-With | Content-Type,Authorization,X-Requested-With | Content-Type,Authorization,X-Requested-With | App Settings |

### Variables de Rate Limiting
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `RATE_LIMIT_WINDOW_MS` | 900000 | 900000 | 900000 | App Settings |
| `RATE_LIMIT_MAX_REQUESTS` | 1000 | 100 | 100 | App Settings |
| `RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS` | false | false | false | App Settings |
| `RATE_LIMIT_SKIP_FAILED_REQUESTS` | false | false | false | App Settings |

### Variables de FinOps
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `FINOPS_DAILY_LIMIT_EUR` | 1000 | 100 | 100 | App Settings |
| `FINOPS_MONTHLY_LIMIT_EUR` | 10000 | 1000 | 1000 | App Settings |
| `FINOPS_PER_REQUEST_LIMIT_EUR` | 100 | 10 | 10 | App Settings |
| `FINOPS_WARNING_THRESHOLD` | 0.8 | 0.8 | 0.8 | App Settings |
| `FINOPS_CRITICAL_THRESHOLD` | 0.95 | 0.95 | 0.95 | App Settings |
| `FINOPS_EMERGENCY_THRESHOLD` | 1.0 | 1.0 | 1.0 | App Settings |

### Variables de Agentes
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `AGENT_MEMORY_TTL_DEFAULT` | 3600 | 3600 | 3600 | App Settings |
| `AGENT_MEMORY_CLEANUP_INTERVAL` | 300000 | 300000 | 300000 | App Settings |
| `AGENT_MAX_EXECUTION_TIME_MS` | 30000 | 30000 | 30000 | App Settings |
| `AGENT_MAX_RETRIES` | 3 | 3 | 3 | App Settings |
| `AGENT_RETRY_DELAY_MS` | 1000 | 1000 | 1000 | App Settings |

### Variables de WebSocket
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `WEBSOCKET_HEARTBEAT_INTERVAL` | 30000 | 30000 | 30000 | App Settings |
| `WEBSOCKET_MAX_CONNECTIONS` | 100 | 1000 | 1000 | App Settings |
| `WEBSOCKET_MESSAGE_SIZE_LIMIT` | 1048576 | 1048576 | 1048576 | App Settings |
| `WEBSOCKET_PING_TIMEOUT` | 60000 | 60000 | 60000 | App Settings |
| `WEBSOCKET_PONG_TIMEOUT` | 60000 | 60000 | 60000 | App Settings |

### Variables de Archivos
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `FILE_UPLOAD_MAX_SIZE` | 10485760 | 10485760 | 10485760 | App Settings |
| `FILE_UPLOAD_MAX_FILES` | 5 | 5 | 5 | App Settings |
| `FILE_UPLOAD_ALLOWED_TYPES` | jpeg,jpg,png,gif,pdf,doc,docx | jpeg,jpg,png,gif,pdf,doc,docx | jpeg,jpg,png,gif,pdf,doc,docx | App Settings |
| `FILE_UPLOAD_CLEANUP_INTERVAL` | 3600000 | 3600000 | 3600000 | App Settings |
| `FILE_UPLOAD_RETENTION_DAYS` | 30 | 30 | 30 | App Settings |

### Variables de Backup
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `BACKUP_ENABLED` | false | true | true | App Settings |
| `BACKUP_FREQUENCY` | daily | daily | daily | App Settings |
| `BACKUP_RETENTION_DAYS` | 7 | 30 | 30 | App Settings |
| `BACKUP_ENCRYPTION` | false | true | true | App Settings |
| `BACKUP_COMPRESSION` | false | true | true | App Settings |

### Variables de Monitoreo
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `MONITORING_ENABLED` | true | true | true | App Settings |
| `MONITORING_METRICS_INTERVAL` | 60000 | 60000 | 60000 | App Settings |
| `MONITORING_HEALTH_CHECK_INTERVAL` | 30000 | 30000 | 30000 | App Settings |
| `MONITORING_ALERT_THRESHOLDS` | 80,90,95 | 80,90,95 | 80,90,95 | App Settings |
| `MONITORING_LOG_LEVEL` | debug | info | info | App Settings |

### Variables de Seguridad
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `SECURITY_ENABLED` | true | true | true | App Settings |
| `SECURITY_HTTPS_ONLY` | false | true | true | App Settings |
| `SECURITY_HSTS_MAX_AGE` | 31536000 | 31536000 | 31536000 | App Settings |
| `SECURITY_CSP_ENABLED` | true | true | true | App Settings |
| `SECURITY_XSS_PROTECTION` | true | true | true | App Settings |
| `SECURITY_CONTENT_TYPE_NOSNIFF` | true | true | true | App Settings |
| `SECURITY_FRAME_OPTIONS` | DENY | DENY | DENY | App Settings |
| `SECURITY_REFERRER_POLICY` | strict-origin-when-cross-origin | strict-origin-when-cross-origin | strict-origin-when-cross-origin | App Settings |

### Variables de Rendimiento
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `PERFORMANCE_CACHE_TTL` | 3600 | 3600 | 3600 | App Settings |
| `PERFORMANCE_COMPRESSION_ENABLED` | true | true | true | App Settings |
| `PERFORMANCE_MINIFY_ENABLED` | false | true | true | App Settings |
| `PERFORMANCE_BUNDLE_ANALYZE` | true | false | false | App Settings |
| `PERFORMANCE_IMAGE_OPTIMIZATION` | true | true | true | App Settings |

### Variables de Desarrollo
| Variable | Desarrollo | Staging | Producción | Fuente |
|----------|------------|---------|------------|--------|
| `DEVELOPMENT_MODE` | true | false | false | App Settings |
| `DEBUG_MODE` | true | false | false | App Settings |
| `VERBOSE_LOGGING` | true | false | false | App Settings |
| `PROFILING_ENABLED` | true | false | false | App Settings |
| `TRACING_ENABLED` | true | true | true | App Settings |

## 🔐 CONFIGURACIÓN DE KEY VAULT

### Secretos en Key Vault
```json
{
  "secrets": [
    "database-url",
    "db-host",
    "db-name",
    "db-user",
    "db-password",
    "db-ssl-ca",
    "redis-url",
    "redis-host",
    "redis-password",
    "jwt-secret",
    "encryption-key",
    "session-secret",
    "openai-api-key",
    "anthropic-api-key",
    "google-ai-api-key",
    "azure-openai-api-key",
    "azure-openai-endpoint",
    "mailgun-api-key",
    "mailgun-domain",
    "sendgrid-api-key",
    "stripe-secret-key",
    "stripe-publishable-key",
    "stripe-webhook-secret",
    "google-client-id",
    "google-client-secret",
    "github-client-id",
    "github-client-secret",
    "microsoft-client-id",
    "microsoft-client-secret",
    "applicationinsights-connection-string",
    "appinsights-instrumentationkey",
    "database-connection-string",
    "redis-connection-string",
    "storage-connection-string"
  ]
}
```

### Referencias de Key Vault
```json
{
  "keyVaultReferences": {
    "DATABASE_URL": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/database-url/)",
    "REDIS_URL": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/redis-url/)",
    "JWT_SECRET": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/jwt-secret/)",
    "OPENAI_API_KEY": "@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/openai-api-key/)"
  }
}
```

## 🚀 DEPLOYMENT

### Configuración por Entorno

#### Desarrollo
```bash
# .env.development
NODE_ENV=development
PORT=3001
HOST=localhost
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/econeura_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_jwt_secret
LOG_LEVEL=debug
```

#### Staging
```bash
# Azure App Service - Staging
NODE_ENV=staging
PORT=8080
HOST=0.0.0.0
API_URL=https://api-staging.econeura.com
WEB_URL=https://app-staging.econeura.com
DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/database-url/)
REDIS_URL=@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/redis-url/)
JWT_SECRET=@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/jwt-secret/)
LOG_LEVEL=info
```

#### Producción
```bash
# Azure App Service - Production
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
API_URL=https://api.econeura.com
WEB_URL=https://app.econeura.com
DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/database-url/)
REDIS_URL=@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/redis-url/)
JWT_SECRET=@Microsoft.KeyVault(SecretUri=https://econeura-ia-vault.vault.azure.net/secrets/jwt-secret/)
LOG_LEVEL=info
```

## 🔍 VALIDACIÓN

### Script de Validación
```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET'
];

function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('Environment validation passed');
}

export { validateEnvironment };
```

### Health Check
```javascript
// apps/api/src/routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    variables: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? '***' : 'MISSING',
      REDIS_URL: process.env.REDIS_URL ? '***' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? '***' : 'MISSING'
    }
  };
  
  res.json(health);
});
```

## 📚 REFERENCIAS

- [Azure App Service Environment Variables](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs#environment-variables)
- [Azure Key Vault References](https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
