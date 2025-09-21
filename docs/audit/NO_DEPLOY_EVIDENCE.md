# NO_DEPLOY Evidence

Fecha: 2025-09-21 UTC

Este documento resume las acciones tomadas para aplicar la política "ECONEURA HARDENED v3 (SAFE, NO_DEPLOY, PRs ATÓMICOS)" y enumera los artefactos generados.

Workflows modificados y evidencia:

- `.github/workflows/integration-tests-with-compose.yml`
  - Acción: migraciones protegidas mediante `if: ${{ github.event.inputs.environment != 'production' }}` en el paso correspondiente.
- `.github/workflows/load-testing.yml`
  - Acción: job `prepare-test-scripts` protegido con `if: ${{ github.event.inputs.environment != 'production' || env.DEPLOY_ENABLED == 'true' }}`.
- `.github/workflows/staging-deploy.yml`
  - Acción: jobs `deploy-infrastructure` y `deploy-applications` requieren validación y un guardia `if:` que exige `env.DEPLOY_ENABLED == 'true'` o `inputs.force_deploy == true`.

Ramas y PRs:
- Se crearon ramas `fix/no-deploy-guards-*` con commits de evidencia mínimos (merge markers) y PRs atómicos para cada cambio. PRs fueron revisados y mergeados en `main`.

Artefactos generados en el workspace:
- `artifacts/analisis-workflows.json` (JSON con detalle por workflow)
- `artifacts/analisis-workflows.log` (registro de salida del análisis)
- `artifacts/score.json` (placeholder generado localmente)
- `artifacts/pnpm-audit.json` (placeholder: `pnpm not available`)

Notas y siguientes pasos:
- Para un readout completo (SCORE real) ejecutar `ci-audit-generate.yml` en GitHub Actions o habilitar `pnpm` en el runner local.
- Recomendamos habilitar protección de rama en `main` y exigir el job `workflow-analyze` como verificación obligatoria.

Comandos ejecutados localmente:

- `bash scripts/ci_generate_score.sh`
- `bash analizar-workflows.sh --fail-on=any --output-json artifacts/analisis-workflows.json`

Ver también: `docs/audit/READOUT.md` y `artifacts/`.
