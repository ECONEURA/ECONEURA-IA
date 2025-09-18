#!/bin/bash

# ============================================================================
# PR-47 Warm-up IA/Search System - Smoke Tests
# ============================================================================

set -e

echo "🔥 Starting PR-47 Warm-up IA/Search System Smoke Tests"
echo "=================================================="

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

echo -e "${YELLOW}1. Testing Warm-up Configuration Management${NC}"
echo "=============================================="

# Test warm-up configs list
run_test_with_json "Get warm-up configurations" "/v1/warmup/configs" "GET" "" "200" "success"

# Test create warm-up config
warmup_config='{
    "name": "AI Cache Warmup",
    "serviceName": "ai-service",
    "organizationId": "'$ORGANIZATION_ID'",
    "warmupType": "ai_cache",
    "schedule": "0 */6 * * *",
    "enabled": true,
    "parameters": {
        "cacheKeys": ["ai:models", "ai:embeddings"],
        "preloadData": true
    }
}'
run_test_with_json "Create warm-up configuration" "/v1/warmup/configs" "POST" "$warmup_config" "201" "data"

# Test get specific warm-up config (assuming ID 1 exists)
run_test_with_json "Get specific warm-up configuration" "/v1/warmup/configs/1" "GET" "" "200" "success"

# Test update warm-up config
update_config='{
    "name": "AI Cache Warmup Updated",
    "enabled": false
}'
run_test "Update warm-up configuration" "/v1/warmup/configs/1" "PUT" "$update_config" "200"

echo -e "${YELLOW}2. Testing Warm-up Execution${NC}"
echo "=============================="

# Test warm-up execution
warmup_execution='{
    "configId": "1",
    "organizationId": "'$ORGANIZATION_ID'",
    "serviceName": "ai-service"
}'
run_test_with_json "Execute warm-up" "/v1/warmup/execute" "POST" "$warmup_execution" "201" "data"

# Test warm-up status
run_test_with_json "Get warm-up status" "/v1/warmup/status" "GET" "" "200" "success"

# Test warm-up metrics
run_test_with_json "Get warm-up metrics" "/v1/warmup/metrics" "GET" "" "200" "success"

echo -e "${YELLOW}3. Testing Intelligent Search${NC}"
echo "============================="

# Test search query
search_query='{
    "query": "artificial intelligence",
    "filters": {
        "category": "technology",
        "dateRange": "2024-01-01,2024-12-31"
    },
    "organizationId": "'$ORGANIZATION_ID'",
    "userId": "'$USER_ID'"
}'
run_test_with_json "Search query" "/v1/search/query" "POST" "$search_query" "200" "success"

# Test search suggestions
run_test_with_json "Get search suggestions" "/v1/search/suggestions?q=ai" "GET" "" "200" "success"

# Test document indexing
index_documents='{
    "documents": [
        {
            "id": "doc1",
            "title": "AI Technology",
            "content": "Artificial intelligence is transforming industries",
            "category": "technology"
        }
    ],
    "organizationId": "'$ORGANIZATION_ID'"
}'
run_test_with_json "Index documents" "/v1/search/index" "POST" "$index_documents" "201" "data"

# Test search analytics
run_test_with_json "Get search analytics" "/v1/search/analytics" "GET" "" "200" "success"

echo -e "${YELLOW}4. Testing Smart Cache Management${NC}"
echo "=================================="

# Test cache configs
run_test_with_json "Get smart cache configurations" "/v1/cache/smart/configs" "GET" "" "200" "success"

# Test create cache config
cache_config='{
    "name": "AI Model Cache",
    "cacheType": "ai_models",
    "organizationId": "'$ORGANIZATION_ID'",
    "ttl": 3600,
    "maxSize": 1000,
    "evictionPolicy": "lru"
}'
run_test_with_json "Create cache configuration" "/v1/cache/smart/configs" "POST" "$cache_config" "201" "data"

# Test cache stats
run_test_with_json "Get cache statistics" "/v1/cache/smart/stats" "GET" "" "200" "success"

# Test cache invalidation
invalidate_cache='{
    "patterns": ["ai:models:*", "search:index:*"],
    "organizationId": "'$ORGANIZATION_ID'"
}'
run_test_with_json "Invalidate cache" "/v1/cache/smart/invalidate" "POST" "$invalidate_cache" "200" "success"

echo -e "${YELLOW}5. Testing Performance Optimization${NC}"
echo "====================================="

# Test performance metrics
run_test_with_json "Get performance metrics" "/v1/performance/metrics" "GET" "" "200" "success"

# Test optimization recommendations
run_test_with_json "Get optimization recommendations" "/v1/performance/recommendations" "GET" "" "200" "success"

# Test execute optimization
optimization='{
    "optimizationType": "cache_optimization",
    "organizationId": "'$ORGANIZATION_ID'",
    "parameters": {
        "targetService": "ai-service",
        "optimizationLevel": "aggressive"
    }
}'
run_test_with_json "Execute optimization" "/v1/performance/optimize" "POST" "$optimization" "201" "data"

echo -e "${YELLOW}6. Testing Error Handling${NC}"
echo "=========================="

# Test 404 for non-existent warm-up config
run_test "Get non-existent warm-up config" "/v1/warmup/configs/999" "GET" "" "404"

# Test 404 for non-existent cache config
run_test "Get non-existent cache config" "/v1/cache/smart/configs/999" "GET" "" "404"

# Test invalid search query
invalid_search='{
    "query": "",
    "organizationId": "'$ORGANIZATION_ID'"
}'
run_test "Invalid search query" "/v1/search/query" "POST" "$invalid_search" "500"

echo -e "${YELLOW}7. Testing Rate Limiting${NC}"
echo "========================="

# Test rate limiting on warm-up endpoints
echo -e "${BLUE}Testing rate limiting on warm-up endpoints${NC}"
for i in {1..5}; do
    response=$(curl -s -w "\n%{http_code}" -H "x-organization-id: $ORGANIZATION_ID" "$API_BASE_URL/v1/warmup/configs")
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "429" ]; then
        echo -e "${GREEN}✓ Rate limiting working${NC}"
        ((TESTS_PASSED++))
        break
    fi
    sleep 1
done

echo ""
echo "=================================================="
echo -e "${BLUE}PR-47 Warm-up IA/Search System Smoke Test Results${NC}"
echo "=================================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! PR-47 Warm-up IA/Search system is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the implementation.${NC}"
    exit 1
fi
