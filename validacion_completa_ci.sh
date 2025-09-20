#!/usr/bin/env bash
set -euo pipefail
# validacion_completa_ci.sh
# Ejecuta chequeos end-to-end de los 3 workflows clave, espera su finalización, descarga logs y genera un resumen.
# Requisitos: gh CLI autenticado, jq, unzip. Ejecutar desde la raíz del repo.
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TIMEOUT_SEC=900
POLL_INTERVAL=8
TMPDIR="./ci_runs_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMPDIR"

fail(){ echo "ERROR: $*" >&2; exit 1; }

command -v gh >/dev/null 2>&1 || fail "gh CLI no encontrado"
command -v jq >/dev/null 2>&1 || fail "jq no encontrado"

echo "=== 1) Crear PR si no existe ==="
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "CI/CD Pipeline with HMAC Security Gates" --body "Implementa pipeline completo con validación HMAC y auditoría paralela" --head "$BRANCH" --base main || true
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
fi
echo "PR detectado: ${PR_NUM:-(no-detectado)}"

echo "=== 2) Lanzar workflows clave ==="
for wf in "${WORKFLOWS[@]}"; do
  echo "-> Intentando lanzar workflow: $wf"
  gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" || echo "Aviso: no se pudo iniciar workflow $wf (posible inexistencia o permiso)"
done

echo "=== 3) Esperar finalización de workflows (timeout ${TIMEOUT_SEC}s) ==="
END=$((SECONDS+TIMEOUT_SEC))
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
    fi
  done
  $ALL_DONE && break
done

echo "=== 4) Resumen de ejecuciones recientes ==="
gh run list --repo "$OWNER/$REPO" --limit 15 --json id,name,status,conclusion | jq -r '.[] | "\(.id) \(.name) \(.status) \(.conclusion)"' > "$TMPDIR/run_summary.txt"
cat "$TMPDIR/run_summary.txt"

echo "=== 5) Descargar logs de ejecuciones fallidas o canceladas y extraer errores ==="
FAIL_IDS=$(gh run list --repo "$OWNER/$REPO" --limit 25 --json id,name,conclusion -q '.[] | select(.conclusion=="failure" or .conclusion=="cancelled") | .id' || echo "")
if [ -z "$FAIL_IDS" ]; then
  echo "No se detectaron runs fallidos/cancelados en los últimos 25 runs."
else
  for rid in $FAIL_IDS; do
    OUTDIR="$TMPDIR/run_$rid"
    mkdir -p "$OUTDIR"
    echo "-> Descargando run $rid en $OUTDIR"
    gh run download --repo "$OWNER/$REPO" "$rid" -D "$OUTDIR" || echo "Aviso: descarga falló para run $rid"
    echo "-> Buscando líneas críticas en logs (error|fail|missing|invalid|timeout)"
    grep -R -n -iE "error|fail|missing|invalid|timeout" "$OUTDIR" || echo "No se encontraron líneas críticas en $OUTDIR"
  done
fi

echo "=== 6) Extraer indicadores clave de Mandatory Approval Gate ==="
MA_RUN_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -n "$MA_RUN_ID" ]; then
  echo "Mandatory Approval Gate run ID: $MA_RUN_ID"
  gh run view --repo "$OWNER/$REPO" "$MA_RUN_ID" --log | sed -n '1,200p' > "$TMPDIR/mandatory_gate_log_excerpt.txt" || true
  echo "Extracto guardado en $TMPDIR/mandatory_gate_log_excerpt.txt"
else
  echo "No hay run registrado para Mandatory Approval Gate."
fi

echo "=== 7) Resultado agregado y recomendaciones rápidas ==="
cat "$TMPDIR/run_summary.txt"
if [ -n "$FAIL_IDS" ]; then
  echo "RUNS FALLIDOS: $FAIL_IDS"
  echo "Recomendación inmediata: revisar logs descargados en $TMPDIR/run_<ID>/ y pegar RUN_ID aquí para diagnóstico."
  exit 2
else
  echo "Todos los runs recientes finalizaron sin fallos críticos detectados."
  exit 0
fi