#!/usr/bin/env bash
# ECONEURA Cross-Tool Comparison Script
# Compares findings from multiple security tools and identifies high-confidence matches

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUDIT_DIR="$SCRIPT_DIR/../audit"

# Function to normalize finding for comparison
normalize_finding() {
  local finding="$1"
  local tool="$2"

  local file_path
  local line_number
  local match_hash
  local finding_type

  file_path=$(echo "$finding" | jq -r '.file // .File // empty')
  line_number=$(echo "$finding" | jq -r '.lineNumber // .LineNumber // .line // .Line // 0')

  # Create a normalized match signature
  case "$tool" in
    "gitleaks")
      match_hash=$(echo "$finding" | jq -r '.match // empty' | sha256sum | cut -d' ' -f1)
      finding_type=$(echo "$finding" | jq -r '.ruleID // "unknown"')
      ;;
    "trufflehog")
      match_hash=$(echo "$finding" | jq -r '.Raw // .Match // empty' | sha256sum | cut -d' ' -f1)
      finding_type=$(echo "$finding" | jq -r '.DetectorName // .Type // "unknown"')
      ;;
    "semgrep")
      match_hash=$(echo "$finding" | jq -r '.extra.metavars // empty' | sha256sum | cut -d' ' -f1)
      finding_type=$(echo "$finding" | jq -r '.check_id // "unknown"')
      ;;
    *)
      match_hash=$(echo "$finding" | jq -r '.match // .Match // empty' | sha256sum | cut -d' ' -f1)
      finding_type=$(echo "$finding" | jq -r '.type // .Type // "unknown"')
      ;;
  esac

  # Create normalized finding
  jq -n \
    --arg file_path "$file_path" \
    --argjson line_number "$line_number" \
    --arg match_hash "$match_hash" \
    --arg finding_type "$finding_type" \
    --arg tool "$tool" \
    --argjson original_finding "$finding" \
    '{
      file_path: $file_path,
      line_number: $line_number,
      match_hash: $match_hash,
      finding_type: $finding_type,
      tool: $tool,
      original_finding: $original_finding
    }'
}

# Function to find matches across tools
find_cross_tool_matches() {
  local all_findings="$1"

  # Group findings by file and line proximity (±2 lines)
  local grouped_findings="{}"

  local total_findings
  total_findings=$(echo "$all_findings" | jq '. | length')

  for i in $(seq 0 $((total_findings - 1))); do
    local finding
    finding=$(echo "$all_findings" | jq ".[$i]")

    local file_path
    local line_number
    local match_hash

    file_path=$(echo "$finding" | jq -r '.file_path')
    line_number=$(echo "$finding" | jq -r '.line_number')
    match_hash=$(echo "$finding" | jq -r '.match_hash')

    # Create proximity key (file:line_range)
    local proximity_key="${file_path}:${line_number}"

    # Add to grouped findings
    grouped_findings=$(echo "$grouped_findings" | jq --arg key "$proximity_key" --argjson finding "$finding" '
      .[$key] = (.[$key] // []) + [$finding]
    ')
  done

  echo "$grouped_findings"
}

# Function to analyze match confidence
analyze_match_confidence() {
  local grouped_finding="$1"

  local tools
  tools=$(echo "$grouped_finding" | jq '[.[].tool] | unique')

  local tool_count
  tool_count=$(echo "$tools" | jq 'length')

  local confidence="low"
  local confidence_reason="single_tool"

  if [ "$tool_count" -gt 1 ]; then
    confidence="medium"
    confidence_reason="multi_tool"

    if [ "$tool_count" -gt 2 ]; then
      confidence="high"
      confidence_reason="multi_tool_high"
    fi
  fi

  # Check for exact hash matches (higher confidence)
  local unique_hashes
  unique_hashes=$(echo "$grouped_finding" | jq '[.[].match_hash] | unique | length')

  if [ "$unique_hashes" -eq 1 ] && [ "$tool_count" -gt 1 ]; then
    confidence="high"
    confidence_reason="exact_match_multi_tool"
  fi

  jq -n \
    --arg confidence "$confidence" \
    --arg confidence_reason "$confidence_reason" \
    --argjson tool_count "$tool_count" \
    --argjson tools "$tools" \
    '{
      confidence: $confidence,
      reason: $confidence_reason,
      tool_count: $tool_count,
      tools: $tools
    }'
}

# Function to create consolidated finding
create_consolidated_finding() {
  local grouped_finding="$1"
  local confidence_analysis="$2"

  local file_path
  local line_number
  local tools_involved
  local confidence

  file_path=$(echo "$grouped_finding" | jq -r '.[0].file_path')
  line_number=$(echo "$grouped_finding" | jq -r '.[0].line_number')
  tools_involved=$(echo "$confidence_analysis" | jq -r '.tools | join(", ")')
  confidence=$(echo "$confidence_analysis" | jq -r '.confidence')

  # Get the most specific finding type
  local finding_types
  finding_types=$(echo "$grouped_finding" | jq '[.[].finding_type] | unique')

  # Create consolidated finding
  jq -n \
    --arg file_path "$file_path" \
    --argjson line_number "$line_number" \
    --arg tools_involved "$tools_involved" \
    --arg confidence "$confidence" \
    --argjson finding_types "$finding_types" \
    --argjson tool_count "$(echo "$confidence_analysis" | jq -r '.tool_count')" \
    --argjson grouped_finding "$grouped_finding" \
    --argjson confidence_analysis "$confidence_analysis" \
    '{
      file_path: $file_path,
      line_number: $line_number,
      tools_involved: $tools_involved,
      confidence: $confidence,
      finding_types: $finding_types,
      tool_count: $tool_count,
      cross_validation: {
        confidence_analysis: $confidence_analysis,
        grouped_findings: $grouped_finding
      },
      consolidated_at: (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
    }'
}

# Main execution
if [ $# -lt 2 ]; then
  echo "Usage: $0 <tool1_report.json> <tool2_report.json> [tool3_report.json...] [trace_id]" >&2
  echo "Supported tools: gitleaks, trufflehog, semgrep" >&2
  exit 1
fi

# Parse arguments
TOOL_FILES=()
TRACE_ID="$(date +%s)"

for arg in "$@"; do
  if [[ "$arg" == *.json ]]; then
    TOOL_FILES+=("$arg")
  elif [[ "$arg" =~ ^[0-9]+$ ]]; then
    TRACE_ID="$arg"
  fi
done

OUTPUT_FILE="$AUDIT_DIR/cross_validation_${TRACE_ID}.json"

echo "🔍 Cross-validating findings from ${#TOOL_FILES[@]} tools"

# Validate input files
for file in "${TOOL_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Tool report file not found: $file" >&2
    exit 1
  fi
done

# Normalize all findings
all_normalized_findings="[]"
tool_index=0

for file in "${TOOL_FILES[@]}"; do
  tool_index=$((tool_index + 1))

  # Try to detect tool type from filename or content
  local tool_type="unknown"
  if [[ "$file" == *gitleaks* ]]; then
    tool_type="gitleaks"
  elif [[ "$file" == *trufflehog* ]]; then
    tool_type="trufflehog"
  elif [[ "$file" == *semgrep* ]]; then
    tool_type="semgrep"
  else
    # Try to detect from content
    if jq -e '.[0].ruleID' "$file" >/dev/null 2>&1; then
      tool_type="gitleaks"
    elif jq -e '.[0].DetectorName' "$file" >/dev/null 2>&1; then
      tool_type="trufflehog"
    elif jq -e '.[0].check_id' "$file" >/dev/null 2>&1; then
      tool_type="semgrep"
    fi
  fi

  echo "📊 Processing tool $tool_index: $tool_type ($file)"

  findings=$(cat "$file")
  total_findings=$(echo "$findings" | jq '. | length')

  if [ "$total_findings" -gt 0 ]; then
    for i in $(seq 0 $((total_findings - 1))); do
      finding=$(echo "$findings" | jq ".[$i]")
      normalized=$(normalize_finding "$finding" "$tool_type")
      all_normalized_findings=$(echo "$all_normalized_findings" | jq ". + [$normalized]")
    done
  fi
done

# Find cross-tool matches
echo "🔗 Finding cross-tool matches..."
grouped_findings=$(find_cross_tool_matches "$all_normalized_findings")

# Create consolidated findings
consolidated_findings="[]"
group_keys=$(echo "$grouped_findings" | jq -r 'keys[]')

for key in $group_keys; do
  group=$(echo "$grouped_findings" | jq --arg key "$key" '.[$key]')
  confidence_analysis=$(analyze_match_confidence "$group")
  consolidated=$(create_consolidated_finding "$group" "$confidence_analysis")
  consolidated_findings=$(echo "$consolidated_findings" | jq ". + [$consolidated]")
done

# Generate cross-validation summary
summary=$(echo "$consolidated_findings" | jq '{
  total_consolidated: length,
  confidence_breakdown: {
    high: [ .[] | select(.confidence == "high") ] | length,
    medium: [ .[] | select(.confidence == "medium") ] | length,
    low: [ .[] | select(.confidence == "low") ] | length
  },
  tool_coverage: {
    single_tool: [ .[] | select(.tool_count == 1) ] | length,
    multi_tool: [ .[] | select(.tool_count > 1) ] | length,
    three_plus_tools: [ .[] | select(.tool_count >= 3) ] | length
  },
  tools_involved: [ .[] | .tools_involved ] | unique,
  trace_id: "'"$TRACE_ID"'",
  cross_validated_at: (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
}')

# Combine summary and consolidated findings
result=$(jq -n \
  --argjson summary "$summary" \
  --argjson findings "$consolidated_findings" \
  '{
    summary: $summary,
    consolidated_findings: $findings
  }')

echo "$result" > "$OUTPUT_FILE"

echo "✅ Cross-validation completed"
echo "📊 Summary:"
echo "$summary" | jq -r '"  Total consolidated: \(.total_consolidated) findings"'
echo "$summary" | jq -r '"  High confidence: \(.confidence_breakdown.high) findings"'
echo "$summary" | jq -r '"  Medium confidence: \(.confidence_breakdown.medium) findings"'
echo "$summary" | jq -r '"  Low confidence: \(.confidence_breakdown.low) findings"'
echo "$summary" | jq -r '"  Multi-tool matches: \(.tool_coverage.multi_tool) findings"'
echo "📁 Output: $OUTPUT_FILE"

echo "$OUTPUT_FILE"