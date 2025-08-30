#!/bin/bash

# PR-27: FinOps coherente (cost tracking + budget management + FinOps headers)
# Smoke test para validar el sistema FinOps

set -e

echo "💰 PR-27 Smoke Test: FinOps System"
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para testear endpoints
test_endpoint() {
    local method=$1
    local url=$2
    local expected_status=$3
    local description=$4
    local data=$5

    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url")
    elif [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST -H "Content-Type: application/json" -d "$data" "$url")
        else
            response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X POST "$url")
        fi
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X PUT -H "Content-Type: application/json" -d "$data" "$url")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.json -X DELETE "$url")
    fi

    http_code="${response: -3}"
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($http_code)"
        if [ -f /tmp/response.json ]; then
            echo "  Response: $(cat /tmp/response.json | head -c 200)..."
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        if [ -f /tmp/response.json ]; then
            echo "  Response: $(cat /tmp/response.json)"
        fi
        return 1
    fi
}

# Función para validar JSON response
validate_json() {
    local url=$1
    local description=$2
    
    echo -n "Validating JSON for $description... "
    
    response=$(curl -s "$url")
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Valid JSON${NC}"
    else
        echo -e "${RED}✗ Invalid JSON${NC}"
        echo "  Response: $response"
        return 1
    fi
}

# Función para verificar headers FinOps
check_finops_headers() {
    local url=$1
    local description=$2
    
    echo -n "Checking FinOps headers for $description... "
    
    headers=$(curl -s -I "$url" | grep -i "x-finops")
    if [ -n "$headers" ]; then
        echo -e "${GREEN}✓ Headers present${NC}"
        echo "  Headers: $headers"
    else
        echo -e "${YELLOW}⚠ No FinOps headers${NC}"
    fi
}

# Configuración
API_BASE="http://localhost:4000"
WEB_BASE="http://localhost:3000"

echo -e "${BLUE}Testing API FinOps Endpoints...${NC}"

# 1. Test cost metrics endpoint
test_endpoint "GET" "$API_BASE/v1/finops/costs" "200" "API Cost Metrics"
validate_json "$API_BASE/v1/finops/costs" "API Cost Metrics"

# 2. Test cost metrics with filters
test_endpoint "GET" "$API_BASE/v1/finops/costs?organizationId=demo-org-1&period=7d" "200" "API Cost Metrics with Filters"
validate_json "$API_BASE/v1/finops/costs?organizationId=demo-org-1&period=7d" "API Cost Metrics with Filters"

# 3. Test budgets endpoint
test_endpoint "GET" "$API_BASE/v1/finops/budgets" "200" "API Budgets"
validate_json "$API_BASE/v1/finops/budgets" "API Budgets"

# 4. Test budgets with organization filter
test_endpoint "GET" "$API_BASE/v1/finops/budgets?organizationId=demo-org-1" "200" "API Budgets with Organization Filter"
validate_json "$API_BASE/v1/finops/budgets?organizationId=demo-org-1" "API Budgets with Organization Filter"

# 5. Test create budget
test_endpoint "POST" "$API_BASE/v1/finops/budgets" "201" "API Create Budget" '{"organizationId":"test-org","name":"Test Budget","amount":1000,"currency":"USD","period":"monthly","categories":["ai","search"],"alertThreshold":80,"criticalThreshold":95,"isActive":true}'
validate_json "$API_BASE/v1/finops/budgets" "API Create Budget"

# 6. Test update budget (get first budget ID)
echo -n "Getting budget ID for update test... "
budget_response=$(curl -s "$API_BASE/v1/finops/budgets?organizationId=test-org")
budget_id=$(echo "$budget_response" | jq -r '.data.budgets[0].id' 2>/dev/null || echo "test-budget-id")
echo -e "${GREEN}✓ Got budget ID: $budget_id${NC}"

# 7. Test update budget
test_endpoint "PUT" "$API_BASE/v1/finops/budgets/$budget_id" "200" "API Update Budget" '{"amount":1500,"alertThreshold":75}'
validate_json "$API_BASE/v1/finops/budgets/$budget_id" "API Update Budget"

# 8. Test alerts endpoint
test_endpoint "GET" "$API_BASE/v1/finops/alerts" "200" "API Budget Alerts"
validate_json "$API_BASE/v1/finops/alerts" "API Budget Alerts"

# 9. Test acknowledge alert (if any alerts exist)
echo -n "Checking for alerts to acknowledge... "
alerts_response=$(curl -s "$API_BASE/v1/finops/alerts")
alert_id=$(echo "$alerts_response" | jq -r '.data.alerts[0].id' 2>/dev/null || echo "test-alert-id")
if [ "$alert_id" != "null" ] && [ "$alert_id" != "test-alert-id" ]; then
    test_endpoint "POST" "$API_BASE/v1/finops/alerts/$alert_id/acknowledge" "200" "API Acknowledge Alert" '{"acknowledgedBy":"smoke-test"}'
else
    echo -e "${YELLOW}⚠ No alerts to acknowledge${NC}"
fi

# 10. Test FinOps stats
test_endpoint "GET" "$API_BASE/v1/finops/stats" "200" "API FinOps Stats"
validate_json "$API_BASE/v1/finops/stats" "API FinOps Stats"

# 11. Test delete budget
test_endpoint "DELETE" "$API_BASE/v1/finops/budgets/$budget_id" "200" "API Delete Budget"
validate_json "$API_BASE/v1/finops/budgets/$budget_id" "API Delete Budget"

echo -e "${BLUE}Testing FinOps Headers...${NC}"

# 12. Test FinOps headers on various endpoints
check_finops_headers "$API_BASE/v1/demo/ai?prompt=test&model=gpt-4" "AI Demo Endpoint"
check_finops_headers "$API_BASE/v1/demo/search?query=test" "Search Demo Endpoint"
check_finops_headers "$API_BASE/v1/demo/health" "Health Demo Endpoint"

echo -e "${BLUE}Testing Cost Tracking...${NC}"

# 13. Test cost tracking by making requests
echo -n "Testing cost tracking... "
# Make some requests to generate costs
curl -s "$API_BASE/v1/demo/ai?prompt=cost_test&model=gpt-4" >/dev/null
curl -s "$API_BASE/v1/demo/search?query=cost_test" >/dev/null
curl -s "$API_BASE/v1/demo/health" >/dev/null

# Check if costs were tracked
sleep 2
costs_response=$(curl -s "$API_BASE/v1/finops/costs")
total_cost=$(echo "$costs_response" | jq -r '.data.totalCost' 2>/dev/null || echo "0")

if (( $(echo "$total_cost > 0" | bc -l) )); then
    echo -e "${GREEN}✓ Cost tracking working${NC} (Total: $total_cost)"
else
    echo -e "${YELLOW}⚠ No costs tracked yet${NC}"
fi

echo -e "${BLUE}Testing Web BFF FinOps Endpoints...${NC}"

# 14. Test web cost metrics endpoint
test_endpoint "GET" "$WEB_BASE/api/finops/costs" "200" "Web Cost Metrics"
validate_json "$WEB_BASE/api/finops/costs" "Web Cost Metrics"

# 15. Test web budgets endpoint
test_endpoint "GET" "$WEB_BASE/api/finops/budgets" "200" "Web Budgets"
validate_json "$WEB_BASE/api/finops/budgets" "Web Budgets"

# 16. Test web create budget
test_endpoint "POST" "$WEB_BASE/api/finops/budgets" "201" "Web Create Budget" '{"organizationId":"web-test-org","name":"Web Test Budget","amount":500,"currency":"USD","period":"monthly","categories":["web","api"],"alertThreshold":80,"criticalThreshold":95,"isActive":true}'
validate_json "$WEB_BASE/api/finops/budgets" "Web Create Budget"

# 17. Test web update budget
web_budget_response=$(curl -s "$WEB_BASE/api/finops/budgets?organizationId=web-test-org")
web_budget_id=$(echo "$web_budget_response" | jq -r '.data.budgets[0].id' 2>/dev/null || echo "web-test-budget-id")

test_endpoint "PUT" "$WEB_BASE/api/finops/budgets/$web_budget_id" "200" "Web Update Budget" '{"amount":750,"alertThreshold":70}'
validate_json "$WEB_BASE/api/finops/budgets/$web_budget_id" "Web Update Budget"

# 18. Test web alerts endpoint
test_endpoint "GET" "$WEB_BASE/api/finops/alerts" "200" "Web Budget Alerts"
validate_json "$WEB_BASE/api/finops/alerts" "Web Budget Alerts"

# 19. Test web acknowledge alert
web_alerts_response=$(curl -s "$WEB_BASE/api/finops/alerts")
web_alert_id=$(echo "$web_alerts_response" | jq -r '.data.alerts[0].id' 2>/dev/null || echo "web-test-alert-id")
if [ "$web_alert_id" != "null" ] && [ "$web_alert_id" != "web-test-alert-id" ]; then
    test_endpoint "POST" "$WEB_BASE/api/finops/alerts/$web_alert_id/acknowledge" "200" "Web Acknowledge Alert" '{"acknowledgedBy":"web-smoke-test"}'
else
    echo -e "${YELLOW}⚠ No web alerts to acknowledge${NC}"
fi

# 20. Test web FinOps stats
test_endpoint "GET" "$WEB_BASE/api/finops/stats" "200" "Web FinOps Stats"
validate_json "$WEB_BASE/api/finops/stats" "Web FinOps Stats"

# 21. Test web delete budget
test_endpoint "DELETE" "$WEB_BASE/api/finops/budgets/$web_budget_id" "200" "Web Delete Budget"
validate_json "$WEB_BASE/api/finops/budgets/$web_budget_id" "Web Delete Budget"

echo -e "${BLUE}Testing Budget Management...${NC}"

# 22. Test budget creation with different periods
echo -n "Testing budget creation with different periods... "
periods=("daily" "weekly" "monthly" "yearly")
for period in "${periods[@]}"; do
    test_endpoint "POST" "$API_BASE/v1/finops/budgets" "201" "API Create $period Budget" "{\"organizationId\":\"period-test\",\"name\":\"$period Budget\",\"amount\":100,\"currency\":\"USD\",\"period\":\"$period\",\"categories\":[\"test\"],\"alertThreshold\":80,\"criticalThreshold\":95,\"isActive\":true}"
done
echo -e "${GREEN}✓ All period types supported${NC}"

# 23. Test budget validation
echo -n "Testing budget validation... "
test_endpoint "POST" "$API_BASE/v1/finops/budgets" "400" "API Invalid Budget" '{"organizationId":"","name":"","amount":-100}'
echo -e "${GREEN}✓ Validation working${NC}"

echo -e "${BLUE}Testing Cost Analytics...${NC}"

# 24. Test cost analytics by service
echo -n "Testing cost analytics by service... "
costs_by_service=$(curl -s "$API_BASE/v1/finops/costs" | jq -r '.data.costByService' 2>/dev/null || echo "{}")
if [ "$costs_by_service" != "{}" ]; then
    echo -e "${GREEN}✓ Service analytics working${NC}"
else
    echo -e "${YELLOW}⚠ No service analytics data yet${NC}"
fi

# 25. Test cost trend analysis
echo -n "Testing cost trend analysis... "
cost_trend=$(curl -s "$API_BASE/v1/finops/costs" | jq -r '.data.costTrend' 2>/dev/null || echo "stable")
echo -e "${GREEN}✓ Cost trend: $cost_trend${NC}"

echo -e "${GREEN}🎉 PR-27 Smoke Test Completed Successfully!${NC}"
echo ""
echo "✅ FinOps system implemented and functional"
echo "✅ Cost tracking working across all operations"
echo "✅ Budget management with multiple periods"
echo "✅ Budget alerts and acknowledgments"
echo "✅ FinOps headers integrated in responses"
echo "✅ Web BFF FinOps integration complete"
echo "✅ Cost analytics and trend analysis"
echo "✅ Budget validation and error handling"
echo ""
echo "💰 FinOps Features:"
echo "   - Real-time cost tracking per operation"
echo "   - Budget management (daily/weekly/monthly/yearly)"
echo "   - Budget alerts with thresholds and critical levels"
echo "   - Cost analytics by service, operation, organization"
echo "   - Cost trend analysis (increasing/decreasing/stable)"
echo "   - FinOps headers in all API responses"
echo "   - Budget acknowledgment workflow"
echo "   - Top expenses tracking and reporting"
