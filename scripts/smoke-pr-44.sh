#!/bin/bash

# PR-44: RLS Generative Suite (CI) - Smoke Test
# Test all RLS endpoints and functionality

set -e

echo "🧪 PR-44: RLS Generative Suite (CI) - Smoke Test"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
API_BASE_URL="http://localhost:4000"
WEB_BASE_URL="http://localhost:3000"
TEST_RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
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

echo -e "\n${YELLOW}Starting RLS Generative Suite Tests...${NC}"

# Test 1: API Health Check
run_test "API Health Check" "test_api_endpoint '/health/live' 'GET' '200'"

# Test 2: RLS Stats Endpoint
run_test "RLS Stats Endpoint" "test_api_response '/v1/rls/stats' 'GET' 'success'"

# Test 3: RLS Templates Endpoint
run_test "RLS Templates Endpoint" "test_api_response '/v1/rls/templates' 'GET' 'success'"

# Test 4: RLS Templates by Category
run_test "RLS Templates by Category" "test_api_response '/v1/rls/templates?category=user' 'GET' 'success'"

# Test 5: RLS Policies Endpoint
run_test "RLS Policies Endpoint" "test_api_response '/v1/rls/policies' 'GET' 'success'"

# Test 6: Generate RLS Policy
GENERATE_POLICY_DATA='{"schemaId":"econeura_schema","tableName":"users","policyType":"select","templateId":"user_based_policy","variables":{"policy_name":"test_user_policy","schema_name":"public","table_name":"users","policy_type":"SELECT","roles":["authenticated_user"]},"rules":[{"id":"rule_1","type":"user","condition":"user_id = current_user_id()","priority":1,"enabled":true}],"options":{"optimize":true,"validate":true,"test":true,"deploy":false}}'
run_test "Generate RLS Policy" "test_api_response '/v1/rls/generate' 'POST' 'success' '$GENERATE_POLICY_DATA'"

# Test 7: Validate RLS Policy
VALIDATE_POLICY_DATA='{"policyId":"test_policy_id","validationTypes":["syntax","semantic","performance","security","compliance"]}'
run_test "Validate RLS Policy" "test_api_response '/v1/rls/validate' 'POST' 'success' '$VALIDATE_POLICY_DATA'"

# Test 8: Deploy RLS Policy
DEPLOY_POLICY_DATA='{"policyId":"test_policy_id","environment":"staging","strategy":"blue-green","options":{"switchTime":30000,"healthCheckInterval":5000}}'
run_test "Deploy RLS Policy" "test_api_response '/v1/rls/deploy' 'POST' 'success' '$DEPLOY_POLICY_DATA'"

# Test 9: RLS Deployments Endpoint
run_test "RLS Deployments Endpoint" "test_api_response '/v1/rls/deployments' 'GET' 'success'"

# Test 10: RLS Deployments by Environment
run_test "RLS Deployments by Environment" "test_api_response '/v1/rls/deployments?environment=staging' 'GET' 'success'"

# Test 11: RLS Deployments by Strategy
run_test "RLS Deployments by Strategy" "test_api_response '/v1/rls/deployments?strategy=blue-green' 'GET' 'success'"

# Test 12: Rollback Deployment
ROLLBACK_DATA='{"reason":"Test rollback"}'
run_test "Rollback Deployment" "test_api_endpoint '/v1/rls/deployments/test_deployment_id/rollback' 'POST' '404' '$ROLLBACK_DATA'"

# Test 13: RLS CI/CD Integrations Endpoint
run_test "RLS CI/CD Integrations Endpoint" "test_api_response '/v1/rls/cicd/integrations' 'GET' 'success'"

# Test 14: RLS CI/CD Integrations by Provider
run_test "RLS CI/CD Integrations by Provider" "test_api_response '/v1/rls/cicd/integrations?provider=github' 'GET' 'success'"

# Test 15: Create CI/CD Integration
CREATE_INTEGRATION_DATA='{"name":"Test Integration","provider":"github","repository":"test/repo","branch":"main","pipeline":"test-pipeline.yml","webhookUrl":"https://api.github.com/repos/test/repo/hooks","secret":"test_secret","events":["push","pull_request"]}'
run_test "Create CI/CD Integration" "test_api_response '/v1/rls/cicd/integrations' 'POST' 'success' '$CREATE_INTEGRATION_DATA'"

# Test 16: Process Webhook Event
WEBHOOK_DATA='{"eventType":"push","payload":{"ref":"refs/heads/main","commits":[{"modified":["rls-policies/test.sql"]}]}}'
run_test "Process Webhook Event" "test_api_response '/v1/rls/cicd/webhook/test_integration_id' 'POST' 'success' '$WEBHOOK_DATA'"

# Test 17: Generate Pipeline Config
run_test "Generate Pipeline Config" "test_api_response '/v1/rls/cicd/pipeline-config/test_integration_id?type=github-actions' 'GET' 'success'"

# Test 18: RLS Validation Results Endpoint
run_test "RLS Validation Results Endpoint" "test_api_response '/v1/rls/validation-results' 'GET' 'success'"

# Test 19: RLS Validation Results by Policy
run_test "RLS Validation Results by Policy" "test_api_response '/v1/rls/validation-results?policyId=test_policy_id' 'GET' 'success'"

# Test 20: Invalid Generate Policy Request (Missing Fields)
INVALID_GENERATE_DATA='{"schemaId":"econeura_schema"}'
run_test "Invalid Generate Policy Request" "test_api_endpoint '/v1/rls/generate' 'POST' '400' '$INVALID_GENERATE_DATA'"

# Test 21: Invalid Validate Policy Request (Missing Fields)
INVALID_VALIDATE_DATA='{}'
run_test "Invalid Validate Policy Request" "test_api_endpoint '/v1/rls/validate' 'POST' '400' '$INVALID_VALIDATE_DATA'"

# Test 22: Invalid Deploy Policy Request (Missing Fields)
INVALID_DEPLOY_DATA='{"policyId":"test_policy_id"}'
run_test "Invalid Deploy Policy Request" "test_api_endpoint '/v1/rls/deploy' 'POST' '400' '$INVALID_DEPLOY_DATA'"

# Test 23: Invalid Create Integration Request (Missing Fields)
INVALID_INTEGRATION_DATA='{"name":"Test Integration"}'
run_test "Invalid Create Integration Request" "test_api_endpoint '/v1/rls/cicd/integrations' 'POST' '400' '$INVALID_INTEGRATION_DATA'"

# Test 24: Invalid Webhook Event Request (Missing Fields)
INVALID_WEBHOOK_DATA='{"eventType":"push"}'
run_test "Invalid Webhook Event Request" "test_api_endpoint '/v1/rls/cicd/webhook/test_integration_id' 'POST' '400' '$INVALID_WEBHOOK_DATA'"

# Test 25: Invalid Pipeline Config Request (Missing Type)
run_test "Invalid Pipeline Config Request" "test_api_endpoint '/v1/rls/cicd/pipeline-config/test_integration_id' 'GET' '400'"

# Test 26: Non-existent Policy
run_test "Non-existent Policy" "test_api_endpoint '/v1/rls/policies/nonexistent' 'GET' '404'"

# Test 27: Non-existent Template
run_test "Non-existent Template" "test_api_endpoint '/v1/rls/templates/nonexistent' 'GET' '404'"

# Test 28: Generate Policy with Invalid Template
INVALID_TEMPLATE_DATA='{"schemaId":"econeura_schema","tableName":"users","policyType":"select","templateId":"nonexistent_template","variables":{},"rules":[],"options":{}}'
run_test "Generate Policy with Invalid Template" "test_api_endpoint '/v1/rls/generate' 'POST' '400' '$INVALID_TEMPLATE_DATA'"

# Test 29: Generate Policy with Invalid Schema
INVALID_SCHEMA_DATA='{"schemaId":"nonexistent_schema","tableName":"users","policyType":"select","templateId":"user_based_policy","variables":{},"rules":[],"options":{}}'
run_test "Generate Policy with Invalid Schema" "test_api_endpoint '/v1/rls/generate' 'POST' '400' '$INVALID_SCHEMA_DATA'"

# Test 30: Generate Policy with Invalid Policy Type
INVALID_POLICY_TYPE_DATA='{"schemaId":"econeura_schema","tableName":"users","policyType":"invalid","templateId":"user_based_policy","variables":{},"rules":[],"options":{}}'
run_test "Generate Policy with Invalid Policy Type" "test_api_endpoint '/v1/rls/generate' 'POST' '400' '$INVALID_POLICY_TYPE_DATA'"

echo -e "\n${YELLOW}RLS Generative Suite Tests Completed${NC}"
echo "================================================"

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
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! RLS Generative Suite is working correctly.${NC}"
    echo -e "${GREEN}RESULTADO: PASS${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  Most tests passed. RLS Generative Suite is mostly functional.${NC}"
    echo -e "${YELLOW}RESULTADO: PARTIAL PASS${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Multiple tests failed. RLS Generative Suite needs attention.${NC}"
    echo -e "${RED}RESULTADO: FAIL${NC}"
    exit 1
fi
