# Audit Readout

Fecha: 2025-09-21 UTC

Resumen:
- El script `scripts/ci_generate_score.sh` se ejecutó localmente en el contenedor de desarrollo.
- `pnpm` no estaba disponible en el runner local; por tanto la ejecución creó placeholders en `artifacts/`.
- Se generó `artifacts/score.json` (placeholder) y `artifacts/pnpm-audit.json` (placeholder).

Archivos generados / ubicaciones actuales:
- `artifacts/pnpm-audit.json` (placeholder si `pnpm` no está disponible)
- `artifacts/score.json` (resumen simple de vulnerabilidades)
- `artifacts/analisis-workflows.json` (resultado del escaneo de workflows)

Cómo generar el readout completo en CI (recomendado):

1. Hacer que el runner tenga `corepack`/`pnpm` disponible usando `actions/setup-node` y activando `corepack`:

```
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: corepack enable && corepack prepare pnpm@8.7.0 --activate
```

2. Ejecutar el script de auditoría:

```
- name: Run audit and generate score
  run: scripts/ci_generate_score.sh
```

3. Publicar los artefactos `artifacts/pnpm-audit.json` y `artifacts/score.json` como artefactos de Actions para revisión.

Recomendaciones para un readout completo:
- Ejecutar `pnpm install --frozen-lockfile`.
- Ejecutar linters y tests (`pnpm -w -r test --coverage` o `pnpm test` según workspace).
- Ejecutar `pnpm audit --json` y consolidar el resultado en `docs/modernize/SCORE.json`.

Notas:
- El script es defensivo y genera placeholders cuando faltan herramientas en el entorno local para evitar fallos en pipelines no preparados.
- Para ayuda al ejecutar esto en runners self-hosted, contacte al administrador para instalar `corepack`/`pnpm` o use el job de Actions `ci-audit-generate.yml` incluido en este repo.
