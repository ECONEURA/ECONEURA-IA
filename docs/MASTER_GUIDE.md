# MASTER GUIDE

Visión general del repositorio ECONEURA-IA.

Objetivo: proporcionar una guía única y navegable para desarrolladores y operadores que trabajen con este monorepo.

Estructura principal:

- apps/
  - api/: servidor TypeScript Express, OpenAPI /v1
  - web/: Next.js app (Cockpit UI)
  - workers/: background jobs
- packages/
  - shared/: tipos compartidos, logging, monitoring
  - db/: prisma client
  - sdk/: SDKs internos

Flujos de datos y límites:

- API es la fuente de verdad para el contrato /v1 (openapi).
- Web consume BFF y BFF expone SSE para tiempo real.
- Workers usan packages/shared y packages/db.

Convenciones principales:

- Commits: Conventional-ish (docs(master): ..., feat(cockpit): ...). Máx 300 LOC por commit.
- Renames: usar `git mv` para preservar `blame`.
- TypeScript: tipado estricto (objetivo PR-2).
- Tests: vitest para unit; playwright para e2e; supertest para integracion API.
- CI: DEPLOY_ENABLED=false en workflows hasta PR-12.

Dónde empezar:

1. Leer `docs/MASTER_GUIDE.md` (este archivo).
2. Abrir `docs/ARCHITECTURE.md` para el diagrama high-level.
3. Revisar `docs/DECISIONS/ADR-0001.md` para decisiones clave.

Contacto: ver `README.md` y `docs/CONTRIBUTING.md`.

