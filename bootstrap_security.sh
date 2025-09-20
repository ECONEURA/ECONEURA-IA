#!/bin/bash
set -euo pipefail

# --- Ajusta si necesitas otra carpeta ---
BASE="$HOME/ECONEURA"
SCRIPTS="$BASE/scripts"
AUDIT="$BASE/audit"
CONFIG="$BASE/config"
WORKDIR="$(pwd)"
mkdir -p "$BASE" "$SCRIPTS" "$AUDIT" "$CONFIG"

# --- helper trace id ---
trace() { printf "%s-%06d\n" "$(date --iso-8601=seconds)" "$RANDOM"; }
TRACE_ID="$(trace)"
MANIFEST="$AUDIT/manifest_$TRACE_ID.json"
jq -n --arg trace "$TRACE_ID" '{trace_id:$trace, files:[]}' > "$MANIFEST"

# --- minimal environment check (fail-fast) ---
missing=()
for c in git jq openssl; do
  if ! command -v "$c" >/dev/null 2>&1; then missing+=("$c"); fi
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "Faltan dependencias: ${missing[*]}. Instala y vuelve a ejecutar." >&2
  exit 2
fi

# --- create safe placeholder scripts and config (idempotent) ---
cat > "$SCRIPTS/validate_env.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
OUT="$PWD/audit/env_check.json"
REQ=(git jq)
MISSING=()
for c in "${REQ[@]}"; do
  if ! command -v "$c" >/dev/null 2>&1; then MISSING+=("$c"); fi
done
if [ ${#MISSING[@]} -gt 0 ]; then
  jq -n --arg time "$(date --iso-8601=seconds)" --argjson missing "$(printf '%s\n' "${MISSING[@]}" | jq -R -s -c 'split("\n")[:-1]')" '{status:"missing",time:$time,missing:$missing}' > "$OUT"
  echo "MISSING" && exit 2
else
  jq -n --arg time "$(date --iso-8601=seconds)" --argjson missing "$(printf '%s\n' "${MISSING[@]}" | jq -R -s -c 'split("\n")[:-1]')" '{status:"ok",time:$time}' > "$OUT"
  echo "OK"
fi
SH
chmod +x "$SCRIPTS/validate_env.sh"
jq --arg p "$SCRIPTS/validate_env.sh" --arg u "Validate environment" --arg pre "Requires git and jq" --arg cmd "$SCRIPTS/validate_env.sh" '.files += [{"path":$p,"purpose":$u,"preconditions":$pre,"sample_command":$cmd}]' "$MANIFEST" > "$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"

# create minimal ai-run safe stub if missing (non-destructive)
if [ ! -x ./ai.sh ]; then
  cat > ./ai.sh <<'SH'
#!/usr/bin/env bash
echo "ai.sh placeholder: save your prompt to ./last_prompt.txt and respond with a manifest JSON"
if [ -n "${1:-}" ]; then printf '%s\n' "$1" > ./last_prompt.txt; fi
jq -n '{status:"ai_stub_saved_prompt", saved:"./last_prompt.txt"}'
SH
  chmod +x ./ai.sh
fi
jq --arg p "./ai.sh" --arg u "Agent launcher (ai.sh)" --arg pre "ai.sh must be present or replaced by real agent" --arg cmd "./ai.sh \"<mega prompt>\"" '.files += [{"path":$p,"purpose":$u,"preconditions":$pre,"sample_command":$cmd}]' "$MANIFEST" > "$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"

# --- write the mega-prompt to a file (safe, reviewable) ---
MEGA_PROMPT_FILE="$BASE/mega_prompt_$TRACE_ID.txt"
cat > "$MEGA_PROMPT_FILE" <<'PROMPT'
Implementa y despliega hoy, en este repositorio ECONEURA, el ciclo operativo completo y seguro para detección y mitigación de secretos. Ejecuta las siguientes tareas secuenciales y proporciona los scripts, workflows y artefactos necesarios, listos para ejecutar, con salida JSON para auditoría.

1) Vault integration:
- Añade funciones vault_lookup y vault_store reutilizables.
- Modifica safe-mitigate.sh para requerir token almacenado en Vault, validar expiración y registrar approval con actor y timestamp en audit/approvals.json.
- Si Vault no está configurado, generar modo fallback que bloquee mitigaciones y registre error.

2) Owners mapping:
- Crea config/owners.json y modifica classify-risks.sh para adjuntar owner por path; si no hay mapping, asignar default security@org.

3) Scoring avanzado:
- Reemplaza scoring estático por función configurable que combine: type base score, path modifier, commit age modifier, tool confidence.
- Añade módulo para calcular commit age usando git.
- Umbrales: high ≥ 80, med 45–79, low < 45.

4) Validation cruzada:
- Genera validate_gitleaks.sh y compare-tools.sh que intersecte TruffleHog y Gitleaks hallazgos; marcar coincidencias multi-tool como high-confidence.

5) CI gating:
- Genera/actualiza .github/workflows/scan-econeura.yml: en push/PR ejecute scan, validation, classification.
- Si existen hallazgos high no triaged, set status check security/scan=failure y postea comentario en PR con resumen y remediation hints.
- Incluir step que falla CI a menos que exista protected approval workflow run.

6) Playbooks de mitigación:
- Crear scripts/playbooks/: rotate-api-key, invalidate-token, redact-commit (crear revert branch + protected issue).
- Playbooks idempotentes; registran acciones en audit/; require Vault approval token o two-step approver signature.

7) Approval flow:
- Implementa approve-tool.sh que valida HMAC-signed approvals con expiry.
- safe-mitigate.sh invoca approve-tool.sh; registrar en audit/approvals.json actor, method, timestamp, signature, trace_id.

8) Observabilidad y métricas:
- Instrumenta scripts para emitir métricas Prometheus text format en /tmp/econeura_metrics.prom:
  counters: findings_total, findings_high, mitigations_executed, mttr_seconds.
- Genera grafana/dashboard.json stub con paneles para esas métricas.

9) Tests y sandbox:
- Crear tests/econeura-test con dummy secrets.
- Agregar GitHub Actions job que ejecute unit/integration tests para scan/classify/approve/playbook en staging matrix.

10) Versioning and evidence:
- Cada ejecución debe commitear audit artifacts a branch econeura/audit/<trace_id>, tag audit-<trace_id> y producir audit/complete_<trace_id>.json con resumen: pasos, resultados, owners, approvals, evidencia de mitigación.
- Si no hay remoto git, generar instrucciones para push manual.

11) Crontab and safe automation:
- Crear crontab-suggest.txt con entrada semanal pero NO instalar cron automáticamente.

12) Safety defaults:
- Ninguna acción destructiva se ejecuta automáticamente.
- Todas las mitigaciones destructivas requieren validación en Vault o 2 approvers.

13) Output expectations:
- Para cada archivo/script/workflow generado, producir manifest JSON: path, purpose, preconditions, sample_command.
- Producir audit/complete_<trace_id>.json con resumen machine-readable.

14) Bootstrap one-liner:
- Produce una one-line command que ejecute validate_env, initial safe scan (dry-run if needed), validation cross-check, classification, post metrics, create audit branch & tag. Incluir instrucciones claras para VAULT_ADDR/VAULT_TOKEN y cómo generar approval tokens.

Prioriza fail-fast, idempotency, masking of secrets in logs (no secrets in clear), and structured error logging to audit/errors_<trace_id>.json. Use trace_id on all artifacts. Act as production-ready.
PROMPT

# add to manifest
jq --arg p "$MEGA_PROMPT_FILE" --arg u "Mega prompt for full deploy" --arg pre "Review before running" --arg cmd "./ai.sh \"\$(cat $MEGA_PROMPT_FILE)\"" '.files += [{"path":$p,"purpose":$u,"preconditions":$pre,"sample_command":$cmd}]' "$MANIFEST" > "$MANIFEST.tmp" && mv "$MANIFEST.tmp" "$MANIFEST"

# --- optional: show the prompt path and manifest location ---
echo "Mega prompt saved to: $MEGA_PROMPT_FILE"
echo "Manifest: $MANIFEST"
echo "Trace: $TRACE_ID"

# --- final invocation (safe): show the command to run the agent, do NOT auto-run it without review ---
echo
echo "REVIEW BEFORE EXECUTING: To run the mega-prompt, execute the following command AFTER reviewing $MEGA_PROMPT_FILE:"
echo
echo "  ./ai.sh \"\$(cat $MEGA_PROMPT_FILE)\" | tee audit/ai_run_${TRACE_ID}.json"
echo
echo "If you want me to run it now, copy the exact command above and execute it. The current bootstrap prepared all files, manifest and safe placeholders."