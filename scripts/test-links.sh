#!/bin/bash

# Broken links testing script
set -e

echo "🔗 Running broken links check..."

# Start the application if not already running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Starting application..."
  pnpm --filter econeura-cockpit dev &
  sleep 10
fi

# Check for broken links using a simple curl-based approach
echo "Checking main pages..."

BROKEN_LINKS=0

# Check main pages
PAGES=(
  "http://localhost:3000"
  "http://localhost:3000/api/health"
  "http://localhost:3101/health"
  "http://localhost:3102/health"
)

for page in "${PAGES[@]}"; do
  echo "Checking $page..."
  if ! curl -s -f "$page" > /dev/null; then
    echo "❌ Broken link: $page"
    ((BROKEN_LINKS++))
  else
    echo "✅ OK: $page"
  fi
done

# Create report
echo "{\"brokenLinks\": $BROKEN_LINKS}" > link-check-report.json

echo "📊 Broken links: $BROKEN_LINKS"

if [ "$BROKEN_LINKS" -ne "0" ]; then
  echo "❌ Found $BROKEN_LINKS broken links"
  exit 1
else
  echo "✅ No broken links found"
fi

