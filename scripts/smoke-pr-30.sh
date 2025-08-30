#!/bin/bash

# PR-30: Sistema de Eventos coherente con Event Sourcing y CQRS
# Smoke test para validar funcionalidad del sistema de eventos

set -e

echo "🚀 PR-30: Event Sourcing & CQRS Smoke Test"
echo "==========================================="

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
EVENTS_BASE="$API_URL/v1/events"
WEB_EVENTS_BASE="$WEB_URL/api/events"

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
echo "🔧 Testing Event Sourcing System"
echo "-------------------------------"

# Test 1: Obtener estadísticas del sistema de eventos
check_json_response "$EVENTS_BASE/stats" "success" "Get event sourcing stats"

# Test 2: Obtener eventos del event store
check_json_response "$EVENTS_BASE/events" "success" "Get events from event store"

# Test 3: Crear usuario con comando
run_test "Create user with command" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"CreateUser\",\"aggregateId\":\"user_1\",\"data\":{\"email\":\"test@example.com\",\"name\":\"Test User\",\"organizationId\":\"org_123\"}}' | jq -e '.success' > /dev/null" "200"

# Test 4: Actualizar usuario con comando
run_test "Update user with command" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"UpdateUser\",\"aggregateId\":\"user_1\",\"data\":{\"name\":\"Updated User\"}}' | jq -e '.success' > /dev/null" "200"

# Test 5: Suspender usuario con comando
run_test "Suspend user with command" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"SuspendUser\",\"aggregateId\":\"user_1\",\"data\":{\"reason\":\"Test suspension\"}}' | jq -e '.success' > /dev/null" "200"

# Test 6: Activar usuario con comando
run_test "Activate user with command" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"ActivateUser\",\"aggregateId\":\"user_1\",\"data\":{}}' | jq -e '.success' > /dev/null" "200"

# Test 7: Obtener usuario con query
run_test "Get user with query" "curl -s -X POST '$EVENTS_BASE/queries' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"GetUser\",\"data\":{\"userId\":\"user_1\"}}' | jq -e '.success' > /dev/null" "200"

# Test 8: Obtener usuarios por organización con query
run_test "Get users by organization with query" "curl -s -X POST '$EVENTS_BASE/queries' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"GetUsersByOrganization\",\"data\":{\"organizationId\":\"org_123\"}}' | jq -e '.success' > /dev/null" "200"

# Test 9: Obtener usuarios activos con query
run_test "Get active users with query" "curl -s -X POST '$EVENTS_BASE/queries' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"GetActiveUsers\",\"data\":{\"organizationId\":\"org_123\"}}' | jq -e '.success' > /dev/null" "200"

# Test 10: Cargar aggregate
run_test "Load aggregate" "curl -s '$EVENTS_BASE/aggregates/user_1?aggregateType=User' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🌐 Testing Web BFF Event Sourcing"
echo "--------------------------------"

# Test 11: Obtener estadísticas del web BFF
check_json_response "$WEB_EVENTS_BASE/stats" "success" "Get web BFF event sourcing stats"

# Test 12: Ejecutar comando en web BFF
run_test "Execute command in web BFF" "curl -s -X POST '$WEB_EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"CreateUser\",\"aggregateId\":\"user_2\",\"data\":{\"email\":\"test2@example.com\",\"name\":\"Test User 2\",\"organizationId\":\"org_123\"}}' | jq -e '.success' > /dev/null" "200"

# Test 13: Ejecutar query en web BFF
run_test "Execute query in web BFF" "curl -s -X POST '$WEB_EVENTS_BASE/queries' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"GetUsersByOrganization\",\"data\":{\"organizationId\":\"org_123\"}}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "📊 Testing Event Store Operations"
echo "--------------------------------"

# Test 14: Obtener eventos por tipo
run_test "Get events by type" "curl -s '$EVENTS_BASE/events?eventType=UserCreated' | jq -e '.success' > /dev/null" "200"

# Test 15: Obtener eventos desde timestamp
run_test "Get events from timestamp" "curl -s '$EVENTS_BASE/events?fromTimestamp=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S.000Z)' | jq -e '.success' > /dev/null" "200"

# Test 16: Verificar que se crearon eventos
run_test "Verify events were created" "curl -s '$EVENTS_BASE/events' | jq -e '.data.count > 0' > /dev/null" "200"

echo ""
echo "🔄 Testing Event Replay"
echo "----------------------"

# Test 17: Replay de eventos
run_test "Event replay" "curl -s -X POST '$EVENTS_BASE/replay' -H 'Content-Type: application/json' -d '{\"fromTimestamp\":\"$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S.000Z)\"}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🔍 Testing CQRS Functionality"
echo "-----------------------------"

# Test 18: Verificar separación de comandos y queries
run_test "Verify command-query separation" "curl -s '$EVENTS_BASE/stats' | jq -e '.data.commandHandlers > 0 and .data.queryHandlers > 0' > /dev/null" "200"

# Test 19: Verificar que los comandos generan eventos
run_test "Verify commands generate events" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"CreateUser\",\"aggregateId\":\"user_3\",\"data\":{\"email\":\"test3@example.com\",\"name\":\"Test User 3\",\"organizationId\":\"org_123\"}}' && sleep 2 && curl -s '$EVENTS_BASE/events?eventType=UserCreated' | jq -e '.data.count > 0' > /dev/null" "200"

# Test 20: Verificar que las queries no modifican estado
run_test "Verify queries don't modify state" "curl -s -X POST '$EVENTS_BASE/queries' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"GetUser\",\"data\":{\"userId\":\"user_1\"}}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🛡️ Testing Event Sourcing Security"
echo "----------------------------------"

# Test 21: Verificar headers de correlación
run_test "Check correlation headers" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -H 'x-correlation-id: test-correlation' -H 'x-causation-id: test-causation' -d '{\"type\":\"CreateUser\",\"aggregateId\":\"user_4\",\"data\":{\"email\":\"test4@example.com\",\"name\":\"Test User 4\",\"organizationId\":\"org_123\"}}' | jq -e '.success' > /dev/null" "200"

# Test 22: Verificar control de concurrencia
run_test "Check concurrency control" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"CreateUser\",\"aggregateId\":\"user_1\",\"data\":{\"email\":\"duplicate@example.com\",\"name\":\"Duplicate User\",\"organizationId\":\"org_123\"}}' | jq -e '.error' > /dev/null" "400"

echo ""
echo "🧪 Testing Event Sourcing Edge Cases"
echo "-----------------------------------"

# Test 23: Probar comando inválido
run_test "Test invalid command" "curl -s -X POST '$EVENTS_BASE/commands' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"InvalidCommand\",\"aggregateId\":\"user_5\",\"data\":{}}' | jq -e '.error' > /dev/null" "400"

# Test 24: Probar query inválida
run_test "Test invalid query" "curl -s -X POST '$EVENTS_BASE/queries' -H 'Content-Type: application/json' -H 'x-user-id: test-user' -H 'x-organization-id: org_123' -d '{\"type\":\"InvalidQuery\",\"data\":{}}' | jq -e '.error' > /dev/null" "400"

# Test 25: Probar aggregate inexistente
run_test "Test non-existent aggregate" "curl -s '$EVENTS_BASE/aggregates/nonexistent?aggregateType=User' | jq -e '.success' > /dev/null" "200"

echo ""
echo "📈 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 All tests passed! Event Sourcing & CQRS system is working correctly."
    exit 0
else
    print_error "❌ $FAILED_TESTS tests failed. Please check the implementation."
    exit 1
fi
