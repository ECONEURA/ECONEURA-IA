#!/bin/bash

# ECONEURA Smoke Test Script
# Tests critical endpoints and functionality

set -e

# Configuration
API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
TIMEOUT=10
VERBOSE=${VERBOSE:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test function
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local expected_status="$3"
    local description="$4"
    local payload="$5"
    
    log_info "Testing: $description"
    
    if [ "$VERBOSE" = true ]; then
        log_info "  Method: $method"
        log_info "  Endpoint: $endpoint"
        log_info "  Expected status: $expected_status"
    fi
    
    local curl_cmd="curl -s -w '%{http_code}|%{time_total}' --max-time $TIMEOUT"
    
    if [ "$method" = "POST" ] && [ -n "$payload" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json' -d '$payload'"
    elif [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json'"
    fi
    
    local response
    response=$(eval "$curl_cmd '$endpoint'" 2>/dev/null || echo "000|0.000")
    
    local status_code="${response##*|}"
    local response_time="${response##*|}"
    local body="${response%|*|*}"
    
    # Extract just the status code (last 3 characters)
    status_code="${status_code: -3}"
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "✅ $description (${status_code}, ${response_time}s)"
        return 0
    else
        log_error "❌ $description - Expected $expected_status, got $status_code"
        if [ "$VERBOSE" = true ] && [ -n "$body" ]; then
            log_error "   Response: $body"
        fi
        return 1
    fi
}

# Test health endpoint performance
test_health_performance() {
    log_info "Testing health endpoint performance..."
    
    local total_time=0
    local iterations=5
    
    for i in $(seq 1 $iterations); do
        local response
        response=$(curl -s -w '%{time_total}' --max-time 1 "$API_URL/health" -o /dev/null 2>/dev/null || echo "1.000")
        total_time=$(echo "$total_time + $response" | bc -l)
    done
    
    local avg_time
    avg_time=$(echo "scale=3; $total_time / $iterations" | bc -l)
    local avg_ms
    avg_ms=$(echo "scale=0; $avg_time * 1000" | bc -l)
    
    if (( $(echo "$avg_time < 0.2" | bc -l) )); then
        log_success "✅ Health endpoint performance: ${avg_ms}ms (< 200ms)"
        return 0
    else
        log_error "❌ Health endpoint too slow: ${avg_ms}ms (should be < 200ms)"
        return 1
    fi
}

# Main test execution
main() {
    log_info "🚀 Starting ECONEURA Smoke Tests"
    log_info "API URL: $API_URL"
    log_info "Web URL: $WEB_URL"
    echo
    
    local failed_tests=0
    local total_tests=0
    
    # Core health checks
    log_info "=== Core Health Checks ==="
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/health" "200" "API Health Check" || ((failed_tests++))
    
    ((total_tests++))
    test_health_performance || ((failed_tests++))
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/v1/ping" "200" "API Ping" || ((failed_tests++))
    
    echo
    
    # Agent system tests
    log_info "=== Agent System Tests ==="
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/v1/agents" "200" "List all agents" || ((failed_tests++))
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/v1/agents?category=ventas" "200" "List sales agents" || ((failed_tests++))
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/v1/agents/lead-enrich" "200" "Get specific agent details" || ((failed_tests++))
    
    # Test agent execution (with mock data)
    local agent_payload='{
        "agentId": "lead-enrich",
        "inputs": {
            "companyName": "Test Company",
            "website": "https://test.com"
        },
        "context": {
            "orgId": "test-org",
            "userId": "test-user",
            "correlationId": "test-123"
        }
    }'
    
    ((total_tests++))
    test_endpoint "POST" "$API_URL/v1/agents/run" "200" "Execute agent" "$agent_payload" || ((failed_tests++))
    
    echo
    
    # Cockpit system tests
    log_info "=== Cockpit System Tests ==="
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/v1/cockpit/overview" "200" "Cockpit overview" || ((failed_tests++))
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/v1/cockpit/agents" "200" "Agent statistics" || ((failed_tests++))
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/v1/cockpit/costs" "200" "Cost breakdown" || ((failed_tests++))
    
    echo
    
    # Metrics and monitoring
    log_info "=== Metrics and Monitoring ==="
    
    ((total_tests++))
    test_endpoint "GET" "$API_URL/metrics" "200" "Prometheus metrics" || ((failed_tests++))
    
    echo
    
    # Web application tests (if running)
    log_info "=== Web Application Tests ==="
    
    if curl -s --max-time 5 "$WEB_URL" > /dev/null 2>&1; then
        ((total_tests++))
        test_endpoint "GET" "$WEB_URL" "200" "Web application home" || ((failed_tests++))
        
        ((total_tests++))
        test_endpoint "GET" "$WEB_URL/api/health" "200" "Web BFF health" || ((failed_tests++))
    else
        log_warning "Web application not running, skipping web tests"
    fi
    
    echo
    
    # Summary
    log_info "=== Test Summary ==="
    local passed_tests=$((total_tests - failed_tests))
    
    if [ $failed_tests -eq 0 ]; then
        log_success "🎉 All tests passed! ($passed_tests/$total_tests)"
        echo
        echo "RESULTADOS: PASS"
        exit 0
    else
        log_error "❌ $failed_tests/$total_tests tests failed"
        echo
        echo "RESULTADOS: FAIL"
        exit 1
    fi
}

# Help function
show_help() {
    echo "ECONEURA Smoke Test Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -v, --verbose       Enable verbose output"
    echo "  --api-url URL       API base URL (default: http://localhost:4000)"
    echo "  --web-url URL       Web base URL (default: http://localhost:3000)"
    echo "  --timeout SECONDS   Request timeout (default: 10)"
    echo
    echo "Environment variables:"
    echo "  API_URL            API base URL"
    echo "  WEB_URL            Web base URL"
    echo "  VERBOSE            Enable verbose output (true/false)"
    echo
    echo "Examples:"
    echo "  $0                                    # Run with defaults"
    echo "  $0 --verbose                          # Run with verbose output"
    echo "  $0 --api-url https://api.econeura.com # Test production API"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --web-url)
            WEB_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check dependencies
if ! command -v curl &> /dev/null; then
    log_error "curl is required but not installed"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_error "bc is required but not installed"
    exit 1
fi

# Run main function
main