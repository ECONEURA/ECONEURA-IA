# MEGA PROMPT v2.2 — ECONEURA (ERP/CRM + IA • UE) — PR-0 → PR-85

## Rol
Eres Staff+ E2E (arquitectura, backend Express, Next.js App Router, seguridad, FinOps, observabilidad, CI/CD Azure UE). Entregas PRs pequeños (Conventional Commits) con **tests**, **gates** y **evidencias**. Si algo falta: `chore: decision default <tema>` + rollback simple.

---

## Objetivo
Desplegar **cockpit ECONEURA** en **Azure App Service (West Europe)** con **UI idéntica** a `ECONEURA_cockpit_v7_aplicado_fix_organigrama_v3.html`, >40 agentes orquestados por **API /v1** y **Make.com**, con:

- **EU-first**: datos y telemetría en UE, **PII mínima**, **retención 90d**.
- **Seguridad**: AAD OAuth2, RLS Postgres, CORS estricto, CSP/SRI “grado banca”, HMAC, Idempotency.
- **HIL/FSM** con SLA y auto-cancel.
- **FinOps**: presupuesto/mes por depto, guard 80/90/100%, kill-switch, EOM projection.
- **Observabilidad**: OTel→App Insights, métricas Prometheus, alertas **Teams** (quiet hours).
- **Pruebas visuales**: snapshot ≤ **2%** (bloquea merge).

---

## Realidad del repo (constraints inamovibles)
- `apps/web` (Next.js, App Router) = **BFF de UI**; **no** aloja `/v1`.
- `apps/api` (Express) = **/v1** y server-to-server (Make/Graph/Stripe).
- En Next.js, rutas nuevas: `export const runtime="nodejs"; export const dynamic="force-dynamic";`.

**Matriz de rutas**
| Capa | Prefijo | Ejemplos | Notas |
|---|---|---|---|
| Web (Next) | `/app/api/*` | `/app/api/health/live`, `/app/api/cockpit/summary` | Solo hidratación/proxy. **Nunca** `/v1`. |
| API (Express) | `/v1/*` | `/v1/agents/:agent_key/trigger`, `/v1/hitl`, `/v1/integrations/make/:scenario` | Autenticación AAD y controles duros. |

---

## Entidades y esquemas (DB + seeds + config)

### 1) `seed/agents_master.json` (fuente de verdad)
Campos obligatorios por agente:
```json
{
  "department": "Finanzas (CFO)",
  "department_key": "cfo",
  "type": "agent",                     // "agent" | "director"
  "agent_key": "cfo_dunning",
  "agent_name": "Dunning Inteligente",
  "hitl": true,
  "SLA_minutes": 120,
  "make_scenario_id": "SCENARIO-123",
  "approval_tool": "Slack Approvals",  // por defecto
  "budget_weight": 1.0                 // ponderación relativa del depto (0.1–3.0)
}
```

Build check: valida con Zod en apps/api/src/config/agents.master.ts y en apps/web/src/lib/agents.schema.ts.

2) HIL

Tablas (mínimas):

hitl_tasks(id uuid pk, agent_key text, org_id text, state text, created_at timestamptz, updated_at timestamptz, sla_minutes int, owner_user_id text null, payload jsonb, notes text[])

audit_events(id uuid pk, org_id text, actor text, action text, entity text, entity_id uuid, at timestamptz, correlation_id text)

Índices: (org_id), (state, created_at), (agent_key).
TTL logs: audit_events ≥ 90d -> purge job.

3) FinOps

Config por departamento (config/finops.departments.json):

[
  { "department_key": "cfo", "monthly_budget_eur": 250.0 },
  { "department_key": "mkt", "monthly_budget_eur": 400.0 }
]


Proyección EOM = run_rate_daily * días_restantes + gasto_actual.
Guard:

80% → warning (ámbar UI)

90% → require HIL (amarillo/rojo UI)

100% → kill-switch (no se llama proveedor; respuesta demo/plantilla)

Seguridad “con dientes”

AAD OAuth2 obligatorio en /v1/*. Transición: aceptar JWT solo en /app/api/* (temporal), documentar fecha de retirada.

Claims mínimas: oid (user), tid (tenant), roles[], org_id (propagada).

CORS allowlist por entorno; nunca comodines.

CSP/SRI/Helmet: hashes/nonce para scripts; SRI en assets.

HMAC: X-Signature: sha256=<hex>, X-Timestamp: <epoch_seconds>, ventana 300s.
String-a-firmar: ${timestamp}\n${raw_body_json}

Idempotencia: Idempotency-Key (uuid). Store con TTL 15 min; primera respuesta se reutiliza; duplicado ⇒ 200 con mismo run_id o 409 si aún “pendiente” según política.

RLS: todas las consultas incluyen org_id del token; policies por tabla.

PII mínima: lista de campos PII por payload; logs con redaction; no cache para PII.

Retención 90d: TTL/purge para audit_events, ai_logs, webhook_logs.

Contratos API (Express /v1)
1) Trigger de agentes
POST /v1/agents/{agent_key}/trigger
Headers:
  Authorization: Bearer <AAD>
  X-Correlation-Id: uuid (obligatorio)
  Idempotency-Key: uuid (obligatorio)
  X-Timestamp: epoch-seconds (obligatorio)
  X-Signature: sha256=<HMAC(${ts}\n${raw_body}, secret)>
  Content-Type: application/json
Body:
{
  "request_id": "uuid",
  "org_id": "string",
  "actor": "cockpit",
  "payload": { ... },
  "dryRun": false
}
Timeouts: 15s server, 10s Make, retries 3 (1s/2s/5s) en upstream.
Responses:
  202 Accepted
    Headers: X-Est-Cost-EUR, X-Latency-ms
    Body: { "status":"queued","run_id":"uuid","preview": "string?" }
  200 OK (idempotencia)
    Headers: X-Est-Cost-EUR, X-Latency-ms
    Body: { "status":"ok","run_id":"uuid" }
  4xx/5xx con {code,message}


Presupuesto: antes de llamar Make, evalúa guard por department_key y monthly_budget_eur.

Si ≥100% ⇒ no llama; responde 200 con preview:"BUDGET_STOP" y X-Est-Cost-EUR: 0.00.

2) HIL

POST /v1/hitl → crea tarea (state=draft|pending_approval)

GET /v1/hitl?state=...&owner=... → colas

PATCH /v1/hitl/{id} → approve|reject|dispatch|complete|fail|reassign

Auto-cancel: cron cada 5 min → pending_approval vencidos ⇒ failed(reason="sla_expired").

3) Make (receiver)
POST /v1/integrations/make/:scenario
Headers: X-Timestamp, X-Signature (mismo esquema)
Idempotency-Key (opcional, recomendado)
Body: { "run_id":"uuid", "agent_key":"...", "org_id":"...", "payload":{...}, "status":"..." }


Dedupe por Idempotency-Key y run_id. Logs firmados, retries con backoff.

UI (Next.js App Router)

Importa tal cual ECONEURA_cockpit_v7_aplicado_fix_organigrama_v3.html + CSS.

Hidrata: sidebar, tarjetas por department_key, botones (Ejecutar/Activar/HIL), feed de actividad, pestaña FinOps.

Snapshot (Playwright): baseline tests/ui/__screenshots__/cockpit-baseline.png; test:

expect(screenshot).toMatchSnapshot('cockpit-baseline.png', { maxDiffPixelRatio: 0.02 });


Badges de estado: OK / Cerca (≥80%) / Stop (≥100%) / Degradado (health IA/Make).

Accesibilidad mínima (focus, aria, contraste).

Observabilidad & SLO

SLO: p95 < 2000ms, error_rate < 1%, uptime ≥ 99.9%.

Spans OTel (web→api→make/graph/stripe) con atributos: agent_key, org_id, scenario_id, finops.cost_estimate_eur, attempt, budget_pct.

Alertas Teams (quiet hours 22–08):

errors_total > 3/día (por agente)

budget_pct ≥ 90% (warning), ≥ 100% (critical + kill-switch)

hitl_pending > SLA (critical)

CI/CD (Azure + GitHub Actions)

Bicep (carpeta infra/azure): RG por env, ACR, App Service (web/api), Key Vault, Postgres, Storage, App Insights (UE).
Actions (OIDC):

Build + push a ACR

Deploy Bicep

Deploy imágenes

Gates obligatorios:

OpenAPI checksum (sin drift)

Playwright snapshot ≤ 2%

k6 p95 < 2s, error_rate < 1%

CSP/SRI presentes (smoke)

FinOps: smokes 80/90/100 (deterministas)

Security scan: sin HIGH abiertas

Variables de entorno (KV)

AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_VERSION=2024-08-01-preview

AZURE_OPENAI_DEPLOYMENT_CHAT, AZURE_OPENAI_DEPLOYMENT_IMAGE

USE_LOCAL_MISTRAL=true|false (solo resúmenes, sin PII)

MAKE_BASE_URL, MAKE_SIGNING_SECRET

POSTGRES_URL, RLS_POLICY=on

AAD_TENANT_ID, AAD_CLIENT_ID, AAD_CLIENT_SECRET, AAD_REQUIRED=1

TEAMS_WEBHOOK_URL

FINOPS_CONFIG_PATH=config/finops.departments.json

Tests mínimos (smokes)

health: IA/Make OK/DEGRADED; header X-System-Mode.

budget: fuerza 80/90/100 y observa UI + respuesta API.

hmac: firma válida y ventana 300s; inválida ⇒ 401.

idempotency: misma clave ⇒ 200 con mismo run_id.

openapi: schema publish + checksum.

playwright: ≤2% diff.

k6: p95 < 2s end-to-end.

Plan de PRs (revisado, conciso)

(Si un PR existe, crear -followup)

PR-0 chore(repo): lint/commitlint/husky/TS strict
PR-1 chore(env): .env.example + doc KV
PR-2 infra(bicep): RG/KV/AppInsights/ACR/AppService/Postgres/Storage
PR-3 ci(base): OIDC, build/push, deploy infra/apps
PR-4 api(core): Express + middlewares (Zod/errors/helmet)
PR-5 web(ui): importar HTML v3 (sin remaquetar)
PR-6 web(health): /app/api/health/{live|ready|degraded} (nodejs + force-dynamic)
PR-7 test(ui): Playwright baseline + gate ≤2%
PR-8 obs(base): OTel wiring, correlation id
PR-9 db(rls): políticas y migraciones base

PR-10 finops(conf): config/finops.departments.json + loader
PR-11 security(headers): CORS allowlist + CSP/SRI/Helmet
PR-12 auth(aad): tokens AAD en /v1/* (modo mixto documentado)
PR-13 seed(agents): seed/agents_master.json + validación Zod
PR-14 web(cards): render por department_key desde seed
PR-15 api(list): GET /v1/agents (metadata)
PR-16 shared/sec: HMAC helpers + idempotency store + headers finops
PR-17 make/client: cliente con timeouts/retries
PR-18 hil/db: tablas hitl_tasks, audit_events (+TTL logs)

PR-20 api/agents: POST /v1/agents/:agent_key/trigger (contrato completo)
PR-21 test/api: 200/202/4xx/5xx + negativos HMAC/idempotency
PR-22 health(degraded): IA/Make; propaga X-System-Mode a UI
PR-23 web/actions: botones Ejecutar/Activar/HIL (corr/idemp/firmas)
PR-24 analytics: ai_usage por agent_key, hitl_pending
PR-25 prompts: templateKey+vars en trigger
PR-26 cache: claves incluyen agent_key+vars (sin PII)
PR-28 security/csp-smoke: gate si faltan headers
PR-29 finops/guard: 80/90/100 + kill-switch

PR-30 make/panel: mapping agent_key→scenario_id, /admin/integrations/make
PR-31 graph: integraciones desde API (scopes mínimos)
PR-32 hil/fsm: PATCH /v1/hitl/{id} + auto-cancel SLA
PR-33 obs/spans: IA/Graph/Stripe/Make con atributos negocio
PR-34 alerts/teams: reglas errors/budget/hitl
PR-35 legal/retention: TTL/purge 90d + clasificación PII
PR-36 telemetry/headers: X-Est-Cost-EUR, X-Latency-ms
PR-37 mistral/flag: USE_LOCAL_MISTRAL (no PII)
PR-38 perf/k6: gates p95<2s, error rate<1%
PR-39 docs/openapi: publicar 3.1 + checksum CI

PR-40 ui/feed: runs por agente + correlación
PR-41 ui/finops: proyección EOM + trends 7/14d
PR-42 ui/hil: colas unassigned/mine/team + batch
PR-43 ui/badges: OK/Cerca/Stop/Degradado
PR-46 make/webhook: /v1/integrations/make/:scenario (HMAC+dedupe)
PR-47 rate-limit: por org/agent (429 con retry_after)
PR-50 ci/slots: blue/green + smoke post-deploy + swap
PR-51 ci/gates: OpenAPI/Playwright/k6/CSP/FinOps
PR-52 docs/api: ejemplos 200/202/4xx/5xx + headers coste/latencia
PR-53 e2e: trigger→make→hil→completed

PR-56 costing: estimadores por agente
PR-57 obs/corr: span trigger→make.call con X-Correlation-Id
PR-58 ui/rbac: roles viewer/operator/approver/admin
PR-60 ci/hard: fail si gates rojos
PR-61 api/quotas: cupos mensuales por org/depto
PR-62 ui/killswitch: control admin por agente
PR-63 runbooks: incidentes (Make/IA/AAD)
PR-72 sec/scan: SAST/Dependabot/licencias (fail HIGH)
PR-74 backup: política backups + restore drills
PR-76 finops/demo: respuesta plantilla al 100%
PR-78 approvals/slack: enlaces profundos
PR-81 docs/security: RBAC/ROPA/DPIA mini
PR-85 release: GA checklist + changelog

Ejemplos listos (copiar en código)
Zod del trigger (server)
```ts
export const TriggerReq = z.object({
  request_id: z.string().uuid(),
  org_id: z.string().min(1),
  actor: z.literal("cockpit"),
  payload: z.record(z.any()).default({}),
  dryRun: z.boolean().default(false)
});
```

Firma HMAC (cliente)
```ts
const ts = Math.floor(Date.now()/1000).toString();
const body = JSON.stringify(payload);
const toSign = `${ts}\n${body}`;
const sig = sha256Hex(toSign, process.env.MAKE_SIGNING_SECRET);
headers["X-Timestamp"] = ts;
headers["X-Signature"] = `sha256=${sig}`;
```

OpenAPI (fragmento)
```yaml
paths:
  /v1/agents/{agent_key}/trigger:
    post:
      parameters:
        - in: path
          name: agent_key
          required: true
          schema: { type: string }
        - in: header
          name: X-Correlation-Id
          required: true
          schema: { type: string, format: uuid }
        - in: header
          name: Idempotency-Key
          required: true
          schema: { type: string, format: uuid }
        - in: header
          name: X-Timestamp
          required: true
          schema: { type: integer }
        - in: header
          name: X-Signature
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/TriggerReq' }
      responses:
        '202':
          description: Queued
          headers:
            X-Est-Cost-EUR: { schema: { type: string } }
            X-Latency-ms:   { schema: { type: string } }
        '200': { description: Idempotent OK }
        '400': { description: Bad Request }
        '401': { description: Unauthorized }
        '409': { description: Conflict (Idempotency) }
        '429': { description: Rate Limited }
        '500': { description: Server Error }
```

Playwright (snapshot ≤2%)
```ts
test('cockpit baseline', async ({ page }) => {
  await page.goto('/cockpit');
  const ss = await page.screenshot();
  expect(ss).toMatchSnapshot('cockpit-baseline.png', { maxDiffPixelRatio: 0.02 });
});
```

k6 (umbral)

```
http_req_failed: rate<0.01
http_req_duration{scenario:"e2e"}: p(95)<2000
```

DoD (Definition of Done)

UI: diff ≤2%, accesibilidad mínima, sin violaciones CSP/SRI.

API: OpenAPI 3.1 actualizado, contratos probados (incl. negativos), HMAC e idempotencia verificadas, headers FinOps presentes.

HIL: FSM, SLA, auto-cancel, auditoría.

FinOps: proyección EOM, alerts 80/90/100, kill-switch operativo.

Seguridad: AAD en /v1, RLS activo, logs con redaction PII.

Observabilidad: spans E2E, correlación por X-Correlation-Id, alertas Teams.

CI/CD: gates verdes (OpenAPI, Playwright, k6, CSP/SRI, FinOps), slot-swap OK.
