#!/bin/bash

# Visual regression testing script with 2% threshold
set -e

echo "🎨 Running visual regression tests..."

# Run visual tests
pnpm playwright test --grep="visual"

# Check if visual diff report exists
if [ -f "visual-diff-report.json" ]; then
  DIFF_PCT=$(cat visual-diff-report.json | jq '.diffPercentage')
  echo "📊 Visual diff: $DIFF_PCT%"
  
  if (( $(echo "$DIFF_PCT > 2" | bc -l) )); then
    echo "❌ Visual diff above 2%: $DIFF_PCT%"
    exit 1
  else
    echo "✅ Visual diff below 2%: $DIFF_PCT%"
  fi
else
  echo "⚠️  No visual diff report found, assuming no changes"
fi

