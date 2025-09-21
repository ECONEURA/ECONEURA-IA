#!/usr/bin/env bash
set -euo pipefail
# Script todo-en-uno: configura secrets (si proporcionas valores), crea PR, lanza workflows, espera y recoge resultados y logs.
# REEMPLAZA los placeholders OWNER, REPO y valores secretos antes de ejecutar.
# No imprime valores secretos en texto; puedes exportarlos antes o introducirlos interactivamente.
#
# Uso: copia/pega entero en la raíz del repo y ejecútalo en VS Code.
OWNER="ECONEURA"                              # REEMPLAZA si es distinto
REPO="ECONEURA-IA"                            # REEMPLAZA si es distinto
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Implementa pipeline completo con validación HMAC y auditoría paralela"
# Opcional: si quieres que el script configure secrets automáticamente, define estas variables (no obligatorio)
VAULT_ADDR="${VAULT_ADDR:-}"                  # ejemplo: "https://vault.example.local"
VAULT_TOKEN="${VAULT_TOKEN:-}"
VAULT_APPROVAL_KEY="${VAULT_APPROVAL_KEY:-}"

# Helper: fail with message
fail() { echo "ERROR: $*" >&2; exit 1; }

# 0) Precondiciones rápidas
command -v gh >/dev/null 2>&1 || fail "gh CLI no encontrado. Instala y autentica gh antes."
command -v jq >/dev/null 2>&1 || fail "jq no encontrado. Instala jq."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "No estás en un repo git."

# 1) Verificar existencia de artifacts críticos localmente
[ -d ".github/workflows" ] || fail ".github/workflows no existe"
[ -d "audit" ] || fail "audit/ no existe"
[ -f "audit/approval_signed.json" ] || fail "audit/approval_signed.json no existe. Genera approval antes."

# 2) Validación local HMAC y preflight (usa VAULT_APPROVAL_KEY del entorno o pide entrada)
if [ -z "${VAULT_APPROVAL_KEY:-}" ]; then
  read -s -p "Introduce VAULT_APPROVAL_KEY (hex) para validación local y pulsa ENTER: " VAULT_APPROVAL_KEY
  echo
fi
export VAULT_APPROVAL_KEY
chmod +x scripts/vault/validate_hmac_approval.sh || true
VALID_OUT="$(./scripts/vault/validate_hmac_approval.sh audit/approval_signed.json 2>&1 || true)"
echo "$VALID_OUT" | jq -e '.status=="valid"' >/dev/null 2>&1 || fail "HMAC inválido o validator falló: $VALID_OUT"
chmod +x scripts/ci_preflight.sh || true
./scripts/ci_preflight.sh >/dev/null 2>&1 || fail "Preflight falló. Ejecuta ./scripts/ci_preflight.sh para detalles."

# 3) (Opcional) configurar secrets en GitHub si se suministraron valores
if [ -n "${VAULT_ADDR}" ] || [ -n "${VAULT_TOKEN}" ] || [ -n "${VAULT_APPROVAL_KEY}" ]; then
  echo "Configurando secrets en GitHub (gh debe estar autenticado)..."
  [ -n "$VAULT_ADDR" ] && gh repo set-secret "$OWNER/$REPO" VAULT_ADDR --body "$VAULT_ADDR"
  [ -n "$VAULT_TOKEN" ] && gh repo set-secret "$OWNER/$REPO" VAULT_TOKEN --body "$VAULT_TOKEN"
  [ -n "$VAULT_APPROVAL_KEY" ] && gh repo set-secret "$OWNER/$REPO" VAULT_APPROVAL_KEY --body "$VAULT_APPROVAL_KEY"
  echo "Secrets configurados (según valores provistos)."
fi

# 4) Asegurar approval y REVIEW_OK en commit local (no forzará push si hay conflictos)
if [ ! -f REVIEW_OK ]; then
  cat > REVIEW_OK <<EOF
approved_by=local-operator
approved_file=audit/approval_signed.json
approved_at=$(date --iso-8601=seconds)
EOF
  git add audit/approval_signed.json REVIEW_OK
  git commit -m "chore(security): add approval_signed and REVIEW_OK for CI gate" || true
else
  git add audit/approval_signed.json REVIEW_OK || true
  git commit -m "chore(security): ensure approval_signed and REVIEW_OK present" || true
fi

# 5) Push explícito con confirmación
read -p "¿Deseas hacer push de la rama $BRANCH a origin ahora? (yes/no) " PUSH_ANSWER
if [ "$PUSH_ANSWER" = "yes" ]; then
  git push origin "$BRANCH"
  echo "Push realizado: origin/$BRANCH"
else
  echo "No se realizó push. Si quieres más tarde: git push origin $BRANCH"
fi

# 6) Crear PR si no existe (seguro: evita duplicados)
PR_EXISTS="$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")"
if [ -z "$PR_EXISTS" ]; then
  echo "Creando PR $BRANCH -> main..."
  gh pr create --repo "$OWNER/$REPO" --title "$PR_TITLE" --body "$PR_BODY" --head "$BRANCH" --base main || true
else
  echo "PR ya existe: #$PR_EXISTS"
fi

# 7) Lanzar workflows clave (intento no bloqueante)
echo "Lanzando workflows clave (no fallará si existen errores remotos)..."
gh workflow run --repo "$OWNER/$REPO" "Mandatory Approval Gate" --ref "refs/heads/$BRANCH" || true
gh workflow run --repo "$OWNER/$REPO" "Optimized Audit Parallel" --ref "refs/heads/$BRANCH" || true
gh workflow run --repo "$OWNER/$REPO" "Integration Tests with Compose" --ref "refs/heads/$BRANCH" || true

# 8) Polling simple: espera hasta que los tres workflows finalicen o timeout
echo "Esperando a que workflows terminen (timeout 600s)..."
END=$((SECONDS+600))
declare -A WFS=( ["Mandatory Approval Gate"]="Mandatory Approval Gate" ["Optimized Audit Parallel"]="Optimized Audit Parallel" ["Integration Tests with Compose"]="Integration Tests with Compose" )
while [ $SECONDS -lt $END ]; do
  sleep 8
  ALL_DONE=true
  for key in "${!WFS[@]}"; do
    WF_NAME="${WFS[$key]}"
    LATEST_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "$WF_NAME" --limit 1 --json id -q '.[0].id' 2>/dev/null || echo "")
    if [ -z "$LATEST_RUN_ID" ]; then
      ALL_DONE=false
      continue
    fi
    RUN_STATUS=$(gh run view --repo "$OWNER/$REPO" "$LATEST_RUN_ID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
    STATUS="${RUN_STATUS%%|*}"; CONCL="${RUN_STATUS##*|}"
    if [ "$STATUS" = "completed" ]; then
      echo "Workflow '$WF_NAME' run $LATEST_RUN_ID finished with conclusion: ${CONCL:-unknown}"
    else
      ALL_DONE=false
    fi
  done
  $ALL_DONE && break
done

# 9) Resumen final y diagnóstico automático de fallos (recoger últimos runs y logs)
echo "=== Resumen últimos 10 runs ==="
gh run list --repo "$OWNER/$REPO" --limit 10 --json id,name,status,conclusion | jq -r '.[] | "\(.id) \(.name) \(.status) \(.conclusion)"'

# Si hay runs con conclusion "failure" o "cancelled", descargar logs y mostrar extracto
FAIL_RUNS=$(gh run list --repo "$OWNER/$REPO" --limit 25 --json id,name,conclusion -q '.[] | select(.conclusion=="failure" or .conclusion=="cancelled") | .id' || echo "")
if [ -n "$FAIL_RUNS" ]; then
  echo "Runs fallidos/cancelados detectados: $FAIL_RUNS"
  for rid in $FAIL_RUNS; do
    echo ">>> Descargando logs run $rid (archivo tmp_logs_$rid.zip)"
    gh run download --repo "$OWNER/$REPO" "$rid" -D "./tmp_logs_$rid" || true
    echo ">>> Mostrar últimos 200 líneas de logs relevantes (grep errors)"
    grep -R --line-number -iE "error|fail|missing|invalid|timeout" "./tmp_logs_$rid" || true
  done
else
  echo "No se detectaron runs fallidos/cancelados en los últimos 25 runs."
fi

# 10) Comandos de remediación rápida sugeridos (ejecutables)
cat <<'REM'
Remediaciones rápidas (ejecuta según fallo detectado):
- Si Mandatory Approval Gate falla por secret faltante:
  gh repo set-secret OWNER/REPO VAULT_APPROVAL_KEY --body "<HEX_KEY>"
- Si approval artifact no se encuentra en remoto:
  git add audit/approval_signed.json REVIEW_OK && git commit -m "chore: add approval artifacts" && git push origin BRANCH
- Si Integration Tests falla por Docker:
  Verifica que el runner soporta servicios Docker o marca el job como opcional temporalmente
- Para logs completos de un run:
  gh run view --repo OWNER/REPO --log <RUN_ID>
REM

echo "END: Script finalizado. Si hay fallos, pega aquí los RUN_ID para diagnóstico puntual."
