#!/bin/bash

# PR-33: Sistema de Workflows coherente con BPMN y State Machines
# Smoke test para validar funcionalidad del sistema de workflows

set -e

echo "🚀 PR-33: Workflows & BPMN Smoke Test"
echo "====================================="

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
WORKFLOW_BASE="$API_URL/v1/workflows"
WEB_WORKFLOW_BASE="$WEB_URL/api/workflows"

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
echo "🏗️ Testing Workflow Management"
echo "-----------------------------"

# Test 1: Obtener workflows
check_json_response "$WORKFLOW_BASE" "success" "Get workflows"

# Test 2: Obtener workflows por tipo
run_test "Get workflows by type" "curl -s '$WORKFLOW_BASE?type=bpmn' | jq -e '.success' > /dev/null" "200"

# Test 3: Obtener workflows por categoría
run_test "Get workflows by category" "curl -s '$WORKFLOW_BASE?category=User%20Management' | jq -e '.success' > /dev/null" "200"

# Test 4: Crear workflow BPMN
run_test "Create BPMN workflow" "curl -s -X POST '$WORKFLOW_BASE' -H 'Content-Type: application/json' -d '{\"name\":\"Test BPMN\",\"version\":\"1.0.0\",\"description\":\"Test BPMN workflow\",\"type\":\"bpmn\",\"definition\":{\"elements\":[{\"id\":\"start\",\"type\":\"startEvent\",\"name\":\"Start\",\"position\":{\"x\":100,\"y\":100},\"properties\":{}}],\"flows\":[],\"startEvent\":\"start\",\"endEvents\":[]},\"metadata\":{\"author\":\"Test\",\"category\":\"Test\",\"tags\":[\"test\"],\"priority\":\"medium\",\"timeout\":300000,\"retryPolicy\":{\"maxRetries\":3,\"backoffStrategy\":\"exponential\",\"initialDelay\":1000,\"maxDelay\":10000},\"notifications\":[]}}' | jq -e '.success' > /dev/null" "201"

# Test 5: Crear workflow State Machine
run_test "Create State Machine workflow" "curl -s -X POST '$WORKFLOW_BASE' -H 'Content-Type: application/json' -d '{\"name\":\"Test State Machine\",\"version\":\"1.0.0\",\"description\":\"Test State Machine workflow\",\"type\":\"state-machine\",\"definition\":{\"states\":[{\"id\":\"initial\",\"name\":\"Initial\",\"type\":\"initial\",\"actions\":[],\"properties\":{}}],\"transitions\":[],\"initialState\":\"initial\",\"finalStates\":[]},\"metadata\":{\"author\":\"Test\",\"category\":\"Test\",\"tags\":[\"test\"],\"priority\":\"medium\",\"timeout\":300000,\"retryPolicy\":{\"maxRetries\":3,\"backoffStrategy\":\"exponential\",\"initialDelay\":1000,\"maxDelay\":10000},\"notifications\":[]}}' | jq -e '.success' > /dev/null" "201"

echo ""
echo "🚀 Testing Workflow Execution"
echo "----------------------------"

# Test 6: Obtener workflow específico
run_test "Get specific workflow" "curl -s '$WORKFLOW_BASE/workflow_1' | jq -e '.success' > /dev/null" "200"

# Test 7: Iniciar workflow
run_test "Start workflow" "curl -s -X POST '$WORKFLOW_BASE/workflow_1/start' -H 'Content-Type: application/json' -d '{\"context\":{\"userId\":\"test-user\",\"userType\":\"premium\"},\"metadata\":{\"userId\":\"test-user\",\"organizationId\":\"test-org\",\"priority\":\"medium\",\"tags\":[\"test\"],\"customData\":{}}}' | jq -e '.success' > /dev/null" "201"

# Test 8: Obtener instancias de workflow
check_json_response "$WORKFLOW_BASE/instances" "success" "Get workflow instances"

# Test 9: Obtener instancia específica
run_test "Get specific workflow instance" "curl -s '$WORKFLOW_BASE/instances/instance_1' | jq -e '.success' > /dev/null" "200"

echo ""
echo "⏸️ Testing Workflow Control"
echo "---------------------------"

# Test 10: Pausar workflow
run_test "Pause workflow instance" "curl -s -X POST '$WORKFLOW_BASE/instances/instance_1/pause' | jq -e '.success' > /dev/null" "200"

# Test 11: Reanudar workflow
run_test "Resume workflow instance" "curl -s -X POST '$WORKFLOW_BASE/instances/instance_1/resume' | jq -e '.success' > /dev/null" "200"

# Test 12: Cancelar workflow
run_test "Cancel workflow instance" "curl -s -X POST '$WORKFLOW_BASE/instances/instance_1/cancel' | jq -e '.success' > /dev/null" "200"

echo ""
echo "⚡ Testing Workflow Actions"
echo "---------------------------"

# Test 13: Ejecutar acción en workflow
run_test "Execute workflow action" "curl -s -X POST '$WORKFLOW_BASE/instances/instance_1/actions' -H 'Content-Type: application/json' -d '{\"actionName\":\"sendEmail\",\"data\":{\"to\":\"test@example.com\",\"subject\":\"Test\"}}' | jq -e '.success' > /dev/null" "200"

# Test 14: Ejecutar acción HTTP
run_test "Execute HTTP action" "curl -s -X POST '$WORKFLOW_BASE/instances/instance_1/actions' -H 'Content-Type: application/json' -d '{\"actionName\":\"httpRequest\",\"data\":{\"url\":\"https://api.example.com/test\"}}' | jq -e '.success' > /dev/null" "200"

echo ""
echo "📊 Testing Workflow Statistics"
echo "-----------------------------"

# Test 15: Obtener estadísticas de workflows
check_json_response "$WORKFLOW_BASE/stats" "success" "Get workflow stats"

# Test 16: Verificar estadísticas válidas
run_test "Validate workflow stats" "curl -s '$WORKFLOW_BASE/stats' | jq -e '.data.totalWorkflows >= 0' > /dev/null" "200"

echo ""
echo "🌐 Testing Web BFF Workflows"
echo "----------------------------"

# Test 17: Obtener workflows del web BFF
check_json_response "$WEB_WORKFLOW_BASE" "success" "Get web BFF workflows"

# Test 18: Obtener estadísticas del web BFF
check_json_response "$WEB_WORKFLOW_BASE/stats" "success" "Get web BFF workflow stats"

# Test 19: Crear workflow en web BFF
run_test "Create workflow in web BFF" "curl -s -X POST '$WEB_WORKFLOW_BASE' -H 'Content-Type: application/json' -d '{\"name\":\"Web Test Workflow\",\"version\":\"1.0.0\",\"description\":\"Web test workflow\",\"type\":\"bpmn\",\"definition\":{\"elements\":[],\"flows\":[],\"startEvent\":\"start\",\"endEvents\":[]},\"metadata\":{\"author\":\"Test\",\"category\":\"Test\",\"tags\":[\"test\"],\"priority\":\"medium\",\"timeout\":300000,\"retryPolicy\":{\"maxRetries\":3,\"backoffStrategy\":\"exponential\",\"initialDelay\":1000,\"maxDelay\":10000},\"notifications\":[]}}' | jq -e '.success' > /dev/null" "201"

echo ""
echo "🔍 Testing Workflow Filtering"
echo "----------------------------"

# Test 20: Filtrar instancias por workflow ID
run_test "Filter instances by workflow ID" "curl -s '$WORKFLOW_BASE/instances?workflowId=workflow_1' | jq -e '.success' > /dev/null" "200"

# Test 21: Filtrar instancias por status
run_test "Filter instances by status" "curl -s '$WORKFLOW_BASE/instances?status=running' | jq -e '.success' > /dev/null" "200"

# Test 22: Filtrar instancias por usuario
run_test "Filter instances by user" "curl -s '$WORKFLOW_BASE/instances?userId=test-user' | jq -e '.success' > /dev/null" "200"

echo ""
echo "🧪 Testing Workflow Edge Cases"
echo "-----------------------------"

# Test 23: Probar workflow inexistente
run_test "Test non-existent workflow" "curl -s '$WORKFLOW_BASE/non-existent' | jq -e '.error' > /dev/null" "404"

# Test 24: Probar instancia inexistente
run_test "Test non-existent instance" "curl -s '$WORKFLOW_BASE/instances/non-existent' | jq -e '.error' > /dev/null" "404"

# Test 25: Probar acción en instancia completada
run_test "Test action on completed instance" "curl -s -X POST '$WORKFLOW_BASE/instances/instance_1/actions' -H 'Content-Type: application/json' -d '{\"actionName\":\"test\"}' | jq -e '.error' > /dev/null" "400"

echo ""
echo "📈 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "🎉 All tests passed! Workflow & BPMN system is working correctly."
    exit 0
else
    print_error "❌ $FAILED_TESTS tests failed. Please check the implementation."
    exit 1
fi
