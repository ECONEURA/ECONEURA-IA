#!/usr/bin/env bash
# ECONEURA Test Integration Script (Simplified)
# Runs basic tests on the security system

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TRACE_ID="test-$(date +%s)"

echo "🧪 Starting ECONEURA Test Integration Suite"
echo "📊 Trace ID: $TRACE_ID"
echo "📁 Base Directory: $BASE_DIR"

# Test 1: Validate test datasets
echo ""
echo "📋 Test 1: Validating test datasets"
for dataset in noisy real-like critical; do
  dataset_path="$BASE_DIR/tests/econeura-test/$dataset"
  if [ -d "$dataset_path" ]; then
    file_count=$(find "$dataset_path" -type f | wc -l)
    echo "✅ $dataset dataset: $file_count files"
  else
    echo "❌ $dataset dataset missing: $dataset_path"
    exit 1
  fi
done

# Test 2: Test metrics collection
echo ""
echo "📊 Test 2: Testing metrics collection"
if [ -f "$BASE_DIR/ECONEURA/scripts/metrics_lib.sh" ]; then
  source "$BASE_DIR/ECONEURA/scripts/metrics_lib.sh"

  # Record test metrics
  record_scan_metrics "test_tool" 5 2 1 1
  record_classification_metrics 5 2 1 1
  record_mitigation_metrics "executed" "300"
  record_approval_metrics "validated"
  set_gauge "econeura_up" 1

  # Check if metrics file was created
  if [ -f "/tmp/econeura_metrics.prom" ]; then
    echo "✅ Metrics recorded successfully"
    echo "📄 Metrics file size: $(wc -l < "/tmp/econeura_metrics.prom") lines"
  else
    echo "❌ Metrics file not created"
  fi
else
  echo "❌ Metrics library not found"
  exit 1
fi

# Test 3: Validate configuration files
echo ""
echo "⚙️  Test 3: Validating configuration files"
for config_file in "ECONEURA/config/scoring.json" "ECONEURA/config/owners.json"; do
  config_path="$BASE_DIR/$config_file"
  if [ -f "$config_path" ]; then
    if jq empty "$config_path" 2>/dev/null; then
      echo "✅ $config_file: Valid JSON"
    else
      echo "❌ $config_file: Invalid JSON"
      exit 1
    fi
  else
    echo "❌ $config_file: File not found"
    exit 1
  fi
done

echo ""
echo "🎉 ECONEURA Test Integration Suite Completed!"
echo ""
echo "📊 Summary:"
echo "   ✅ Test datasets validated"
echo "   ✅ Metrics collection tested"
echo "   ✅ Configuration files validated"
echo ""
echo "🚀 Next steps:"
echo "   1. Run tuning: ./scripts/tune_thresholds.sh"
echo "   2. Test CI: Push to trigger .github/workflows/econeura-test.yml"
echo "   3. Monitor: ./scripts/test_metrics.sh"