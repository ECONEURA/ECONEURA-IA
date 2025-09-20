#!/usr/bin/env bash
# ECONEURA Gitleaks Validation Script
# Validates and enhances Gitleaks findings with additional analysis

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIT_DIR="$SCRIPT_DIR/../audit"

# Function to validate gitleaks finding
validate_gitleaks_finding() {
  local finding="$1"

  local file_path
  local line_number
  local match
  local rule_id

  file_path=$(echo "$finding" | jq -r '.file // empty')
  line_number=$(echo "$finding" | jq -r '.lineNumber // 0')
  match=$(echo "$finding" | jq -r '.match // empty')
  rule_id=$(echo "$finding" | jq -r '.ruleID // empty')

  # Skip if file doesn't exist
  if [ ! -f "$file_path" ]; then
    echo "$finding" | jq '. + {validation: {status: "file_not_found", confidence: "low"}}'
    return
  fi

  # Extract context around the finding
  local context_lines=3
  local start_line=$((line_number - context_lines))
  local end_line=$((line_number + context_lines))

  if [ "$start_line" -lt 1 ]; then
    start_line=1
  fi

  local context
  context=$(sed -n "${start_line},${end_line}p" "$file_path" 2>/dev/null || echo "")

  # Analyze the context for validation
  local validation_status="valid"
  local confidence="medium"
  local validation_notes=""

  # Check if the match is in a comment
  if echo "$context" | grep -q "^[[:space:]]*//\|^[[:space:]]*#\|^[[:space:]]*/\*"; then
    validation_notes="$validation_notes; in_comment"
    confidence="low"
  fi

  # Check if it's in a test file
  if [[ "$file_path" == *test* || "$file_path" == *spec* || "$file_path" == *mock* ]]; then
    validation_notes="$validation_notes; test_file"
    confidence="low"
  fi

  # Check if it's a false positive pattern
  if [[ "$match" == *"example"* || "$match" == *"sample"* || "$match" == *"test"* ]]; then
    validation_notes="$validation_notes; likely_example"
    confidence="low"
  fi

  # Check if it's in version control history
  if git ls-files "$file_path" >/dev/null 2>&1; then
    local commit_count
    commit_count=$(git log --oneline -- "$file_path" 2>/dev/null | wc -l)
    if [ "$commit_count" -gt 0 ]; then
      validation_notes="$validation_notes; in_git_history"
    fi
  fi

  # Determine if finding is actionable
  local actionable=true
  if [[ "$confidence" == "low" && "$validation_notes" == *"; in_comment"* ]]; then
    actionable=false
  fi

  # Create validation result
  jq -n \
    --arg validation_status "$validation_status" \
    --arg confidence "$confidence" \
    --arg validation_notes "${validation_notes#,}" \
    --argjson actionable "$actionable" \
    --arg context "$context" \
    '{
      status: $validation_status,
      confidence: $confidence,
      notes: $validation_notes,
      actionable: $actionable,
      context: $context,
      validated_at: (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
    }'
}

# Function to enhance gitleaks finding with validation
enhance_gitleaks_finding() {
  local finding="$1"

  local validation
  validation=$(validate_gitleaks_finding "$finding")

  # Merge finding with validation
  echo "$finding" | jq --argjson validation "$validation" '. + {validation: $validation}'
}

# Main execution
if [ $# -lt 1 ]; then
  echo "Usage: $0 <gitleaks_report.json> [trace_id]" >&2
  exit 1
fi

GITLEAKS_FILE="$1"
TRACE_ID="${2:-$(date +%s)}"
OUTPUT_FILE="$AUDIT_DIR/gitleaks_validated_${TRACE_ID}.json"

if [ ! -f "$GITLEAKS_FILE" ]; then
  echo "ERROR: Gitleaks report file not found: $GITLEAKS_FILE" >&2
  exit 1
fi

echo "🔍 Validating Gitleaks findings from: $GITLEAKS_FILE"

# Process gitleaks findings
findings=$(cat "$GITLEAKS_FILE")
total_findings=$(echo "$findings" | jq '. | length')

if [ "$total_findings" -eq 0 ]; then
  echo "ℹ️  No findings to validate"
  jq -n '{findings: [], summary: {total: 0, validated: 0, actionable: 0}}' > "$OUTPUT_FILE"
  echo "$OUTPUT_FILE"
  exit 0
fi

echo "📊 Processing $total_findings findings..."

validated_findings="[]"
for i in $(seq 0 $((total_findings - 1))); do
  finding=$(echo "$findings" | jq ".[$i]")
  enhanced_finding=$(enhance_gitleaks_finding "$finding")
  validated_findings=$(echo "$validated_findings" | jq ". + [$enhanced_finding]")
done

# Generate validation summary
summary=$(echo "$validated_findings" | jq '{
  total_findings: length,
  validation_stats: {
    valid: [ .[] | select(.validation.status == "valid") ] | length,
    invalid: [ .[] | select(.validation.status != "valid") ] | length,
    high_confidence: [ .[] | select(.validation.confidence == "high") ] | length,
    medium_confidence: [ .[] | select(.validation.confidence == "medium") ] | length,
    low_confidence: [ .[] | select(.validation.confidence == "low") ] | length,
    actionable: [ .[] | select(.validation.actionable == true) ] | length,
    not_actionable: [ .[] | select(.validation.actionable == false) ] | length
  },
  common_issues: [
    .[] | .validation.notes | select(. != null) | split(";")[] | select(. != "") | {issue: .} | select(.issue != null)
  ] | group_by(.issue) | map({issue: .[0].issue, count: length}) | sort_by(.count) | reverse | .[0:5],
  trace_id: "'"$TRACE_ID"'",
  validated_at: (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
}')

# Combine summary and validated findings
result=$(jq -n \
  --argjson summary "$summary" \
  --argjson findings "$validated_findings" \
  '{
    summary: $summary,
    findings: $findings
  }')

echo "$result" > "$OUTPUT_FILE"

echo "✅ Gitleaks validation completed"
echo "📊 Summary:"
echo "$summary" | jq -r '"  Total: \(.total_findings) findings"'
echo "$summary" | jq -r '"  Actionable: \(.validation_stats.actionable) findings"'
echo "$summary" | jq -r '"  High confidence: \(.validation_stats.high_confidence) findings"'
echo "$summary" | jq -r '"  Medium confidence: \(.validation_stats.medium_confidence) findings"'
echo "$summary" | jq -r '"  Low confidence: \(.validation_stats.low_confidence) findings"'
echo "📁 Output: $OUTPUT_FILE"

echo "$OUTPUT_FILE"