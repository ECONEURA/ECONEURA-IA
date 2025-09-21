#!/usr/bin/env bash
set -euo pipefail

# REEMPLAZA solo el valor entre <>
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
VAULT_APPROVAL_KEY="<TU_VAULT_APPROVAL_KEY_DE_64_HEX>"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Activating HMAC gates and audit pipelines (automated activation)."
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TIMEOUT=900
POLL=8
TMP="./ci_activation_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

fail(){ echo "FATAL: $*" >&2; exit 1; }

command -v gh >/dev/null 2>&1 || fail "gh CLI required"
command -v jq >/dev/null 2>&1 || fail "jq required"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run from repo root"

# Critical prechecks
[ -d ".github/workflows" ] || fail ".github/workflows missing"
[ -d "audit" ] || fail "audit/ missing"
[ -f "audit/approval_signed.json" ] || fail "audit/approval_signed.json missing"

# 1. Set secret (will abort on failure)
gh repo set-secret "$OWNER/$REPO" VAULT_APPROVAL_KEY --body "$VAULT_APPROVAL_KEY" || fail "Failed to set secret"

# 2. Ensure artifacts committed and pushed
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): ensure approval artifacts for CI gate" || true
git push origin "$BRANCH" || fail "git push failed"

# 3. Create PR if absent
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "$PR_TITLE" --body "$PR_BODY" --head "$BRANCH" --base main || true
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
fi
echo "PR: ${PR_NUM:-not-detected}"

# 4. Trigger workflows
for wf in "${WORKFLOWS[@]}"; do
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" || echo "WARN: cannot start $wf"
done

# 5. Aggressive polling and deterministic failure handling
END=$((SECONDS+TIMEOUT))
declare -A STATUS_MAP
while [ $SECONDS -lt $END ]; do
  sleep "$POLL"
  ALL_DONE=true
  for wf in "${WORKFLOWS[@]}"; do
    RID=$(gh run list --repo "$OWNER/$REPO" --workflow "$wf" --limit 1 --json id -q '.[0].id' 2>/dev/null || echo "")
    if [ -z "$RID" ]; then ALL_DONE=false; continue; fi
    ST_CONC=$(gh run view --repo "$OWNER/$REPO" "$RID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
    ST="${ST_CONC%%|*}"; CONC="${ST_CONC##*|}"
    STATUS_MAP["$wf"]="$ST|$CONC|$RID"
    if [ "$ST" != "completed" ]; then ALL_DONE=false; fi
    if [ "$ST" = "completed" ] && [ "$CONC" = "failure" ]; then
      echo "FAIL: $wf run $RID -> failure"
      gh run download --repo "$OWNER/$REPO" "$RID" -D "$TMP/run_$RID" || true
      echo "LOGS_DIR: $TMP/run_$RID"
      echo "REMEDIO: inspect logs; confirm VAULT_APPROVAL_KEY in repo secrets; verify audit/approval_signed.json in origin/$BRANCH"
      exit 2
    fi
  done
  $ALL_DONE && break
done

if [ $SECONDS -ge $END ]; then
  echo "TIMEOUT: workflows did not complete within ${TIMEOUT}s"
  gh run list --repo "$OWNER/$REPO" --limit 25 --json id,name,status,conclusion | jq -r '.[] | "\(.id) \(.name) \(.status) \(.conclusion)"' > "$TMP/run_summary.txt"
  echo "SUMMARY: $TMP/run_summary.txt"
  exit 3
fi

# 6. Final verification and deterministic merge
echo "All workflows completed; summarizing"
gh run list --repo "$OWNER/$REPO" --limit 20 --json id,name,status,conclusion | jq -r '.[] | "\(.id) \(.name) \(.status) \(.conclusion)"' > "$TMP/run_summary.txt"
cat "$TMP/run_summary.txt"
# Verify Mandatory Approval Gate logs include approval_valid true
MA_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -n "$MA_RUN_ID" ]; then
  gh run view --repo "$OWNER/$REPO" --log "$MA_RUN_ID" | sed -n '1,200p' > "$TMP/mandatory_gate_excerpt.txt" || true
  grep -q '"approval_valid": *"true"' "$TMP/mandatory_gate_excerpt.txt" || fail "Mandatory Approval Gate did not report approval_valid:true; inspect $TMP/mandatory_gate_excerpt.txt"
else
  fail "No Mandatory Approval Gate run found"
fi

# 7. Safe merge (only if all green)
gh pr merge --repo "$OWNER/$REPO" --merge --delete-branch --subject "chore(ci): activate HMAC gates" --body "Merging after green CI" || fail "PR merge failed"

echo "SUCCESS: Activation complete. Evidence and logs saved in $TMP"
exit 0
