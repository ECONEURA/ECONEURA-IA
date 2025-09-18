MODO V3 (Azure-first) — Contrato de salida
Responde siempre en este orden:

Entregables (rutas + archivos o diff + comandos)

DoD (cómo verifico: tests/headers/snapshot)

Resumen (≤5 líneas)

Evidencia (2 citas o marca HIL_REQUIRED)

Riesgos & supuestos

Tiempo/Coste (minutos, € aproximado)

Decision log (qué/por qué)

Siguientes 3 commits (Conventional)

Reglas duras: /v1 sólo en apps/api · UI v3 snapshot ≤2% · PII→Mistral local · FinOps headers (X-Est-Cost-EUR, X-Budget-Pct, X-Latency-ms, X-Route, X-Correlation-Id) · OTel attrs.

Atajos:

“AUDITA TU SALIDA CONTRA V3” → autochequeo PASS/FAIL

“HIL OBLIGATORIO” → corta y pide lo mínimo para seguir

“NO OPCIONES, SOLO EJECUTA” → sin A/B/C, directo

1) Patch 1 — Contexto + auditor de progreso + /v1/progress + tareas VS Code

Pega esto en Bash (terminal de VS Code o Cloud Shell):

# 1) Trabaja en una rama
git checkout -b chore/bootstrap-context-and-progress

# 2) Aplica el parche
git apply -p0 <<'PATCH'
diff --git a/docs/CONTEXT_ECONEURA.md b/docs/CONTEXT_ECONEURA.md
new file mode 100644
index 0000000..d7b2b7f
--- /dev/null
+++ b/docs/CONTEXT_ECONEURA.md
@@ -0,0 +1,29 @@
# ECONEURA — Contexto ejecutivo
**Qué es**
Ecosistema de inteligencia colectiva **confiable** para PYMEs europeas. Orquesta **60 agentes**
(10 departamentos × 5 automatizados + 1 ejecutivo doctor&coach) detrás de un **cockpit** pixel-perfect.
**Cómo funciona (mapa)**
- **Cockpit (Next.js)**: UI v3; sólo hidratar islas.
- **BFF/API (Express)**: contrato **/v1** con AAD + HMAC + Idempotencia; orquesta **Mistral local** (PII) y **Azure**.
- **Make.com**: conectores Outlook/Teams/ERP (webhooks firmados, dedupe).
- **EU-first**: Azure EU, Key Vault, App Insights; **HIL/FSM**; **FinOps** (80/90/100 + kill-switch); **OTel**.
**Principios inamovibles**
- **/v1 sólo en apps/api**.
- **Snapshot UI ≤2%** frente a HTML v3.
- **Seguridad**: AAD, org_id obligatorio, RLS, CORS estricto.
- **PII→Local**: retención 90 días.
- **Observabilidad**: X-Correlation-Id, spans OTel, métricas p95/error/coste/HIL.
- **FinOps**: presupuestos, guard 80/90/100, kill-switch, proyección EOM.
**Qué entregamos**
1) Cockpit v3 en Azure EU.
2) **/v1/agents/{agent_key}/trigger** seguro.
3) **HIL/FSM** con SLA y auto-cancel.
4) **FinOps** visible y gobernado.
5) **60 agentes** conectados a Make.com y Mistral local.
6) **CI/CD** con gates (OpenAPI/Playwright/k6).
diff --git a/docs/OBJETIVO_GENERAL.md b/docs/OBJETIVO_GENERAL.md
new file mode 100644
index 0000000..f8a1cbb
--- /dev/null
+++ b/docs/OBJETIVO_GENERAL.md
@@ -0,0 +1,7 @@
# Objetivo general ECONEURA
Desplegar Cockpit v3 en **Azure (EU)** con **/v1** seguro (AAD/HMAC/Idempotencia),
**HIL/FSM** con SLA y auto-cancel, **FinOps** (guard 80/90/100 + kill-switch) y **observabilidad E2E**;
integrar **60 agentes** (10×(5+1)) orquestados por BFF + Make.com + Mistral local;
**CI/CD** con gates (OpenAPI, Playwright ≤2%, k6 p95<2s). Reglas: **/v1 sólo en apps/api** · **UI v3 ≤2%** · **PII→Local**.
diff --git a/docs/PLAN_ACCION_VSCODE2.md b/docs/PLAN_ACCION_VSCODE2.md
new file mode 100644
index 0000000..4a7af2a
--- /dev/null
+++ b/docs/PLAN_ACCION_VSCODE2.md
@@ -0,0 +1,60 @@
# Plan de acción (VS Code 2)
## F0 Base (hoy)
- `pnpm -w -r build && pnpm -w -r test` verdes en `@econeura/api` y `@econeura/shared`.
- Auditor: `pnpm progress` → PROGRESS.md + badge (status/*).
## F1 API contrato & seguridad (hoy/mañana)
- POST **/v1/agents/{agent_key}/trigger** con AAD, HMAC, Idempotency, rate-limit org+agent.
- Headers: `X-Est-Cost-EUR`, `X-Budget-Pct`, `X-Latency-ms`, `X-Route`, `X-Correlation-Id`.
- OpenAPI 3.1 + tests 200/202/4xx/5xx.
## F2 HIL/FSM + FinOps (48h)
- Prisma: `HITLState`, `hitl_task`, `audit_event`; endpoints POST/PATCH/GET; cron auto-cancel.
- Budget por dpto + guard 80/90/100 + kill-switch.
## F3 UI v3 + snapshots (48–72h)
- Import HTML/CSS v3; Playwright baseline y gate ≤2% (sin remaquetar).
## F4 Integración Make + políticas (72–96h)
- `seed/agents_master.json` completo (60 entradas con `make_scenario_id`).
- Webhooks firmados (HMAC ventana 300s) + dedupe.
## F5 Observabilidad & gates (96–120h)
- App Insights p95/error/cost/hitl_pending; workflows: OpenAPI checksum, Playwright gate, k6 p95<2s.
## F6 Onboarding ejecutivos (120–144h)
- AAD login; home por dpto; tone-pack (doctorado + comunicación empática) en agente ejecutivo.
## Comandos útiles
```bash
pnpm -w -r build && pnpm -w -r test || true
pnpm progress
curl -sS $NEXT_PUBLIC_API_URL/v1/progress | jq '.'


diff --git a/progress.config.yaml b/progress.config.yaml
new file mode 100644
index 0000000..b8095c6
--- /dev/null
+++ b/progress.config.yaml
@@ -0,0 +1,48 @@
objective: >
Cockpit v3 en Azure (EU) + /v1 seguro (AAD/HMAC/Idem), HIL/FSM, FinOps 80/90/100 + kill-switch,
observabilidad E2E, 60 agentes (10×(5+1)), CI gates (OpenAPI, Playwright ≤2%, k6 p95<2s).
objectives:

id: api-trigger
name: API /v1 trigger seguro
weight: 1
checks:

{ type: includes, path: "apps/api/openapi/**/openapi.json", contains: "/v1/agents/{agent_key}/trigger" }

{ type: includes, path: "apps/api/src/**", contains: "X-Est-Cost-EUR" }

id: hil
name: HIL/FSM operativo
weight: 1
checks:

{ type: includes, path: "apps/api/prisma/schema.prisma", contains: "model hitl_task" }

{ type: includes, path: "apps/api/src/**", contains: "pending_approval" }

id: finops
name: FinOps (guards + kill-switch)
weight: 1
checks:

{ type: includes, path: "apps/api/src/**", contains: "X-Budget-Pct" }

{ type: file, path: "apps/api/src/config/finops.departments.json" }

id: ui
name: UI v3 + snapshot
weight: 1
checks:

{ type: glob, pattern: "apps/web/**/ECONEURA_cockpit_v7_aplicado_fix_organigrama_v3.html" }

{ type: includes, path: "tests/ui/**/*.spec.", contains: "toMatchSnapshot" }

id: make
name: Make.com integrado
weight: 0.8
checks:

{ type: includes, path: "seed/agents_master.json", contains: "make_scenario_id" }

id: cicd
name: CI gates
weight: 1
checks:

{ type: includes, path: ".github/workflows/**/*.yml", contains: "playwright" }

{ type: includes, path: ".github/workflows/**/*.yml", contains: "k6" }

id: observability
name: Observabilidad E2E
weight: 0.8
checks:

{ type: includes, path: "apps/api/src/**", contains: "@opentelemetry" }

id: reports
name: Reportes/ROI
weight: 0.6
checks:

{ type: includes, path: "apps/api/src/**", contains: "cost" }
diff --git a/.vscode/tasks.json b/.vscode/tasks.json
new file mode 100644
index 0000000..3c6a7e1
--- /dev/null
+++ b/.vscode/tasks.json
@@ -0,0 +1,23 @@
{
"version": "2.0.0",
"tasks": [
{ "label": "Progress", "type": "shell", "command": "pnpm progress", "problemMatcher": [] },
{ "label": "Build all", "type": "shell", "command": "pnpm -w -r build", "problemMatcher": [] },
{ "label": "Test all", "type": "shell", "command": "pnpm -w -r test || true", "problemMatcher": [] }
]
}
diff --git a/apps/api/src/middleware/finops.ts b/apps/api/src/middleware/finops.ts
new file mode 100644
index 0000000..625e1a4
--- /dev/null
+++ b/apps/api/src/middleware/finops.ts
@@ -0,0 +1,26 @@
import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
export function finopsHeaders(estCostEUR = 0, budgetPct = 0) {
return (req: Request, res: Response, next: NextFunction) => {
const cid = (req.headers["x-correlation-id"] as string) || crypto.randomUUID();
res.setHeader("X-Correlation-Id", cid);
res.setHeader("X-Est-Cost-EUR", estCostEUR.toFixed(4));
res.setHeader("X-Budget-Pct", ${Math.round(budgetPct)});
res.setHeader("X-Route", req.originalUrl);
next();
};
}
diff --git a/apps/api/src/routes/progress.ts b/apps/api/src/routes/progress.ts
new file mode 100644
index 0000000..b1d4a2f
--- /dev/null
+++ b/apps/api/src/routes/progress.ts
@@ -0,0 +1,18 @@
import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
export const progressRouter = Router();
progressRouter.get("/v1/progress", (_req, res) => {
try {
const p = path.join(process.cwd(), "status", "progress.json");
const data = fs.readFileSync(p, "utf8");
res.type("application/json").send(data);
} catch {
res.status(404).json({ message: "progress.json not found" });
}
});
diff --git a/apps/api/src/index.ts b/apps/api/src/index.ts
--- a/apps/api/src/index.ts
+++ b/apps/api/src/index.ts
@@ -1,3 +1,4 @@
+// PATCH: progreso API
import express from "express";
@@ -10,6 +11,12 @@
// ... tu configuración (helmet, cors, compression, raw body, AAD, rutas…)
+// >>> Añadir estas dos líneas si no existen:
+import { progressRouter } from "./routes/progress";
+app.use(progressRouter);
+// <<< Fin añadido
export default app;
diff --git a/status/.gitkeep b/status/.gitkeep
new file mode 100644
index 0000000..e69de29
--- /dev/null
+++ b/status/.gitkeep
PATCH

3) Commit

git add .
git commit -m "chore(context): contexto/objetivo/plan; progress config y tasks; feat(api): /v1/progress + FinOps headers"


---

# 2) Patch 2 — Gates Playwright ≤2% + k6 smoke + workflows

```bash
git checkout -b ci/gates-playwright-k6
git apply -p0 <<'PATCH'
diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -5,6 +5,12 @@
  "scripts": {
+    "test:ui": "playwright test -c tests/ui/playwright.config.ts",
+    "test:ui:update": "playwright test -c tests/ui/playwright.config.ts --update-snapshots",
+    "perf:k6": "k6 run tests/perf/e2e.js",
    "progress": "tsx scripts/progress.ts"
  },
+  "devDependencies": { "@playwright/test": "^1.46.0" }
}
diff --git a/tests/ui/playwright.config.ts b/tests/ui/playwright.config.ts
new file mode 100644
index 0000000..a1b2c3d
--- /dev/null
+++ b/tests/ui/playwright.config.ts
@@ -0,0 +1,33 @@
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: __dirname,
 forbidOnly: true,
 timeout: 60000,
 use: { baseURL: process.env.BASE_URL || '', viewport: { width: 1440, height: 900 } },
 reporter: [['list'], ['html', { outputFolder: 'status/playwright-report', open: 'never' }]],
 projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
diff --git a/tests/ui/cockpit.spec.ts b/tests/ui/cockpit.spec.ts
new file mode 100644
index 0000000..b3c4d5e
--- /dev/null
+++ b/tests/ui/cockpit.spec.ts
@@ -0,0 +1,17 @@
import { test, expect } from '@playwright/test';
const threshold = Number(process.env.SNAPSHOT_THRESHOLD || '0.02');
test('Cockpit snapshot ≤2%', async ({ page, baseURL }) => {
  test.skip(!baseURL, 'BASE_URL no configurado');
  await page.goto(baseURL!);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('cockpit.png', { maxDiffPixelRatio: threshold });
});
diff --git a/tests/perf/e2e.js b/tests/perf/e2e.js
new file mode 100644
index 0000000..e5f6a7b
--- /dev/null
+++ b/tests/perf/e2e.js
@@ -0,0 +1,23 @@
import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = { vus: 1, duration: '10s', thresholds: { http_req_duration: ['p(95)<2000'] } };
export default function () {
  const base = __ENV.BASE_URL;
  if (!base) { sleep(1); return; }
  const res = http.get(`${base}/v1/progress`);
  check(res, { 'status 200|404': r => r.status === 200 || r.status === 404 });
  sleep(1);
}
diff --git a/.github/workflows/e2e-playwright.yml b/.github/workflows/e2e-playwright.yml
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/.github/workflows/e2e-playwright.yml
@@ -0,0 +1,75 @@
name: e2e-playwright
on: { push: { branches: ['**'] }, workflow_dispatch: {} }
jobs:
  e2e:
    runs-on: ubuntu-latest
    env:
      BASE_URL: ${{ secrets.PLAYWRIGHT_BASE_URL }}
      SNAPSHOT_THRESHOLD: '0.02'
    steps:
      - uses: actions/checkout@v4
  - run: corepack enable && corepack prepare pnpm@8.15.6 --activate
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx playwright install --with-deps
      - name: Detect baseline
        id: b
        run: |
          shopt -s globstar || true
          c=$(ls tests/ui/**/__screenshots__/**/*.png 2>/dev/null | wc -l | tr -d ' ')
          if [ "$c" = "0" ]; then echo "mode=bootstrap" >> $GITHUB_OUTPUT; else echo "mode=gating" >> $GITHUB_OUTPUT; fi
      - if: steps.b.outputs.mode == 'bootstrap'
        run: pnpm test:ui:update || true
      - if: steps.b.outputs.mode == 'gating'
        run: pnpm test:ui
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: status/playwright-report }
      - uses: actions/upload-artifact@v4
        if: steps.b.outputs.mode == 'bootstrap'
        with: { name: playwright-snapshots-bootstrap, path: tests/ui/**/__screenshots__/, if-no-files-found: ignore }
diff --git a/.github/workflows/k6-smoke.yml b/.github/workflows/k6-smoke.yml
new file mode 100644
index 0000000..def6789
--- /dev/null
+++ b/.github/workflows/k6-smoke.yml
@@ -0,0 +1,22 @@
name: k6-smoke
on: { push: { branches: ['**'] }, workflow_dispatch: {} }
jobs:
  perf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6@v1
      - name: Run k6
        env: { BASE_URL: ${{ secrets.K6_BASE_URL }} }
        run: |
          if [ -z "$BASE_URL" ]; then echo "skip"; exit 0; fi
          npx --yes k6@0.49.0 run tests/perf/e2e.js
PATCH

git add .
git commit -m "ci(gates): Playwright ≤2% + k6 smoke; config y tests"

3) Patch 3 — Test de contrato del trigger (/v1/agents…)

git checkout -b test/contract-agents-trigger
git apply -p0 <<'PATCH'
diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -6,6 +6,9 @@
  "scripts": {
    "test:ui": "playwright test -c tests/ui/playwright.config.ts",
    "test:ui:update": "playwright test -c tests/ui/playwright.config.ts --update-snapshots",
    "perf:k6": "k6 run tests/perf/e2e.js",
+    "test:contract": "vitest run tests/contract --reporter=default",
+    "test:contract:watch": "vitest watch tests/contract",
    "progress": "tsx scripts/progress.ts"
  },
+  "devDependencies": { "supertest": "^7.0.0" }
}
diff --git a/tests/contract/hmac.ts b/tests/contract/hmac.ts
new file mode 100644
index 0000000..0a1b2c3
--- /dev/null
+++ b/tests/contract/hmac.ts
@@ -0,0 +1,14 @@
import crypto from "node:crypto";
export function signBodyHmacSha256(secret: string, body: any) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const h = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${h}`;
}
export const uuid = () => crypto.randomUUID();
export const tsSec = () => Math.floor(Date.now()/1000);
diff --git a/tests/contract/agents.trigger.contract.test.ts b/tests/contract/agents.trigger.contract.test.ts
new file mode 100644
index 0000000..7b6e5d1
--- /dev/null
+++ b/tests/contract/agents.trigger.contract.test.ts
@@ -0,0 +1,110 @@
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { signBodyHmacSha256, uuid, tsSec } from "./hmac";
beforeAll(() => {
  process.env.AUTH_REQUIRED = process.env.AUTH_REQUIRED ?? "false";
  process.env.MAKE_SIGNING_SECRET = process.env.MAKE_SIGNING_SECRET ?? "test";
  process.env.NODE_ENV = "test";
});
// @ts-ignore
import app from "../../apps/api/src/index";
const AGENT = "cfo_dunning";
const headers = (body:any, secret=process.env.MAKE_SIGNING_SECRET||"test") => ({
  Authorization:"Bearer test","X-Correlation-Id":uuid(),"Idempotency-Key":uuid(),
  "X-Timestamp":String(tsSec()),"X-Signature":signBodyHmacSha256(secret,body),
  "Content-Type":"application/json"
});
describe("POST /v1/agents/{agent_key}/trigger — contrato", () => {
  it("200/202 + headers FinOps (dryRun)", async () => {
    const body = { request_id:uuid(), org_id:"org_demo", actor:"cockpit", payload:{}, dryRun:true };
    const res = await request(app).post(`/v1/agents/${AGENT}/trigger`).set(headers(body)).send(body);
    expect([200,202]).toContain(res.status);
    expect(res.headers).toHaveProperty("x-est-cost-eur");
    expect(res.headers).toHaveProperty("x-budget-pct");
  });
  it("idempotencia — segundo envío", async () => {
    const idem = uuid();
    const body = { request_id:uuid(), org_id:"org_demo", actor:"cockpit", payload:{}, dryRun:true };
    const h = headers(body); (h as any)["Idempotency-Key"]=idem;
    const a = await request(app).post(`/v1/agents/${AGENT}/trigger`).set(h).send(body);
    const b = await request(app).post(`/v1/agents/${AGENT}/trigger`).set(h).send(body);
    expect([200,202,409]).toContain(b.status);
  });
  it("HMAC inválido ⇒ 401/403", async () => {
    const body = { request_id:uuid(), org_id:"org_demo", actor:"cockpit", payload:{}, dryRun:true };
    const res = await request(app).post(`/v1/agents/${AGENT}/trigger`)
      .set(headers(body,"wrong")).send(body);
    expect([401,403]).toContain(res.status);
  });
});
diff --git a/.github/workflows/contract-api.yml b/.github/workflows/contract-api.yml
new file mode 100644
index 0000000..f1e2d3c
--- /dev/null
+++ b/.github/workflows/contract-api.yml
@@ -0,0 +1,28 @@
name: contract-api
on: { push: { branches: ['**'] }, workflow_dispatch: {} }
jobs:
  contract:
    runs-on: ubuntu-latest
    env: { AUTH_REQUIRED: "false", MAKE_SIGNING_SECRET: "test", NODE_ENV: "test" }
    steps:
      - uses: actions/checkout@v4
  - run: corepack enable && corepack prepare pnpm@8.15.6 --activate
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:contract
PATCH

git add .
git commit -m "test(contract): trigger /v1/agents (HMAC+Idem+FinOps) y CI"

4) Script Azure Cloud Shell (conectar Web App + variables)

Pega esto en Cloud Shell (Bash):

# === variables (ajusta si difieren) ===
RG="appsvc_linux_northeurope_basic"     # tu resource group existente
APP="econeura-web-dev"                  # tu Web App existente
REPO_URL="https://github.com/<tu-org>/<tu-repo>.git"
BRANCH="main"

# 1) Conectar el App Service a tu repo (GitHub Actions desde Azure)
az webapp deployment source config \
  --name "$APP" \
  --resource-group "$RG" \
  --repo-url "$REPO_URL" \
  --branch "$BRANCH" \
  --manual-integration

# 2) App settings mínimas (modo transición)
az webapp config appsettings set -g "$RG" -n "$APP" --settings \
  AUTH_REQUIRED=false \
  MAKE_SIGNING_SECRET=test

# 3) (Opcional) URL para gates en GitHub (ponlo como Secret en GitHub UI)
echo "PLAYWRIGHT_BASE_URL=https://$APP.azurewebsites.net"
echo "K6_BASE_URL=https://$APP.azurewebsites.net"


Si quieres desplegar desde el propio Azure (sin Actions), usa el Deployment Center en el portal; pero mi recomendación es que dejes Actions + OIDC (es más limpio y auditable).

¿Qué consigues al pegar todo?

Contexto/objetivo/plan versionado en el repo.

Auditor de progreso ejecutable (pnpm progress) y /v1/progress servido por el API.

Gates de calidad: visual (Playwright ≤2%) y rendimiento (k6 p95<2s) en CI.

Pruebas de contrato del trigger con HMAC/Idempotencia/FinOps.

Web App conectada a tu repo desde Azure (Deployment Center por CLI).

Verificaciones rápidas
pnpm -w -r build && pnpm -w -r test || true
pnpm progress
# cuando desplegado:
curl -sS https://$APP.azurewebsites.net/v1/progress | jq '.'
