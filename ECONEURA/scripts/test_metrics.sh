#!/usr/bin/env bash
# ECONEURA Metrics Integration Test
# Tests the metrics collection and reporting functionality

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/metrics_lib.sh"

echo "🧪 Testing ECONEURA Metrics Integration"

# Test 1: Basic metrics recording
echo "📊 Test 1: Recording scan metrics..."
record_scan_metrics "test_tool" 10 3 2 1

# Test 2: Classification metrics
echo "📊 Test 2: Recording classification metrics..."
record_classification_metrics 10 3 2 1

# Test 3: Mitigation metrics
echo "📊 Test 3: Recording mitigation metrics..."
record_mitigation_metrics "success" "token"
record_mitigation_metrics "blocked" "hmac"

# Test 4: Approval metrics
echo "📊 Test 4: Recording approval metrics..."
record_approval_metrics "validated" "hmac"
record_approval_metrics "rejected" "token"

# Test 5: System health
echo "📊 Test 5: Recording system health..."
set_gauge "econeura_up" 1

# Test 6: Display current metrics
echo "📊 Test 6: Displaying current metrics..."
echo "Current metrics:"
show_metrics_summary

# Test 7: Validate metrics file exists and has content
METRICS_FILE="$SCRIPT_DIR/../metrics/econeura_metrics.txt"
if [ -f "$METRICS_FILE" ]; then
  echo "✅ Metrics file exists: $METRICS_FILE"
  echo "📄 Metrics file size: $(wc -l < "$METRICS_FILE") lines"
  echo "📋 Sample metrics:"
  head -10 "$METRICS_FILE"
else
  echo "❌ Metrics file not found: $METRICS_FILE"
  exit 1
fi

# Test 8: Validate Prometheus format
echo "📊 Test 8: Validating Prometheus format..."
if grep -q "^#" "$METRICS_FILE" && grep -q "^econeura_" "$METRICS_FILE"; then
  echo "✅ Metrics are in valid Prometheus format"
else
  echo "❌ Metrics are not in valid Prometheus format"
  exit 1
fi

echo "🎉 All metrics integration tests passed!"
echo "📊 Metrics are being collected and stored correctly"
echo "🔍 Check $METRICS_FILE for detailed metrics"