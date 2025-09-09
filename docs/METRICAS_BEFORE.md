# Métricas Baseline - ECONEURA

**Fecha:** $(date)  
**Fase:** PRE-MIGRACIÓN - FASE 0.1  
**Objetivo:** Establecer baseline antes de reorg/limpieza

## 📊 Resumen Ejecutivo

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Archivos TypeScript** | 916 | ✅ |
| **Líneas de código** | 357,241 | ⚠️ Alto |
| **Tests totales** | 139 | ✅ |
| **Endpoints API** | 26 | ✅ |
| **Dependencias** | 21 (7 prod, 14 dev) | ✅ |

## 📁 Estructura de Archivos

### TypeScript/JavaScript
- **Archivos .ts:** 916 archivos
- **Líneas totales:** 357,241 líneas
- **Densidad:** ~390 líneas/archivo (alta)

### Tests
- **Unitarios:** 110 tests
- **Integración:** 22 tests  
- **E2E:** 7 tests
- **Total:** 139 tests
- **Cobertura estimada:** Por determinar

### API Endpoints
- **Rutas API:** 26 endpoints
- **Páginas web:** 0 (Next.js no construido)
- **Total:** 26 endpoints

### Bundle
- **Tamaño:** 0.00MB (no construido)
- **Chunks:** 0 (no construido)
- **Estado:** Requiere build para métricas reales

## 🎯 Objetivos FASE 0

### Reducción de Complejidad
- [ ] **LOC Target:** <300,000 líneas (-15%)
- [ ] **Archivos Target:** <800 archivos (-12%)
- [ ] **Deduplicación:** Eliminar código duplicado (jscpd ≤5%)

### Calidad
- [ ] **Tests:** Mantener ≥139 tests
- [ ] **Cobertura:** ≥80%
- [ ] **Endpoints:** Mantener 26 endpoints funcionales

### Performance
- [ ] **Bundle size:** Establecer límites
- [ ] **Build time:** Optimizar con Turbo cache
- [ ] **Dependencies:** Revisar y limpiar

## 📋 Próximos Pasos

1. **FASE 0.2:** Normalizar workspace (pnpm, turbo, tsconfig)
2. **FASE 0.3:** Ordenar documentación y limpiar basura
3. **FASE 0.4:** Deduplicación segura con jscpd
4. **FASE 0.5:** Limpiar código muerto (knip, depcheck)
5. **FASE 0.6:** Optimizar performance y build
6. **FASE 0.7:** Seguridad básica (helmet, CSP, CORS)
7. **FASE 0.8:** Habilitar Husky + CI
8. **FASE 0.9:** Verificar OpenAPI inmutable

## 🔍 Análisis Detallado

### Archivos por Directorio
```
apps/
├── api/           # Backend principal
├── web/           # Frontend Next.js
├── workers/       # Background jobs
├── voice/         # Voice recognition demo
├── api-neura-comet/    # NEURA↔Comet API
└── api-agents-make/    # Agents↔Make API

packages/
├── shared/        # Código compartido
├── db/           # Database utilities
├── sdk/          # SDK cliente
└── agents/       # AI agents

tests/
├── e2e/          # End-to-end tests
├── integration/  # Integration tests
└── performance/  # Performance tests
```

### Dependencias Críticas
- **Producción:** 7 dependencias
- **Desarrollo:** 14 dependencias
- **Total:** 21 dependencias (manejable)

## ⚠️ Alertas

1. **LOC Alto:** 357K líneas es considerable para un proyecto
2. **Bundle no construido:** No se pueden medir métricas de bundle
3. **Tests E2E bajos:** Solo 7 tests E2E para 26 endpoints
4. **Deduplicación pendiente:** No se ha ejecutado jscpd aún

## 📈 Métricas de Éxito

- ✅ **Baseline establecido:** 916 archivos, 357K LOC, 139 tests
- ✅ **Estructura clara:** Apps, packages, tests bien organizados
- ✅ **Dependencias controladas:** 21 total, ratio 1:2 prod:dev
- ⏳ **Bundle metrics:** Pendiente de build
- ⏳ **Deduplicación:** Pendiente de jscpd

---

**Próximo:** FASE 0.2 - Normalizar workspace
