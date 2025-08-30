#!/bin/bash

# PR-22: Health & degradación coherente (web + api)
# Smoke test para verificar endpoints de health y degradación

set -e

echo "🧪 PR-22: Health & degradación coherente - Smoke Test"
echo "=================================================="

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

# Función para verificar endpoint
check_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_result 0 "$description"
    else
        print_result 1 "$description"
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

echo -e "\n${BLUE}1. Testing API Express Health Endpoints${NC}"
echo "----------------------------------------"

# Health básico
check_json_endpoint "http://localhost:4000/health" "status" "API Health Basic"

# Health live
check_json_endpoint "http://localhost:4000/health/live" "uptime" "API Health Live"

# Health ready
check_json_endpoint "http://localhost:4000/health/ready" "checks" "API Health Ready"

echo -e "\n${BLUE}2. Testing Web BFF Health Endpoints${NC}"
echo "----------------------------------------"

# Health live del BFF
check_json_endpoint "http://localhost:3000/api/health/live" "service" "Web BFF Health Live"

# Health ready del BFF
check_json_endpoint "http://localhost:3000/api/health/ready" "mode" "Web BFF Health Ready"

# Health degraded del BFF
check_json_endpoint "http://localhost:3000/api/health/degraded" "system_mode" "Web BFF Health Degraded"

echo -e "\n${BLUE}3. Testing System Degradation Detection${NC}"
echo "----------------------------------------"

# Verificar que el endpoint degraded detecta el estado del sistema
echo -n "Testing System Mode Detection... "
response=$(curl -s "http://localhost:3000/api/health/degraded" 2>/dev/null || echo "{}")
system_mode=$(echo "$response" | jq -r '.system_mode // "unknown"')

if [[ "$system_mode" == "demo" || "$system_mode" == "ok" || "$system_mode" == "degraded" ]]; then
    print_result 0 "System Mode Detection ($system_mode)"
else
    print_result 1 "System Mode Detection (invalid: $system_mode)"
fi

echo -e "\n${BLUE}4. Testing API Endpoints Still Work${NC}"
echo "----------------------------------------"

# Verificar que los endpoints principales siguen funcionando
# AI Chat endpoint requiere POST
echo -n "Testing AI Chat Endpoint... "
ai_response=$(curl -s -X POST "http://localhost:4000/v1/ai/chat" -H "Content-Type: application/json" -d '{"message":"test"}' 2>/dev/null || echo "{}")
if echo "$ai_response" | jq -e ".id" > /dev/null 2>&1; then
    print_result 0 "AI Chat Endpoint"
else
    print_result 1 "AI Chat Endpoint"
fi

check_json_endpoint "http://localhost:4000/v1/search?q=test" "query" "Search Endpoint" &
check_json_endpoint "http://localhost:4000/v1/interactions" "interactions" "Interactions Endpoint" &
check_json_endpoint "http://localhost:4000/v1/products" "products" "Products Endpoint" &
check_json_endpoint "http://localhost:4000/v1/analytics/overview" "data" "Analytics Endpoint" &
check_json_endpoint "http://localhost:4000/v1/alerts/active" "data" "Alerts Endpoint" &
check_json_endpoint "http://localhost:4000/v1/reports/kpis" "data" "KPIs Endpoint" &

wait

echo -e "\n${BLUE}5. Testing Web Server Accessibility${NC}"
echo "----------------------------------------"

# Verificar que el servidor web está accesible
echo -n "Testing Web Server... "
if curl -s -f "http://localhost:3000" > /dev/null 2>&1; then
    print_result 0 "Web Server Accessibility"
else
    echo -e "${YELLOW}⚠️  Web server not running (this is OK for API-only tests)${NC}"
fi

echo -e "\n${BLUE}6. Testing Health Headers${NC}"
echo "----------------------------------------"

# Verificar headers de health
echo -n "Testing Health Headers... "
headers=$(curl -s -I "http://localhost:3000/api/health/ready" 2>/dev/null || echo "")
if echo "$headers" | grep -qi "x-system-mode"; then
    print_result 0 "Health Headers Present"
else
    print_result 1 "Health Headers Missing"
fi

echo -e "\n${BLUE}7. Testing Error Handling${NC}"
echo "----------------------------------------"

# Verificar manejo de errores en endpoints de health
echo -n "Testing Health Error Handling... "
error_response=$(curl -s "http://localhost:4000/health/nonexistent" 2>/dev/null || echo "{}")
if echo "$error_response" | jq -e '.error' > /dev/null 2>&1; then
    print_result 0 "Health Error Handling"
else
    print_result 1 "Health Error Handling"
fi

echo -e "\n${BLUE}8. Testing Performance${NC}"
echo "----------------------------------------"

# Verificar que los endpoints de health responden rápidamente
echo -n "Testing Health Response Time... "
start_time=$(date +%s%N)
curl -s "http://localhost:4000/health/live" > /dev/null 2>&1
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    print_result 0 "Health Response Time (${response_time}ms)"
else
    print_result 1 "Health Response Time (${response_time}ms - too slow)"
fi

echo -e "\n${BLUE}9. Testing System Status Component${NC}"
echo "----------------------------------------"

# Verificar que el componente SystemStatus puede obtener datos
echo -n "Testing System Status Data... "
if curl -s "http://localhost:3000/api/health/degraded" > /dev/null 2>&1 && \
   curl -s "http://localhost:4000/health/ready" > /dev/null 2>&1; then
    print_result 0 "System Status Data Available"
else
    print_result 1 "System Status Data Unavailable"
fi

echo -e "\n${BLUE}10. Testing Degradation Scenarios${NC}"
echo "----------------------------------------"

# Simular escenario de degradación (sin Azure OpenAI)
echo -n "Testing Demo Mode Detection... "
demo_response=$(curl -s "http://localhost:3000/api/health/degraded" 2>/dev/null || echo "{}")
ai_status=$(echo "$demo_response" | jq -r '.ia // "unknown"')

if [[ "$ai_status" == "demo" ]]; then
    print_result 0 "Demo Mode Detection (AI: $ai_status)"
else
    print_result 1 "Demo Mode Detection (AI: $ai_status)"
fi

echo -e "\n${BLUE}Summary${NC}"
echo "========"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! PR-22 Health & degradación coherente is working correctly.${NC}"
    echo -e "${GREEN}✅ Health endpoints are functional${NC}"
    echo -e "${GREEN}✅ Degradation detection is working${NC}"
    echo -e "${GREEN}✅ System status monitoring is operational${NC}"
    echo -e "${GREEN}✅ Error handling is robust${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed. Please check the implementation.${NC}"
    exit 1
fi
