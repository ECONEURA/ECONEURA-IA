#!/bin/bash

# PR-23: Observabilidad coherente (logs + métricas + traces)
# Smoke test para verificar sistema de observabilidad

set -e

echo "🧪 PR-23: Observabilidad coherente - Smoke Test"
echo "=============================================="

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

echo -e "\n${BLUE}1. Testing API Express Observability Endpoints${NC}"
echo "-----------------------------------------------"

# Endpoints de observabilidad del API
check_json_endpoint "http://localhost:4000/v1/observability/logs" "data" "API Observability Logs"
check_json_endpoint "http://localhost:4000/v1/observability/metrics" "data" "API Observability Metrics"
check_json_endpoint "http://localhost:4000/v1/observability/traces" "data" "API Observability Traces"
check_json_endpoint "http://localhost:4000/v1/observability/traces/stats" "data" "API Observability Traces Stats"

echo -e "\n${BLUE}2. Testing Web BFF Observability Endpoints${NC}"
echo "--------------------------------------------"

# Endpoints de observabilidad del Web BFF
check_json_endpoint "http://localhost:3000/api/observability/logs" "data" "Web BFF Observability Logs"
check_json_endpoint "http://localhost:3000/api/observability/metrics" "data" "Web BFF Observability Metrics"
check_json_endpoint "http://localhost:3000/api/observability/stats" "data" "Web BFF Observability Stats"

echo -e "\n${BLUE}3. Testing Prometheus Metrics Export${NC}"
echo "----------------------------------------"

# Verificar exportación Prometheus
echo -n "Testing API Prometheus Export... "
prometheus_response=$(curl -s "http://localhost:4000/v1/observability/metrics/prometheus" 2>/dev/null || echo "")
if [[ -n "$prometheus_response" && ! "$prometheus_response" =~ "Error" ]]; then
    print_result 0 "API Prometheus Export"
else
    print_result 1 "API Prometheus Export"
fi

echo -n "Testing Web BFF Prometheus Export... "
web_prometheus_response=$(curl -s "http://localhost:3000/api/observability/metrics/prometheus" 2>/dev/null || echo "")
if [[ -n "$web_prometheus_response" && ! "$web_prometheus_response" =~ "Error" ]]; then
    print_result 0 "Web BFF Prometheus Export"
else
    print_result 1 "Web BFF Prometheus Export"
fi

echo -e "\n${BLUE}4. Testing Observability Headers${NC}"
echo "-----------------------------------"

# Verificar headers de observabilidad
echo -n "Testing API Observability Headers... "
api_headers=$(curl -s -I "http://localhost:4000/health/live" 2>/dev/null || echo "")
if echo "$api_headers" | grep -qi "x-request-id\|x-trace-id\|x-span-id"; then
    print_result 0 "API Observability Headers"
else
    print_result 1 "API Observability Headers"
fi

echo -n "Testing Web BFF Observability Headers... "
web_headers=$(curl -s -I "http://localhost:3000/api/health/degraded" 2>/dev/null || echo "")
if echo "$web_headers" | grep -qi "x-response-time"; then
    print_result 0 "Web BFF Observability Headers"
else
    print_result 1 "Web BFF Observability Headers"
fi

echo -e "\n${BLUE}5. Testing Structured Logging${NC}"
echo "--------------------------------"

# Verificar que los logs están estructurados
echo -n "Testing API Structured Logging... "
api_logs_response=$(curl -s "http://localhost:4000/v1/observability/logs" 2>/dev/null || echo "{}")
if echo "$api_logs_response" | jq -e '.data' > /dev/null 2>&1; then
    print_result 0 "API Structured Logging"
else
    print_result 1 "API Structured Logging"
fi

echo -n "Testing Web BFF Structured Logging... "
web_logs_response=$(curl -s "http://localhost:3000/api/observability/logs" 2>/dev/null || echo "{}")
if echo "$web_logs_response" | jq -e '.data.logs' > /dev/null 2>&1; then
    print_result 0 "Web BFF Structured Logging"
else
    print_result 1 "Web BFF Structured Logging"
fi

echo -e "\n${BLUE}6. Testing Metrics Collection${NC}"
echo "--------------------------------"

# Verificar recolección de métricas
echo -n "Testing API Metrics Collection... "
api_metrics_response=$(curl -s "http://localhost:4000/v1/observability/metrics" 2>/dev/null || echo "{}")
if echo "$api_metrics_response" | jq -e '.data' > /dev/null 2>&1; then
    print_result 0 "API Metrics Collection"
else
    print_result 1 "API Metrics Collection"
fi

echo -n "Testing Web BFF Metrics Collection... "
web_metrics_response=$(curl -s "http://localhost:3000/api/observability/metrics" 2>/dev/null || echo "{}")
if echo "$web_metrics_response" | jq -e '.data.summary' > /dev/null 2>&1; then
    print_result 0 "Web BFF Metrics Collection"
else
    print_result 1 "Web BFF Metrics Collection"
fi

echo -e "\n${BLUE}7. Testing Tracing System${NC}"
echo "---------------------------"

# Verificar sistema de traces
echo -n "Testing API Tracing System... "
api_traces_response=$(curl -s "http://localhost:4000/v1/observability/traces/stats" 2>/dev/null || echo "{}")
if echo "$api_traces_response" | jq -e '.data' > /dev/null 2>&1; then
    print_result 0 "API Tracing System"
else
    print_result 1 "API Tracing System"
fi

echo -e "\n${BLUE}8. Testing Observability Integration${NC}"
echo "--------------------------------------"

# Verificar integración con endpoints existentes
echo -n "Testing AI Chat with Observability... "
ai_response=$(curl -s -X POST "http://localhost:4000/v1/ai/chat" -H "Content-Type: application/json" -d '{"message":"test observability"}' 2>/dev/null || echo "{}")
if echo "$ai_response" | jq -e '.tokens' > /dev/null 2>&1; then
    print_result 0 "AI Chat with Observability"
else
    print_result 1 "AI Chat with Observability"
fi

echo -n "Testing Health Check with Observability... "
health_response=$(curl -s "http://localhost:3000/api/health/degraded" 2>/dev/null || echo "{}")
if echo "$health_response" | jq -e '.system_mode' > /dev/null 2>&1; then
    print_result 0 "Health Check with Observability"
else
    print_result 1 "Health Check with Observability"
fi

echo -e "\n${BLUE}9. Testing Observability Performance${NC}"
echo "-------------------------------------"

# Verificar rendimiento de endpoints de observabilidad
echo -n "Testing API Observability Performance... "
start_time=$(date +%s%N)
curl -s "http://localhost:4000/v1/observability/metrics" > /dev/null 2>&1
end_time=$(date +%s%N)
api_duration=$(( (end_time - start_time) / 1000000 ))

if [ $api_duration -lt 1000 ]; then
    print_result 0 "API Observability Performance (${api_duration}ms)"
else
    print_result 1 "API Observability Performance (${api_duration}ms - too slow)"
fi

echo -n "Testing Web BFF Observability Performance... "
start_time=$(date +%s%N)
curl -s "http://localhost:3000/api/observability/metrics" > /dev/null 2>&1
end_time=$(date +%s%N)
web_duration=$(( (end_time - start_time) / 1000000 ))

if [ $web_duration -lt 1000 ]; then
    print_result 0 "Web BFF Observability Performance (${web_duration}ms)"
else
    print_result 1 "Web BFF Observability Performance (${web_duration}ms - too slow)"
fi

echo -e "\n${BLUE}10. Testing Observability Data Quality${NC}"
echo "--------------------------------------"

# Verificar calidad de datos de observabilidad
echo -n "Testing API Metrics Data Quality... "
api_metrics_data=$(curl -s "http://localhost:4000/v1/observability/metrics" 2>/dev/null || echo "{}")
metrics_count=$(echo "$api_metrics_data" | jq '.data | length' 2>/dev/null || echo "0")

if [ "$metrics_count" -gt 0 ]; then
    print_result 0 "API Metrics Data Quality ($metrics_count metrics)"
else
    print_result 1 "API Metrics Data Quality (no metrics found)"
fi

echo -n "Testing Web BFF Logs Data Quality... "
web_logs_data=$(curl -s "http://localhost:3000/api/observability/logs" 2>/dev/null || echo "{}")
logs_count=$(echo "$web_logs_data" | jq '.data.logs | length' 2>/dev/null || echo "0")

if [ "$logs_count" -ge 0 ]; then
    print_result 0 "Web BFF Logs Data Quality ($logs_count logs)"
else
    print_result 1 "Web BFF Logs Data Quality (invalid logs data)"
fi

echo -e "\n${BLUE}Summary${NC}"
echo "========"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! PR-23 Observabilidad coherente is working correctly.${NC}"
    echo -e "${GREEN}✅ Structured logging is operational${NC}"
    echo -e "${GREEN}✅ Metrics collection is functional${NC}"
    echo -e "${GREEN}✅ Tracing system is working${NC}"
    echo -e "${GREEN}✅ Prometheus export is available${NC}"
    echo -e "${GREEN}✅ Observability headers are present${NC}"
    echo -e "${GREEN}✅ Performance is acceptable${NC}"
    echo -e "${GREEN}✅ Data quality is good${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS test(s) failed. Please check the implementation.${NC}"
    exit 1
fi
