# Reporte de Deduplicación - ECONEURA

**Fecha:** $(date)  
**Fase:** PRE-MIGRACIÓN - FASE 0.4  
**Objetivo:** Consolidar código duplicado de forma segura

## 📊 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Archivos analizados** | 855 | ✅ |
| **Duplicados encontrados** | 264 | ⚠️ Alto |
| **Líneas duplicadas** | 60,659 | ⚠️ Crítico |
| **Porcentaje duplicación** | ~17% | ⚠️ Crítico |

## 🔍 Top Duplicados Críticos

### 1. Servicios AI (1,120 líneas)
- `apps/api/src/services/ai-analytics.service.ts`
- `apps/api/src/services/advanced-ai-features.service.ts`
- **Acción:** Consolidar en `packages/shared/src/ai/`

### 2. Backup Services (327 líneas)
- `apps/api/backup/index.intermediate.ts`
- `apps/api/src/index.intermediate.ts`
- **Acción:** Mover a `packages/shared/src/backup/`

### 3. API Routes (224 líneas)
- `apps/web/src/app/api/ai-chat-advanced/[...path]/route.ts`
- `apps/web/src/app/api/inventory/[...path]/route.ts`
- **Acción:** Crear middleware compartido

### 4. Telemetry Middleware (70 líneas)
- `apps/api-agents-make/src/middleware/telemetry.ts`
- `apps/api-neura-comet/src/middleware/telemetry.ts`
- **Acción:** Mover a `packages/shared/src/middleware/`

### 5. Backup Basic (138 líneas)
- `apps/api/backup/index.basic.ts`
- `apps/api/backup/index.basic.backup.ts`
- **Acción:** Eliminar archivo .backup

## 🎯 Plan de Consolidación

### Fase 1: Servicios Compartidos
```bash
# Crear estructura compartida
mkdir -p packages/shared/src/ai
mkdir -p packages/shared/src/backup
mkdir -p packages/shared/src/middleware

# Mover servicios AI
git mv apps/api/src/services/ai-analytics.service.ts packages/shared/src/ai/
git mv apps/api/src/services/advanced-ai-features.service.ts packages/shared/src/ai/

# Mover backup
git mv apps/api/backup/index.intermediate.ts packages/shared/src/backup/
git mv apps/api/src/index.intermediate.ts packages/shared/src/backup/

# Mover telemetry
git mv apps/api-agents-make/src/middleware/telemetry.ts packages/shared/src/middleware/
git mv apps/api-neura-comet/src/middleware/telemetry.ts packages/shared/src/middleware/
```

### Fase 2: Limpiar Archivos Backup
```bash
# Eliminar archivos .backup
rm apps/api/backup/index.basic.backup.ts
rm apps/api/backup/index.intermediate.backup.ts
```

### Fase 3: Actualizar Imports
```bash
# Ejecutar script de actualización
node scripts/refactor/update-imports.mjs
```

## 📋 Rutas Canónicas por Dominio

### API Services
- **Canónico:** `packages/shared/src/api/`
- **Duplicados:** `apps/*/src/services/`

### Middleware
- **Canónico:** `packages/shared/src/middleware/`
- **Duplicados:** `apps/*/src/middleware/`

### Backup
- **Canónico:** `packages/shared/src/backup/`
- **Duplicados:** `apps/*/backup/`

### AI Services
- **Canónico:** `packages/shared/src/ai/`
- **Duplicados:** `apps/*/src/services/ai-*`

### FinOps
- **Canónico:** `packages/shared/src/finops/`
- **Duplicados:** `apps/*/src/middleware/finops*`

## 🔄 Mapeo de Renombrado

| Archivo Original | Archivo Canónico | Acción |
|------------------|------------------|--------|
| `apps/api/src/services/ai-analytics.service.ts` | `packages/shared/src/ai/analytics.service.ts` | Mover |
| `apps/api/src/services/advanced-ai-features.service.ts` | `packages/shared/src/ai/features.service.ts` | Mover |
| `apps/api/backup/index.intermediate.ts` | `packages/shared/src/backup/intermediate.ts` | Mover |
| `apps/api/src/index.intermediate.ts` | `packages/shared/src/backup/intermediate.ts` | Eliminar |
| `apps/api-agents-make/src/middleware/telemetry.ts` | `packages/shared/src/middleware/telemetry.ts` | Mover |
| `apps/api-neura-comet/src/middleware/telemetry.ts` | `packages/shared/src/middleware/telemetry.ts` | Eliminar |

## ⚠️ Consideraciones de Seguridad

### Preservar Blame
- Usar `git mv` para preservar historial
- No usar `mv` + `git add`

### Tests
- Verificar que tests sigan funcionando
- Actualizar imports en tests

### Dependencias
- Actualizar package.json de packages/shared
- Verificar exports en tsconfig

## 📈 Impacto Esperado

### Reducción de LOC
- **Antes:** 357,241 líneas
- **Después:** ~296,582 líneas (-17%)
- **Reducción:** ~60,659 líneas

### Archivos
- **Antes:** 855 archivos
- **Después:** ~591 archivos (-31%)
- **Reducción:** ~264 archivos

### Mantenibilidad
- ✅ Código centralizado
- ✅ Imports consistentes
- ✅ Tests unificados
- ✅ Blame preservado

## 🚀 Próximos Pasos

1. **Ejecutar consolidación** con git mv
2. **Actualizar imports** con script automatizado
3. **Verificar tests** funcionan
4. **Actualizar documentación**
5. **Commit consolidado**

---

**Estado:** ✅ Análisis completo  
**Próximo:** Ejecutar consolidación
