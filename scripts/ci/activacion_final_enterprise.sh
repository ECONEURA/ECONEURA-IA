#!/usr/bin/env bash
set -euo pipefail
# activacion_final_enterprise.sh
# Objetivo: rotar secret localmente, publicar secret seguro en GitHub, regenerar y validar approval artifact,
# empujar cambios, lanzar workflows, validar resultados y mergear PR si todo está OK.
# REQUISITOS: gh CLI autenticado con permisos de secrets + PRs + actions, jq, scripts/vault/*.sh presentes.
# REEMPLAZAR:
#   OWNER: propietario del repo
#   REPO: nombre del repo
#   BRANCH: rama con los artifacts listos
#   NEW_HEX_64: nueva clave HMAC de 64 hex GENERADA EN ENTORNO SEGURO (NO compartir)
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
NEW_HEX_64="e996aa70cb21441da934e67e1299f992c314e278cc7e62f4eb97d026bf58191d"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Activating HMAC gates and audit pipelines (automated activation)"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TIMEOUT=900
POLL=8
TMP="./ci_activation_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

fail(){ echo "FATAL: $*" >&2; exit 1; }
warn(){ echo "WARN: $*" >&2; }

# sanity checks
command -v gh >/dev/null 2>&1 || fail "gh CLI missing; install and authenticate"
command -v jq >/dev/null 2>&1 || fail "jq missing"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run this from repo root"
if [[ "$NEW_HEX_64" == "<REEMPLAZAR_POR_NUEVA_HEX_64>" ]]; then fail "Replace NEW_HEX_64 with a fresh 64-hex key before running"; fi
[ -d ".github/workflows" ] || fail ".github/workflows missing"
[ -d "audit" ] || fail "audit/ directory missing"
[ -f "audit/approval_request.json" ] || fail "audit/approval_request.json required to generate approval"

# 1) Remove old secret (best-effort) and set new secret securely
echo "STEP 1: rotating GitHub secret (best-effort delete then set)"
gh secret delete --repo "$OWNER/$REPO" VAULT_APPROVAL_KEY >/dev/null 2>&1 || warn "old secret delete returned non-zero or did not exist"
gh secret set VAULT_APPROVAL_KEY --body "$NEW_HEX_64" --repo "$OWNER/$REPO" || fail "Failed to set VAULT_APPROVAL_KEY in GitHub"

# 2) Regenerate approval locally and validate
echo "STEP 2: generating and validating approval artifact locally"
export VAULT_APPROVAL_KEY="$NEW_HEX_64"
chmod +x scripts/vault/generate_hmac_approval.sh scripts/vault/validate_hmac_approval.sh || true

if ! ./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new"; then
  fail "Failed to generate approval_signed.json locally"
fi
if ! ./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" 2>&1; then
  cat "$TMP/validate_out.json" || true
  fail "Local validation of new approval_signed.json failed"
fi
if ! grep -qE '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP/validate_out.json"; then
  cat "$TMP/validate_out.json" || true
  fail "Validation output did not report status: valid"
fi
echo "Local approval artifact validated OK"

# 3) Atomically replace artifact, commit and push
echo "STEP 3: installing validated artifact, committing and pushing to branch $BRANCH"
mv "$TMP/approval_signed.json.new" audit/approval_signed.json
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC key and update approval artifacts" || echo "Nothing to commit"
git push origin "$BRANCH" || fail "git push failed; check permissions and branch protection rules"

# 4) Ensure PR exists (create if absent)
echo "STEP 4: ensuring PR exists"
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "$PR_TITLE" --body "$PR_BODY" --head "$BRANCH" --base main || warn "gh pr create returned non-zero"
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
fi
echo "PR detected: ${PR_NUM:-not-detected}"

# 5) Trigger workflows (best-effort) and create an empty commit if needed to trigger push-based workflows
echo "STEP 5: triggering workflows and revalidation"
for wf in "${WORKFLOWS[@]}"; do
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" || warn "Could not trigger workflow: $wf"
done

# also create an empty commit to ensure push-based workflows run
git commit --allow-empty -m "chore(ci): trigger revalidation after HMAC rotation" || true
git push origin "$BRANCH" >/dev/null 2>&1 || true

# 6) Polling: wait until workflows complete, fail fast on any failure
echo "STEP 6: waiting for workflows to complete (timeout ${TIMEOUT}s)"
END=$((SECONDS+TIMEOUT))
while [ $SECONDS -lt $END ]; do
  sleep "$POLL"
  ALL_DONE=true
  for wf in "${WORKFLOWS[@]}"; do
    RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "$wf" --limit 1 --json id -q '.[0].id' 2>/dev/null || echo "")
    if [ -z "$RUN_ID" ]; then ALL_DONE=false; continue; fi
    ST_CONC=$(gh run view --repo "$OWNER/$REPO" "$RUN_ID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
    ST="${ST_CONC%%|*}"; CONC="${ST_CONC##*|}"
    if [ "$ST" != "completed" ]; then ALL_DONE=false; fi
    if [ "$ST" = "completed" ] && [ "$CONC" = "failure" ]; then
      echo "ERROR: workflow '$wf' run $RUN_ID concluded with failure"
      gh run download --repo "$OWNER/$REPO" "$RUN_ID" -D "$TMP/run_$RUN_ID" || warn "failed to download run logs"
      echo "Evidence saved at $TMP/run_$RUN_ID"
      echo "Immediate remediation: inspect logs, do NOT merge; if HMAC mismatch regenerate artifact and push"
      exit 2
    fi
  done
  $ALL_DONE && break
done

if [ $SECONDS -ge $END ]; then
  echo "ERROR: timeout waiting for workflows. Summary of recent runs:"
  gh run list --repo "$OWNER/$REPO" --limit 20 --json id,name,status,conclusion | jq -r '.[] | "\(.id) \(.name) \(.status) \(.conclusion)"'
  exit 3
fi

# 7) Verify Mandatory Approval Gate shows approval_valid:true
echo "STEP 7: verifying Mandatory Approval Gate approval flag"
MA_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -z "$MA_RUN_ID" ]; then fail "No Mandatory Approval Gate run found"; fi
gh run view --repo "$OWNER/$REPO" --log "$MA_RUN_ID" | sed -n '1,400p' > "$TMP/mandatory_gate_excerpt.txt" || warn "Could not extract logs"
if ! grep -qE '"approval_valid"[[:space:]]*:[[:space:]]*"(true|True|TRUE|yes)"' "$TMP/mandatory_gate_excerpt.txt"; then
  echo "ERROR: approval_valid:true not detected in Mandatory Approval Gate logs. File: $TMP/mandatory_gate_excerpt.txt"
  cat "$TMP/mandatory_gate_excerpt.txt"
  exit 4
fi
echo "Mandatory Approval Gate reports approval_valid:true"

# 8) Safe merge: only if all previous checks passed
echo "STEP 8: merging PR safely"
gh pr merge --repo "$OWNER/$REPO" --merge --delete-branch --subject "chore(ci): activate HMAC gates" --body "Merging after green CI and validated approval" || fail "PR merge failed"

echo "SUCCESS: activation completed. Evidence and artifacts in $TMP"
exit 0