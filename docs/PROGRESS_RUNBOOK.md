# Runbook: Activación de gates UI (≤2%) y k6 (p95 < 2s)

Este runbook describe cómo activar y operar los gates en CI.

## Prerrequisitos (repo secrets)
- PLAYWRIGHT_BASE_URL: URL pública de la web para pruebas (p. ej. https://web-dev.example.com)
- K6_BASE_URL: URL pública del API o web para smoke (p. ej. https://api-dev.example.com)
- NEXT_PUBLIC_API_URL: URL del backend que consume el BFF (p. ej. https://api-dev.example.com)
- Permisos de Actions: permitir a Workflows hacer commits (auto-bootstrap de baseline Playwright).

## Flujo de gate visual (Playwright ≤2%)
1) Primer run sin baseline:
   - El job detecta ausencia de `tests/ui/**/__screenshots__/` y ejecuta `pnpm test:ui:update`.
   - Auto-commit de baseline en el PR.
2) Runs siguientes:
   - Ejecuta `pnpm test:ui` con comparación y falla si >2% de diferencia.

## Flujo de smoke k6 (p95 < 2s)
- Exporta BASE_URL a partir de K6_BASE_URL. El script `pnpm test:k6` debe leerla y afirmar p95 < 2000ms.

## Paneles y alertas
- Reporte Playwright como artifact: status/playwright-report.
- Alertas: ver `docs/ALERTS.md`.
- KQL/Dashboards: ver `scripts/kql/dashboards.kql`.

## Troubleshooting
- Si falla por secrets: comprueba que están asignados al repo/ambiente.
- Si Playwright no encuentra BASE_URL: revisa que el step exporta `BASE_URL` desde `PLAYWRIGHT_BASE_URL`.
- Si k6 excede p95: inspecciona endpoints calientes y throttling (FinOps guard), revisa logs/OTel.

## Reversiones
- Para desactivar temporalmente gates, marca los jobs como `skip` usando secrets vacíos o usa environments con aprobación manual.

---
Actualiza este runbook si cambian variables o umbrales.
