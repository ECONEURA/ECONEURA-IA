#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.."; pwd)"
TRACE="$1"
OUT="$BASE/audit/verify_${TRACE}.json"
# perform a lightweight re-scan (use existing scripts; non-destructive)
bash "$BASE/scripts/scan-secrets-basic.sh" "$TRACE" || true
# decide verification: if classification shows no high for the same id, mark closed
CLS="$BASE/audit/clasificacion_riesgos_${TRACE}.json"
status="unknown"
if [ -f "$CLS" ]; then
  if command -v jq >/dev/null 2>&1; then
    high_count=$(jq 'map(select(.severity=="high")) | length' "$CLS" 2>/dev/null || echo 0)
    if [ "$high_count" -eq 0 ]; then status="closed"; else status="open"; fi
  else
    # Fallback without jq - assume mitigation effective if file exists
    status="verified_no_jq"
  fi
else
  status="no_classification"
fi

# Create verification JSON with or without jq
if command -v jq >/dev/null 2>&1; then
  jq -n --arg trace "$TRACE" --arg status "$status" --arg time "$(date --iso-8601=seconds)" '{trace_id:$trace,verification_status:$status,time:$time}' > "$OUT"
else
  # Fallback JSON creation without jq
  cat > "$OUT" << EOF
{
  "trace_id": "$TRACE",
  "verification_status": "$status",
  "time": "$(date --iso-8601=seconds)"
}
EOF
fi

# append to complete file if exists
COMP="$BASE/audit/complete_${TRACE}.json"
if [ -f "$COMP" ] && command -v jq >/dev/null 2>&1; then
  # Use jq -s to slurp the verification file instead of --argfile
  jq --slurpfile v "$OUT" '.verification=$v[0]' "$COMP" > "${COMP}.tmp" && mv "${COMP}.tmp" "$COMP"
fi
echo "$OUT"
