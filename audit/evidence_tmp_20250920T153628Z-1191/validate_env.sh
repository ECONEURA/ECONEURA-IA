#!/usr/bin/env bash
set -euo pipefail
OUT="$PWD/audit/env_check.json"
REQ=(jq git curl)
OPT=(trufflehog gitleaks)
MISSING=()
OPTIONAL_MISSING=()
for c in "${REQ[@]}"; do
  if ! command -v "$c" >/dev/null 2>&1; then MISSING+=("$c"); fi
done
for c in "${OPT[@]}"; do
  if ! command -v "$c" >/dev/null 2>&1; then OPTIONAL_MISSING+=("$c"); fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  jq -n --arg time "$(date --iso-8601=seconds)" --argjson missing "$(printf '%s\n' "${MISSING[@]}" | jq -R -s -c 'split("\n")[:-1]')" \
    '{status:"missing_required", time:$time, missing:$missing}' > "$OUT"
  echo "MISSING_REQUIRED" && exit 2
elif [ ${#OPTIONAL_MISSING[@]} -gt 0 ]; then
  jq -n --arg time "$(date --iso-8601=seconds)" --argjson optional_missing "$(printf '%s\n' "${OPTIONAL_MISSING[@]}" | jq -R -s -c 'split("\n")[:-1]')" \
    '{status:"ok_with_limitations", time:$time, optional_missing:$optional_missing}' > "$OUT"
  echo "OK_LIMITED"
else
  jq -n --arg time "$(date --iso-8601=seconds)" '{status:"ok", time:$time}' > "$OUT"
  echo "OK"
fi