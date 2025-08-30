#!/bin/bash

# PR-32: Sistema de Configuración coherente con Feature Flags y Environment Management
# Smoke test para validar funcionalidad del sistema de configuración

set -e

echo "🚀 PR-32: Configuration & Feature Flags Smoke Test"
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
CONFIG_BASE="$API_URL/v1/config"
WEB_CONFIG_BASE="$WEB_URL/api/config"

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
echo "🏁 Testing Feature Flags"
echo "-----------------------"

# Test 1: Obtener feature flags
check_json_response "$CONFIG_BASE/feature-flags" "success" "Get feature flags"

# Test 2: Obtener feature flags por environment
run_test "Get feature flags by environment" "curl -s '$CONFIG_BASE/feature-flags?environment=development' | jq -e '.success' > /dev/null" "200"

# Test 3: Crear feature flag
run_test "Create feature flag" "curl -s -X POST '$CONFIG_BASE/feature-flags' -H 'Content-Type: application/json' -d '{\"name\":\"test-flag\",\"description\":\"Test feature flag\",\"enabled\":true,\"environment\":\"development\",\"rolloutPercentage\":100,\"targetUsers\":[],\"targetOrganizations\":[],\"conditions\":[]}' | jq -e '.success' > /dev/null" "201"

# Test 4: Verificar feature flag
run_test "Check feature flag" "curl -s -X POST '$CONFIG_BASE/feature-flags/flag_1/check' -H 'Content-Type: application/json' -d '{\"userId\":\"test-user\",\"organizationId\":\"test-org\"}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🌍 Testing Environment Management"
echo "--------------------------------"

# Test 5: Obtener environments
check_json_response "$CONFIG_BASE/environments" "success" "Get environments"

# Test 6: Obtener environment específico
run_test "Get specific environment" "curl -s '$CONFIG_BASE/environments?name=development' | jq -e '.success' > /dev/null" "200"

# Test 7: Actualizar environment config
run_test "Update environment config" "curl -s -X PUT '$CONFIG_BASE/environments/development' -H 'Content-Type: application/json' -d '{\"variables\":{\"newVar\":\"test\"}}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🔧 Testing Configuration Values"
echo "-------------------------------"

# Test 8: Obtener config value
run_test "Get config value" "curl -s '$CONFIG_BASE/values/logLevel' | jq -e '.success' > /dev/null" "200"

# Test 9: Obtener config value con environment
run_test "Get config value with environment" "curl -s '$CONFIG_BASE/values/logLevel?environment=development' | jq -e '.success' > /dev/null" "200"

# Test 10: Establecer config value
run_test "Set config value" "curl -s -X PUT '$CONFIG_BASE/values/testKey' -H 'Content-Type: application/json' -d '{\"value\":\"testValue\",\"environment\":\"development\"}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🔒 Testing Secrets Management"
echo "-----------------------------"

# Test 11: Establecer secreto
run_test "Set secret" "curl -s -X PUT '$CONFIG_BASE/secrets/testSecret' -H 'Content-Type: application/json' -d '{\"value\":\"secretValue\",\"environment\":\"development\"}' | jq -e '.success' > /dev/null" "200"

# Test 12: Verificar secreto existe
run_test "Check secret exists" "curl -s '$CONFIG_BASE/secrets/testSecret?environment=development' | jq -e '.success' > /dev/null" "200"

# Test 13: Verificar secreto inexistente
run_test "Check non-existent secret" "curl -s '$CONFIG_BASE/secrets/nonExistentSecret' | jq -e '.error' > /dev/null" "404"

echo ""
echo "📊 Testing Configuration Statistics"
echo "-----------------------------------"

# Test 14: Obtener estadísticas de configuración
check_json_response "$CONFIG_BASE/stats" "success" "Get configuration stats"

# Test 15: Verificar estadísticas válidas
run_test "Validate configuration stats" "curl -s '$CONFIG_BASE/stats' | jq -e '.data.totalFeatureFlags >= 0' > /dev/null" "200"

echo ""
echo "✅ Testing Configuration Validation"
echo "-----------------------------------"

# Test 16: Validar configuración
check_json_response "$CONFIG_BASE/validate" "success" "Validate configuration"

# Test 17: Recargar configuración
check_json_response "$CONFIG_BASE/reload" "success" "Reload configuration"

echo ""
echo "🌐 Testing Web BFF Configuration"
echo "--------------------------------"

# Test 18: Obtener feature flags del web BFF
check_json_response "$WEB_CONFIG_BASE/feature-flags" "success" "Get web BFF feature flags"

# Test 19: Obtener estadísticas del web BFF
check_json_response "$WEB_CONFIG_BASE/stats" "success" "Get web BFF config stats"

# Test 20: Crear feature flag en web BFF
run_test "Create feature flag in web BFF" "curl -s -X POST '$WEB_CONFIG_BASE/feature-flags' -H 'Content-Type: application/json' -d '{\"name\":\"web-test-flag\",\"description\":\"Web test feature flag\",\"enabled\":true,\"environment\":\"development\",\"rolloutPercentage\":50,\"targetUsers\":[],\"targetOrganizations\":[],\"conditions\":[]}' | jq -e '.success' > /dev/null" "201"

echo ""
echo "🚦 Testing Feature Flag Middleware"
echo "----------------------------------"

# Test 21: Probar endpoint con feature flag requerido
run_test "Test endpoint with required feature flag" "curl -s '$CONFIG_BASE/beta-features' | jq -e '.success' > /dev/null" "200"

# Test 22: Verificar headers de feature flags
run_test "Check feature flag headers" "curl -s '$CONFIG_BASE/feature-flags' | grep -q 'X-Feature-Flags-Total'" "200"

echo ""
echo "🧪 Testing Feature Flag Edge Cases"
echo "----------------------------------"

# Test 23: Probar feature flag con contexto específico
run_test "Test feature flag with specific context" "curl -s -X POST '$CONFIG_BASE/feature-flags/flag_1/check' -H 'Content-Type: application/json' -d '{\"userId\":\"specific-user\",\"organizationId\":\"specific-org\",\"userRole\":\"admin\",\"customAttributes\":{\"plan\":\"premium\"}}' | jq -e '.success' > /dev/null" "200"

# Test 24: Probar feature flag inexistente
run_test "Test non-existent feature flag" "curl -s -X POST '$CONFIG_BASE/feature-flags/non-existent/check' -H 'Content-Type: application/json' -d '{\"userId\":\"test\"}' | jq -e '.data.isEnabled == false' > /dev/null" "200"

# Test 25: Probar configuración con valores por defecto
run_test "Test config with default values" "curl -s '$CONFIG_BASE/values/nonExistentKey?defaultValue=default' | jq -e '.data.value == \"default\"' > /dev/null" "200"

echo ""
echo "📈 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 All tests passed! Configuration & Feature Flags system is working correctly."
    exit 0
else
    print_error "❌ $FAILED_TESTS tests failed. Please check the implementation."
    exit 1
fi
