#!/usr/bin/env bash
set -euo pipefail
REQ_FILE="${1:-}"
if [ -z "$REQ_FILE" ] || [ ! -f "$REQ_FILE" ]; then echo "Usage: $0 <approval_request.json>" >&2; exit 2; fi
KEY="${VAULT_APPROVAL_KEY:-}"
if [ -z "$KEY" ]; then
  echo "ERROR: VAULT_APPROVAL_KEY not set. Aborting to avoid Vault network calls." >&2
  exit 3
fi
PAYLOAD_B64=$(base64 -w0 "$REQ_FILE")
SIG=$(python3 -c "import hmac, hashlib; print(hmac.new(bytes.fromhex('$KEY'), '$PAYLOAD_B64'.encode(), hashlib.sha256).hexdigest())")
jq --arg sig "$SIG" --arg payload "$PAYLOAD_B64" '. + {hmac:$sig, payload_b64:$payload, signed_at:"'"$(date --utc +%Y-%m-%dT%H:%M:%SZ)"'"}' "$REQ_FILE"
