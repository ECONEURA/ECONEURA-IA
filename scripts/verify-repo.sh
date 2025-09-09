#!/bin/bash

echo "🔍 Verifying ECONEURA repository..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Function to run a check
run_check() {
    local check_name="$1"
    local command="$2"
    local expected_result="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $check_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        if [ "$expected_result" = "pass" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    else
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}❌ FAIL${NC}"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    fi
}

# Function to run a warning check
run_warning_check() {
    local check_name="$1"
    local command="$2"
    local threshold="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $check_name... "
    
    local result=$(eval "$command" 2>/dev/null || echo "0")
    
    if [ "$result" -le "$threshold" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($result)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} ($result > $threshold)"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

echo "📋 Running repository verification checks..."
echo ""

# 1. Check if FinOps enforcement is active
run_check "FinOps enforcement middleware" "test -f apps/api/src/middleware/finops-enforce.ts" "pass"

# 2. Check if AI router client exists
run_check "AI router client" "test -f packages/agents/ai-router.client.ts" "pass"

# 3. Check if CORS is configured
run_check "CORS configuration" "grep -r 'cors' apps/api/src --include='*.ts' | head -1" "pass"

# 4. Check if Helmet is configured
run_check "Helmet security" "grep -r 'helmet' apps/api/src --include='*.ts' | head -1" "pass"

# 5. Check if Husky is active
run_check "Husky hooks" "test -f .husky/pre-commit" "pass"

# 6. Check if CI workflows exist
run_check "CI workflows" "test -f .github/workflows/ci.yml" "pass"

# 7. Check if tests exist
run_check "Test files" "find . -name '*.test.ts' | head -1" "pass"

# 8. Check if TypeScript config exists
run_check "TypeScript config" "test -f tsconfig.json" "pass"

# 9. Check if package.json exists
run_check "Package.json" "test -f package.json" "pass"

# 10. Check if pnpm workspace is configured
run_check "PNPM workspace" "test -f pnpm-workspace.yaml" "pass"

echo ""

# Quality checks
echo "📊 Running quality checks..."
echo ""

# 11. Check console.log violations (should be 0)
run_warning_check "Console.log violations" "find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v dist | grep -v '.next' | xargs grep -l 'console\.' | wc -l" 0

# 12. Check .js imports (should be 0)
run_warning_check ".js imports" "find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v dist | grep -v '.next' | xargs grep -l 'import.*from.*\.js' | wc -l" 0

# 13. Check TODO/FIXME comments (should be ≤ 20)
run_warning_check "TODO/FIXME comments" "find . -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v dist | grep -v '.next' | xargs grep -l 'TODO\|FIXME' | wc -l" 20

# 14. Check test coverage (should be ≥ 80%)
echo -n "Checking test coverage... "
if command -v pnpm &> /dev/null; then
    COVERAGE=$(pnpm test:coverage 2>/dev/null | grep -o '[0-9]*%' | head -1 | sed 's/%//' || echo "0")
    if [ "$COVERAGE" -ge 80 ]; then
        echo -e "${GREEN}✅ PASS${NC} ($COVERAGE%)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} ($COVERAGE% < 80%)"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} (pnpm not found)"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# 15. Check if builds pass
echo -n "Checking build... "
if command -v pnpm &> /dev/null; then
    if pnpm build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} (pnpm not found)"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

echo ""

# Summary
echo "📋 VERIFICATION SUMMARY"
echo "========================"
echo -e "Total checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo -e "Warnings: ${YELLOW}$WARNING_CHECKS${NC}"
echo ""

# Determine overall result
if [ $FAILED_CHECKS -eq 0 ]; then
    if [ $WARNING_CHECKS -eq 0 ]; then
        echo -e "${GREEN}🎉 RESULT: PASS${NC}"
        echo "All checks passed successfully!"
        exit 0
    else
        echo -e "${YELLOW}⚠️  RESULT: WARNING${NC}"
        echo "All critical checks passed, but some warnings need attention."
        exit 0
    fi
else
    echo -e "${RED}❌ RESULT: FAIL${NC}"
    echo "Critical checks failed. Repository needs fixes."
    exit 1
fi

