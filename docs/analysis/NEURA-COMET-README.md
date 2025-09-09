# NEURA↔Comet + Agentes↔Make Implementation

## 🎯 Objetivo Completado

Se ha implementado exitosamente el sistema NEURA↔Comet con memoria persistente, orquestación de agentes vía Make.com, demo de voz, y gates de CI bloqueantes.

## 📁 Estructura Creada

### Nuevos Servicios

- **`apps/api-neura-comet`** (puerto 3101): BFF para NEURA↔Comet + memoria
- **`apps/api-agents-make`** (puerto 3102): API para trigger↔Make + webhook eventos
- **`apps/voice`** (puerto 3103): Demo de Web Speech API

### Contratos y Migraciones

- **`contracts/cockpit.openapi.json`**: Especificación OpenAPI para endpoints de chat y agentes
- **`packages/db/migrations/20250101000000_mem.sql`**: Migración con pgvector, tablas de memoria y agent runs

### Tests y CI

- **`tests/e2e/`**: Tests E2E completos para NEURA, agentes, voz, seguridad y telemetría
- **`.github/workflows/ci-gates.yml`**: Gates de CI bloqueantes
- **`scripts/test-*.sh`**: Scripts para coverage, visual diff, axe, links rotos, secrets

## 🚀 Comandos de Uso

### Instalación y Build
```bash
pnpm -w i && pnpm -w build
```

### Desarrollo Local
```bash
# Opción 1: Script automático
./scripts/start-dev.sh

# Opción 2: Manual
pnpm --filter api-neura-comet dev &
pnpm --filter api-agents-make dev &
pnpm --filter econeura-cockpit dev &
```

### Migraciones
```bash
# Con script
./scripts/migrate-db.sh

# Manual
psql $MEM_PG_URL -f packages/db/migrations/20250101000000_mem.sql
```

### Tests
```bash
# E2E
pnpm test:e2e

# Coverage (≥80%)
./scripts/test-coverage.sh

# Visual diff (≤2%)
./scripts/test-visual.sh

# Accessibility (≥95%)
./scripts/test-axe.sh

# Broken links (0)
./scripts/test-links.sh

# Secret scanning
./scripts/test-secrets.sh
```

## 🔧 Configuración Requerida

### Variables de Entorno (env.example)

```bash
# CORS y Seguridad
ALLOWED_ORIGINS=https://www.econeura.com,https://<FQDN>

# APIs Externas
PPLX_API_KEY=
MAKE_WEBHOOK_URL=https://hook.make.com/XXXX
MAKE_HMAC_SECRET=change_me

# Base de Datos y Cache
MEM_PG_URL=postgres://...
REDIS_URL=redis://...

# Features
FEATURE_VOICE=demo
AGENTS_TRIGGER_URL=http://localhost:3102/agents/trigger
```

## 🛡️ Seguridad Implementada

- **CORS**: Allowlist exacta configurada
- **Helmet/CSP**: Headers de seguridad activos
- **HMAC**: Validación de signatures en webhooks
- **Idempotency**: Keys obligatorias para prevenir duplicados
- **Secret Scanning**: Gates de CI para detectar secrets

## 📊 Telemetría y FinOps

### Headers Expuestos
- `X-Est-Cost-EUR`: Coste estimado
- `X-Budget-Pct`: Porcentaje de presupuesto usado
- `X-Latency-ms`: Latencia de respuesta
- `X-Route`: Ruta de API utilizada
- `X-Correlation-Id`: ID de correlación

### Budget Guard
- Bloqueo automático si `X-Budget-Pct ≥ 90`
- Banner de advertencia en UI
- Costes visibles solo en departamento IA

## 🎯 Criterios de Aceptación (DoD) ✅

- [x] Los 10 NEURA conversan con Comet y mantienen contexto
- [x] Los 50 agentes se ejecutan por botón o voz (vía tool-call)
- [x] Timeline y KPIs se actualizan con eventos Make
- [x] EU-first, CORS/CSP, HMAC+Idempotency implementados
- [x] Sin secretos reales en repo (solo .env.example)
- [x] Gates de CI configurados y bloqueantes

## 🧪 Gates de CI Bloqueantes

- **Coverage**: ≥80% ✅
- **Visual Diff**: ≤2% ✅
- **Axe Accessibility**: ≥95% ✅
- **Broken Links**: 0 ✅
- **Security Scan**: Sin secrets ni vulnerabilidades ✅

## 🌐 Endpoints Principales

### NEURA↔Comet (3101)
- `GET /health` - Health check
- `POST /neura/chat` - Chat con memoria y tool calls

### Agentes↔Make (3102)
- `GET /health` - Health check
- `POST /agents/trigger` - Trigger de agente
- `POST /agents/events` - Webhook de eventos Make

### Cockpit (3000)
- UI integrada con chat NEURA
- Botón de voz (si `FEATURE_VOICE=demo`)
- Cards de agentes con Execute/Pause
- Timeline y KPIs en tiempo real

## 🎤 Demo de Voz

Si `FEATURE_VOICE=demo`:
- Botón de micrófono en tarjetas NEURA (departamento IA)
- Web Speech API → texto → POST /neura/chat
- Manejo de errores graceful

## 🔄 Flujo de Agentes

1. **Trigger**: UI → `/agents/trigger` → Make webhook
2. **Callback**: Make → `/agents/events` (HMAC validado)
3. **Update**: Timeline y KPIs actualizados en tiempo real
4. **HITL**: Confirmación requerida para CFO/CISO

---

**Frase de Control**: NO OPCIONES, SOLO EJECUTA ✅ COMPLETADO

