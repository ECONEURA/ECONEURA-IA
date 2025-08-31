#!/bin/bash

# PR-38: Advanced Search Engine Smoke Test
# Test semantic, fuzzy, federated search with suggestions and analytics

echo "🔍 PR-38: Testing Advanced Search Engine"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local endpoint="$2"
    local method="$3"
    local data="$4"
    local expected_status="$5"
    local description="$6"

    echo -e "\n${BLUE}Testing: $test_name${NC}"
    echo "Description: $description"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} - Status: $http_code"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} - Expected: $expected_status, Got: $http_code"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Test 1: Keyword Search
echo -e "\n${YELLOW}1. Testing Keyword Search${NC}"
run_test \
    "Keyword Search" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "machine learning", "searchType": "keyword", "page": 1, "limit": 5}' \
    "200" \
    "Basic keyword search functionality"

# Test 2: Semantic Search
echo -e "\n${YELLOW}2. Testing Semantic Search${NC}"
run_test \
    "Semantic Search" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "artificial intelligence", "searchType": "semantic", "page": 1, "limit": 5}' \
    "200" \
    "Semantic search with embeddings"

# Test 3: Fuzzy Search
echo -e "\n${YELLOW}3. Testing Fuzzy Search${NC}"
run_test \
    "Fuzzy Search" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "machin learnin", "searchType": "fuzzy", "page": 1, "limit": 5}' \
    "200" \
    "Fuzzy search with typo correction"

# Test 4: Federated Search
echo -e "\n${YELLOW}4. Testing Federated Search${NC}"
run_test \
    "Federated Search" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "data analytics", "searchType": "federated", "sources": ["api-docs", "database"], "page": 1, "limit": 5}' \
    "200" \
    "Federated search across multiple sources"

# Test 5: Search with Filters
echo -e "\n${YELLOW}5. Testing Search with Filters${NC}"
run_test \
    "Search with Filters" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "cloud computing", "searchType": "keyword", "filters": {"category": "Cloud"}, "page": 1, "limit": 5}' \
    "200" \
    "Search with metadata filters"

# Test 6: Search Suggestions
echo -e "\n${YELLOW}6. Testing Search Suggestions${NC}"
run_test \
    "Search Suggestions" \
    "http://localhost:3001/v1/search/suggestions?query=machin" \
    "GET" \
    "" \
    "200" \
    "Get search suggestions for partial query"

# Test 7: Search Analytics
echo -e "\n${YELLOW}7. Testing Search Analytics${NC}"
run_test \
    "Search Analytics" \
    "http://localhost:3001/v1/search/analytics" \
    "GET" \
    "" \
    "200" \
    "Get search engine analytics"

# Test 8: Federated Sources
echo -e "\n${YELLOW}8. Testing Federated Sources${NC}"
run_test \
    "Federated Sources" \
    "http://localhost:3001/v1/search/sources" \
    "GET" \
    "" \
    "200" \
    "Get list of federated sources"

# Test 9: Add Federated Source
echo -e "\n${YELLOW}9. Testing Add Federated Source${NC}"
run_test \
    "Add Federated Source" \
    "http://localhost:3001/v1/search/sources" \
    "POST" \
    '{"sourceId": "test-api", "name": "Test API", "url": "https://test-api.example.com", "type": "api", "priority": 5, "timeout": 5000, "enabled": true}' \
    "201" \
    "Add new federated source"

# Test 10: Cache Stats
echo -e "\n${YELLOW}10. Testing Cache Statistics${NC}"
run_test \
    "Cache Stats" \
    "http://localhost:3001/v1/search/cache/stats" \
    "GET" \
    "" \
    "200" \
    "Get search cache statistics"

# Test 11: Clear Cache
echo -e "\n${YELLOW}11. Testing Clear Cache${NC}"
run_test \
    "Clear Cache" \
    "http://localhost:3001/v1/search/cache/clear" \
    "POST" \
    "" \
    "200" \
    "Clear search cache"

# Test 12: Search History
echo -e "\n${YELLOW}12. Testing Search History${NC}"
run_test \
    "Search History" \
    "http://localhost:3001/v1/search/history?userId=test-user" \
    "GET" \
    "" \
    "200" \
    "Get search history for user"

# Test 13: Advanced Search with Sorting
echo -e "\n${YELLOW}13. Testing Advanced Search with Sorting${NC}"
run_test \
    "Advanced Search with Sorting" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "blockchain", "searchType": "keyword", "sortBy": "score", "sortOrder": "desc", "page": 1, "limit": 5}' \
    "200" \
    "Search with custom sorting"

# Test 14: Search with Pagination
echo -e "\n${YELLOW}14. Testing Search with Pagination${NC}"
run_test \
    "Search with Pagination" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "cybersecurity", "searchType": "keyword", "page": 2, "limit": 3}' \
    "200" \
    "Search with pagination"

# Test 15: Search without Cache
echo -e "\n${YELLOW}15. Testing Search without Cache${NC}"
run_test \
    "Search without Cache" \
    "http://localhost:3001/v1/search" \
    "POST" \
    '{"query": "devops", "searchType": "keyword", "useCache": false, "page": 1, "limit": 5}' \
    "200" \
    "Search bypassing cache"

# Test Web BFF endpoints
echo -e "\n${YELLOW}Testing Web BFF Endpoints${NC}"

# Test 16: Web BFF Search
echo -e "\n${YELLOW}16. Testing Web BFF Search${NC}"
run_test \
    "Web BFF Search" \
    "http://localhost:3000/api/search" \
    "POST" \
    '{"query": "microservices", "searchType": "keyword", "page": 1, "limit": 5}' \
    "200" \
    "Web BFF search endpoint"

# Test 17: Web BFF Suggestions
echo -e "\n${YELLOW}17. Testing Web BFF Suggestions${NC}"
run_test \
    "Web BFF Suggestions" \
    "http://localhost:3000/api/search/suggestions?query=artific" \
    "GET" \
    "" \
    "200" \
    "Web BFF search suggestions"

# Test 18: Web BFF Analytics
echo -e "\n${YELLOW}18. Testing Web BFF Analytics${NC}"
run_test \
    "Web BFF Analytics" \
    "http://localhost:3000/api/search/analytics" \
    "GET" \
    "" \
    "200" \
    "Web BFF search analytics"

# Test 19: Web BFF Sources
echo -e "\n${YELLOW}19. Testing Web BFF Sources${NC}"
run_test \
    "Web BFF Sources" \
    "http://localhost:3000/api/search/sources" \
    "GET" \
    "" \
    "200" \
    "Web BFF federated sources"

# Test 20: Web BFF Add Source
echo -e "\n${YELLOW}20. Testing Web BFF Add Source${NC}"
run_test \
    "Web BFF Add Source" \
    "http://localhost:3000/api/search/sources" \
    "POST" \
    '{"sourceId": "web-bff-test", "name": "Web BFF Test", "url": "https://web-bff-test.example.com", "type": "api", "priority": 7, "timeout": 3000, "enabled": true}' \
    "201" \
    "Web BFF add federated source"

# Summary
echo -e "\n${BLUE}========================================"
echo "PR-38: Advanced Search Engine Test Summary"
echo "========================================${NC}"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}📊 Total Tests: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Advanced Search Engine is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the implementation.${NC}"
    exit 1
fi
