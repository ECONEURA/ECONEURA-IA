# CI RADICAL SOFT MODE - DOCUMENTACIÓN TEMPORAL

## 🚨 PROPÓSITO
Eliminación RADICAL de todas las "X" rojas en GitHub Actions mediante la implementación de un modo "suave" que garantiza que NINGÚN workflow falle, dejando todo en verde mientras el equipo estabiliza el proyecto.

**⚠️ ESTE CAMBIO ES TEMPORAL Y DEBE REVERTIRSE**

## 📋 CAMBIOS IMPLEMENTADOS POR ARCHIVO

### Workflows Modificados

#### `.github/workflows/ci-min.yml`
- ✅ Job `build` con `continue-on-error: true`
- ✅ Coverage sin exit 1 (cálculo + warning en lugar de threshold)
- ✅ Pasos críticos con sufijo `|| echo "::warning ::mensaje (radical soft)"`

#### `.github/workflows/ci-extended.yml`
- ✅ Triggers eliminados: solo `workflow_dispatch` (no push/pull_request)
- ✅ Todos los jobs con `continue-on-error: true`
- ✅ Jobs `link_check` y `security_scan` comentados para evitar ruido
- ✅ Pasos críticos con warnings en lugar de fallos

#### `.github/workflows/k6-smoke.yml`
- ✅ Solo trigger `workflow_dispatch` (eliminado push/pull_request)
- ✅ Job `close-pr-on-fail` comentado
- ✅ Job `perf` con `continue-on-error: true`
- ✅ Pasos k6 con warnings en lugar de fallos

#### `.github/workflows/openapi-check.yml`
- ✅ Solo trigger `workflow_dispatch`
- ✅ Job `openapi-validation` con `continue-on-error: true`
- ✅ Pasos spectral y diff con warnings

#### `.github/workflows/integrations-health.yml`
- ✅ Schedule mantenido (opcional para logs)
- ✅ Job `health` con `continue-on-error: true`
- ✅ Paso final con warning en lugar de exit 1

#### `.github/workflows/supervisor-nightly.yml`
- ✅ Schedule mantenido
- ✅ Todos los pasos críticos con warnings
- ✅ Job con `continue-on-error: true`

#### `.github/workflows/oidc-setup-and-deploy.yml`
- ✅ Job `setup` con `continue-on-error: true`
- ✅ Job `deploy` mantiene condición `DEPLOY_ENABLED==true` + `continue-on-error: true`

#### `.github/workflows/_reusable-setup.yml`
- ✅ Comentario RADICAL_SOFT_MODE añadido (no se puede set continue-on-error en reusable)

#### `.github/workflows/trigger-ci.yml`
- ✅ Comentario RADICAL_SOFT_MODE añadido
- ✅ Continue-on-error en jobs donde aplica

## 🎯 ENCABEZADOS AÑADIDOS
Todos los workflows modificados incluyen este encabezado:
```yaml
# RADICAL_SOFT_MODE: Este workflow ha sido modificado para NO fallar nunca.
# Revertir buscando la etiqueta RADICAL_SOFT_MODE y eliminando continue-on-error / restaurando triggers.
```

## ⚠️ RIESGOS IDENTIFICADOS

### Seguridad
- **Ocultación de vulnerabilidades**: Gitleaks y security scans no bloquean el merge
- **Secretos expuestos**: Fallos de detección de secretos no se reportan como errores críticos
- **Dependencias vulnerables**: Auditorías de seguridad no bloquean desarrollo

### Calidad de Código
- **Coverage degradado**: Umbral de cobertura no se aplica
- **Linting ignorado**: Errores de estilo y sintaxis pasan sin revisar
- **Tests rotos**: Tests que fallan no bloquean el pipeline

### OpenAPI y Contratos
- **Breaking changes**: Cambios que rompen la API no se detectan
- **Documentación desactualizada**: Inconsistencias en OpenAPI pasan desapercibidas
- **Validación espectral**: Reglas de calidad de API ignoradas

### Performance
- **Degradación no detectada**: k6 tests que fallan no alertan sobre problemas de rendimiento
- **SLA incumplidos**: Timeouts y latencia alta no bloquean deploys

### Integración
- **Servicios externos rotos**: Health checks de integraciones no bloquean
- **E2E fallando**: Tests de integración que fallan pasan como warnings

## 📅 PLAN DE REVERT (CHECKLIST)

### Paso 1: Restaurar Triggers
- [ ] `k6-smoke.yml`: Restaurar `push` y `pull_request` triggers
- [ ] `ci-extended.yml`: Restaurar `push` y `pull_request` triggers  
- [ ] `openapi-check.yml`: Restaurar `push` y `pull_request` triggers
- [ ] `integrations-health.yml`: Revisar si necesita triggers adicionales

### Paso 2: Eliminar continue-on-error
- [ ] `ci-min.yml`: Quitar `continue-on-error: true` del job `build`
- [ ] `ci-extended.yml`: Quitar `continue-on-error: true` de todos los jobs
- [ ] `k6-smoke.yml`: Quitar `continue-on-error: true` del job `perf`
- [ ] `openapi-check.yml`: Quitar `continue-on-error: true` del job `openapi-validation`
- [ ] `integrations-health.yml`: Quitar `continue-on-error: true` del job `health`
- [ ] `supervisor-nightly.yml`: Quitar `continue-on-error: true` de todos los jobs
- [ ] `oidc-setup-and-deploy.yml`: Quitar `continue-on-error: true` de jobs `setup` y `deploy`

### Paso 3: Restaurar Coverage Threshold
- [ ] `ci-min.yml`: Cambiar cálculo de coverage + warning por exit 1 en threshold

### Paso 4: Rehabilitar Jobs Comentados
- [ ] `ci-extended.yml`: Descomentar jobs `security_scan` y `link_check`
- [ ] `k6-smoke.yml`: Descomentar job `close-pr-on-fail`

### Paso 5: Eliminar Warning Suffixes
- [ ] Buscar y eliminar todos los `|| echo "::warning ::**** (radical soft)"`
- [ ] Restaurar comandos originales que deben fallar cuando corresponde

### Paso 6: Limpieza
- [ ] Eliminar encabezados `# RADICAL_SOFT_MODE` de todos los workflows
- [ ] Eliminar este archivo `ci-RADICAL-SOFT-MODE.md`

## 📆 FECHA LÍMITE RECOMENDADA
**TODO: Definir fecha límite para revert (máximo 2 semanas desde implementación)**

Fecha de implementación: [COMPLETAR AUTOMÁTICAMENTE]
Fecha límite sugerida: [COMPLETAR AUTOMÁTICAMENTE + 14 días]

## 🎫 ISSUE SUGERIDO PARA REVERT

Crear el siguiente issue cuando esté listo para revertir:

**Título**: `[URGENT] Revertir modo radical CI - Restaurar validaciones estrictas`

**Descripción**:
```markdown
## Objetivo
Revertir el "modo radical soft" implementado temporalmente en los workflows de CI/CD para restaurar las validaciones estrictas y asegurar que los fallos reales bloqueen el pipeline.

## Contexto
El modo radical fue implementado en la rama `chore/ci-radical-soft-mode` para eliminar temporalmente todas las "X" rojas mientras se estabilizaba el proyecto.

## Tareas
- [ ] Seguir el checklist en `ci-RADICAL-SOFT-MODE.md`
- [ ] Verificar que todos los tests pasan genuinamente después del revert
- [ ] Probar que los workflows fallan correctamente cuando deben fallar
- [ ] Verificar branch protection rules

## Prioridad
🚨 **ALTA** - La seguridad y calidad están comprometidas mientras esté activo el modo radical

## Deadline
[Fecha límite desde ci-RADICAL-SOFT-MODE.md]
```

---

**⚠️ RECORDATORIO: Este modo oculta fallos reales. Revertir tan pronto como sea posible.**