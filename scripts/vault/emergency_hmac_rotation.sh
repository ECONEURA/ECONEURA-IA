#!/usr/bin/env bash
set -euo pipefail
# emergency_hmac_rotation.sh
# 1) elimina secret comprometido en GitHub, 2) crea nueva clave, 3) rota artifacts locales, 4) publica nueva secret,
# 5) fuerza revalidación en CI y entrega evidencia.
# REEMPLAZA: <OWNER>, <REPO>, <BRANCH>, <NUEVA_HEX_64>

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
NEW_KEY="<NUEVA_HEX_64>"        # 64 hex chars - NO compartir en chats
TMPDIR="./hmac_rotation_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMPDIR"

fail(){ echo "FATAL: $*" >&2; exit 1; }

# Prerrequisitos
command -v gh >/dev/null 2>&1 || fail "gh CLI missing; install and authenticate"
command -v jq >/dev/null 2>&1 || fail "jq missing"
command -v openssl >/dev/null 2>&1 || fail "openssl missing"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run from repo root"

# 0. Safety: do not continue if exposed key still in NEW_KEY placeholder
if [[ "$NEW_KEY" == "<NUEVA_HEX_64>" ]]; then
  fail "Set NEW_KEY to your new 64-hex key before running"
fi

# 1. Delete possibly leaked secret from GitHub immediately
echo "1) Deleting possibly compromised secret from GitHub (if exists)"
gh secret delete --repo "$OWNER/$REPO" VAULT_APPROVAL_KEY || echo "Secret VAULT_APPROVAL_KEY may not exist or delete failed; continuing"

# 2. Generate local test approval_signed using NEW_KEY (do locally and verify before pushing)
echo "2) Regenerating approval artifact locally and validating it"
export VAULT_APPROVAL_KEY="$NEW_KEY"
chmod +x scripts/vault/generate_hmac_approval.sh || true
chmod +x scripts/vault/validate_hmac_approval.sh || true

# generate new approval (adjust script args if needed)
./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMPDIR/approval_signed.json.new" || fail "generate_hmac_approval.sh failed"
# validate artifact locally
./scripts/vault/validate_hmac_approval.sh "$TMPDIR/approval_signed.json.new" > "$TMPDIR/validate_out.json" || { cat "$TMPDIR/validate_out.json"; fail "Local validation failed"; }
jq . "$TMPDIR/validate_out.json" || true
grep -q '"status":"valid"' "$TMPDIR/validate_out.json" || fail "New approval_signed.json did not validate as valid locally"

# 3. Replace artifact atomically with validated file
mv "$TMPDIR/approval_signed.json.new" audit/approval_signed.json
echo "Updated audit/approval_signed.json locally"

# 4. Commit and push secure artifact to branch (do not include secret in commits)
echo "4) Committing and pushing updated artifacts"
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC key and regenerate approval artifacts" || echo "No changes to commit"
git push origin "$BRANCH" || fail "git push failed; check access and branch protections"

# 5. Publish new secret into GitHub Actions (secure, no echo of key)
echo "5) Setting new VAULT_APPROVAL_KEY in GitHub Secrets"
gh repo set-secret "$OWNER/$REPO" VAULT_APPROVAL_KEY --body "$NEW_KEY" || fail "Failed to set GitHub secret"

# 6. Invalidate runs / cancel active runs that used old key (optional but recommended)
echo "6) Cancel running workflows to force fresh runs"
RUNS=$(gh run list --repo "$OWNER/$REPO" --status in_progress --limit 50 --json id -q '.[].id' || echo "")
if [ -n "$RUNS" ]; then
  for id in $RUNS; do
    gh run cancel --repo "$OWNER/$REPO" "$id" || echo "Warn: Unable to cancel run $id"
  done
fi

# 7. Trigger CI revalidation: create a trivial commit to re-run workflows or re-run workflows manually
echo "7) Triggering workflow runs for validation (attempt recommended workflows)"
# create an empty commit to re-trigger if workflows are on push
git commit --allow-empty -m "chore(ci): trigger revalidation after HMAC rotation" || true
git push origin "$BRANCH" || true

# Also attempt to trigger specific workflows (best-effort)
gh workflow run --repo "$OWNER/$REPO" "Mandatory Approval Gate" --ref "refs/heads/$BRANCH" || echo "Warn: failed to trigger Mandatory Approval Gate"
gh workflow run --repo "$OWNER/$REPO" "Optimized Audit Parallel" --ref "refs/heads/$BRANCH" || true
gh workflow run --repo "$OWNER/$REPO" "Integration Tests with Compose" --ref "refs/heads/$BRANCH" || true

# 8. Collect evidence: list recent runs and capture Mandatory Approval Gate log excerpt
echo "8) Collecting evidence and excerpts"
gh run list --repo "$OWNER/$REPO" --limit 20 --json id,name,status,conclusion > "$TMPDIR/run_list.json"
MA_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -n "$MA_RUN_ID" ]; then
  gh run view --repo "$OWNER/$REPO" "$MA_RUN_ID" --log > "$TMPDIR/mandatory_gate_full.log" || true
  sed -n '1,300p' "$TMPDIR/mandatory_gate_full.log" > "$TMPDIR/mandatory_gate_excerpt.txt" || true
  echo "Mandatory gate excerpt saved to $TMPDIR/mandatory_gate_excerpt.txt"
fi

# 9. Post-rotation checks summary
echo "9) Post-rotation checklist"
echo "- Confirm secret VAULT_APPROVAL_KEY in GitHub uses the new key"
echo "- Confirm audit/approval_signed.json validated locally and is on origin/$BRANCH"
echo "- Confirm new Mandatory Approval Gate run shows approval_valid:true in logs"
echo "- If any failures, inspect $TMPDIR and paste RUN_IDs for analysis"

echo "Rotation complete. Evidence and logs saved in $TMPDIR"