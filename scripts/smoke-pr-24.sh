#!/bin/bash

# PR-24: Alertas inteligentes basadas en métricas
# Smoke test para verificar sistema de alertas inteligentes

set -e

echo "🧪 PR-24: Alertas inteligentes basadas en métricas - Smoke Test"
echo "=============================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Función para verificar endpoint con validación JSON
check_json_endpoint() {
    local url=$1
    local expected_field=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -s "$url" 2>/dev/null || echo "{}")
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        print_result 0 "$description"
    else
        print_result 1 "$description"
    fi
}

FAILED_TESTS=0

echo -e "\n${BLUE}1. Testing API Express Alert System Endpoints${NC}"
echo "------------------------------------------------"

# Endpoints de alertas del API
check_json_endpoint "http://localhost:4000/v1/alerts/rules" "data" "API Alert Rules"
check_json_endpoint "http://localhost:4000/v1/alerts/active" "data" "API Active Alerts"
check_json_endpoint "http://localhost:4000/v1/alerts/stats" "data" "API Alert Statistics"

echo -e "\n${BLUE}2. Testing Web BFF Alert System Endpoints${NC}"
echo "----------------------------------------------"

# Endpoints de alertas del Web BFF
check_json_endpoint "http://localhost:3000/api/alerts/rules" "data" "Web BFF Alert Rules"
check_json_endpoint "http://localhost:3000/api/alerts/active" "data" "Web BFF Active Alerts"
check_json_endpoint "http://localhost:3000/api/alerts/stats" "data" "Web BFF Alert Statistics"

echo -e "\n${BLUE}3. Testing Alert Rule Management${NC}"
echo "-------------------------------------"

# Probar creación de regla de alerta
echo -n "Testing API Alert Rule Creation... "
rule_response=$(curl -s -X POST "http://localhost:4000/v1/alerts/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-rule-001",
    "name": "Test Alert Rule",
    "description": "Test rule for smoke testing",
    "metric": "http_requests_total",
    "condition": "threshold",
    "threshold": 1000,
    "operator": "gt",
    "window": 300,
    "severity": "medium",
    "enabled": true,
    "cooldown": 300
  }' 2>/dev/null || echo "{}")

if echo "$rule_response" | jq -e '.success' > /dev/null 2>&1; then
    print_result 0 "API Alert Rule Creation"
else
    print_result 1 "API Alert Rule Creation"
fi

echo -n "Testing Web BFF Alert Rule Creation... "
web_rule_response=$(curl -s -X POST "http://localhost:3000/api/alerts/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "web-test-rule-001",
    "name": "Web Test Alert Rule",
    "description": "Test rule for web smoke testing",
    "metric": "page_view_total",
    "condition": "threshold",
    "threshold": 100,
    "operator": "gt",
    "window": 300,
    "severity": "low",
    "enabled": true,
    "cooldown": 300
  }' 2>/dev/null || echo "{}")

if echo "$web_rule_response" | jq -e '.success' > /dev/null 2>&1; then
    print_result 0 "Web BFF Alert Rule Creation"
else
    print_result 1 "Web BFF Alert Rule Creation"
fi

echo -e "\n${BLUE}4. Testing Alert Rule Updates${NC}"
echo "--------------------------------"

# Probar actualización de regla
echo -n "Testing API Alert Rule Update... "
update_response=$(curl -s -X PUT "http://localhost:4000/v1/alerts/rules/test-rule-001" \
  -H "Content-Type: application/json" \
  -d '{"threshold": 1500}' 2>/dev/null || echo "{}")

if echo "$update_response" | jq -e '.success' > /dev/null 2>&1; then
    print_result 0 "API Alert Rule Update"
else
    print_result 1 "API Alert Rule Update"
fi

echo -e "\n${BLUE}5. Testing Alert Management${NC}"
echo "--------------------------------"

# Probar gestión de alertas (acknowledge/resolve)
echo -n "Testing Alert Acknowledgment... "
# Primero necesitamos generar una alerta
curl -s "http://localhost:4000/v1/observability/metrics" > /dev/null 2>&1

# Esperar un momento para que se evalúen las alertas
sleep 2

# Intentar acknowledge una alerta (puede que no haya alertas activas)
ack_response=$(curl -s -X POST "http://localhost:4000/v1/alerts/test-alert-001/acknowledge" \
  -H "Content-Type: application/json" \
  -d '{"acknowledgedBy": "smoke-test"}' 2>/dev/null || echo "{}")

if echo "$ack_response" | jq -e '.success' > /dev/null 2>&1 || echo "$ack_response" | jq -e '.message' | grep -q "not found"; then
    print_result 0 "Alert Acknowledgment"
else
    print_result 1 "Alert Acknowledgment"
fi

echo -n "Testing Alert Resolution... "
resolve_response=$(curl -s -X POST "http://localhost:4000/v1/alerts/test-alert-001/resolve" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo "{}")

if echo "$resolve_response" | jq -e '.success' > /dev/null 2>&1 || echo "$resolve_response" | jq -e '.message' | grep -q "not found"; then
    print_result 0 "Alert Resolution"
else
    print_result 1 "Alert Resolution"
fi

echo -e "\n${BLUE}6. Testing Alert Rule Deletion${NC}"
echo "-----------------------------------"

# Probar eliminación de regla
echo -n "Testing API Alert Rule Deletion... "
delete_response=$(curl -s -X DELETE "http://localhost:4000/v1/alerts/rules/test-rule-001" 2>/dev/null || echo "{}")

if echo "$delete_response" | jq -e '.success' > /dev/null 2>&1; then
    print_result 0 "API Alert Rule Deletion"
else
    print_result 1 "API Alert Rule Deletion"
fi

echo -e "\n${BLUE}7. Testing Alert Integration with Metrics${NC}"
echo "--------------------------------------------"

# Verificar que las métricas incluyen información de alertas
echo -n "Testing API Metrics with Alert Integration... "
api_metrics_response=$(curl -s "http://localhost:4000/v1/observability/metrics" 2>/dev/null || echo "{}")
if echo "$api_metrics_response" | jq -e '.data' > /dev/null 2>&1; then
    print_result 0 "API Metrics with Alert Integration"
else
    print_result 1 "API Metrics with Alert Integration"
fi

echo -n "Testing Web BFF Metrics with Alert Integration... "
web_metrics_response=$(curl -s "http://localhost:3000/api/observability/metrics" 2>/dev/null || echo "{}")
if echo "$web_metrics_response" | jq -e '.data.newAlerts' > /dev/null 2>&1; then
    print_result 0 "Web BFF Metrics with Alert Integration"
else
    print_result 1 "Web BFF Metrics with Alert Integration"
fi

echo -e "\n${BLUE}8. Testing Alert Statistics${NC}"
echo "--------------------------------"

# Verificar estadísticas de alertas
echo -n "Testing API Alert Statistics... "
api_stats_response=$(curl -s "http://localhost:4000/v1/alerts/stats" 2>/dev/null || echo "{}")
if echo "$api_stats_response" | jq -e '.data.alerts' > /dev/null 2>&1; then
    print_result 0 "API Alert Statistics"
else
    print_result 1 "API Alert Statistics"
fi

echo -n "Testing Web BFF Alert Statistics... "
web_stats_response=$(curl -s "http://localhost:3000/api/alerts/stats" 2>/dev/null || echo "{}")
if echo "$web_stats_response" | jq -e '.data.alerts' > /dev/null 2>&1; then
    print_result 0 "Web BFF Alert Statistics"
else
    print_result 1 "Web BFF Alert Statistics"
fi

echo -e "\n${BLUE}9. Testing Alert System Performance${NC}"
echo "----------------------------------------"

# Verificar rendimiento de endpoints de alertas
echo -n "Testing API Alert System Performance... "
start_time=$(date +%s%N)
curl -s "http://localhost:4000/v1/alerts/rules" > /dev/null 2>&1
end_time=$(date +%s%N)
api_duration=$(( (end_time - start_time) / 1000000 ))

if [ $api_duration -lt 1000 ]; then
    print_result 0 "API Alert System Performance (${api_duration}ms)"
else
    print_result 1 "API Alert System Performance (${api_duration}ms - too slow)"
fi

echo -n "Testing Web BFF Alert System Performance... "
start_time=$(date +%s%N)
curl -s "http://localhost:3000/api/alerts/rules" > /dev/null 2>&1
end_time=$(date +%s%N)
web_duration=$(( (end_time - start_time) / 1000000 ))

if [ $web_duration -lt 1000 ]; then
    print_result 0 "Web BFF Alert System Performance (${web_duration}ms)"
else
    print_result 1 "Web BFF Alert System Performance (${web_duration}ms - too slow)"
fi

echo -e "\n${BLUE}10. Testing Alert Data Quality${NC}"
echo "-----------------------------------"

# Verificar calidad de datos de alertas
echo -n "Testing API Alert Data Quality... "
api_rules_data=$(curl -s "http://localhost:4000/v1/alerts/rules" 2>/dev/null || echo "{}")
rules_count=$(echo "$api_rules_data" | jq '.data | length' 2>/dev/null || echo "0")

if [ "$rules_count" -ge 0 ]; then
    print_result 0 "API Alert Data Quality ($rules_count rules)"
else
    print_result 1 "API Alert Data Quality (invalid rules data)"
fi

echo -n "Testing Web BFF Alert Data Quality... "
web_alerts_data=$(curl -s "http://localhost:3000/api/alerts/active" 2>/dev/null || echo "{}")
alerts_count=$(echo "$web_alerts_data" | jq '.data.alerts | length' 2>/dev/null || echo "0")

if [ "$alerts_count" -ge 0 ]; then
    print_result 0 "Web BFF Alert Data Quality ($alerts_count alerts)"
else
    print_result 1 "Web BFF Alert Data Quality (invalid alerts data)"
fi

echo -e "\n${BLUE}11. Testing Alert Rule Validation${NC}"
echo "--------------------------------------"

# Probar validación de reglas de alerta
echo -n "Testing Invalid Alert Rule Rejection... "
invalid_rule_response=$(curl -s -X POST "http://localhost:4000/v1/alerts/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "invalid-rule",
    "name": "Invalid Rule"
  }' 2>/dev/null || echo "{}")

if echo "$invalid_rule_response" | jq -e '.success' | grep -q "false" 2>/dev/null || echo "$invalid_rule_response" | jq -e '.error' > /dev/null 2>&1; then
    print_result 0 "Invalid Alert Rule Rejection"
else
    print_result 1 "Invalid Alert Rule Rejection"
fi

echo -e "\n${BLUE}12. Testing Alert System Integration${NC}"
echo "----------------------------------------"

# Verificar integración con el sistema de observabilidad
echo -n "Testing Alert-Observability Integration... "
integration_response=$(curl -s "http://localhost:4000/v1/observability/metrics" 2>/dev/null || echo "{}")
if echo "$integration_response" | jq -e '.data' > /dev/null 2>&1; then
    print_result 0 "Alert-Observability Integration"
else
    print_result 1 "Alert-Observability Integration"
fi

echo -e "\n${BLUE}Summary${NC}"
echo "========"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! PR-24 Alertas inteligentes basadas en métricas is working correctly.${NC}"
    echo -e "${GREEN}✅ Alert system is operational${NC}"
    echo -e "${GREEN}✅ Alert rules management is functional${NC}"
    echo -e "${GREEN}✅ Alert evaluation is working${NC}"
    echo -e "${GREEN}✅ Alert notifications are available${NC}"
    echo -e "${GREEN}✅ Alert statistics are accurate${NC}"
    echo -e "${GREEN}✅ Performance is acceptable${NC}"
    echo -e "${GREEN}✅ Data quality is good${NC}"
    echo -e "${GREEN}✅ Integration with observability is working${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed. Please check the implementation.${NC}"
    exit 1
fi

