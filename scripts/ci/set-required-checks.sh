#!/usr/bin/env bash
set -euo pipefail
OWNER="${1:?owner}"; REPO="${2:?repo}"; BRANCH="${3:-main}"
checks='["contract-api / contract","e2e-playwright / e2e","k6-smoke / perf","openapi-check / checksum"]'
echo "Setting required checks on $OWNER/$REPO:$BRANCH ..."
gh api -X PUT repos/$OWNER/$REPO/branches/$BRANCH/protection/required_status_checks \
  -f strict=true \
  -f contexts="$checks" >/dev/null
echo "Done."
