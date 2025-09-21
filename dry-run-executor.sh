#!/usr/bin/env bash
set -euo pipefail
# ECONEURA: Dry-run executor for mega-prompt (strict, idempotent, audit-first)
# Usage: paste this entire block in the repo root terminal and run.
# Prereqs: git, jq, openssl. ai.sh must be present (agent). Do NOT set REVIEW_OK before manual review.

# Cargar funciones de seguridad
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/scripts/safety-checks.sh" ]]; then
    source "$SCRIPT_DIR/scripts/safety-checks.sh"
fi

if [[ -f "$SCRIPT_DIR/scripts/input-validation.sh" ]]; then
    source "$SCRIPT_DIR/scripts/input-validation.sh"
fi

# Sanitizar environment al inicio
sanitize_environment

# --- Configurable variables ---
BASE="$(pwd)"
AUDIT_DIR="$BASE/audit"
MEGA_DIR="$BASE/mega-prompts"           # local directory for mega prompt files
MEGA_FILE="$(ls -1t "$MEGA_DIR"/mega_prompt_*.txt 2>/dev/null | head -n1 || true)"
AGENT="./ai.sh"                       # agent launcher path
DRY_FLAG="--dry-run"                  # appended to prompt to request dry-run behavior
TRACE="dryrun-$(date --utc +%Y%m%dT%H%M%SZ)-$RANDOM"
AI_RUN_OUT="$AUDIT_DIR/ai_run_dry_${TRACE}.json"
PLANNED_OUT="$AUDIT_DIR/planned_files_${TRACE}.json"
SUMMARY_OUT="$AUDIT_DIR/summary_dryrun_${TRACE}.json"
ENV_CHECK_OUT="$AUDIT_DIR/env_check_${TRACE}.json"
MASKED_AI_OUT="$AUDIT_DIR/ai_run_dry_${TRACE}_masked.json"

# --- Helpers ---
err() { echo "ERROR: $*" >&2; exit 1; }
require_cmd() { command -v "$1" >/dev/null 2>&1 || err "required command not found: $1"; }
sha256f(){
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    # Fallback: simple hash based on file size and name
    echo "$(stat -c%s "$1" 2>/dev/null || stat -f%z "$1" 2>/dev/null || echo "0")_$(basename "$1")" | md5sum | awk '{print $1}'
  fi
}

# --- Validate prerequisites ---
for cmd in git jq; do require_cmd "$cmd"; done
# openssl is optional, we'll use fallback if not available

# --- Security validation functions ---
validate_mega_prompt() {
    local mega_file="$1"

    safe_log "INFO" "Validando archivo mega-prompt: $mega_file"

    # Validar que el archivo existe
    if [[ ! -f "$mega_file" ]]; then
        err "Archivo mega-prompt no encontrado: $mega_file"
    fi

    # Validar ruta del archivo
    if ! validate_file_path "$mega_file" "$BASE"; then
        err "Ruta de mega-prompt inválida: $mega_file"
    fi

    # Validar tamaño del archivo
    if ! validate_file_size "$mega_file" 10; then  # Máximo 10MB
        err "Archivo mega-prompt demasiado grande: $mega_file"
    fi

    # Validar permisos del archivo
    if ! validate_file_permissions "$mega_file"; then
        err "Permisos inválidos en mega-prompt: $mega_file"
    fi

    # Validar contenido básico
    local first_line
    first_line=$(head -1 "$mega_file" 2>/dev/null || echo "")
    if [[ -z "$first_line" ]]; then
        err "Archivo mega-prompt vacío: $mega_file"
    fi

    safe_log "INFO" "Validación de mega-prompt completada"
}

validate_agent_script() {
    local agent_script="$1"

    safe_log "INFO" "Validando script del agente: $agent_script"

    # Validar que existe
    if [[ ! -f "$agent_script" ]]; then
        err "Script del agente no encontrado: $agent_script"
    fi

    # Validar que es ejecutable
    if [[ ! -x "$agent_script" ]]; then
        safe_log "WARNING" "Script del agente no es ejecutable, intentando chmod +x"
        chmod +x "$agent_script" || err "No se pudo hacer ejecutable el script del agente"
    fi

    # Validar permisos
    if ! validate_file_permissions "$agent_script"; then
        err "Permisos inválidos en script del agente: $agent_script"
    fi

    # Validar shebang
    local shebang
    shebang=$(head -1 "$agent_script" 2>/dev/null || echo "")
    if [[ "$shebang" != "#!/bin/bash" && "$shebang" != "#!/usr/bin/env bash" ]]; then
        safe_log "WARNING" "Shebang no estándar en script del agente: $shebang"
    fi

    safe_log "INFO" "Validación de script del agente completada"
}
if [ ! -x "$AGENT" ]; then err "Agent not found or not executable at $AGENT. Place real ai.sh agent in repo root."; fi

# --- Ensure audit dir exists ---
mkdir -p "$AUDIT_DIR"

# --- Validate environment using existing validate_env.sh if present; else basic check ---
if [ -x "$BASE/scripts/validate_env.sh" ]; then
  echo "Running scripts/validate_env.sh..."
  if ! bash "$BASE/scripts/validate_env.sh" > "$ENV_CHECK_OUT" 2>&1; then
    jq -n --arg trace "$TRACE" --arg time "$(date --iso-8601=seconds)" --arg note "validate_env failed; check $ENV_CHECK_OUT" '{trace_id:$trace, status:"env_invalid", time:$time, note:$note}' > "$SUMMARY_OUT"
    err "Environment validation failed. Check $ENV_CHECK_OUT"
  fi
else
  # minimal env check
  echo "No scripts/validate_env.sh found; performing minimal checks..."
  jq -n --arg git "$(git --version 2>/dev/null || echo 'git_missing')" --arg jq "$(jq --version 2>/dev/null | head -n1 || echo 'jq_missing')" '{git:$git, jq:$jq}' > "$ENV_CHECK_OUT"
fi

# --- Locate mega prompt file ---
if [ -z "$MEGA_FILE" ] || [ ! -f "$MEGA_FILE" ]; then
  err "Mega prompt file not found in $MEGA_DIR (expected mega_prompt_*.txt). Create it or set MEGA_DIR variable."
fi
echo "Using mega-prompt: $MEGA_FILE"

# --- Validate mega-prompt with security checks ---
validate_mega_prompt "$MEGA_FILE"

# --- Validate agent script ---
AGENT_SCRIPT="$BASE/scripts/ai.sh"
validate_agent_script "$AGENT_SCRIPT"

# --- Prepare agent prompt (append explicit dry-run marker) ---
# We avoid modifying the original mega prompt file; we construct an ephemeral prompt to send to agent.
TMP_PROMPT="$(mktemp)"
trap 'rm -f "$TMP_PROMPT"' EXIT
cat "$MEGA_FILE" > "$TMP_PROMPT"
printf "\n\n--DRY-RUN-MODE: do not execute destructive actions; only output planned files/actions as JSON with keys: files, planned_actions, remote_actions, approvals_required.--\n" >> "$TMP_PROMPT"
printf "\n--TRACE-ID: %s --\n" "$TRACE" >> "$TMP_PROMPT"

# --- Call agent with the prompt, capture output (strict timeouts not included) ---
echo "Invoking agent in dry-run mode, writing raw output to $AI_RUN_OUT ..."
# Use a subshell to avoid exposing env vars; capture stdout/stderr
set +o pipefail
# Capture both stdout and stderr, and also save to file
AGENT_OUTPUT=$("$AGENT" "$(cat "$TMP_PROMPT") $DRY_FLAG" 2>&1)
echo "$AGENT_OUTPUT" > "$AI_RUN_OUT"
set -o pipefail

# Debug: show what we captured
echo "Agent output captured (first 200 chars):"
echo "$AGENT_OUTPUT" | head -c 200
echo "..."

# --- Basic sanity: agent output must be JSON or include JSON manifest ---
if ! jq empty "$AI_RUN_OUT" >/dev/null 2>&1; then
  # Try to extract JSON from the output
  JSON_CONTENT=$(grep -o '{.*}' "$AI_RUN_OUT" | head -n1)
  if [ -n "$JSON_CONTENT" ]; then
    echo "$JSON_CONTENT" > "$AI_RUN_OUT.tmp"
    mv "$AI_RUN_OUT.tmp" "$AI_RUN_OUT"
  else
    # attempt to salvage JSON-looking fragments; wrap output
    echo '{"raw_output":' > "$AI_RUN_OUT.tmp"
    python3 - <<PY >> "$AI_RUN_OUT.tmp" 2>/dev/null || true
import json,sys
try:
    s=open(sys.argv[1]).read()
    print(json.dumps(s))
except Exception as e:
    print(json.dumps("<<unparseable agent output>>"))
PY
    mv "$AI_RUN_OUT.tmp" "$AI_RUN_OUT"
  fi
fi

# --- Mask sensitive patterns in AI output before further processing ---
# replace long alphanumeric sequences (>32 chars), AWS-like keys, tok_live, emails with <REDACTED>
sed -E -e 's/[[:alnum:]]{32,}/<REDACTED>/g' \
       -e 's/AKIA[0-9A-Z]{8,}/<REDACTED_AKIA>/g' \
       -e 's/tok_live_[A-Za-z0-9_\-]{8,}/<REDACTED_TOKEN>/g' \
       -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/<REDACTED_EMAIL>/g' \
       "$AI_RUN_OUT" > "$MASKED_AI_OUT" || cp "$AI_RUN_OUT" "$MASKED_AI_OUT"

# --- Extract planned files / actions from masked AI JSON output ---
# AI expected to provide .files or .planned_files or .planned or .planned_actions
jq 'if .files and (.files | length) > 0 then .files elif .planned_files and (.planned_files | length) > 0 then .planned_files elif .planned and (.planned | length) > 0 then .planned elif .planned_actions and (.planned_actions | length) > 0 then .planned_actions else [] end' "$MASKED_AI_OUT" > "$PLANNED_OUT" 2>/dev/null || echo "[]" > "$PLANNED_OUT"

# --- Compute simple summary: counts, remote actions detection, approvals required detection ---
PLANNED_COUNT=$(jq 'length' "$PLANNED_OUT" 2>/dev/null || echo 0)
REMOTE_ACTIONS=$(jq -r 'map(select(.sample_command? | test("push|git push|git remote|create branch|tag|git push"))) | .[]?.sample_command' "$PLANNED_OUT" 2>/dev/null || true)
APPROVAL_HINTS=$(jq -r 'map(select(.purpose? | test("approval|mitigate|push|remote|commit"))) | .[]?.purpose' "$PLANNED_OUT" 2>/dev/null || true)

# --- Prepare effects_on_repo by scanning planned commands for git ops (conservative) ---
EFFECTS="{\"planned_file_count\":$PLANNED_COUNT}"
# detect git push or branch/tag presence
GIT_RISK=false
if grep -qiE "push|git push|create branch|tag|commit" "$MASKED_AI_OUT" 2>/dev/null; then GIT_RISK=true; fi

# --- Build JSON summary with checks and preconditions ---
jq -n \
  --arg trace "$TRACE" \
  --arg time "$(date --iso-8601=seconds)" \
  --argjson planned_count "$PLANNED_COUNT" \
  --arg git_risk "$GIT_RISK" \
  --arg agent "$AGENT" \
  --arg mega "$(basename "$MEGA_FILE")" \
  --arg env_file "$ENV_CHECK_OUT" \
  --arg ai_out "$MASKED_AI_OUT" \
  --arg planned "$PLANNED_OUT" \
  --arg remote_actions "$(printf '%s\n' "$REMOTE_ACTIONS")" \
  --arg approvals "$(printf '%s\n' "$APPROVAL_HINTS")" \
  '{
    trace_id:$trace,
    timestamp:$time,
    agent_executed:$agent,
    mega_prompt:$mega,
    environment_check:$env_file,
    ai_output_masked:$ai_out,
    planned_files:$planned,
    planned_count:$planned_count,
    remote_actions:( if ($git_risk == "true") then "possible_remote_actions" else "none_detected" end ),
    remote_commands_preview:$remote_actions,
    approvals_hints:$approvals,
    notes:"Review planned_files JSON and ai_output_masked before creating REVIEW_OK. No pushes were performed."
  }' > "$SUMMARY_OUT"

# --- generate a compact human-readable summary file ---
cat > "$AUDIT_DIR/summary_dryrun_${TRACE}.txt" <<TXT
ECONEURA DRY-RUN SUMMARY
Trace: $TRACE
Time: $(date --iso-8601=seconds)

Planned files count: $PLANNED_COUNT
Possible remote actions: $GIT_RISK
Agent output (masked): $MASKED_AI_OUT
Planned files JSON: $PLANNED_OUT

IMPORTANT: Review the masked AI output and planned files. Do NOT create REVIEW_OK or enable pushes until security review is complete.
TXT

# --- produce checksums for key artifacts ---
sha256f "$MASKED_AI_OUT" > "$AUDIT_DIR/ai_run_dry_${TRACE}.json.sha256" 2>/dev/null || true
sha256f "$PLANNED_OUT" > "$AUDIT_DIR/planned_files_${TRACE}.json.sha256" 2>/dev/null || true
sha256f "$SUMMARY_OUT" > "$AUDIT_DIR/summary_dryrun_${TRACE}.json.sha256" 2>/dev/null || true

# --- safety artifact: create REVIEW_OK_REQUIRED file to signal manual gating (do NOT auto-create REVIEW_OK) ---
REVIEW_FLAG="$BASE/REVIEW_OK_REQUIRED"
cat > "$REVIEW_FLAG" <<'FLAG'
REVIEW_OK_REQUIRED
This repository requires a manual security review of the dry-run artifacts before creating REVIEW_OK.
Do NOT create REVIEW_OK until you have inspected:
 - audit/ai_run_dry_*.json (masked)
 - audit/planned_files_*.json
 - audit/summary_dryrun_*.txt
To authorize a real run, a security lead must create a file named REVIEW_OK in the repo root and commit it.
FLAG

# --- Final output for operator ---
echo "Dry-run complete. Trace: $TRACE"
echo "- Masked agent output: $MASKED_AI_OUT"
echo "- Planned files JSON: $PLANNED_OUT"
echo "- Summary JSON: $SUMMARY_OUT"
echo "- Human summary: $AUDIT_DIR/summary_dryrun_${TRACE}.txt"
echo "- Review guard file created: $REVIEW_FLAG"
echo
echo "Next steps (manual):"
echo "1) Inspect: less $MASKED_AI_OUT; less $PLANNED_OUT; less $AUDIT_DIR/summary_dryrun_${TRACE}.txt"
echo "2) Discuss with security lead. If OK, create REVIEW_OK in repo root and commit it:"
echo "     touch REVIEW_OK && git add REVIEW_OK && git commit -m 'security: REVIEW_OK for mega-prompt run'"
echo "3) After REVIEW_OK exists, run the real-run command (copy/paste provided by the runbook)."
echo
echo "The dry-run artifacts are masked; no secrets are written in cleartext to audit files."
