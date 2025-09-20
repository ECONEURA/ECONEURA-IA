#!/usr/bin/env bash
set -euo pipefail
IN="${1:-audit/secretos_${2:-}.json}"
OUT="${3:-audit/clasificacion_riesgos_${4:-}.json}"
# Simple scoring mapping
score_type() {
  case "$1" in
    *PRIVATE*|*PRIVATE\ KEY*|*BEGIN\ PRIVATE*) echo 90 ;;
    *api_key*|*API_KEY*|*apikey*) echo 50 ;;
    *password*|*PASSWORD*|*passwd*) echo 40 ;;
    *token*|*TOKEN*) echo 45 ;;
    *https://*:*@*) echo 70 ;;
    *) echo 30 ;;
  esac
}
# Parse TruffleHog JSON array -> produce scored list
if [ ! -f "$IN" ]; then jq -n '{error:"no_input"}' > "$OUT" && exit 0; fi
jq -c '.[]' "$IN" | nl -ba | while read -r n line; do
  # extract path and string if present
  file=$(echo "$line" | jq -r '.path // .strings[0].path // "unknown"')
  raw=$(echo "$line" | jq -r '.string // .strings[0].string // ""' | sed 's/"/\\"/g')
  t=$(echo "$raw" | tr '[:lower:]' '[:upper:]' | sed -n '1,1p')
  typ=$(echo "$raw" | head -c 200)
  base=$(score_type "$typ")
  modifier=0
  # modifiers
  if [[ "$file" == "." || "$file" == "README"* ]]; then modifier=$((modifier+10)); fi
  score=$((base+modifier))
  severity="low"
  if [ "$score" -ge 80 ]; then severity="high"; fi
  if [ "$score" -ge 45 ] && [ "$score" -lt 80 ]; then severity="medium"; fi
  id="${n}-${file}"
  jq -n --arg id "$id" --arg file "$file" --arg raw "$raw" --arg type "$typ" --argjson score "$score" --arg severity "$severity" \
    '{id:$id, file:$file, raw:$raw, score:$score, severity:$severity}' 
done | jq -s '.' > "$OUT"
jq -n --arg time "$(date --iso-8601=seconds)" --arg out "$OUT" '{status:"ok", out:$out, time:$time}' > "${OUT}.meta"
echo "$OUT"