# ECONEURA — Ecosistema de Inteligencia Colectiva (ERP/CRM + IA segura)

**Pitch**
ECONEURA es un ecosistema de inteligencia colectiva confiable para PYMEs europeas. Orquesta 60 agentes (10 dptos × 5 automatizados + 1 ejecutivo doctor&coach) con seguridad grado banca (AAD/HMAC/Idempotencia, RLS, CSP/SRI), PII→Local (Mistral on‑prem) y elasticidad en Azure. Todo gobernado por FinOps (80/90/100 + kill‑switch) y observabilidad E2E (OTel).

> Estado actual: ver badge de progreso y panel
> ![progress](../status/progress-badge.svg)
> Panel: `docs/PROGRESS_PANEL_v3.md` (y `docs/PROGRESS_PANEL_SUP_v3.md` para el supervisor)

---

## 1) Visión & Propuesta de valor

- Resultados, no "chatbots": playbooks por departamento que mueven €/SLA con HIL (aprobación humana) y auditoría.
- Confianza UE-first: datos sensibles corren en Mistral local, orquestación en Azure EU, trazas y presupuestos visibles.
- Adopción ejecutiva: cada directivo inicia sesión (AAD) y conversa con su agente doctor&coach entrenado en su dominio y en comunicación empática.

---

## 2) Arquitectura (monorepo)

```
/apps
  /web → Next.js (App Router). BFF sin /v1. Cockpit v3 (gate ≤2%).
  /api → Express + TS. TODO /v1 con AAD+HMAC+Idem, RLS, OpenAPI.
/packages
  /shared → Zod, HMAC/Idem, analytics, tipos.
  /db → Prisma schema, migraciones, políticas RLS.
/infra → IaC Azure (Bicep), Docker, GH Actions.
/docs → Paneles, runbooks, visión.
/seed → agents_master.json (60 agentes, SLA, make_id, hitl)
```

Patrones obligatorios
- /v1 sólo en apps/api (web actúa como BFF).
- PII→Local: rutas de IA sensibles usan Mistral on‑prem; Azure sólo para cómputo elástico no PII.
- FinOps headers: `X-Est-Cost-EUR`, `X-Budget-Pct`, `X-Latency-ms`, `X-Route`, `X-Correlation-Id`.
- OTel: spans con `org_id`, `agent_key`, `cost_est`.

---

## 3) Seguridad & Cumplimiento (EU)

- Autenticación: Azure AD (OIDC/JWT), `org_id` obligatorio en claims.
- Integridad: HMAC de cuerpo + ventana temporal + Idempotency-Key.
- Autorización: RBAC por rol/depto (HIL approvals).
- Datos: RLS Postgres por `org_id`; retención 90 días por defecto; export/erase (GDPR).
- Frontera web: Helmet (CSP/SRI), CORS allowlist.
- Auditoría: trail de HIL (eventos), SIEM-friendly (App Insights/Log Analytics).

---

## 4) Observabilidad & FinOps

- Métricas SLO: p95, error_rate, costos IA por agente/depto.
- Alertas: Teams (p95, 5xx, DEGRADED, budget 80/90/100).
- FinOps: presupuesto mensual por depto, kill‑switch por agente y proyección EOM.

---

## 5) Calidad (gates CI) & Paneles

- OpenAPI checksum (`.openapi.checksum`) — bloquea drift.
- /v1‑only (route-linter) — ninguna ruta fuera de API.
- UI visual (Playwright) — dif ≤2% contra Cockpit v3.
- Rendimiento (k6) — `/v1/progress` p95 < 2s.
- Contrato AAD/HMAC/Idem — 200/202/401/403 + idem 200/202/409.
- Paneles: `docs/PROGRESS_PANEL_v3.md` (producto) y `docs/PROGRESS_PANEL_SUP_v3.md` (supervisor).

### Ejecutar gates visuales y perf

- Visual (Playwright ≤2%): requiere `PLAYWRIGHT_BASE_URL` (GitHub Secret) o exportar `BASE_URL` localmente. El workflow detecta si no hay baseline y hace bootstrap automático.
- Perf (k6 smoke): requiere `K6_BASE_URL` (GitHub Secret). Si falta, el workflow se salta sin fallar.

Local:
- Tareas VS Code incluidas: “UI: Playwright (gate)” y “UI: Playwright (bootstrap snapshots)”, “Perf: k6 smoke”.
- O desde terminal:
  - BASE_URL=http://localhost:3000 pnpm test:ui
  - BASE_URL=http://localhost:3000 pnpm test:ui:update
  - BASE_URL=http://localhost:3000 pnpm perf:k6

---

## 6) Quickstart (local)

```bash
pnpm -w install
pnpm -w -r build && pnpm -w -r test || true
pnpm progress              # genera status/progress.json y PROGRESS.md
pnpm supervisor:check      # panel supervisor con gaps y órdenes
```

---

## 7) Despliegue (Azure · OIDC)

Infra: ACR + App Service/Container Apps + Postgres Flexible + Key Vault + App Insights (EU).

OIDC (sin secretos largos): configurar identidad federada en GH Actions (tenemos scripts/workflows).

Slots: blue/green + smoke post-deploy (Playwright/k6) y swap.

---

## 8) Agentes (10 dptos × 5 auto + 1 doctor&coach)

| Dpto | Agentes autom. (ejemplos) | Ejecutivo (doctor&coach) |
|------|---------------------------|--------------------------|
| CFO | Dunning, Cashflow, Forecast, SEPA match, ROI | CFO‑X (finanzas & comunicación) |
| COO | Orders, Inventory Reorder, SLA Monitor, Incidents, S&OP | COO‑X |
| CISO | Audit Logs, CSP/CORS Check, Secret Scan, RBAC Drift, Backup Verify | CISO‑X |
| CHRO | Onboarding, Payroll Check, Attrition, Training Plan, PTO | CHRO‑X |
| CMO | Campaign Run, Lead Scoring, SEO Brief, CAC/LTV, Sentiment | CMO‑X |
| CTO | Deploy Guard, Perf Watch, Error Triage, Cost Guard, Chaos‑lite | CTO‑X |
| Sales | Pipe Hygiene, NBA, Quote, Renewal Risk, Follow-ups | VP‑Sales‑X |
| CS | NPS, Churn Risk, Playbooks, Health Score, SLA | CS‑X |
| Procurement | OTIF, Supplier Score, Replenishment, Price Tracker, Contracts | Proc‑X |
| Legal/Compliance | GDPR Export/Erase, Retention, Risk Flags, Clause Check, DPA | Legal‑X |

(Catálogo completo en `seed/agents_master.json`, 60 entradas con `department_key`, `SLA_minutes`, `make_scenario_id`, `hitl`).

---

## 9) Roadmap PR‑0 → PR‑85 (resumen operativo)

- Fase A — Repo & CI base (PR‑0..4): hygiene, .env, Bicep, CI base.
- Fase B — Seguridad & contrato (PR‑5..9): HMAC, Idem, RL, OTel, OpenAPI v1.
- Fase C — Endpoint clave (PR‑10..13): /v1/agents/:key/trigger, tests contrato, AAD transicional, seed inicial.
- Fase D — FinOps & HIL (PR‑14..19): estimador, headers, schema HIL, servicio, endpoints, expirer.
- Fase E — Observabilidad & Docs (PR‑20..23): /v1/progress (ETag/304), SwaggerUI, RFC7807.
- Fase F — CI Gates I (PR‑24..27): checksum OpenAPI, route‑linter, CI strict, badge.
- Fase G — UI v3 (PR‑28..31): import HTML/CSS, Playwright config + baseline + gate ≤2%.
- Fase H — Perf & k6 (PR‑32..35): smoke p95<2s, dashboards KQL.
- Fase I — Make (PR‑36..39): webhooks HMAC, dedupe, health, admin consumo.
- Fase J — Seed 60 (PR‑40..43): ensure‑sixty + Zod + SLA/hitl.
- Fase K — FinOps avanzado (PR‑44..47): budgets depto, guard duro 80/90/100, kill‑switch, proyección EOM.
- Fase L — Seguridad avanzada (PR‑48..51): RLS, CSP/SRI banca, CORS KV, secrets→KV.
- Fase M — Cockpit (PR‑52..55): islands, BFF proxy, panel FinOps, bandeja HIL.
- Fase N/O — ERP/CRM (PR‑56..63): Companies/Contacts/Deals/Invoices + Interactions/Products/Inventory/Suppliers.
- Fase P — IA & Orquestación (PR‑64..67): router local→cloud, guard prompts, playbooks, tone‑pack doctor&coach.
- Fase Q — RBAC & AAD (PR‑68..71): login, roles por depto, claims org_id, sesión segura.
- Fase R — Obs++ (PR‑72..75): spans enriquecidos, alertas Teams, auditoría HIL, ROI board.
- Fase S — CI Gates II (PR‑76..79): gates duros (visual, perf, contrato, rutas).
- Fase T — Infra & CD (PR‑80..83): deploy OIDC, slots blue/green, backups, Front Door/SSL.
- Fase U — Cierre v1 (PR‑84..85): runbooks/README, GA checklist (SLOs, budgets, DR).

Definición de Hecho (DoD) por PR: código + pruebas (unit/contract/ui/perf), migraciones/RLS, OpenAPI sync, logs estructurados, flags, demo‑mode; gates CI verdes.

---

## 10) Cómo trabajar (VS Code / CI)

```bash
# progreso y panel
pnpm progress
pnpm supervisor:check

# gates locales (si tienes URLs)
BASE_URL=$PLAYWRIGHT_BASE_URL pnpm test:ui
BASE_URL=$K6_BASE_URL pnpm perf:k6
pnpm test:contract
```

Convenciones: Conventional Commits; ramas `feature/PR-XX-*`; nunca exponer /v1 fuera de `apps/api`.

---

## 11) Licencia & créditos

Licencia MIT. Hecho con ❤️ en España. Infra recomendada: Azure EU + Mistral local (datos PII).
Contacto: equipo ECONEURA.
