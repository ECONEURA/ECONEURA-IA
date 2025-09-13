# Environment Variables Changelog

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Historial de cambios en variables de entorno

## 📋 RESUMEN EJECUTIVO

Este documento registra todos los cambios realizados en las variables de entorno de ECONEURA-IA, incluyendo adiciones, modificaciones y eliminaciones.

## 📅 HISTORIAL DE CAMBIOS

### Versión 1.0.0 - 2025-01-09
**Estado:** ✅ Implementado  
**Descripción:** Configuración inicial de variables de entorno para Azure App Service

#### ✅ Variables Agregadas

##### Variables de Sistema Azure
- `WEBSITE_NODE_DEFAULT_VERSION` - Versión de Node.js por defecto
- `WEBSITE_RUN_FROM_PACKAGE` - Habilitar Run-From-Package
- `WEBSITE_ENABLE_SYNC_UPDATE_SITE` - Sincronización de actualizaciones
- `WEBSITE_LOAD_CERTIFICATES` - Cargar certificados
- `WEBSITE_LOAD_USER_PROFILE` - Cargar perfil de usuario
- `WEBSITE_HTTPLOGGING_RETENTION_DAYS` - Retención de logs HTTP
- `WEBSITE_DETAILED_ERROR_LOGGING_ENABLED` - Logging detallado de errores
- `WEBSITE_LOG_BUFFERING` - Buffering de logs
- `WEBSITE_SKIP_CONTENTSHARE_VALIDATION` - Saltar validación de contenido
- `WEBSITE_WEBDEPLOY_USE_SCM` - Usar SCM para WebDeploy
- `WEBSITE_USE_PLACEHOLDER` - Usar placeholder
- `WEBSITE_SWAP_WARMUP_PING_PATH` - Ruta de ping para warmup
- `WEBSITE_SWAP_WARMUP_PING_STATUSES` - Estados de ping para warmup
- `WEBSITE_SWAP_WARMUP_PING_INTERVAL` - Intervalo de ping para warmup
- `WEBSITE_SWAP_WARMUP_PING_DURATION` - Duración de ping para warmup

##### Variables de Aplicación
- `API_URL` - URL de la API
- `WEB_URL` - URL de la aplicación web
- `ADMIN_URL` - URL del panel de administración

##### Variables de Base de Datos
- `DATABASE_URL` - URL de conexión a la base de datos
- `DB_HOST` - Host de la base de datos
- `DB_PORT` - Puerto de la base de datos
- `DB_NAME` - Nombre de la base de datos
- `DB_USER` - Usuario de la base de datos
- `DB_PASSWORD` - Contraseña de la base de datos
- `DB_SSL_CA` - Certificado SSL de la base de datos

##### Variables de Cache
- `REDIS_URL` - URL de conexión a Redis
- `REDIS_HOST` - Host de Redis
- `REDIS_PORT` - Puerto de Redis
- `REDIS_PASSWORD` - Contraseña de Redis
- `REDIS_TLS` - Habilitar TLS para Redis

##### Variables de Seguridad
- `JWT_SECRET` - Secreto para JWT
- `JWT_EXPIRES_IN` - Tiempo de expiración de JWT
- `JWT_REFRESH_EXPIRES_IN` - Tiempo de expiración de refresh token
- `ENCRYPTION_KEY` - Clave de encriptación
- `SESSION_SECRET` - Secreto para sesiones

##### Variables de IA
- `OPENAI_API_KEY` - Clave API de OpenAI
- `ANTHROPIC_API_KEY` - Clave API de Anthropic
- `GOOGLE_AI_API_KEY` - Clave API de Google AI
- `AZURE_OPENAI_API_KEY` - Clave API de Azure OpenAI
- `AZURE_OPENAI_ENDPOINT` - Endpoint de Azure OpenAI

##### Variables de Email
- `MAILGUN_API_KEY` - Clave API de Mailgun
- `MAILGUN_DOMAIN` - Dominio de Mailgun
- `SENDGRID_API_KEY` - Clave API de SendGrid

##### Variables de Pagos
- `STRIPE_SECRET_KEY` - Clave secreta de Stripe
- `STRIPE_PUBLISHABLE_KEY` - Clave pública de Stripe
- `STRIPE_WEBHOOK_SECRET` - Secreto de webhook de Stripe

##### Variables de OAuth
- `GOOGLE_CLIENT_ID` - ID de cliente de Google
- `GOOGLE_CLIENT_SECRET` - Secreto de cliente de Google
- `GITHUB_CLIENT_ID` - ID de cliente de GitHub
- `GITHUB_CLIENT_SECRET` - Secreto de cliente de GitHub
- `MICROSOFT_CLIENT_ID` - ID de cliente de Microsoft
- `MICROSOFT_CLIENT_SECRET` - Secreto de cliente de Microsoft

##### Variables de Monitoreo
- `APPLICATIONINSIGHTS_CONNECTION_STRING` - Cadena de conexión de Application Insights
- `APPINSIGHTS_INSTRUMENTATIONKEY` - Clave de instrumentación de Application Insights
- `APPINSIGHTS_SAMPLING_PERCENTAGE` - Porcentaje de muestreo
- `APPINSIGHTS_ENABLE_QUERY_LOGGING` - Habilitar logging de consultas
- `APPINSIGHTS_ENABLE_DEPENDENCY_TRACKING` - Habilitar tracking de dependencias
- `APPINSIGHTS_ENABLE_PERFORMANCE_COUNTERS` - Habilitar contadores de rendimiento

##### Variables de Logging
- `LOG_LEVEL` - Nivel de logging
- `LOG_FORMAT` - Formato de logging
- `LOG_RETENTION_DAYS` - Días de retención de logs
- `UPLOADS_DIR` - Directorio de uploads
- `TEMP_DIR` - Directorio temporal
- `LOGS_DIR` - Directorio de logs
- `CACHE_DIR` - Directorio de cache

##### Variables de CORS
- `CORS_ORIGINS` - Orígenes permitidos para CORS
- `CORS_CREDENTIALS` - Habilitar credenciales en CORS
- `CORS_METHODS` - Métodos permitidos para CORS
- `CORS_HEADERS` - Headers permitidos para CORS

##### Variables de Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Ventana de tiempo para rate limiting
- `RATE_LIMIT_MAX_REQUESTS` - Máximo de requests por ventana
- `RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS` - Saltar requests exitosos
- `RATE_LIMIT_SKIP_FAILED_REQUESTS` - Saltar requests fallidos

##### Variables de FinOps
- `FINOPS_DAILY_LIMIT_EUR` - Límite diario en euros
- `FINOPS_MONTHLY_LIMIT_EUR` - Límite mensual en euros
- `FINOPS_PER_REQUEST_LIMIT_EUR` - Límite por request en euros
- `FINOPS_WARNING_THRESHOLD` - Umbral de advertencia
- `FINOPS_CRITICAL_THRESHOLD` - Umbral crítico
- `FINOPS_EMERGENCY_THRESHOLD` - Umbral de emergencia

##### Variables de Agentes
- `AGENT_MEMORY_TTL_DEFAULT` - TTL por defecto de memoria de agentes
- `AGENT_MEMORY_CLEANUP_INTERVAL` - Intervalo de limpieza de memoria
- `AGENT_MAX_EXECUTION_TIME_MS` - Tiempo máximo de ejecución
- `AGENT_MAX_RETRIES` - Máximo de reintentos
- `AGENT_RETRY_DELAY_MS` - Delay entre reintentos

##### Variables de WebSocket
- `WEBSOCKET_HEARTBEAT_INTERVAL` - Intervalo de heartbeat
- `WEBSOCKET_MAX_CONNECTIONS` - Máximo de conexiones
- `WEBSOCKET_MESSAGE_SIZE_LIMIT` - Límite de tamaño de mensaje
- `WEBSOCKET_PING_TIMEOUT` - Timeout de ping
- `WEBSOCKET_PONG_TIMEOUT` - Timeout de pong

##### Variables de Archivos
- `FILE_UPLOAD_MAX_SIZE` - Tamaño máximo de archivo
- `FILE_UPLOAD_MAX_FILES` - Máximo de archivos
- `FILE_UPLOAD_ALLOWED_TYPES` - Tipos de archivo permitidos
- `FILE_UPLOAD_CLEANUP_INTERVAL` - Intervalo de limpieza
- `FILE_UPLOAD_RETENTION_DAYS` - Días de retención

##### Variables de Backup
- `BACKUP_ENABLED` - Habilitar backup
- `BACKUP_FREQUENCY` - Frecuencia de backup
- `BACKUP_RETENTION_DAYS` - Días de retención de backup
- `BACKUP_ENCRYPTION` - Encriptación de backup
- `BACKUP_COMPRESSION` - Compresión de backup

##### Variables de Monitoreo
- `MONITORING_ENABLED` - Habilitar monitoreo
- `MONITORING_METRICS_INTERVAL` - Intervalo de métricas
- `MONITORING_HEALTH_CHECK_INTERVAL` - Intervalo de health check
- `MONITORING_ALERT_THRESHOLDS` - Umbrales de alerta
- `MONITORING_LOG_LEVEL` - Nivel de logging de monitoreo

##### Variables de Seguridad
- `SECURITY_ENABLED` - Habilitar seguridad
- `SECURITY_HTTPS_ONLY` - Solo HTTPS
- `SECURITY_HSTS_MAX_AGE` - Edad máxima de HSTS
- `SECURITY_CSP_ENABLED` - Habilitar CSP
- `SECURITY_XSS_PROTECTION` - Protección XSS
- `SECURITY_CONTENT_TYPE_NOSNIFF` - Content-Type nosniff
- `SECURITY_FRAME_OPTIONS` - Opciones de frame
- `SECURITY_REFERRER_POLICY` - Política de referrer

##### Variables de Rendimiento
- `PERFORMANCE_CACHE_TTL` - TTL de cache
- `PERFORMANCE_COMPRESSION_ENABLED` - Habilitar compresión
- `PERFORMANCE_MINIFY_ENABLED` - Habilitar minificación
- `PERFORMANCE_BUNDLE_ANALYZE` - Analizar bundle
- `PERFORMANCE_IMAGE_OPTIMIZATION` - Optimización de imágenes

##### Variables de Desarrollo
- `DEVELOPMENT_MODE` - Modo de desarrollo
- `DEBUG_MODE` - Modo de debug
- `VERBOSE_LOGGING` - Logging verboso
- `PROFILING_ENABLED` - Habilitar profiling
- `TRACING_ENABLED` - Habilitar tracing

#### 🔄 Variables Modificadas
*No hay variables modificadas en esta versión*

#### ❌ Variables Eliminadas
*No hay variables eliminadas en esta versión*

## 🔄 MIGRACIÓN

### De Desarrollo a Staging
```bash
# Variables que cambian de desarrollo a staging
NODE_ENV=development → NODE_ENV=staging
PORT=3001 → PORT=8080
HOST=localhost → HOST=0.0.0.0
API_URL=http://localhost:3001 → API_URL=https://api-staging.econeura.com
WEB_URL=http://localhost:3000 → WEB_URL=https://app-staging.econeura.com
DATABASE_URL=postgresql://user:pass@localhost:5432/econeura_dev → Key Vault
REDIS_URL=redis://localhost:6379 → Key Vault
JWT_SECRET=dev_jwt_secret → Key Vault
LOG_LEVEL=debug → LOG_LEVEL=info
```

### De Staging a Producción
```bash
# Variables que cambian de staging a producción
NODE_ENV=staging → NODE_ENV=production
API_URL=https://api-staging.econeura.com → API_URL=https://api.econeura.com
WEB_URL=https://app-staging.econeura.com → WEB_URL=https://app.econeura.com
ADMIN_URL=https://admin-staging.econeura.com → ADMIN_URL=https://admin.econeura.com
```

## 🔐 SEGURIDAD

### Variables Sensibles
Las siguientes variables contienen información sensible y deben almacenarse en Azure Key Vault:

#### Base de Datos
- `DATABASE_URL`
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL_CA`

#### Cache
- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PASSWORD`

#### Seguridad
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `SESSION_SECRET`

#### APIs Externas
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`

#### Email
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `SENDGRID_API_KEY`

#### Pagos
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`

#### Monitoreo
- `APPLICATIONINSIGHTS_CONNECTION_STRING`
- `APPINSIGHTS_INSTRUMENTATIONKEY`

### Rotación de Secretos
```bash
# Script para rotar secretos en Key Vault
az keyvault secret set --vault-name econeura-ia-vault --name jwt-secret --value "new-secret-value"
az keyvault secret set --vault-name econeura-ia-vault --name encryption-key --value "new-encryption-key"
az keyvault secret set --vault-name econeura-ia-vault --name session-secret --value "new-session-secret"
```

## 📊 VALIDACIÓN

### Script de Validación
```javascript
// scripts/validate-env-changes.js
const envChanges = {
  '1.0.0': {
    added: [
      'WEBSITE_NODE_DEFAULT_VERSION',
      'WEBSITE_RUN_FROM_PACKAGE',
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      // ... más variables
    ],
    modified: [],
    removed: []
  }
};

function validateEnvironmentChanges(version) {
  const changes = envChanges[version];
  if (!changes) {
    throw new Error(`Unknown version: ${version}`);
  }
  
  console.log(`Environment changes for version ${version}:`);
  console.log(`Added: ${changes.added.length} variables`);
  console.log(`Modified: ${changes.modified.length} variables`);
  console.log(`Removed: ${changes.removed.length} variables`);
  
  return changes;
}

export { validateEnvironmentChanges };
```

### Health Check de Variables
```javascript
// apps/api/src/middleware/env-health.js
function checkEnvironmentHealth() {
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET'
  ];
  
  const missing = requiredVars.filter(envVar => !process.env[envVar]);
  const present = requiredVars.filter(envVar => process.env[envVar]);
  
  return {
    status: missing.length === 0 ? 'healthy' : 'unhealthy',
    missing,
    present,
    total: requiredVars.length,
    coverage: (present.length / requiredVars.length) * 100
  };
}

export { checkEnvironmentHealth };
```

## 📚 REFERENCIAS

- [Azure App Service Environment Variables](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs#environment-variables)
- [Azure Key Vault References](https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [Environment Variable Best Practices](https://12factor.net/config)
