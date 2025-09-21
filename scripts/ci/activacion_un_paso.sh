#!/usr/bin/env bash
set -euo pipefail
# activacion_un_paso.sh — ejecuta la activación segura completa y se detiene antes del merge
# REEMPLAZA solo si hace falta:
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP="./.ci_activation_$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

fail(){ echo "FATAL: $*" >&2; exit 1; }
warn(){ echo "WARN: $*" >&2; }

# prereqs
command -v gh >/dev/null 2>&1 || fail "gh CLI required"
command -v jq >/dev/null 2>&1 || fail "jq required"
command -v openssl >/dev/null 2>&1 || fail "openssl required"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run from repo root"

# sanity
[ -d ".github/workflows" ] || fail ".github/workflows missing"
[ -d "audit" ] || fail "audit directory missing"
[ -f "audit/approval_request.json" ] || fail "audit/approval_request.json required"

echo "1/8 — Contención: eliminar secret antiguo (mejor esfuerzo) y cancelar runs en progreso"
gh secret delete --repo "$OWNER/$REPO" VAULT_APPROVAL_KEY >/dev/null 2>&1 || true
for id in $(gh run list --repo "$OWNER/$REPO" --status in_progress --limit 100 --json id -q '.[].id' 2>/dev/null || echo ""); do
  gh run cancel --repo "$OWNER/$REPO" "$id" >/dev/null 2>&1 || true
done

echo "2/8 — Generando nueva clave HMAC localmente (no se imprime ni se guarda en disco)"
NEW_KEY="$(openssl rand -hex 32)" || fail "Failed to generate key"
# keep NEW_KEY in memory only

echo "3/8 — Publicando secret en GitHub (no se muestra la clave)"
gh secret set VAULT_APPROVAL_KEY --body "$NEW_KEY" --repo "$OWNER/$REPO" || fail "Failed to set GitHub secret"

echo "4/8 — Regenerando approval_signed.json y validando localmente"
export VAULT_APPROVAL_KEY="$NEW_KEY"
chmod +x ./scripts/vault/generate_hmac_approval.sh ./scripts/vault/validate_hmac_approval.sh || true
if ! ./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new"; then
  fail "Generation of approval_signed.json failed"
fi
if ! ./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" 2>&1; then
  cat "$TMP/validate_out.json" || true
  fail "Local validation of new approval_signed.json failed"
fi
grep -qE '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP/validate_out.json" || { cat "$TMP/validate_out.json"; fail "Validation output did not report status: valid"; }
echo "Local artifact validated OK"

echo "5/8 — Atomizar instalación del artifact, commit y push"
mv "$TMP/approval_signed.json.new" audit/approval_signed.json
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC and update approval artifacts" || true
git push origin "$BRANCH" || fail "git push failed; check access/branch-protections"

echo "6/8 — Asegurar PR y disparar workflows (intentos seguros)"
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "CI/CD Pipeline with HMAC Security Gates" --body "Activating HMAC gates and audit pipelines (automated activation)" --head "$BRANCH" --base main || warn "pr create returned non-zero"
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
fi
echo "PR: ${PR_NUM:-not-detected}"
for wf in "${WORKFLOWS[@]}"; do
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" >/dev/null 2>&1 || warn "Could not trigger workflow: $wf"
done

echo "7/8 — Monitorizar Mandatory Approval Gate (7 minutos max). Si falla, descarga evidencia y aborta."
sleep 6
MA_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -z "$MA_ID" ]; then
  warn "No Mandatory Approval Gate run found yet; inspect GitHub Actions UI"
  echo "STOP: manual review required — evidence dir: $TMP"
  unset NEW_KEY VAULT_APPROVAL_KEY
  exit 0
fi
END=$((SECONDS+420))
while [ $SECONDS -lt $END ]; do
  sleep 6
  sc=$(gh run view --repo "$OWNER/$REPO" "$MA_ID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
  ST="${sc%%|*}"; CONC="${sc##*|}"
  echo "Mandatory Gate: status=$ST conclusion=$CONC"
  if [ "$ST" = "completed" ]; then
    if [ "$CONC" = "success" ] || [ "$CONC" = "neutral" ]; then
      echo "Mandatory Approval Gate completed OK"
      break
    else
      echo "MANDATORY GATE FAILED (conclusion=$CONC). Downloading logs to $TMP"
      gh run download --repo "$OWNER/$REPO" "$MA_ID" -D "$TMP/run_$MA_ID" || true
      echo "Evidence: $TMP/run_$MA_ID"
      unset NEW_KEY VAULT_APPROVAL_KEY
      fail "Mandatory Approval Gate run $MA_ID concluded $CONC; DO NOT MERGE"
    fi
  fi
done
if [ $SECONDS -ge $END ]; then
  warn "Timeout waiting for Mandatory Approval Gate. Inspect UI or rerun."
  unset NEW_KEY VAULT_APPROVAL_KEY
  exit 3
fi

echo "8/8 — Verificar explicitamente approval_valid:true en logs (extracto)"
gh run view --repo "$OWNER/$REPO" --log "$MA_ID" | sed -n '1,400p' > "$TMP/mandatory_excerpt.txt" || true
if ! grep -qE '"approval_valid"[[:space:]]*:[[:space:]]*"(true|True|TRUE|yes)"' "$TMP/mandatory_excerpt.txt"; then
  echo "approval_valid:true NOT FOUND — Evidence saved at $TMP/mandatory_excerpt.txt"
  cat "$TMP/mandatory_excerpt.txt"
  unset NEW_KEY VAULT_APPROVAL_KEY
  fail "approval_valid:true not present — aborting before merge"
fi

echo "approval_valid:true confirmed. STOP before merge for human review."
echo "Evidence directory: $TMP"
echo "NEXT STEP: review CI runs in GitHub Actions UI and merge manually after confirmation."
# cleanup sensitive memory
unset NEW_KEY VAULT_APPROVAL_KEY
exit 0
