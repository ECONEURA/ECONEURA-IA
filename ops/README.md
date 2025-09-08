# ECONEURA Operations

## Scripts Maestros

### Auditoría Completa
```bash
# Ejecutar auditoría completa del repo
./scripts/audit/run-all.sh
```

### Verificación de Calidad
```bash
# Verificación completa del repo
pnpm verify
```

### Tests y Performance
```bash
# Tests unitarios con cobertura
pnpm test -- --coverage

# Tests E2E con k6
pnpm e2e:smoke

# Tests UI con Playwright
pnpm e2e:ui
```

### Progreso del Proyecto
```bash
# Generar métricas de progreso
node tools/metrics/collect.mjs > .artifacts/metrics.json

# Calcular progreso total
node --loader ts-node/esm tools/progress/audit.ts > .artifacts/progress.json
```

## Reglas de PR

### Estándares de PR
- **Rama**: `pr/<nn>-<slug>`
- **Commit**: `feat|fix|refactor|chore|docs(scope): mensaje`
- **PR**: `PR-<nn>: <Título>`
- **Límite**: 300 LOC/PR máximo
- **DoD**: Cada PR incluye Definition of Done

### Proceso de PR
1. Crear rama desde `main`
2. Implementar cambios
3. Ejecutar `pnpm verify`
4. Crear PR con template
5. Asignar labels apropiados
6. Esperar review y merge

### Consolidación
- **No duplicados**: Consolidar en `packages/*`
- **Código muerto**: Eliminar con evidencia
- **ESM consistente**: `"type": "module"` donde aplique
- **TS estricto**: `strict: true` en todos los tsconfig

## Azure Pack

### Configuración
- **SUB**: fc22ced4-6dc1-4f52-aac1-170a62f98c57
- **TENANT**: a95d055a-f06e-445d-90da-c95415acc933
- **RG**: appsvc_linux_northeurope_basic
- **REGION**: northeurope
- **WEB**: econeura-web-dev
- **API**: econeura-api-dev

### URLs
- **WEB_FQDN**: https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net
- **API_URL**: https://econeura-api-dev.azurewebsites.net

### Deploy
- **Manual**: `workflow_dispatch` únicamente
- **Sin triggers**: No despliegues automáticos
- **Pack congelado**: Listo pero no activo

## Objetivos de Calidad

### Métricas Objetivo
- **Duplicación**: jscpd ≤ 0.5%
- **Cobertura**: ≥ 60%
- **Performance**: k6 p95 < 2000ms
- **ESLint**: 0 errores
- **TypeScript**: 0 errores estrictos

### Validación Final
```bash
# Verificación completa antes de Azure
pnpm verify
node scripts/lint-routes.mjs
cat .artifacts/metrics-k6.json | jq '.metrics.http_req_duration.values["p(95)"] < 2000'
node tools/metrics/collect.mjs > .artifacts/metrics.json
node --loader ts-node/esm tools/progress/audit.ts > .artifacts/progress.json
```

## Estructura del Repo

```
ECONEURA-IA-1/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── packages/         # Librerías compartidas
├── ops/             # Operaciones y scripts
├── docs/            # Documentación
├── tests/           # Tests E2E
├── .artifacts/      # Artefactos de auditoría
└── tools/           # Herramientas de desarrollo
```
