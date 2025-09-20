#!/usr/bin/env bash
set -euo pipefail
# Non-destructive preflight run for CI: ensures artifacts & validator quickly
if [ ! -f audit/approval_signed.json ]; then echo "MISSING_APPROVAL"; exit 2; fi
if [ -x ./scripts/validate_with_cache.sh ]; then
  ./scripts/validate_with_cache.sh audit/approval_signed.json || (echo "VALIDATION_FAILED"; exit 3)
else
  echo "NO_VALIDATOR"; exit 4
fi
echo "PREFLIGHT_OK"
