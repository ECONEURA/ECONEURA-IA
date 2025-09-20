#!/usr/bin/env bash
set -euo pipefail
# Usage: ./generate_hmac_approval.sh audit/approval_request.json > approval_signed.json
REQ_FILE="${1:-audit/approval_request.json}"
if [ ! -f "$REQ_FILE" ]; then echo "Missing request file: $REQ_FILE" >&2; exit 2; fi
PAYLOAD_B64=$(base64 -w0 "$REQ_FILE")
# fetch key from Vault (operator should set VAULT_ADDR and VAULT_TOKEN), fallback to prompt
if command -v vault >/dev/null 2>&1 && [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
  KEY=$(vault kv get -field=value secret/econeura/approval_key 2>/dev/null || echo "")
fi
if [ -z "${KEY:-}" ]; then
  read -s -p "Enter HMAC key (hex): " KEY
  echo
fi
SIG=$(python3 -c "import hmac, hashlib, base64; print(hmac.new(bytes.fromhex('$KEY'), '$PAYLOAD_B64'.encode(), hashlib.sha256).hexdigest())")
jq --arg sig "$SIG" --arg payload "$PAYLOAD_B64" '. + {hmac:$sig, payload_b64:$payload, signed_at:"'"$(date --iso-8601=seconds)"'"}' "$REQ_FILE"
