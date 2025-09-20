#!/usr/bin/env bash
set -euo pipefail
OUT_DIR="$(pwd)/audit"
mkdir -p "$OUT_DIR"
TRACE="$1"
OUT_JSON="$OUT_DIR/secretos_${TRACE}.json"
LOG="$OUT_DIR/auditoria_secrets_${TRACE}.log"
echo "{\"trace_id\":\"$TRACE\",\"start\":\"$(date --iso-8601=seconds)\"}" > "$LOG"
if ! command -v trufflehog >/dev/null 2>&1; then
  echo "{\"error\":\"trufflehog missing\"}" | tee -a "$LOG"
  exit 3
fi
# Safe execution: filesystem scan with JSON output
trufflehog filesystem --path ./ --json > "$OUT_JSON" 2>>"$LOG" || true
jq -n --arg trace "$TRACE" --arg file "$OUT_JSON" --arg time "$(date --iso-8601=seconds)" '{trace_id:$trace, file:$file, time:$time}' >> "$LOG"
# Show first 5 hits if any
if jq -e 'length>0' "$OUT_JSON" >/dev/null 2>&1; then
  jq '.[0:5]' "$OUT_JSON" || true
else
  echo "[]"
fi