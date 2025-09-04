#!/bin/bash

# ============================================================================
# PR-50: Advanced AI/ML & Automation System - Smoke Test Script
# ============================================================================
# 
# This script performs comprehensive smoke tests for the Advanced AI/ML
# and Automation system endpoints to ensure they are working correctly.
#
# Author: Advanced AI Development Team
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
# MACHINE LEARNING ENDPOINTS TESTS
# ============================================================================

test_ml_endpoints() {
    print_header "MACHINE LEARNING ENDPOINTS TESTS"
    
    # Test ML models endpoints
    test_endpoint "GET" "/v1/ml/models" "" "200" "Get ML models"
    test_endpoint "POST" "/v1/ml/models" '{
        "name": "Test Classification Model",
        "description": "A test classification model for smoke testing",
        "type": "classification",
        "algorithm": "random_forest",
        "features": ["feature1", "feature2", "feature3"],
        "hyperparameters": {"n_estimators": 100, "max_depth": 10},
        "metadata": {"version": "1.0"},
        "tags": ["test", "classification"]
    }' "201" "Create ML model"
    
    # Test training endpoints
    test_endpoint "GET" "/v1/ml/training-jobs" "" "200" "Get training jobs"
    test_endpoint "POST" "/v1/ml/models/ml_1/train" '{
        "trainingData": ["data1", "data2", "data3"],
        "validationData": ["val1", "val2"],
        "testData": ["test1", "test2"]
    }' "201" "Start model training"
    
    # Test deployment endpoints
    test_endpoint "GET" "/v1/ml/deployments" "" "200" "Get model deployments"
    test_endpoint "POST" "/v1/ml/models/ml_1/deploy" '{
        "environment": "production"
    }' "201" "Deploy model"
    
    # Test prediction endpoints
    test_endpoint "POST" "/v1/ml/models/ml_1/predict" '{
        "inputData": {"feature1": 1.5, "feature2": 2.3, "feature3": 0.8}
    }' "200" "Make prediction"
    
    # Test analytics
    test_endpoint "GET" "/v1/ml/analytics" "" "200" "Get ML analytics"
}

# ============================================================================
# INTELLIGENT AUTOMATION ENDPOINTS TESTS
# ============================================================================

test_automation_endpoints() {
    print_header "INTELLIGENT AUTOMATION ENDPOINTS TESTS"
    
    # Test workflow endpoints
    test_endpoint "GET" "/v1/automation/workflows" "" "200" "Get automation workflows"
    test_endpoint "POST" "/v1/automation/workflows" '{
        "name": "Test Workflow",
        "description": "A test automation workflow",
        "triggers": [{
            "type": "schedule",
            "name": "Daily Trigger",
            "description": "Runs daily at 9 AM",
            "configuration": {"schedule": "0 9 * * *"},
            "enabled": true,
            "priority": 1
        }],
        "steps": [{
            "name": "Data Processing",
            "type": "action",
            "description": "Process incoming data",
            "configuration": {"action": "process_data"},
            "inputs": ["input_data"],
            "outputs": ["processed_data"],
            "dependencies": [],
            "timeout": 300,
            "retries": 3,
            "onError": "retry"
        }],
        "conditions": [{
            "name": "Data Quality Check",
            "expression": "data.quality > 0.8",
            "description": "Check data quality",
            "operator": "and",
            "conditions": [],
            "actions": ["process_data"]
        }],
        "tags": ["test", "automation"],
        "metadata": {"version": "1.0"}
    }' "201" "Create automation workflow"
    
    # Test workflow execution
    test_endpoint "POST" "/v1/automation/workflows/automation_1/execute" '{
        "inputs": {"input_data": "test_data"}
    }' "201" "Execute workflow"
    
    # Test workflow management
    test_endpoint "POST" "/v1/automation/workflows/automation_1/activate" "" "200" "Activate workflow"
    test_endpoint "POST" "/v1/automation/workflows/automation_1/deactivate" "" "200" "Deactivate workflow"
    
    # Test execution management
    test_endpoint "GET" "/v1/automation/workflows/automation_1/executions" "" "200" "Get workflow executions"
    test_endpoint "GET" "/v1/automation/executions/execution_1" "" "200" "Get specific execution"
    
    # Test analytics
    test_endpoint "GET" "/v1/automation/analytics" "" "200" "Get automation analytics"
}

# ============================================================================
# PREDICTIVE ANALYTICS ENDPOINTS TESTS
# ============================================================================

test_predictive_analytics_endpoints() {
    print_header "PREDICTIVE ANALYTICS ENDPOINTS TESTS"
    
    # Test predictions endpoints
    test_endpoint "GET" "/v1/predictions" "" "200" "Get predictions"
    test_endpoint "POST" "/v1/predictions" '{
        "modelId": "ml_1",
        "type": "classification",
        "inputData": {"feature1": 1.5, "feature2": 2.3, "feature3": 0.8},
        "metadata": {"source": "smoke_test"},
        "tags": ["test", "classification"]
    }' "201" "Create prediction"
    
    # Test forecasting endpoints
    test_endpoint "POST" "/v1/predictions/forecast" '{
        "modelId": "ml_1",
        "timeSeries": "sales_data",
        "horizon": 30,
        "frequency": "daily",
        "metadata": {"business_unit": "sales"}
    }' "201" "Generate forecast"
    
    test_endpoint "GET" "/v1/predictions/forecasts" "" "200" "Get forecasts"
    test_endpoint "GET" "/v1/predictions/forecasts/forecast_1" "" "200" "Get specific forecast"
    
    # Test anomaly detection
    test_endpoint "POST" "/v1/predictions/anomaly" '{
        "modelId": "ml_1",
        "data": {"value": 150, "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"},
        "threshold": 0.8,
        "severity": "medium",
        "description": "Test anomaly detection"
    }' "201" "Detect anomaly"
    
    test_endpoint "GET" "/v1/predictions/anomalies" "" "200" "Get anomalies"
    test_endpoint "GET" "/v1/predictions/anomalies/anomaly_1" "" "200" "Get specific anomaly"
    
    # Test analytics
    test_endpoint "GET" "/v1/predictions/analytics" "" "200" "Get predictive analytics"
}

# ============================================================================
# AI ORCHESTRATION ENDPOINTS TESTS
# ============================================================================

test_ai_orchestration_endpoints() {
    print_header "AI ORCHESTRATION ENDPOINTS TESTS"
    
    # Test orchestration endpoints
    test_endpoint "GET" "/v1/ai/orchestrations" "" "200" "Get AI orchestrations"
    test_endpoint "POST" "/v1/ai/orchestrations" '{
        "name": "Test Orchestration",
        "description": "A test AI orchestration",
        "type": "pipeline",
        "models": ["ml_1", "ml_2"],
        "resources": {
            "cpu": "2",
            "memory": "4Gi",
            "storage": "20Gi"
        },
        "configuration": {
            "parallelism": 4,
            "timeout": 3600,
            "retries": 3,
            "scheduling": {
                "enabled": true,
                "schedule": "0 */6 * * *",
                "timezone": "UTC",
                "maxConcurrency": 2,
                "priority": 1
            },
            "monitoring": {
                "enabled": true,
                "metrics": ["throughput", "latency", "error_rate"],
                "alerts": [],
                "logging": {
                    "level": "info",
                    "retention": 30,
                    "format": "json"
                }
            },
            "scaling": {
                "minReplicas": 1,
                "maxReplicas": 5,
                "targetUtilization": 70,
                "scaleUpThreshold": 80,
                "scaleDownThreshold": 30
            },
            "dependencies": []
        },
        "tags": ["test", "orchestration"],
        "metadata": {"version": "1.0"}
    }' "201" "Create AI orchestration"
    
    # Test orchestration management
    test_endpoint "POST" "/v1/ai/orchestrations/orchestration_1/start" "" "200" "Start orchestration"
    test_endpoint "POST" "/v1/ai/orchestrations/orchestration_1/stop" "" "200" "Stop orchestration"
    test_endpoint "POST" "/v1/ai/orchestrations/orchestration_1/pause" "" "200" "Pause orchestration"
    
    # Test orchestration operations
    test_endpoint "GET" "/v1/ai/orchestrations/orchestration_1/metrics" "" "200" "Get orchestration metrics"
    test_endpoint "POST" "/v1/ai/orchestrations/orchestration_1/scale" '{"scaleFactor": 2}' "200" "Scale orchestration"
    
    # Test pipeline endpoints
    test_endpoint "GET" "/v1/ai/pipelines" "" "200" "Get ML pipelines"
    test_endpoint "POST" "/v1/ai/pipelines" '{
        "name": "Test Pipeline",
        "description": "A test ML pipeline",
        "stages": [{
            "name": "Data Ingestion",
            "type": "data_ingestion",
            "description": "Ingest data from source",
            "configuration": {"source": "database"},
            "inputs": [],
            "outputs": ["raw_data"],
            "dependencies": [],
            "timeout": 1800,
            "retries": 2,
            "resources": {
                "cpu": "1",
                "memory": "2Gi",
                "storage": "10Gi"
            }
        }],
        "tags": ["test", "pipeline"],
        "metadata": {"version": "1.0"}
    }' "201" "Create ML pipeline"
    
    test_endpoint "POST" "/v1/ai/pipelines/pipeline_1/execute" '{
        "inputs": {"source_data": "test_data"}
    }' "201" "Execute pipeline"
    
    # Test system metrics and analytics
    test_endpoint "GET" "/v1/ai/system-metrics" "" "200" "Get system metrics"
    test_endpoint "GET" "/v1/ai/analytics" "" "200" "Get AI orchestration analytics"
}

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

test_integration_scenarios() {
    print_header "INTEGRATION SCENARIOS TESTS"
    
    print_test "Complete ML Model Lifecycle"
    
    # Create a model
    model_response=$(curl -s -X POST -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d '{
        "name": "Integration Test Model",
        "description": "Model for integration testing",
        "type": "regression",
        "algorithm": "linear_regression",
        "features": ["x1", "x2", "x3"],
        "hyperparameters": {"alpha": 0.01},
        "metadata": {"test": "integration"},
        "tags": ["integration", "test"]
    }' "$BASE_URL/v1/ml/models")
    
    model_id=$(echo "$model_response" | jq -r '.data.id' 2>/dev/null || echo "")
    
    if [ -n "$model_id" ] && [ "$model_id" != "null" ]; then
        print_success "ML model created with ID: $model_id"
        
        # Train the model
        training_response=$(curl -s -X POST -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d '{
            "trainingData": ["train1", "train2", "train3"],
            "validationData": ["val1", "val2"],
            "testData": ["test1", "test2"]
        }' "$BASE_URL/v1/ml/models/$model_id/train")
        
        training_id=$(echo "$training_response" | jq -r '.data.id' 2>/dev/null || echo "")
        
        if [ -n "$training_id" ] && [ "$training_id" != "null" ]; then
            print_success "Training job started with ID: $training_id"
            
            # Deploy the model
            deployment_response=$(curl -s -X POST -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d '{
                "environment": "staging"
            }' "$BASE_URL/v1/ml/models/$model_id/deploy")
            
            deployment_id=$(echo "$deployment_response" | jq -r '.data.id' 2>/dev/null || echo "")
            
            if [ -n "$deployment_id" ] && [ "$deployment_id" != "null" ]; then
                print_success "Model deployed with ID: $deployment_id"
                
                # Make a prediction
                test_endpoint "POST" "/v1/ml/models/$model_id/predict" '{
                    "inputData": {"x1": 1.0, "x2": 2.0, "x3": 3.0}
                }' "200" "Make prediction with deployed model"
                
            else
                print_error "Failed to deploy model for integration test"
            fi
        else
            print_error "Failed to start training for integration test"
        fi
    else
        print_error "Failed to create model for integration test"
    fi
    
    print_test "Complete Automation Workflow"
    
    # Create a workflow
    workflow_response=$(curl -s -X POST -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d '{
        "name": "Integration Test Workflow",
        "description": "Workflow for integration testing",
        "triggers": [{
            "type": "api",
            "name": "API Trigger",
            "description": "Triggered via API",
            "configuration": {"endpoint": "/trigger"},
            "enabled": true,
            "priority": 1
        }],
        "steps": [{
            "name": "Process Data",
            "type": "action",
            "description": "Process the input data",
            "configuration": {"action": "process"},
            "inputs": ["input"],
            "outputs": ["output"],
            "dependencies": [],
            "timeout": 300,
            "retries": 2,
            "onError": "continue"
        }],
        "conditions": [],
        "tags": ["integration", "test"],
        "metadata": {"test": "integration"}
    }' "$BASE_URL/v1/automation/workflows")
    
    workflow_id=$(echo "$workflow_response" | jq -r '.data.id' 2>/dev/null || echo "")
    
    if [ -n "$workflow_id" ] && [ "$workflow_id" != "null" ]; then
        print_success "Workflow created with ID: $workflow_id"
        
        # Activate the workflow
        test_endpoint "POST" "/v1/automation/workflows/$workflow_id/activate" "" "200" "Activate workflow"
        
        # Execute the workflow
        execution_response=$(curl -s -X POST -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" -d '{
            "inputs": {"input": "test_data"}
        }' "$BASE_URL/v1/automation/workflows/$workflow_id/execute")
        
        execution_id=$(echo "$execution_response" | jq -r '.data.id' 2>/dev/null || echo "")
        
        if [ -n "$execution_id" ] && [ "$execution_id" != "null" ]; then
            print_success "Workflow executed with ID: $execution_id"
        else
            print_error "Failed to execute workflow for integration test"
        fi
    else
        print_error "Failed to create workflow for integration test"
    fi
}

# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

test_performance() {
    print_header "PERFORMANCE TESTS"
    
    print_test "ML Analytics Performance"
    start_time=$(date +%s%3N)
    curl -s -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL/v1/ml/analytics" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 5000 ]; then
        print_success "ML analytics response time: ${duration}ms (under 5s)"
    else
        print_error "ML analytics response time: ${duration}ms (over 5s)"
    fi
    
    print_test "Automation Analytics Performance"
    start_time=$(date +%s%3N)
    curl -s -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL/v1/automation/analytics" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 5000 ]; then
        print_success "Automation analytics response time: ${duration}ms (under 5s)"
    else
        print_error "Automation analytics response time: ${duration}ms (over 5s)"
    fi
    
    print_test "Predictive Analytics Performance"
    start_time=$(date +%s%3N)
    curl -s -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL/v1/predictions/analytics" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 5000 ]; then
        print_success "Predictive analytics response time: ${duration}ms (under 5s)"
    else
        print_error "Predictive analytics response time: ${duration}ms (over 5s)"
    fi
    
    print_test "AI Orchestration Performance"
    start_time=$(date +%s%3N)
    curl -s -H "$HEADERS" -H "$ORG_HEADER" -H "$USER_HEADER" "$BASE_URL/v1/ai/analytics" > /dev/null
    end_time=$(date +%s%3N)
    duration=$((end_time - start_time))
    
    if [ $duration -lt 5000 ]; then
        print_success "AI orchestration analytics response time: ${duration}ms (under 5s)"
    else
        print_error "AI orchestration analytics response time: ${duration}ms (over 5s)"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_header "PR-50: ADVANCED AI/ML & AUTOMATION SYSTEM - SMOKE TESTS"
    echo -e "${BLUE}Starting comprehensive smoke tests for AI/ML & Automation system...${NC}"
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
    test_ml_endpoints
    test_automation_endpoints
    test_predictive_analytics_endpoints
    test_ai_orchestration_endpoints
    test_integration_scenarios
    test_performance
    
    # Print final results
    print_header "TEST RESULTS SUMMARY"
    echo -e "${BLUE}Total Tests: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
        echo -e "${GREEN}The Advanced AI/ML & Automation system is working correctly.${NC}"
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
