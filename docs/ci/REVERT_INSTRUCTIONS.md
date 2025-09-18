# CI Softening - Revert Instructions

## Objetivo
Este documento explica cómo revertir los cambios temporales de suavizado de CI para volver al modo estricto.

## Estado Actual: Modo Suave (Soft)
Los workflows actuales están configurados para NO fallar en casos de:
- Cobertura baja
- Fallos de OpenAPI validation
- Errores de link checking
- Fallos de security scanning
- Problemas de performance (K6)
- Errores de linting/typecheck
- Fallos de health checks

## Cómo Revertir a Modo Estricto

### 1. ci-min.yml
**Buscar:** `# REVERT_STRICT_CI`
**Cambio:** Reemplazar el bloque de "Check coverage threshold (SOFT MODE)" por:
```yaml
- name: Check coverage threshold
  run: |
    if [ -f coverage/coverage-summary.json ]; then
      COVERAGE=$(node -e "console.log(JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json')).total.lines.pct)")
      echo "Coverage: $COVERAGE%"
      THRESHOLD=60
      if (( $(echo "$COVERAGE < $THRESHOLD" | awk '{print ($1 < $3)}') )); then
        echo "❌ Coverage $COVERAGE% is below $THRESHOLD% threshold"
        exit 1
      else
        echo "✅ Coverage $COVERAGE% meets threshold"
      fi
    else
      echo "❌ No coverage report found"
      exit 1
    fi
```

### 2. ci-extended.yml
**Buscar:** `continue-on-error: true  # TEMP CI SOFT MODE`
**Cambio:** Eliminar todas las líneas `continue-on-error: true` de los siguientes jobs:
- `openapi_validate`
- `link_check`
- `security_scan`
- `api_e2e`

### 3. k6-smoke.yml
**Cambios:**
1. Descomentar el trigger push:
```yaml
on:
  push:
    branches: [ main, develop ]
  workflow_dispatch:
```

2. Descomentar el job `close-pr-on-fail` completo
3. Eliminar `continue-on-error: true` del paso "Run K6 smoke tests"

### 4. openapi-check.yml
**Buscar:** `continue-on-error: true  # TEMP CI SOFT MODE`
**Cambio:** Eliminar la línea del job `openapi-validation`

### 5. integrations-health.yml
**Buscar:** `continue-on-error: true` en el paso "Probe Make health endpoint"
**Cambio:** Eliminar la línea y restaurar comportamiento de fallo estricto

### 6. supervisor-nightly.yml
**Buscar:** `continue-on-error: true` en el paso "Typecheck & Lint"
**Cambio:** Eliminar la línea para que fallos de linting bloqueen la generación del panel

## Comando de Búsqueda Rápida
Para encontrar todos los cambios temporales:
```bash
grep -r "TEMP CI SOFT MODE\|REVERT_STRICT_CI\|continue-on-error.*soft" .github/workflows/
```

## Verificación Post-Revert
Después de revertir, verificar que:
1. Los workflows fallan apropiadamente cuando hay problemas reales
2. La cobertura baja bloquea el merge
3. Los errores de OpenAPI bloquean el deployment
4. Los fallos de performance son tratados como críticos

## Issue de Seguimiento
Se recomienda crear un issue: "Revertir suavizado CI" con checklist de todos estos elementos.

---
**Fecha de creación:** $(date)
**Commit de implementación:** $(git rev-parse HEAD)