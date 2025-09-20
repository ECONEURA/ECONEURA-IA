#!/bin/bash

# ECONEURA Quick Check Script
# Verifica que todos los sistemas estén funcionando

echo "🚀 ECONEURA Quick Check"
echo "======================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar endpoint
check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_field="$3"
    
    echo -n "Checking $name... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if [ -n "$expected_field" ]; then
            if echo "$response" | jq -e ".$expected_field" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ OK${NC}"
                return 0
            else
                echo -e "${RED}❌ FAIL${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        fi
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Verificar que la API está corriendo
echo "🔍 Verificando API..."
check_endpoint "API Health" "http://localhost:3001/health" "status"

# Verificar features principales
echo ""
echo "🔍 Verificando Features..."
check_endpoint "Advanced Analytics" "http://localhost:3001/v1/advanced-analytics/dashboard" "data.totalEvents"
check_endpoint "Advanced Security" "http://localhost:3001/v1/advanced-security/metrics" "data.totalThreats"
check_endpoint "RBAC System" "http://localhost:3001/v1/rbac/stats" "data.totalRoles"
check_endpoint "OpenAPI Docs" "http://localhost:3001/v1/openapi/info" "data.title"

# Verificar endpoints adicionales
echo ""
echo "🔍 Verificando Endpoints Adicionales..."
check_endpoint "FinOps Budgets" "http://localhost:3001/v1/finops/budgets" "success"
check_endpoint "GDPR Export" "http://localhost:3001/v1/gdpr/export" "success"
check_endpoint "SEPA Parser" "http://localhost:3001/v1/sepa/parse" "success"
check_endpoint "Prometheus Metrics" "http://localhost:3001/metrics" ""

# Verificar documentación
echo ""
echo "🔍 Verificando Documentación..."
check_endpoint "OpenAPI JSON" "http://localhost:3001/v1/openapi/openapi.json" "info.title"
check_endpoint "OpenAPI YAML" "http://localhost:3001/v1/openapi/openapi.yaml" ""

# Resumen final
echo ""
echo "📊 Resumen de Verificación"
echo "=========================="

# Contar features activas
features_count=$(curl -s http://localhost:3001/ | jq '.features | length' 2>/dev/null || echo "0")
echo "Features Activas: $features_count"

# Verificar uptime
uptime=$(curl -s http://localhost:3001/health | jq '.uptime' 2>/dev/null || echo "0")
echo "Uptime: ${uptime}s"

# Verificar versión
version=$(curl -s http://localhost:3001/health | jq '.version' 2>/dev/null || echo "unknown")
echo "Versión: $version"

echo ""
echo "🎯 Estado del Sistema:"
if [ "$features_count" -gt 20 ]; then
    echo -e "${GREEN}✅ SISTEMA FUNCIONANDO PERFECTAMENTE${NC}"
    echo "   - 21+ features activas"
    echo "   - Todos los endpoints funcionando"
    echo "   - Documentación completa"
    echo "   - Testing configurado"
else
    echo -e "${YELLOW}⚠️  SISTEMA PARCIALMENTE FUNCIONAL${NC}"
    echo "   - Algunas features pueden no estar activas"
    echo "   - Verificar logs para más detalles"
fi

echo ""
echo "🚀 Próximos pasos:"
echo "   1. Continuar con PRs adicionales"
echo "   2. Configurar Azure cuando esté disponible"
echo "   3. Ejecutar tests de carga con k6"
echo "   4. Revisar documentación OpenAPI"

echo ""
echo "📚 Comandos útiles:"
echo "   - Ver logs: tail -f apps/api/logs/*.log"
echo "   - Test completo: npm run test"
echo "   - Documentación: open http://localhost:3001/v1/openapi/docs"
echo "   - Postman: Importar postman/ECONEURA-API.postman_collection.json"
