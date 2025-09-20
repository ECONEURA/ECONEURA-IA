#!/usr/bin/env bash
set -euo pipefail

# ACTIVACION_FINAL_SECURE.sh
# 1) rota clave HMAC localmente, 2) publica secret en GitHub, 3) publica artifacts validados, 4) lanza workflows, 5) valida y mergea si todo ok.
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
NEW_KEY="<NUEVA_HEX_64_SEGURA>"        # REEMPLAZA con nueva clave de 64 hex, generada en entorno seguro
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Activating HMAC gates and audit pipelines"

# prereqs
command -v gh >/dev/null 2>&1 || { echo "Instala y autentica gh CLI"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "Instala jq"; exit 1; }
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Ejecuta desde la raíz del repo"; exit 1; }

# safety: do not continue if placeholder left
if [[ "$NEW_KEY" == "<NUEVA_HEX_64_SEGURA>" ]]; then
  echo "ERROR: reemplaza NEW_KEY por la clave real antes de ejecutar"; exit 1
fi

# 1. Remove old secret (best-effort) and set new secret securely
gh secret delete --repo "$OWNER/$REPO" VAULT_APPROVAL_KEY || true
gh repo set-secret "$OWNER/$REPO" VAULT_APPROVAL_KEY --body "$NEW_KEY" || { echo "Fallo al crear secret"; exit 1; }

# 2. Regenerate approval locally and validate (scripts must exist and be trusted)
export VAULT_APPROVAL_KEY="$NEW_KEY"
chmod +x scripts/vault/generate_hmac_approval.sh scripts/vault/validate_hmac_approval.sh || true
./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > /tmp/approval_signed.json.new || { echo "Generación approval falló"; exit 1; }
./scripts/vault/validate_hmac_approval.sh /tmp/approval_signed.json.new > /tmp/validate_out.json || { cat /tmp/validate_out.json; echo "Validación local falló"; exit 1; }
grep -q '"status": *"valid"' /tmp/validate_out.json || { echo "Approval no válido localmente"; exit 1; }

# 3. Atomically install validated artifact and push
mv /tmp/approval_signed.json.new audit/approval_signed.json
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC and update approval artifacts" || true
git push origin "$BRANCH" || { echo "Push falló"; exit 1; }

# 4. Ensure PR exists
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "$PR_TITLE" --body "$PR_BODY" --head "$BRANCH" --base main || true
fi

# 5. Trigger workflows and wait (agresivo, determinista)
WFS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
for wf in "${WFS[@]}"; do
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" || echo "WARN: no se pudo iniciar $wf"
done

# Polling: timeout 900s
END=$((SECONDS+900))
while [ $SECONDS -lt $END ]; do
  sleep 8
  ALL_DONE=true
  for wf in "${WFS[@]}"; do
    RID=$(gh run list --repo "$OWNER/$REPO" --workflow "$wf" --limit 1 --json id -q '.[0].id' 2>/dev/null || echo "")
    if [ -z "$RID" ]; then ALL_DONE=false; continue; fi
    ST_CONC=$(gh run view --repo "$OWNER/$REPO" "$RID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
    ST="${ST_CONC%%|*}"; CONC="${ST_CONC##*|}"
    if [ "$ST" != "completed" ]; then ALL_DONE=false; fi
    if [ "$ST" = "completed" ] && [ "$CONC" = "failure" ]; then
      echo "FAIL: $wf run $RID -> failure"
      gh run download --repo "$OWNER/$REPO" "$RID" -D "./ci_evidence_$RID" || true
      echo "EVIDENCE_DIR: ./ci_evidence_$RID"
      echo "Acciones: revisar logs, no mergear; regenera approval_signed.json con la clave correcta y reintenta"
      exit 2
    fi
  done
  $ALL_DONE && break
done

if [ $SECONDS -ge $END ]; then
  echo "TIMEOUT: workflows no completaron en el tiempo esperado"; gh run list --repo "$OWNER/$REPO" --limit 20 --json id,name,status,conclusion; exit 3
fi

# 6. Verify Mandatory Approval Gate approval_valid:true
MA_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -z "$MA_RUN_ID" ]; then echo "No Mandatory Approval Gate run found"; exit 4; fi
gh run view --repo "$OWNER/$REPO" --log "$MA_RUN_ID" | sed -n '1,400p' > "./ci_activation_mandatory_excerpt.txt"
grep -q '"approval_valid": *"true"' ./ci_activation_mandatory_excerpt.txt || { echo "approval_valid:true NO detectado; abortando merge"; exit 5; }

# 7. Safe merge (only after previous checks)
gh pr merge --repo "$OWNER/$REPO" --merge --delete-branch --subject "chore(ci): activate HMAC gates" --body "Merging after green CI and validated approval" || { echo "Merge falló"; exit 6; }

echo "SUCCESS: Activation complete. Evidence in ./ci_activation_*"
exit 0