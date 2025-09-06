# 🚀 ECONEURA • NUEVO PLAN DE ACCIÓN PR-0 A PR-85

## 📋 **DIRECTIVA TÉCNICA APLICADA**

### **OBJETIVO PRINCIPAL**
- Backend+Web locales (sin Azure hasta el final)
- Un CONSEJERO EJECUTIVO por departamento (LLM conmutable Mistral local ↔ Azure-stub)
- AGENTES AUTOMATIZADOS solo vía **Make**
- **Cockpit** como orquestador único con SSE
- Sin integraciones externas adicionales

### **REGLAS DUREZAS**
- **No** dependencias nuevas. **No** tocar `pnpm-lock.yaml`
- PRs pequeños: máx 4 archivos y 200 líneas
- CORS solo en **dev**
- `X-Org` obligatorio en **todas** las rutas `/v1/*`
- Idempotencia 10 min por `X-Idempotency-Key`
- Budget 50 €/org/mes con avisos 80/90/100% (429 al 100%)
- SSE con heartbeat/20s y cleanup en `close`

## 🎯 **ESTADO ACTUAL DEL REPOSITORIO**

### ✅ **PRs YA COMPLETADOS Y GUARDADOS**:
- **PR-47**: Warmup System ✅
- **PR-48**: Performance Optimization V2 ✅
- **PR-49**: Memory Management ✅
- **PR-50**: Connection Pooling ✅
- **PR-51**: Companies Taxonomy & Views ✅
- **PR-52**: Contacts Dedupe Proactivo ✅
- **PR-53**: Deals NBA Explicable ✅
- **PR-54**: Dunning 3-toques ✅
- **PR-55**: Fiscalidad Regional UE ✅
- **PR-56**: Database Optimization & Indexing ✅
- **PR-57**: Advanced Security Framework ✅

### 🔄 **PRs PENDIENTES SEGÚN NUEVA DIRECTIVA**:

## 📋 **BACKLOG DE PRs (EN ORDEN ESTRICTO)**

### **FASE 1: NÚCLEO LLM Y AGENTES (PR-A a PR-I)**

#### **PR-A • LLM Provider Conmutable**
- **Archivos**: 1 archivo, ~150 líneas
- **Objetivo**: `packages/ai/provider.ts` con `generate()` conmutable
- **Implementaciones**: `mistralLocal()` (stub local) y `azureStub()` (NO red)
- **Selección**: Por `PRIMARY_AI` env var
- **Tests**: Devuelve texto no vacío en ambos modos

#### **PR-B • Núcleo de Agentes (tipos+cola+runner+budget+registry)**
- **Archivos**: 5 archivos, ~200 líneas cada uno
- **Objetivo**: Sistema completo de agentes con concurrencia y budget
- **Componentes**:
  - `types.ts`: Zod de entrada/salida, tipos `AgentDescriptor`, `AgentRunCtx`
  - `queue.ts`: concurrencia 2/agente y 1/org; reintentos máx 3
  - `budget.ts`: límite 50 €/org/mes; `getPct()/inc()`
  - `runner.ts`: idempotencia 10 min; calcula coste simulado; lanza 429 al 100%
  - `registry.ts`: registra 1 agente ejemplo `AGT-SALES-LEAD-SCORING`
- **Tests**: contrato, idempotencia, budget

#### **PR-C • Middleware y Bus de Eventos**
- **Archivos**: 3 archivos, ~150 líneas cada uno
- **Objetivo**: Middleware de organización y bus de eventos
- **Componentes**:
  - `middleware/orgContext.ts`: exige `X-Org`, propaga `correlationId`
  - `middleware/budgetGuard.ts`: 80/90 headers y 429 al 100%
  - `lib/event-bus.ts`: `EventEmitter` central
- **Tests**: 400 sin `X-Org`

#### **PR-D • API Exec (Consejeros)**
- **Archivos**: 2 archivos, ~100 líneas cada uno
- **Objetivo**: `POST /v1/exec/:dept/advice` usando `generate()`
- **Componentes**:
  - `routes/exec.ts`: endpoint de consejeros ejecutivos
  - Montar en `index.ts` con `orgContext`
- **Tests**: 200 con org, 400 sin org

#### **PR-E • Invoke → Make (Outbox)**
- **Archivos**: 3 archivos, ~150 líneas cada uno
- **Objetivo**: Sistema de invocación de agentes con outbox pattern
- **Componentes**:
  - `integrations/make/outbox.ts`: `send(flowUrl,payload,idemKey?)` con retry
  - `routes/agents.ts`: `POST /v1/agents/:id/invoke` y `GET /v1/agents/:id/jobs/:jobId`
  - `lib/job-store.ts`: persistencia de jobs en memoria
- **Tests**: 202, 409 por idempotencyKey, outbox mock llamado

#### **PR-F • Webhook Make Inbound + HMAC**
- **Archivos**: 3 archivos, ~120 líneas cada uno
- **Objetivo**: Webhook inbound de Make con verificación HMAC
- **Componentes**:
  - `packages/integrations/make/verifyHmac.ts`: verificación HMAC
  - `routes/integrations-make.ts`: webhook handler
  - Modificar `index.ts`: `express.json({ verify: (req,_,buf)=> req.rawBody = buf.toString() })`
- **Tests**: 202 válida, 401 inválida

#### **PR-G • SSE Plataforma**
- **Archivos**: 2 archivos, ~100 líneas cada uno
- **Objetivo**: Server-Sent Events para eventos en tiempo real
- **Componentes**:
  - `routes/events.ts`: `GET /v1/events` (SSE)
  - Montaje en `index.ts`
- **Tests**: heartbeat llega antes de 25s

#### **PR-H • Cockpit UI**
- **Archivos**: 1 archivo, ~200 líneas
- **Objetivo**: UI del cockpit con SSE y KPIs
- **Componentes**:
  - `apps/web/src/app/cockpit/page.tsx`: suscribe SSE, muestra KPIs
- **Tests**: render básico

#### **PR-I • Consejeros Ejecutivos por Departamento**
- **Archivos**: 11 archivos, ~50 líneas cada uno
- **Objetivo**: 10 consejeros ejecutivos por departamento
- **Componentes**:
  - 10 ficheros `packages/agents/departments/<dept>/exec-advisor.ts`
  - Añadirlos al `registry.ts` con `role:'executive'`
- **Tests**: uno (sales o cfo) retorna `advice`

### **FASE 2: INTEGRACIÓN Y OPTIMIZACIÓN (PR-58 a PR-70)**

#### **PR-58 • Rate Limiting & Throttling**
- **Archivos**: 2 archivos, ~150 líneas cada uno
- **Objetivo**: Sistema avanzado de rate limiting
- **Componentes**:
  - `middleware/rate-limiter-advanced.ts`: rate limiting por usuario/org
  - `lib/rate-limit-store.ts`: almacenamiento de límites
- **Tests**: límites por usuario, org, endpoint

#### **PR-59 • API Versioning & Backward Compatibility**
- **Archivos**: 3 archivos, ~100 líneas cada uno
- **Objetivo**: Versionado de API con compatibilidad hacia atrás
- **Componentes**:
  - `middleware/api-versioning.ts`: manejo de versiones
  - `lib/version-manager.ts`: gestión de versiones
  - `routes/v2/`: estructura de versiones
- **Tests**: compatibilidad v1/v2

#### **PR-60 • Advanced Logging & Audit Trail**
- **Archivos**: 2 archivos, ~150 líneas cada uno
- **Objetivo**: Sistema avanzado de logging y auditoría
- **Componentes**:
  - `lib/audit-logger.ts`: logger de auditoría
  - `middleware/audit-trail.ts`: middleware de auditoría
- **Tests**: logs de auditoría, retención

#### **PR-61 • Configuration Management**
- **Archivos**: 2 archivos, ~120 líneas cada uno
- **Objetivo**: Gestión centralizada de configuración
- **Componentes**:
  - `lib/config-manager.ts`: gestor de configuración
  - `middleware/config-middleware.ts`: middleware de configuración
- **Tests**: configuración por org, validación

#### **PR-62 • Health Checks & Monitoring**
- **Archivos**: 2 archivos, ~100 líneas cada uno
- **Objetivo**: Sistema de health checks y monitoreo
- **Componentes**:
  - `lib/health-monitor.ts`: monitor de salud
  - `routes/health.ts`: endpoints de salud
- **Tests**: health checks, métricas

#### **PR-63 • Data Validation & Sanitization**
- **Archivos**: 2 archivos, ~130 líneas cada uno
- **Objetivo**: Validación y sanitización avanzada de datos
- **Componentes**:
  - `lib/data-validator.ts`: validador de datos
  - `middleware/validation.ts`: middleware de validación
- **Tests**: validación, sanitización

#### **PR-64 • Error Recovery & Resilience**
- **Archivos**: 2 archivos, ~140 líneas cada uno
- **Objetivo**: Sistema de recuperación de errores y resiliencia
- **Componentes**:
  - `lib/error-recovery.ts`: recuperación de errores
  - `middleware/resilience.ts`: middleware de resiliencia
- **Tests**: recuperación, circuit breakers

#### **PR-65 • Performance Monitoring**
- **Archivos**: 2 archivos, ~120 líneas cada uno
- **Objetivo**: Monitoreo avanzado de performance
- **Componentes**:
  - `lib/performance-monitor.ts`: monitor de performance
  - `middleware/performance.ts`: middleware de performance
- **Tests**: métricas de performance

#### **PR-66 • Advanced CRM Features**
- **Archivos**: 3 archivos, ~100 líneas cada uno
- **Objetivo**: Funcionalidades avanzadas de CRM
- **Componentes**:
  - `lib/crm-advanced.ts`: funcionalidades avanzadas
  - `routes/crm-advanced.ts`: endpoints avanzados
  - `services/crm-ai.ts`: integración con AI
- **Tests**: funcionalidades CRM

#### **PR-67 • Advanced ERP Features**
- **Archivos**: 3 archivos, ~100 líneas cada uno
- **Objetivo**: Funcionalidades avanzadas de ERP
- **Componentes**:
  - `lib/erp-advanced.ts`: funcionalidades avanzadas
  - `routes/erp-advanced.ts`: endpoints avanzados
  - `services/erp-ai.ts`: integración con AI
- **Tests**: funcionalidades ERP

#### **PR-68 • Financial Management Suite**
- **Archivos**: 3 archivos, ~120 líneas cada uno
- **Objetivo**: Suite completa de gestión financiera
- **Componentes**:
  - `lib/financial-suite.ts`: suite financiera
  - `routes/financial-suite.ts`: endpoints financieros
  - `services/financial-ai.ts`: AI financiera
- **Tests**: gestión financiera

#### **PR-69 • Advanced Analytics & BI**
- **Archivos**: 3 archivos, ~130 líneas cada uno
- **Objetivo**: Analytics avanzado y Business Intelligence
- **Componentes**:
  - `lib/analytics-advanced.ts`: analytics avanzado
  - `routes/analytics-advanced.ts`: endpoints de analytics
  - `services/bi-engine.ts`: motor de BI
- **Tests**: analytics, BI

#### **PR-70 • Workflow Automation**
- **Archivos**: 3 archivos, ~140 líneas cada uno
- **Objetivo**: Automatización de workflows
- **Componentes**:
  - `lib/workflow-engine.ts`: motor de workflows
  - `routes/workflow-automation.ts`: endpoints de workflows
  - `services/workflow-ai.ts`: AI para workflows
- **Tests**: automatización de workflows

### **FASE 3: FUNCIONALIDADES AVANZADAS (PR-71 a PR-85)**

#### **PR-71 • Document Management**
- **Archivos**: 3 archivos, ~120 líneas cada uno
- **Objetivo**: Sistema de gestión de documentos
- **Componentes**:
  - `lib/document-manager.ts`: gestor de documentos
  - `routes/document-management.ts`: endpoints de documentos
  - `services/document-ai.ts`: AI para documentos
- **Tests**: gestión de documentos

#### **PR-72 • Communication Hub**
- **Archivos**: 3 archivos, ~130 líneas cada uno
- **Objetivo**: Hub de comunicación integrado
- **Componentes**:
  - `lib/communication-hub.ts`: hub de comunicación
  - `routes/communication-hub.ts`: endpoints de comunicación
  - `services/communication-ai.ts`: AI para comunicación
- **Tests**: hub de comunicación

#### **PR-73 • Integration Framework**
- **Archivos**: 3 archivos, ~140 líneas cada uno
- **Objetivo**: Framework de integración
- **Componentes**:
  - `lib/integration-framework.ts`: framework de integración
  - `routes/integration-framework.ts`: endpoints de integración
  - `services/integration-ai.ts`: AI para integración
- **Tests**: framework de integración

#### **PR-74 • Advanced Search & Discovery**
- **Archivos**: 3 archivos, ~130 líneas cada uno
- **Objetivo**: Búsqueda y descubrimiento avanzado
- **Componentes**:
  - `lib/search-engine.ts`: motor de búsqueda
  - `routes/search-advanced.ts`: endpoints de búsqueda
  - `services/search-ai.ts`: AI para búsqueda
- **Tests**: búsqueda avanzada

#### **PR-75 • Mobile API Optimization**
- **Archivos**: 2 archivos, ~120 líneas cada uno
- **Objetivo**: Optimización de API para móviles
- **Componentes**:
  - `lib/mobile-optimizer.ts`: optimizador móvil
  - `middleware/mobile-optimization.ts`: middleware móvil
- **Tests**: optimización móvil

#### **PR-76 • AI/ML Integration Framework**
- **Archivos**: 3 archivos, ~140 líneas cada uno
- **Objetivo**: Framework de integración AI/ML
- **Componentes**:
  - `lib/ai-ml-framework.ts`: framework AI/ML
  - `routes/ai-ml-integration.ts`: endpoints AI/ML
  - `services/ml-engine.ts`: motor ML
- **Tests**: integración AI/ML

#### **PR-77 • Advanced Reporting Engine**
- **Archivos**: 3 archivos, ~130 líneas cada uno
- **Objetivo**: Motor avanzado de reportes
- **Componentes**:
  - `lib/reporting-engine.ts`: motor de reportes
  - `routes/reporting-advanced.ts`: endpoints de reportes
  - `services/reporting-ai.ts`: AI para reportes
- **Tests**: motor de reportes

#### **PR-78 • Compliance & Governance**
- **Archivos**: 3 archivos, ~120 líneas cada uno
- **Objetivo**: Cumplimiento y gobernanza
- **Componentes**:
  - `lib/compliance-manager.ts`: gestor de cumplimiento
  - `routes/compliance-governance.ts`: endpoints de cumplimiento
  - `services/compliance-ai.ts`: AI para cumplimiento
- **Tests**: cumplimiento y gobernanza

#### **PR-79 • Advanced Security Features**
- **Archivos**: 3 archivos, ~130 líneas cada uno
- **Objetivo**: Funcionalidades avanzadas de seguridad
- **Componentes**:
  - `lib/security-advanced.ts`: seguridad avanzada
  - `routes/security-advanced.ts`: endpoints de seguridad
  - `services/security-ai.ts`: AI para seguridad
- **Tests**: seguridad avanzada

#### **PR-80 • Performance Optimization Suite**
- **Archivos**: 3 archivos, ~140 líneas cada uno
- **Objetivo**: Suite de optimización de performance
- **Componentes**:
  - `lib/performance-suite.ts`: suite de performance
  - `routes/performance-optimization.ts`: endpoints de performance
  - `services/performance-ai.ts`: AI para performance
- **Tests**: optimización de performance

#### **PR-81 • Data Management & ETL**
- **Archivos**: 3 archivos, ~130 líneas cada uno
- **Objetivo**: Gestión de datos y ETL
- **Componentes**:
  - `lib/data-management.ts`: gestión de datos
  - `routes/data-etl.ts`: endpoints de ETL
  - `services/etl-engine.ts`: motor ETL
- **Tests**: gestión de datos y ETL

#### **PR-82 • Advanced Caching Strategy**
- **Archivos**: 2 archivos, ~120 líneas cada uno
- **Objetivo**: Estrategia avanzada de caché
- **Componentes**:
  - `lib/cache-strategy.ts`: estrategia de caché
  - `middleware/cache-advanced.ts`: middleware de caché
- **Tests**: estrategia de caché

#### **PR-83 • Event-Driven Architecture**
- **Archivos**: 3 archivos, ~130 líneas cada uno
- **Objetivo**: Arquitectura dirigida por eventos
- **Componentes**:
  - `lib/event-driven.ts`: arquitectura de eventos
  - `routes/event-driven.ts`: endpoints de eventos
  - `services/event-processor.ts`: procesador de eventos
- **Tests**: arquitectura de eventos

#### **PR-84 • Microservices Architecture**
- **Archivos**: 3 archivos, ~140 líneas cada uno
- **Objetivo**: Arquitectura de microservicios
- **Componentes**:
  - `lib/microservices.ts`: microservicios
  - `routes/microservices.ts`: endpoints de microservicios
  - `services/service-mesh.ts`: mesh de servicios
- **Tests**: arquitectura de microservicios

#### **PR-85 • Final Integration & Testing**
- **Archivos**: 2 archivos, ~100 líneas cada uno
- **Objetivo**: Integración final y testing completo
- **Componentes**:
  - `lib/final-integration.ts`: integración final
  - `tests/integration-final.ts`: tests de integración
- **Tests**: integración completa

## 🔧 **VARIABLES ENV REQUERIDAS**

```bash
# LLM Provider
PRIMARY_AI=mistral-local|azure

# Make Integration
MAKE_HMAC_SECRET=changeme

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Budget Configuration
BUDGET_LIMIT_EUR=50
BUDGET_WARNING_80_PCT=40
BUDGET_WARNING_90_PCT=45
BUDGET_WARNING_100_PCT=50

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SSE Configuration
SSE_HEARTBEAT_INTERVAL=20000
SSE_CLEANUP_INTERVAL=30000
```

## 📊 **ESTRUCTURA DE ARCHIVOS A CREAR**

### **Packages**
```
packages/
  ai/
    provider.ts                      # LLM conmutable
  integrations/
    make/
      verifyHmac.ts                 # verificación HMAC inbound
      outbox.ts                     # POST a Make con retry/backoff
  agents/
    core/
      types.ts                      # tipos y schemas
      queue.ts                      # cola de agentes
      runner.ts                     # ejecutor de agentes
      budget.ts                     # gestión de budget
      registry.ts                   # registro de agentes
    departments/
      ceo/exec-advisor.ts
      cto/exec-advisor.ts
      cfo/exec-advisor.ts
      cso/exec-advisor.ts
      ciso/exec-advisor.ts
      coo/exec-advisor.ts
      chro/exec-advisor.ts
      mkt/exec-advisor.ts
      cdo/exec-advisor.ts
      ia/exec-advisor.ts
```

### **Apps/API**
```
apps/api/src/
  lib/
    event-bus.ts                    # bus de eventos
    job-store.ts                    # almacén de jobs
  middleware/
    orgContext.ts                   # contexto de organización
    budgetGuard.ts                  # guardián de budget
  routes/
    exec.ts                         # consejeros ejecutivos
    agents.ts                       # invocación de agentes
    integrations-make.ts            # webhook Make
    events.ts                       # SSE
  index.ts                          # servidor principal
```

### **Apps/Web**
```
apps/web/src/app/
  cockpit/
    page.tsx                        # UI del cockpit
```

## 🧪 **POLÍTICAS DE TEST Y GATES**

### **DoD por PR**:
- ✅ Typecheck verde
- ✅ Tests del PR en verde
- ✅ `/health` <200 ms
- ✅ Máximo 4 archivos por PR
- ✅ Máximo 200 líneas por archivo
- ✅ No dependencias nuevas
- ✅ No tocar `pnpm-lock.yaml`

### **Suites de Test**:
- `exec`: consejeros ejecutivos
- `agents`: sistema de agentes
- `webhook`: webhooks Make
- `sse`: server-sent events
- `budget`: gestión de budget
- `orgContext`: contexto de organización

### **Tests de Seguridad**:
- Prohíbe cross-org: prueba negativa con `X-Org: a` intentando leer job de `b`
- Verificación HMAC: timing-safe comparison
- Rate limiting: límites por usuario/org
- Budget: 429 al 100% del budget

## 🎯 **CRITERIOS DE ACEPTACIÓN**

### **Por PR**:
1. **Diffs** por archivo afectado
2. **Archivos de test** incluidos
3. **Criterios de aceptación** explícitos
4. **Nada de texto narrativo**

### **Integración**:
- `FLOW_MAP` en `routes/agents.ts` o config local
- Store de jobs en memoria (para Azure se migrará a Redis/SQL)
- No empate directo Cockpit→Make (siempre pasa por `/v1/agents/:id/invoke`)
- No habilitar CORS en prod (`NODE_ENV !== 'production'`)

## 📈 **PROGRESO ACTUALIZADO**

### **Estado Actual**:
- **PRs Completados**: 11/85 (12.9%)
- **PRs Guardados en GitHub**: 11/11 (100%)
- **Fase 1 (Núcleo)**: 0/9 (0%)
- **Fase 2 (Integración)**: 0/13 (0%)
- **Fase 3 (Avanzado)**: 0/15 (0%)

### **Próximos Pasos**:
1. **PR-A**: LLM Provider Conmutable
2. **PR-B**: Núcleo de Agentes
3. **PR-C**: Middleware y Bus
4. **PR-D**: API Exec
5. **PR-E**: Invoke → Make

---

**Fecha de Creación**: $(date)  
**Desarrollador**: AI Assistant  
**Estado**: 📋 PLAN CREADO  
**Próximo**: PR-A (LLM Provider Conmutable)
