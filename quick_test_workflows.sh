#!/usr/bin/env bash
set -euo pipefail
# quick_test_workflows.sh
# Automatiza: crear PR (si falta), lanzar 3 workflows clave, esperar finalización y recoger logs básicos.
# Requiere: gh CLI autenticado, jq instalado. Ejecutar desde la raíz del repo.
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Implementa pipeline completo con validación HMAC y auditoría paralela"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TIMEOUT_SEC=600
POLL_INTERVAL=8

fail(){ echo "ERROR: $*" >&2; exit 1; }

command -v gh >/dev/null 2>&1 || fail "gh CLI no encontrado."
command -v jq >/dev/null 2>&1 || fail "jq no encontrado."
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "No estás en un repo git."

# 1) Crear PR si no existe
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  echo "Creando PR $BRANCH -> main..."
  gh pr create --repo "$OWNER/$REPO" --title "$PR_TITLE" --body "$PR_BODY" --head "$BRANCH" --base main || true
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
fi
echo "PR: ${PR_NUM:-(no-detectado)}"

# 2) Lanzar workflows
for wf in "${WORKFLOWS[@]}"; do
  echo "Intentando lanzar workflow: $wf"
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" || echo "No se pudo iniciar workflow $wf (ignorado)"
done

# 3) Esperar a finalización de runs (timeout)
END=$((SECONDS+TIMEOUT_SEC))
echo "Esperando hasta $TIMEOUT_SEC segundos por la finalización de workflows..."
while [ $SECONDS -lt $END ]; do
  sleep "$POLL_INTERVAL"
  ALL_DONE=true
  for wf in "${WORKFLOWS[@]}"; do
    RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "$wf" --limit 1 --json id -q '.[0].id' 2>/dev/null || echo "")
    if [ -z "$RUN_ID" ]; then
      ALL_DONE=false
      continue
    fi
    STATUS_CONCL=$(gh run view --repo "$OWNER/$REPO" "$RUN_ID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
    STATUS="${STATUS_CONCL%%|*}"; CONCL="${STATUS_CONCL##*|}"
    if [ "$STATUS" != "completed" ]; then
      ALL_DONE=false
    else
      echo "Workflow '$wf' run $RUN_ID -> conclusion: ${CONCL:-unknown}"
    fi
  done
  $ALL_DONE && break
done

# 4) Listar últimos runs y mostrar extracto de logs de fallos
echo "=== Últimos runs (resumen) ==="
gh run list --repo "$OWNER/$REPO" --limit 15 --json id,name,status,conclusion | jq -r '.[] | "\(.id) \(.name) \(.status) \(.conclusion)"'

FAIL_IDS=$(gh run list --repo "$OWNER/$REPO" --limit 25 --json id,name,conclusion -q '.[] | select(.conclusion=="failure" or .conclusion=="cancelled") | .id' || echo "")
if [ -n "$FAIL_IDS" ]; then
  echo "Runs fallidos/cancelados: $FAIL_IDS"
  for rid in $FAIL_IDS; do
    echo ">>> Descargar y mostrar logs (run $rid)"
    TMPDIR="./tmp_logs_$rid"
    rm -rf "$TMPDIR" || true
    mkdir -p "$TMPDIR"
    gh run download --repo "$OWNER/$REPO" "$rid" -D "$TMPDIR" || true
    grep -R --line-number -iE "error|fail|missing|invalid|timeout" "$TMPDIR" || echo "No se encontraron líneas clave en logs."
    echo "Logs guardados en $TMPDIR"
  done
else
  echo "No se detectaron runs fallidos/cancelados en los últimos 25 runs."
fi

echo "DONE: quick_test_workflows finalizado. Si hay fallos, pega aquí los RUN_ID para diagnóstico."
