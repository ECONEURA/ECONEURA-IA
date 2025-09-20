#!/usr/bin/env bash
# ECONEURA API Key Rotation Playbook
# Rotates exposed API keys and updates configurations

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../scripts/vault_lib.sh"
source "$SCRIPT_DIR/../scripts/approve_check.sh"

# Configuration
ISSUE_ID="$1"
TRACE_ID="$2"
APPROVAL_TOKEN="$3"
OLD_KEY_PATTERN="$4"
NEW_KEY="${5:-}"

# Validate inputs
if [ $# -lt 4 ]; then
  echo "Usage: $0 <issue_id> <trace_id> <approval_token> <old_key_pattern> [new_key]" >&2
  exit 1
fi

AUDIT_DIR="$SCRIPT_DIR/../audit"
PLAYBOOK_LOG="$AUDIT_DIR/playbook_api_key_rotation_${TRACE_ID}.json"

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
      playbook: "api_key_rotation",
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

# Function to find files containing the old key
find_files_with_key() {
  local pattern="$1"

  # Use git grep to find files containing the pattern
  git grep -l "$pattern" 2>/dev/null || echo ""
}

# Function to generate new API key
generate_new_key() {
  local key_type="${1:-generic}"

  case "$key_type" in
    "aws")
      # Generate AWS-like key format
      echo "AKIA$(openssl rand -hex 16 | tr '[:lower:]' '[:upper:]')"
      ;;
    "github")
      # Generate GitHub token-like format
      echo "ghp_$(openssl rand -hex 20)"
      ;;
    "generic"|*)
      # Generic API key
      openssl rand -hex 32
      ;;
  esac
}

# Function to update file with new key
update_file_key() {
  local file_path="$1"
  local old_pattern="$2"
  local new_key="$3"

  # Create backup
  cp "$file_path" "$file_path.backup.$(date +%s)"

  # Replace old key with new key
  sed -i "s/$old_pattern/$new_key/g" "$file_path"

  echo "✅ Updated $file_path"
}

# Main execution
echo "🔄 Starting API Key Rotation Playbook"
echo "📋 Issue ID: $ISSUE_ID"
echo "🔗 Trace ID: $TRACE_ID"

log_playbook_execution "start" "running" "Starting API key rotation playbook"

# Step 1: Validate approval
echo "🔐 Validating approval..."
if ! approve_check "$TRACE_ID" "$APPROVAL_TOKEN" "$(whoami)" >/dev/null 2>&1; then
  log_playbook_execution "approval" "failed" "Approval validation failed"
  echo "❌ Approval validation failed" >&2
  exit 1
fi
log_playbook_execution "approval" "success" "Approval validated successfully"

# Step 2: Generate new key if not provided
if [ -z "$NEW_KEY" ]; then
  echo "🔑 Generating new API key..."
  NEW_KEY=$(generate_new_key)
  log_playbook_execution "key_generation" "success" "Generated new API key"
else
  log_playbook_execution "key_generation" "skipped" "Using provided API key"
fi

# Step 3: Find files containing the old key
echo "🔍 Finding files with old key pattern..."
FILES_WITH_KEY=$(find_files_with_key "$OLD_KEY_PATTERN")

if [ -z "$FILES_WITH_KEY" ]; then
  log_playbook_execution "file_search" "warning" "No files found containing the key pattern"
  echo "⚠️  No files found containing the key pattern: $OLD_KEY_PATTERN"
  echo "This might indicate the key has already been rotated or is in a different format."
fi

# Step 4: Update files with new key
UPDATED_FILES=()
for file in $FILES_WITH_KEY; do
  echo "📝 Updating $file..."
  update_file_key "$file" "$OLD_KEY_PATTERN" "$NEW_KEY"
  UPDATED_FILES+=("$file")
  log_playbook_execution "file_update" "success" "Updated $file with new key"
done

# Step 5: Validate external services (if applicable)
echo "🔗 Validating external service access..."
# This would typically involve API calls to validate the new key works
# For now, we'll just log the intent
log_playbook_execution "service_validation" "pending" "External service validation required"

# Step 6: Create summary
SUMMARY=$(jq -n \
  --arg issue_id "$ISSUE_ID" \
  --arg trace_id "$TRACE_ID" \
  --arg old_pattern "$OLD_KEY_PATTERN" \
  --arg new_key_masked "$(echo "$NEW_KEY" | sed 's/.\{4\}/****/g')" \
  --argjson files_updated_count "${#UPDATED_FILES[@]}" \
  --argjson files_updated "$(printf '%s\n' "${UPDATED_FILES[@]}" | jq -R -s -c 'split("\n")[:-1]')" \
  --arg completed_at "$(date --iso-8601=seconds)" \
  '{
    playbook: "api_key_rotation",
    issue_id: $issue_id,
    trace_id: $trace_id,
    status: "completed",
    old_key_pattern: $old_pattern,
    new_key_masked: $new_key_masked,
    files_updated_count: $files_updated_count,
    files_updated: $files_updated,
    completed_at: $completed_at,
    next_steps: [
      "Test application functionality with new key",
      "Update external services if necessary",
      "Monitor for any authentication failures",
      "Consider adding key to secret management system"
    ]
  }')

echo "$SUMMARY" > "$PLAYBOOK_LOG"

echo "✅ API Key Rotation Playbook completed successfully"
echo "📊 Summary:"
echo "  Files updated: ${#UPDATED_FILES[@]}"
echo "  New key: $(echo "$NEW_KEY" | sed 's/.\{4\}/****/g')"
echo "📁 Log: $PLAYBOOK_LOG"

# Output the playbook log path for the caller
echo "$PLAYBOOK_LOG"