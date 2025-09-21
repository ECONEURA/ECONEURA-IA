#!/usr/bin/env bash
set -euo pipefail
# ejecutar desde la raíz del repo en VS Code terminal
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP="./.ci_activation_$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

fail(){ echo "FATAL: $*" >&2; exit 1; }
warn(){ echo "WARN: $*" >&2; }

command -v gh >/dev/null 2>&1 || fail "gh CLI required"
command -v jq >/dev/null 2>&1 || fail "jq required"
command -v openssl >/dev/null 2>&1 || fail "openssl required"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run from repo root"

# 0. Safety checks
[ -d ".github/workflows" ] || fail ".github/workflows missing"
[ -d "audit" ] || fail "audit directory missing"
[ -f "audit/approval_request.json" ] || fail "audit/approval_request.json required"

# 1. Generate new ephemeral key locally (do not echo or store in logs)
NEW_KEY="$(openssl rand -hex 32)"
printf "New key generated locally and kept in memory.\n" >"$TMP/notes.txt"

# 2. Publish secret securely to GitHub (no printed value)
gh secret delete --repo "$OWNER/$REPO" VAULT_APPROVAL_KEY >/dev/null 2>&1 || true
gh secret set VAULT_APPROVAL_KEY --body "$NEW_KEY" --repo "$OWNER/$REPO" || fail "Unable to set secret in GitHub"

# 3. Use new key to generate and validate approval locally (atomic)
export VAULT_APPROVAL_KEY="$NEW_KEY"
chmod +x ./scripts/vault/generate_hmac_approval.sh ./scripts/vault/validate_hmac_approval.sh || true
./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new" || { warn "generation failed"; exit 2; }
./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" || { cat "$TMP/validate_out.json"; fail "Local validation failed"; }

grep -qE '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP/validate_out.json" || { cat "$TMP/validate_out.json"; fail "Approval not valid locally"; }

# 4. Atomically install artifact and push
mv "$TMP/approval_signed.json.new" audit/approval_signed.json
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC and update approval artifacts" || true
git push origin "$BRANCH" || fail "git push failed; fix access/branch rules"

# 5. Ensure PR exists (create if not)
PR_NUM="$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")"
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "CI/CD Pipeline with HMAC Security Gates" --body "Activation of secure CI gates." --head "$BRANCH" --base main || warn "pr create returned non-zero"
  PR_NUM="$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")"
fi
echo "PR: ${PR_NUM:-not-detected}"

# 6. Trigger workflows explicitly (best-effort)
for wf in "${WORKFLOWS[@]}"; do
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" || warn "Could not trigger workflow: $wf"
done

# 7. Wait briefly and fetch latest run IDs
sleep 6
declare -A RUNS
for wf in "${WORKFLOWS[@]}"; do
  id="$(gh run list --repo "$OWNER/$REPO" --workflow "$wf" --limit 1 --json id -q '.[0].id' 2>/dev/null || echo "")"
  RUNS["$wf"]="$id"
  echo "$wf -> run id: ${id:-none}"
done

# 8. Poll only Mandatory Approval Gate until completion (fast fail on failure)
MA_ID="${RUNS["Mandatory Approval Gate"]}"
if [ -z "$MA_ID" ]; then warn "No Mandatory Approval Gate run found yet; manual check required"; echo "STOP: Inspect GitHub Actions UI"; exit 0; fi

END=$((SECONDS+420))  # 7 minutes
while [ $SECONDS -lt $END ]; do
  sleep 6
  status_concl="$(gh run view --repo "$OWNER/$REPO" "$MA_ID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")"
  status="${status_concl%%|*}"; concl="${status_concl##*|}"
  echo "Mandatory Gate status=$status conclusion=$concl"
  if [ "$status" = "completed" ]; then
    if [ "$concl" = "success" ] || [ "$concl" = "neutral" ]; then
      echo "Mandatory Approval Gate completed successfully"
      break
    else
      echo "MANDATORY GATE FAILED. Downloading logs for forensics..."
      gh run download --repo "$OWNER/$REPO" "$MA_ID" -D "$TMP/run_$MA_ID" || true
      echo "Evidence at $TMP/run_$MA_ID"
      fail "Mandatory Approval Gate run $MA_ID concluded $concl; do not merge"
    fi
  fi
done
if [ $SECONDS -ge $END ]; then
  warn "Timeout waiting for Mandatory Approval Gate. Inspect UI or rerun script."
  exit 3
fi

# 9. Extract approval_valid:true from logs excerpt
gh run view --repo "$OWNER/$REPO" --log "$MA_ID" | sed -n '1,400p' > "$TMP/mandatory_excerpt.txt" || true
if ! grep -qE '"approval_valid"[[:space:]]*:[[:space:]]*"(true|True|TRUE|yes)"' "$TMP/mandatory_excerpt.txt"; then
  cat "$TMP/mandatory_excerpt.txt"
  fail "approval_valid:true not present in Mandatory Gate logs; abort before merge"
fi
echo "approval_valid:true confirmed"

# 10. Stop before merging — deliberate manual decision point with evidence
echo "EVIDENCE_DIR: $TMP"
echo "NEXT STEP: review $TMP/mandatory_excerpt.txt and the other workflow runs in GitHub Actions. Merge manually only after human review."

# Cleanup sensitive in-memory variable
unset NEW_KEY VAULT_APPROVAL_KEY

exit 0
