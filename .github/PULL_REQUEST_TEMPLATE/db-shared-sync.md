# PR: Alinear `packages/db` y `packages/shared`

Resumen
------
Este PR actualiza/añade tipos y/o regenera el Prisma client para garantizar que `pnpm -w typecheck` pase y que `apps/api` use contratos tipados en `packages/shared`.

Cambios propuestos
------------------
- Regeneración del Prisma client (si aplica). Comando: `pnpm --filter packages/db exec prisma generate`.
- Nuevos archivos de tipos en `packages/shared/src/types/`:
  - `logger.ts` (LogContext, LoggerPublic)
  - `metrics.ts` (MetricsService)
  - `tracing.ts` (TracingService)
- Shims temporales para mantener compatibilidad con consumers.
- Pequeños cambios en `apps/api` para usar los tipos nuevos (cast reducido).

Checklist del PR (obligatorio)
------------------------------
- [ ] `pnpm -w install` ejecutado localmente
- [ ] `pnpm -w -r build` ejecutado localmente
- [ ] `pnpm -w typecheck` OK (adjuntar `typecheck.before.log` y `typecheck.after.log`)
- [ ] Tests locales (vitest) pasan
- [ ] Documentación de breaking changes añadida (si aplica)
- [ ] Revisores asignados: @owner/db-team, @owner/shared-team, @owner/api-team

Cómo validar (revisor)
----------------------
1. Checkout del branch.
2. Ejecutar:
```bash
pnpm -w install
pnpm -w -r build
pnpm -w typecheck
pnpm -w test
```
3. Revisar que `packages/shared/src/types/*` cubre las firmas usadas por `apps/api`.
4. Si se regeneró Prisma, revisar que no hay cambios inesperados en exports o nombres.

Notas de rollback
-----------------
- Si la regeneración de Prisma rompe consumidores, revertir el commit de regeneración y abrir un PR específico para regeneración con más pruebas.

Comentarios
---------
- Mantener PR pequeño y enfocado: preferimos varios PRs pequeños (regen, types, consumers) en vez de uno monolítico.
