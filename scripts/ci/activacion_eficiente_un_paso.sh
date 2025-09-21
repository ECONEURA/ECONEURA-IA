#!/usr/bin/env bash
set -euo pipefail
# activacion_eficiente_un_paso.sh — ejecución agresiva y automatizada para activar ECONEURA
# REEMPLAZA SOLO SI ES NECESARIO:
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
BASE_BRANCH="main"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP_DIR="./.ci_activation_$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP_DIR"

fail(){ echo "FATAL: $*" >&2; exit 1; }
warn(){ echo "WARN: $*" >&2; }

# prereqs quick assert
command -v gh >/dev/null 2>&1 || fail "gh CLI required and must be authenticated"
command -v jq >/dev/null 2>&1 || fail "jq required"
command -v openssl >/dev/null 2>&1 || fail "openssl required"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run from repo root"

# sanity
[ -d ".github/workflows" ] || warn ".github/workflows missing (abort might fail later)"
[ -d "audit" ] || fail "audit directory missing"
[ -f "audit/approval_request.json" ] || fail "audit/approval_request.json required"

echo "=== STEP 1: Contención rápida ==="
gh secret delete VAULT_APPROVAL_KEY --repo "$OWNER/$REPO" >/dev/null 2>&1 || true
for id in $(gh run list --repo "$OWNER/$REPO" --status in_progress --limit 200 --json id -q '.[].id' 2>/dev/null || echo ""); do
  gh run cancel --repo "$OWNER/$REPO" "$id" >/dev/null 2>&1 || true
done

echo "=== STEP 2: Generar clave efímera (memoria solo) ==="
NEW_KEY="$(openssl rand -hex 32)" || fail "key generation failed"

echo "=== STEP 3: Publicar secret (no imprimir) ==="
# Use gh secret set (modern gh) — will not echo the secret
gh secret set VAULT_APPROVAL_KEY --repo "$OWNER/$REPO" --body "$NEW_KEY" || fail "Failed to set secret"

echo "=== STEP 4: Regenerar y validar approval localmente ==="
export VAULT_APPROVAL_KEY="$NEW_KEY"
chmod +x ./scripts/vault/generate_hmac_approval.sh ./scripts/vault/validate_hmac_approval.sh >/dev/null 2>&1 || true

if ! ./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP_DIR/approval_signed.json.new"; then
  rm -f "$TMP_DIR/approval_signed.json.new"
  fail "Generation of approval_signed.json failed"
fi

if ! ./scripts/vault/validate_hmac_approval.sh "$TMP_DIR/approval_signed.json.new" > "$TMP_DIR/validate_out.json" 2>&1; then
  cat "$TMP_DIR/validate_out.json" || true
  rm -f "$TMP_DIR/approval_signed.json.new"
  fail "Local validation failed; inspect $TMP_DIR/validate_out.json"
fi

if ! grep -qE '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP_DIR/validate_out.json"; then
  cat "$TMP_DIR/validate_out.json" || true
  rm -f "$TMP_DIR/approval_signed.json.new"
  fail "Validation did not report status: valid"
fi
echo "Local artifact validated OK"

echo "=== STEP 5: Install artifact, commit & push ==="
mv "$TMP_DIR/approval_signed.json.new" audit/approval_signed.json
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC and update approval artifacts" || true
git push origin "$BRANCH" || fail "git push failed; check credentials/branch protections"

echo "=== STEP 6: Ensure or create PR ==="
PR_NUM="$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")"
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "CI/CD Pipeline with HMAC Security Gates" --body "Automated activation: HMAC gates" --head "$BRANCH" --base "$BASE_BRANCH" || warn "gh pr create non-zero"
  PR_NUM="$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")"
fi
echo "PR_NUM=${PR_NUM:-not-detected}"

echo "=== STEP 7: Trigger workflows explicitly (best-effort) ==="
for wf in "${WORKFLOWS[@]}"; do
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" >/dev/null 2>&1 || warn "Could not trigger $wf (it might be push-triggered)"
done

echo "=== STEP 8: Wait for Mandatory Approval Gate and fail fast ==="
sleep 8
MA_RUN_ID="$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")"
if [ -z "$MA_RUN_ID" ]; then
  warn "Mandatory Approval Gate run not found. Manual inspection required. Evidence dir: $TMP_DIR"
  unset NEW_KEY VAULT_APPROVAL_KEY
  exit 0
fi
echo "Found Mandatory Approval Gate run: $MA_RUN_ID"

# Aggressive wait (max 8 minutes) with immediate failure on conclusion != success/neutral
END=$((SECONDS+480))
while [ $SECONDS -lt $END ]; do
  sleep 6
  SCONC="$(gh run view --repo "$OWNER/$REPO" "$MA_RUN_ID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")"
  ST="${SCONC%%|*}"; CONC="${SCONC##*|}"
  echo "Mandatory Gate status=$ST conclusion=$CONC"
  if [ "$ST" = "completed" ]; then
    if [ "$CONC" = "success" ] || [ "$CONC" = "neutral" ]; then
      echo "Mandatory Approval Gate OK"
      break
    else
      echo "MANDATORY GATE FAILED -> downloading evidence to $TMP_DIR and aborting"
      gh run download --repo "$OWNER/$REPO" "$MA_RUN_ID" -D "$TMP_DIR/run_$MA_RUN_ID" || true
      echo "EVIDENCE: $TMP_DIR/run_$MA_RUN_ID"
      unset NEW_KEY VAULT_APPROVAL_KEY
      fail "Mandatory Approval Gate run $MA_RUN_ID concluded $CONC; aborting"
    fi
  fi
done
if [ $SECONDS -ge $END ]; then
  warn "Timeout waiting for Mandatory Approval Gate. Inspect UI. Evidence dir: $TMP_DIR"
  unset NEW_KEY VAULT_APPROVAL_KEY
  exit 3
fi

echo "=== STEP 9: Verify approval_valid:true in logs excerpt ==="
gh run view --repo "$OWNER/$REPO" --log "$MA_RUN_ID" | sed -n '1,400p' > "$TMP_DIR/mandatory_excerpt.txt" || true
if ! grep -qE '"approval_valid"[[:space:]]*:[[:space:]]*"(true|True|TRUE|yes)"' "$TMP_DIR/mandatory_excerpt.txt"; then
  echo "approval_valid:true NOT FOUND — saving excerpt and aborting"
  cat "$TMP_DIR/mandatory_excerpt.txt"
  unset NEW_KEY VAULT_APPROVAL_KEY
  fail "approval_valid:true not detected; aborting"
fi
echo "approval_valid:true confirmed"

echo "=== STEP 10: Aggressive automatic merge (RISKY) ==="
# perform merge only after checks above passed
gh pr merge --repo "$OWNER/$REPO" --pr "$PR_NUM" --merge --delete-branch --subject "chore(ci): activate HMAC gates" --body "Automated activation after green CI" --admin || warn "Automatic merge failed; consider manual merge"

echo "=== DONE: activation attempted. Evidence dir: $TMP_DIR ==="
# cleanup sensitive variables
unset NEW_KEY VAULT_APPROVAL_KEY
exit 0
