#!/usr/bin/env bash
set -euo pipefail

echo "🧹 Cleaning build outputs..."
rm -rf dist || true
rm -rf .next .cache coverage || true
rm -rf apps/*/.next apps/*/.cache apps/*/coverage apps/*/dist || true
rm -rf packages/*/dist packages/*/.cache packages/*/coverage || true
find . -name "*.tsbuildinfo" -delete || true
echo "✅ Clean complete"
