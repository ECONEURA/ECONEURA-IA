#!/usr/bin/env bash
set -euo pipefail
BASE="$(pwd)"
AUDIT="$BASE/audit"
TRACE_FILE="$(ls -t $AUDIT/approval_request_*.json 2>/dev/null | head -n1 || true)"
if [ -z "$TRACE_FILE" ]; then echo "ERROR: No approval_request_*.json found in audit/. Create approval_request first." >&2; exit 2; fi
SIGNED_OUT="${TRACE_FILE%.json}.signed.json"
VERIF_OUT="$AUDIT/final_approval_verification_$(date --utc +%Y%m%dT%H%M%SZ).json"
# Load payload (no secrets)
PAYLOAD_B64=$(jq -r '.payload_b64 // ""' "$SIGNED_OUT" 2>/dev/null || true)
HMAC_EXPECT=$(jq -r '.hmac // ""' "$SIGNED_OUT" 2>/dev/null || true)
if [ -z "$PAYLOAD_B64" ] || [ -z "$HMAC_EXPECT" ]; then
  echo "ERROR: Signed approval artifact not found or missing fields. Ensure Security Lead ran generate_hmac_approval.sh and produced ${SIGNED_OUT}." >&2
  exit 3
fi
# Obtain HMAC key: try Vault then ENV prompt
HMAC_KEY=""
if command -v vault >/dev/null 2>&1 && [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
  HMAC_KEY=$(vault kv get -field=value secret/econeura/approval_key 2>/dev/null || true)
fi
if [ -z "$HMAC_KEY" ]; then
  read -s -p "Enter HMAC key (hex) for validation (or set VAULT_* env): " HMAC_KEY
  echo
fi
# Validate HMAC using Python instead of openssl
SIG_ACTUAL=$(python3 -c "import hmac, hashlib; print(hmac.new(bytes.fromhex('$HMAC_KEY'), '$PAYLOAD_B64'.encode(), hashlib.sha256).hexdigest())")
if [ "$SIG_ACTUAL" != "$HMAC_EXPECT" ]; then
  jq -n --arg trace "$TRACE_FILE" --arg time "$(date --iso-8601=seconds)" --arg expect "$HMAC_EXPECT" --arg actual "$SIG_ACTUAL" '{trace:$trace, verified:false, reason:"hmac_mismatch", expected:$expect, actual:$actual, time:$time}' > "$VERIF_OUT"
  echo "HMAC INVALID. Verification written to $VERIF_OUT" >&2
  exit 4
fi
# Persist verification artifact (masked)
jq -n --arg trace "$TRACE_FILE" --arg time "$(date --iso-8601=seconds)" --arg note "HMAC validated locally" '{trace:$trace, verified:true, method:"hmac", time:$time, note:$note}' > "$VERIF_OUT"
mask(){ sed -E -e 's/[[:alnum:]]{32,}/<REDACTED>/g' -e 's/AKIA[0-9A-Z]{8,}/<REDACTED_AKIA>/g' -e 's/tok_live_[A-Za-z0-9_\-]{8,}/<REDACTED_TOKEN>/g' -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/<REDACTED_EMAIL>/g' "$1" > "${1}.masked" || cp "$1" "${1}.masked"; }
mask "$VERIF_OUT"
echo "HMAC valid. Verification (masked) at ${VERIF_OUT}.masked"
# Create REVIEW_OK safely (signed commit if gpg available)
REVIEW_FILE="$BASE/REVIEW_OK"
echo "approved_by=hmac_security_lead" > "$REVIEW_FILE"
echo "approved_trace=$(basename "$TRACE_FILE")" >> "$REVIEW_FILE"
echo "approved_at=$(date --iso-8601=seconds)" >> "$REVIEW_FILE"
git add "$REVIEW_FILE"
# Create signed commit if gpg present and user config set; otherwise normal commit
if command -v gpg >/dev/null 2>&1 && git config user.signingkey >/dev/null 2>&1; then
  git commit -S -m "security: REVIEW_OK (hmac validated) $(basename "$TRACE_FILE")" || git commit -m "security: REVIEW_OK (hmac validated) $(basename "$TRACE_FILE")"
else
  git commit -m "security: REVIEW_OK (hmac validated) $(basename "$TRACE_FILE")"
fi
git format-patch -1 -o "$BASE/$PATCH_DIR" HEAD 2>/dev/null || true
git reset --soft HEAD~1 || true
echo "Created REVIEW_OK locally and prepared patch in $PATCH_DIR (no push)."
echo "NEXT: operator must push branch and open PR manually after peer review and final checks."
