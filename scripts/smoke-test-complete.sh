#!/bin/bash

# ECONEURA Smoke Test Complete - Validates all implemented endpoints
# This script tests the complete API surface according to ECONEURA specifications

set -e

API_URL="${API_URL:-https://econeura-api-dev.azurewebsites.net}"
ORG_ID="${ORG_ID:-org-demo}"
USER_ID="${USER_ID:-user-demo}"

echo "🚀 ECONEURA SMOKE TEST - COMPLETE API SURFACE"
echo "=============================================="
echo "API_URL: $API_URL"
echo "ORG_ID: $ORG_ID"
echo ""

# Test 1: Health endpoint (CRITICAL - must be <200ms)
echo "1️⃣  Testing /health endpoint..."
HEALTH_START=$(date +%s%3N)
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$API_URL/health")
HEALTH_END=$(date +%s%3N)
HEALTH_LATENCY=$((HEALTH_END - HEALTH_START))

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health endpoint: 200 OK ($HEALTH_LATENCY ms)"
    if [ $HEALTH_LATENCY -lt 200 ]; then
        echo "✅ Latency under 200ms requirement"
    else
        echo "❌ Latency exceeded 200ms: $HEALTH_LATENCY ms"
        exit 1
    fi
    
    # Validate response format
    if jq -e '.status == "ok" and .ts and .version' /tmp/health_response.json > /dev/null; then
        echo "✅ Health response format valid"
    else
        echo "❌ Health response format invalid"
        cat /tmp/health_response.json
        exit 1
    fi
else
    echo "❌ Health endpoint failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: Health modes with X-System-Mode header
echo ""
echo "2️⃣  Testing health modes..."
LIVE_HEADERS=$(curl -s -I "$API_URL/health/live" | grep -i "x-system-mode")
if [[ $LIVE_HEADERS == *"X-System-Mode"* ]]; then
    echo "✅ X-System-Mode header present in /health/live"
else
    echo "❌ X-System-Mode header missing in /health/live"
    exit 1
fi

# Test 3: Companies endpoint with RLS headers
echo ""
echo "3️⃣  Testing /v1/companies endpoint..."
COMPANIES_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "x-org-id: $ORG_ID" \
    -H "x-user-id: $USER_ID" \
    -o /tmp/companies_response.json \
    "$API_URL/v1/companies")

if [ "$COMPANIES_RESPONSE" = "200" ]; then
    echo "✅ Companies endpoint: 200 OK"
    
    # Check for demo data
    if jq -e '.success == true and .data and (.data | type == "array")' /tmp/companies_response.json > /dev/null; then
        echo "✅ Companies response format valid"
        COMPANY_COUNT=$(jq '.data | length' /tmp/companies_response.json)
        echo "📊 Found $COMPANY_COUNT companies"
    else
        echo "❌ Companies response format invalid"
        exit 1
    fi
else
    echo "❌ Companies endpoint failed: $COMPANIES_RESPONSE"
    exit 1
fi

# Test 4: Agents registry (60 agents)
echo ""
echo "4️⃣  Testing /v1/agents endpoint (60 agents)..."
AGENTS_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "x-org-id: $ORG_ID" \
    -o /tmp/agents_response.json \
    "$API_URL/v1/agents")

if [ "$AGENTS_RESPONSE" = "200" ]; then
    echo "✅ Agents endpoint: 200 OK"
    
    # Validate 60 agents
    AGENT_COUNT=$(jq '.count // (.data | length)' /tmp/agents_response.json)
    if [ "$AGENT_COUNT" = "60" ]; then
        echo "✅ All 60 agents present"
        
        # Check categories
        VENTAS_COUNT=$(jq '.categories.ventas // (.data | map(select(.category == "ventas")) | length)' /tmp/agents_response.json)
        MARKETING_COUNT=$(jq '.categories.marketing // (.data | map(select(.category == "marketing")) | length)' /tmp/agents_response.json)
        
        echo "📊 Categories: Ventas($VENTAS_COUNT), Marketing($MARKETING_COUNT), ..."
    else
        echo "❌ Expected 60 agents, found: $AGENT_COUNT"
        exit 1
    fi
    
    # Check FinOps headers
    HEADERS_CHECK=$(curl -s -I -H "x-org-id: $ORG_ID" "$API_URL/v1/agents" | grep -E "X-Est-Cost-EUR|X-Budget-Pct|X-Correlation-Id")
    if [[ $HEADERS_CHECK == *"X-Est-Cost-EUR"* && $HEADERS_CHECK == *"X-Budget-Pct"* ]]; then
        echo "✅ FinOps headers present"
    else
        echo "❌ FinOps headers missing"
        exit 1
    fi
else
    echo "❌ Agents endpoint failed: $AGENTS_RESPONSE"
    exit 1
fi

# Test 5: Agent execution
echo ""
echo "5️⃣  Testing agent execution..."
EXEC_RESPONSE=$(curl -s -w "%{http_code}" \
    -X POST \
    -H "x-org-id: $ORG_ID" \
    -H "x-user-id: $USER_ID" \
    -H "Content-Type: application/json" \
    -d '{"agentId":"lead-enrich","inputs":{"leadId":"test-123"},"idempotencyKey":"test-'$(date +%s)'"}' \
    -o /tmp/exec_response.json \
    "$API_URL/v1/agents/run")

if [ "$EXEC_RESPONSE" = "202" ]; then
    echo "✅ Agent execution started: 202 Accepted"
    
    EXEC_ID=$(jq -r '.data.executionId' /tmp/exec_response.json)
    echo "📋 Execution ID: $EXEC_ID"
    
    # Wait a moment and check status
    sleep 2
    STATUS_RESPONSE=$(curl -s -w "%{http_code}" \
        -H "x-org-id: $ORG_ID" \
        -o /tmp/status_response.json \
        "$API_URL/v1/agents/runs/$EXEC_ID")
    
    if [ "$STATUS_RESPONSE" = "200" ]; then
        echo "✅ Agent execution status: 200 OK"
        STATUS=$(jq -r '.data.status' /tmp/status_response.json)
        echo "📊 Execution status: $STATUS"
    else
        echo "⚠️  Agent execution status check failed: $STATUS_RESPONSE"
    fi
else
    echo "❌ Agent execution failed: $EXEC_RESPONSE"
    exit 1
fi

# Test 6: Analytics events
echo ""
echo "6️⃣  Testing analytics events..."
ANALYTICS_RESPONSE=$(curl -s -w "%{http_code}" \
    -X POST \
    -H "x-org-id: $ORG_ID" \
    -H "x-user-id: $USER_ID" \
    -H "Content-Type: application/json" \
    -d '{"eventType":"user_action","action":"test_smoke","resource":"api","success":true}' \
    -o /tmp/analytics_response.json \
    "$API_URL/v1/analytics/events")

if [ "$ANALYTICS_RESPONSE" = "201" ]; then
    echo "✅ Analytics events: 201 Created"
else
    echo "❌ Analytics events failed: $ANALYTICS_RESPONSE"
    exit 1
fi

# Test 7: Cockpit overview
echo ""
echo "7️⃣  Testing cockpit overview..."
COCKPIT_RESPONSE=$(curl -s -w "%{http_code}" \
    -H "x-org-id: $ORG_ID" \
    -H "x-user-id: $USER_ID" \
    -o /tmp/cockpit_response.json \
    "$API_URL/v1/cockpit/overview")

if [ "$COCKPIT_RESPONSE" = "200" ]; then
    echo "✅ Cockpit overview: 200 OK"
    
    # Check key cockpit metrics
    if jq -e '.data.system and .data.agents and .data.budget and .data.performance' /tmp/cockpit_response.json > /dev/null; then
        echo "✅ Cockpit data structure valid"
        
        SYSTEM_MODE=$(jq -r '.data.system.mode' /tmp/cockpit_response.json)
        RUNNING_AGENTS=$(jq -r '.data.agents.running' /tmp/cockpit_response.json)
        BUDGET_PCT=$(jq -r '.data.budget.utilizationPct' /tmp/cockpit_response.json)
        
        echo "📊 System mode: $SYSTEM_MODE"
        echo "📊 Running agents: $RUNNING_AGENTS"
        echo "📊 Budget utilization: $BUDGET_PCT%"
    else
        echo "❌ Cockpit data structure invalid"
        exit 1
    fi
else
    echo "❌ Cockpit overview failed: $COCKPIT_RESPONSE"
    exit 1
fi

# Test 8: CORS preflight (simulate)
echo ""
echo "8️⃣  Testing CORS configuration..."
CORS_RESPONSE=$(curl -s -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: https://www.econeura.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: x-org-id" \
    -o /tmp/cors_response.json \
    "$API_URL/v1/companies")

echo "📋 CORS preflight response: $CORS_RESPONSE"
echo "⚠️  Note: CORS must be configured in Azure Portal exactly as specified"

# Test 9: Performance validation
echo ""
echo "9️⃣  Performance validation..."
echo "Health endpoint latency: $HEALTH_LATENCY ms (requirement: <200ms)"

if [ $HEALTH_LATENCY -lt 200 ]; then
    PERF_STATUS="PASS"
else
    PERF_STATUS="FAIL"
fi

# Test 10: Final validation
echo ""
echo "🔟 Final system validation..."

# Count successful endpoints
SUCCESSFUL_TESTS=0
[ "$HEALTH_RESPONSE" = "200" ] && ((SUCCESSFUL_TESTS++))
[ "$COMPANIES_RESPONSE" = "200" ] && ((SUCCESSFUL_TESTS++))
[ "$AGENTS_RESPONSE" = "200" ] && ((SUCCESSFUL_TESTS++))
[ "$EXEC_RESPONSE" = "202" ] && ((SUCCESSFUL_TESTS++))
[ "$ANALYTICS_RESPONSE" = "201" ] && ((SUCCESSFUL_TESTS++))
[ "$COCKPIT_RESPONSE" = "200" ] && ((SUCCESSFUL_TESTS++))

echo ""
echo "📊 SMOKE TEST RESULTS"
echo "===================="
echo "✅ Successful endpoints: $SUCCESSFUL_TESTS/6"
echo "⏱️  Health latency: $HEALTH_LATENCY ms"
echo "🤖 Agents available: $AGENT_COUNT"
echo "🎛️  Cockpit status: $SYSTEM_MODE"
echo "💰 Budget utilization: $BUDGET_PCT%"
echo ""

# Final result
if [ $SUCCESSFUL_TESTS -eq 6 ] && [ $HEALTH_LATENCY -lt 200 ] && [ "$AGENT_COUNT" = "60" ]; then
    echo "RESULTADOS: PASS"
    echo "✅ All critical endpoints operational"
    echo "✅ Health endpoint under 200ms"
    echo "✅ 60 AI agents registry complete"
    echo "✅ FinOps headers present"
    echo "✅ Cockpit operational"
    echo ""
    echo "🎉 ECONEURA API is ready for Azure deployment!"
    exit 0
else
    echo "RESULTADOS: FAIL"
    echo "❌ Some tests failed or requirements not met"
    echo "🔍 Check logs above for details"
    exit 1
fi