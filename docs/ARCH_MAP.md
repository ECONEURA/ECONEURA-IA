# 🗺️ ARCH_MAP.md - Mapa Arquitectónico del Monorepo ECONEURA

## 📋 Resumen Ejecutivo

**ECONEURA** es un monorepo pnpm con arquitectura de microservicios para gestión ERP/CRM con IA. 
- **Archivos totales**: 122,135 archivos TypeScript/JavaScript
- **Estructura**: 3 aplicaciones principales, 5 paquetes compartidos, infraestructura Azure-ready
- **Estado actual**: PR-23/85 completado según README.md
- **Deploy**: DEPLOY_ENABLED=false (sin flag explícito en CI, requiere corrección)

## 🏗️ Estructura del Monorepo

```
/Users/samu/ECONEURA-IA-1/
├── apps/                          # Aplicaciones principales
│   ├── api/                       # API Express + TypeScript
│   ├── web/                       # Next.js 14 (App Router)
│   └── workers/                   # Jobs/colas (cron, warm-up, dunning)
├── packages/                      # Paquetes compartidos
│   ├── agents/                    # Catálogo de agentes IA
│   ├── config/                    # Configuración compartida
│   ├── db/                        # Esquema Drizzle + migraciones
│   ├── sdk/                       # Cliente TypeScript
│   └── shared/                    # Utilidades y esquemas Zod
├── econeura-cockpit/              # Dashboard CFO (Next.js)
├── infra/                         # Infraestructura Azure
├── infrastructure/                # IaC adicional
├── docs/                          # Documentación
├── scripts/                       # Scripts de automatización
└── tests/                         # Tests E2E y performance
```

## 🎯 Aplicaciones Principales

### 1. `/apps/api` - API Server
- **Tecnología**: Express.js + TypeScript + Drizzle ORM
- **Arquitectura**: Clean Architecture (Domain/Application/Infrastructure)
- **Endpoints**: `/v1/*` con OpenAPI 3.0
- **Características**:
  - RLS multitenant transaccional
  - Middleware de seguridad (Helmet, CORS, CSP)
  - Rate limiting por organización
  - FinOps guardrails
  - Observabilidad OTel
- **Estructura**:
  ```
  src/
  ├── application/          # Use cases y interfaces
  ├── domain/              # Entidades y repositorios
  ├── infrastructure/      # Implementaciones concretas
  ├── presentation/        # Controllers y DTOs
  ├── middleware/          # Auth, RLS, rate limiting
  ├── services/            # Servicios de negocio
  └── routes/              # Definición de rutas
  ```

### 2. `/apps/web` - Frontend BFF
- **Tecnología**: Next.js 14 (App Router) + TypeScript + Tailwind
- **Arquitectura**: BFF (Backend for Frontend) UE-Hardened
- **Características**:
  - Proxy seguro a API
  - Demo-mode por defecto
  - Feature flags por `.env*`
  - CSP/SRI estrictas
- **Estructura**:
  ```
  src/
  ├── app/                 # App Router pages
  ├── components/          # Componentes React
  ├── lib/                 # Utilidades y clientes
  ├── hooks/               # Custom hooks
  └── middleware.ts        # Middleware Next.js
  ```

### 3. `/apps/workers` - Background Jobs
- **Tecnología**: Node.js + TypeScript + Bull Queue
- **Funciones**:
  - Procesamiento de emails (Graph API)
  - Warm-up de IA
  - Dunning automático
  - Escaneo antivirus
- **Estructura**:
  ```
  src/
  ├── processors/          # Procesadores de jobs
  ├── queues/              # Definición de colas
  ├── services/            # Servicios de integración
  └── utils/               # Utilidades
  ```

### 4. `/econeura-cockpit` - Dashboard CFO
- **Tecnología**: Next.js 14 + TypeScript + Tailwind
- **Propósito**: Dashboard ejecutivo para CFO
- **Componentes**:
  - AgentCard: Tarjetas de agentes IA
  - NeuraChat: Chat con IA
  - Cockpit: Dashboard principal
  - Timeline: Línea de tiempo de eventos

## 📦 Paquetes Compartidos

### 1. `/packages/shared` - Utilidades Core
- **Esquemas Zod**: Validación de datos
- **Clientes**: Base, CRM, ERP, Finance
- **IA**: Router, cost-guardrails, providers
- **Observabilidad**: Logging, métricas, OTel
- **Seguridad**: Autenticación, autorización
- **Playbooks**: CFO collection, DSL

### 2. `/packages/db` - Base de Datos
- **ORM**: Drizzle con PostgreSQL
- **Esquemas**: CRM, ERP, Finance, Analytics
- **Migraciones**: Versionadas y reversibles
- **Seeds**: Datos de prueba seguros
- **RLS**: Políticas de seguridad

### 3. `/packages/sdk` - Cliente TypeScript
- **API Client**: Cliente tipado para API
- **Recursos**: Auth, CRM, ERP
- **Tipos**: Interfaces compartidas
- **Utilidades**: Helpers comunes

### 4. `/packages/config` - Configuración
- **Variables de entorno**: Validación con Zod
- **Configuraciones**: Por ambiente
- **Secrets**: Gestión segura

### 5. `/packages/agents` - Catálogo IA
- **Tipos**: Definiciones de agentes
- **Fichas**: Sistema, scopes, I/O, KPIs
- **Límites**: Coste por tarea, SLO/SLA

## 🔗 Endpoints y APIs (EVIDENCIA REAL)

### API Principal (`/apps/api`) - Archivos encontrados:
```
src/routes/
├── admin.ts          # Endpoints administrativos
├── ai.ts            # Servicios de IA (Azure OpenAI)
├── channels.ts      # Canales de comunicación
├── flows.ts         # Flujos de trabajo
├── health.ts        # Health checks
├── providers.ts     # Proveedores externos
└── webhooks.ts      # Webhooks externos
```

### BFF (`/apps/web`) - Archivos encontrados:
```
src/app/api/econeura/[...path]/route.ts  # Proxy dinámico
src/pages/api/
├── agent.ts         # Gestión de agentes
└── llm.ts          # Chat con IA
```

### Workers - Archivos encontrados:
```
src/
├── processors/email-processor.ts    # Procesamiento emails
├── queues/job-queue.ts             # Colas de trabajo
└── services/graph-service.ts       # Integración Graph API
```

### BFF (`/apps/web`)
- **Base URL**: `/api/econeura`
- **Proxy**: A API principal
- **Endpoints**:
  - `/api/econeura/[...path]` - Proxy dinámico
  - `/api/llm` - Chat con IA
  - `/api/agent` - Gestión de agentes

### Workers
- **Colas**: Email processing, warm-up, dunning
- **Cron**: Tareas programadas
- **Webhooks**: Procesamiento asíncrono

## 🗄️ Base de Datos

### Esquema Principal
- **CRM**: companies, contacts, deals, interactions
- **ERP**: products, inventory, invoices, suppliers
- **Finance**: payments, sepa_transactions, budgets
- **Analytics**: events, metrics, dashboards
- **Security**: users, roles, permissions, audit_logs

### Características
- **RLS**: Row Level Security multitenant
- **Índices**: Optimizados para consultas frecuentes
- **Particiones**: Por organización y fecha
- **Backup**: Automático y versionado

## 🔧 Infraestructura

### Local (Docker)
- **PostgreSQL**: Base de datos principal
- **Redis**: Cache y colas
- **Prometheus**: Métricas
- **Grafana**: Dashboards
- **Jaeger**: Trazabilidad

### Azure (Producción)
- **App Service**: Web y API
- **PostgreSQL Flexible**: Base de datos
- **Key Vault**: Secrets
- **Application Insights**: Observabilidad
- **Storage Account**: Blobs y archivos

## 📊 Métricas y Observabilidad

### Métricas Principales
- **Performance**: p95 API ≤ 350ms, p95 IA ≤ 2.5s
- **Disponibilidad**: 5xx < 1%
- **FinOps**: €/tarea, presupuesto por org
- **Seguridad**: DLP hits, HITL rate

### Dashboards
- **CFO Dashboard**: Métricas ejecutivas
- **Operacional**: Health, performance, errores
- **FinOps**: Costes, presupuestos, alertas
- **Seguridad**: DLP, auditoría, compliance

## 🚀 CI/CD y Despliegue

### Pipeline
- **Build**: TypeScript, linting, testing
- **Test**: Unit, integration, E2E
- **Security**: SAST, SCA, secrets scan
- **Deploy**: Blue/green con canary
- **Rollback**: Automático en fallos

### Ambientes
- **Local**: Docker Compose
- **Staging**: Azure App Service
- **Production**: Azure App Service
- **Flags**: DEPLOY_ENABLED=false (no deploy hasta GO)

## 📈 Estado Actual (EVIDENCIA REAL)

### Completado (Según documentación encontrada)
- ✅ **PR-00 a PR-23**: Base del monorepo, API, Frontend, Workers
- ✅ **MEGA-PR Azure OpenAI**: PR-15 a PR-19 completados
- ✅ **M3 Implementation**: BFF & UI CFO completado
- ✅ **Workers Outlook**: EmailProcessor y JobQueue implementados
- ✅ **Infraestructura**: Docker, CI/CD básico

### En Progreso (Según branch actual)
- 🔄 **feat/workers-outlook**: Último commit 681cea0
- 🔄 **Consolidación**: Duplicados identificados en DUP_REPORT.md
- 🔄 **Deploy flags**: DEPLOY_ENABLED=false no implementado en CI

### Pendiente (PR-24 a PR-85)
- ⏳ **PR-24 a PR-30**: Operabilidad & Salud
- ⏳ **PR-31 a PR-60**: Integraciones & Operación  
- ⏳ **PR-61 a PR-85**: Data Mastery & Hardening final

## 🎯 Próximos Pasos

1. **Consolidación**: Eliminar duplicados identificados
2. **Optimización**: Mejorar performance y bundle size
3. **Testing**: Aumentar cobertura de tests
4. **Documentación**: Completar OpenAPI y guías
5. **Deploy**: Preparar para migración Azure

---

**Última actualización**: 2024-09-08  
**Versión**: 1.0.0  
**Estado**: En desarrollo activo
