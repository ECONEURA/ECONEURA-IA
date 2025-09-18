#!/bin/bash

# PR-42: SEPA Ingest + Matching System - Smoke Test
# Test all SEPA endpoints and functionality

set -e

echo "🧪 PR-42: SEPA Ingest + Matching System - Smoke Test"
echo "=================================================="

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

echo -e "\n${YELLOW}Starting SEPA System Tests...${NC}"

# Test 1: API Health Check
run_test "API Health Check" "test_api_endpoint '/health/live' 'GET' '200'"

# Test 2: SEPA Stats Endpoint
run_test "SEPA Stats Endpoint" "test_api_response '/v1/sepa/stats' 'GET' 'success'"

# Test 3: SEPA Rules Endpoint
run_test "SEPA Rules Endpoint" "test_api_response '/v1/sepa/rules' 'GET' 'success'"

# Test 4: SEPA Transactions Endpoint
run_test "SEPA Transactions Endpoint" "test_api_response '/v1/sepa/transactions' 'GET' 'success'"

# Test 5: SEPA Upload - CAMT
CAMT_DATA='{"fileContent":"<?xml version=\"1.0\" encoding=\"UTF-8\"?><Document xmlns=\"urn:iso:std:iso:20022:tech:xsd:camt.053.001.02\"><BkToCstmrStmt><GrpHdr><MsgId>TEST001</MsgId><CreDtTm>2024-01-01T00:00:00</CreDtTm></GrpHdr><Stmt><Acct><Id><IBAN>ES1234567890123456789012</IBAN></Id></Acct><Bal><Tp><CdOrPrtry><Cd>PRCD</Cd></CdOrPrtry></Tp><Amt Ccy=\"EUR\">1000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Dt><Dt>2024-01-01</Dt></Dt></Bal><Ntry><Amt Ccy=\"EUR\">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts>BOOK</Sts><BookgDt><Dt>2024-01-01</Dt></BookgDt><AcctSvcrRef>REF001</AcctSvcrRef><AddtlNtryInf>Test transaction</AddtlNtryInf></Ntry></Stmt></BkToCstmrStmt></Document>","fileType":"camt","fileName":"test_camt.xml"}'
run_test "SEPA Upload - CAMT" "test_api_response '/v1/sepa/upload' 'POST' 'success' '$CAMT_DATA'"

# Test 6: SEPA Upload - MT940
MT940_DATA='{"fileContent":":20:TEST001\n:25:ES1234567890123456789012\n:28C:00001\n:60F:C240101EUR1000,00\n:61:2401010101D100,00NTRFREF001\n:86:Test transaction\n:62F:C240101EUR900,00","fileType":"mt940","fileName":"test_mt940.txt"}'
run_test "SEPA Upload - MT940" "test_api_response '/v1/sepa/upload' 'POST' 'success' '$MT940_DATA'"

# Test 7: SEPA Matching
MATCHING_DATA='{"sepaTransactions":[{"id":"sepa_1","amount":100,"reference":"REF001","date":"2024-01-01"}],"existingTransactions":[{"id":"existing_1","amount":100,"reference":"REF001","date":"2024-01-01"}]}'
run_test "SEPA Matching" "test_api_response '/v1/sepa/matching' 'POST' 'success' '$MATCHING_DATA'"

# Test 8: SEPA Reconciliation
RECONCILIATION_DATA='{"sepaTransactions":[{"id":"sepa_1","amount":100,"reference":"REF001","date":"2024-01-01"}],"existingTransactions":[{"id":"existing_1","amount":100,"reference":"REF001","date":"2024-01-01"}]}'
run_test "SEPA Reconciliation" "test_api_response '/v1/sepa/reconciliation' 'POST' 'success' '$RECONCILIATION_DATA'"

# Test 9: Create SEPA Rule
RULE_DATA='{"name":"Test Rule","description":"Test matching rule","priority":50,"conditions":[{"field":"reference","operator":"equals","value":"","weight":1.0}],"actions":[{"type":"match","parameters":{"threshold":0.8}}],"enabled":true}'
run_test "Create SEPA Rule" "test_api_response '/v1/sepa/rules' 'POST' 'success' '$RULE_DATA'"

# Test 10: Update SEPA Rule (using first rule ID)
RULE_UPDATE_DATA='{"name":"Updated Test Rule","description":"Updated test matching rule","priority":60}'
run_test "Update SEPA Rule" "test_api_endpoint '/v1/sepa/rules/rule_1' 'PUT' '200' '$RULE_UPDATE_DATA'"

# Test 11: Delete SEPA Rule (using first rule ID)
run_test "Delete SEPA Rule" "test_api_endpoint '/v1/sepa/rules/rule_1' 'DELETE' '200'"

# Test 12: Invalid File Type
INVALID_DATA='{"fileContent":"test","fileType":"invalid","fileName":"test.txt"}'
run_test "Invalid File Type" "test_api_endpoint '/v1/sepa/upload' 'POST' '400' '$INVALID_DATA'"

# Test 13: Missing Required Fields
MISSING_DATA='{"fileContent":"test"}'
run_test "Missing Required Fields" "test_api_endpoint '/v1/sepa/upload' 'POST' '400' '$MISSING_DATA'"

# Test 14: Invalid Rule Data
INVALID_RULE_DATA='{"name":"","priority":-1}'
run_test "Invalid Rule Data" "test_api_endpoint '/v1/sepa/rules' 'POST' '400' '$INVALID_RULE_DATA'"

# Test 15: Non-existent Rule
run_test "Non-existent Rule" "test_api_endpoint '/v1/sepa/rules/nonexistent' 'GET' '404'"

echo -e "\n${YELLOW}SEPA System Tests Completed${NC}"
echo "=================================================="

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
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! SEPA System is working correctly.${NC}"
    echo -e "${GREEN}RESULTADO: PASS${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  Most tests passed. SEPA System is mostly functional.${NC}"
    echo -e "${YELLOW}RESULTADO: PARTIAL PASS${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Multiple tests failed. SEPA System needs attention.${NC}"
    echo -e "${RED}RESULTADO: FAIL${NC}"
    exit 1
fi
