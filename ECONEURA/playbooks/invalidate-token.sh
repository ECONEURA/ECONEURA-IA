#!/usr/bin/env bash
# ECONEURA Token Invalidation Playbook
# Invalidates compromised tokens and updates access controls

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../scripts/vault_lib.sh"
source "$SCRIPT_DIR/../scripts/approve_check.sh"

# Configuration
ISSUE_ID="$1"
TRACE_ID="$2"
APPROVAL_TOKEN="$3"
TOKEN_TYPE="$4"  # github, gitlab, oauth, jwt, etc.
TOKEN_IDENTIFIER="$5"  # token hash, ID, or pattern

# Validate inputs
if [ $# -lt 5 ]; then
  echo "Usage: $0 <issue_id> <trace_id> <approval_token> <token_type> <token_identifier>" >&2
  exit 1
fi

AUDIT_DIR="$SCRIPT_DIR/../audit"
PLAYBOOK_LOG="$AUDIT_DIR/playbook_token_invalidation_${TRACE_ID}.json"

# Function to log playbook execution
log_playbook_execution() {
  local step="$1"
  local status="$2"
  local details="${3:-}"

  local log_entry
  log_entry=$(jq -n \
    --arg issue_id "$ISSUE_ID" \
    --arg trace_id "$TRACE_ID" \
    --arg step "$step" \
    --arg status "$status" \
    --arg details "$details" \
    --arg timestamp "$(date --iso-8601=seconds)" \
    '{
      issue_id: $issue_id,
      trace_id: $trace_id,
      playbook: "token_invalidation",
      step: $step,
      status: $status,
      details: $details,
      timestamp: $timestamp
    }')

  # Append to playbook log
  if [ -f "$PLAYBOOK_LOG" ]; then
    current_log=$(cat "$PLAYBOOK_LOG")
    echo "$current_log" | jq ".execution_log += [$log_entry]" > "$PLAYBOOK_LOG.tmp"
  else
    jq -n --argjson log_entry "$log_entry" '{execution_log: [$log_entry]}' > "$PLAYBOOK_LOG.tmp"
  fi
  mv "$PLAYBOOK_LOG.tmp" "$PLAYBOOK_LOG"
}

# Function to invalidate GitHub token
invalidate_github_token() {
  local token_id="$1"

  echo "🔗 Invalidating GitHub token..."
  # Note: GitHub tokens are invalidated by deleting them via API
  # This would require GitHub API access and proper authentication
  log_playbook_execution "github_api_call" "simulated" "GitHub token invalidation requires API access"

  # In a real implementation, this would make API calls to:
  # DELETE /authorizations/:authorization_id
  # or DELETE /applications/:client_id/tokens/:access_token

  echo "⚠️  GitHub token invalidation requires manual API call or web interface"
  echo "   Visit: https://github.com/settings/tokens"
}

# Function to invalidate OAuth token
invalidate_oauth_token() {
  local token_hash="$1"
  local provider="${2:-unknown}"

  echo "🔗 Invalidating OAuth token for $provider..."

  case "$provider" in
    "google"|"gmail")
      echo "⚠️  Google OAuth: Visit https://myaccount.google.com/security"
      ;;
    "microsoft"|"azure")
      echo "⚠️  Microsoft OAuth: Visit https://account.microsoft.com/security"
      ;;
    "facebook")
      echo "⚠️  Facebook OAuth: Visit https://www.facebook.com/settings?tab=security"
      ;;
    *)
      echo "⚠️  Generic OAuth: Check provider's security settings"
      ;;
  esac

  log_playbook_execution "oauth_invalidation" "manual_required" "OAuth token requires manual invalidation via provider"
}

# Function to invalidate JWT token
invalidate_jwt_token() {
  local token_pattern="$1"

  echo "🔐 Invalidating JWT token..."

  # Find files containing JWT pattern
  JWT_FILES=$(git grep -l "$token_pattern" 2>/dev/null || echo "")

  if [ -n "$JWT_FILES" ]; then
    echo "📝 Found JWT in files, removing..."
    for file in $JWT_FILES; do
      # Create backup
      cp "$file" "$file.backup.$(date +%s)"
      # Remove JWT (this is a simple pattern - real implementation would be more sophisticated)
      sed -i "/$token_pattern/d" "$file"
      echo "✅ Cleaned JWT from $file"
    done
  fi

  log_playbook_execution "jwt_cleanup" "completed" "JWT tokens removed from codebase"
}

# Function to update access control lists
update_access_controls() {
  local token_type="$1"
  local identifier="$2"

  echo "🔒 Updating access controls..."

  # This would typically update configuration files, ACLs, or external systems
  # For now, we'll log the intent and create a remediation checklist

  log_playbook_execution "access_control_update" "pending" "Access control updates required"
}

# Main execution
echo "🚫 Starting Token Invalidation Playbook"
echo "📋 Issue ID: $ISSUE_ID"
echo "🔗 Trace ID: $TRACE_ID"
echo "🔑 Token Type: $TOKEN_TYPE"

log_playbook_execution "start" "running" "Starting token invalidation playbook for $TOKEN_TYPE"

# Step 1: Validate approval
echo "🔐 Validating approval..."
if ! approve_check "$TRACE_ID" "$APPROVAL_TOKEN" "$(whoami)" >/dev/null 2>&1; then
  log_playbook_execution "approval" "failed" "Approval validation failed"
  echo "❌ Approval validation failed" >&2
  exit 1
fi
log_playbook_execution "approval" "success" "Approval validated successfully"

# Step 2: Execute token-specific invalidation
echo "🚫 Executing token invalidation for $TOKEN_TYPE..."
case "$TOKEN_TYPE" in
  "github"|"ghp_"|"github_token")
    invalidate_github_token "$TOKEN_IDENTIFIER"
    ;;
  "oauth"|"oauth_token")
    invalidate_oauth_token "$TOKEN_IDENTIFIER"
    ;;
  "jwt"|"bearer")
    invalidate_jwt_token "$TOKEN_IDENTIFIER"
    ;;
  "gitlab"|"glpat")
    echo "⚠️  GitLab token: Visit https://gitlab.com/-/profile/personal_access_tokens"
    log_playbook_execution "gitlab_invalidation" "manual_required" "GitLab token requires manual invalidation"
    ;;
  "aws"|"aws_token")
    echo "⚠️  AWS token: Consider rotating via AWS IAM console"
    log_playbook_execution "aws_invalidation" "manual_required" "AWS token requires IAM rotation"
    ;;
  *)
    echo "⚠️  Unknown token type: Manual invalidation required"
    log_playbook_execution "generic_invalidation" "manual_required" "Unknown token type requires manual handling"
    ;;
esac

# Step 3: Update access controls
update_access_controls "$TOKEN_TYPE" "$TOKEN_IDENTIFIER"

# Step 4: Create summary and remediation checklist
REMEDIATION_CHECKLIST=(
  "Verify token is no longer valid"
  "Monitor for authentication failures"
  "Update any hardcoded references"
  "Rotate related credentials if compromised"
  "Review access logs for suspicious activity"
  "Consider implementing token rotation policies"
)

SUMMARY=$(jq -n \
  --arg issue_id "$ISSUE_ID" \
  --arg trace_id "$TRACE_ID" \
  --arg token_type "$TOKEN_TYPE" \
  --arg token_identifier_masked "$(echo "$TOKEN_IDENTIFIER" | sed 's/.\{4\}/****/g')" \
  --argjson remediation_checklist "$(printf '%s\n' "${REMEDIATION_CHECKLIST[@]}" | jq -R -s -c 'split("\n")[:-1]')" \
  --arg completed_at "$(date --iso-8601=seconds)" \
  '{
    playbook: "token_invalidation",
    issue_id: $issue_id,
    trace_id: $trace_id,
    status: "completed",
    token_type: $token_type,
    token_identifier_masked: $token_identifier_masked,
    remediation_checklist: $remediation_checklist,
    completed_at: $completed_at,
    notes: [
      "Token invalidation may require manual steps depending on the provider",
      "Monitor systems for authentication failures after invalidation",
      "Consider implementing automated token rotation for prevention"
    ]
  }')

echo "$SUMMARY" > "$PLAYBOOK_LOG"

echo "✅ Token Invalidation Playbook completed"
echo "🔑 Token Type: $TOKEN_TYPE"
echo "📋 Remediation checklist created"
echo "📁 Log: $PLAYBOOK_LOG"

# Output the playbook log path for the caller
echo "$PLAYBOOK_LOG"