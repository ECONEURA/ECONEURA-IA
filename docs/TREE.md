# Árbol de Directorios - ECONEURA

**Fecha:** $(date)  
**Fase:** PRE-MIGRACIÓN - FASE 0.1  
**Objetivo:** Estructura actual del repositorio

## 📁 Estructura Principal

```
ECONEURA-IA-1/
├── .husky/                    # Git hooks
├── .artifacts/                # Artefactos de build y métricas
├── apps/                      # Aplicaciones principales
│   ├── api/                   # Backend API principal
│   ├── web/                   # Frontend Next.js
│   ├── workers/               # Background jobs
│   ├── voice/                 # Voice recognition demo
│   ├── api-neura-comet/       # NEURA↔Comet API
│   └── api-agents-make/       # Agents↔Make API
├── packages/                  # Paquetes compartidos
│   ├── shared/                # Código compartido
│   ├── db/                    # Database utilities
│   ├── sdk/                   # SDK cliente
│   └── agents/                # AI agents
├── tests/                     # Tests organizados
│   ├── e2e/                   # End-to-end tests
│   ├── integration/           # Integration tests
│   ├── k6/                    # Performance tests
│   └── performance/           # Performance tests
├── docs/                      # Documentación
│   ├── audit/                 # Auditorías y análisis
│   ├── review/                # Revisiones
│   └── sync/                  # Sincronización
├── scripts/                   # Scripts de automatización
│   ├── metrics/               # Scripts de métricas
│   ├── refactor/              # Scripts de refactoring
│   └── [otros scripts]        # Scripts varios
├── contracts/                 # Contratos API (OpenAPI)
├── infra/                     # Infraestructura
├── tools/                     # Herramientas de desarrollo
├── studio/                    # Studio (mergeado recientemente)
├── config/                    # Configuraciones
├── postman/                   # Colecciones Postman
└── [archivos raíz]            # package.json, README, etc.
```

## 🎯 Análisis de Estructura

### ✅ Fortalezas
- **Separación clara:** apps/, packages/, tests/ bien organizados
- **Monorepo estructurado:** pnpm workspaces implementado
- **Tests organizados:** e2e, integration, performance separados
- **Documentación centralizada:** docs/ con subcategorías

### ⚠️ Áreas de Mejora
- **Duplicación:** Múltiples directorios de tests (test/, tests/)
- **Studio mergeado:** Directorio studio/ recién agregado
- **Herramientas dispersas:** tools/, scripts/, infra/ podrían consolidarse
- **Análisis temporal:** .analysis/, robust-code-analysis/ parecen temporales

## 📊 Métricas por Directorio

### Apps (6 aplicaciones)
- `api/` - Backend principal
- `web/` - Frontend Next.js  
- `workers/` - Background jobs
- `voice/` - Voice recognition demo
- `api-neura-comet/` - NEURA↔Comet API
- `api-agents-make/` - Agents↔Make API

### Packages (4 paquetes)
- `shared/` - Código compartido
- `db/` - Database utilities
- `sdk/` - SDK cliente
- `agents/` - AI agents

### Tests (4 tipos)
- `e2e/` - End-to-end tests
- `integration/` - Integration tests
- `k6/` - Performance tests
- `performance/` - Performance tests

## 🔄 Plan de Reorganización FASE 0

### 1. Consolidar Tests
- [ ] Mover `test/` → `tests/`
- [ ] Unificar estructura de tests
- [ ] Eliminar duplicaciones

### 2. Limpiar Directorios Temporales
- [ ] Revisar `.analysis/`
- [ ] Revisar `robust-code-analysis/`
- [ ] Mover a `docs/analysis/` si necesario

### 3. Consolidar Herramientas
- [ ] Revisar `tools/` vs `scripts/`
- [ ] Consolidar en `scripts/`
- [ ] Mantener `infra/` separado

### 4. Organizar Documentación
- [ ] Mover análisis a `docs/analysis/`
- [ ] Consolidar auditorías en `docs/audit/`
- [ ] Limpiar archivos temporales

## 📋 Próximos Pasos

1. **FASE 0.2:** Normalizar workspace (pnpm, turbo, tsconfig)
2. **FASE 0.3:** Ordenar documentación y limpiar basura
3. **FASE 0.4:** Deduplicación segura
4. **FASE 0.5:** Limpiar código muerto
5. **FASE 0.6:** Optimizar performance
6. **FASE 0.7:** Seguridad básica
7. **FASE 0.8:** Husky + CI
8. **FASE 0.9:** OpenAPI inmutable

---

**Estado:** ✅ Baseline establecido  
**Próximo:** FASE 0.2 - Normalizar workspace
