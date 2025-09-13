# Issue: Alinear `packages/db` y `packages/shared` para pasar typecheck

Resumen
-------
Este issue coordina los cambios necesarios en `packages/db` (Prisma client) y `packages/shared` (tipos públicos) para que el workspace quede con `pnpm -w typecheck` limpio.

Por qué
------
Hemos reducido el ruido de `as any` en `apps/api` para exponer errores reales. Antes de continuar, necesitamos que `packages/db` y `packages/shared` ofrezcan contratos estables. Este issue documenta los pasos, evidencia y checklist para un PR coordinado.

Pasos para recolectar evidencia (obligatorio)
-------------------------------------------
1. En la raíz del repo, ejecuta:

```bash
pnpm -w install
pnpm -w -r build
pnpm -w typecheck | tee typecheck.log
```

2. Adjunta `typecheck.log` a este issue.
3. Ejecuta (opcional) para ver los ficheros con más errores:

```bash
awk -F: '{print $1}' typecheck.log | sort | uniq -c | sort -rn | head -n 50
```

Qué revisar primero (prioridad)
-------------------------------
1. `packages/db` — regenerar Prisma client (si procede) y asegurar exports públicos (ej. `getPrisma`, `prisma`).
2. `packages/shared` — definir interfaces públicas mínimas: Logger, MetricsService, TracingService.
3. Ajustes en `apps/api` para eliminar casts restantes y usar las nuevas interfaces.

Checklist mínimo para avanza en este issue
------------------------------------------
- [ ] Adjunté `typecheck.log` a este issue (archivo).
- [ ] Confirmé si hay que regenerar Prisma client (¿schema cambiado?).
- [ ] Añadí/actualicé tipos públicos en `packages/shared/src/types/*`.
- [ ] Añadí shims temporales (si aplica) para no romper consumidores en CI.
- [ ] Ejecuté `pnpm -w typecheck` después de los cambios y adjunté `typecheck.after.log`.
- [ ] Añadí tests mínimos (vitest) que verifiquen exports públicos.

Cómo dividir el trabajo (sugerencia)
------------------------------------
- Branch A: `db/regenerate-prisma` — solo regeneración y pruebas locales.
- Branch B: `shared/types-contracts` — agregar interfaces y documentar cambios.
- Branch C: `api/consume-types` — migrar `apps/api` a las nuevas interfaces (pequeños commits).

Revisores sugeridos
-------------------
- @owner/db-team
- @owner/shared-team
- @owner/api-team

Notas de riesgo
---------------
- Cambios en `packages/shared` pueden ser breaking; usar shims y documentar migración.
- Regenerar Prisma puede alterar tipos; aislar en branch propio.

Siguiente paso (por favor)
--------------------------
Adjunta `typecheck.log` y responde si quieres que yo abra los PRs iniciales (shims + tipos) en tu repo.
