#!/bin/bash

# Test coverage script with 80% threshold
set -e

echo "🧪 Running test coverage..."

# Run tests with coverage
pnpm test --coverage

# Extract coverage percentage
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')

echo "📊 Coverage: $COVERAGE%"

# Check threshold
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "❌ Coverage below 80%: $COVERAGE%"
  exit 1
else
  echo "✅ Coverage above 80%: $COVERAGE%"
fi

