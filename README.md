# ECONEURA - Mediterranean Business Suite

Monorepo (ERP/CRM + IA) MVP con Mistral local + Azure OpenAI UE, Graph, webhooks Make, RLS, observabilidad y CI/CD Azure UE.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build
```

## 📁 Project Structure

```
apps/
├── web/          # Next.js 14 App Router + BFF
├── api/          # Express/TS + OpenAPI
└── workers/      # Azure Functions

packages/
├── shared/       # Zod DTOs, env(), OTel, cost-meter
├── db/           # Database schema & migrations
└── playbooks/    # DSL & executors

infra/            # IaC (Bicep/Terraform)
docs/             # Architecture & decisions
```

## 🛠 Tech Stack

- **Language**: TypeScript everywhere
- **Monorepo**: pnpm workspaces
- **Node**: 20.x LTS
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Express + OpenAPI
- **Database**: PostgreSQL with RLS
- **AI**: Mistral local + Azure OpenAI
- **Observability**: OpenTelemetry + Prometheus
- **Deployment**: Azure (West Europe)

## 🔧 Development

### Prerequisites

- Node.js 20.x
- pnpm 8.x
- PostgreSQL
- Docker (for local Mistral)

### Environment Variables

Create `.env` files in each app directory:

```bash
# Database
PGHOST=localhost
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=econeura

# AI
MISTRAL_BASE_URL=http://mistral:8080
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_API_KEY=your_key

# Microsoft Graph
AZURE_TENANT_ID=your_tenant
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_secret
```

### Database Setup

```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed

# Run database tests
pnpm --workspace=packages/db test
```

### AI Router Features

```bash
# Test AI routing
curl -X POST http://localhost:3001/api/v1/ai/route \
  -H "Content-Type: application/json" \
  -H "x-org-id: org1" \
  -d '{"prompt": "Hello, how are you?", "maxTokens": 100}'

# Check provider health
curl http://localhost:3001/api/v1/ai/providers/health

# Get cost usage
curl http://localhost:3001/api/v1/ai/cost/usage \
  -H "x-org-id: org1"
```

### CFO Playbook Features

```bash
# Execute CFO collection playbook
curl -X POST http://localhost:3001/api/v1/flows/collection \
  -H "Content-Type: application/json" \
  -H "x-org-id: org1" \
  -d '{
    "cfoUserId": "cfo@company.com",
    "financeTeamId": "team-123",
    "financeChannelId": "channel-456",
    "financePlanId": "plan-789",
    "financeManagerId": "manager-123"
  }'

# Get playbook status
curl http://localhost:3001/api/v1/flows/playbook-id/status \
  -H "x-org-id: org1"

# Approve playbook
curl -X POST http://localhost:3001/api/v1/flows/playbook-id/approve \
  -H "Content-Type: application/json" \
  -H "x-org-id: org1" \
  -d '{"action": "approve"}'
```

### Make Webhook Features

```bash
# Send Make webhook event
curl -X POST http://localhost:3001/api/webhooks/make \
  -H "Content-Type: application/json" \
  -H "x-forwarded-for: 127.0.0.1" \
  -H "x-make-signature: valid-hmac-signature" \
  -H "x-make-timestamp: $(date +%s)" \
  -d '{
    "event_type": "invoice_overdue",
    "data": {
      "invoice_id": "inv-123",
      "amount": 1500.00,
      "due_date": "2024-01-15",
      "customer_email": "customer@example.com",
      "org_id": "org1"
    },
    "timestamp": "2024-01-15T10:00:00Z"
  }'

# Check webhook health
curl http://localhost:3001/api/webhooks/make/health

# Get webhook statistics
curl http://localhost:3001/api/webhooks/make/stats \
  -H "x-org-id: org1"
```

### BFF Proxy Features

```bash
# Frontend requests are automatically proxied through BFF
# GET /api/econeura/v1/crm/companies
# POST /api/econeura/v1/ai/route
# GET /api/econeura/v1/flows/collection

# BFF automatically adds:
# - x-request-id (correlation ID)
# - traceparent (OpenTelemetry)
# - x-org-id (organization context)
# - authorization (Bearer token)
# - CORS headers
```

### Observability Features

```bash
# OpenTelemetry tracing and metrics
# GET /metrics - Prometheus + OpenTelemetry metrics
# GET /metrics/health - Metrics health check
# GET /metrics/summary - Metrics summary
# GET /metrics/org/:orgId - Organization-specific metrics

# Custom metrics available:
# - ai_requests_total{provider,model,status,org_id}
# - ai_cost_eur{provider,org_id}
# - ai_latency_ms{provider,model,org_id}
# - http_requests_total{method,route,status_code,org_id}
# - webhook_received_total{source,event_type}
# - flow_executions_total{flow_type,status,org_id}
# - db_query_latency_ms{operation,table,org_id}
# - idempotency_replays_total{key,org_id}
# - rate_limit_exceeded_total{route,org_id}
# - org_monthly_cost_eur{org_id}
```

### CI/CD Features

```bash
# Strong CI with quality gates
# Quality Gates: lint, typecheck, conventional commits
# Test Coverage: ≥80% threshold, Codecov integration
# OpenAPI Validation: schema validation, breaking changes check
# Security Scanning: CodeQL, Trivy, Snyk, npm audit
# Secret Scanning: TruffleHog, detect-secrets
# Integration Tests: PostgreSQL, full API testing
# Performance Tests: load testing, memory usage, latency thresholds
# Build & Package: deployment artifacts

# CI Jobs:
# - quality-gates: Lint, typecheck, conventional commits
# - test-coverage: Unit tests with ≥80% coverage
# - openapi-validation: OpenAPI schema validation
# - security-scanning: CodeQL, Trivy, Snyk
# - secret-scanning: TruffleHog, detect-secrets
# - build-package: Build and package applications
# - integration-tests: Full integration testing
# - performance-tests: Performance and load testing
# - status-check: Final status verification

### Azure Infrastructure Features

```bash
# Infrastructure as Code (Bicep)
# Azure Container Registry (ACR): Private container registry
# Azure Container Apps: Serverless containers for API/Web
# Azure PostgreSQL Flexible Server: Managed database with RLS
# Azure Key Vault: Secure secret management
# Azure Application Insights: Monitoring and telemetry
# Azure Front Door: Global load balancer with WAF
# Azure Functions: Serverless compute for background jobs
# Virtual Network: Private networking for security

# Deployment Pipeline:
# 1. Infrastructure Deployment (Bicep)
# 2. Build and Push Images (Docker)
# 3. Application Deployment (Container Apps)
# 4. Database Migration (PostgreSQL)
# 5. Smoke Tests (Health checks)
# 6. Performance Tests (Production only)
# 7. Notifications (Teams webhook)

# Environment Support:
# - dev: Minimal resources, cost-optimized
# - staging: Medium resources, testing
# - prod: High availability, performance-optimized
```

### API Development

```bash
# Start API server
pnpm --workspace=apps/api dev

# Run API tests
pnpm --workspace=apps/api test

# Generate OpenAPI spec
pnpm api:openapi
```

### API Endpoints

The API provides CRUD operations for all entities with Problem+JSON error handling:

- **Companies**: `/api/v1/crm/companies`
- **Contacts**: `/api/v1/crm/contacts`
- **Deals**: `/api/v1/crm/deals`
- **Invoices**: `/api/v1/finance/invoices`
- **AI Router**: `/api/v1/ai/route`
- **AI Health**: `/api/v1/ai/providers/health`
- **AI Cost Usage**: `/api/v1/ai/cost/usage`
- **CFO Collection**: `/api/v1/flows/collection`
- **Playbook Status**: `/api/v1/flows/:playbookId/status`
- **Playbook Approval**: `/api/v1/flows/:playbookId/approve`
- **Make Webhooks**: `/api/webhooks/make`
- **Webhook Health**: `/api/webhooks/make/health`
- **Webhook Stats**: `/api/webhooks/make/stats`

All endpoints support:
- Pagination (`?page=1&limit=20`)
- Sorting (`?sortBy=name&sortOrder=desc`)
- Filtering (`?status=active`)
- RLS isolation between organizations
- AI cost cap enforcement (50€/org/month)

## 📊 Status

- ✅ PR-01: Bootstrap monorepo
- ✅ PR-02: Database + RLS + Seeds
- ✅ PR-03: API CRUD + Problem+JSON
- ✅ PR-04: AI Router + Cost Cap
- ✅ PR-05: Microsoft Graph + Playbook CFO
- ✅ PR-06: Webhooks Make
- ✅ PR-07: Web BFF + Panel
- ✅ PR-08: Observability & Metrics
- ✅ PR-09: Strong CI
- ✅ PR-10: Azure Infrastructure + CD

## 🎯 MVP Features

- **CRM**: Companies, Contacts, Deals, Interactions
- **ERP**: Invoices, Inventory, Products
- **AI Router**: Mistral → Azure OpenAI with cost cap
- **CFO Playbook**: Automated debt collection
- **Microsoft Graph**: Outlook + Teams integration
- **Webhooks**: Make integration with HMAC
- **Multi-tenant**: RLS on all tables
- **Observability**: Full tracing + metrics
- **GDPR**: EU data residency + audit trails
