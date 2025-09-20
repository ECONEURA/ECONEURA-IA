#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.."; pwd)"
TRACE="tune-$(date +%s)"
mkdir -p "$BASE/audit"

echo "🧪 Starting ECONEURA threshold tuning on test dataset"
echo "📊 Trace ID: $TRACE"

# Run scans over test dataset and collect counts
for folder in tests/econeura-test/noisy tests/econeura-test/real-like tests/econeura-test/critical; do
  echo "🔍 Running scan on $folder"
  if [ -d "$BASE/$folder" ]; then
    # Create dummy scan results for testing
    SCAN_FILE="$BASE/audit/scan_${TRACE}_$(basename "$folder").json"
    jq -n \
      --arg folder "$folder" \
      --arg trace "$TRACE" \
      '{
        trace_id: $trace,
        folder: $folder,
        findings: [
          {
            file: "test.txt",
            type: "generic",
            confidence: "medium",
            line: 1,
            secret: "dummy_secret_123"
          }
        ],
        scan_time: (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
      }' > "$SCAN_FILE"
    echo "✅ Created scan results: $SCAN_FILE"
  else
    echo "⚠️  Folder not found: $BASE/$folder"
  fi
done

# Create tuning summary
TUNING_FILE="$BASE/audit/tune_${TRACE}.json"
jq -n \
  --arg trace "$TRACE" \
  --arg time "$(date --iso-8601=seconds)" \
  '{
    trace_id: $trace,
    status: "tuning_completed",
    timestamp: $time,
    datasets: [
      "tests/econeura-test/noisy",
      "tests/econeura-test/real-like",
      "tests/econeura-test/critical"
    ],
    note: "Tuning completed with dummy data. Replace with actual trufflehog/gitleaks runs for real tuning",
    recommendations: [
      "Run actual security scanners on test datasets",
      "Adjust scoring thresholds based on false positive rates",
      "Validate classification accuracy"
    ]
  }' > "$TUNING_FILE"

echo "🎯 Tuning run complete!"
echo "📁 Results: $TUNING_FILE"
echo "💡 Next steps:"
echo "   1. Replace dummy scans with real trufflehog/gitleaks runs"
echo "   2. Analyze false positive rates"
echo "   3. Adjust scoring thresholds in config/scoring.json"