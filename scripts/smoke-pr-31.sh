#!/bin/bash

# PR-31: Sistema de Microservicios coherente con Service Mesh y Discovery
# Smoke test para validar funcionalidad del sistema de microservicios

set -e

echo "🚀 PR-31: Microservices & Service Mesh Smoke Test"
echo "=================================================="

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
MICROSERVICES_BASE="$API_URL/v1/microservices"
WEB_MICROSERVICES_BASE="$WEB_URL/api/microservices"

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
echo "🔧 Testing Service Registry"
echo "---------------------------"

# Test 1: Obtener estadísticas de microservicios
check_json_response "$MICROSERVICES_BASE/stats" "success" "Get microservices stats"

# Test 2: Obtener servicios registrados
check_json_response "$MICROSERVICES_BASE/services" "success" "Get registered services"

# Test 3: Registrar nuevo servicio
run_test "Register new service" "curl -s -X POST '$MICROSERVICES_BASE/register' -H 'Content-Type: application/json' -d '{\"name\":\"test-service\",\"version\":\"1.0.0\",\"host\":\"localhost\",\"port\":8080,\"url\":\"http://localhost:8080\",\"health\":\"healthy\",\"status\":\"online\",\"metadata\":{\"environment\":\"development\",\"region\":\"us-east-1\",\"zone\":\"zone-a\",\"tags\":[\"test\"],\"capabilities\":[\"rest\"],\"load\":0,\"memory\":256,\"cpu\":10,\"endpoints\":[]}}' | jq -e '.success' > /dev/null" "201"

# Test 4: Descubrir servicios por nombre
check_json_response "$MICROSERVICES_BASE/discover/api-express" "success" "Discover services by name"

# Test 5: Descubrir servicios con filtros
run_test "Discover services with filters" "curl -s '$MICROSERVICES_BASE/discover/api-express?health=healthy&status=online' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🌐 Testing Web BFF Microservices"
echo "--------------------------------"

# Test 6: Obtener estadísticas del web BFF
check_json_response "$WEB_MICROSERVICES_BASE/stats" "success" "Get web BFF microservices stats"

# Test 7: Obtener servicios del web BFF
check_json_response "$WEB_MICROSERVICES_BASE/services" "success" "Get web BFF services"

# Test 8: Registrar servicio en web BFF
run_test "Register service in web BFF" "curl -s -X POST '$WEB_MICROSERVICES_BASE/register' -H 'Content-Type: application/json' -d '{\"name\":\"web-test-service\",\"version\":\"1.0.0\",\"host\":\"localhost\",\"port\":8081,\"url\":\"http://localhost:8081\",\"health\":\"healthy\",\"status\":\"online\",\"metadata\":{\"environment\":\"development\",\"region\":\"us-east-1\",\"zone\":\"zone-a\",\"tags\":[\"web\",\"test\"],\"capabilities\":[\"ssr\"],\"load\":0,\"memory\":128,\"cpu\":5,\"endpoints\":[]}}' | jq -e '.success' > /dev/null" "201"

echo ""
echo "🔄 Testing Service Mesh"
echo "----------------------"

# Test 9: Realizar request a través del service mesh
run_test "Service mesh request" "curl -s -X POST '$MICROSERVICES_BASE/request' -H 'Content-Type: application/json' -d '{\"serviceName\":\"api-express\",\"path\":\"/health\",\"method\":\"GET\",\"headers\":{}}' | jq -e '.success' > /dev/null" "200"

# Test 10: Realizar request con timeout
run_test "Service mesh request with timeout" "curl -s -X POST '$MICROSERVICES_BASE/request' -H 'Content-Type: application/json' -d '{\"serviceName\":\"api-express\",\"path\":\"/health\",\"method\":\"GET\",\"headers\":{},\"timeout\":5000}' | jq -e '.success' > /dev/null" "200"

# Test 11: Realizar request con retries
run_test "Service mesh request with retries" "curl -s -X POST '$MICROSERVICES_BASE/request' -H 'Content-Type: application/json' -d '{\"serviceName\":\"api-express\",\"path\":\"/health\",\"method\":\"GET\",\"headers\":{},\"retries\":3}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "💓 Testing Service Health"
echo "-------------------------"

# Test 12: Enviar heartbeat
run_test "Send service heartbeat" "curl -s -X POST '$MICROSERVICES_BASE/heartbeat/service_1' | jq -e '.success' > /dev/null" "200"

# Test 13: Actualizar salud del servicio
run_test "Update service health" "curl -s -X PUT '$MICROSERVICES_BASE/health/service_1' -H 'Content-Type: application/json' -d '{\"health\":\"healthy\"}' | jq -e '.success' > /dev/null" "200"

# Test 14: Verificar servicios saludables
run_test "Check healthy services" "curl -s '$MICROSERVICES_BASE/services?health=healthy' | jq -e '.data.count > 0' > /dev/null" "200"

echo ""
echo "🛡️ Testing Circuit Breaker"
echo "---------------------------"

# Test 15: Reset circuit breaker
run_test "Reset circuit breaker" "curl -s -X POST '$MICROSERVICES_BASE/circuit-breaker/reset/api-express' | jq -e '.success' > /dev/null" "200"

# Test 16: Verificar estadísticas del service mesh
check_json_response "$MICROSERVICES_BASE/stats" "serviceMesh" "Check service mesh stats"

echo ""
echo "🔍 Testing Service Discovery"
echo "----------------------------"

# Test 17: Descubrir servicios por versión
run_test "Discover services by version" "curl -s '$MICROSERVICES_BASE/discover/api-express?version=1.0.0' | jq -e '.success' > /dev/null" "200"

# Test 18: Descubrir servicios por ambiente
run_test "Discover services by environment" "curl -s '$MICROSERVICES_BASE/discover/api-express?environment=development' | jq -e '.success' > /dev/null" "200"

# Test 19: Descubrir servicios por región
run_test "Discover services by region" "curl -s '$MICROSERVICES_BASE/discover/api-express?region=us-east-1' | jq -e '.success' > /dev/null" "200"

echo ""
echo "📊 Testing Service Statistics"
echo "-----------------------------"

# Test 20: Verificar estadísticas del registry
check_json_response "$MICROSERVICES_BASE/stats" "serviceRegistry" "Check service registry stats"

# Test 21: Verificar total de servicios
run_test "Check total services count" "curl -s '$MICROSERVICES_BASE/stats' | jq -e '.data.serviceRegistry.totalServices > 0' > /dev/null" "200"

# Test 22: Verificar servicios saludables
run_test "Check healthy services count" "curl -s '$MICROSERVICES_BASE/stats' | jq -e '.data.serviceRegistry.healthyServices >= 0' > /dev/null" "200"

echo ""
echo "🧪 Testing Service Mesh Edge Cases"
echo "----------------------------------"

# Test 23: Probar request a servicio inexistente
run_test "Test request to non-existent service" "curl -s -X POST '$MICROSERVICES_BASE/request' -H 'Content-Type: application/json' -d '{\"serviceName\":\"non-existent-service\",\"path\":\"/health\",\"method\":\"GET\",\"headers\":{}}' | jq -e '.error' > /dev/null" "500"

# Test 24: Probar heartbeat a servicio inexistente
run_test "Test heartbeat to non-existent service" "curl -s -X POST '$MICROSERVICES_BASE/heartbeat/non-existent' | jq -e '.error' > /dev/null" "404"

# Test 25: Probar actualizar salud de servicio inexistente
run_test "Test update health of non-existent service" "curl -s -X PUT '$MICROSERVICES_BASE/health/non-existent' -H 'Content-Type: application/json' -d '{\"health\":\"healthy\"}' | jq -e '.error' > /dev/null" "404"

echo ""
echo "📈 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 All tests passed! Microservices & Service Mesh system is working correctly."
    exit 0
else
    print_error "❌ $FAILED_TESTS tests failed. Please check the implementation."
    exit 1
fi
