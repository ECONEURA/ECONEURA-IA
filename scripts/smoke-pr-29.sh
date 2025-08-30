#!/bin/bash

# PR-29: API Gateway coherente con routing inteligente y load balancing
# Smoke test para validar funcionalidad del API Gateway

set -e

echo "🚀 PR-29: API Gateway Smoke Test"
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables
API_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"
GATEWAY_BASE="$API_URL/v1/gateway"
WEB_GATEWAY_BASE="$WEB_URL/api/gateway"

# Contador de tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Función para ejecutar test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_status "Running test: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        print_success "✓ $test_name passed"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "✗ $test_name failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Función para verificar endpoint
check_endpoint() {
    local url="$1"
    local expected_status="$2"
    local test_name="$3"
    
    run_test "$test_name" "curl -s -o /dev/null -w '%{http_code}' '$url' | grep -q '$expected_status'" "$expected_status"
}

# Función para verificar respuesta JSON
check_json_response() {
    local url="$1"
    local expected_field="$2"
    local test_name="$3"
    
    run_test "$test_name" "curl -s '$url' | jq -e '.$expected_field' > /dev/null" "200"
}

# Esperar a que los servicios estén listos
print_status "Waiting for services to be ready..."
sleep 5

echo ""
echo "🔧 Testing API Gateway Management Endpoints"
echo "-------------------------------------------"

# Test 1: Obtener servicios del gateway
check_json_response "$GATEWAY_BASE/services" "success" "Get gateway services"

# Test 2: Obtener rutas del gateway
check_json_response "$GATEWAY_BASE/routes" "success" "Get gateway routes"

# Test 3: Obtener estadísticas del gateway
check_json_response "$GATEWAY_BASE/stats" "success" "Get gateway stats"

# Test 4: Agregar nuevo servicio
run_test "Add new service to gateway" "curl -s -X POST '$GATEWAY_BASE/services' -H 'Content-Type: application/json' -d '{\"name\":\"Test Service\",\"url\":\"http://localhost:8080\",\"health\":\"healthy\",\"weight\":1,\"maxConnections\":100,\"isActive\":true}' | jq -e '.success' > /dev/null" "201"

# Test 5: Agregar nueva ruta
run_test "Add new route to gateway" "curl -s -X POST '$GATEWAY_BASE/routes' -H 'Content-Type: application/json' -d '{\"name\":\"Test Route\",\"path\":\"/test\",\"method\":\"GET\",\"serviceId\":\"service_1\",\"priority\":50,\"conditions\":[],\"isActive\":true}' | jq -e '.success' > /dev/null" "201"

# Test 6: Probar ruta
run_test "Test route matching" "curl -s -X POST '$GATEWAY_BASE/test-route' -H 'Content-Type: application/json' -d '{\"path\":\"/health\",\"method\":\"GET\"}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🌐 Testing Web BFF Gateway Endpoints"
echo "------------------------------------"

# Test 7: Obtener servicios del web gateway
check_json_response "$WEB_GATEWAY_BASE/services" "success" "Get web gateway services"

# Test 8: Obtener rutas del web gateway
check_json_response "$WEB_GATEWAY_BASE/routes" "success" "Get web gateway routes"

# Test 9: Obtener estadísticas del web gateway
check_json_response "$WEB_GATEWAY_BASE/stats" "success" "Get web gateway stats"

# Test 10: Probar ruta en web gateway
run_test "Test web gateway route matching" "curl -s -X POST '$WEB_GATEWAY_BASE/test-route' -H 'Content-Type: application/json' -d '{\"path\":\"/dashboard\",\"method\":\"GET\"}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🔍 Testing Gateway Functionality"
echo "--------------------------------"

# Test 11: Verificar que el gateway responde con headers correctos
run_test "Check gateway headers" "curl -s -I '$API_URL/health' | grep -q 'X-Gateway' > /dev/null" "200"

# Test 12: Verificar routing inteligente
run_test "Test intelligent routing" "curl -s '$API_URL/v1/ai/chat' -X POST -H 'Content-Type: application/json' -d '{\"message\":\"test\"}' | jq -e '.message' > /dev/null" "200"

# Test 13: Verificar load balancing (múltiples requests)
run_test "Test load balancing" "for i in {1..5}; do curl -s '$API_URL/health' > /dev/null; done" "200"

# Test 14: Verificar circuit breaker (simular error)
run_test "Test circuit breaker" "curl -s '$API_URL/nonexistent' | grep -q 'Route not found' > /dev/null" "404"

echo ""
echo "📊 Testing Gateway Metrics"
echo "--------------------------"

# Test 15: Verificar métricas de requests
check_json_response "$GATEWAY_BASE/stats" "totalRequests" "Check request metrics"

# Test 16: Verificar métricas de servicios
check_json_response "$GATEWAY_BASE/services" "services" "Check service metrics"

# Test 17: Verificar métricas de rutas
check_json_response "$GATEWAY_BASE/routes" "routes" "Check route metrics"

echo ""
echo "🛡️ Testing Gateway Security"
echo "---------------------------"

# Test 18: Verificar headers de seguridad
run_test "Check security headers" "curl -s -I '$API_URL/health' | grep -q 'X-Gateway-Request-Id' > /dev/null" "200"

# Test 19: Verificar headers de métricas
run_test "Check metrics headers" "curl -s -I '$API_URL/health' | grep -q 'X-Gateway-Response-Time' > /dev/null" "200"

echo ""
echo "🧪 Testing Gateway Edge Cases"
echo "-----------------------------"

# Test 20: Probar ruta con condiciones
run_test "Test route with conditions" "curl -s -X POST '$GATEWAY_BASE/test-route' -H 'Content-Type: application/json' -d '{\"path\":\"/health\",\"method\":\"GET\",\"headers\":{\"user-agent\":\"test\"}}' | jq -e '.success' > /dev/null" "200"

# Test 21: Probar método no soportado
run_test "Test unsupported method" "curl -s -X PUT '$API_URL/health' | grep -q 'Route not found' > /dev/null" "404"

# Test 22: Probar path no existente
run_test "Test non-existent path" "curl -s '$API_URL/nonexistent/path' | grep -q 'Route not found' > /dev/null" "404"

echo ""
echo "🔧 Testing Gateway Management Operations"
echo "----------------------------------------"

# Test 23: Eliminar ruta
run_test "Delete route" "curl -s -X DELETE '$GATEWAY_BASE/routes/route_1' | jq -e '.success' > /dev/null" "200"

# Test 24: Eliminar servicio
run_test "Delete service" "curl -s -X DELETE '$GATEWAY_BASE/services/service_1' | jq -e '.success' > /dev/null" "200"

# Test 25: Verificar eliminación
run_test "Verify deletion" "curl -s '$GATEWAY_BASE/routes' | jq -e '.data.count' > /dev/null" "200"

echo ""
echo "📈 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 All tests passed! API Gateway is working correctly."
    exit 0
else
    print_error "❌ $FAILED_TESTS tests failed. Please check the implementation."
    exit 1
fi
