#!/bin/bash

# ============================================================================
# PR-48 Advanced Analytics & Business Intelligence System - Smoke Tests
# ============================================================================

set -e

echo "📊 Starting PR-48 Advanced Analytics & BI System Smoke Tests"
echo "============================================================="

# Configuration
API_BASE_URL="http://localhost:4000"
ORGANIZATION_ID="org_1"
USER_ID="user_1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local method="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "x-organization-id: $ORGANIZATION_ID" -H "x-user-id: $USER_ID" "$API_BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -H "x-organization-id: $ORGANIZATION_ID" -H "x-user-id: $USER_ID" -X POST -d "$data" "$API_BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -H "x-organization-id: $ORGANIZATION_ID" -H "x-user-id: $USER_ID" -X PUT -d "$data" "$API_BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "x-organization-id: $ORGANIZATION_ID" -H "x-user-id: $USER_ID" -X DELETE "$API_BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all but last line)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} - Status: $status_code"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} - Expected: $expected_status, Got: $status_code"
        echo -e "${RED}Response: $response_body${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Function to run a test with JSON validation
run_test_with_json() {
    local test_name="$1"
    local endpoint="$2"
    local method="$3"
    local data="$4"
    local expected_status="$5"
    local json_field="$6"
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "x-organization-id: $ORGANIZATION_ID" -H "x-user-id: $USER_ID" "$API_BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -H "x-organization-id: $ORGANIZATION_ID" -H "x-user-id: $USER_ID" -X POST -d "$data" "$API_BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all but last line)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        # Check if JSON field exists
        if echo "$response_body" | jq -e ".$json_field" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PASSED${NC} - Status: $status_code, JSON field '$json_field' present"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC} - Status: $status_code, but JSON field '$json_field' missing"
            echo -e "${RED}Response: $response_body${NC}"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "${RED}✗ FAILED${NC} - Expected: $expected_status, Got: $status_code"
        echo -e "${RED}Response: $response_body${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

echo -e "${YELLOW}1. Testing Advanced Analytics System${NC}"
echo "====================================="

# Test analytics metrics list
run_test_with_json "Get analytics metrics" "/v1/analytics/metrics" "GET" "" "200" "success"

# Test create analytics metric
analytics_metric='{
    "name": "Revenue Growth",
    "type": "financial",
    "unit": "%",
    "category": "revenue",
    "source": "crm",
    "tags": ["growth", "revenue"],
    "metadata": {
        "description": "Monthly revenue growth percentage"
    }
}'
run_test_with_json "Create analytics metric" "/v1/analytics/metrics" "POST" "$analytics_metric" "201" "data"

# Test get specific analytics metric
run_test_with_json "Get specific analytics metric" "/v1/analytics/metrics/1" "GET" "" "200" "success"

# Test record metric value
record_metric='{
    "value": 15.5,
    "metadata": {
        "period": "2024-01",
        "source": "sales_system"
    }
}'
run_test "Record metric value" "/v1/analytics/metrics/1/record" "POST" "$record_metric" "200"

# Test trend analysis
run_test_with_json "Get trend analysis" "/v1/analytics/trends/1" "GET" "" "200" "success"

# Test anomalies detection
run_test_with_json "Get anomalies" "/v1/analytics/anomalies" "GET" "" "200" "success"

# Test analytics query
analytics_query='{
    "metrics": ["1"],
    "filters": [],
    "timeRange": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-12-31T23:59:59Z"
    },
    "aggregation": "avg"
}'
run_test_with_json "Execute analytics query" "/v1/analytics/query" "POST" "$analytics_query" "200" "success"

echo -e "${YELLOW}2. Testing Business Intelligence System${NC}"
echo "=========================================="

# Test KPI list
run_test_with_json "Get KPIs" "/v1/bi/kpis" "GET" "" "200" "success"

# Test create KPI
kpi_data='{
    "name": "Customer Satisfaction",
    "description": "Overall customer satisfaction score",
    "type": "customer",
    "category": "satisfaction",
    "unit": "/5",
    "targetValue": 4.5,
    "formula": "avg(customer_ratings)",
    "dataSource": "survey_system",
    "frequency": "weekly",
    "owner": "customer_success",
    "stakeholders": ["customer_success", "product"]
}'
run_test_with_json "Create KPI" "/v1/bi/kpis" "POST" "$kpi_data" "201" "data"

# Test get specific KPI
run_test_with_json "Get specific KPI" "/v1/bi/kpis/1" "GET" "" "200" "success"

# Test update KPI value
update_kpi_value='{
    "value": 4.2
}'
run_test_with_json "Update KPI value" "/v1/bi/kpis/1/update-value" "POST" "$update_kpi_value" "200" "data"

# Test business intelligence insights
run_test_with_json "Get business intelligence insights" "/v1/bi/insights" "GET" "" "200" "success"

# Test risk factors
run_test_with_json "Get risk factors" "/v1/bi/risks" "GET" "" "200" "success"

# Test opportunities
run_test_with_json "Get opportunities" "/v1/bi/opportunities" "GET" "" "200" "success"

# Test competitive analysis
competitive_analysis='{
    "organizationId": "'$ORGANIZATION_ID'",
    "competitors": ["competitor1", "competitor2"]
}'
run_test_with_json "Perform competitive analysis" "/v1/bi/competitive-analysis" "POST" "$competitive_analysis" "201" "data"

# Test ROI analysis
roi_analysis='{
    "organizationId": "'$ORGANIZATION_ID'",
    "initiatives": [
        {
            "name": "Marketing Campaign",
            "investment": 100000,
            "expectedReturns": 150000,
            "timeframe": "6 months"
        }
    ]
}'
run_test_with_json "Perform ROI analysis" "/v1/bi/roi-analysis" "POST" "$roi_analysis" "201" "data"

# Test benchmarking
run_test_with_json "Perform benchmarking" "/v1/bi/benchmarking" "GET" "" "200" "success"

# Test strategic insights
run_test_with_json "Get strategic insights" "/v1/bi/strategic-insights" "GET" "" "200" "success"

echo -e "${YELLOW}3. Testing Intelligent Reporting System${NC}"
echo "=========================================="

# Test reports list
run_test_with_json "Get reports" "/v1/reports" "GET" "" "200" "success"

# Test report templates
run_test_with_json "Get report templates" "/v1/reports/templates" "GET" "" "200" "success"

# Test create report
report_data='{
    "name": "Monthly Executive Report",
    "description": "Monthly executive summary report",
    "type": "executive",
    "template": "executive_summary",
    "data": [
        {
            "metricId": "revenue",
            "metricName": "Revenue",
            "unit": "USD",
            "visualization": {
                "type": "line",
                "title": "Revenue Trend",
                "colors": ["#3B82F6"]
            }
        }
    ],
    "filters": [],
    "recipients": ["executives"],
    "format": "pdf",
    "isPublic": false
}'
run_test_with_json "Create report" "/v1/reports" "POST" "$report_data" "201" "data"

# Test get specific report
run_test_with_json "Get specific report" "/v1/reports/1" "GET" "" "200" "success"

# Test generate report
generate_report='{
    "parameters": {
        "period": "2024-01",
        "includeCharts": true
    }
}'
run_test_with_json "Generate report" "/v1/reports/1/generate" "POST" "$generate_report" "201" "data"

# Test report export
run_test_with_json "Export report" "/v1/reports/1/export" "GET" "" "200" "success"

# Test report generations
run_test_with_json "Get report generations" "/v1/reports/1/generations" "GET" "" "200" "success"

# Test report analytics
run_test_with_json "Get report analytics" "/v1/reports/analytics" "GET" "" "200" "success"

echo -e "${YELLOW}4. Testing Executive Dashboard System${NC}"
echo "=========================================="

# Test executive dashboard
run_test_with_json "Get executive dashboard" "/v1/dashboard/executive" "GET" "" "200" "success"

# Test dashboards list
run_test_with_json "Get dashboards" "/v1/dashboards" "GET" "" "200" "success"

# Test create dashboard
dashboard_data='{
    "name": "Custom Analytics Dashboard",
    "description": "Custom dashboard for analytics",
    "type": "analytical",
    "layout": {
        "columns": 4,
        "rows": 3,
        "gridSize": 12,
        "responsive": true
    },
    "widgets": [
        {
            "type": "kpi",
            "title": "Revenue",
            "position": {
                "x": 0,
                "y": 0,
                "width": 3,
                "height": 2
            },
            "config": {
                "metricId": "revenue",
                "thresholds": [
                    {
                        "value": 1000000,
                        "color": "#10B981",
                        "label": "Target",
                        "operator": "greater_than"
                    }
                ]
            },
            "refreshInterval": 30000,
            "isVisible": true
        }
    ],
    "filters": [],
    "isPublic": false,
    "refreshInterval": 30000
}'
run_test_with_json "Create dashboard" "/v1/dashboards" "POST" "$dashboard_data" "201" "data"

# Test get specific dashboard
run_test_with_json "Get specific dashboard" "/v1/dashboards/1" "GET" "" "200" "success"

# Test dashboard alerts
run_test_with_json "Get dashboard alerts" "/v1/dashboards/1/alerts" "GET" "" "200" "success"

# Test critical alerts
run_test_with_json "Get critical alerts" "/v1/dashboard/alerts/critical" "GET" "" "200" "success"

# Test dashboard performance
run_test_with_json "Get dashboard performance" "/v1/dashboard/performance" "GET" "" "200" "success"

# Test dashboard analytics
run_test_with_json "Get dashboard analytics" "/v1/dashboard/analytics" "GET" "" "200" "success"

echo -e "${YELLOW}5. Testing Error Handling${NC}"
echo "=========================="

# Test 404 for non-existent metric
run_test "Get non-existent analytics metric" "/v1/analytics/metrics/999" "GET" "" "404"

# Test 404 for non-existent KPI
run_test "Get non-existent KPI" "/v1/bi/kpis/999" "GET" "" "404"

# Test 404 for non-existent report
run_test "Get non-existent report" "/v1/reports/999" "GET" "" "404"

# Test 404 for non-existent dashboard
run_test "Get non-existent dashboard" "/v1/dashboards/999" "GET" "" "404"

# Test invalid analytics query
invalid_query='{
    "metrics": [],
    "filters": [],
    "timeRange": {
        "start": "invalid-date",
        "end": "invalid-date"
    }
}'
run_test "Invalid analytics query" "/v1/analytics/query" "POST" "$invalid_query" "500"

echo -e "${YELLOW}6. Testing Rate Limiting${NC}"
echo "========================="

# Test rate limiting on analytics endpoints
echo -e "${BLUE}Testing rate limiting on analytics endpoints${NC}"
for i in {1..5}; do
    response=$(curl -s -w "\n%{http_code}" -H "x-organization-id: $ORGANIZATION_ID" "$API_BASE_URL/v1/analytics/metrics")
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "429" ]; then
        echo -e "${GREEN}✓ Rate limiting working${NC}"
        ((TESTS_PASSED++))
        break
    fi
    sleep 1
done

echo ""
echo "============================================================="
echo -e "${BLUE}PR-48 Advanced Analytics & BI System Smoke Test Results${NC}"
echo "============================================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! PR-48 Advanced Analytics & BI system is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the implementation.${NC}"
    exit 1
fi
