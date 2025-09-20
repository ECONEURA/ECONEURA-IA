#!/usr/bin/env bash
# ECONEURA Commit Redaction Playbook
# Creates revert branches and protected issues for commits with sensitive data

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../scripts/vault_lib.sh"
source "$SCRIPT_DIR/../scripts/approve_check.sh"

# Configuration
ISSUE_ID="$1"
TRACE_ID="$2"
APPROVAL_TOKEN="$3"
COMMIT_HASH="$4"
REASON="${5:-security_redaction}"

# Validate inputs
if [ $# -lt 4 ]; then
  echo "Usage: $0 <issue_id> <trace_id> <approval_token> <commit_hash> [reason]" >&2
  exit 1
fi

AUDIT_DIR="$SCRIPT_DIR/../audit"
PLAYBOOK_LOG="$AUDIT_DIR/playbook_commit_redaction_${TRACE_ID}.json"

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
      playbook: "commit_redaction",
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

# Function to validate commit exists
validate_commit() {
  local commit_hash="$1"

  if ! git cat-file -t "$commit_hash" >/dev/null 2>&1; then
    echo "❌ Commit $commit_hash does not exist" >&2
    return 1
  fi

  echo "✅ Commit $commit_hash validated"
  return 0
}

# Function to analyze commit for sensitive data
analyze_commit() {
  local commit_hash="$1"

  echo "🔍 Analyzing commit $commit_hash..."

  # Get commit details
  COMMIT_INFO=$(git show --stat "$commit_hash" 2>/dev/null || echo "Commit not found")

  # Get files changed in commit
  CHANGED_FILES=$(git show --name-only --format="" "$commit_hash" 2>/dev/null || echo "")

  # Get commit message
  COMMIT_MESSAGE=$(git show --format="%s" --no-patch "$commit_hash" 2>/dev/null || echo "No message")

  echo "📝 Commit Analysis:"
  echo "   Message: $COMMIT_MESSAGE"
  echo "   Files changed:"
  echo "$CHANGED_FILES" | sed 's/^/     /'

  # Return analysis as JSON
  jq -n \
    --arg commit_hash "$commit_hash" \
    --arg message "$COMMIT_MESSAGE" \
    --argjson files_changed "$(echo "$CHANGED_FILES" | jq -R -s -c 'split("\n")[:-1]')" \
    '{
      commit_hash: $commit_hash,
      message: $message,
      files_changed: $files_changed
    }'
}

# Function to create redaction branch
create_redaction_branch() {
  local commit_hash="$1"
  local reason="$2"

  local branch_name="security/redaction-${commit_hash:0:8}-$(date +%Y%m%d-%H%M%S)"

  echo "🌿 Creating redaction branch: $branch_name"

  # Create and checkout new branch
  git checkout -b "$branch_name"

  # Create a revert commit
  echo "🔄 Creating revert commit..."
  git revert --no-edit "$commit_hash" 2>/dev/null || {
    echo "⚠️  Automatic revert failed, manual intervention required"
    log_playbook_execution "revert_commit" "manual_required" "Automatic revert failed for $commit_hash"
    return 1
  }

  # Add redaction notice to commit message
  local new_message="[SECURITY REDACTION] Reverted $commit_hash
Reason: $reason
Issue: $ISSUE_ID
Trace: $TRACE_ID

This commit reverts sensitive data that was accidentally committed.
Original commit: $commit_hash"

  git commit --amend -m "$new_message"

  echo "✅ Redaction branch created: $branch_name"
  echo "$branch_name"
}

# Function to create protected issue
create_protected_issue() {
  local commit_hash="$1"
  local branch_name="$2"
  local reason="$3"

  echo "📋 Creating protected security issue..."

  # In a real implementation, this would create a GitHub/GitLab issue
  # For now, we'll create a local issue file

  local issue_file="$AUDIT_DIR/security_issue_${TRACE_ID}.md"

  cat > "$issue_file" << EOF
# 🔒 Security Issue: Sensitive Data in Commit

## Issue Details
- **Issue ID**: $ISSUE_ID
- **Trace ID**: $TRACE_ID
- **Commit Hash**: $commit_hash
- **Reason**: $reason
- **Created**: $(date --iso-8601=seconds)
- **Status**: OPEN - REQUIRES IMMEDIATE ATTENTION

## Description
Sensitive data was detected in commit $commit_hash. A redaction branch has been created to revert this commit.

## Redaction Branch
- **Branch**: $branch_name
- **Status**: Ready for review and merge

## Next Steps
1. **Review** the redaction branch: $branch_name
2. **Test** the changes to ensure functionality is preserved
3. **Merge** the redaction branch to main branch
4. **Delete** the sensitive commit from git history (if using BFG or similar)
5. **Monitor** for any broken functionality
6. **Update** any dependent systems or documentation

## Security Notes
- The original commit contained sensitive information
- All team members should rotate any credentials that may have been exposed
- Consider implementing pre-commit hooks to prevent future incidents

## Files Affected
$(git show --name-only --format="" "$commit_hash" 2>/dev/null | sed 's/^/- /')

---
*This issue was automatically generated by ECONEURA security playbook*
EOF

  echo "✅ Protected issue created: $issue_file"
  echo "$issue_file"
}

# Main execution
echo "🔒 Starting Commit Redaction Playbook"
echo "📋 Issue ID: $ISSUE_ID"
echo "🔗 Trace ID: $TRACE_ID"
echo "📝 Commit: $COMMIT_HASH"

log_playbook_execution "start" "running" "Starting commit redaction playbook for $COMMIT_HASH"

# Step 1: Validate approval
echo "🔐 Validating approval..."
if ! approve_check "$TRACE_ID" "$APPROVAL_TOKEN" "$(whoami)" >/dev/null 2>&1; then
  log_playbook_execution "approval" "failed" "Approval validation failed"
  echo "❌ Approval validation failed" >&2
  exit 1
fi
log_playbook_execution "approval" "success" "Approval validated successfully"

# Step 2: Validate commit
echo "🔍 Validating commit..."
if ! validate_commit "$COMMIT_HASH"; then
  log_playbook_execution "commit_validation" "failed" "Commit validation failed"
  exit 1
fi
log_playbook_execution "commit_validation" "success" "Commit validated successfully"

# Step 3: Analyze commit
COMMIT_ANALYSIS=$(analyze_commit "$COMMIT_HASH")
log_playbook_execution "commit_analysis" "completed" "Commit analysis completed"

# Step 4: Create redaction branch
echo "🌿 Creating redaction branch..."
REDACTION_BRANCH=$(create_redaction_branch "$COMMIT_HASH" "$REASON")
if [ $? -eq 0 ]; then
  log_playbook_execution "branch_creation" "success" "Redaction branch created: $REDACTION_BRANCH"
else
  log_playbook_execution "branch_creation" "failed" "Failed to create redaction branch"
  exit 1
fi

# Step 5: Create protected issue
echo "📋 Creating protected issue..."
ISSUE_FILE=$(create_protected_issue "$COMMIT_HASH" "$REDACTION_BRANCH" "$REASON")
log_playbook_execution "issue_creation" "success" "Protected issue created: $ISSUE_FILE"

# Step 6: Create summary
SUMMARY=$(jq -n \
  --arg issue_id "$ISSUE_ID" \
  --arg trace_id "$TRACE_ID" \
  --arg commit_hash "$COMMIT_HASH" \
  --arg redaction_branch "$REDACTION_BRANCH" \
  --arg issue_file "$ISSUE_FILE" \
  --arg reason "$REASON" \
  --arg completed_at "$(date --iso-8601=seconds)" \
  --argjson commit_analysis "$COMMIT_ANALYSIS" \
  '{
    playbook: "commit_redaction",
    issue_id: $issue_id,
    trace_id: $trace_id,
    status: "completed",
    commit_hash: $commit_hash,
    redaction_branch: $redaction_branch,
    issue_file: $issue_file,
    reason: $reason,
    commit_analysis: $commit_analysis,
    completed_at: $completed_at,
    next_steps: [
      "Review the redaction branch: " + $redaction_branch,
      "Test the changes thoroughly",
      "Merge the redaction branch to main",
      "Consider using BFG repo cleaner for complete removal",
      "Monitor for any broken functionality",
      "Rotate any exposed credentials"
    ]
  }')

echo "$SUMMARY" > "$PLAYBOOK_LOG"

echo "✅ Commit Redaction Playbook completed successfully"
echo "🌿 Redaction Branch: $REDACTION_BRANCH"
echo "📋 Issue File: $ISSUE_FILE"
echo "📁 Log: $PLAYBOOK_LOG"

# Output the playbook log path for the caller
echo "$PLAYBOOK_LOG"