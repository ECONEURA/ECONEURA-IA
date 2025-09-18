# 📚 **DOCUMENTACIÓN COMPLETA - ECONEURA API**

## 📋 **RESUMEN EJECUTIVO**

Documentación completa de la API ECONEURA con **26 endpoints** funcionando, **14 features** implementadas y **BFF completo** en Next.js.

---

## 🏥 **HEALTH & MONITORING ENDPOINTS**

### **GET /health**
**Descripción**: Health check básico (<200ms, sin dependencias externas)
```bash
curl http://localhost:3001/health
```
**Response**:
```json
{
  "status": "ok",
  "ts": "2025-09-05T11:10:07.421Z",
  "version": "1.0.0",
  "mode": "live",
  "uptime": 156.789
}
```
**Headers**: `X-System-Mode: live|ready|degraded`

### **GET /health/live**
**Descripción**: Liveness probe con memory checks (PR-22)
```bash
curl http://localhost:3001/health/live
```
**Response**:
```json
{
  "status": "ok",
  "mode": "live",
  "timestamp": "2025-09-05T11:10:07.421Z",
  "version": "1.0.0",
  "checks": {
    "memory": { "status": "ok", "usage": 10 }
  }
}
```

### **GET /health/ready**
**Descripción**: Readiness probe con DB, cache y memory checks (PR-22)
```bash
curl http://localhost:3001/health/ready
```
**Response**:
```json
{
  "status": "ok",
  "mode": "ready",
  "timestamp": "2025-09-05T11:10:07.421Z",
  "checks": {
    "memory": { "status": "ok", "usage": 10 },
    "database": { "status": "ok", "latency": 0 },
    "cache": { "status": "ok", "hitRate": 0.92 }
  }
}
```

---

## 📊 **OBSERVABILITY & METRICS (PR-23)**

### **GET /metrics**
**Descripción**: Métricas Prometheus para monitoring
```bash
curl http://localhost:3001/metrics
```
**Response** (Prometheus format):
```prometheus
# HELP econeura_api_info API information
# TYPE econeura_api_info gauge
econeura_api_info{version="1.0.0",environment="development"} 1

# HELP econeura_cache_hits_total Total cache hits
# TYPE econeura_cache_hits_total counter
econeura_cache_hits_total{cache="all"} 0

# HELP econeura_uptime_seconds System uptime in seconds
# TYPE econeura_uptime_seconds counter
econeura_uptime_seconds 156.789
```

### **GET /cache/stats**
**Descripción**: Estadísticas detalladas de cache
```bash
curl http://localhost:3001/cache/stats
```
**Response**:
```json
{
  "success": true,
  "data": {
    "caches": {
      "users": { "hits": 0, "misses": 0, "hitRate": 0, "size": 0, "maxSize": 1000 },
      "organizations": { "hits": 0, "misses": 0, "hitRate": 0, "size": 0, "maxSize": 100 },
      "api": { "hits": 0, "misses": 0, "hitRate": 0, "size": 0, "maxSize": 2000 }
    },
    "summary": {
      "totalCaches": 5,
      "totalHits": 0,
      "totalMisses": 0,
      "overallHitRate": 0
    }
  }
}
```

---

## 📊 **ANALYTICS & EVENTS (PR-24)**

### **POST /v1/analytics/events**
**Descripción**: Tracking de eventos con validación Zod
```bash
curl -X POST http://localhost:3001/v1/analytics/events \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: demo-org" \
  -d '{"eventType":"user_action","action":"login","metadata":{"ip":"127.0.0.1"}}'
```
**Response**:
```json
{
  "success": true,
  "data": {
    "eventId": "5ff98c76-e345-464d-8cba-6f551fb5a437",
    "eventType": "user_action",
    "timestamp": "2025-09-05T11:10:07.421Z",
    "correlationId": "09a2f748-40cb-4f70-a43c-ef592aa66c5c"
  },
  "message": "Event tracked successfully"
}
```
**Headers FinOps**: `X-Est-Cost-EUR: 0.0010`, `X-Budget-Pct: 0.1`, `X-Correlation-Id`

### **GET /v1/analytics/events**
**Descripción**: Query de eventos con filtros
```bash
curl "http://localhost:3001/v1/analytics/events?eventTypes=user_action&limit=10"
```

### **GET /v1/analytics/metrics**
**Descripción**: Métricas agregadas de analytics
```bash
curl http://localhost:3001/v1/analytics/metrics
```

---

## 📡 **SERVER-SENT EVENTS**

### **GET /v1/events**
**Descripción**: Conexión SSE para eventos en tiempo real
```bash
curl -N http://localhost:3001/v1/events?subscribe=agent_progress,system_alerts
```

### **POST /v1/events/broadcast**
**Descripción**: Broadcast de eventos a organización
```bash
curl -X POST http://localhost:3001/v1/events/broadcast \
  -H "Content-Type: application/json" \
  -d '{"event":"system_alert","data":{"message":"Test alert"}}'
```

### **GET /v1/events/stats**
**Descripción**: Estadísticas de conexiones SSE
```bash
curl http://localhost:3001/v1/events/stats
```

---

## 🎛️ **COCKPIT DASHBOARD**

### **GET /v1/cockpit/overview**
**Descripción**: Dashboard operacional unificado
```bash
curl http://localhost:3001/v1/cockpit/overview
```
**Response**:
```json
{
  "success": true,
  "data": {
    "system": { "status": "ok", "mode": "ready", "uptime": 156.789 },
    "agents": { "running": 1, "completed": 1, "totalCostEur": 0.025 },
    "queues": { "totalPending": 17, "totalRunning": 3 },
    "performance": { "p95ResponseTime": 285, "errorRate5xx": 0.2 },
    "budget": { "utilizationPct": 31.0, "status": "ok" },
    "connections": { "sseClients": 0, "activeUsers": 4 }
  }
}
```

### **GET /v1/cockpit/agents**
**Descripción**: Detalles de ejecución de agentes
```bash
curl http://localhost:3001/v1/cockpit/agents
```

### **GET /v1/cockpit/costs**
**Descripción**: Breakdown de costes por org/playbook
```bash
curl http://localhost:3001/v1/cockpit/costs
```

### **GET /v1/cockpit/system**
**Descripción**: Métricas del sistema y health
```bash
curl http://localhost:3001/v1/cockpit/system
```

---

## 💰 **FINOPS PANEL (PR-45)**

### **GET /v1/finops/budgets**
**Descripción**: Listar budgets por organización
```bash
curl -H "X-Org-ID: demo-org" http://localhost:3001/v1/finops/budgets
```
**Response**:
```json
{
  "success": true,
  "data": [],
  "count": 0,
  "summary": {
    "totalBudgets": 0,
    "activeBudgets": 0,
    "totalAmount": 0
  }
}
```
**Headers FinOps**: `X-Est-Cost-EUR`, `X-Budget-Pct`, `X-Latency-ms`

### **POST /v1/finops/budgets**
**Descripción**: Crear nuevo budget
```bash
curl -X POST http://localhost:3001/v1/finops/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "demo-org",
    "name": "Monthly Operations",
    "amount": 1000,
    "currency": "EUR",
    "period": "monthly",
    "categories": ["api", "ai", "storage"]
  }'
```

### **GET /v1/finops/costs**
**Descripción**: Tracking de costes por servicio
```bash
curl -H "X-Org-ID: demo-org" http://localhost:3001/v1/finops/costs
```

---

## 🔒 **GDPR COMPLIANCE (PR-43)**

### **POST /v1/gdpr/export**
**Descripción**: Exportar datos personales del usuario
```bash
curl -X POST http://localhost:3001/v1/gdpr/export \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "dataTypes": ["personal", "financial", "audit"]
  }'
```
**Response**:
```json
{
  "success": true,
  "data": {
    "exportId": "export_1757069406328",
    "userId": "user123",
    "dataTypes": ["personal", "financial", "audit"],
    "status": "initiated",
    "estimatedCompletion": "2025-09-05T11:15:07.421Z",
    "downloadUrl": null
  },
  "message": "Data export initiated successfully"
}
```

### **DELETE /v1/gdpr/erase/:userId**
**Descripción**: Borrar todos los datos de un usuario
```bash
curl -X DELETE http://localhost:3001/v1/gdpr/erase/user123
```

### **GET /v1/gdpr/audit**
**Descripción**: Logs de auditoría GDPR
```bash
curl "http://localhost:3001/v1/gdpr/audit?userId=user123"
```

---

## 💳 **SEPA INTEGRATION (PR-42)**

### **POST /v1/sepa/parse**
**Descripción**: Parsear archivos SEPA CAMT/MT940
```bash
curl -X POST http://localhost:3001/v1/sepa/parse \
  -H "Content-Type: application/json" \
  -d '{
    "xmlData": "<Document>...</Document>",
    "format": "CAMT"
  }'
```
**Response**:
```json
{
  "success": true,
  "data": {
    "fileId": "camt_1757069410778",
    "fileName": "camt_file.xml",
    "transactionsCount": 0,
    "processedCount": 0,
    "status": "processed"
  },
  "message": "SEPA CAMT data parsed successfully"
}
```

### **GET /v1/sepa/transactions**
**Descripción**: Obtener transacciones parseadas
```bash
curl http://localhost:3001/v1/sepa/transactions
```

---

## 🔇 **QUIET HOURS & ON-CALL (PR-46)**

### **GET /v1/quiet-hours**
**Descripción**: Configuración de horarios de silencio
```bash
curl -H "X-Org-ID: demo-org" http://localhost:3001/v1/quiet-hours
```
**Response**:
```json
{
  "success": true,
  "data": {
    "orgId": "demo-org",
    "enabled": true,
    "timezone": "Europe/Madrid",
    "weekdayHours": { "start": "22:00", "end": "08:00" },
    "weekendHours": { "start": "20:00", "end": "10:00" },
    "notifications": { "email": false, "sms": false, "teams": false, "slack": true },
    "exceptions": [
      { "date": "2025-12-24", "name": "Christmas Eve", "allDay": true }
    ]
  }
}
```

### **POST /v1/quiet-hours**
**Descripción**: Actualizar configuración quiet hours
```bash
curl -X POST http://localhost:3001/v1/quiet-hours \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "timezone": "Europe/Madrid"}'
```

### **GET /v1/on-call/schedule**
**Descripción**: Schedule de guardia actual
```bash
curl http://localhost:3001/v1/on-call/schedule
```

### **POST /v1/alerts/escalate**
**Descripción**: Escalar alerta a siguiente nivel
```bash
curl -X POST http://localhost:3001/v1/alerts/escalate \
  -H "Content-Type: application/json" \
  -d '{"alertId": "alert123", "level": 2, "reason": "No response from primary"}'
```

---

## 🛡️ **SECURITY & HEADERS**

### **Security Headers (PR-28)**
Aplicados automáticamente en todas las responses:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### **CORS Configuration (PR-28)**
```javascript
{
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-ID', 'X-User-ID', 'X-Correlation-ID'],
  exposedHeaders: ['X-System-Mode', 'X-Est-Cost-EUR', 'X-Budget-Pct', 'X-Latency-ms', 'X-Route']
}
```

### **Rate Limiting (PR-29)**
- **Límite**: 100 requests por 15 minutos por IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response 429**: 
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 900,
  "headers": {
    "X-RateLimit-Limit": 100,
    "X-RateLimit-Remaining": 0,
    "X-RateLimit-Reset": "2025-09-05T11:25:07.421Z"
  }
}
```

---

## 💰 **FINOPS HEADERS EN TODAS LAS RESPONSES**

Todas las responses incluyen headers FinOps para tracking de costes:

```http
X-Est-Cost-EUR: 0.0010          # Coste estimado en euros
X-Budget-Pct: 0.1               # Porcentaje de presupuesto utilizado
X-Latency-ms: 15                # Latencia de la operación
X-Route: local                  # Routing utilizado (local/azure/mistral)
X-Correlation-Id: req_1757...   # ID de correlación para tracing
```

---

## 🎨 **FRONTEND BFF ENDPOINTS**

### **FinOps Frontend**
```bash
GET    /api/finops/budgets      # Budget management
POST   /api/finops/budgets      # Create budget
GET    /api/finops/costs        # Cost tracking
GET    /api/finops/alerts       # Budget alerts
POST   /api/finops/alerts/[id]/acknowledge
```

### **RLS Frontend**
```bash
GET    /api/rls/rules           # RLS rules management
POST   /api/rls/rules           # Create RLS rule
GET    /api/rls/check-access    # Access control verification
POST   /api/rls/context         # Set security context
```

### **Cache Frontend**
```bash
GET    /api/cache/stats         # Cache statistics
POST   /api/cache/warmup        # Initiate cache warmup
GET    /api/cache/ai            # AI cache status
GET    /api/cache/search        # Search cache status
POST   /api/cache/warmup/start  # Start periodic warmup
POST   /api/cache/warmup/stop   # Stop periodic warmup
```

### **Inventory Frontend**
```bash
GET    /api/inventory/products  # Product management
POST   /api/inventory/products  # Create product
GET    /api/inventory/alerts    # Inventory alerts
GET    /api/inventory/transactions # Kardex transactions
GET    /api/inventory/report    # Inventory report
```

### **Security Frontend**
```bash
POST   /api/security/auth/login # Authentication
GET    /api/security/permissions # Permission management
GET    /api/security/threats    # Threat detection
GET    /api/security/events     # Security events
GET    /api/security/stats      # Security statistics
```

### **Observability Frontend**
```bash
GET    /api/observability/metrics # Metrics collection
GET    /api/observability/logs  # Log aggregation
GET    /api/observability/stats # Observability statistics
```

---

## 🏗️ **ARQUITECTURA COMPLETA**

### **Backend API (Express + TypeScript)**
- **Puerto**: 3001
- **Runtime**: Node.js 20 LTS
- **Framework**: Express + TypeScript
- **Database**: PostgreSQL + Prisma
- **Cache**: Multi-layer in-memory
- **Logging**: Structured logging + OpenTelemetry
- **Security**: Helmet + CORS + Rate limiting

### **Frontend BFF (Next.js 14)**
- **Puerto**: 3000
- **Runtime**: Node.js (BFF pattern)
- **Framework**: Next.js 14 + App Router
- **UI**: Tailwind CSS + Lucide icons
- **State**: React Context + Local State
- **Auth**: Role-based permissions

### **Packages Shared**
- **AI Router**: Enhanced routing Mistral→Azure
- **Schemas**: Zod validation schemas
- **Security**: PII redaction + HMAC
- **Cost Guardrails**: Budget protection
- **Analytics**: Typed event schemas

---

## 🔧 **MIDDLEWARES ACTIVOS**

### **Observability Middleware (PR-23)**
- Request/response logging
- Structured logging con trace IDs
- Error tracking y contexto
- Performance metrics

### **FinOps Middleware (PR-29)**
- Automatic cost header generation
- Budget percentage calculation
- Latency tracking
- Route tracking

### **Security Middleware (PR-28)**
- Helmet security headers
- CORS configuration
- XSS protection
- Frame options

### **Validation Middleware (PR-27)**
- JSON validation
- Content-type verification
- Basic input sanitization

### **Rate Limiting Middleware (PR-29)**
- IP-based rate limiting
- Sliding window algorithm
- Rate limit headers
- 429 responses

---

## 📊 **SERVICIOS EMPRESARIALES ACTIVOS**

### **FinOps System (PR-45)**
- **Budget Manager**: Gestión de presupuestos por organización
- **Cost Tracker**: Tracking de costes por servicio y operación
- **Cost Optimizer**: Recomendaciones de optimización automática

### **SEPA Integration (PR-42)**
- **SEPA Parser**: Parsing de archivos CAMT y MT940
- **Transaction Matching**: Matching automático de transacciones
- **Bank Integration**: Ready para integración bancaria

### **Cache Management**
- **Advanced Cache**: 5 caches especializados (users, orgs, policies, sessions, api)
- **Hit Rate Tracking**: Métricas de rendimiento de cache
- **Memory Management**: Eviction automático por LRU

### **Health Monitoring (PR-22)**
- **System Modes**: live/ready/degraded con transiciones automáticas
- **Health Probes**: Liveness y readiness con checks específicos
- **Degradation Detection**: Detección automática de problemas

---

## 🎯 **CASOS DE USO PRINCIPALES**

### **1. Monitoring de Sistema**
```bash
# Health check básico
curl http://localhost:3001/health

# Métricas Prometheus
curl http://localhost:3001/metrics

# Estadísticas de cache
curl http://localhost:3001/cache/stats
```

### **2. Gestión FinOps**
```bash
# Ver budgets
curl -H "X-Org-ID: demo-org" http://localhost:3001/v1/finops/budgets

# Crear budget
curl -X POST http://localhost:3001/v1/finops/budgets -d '{...}'

# Ver costes
curl -H "X-Org-ID: demo-org" http://localhost:3001/v1/finops/costs
```

### **3. Compliance GDPR**
```bash
# Exportar datos
curl -X POST http://localhost:3001/v1/gdpr/export -d '{"userId":"user123"}'

# Borrar datos
curl -X DELETE http://localhost:3001/v1/gdpr/erase/user123

# Audit logs
curl http://localhost:3001/v1/gdpr/audit
```

### **4. Operaciones 24/7**
```bash
# Quiet hours config
curl http://localhost:3001/v1/quiet-hours

# On-call schedule
curl http://localhost:3001/v1/on-call/schedule

# Escalar alerta
curl -X POST http://localhost:3001/v1/alerts/escalate -d '{"alertId":"alert123"}'
```

---

## 🏆 **ESTADO DE IMPLEMENTACIÓN**

### **✅ PRs Completamente Funcionando (26 PRs)**
- **Infraestructura**: PR-00 → PR-15, PR-21
- **Operabilidad**: PR-22 → PR-24, PR-27 → PR-29
- **Enterprise**: PR-42, PR-43, PR-45, PR-46

### **✅ Features Empresariales Activas**
- Health monitoring avanzado
- Observability completa
- Analytics en tiempo real
- FinOps completo
- GDPR compliance
- SEPA integration
- Quiet hours management
- Security headers
- Rate limiting
- Cache management

### **🎯 Endpoints Totales: 26**
- **Health**: 3 endpoints
- **Observability**: 2 endpoints
- **Analytics**: 3 endpoints
- **Events**: 3 endpoints
- **Cockpit**: 4 endpoints
- **FinOps**: 3 endpoints
- **GDPR**: 3 endpoints
- **SEPA**: 2 endpoints
- **Operations**: 4 endpoints

---

**🚀 DOCUMENTACIÓN COMPLETA - ECONEURA API EMPRESARIAL**
**📅 Fecha: 5 Septiembre 2025**
**🏆 Estado: 26 ENDPOINTS COMPLETAMENTE DOCUMENTADOS Y FUNCIONANDO**
