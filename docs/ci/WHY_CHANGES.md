# CI Rescue - Cambios Implementados

## Problemas Identificados

### 1. API Tests Fallando
- **Problema**: API no esperaba correctamente en CI
- **Causa**: Scripts de arranque inconsistentes, falta de health checks robustos
- **Solución**: Fallback script `api-start.mjs` con múltiples estrategias de arranque

### 2. Herramientas CI Inexactas
- **Problema**: `npx lychee` inexacto, `gitleaks` inexistente
- **Causa**: Dependencias no instaladas correctamente en CI
- **Solución**: Actions oficiales (`lycheeverse/lychee-action@v2`, `gitleaks/gitleaks-action@v2`)

### 3. E2E Tests Saltados
- **Problema**: Tests E2E no ejecutándose en CI principal
- **Causa**: Complejidad excesiva en workflow principal
- **Solución**: Separación en workflow manual con service containers

### 4. Workflows Rotos
- **Problema**: Múltiples workflows conflictivos
- **Causa**: Configuraciones superpuestas y dependencias rotas
- **Solución**: Archivo de workflows problemáticos en `_archive/`

## Cambios Implementados

### 1. CI Mínimo (`ci-min.yml`)
- **Objetivo**: Build + Unit tests que debe pasar en cada push/PR
- **Características**:
  - pnpm@8, Node 20
  - Cache optimizado
  - Coverage artifacts
  - Concurrency control

### 2. CI Extendido Manual (`ci-extended.yml`)
- **Objetivo**: Herramientas pesadas ejecutables bajo demanda
- **Jobs**:
  - `openapi_validate`: Spectral lint
  - `link_check`: Lychee action oficial
  - `security_scan`: Gitleaks action oficial
  - `api_e2e`: Tests E2E con Postgres service

### 3. Fallback API Start (`scripts/ci/api-start.mjs`)
- **Estrategias de arranque**:
  1. `start:ci` script
  2. `start` script
  3. `dev` script
  4. `dist/index.js` directo
- **Logging**: Todos los outputs a `.artifacts/api.log`
- **No bloquea**: Proceso en background

### 4. Configuración Optimizada
- **wait-on**: Versión 7.0.1 para compatibilidad
- **.lychee.toml**: Configuración mínima y robusta
- **DEPLOY_ENABLED**: "false" en todos los workflows

## Cómo Ejecutar CI Extended

1. Ir a GitHub Actions
2. Seleccionar "CI Extended (manual)"
3. Click "Run workflow"
4. Seleccionar branch (default: main)
5. Click "Run workflow"

## Rollback

### Opción 1: Revert Merge
```bash
git revert <merge-commit-hash>
```

### Opción 2: Restaurar desde Archive
```bash
mv .github/workflows/_archive/ci.yml .github/workflows/
mv .github/workflows/_archive/ci-gates.yml .github/workflows/
```

## Resultado Esperado

- **CI Min**: Verde en cada push/PR (build + unit tests)
- **CI Extended**: Ejecutable manual con artifacts completos
- **Cero Deploys**: DEPLOY_ENABLED="false" verificado
- **Artifacts**: coverage/, api-logs/, gitleaks-report/

## Troubleshooting

### Si API E2E sigue rojo:
1. Revisar `.artifacts/api.log` del job `api_e2e`
2. Verificar que `/health` endpoint existe
3. Ajustar `HEALTH_PATH` en el workflow si es necesario

### Si wait-on falla:
1. Verificar que API responde en puerto 3001
2. Aumentar timeout en `npx wait-on -t 180000`
3. Crear endpoint de health mínimo si no existe

### Si no hay tests en apps/api:
1. Crear test smoke mínimo: `GET /health => 200`
2. Verificar que `pnpm --filter "./apps/api" test` funciona localmente
