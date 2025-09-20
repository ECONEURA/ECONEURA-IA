#!/usr/bin/env bash
set -euo pipefail

# Enhanced approval check with Vault integration and audit logging
# Usage: approve_check.sh <trace_id> <approval_token> [actor]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/vault_lib.sh"

TRACE_ID="$1"
APPROVAL_TOKEN="$2"
ACTOR="${3:-$(whoami)}"

# Function to log approval attempt
log_approval_attempt() {
  local trace_id="$1"
  local actor="$2"
  local status="$3"
  local method="${4:-token}"
  local details="${5:-}"

  local approval_entry
  approval_entry=$(jq -n \
    --arg trace_id "$trace_id" \
    --arg actor "$actor" \
    --arg status "$status" \
    --arg method "$method" \
    --arg timestamp "$(date --iso-8601=seconds)" \
    --arg details "$details" \
    '{
      trace_id: $trace_id,
      actor: $actor,
      status: $status,
      method: $method,
      timestamp: $timestamp,
      details: $details
    }')

  # Append to approvals.json
  local current_approvals
  current_approvals=$(cat "$SCRIPT_DIR/../audit/approvals.json" 2>/dev/null || echo "[]")
  echo "$current_approvals" | jq ". + [$approval_entry]" > "$SCRIPT_DIR/../audit/approvals.json.tmp"
  mv "$SCRIPT_DIR/../audit/approvals.json.tmp" "$SCRIPT_DIR/../audit/approvals.json"
}

# Check Vault connection
if ! vault_check_connection; then
  log_approval_attempt "$TRACE_ID" "$ACTOR" "denied" "vault_unavailable" "Vault not configured or unreachable"
  echo '{"status":"vault_unavailable","error":"Vault not configured or unreachable"}' >&2
  exit 2
fi

# Get approval token with expiry validation
EXPECTED_TOKEN=$(vault_get_token_with_expiry)
if [ $? -ne 0 ] || [ -z "$EXPECTED_TOKEN" ]; then
  log_approval_attempt "$TRACE_ID" "$ACTOR" "denied" "no_valid_token" "No valid approval token found in Vault"
  echo '{"status":"no_valid_token","error":"No valid approval token found in Vault"}' >&2
  exit 2
fi

# Validate token
if [ "$APPROVAL_TOKEN" != "$EXPECTED_TOKEN" ]; then
  log_approval_attempt "$TRACE_ID" "$ACTOR" "denied" "token_mismatch" "Provided token does not match stored token"
  echo '{"status":"denied","error":"Invalid approval token"}' >&2
  exit 3
fi

# Token is valid - log successful approval
log_approval_attempt "$TRACE_ID" "$ACTOR" "approved" "token_validation" "Approval token validated successfully"

echo "{\"status\":\"approved\",\"trace_id\":\"$TRACE_ID\",\"actor\":\"$ACTOR\",\"timestamp\":\"$(date --iso-8601=seconds)\"}"
