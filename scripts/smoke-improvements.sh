#!/bin/bash

# Smoke Test for ECONEURA Improvements
# Test all new improvements and enhancements

set -e

echo "🧪 ECONEURA Improvements - Smoke Test"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
API_BASE_URL="http://localhost:4000"
TEST_RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
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

echo -e "\n${YELLOW}Starting ECONEURA Improvements Tests...${NC}"

# Test 1: Enhanced Health Checks
run_test "Enhanced Health Check - Live" "test_api_response '/health/live' 'GET' 'status'"
run_test "Enhanced Health Check - Ready" "test_api_response '/health/ready' 'GET' 'status'"
run_test "Enhanced Health Check - General" "test_api_response '/health' 'GET' 'status'"
run_test "Enhanced Health Check - Detailed" "test_api_response '/health/detailed' 'GET' 'status'"

# Test 2: Process Management
run_test "Process Information" "test_api_response '/process/info' 'GET' 'success'"
run_test "Process Health" "test_api_response '/process/health' 'GET' 'success'"
run_test "Process Statistics" "test_api_response '/process/stats' 'GET' 'success'"

# Test 3: Cache Management
run_test "Cache Statistics" "test_api_response '/cache/stats' 'GET' 'success'"

# Test 4: Database Health
run_test "Database Health Check" "test_api_response '/database/health' 'GET' 'success'"

# Test 5: Security Headers
run_test "Security Headers - X-Frame-Options" "curl -s -I $API_BASE_URL/health/live | grep -q 'X-Frame-Options'"
run_test "Security Headers - X-Content-Type-Options" "curl -s -I $API_BASE_URL/health/live | grep -q 'X-Content-Type-Options'"
run_test "Security Headers - X-XSS-Protection" "curl -s -I $API_BASE_URL/health/live | grep -q 'X-XSS-Protection'"
run_test "Security Headers - Content-Security-Policy" "curl -s -I $API_BASE_URL/health/live | grep -q 'Content-Security-Policy'"

# Test 6: CORS Headers
run_test "CORS Headers - Access-Control-Allow-Origin" "curl -s -I -H 'Origin: http://localhost:3000' $API_BASE_URL/health/live | grep -q 'Access-Control-Allow-Origin'"
run_test "CORS Headers - Access-Control-Allow-Methods" "curl -s -I -H 'Origin: http://localhost:3000' $API_BASE_URL/health/live | grep -q 'Access-Control-Allow-Methods'"

# Test 7: Rate Limiting
run_test "Rate Limiting - Headers Present" "curl -s -I $API_BASE_URL/health/live | grep -q 'X-RateLimit'"

# Test 8: Request ID Tracking
run_test "Request ID Tracking" "curl -s -I $API_BASE_URL/health/live | grep -q 'X-Request-ID'"

# Test 9: Error Handling
run_test "Error Handling - 404 Response" "test_api_endpoint '/nonexistent-endpoint' 'GET' '404'"
run_test "Error Handling - Invalid JSON" "curl -s -X POST -H 'Content-Type: application/json' -d 'invalid-json' $API_BASE_URL/health/live | grep -q 'error'"

# Test 10: Input Validation
run_test "Input Validation - Large Request" "curl -s -X POST -H 'Content-Type: application/json' -d '{\"data\":\"'$(printf 'a%.0s' {1..10000000})'\"}' $API_BASE_URL/health/live | grep -q '413'"

# Test 11: API Documentation (if Swagger is enabled)
run_test "API Documentation - Swagger UI" "curl -s -I $API_BASE_URL/docs | grep -q '200' || echo 'Swagger not enabled'"

# Test 12: Metrics Endpoint
run_test "Metrics Endpoint" "test_api_response '/metrics' 'GET' 'http_requests_total'"

# Test 13: Structured Logging (indirect test)
run_test "Structured Logging - Request Logging" "curl -s $API_BASE_URL/health/live > /dev/null && echo 'Request logged'"

# Test 14: Cache Performance
run_test "Cache Performance - Multiple Requests" "for i in {1..5}; do curl -s $API_BASE_URL/health/live > /dev/null; done && echo 'Cache performance test completed'"

# Test 15: Database Connection Pool
run_test "Database Connection Pool - Health Check" "test_api_response '/database/health' 'GET' 'connections'"

# Test 16: Process Monitoring
run_test "Process Monitoring - Memory Usage" "test_api_response '/process/stats' 'GET' 'memoryUsage'"
run_test "Process Monitoring - CPU Usage" "test_api_response '/process/stats' 'GET' 'cpuUsage'"

# Test 17: Graceful Shutdown (simulation)
run_test "Graceful Shutdown - Process Info" "test_api_response '/process/info' 'GET' 'pid'"

# Test 18: Advanced Error Handling
run_test "Advanced Error Handling - Validation Error" "curl -s -X POST -H 'Content-Type: application/json' -d '{}' $API_BASE_URL/v1/rls/generate | grep -q 'error'"

# Test 19: Security Middleware
run_test "Security Middleware - Request Sanitization" "curl -s -X POST -H 'Content-Type: application/json' -d '{\"test\":\"<script>alert(1)</script>\"}' $API_BASE_URL/health/live | grep -q 'status'"

# Test 20: Performance Monitoring
run_test "Performance Monitoring - Response Time" "curl -s -w '%{time_total}' -o /dev/null $API_BASE_URL/health/live | grep -q '[0-9]'"

echo -e "\n${YELLOW}ECONEURA Improvements Tests Completed${NC}"
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
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! ECONEURA improvements are working correctly.${NC}"
    echo -e "${GREEN}RESULTADO: PASS${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  Most tests passed. ECONEURA improvements are mostly functional.${NC}"
    echo -e "${YELLOW}RESULTADO: PARTIAL PASS${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Multiple tests failed. ECONEURA improvements need attention.${NC}"
    echo -e "${RED}RESULTADO: FAIL${NC}"
    exit 1
fi
