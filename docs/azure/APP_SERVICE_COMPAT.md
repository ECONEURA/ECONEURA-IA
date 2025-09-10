# App Service compatibility checklist

- Runtime: Node.js 18+ recommended (Node 20 LTS supported). Ensure build produces plain Node artifacts (no system-level dependencies).
- Start command: If using frameworks, bind to `PORT` or `WEBSITES_PORT`.
- Storage: `WEBSITES_ENABLE_APP_SERVICE_STORAGE=false` for stateless apps.
- WebSockets: Enable at app level if required by the web or API.
- Health probes: Provide `/health` or similar endpoint in API; web can serve a lightweight health page.
- Logging: Use stdout/stderr; App Service captures logs without agent secrets.

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Documentar la compatibilidad de ECONEURA-IA con Azure App Service

## 📋 RESUMEN EJECUTIVO

Este documento detalla la compatibilidad de ECONEURA-IA con Azure App Service, incluyendo requisitos técnicos, limitaciones, y configuraciones específicas.

## ✅ COMPATIBILIDAD GENERAL

### ✅ Compatible
- **Node.js 20.x** - Runtime principal
- **Next.js 14.x** - Framework frontend
- **Express.js 4.x** - Framework backend
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y sesiones
- **WebSockets** - Comunicación en tiempo real
- **File Uploads** - Subida de archivos
- **Background Jobs** - Procesamiento asíncrono
- **SSL/TLS** - Certificados SSL
- **Custom Domains** - Dominios personalizados

### ⚠️ Limitaciones
- **File System** - Solo `/home` es persistente (1GB)
- **Memory** - Limitado por SKU seleccionado
- **CPU** - Limitado por SKU seleccionado
- **Concurrent Connections** - Limitado por SKU
- **WebSocket Connections** - Limitado por SKU

## 🔧 CONFIGURACIÓN TÉCNICA

### Runtime Stack
```json
{
  "runtime": {
    "node": "20.x",
    "npm": "10.x",
    "platform": "Linux",
    "architecture": "x64"
  },
  "frameworks": {
    "backend": "Express.js 4.18.2",
    "frontend": "Next.js 14.0.0",
    "database": "PostgreSQL 15",
    "cache": "Redis 7.0"
  }
}
```

### SKU Recommendations
| Environment | SKU | CPU | Memory | Storage | Price/Month |
|-------------|-----|-----|--------|---------|-------------|
| **Development** | B1 | 1 Core | 1.75 GB | 10 GB | ~€12 |
| **Staging** | S1 | 1 Core | 1.75 GB | 50 GB | ~€25 |
| **Production** | P1V2 | 1 Core | 3.5 GB | 250 GB | ~€50 |
| **High Load** | P2V2 | 2 Cores | 7 GB | 250 GB | ~€100 |

### Application Settings
```json
{
  "WEBSITE_NODE_DEFAULT_VERSION": "20.0.0",
  "WEBSITE_RUN_FROM_PACKAGE": "1",
  "WEBSITE_ENABLE_SYNC_UPDATE_SITE": "true",
  "WEBSITE_LOAD_CERTIFICATES": "*",
  "WEBSITE_LOAD_USER_PROFILE": "1",
  "WEBSITE_HTTPLOGGING_RETENTION_DAYS": "7",
  "WEBSITE_DETAILED_ERROR_LOGGING_ENABLED": "1",
  "WEBSITE_LOG_BUFFERING": "1"
}
```

## 🗄️ BASE DE DATOS

### PostgreSQL Compatibility
```javascript
// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.DB_SSL_CA
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20, // Maximum connections
  min: 2   // Minimum connections
};
```

### Connection Pooling
```javascript
// apps/api/src/database/pool.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { pool };
```

### Database Migrations
```javascript
// apps/api/src/database/migrate.js
import { migrate } from 'postgres-migrations';
import { pool } from './pool.js';

async function runMigrations() {
  const client = await pool.connect();
  try {
    await migrate({ client }, './migrations');
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export { runMigrations };
```

## 🔄 CACHE Y SESIONES

### Redis Configuration
```javascript
// apps/api/src/cache/redis.js
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    connectTimeout: 10000,
    lazyConnect: true,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

await redisClient.connect();

export { redisClient };
```

### Session Configuration
```javascript
// apps/api/src/middleware/session.js
import session from 'express-session';
import RedisStore from 'connect-redis';

const sessionConfig = {
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
};

export { sessionConfig };
```

## 📁 SISTEMA DE ARCHIVOS

### File Upload Handling
```javascript
// apps/api/src/middleware/upload.js
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use persistent storage in Azure App Service
    const uploadPath = process.env.UPLOADS_DIR || '/home/uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // File type validation
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export { upload };
```

### File System Monitoring
```javascript
// apps/api/src/utils/filesystem.js
import fs from 'fs';
import path from 'path';

class FileSystemMonitor {
  constructor() {
    this.uploadDir = process.env.UPLOADS_DIR || '/home/uploads';
    this.tempDir = process.env.TEMP_DIR || '/tmp/econeura';
    this.maxDiskUsage = 0.8; // 80% of available space
  }

  async checkDiskSpace() {
    try {
      const stats = await fs.promises.statfs(this.uploadDir);
      const totalSpace = stats.bavail * stats.bsize;
      const usedSpace = (stats.blocks - stats.bavail) * stats.bsize;
      const usagePercent = usedSpace / (totalSpace + usedSpace);
      
      if (usagePercent > this.maxDiskUsage) {
        console.warn(`Disk usage is at ${(usagePercent * 100).toFixed(2)}%`);
        await this.cleanupOldFiles();
      }
      
      return {
        total: totalSpace + usedSpace,
        used: usedSpace,
        available: totalSpace,
        usagePercent: usagePercent
      };
    } catch (error) {
      console.error('Error checking disk space:', error);
      throw error;
    }
  }

  async cleanupOldFiles() {
    try {
      const files = await fs.promises.readdir(this.uploadDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.promises.unlink(filePath);
          console.log(`Deleted old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }
}

export { FileSystemMonitor };
```

## 🔌 WEBSOCKETS

### WebSocket Server Configuration
```javascript
// apps/api/src/websocket/server.js
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';

const server = createServer();
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  perMessageDeflate: {
    threshold: 1024,
    concurrencyLimit: 10,
    memLevel: 7
  }
});

// Connection management
const connections = new Map();

wss.on('connection', (ws, req) => {
  const url = parse(req.url, true);
  const clientId = url.query.clientId || `client_${Date.now()}`;
  
  connections.set(clientId, ws);
  console.log(`WebSocket connection established: ${clientId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMessage(clientId, data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    connections.delete(clientId);
    console.log(`WebSocket connection closed: ${clientId}`);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
    connections.delete(clientId);
  });
});

function handleMessage(clientId, data) {
  // Handle different message types
  switch (data.type) {
    case 'ping':
      connections.get(clientId)?.send(JSON.stringify({ type: 'pong' }));
      break;
    case 'subscribe':
      // Handle subscription logic
      break;
    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

export { wss, connections };
```

### WebSocket Client (Frontend)
```javascript
// apps/web/src/lib/websocket.js
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(data) {
    // Handle incoming messages
    console.log('Received message:', data);
  }
}

export { WebSocketClient };
```

## 🔒 SEGURIDAD

### HTTPS Configuration
```javascript
// apps/api/src/middleware/security.js
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const securityConfig = {
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  rateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  })
};

export { securityConfig };
```

### CORS Configuration
```javascript
// apps/api/src/middleware/cors.js
import cors from 'cors';

const corsConfig = cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://app.econeura.com',
      'https://admin.econeura.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

export { corsConfig };
```

## 📊 MONITOREO

### Health Check Endpoint
```javascript
// apps/api/src/routes/health.js
import { Router } from 'express';
import { pool } from '../database/pool.js';
import { redisClient } from '../cache/redis.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      services: {}
    };

    // Check database
    try {
      await pool.query('SELECT 1');
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.status = 'unhealthy';
    }

    // Check Redis
    try {
      await redisClient.ping();
      health.services.redis = 'healthy';
    } catch (error) {
      health.services.redis = 'unhealthy';
      health.status = 'unhealthy';
    }

    // Check disk space
    try {
      const fs = require('fs');
      const stats = fs.statSync('/home');
      health.services.filesystem = 'healthy';
    } catch (error) {
      health.services.filesystem = 'unhealthy';
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export { router as healthRouter };
```

## 🚀 DEPLOYMENT

### Build Configuration
```json
{
  "scripts": {
    "build": "turbo run build",
    "build:azure": "npm run build && npm run package:azure",
    "package:azure": "zip -r econeura-ia-package.zip . -x '*.git*' '*.env*' 'node_modules/.cache/*' 'tests/*' 'docs/*'",
    "start": "node apps/api/src/server.js",
    "start:web": "cd apps/web && npm start",
    "start:api": "cd apps/api && npm start"
  }
}
```

### Azure DevOps Pipeline
```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'

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
      displayName: 'Build application'
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

- stage: Deploy
  jobs:
  - deployment: DeployJob
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'Azure-Service-Connection'
              appName: 'econeura-ia-app'
              package: '$(Pipeline.Workspace)/drop/$(Build.BuildId).zip'
```

## 🔍 TROUBLESHOOTING

### Common Issues and Solutions

#### Memory Issues
```bash
# Check memory usage
free -h

# Monitor memory in application
process.memoryUsage()
```

#### Database Connection Issues
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
SELECT * FROM pg_stat_activity;
```

#### WebSocket Issues
```bash
# Test WebSocket connection
wscat -c wss://your-app.azurewebsites.net/ws

# Check WebSocket support
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" https://your-app.azurewebsites.net/ws
```

#### File System Issues
```bash
# Check disk space
df -h

# Check file permissions
ls -la /home/

# Check uploads directory
ls -la /home/uploads/
```

## 📚 REFERENCIAS

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Node.js on Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs)
- [PostgreSQL on Azure](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Redis on Azure](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [WebSocket Support](https://docs.microsoft.com/en-us/azure/app-service/configure-language-nodejs#websocket-support)
