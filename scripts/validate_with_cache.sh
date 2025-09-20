#!/usr/bin/env bash
set -euo pipefail
REQ="$1"
CACHE_DIR="${CACHE_DIR:-/tmp/econeura_cache}"
mkdir -p "$CACHE_DIR"
key=$(sha256sum "$REQ" | cut -d' ' -f1)
if [ -f "$CACHE_DIR/$key" ]; then
  echo "CACHED: validation OK for $REQ"
  cat "$CACHE_DIR/$key"
  exit 0
fi
# run validator
if [ -x ./scripts/vault/validate_hmac_approval.sh ]; then
  out=$(./scripts/vault/validate_hmac_approval.sh "$REQ" 2>&1) || { echo "$out"; exit 1; }
  echo "$out" > "$CACHE_DIR/$key"
  echo "$out"
  exit 0
fi
echo "No validator available" >&2
exit 2
