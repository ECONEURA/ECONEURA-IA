# Copilot instructions for ECONEURA-IA

Short goal: help AI coding agents make small, safe, and high-value changes in this monorepo without breaking builds or releases.

1) Big picture
- Monorepo layout: top-level `apps/` (api, web, workers), `packages/` (db, shared, sdk, etc.). Root orchestrates builds via `pnpm` workspaces. See `package.json` scripts.
- `apps/api` is a lightweight TypeScript Express server (see `apps/api/src/index.ts` and `apps/api/src/routes/`). `packages/shared` contains shared types and monitoring utilities (`packages/shared/src/monitoring/*`).
- Dataflow: API uses `@econeura/shared` types + `packages/db` Prisma client for DB access; AI calls go through `apps/api/src/services/ai/*` to Azure OpenAI.

2) Build/test/deploy workflows (how developers run things locally)
- Install and bootstrap: `pnpm install` at repo root (uses pnpm v8+ workspaces).
- Build everything: `pnpm build` (runs root scripts which call package builds).
- Build only API: `pnpm build:api` or `pnpm --filter @econeura/api build`.
- Dev: `pnpm dev` runs web+api concurrently (see `package.json` scripts). Use `pnpm dev:api` to run only API.
- Tests: `pnpm test` (vitest) and typecheck via `pnpm typecheck`.
- Lint: `pnpm lint` (root eslint config). Many packages rely on TypeScript path aliases; when editing, run typecheck after changes.

3) Project-specific conventions
- TypeScript: strict configs across packages. Prefer existing shared `types` in `packages/shared/src/types/*` over ad-hoc interfaces.
- Logging/monitoring: prefer `packages/shared/src/monitoring/logger.ts`, `metrics.ts`, `tracing.ts`. When adding metrics, follow `prom-client` conventions used in `apps/api/src/lib/metrics.ts`.
- Services: `apps/*/src/services` hold external integrations. For AI, use `apps/api/src/services/ai/azure-openai.service.ts`.
- Error handling: use `asyncHandler` wrappers in `apps/api/src/lib/errors.ts` and centralized error types in `packages/shared/src/core/errors`.
- Do not create new top-level packages without updating `pnpm-workspace.yaml` and root `package.json` scripts.

4) Integration points & external dependencies
- Database: Prisma in `packages/db`; migrations via `pnpm db:migrate` (see root scripts).
- Redis: configured via `config.REDIS_URL` from `packages/shared/src/config.ts`.
- Azure OpenAI SDK: `@azure/openai` used in `apps/api`.
- Observability: Application Insights may be referenced; prefer `packages/shared/src/monitoring` abstractions.

5) Safety rules for agents
- Always run TypeScript typecheck and the package build for the affected package(s) before committing.
- Small PRs: change one package at a time when possible (API, shared, or web). Use `pnpm --filter <pkg> build` for fast feedback.
- When updating shared types, search usages across the monorepo (`rg "<TypeName>"`) and update dependent packages.
- Do not remove or rename public exports from `packages/shared` without coordinating with consumers (update imports accordingly).
- For dependency changes, update root `pnpm-lock.yaml` by running `pnpm install` and commit the lockfile.

6) Examples of code patterns
- Health route: `apps/api/src/routes/health.ts` uses `asyncHandler` and `MetricsService` to record metrics.
- Metrics service pattern: `apps/api/src/lib/metrics.ts` exposes `getMetrics()` returning `prom-client` output; follow this when adding endpoints.
- Logger: `packages/shared/src/monitoring/logger.ts` implements a class `EconeuraLogger`—construct and call `logger.error('msg', { error })`.

7) Files to inspect first for any change
- `package.json` (root) — scripts & workspace setup
- `pnpm-workspace.yaml` — monorepo filtering
- `tsconfig.json` (root) and package-level tsconfigs
- `apps/api/src/index.ts` and `apps/api/src/routes/**`
- `packages/shared/src/monitoring/*` and `packages/shared/src/types/*`

8) If uncertain, ask the developer
- Which package to target for this change? (api, web, workers, shared)
- Do you want a small single-package PR, or a coordinated multi-package refactor?

If this file is missing or incomplete, ask for feedback. Create PRs small and include `pnpm -w typecheck` results in the PR description.
