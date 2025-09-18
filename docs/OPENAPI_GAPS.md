# Gaps OpenAPI - ECONEURA

**Fecha:** $(date)  
**Fase:** PRE-MIGRACIÓN - FASE 0.9  
**Estado:** ❌ BLOQUEANTE

## 🚨 Problemas Críticos

### 1. Archivos OpenAPI Inconsistentes
- **contracts/cockpit.openapi.json:** 3 paths
- **apps/api/openapi.json:** 9 paths
- **Diferencia:** 6 paths faltantes

### 2. Rutas Públicas /v1/* Faltantes
- ❌ `/v1/health` - No encontrada
- ❌ `/v1/agents` - No encontrada  
- ❌ `/v1/chat` - No encontrada
- ❌ `/v1/budget` - No encontrada
- ❌ `/v1/metrics` - No encontrada

## 🎯 Plan de 3 Pasos

### Paso 1: Sincronizar Archivos OpenAPI
```bash
# Copiar paths de apps/api/openapi.json a contracts/cockpit.openapi.json
# Unificar estructura de endpoints
```

### Paso 2: Agregar Rutas Públicas Faltantes
```bash
# Implementar endpoints /v1/* en apps/api
# Actualizar documentación OpenAPI
```

### Paso 3: Verificar Consistencia
```bash
# Ejecutar scripts/check-openapi-diff.mjs
# Debe retornar 0 diferencias
```

## ⚠️ Impacto

- **CI Bloqueado:** OpenAPI diff ≠ 0
- **Documentación Inconsistente:** APIs no documentadas
- **Desarrollo Bloqueado:** Rutas faltantes

## 📋 Dueño

**Responsable:** Equipo Backend  
**Timeline:** Inmediato  
**Prioridad:** 🔴 Crítica

---

**Estado:** ❌ BLOQUEANTE - Requiere acción inmediata
