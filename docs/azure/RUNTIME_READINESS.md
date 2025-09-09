# Runtime Readiness - Azure App Service

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Documentar la preparación del runtime para Azure App Service

## 📋 RESUMEN EJECUTIVO

Este documento describe la preparación del runtime de ECONEURA-IA para Azure App Service, incluyendo configuración de puertos, sistema de archivos efímero, WebSockets, y Run-From-Package.

## 🔧 CONFIGURACIÓN DE RUNTIME

### Node.js Configuration
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "start": "node apps/api/src/server.js",
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:web\"",
    "build": "turbo run build",
    "test": "turbo run test"
  }
}
```

### Package.json Configuration
```json
{
  "name": "econeura-ia",
  "version": "1.0.0",
  "type": "module",
  "main": "apps/api/src/server.js",
  "files": [
    "apps/api/dist/**/*",
    "apps/web/.next/**/*",
    "packages/**/*"
  ]
}
```

## 🌐 CONFIGURACIÓN DE PUERTO

### PORT Environment Variable
```javascript
// apps/api/src/server.js
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Port: ${PORT}`);
});
```

### Azure App Service Port Configuration
```bash
# Azure App Service automatically sets PORT environment variable
# Default port: 8080 (internal)
# External port: 80 (HTTP) / 443 (HTTPS)
```

### Port Validation
```javascript
// Validation function
function validatePort() {
  const port = process.env.PORT;
  if (!port || isNaN(parseInt(port))) {
    throw new Error('PORT environment variable is required and must be a number');
  }
  return parseInt(port);
}
```

## 💾 SISTEMA DE ARCHIVOS EFÍMERO

### Azure App Service File System
- **Persistent Storage:** `/home` directory (limited to 1GB)
- **Temporary Storage:** `/tmp` directory (limited to 2GB)
- **Application Files:** `/home/site/wwwroot` (deployment location)

### File System Configuration
```javascript
// apps/api/src/config/filesystem.js
const path = require('path');
const fs = require('fs');

const config = {
  // Persistent storage for user uploads
  uploadsDir: process.env.UPLOADS_DIR || '/home/uploads',
  
  // Temporary storage for processing
  tempDir: process.env.TEMP_DIR || '/tmp/econeura',
  
  // Logs directory
  logsDir: process.env.LOGS_DIR || '/home/logs',
  
  // Cache directory
  cacheDir: process.env.CACHE_DIR || '/tmp/cache'
};

// Ensure directories exist
function ensureDirectories() {
  Object.values(config).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

module.exports = { config, ensureDirectories };
```

### File System Best Practices
```javascript
// File operations with Azure App Service considerations
class FileManager {
  constructor() {
    this.uploadsPath = '/home/uploads';
    this.tempPath = '/tmp/econeura';
  }

  async saveFile(file, filename) {
    // Use persistent storage for user files
    const filePath = path.join(this.uploadsPath, filename);
    await fs.promises.writeFile(filePath, file.buffer);
    return filePath;
  }

  async processFile(file) {
    // Use temporary storage for processing
    const tempPath = path.join(this.tempPath, `temp_${Date.now()}_${file.originalname}`);
    await fs.promises.writeFile(tempPath, file.buffer);
    
    // Process file...
    
    // Clean up temporary file
    await fs.promises.unlink(tempPath);
  }

  async cleanupTempFiles() {
    // Clean up files older than 1 hour
    const files = await fs.promises.readdir(this.tempPath);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(this.tempPath, file);
      const stats = await fs.promises.stat(filePath);
      
      if (now - stats.mtime.getTime() > 3600000) { // 1 hour
        await fs.promises.unlink(filePath);
      }
    }
  }
}
```

## 🔌 WEBSOCKETS CONFIGURATION

### WebSocket Support in Azure App Service
```javascript
// apps/api/src/websocket/server.js
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer();
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
    // Handle message
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

export { wss };
```

### WebSocket Configuration for Next.js
```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable WebSocket support
  experimental: {
    serverComponentsExternalPackages: ['ws']
  },
  
  // WebSocket proxy configuration
  async rewrites() {
    return [
      {
        source: '/ws/:path*',
        destination: `${process.env.API_URL}/ws/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
```

### Azure App Service WebSocket Settings
```json
{
  "webSocketEnabled": true,
  "alwaysOn": true,
  "httpLoggingEnabled": true,
  "detailedErrorLoggingEnabled": true
}
```

## 📦 RUN-FROM-PACKAGE CONFIGURATION

### Run-From-Package Benefits
- **Faster Deployments:** No file extraction needed
- **Better Performance:** Files served directly from package
- **Reduced I/O:** Less disk usage
- **Atomic Deployments:** All-or-nothing deployment

### Configuration
```json
{
  "WEBSITE_RUN_FROM_PACKAGE": "1",
  "WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_RESOURCE_ID": "/subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identity-name}",
  "WEBSITE_RUN_FROM_PACKAGE_BLOB_MI_CLIENT_ID": "{client-id}"
}
```

### Package Structure
```
econeura-ia-package.zip
├── apps/
│   ├── api/
│   │   ├── dist/
│   │   ├── node_modules/
│   │   └── package.json
│   └── web/
│       ├── .next/
│       ├── node_modules/
│       └── package.json
├── packages/
│   └── shared/
│       ├── dist/
│       └── node_modules/
├── package.json
└── turbo.json
```

### Build Configuration
```json
{
  "scripts": {
    "build:azure": "turbo run build && npm run package:azure",
    "package:azure": "zip -r econeura-ia-package.zip . -x '*.git*' '*.env*' 'node_modules/.cache/*'"
  }
}
```

## 🔧 ENVIRONMENT CONFIGURATION

### Required Environment Variables
```bash
# Azure App Service specific
PORT=8080
WEBSITE_SITE_NAME=econeura-ia-app
WEBSITE_RESOURCE_GROUP=econeura-ia-rg
WEBSITE_OWNER_NAME=econeura-team

# Application specific
NODE_ENV=production
API_URL=https://api.econeura.com
WEB_URL=https://app.econeura.com

# Database
DATABASE_URL=postgresql://user:pass@server:5432/db
REDIS_URL=redis://server:6379

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Monitoring
APPINSIGHTS_INSTRUMENTATIONKEY=your-key
APPLICATIONINSIGHTS_CONNECTION_STRING=your-connection-string
```

### Environment Validation
```javascript
// apps/api/src/config/environment.js
const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
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

## 📊 MONITORING Y LOGGING

### Application Insights Integration
```javascript
// apps/api/src/monitoring/insights.js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableAjaxErrorStatusText: true,
    enableAjaxPerfTracking: true,
    maxAjaxCallsPerView: -1,
    enableUnhandledPromiseRejectionTracking: true
  }
});

appInsights.loadAppInsights();
appInsights.trackPageView();

export { appInsights };
```

### Logging Configuration
```javascript
// apps/api/src/logging/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: '/home/logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: '/home/logs/combined.log'
    })
  ]
});

export { logger };
```

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Redis connection tested
- [ ] File system permissions verified
- [ ] WebSocket support enabled
- [ ] Run-From-Package configured
- [ ] Application Insights configured
- [ ] Logging configured

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] WebSocket connections working
- [ ] File uploads working
- [ ] Logs being generated
- [ ] Application Insights data flowing
- [ ] Performance metrics within expected ranges

## 🔍 TROUBLESHOOTING

### Common Issues

#### Port Configuration
```bash
# Check if PORT is set
echo $PORT

# Check if application is listening on correct port
netstat -tlnp | grep :8080
```

#### File System Issues
```bash
# Check disk space
df -h

# Check file permissions
ls -la /home/

# Check temporary directory
ls -la /tmp/
```

#### WebSocket Issues
```bash
# Check WebSocket support
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" https://your-app.azurewebsites.net/ws
```

#### Run-From-Package Issues
```bash
# Check package deployment
az webapp deployment source show --name your-app --resource-group your-rg

# Check package contents
az webapp deployment source download --name your-app --resource-group your-rg
```

## 📚 REFERENCIAS

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Node.js on Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs)
- [WebSocket Support in Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs#websocket-support)
- [Run-From-Package](https://docs.microsoft.com/en-us/azure/app-service/deploy-run-package)
- [Application Insights for Node.js](https://docs.microsoft.com/en-us/azure/azure-monitor/app/nodejs)
