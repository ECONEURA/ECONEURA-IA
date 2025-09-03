# ECONEURA — Progreso

**Objetivo:** Desplegar ECONEURA (cockpit pixel-perfect v3 en Azure), /v1 seguro con AAD+HMAC+Idempotencia, HIL/FSM con SLA y auto-cancel, FinOps guard 80/90/100 + kill-switch y observabilidad E2E; CI/CD con gates (OpenAPI, Playwright ≤2%, k6 p95<2s).


**Avance global:** **53%**
**Entrega (PRs):** 29%  ·  **Funcional:** 92%  ·  **Build:** ✅  **Tests:** ❌

> ⚠️ Bloqueado por: Redis, AAD, Make

| Área | % | Checks OK | Id |
|---|---:|---:|---|
| API /v1/agents/{agent_key}/trigger (OpenAPI + headers seguridad/coste) | 83% | 5/6 | api_trigger |
| Seed agents_master.json | 100% | 1/1 | seed |
| HIL/FSM (modelo + transición + SLA) | 100% | 2/2 | hil |
| Seguridad (helmet + AAD_REQUIRED) | 100% | 3/3 | security |
| Observabilidad (span de negocio presente) | 100% | 1/1 | observability |
| CI/CD (workflows e2e y perf mínimos) | 100% | 1/1 | cicd |
| ERP/CRM núcleo (Invoice model) | 100% | 1/1 | erp |
| Integración Make (referencias en seed/código) | 100% | 1/1 | make |
| Mistral local (flag sin PII) | 100% | 1/1 | mistral |
| UI v3 + snapshot (pendiente) | 0% | 0/2 | ui |
| Reportes/ROI (costHistory o SLO) | 100% | 1/1 | reports |

_Última actualización:_ 2025-09-02T22:55:18.364Z · _Modelo:_ v3-0.4-0.6 · _Checksum:_ `276c2e35ecc4`


## 1) Visión & Propuesta de valor

- **Resultados, no "chatbots"**: playbooks por departamento que mueven €/SLA con HIL (aprobación humana) y auditoría.
- **Confianza UE-first**: datos sensibles corren en **Mistral local**, orquestación en **Azure EU**, trazas y presupuestos visibles.
- **Adopción ejecutiva**: cada directivo inicia sesión (AAD) y conversa con su **agente doctor&coach** entrenado en su dominio **y** en comunicación empática.


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

**Patrones obligatorios**
- **/v1 sólo en apps/api** (web actúa como BFF).
- **PII→Local**: rutas de IA sensibles usan **Mistral** on-prem; Azure sólo para cómputo elástico no PII.
- **FinOps headers**: `X-Est-Cost-EUR`, `X-Budget-Pct`, `X-Latency-ms`, `X-Route`, `X-Correlation-Id`.
- **OTel**: spans con `org_id`, `agent_key`, `cost_est`.


## 3) Seguridad & Cumplimiento (EU)

- **Autenticación**: Azure AD (OIDC/JWT), `org_id` obligatorio en claims.
- **Integridad**: HMAC de cuerpo + ventana temporal + **Idempotency-Key**.
- **Autorización**: RBAC por rol/depto (HIL approvals).
- **Datos**: RLS Postgres por `org_id`; retención 90 días por defecto; export/erase (GDPR).
- **Frontera web**: Helmet (CSP/SRI), CORS allowlist.
- **Auditoría**: trail de HIL (eventos), SIEM-friendly (App Insights/Log Analytics).


## 4) Observabilidad & FinOps

- **Métricas SLO**: p95, error_rate, costos IA por agente/depto.
- **Alertas**: Teams (p95, 5xx, DEGRADED, budget 80/90/100).
- **FinOps**: presupuesto mensual por depto, **kill-switch** por agente y proyección EOM.


## 5) Calidad (gates CI) & Paneles

- **OpenAPI checksum** (`.openapi.checksum`) — bloquea drift.
- **/v1-only (route-linter)** — ninguna ruta fuera de API.
- **UI visual** (Playwright) — **dif ≤2%** contra Cockpit v3.
- **Rendimiento** (k6) — `/v1/progress` **p95 < 2s**.
- **Contrato AAD/HMAC/Idem** — 200/202/401/403 + idem 200/202/409.
- **Paneles**: `docs/PROGRESS_PANEL_v3.md` (producto) y `docs/PROGRESS_PANEL_SUP_v3.md` (supervisor).

### Ejecutar gates visuales y perf

- Visual (Playwright ≤2%): requiere `PLAYWRIGHT_BASE_URL` (GitHub Secret) o exportar `BASE_URL` localmente. El workflow detecta si no hay baseline y hace bootstrap automático.
- Perf (k6 smoke): requiere `K6_BASE_URL` (GitHub Secret). Si falta, el workflow se salta sin fallar.

Local:
- Tareas VS Code incluidas: “UI: Playwright (gate)” y “UI: Playwright (bootstrap snapshots)”, “Perf: k6 smoke”.
- O desde terminal:
  - BASE_URL=http://localhost:3000 pnpm test:ui
  - BASE_URL=http://localhost:3000 pnpm test:ui:update
  - BASE_URL=http://localhost:3000 pnpm perf:k6


## 6) Roadmap completo de PR‑0 → PR‑85 (titular + objetivo + DoD breve)

> **Leyenda**: ✅ listo · ⚠️ parcial/demo · ❌ falta.
> *El estado real lo llevamos en GitHub Projects; aquí se describen los objetivos y el “hecho” esperado.*

### **Fase 0 — Base del monorepo (PR‑0 → PR‑21)**
1. **PR‑00 · Bootstrap monorepo** — Turborepo/PNPM, workspaces, scripts base. *DoD*: build pasa y raíz limpia.
2. **PR‑01 · Lint/Format/Types** — ESLint/Prettier/TSConfig compartidos. *DoD*: `pnpm lint` y `typecheck` verdes.
3. **PR‑02 · Infra Docker local** — DB/Prometheus/Grafana/Jaeger. *DoD*: `docker:up` operativo.
4. **PR‑03 · Drizzle + esquema inicial** — tablas core y migraciones. *DoD*: `db:migrate` sin errores.
5. **PR‑04 · Next 14 (App Router)** — esqueleto web. *DoD*: página /health básica.
6. **PR‑05 · Express API** — esqueleto `/v1/ping`. *DoD*: supertest OK.
7. **PR‑06 · Auth minimal** — JWT y guard de org. *DoD*: rutas protegidas.
8. **PR‑07 · Auth+RLS** — políticas RLS iniciales. *DoD*: lecturas cruzadas fallan.
9. **PR‑08 · BFF Proxy** — cliente API y proxy seguro. *DoD*: IA/Search pasan por BFF.
10. **PR‑09 · UI/Iconos** — lucide + estilos base. *DoD*: sin warnings de bundle.
11. **PR‑10 · Observabilidad base** — OTel + Prometheus counters. *DoD*: métricas visibles.
12. **PR‑11 · CI/CD pipeline** — build/test en PR, cache, artefactos. *DoD*: badge verde.
13. **PR‑12 · CRM Interactions v1** — timeline + notas. *DoD*: CRUD con tests.
14. **PR‑13 · Features avanzadas v1** — analítica simple, IA básica. *DoD*: endpoints cubiertos.
15. **PR‑14 · Plataforma IA v1** — router IA, TTS, imágenes. *DoD*: demo‑mode listo.
16. **PR‑15 · Azure OpenAI+BFF** — integración real. *DoD*: headers FinOps.
17. **PR‑16 · Products v1** — CRUD productos. *DoD*: migraciones y tests.
18. **PR‑17 · Invoices v1** — CRUD + PDF simple. *DoD*: numeración temporal.
19. **PR‑18 · Inventory v1** — movimientos y saldos. *DoD*: Kardex básico.
20. **PR‑19 · Suppliers v1** — CRUD proveedores. *DoD*: relaciones básicas.
21. **PR‑20 · Payments v1** — link a invoices. *DoD*: estados mínimos.
22. **PR‑21 · README/Docs base** — guía rápida y contribución. *DoD*: README visible.

### **Fase 1 — Operabilidad & Salud (PR‑22 → PR‑30)**
23. **PR‑22 · Health & degradación** — endpoints live/ready/degraded (web+api) con `X‑System‑Mode`. *DoD*: smokes ok.
24. **PR‑23 · Alertas Teams + quiet hours** — servicio `alerts.service` con agrupación y horario. *DoD*: unit tests y smoke.
25. **PR‑24 · Analytics tipadas** — `packages/shared/analytics.ts`, API `/v1/analytics/events`, métricas controladas. *DoD*: eventos guardados.
26. **PR‑25 · Biblioteca de prompts (aprobación)** — versión+approve; BFF sólo approved. *DoD*: test negativo/positivo.
27. **PR‑26 · Caché IA/Search + warm‑up** — Redis/LRU + cron. *DoD*: `X‑Cache` hit/miss.
28. **PR‑27 · Zod integral en API** — middleware validate + negativos. *DoD*: 400 consistentes.
29. **PR‑28 · Helmet/CORS + CSP/SRI** — middleware API y CSP en Web. *DoD*: no eval; SRI correcto.
30. **PR‑29 · Rate‑limit org + Budget guard** — sliding window + barra consumo. *DoD*: umbrales 80/90/100.
31. **PR‑30 · Make quotas + idempotencia** — HMAC, ventana 5', dedupe y panel stats. *DoD*: replays controlados.

### **Fase 2 — Integraciones & Operación (PR‑31 → PR‑60)**
**Bloque A (31–40) Integraciones E2E & HITL**
32. **PR‑31 · Graph wrappers seguros** — Outlook/Teams server‑to‑server + outbox.
33. **PR‑32 · HITL v2** — aprobar/editar/enviar, lote, SLA, ownership, auditoría.
34. **PR‑33 · Stripe receipts + conciliación** — checkout→webhook→PDF→paid.
35. **PR‑34 · Inventory Kardex + alertas** — saldo por rango y Teams stockOutSoon.
36. **PR‑35 · Supplier scorecard** — OTIF/lead/defect y alertas mensuales.
37. **PR‑36 · Interactions SAS + AV** — quarantine→scan→clean/signed URL.
38. **PR‑37 · Companies taxonomía & vistas** — árbol tags y saved views.
39. **PR‑38 · Contacts dedupe proactivo** — E.164/email + trigram + merge audit.
40. **PR‑39 · Deals NBA explicable** — features store mínimo + razones top‑3.
41. **PR‑40 · Dunning 3‑toques** — 7/14/21, backoff, numeración segura.

**Bloque B (41–45) Fiscalidad, Bancos, GDPR, RLS**
42. **PR‑41 · Fiscalidad regional** — motor reglas (ES/UE) visible en UI.
43. **PR‑42 · SEPA ingest + matching** — CAMT/MT940, reglas, conciliación.
44. **PR‑43 · GDPR export/erase** — ZIP export + purge con journal.
45. **PR‑44 · Suite RLS generativa (CI)** — negativos por tabla/rol como gate.
46. **PR‑45 · Panel FinOps** — coste IA por playbook/org/mes + tendencias.

**Bloque C (46–50) Operaciones 24×7**
47. **PR‑46 · Quiet hours + on‑call** — rotaciones/escalado.
48. **PR‑47 · Warm‑up IA/Search** — franjas pico; ratio hit↑.
49. **PR‑48 · Secret rotation + secret‑scan** — gitleaks/secretlint + KV.
50. **PR‑49 · CSP/SRI estrictas** — verificación y smoke dedicado.
51. **PR‑50 · Blue/green + gates** — swap si p95/5xx ok; rollback auto.

**Bloque D (51–60) Resiliencia & Integrabilidad**
52. **PR‑51 · k6 + chaos‑light** — carga y fallos simulados.
53. **PR‑52 · OpenAPI + Postman** — spec real y colección.
54. **PR‑53 · Búsqueda semántica CRM** — embeddings con fallback FTS.
55. **PR‑54 · Reportes mensuales PDF** — KPIs a SharePoint + draft Outlook.
56. **PR‑55 · RBAC granular** — permissions por módulo/acción.
57. **PR‑56 · Backups & Restore runbook** — prueba mensual automatizada.
58. **PR‑57 · OpenTelemetry end‑to‑end** — trazas correladas.
59. **PR‑58 · UI de auditoría** — “quién/qué/cuándo” navegable.
60. **PR‑59 · XSS hardening inputs ricos** — sanitizado server‑side.
61. **PR‑60 · DoD automatizado** — gates duros en CI.

### **Fase 3 — Data Mastery & Hardening final (PR‑61 → PR‑85)**
62. **PR‑61 · Taxonomía Companies v2** — sinónimos/slug/lock + merges auditados.
63. **PR‑62 · Dedupe v2 + gating import** — candidatos y auto‑merge seguro.
64. **PR‑63 · Explainable NBA v2** — feature store y razones trazables.
65. **PR‑64 · AV global** — todos los módulos con quarantine/scan.
66. **PR‑65 · Audit Trail CRM + Undo** — diffs y revert 24 h.
67. **PR‑66 · Dunning sólido** — segmentos, KPIs y retries DLQ.
68. **PR‑67 · Fiscalidad extendida** — IGIC/IRPF/OSS/IOSS/Reverse charge.
69. **PR‑68 · Conteos cíclicos ABC** — tareas HITL y ajustes auditados.
70. **PR‑69 · Vendor scorecard completo** — OTIF/lead/PPV/SL con alertas.
71. **PR‑70 · SEPA robusto (.053/.054)** — excepciones y reglas UI.
72. **PR‑71 · HITL ownership & SLA** — turnos/vacaciones/escalado.
73. **PR‑72 · DLQ grooming** — causas y reanudar automático.
74. **PR‑73 · Panel cuotas Make** — consumo 80/90/100% + alertas.
75. **PR‑74 · Graph chaos‑light** — rotación tokens simulada.
76. **PR‑75 · CSP/SRI banca + reports** — endpoint report-uri.
77. **PR‑76 · UX presupuesto IA** — barra, pre‑alertas, modo lectura.
78. **PR‑77 · FinOps negocio** — coste playbook/org/mes (tendencias).
79. **PR‑78 · Quiet hours avanzadas** — festivos/calendarios por org.
80. **PR‑79 · Prompts CM (aprobación/versionado)** — workflow 2 ojos.
81. **PR‑80 · Warm‑up por franjas** — por TZ de la org.
82. **PR‑81 · Rotación secretos** — checklist trimestral + KV.
83. **PR‑82 · RLS fuzz avanzada** — property‑based en CI.
84. **PR‑83 · Retención/TTL** — legal holds y purga trazable.
85. **PR‑84 · Blue/green canary** — 5→25→100 % con gates métricos.
86. **PR‑85 · Performance & Chaos final** — SLOs firmados + runbooks.

## 7) Quickstart (local)

```bash
pnpm -w install
pnpm -w -r build && pnpm -w -r test || true
pnpm progress              # genera status/progress.json y PROGRESS.md
pnpm supervisor:check      # panel supervisor con gaps y órdenes
```

## 8) Despliegue (Azure · OIDC)

Infra: ACR + App Service/Container Apps + Postgres Flexible + Key Vault + App Insights (EU).

OIDC (sin secretos largos): configurar identidad federada en GH Actions (tenemos scripts/workflows).

Slots: blue/green + smoke post-deploy (Playwright/k6) y swap.

## 9) Agentes (10 dptos × 5 auto + 1 doctor&coach)

| Dpto | Agentes autom. (ejemplos) | Ejecutivo (doctor&coach) |
|------|---------------------------|--------------------------|
| CFO | Dunning, Cashflow, Forecast, SEPA match, ROI | CFO-X (finanzas & comunicación) |
| COO | Orders, Inventory Reorder, SLA Monitor, Incidents, S&OP | COO-X |
| CISO | Audit Logs, CSP/CORS Check, Secret Scan, RBAC Drift, Backup Verify | CISO-X |
| CHRO | Onboarding, Payroll Check, Attrition, Training Plan, PTO | CHRO-X |
| CMO | Campaign Run, Lead Scoring, SEO Brief, CAC/LTV, Sentiment | CMO-X |
| CTO | Deploy Guard, Perf Watch, Error Triage, Cost Guard, Chaos-lite | CTO-X |
| Sales | Pipe Hygiene, NBA, Quote, Renewal Risk, Follow-ups | VP-Sales-X |
| CS | NPS, Churn Risk, Playbooks, Health Score, SLA | CS-X |
| Procurement | OTIF, Supplier Score, Replenishment, Price Tracker, Contracts | Proc-X |
| Legal/Compliance | GDPR Export/Erase, Retention, Risk Flags, Clause Check, DPA | Legal-X |

(Catalog completo en seed/agents_master.json, 60 entradas con department_key, SLA_minutes, make_scenario_id, hitl).

## 10) Roadmap PR-0 → PR-85 (resumen operativo)

- **Fase A** — Repo & CI base (PR-0..4): hygiene, .env, Bicep, CI base.
- **Fase B** — Seguridad & contrato (PR-5..9): HMAC, Idem, RL, OTel, OpenAPI v1.
- **Fase C** — Endpoint clave (PR-10..13): /v1/agents/:key/trigger, tests contrato, AAD transicional, seed inicial.
- **Fase D** — FinOps & HIL (PR-14..19): estimador, headers, schema HIL, servicio, endpoints, expirer.
- **Fase E** — Observabilidad & Docs (PR-20..23): /v1/progress (ETag/304), SwaggerUI, RFC7807.
- **Fase F** — CI Gates I (PR-24..27): checksum OpenAPI, route-linter, CI strict, badge.
- **Fase G** — UI v3 (PR-28..31): import HTML/CSS, Playwright config + baseline + gate ≤2%.
- **Fase H** — Perf & k6 (PR-32..35): smoke p95<2s, dashboards KQL.
- **Fase I** — Make (PR-36..39): webhooks HMAC, dedupe, health, admin consumo.
- **Fase J** — Seed 60 (PR-40..43): ensure-sixty + Zod + SLA/hitl.
- **Fase K** — FinOps avanzado (PR-44..47): budgets depto, guard duro 80/90/100, kill-switch, proyección EOM.
- **Fase L** — Seguridad avanzada (PR-48..51): RLS, CSP/SRI banca, CORS KV, secrets→KV.
- **Fase M** — Cockpit (PR-52..55): islands, BFF proxy, panel FinOps, bandeja HIL.
- **Fase N/O** — ERP/CRM (PR-56..63): Companies/Contacts/Deals/Invoices + Interactions/Products/Inventory/Suppliers.
- **Fase P** — IA & Orquestación (PR-64..67): router local→cloud, guard prompts, playbooks, tone-pack doctor&coach.
- **Fase Q** — RBAC & AAD (PR-68..71): login, roles por depto, claims org_id, sesión segura.
- **Fase R** — Obs++ (PR-72..75): spans enriquecidos, alertas Teams, auditoría HIL, ROI board.
- **Fase S** — CI Gates II (PR-76..79): gates duros (visual, perf, contrato, rutas).
- **Fase T** — Infra & CD (PR-80..83): deploy OIDC, slots blue/green, backups, Front Door/SSL.
- **Fase U** — Cierre v1 (PR-84..85): runbooks/README, GA checklist (SLOs, budgets, DR).

**Definición de Hecho (DoD)** por PR: código + pruebas (unit/contract/ui/perf), migraciones/RLS, OpenAPI sync, logs estructurados, flags, demo-mode; gates CI verdes.

## 11) Cómo trabajar (VS Code / CI)

```bash
# progreso y panel
pnpm progress
pnpm supervisor:check

# gates locales (si tienes URLs)
BASE_URL=$PLAYWRIGHT_BASE_URL pnpm test:ui
BASE_URL=$K6_BASE_URL pnpm perf:k6
pnpm test:contract
```

Convenciones: Conventional Commits; ramas feature/PR-XX-*; nunca exponer /v1 fuera de apps/api.

## 12) Licencia & créditos

Licencia MIT. Hecho con en España. Infra recomendada: Azure EU + Mistral local (datos PII).
Contacto: equipo ECONEURA.
