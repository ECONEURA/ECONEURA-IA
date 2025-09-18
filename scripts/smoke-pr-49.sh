#!/bin/bash

# ============================================================================
# PR-49: Advanced Security & Compliance System - Smoke Test Script
# ============================================================================
# 
# This script performs comprehensive smoke tests for the Advanced Security
# and Compliance system endpoints to ensure they are working correctly.
#
# Author: Advanced Security Development Team
# Date: January 2024
# Version: 1.0
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:4000"
HEADERS="Content-Type: application/json"
ORG_HEADER="x-organization-id: org_1"
USER_HEADER="x-user-id: user_1"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

print_header() {
    echo -e "\n${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
}

print_test() {
    echo -e "\n${YELLOW}Testing: $1${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

print_success() {
    echo -e "${GREEN}✅ PASSED: $1${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_error() {
    echo -e "${RED}❌ FAILED: $1${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    print_test "$description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        print_success "$description (Status: $http_code)"
        return 0
    else
        print_error "$description (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
        return 1
    fi
}

# ============================================================================
# ADVANCED SECURITY ENDPOINTS TESTS
# ============================================================================

test_security_endpoints() {
    print_header "ADVANCED SECURITY ENDPOINTS TESTS"
    
    # Test security events endpoints
    test_endpoint "GET" "/v1/security/events" "" "200" "Get security events"
    test_endpoint "POST" "/v1/security/events" '{
        "type": "authentication",
        "severity": "medium",
        "source": "login_system",
        "details": {"attempt": "successful"},
        "category": "authentication",
        "tags": ["login", "success"],
        "metadata": {"ip": "192.168.1.1"}
    }' "201" "Create security event"
    
    # Test vulnerability endpoints
    test_endpoint "GET" "/v1/security/vulnerabilities" "" "200" "Get vulnerabilities"
    test_endpoint "POST" "/v1/security/vulnerabilities" '{
        "title": "Test Vulnerability",
        "description": "A test vulnerability for smoke testing",
        "severity": "medium",
        "affectedSystems": ["test-system"],
        "discoveredAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
        "reportedBy": "test-user"
    }' "201" "Create vulnerability"
    
    # Test vulnerability scan endpoints
    test_endpoint "GET" "/v1/security/vulnerability-scans" "" "200" "Get vulnerability scans"
    test_endpoint "POST" "/v1/security/vulnerability-scan" '{
        "name": "Test Scan",
        "description": "A test vulnerability scan",
        "targetSystems": ["test-system-1", "test-system-2"],
        "scanType": "network"
    }' "201" "Perform vulnerability scan"
    
    # Test security analytics
    test_endpoint "GET" "/v1/security/analytics" "" "200" "Get security analytics"
}

# ============================================================================
# COMPLIANCE MANAGEMENT ENDPOINTS TESTS
# ============================================================================

test_compliance_endpoints() {
    print_header "COMPLIANCE MANAGEMENT ENDPOINTS TESTS"
    
    # Test compliance requirements endpoints
    test_endpoint "GET" "/v1/compliance/requirements" "" "200" "Get compliance requirements"
    test_endpoint "POST" "/v1/compliance/requirements" '{
        "standard": "GDPR",
        "requirement": "Data Protection Impact Assessment",
        "description": "Conduct DPIA for high-risk processing activities",
        "category": "Data Protection",
        "priority": "high",
        "tags": ["GDPR", "DPIA"],
        "metadata": {"article": "35"}
    }' "201" "Create compliance requirement"
    
    # Test compliance assessments
    test_endpoint "GET" "/v1/compliance/assessments" "" "200" "Get compliance assessments"
    test_endpoint "POST" "/v1/compliance/assessments" '{
        "standard": "GDPR",
        "scope": ["data_processing", "consent_management"],
        "startDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
    }' "201" "Perform compliance assessment"
    
    # Test compliance status
    test_endpoint "GET" "/v1/compliance/status" "" "200" "Get compliance status"
    test_endpoint "GET" "/v1/compliance/status?standard=GDPR" "" "200" "Get GDPR compliance status"
    
    # Test compliance reports
    test_endpoint "POST" "/v1/compliance/reports" '{
        "standard": "GDPR"
    }' "201" "Generate compliance report"
}

# ============================================================================
# COMPREHENSIVE AUDIT ENDPOINTS TESTS
# ============================================================================

test_audit_endpoints() {
    print_header "COMPREHENSIVE AUDIT ENDPOINTS TESTS"
    
    # Test audit logs endpoints
    test_endpoint "GET" "/v1/audit/logs" "" "200" "Get audit logs"
    test_endpoint "POST" "/v1/audit/logs" '{
        "eventType": "user_login",
        "resource": "/api/v1/users/login",
        "action": "authenticate",
        "result": "success",
        "details": {"userId": "user_123"},
        "category": "authentication",
        "tags": ["login", "success"],
        "metadata": {"ip": "192.168.1.1", "userAgent": "Mozilla/5.0"}
    }' "201" "Create audit log"
    
    # Test audit trails
    test_endpoint "GET" "/v1/audit/trails" "" "200" "Get audit trails"
    test_endpoint "GET" "/v1/audit/trails/user/user_123" "" "200" "Get user audit trail"
    
    # Test audit reports
    test_endpoint "GET" "/v1/audit/reports" "" "200" "Get audit reports"
    test_endpoint "POST" "/v1/audit/reports" '{
        "name": "Test Audit Report",
        "description": "A test audit report",
        "type": "security",
        "scope": ["authentication", "authorization"],
        "period": {
            "start": "'$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "end": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
        }
    }' "201" "Create audit report"
    
    # Test audit analytics
    test_endpoint "GET" "/v1/audit/analytics" "" "200" "Get audit analytics"
    
    # Test forensic analysis
    test_endpoint "POST" "/v1/audit/forensic" '{
        "userId": "user_123",
        "timeRange": {
            "start": "'$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "end": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
        },
        "eventTypes": ["authentication", "data_access"]
    }' "201" "Perform forensic analysis"
}

# ============================================================================
# THREAT DETECTION ENDPOINTS TESTS
# ============================================================================

test_threat_detection_endpoints() {
    print_header "THREAT DETECTION ENDPOINTS TESTS"
    
    # Test threat detections
    test_endpoint "GET" "/v1/threats/detections" "" "200" "Get threat detections"
    test_endpoint "POST" "/v1/threats/detections" '{
        "type": "phishing",
        "source": "email_system",
        "target": "user_accounts",
        "indicators": [
            {
                "type": "email",
                "value": "suspicious@example.com",
                "confidence": 0.8,
                "source": "email_filter"
            }
        ],
        "description": "Suspicious phishing email detected",
        "metadata": {"subject": "Urgent: Verify your account"}
    }' "201" "Detect threat"
    
    # Test security incidents
    test_endpoint "GET" "/v1/threats/incidents" "" "200" "Get security incidents"
    test_endpoint "POST" "/v1/threats/incidents" '{
        "title": "Test Security Incident",
        "description": "A test security incident for smoke testing",
        "severity": "medium",
        "category": "phishing",
        "affectedSystems": ["email_system"],
        "affectedUsers": ["user_123"],
        "dataAtRisk": ["email_addresses"],
        "impact": "Potential credential theft",
        "tags": ["phishing", "test"],
        "metadata": {"source": "smoke_test"}
    }' "201" "Create security incident"
    
    # Test threat analytics
    test_endpoint "GET" "/v1/threats/analytics" "" "200" "Get threat analytics"
}

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

test_integration_scenarios() {
    print_header "INTEGRATION SCENARIOS TESTS"
    
    print_test "Complete Security Event Workflow"
    
    # Create a security event
    event_response=$(curl -s -X POST -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d '{
        "type": "data_access",
        "severity": "high",
        "source": "database_system",
        "details": {"table": "users", "action": "select"},
        "category": "data_access",
        "tags": ["database", "users"],
        "metadata": {"query": "SELECT * FROM users"}
    }' "$BASE_URL/v1/security/events")
    
    event_id=$(echo "$event_response" | jq -r '.data.id' 2>/dev/null || echo "")
    
    if [ -n "$event_id" ] && [ "$event_id" != "null" ]; then
        print_success "Security event created with ID: $event_id"
        
        # Test getting the specific event
        test_endpoint "GET" "/v1/security/events/$event_id" "" "200" "Get specific security event"
        
        # Test updating event status
        test_endpoint "PUT" "/v1/security/events/$event_id/status" '{"status": "investigating"}' "200" "Update security event status"
        
    else
        print_error "Failed to create security event for integration test"
    fi
    
    print_test "Compliance Assessment Workflow"
    
    # Create a compliance requirement
    req_response=$(curl -s -X POST -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d '{
        "standard": "SOX",
        "requirement": "Internal Controls Testing",
        "description": "Test internal controls for financial reporting",
        "category": "Financial Controls",
        "priority": "high",
        "tags": ["SOX", "controls"],
        "metadata": {"section": "404"}
    }' "$BASE_URL/v1/compliance/requirements")
    
    req_id=$(echo "$req_response" | jq -r '.data.id' 2>/dev/null || echo "")
    
    if [ -n "$req_id" ] && [ "$req_id" != "null" ]; then
        print_success "Compliance requirement created with ID: $req_id"
        
        # Test adding evidence
        test_endpoint "POST" "/v1/compliance/requirements/$req_id/evidence" '{
            "type": "document",
            "title": "Test Evidence",
            "description": "Test evidence for compliance requirement",
            "collectedBy": "test-user",
            "collectedAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
        }' "201" "Add compliance evidence"
        
        # Test adding control
        test_endpoint "POST" "/v1/compliance/requirements/$req_id/controls" '{
            "name": "Test Control",
            "description": "A test control for the requirement",
            "type": "preventive",
            "implementation": "automated",
            "status": "implemented",
            "effectiveness": "high",
            "owner": "test-user"
        }' "201" "Add compliance control"
        
    else
        print_error "Failed to create compliance requirement for integration test"
    fi
}

# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

test_performance() {
    print_header "PERFORMANCE TESTS"
    
    print_test "Security Analytics Performance"
    start_time=$(date +%s%3N)
    curl -s -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL/v1/security/analytics" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 5000 ]; then
        print_success "Security analytics response time: ${duration}ms (under 5s)"
    else
        print_error "Security analytics response time: ${duration}ms (over 5s)"
    fi
    
    print_test "Audit Analytics Performance"
    start_time=$(date +%s%3N)
    curl -s -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL/v1/audit/analytics" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 5000 ]; then
        print_success "Audit analytics response time: ${duration}ms (under 5s)"
    else
        print_error "Audit analytics response time: ${duration}ms (over 5s)"
    fi
    
    print_test "Threat Analytics Performance"
    start_time=$(date +%s%3N)
    curl -s -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL/v1/threats/analytics" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 5000 ]; then
        print_success "Threat analytics response time: ${duration}ms (under 5s)"
    else
        print_error "Threat analytics response time: ${duration}ms (over 5s)"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "PR-49: ADVANCED SECURITY & COMPLIANCE SYSTEM - SMOKE TESTS"
    echo -e "${BLUE}Starting comprehensive smoke tests for Security & Compliance system...${NC}"
    echo -e "${BLUE}Base URL: $BASE_URL${NC}"
    echo -e "${BLUE}Organization: org_1${NC}"
    echo -e "${BLUE}User: user_1${NC}"
    
    # Check if server is running
    print_test "Server Health Check"
    if curl -s -f "$BASE_URL/health" > /dev/null; then
        print_success "Server is running and healthy"
    else
        print_error "Server is not running or not healthy"
        echo -e "${RED}Please start the server before running smoke tests${NC}"
        exit 1
    fi
    
    # Run all test suites
    test_security_endpoints
    test_compliance_endpoints
    test_audit_endpoints
    test_threat_detection_endpoints
    test_integration_scenarios
    test_performance
    
    # Print final results
    print_header "TEST RESULTS SUMMARY"
    echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
        echo -e "${GREEN}The Advanced Security & Compliance system is working correctly.${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ SOME TESTS FAILED ❌${NC}"
        echo -e "${RED}Please review the failed tests and fix any issues.${NC}"
        exit 1
    fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Some integration tests may not work properly.${NC}"
    echo -e "${YELLOW}Please install jq for full functionality: brew install jq${NC}"
fi

# Run main function
main "$@"
