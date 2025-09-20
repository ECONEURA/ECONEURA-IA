#!/usr/bin/env bash
set -euo pipefail
# Usage: VAULT_APPROVAL_KEY="hexkey" ./scripts/vault/generate_hmac_approval_fast.sh approval_request.json > approval_signed.json
REQ_FILE="${1:-}"
if [ -z "$REQ_FILE" ] || [ ! -f "$REQ_FILE" ]; then echo "Usage: $0 <approval_request.json>" >&2; exit 2; fi
# Prefer VAULT_APPROVAL_KEY env to avoid calling Vault
KEY="${VAULT_APPROVAL_KEY:-}"
# If no env key, try Vault CLI quickly (will timeout fast if unreachable)
if [ -z "$KEY" ]; then
  if command -v vault >/dev/null 2>&1 && [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
    # short timeout using curl against Vault health; fallback if unreachable
    if curl --max-time 5 -sSf "${VAULT_ADDR%/}/v1/sys/health" >/dev/null 2>&1; then
      KEY=$(vault kv get -field=value secret/econeura/approval_key 2>/dev/null || true)
    fi
  fi
fi
# If still empty, prompt once (no blocking Vault call)
if [ -z "$KEY" ]; then
  read -s -p "Enter HMAC key (hex) to sign approval (input hidden): " KEY
  echo
  if [ -z "$KEY" ]; then echo "No key provided" >&2; exit 3; fi
fi
PAYLOAD_B64=$(base64 -w0 "$REQ_FILE")
SIG=$(python3 -c "import hmac, hashlib; print(hmac.new(bytes.fromhex('$KEY'), '$PAYLOAD_B64'.encode(), hashlib.sha256).hexdigest())")
jq --arg sig "$SIG" --arg payload "$PAYLOAD_B64" '. + {hmac:$sig, payload_b64:$payload, signed_at:"'"$(date --utc +%Y-%m-%dT%H:%M:%SZ)"'"}' "$REQ_FILE"