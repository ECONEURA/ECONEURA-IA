#!/usr/bin/env bash
# ECONEURA Advanced Risk Classification Script
# Enhanced classification with configurable scoring, commit age, and git analysis

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/../config"
AUDIT_DIR="$SCRIPT_DIR/../audit"

# Source dependencies
source "$SCRIPT_DIR/git_utils.sh"
source "$SCRIPT_DIR/metrics_lib.sh"

# Load configurations
SCORING_FILE="$CONFIG_DIR/scoring.json"
OWNERS_FILE="$CONFIG_DIR/owners.json"

if [ ! -f "$SCORING_FILE" ]; then
  echo "ERROR: Scoring configuration file not found: $SCORING_FILE" >&2
  exit 1
fi

if [ ! -f "$OWNERS_FILE" ]; then
  echo "ERROR: Owners configuration file not found: $OWNERS_FILE" >&2
  exit 1
fi

# Function to get base score for finding type
get_base_score() {
  local finding_type="$1"
  local scoring_config="$2"

  local base_score
  base_score=$(echo "$scoring_config" | jq -r --arg type "$finding_type" '.scoring_config.base_scores[$type] // 50')

  echo "$base_score"
}

# Function to get path modifier
get_path_modifier() {
  local file_path="$1"
  local scoring_config="$2"

  local path_modifiers
  path_modifiers=$(echo "$scoring_config" | jq -r '.scoring_config.path_modifiers')

  local total_modifier=0

  # Check each path pattern
  local patterns
  patterns=$(echo "$path_modifiers" | jq -r 'keys[]')

  for pattern in $patterns; do
    if [[ "$file_path" == *"$pattern"* ]]; then
      local modifier
      modifier=$(echo "$path_modifiers" | jq -r --arg pattern "$pattern" '.[$pattern]')
      total_modifier=$((total_modifier + modifier))
    fi
  done

  echo "$total_modifier"
}

# Function to get confidence multiplier
get_confidence_multiplier() {
  local confidence="$1"
  local scoring_config="$2"

  local multiplier
  multiplier=$(echo "$scoring_config" | jq -r --arg conf "$confidence" '.scoring_config.confidence_multipliers[$conf] // 1.0')

  echo "$multiplier"
}

# Function to get age modifier
get_age_modifier_value() {
  local age_hours="$1"
  local scoring_config="$2"

  local age_category
  age_category=$(get_age_modifier "$age_hours")

  local modifier
  modifier=$(echo "$scoring_config" | jq -r --arg category "$age_category" '.scoring_config.age_modifiers[$category] // 0')

  echo "$modifier"
}

# Function to determine risk level
get_risk_level() {
  local score="$1"
  local scoring_config="$2"

  local thresholds
  thresholds=$(echo "$scoring_config" | jq -r '.scoring_config.thresholds')

  local high_threshold
  local medium_threshold
  high_threshold=$(echo "$thresholds" | jq -r '.high')
  medium_threshold=$(echo "$thresholds" | jq -r '.medium')

  if [ "$score" -ge "$high_threshold" ]; then
    echo "high"
  elif [ "$score" -ge "$medium_threshold" ]; then
    echo "medium"
  else
    echo "low"
  fi
}

# Function to get owner for a path (same as before)
get_owner_for_path() {
  local file_path="$1"
  local owners_config="$2"

  local owners
  owners=$(echo "$owners_config" | jq -r '.owners')

  # Check for exact matches first
  local exact_match
  exact_match=$(echo "$owners" | jq -r --arg path "$file_path" '.[$path] // empty')
  if [ -n "$exact_match" ] && [ "$exact_match" != "null" ]; then
    echo "$exact_match"
    return 0
  fi

  # Check for pattern matches
  local patterns
  patterns=$(echo "$owners" | jq -r 'keys[]')

  for pattern in $patterns; do
    if [[ "$file_path" == *"$pattern"* ]]; then
      local owner
      owner=$(echo "$owners" | jq -r --arg pattern "$pattern" '.[$pattern]')
      if [ -n "$owner" ] && [ "$owner" != "null" ]; then
        echo "$owner"
        return 0
      fi
    fi
  done

  # Return default owner
  echo "$owners_config" | jq -r '.default_owner'
}

# Enhanced classification function
classify_risk_advanced() {
  local finding="$1"
  local scoring_config="$2"
  local owners_config="$3"

  local file_path
  local finding_type
  local confidence

  file_path=$(echo "$finding" | jq -r '.file // empty')
  finding_type=$(echo "$finding" | jq -r '.type // "unknown"')
  confidence=$(echo "$finding" | jq -r '.confidence // "medium"')

  # Get owner
  local owner
  owner=$(get_owner_for_path "$file_path" "$owners_config")

  # Calculate base score
  local base_score
  base_score=$(get_base_score "$finding_type" "$scoring_config")

  # Calculate path modifier
  local path_modifier
  path_modifier=$(get_path_modifier "$file_path" "$scoring_config")

  # Calculate confidence multiplier
  local confidence_multiplier
  confidence_multiplier=$(get_confidence_multiplier "$confidence" "$scoring_config")

  # Calculate commit age and modifier
  local commit_age_hours
  local age_modifier
  if git rev-parse --git-dir >/dev/null 2>&1; then
    commit_age_hours=$(get_commit_age_hours "$file_path")
    age_modifier=$(get_age_modifier_value "$commit_age_hours" "$scoring_config")
  else
    commit_age_hours=0
    age_modifier=0
  fi

  # Get branch modifier
  local branch_modifier
  if git rev-parse --git-dir >/dev/null 2>&1; then
    branch_modifier=$(get_branch_modifier)
  else
    branch_modifier=0
  fi

  # Calculate final score with confidence multiplier
  local raw_score=$((base_score + path_modifier + age_modifier + branch_modifier))
  local final_score
  final_score=$(echo "scale=2; $raw_score * $confidence_multiplier" | bc 2>/dev/null || echo "$raw_score")

  # Ensure score is within bounds
  final_score=$(echo "if ($final_score > 100) 100 else if ($final_score < 0) 0 else $final_score" | bc 2>/dev/null || echo "$final_score")

  # Determine risk level
  local risk_level
  risk_level=$(get_risk_level "${final_score%.*}" "$scoring_config")

  # Create detailed classification result
  jq -n \
    --arg file_path "$file_path" \
    --arg finding_type "$finding_type" \
    --arg owner "$owner" \
    --arg risk_level "$risk_level" \
    --arg confidence "$confidence" \
    --argjson base_score "$base_score" \
    --argjson path_modifier "$path_modifier" \
    --argjson age_modifier "$age_modifier" \
    --argjson branch_modifier "$branch_modifier" \
    --argjson confidence_multiplier "$(printf "%.2f" "$confidence_multiplier")" \
    --argjson raw_score "$raw_score" \
    --argjson final_score "$(printf "%.2f" "$final_score")" \
    --argjson commit_age_hours "$commit_age_hours" \
    '{
      file_path: $file_path,
      finding_type: $finding_type,
      owner: $owner,
      risk_level: $risk_level,
      confidence: $confidence,
      git_analysis: {
        commit_age_hours: $commit_age_hours,
        age_category: (if $commit_age_hours < 24 then "recent" elif $commit_age_hours < 168 then "this_week" elif $commit_age_hours < 720 then "this_month" else "older" end)
      },
      scoring: {
        base_score: $base_score,
        path_modifier: $path_modifier,
        age_modifier: $age_modifier,
        branch_modifier: $branch_modifier,
        confidence_multiplier: $confidence_multiplier,
        raw_score: $raw_score,
        final_score: $final_score
      },
      classified_at: (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
    }'
}

# Main execution (same as before)
if [ $# -lt 1 ]; then
  echo "Usage: $0 <findings.json> [trace_id]" >&2
  exit 1
fi

FINDINGS_FILE="$1"
TRACE_ID="${2:-$(date +%s)}"
OUTPUT_FILE="$AUDIT_DIR/classification_${TRACE_ID}.json"

if [ ! -f "$FINDINGS_FILE" ]; then
  echo "ERROR: Findings file not found: $FINDINGS_FILE" >&2
  exit 1
fi

echo "🔍 Advanced risk classification from: $FINDINGS_FILE"

# Load configurations
scoring_config=$(cat "$SCORING_FILE")
owners_config=$(cat "$OWNERS_FILE")

# Process each finding
findings=$(cat "$FINDINGS_FILE")
total_findings=$(echo "$findings" | jq '. | length')

classified_findings="[]"
for i in $(seq 0 $((total_findings - 1))); do
  finding=$(echo "$findings" | jq ".[$i]")
  classification=$(classify_risk_advanced "$finding" "$scoring_config" "$owners_config")
  classified_findings=$(echo "$classified_findings" | jq ". + [$classification]")
done

# Generate enhanced summary
summary=$(echo "$classified_findings" | jq '{
  total_findings: length,
  risk_breakdown: {
    high: [ .[] | select(.risk_level == "high") ] | length,
    medium: [ .[] | select(.risk_level == "medium") ] | length,
    low: [ .[] | select(.risk_level == "low") ] | length
  },
  confidence_breakdown: {
    high: [ .[] | select(.confidence == "high") ] | length,
    medium: [ .[] | select(.confidence == "medium") ] | length,
    low: [ .[] | select(.confidence == "low") ] | length
  },
  top_owners: [ .[] | .owner ] | group_by(.) | map({owner: .[0], count: length}) | sort_by(.count) | reverse | .[0:5],
  git_analysis: {
    recent_commits: [ .[] | select(.git_analysis.commit_age_hours < 24) ] | length,
    this_week: [ .[] | select(.git_analysis.commit_age_hours < 168) ] | length,
    this_month: [ .[] | select(.git_analysis.commit_age_hours < 720) ] | length
  },
  trace_id: "'"$TRACE_ID"'",
  classified_at: (now | strftime("%Y-%m-%dT%H:%M:%SZ"))
}')

# Combine summary and detailed findings
result=$(jq -n \
  --argjson summary "$summary" \
  --argjson findings "$classified_findings" \
  '{
    summary: $summary,
    findings: $findings
  }')

# Record classification metrics
high_count=$(echo "$summary" | jq -r '.risk_breakdown.high')
medium_count=$(echo "$summary" | jq -r '.risk_breakdown.medium')
low_count=$(echo "$summary" | jq -r '.risk_breakdown.low')
total_count=$(echo "$summary" | jq -r '.total_findings')

record_classification_metrics "$total_count" "$high_count" "$medium_count" "$low_count"

echo "$result" > "$OUTPUT_FILE"

echo "✅ Advanced risk classification completed"
echo "📊 Summary:"
echo "$summary" | jq -r '"  Total: \(.total_findings) findings"'
echo "$summary" | jq -r '"  High risk: \(.risk_breakdown.high) findings"'
echo "$summary" | jq -r '"  Medium risk: \(.risk_breakdown.medium) findings"'
echo "$summary" | jq -r '"  Low risk: \(.risk_breakdown.low) findings"'
echo "📁 Output: $OUTPUT_FILE"

echo "$OUTPUT_FILE"