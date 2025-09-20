#!/usr/bin/env bash
# Usage: ./validate_hmac_approval.sh [audit/approval_request.signed.json]

# If no file specified, find the most recent signed approval file
REQ="${1:-}"
if [ -z "$REQ" ]; then
  REQ=$(ls -t /workspaces/ECONEURA-IA/audit/approval_request_*.signed.json 2>/dev/null | head -1)
  if [ -z "$REQ" ]; then
    echo "No signed approval files found in audit directory"
    exit 2
  fi
  echo "Using most recent approval file: $REQ"
fi

if [ ! -f "$REQ" ]; then
  echo "Signed approval file not found: $REQ"
  exit 2
fi

KEY="${VAULT_APPROVAL_KEY:-}"
if [ -z "$KEY" ]; then
  # try Vault
  if command -v vault >/dev/null 2>&1 && [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
    KEY=$(vault kv get -field=value secret/econeura/approval_key 2>/dev/null || echo "")
  fi
fi
if [ -z "$KEY" ]; then
  echo "No key available in env VAULT_APPROVAL_KEY or Vault"
  exit 3
fi

SIG_EXPECT=$(jq -r '.hmac' "$REQ")
PAYLOAD_B64=$(jq -r '.payload_b64' "$REQ")
SIG_ACTUAL=$(python3 -c "import hmac, hashlib; print(hmac.new(bytes.fromhex('$KEY'), '$PAYLOAD_B64'.encode(), hashlib.sha256).hexdigest())")

if [ "$SIG_EXPECT" = "$SIG_ACTUAL" ]; then
  echo '{"status":"valid","checked_at":"'"$(date --iso-8601=seconds)"'","file":"'"$REQ"'"}'
  exit 0
else
  echo '{"status":"invalid","expected":"'"$SIG_EXPECT"'","actual":"'"$SIG_ACTUAL"'","file":"'"$REQ"'"}'
  exit 4
fi
