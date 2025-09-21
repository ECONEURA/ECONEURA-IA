#!/usr/bin/env bash
set -euo pipefail
OUT_DIR="$(pwd)/audit"
mkdir -p "$OUT_DIR"
TRACE="$1"
OUT_JSON="$OUT_DIR/secretos_simple_${TRACE}.json"
LOG="$OUT_DIR/auditoria_secrets_simple_${TRACE}.log"

echo "{\"trace_id\":\"$TRACE\",\"start\":\"$(date --iso-8601=seconds)\",\"method\":\"simple_scan\"}" > "$LOG"

# Simple patterns - search for common secret indicators
echo "Starting simple secret scan..." >> "$LOG"

# Initialize empty JSON array
echo "[]" > "$OUT_JSON"

# Search for each pattern individually
patterns=("password" "secret" "key" "token" "api_key" "private")

total_found=0
for pattern in "${patterns[@]}"; do
  echo "Searching for: $pattern" >> "$LOG"
  # Find files containing the pattern
  git grep -l "$pattern" -- ':!*.log' ':!*.md' ':!node_modules' ':!.git' ':!*test*' 2>/dev/null | while read -r file; do
    # Skip if it's a documentation or example file
    if [[ "$file" == *".md" || "$file" == *".example" || "$file" == *".template" || "$file" == *"README"* ]]; then
      continue
    fi

    # Get line numbers and content
    git grep -n "$pattern" "$file" 2>/dev/null | head -3 | while IFS=: read -r line_num content; do
      # Escape quotes and limit length
      safe_content=$(echo "$content" | sed 's/"/\\"/g' | cut -c1-100)
      # Create JSON entry
      entry="{\"file\":\"$file\",\"line\":$line_num,\"pattern\":\"$pattern\",\"content\":\"$safe_content\"}"

      # Add to JSON array
      jq ". += [$entry]" "$OUT_JSON" > "${OUT_JSON}.tmp" && mv "${OUT_JSON}.tmp" "$OUT_JSON"
      total_found=$((total_found+1))
    done
  done
done

# Log completion
jq -n --arg trace "$TRACE" --arg file "$OUT_JSON" --arg count "$total_found" --arg time "$(date --iso-8601=seconds)" \
  '{trace_id:$trace, file:$file, findings:$count, time:$time, method:"simple_scan"}' >> "$LOG"

echo "Simple scan completed. Found $total_found potential matches."
echo "Results saved to: $OUT_JSON"

# Show summary
if [ "$total_found" -gt 0 ]; then
  echo "First few findings:"
  jq '.[0:3]' "$OUT_JSON" 2>/dev/null || echo "Could not display results"
fi
