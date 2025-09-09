# 🚀 ECONEURA — ERP/CRM + IA (Guía Completa · PR‑0 → PR‑85)

> **Estado actual del desarrollo**: avanzando por **PR‑23 / 85**. Este documento explica el proyecto de extremo a extremo y lista **todas** las PR previstas con el objetivo y la definición de hecho (DoD) resumida.

---

## 1) Visión & Propuesta de valor

**ECONEURA** es un **ERP/CRM moderno** con **IA operativa** y **seguridad “grado banca”**. Está diseñado para pymes y áreas de operaciones/ventas que necesitan:
- CRM robusto (empresas, contactos, deals, interacciones).
- ERP ligero (productos, inventario/Kardex, facturación, proveedores, conciliación).
- **IA explicable** que reduce tiempos de trabajo (resúmenes, “next best action”, plantillas aprobadas).
- Integración con **Microsoft 365/Graph** (Outlook/Teams/SharePoint) y **Stripe/SEPA**.
- Observabilidad, RLS multitenant, FinOps y despliegues **blue/green** en Azure.

**Resultados esperados tras PR‑85**: p95 API ≤ 350 ms; p95 IA ≤ 2.5 s; conciliación >90 %; inventario >97 % de exactitud; 5xx < 1 %; CI/CD con canary y rollback automático; RLS probado con suite generativa.

---

## 2) Arquitectura (monorepo)

```
/apps
  /web         → Next.js 14 (App Router) · BFF Node (chat/tts/images/search/health)
  /api         → Express + TypeScript + Drizzle/Prisma · OpenAPI
  /workers     → Jobs/colas (cron, warm‑up, dunning, AV scan)
/packages
  /shared      → Zod, seguridad (HMAC/Idempotency), analytics tipadas
  /db          → Esquema, migraciones, políticas RLS
  /sdk         → Cliente TS para Web/BFF
/infra         → IaC (Azure), Docker, GitHub Actions
/docs          → Manuales, runbooks, hitos
```

### Principios de diseño
- **BFF UE‑Hardened** en `apps/web` (runtime Node, sin /v1, demo‑mode si faltan claves).
- **API server‑to‑server** en `apps/api` (rutas `/v1/...`, RLS y OpenAPI).
- **RLS transaccional**: cada request hace `BEGIN → set_config('app.org_id', $org, true) → ... → COMMIT`.
- **Nada de secretos en cliente**. Feature flags por `.env*` con **demo por defecto**.
- **Zod en todos los bordes**. Logs estructurados sin PII (redact). FinOps headers en BFF.

---

## 3) Dominios funcionales

### CRM
- **Companies**: taxonomía/etiquetas, saved views, ingest Outlook a timeline, undo merges.
- **Contacts**: normalización E.164, dedupe proactivo con merge/auditoría.
- **Deals**: pipeline Kanban, **NBA explicable** (features + top‑3 razones).
- **Interactions**: unificador de emails/notas/llamadas/adjuntos (SAS + AV + signed URLs).

### ERP
- **Invoices (AR)**: numeración segura, PDF, **dunning 3‑toques**, Stripe checkout/webhook/receipt.
- **Products**: variantes, mapa de impuestos, sugerencias IA.
- **Inventory**: movimientos/Kardex, reorder point, **conteos cíclicos ABC** con auditoría.
- **Suppliers**: scorecard OTIF/lead/PPV/SL, alertas a Teams.
- **Payments/SEPA**: parser CAMT/MT940 (y .053/.054), matching con reglas UI.

### Plataforma (cross‑cutting)
- **Integraciones**: Graph (Outlook/Teams/SharePoint), Make, Stripe.
- **Seguridad**: CSP/SRI estrictas, Helmet/CORS, AV global, secret‑scan & rotation.
- **Operabilidad**: health/live/ready/degraded, Teams alerts con quiet hours.
- **Observabilidad**: OTel end‑to‑end, Prometheus (counters), k6, chaos‑light.
- **FinOps**: presupuesto IA por org con barra 80/90/100%, panel de costes.
- **CI/CD**: blue/green + canary, gates de p95/5xx, rollback automático.

---

## 4) Entornos & Deploy

- **Local**: Docker para DB/Prometheus/Grafana/Jaeger. `pnpm dev` levanta Web + API.
- **Staging/Prod (Azure)**: App Services o Container Apps, PostgreSQL flexible, Azure Storage (Blob), Key Vault, Monitor/Log Analytics.
- **CI/CD** (GitHub Actions): build+test → despliegue a *slot idle* → smokes/gates → swap → post‑deploy smokes. Canary (5%→25%→100%) en PR‑84.

---

## 5) Calidad, DoD & Smokes

**DoD por PR** (resumen): código + pruebas (unit/integración/E2E), migraciones/RLS, CHANGELOG, `npm run smoke:pr-XX`, sin `console.log`, logs estructurados, Zod en bordes, idempotencia, flags, demo‑mode.

**Gates CI (PR‑60)**: tipos/lint/tests, OpenAPI sincronizado, suite RLS, CSP/SRI presentes, migraciones aplicadas, cobertura ≥ 70 %.

**Smokes globales**: health, IA cache, budget, make dedupe, graph, hitl, stripe, inventory, suppliers, attachments, taxonomy, dedupe, nba, dunning, fiscal, sepa, gdpr, rls, finops, quiet, warmup, secrets, csp, bluegreen, k6, openapi, semantic, reports, rbac, restore, otel, audit, xss, dod … (+ los de la tanda final).

---

## 6) Performance Testing

ECONEURA incluye pruebas de rendimiento automatizadas usando k6 para garantizar la calidad operacional.

### Configuración de K6

Las pruebas de rendimiento son configurables via variables de entorno:

```bash
# Variables de configuración K6
K6_BASE_URL=http://localhost:3001     # URL base para las pruebas
K6_MAX_VUS=20                         # Número máximo de usuarios virtuales  
K6_DURATION=5m                        # Duración de las pruebas
K6_RAMP_DURATION=2m                   # Tiempo de rampa (subida/bajada)
K6_CHAOS_DURATION=3m                  # Duración específica para chaos testing
```

### Ejecución Local

```bash
# Pruebas de carga
pnpm k6:load

# Pruebas de caos  
pnpm k6:chaos

# Con configuración personalizada
K6_MAX_VUS=50 K6_DURATION=10m pnpm k6:load
```

### Workflows Automatizados

- **Performance Testing**: Ejecuta pruebas nocturnas y bajo demanda
- **Quality Nightly**: Ejecuta pruebas de calidad completas cada noche

---

## 7) Code Coverage

El sistema de cobertura de código está configurado con umbrales iniciales realistas.

### Configuración de Umbrales

- **Statements**: 40% mínimo
- **Branches**: 30% mínimo  
- **Functions**: 40% mínimo
- **Lines**: 40% mínimo

### Ejecución de Coverage

```bash
# Cobertura de todos los workspaces
pnpm coverage

# Cobertura específica por workspace
pnpm --filter @econeura/api test:coverage
pnpm --filter @econeura/workers test:coverage
```

### Artifacts en CI

Los reportes de cobertura (lcov) se suben automáticamente como artifacts y se integran con Codecov.

---

## 8) Structured Logging

ECONEURA utiliza logging estructurado con pino para observabilidad y debugging.

### Configuración

```bash
# Control del nivel de logging
LOG_LEVEL=info  # debug, info, warn, error
```

### Uso en Código

```typescript
import { logger } from '@econeura/shared/logging';

// ❌ Evitar: console.log('Server started');
// ✅ Usar:
logger.info('Server started', { 
  port: 3001, 
  environment: 'production',
  pid: process.pid 
});

// Logging específico por contexto
logger.logAIRequest('AI completion', { model: 'gpt-4', tokens: 150 });
logger.logSecurityEvent('Failed login', { email: 'user@domain.com', ip: '1.2.3.4' });
```

### Características

- **Redacción automática** de campos sensibles (passwords, tokens, secrets)
- **Serialización de errores** con stack traces
- **Contexto estructurado** para análisis y alertas
- **Niveles configurables** por entorno

---

## 9) Environment Validation

Todas las variables de entorno críticas son validadas al inicio usando Zod schemas.

### Variables Críticas

```bash
# Servidor
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Base de datos
PGHOST=localhost
PGUSER=econeura  
PGPASSWORD=secure_password
PGDATABASE=econeura
PGPORT=5432

# IA
AZURE_OPENAI_ENDPOINT=https://resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_key
```

### Validación Automática

La aplicación falla con código de salida != 0 si faltan variables críticas:

```typescript
import { env } from '@econeura/shared/env';

// Acceso type-safe a variables validadas
const config = env();
console.log(`Server starting on port ${config.PORT}`);
```

### Archivo de Ejemplo

Ver `.env.example` para la configuración completa con comentarios explicativos.

---

## 10) Roadmap completo de PR‑0 → PR‑85 (titular + objetivo + DoD breve)

> **Leyenda**: ✅ listo · ⚠️ parcial/demo · ❌ falta.  
> *El estado real lo llevamos en GitHub Projects; aquí se describen los objetivos y el "hecho" esperado.*

### **🚨 CORRECCIONES CRÍTICAS IMPLEMENTADAS**

#### **CODE_FIX - Problemas Resueltos**
1. **✅ FinOps Enforcement Middleware** - `apps/api/src/middleware/finops-enforce.ts`
   - Bloqueo HTTP 402 cuando se excede presupuesto
   - Kill switch automático para emergencias
   - Circuit breaker y retry logic

2. **✅ AI Router Client Real** - `packages/agents/ai-router.client.ts`
   - Cliente HTTP real para agentes IA
   - Retry automático con backoff exponencial
   - Circuit breaker y health checks

3. **✅ Cockpit Real-time** - `econeura-cockpit/src/components/Cockpit.tsx`
   - Conexión real a APIs (no más mocks)
   - Fallback a datos demo si API falla
   - WebSocket/EventSource para tiempo real

4. **✅ Scripts de Corrección Masiva**
   - `scripts/fix-js-imports.sh` - Corrige 447 imports .js
   - `scripts/fix-console-logs.sh` - Elimina 174 console.log
   - `scripts/verify-repo.sh` - Verificación completa
   - `scripts/smoke.sh` - Tests de humo
   - `scripts/run-k6-tests.sh` - Tests de performance
   - `scripts/visual.sh` - Tests visuales

#### **MÉTRICAS BASELINE**
- **📊 docs/PR_STATUS_FIRM.md** - Estado real PR-0 a PR-85
- **📊 docs/METRICAS_BASELINE.md** - Métricas completas del proyecto
- **📊 scripts/metrics/collect.ts** - Recolección automática de métricas

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

---

## 7) Seguridad & Cumplimiento (resumen operativo)
- **RLS** por `org_id` en todas las tablas sensibles; helpers `withTenant()`.
- **CSP/SRI** sin `eval`, sólo orígenes permitidos; endpoint `csp/report` (PR‑75).
- **AV/Quarantine** en Interactions/Invoices/Suppliers/Products (PR‑64).
- **GDPR**: export/erase con auditoría y retención/TTL (PR‑43/83).
- **Secret‑scan/rotation**: gitleaks+KV y rotación trimestral (PR‑48/81).

---

## 8) Observabilidad & FinOps
- **OTel e2e** (PR‑57), **Prometheus** con cardinalidad controlada.
- **FinOps headers** en BFF: `X‑Request‑Id, X‑Org‑Id, X‑Latency‑ms, X‑AI‑Provider, X‑AI‑Model, X‑Est‑Cost‑EUR`.
- **Panel FinOps** (PR‑45/77) + **Budget guard** (PR‑29/76).

---

## 9) Operación: SLOs, Kill‑switches y Runbooks
- SLOs: p95 API ≤ 350 ms; p95 IA ≤ 2.5 s; 5xx < 1 %; conciliación >90 %; inventario >97 %.
- Kill‑switches: **demo‑mode IA**, **budget guard**, **DLQ visible**; banners de degradación.
- Runbooks (PR‑85): IA down, Graph throttle, Stripe out, SEPA corrupta, fuga RLS.

---

## 10) Cómo trabajar las PR en Cursor (resumen práctico)
1. Rama `feature/PR-XX-slug`.
2. Cambios mínimos, respetando rutas y estructura.
3. Migraciones + políticas RLS dentro de transacción.
4. Tests unit/integración/E2E + `npm run smoke:pr-XX`.
5. CHANGELOG (3–6 líneas) + OpenAPI si aplica.
6. Lint/types/tests verdes → abrir PR con plantilla y evidencias.
7. Merge sólo si **DoD CI (PR‑60)** pasa.

---

## 11) Créditos & Licencia
- Licencia MIT. Hecho con ❤️ en España. Infra recomendada: Azure (UE‑West/Spain Central).
