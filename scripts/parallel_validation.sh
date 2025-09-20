#!/usr/bin/env bash
set -euo pipefail
# Ejecuta validaciones en paralelo y recoge resultados
LOG_DIR="${1:-./audit}"
mkdir -p "$LOG_DIR/parallel_logs"
# Start jobs
if [ -x ./scripts/vault/validate_hmac_approval.sh ]; then
  ./scripts/vault/validate_hmac_approval.sh ${LOG_DIR}/approval_signed.json > "${LOG_DIR}/parallel_logs/validate_hmac.out" 2>&1 || true &
fi
if [ -x ./scripts/automated_audit_pipeline.sh ]; then
  ./scripts/automated_audit_pipeline.sh --non-destructive > "${LOG_DIR}/parallel_logs/automated_audit.out" 2>&1 || true &
fi
wait
echo "Parallel validations finished. Logs in ${LOG_DIR}/parallel_logs"
