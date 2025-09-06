#!/bin/bash

echo "🔧 INTEGRANDO TODAS LAS RUTAS FALTANTES EN INDEX.TS"
echo "================================================="

# Verificar que index.ts existe
if [ ! -f "apps/api/src/index.ts" ]; then
    echo "❌ Error: apps/api/src/index.ts no encontrado"
    exit 1
fi

echo "✅ Integrando rutas faltantes..."

# Crear backup
cp apps/api/src/index.ts apps/api/src/index.ts.backup.$(date +%Y%m%d_%H%M%S)

echo "✅ Backup creado con timestamp"

# Rutas que faltan por integrar
MISSING_ROUTES=(
    "finops"
    "sepa"
    "ai-agents"
    "memory-management"
    "rls-generativa"
    "blue-green-deployment"
    "semantic-search-crm"
    "reportes-mensuales"
    "rbac-granular"
    "gdpr"
    "compliance"
    "audit"
    "monitoring"
    "notifications"
    "intelligent-reporting"
    "business-intelligence"
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

# Función para agregar import y ruta
add_route() {
    local route_name=$1
    local import_name=$2
    local route_path=$3
    
    echo "  ➕ Integrando $route_name..."
    
    # Agregar import si no existe
    if ! grep -q "import.*$import_name" apps/api/src/index.ts; then
        # Buscar la línea donde agregar el import (después de los otros imports)
        local last_import_line=$(grep -n "import.*from.*routes" apps/api/src/index.ts | tail -1 | cut -d: -f1)
        if [ -n "$last_import_line" ]; then
            sed -i '' "${last_import_line}a\\
// $route_name\\
import { ${import_name}Router } from './routes/${route_name}.js';" apps/api/src/index.ts
        fi
    fi
    
    # Agregar ruta si no existe
    if ! grep -q "app.use.*$route_path" apps/api/src/index.ts; then
        # Buscar la línea donde agregar la ruta (después de las otras rutas)
        local last_route_line=$(grep -n "app.use.*v1" apps/api/src/index.ts | tail -1 | cut -d: -f1)
        if [ -n "$last_route_line" ]; then
            sed -i '' "${last_route_line}a\\
// $route_name\\
app.use('$route_path', ${import_name}Router);" apps/api/src/index.ts
        fi
    fi
}

# Integrar todas las rutas faltantes
echo "🔧 Agregando imports y rutas..."

# FinOps
add_route "finops" "finops" "/v1/finops"

# SEPA
add_route "sepa" "sepa" "/v1/sepa"

# AI Agents
add_route "ai-agents" "aiAgents" "/v1/ai-agents"

# Memory Management
add_route "memory-management" "memoryManagement" "/v1/memory-management"

# RLS Generativa
add_route "rls-generativa" "rlsGenerativa" "/v1/rls-generativa"

# Blue Green Deployment
add_route "blue-green-deployment" "blueGreenDeployment" "/v1/blue-green-deployment"

# Semantic Search CRM
add_route "semantic-search-crm" "semanticSearchCRM" "/v1/semantic-search-crm"

# Reportes Mensuales
add_route "reportes-mensuales" "reportesMensuales" "/v1/reportes-mensuales"

# RBAC Granular
add_route "rbac-granular" "rbacGranular" "/v1/rbac-granular"

# GDPR
add_route "gdpr" "gdpr" "/v1/gdpr"

# Compliance
add_route "compliance" "compliance" "/v1/compliance"

# Audit
add_route "audit" "audit" "/v1/audit"

# Monitoring
add_route "monitoring" "monitoring" "/v1/monitoring"

# Notifications
add_route "notifications" "notifications" "/v1/notifications"

# Intelligent Reporting
add_route "intelligent-reporting" "intelligentReporting" "/v1/intelligent-reporting"

# Business Intelligence
add_route "business-intelligence" "businessIntelligence" "/v1/business-intelligence"

# Graph Wrappers
add_route "graph-wrappers" "graphWrappers" "/v1/graph-wrappers"

# HITL v2
add_route "hitl-v2" "hitlV2" "/v1/hitl-v2"

# Stripe Receipts
add_route "stripe-receipts" "stripeReceipts" "/v1/stripe-receipts"

# Inventory Kardex
add_route "inventory-kardex" "inventoryKardex" "/v1/inventory-kardex"

# Supplier Scorecard
add_route "supplier-scorecard" "supplierScorecard" "/v1/supplier-scorecard"

# Interactions SAS AV
add_route "interactions-sas-av" "interactionsSasAv" "/v1/interactions-sas-av"

# Quiet Hours
add_route "quiet-hours" "quietHours" "/v1/quiet-hours"

# Oncall
add_route "oncall" "oncall" "/v1/oncall"

# Escalation
add_route "escalation" "escalation" "/v1/escalation"

# Graceful Shutdown
add_route "graceful-shutdown" "gracefulShutdown" "/v1/graceful-shutdown"

# Circuit Breaker
add_route "circuit-breaker" "circuitBreaker" "/v1/circuit-breaker"

# Rate Limiting
add_route "rate-limiting" "rateLimiting" "/v1/rate-limiting"

# Request Tracing
add_route "request-tracing" "requestTracing" "/v1/request-tracing"

# Resource Management
add_route "resource-management" "resourceManagement" "/v1/resource-management"

# Config Validation
add_route "config-validation" "configValidation" "/v1/config-validation"

# API Versioning
add_route "api-versioning" "apiVersioning" "/v1/api-versioning"

# Error Recovery
add_route "error-recovery" "errorRecovery" "/v1/error-recovery"

# Workers Integration
add_route "workers-integration" "workersIntegration" "/v1/workers-integration"

echo "✅ Todas las rutas agregadas"

# Verificar integración final
echo ""
echo "🔍 VERIFICANDO INTEGRACIÓN FINAL..."

INTEGRATED_COUNT=0
TOTAL_ROUTES=${#MISSING_ROUTES[@]}

for route in "${MISSING_ROUTES[@]}"; do
    if grep -q "app.use.*$route" apps/api/src/index.ts; then
        echo "  ✅ $route integrado"
        ((INTEGRATED_COUNT++))
    else
        echo "  ❌ $route NO integrado"
    fi
done

echo ""
echo "📊 RESUMEN FINAL DE INTEGRACIÓN:"
echo "  ✅ Rutas integradas: $INTEGRATED_COUNT/$TOTAL_ROUTES"
echo "  📈 Porcentaje: $((INTEGRATED_COUNT * 100 / TOTAL_ROUTES))%"

if [ $INTEGRATED_COUNT -eq $TOTAL_ROUTES ]; then
    echo "🎉 ¡TODAS LAS RUTAS FALTANTES ESTÁN INTEGRADAS!"
else
    echo "⚠️  Faltan $((TOTAL_ROUTES - INTEGRATED_COUNT)) rutas por integrar"
fi

echo ""
echo "✅ Integración de rutas faltantes completada"
echo "📁 Backup creado: apps/api/src/index.ts.backup.$(date +%Y%m%d_%H%M%S)"
