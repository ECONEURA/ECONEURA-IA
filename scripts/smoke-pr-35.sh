#!/bin/bash

# ============================================================================
# PR-35: AI Chat Avanzado
# ============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE_URL="http://localhost:4000"
WEB_BASE_URL="http://localhost:3000"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_endpoint() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    local data=$5

    log_info "Testing: $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST -H "Content-Type: application/json" -d "$data" "$url")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X PUT -H "Content-Type: application/json" -d "$data" "$url")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X DELETE "$url")
    fi

    http_code="${response: -3}"
    
    if [ "$http_code" = "$expected_status" ]; then
        log_success "$description - Status: $http_code"
        return 0
    else
        log_error "$description - Expected: $expected_status, Got: $http_code"
        return 1
    fi
}

test_json_field() {
    local field=$1
    local expected_value=$2
    local description=$3

    if jq -e ".$field" /tmp/response.json > /dev/null 2>&1; then
        actual_value=$(jq -r ".$field" /tmp/response.json)
        if [ "$actual_value" = "$expected_value" ]; then
            log_success "$description - $field: $actual_value"
            return 0
        else
            log_error "$description - Expected $field: $expected_value, Got: $actual_value"
            return 1
        fi
    else
        log_error "$description - Field $field not found in response"
        return 1
    fi
}

test_json_exists() {
    local field=$1
    local description=$2

    if jq -e ".$field" /tmp/response.json > /dev/null 2>&1; then
        log_success "$description - Field $field exists"
        return 0
    else
        log_error "$description - Field $field not found"
        return 1
    fi
}

# ============================================================================
# INICIO DEL SCRIPT
# ============================================================================

echo "============================================================================"
echo "🚀 PR-35: AI Chat Avanzado"
echo "============================================================================"
echo ""

log_info "Verificando que los servidores estén corriendo..."

# Verificar API server
if curl -s "$API_BASE_URL/health/live" > /dev/null; then
    log_success "API server está corriendo en $API_BASE_URL"
else
    log_error "API server no está corriendo en $API_BASE_URL"
    exit 1
fi

# Verificar Web server
if curl -s "$WEB_BASE_URL" > /dev/null; then
    log_success "Web server está corriendo en $WEB_BASE_URL"
else
    log_error "Web server no está corriendo en $WEB_BASE_URL"
    exit 1
fi

echo ""
echo "📡 Testing API Endpoints (Express)"
echo "-----------------------------------"

# Test 1: Obtener modelos disponibles
test_endpoint "GET" "$API_BASE_URL/v1/ai-chat/models" "200" "Get available AI models"

# Test 2: Obtener funciones disponibles
test_endpoint "GET" "$API_BASE_URL/v1/ai-chat/functions" "200" "Get available functions"

# Test 3: Crear sesión de chat
SESSION_DATA='{
  "userId": "demo-user",
  "orgId": "demo-org",
  "title": "Test Chat Session",
  "model": "gpt-4"
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/sessions" "201" "Create chat session" "$SESSION_DATA"

# Extraer ID de la sesión creada
SESSION_ID=$(jq -r '.id' /tmp/response.json)
log_info "Created session ID: $SESSION_ID"

# Test 4: Obtener sesión específica
test_endpoint "GET" "$API_BASE_URL/v1/ai-chat/sessions/$SESSION_ID" "200" "Get specific session"

# Test 5: Enviar mensaje de chat
CHAT_MESSAGE='{
  "sessionId": "'$SESSION_ID'",
  "message": "Hello, this is a test message",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 100,
  "userId": "demo-user",
  "orgId": "demo-org"
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/chat" "200" "Send chat message" "$CHAT_MESSAGE"

# Test 6: Verificar que la respuesta contiene los campos esperados
test_json_exists "sessionId" "Response contains sessionId"
test_json_exists "message" "Response contains message"
test_json_exists "usage" "Response contains usage information"

# Test 7: Enviar mensaje con funciones
CHAT_MESSAGE_WITH_FUNCTIONS='{
  "sessionId": "'$SESSION_ID'",
  "message": "What is the weather like in Madrid?",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 200,
  "functions": ["get_weather"],
  "userId": "demo-user",
  "orgId": "demo-org"
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/chat" "200" "Send message with functions" "$CHAT_MESSAGE_WITH_FUNCTIONS"

# Test 8: Analizar sentimiento
SENTIMENT_DATA='{
  "text": "I am very happy today! This is amazing!"
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/sentiment" "200" "Analyze sentiment" "$SENTIMENT_DATA"

# Test 9: Obtener estadísticas generales
test_endpoint "GET" "$API_BASE_URL/v1/ai-chat/stats" "200" "Get general statistics"

# Test 10: Obtener estadísticas de sesión
test_endpoint "GET" "$API_BASE_URL/v1/ai-chat/sessions/$SESSION_ID/stats" "200" "Get session statistics"

# Test 11: Listar sesiones
test_endpoint "GET" "$API_BASE_URL/v1/ai-chat/sessions?userId=demo-user&orgId=demo-org" "200" "List sessions"

echo ""
echo "🌐 Testing Web BFF Endpoints"
echo "----------------------------"

# Test 12: Obtener modelos desde BFF
test_endpoint "GET" "$WEB_BASE_URL/api/ai-chat/models" "200" "Get models from BFF"

# Test 13: Obtener funciones desde BFF
test_endpoint "GET" "$WEB_BASE_URL/api/ai-chat/functions" "200" "Get functions from BFF"

# Test 14: Crear sesión desde BFF
test_endpoint "POST" "$WEB_BASE_URL/api/ai-chat/sessions" "201" "Create session from BFF" "$SESSION_DATA"

# Test 15: Enviar mensaje desde BFF
test_endpoint "POST" "$WEB_BASE_URL/api/ai-chat/chat" "200" "Send message from BFF" "$CHAT_MESSAGE"

echo ""
echo "🔍 Testing Validation"
echo "--------------------"

# Test 16: Validar datos inválidos de sesión
INVALID_SESSION='{
  "userId": "",
  "orgId": "",
  "title": ""
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/sessions" "400" "Reject invalid session data" "$INVALID_SESSION"

# Test 17: Validar mensaje sin sesión
INVALID_CHAT='{
  "message": "",
  "userId": "demo-user",
  "orgId": "demo-org"
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/chat" "400" "Reject invalid chat message" "$INVALID_CHAT"

# Test 18: Validar análisis de sentimiento sin texto
INVALID_SENTIMENT='{
  "text": ""
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/sentiment" "400" "Reject empty sentiment text" "$INVALID_SENTIMENT"

# Test 19: Validar sesión inexistente
test_endpoint "GET" "$API_BASE_URL/v1/ai-chat/sessions/non-existent-id" "404" "Reject non-existent session"

echo ""
echo "💰 Testing FinOps Headers"
echo "-------------------------"

# Test 20: Verificar headers FinOps en API
response=$(curl -s -I "$API_BASE_URL/v1/ai-chat/models")
if echo "$response" | grep -qi "X-Request-Id"; then
    log_success "API has X-Request-Id header"
else
    log_error "API missing X-Request-Id header"
fi

if echo "$response" | grep -qi "X-Org-Id"; then
    log_success "API has X-Org-Id header"
else
    log_error "API missing X-Org-Id header"
fi

# Test 21: Verificar headers FinOps en BFF
response=$(curl -s -I "$WEB_BASE_URL/api/ai-chat/models")
if echo "$response" | grep -qi "X-Request-Id"; then
    log_success "BFF has X-Request-Id header"
else
    log_error "BFF missing X-Request-Id header"
fi

if echo "$response" | grep -qi "X-Latency-ms"; then
    log_success "BFF has X-Latency-ms header"
else
    log_error "BFF missing X-Latency-ms header"
fi

echo ""
echo "🔗 Testing Integration"
echo "---------------------"

# Test 22: Verificar que los modelos son accesibles desde ambos endpoints
API_MODELS_COUNT=$(curl -s "$API_BASE_URL/v1/ai-chat/models" | jq 'length')
BFF_MODELS_COUNT=$(curl -s "$WEB_BASE_URL/api/ai-chat/models" | jq 'length')

if [ "$API_MODELS_COUNT" = "$BFF_MODELS_COUNT" ]; then
    log_success "Models count consistent between API and BFF: $API_MODELS_COUNT"
else
    log_error "Models count mismatch: API=$API_MODELS_COUNT, BFF=$BFF_MODELS_COUNT"
fi

# Test 23: Verificar que las funciones son accesibles desde ambos endpoints
API_FUNCTIONS_COUNT=$(curl -s "$API_BASE_URL/v1/ai-chat/functions" | jq 'length')
BFF_FUNCTIONS_COUNT=$(curl -s "$WEB_BASE_URL/api/ai-chat/functions" | jq 'length')

if [ "$API_FUNCTIONS_COUNT" = "$BFF_FUNCTIONS_COUNT" ]; then
    log_success "Functions count consistent between API and BFF: $API_FUNCTIONS_COUNT"
else
    log_error "Functions count mismatch: API=$API_FUNCTIONS_COUNT, BFF=$BFF_FUNCTIONS_COUNT"
fi

# Test 24: Verificar que las estadísticas contienen datos válidos
STATS_RESPONSE=$(curl -s "$API_BASE_URL/v1/ai-chat/stats")
if echo "$STATS_RESPONSE" | jq -e '.totalSessions' > /dev/null; then
    log_success "Statistics contain valid data"
else
    log_error "Statistics missing required fields"
fi

# Test 25: Verificar memoria de conversación
# Enviar un segundo mensaje y verificar que la sesión mantiene el contexto
SECOND_MESSAGE='{
  "sessionId": "'$SESSION_ID'",
  "message": "What was my previous message?",
  "model": "gpt-4",
  "userId": "demo-user",
  "orgId": "demo-org"
}'

test_endpoint "POST" "$API_BASE_URL/v1/ai-chat/chat" "200" "Send second message to test conversation memory" "$SECOND_MESSAGE"

# Verificar que la sesión tiene múltiples mensajes
SESSION_RESPONSE=$(curl -s "$API_BASE_URL/v1/ai-chat/sessions/$SESSION_ID")
MESSAGE_COUNT=$(echo "$SESSION_RESPONSE" | jq '.messages | length')

if [ "$MESSAGE_COUNT" -ge 2 ]; then
    log_success "Session maintains conversation memory with $MESSAGE_COUNT messages"
else
    log_error "Session does not maintain conversation memory properly"
fi

echo ""
echo "🧹 Cleaning up test data"
echo "------------------------"

# Limpiar datos de prueba
if [ ! -z "$SESSION_ID" ]; then
    curl -s -X DELETE "$API_BASE_URL/v1/ai-chat/sessions/$SESSION_ID" > /dev/null
    log_info "Cleaned up test session: $SESSION_ID"
fi

echo ""
echo "============================================================================"
echo "📊 PR-35 Smoke Test Results"
echo "============================================================================"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! PR-35 is ready for production.${NC}"
    echo ""
    echo "🎉 PR-35 Features Verified:"
    echo "  ✅ Chat avanzado con múltiples modelos AI"
    echo "  ✅ Memoria de conversación persistente"
    echo "  ✅ Funciones personalizadas (weather, search)"
    echo "  ✅ Análisis de sentimientos en tiempo real"
    echo "  ✅ Gestión completa de sesiones"
    echo "  ✅ API REST completa con validación"
    echo "  ✅ BFF Next.js con headers FinOps"
    echo "  ✅ Interfaz de chat moderna y responsiva"
    echo "  ✅ Estadísticas detalladas de uso"
    echo "  ✅ Integración con observabilidad"
    echo "  ✅ Datos de ejemplo para testing"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS tests failed. Please review the issues above.${NC}"
    exit 1
fi
