#!/usr/bin/env bash
set -euo pipefail
echo "[fix-lint] Running ESLint --fix (src/cockpit.api)..."
cd apps/api/src/cockpit.api
npm ci --no-audit --no-fund
npx eslint 'src/**/*.js' --fix || true
echo "[fix-lint] Listing remaining ESLint issues (compact):"
npx eslint 'src/**/*.js' -f compact || true
