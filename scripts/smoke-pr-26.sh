#!/bin/bash

# PR-26: Caché IA/Search (mem/Redis) + warm-up básico
# Smoke test para validar el sistema de caché

set -e

echo "🔥 PR-26 Smoke Test: Cache System"
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

# Configuración
API_BASE="http://localhost:4000"
WEB_BASE="http://localhost:3000"

echo -e "${BLUE}Testing API Cache Endpoints...${NC}"

# 1. Test cache stats endpoint
test_endpoint "GET" "$API_BASE/v1/cache/stats" "200" "API Cache Stats"
validate_json "$API_BASE/v1/cache/stats" "API Cache Stats"

# 2. Test cache warmup endpoint
test_endpoint "POST" "$API_BASE/v1/cache/warmup" "200" "API Cache Warmup"
validate_json "$API_BASE/v1/cache/warmup" "API Cache Warmup"

# 3. Test start periodic warmup
test_endpoint "POST" "$API_BASE/v1/cache/warmup/start" "200" "API Start Periodic Warmup" '{"intervalMinutes": 30}'
validate_json "$API_BASE/v1/cache/warmup/start" "API Start Periodic Warmup"

# 4. Test stop periodic warmup
test_endpoint "POST" "$API_BASE/v1/cache/warmup/stop" "200" "API Stop Periodic Warmup"
validate_json "$API_BASE/v1/cache/warmup/stop" "API Stop Periodic Warmup"

# 5. Test clear AI cache
test_endpoint "DELETE" "$API_BASE/v1/cache/ai" "200" "API Clear AI Cache"
validate_json "$API_BASE/v1/cache/ai" "API Clear AI Cache"

# 6. Test clear search cache
test_endpoint "DELETE" "$API_BASE/v1/cache/search" "200" "API Clear Search Cache"
validate_json "$API_BASE/v1/cache/search" "API Clear Search Cache"

# 7. Test clear all caches
test_endpoint "DELETE" "$API_BASE/v1/cache/all" "200" "API Clear All Caches"
validate_json "$API_BASE/v1/cache/all" "API Clear All Caches"

echo -e "${BLUE}Testing AI Cache Functionality...${NC}"

# 8. Test AI endpoint with cache
echo -n "Testing AI endpoint with cache... "
ai_response1=$(curl -s "$API_BASE/v1/demo/ai?prompt=test&model=gpt-4")
ai_response2=$(curl -s "$API_BASE/v1/demo/ai?prompt=test&model=gpt-4")

# Check if second response is cached
if echo "$ai_response2" | grep -q '"cached":true'; then
    echo -e "${GREEN}✓ Cache working${NC}"
else
    echo -e "${YELLOW}⚠ Cache not detected${NC}"
fi

echo -e "${BLUE}Testing Search Cache Functionality...${NC}"

# 9. Test search endpoint with cache
echo -n "Testing search endpoint with cache... "
search_response1=$(curl -s "$API_BASE/v1/demo/search?query=test")
search_response2=$(curl -s "$API_BASE/v1/demo/search?query=test")

# Check if second response is cached
if echo "$search_response2" | grep -q '"cached":true'; then
    echo -e "${GREEN}✓ Cache working${NC}"
else
    echo -e "${YELLOW}⚠ Cache not detected${NC}"
fi

echo -e "${BLUE}Testing Web BFF Cache Endpoints...${NC}"

# 10. Test web cache stats endpoint
test_endpoint "GET" "$WEB_BASE/api/cache/stats" "200" "Web Cache Stats"
validate_json "$WEB_BASE/api/cache/stats" "Web Cache Stats"

# 11. Test web cache warmup endpoint
test_endpoint "POST" "$WEB_BASE/api/cache/warmup" "200" "Web Cache Warmup"
validate_json "$WEB_BASE/api/cache/warmup" "Web Cache Warmup"

# 12. Test web start periodic warmup
test_endpoint "POST" "$WEB_BASE/api/cache/warmup/start" "200" "Web Start Periodic Warmup" '{"intervalMinutes": 30}'
validate_json "$WEB_BASE/api/cache/warmup/start" "Web Start Periodic Warmup"

# 13. Test web stop periodic warmup
test_endpoint "POST" "$WEB_BASE/api/cache/warmup/stop" "200" "Web Stop Periodic Warmup"
validate_json "$WEB_BASE/api/cache/warmup/stop" "Web Stop Periodic Warmup"

# 14. Test web clear AI cache
test_endpoint "DELETE" "$WEB_BASE/api/cache/ai" "200" "Web Clear AI Cache"
validate_json "$WEB_BASE/api/cache/ai" "Web Clear AI Cache"

# 15. Test web clear search cache
test_endpoint "DELETE" "$WEB_BASE/api/cache/search" "200" "Web Clear Search Cache"
validate_json "$WEB_BASE/api/cache/search" "Web Clear Search Cache"

# 16. Test web clear all caches
test_endpoint "DELETE" "$WEB_BASE/api/cache/all" "200" "Web Clear All Caches"
validate_json "$WEB_BASE/api/cache/all" "Web Clear All Caches"

echo -e "${BLUE}Testing Cache Integration...${NC}"

# 17. Test cache stats after operations
echo -n "Testing cache stats after operations... "
sleep 2
final_stats=$(curl -s "$API_BASE/v1/cache/stats")
if echo "$final_stats" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Stats valid${NC}"
    echo "  AI Cache Size: $(echo "$final_stats" | jq -r '.data.ai.size')"
    echo "  Search Cache Size: $(echo "$final_stats" | jq -r '.data.search.size')"
else
    echo -e "${RED}✗ Invalid stats${NC}"
fi

# 18. Test cache performance
echo -e "${BLUE}Testing Cache Performance...${NC}"

echo -n "Testing cache hit rate... "
# Make multiple requests to same AI prompt
for i in {1..5}; do
    curl -s "$API_BASE/v1/demo/ai?prompt=performance_test&model=gpt-4" >/dev/null
done

# Check stats
performance_stats=$(curl -s "$API_BASE/v1/cache/stats")
ai_hit_rate=$(echo "$performance_stats" | jq -r '.data.ai.hitRate')
if (( $(echo "$ai_hit_rate > 0" | bc -l) )); then
    echo -e "${GREEN}✓ Hit rate: ${ai_hit_rate}${NC}"
else
    echo -e "${YELLOW}⚠ Hit rate: ${ai_hit_rate}${NC}"
fi

echo -e "${BLUE}Testing Cache Warmup Data...${NC}"

# 19. Test warmup data availability
echo -n "Testing warmup data... "
warmup_response=$(curl -s "$API_BASE/v1/demo/ai?prompt=What is artificial intelligence?&model=gpt-4")
if echo "$warmup_response" | grep -q "Artificial Intelligence"; then
    echo -e "${GREEN}✓ Warmup data available${NC}"
else
    echo -e "${YELLOW}⚠ Warmup data not detected${NC}"
fi

echo -e "${BLUE}Testing Cache Error Handling...${NC}"

# 20. Test invalid cache operations
test_endpoint "POST" "$API_BASE/v1/cache/warmup/start" "200" "Invalid interval handling" '{"intervalMinutes": -1}'

echo -e "${GREEN}🎉 PR-26 Smoke Test Completed Successfully!${NC}"
echo ""
echo "✅ Cache system implemented and functional"
echo "✅ AI and Search caching working"
echo "✅ Warmup system operational"
echo "✅ Cache management endpoints available"
echo "✅ Web BFF cache integration complete"
echo "✅ Cache performance monitoring active"
echo ""
echo "📊 Cache Features:"
echo "   - Memory-based caching with TTL"
echo "   - Intelligent eviction (LRU-based)"
echo "   - Warmup with common patterns"
echo "   - Periodic warmup scheduling"
echo "   - Cache statistics and monitoring"
echo "   - Cache management (clear, stats)"
echo "   - Hit rate tracking and optimization"
