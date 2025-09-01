# ECONEURA — Progreso

**Objetivo:** Desplegar ECONEURA (cockpit pixel-perfect v3 en Azure), /v1 seguro con AAD+HMAC+Idempotencia, HIL/FSM con SLA y auto-cancel, FinOps guard 80/90/100 + kill-switch y observabilidad E2E; CI/CD con gates (OpenAPI, Playwright ≤2%, k6 p95<2s).


**Avance global:** **24%**  
**Entrega (PRs):** 29%  ·  **Funcional:** 40%  ·  **Build:** ❌  **Tests:** ❌

> ⚠️ Bloqueado por: Redis, AAD, Make

| Área | % | Checks OK | Id |
|---|---:|---:|---|
| UI Cockpit v3 pixel-perfect | 0% | 0/2 | ui |
| API /v1/agents/{agent_key}/trigger (AAD+HMAC+Idem) | 67% | 2/3 | api_trigger |
| Seed agents_master.json | 0% | 0/1 | seed |
| HIL/FSM (tablas+endpoints+auto-cancel) | 0% | 0/2 | hil |
| FinOps (guard 80/90/100 + kill-switch + EOM) | 33% | 1/3 | finops |
| Seguridad (/v1 con AAD en prod, CSP/SRI) | 100% | 2/2 | security |
| Observabilidad (OTel E2E + alertas) | 0% | 0/1 | observability |
| CI/CD con gates (OpenAPI/Playwright/k6) | 0% | 0/1 | cicd |
| ERP/CRM núcleo (CRUD + flujos) | 100% | 1/1 | erp |
| Integración Make.com | 100% | 1/1 | make |
| Mistral local (sin PII) | 0% | 0/1 | mistral |
| Reportes/ROI (feed runs, coste, SLO) | 50% | 1/2 | reports |

_Última actualización:_ 2025-09-01T22:17:06.377Z · _Modelo:_ v3-0.4-0.6 · _Checksum:_ `4fdc41712fc4` 
