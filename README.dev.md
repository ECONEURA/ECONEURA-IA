# ECONEURA — Entorno Dev en VS Code

## Inicio rápido
1. Abre el repo en VS Code ➜ "Reopen in Container".
2. Espera `postCreate` (instala deps y genera Prisma).
3. DB local: Postgres:16, Redis:7 (docker-compose.dev.yml).
4. Ejecuta tareas:
   - `Dev (web+api)`
   - `DB: reset` + `DB: seed`
   - `API: openapi`

## Scripts útiles
- `pnpm -w dev` — arranca web + api si existe en root.
- `pnpm db:reset && pnpm db:seed` — entorno listo con datos.
- `pnpm test` / `pnpm test:e2e` — unitarios / E2E Playwright.

## Depuración
- **Next.js**: Launch "Next.js (apps/web)".
- **API**: Launch "API (apps/api)".
- **E2E**: Launch "Playwright (E2E)".

## Variantes
- Ajusta puertos/URLs en `.vscode/launch.json` y `.devcontainer/devcontainer.json`.
