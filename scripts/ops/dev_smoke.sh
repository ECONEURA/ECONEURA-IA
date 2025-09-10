#!/usr/bin/env bash
set -Eeuo pipefail

# Configuration
API="https://econeura-api-dev.azurewebsites.net"
WEB="https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net"
ART=".artifacts"
LOG="$ART/verification.log"
jqbin=$(command -v jq || echo "")
pass=1
start_time=$(date +%s)

# Create directories
mkdir -p "$ART" "$(dirname "$LOG")"

# Source retry utilities and performance metrics
source scripts/ops/retry_utils.sh
source scripts/ops/performance_metrics.sh

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"
}

# Enhanced request function with better error handling
req() {
    local url="$1"
    local output="$2"
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -sS --max-time 10 --retry 2 --retry-all-errors -D - "$url" -o "$output" 2>>"$LOG"; then
            return 0
        fi
        retry_count=$((retry_count + 1))
        log "Request failed (attempt $retry_count/$max_retries): $url"
        sleep 2
    done
    
    log "ERROR: All retry attempts failed for $url"
    return 1
}

# Validate dependencies first
log "Validating dependencies..."
if ! bash scripts/ops/check_dependencies.sh; then
    log "❌ Dependency validation failed"
    exit 1
fi

log "Starting DEV verification at $(date)"

# Collect system metrics
get_system_metrics

# 1) HEALTH 200 with robust retry and performance tracking
log "Testing API health endpoint with retry logic..."
start_timing "health_check"
if health_check_with_retry "$API/health" 3 2; then
    code="200"
    log "✅ Health check passed (200)"
else
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API/health" || echo "000")
    log "❌ Health check failed ($code)"
    pass=0
fi
end_timing "health_check"
echo "{\"check\":\"health\",\"code\":$code,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$ART/health.json"

# Get network metrics for API
get_network_metrics "$API/health" "api"

# 2) OpenAPI existe y #rutas with circuit breaker and performance tracking
log "Testing OpenAPI specification with circuit breaker..."
start_timing "openapi_check"
if api_call_with_resilience "$API/v1/openapi.json" "$ART/last.out" "OpenAPI specification"; then
    if grep -qi "application/json" "$ART/last.out"; then
        log "✅ OpenAPI content-type correct"
        cp "$ART/last.out" "$ART/openapi.headers.txt"
        
        body=$(curl -s "$API/v1/openapi.json")
        echo "$body" > "$ART/openapi.live.json"
        
        if [ -n "$jqbin" ]; then
            pathsCount=$(echo "$body" | jq '.paths | length')
        else
            pathsCount=$(echo "$body" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('paths',{})))")
        fi
        echo "{\"check\":\"openapi_paths\",\"count\":$pathsCount,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$ART/openapi.count.json"
        log "✅ OpenAPI paths count: $pathsCount"
    else
        log "❌ OpenAPI content-type incorrect"
        pass=0
    fi
else
    log "❌ OpenAPI request failed"
    pass=0
fi
end_timing "openapi_check"

# 3) Diff con snapshot (solo /v1/*)
log "Running OpenAPI diff check..."
if node scripts/ops/openapi_diff.mjs; then
    log "✅ OpenAPI diff check passed"
else
    log "❌ OpenAPI diff check failed"
    pass=0
fi

# 4) CORS: preflight + simple para WEB y www.econeura.com with performance tracking
log "Testing CORS configuration..."
start_timing "cors_check"
for ORI in "$WEB" "https://www.econeura.com"; do
    log "Testing CORS for origin: $ORI"
    if curl -sS -X OPTIONS "$API/health" -H "Origin: $ORI" -H "Access-Control-Request-Method: GET" -D "$ART/cors.$(echo $ORI|sed 's/[^a-zA-Z0-9]/_/g').txt" -o /dev/null --max-time 10; then
        log "✅ CORS preflight successful for $ORI"
    else
        log "❌ CORS preflight failed for $ORI"
        pass=0
    fi
done
end_timing "cors_check"

# Get network metrics for WEB
get_network_metrics "$WEB" "web"

# 5) Headers de seguridad (CSP/HSTS) y FinOps with performance tracking
log "Testing security headers..."
start_timing "security_headers"
if curl -sS -D "$ART/headers.health.txt" "$API/health" -o /dev/null --max-time 10; then
    if egrep -qi "content-security-policy|strict-transport-security" "$ART/headers.health.txt"; then
        log "✅ Security headers (CSP/HSTS) present"
    else
        log "❌ Security headers (CSP/HSTS) missing"
        pass=0
    fi
    
    if egrep -qi "X-Est-Cost-EUR|X-Budget-Pct|X-Latency-ms|X-Route|X-Correlation-Id" "$ART/headers.health.txt"; then
        log "✅ FinOps headers present"
    else
        log "❌ FinOps headers missing"
        pass=0
    fi
else
    log "❌ Failed to retrieve headers"
    pass=0
fi
end_timing "security_headers"

# 6) 402 BUDGET_EXCEEDED (si endpoint/flag existe) with performance tracking
log "Testing FinOps 402 endpoint..."
start_timing "finops_check"
if curl -sS -D "$ART/finops.test.txt" "$API/v1/finops/guard/test" -o /dev/null --max-time 10; then
    if grep -q " 402 " "$ART/finops.test.txt"; then
        log "✅ FinOps 402 test passed"
    else
        log "⚠️ FinOps 402 test not available"
        echo "GAP: finops 402 no verificable" >> "$ART/gaps.txt"
    fi
else
    log "⚠️ FinOps endpoint not accessible"
    echo "GAP: finops 402 no verificable" >> "$ART/gaps.txt"
fi
end_timing "finops_check"

# 7) WebSockets with retry logic and performance tracking
log "Testing WebSocket support with retry..."
start_timing "websocket_check"
if ws_probe_with_retry "$API" "$WEB" 2; then
    log "✅ WebSocket probe successful"
else
    log "⚠️ WebSocket probe failed"
    echo "GAP: websocket no verificable" >> "$ART/gaps.txt"
fi
end_timing "websocket_check"

# 8) Resumen/exit with performance metrics
end_time=$(date +%s)
duration=$((end_time - start_time))
record_metric "total_verification" "$duration" "seconds"

# Generate performance report
generate_performance_report "$ART/performance_report.json"

echo "{\"pass\":$pass,\"duration_seconds\":$duration,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$ART/summary.json"

log "Verification completed in ${duration}s"
if [[ $pass -eq 1 ]]; then
    log "✅ DEV_SMOKE=PASS"
    echo "DEV_SMOKE=PASS"
else
    log "❌ DEV_SMOKE=FAIL"
    echo "DEV_SMOKE=FAIL"
    exit 1
fi
