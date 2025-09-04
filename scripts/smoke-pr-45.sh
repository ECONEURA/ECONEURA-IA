#!/bin/bash

# Smoke Test for PR-45: FinOps Panel
# Test all FinOps endpoints and functionality

set -e

echo "🧪 PR-45: FinOps Panel - Smoke Test"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
API_BASE_URL="http://localhost:4000/v1/finops"
USER_ID="test-user-45"
AUTH_HEADER="x-user-id: $USER_ID"

echo -e "\n${BLUE}Testing FinOps System Endpoints...${NC}"

# Test 1: Get Costs
echo -e "\n--- Test 1: Get Costs ---"
COSTS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/costs?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $COSTS_RESPONSE"
if echo "$COSTS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved costs"
else
  echo "❌ Failed to retrieve costs"
  exit 1
fi

# Test 2: Record Cost
echo -e "\n--- Test 2: Record Cost ---"
RECORD_COST_RESPONSE=$(curl -s -X POST "$API_BASE_URL/costs" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
        "service": "compute",
        "resource": "ec2-instance-test",
        "organizationId": "org_1",
        "amount": 25.50,
        "currency": "USD",
        "category": "compute",
        "subcategory": "ec2",
        "period": "daily",
        "metadata": {"instanceType": "t3.medium"},
        "tags": ["test", "smoke-test"]
      }')
echo "Response: $RECORD_COST_RESPONSE"
COST_ID=$(echo "$RECORD_COST_RESPONSE" | jq -r '.data.id')
if [ "$COST_ID" != "null" ]; then
  echo "✅ Successfully recorded cost. Cost ID: $COST_ID"
else
  echo "❌ Failed to record cost"
  exit 1
fi

# Test 3: Get Cost by ID
echo -e "\n--- Test 3: Get Cost by ID ---"
GET_COST_RESPONSE=$(curl -s -X GET "$API_BASE_URL/costs/$COST_ID" -H "$AUTH_HEADER")
echo "Response: $GET_COST_RESPONSE"
if echo "$GET_COST_RESPONSE" | jq -e '.data.id == "'"$COST_ID"'"' > /dev/null; then
  echo "✅ Successfully retrieved cost by ID"
else
  echo "❌ Failed to retrieve cost by ID"
  exit 1
fi

# Test 4: Get Cost Trends
echo -e "\n--- Test 4: Get Cost Trends ---"
TRENDS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/costs/trends?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $TRENDS_RESPONSE"
if echo "$TRENDS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved cost trends"
else
  echo "❌ Failed to retrieve cost trends"
  exit 1
fi

# Test 5: Get Cost Stats
echo -e "\n--- Test 5: Get Cost Stats ---"
COST_STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/costs/stats?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $COST_STATS_RESPONSE"
if echo "$COST_STATS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved cost stats"
else
  echo "❌ Failed to retrieve cost stats"
  exit 1
fi

# Test 6: Get Budgets
echo -e "\n--- Test 6: Get Budgets ---"
BUDGETS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/budgets?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $BUDGETS_RESPONSE"
if echo "$BUDGETS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved budgets"
else
  echo "❌ Failed to retrieve budgets"
  exit 1
fi

# Test 7: Create Budget
echo -e "\n--- Test 7: Create Budget ---"
CREATE_BUDGET_RESPONSE=$(curl -s -X POST "$API_BASE_URL/budgets" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
        "name": "Test Budget",
        "description": "Test budget for smoke testing",
        "organizationId": "org_1",
        "amount": 1000,
        "currency": "USD",
        "period": "monthly",
        "startDate": "2025-01-01T00:00:00Z",
        "endDate": "2025-01-31T23:59:59Z",
        "threshold": 80,
        "categories": ["compute", "storage"],
        "tags": ["test", "smoke-test"],
        "createdBy": "test-user"
      }')
echo "Response: $CREATE_BUDGET_RESPONSE"
BUDGET_ID=$(echo "$CREATE_BUDGET_RESPONSE" | jq -r '.data.id')
if [ "$BUDGET_ID" != "null" ]; then
  echo "✅ Successfully created budget. Budget ID: $BUDGET_ID"
else
  echo "❌ Failed to create budget"
  exit 1
fi

# Test 8: Get Budget by ID
echo -e "\n--- Test 8: Get Budget by ID ---"
GET_BUDGET_RESPONSE=$(curl -s -X GET "$API_BASE_URL/budgets/$BUDGET_ID" -H "$AUTH_HEADER")
echo "Response: $GET_BUDGET_RESPONSE"
if echo "$GET_BUDGET_RESPONSE" | jq -e '.data.id == "'"$BUDGET_ID"'"' > /dev/null; then
  echo "✅ Successfully retrieved budget by ID"
else
  echo "❌ Failed to retrieve budget by ID"
  exit 1
fi

# Test 9: Get Budget Status
echo -e "\n--- Test 9: Get Budget Status ---"
BUDGET_STATUS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/budgets/status?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $BUDGET_STATUS_RESPONSE"
if echo "$BUDGET_STATUS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved budget status"
else
  echo "❌ Failed to retrieve budget status"
  exit 1
fi

# Test 10: Get Budget Alerts
echo -e "\n--- Test 10: Get Budget Alerts ---"
BUDGET_ALERTS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/budgets/alerts?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $BUDGET_ALERTS_RESPONSE"
if echo "$BUDGET_ALERTS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved budget alerts"
else
  echo "❌ Failed to retrieve budget alerts"
  exit 1
fi

# Test 11: Get Optimization Recommendations
echo -e "\n--- Test 11: Get Optimization Recommendations ---"
RECOMMENDATIONS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/optimization/recommendations" -H "$AUTH_HEADER")
echo "Response: $RECOMMENDATIONS_RESPONSE"
if echo "$RECOMMENDATIONS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved optimization recommendations"
  RECOMMENDATION_ID=$(echo "$RECOMMENDATIONS_RESPONSE" | jq -r '.data.recommendations[0].id')
else
  echo "❌ Failed to retrieve optimization recommendations"
  exit 1
fi

# Test 12: Get Recommendation by ID
if [ "$RECOMMENDATION_ID" != "null" ]; then
  echo -e "\n--- Test 12: Get Recommendation by ID ---"
  GET_RECOMMENDATION_RESPONSE=$(curl -s -X GET "$API_BASE_URL/optimization/recommendations/$RECOMMENDATION_ID" -H "$AUTH_HEADER")
  echo "Response: $GET_RECOMMENDATION_RESPONSE"
  if echo "$GET_RECOMMENDATION_RESPONSE" | jq -e '.data.id == "'"$RECOMMENDATION_ID"'"' > /dev/null; then
    echo "✅ Successfully retrieved recommendation by ID"
  else
    echo "❌ Failed to retrieve recommendation by ID"
    exit 1
  fi
fi

# Test 13: Get Optimizations
echo -e "\n--- Test 13: Get Optimizations ---"
OPTIMIZATIONS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/optimization/optimizations" -H "$AUTH_HEADER")
echo "Response: $OPTIMIZATIONS_RESPONSE"
if echo "$OPTIMIZATIONS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved optimizations"
else
  echo "❌ Failed to retrieve optimizations"
  exit 1
fi

# Test 14: Get Optimization Stats
echo -e "\n--- Test 14: Get Optimization Stats ---"
OPTIMIZATION_STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/optimization/stats" -H "$AUTH_HEADER")
echo "Response: $OPTIMIZATION_STATS_RESPONSE"
if echo "$OPTIMIZATION_STATS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved optimization stats"
else
  echo "❌ Failed to retrieve optimization stats"
  exit 1
fi

# Test 15: Get Reports
echo -e "\n--- Test 15: Get Reports ---"
REPORTS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/reports?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $REPORTS_RESPONSE"
if echo "$REPORTS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved reports"
else
  echo "❌ Failed to retrieve reports"
  exit 1
fi

# Test 16: Generate Report
echo -e "\n--- Test 16: Generate Report ---"
GENERATE_REPORT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/reports" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
        "name": "Test FinOps Report",
        "type": "executive",
        "organizationId": "org_1",
        "period": {
          "start": "2025-01-01T00:00:00Z",
          "end": "2025-01-31T23:59:59Z"
        },
        "format": "json",
        "generatedBy": "test-user"
      }')
echo "Response: $GENERATE_REPORT_RESPONSE"
REPORT_ID=$(echo "$GENERATE_REPORT_RESPONSE" | jq -r '.data.id')
if [ "$REPORT_ID" != "null" ]; then
  echo "✅ Successfully generated report. Report ID: $REPORT_ID"
else
  echo "❌ Failed to generate report"
  exit 1
fi

# Test 17: Get Report by ID
if [ "$REPORT_ID" != "null" ]; then
  echo -e "\n--- Test 17: Get Report by ID ---"
  GET_REPORT_RESPONSE=$(curl -s -X GET "$API_BASE_URL/reports/$REPORT_ID" -H "$AUTH_HEADER")
  echo "Response: $GET_REPORT_RESPONSE"
  if echo "$GET_REPORT_RESPONSE" | jq -e '.data.id == "'"$REPORT_ID"'"' > /dev/null; then
    echo "✅ Successfully retrieved report by ID"
  else
    echo "❌ Failed to retrieve report by ID"
    exit 1
  fi
fi

# Test 18: Get Forecasts
echo -e "\n--- Test 18: Get Forecasts ---"
FORECASTS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/forecasts?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $FORECASTS_RESPONSE"
if echo "$FORECASTS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved forecasts"
else
  echo "❌ Failed to retrieve forecasts"
  exit 1
fi

# Test 19: Generate Forecast
echo -e "\n--- Test 19: Generate Forecast ---"
GENERATE_FORECAST_RESPONSE=$(curl -s -X POST "$API_BASE_URL/forecasts" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
        "organizationId": "org_1",
        "period": {
          "start": "2025-02-01T00:00:00Z",
          "end": "2025-02-28T23:59:59Z"
        },
        "model": "linear"
      }')
echo "Response: $GENERATE_FORECAST_RESPONSE"
if echo "$GENERATE_FORECAST_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully generated forecast"
else
  echo "❌ Failed to generate forecast"
  exit 1
fi

# Test 20: Get FinOps Metrics
echo -e "\n--- Test 20: Get FinOps Metrics ---"
METRICS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/metrics?organizationId=org_1" -H "$AUTH_HEADER")
echo "Response: $METRICS_RESPONSE"
if echo "$METRICS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved FinOps metrics"
else
  echo "❌ Failed to retrieve FinOps metrics"
  exit 1
fi

# Test 21: Get FinOps Stats
echo -e "\n--- Test 21: Get FinOps Stats ---"
STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/stats" -H "$AUTH_HEADER")
echo "Response: $STATS_RESPONSE"
if echo "$STATS_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ Successfully retrieved FinOps stats"
else
  echo "❌ Failed to retrieve FinOps stats"
  exit 1
fi

echo -e "\n================================================"
echo "🎉 All PR-45 FinOps Smoke Tests Completed!"
echo "================================================"
echo -e "${GREEN}✅ FinOps System is fully operational${NC}"
echo -e "${BLUE}💰 Cost tracking: Working${NC}"
echo -e "${BLUE}📊 Budget management: Working${NC}"
echo -e "${BLUE}🔧 Cost optimization: Working${NC}"
echo -e "${BLUE}📈 Reporting & analytics: Working${NC}"
echo -e "${BLUE}📋 Metrics & stats: Working${NC}"
echo -e "\n${GREEN}RESULTADO: PASS${NC}"
