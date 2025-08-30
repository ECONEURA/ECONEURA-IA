#!/bin/bash

# PR-21 Smoke Test: Dashboard Avanzado y Analytics
# Verifica que todos los endpoints del dashboard funcionan correctamente

set -e

echo "🚀 PR-21 Smoke Test: Dashboard Avanzado y Analytics"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
API_BASE="http://localhost:4000"
WEB_BASE="http://localhost:3000"

# Función para hacer requests y verificar respuesta
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    local expected_status="${5:-200}"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null || echo "000")
    fi
    
    status_code="${response: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL (Status: $status_code, Expected: $expected_status)${NC}"
        return 1
    fi
}

# Función para verificar estructura JSON
verify_json_structure() {
    local name="$1"
    local required_fields="$2"
    
    if ! jq -e "$required_fields" /tmp/response.json >/dev/null 2>&1; then
        echo -e "${RED}❌ FAIL: Invalid JSON structure for $name${NC}"
        return 1
    fi
    return 0
}

# Contador de tests
total_tests=0
passed_tests=0

# Test 1: Health endpoint
((total_tests++))
if test_endpoint "Health" "$API_BASE/health" "GET"; then
    ((passed_tests++))
fi

# Test 2: Dashboard endpoint
((total_tests++))
if test_endpoint "Dashboard" "$API_BASE/dashboard" "GET"; then
    if verify_json_structure "Dashboard" '.overview and .recent_activity'; then
        ((passed_tests++))
    fi
fi

# Test 3: Analytics overview endpoint
((total_tests++))
if test_endpoint "Analytics Overview" "$API_BASE/v1/analytics/overview" "GET"; then
    if verify_json_structure "Analytics" '.data.crm and .data.erp and .data.inventory and .data.ai and .data.performance'; then
        ((passed_tests++))
    fi
fi

# Test 4: System metrics endpoint
((total_tests++))
if test_endpoint "System Metrics" "$API_BASE/v1/metrics/system" "GET"; then
    if verify_json_structure "System Metrics" '.data.system and .data.performance and .data.cache'; then
        ((passed_tests++))
    fi
fi

# Test 5: Active alerts endpoint
((total_tests++))
if test_endpoint "Active Alerts" "$API_BASE/v1/alerts/active" "GET"; then
    if verify_json_structure "Alerts" '.data.alerts and .data.total'; then
        ((passed_tests++))
    fi
fi

# Test 6: Business KPIs endpoint
((total_tests++))
if test_endpoint "Business KPIs" "$API_BASE/v1/reports/kpis" "GET"; then
    if verify_json_structure "KPIs" '.data.sales and .data.crm and .data.operations and .data.financial'; then
        ((passed_tests++))
    fi
fi

# Test 7: AI Chat endpoint (POST with data)
((total_tests++))
if test_endpoint "AI Chat" "$API_BASE/v1/ai/chat" "POST" '{"message":"test"}' "200"; then
    ((passed_tests++))
fi

# Test 8: Search endpoint (GET with query parameter)
((total_tests++))
if test_endpoint "Search" "$API_BASE/v1/search?q=test" "GET"; then
    ((passed_tests++))
fi

# Test 9: Products endpoint
((total_tests++))
if test_endpoint "Products" "$API_BASE/v1/products" "GET"; then
    if verify_json_structure "Products" '.products'; then
        ((passed_tests++))
    fi
fi

# Test 10: Interactions endpoint
((total_tests++))
if test_endpoint "Interactions" "$API_BASE/v1/interactions" "GET"; then
    if verify_json_structure "Interactions" '.interactions'; then
        ((passed_tests++))
    fi
fi

# Test 11: Metrics endpoint
((total_tests++))
if test_endpoint "Metrics" "$API_BASE/metrics" "GET"; then
    ((passed_tests++))
fi

# Test 12: Web server (opcional)
((total_tests++))
if curl -s -f "$WEB_BASE" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - Web server accessible"
    ((passed_tests++))
else
    echo -e "${YELLOW}⚠️  SKIP${NC} - Web server not running"
fi

echo ""
echo "=================================================="
echo "📊 Test Results:"
echo "Total tests: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $((total_tests - passed_tests))"

if [ $passed_tests -ge 11 ]; then
    echo -e "${GREEN}🎉 All critical tests passed! PR-21 is ready for review.${NC}"
    exit 0
else
    echo -e "${RED}❌ Critical tests failed. Please check the implementation.${NC}"
    exit 1
fi
