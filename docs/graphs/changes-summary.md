Resumen de cambios aplicados en branch `fix/progress-merge-and-gates` (edición parcial):

- Se añadieron shims de tipos en `packages/shared/src/types` para `HilState` y augmentaciones de Express.
- Se endurecieron middlewares y utilidades en `apps/api/src` para reducir uso de `as any` y evitar ruido en typecheck:
  - `middleware/auth.ts`, `lib/auth.ts` — autenticación y tenant context tipado.
  - `lib/errors.ts` — manejo central de errores con guards sobre logger/metrics.
  - `middleware/observability.ts` — safer request logging, metrics guards, y headers.
  - `lib/clients.ts` — `getRedis()` más resiliente en CI.
  - `services/ai.ts` — llamadas al AI service más robustas y métricas en modo best-effort.
  - `routes/hil.ts`, `routes/hil.approvals.v2.ts`, `routes/hil.alias.ts` — limpieza de prisma/casts y mejor manejo de audit events.
  - `lib/trace.ts` — helpers seguros para spans (setAttribute, recordException, end).
  - `middleware/raw-body.ts`, `middleware/aadRole.ts` — minimizaciones de casts y uso de `req.user` tipado.

Estado:
- Búsqueda inicial mostró ~125 `as any` en `apps/api/src`; tras dos lotes esa cifra está en ~82.
- Se recomienda ejecutar `pnpm -w typecheck` localmente para revelar errores reales en `packages/db`.

Siguientes pasos sugeridos:
1. Ejecutar `pnpm -w typecheck` y compartir `typecheck.log`.
2. Yo generaré un grafo (Mermaid) de los top archivos con errores y aplicaré parches dirigidos.
3. Iterar hasta que `pnpm -w typecheck` esté limpio o reduzca ruido a prioridades reales.
