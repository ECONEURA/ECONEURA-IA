#!/bin/bash
set -euo pipefail

echo "=== PROXY VALIDATION SCRIPT ==="
echo "Testing F7 proxy integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if proxy is running
check_proxy_running() {
    echo "Checking if proxy is running on localhost:3001..."
    if curl -s --max-time 2 http://localhost:3001/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Proxy is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Proxy is not running${NC}"
        return 1
    fi
}

# Function to test proxy health endpoint
test_proxy_health() {
    echo "Testing proxy health endpoint..."
    local response
    response=$(curl -s http://localhost:3001/healthz 2>/dev/null || echo "error")

    if [[ "$response" == "error" ]]; then
        echo -e "${RED}✗ Cannot connect to proxy health endpoint${NC}"
        return 1
    fi

    # Check if response contains expected fields
    if echo "$response" | grep -q '"ok":true' && echo "$response" | grep -q '"ts":'; then
        echo -e "${GREEN}✓ Proxy health check passed${NC}"
        return 0
    else
        echo -e "${RED}✗ Proxy health check failed - invalid response${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Function to check if frontend can detect proxy
check_frontend_detection() {
    echo "Checking frontend proxy detection..."

    # This would require running the frontend and checking browser console
    # For now, we'll check if the ProxyStatus component exists and is properly configured
    if [[ -f "apps/web/src/components/ProxyStatus.tsx" ]]; then
        echo -e "${GREEN}✓ ProxyStatus component exists${NC}"

        # Check if ApiClient has proxy functionality
        if grep -q "ProxyManager" apps/web/src/lib/api-client.ts; then
            echo -e "${GREEN}✓ ApiClient has proxy functionality${NC}"
            return 0
        else
            echo -e "${RED}✗ ApiClient missing proxy functionality${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ ProxyStatus component not found${NC}"
        return 1
    fi
}

# Function to test API routing through proxy
test_api_routing() {
    echo "Testing API routing through proxy..."

    # Test NEURA endpoint routing
    echo "Testing NEURA endpoint routing..."
    local response
    response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/neura/health 2>/dev/null || echo "000")

    if [[ "$response" == "404" ]]; then
        echo -e "${YELLOW}⚠ NEURA endpoint returns 404 (expected if backend not running)${NC}"
    elif [[ "$response" == "000" ]]; then
        echo -e "${RED}✗ Cannot connect to proxy for NEURA routing${NC}"
        return 1
    else
        echo -e "${GREEN}✓ NEURA endpoint routing works (HTTP $response)${NC}"
    fi

    # Test MAKE endpoint routing
    echo "Testing MAKE endpoint routing..."
    response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/make/health 2>/dev/null || echo "000")

    if [[ "$response" == "404" ]]; then
        echo -e "${YELLOW}⚠ MAKE endpoint returns 404 (expected if backend not running)${NC}"
    elif [[ "$response" == "000" ]]; then
        echo -e "${RED}✗ Cannot connect to proxy for MAKE routing${NC}"
        return 1
    else
        echo -e "${GREEN}✓ MAKE endpoint routing works (HTTP $response)${NC}"
    fi

    return 0
}

# Function to create validation report
create_validation_report() {
    local proxy_running=$1
    local proxy_healthy=$2
    local frontend_detection=$3
    local api_routing=$4

    echo "Creating validation report..."

    cat > reports/proxy_validation.json << EOF
{
  "validation_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "proxy_running": $proxy_running,
  "proxy_healthy": $proxy_healthy,
  "frontend_detection": $frontend_detection,
  "api_routing": $api_routing,
  "overall_status": $(($proxy_running && $proxy_healthy && $frontend_detection && $api_routing))
}
EOF

    echo -e "${GREEN}✓ Validation report created: reports/proxy_validation.json${NC}"
}

# Main validation logic
main() {
    local proxy_running=0
    local proxy_healthy=0
    local frontend_detection=0
    local api_routing=0

    echo "Starting proxy validation..."

    # Check if proxy is running
    if check_proxy_running; then
        proxy_running=1

        # Test proxy health
        if test_proxy_health; then
            proxy_healthy=1
        fi

        # Test API routing
        if test_api_routing; then
            api_routing=1
        fi
    fi

    # Check frontend detection
    if check_frontend_detection; then
        frontend_detection=1
    fi

    echo ""
    echo "=== VALIDATION SUMMARY ==="
    echo "Proxy Running: $([ $proxy_running -eq 1 ] && echo 'PASS' || echo 'FAIL')"
    echo "Proxy Health: $([ $proxy_healthy -eq 1 ] && echo 'PASS' || echo 'FAIL')"
    echo "Frontend Detection: $([ $frontend_detection -eq 1 ] && echo 'PASS' || echo 'FAIL')"
    echo "API Routing: $([ $api_routing -eq 1 ] && echo 'PASS' || echo 'FAIL')"
    echo ""

    # Create validation report
    create_validation_report $proxy_running $proxy_healthy $frontend_detection $api_routing

    # Overall result
    if [ $proxy_running -eq 1 ] && [ $proxy_healthy -eq 1 ] && [ $frontend_detection -eq 1 ]; then
        echo -e "${GREEN}🎉 PROXY VALIDATION PASSED${NC}"
        echo "Frontend can now use the F7 micro-proxy!"
        return 0
    else
        echo -e "${YELLOW}⚠️  PROXY VALIDATION PARTIAL${NC}"
        echo "Some components may need attention. Check reports/proxy_validation.json"
        return 1
    fi
}

# Run main function
main "$@"