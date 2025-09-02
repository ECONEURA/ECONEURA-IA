# ECONEURA — Panel Supervisor v3 (chequeo automático)
> Snapshot: 2025-09-02T19:25:59.887Z · Progreso global: **67%**
> CI: Build **PEND**, Tests **PEND**, OpenAPI **OK**, UI **PENDIENTE**, k6 **WF_ONLY**

## Matriz de controles
| Check | Estado | Evidencia |
|---|---:|---|
| .openapi.checksum | **PASS** | .openapi.checksum |
| /v1-only (route-linter) | **PASS** | .github/workflows/openapi-check.yml |
| UI baseline (Playwright ≤2%) | **FAIL** | tests/ui/**/__screenshots__/*.png |
| k6 smoke p95<2s | **PASS** | .github/workflows/k6-smoke.yml |
| Contratos AAD/HMAC | **PASS** | tests/contract/* + workflow |
| HIL schema+cron | **PASS** | prisma + rutas HIL |
| Seed **60 agentes** | **PASS (69/60)** | seed/agents_master.json (69/60) |
| OTel E2E | **PASS** | código API/monitoring |

## Órdenes directas (si FAIL)
1) OpenAPI → `pnpm openapi:record && git add .openapi.checksum && git commit -m "ci(openapi): record" && git push`
2) UI baseline → `BASE_URL=$PLAYWRIGHT_BASE_URL pnpm test:ui:update && git add tests/ui/**/__screenshots__ && git commit -m "test(ui): baseline" && git push`
3) k6 → `gh workflow run k6-smoke.yml`
4) Seed 60 → `pnpm seed:ensure60 && git add seed/agents_master.json && git commit -m "chore(seed): ensure 60" && git push`

_Generado por `pnpm supervisor:check`. No editar a mano._
