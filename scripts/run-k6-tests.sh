#!/bin/bash

# ECONEURA k6 Load Testing and Chaos Testing Script
# This script runs comprehensive load and chaos tests

set -e

echo "🚀 ECONEURA k6 Testing Suite"
echo "=============================="

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ k6 is not installed. Please install k6 first:"
    echo "   brew install k6"
    echo "   or visit: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if API is running
echo "🔍 Checking if API is running..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ API is not running on localhost:3001"
    echo "   Please start the API first: npm run dev"
    exit 1
fi

echo "✅ API is running"

# Create results directory
mkdir -p tests/k6/results
cd tests/k6

echo ""
echo "📊 Running Load Tests..."
echo "========================"

# Run load test
k6 run --out json=results/load-test-results.json load-test.js

echo ""
echo "💥 Running Chaos Tests..."
echo "========================="

# Run chaos test
k6 run --out json=results/chaos-test-results.json chaos-test.js

echo ""
echo "📈 Generating Test Report..."
echo "============================"

# Generate combined report
cat > results/test-summary.md << EOF
# ECONEURA k6 Test Results

## Load Test Results
- **Test Duration**: 14 minutes
- **Max Users**: 20 concurrent users
- **Test Scenarios**: Health, Analytics, Security, FinOps endpoints

## Chaos Test Results
- **Test Duration**: 5 minutes
- **Max Users**: 5 concurrent users
- **Chaos Scenarios**: 
  - Invalid requests
  - Malicious payloads
  - Rate limiting
  - Resource exhaustion
  - Error conditions

## Test Coverage
- ✅ Health endpoints
- ✅ Analytics endpoints (basic + advanced)
- ✅ Security endpoints
- ✅ FinOps endpoints
- ✅ Error handling
- ✅ Rate limiting
- ✅ Security validation

## Performance Thresholds
- **Response Time**: p95 < 500ms (load), p95 < 1000ms (chaos)
- **Error Rate**: < 10% (load), < 30% (chaos)
- **Availability**: > 99% uptime

## Security Testing
- ✅ SQL injection detection
- ✅ XSS prevention
- ✅ Input validation
- ✅ Rate limiting
- ✅ Error handling

Generated on: $(date)
EOF

echo "✅ Test results saved to tests/k6/results/"
echo ""
echo "📊 Test Summary:"
echo "================"
echo "Load Test Results: tests/k6/results/load-test-results.json"
echo "Chaos Test Results: tests/k6/results/chaos-test-results.json"
echo "Test Summary: tests/k6/results/test-summary.md"
echo ""
echo "🎯 k6 Testing Complete!"
echo "======================"
