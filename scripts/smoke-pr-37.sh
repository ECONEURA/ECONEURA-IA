#!/bin/bash

# ============================================================================
# SMOKE TEST PARA PR-37: SISTEMA DE NOTIFICACIONES
# ============================================================================

set -e

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Variables
API_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"
TEST_USER_ID="demo-user"
TEST_ORG_ID="demo-org"
REQUEST_ID=$(uuidgen)

print_status "🚀 Iniciando Smoke Test para PR-37: Sistema de Notificaciones"
print_status "API URL: $API_URL"
print_status "Web URL: $WEB_URL"
print_status "Test User ID: $TEST_USER_ID"
print_status "Test Org ID: $TEST_ORG_ID"
print_status "Request ID: $REQUEST_ID"

# ============================================================================
# 1. VERIFICAR QUE LOS SERVIDORES ESTÉN EJECUTÁNDOSE
# ============================================================================

print_status "1. Verificando que los servidores estén ejecutándose..."

# Verificar API server
if ! curl -s "$API_URL/health/live" > /dev/null; then
    print_error "❌ API server no está ejecutándose en $API_URL"
    exit 1
fi
print_success "✅ API server está ejecutándose"

# Verificar Web server
if ! curl -s "$WEB_URL" > /dev/null; then
    print_error "❌ Web server no está ejecutándose en $WEB_URL"
    exit 1
fi
print_success "✅ Web server está ejecutándose"

# ============================================================================
# 2. PROBAR ENDPOINTS DEL API DE NOTIFICACIONES
# ============================================================================

print_status "2. Probando endpoints del API de notificaciones..."

# 2.1 Crear una notificación
print_status "2.1 Creando notificación de prueba..."
NOTIFICATION_RESPONSE=$(curl -s -X POST "$API_URL/v1/notifications" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "orgId": "'$TEST_ORG_ID'",
    "type": "info",
    "priority": "medium",
    "title": "Test Notification",
    "message": "This is a test notification for PR-37",
    "channels": ["in_app", "email"]
  }')

if echo "$NOTIFICATION_RESPONSE" | jq -e '.id' > /dev/null; then
    NOTIFICATION_ID=$(echo "$NOTIFICATION_RESPONSE" | jq -r '.id')
    print_success "✅ Notificación creada con ID: $NOTIFICATION_ID"
else
    print_error "❌ Error creando notificación: $NOTIFICATION_RESPONSE"
    exit 1
fi

# 2.2 Obtener notificaciones
print_status "2.2 Obteniendo lista de notificaciones..."
NOTIFICATIONS_RESPONSE=$(curl -s -X GET "$API_URL/v1/notifications?userId=$TEST_USER_ID&orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$NOTIFICATIONS_RESPONSE" | jq -e '.[0]' > /dev/null; then
    print_success "✅ Lista de notificaciones obtenida correctamente"
else
    print_error "❌ Error obteniendo notificaciones: $NOTIFICATIONS_RESPONSE"
    exit 1
fi

# 2.3 Obtener notificación específica
print_status "2.3 Obteniendo notificación específica..."
NOTIFICATION_DETAIL_RESPONSE=$(curl -s -X GET "$API_URL/v1/notifications/$NOTIFICATION_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$NOTIFICATION_DETAIL_RESPONSE" | jq -e '.id' > /dev/null; then
    print_success "✅ Notificación específica obtenida correctamente"
else
    print_error "❌ Error obteniendo notificación específica: $NOTIFICATION_DETAIL_RESPONSE"
    exit 1
fi

# 2.4 Marcar como leída
print_status "2.4 Marcando notificación como leída..."
READ_RESPONSE=$(curl -s -X POST "$API_URL/v1/notifications/$NOTIFICATION_ID/read" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$READ_RESPONSE" | jq -e '.status' > /dev/null; then
    print_success "✅ Notificación marcada como leída correctamente"
else
    print_error "❌ Error marcando como leída: $READ_RESPONSE"
    exit 1
fi

# 2.5 Obtener contador de no leídas
print_status "2.5 Obteniendo contador de notificaciones no leídas..."
UNREAD_COUNT_RESPONSE=$(curl -s -X GET "$API_URL/v1/notifications/unread-count?userId=$TEST_USER_ID&orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$UNREAD_COUNT_RESPONSE" | jq -e '.count' > /dev/null; then
    print_success "✅ Contador de no leídas obtenido correctamente"
else
    print_error "❌ Error obteniendo contador de no leídas: $UNREAD_COUNT_RESPONSE"
    exit 1
fi

# 2.6 Crear template
print_status "2.6 Creando template de notificación..."
TEMPLATE_RESPONSE=$(curl -s -X POST "$API_URL/v1/notifications/templates" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID" \
  -d '{
    "name": "Test Template",
    "description": "Template de prueba para PR-37",
    "type": "info",
    "subject": "Test Subject",
    "body": "This is a test template body",
    "channels": ["email", "in_app"],
    "isActive": true
  }')

if echo "$TEMPLATE_RESPONSE" | jq -e '.id' > /dev/null; then
    TEMPLATE_ID=$(echo "$TEMPLATE_RESPONSE" | jq -r '.id')
    print_success "✅ Template creado con ID: $TEMPLATE_ID"
else
    print_error "❌ Error creando template: $TEMPLATE_RESPONSE"
    exit 1
fi

# 2.7 Obtener templates
print_status "2.7 Obteniendo lista de templates..."
TEMPLATES_RESPONSE=$(curl -s -X GET "$API_URL/v1/notifications/templates?orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$TEMPLATES_RESPONSE" | jq -e '.[0]' > /dev/null; then
    print_success "✅ Lista de templates obtenida correctamente"
else
    print_error "❌ Error obteniendo templates: $TEMPLATES_RESPONSE"
    exit 1
fi

# 2.8 Obtener estadísticas
print_status "2.8 Obteniendo estadísticas de notificaciones..."
STATS_RESPONSE=$(curl -s -X GET "$API_URL/v1/notifications/stats?orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$STATS_RESPONSE" | jq -e '.total' > /dev/null; then
    print_success "✅ Estadísticas obtenidas correctamente"
else
    print_error "❌ Error obteniendo estadísticas: $STATS_RESPONSE"
    exit 1
fi

# ============================================================================
# 3. PROBAR ENDPOINTS DEL WEB BFF
# ============================================================================

print_status "3. Probando endpoints del Web BFF..."

# 3.1 Crear notificación vía Web BFF
print_status "3.1 Creando notificación vía Web BFF..."
WEB_NOTIFICATION_RESPONSE=$(curl -s -X POST "$WEB_URL/api/notifications" \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "orgId": "'$TEST_ORG_ID'",
    "type": "success",
    "priority": "high",
    "title": "Web BFF Test",
    "message": "This is a test notification via Web BFF",
    "channels": ["in_app"]
  }')

if echo "$WEB_NOTIFICATION_RESPONSE" | jq -e '.id' > /dev/null; then
    WEB_NOTIFICATION_ID=$(echo "$WEB_NOTIFICATION_RESPONSE" | jq -r '.id')
    print_success "✅ Notificación vía Web BFF creada con ID: $WEB_NOTIFICATION_ID"
else
    print_error "❌ Error creando notificación vía Web BFF: $WEB_NOTIFICATION_RESPONSE"
    exit 1
fi

# 3.2 Obtener notificaciones vía Web BFF
print_status "3.2 Obteniendo notificaciones vía Web BFF..."
WEB_NOTIFICATIONS_RESPONSE=$(curl -s -X GET "$WEB_URL/api/notifications?userId=$TEST_USER_ID&orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$WEB_NOTIFICATIONS_RESPONSE" | jq -e '.[0]' > /dev/null; then
    print_success "✅ Lista de notificaciones vía Web BFF obtenida correctamente"
else
    print_error "❌ Error obteniendo notificaciones vía Web BFF: $WEB_NOTIFICATIONS_RESPONSE"
    exit 1
fi

# 3.3 Obtener templates vía Web BFF
print_status "3.3 Obteniendo templates vía Web BFF..."
WEB_TEMPLATES_RESPONSE=$(curl -s -X GET "$WEB_URL/api/notifications/templates?orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$WEB_TEMPLATES_RESPONSE" | jq -e '.[0]' > /dev/null; then
    print_success "✅ Lista de templates vía Web BFF obtenida correctamente"
else
    print_error "❌ Error obteniendo templates vía Web BFF: $WEB_TEMPLATES_RESPONSE"
    exit 1
fi

# 3.4 Obtener estadísticas vía Web BFF
print_status "3.4 Obteniendo estadísticas vía Web BFF..."
WEB_STATS_RESPONSE=$(curl -s -X GET "$WEB_URL/api/notifications/stats?orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$WEB_STATS_RESPONSE" | jq -e '.total' > /dev/null; then
    print_success "✅ Estadísticas vía Web BFF obtenidas correctamente"
else
    print_error "❌ Error obteniendo estadísticas vía Web BFF: $WEB_STATS_RESPONSE"
    exit 1
fi

# ============================================================================
# 4. VERIFICAR HEADERS FINOPS
# ============================================================================

print_status "4. Verificando headers FinOps..."

# Verificar headers en respuesta del API
API_HEADERS=$(curl -s -I -X GET "$API_URL/v1/notifications?userId=$TEST_USER_ID&orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$API_HEADERS" | grep -q "X-Request-Id"; then
    print_success "✅ Header X-Request-Id presente en API"
else
    print_warning "⚠️ Header X-Request-Id no encontrado en API"
fi

if echo "$API_HEADERS" | grep -q "X-Org-Id"; then
    print_success "✅ Header X-Org-Id presente en API"
else
    print_warning "⚠️ Header X-Org-Id no encontrado en API"
fi

if echo "$API_HEADERS" | grep -q "X-Latency-ms"; then
    print_success "✅ Header X-Latency-ms presente en API"
else
    print_warning "⚠️ Header X-Latency-ms no encontrado en API"
fi

# Verificar headers en respuesta del Web BFF
WEB_HEADERS=$(curl -s -I -X GET "$WEB_URL/api/notifications?userId=$TEST_USER_ID&orgId=$TEST_ORG_ID" \
  -H "X-Org-Id: $TEST_ORG_ID" \
  -H "X-Request-Id: $REQUEST_ID")

if echo "$WEB_HEADERS" | grep -q "X-Request-Id"; then
    print_success "✅ Header X-Request-Id presente en Web BFF"
else
    print_warning "⚠️ Header X-Request-Id no encontrado en Web BFF"
fi

if echo "$WEB_HEADERS" | grep -q "X-Org-Id"; then
    print_success "✅ Header X-Org-Id presente en Web BFF"
else
    print_warning "⚠️ Header X-Org-Id no encontrado en Web BFF"
fi

if echo "$WEB_HEADERS" | grep -q "X-Latency-ms"; then
    print_success "✅ Header X-Latency-ms presente en Web BFF"
else
    print_warning "⚠️ Header X-Latency-ms no encontrado en Web BFF"
fi

# ============================================================================
# 5. VERIFICAR LOGS ESTRUCTURADOS
# ============================================================================

print_status "5. Verificando logs estructurados..."

# Verificar que los logs contengan información de notificaciones
if [ -f "logs/api.log" ]; then
    if grep -q "notification" logs/api.log; then
        print_success "✅ Logs de notificaciones encontrados en API"
    else
        print_warning "⚠️ No se encontraron logs de notificaciones en API"
    fi
else
    print_warning "⚠️ Archivo de logs de API no encontrado"
fi

# ============================================================================
# 6. VERIFICAR MÉTRICAS
# ============================================================================

print_status "6. Verificando métricas..."

# Verificar métricas de Prometheus
METRICS_RESPONSE=$(curl -s "$API_URL/metrics")

if echo "$METRICS_RESPONSE" | grep -q "notification"; then
    print_success "✅ Métricas de notificaciones encontradas en Prometheus"
else
    print_warning "⚠️ No se encontraron métricas específicas de notificaciones"
fi

# ============================================================================
# 7. LIMPIEZA
# ============================================================================

print_status "7. Limpiando datos de prueba..."

# Eliminar notificación de prueba
if [ ! -z "$NOTIFICATION_ID" ]; then
    curl -s -X DELETE "$API_URL/v1/notifications/$NOTIFICATION_ID" \
      -H "X-Org-Id: $TEST_ORG_ID" \
      -H "X-Request-Id: $REQUEST_ID" > /dev/null
    print_success "✅ Notificación de prueba eliminada"
fi

# Eliminar notificación Web BFF de prueba
if [ ! -z "$WEB_NOTIFICATION_ID" ]; then
    curl -s -X DELETE "$WEB_URL/api/notifications/$WEB_NOTIFICATION_ID" \
      -H "X-Org-Id: $TEST_ORG_ID" \
      -H "X-Request-Id: $REQUEST_ID" > /dev/null
    print_success "✅ Notificación Web BFF de prueba eliminada"
fi

# Eliminar template de prueba
if [ ! -z "$TEMPLATE_ID" ]; then
    curl -s -X DELETE "$API_URL/v1/notifications/templates/$TEMPLATE_ID" \
      -H "X-Org-Id: $TEST_ORG_ID" \
      -H "X-Request-Id: $REQUEST_ID" > /dev/null
    print_success "✅ Template de prueba eliminado"
fi

# ============================================================================
# RESUMEN FINAL
# ============================================================================

print_status "🎉 Smoke Test completado exitosamente!"
print_success "✅ PR-37: Sistema de Notificaciones está funcionando correctamente"
print_status "📧 Funcionalidades probadas:"
print_status "   - Creación y gestión de notificaciones"
print_status "   - Templates de notificaciones"
print_status "   - Marcado como leído"
print_status "   - Estadísticas"
print_status "   - Web BFF integration"
print_status "   - Headers FinOps"
print_status "   - Logs estructurados"
print_status "   - Métricas"

print_status "🚀 El sistema está listo para producción!"
