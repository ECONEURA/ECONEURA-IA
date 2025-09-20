#!/usr/bin/env bash
set -euo pipefail
OUT_DIR="$(pwd)/audit"
TRACE="$1"
OUT="$OUT_DIR/validacion_gitleaks_${TRACE}.json"
if ! command -v gitleaks >/dev/null 2>&1; then
  jq -n --arg time "$(date --iso-8601=seconds)" '{status:"gitleaks_missing", time:$time}' > "$OUT"
  exit 0
fi
gitleaks detect --source . --report-format json --report-path "$OUT" || true
jq -n --arg trace "$TRACE" --arg out "$OUT" --arg time "$(date --iso-8601=seconds)" '{trace_id:$trace, out:$out, time:$time}' > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"
echo "$OUT"