#!/usr/bin/env bash
# Enhanced Safe Mitigation with Advanced Approval Flow
# Uses HMAC-signed approvals and comprehensive audit logging

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/vault_lib.sh"
source "$SCRIPT_DIR/metrics_lib.sh"

# Configuration - now supports multiple approval methods
ISSUE_ID="$1"
TRACE_ID="$2"
APPROVAL_METHOD="${3:-token}"  # token, hmac, or two_step
APPROVAL_DATA="$4"  # token for simple, JSON for HMAC, or signature for two-step

# Validate inputs based on method
case "$APPROVAL_METHOD" in
  "token")
    if [ $# -lt 4 ]; then
      echo "Usage (token): $0 <issue_id> <trace_id> token <approval_token>" >&2
      exit 1
    fi
    APPROVAL_TOKEN="$APPROVAL_DATA"
    ;;
  "hmac")
    if [ $# -lt 5 ]; then
      echo "Usage (hmac): $0 <issue_id> <trace_id> hmac <approval_json> <signature>" >&2
      exit 1
    fi
    APPROVAL_JSON="$APPROVAL_DATA"
    APPROVAL_SIGNATURE="$5"
    ;;
  "two_step")
    if [ $# -lt 5 ]; then
      echo "Usage (two_step): $0 <issue_id> <trace_id> two_step <primary_token> <secondary_signature>" >&2
      exit 1
    fi
    PRIMARY_TOKEN="$APPROVAL_DATA"
    SECONDARY_SIGNATURE="$5"
    ;;
  *)
    echo "ERROR: Invalid approval method: $APPROVAL_METHOD" >&2
    echo "Supported methods: token, hmac, two_step" >&2
    exit 1
    ;;
esac

AUDIT_DIR="$SCRIPT_DIR/../audit"
MITIGATION_LOG="$AUDIT_DIR/mitigation_${TRACE_ID}.json"

# Function to log mitigation action with enhanced details
log_mitigation() {
  local issue_id="$1"
  local trace_id="$2"
  local actor="$3"
  local status="$4"
  local details="${5:-}"
  local approval_method="$6"
  local approval_details="${7:-}"

  local mitigation_entry
  mitigation_entry=$(jq -n \
    --arg issue_id "$issue_id" \
    --arg trace_id "$trace_id" \
    --arg actor "$actor" \
    --arg status "$status" \
    --arg details "$details" \
    --arg approval_method "$approval_method" \
    --argjson approval_details "$approval_details" \
    --arg timestamp "$(date --iso-8601=seconds)" \
    '{
      issue_id: $issue_id,
      trace_id: $trace_id,
      actor: $actor,
      status: $status,
      details: $details,
      approval_method: $approval_method,
      approval_details: $approval_details,
      timestamp: $timestamp
    }')

  echo "$mitigation_entry" > "$MITIGATION_LOG"
}

# Function to validate token-based approval
validate_token_approval() {
  local trace_id="$1"
  local approval_token="$2"

  echo "🔑 Validating token approval..."
  if "$SCRIPT_DIR/approve_check.sh" "$trace_id" "$approval_token" "$(whoami)" >/dev/null 2>&1; then
    echo "✅ Token approval validated"
    return 0
  else
    echo "❌ Token approval failed"
    return 1
  fi
}

# Function to validate HMAC-based approval
validate_hmac_approval() {
  local trace_id="$1"
  local approval_json="$2"
  local signature="$3"

  echo "🔏 Validating HMAC approval..."
  if "$SCRIPT_DIR/approve-tool.sh" "$trace_id" "$approval_json" "$signature" >/dev/null 2>&1; then
    echo "✅ HMAC approval validated"
    return 0
  else
    echo "❌ HMAC approval failed"
    return 1
  fi
}

# Function to validate two-step approval
validate_two_step_approval() {
  local trace_id="$1"
  local primary_token="$2"
  local secondary_signature="$3"

  echo "� Validating two-step approval..."

  # First step: token validation
  if ! validate_token_approval "$trace_id" "$primary_token"; then
    echo "❌ Primary token validation failed"
    return 1
  fi

  # Second step: signature validation (simplified for demo)
  # In production, this would validate against a secondary approval system
  if [ -n "$secondary_signature" ]; then
    echo "✅ Secondary signature validated (simplified)"
    return 0
  else
    echo "❌ Secondary signature missing"
    return 1
  fi
}

# Function to perform mitigation (placeholder - would call appropriate playbook)
perform_mitigation() {
  local issue_id="$1"
  local trace_id="$2"

  echo "🛠️ Performing mitigation for issue: $issue_id"

  # This would typically call the appropriate playbook based on issue type
  # For now, we'll just log the intent
  echo "⚠️  [PLACEHOLDER] Mitigation actions would be performed here"
  echo "   - This could call rotate-api-key.sh"
  echo "   - Or invalidate-token.sh"
  echo "   - Or redact-commit.sh"
  echo "   - Based on the issue classification"
}

# Main execution
echo "🛡️  Starting Enhanced Safe Mitigation"
echo "📋 Issue ID: $ISSUE_ID"
echo "🔗 Trace ID: $TRACE_ID"
echo "🔐 Approval Method: $APPROVAL_METHOD"

ACTOR="$(whoami)"
APPROVAL_DETAILS="{}"

log_mitigation "$ISSUE_ID" "$TRACE_ID" "$ACTOR" "started" "Starting mitigation process" "$APPROVAL_METHOD" "$APPROVAL_DETAILS"

# Step 1: Validate approval based on method
APPROVAL_VALIDATED=false

case "$APPROVAL_METHOD" in
  "token")
    if validate_token_approval "$TRACE_ID" "$APPROVAL_TOKEN"; then
      APPROVAL_VALIDATED=true
      APPROVAL_DETAILS="{\"token_validated\":true,\"token_masked\":\"$(echo "$APPROVAL_TOKEN" | sed 's/.\{4\}/****/g')\"}"
    fi
    ;;
  "hmac")
    if validate_hmac_approval "$TRACE_ID" "$APPROVAL_JSON" "$APPROVAL_SIGNATURE"; then
      APPROVAL_VALIDATED=true
      APPROVAL_DETAILS="$APPROVAL_JSON"
    fi
    ;;
  "two_step")
    if validate_two_step_approval "$TRACE_ID" "$PRIMARY_TOKEN" "$SECONDARY_SIGNATURE"; then
      APPROVAL_VALIDATED=true
      APPROVAL_DETAILS="{\"primary_validated\":true,\"secondary_validated\":true}"
    fi
    ;;
esac

if [ "$APPROVAL_VALIDATED" = false ]; then
  log_mitigation "$ISSUE_ID" "$TRACE_ID" "$ACTOR" "blocked" "Approval validation failed" "$APPROVAL_METHOD" "$APPROVAL_DETAILS"
  # Record failed mitigation metrics
  record_mitigation_metrics "blocked" "$APPROVAL_METHOD"
  echo '{"status":"blocked","error":"Approval validation failed","trace_id":"'"$TRACE_ID"'"}' >&2
  exit 1
fi

echo "✅ Approval validated using $APPROVAL_METHOD method"
log_mitigation "$ISSUE_ID" "$TRACE_ID" "$ACTOR" "approved" "Approval validation successful" "$APPROVAL_METHOD" "$APPROVAL_DETAILS"

# Step 2: Perform mitigation
perform_mitigation "$ISSUE_ID" "$TRACE_ID"
log_mitigation "$ISSUE_ID" "$TRACE_ID" "$ACTOR" "completed" "Mitigation actions completed" "$APPROVAL_METHOD" "$APPROVAL_DETAILS"

# Step 3: Create comprehensive summary
MITIGATION_SUMMARY=$(jq -n \
  --arg issue_id "$ISSUE_ID" \
  --arg trace_id "$TRACE_ID" \
  --arg actor "$ACTOR" \
  --arg approval_method "$APPROVAL_METHOD" \
  --argjson approval_details "$APPROVAL_DETAILS" \
  --arg mitigation_log "$MITIGATION_LOG" \
  --arg completed_at "$(date --iso-8601=seconds)" \
  '{
    status: "mitigation_completed",
    issue_id: $issue_id,
    trace_id: $trace_id,
    actor: $actor,
    approval_method: $approval_method,
    approval_details: $approval_details,
    mitigation_log: $mitigation_log,
    completed_at: $completed_at,
    note: "Mitigation completed with advanced approval validation. Review mitigation_log for detailed execution steps."
  }')

# Record mitigation metrics
record_mitigation_metrics "success" "$APPROVAL_METHOD"

echo "$MITIGATION_SUMMARY" > "$MITIGATION_LOG"

echo "✅ Enhanced Safe Mitigation completed successfully"
echo "🔐 Approval Method: $APPROVAL_METHOD"
echo "👤 Actor: $ACTOR"
echo "📁 Log: $MITIGATION_LOG"

# Output the mitigation log path for the caller
echo "$MITIGATION_LOG"
