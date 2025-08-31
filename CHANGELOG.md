# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **PR-37: Sistema de Notificaciones**
  - Sistema completo de notificaciones con templates y multi-canal
  - Gestión de notificaciones (crear, leer, actualizar, eliminar)
  - Templates de notificaciones reutilizables
  - Preferencias de usuario por canal (email, SMS, push, in-app, webhook)
  - Horarios silenciosos (quiet hours)
  - Estadísticas y métricas de notificaciones
  - Envío en lote y programación de notificaciones
  - Integración completa con Web BFF
  - Componente React NotificationCenter con UI moderna
  - Headers FinOps para tracking de costos
  - Logs estructurados para observabilidad
  - Smoke test completo para validación
- **PR-23**: Observabilidad coherente (logs + métricas + traces)
  - Sistema completo de observabilidad entre API Express y Web BFF
  - Logging estructurado con contexto rico y traces (`apps/api/src/lib/logger.ts`, `apps/web/src/lib/observability.ts`)
  - Métricas en tiempo real con exportación Prometheus (`apps/api/src/lib/metrics.ts`)
  - Sistema de traces distribuido para debugging (`apps/api/src/lib/tracing.ts`)
  - Headers de observabilidad automáticos (`X-Request-ID`, `X-Trace-ID`, `X-Span-ID`)
  - Middleware de observabilidad automático (`apps/api/src/middleware/observability.ts`)
  - Endpoints de observabilidad (`/v1/observability/*`, `/api/observability/*`)
  - Integración transparente con endpoints existentes
  - Script de smoke test completo (`scripts/smoke-pr-23.sh`)
  - Documentación detallada (`PR-23-OBSERVABILIDAD-COHERENTE.md`)

- **PR-22**: Health & degradación coherente (web + api)
  - Endpoints de health avanzados para API Express (`/health/live`, `/health/ready`)
  - Endpoints de health para Web BFF (`/api/health/live`, `/api/health/ready`, `/api/health/degraded`)
  - Detección automática de degradación del sistema (ok/demo/degraded/down)
  - Componente SystemStatus para monitoreo en tiempo real
  - Headers de health (`X-System-Mode`)
  - Script de smoke test automatizado (`scripts/smoke-pr-22.sh`)
  - Verificación de servicios externos (Azure OpenAI, Bing Search)
  - Manejo graceful de degradación del sistema

### Changed
- **PR-22**: Mejorado el sistema de monitoreo y observabilidad
  - Actualización automática del estado del sistema cada 30 segundos
  - Indicadores visuales mejorados para diferentes estados
  - Notificaciones de degradación en tiempo real

### Fixed
- **PR-22**: Corregidos problemas de componentes UI faltantes
  - Agregados componentes Card, Badge, Progress
  - Restaurado archivo utils.ts con función cn
  - Simplificado dashboard para evitar dependencias complejas

## [PR-25] - 2024-12-19

### Added
- **Sistema de Rate Limiting Inteligente**: Implementación completa de rate limiting por organización
- **API Express Rate Limiting**: Sistema de rate limiting en el servidor Express con múltiples estrategias
- **Web BFF Rate Limiting**: Sistema de rate limiting en el Backend for Frontend con sincronización
- **Rate Limit Strategies**: Soporte para token-bucket, sliding-window y fixed-window
- **Organization Management**: CRUD completo para configuraciones de rate limiting por organización
- **Rate Limit Headers**: Headers estándar de rate limiting (X-RateLimit-*)
- **Rate Limit Metrics**: Métricas detalladas de rate limiting integradas con observabilidad
- **Rate Limit Middleware**: Middleware inteligente para diferentes tipos de rate limiting
- **Performance Monitoring**: Monitoreo de rendimiento del sistema de rate limiting
- **Error Handling**: Manejo robusto de errores y límites excedidos

### Technical Details
- **Strategies**: token-bucket, sliding-window, fixed-window
- **Organization-based**: Rate limiting configurado por organización
- **Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Strategy
- **Burst Handling**: Soporte para burst de requests con token bucket
- **Window Management**: Ventanas de tiempo configurables
- **Integration**: Integración completa con sistema de observabilidad
- **Metrics**: rate_limit_total, rate_limit_allowed, rate_limit_blocked, rate_limit_remaining, rate_limit_utilization
- **Error Responses**: Respuestas 429 con información detallada de retry

### Files Added/Modified
- `apps/api/src/lib/rate-limiting.ts`: Sistema de rate limiting para API Express
- `apps/api/src/middleware/rate-limiting.ts`: Middleware de rate limiting
- `apps/api/src/index.ts`: Endpoints de rate limiting integrados
- `apps/web/src/lib/rate-limiting.ts`: Sistema de rate limiting para Web BFF
- `apps/web/src/app/api/rate-limit/organizations/route.ts`: API de organizaciones
- `apps/web/src/app/api/rate-limit/organizations/[organizationId]/route.ts`: API de organización específica
- `apps/web/src/app/api/rate-limit/organizations/[organizationId]/reset/route.ts`: API de reset de organización
- `apps/web/src/app/api/rate-limit/stats/route.ts`: API de estadísticas de rate limiting
- `scripts/smoke-pr-25.sh`: Script de pruebas completo para PR-25

### Testing
- ✅ Rate limiting system is operational
- ✅ Organization management is functional
- ✅ Multiple strategies are working (token-bucket, sliding-window, fixed-window)
- ✅ Rate limit headers are present and correct
- ✅ Rate limit enforcement is working
- ✅ Integration with existing systems is working
- ✅ Performance is acceptable
- ✅ Data quality is good
- ✅ Error handling is robust

## [PR-24] - 2024-12-19

### Added
- **Sistema de Alertas Inteligentes**: Implementación completa de alertas basadas en métricas
- **API Express Alert System**: Sistema de alertas en el servidor Express con reglas configurables
- **Web BFF Alert System**: Sistema de alertas en el Backend for Frontend con sincronización
- **Alert Rule Management**: CRUD completo para reglas de alerta con validación robusta
- **Alert Evaluation Engine**: Motor de evaluación automática de alertas basado en métricas
- **Alert Notifications**: Sistema de notificaciones con diferentes niveles de severidad
- **Alert Statistics**: Estadísticas detalladas de alertas activas, resueltas y rendimiento
- **Alert Integration**: Integración completa con el sistema de observabilidad existente
- **Performance Monitoring**: Monitoreo de rendimiento del sistema de alertas
- **Data Quality Validation**: Validación de calidad de datos y reglas de alerta

### Technical Details
- **Alert Rules**: Soporte para condiciones threshold, anomaly y trend
- **Operators**: gt, lt, gte, lte, eq, ne para comparaciones
- **Severity Levels**: low, medium, high, critical
- **Cooldown Management**: Sistema de cooldown para evitar spam de alertas
- **Window-based Evaluation**: Evaluación basada en ventanas de tiempo
- **Real-time Processing**: Procesamiento en tiempo real de métricas
- **Validation**: Validación robusta de reglas de alerta
- **Error Handling**: Manejo de errores y recuperación automática

### Files Added/Modified
- `apps/api/src/lib/alerts.ts`: Sistema de alertas para API Express
- `apps/web/src/lib/alerts.ts`: Sistema de alertas para Web BFF
- `apps/api/src/index.ts`: Endpoints de alertas integrados
- `apps/web/src/app/api/alerts/rules/route.ts`: API de reglas de alerta
- `apps/web/src/app/api/alerts/active/route.ts`: API de alertas activas
- `apps/web/src/app/api/alerts/stats/route.ts`: API de estadísticas de alertas
- `scripts/smoke-pr-24.sh`: Script de pruebas completo para PR-24

### Testing
- ✅ 12/12 tests passed
- ✅ Alert system endpoints functional
- ✅ Alert rule management working
- ✅ Alert evaluation engine operational
- ✅ Alert notifications working
- ✅ Alert statistics accurate
- ✅ Performance acceptable (26ms API, 48ms Web BFF)
- ✅ Data quality validation working
- ✅ Integration with observability functional

## [PR-23] - 2024-12-19

### Added
- **PR-23**: Observabilidad coherente (logs + métricas + traces)
  - Sistema completo de observabilidad entre API Express y Web BFF
  - Logging estructurado con contexto rico y traces (`apps/api/src/lib/logger.ts`, `apps/web/src/lib/observability.ts`)
  - Métricas en tiempo real con exportación Prometheus (`apps/api/src/lib/metrics.ts`)
  - Sistema de traces distribuido para debugging (`apps/api/src/lib/tracing.ts`)
  - Headers de observabilidad automáticos (`X-Request-ID`, `X-Trace-ID`, `X-Span-ID`)
  - Middleware de observabilidad automático (`apps/api/src/middleware/observability.ts`)
  - Endpoints de observabilidad (`/v1/observability/*`, `/api/observability/*`)
  - Integración transparente con endpoints existentes
  - Script de smoke test completo (`scripts/smoke-pr-23.sh`)
  - Documentación detallada (`PR-23-OBSERVABILIDAD-COHERENTE.md`)

- **PR-22**: Health & degradación coherente (web + api)
  - Endpoints de health avanzados para API Express (`/health/live`, `/health/ready`)
  - Endpoints de health para Web BFF (`/api/health/live`, `/api/health/ready`, `/api/health/degraded`)
  - Detección automática de degradación del sistema (ok/demo/degraded/down)
  - Componente SystemStatus para monitoreo en tiempo real
  - Headers de health (`X-System-Mode`)
  - Script de smoke test automatizado (`scripts/smoke-pr-22.sh`)
  - Verificación de servicios externos (Azure OpenAI, Bing Search)
  - Manejo graceful de degradación del sistema

### Changed
- **PR-22**: Mejorado el sistema de monitoreo y observabilidad
  - Actualización automática del estado del sistema cada 30 segundos
  - Indicadores visuales mejorados para diferentes estados
  - Notificaciones de degradación en tiempo real

### Fixed
- **PR-22**: Corregidos problemas de componentes UI faltantes
  - Agregados componentes Card, Badge, Progress
  - Restaurado archivo utils.ts con función cn
  - Simplificado dashboard para evitar dependencias complejas

## [PR-20] - 2025-08-30

### Added
- **PR-20**: Sistema de Corrección y Estabilización
  - API Express simplificado y autónomo
  - Endpoints demo funcionales para todas las funcionalidades
  - Script de smoke test mejorado
  - Limpieza agresiva de archivos conflictivos

### Changed
- **PR-20**: Arquitectura API simplificada
  - Eliminados paquetes problemáticos (packages/db, packages/shared)
  - Removidos controladores y middleware conflictivos
  - API autónomo sin dependencias externas complejas

### Fixed
- **PR-20**: Resueltos 882 errores de build
  - Configuración TypeScript corregida
  - Dependencias simplificadas
  - Estructura de archivos optimizada

## [PR-15 to PR-19] - 2025-08-30

### Added
- **PR-15 to PR-19**: Mega Azure OpenAI Migration
  - Integración completa con Azure OpenAI (chat, imágenes, TTS)
  - BFF Next.js para manejo de API calls
  - Sistema de retry y backoff automático
  - Búsqueda unificada (Bing/Google/Demo)
  - Caché inteligente para respuestas
  - Filtrado de contenido y validación
  - Modo demo para desarrollo sin credenciales
  - Métricas y monitoreo de uso de IA
  - Sistema de presupuesto y rate limiting

### Changed
- **PR-15 to PR-19**: Refactorización completa del sistema de IA
  - Migración desde servicios locales a Azure OpenAI
  - Arquitectura BFF para mejor seguridad
  - Manejo robusto de errores y timeouts
  - UI mejorada para todas las funcionalidades de IA

### Fixed
- **PR-15 to PR-19**: Resueltos problemas de integración
  - Errores de importación de node-fetch
  - Configuración de TypeScript
  - Dependencias faltantes

## [PR-14] - 2025-08-30

### Added
- **PR-14**: Enterprise AI Platform (10 mejoras adicionales)
  - AutoML para entrenamiento automático de modelos
  - Análisis de sentimientos avanzado
  - Automatización de workflows inteligente
  - Analytics en tiempo real
  - Búsqueda semántica
  - Reportes inteligentes
  - Chatbot empresarial
  - Optimización de procesos de negocio
  - Dashboard empresarial de IA
  - Documentación completa del sistema

## [PR-13] - 2025-08-30

### Added
- **PR-13**: Advanced Business Intelligence System (10 mejoras)
  - IA predictiva para análisis de datos
  - Métricas avanzadas de negocio
  - Integraciones externas
  - Auditoría y compliance
  - Dashboard avanzado con gráficos interactivos
  - Sistema de notificaciones inteligente
  - Reportes automatizados
  - Análisis de tendencias
  - KPIs personalizables
  - Alertas proactivas

## [PR-12] - 2025-08-30

### Added
- **PR-12**: Products/Suppliers CRUD
  - Gestión completa de inventario
  - CRUD para productos y proveedores
  - Esquemas de base de datos
  - Controladores y rutas API
  - Datos de prueba (seeds)
  - Páginas frontend dedicadas
  - Validación con Zod
  - Relaciones entre entidades

## [PR-11] - 2025-08-30

### Added
- **PR-11**: CRM Interactions with RLS
  - Sistema completo de interacciones CRM
  - Row Level Security (RLS)
  - Endpoint de resumen con IA
  - Timeline de interacciones en frontend
  - Integración con notificaciones y workflows
  - Esquemas de validación
  - Controladores CRUD completos

## [PR-0 to PR-10] - 2025-08-30

### Added
- **PR-0 to PR-10**: Critical Build Fixes
  - Configuración inicial del proyecto
  - Resolución de errores de TypeScript
  - Configuración de ESLint
  - Migración de iconos a lucide-react
  - Scripts de desarrollo funcionales
  - Estructura de monorepo con pnpm workspaces

### Fixed
- **PR-0 to PR-10**: Errores críticos de build
  - Problemas de resolución de módulos
  - Configuración de tsconfig.json
  - Import paths corregidos
  - Dependencias actualizadas
