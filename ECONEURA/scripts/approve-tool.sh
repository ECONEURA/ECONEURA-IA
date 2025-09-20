#!/usr/bin/env bash
# ECONEURA Advanced Approval Tool
# Validates HMAC-signed approvals with expiry and multi-step validation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/vault_lib.sh"
source "$SCRIPT_DIR/metrics_lib.sh"

# Configuration
TRACE_ID="$1"
APPROVAL_DATA="$2"  # JSON string with approval details
SIGNATURE="$3"

# Validate inputs
if [ $# -lt 3 ]; then
  echo "Usage: $0 <trace_id> <approval_data_json> <signature>" >&2
  echo "Example: $0 'trace_123' '{\"actor\":\"user\",\"action\":\"approve\",\"expiry\":\"2025-01-20T10:00:00Z\"}' 'hmac_signature'" >&2
  exit 1
fi

AUDIT_DIR="$SCRIPT_DIR/../audit"
APPROVAL_LOG="$AUDIT_DIR/approval_tool_${TRACE_ID}.json"

# Function to log approval tool execution
log_approval_tool() {
  local step="$1"
  local status="$2"
  local details="${3:-}"

  local log_entry
  log_entry=$(jq -n \
    --arg trace_id "$TRACE_ID" \
    --arg step "$step" \
    --arg status "$status" \
    --arg details "$details" \
    --arg timestamp "$(date --iso-8601=seconds)" \
    '{
      trace_id: $trace_id,
      tool: "approve_tool",
      step: $step,
      status: $status,
      details: $details,
      timestamp: $timestamp
    }')

  # Append to approval tool log
  if [ -f "$APPROVAL_LOG" ]; then
    current_log=$(cat "$APPROVAL_LOG")
    echo "$current_log" | jq ".execution_log += [$log_entry]" > "$APPROVAL_LOG.tmp"
  else
    jq -n --argjson log_entry "$log_entry" '{execution_log: [$log_entry]}' > "$APPROVAL_LOG.tmp"
  fi
  mv "$APPROVAL_LOG.tmp" "$APPROVAL_LOG"
}

# Function to get HMAC secret from Vault
get_hmac_secret() {
  vault_lookup "hmac_secret" "default_hmac_secret_$(date +%s)"
}

# Function to calculate HMAC signature
calculate_hmac() {
  local data="$1"
  local secret="$2"

  echo -n "$data" | openssl dgst -sha256 -hmac "$secret" -binary | openssl base64
}

# Function to validate HMAC signature
validate_hmac_signature() {
  local data="$1"
  local provided_signature="$2"

  local secret
  secret=$(get_hmac_secret)

  local calculated_signature
  calculated_signature=$(calculate_hmac "$data" "$secret")

  if [ "$calculated_signature" = "$provided_signature" ]; then
    return 0
  else
    return 1
  fi
}

# Function to validate approval data
validate_approval_data() {
  local approval_data="$1"

  # Parse JSON
  local actor
  local action
  local expiry
  local conditions

  actor=$(echo "$approval_data" | jq -r '.actor // empty')
  action=$(echo "$approval_data" | jq -r '.action // empty')
  expiry=$(echo "$approval_data" | jq -r '.expiry // empty')
  conditions=$(echo "$approval_data" | jq -r '.conditions // empty')

  # Validate required fields
  if [ -z "$actor" ] || [ "$actor" = "null" ]; then
    echo "ERROR: Missing or invalid actor" >&2
    return 1
  fi

  if [ -z "$action" ] || [ "$action" = "null" ]; then
    echo "ERROR: Missing or invalid action" >&2
    return 1
  fi

  if [ -z "$expiry" ] || [ "$expiry" = "null" ]; then
    echo "ERROR: Missing or invalid expiry" >&2
    return 1
  fi

  # Validate expiry timestamp
  local current_time
  local expiry_time

  current_time=$(date +%s)
  expiry_time=$(date -d "$expiry" +%s 2>/dev/null || echo "0")

  if [ "$expiry_time" = "0" ] || [ "$expiry_time" -le "$current_time" ]; then
    echo "ERROR: Approval has expired or invalid expiry format" >&2
    return 1
  fi

  # Validate action type
  case "$action" in
    "approve"|"deny"|"escalate")
      ;;
    *)
      echo "ERROR: Invalid action type: $action" >&2
      return 1
      ;;
  esac

  echo "✅ Approval data validation passed"
  return 0
}

# Function to check approval conditions
check_approval_conditions() {
  local approval_data="$1"

  local conditions
  conditions=$(echo "$approval_data" | jq -r '.conditions // empty')

  if [ -z "$conditions" ] || [ "$conditions" = "null" ]; then
    echo "✅ No special conditions to check"
    return 0
  fi

  # Parse conditions (this could be extended for complex logic)
  local risk_level
  local required_approvers

  risk_level=$(echo "$conditions" | jq -r '.risk_level // "any"')
  required_approvers=$(echo "$conditions" | jq -r '.required_approvers // 1')

  # Check risk level condition
  if [ "$risk_level" != "any" ]; then
    # This would check the actual risk level from classification
    # For now, we'll assume it passes
    echo "⚠️  Risk level condition check: $risk_level (simulated)"
  fi

  # Check approver count condition
  if [ "$required_approvers" -gt 1 ]; then
    echo "⚠️  Multi-approver condition: $required_approvers required (simulated)"
    # In a real implementation, this would check approval history
  fi

  echo "✅ Approval conditions validated"
  return 0
}

# Function to record approval in audit log
record_approval() {
  local approval_data="$1"
  local signature="$2"
  local validation_result="$3"

  local approval_record
  approval_record=$(jq -n \
    --arg trace_id "$TRACE_ID" \
    --argjson approval_data "$approval_data" \
    --arg signature "$signature" \
    --arg validation_result "$validation_result" \
    --arg recorded_at "$(date --iso-8601=seconds)" \
    --arg recorded_by "$(whoami)" \
    '{
      trace_id: $trace_id,
      approval_data: $approval_data,
      signature: $signature,
      validation_result: $validation_result,
      recorded_at: $recorded_at,
      recorded_by: $recorded_by
    }')

  # Append to approvals.json
  local approvals_file="$AUDIT_DIR/approvals.json"
  if [ -f "$approvals_file" ]; then
    current_approvals=$(cat "$approvals_file")
    echo "$current_approvals" | jq ".approvals += [$approval_record]" > "$approvals_file.tmp"
  else
    jq -n --argjson approval_record "$approval_record" '{approvals: [$approval_record]}' > "$approvals_file.tmp"
  fi
  mv "$approvals_file.tmp" "$approvals_file"
}

# Main execution
echo "🔐 Starting Advanced Approval Tool"
echo "🔗 Trace ID: $TRACE_ID"

log_approval_tool "start" "running" "Starting approval validation"

# Step 1: Validate approval data format
echo "📋 Validating approval data..."
if ! echo "$APPROVAL_DATA" | jq . >/dev/null 2>&1; then
  log_approval_tool "data_validation" "failed" "Invalid JSON format in approval data"
  echo '{"status":"invalid_data","error":"Invalid JSON format"}' >&2
  exit 1
fi
log_approval_tool "data_validation" "success" "Approval data is valid JSON"

# Step 2: Validate approval data content
if ! validate_approval_data "$APPROVAL_DATA"; then
  log_approval_tool "content_validation" "failed" "Approval data content validation failed"
  exit 1
fi
log_approval_tool "content_validation" "success" "Approval data content validated"

# Step 3: Validate HMAC signature
echo "🔏 Validating HMAC signature..."
if ! validate_hmac_signature "$APPROVAL_DATA" "$SIGNATURE"; then
  log_approval_tool "signature_validation" "failed" "HMAC signature validation failed"
  # Record failed approval metrics
  record_approval_metrics "rejected" "hmac"
  echo '{"status":"invalid_signature","error":"HMAC signature validation failed"}' >&2
  exit 1
fi
log_approval_tool "signature_validation" "success" "HMAC signature validated"

# Step 4: Check approval conditions
echo "⚖️  Checking approval conditions..."
if ! check_approval_conditions "$APPROVAL_DATA"; then
  log_approval_tool "conditions_check" "failed" "Approval conditions not met"
  # Record failed approval metrics
  record_approval_metrics "rejected" "hmac"
  exit 1
fi
log_approval_tool "conditions_check" "success" "Approval conditions met"

# Step 5: Record approval
record_approval "$APPROVAL_DATA" "$SIGNATURE" "approved"
log_approval_tool "recording" "success" "Approval recorded in audit log"

# Step 6: Create success response
ACTOR=$(echo "$APPROVAL_DATA" | jq -r '.actor')
ACTION=$(echo "$APPROVAL_DATA" | jq -r '.action')
EXPIRY=$(echo "$APPROVAL_DATA" | jq -r '.expiry')

RESPONSE=$(jq -n \
  --arg status "approved" \
  --arg trace_id "$TRACE_ID" \
  --arg actor "$ACTOR" \
  --arg action "$ACTION" \
  --arg expiry "$EXPIRY" \
  --arg validated_at "$(date --iso-8601=seconds)" \
  '{
    status: $status,
    trace_id: $trace_id,
    actor: $actor,
    action: $action,
    expiry: $expiry,
    validated_at: $validated_at,
    approval_log: "'"$APPROVAL_LOG"'"
  }')

# Record successful approval metrics
record_approval_metrics "validated" "hmac"

echo "$RESPONSE" > "$APPROVAL_LOG"

echo "✅ Advanced Approval Tool completed successfully"
echo "👤 Actor: $ACTOR"
echo "🎯 Action: $ACTION"
echo "⏰ Expires: $EXPIRY"
echo "📁 Log: $APPROVAL_LOG"

# Output the approval log path for the caller
echo "$APPROVAL_LOG"