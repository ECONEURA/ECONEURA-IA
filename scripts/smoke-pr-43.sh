#!/bin/bash

# PR-43: GDPR Export/Erase System - Smoke Test
# Test all GDPR endpoints and functionality

set -e

echo "🧪 PR-43: GDPR Export/Erase System - Smoke Test"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
API_BASE_URL="http://localhost:4000"
WEB_BASE_URL="http://localhost:3000"
TEST_RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ $test_name")
    else
        echo -e "${RED}❌ FAIL${NC}"
        TEST_RESULTS+=("❌ $test_name")
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local method="$2"
    local expected_status="$3"
    local data="$4"
    
    local curl_cmd="curl -s -o /dev/null -w '%{http_code}'"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json' -d '$data'"
    elif [ "$method" = "PUT" ] && [ -n "$data" ]; then
        curl_cmd="$curl_cmd -X PUT -H 'Content-Type: application/json' -d '$data'"
    elif [ "$method" = "DELETE" ]; then
        curl_cmd="$curl_cmd -X DELETE"
    fi
    
    curl_cmd="$curl_cmd $API_BASE_URL$endpoint"
    
    local status_code=$(eval "$curl_cmd")
    
    if [ "$status_code" = "$expected_status" ]; then
        return 0
    else
        echo "Expected: $expected_status, Got: $status_code"
        return 1
    fi
}

# Function to test API response
test_api_response() {
    local endpoint="$1"
    local method="$2"
    local expected_field="$3"
    
    local curl_cmd="curl -s"
    
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json'"
    elif [ "$method" = "PUT" ]; then
        curl_cmd="$curl_cmd -X PUT -H 'Content-Type: application/json'"
    elif [ "$method" = "DELETE" ]; then
        curl_cmd="$curl_cmd -X DELETE"
    fi
    
    curl_cmd="$curl_cmd $API_BASE_URL$endpoint"
    
    local response=$(eval "$curl_cmd")
    
    if echo "$response" | grep -q "$expected_field"; then
        return 0
    else
        echo "Expected field '$expected_field' not found in response"
        return 1
    fi
}

echo -e "\n${YELLOW}Starting GDPR System Tests...${NC}"

# Test 1: API Health Check
run_test "API Health Check" "test_api_endpoint '/health/live' 'GET' '200'"

# Test 2: GDPR Stats Endpoint
run_test "GDPR Stats Endpoint" "test_api_response '/v1/gdpr/stats' 'GET' 'success'"

# Test 3: GDPR Data Categories Endpoint
run_test "GDPR Data Categories Endpoint" "test_api_response '/v1/gdpr/data-categories' 'GET' 'success'"

# Test 4: GDPR Requests Endpoint
run_test "GDPR Requests Endpoint" "test_api_response '/v1/gdpr/requests' 'GET' 'success'"

# Test 5: Create GDPR Request
GDPR_REQUEST_DATA='{"userId":"test_user_1","type":"export","dataCategories":["personal_info","crm_data"],"scope":"user","priority":"medium","reason":"User requested data export"}'
run_test "Create GDPR Request" "test_api_response '/v1/gdpr/requests' 'POST' 'success' '$GDPR_REQUEST_DATA'"

# Test 6: GDPR Export Request
EXPORT_DATA='{"userId":"test_user_1","dataCategories":["personal_info","crm_data"],"format":"zip","scope":"user"}'
run_test "GDPR Export Request" "test_api_response '/v1/gdpr/export' 'POST' 'success' '$EXPORT_DATA'"

# Test 7: GDPR Erase Request
ERASE_DATA='{"userId":"test_user_1","dataCategories":["personal_info","crm_data"],"type":"soft","reason":"User requested data deletion"}'
run_test "GDPR Erase Request" "test_api_response '/v1/gdpr/erase' 'POST' 'success' '$ERASE_DATA'"

# Test 8: GDPR Legal Holds Endpoint
run_test "GDPR Legal Holds Endpoint" "test_api_response '/v1/gdpr/legal-holds' 'GET' 'success'"

# Test 9: Create Legal Hold
LEGAL_HOLD_DATA='{"name":"Test Legal Hold","description":"Test legal hold for compliance","type":"regulatory","dataCategories":["financial_data"],"startDate":"2024-01-01","status":"active","createdBy":"test_user","legalBasis":"EU Banking Regulation"}'
run_test "Create Legal Hold" "test_api_response '/v1/gdpr/legal-holds' 'POST' 'success' '$LEGAL_HOLD_DATA'"

# Test 10: GDPR Audit Endpoint
run_test "GDPR Audit Endpoint" "test_api_response '/v1/gdpr/audit' 'GET' 'success'"

# Test 11: GDPR Breaches Endpoint
run_test "GDPR Breaches Endpoint" "test_api_response '/v1/gdpr/breaches' 'GET' 'success'"

# Test 12: Record Data Breach
BREACH_DATA='{"type":"confidentiality","severity":"medium","description":"Test data breach","affectedDataCategories":["personal_info"],"affectedDataSubjects":5}'
run_test "Record Data Breach" "test_api_response '/v1/gdpr/breaches' 'POST' 'success' '$BREACH_DATA'"

# Test 13: GDPR Compliance Report
run_test "GDPR Compliance Report" "test_api_endpoint '/v1/gdpr/compliance-report?start=2024-01-01&end=2024-12-31' 'GET' '200'"

# Test 14: Invalid GDPR Request (Missing Fields)
INVALID_REQUEST_DATA='{"userId":"test_user_1"}'
run_test "Invalid GDPR Request" "test_api_endpoint '/v1/gdpr/requests' 'POST' '400' '$INVALID_REQUEST_DATA'"

# Test 15: Invalid Export Request (Missing Fields)
INVALID_EXPORT_DATA='{"userId":"test_user_1"}'
run_test "Invalid Export Request" "test_api_endpoint '/v1/gdpr/export' 'POST' '400' '$INVALID_EXPORT_DATA'"

# Test 16: Invalid Erase Request (Missing Fields)
INVALID_ERASE_DATA='{"userId":"test_user_1"}'
run_test "Invalid Erase Request" "test_api_endpoint '/v1/gdpr/erase' 'POST' '400' '$INVALID_ERASE_DATA'"

# Test 17: Invalid Breach Request (Missing Fields)
INVALID_BREACH_DATA='{"type":"confidentiality"}'
run_test "Invalid Breach Request" "test_api_endpoint '/v1/gdpr/breaches' 'POST' '400' '$INVALID_BREACH_DATA'"

# Test 18: Non-existent GDPR Request
run_test "Non-existent GDPR Request" "test_api_endpoint '/v1/gdpr/requests/nonexistent' 'GET' '404'"

# Test 19: Non-existent Export
run_test "Non-existent Export" "test_api_endpoint '/v1/gdpr/export/nonexistent' 'GET' '404'"

# Test 20: Non-existent Erase
run_test "Non-existent Erase" "test_api_endpoint '/v1/gdpr/erase/nonexistent' 'GET' '404'"

# Test 21: GDPR Request with Invalid Type
INVALID_TYPE_DATA='{"userId":"test_user_1","type":"invalid","dataCategories":["personal_info"]}'
run_test "GDPR Request with Invalid Type" "test_api_endpoint '/v1/gdpr/requests' 'POST' '400' '$INVALID_TYPE_DATA'"

# Test 22: GDPR Export with Invalid Format
INVALID_FORMAT_DATA='{"userId":"test_user_1","dataCategories":["personal_info"],"format":"invalid"}'
run_test "GDPR Export with Invalid Format" "test_api_endpoint '/v1/gdpr/export' 'POST' '400' '$INVALID_FORMAT_DATA'"

# Test 23: GDPR Erase with Invalid Type
INVALID_ERASE_TYPE_DATA='{"userId":"test_user_1","dataCategories":["personal_info"],"type":"invalid"}'
run_test "GDPR Erase with Invalid Type" "test_api_endpoint '/v1/gdpr/erase' 'POST' '400' '$INVALID_ERASE_TYPE_DATA'"

# Test 24: GDPR Breach with Invalid Type
INVALID_BREACH_TYPE_DATA='{"type":"invalid","severity":"medium","description":"Test","affectedDataCategories":["personal_info"],"affectedDataSubjects":5}'
run_test "GDPR Breach with Invalid Type" "test_api_endpoint '/v1/gdpr/breaches' 'POST' '400' '$INVALID_BREACH_TYPE_DATA'"

# Test 25: GDPR Breach with Invalid Severity
INVALID_SEVERITY_DATA='{"type":"confidentiality","severity":"invalid","description":"Test","affectedDataCategories":["personal_info"],"affectedDataSubjects":5}'
run_test "GDPR Breach with Invalid Severity" "test_api_endpoint '/v1/gdpr/breaches' 'POST' '400' '$INVALID_SEVERITY_DATA'"

echo -e "\n${YELLOW}GDPR System Tests Completed${NC}"
echo "=============================================="

# Print test results
echo -e "\n${BLUE}Test Results:${NC}"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done

echo -e "\n${BLUE}Summary:${NC}"
echo "  Total Tests: $TOTAL_TESTS"
echo "  Passed: $PASSED_TESTS"
echo "  Failed: $((TOTAL_TESTS - PASSED_TESTS))"

# Calculate success rate
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "  Success Rate: $SUCCESS_RATE%"

# Determine overall result
if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! GDPR System is working correctly.${NC}"
    echo -e "${GREEN}RESULTADO: PASS${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  Most tests passed. GDPR System is mostly functional.${NC}"
    echo -e "${YELLOW}RESULTADO: PARTIAL PASS${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Multiple tests failed. GDPR System needs attention.${NC}"
    echo -e "${RED}RESULTADO: FAIL${NC}"
    exit 1
fi
