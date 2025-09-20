#!/usr/bin/env bash
set -euo pipefail
# activacion_final_segura.sh
# 1) valida prerrequisitos, 2) rota y publica nueva clave segura (localmente generada), 3) regenera artifacts firmados,
# 4) publica secret en GitHub, 5) push, 6) lanza workflows, 7) valida y mergea si todo OK.
# REEMPLAZA: <OWNER>, <REPO>, <BRANCH>, <NEW_HEX_64> (genera NEW_HEX_64 en un entorno seguro)

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
NEW_HEX_64="<NUEVA_CLAVE_64_HEX_SEGURA>"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Activating HMAC gates and audit pipelines"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP="./ci_activation_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

fail(){ echo "FATAL: $*" >&2; exit 1; }

# prereqs
command -v gh >/dev/null 2>&1 || fail "Instala y autentica gh CLI"
command -v jq >/dev/null 2>&1 || fail "Instala jq"
command -v openssl >/dev/null 2>&1 || fail "Instala openssl"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Ejecuta desde la raíz del repo"

if [[ "$NEW_HEX_64" == "<NUEVA_CLAVE_64_HEX_SEGURA>" ]]; then
  fail "Reemplaza NEW_HEX_64 por tu nueva clave segura (64 hex) antes de ejecutar"
fi

# quick sanity
[ -d ".github/workflows" ] || fail ".github/workflows ausente"
[ -d "audit" ] || fail "audit/ ausente"
[ -f "audit/approval_request.json" ] || fail "audit/approval_request.json ausente (necesaria para generar approval)"

# 1) Remove old secret (best-effort) and set new secret securely
echo "1) Rotando secret: eliminando posible secret antiguo y publicando nueva clave"
gh secret delete --repo "$OWNER/$REPO" VAULT_APPROVAL_KEY >/dev/null 2>&1 || true
gh repo set-secret "$OWNER/$REPO" VAULT_APPROVAL_KEY --body "$NEW_HEX_64" || fail "No se pudo setear secret en GitHub"

# 2) Regenerar approval firmado localmente (scripts deben estar en repo)
echo "2) Regenerando approval_signed.json localmente y validando"
export VAULT_APPROVAL_KEY="$NEW_HEX_64"
chmod +x scripts/vault/generate_hmac_approval.sh scripts/vault/validate_hmac_approval.sh || true

./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new" || fail "Fallo al generar approval_signed.json"
./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" || { cat "$TMP/validate_out.json"; fail "Validación local falló"; }
grep -q '"status": *"valid"' "$TMP/validate_out.json" || { cat "$TMP/validate_out.json"; fail "Approval no válido localmente"; }

# 3) Atomizar reemplazo y push
mv "$TMP/approval_signed.json.new" audit/approval_signed.json
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC key and update approval artifacts" || true
git push origin "$BRANCH" || fail "git push falló; corrige permisos/branch protection"

# 4) Crear PR si hace falta
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "$PR_TITLE" --body "$PR_BODY" --head "$BRANCH" --base main || true
fi

# 5) Lanzar workflows clave
echo "5) Lanzando workflows clave"
for wf in "${WORKFLOWS[@]}"; do
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" || echo "WARN: no se pudo iniciar $wf (ignorado)"
done

# 6) Polling y fallo determinista
END=$((SECONDS+900))
while [ $SECONDS -lt $END ]; do
  sleep 8
  ALL_DONE=true
  for wf in "${WORKFLOWS[@]}"; do
    RID=$(gh run list --repo "$OWNER/$REPO" --workflow "$wf" --limit 1 --json id -q '.[0].id' 2>/dev/null || echo "")
    if [ -z "$RID" ]; then ALL_DONE=false; continue; fi
    ST_CONC=$(gh run view --repo "$OWNER/$REPO" "$RID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
    ST="${ST_CONC%%|*}"; CONC="${ST_CONC##*|}"
    if [ "$ST" != "completed" ]; then ALL_DONE=false; fi
    if [ "$ST" = "completed" ] && [ "$CONC" = "failure" ]; then
      echo "FAIL: $wf run $RID -> failure"
      gh run download --repo "$OWNER/$REPO" "$RID" -D "$TMP/run_$RID" || true
      echo "EVIDENCE: $TMP/run_$RID"
      echo "REMEDIO INMEDIATO: revisar logs, no mergear; regenera artifacts si HMAC mismatch"
      exit 2
    fi
  done
  $ALL_DONE && break
done

if [ $SECONDS -ge $END ]; then
  echo "TIMEOUT: workflows no completaron en 900s. Listado de runs recientes:"
  gh run list --repo "$OWNER/$REPO" --limit 25 --json id,name,status,conclusion | jq -r '.[] | "\(.id) \(.name) \(.status) \(.conclusion)"'
  exit 3
fi

# 7) Validar approval_valid en Mandatory Approval Gate logs
MA_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -z "$MA_RUN_ID" ]; then echo "No Mandatory Approval Gate run found"; exit 4; fi
gh run view --repo "$OWNER/$REPO" --log "$MA_RUN_ID" | sed -n '1,400p' > "$TMP/mandatory_excerpt.txt"
grep -q '"approval_valid": *"true"' "$TMP/mandatory_excerpt.txt" || { echo "approval_valid:true NO detectado; abortando merge"; cat "$TMP/mandatory_excerpt.txt"; exit 5; }

# 8) Merge seguro
echo "8) Mergeando PR de forma segura"
gh pr merge --repo "$OWNER/$REPO" --merge --delete-branch --subject "chore(ci): activate HMAC gates" --body "Merging after green CI and validated approval" || fail "Merge falló"

echo "SUCCESS: activación completada. Evidencia en $TMP"
exit 0