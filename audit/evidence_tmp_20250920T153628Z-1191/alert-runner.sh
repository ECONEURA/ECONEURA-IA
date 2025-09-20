#!/usr/bin/env bash
set -euo pipefail
IN="${1:-audit/clasificacion_riesgos_${2:-}.json}"
ALERT_LOG="$(pwd)/audit/alertas_${3:-}.log"
mkdir -p "$(dirname "$ALERT_LOG")"
if [ ! -f "$IN" ]; then echo "{\"error\":\"no_input\",\"time\":\"$(date --iso-8601=seconds)\"}" | tee -a "$ALERT_LOG"; exit 0; fi
jq -c '.[] | select(.severity=="high")' "$IN" | while read -r item; do
  trace=$(date +%s)
  echo "{\"trace_id\":$trace, \"item\":$item, \"time\":\"$(date --iso-8601=seconds)\"}" | tee -a "$ALERT_LOG"
  # Webhook placeholder: curl -s -X POST -H "Content-Type: application/json" -d "$item" "https://example.com/webhook" || true
done
echo "{\"status\":\"done\",\"time\":\"$(date --iso-8601=seconds)\"}" | tee -a "$ALERT_LOG"