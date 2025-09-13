#!/bin/bash

echo "🔧 INTEGRANDO TODO EL CÓDIGO ROBUSTO EN INDEX.TS"
echo "=============================================="

# Verificar que index.ts existe
if [ ! -f "apps/api/src/index.ts" ]; then
    echo "❌ Error: apps/api/src/index.ts no encontrado"
    exit 1
fi

echo "✅ Integrando servicios robustos en index.ts..."

# Crear backup
cp apps/api/src/index.ts apps/api/src/index.ts.backup

echo "✅ Backup creado: apps/api/src/index.ts.backup"

# Agregar imports de servicios robustos si no existen
if ! grep -q "import { structuredLogger }" apps/api/src/index.ts; then
    echo "  ➕ Agregando structuredLogger import..."
    sed -i '' '/import { structuredLogger }/d' apps/api/src/index.ts
    sed -i '' '1i\
import { structuredLogger } from "./lib/structured-logger.js";
' apps/api/src/index.ts
fi

if ! grep -q "import { ErrorHandler }" apps/api/src/index.ts; then
    echo "  ➕ Agregando ErrorHandler import..."
    sed -i '' '/import { ErrorHandler }/d' apps/api/src/index.ts
    sed -i '' '1i\
import { ErrorHandler } from "./lib/error-handler.js";
' apps/api/src/index.ts
fi

if ! grep -q "import { healthMonitor }" apps/api/src/index.ts; then
    echo "  ➕ Agregando healthMonitor import..."
    sed -i '' '/import { healthMonitor }/d' apps/api/src/index.ts
    sed -i '' '1i\
import { healthMonitor } from "./lib/health-monitor.js";
' apps/api/src/index.ts
fi

echo "✅ Imports agregados"

# Verificar integración de rutas
echo "🔍 Verificando integración de rutas..."

ROUTES_TO_CHECK=(
    "advanced-features"
    "basic-ai"
    "azure-integration"
    "health-checks"
    "analytics"
    "stabilization"
    "advanced-observability"
    "finops"
    "sepa"
    "ai-agents"
    "performance"
    "memory-management"
    "connection-pool"
    "companies-taxonomy"
    "contacts-dedupe"
    "deals-nba"
    "dunning-3-toques"
    "fiscalidad-regional-ue"
    "rls-generativa"
    "blue-green-deployment"
    "semantic-search-crm"
    "reportes-mensuales"
    "rbac-granular"
    "advanced-security"
    "gdpr"
    "compliance"
    "audit"
    "monitoring"
    "notifications"
    "intelligent-reporting"
    "business-intelligence"
    "advanced-analytics"
    "warmup"
    "cache-warmup"
    "prompt-library"
    "make-quotas"
    "graph-wrappers"
    "hitl-v2"
    "stripe-receipts"
    "inventory-kardex"
    "supplier-scorecard"
    "interactions-sas-av"
    "quiet-hours"
    "oncall"
    "escalation"
    "graceful-shutdown"
    "circuit-breaker"
    "rate-limiting"
    "request-tracing"
    "resource-management"
    "config-validation"
    "api-versioning"
    "error-recovery"
    "workers-integration"
)

INTEGRATED_COUNT=0
TOTAL_ROUTES=${#ROUTES_TO_CHECK[@]}

for route in "${ROUTES_TO_CHECK[@]}"; do
    if grep -q "app.use.*$route" apps/api/src/index.ts; then
        echo "  ✅ $route integrado"
        ((INTEGRATED_COUNT++))
    else
        echo "  ❌ $route NO integrado"
    fi
done

echo ""
echo "📊 RESUMEN DE INTEGRACIÓN:"
echo "  ✅ Rutas integradas: $INTEGRATED_COUNT/$TOTAL_ROUTES"
echo "  📈 Porcentaje: $((INTEGRATED_COUNT * 100 / TOTAL_ROUTES))%"

if [ $INTEGRATED_COUNT -eq $TOTAL_ROUTES ]; then
    echo "🎉 ¡TODAS LAS RUTAS ESTÁN INTEGRADAS!"
else
    echo "⚠️  Faltan $((TOTAL_ROUTES - INTEGRATED_COUNT)) rutas por integrar"
fi

echo ""
echo "✅ Integración completada"
