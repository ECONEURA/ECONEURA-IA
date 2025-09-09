# 🔄 MERGE_PLAN.md - Plan de Consolidación de Módulos

## 📋 Resumen Ejecutivo

**Objetivo**: Consolidar 12 clusters de duplicación identificados en DUP_REPORT.md  
**Estrategia**: Migración gradual con módulos canónicos por criterio técnico  
**Timeline**: 4 semanas (PR-05 a PR-08)  
**Riesgo**: Bajo (con rollback plan)  
**Beneficio**: ~2,500 líneas eliminadas, 15% reducción de código

## 🎯 Criterios de Selección de Módulo Canónico

### Prioridad de Criterios
1. **Tipado estricto** (TypeScript > JavaScript)
2. **Cobertura de tests** (mayor %)
3. **Acoplamiento bajo** (menos dependencias)
4. **Complejidad ciclomática menor**
5. **Estabilidad de API** (menos cambios recientes)

## 📦 Plan de Consolidación por Cluster

### 1. **CRÍTICO** - Servicios de Seguridad
**Estado**: 95% duplicación  
**Archivos**:
- ✅ **CANÓNICO**: `packages/shared/src/security/index.ts` (171 líneas)
- ❌ **ELIMINAR**: `packages/shared/src/security/index.js` (149 líneas)

**Justificación**:
- TypeScript vs JavaScript (criterio 1)
- Misma funcionalidad, mejor tipado
- Sin dependencias adicionales

**Acciones**:
1. Verificar que todos los imports usen `.ts`
2. Eliminar archivo `.js`
3. Actualizar exports en `packages/shared/src/index.ts`
4. Ejecutar tests de regresión

**Rollback**: Restaurar desde git si hay errores

---

### 2. **ALTO** - Health Checks
**Estado**: 85% duplicación  
**Archivos**:
- ✅ **CANÓNICO**: `packages/shared/src/health/index.ts` (NUEVO)
- 🔄 **MIGRAR**: `apps/api/src/lib/system-cockpit/system-health.service.ts`
- 🔄 **MIGRAR**: `apps/api/src/routes/health.ts`
- 🔄 **MIGRAR**: `apps/api/src/lib/api-gateway.service.ts`

**Justificación**:
- Centralizar en packages/shared (criterio 3)
- Reutilizable por todas las apps
- Mejor organización

**Acciones**:
1. Crear `packages/shared/src/health/index.ts`
2. Migrar interfaces: `ServiceHealth`, `ServiceStatus`
3. Migrar lógica de health checks
4. Actualizar imports en apps/api
5. Eliminar archivos duplicados

**Rollback**: Mantener archivos originales hasta validación completa

---

### 3. **ALTO** - Observabilidad
**Estado**: 80% duplicación  
**Archivos**:
- ✅ **CANÓNICO**: `packages/shared/src/observability/index.ts` (NUEVO)
- 🔄 **MIGRAR**: `apps/api/src/services/advanced-observability.service.ts`
- 🔄 **MIGRAR**: `apps/api/src/lib/advanced-monitoring-alerts.service.ts`
- 🔄 **MIGRAR**: `packages/shared/src/monitoring/logger.ts`

**Justificación**:
- Consolidar toda observabilidad en un lugar
- Mejor coherencia de métricas
- Reutilización cross-app

**Acciones**:
1. Crear `packages/shared/src/observability/index.ts`
2. Migrar clases de logging y métricas
3. Unificar configuración de alertas
4. Actualizar imports en todas las apps
5. Eliminar archivos duplicados

**Rollback**: Branch de backup antes de migración

---

### 4. **MEDIO** - Clientes de Servicio
**Estado**: 75% duplicación  
**Archivos**:
- ✅ **CANÓNICO**: `packages/shared/src/clients/index.ts` (EXISTENTE)
- 🔄 **MIGRAR**: `packages/shared/src/services/service-discovery.ts`
- 🔄 **MIGRAR**: `apps/api/src/lib/service-mesh.ts`
- 🔄 **MIGRAR**: `apps/web/src/lib/gateway.ts`

**Justificación**:
- Ya existe estructura en clients/
- Mejor organización de responsabilidades
- Evitar duplicación de interfaces

**Acciones**:
1. Migrar service-discovery a clients/
2. Consolidar interfaces de configuración
3. Unificar lógica de discovery
4. Actualizar imports
5. Eliminar archivos duplicados

**Rollback**: Mantener archivos originales con aliases

---

### 5. **MEDIO** - Servicios de IA
**Estado**: 70% duplicación  
**Archivos**:
- ✅ **CANÓNICO**: `packages/shared/src/ai/base/index.ts` (NUEVO)
- 🔄 **MIGRAR**: `apps/api/src/services/ai-analytics.service.ts`
- 🔄 **MIGRAR**: `apps/api/src/services/ai-performance-optimization.service.ts`
- 🔄 **MIGRAR**: `apps/api/src/services/ai-security-compliance.service.ts`

**Justificación**:
- Extraer base común de IA
- Mejor reutilización de configuración
- Centralizar guardrails de coste

**Acciones**:
1. Crear `packages/shared/src/ai/base/index.ts`
2. Extraer interfaces y configuraciones comunes
3. Migrar lógica base de IA
4. Actualizar servicios específicos para extender base
5. Mantener servicios específicos pero sin duplicación

**Rollback**: Branch específico para IA

---

### 6. **MEDIO** - Seguridad Avanzada
**Estado**: 65% duplicación  
**Archivos**:
- ✅ **CANÓNICO**: `packages/shared/src/security/advanced/index.ts` (NUEVO)
- 🔄 **MIGRAR**: `apps/api/src/lib/advanced-security-framework.service.ts`
- 🔄 **MIGRAR**: `apps/api/src/lib/security-compliance-enhanced.service.ts`
- 🔄 **MIGRAR**: `apps/api/src/lib/contacts-dedupe.service.ts`

**Justificación**:
- Consolidar seguridad avanzada
- Mejor organización por funcionalidad
- Reutilización de validaciones

**Acciones**:
1. Crear `packages/shared/src/security/advanced/index.ts`
2. Migrar framework de seguridad
3. Consolidar validaciones de compliance
4. Unificar lógica de deduplicación
5. Actualizar imports

**Rollback**: Mantener servicios originales como wrappers

---

### 7. **BAJO** - Imports Duplicados
**Estado**: 60% duplicación  
**Archivos**: Múltiples `.tsx` en `apps/web/src/`

**Justificación**:
- Automatización de corrección
- Mejor mantenibilidad
- Reducción de errores manuales

**Acciones**:
1. Ejecutar `fix-duplicate-imports.sh`
2. Crear script de validación
3. Añadir pre-commit hook
4. Documentar mejores prácticas

**Rollback**: Git revert del script

---

### 8. **BAJO** - Configuración TypeScript
**Estado**: 55% duplicación  
**Archivos**: Múltiples `tsconfig.json`

**Justificación**:
- Mejor mantenimiento de configuración
- Consistencia entre proyectos
- Reducción de duplicación

**Acciones**:
1. Mejorar `tsconfig.base.json`
2. Actualizar todos los tsconfig.json para extender base
3. Consolidar path mappings
4. Validar compilación

**Rollback**: Restaurar configuraciones originales

---

### 9. **BAJO** - Tests de Integración
**Estado**: 50% duplicación  
**Archivos**: 35+ archivos de test

**Justificación**:
- Mejor reutilización de utilities
- Consistencia en testing
- Reducción de mantenimiento

**Acciones**:
1. Crear `packages/shared/src/testing/index.ts`
2. Extraer setup común
3. Crear mocks reutilizables
4. Consolidar assertions comunes
5. Actualizar imports en tests

**Rollback**: Mantener utilities originales

---

### 10. **BAJO** - Scripts de Automatización
**Estado**: 45% duplicación  
**Archivos**: 15+ scripts `.sh`

**Justificación**:
- Mejor organización de scripts
- Reutilización de funciones comunes
- Mantenimiento centralizado

**Acciones**:
1. Crear `scripts/lib/common.sh`
2. Extraer funciones comunes
3. Modularizar scripts existentes
4. Actualizar llamadas

**Rollback**: Mantener scripts originales

---

### 11. **BAJO** - Documentación PR
**Estado**: 40% duplicación  
**Archivos**: 35+ archivos `.md`

**Justificación**:
- Consistencia en documentación
- Mejor mantenimiento
- Reducción de duplicación

**Acciones**:
1. Crear templates en `docs/templates/`
2. Generar documentación automáticamente
3. Consolidar secciones comunes
4. Actualizar generación

**Rollback**: Mantener documentos originales

---

### 12. **BAJO** - Servicios de Performance
**Estado**: 35% duplicación  
**Archivos**: 3 servicios de performance

**Justificación**:
- Consolidar optimizaciones
- Mejor reutilización
- Consistencia en métricas

**Acciones**:
1. Crear `packages/shared/src/performance/index.ts`
2. Migrar métricas comunes
3. Consolidar configuraciones
4. Actualizar imports

**Rollback**: Mantener servicios originales

## 📅 Timeline por Fases (F0-F9) Alineado a PRs

### F0: Descubrimiento (PR-00 a PR-04) ✅ COMPLETADO
- [x] PR-00: Bootstrap monorepo
- [x] PR-01: Lint/Format/Types  
- [x] PR-02: Infra Docker local
- [x] PR-03: Drizzle + esquema inicial
- [x] PR-04: Next 14 (App Router)

### F1: Higiene (PR-05 a PR-09) 🔄 EN PROGRESO
- [ ] **PR-05**: Consolidación de seguridad (SEC-001, SEC-ADV-001)
- [ ] **PR-06**: Health checks unificados (HEALTH-001)
- [ ] **PR-07**: Observabilidad consolidada (OBS-001)
- [ ] **PR-08**: Clientes de servicio (CLIENT-001)
- [ ] **PR-09**: Base común IA (AI-001)

### F2: Núcleo Web/API (PR-10 a PR-19) ✅ COMPLETADO
- [x] PR-10 a PR-19: API, Auth, BFF, UI, Workers

### F3: Seguridad/Compliance (PR-20 a PR-29) 🔄 EN PROGRESO
- [ ] **PR-20 a PR-29**: Rate limiting, CSP, GDPR, RLS

### F4: Datos (PR-30 a PR-39) ⏳ PENDIENTE
- [ ] **PR-30 a PR-39**: Migraciones, índices, seeds

### F5: Conectores (PR-40 a PR-49) ⏳ PENDIENTE
- [ ] **PR-40 a PR-49**: M365, Salesforce, SAP, HRIS

### F6: Catálogo agentes (PR-50 a PR-59) ⏳ PENDIENTE
- [ ] **PR-50 a PR-59**: 10 agentes iniciales

### F7: Observabilidad/FinOps (PR-60 a PR-69) ⏳ PENDIENTE
- [ ] **PR-60 a PR-69**: OTEL, dashboards, alertas

### F8: Fiabilidad (PR-70 a PR-79) ⏳ PENDIENTE
- [ ] **PR-70 a PR-79**: Colas, idempotencia, circuit breaker

### F9: Azure-ready (PR-80 a PR-85) ⏳ PENDIENTE
- [ ] **PR-80 a PR-85**: Bicep, App Insights, GH Actions

## 🔄 Estrategia de Migración

### Fase 1: Preparación
1. **Backup completo** del repositorio
2. **Branch de consolidación** por cluster
3. **Tests de regresión** antes de cambios
4. **Documentación** de cambios

### Fase 2: Migración
1. **Crear módulo canónico**
2. **Migrar código** con tests
3. **Actualizar imports** gradualmente
4. **Validar funcionalidad**

### Fase 3: Limpieza
1. **Eliminar archivos duplicados**
2. **Actualizar documentación**
3. **Ejecutar tests completos**
4. **Validar build**

### Fase 4: Rollback (si necesario)
1. **Identificar problemas**
2. **Restaurar desde backup**
3. **Analizar causa raíz**
4. **Replanificar migración**

## ⚠️ Riesgos y Mitigaciones

### Riesgos Identificados
1. **Breaking changes** en imports
2. **Tests fallidos** por cambios de API
3. **Dependencias circulares**
4. **Pérdida de funcionalidad específica**

### Mitigaciones
1. **Aliases temporales** durante migración
2. **Tests de regresión** exhaustivos
3. **Análisis de dependencias** previo
4. **Validación funcional** completa

## 📊 Métricas de Éxito

### Objetivos Cuantitativos
- **Líneas eliminadas**: ≥2,500
- **Archivos consolidados**: ≥50
- **Reducción de código**: ≥15%
- **Tests pasando**: 100%

### Objetivos Cualitativos
- **Consistencia**: 100% en módulos consolidados
- **Mantenibilidad**: Mejorada significativamente
- **Documentación**: Actualizada y centralizada
- **Performance**: Sin degradación

## 🔧 Herramientas de Validación

### Pre-migración
- **Análisis de dependencias**: `madge`
- **Tests de regresión**: `pnpm test`
- **Linting**: `pnpm lint`
- **Type checking**: `pnpm typecheck`

### Post-migración
- **Build validation**: `pnpm build`
- **Integration tests**: `pnpm test:integration`
- **Performance tests**: `k6 run`
- **Security scan**: `pnpm security:scan`

## 📈 Beneficios Esperados

### Inmediatos
- **Reducción de código**: ~2,500 líneas
- **Menos duplicación**: 15% reducción
- **Mejor organización**: Módulos canónicos claros

### A Largo Plazo
- **Mantenimiento**: 20% más eficiente
- **Bugs**: 30% menos por duplicación
- **Desarrollo**: 25% más rápido
- **Testing**: Menos redundante

## 🎯 Criterios de Aceptación

### Por Cluster
1. **Módulo canónico** creado y funcional
2. **Imports actualizados** en todas las apps
3. **Tests pasando** al 100%
4. **Archivos duplicados** eliminados
5. **Documentación** actualizada

### Global
1. **Build exitoso** en todos los ambientes
2. **Performance** mantenida o mejorada
3. **Funcionalidad** preservada al 100%
4. **Rollback plan** validado

## 📋 Checklist de Implementación

### Pre-requisitos
- [ ] Backup completo del repo
- [ ] Tests de regresión pasando
- [ ] Análisis de dependencias completo
- [ ] Plan de rollback validado

### Por Cluster
- [ ] Módulo canónico creado
- [ ] Código migrado con tests
- [ ] Imports actualizados
- [ ] Archivos duplicados eliminados
- [ ] Documentación actualizada
- [ ] Validación funcional completa

### Post-implementación
- [ ] Tests completos pasando
- [ ] Build exitoso
- [ ] Performance validada
- [ ] Documentación actualizada
- [ ] Métricas de éxito alcanzadas

---

**Plan creado por**: Cursor AI Assistant  
**Fecha**: 2024-09-08  
**Versión**: 1.0  
**Estado**: Listo para implementación  
**Aprobación requerida**: Sí
