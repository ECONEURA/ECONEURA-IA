#!/bin/bash

echo "🔥 Running ECONEURA smoke tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a smoke test
run_smoke_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        if [ "$expected_status" = "pass" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        if [ "$expected_status" = "fail" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $test_name... "
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response, expected $expected_status)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo "📋 Running smoke tests..."
echo ""

# 1. Test TypeScript compilation
run_smoke_test "TypeScript compilation" "pnpm typecheck" "pass"

# 2. Test linting
run_smoke_test "ESLint" "pnpm lint" "pass"

# 3. Test unit tests
run_smoke_test "Unit tests" "pnpm test" "pass"

# 4. Test build
run_smoke_test "Build" "pnpm build" "pass"

# 5. Test API health endpoint (if server is running)
test_endpoint "API health" "http://localhost:3001/health" "200"

# 6. Test Web health endpoint (if server is running)
test_endpoint "Web health" "http://localhost:3000/health" "200"

# 7. Test API AI endpoint (if server is running)
test_endpoint "API AI endpoint" "http://localhost:3001/v1/ai/health" "200"

# 8. Test Web API proxy (if server is running)
test_endpoint "Web API proxy" "http://localhost:3000/api/econeura/health" "200"

# 9. Test database connection (if available)
run_smoke_test "Database connection" "pnpm db:ping" "pass"

# 10. Test Redis connection (if available)
run_smoke_test "Redis connection" "pnpm redis:ping" "pass"

echo ""

# Summary
echo "📋 SMOKE TEST SUMMARY"
echo "====================="
echo -e "Total tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

# Determine overall result
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 RESULT: PASS${NC}"
    echo "All smoke tests passed successfully!"
    exit 0
else
    echo -e "${RED}❌ RESULT: FAIL${NC}"
    echo "Some smoke tests failed. Check the output above."
    exit 1
fi

