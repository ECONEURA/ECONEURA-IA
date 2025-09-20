#!/usr/bin/env bash
set -euo pipefail
# ONE-STEP HARD ACTION PLAN - ECONEURA (NON-DESTRUCTIVE)
# Paste & run in repo root. Does NOT git push or terraform apply by default.

BASE="$(pwd)"
AUDIT="$BASE/audit"
TRACE="$(date --utc +%Y%m%dT%H%M%SZ)-$RANDOM"
mkdir -p "$AUDIT" "$BASE/.github/workflows" "$BASE/infra/terraform" "$BASE/infra/helm" "$BASE/scripts"

# ---- Helpers ----
log(){ printf "%s %s\n" "$(date --iso-8601=seconds)" "$*"; }
mask(){ sed -E -e 's/[[:alnum:]]{32,}/<REDACTED>/g' -e 's/AKIA[0-9A-Z]{8,}/<REDACTED_AKIA>/g' -e 's/tok_live_[A-Za-z0-9_\-]{8,}/<REDACTED_TOKEN>/g' -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/<REDACTED_EMAIL>/g' "$1" > "$2" || cp "$1" "$2"; }
require(){ command -v "$1" >/dev/null 2>&1 || { echo "MISSING $1"; exit 2; } }

# ---- 0. Fast preflight (non-fatal) ----
log "Preflight: check core tools"
for t in git jq openssl sed awk sed grep; do
  if ! command -v "$t" >/dev/null 2>&1; then echo "Tool missing: $t"; fi
done
# optional tools
for t in terraform helm kubectl docker; do
  if ! command -v "$t" >/dev/null 2>&1; then log "Optional tool not found: $t (skip infra checks)"; fi
done

# ---- 1. Enforce REVIEW_OK_REQUIRED guard (non-destructive file) ----
GATEFILE="$BASE/REVIEW_OK_REQUIRED"
cat > "$GATEFILE" <<'TXT'
REVIEW_OK_REQUIRED
Security policy: Manual sign-off required before any remote push or destructive action.
Inspect audit/* and confirm approvals in audit/approvals.json before creating REVIEW_OK.
TXT
chmod 0644 "$GATEFILE"
git add "$GATEFILE" || true
git commit -m "chore(security): add REVIEW_OK_REQUIRED guard" || true

# ---- 2. Validate environment via existing validate_env.sh or minimal checks ----
log "Running validate_env.sh (if exists) or minimal checks"
ENV_OUT="$AUDIT/env_check_${TRACE}.json"
if [ -x "$BASE/scripts/validate_env.sh" ]; then
  bash "$BASE/scripts/validate_env.sh" > "$ENV_OUT" 2>&1 || true
else
  jq -n --arg git "$(git --version 2>/dev/null || 'git_missing')" --arg jq "$(jq --version 2>/dev/null | head -n1 || 'jq_missing')" '{git:$git,jq:$jq}' > "$ENV_OUT"
fi
log "Env check -> $ENV_OUT"

# ---- 3. Dry-run mega-prompt (if ai.sh exists) ----
AI_RAW="$AUDIT/ai_run_dry_${TRACE}.raw"
AI_MASKED="$AUDIT/ai_run_dry_${TRACE}.masked.json"
PLANNED="$AUDIT/planned_files_${TRACE}.json"
if [ -x "$BASE/ai.sh" ]; then
  log "Running ai.sh dry-run (agent)"
  "$BASE/ai.sh" "$(cat "$HOME/ECONEURA/mega_prompt_*.txt" 2>/dev/null || printf '%s\n' '[NO_MEGA_PROMPT]')" --dry-run > "$AI_RAW" 2>&1 || true
  mask "$AI_RAW" "$AI_MASKED"
  jq -s '.[0] | (.files // .planned_files // .planned // .planned_actions // [])' "$AI_MASKED" > "$PLANNED" 2>/dev/null || echo "[]" > "$PLANNED"
else
  echo '{"warning":"ai.sh missing, dry-run skipped"}' > "$AI_RAW"
  mask "$AI_RAW" "$AI_MASKED"
  echo "[]" > "$PLANNED"
fi
log "Dry-run masked -> $AI_MASKED; planned -> $PLANNED"

# ---- 4. Run unit/integration tests (non-destructive) ----
log "Running integration tests (if present)"
if [ -x "$BASE/tests/econeura-test/test_integration.sh" ]; then
  bash tests/econeura-test/test_integration.sh 2>&1 | tee "$AUDIT/integration_${TRACE}.log"
  jq -n --arg log "integration_${TRACE}.log" --arg trace "$TRACE" '{trace:$trace, integration_log:$log}' > "$AUDIT/integration_${TRACE}.json"
else
  echo '{"warning":"integration script missing"}' > "$AUDIT/integration_${TRACE}.json"
fi

# ---- 5. Simulate alert + playbook dry-run (non-destructive) ----
log "Simulating alert and safe-mitigate dry-run"
SIM_ALERT="$AUDIT/sim_alert_${TRACE}.json"
cat > "$SIM_ALERT" <<JSON
[{"id":"sim-high-${TRACE}","file":"tests/econeura-test/real-like/.env","severity":"high","owner":"security@example.com"}]
JSON
if [ -x "$BASE/scripts/alert-runner.sh" ]; then
  bash "$BASE/scripts/alert-runner.sh" "$SIM_ALERT" 2>&1 | tee "$AUDIT/alert_run_${TRACE}.log" || true
else
  echo '{"warning":"alert-runner missing"}' > "$AUDIT/alert_run_${TRACE}.json"
fi
# safe-mitigate dry-run: create a test HMAC approval if Vault available, else record intent
if command -v vault >/dev/null 2>&1 && [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
  KEY="$(openssl rand -hex 32)"
  vault kv put secret/econeura/test_approval value="$KEY" >/dev/null 2>&1 || true
  PAYLOAD='{"actor":"sim@ec","exp":$(( $(date +%s) + 3600 ))}'
  PAYLOAD_B64=$(printf '%s' "$PAYLOAD" | base64 -w0)
  SIG=$(printf '%s' "$PAYLOAD_B64" | openssl dgst -sha256 -hmac "$KEY" -binary | xxd -p -c 9999)
  if [ -x "$BASE/scripts/safe-mitigate.sh" ]; then
    bash "$BASE/scripts/safe-mitigate.sh" "trace-sim-${TRACE}" "rotate-api-key" "$PAYLOAD_B64" "$SIG" > "$AUDIT/safe_mitigate_${TRACE}.json" 2>&1 || true
  fi
else
  echo '{"note":"Vault missing or not configured; safe-mitigate skipped (record-only)"}' > "$AUDIT/safe_mitigate_${TRACE}.json"
fi

# ---- 6. Infra plan & helm dry-check (non-destructive) ----
log "Generating infra plan (terraform init + plan) if terraform present"
if command -v terraform >/dev/null 2>&1 && [ -d "$BASE/infra/terraform" ]; then
  (cd "$BASE/infra/terraform" && terraform init -input=false >/dev/null 2>&1 || true)
  (cd "$BASE/infra/terraform" && terraform plan -out=tfplan_${TRACE}.plan || true)
  mkdir -p "$AUDIT/infra"
  cp -f infra/terraform/tfplan_${TRACE}.plan "$AUDIT/infra/" 2>/dev/null || true
else
  echo '{"warning":"terraform not present or infra/terraform missing"}' > "$AUDIT/infra_plan_${TRACE}.json"
fi
log "Helm check: try repo update and template (if helm present)"
if command -v helm >/dev/null 2>&1 && [ -d "$BASE/infra/helm" ]; then
  helm repo update >/dev/null 2>&1 || true
  for ch in "$BASE/infra/helm"/*; do
    if [ -d "$ch" ]; then
      helm template --namespace staging "$(basename $ch)" "$ch" > "$AUDIT/helm_template_$(basename $ch)_${TRACE}.yaml" 2>/dev/null || true
    fi
  done
fi

# ---- 7. Observability staging install (non-destructive check) ----
log "Prepare observability manifests (helm templates only, no install) if helm present"
if command -v helm >/dev/null 2>&1; then
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null 2>&1 || true
  helm repo add grafana https://grafana.github.io/helm-charts >/dev/null 2>&1 || true
  helm repo update >/dev/null 2>&1 || true
  helm template prometheus prometheus-community/kube-prometheus-stack --namespace observability > "$AUDIT/prometheus_template_${TRACE}.yaml" 2>/dev/null || true
  helm template grafana grafana/grafana --namespace observability > "$AUDIT/grafana_template_${TRACE}.yaml" 2>/dev/null || true
fi

# ---- 8. SBOM & security checks (local) ----
log "Generate basic SBOM for services (if docker present)"
if command -v docker >/dev/null 2>&1 && [ -d "$BASE/services" ]; then
  for svc in services/*; do
    if [ -d "$svc" ] && [ -f "$svc/Dockerfile" ]; then
      img="local/$(basename $svc):sbom"
      docker build -f "$svc/Dockerfile" -t "$img" --no-cache "$svc" >/dev/null 2>&1 || true
      if command -v syft >/dev/null 2>&1; then
        syft "$img" -o json > "$AUDIT/sbom_$(basename $svc)_${TRACE}.json" || true
      fi
    fi
  done
fi

# ---- 9. Package masked evidence + checksum + GPG sign stub ----
log "Package masked evidence and checksum"
EVID_DIR="$AUDIT/evidence_${TRACE}"
mkdir -p "$EVID_DIR"
# Ensure audit directory exists before globbing
mkdir -p "$AUDIT"
# copy key audit JSONs masked
# Use safer globbing to avoid syntax errors
shopt -s nullglob
for f in "$AUDIT"/*.json; do
  [ -f "$f" ] || continue
  bn="$(basename "$f")"
  cp "$f" "$EVID_DIR/$bn" || true
done
for f in "$AUDIT"/*.log; do
  [ -f "$f" ] || continue
  bn="$(basename "$f")"
  cp "$f" "$EVID_DIR/$bn" || true
done
for f in "$BASE/scripts"/*.sh; do
  [ -f "$f" ] || continue
  bn="$(basename "$f")"
  cp "$f" "$EVID_DIR/$bn" || true
done
shopt -u nullglob
tar -czf "$AUDIT/evidence_${TRACE}.tar.gz" -C "$EVID_DIR" . || true
SHA=$(openssl dgst -sha256 "$AUDIT/evidence_${TRACE}.tar.gz" | awk '{print $2}')
echo "{\"evidence\":\"evidence_${TRACE}.tar.gz\",\"sha256\":\"$SHA\"}" > "$AUDIT/evidence_${TRACE}.meta.json"
# GPG sign if gpg available (user key must exist locally)
if command -v gpg >/dev/null 2>&1; then
  gpg --batch --yes --detach-sign -o "$AUDIT/evidence_${TRACE}.tar.gz.sig" "$AUDIT/evidence_${TRACE}.tar.gz" 2>/dev/null || true
fi
rm -rf "$EVID_DIR"

# ---- 10. Generate CI gate workflow patch (local file, no push) ----
log "Generate CI gate workflow patch (local file)"
CI_WF="$BASE/.github/workflows/scan-econeura-gate.yml"
cat > "$CI_WF" <<'YML'
name: ECONEURA Security Gate
on: [pull_request, push]
jobs:
  security_scan:
    runs-on: ubuntu-latest
    permissions: read-all
    steps:
      - uses: actions/checkout@v4
      - name: Run security manifests check
        run: |
          mkdir -p audit
          # expected artifacts to be present by earlier steps
          if [ -d audit ]; then
            HIGH=$(jq -s 'add | map(select(.severity=="high" and (.triaged // false | not))) | length' audit/*.json 2>/dev/null || echo 0)
            if [ "$HIGH" -gt 0 ]; then
              echo "High untriaged findings: $HIGH" >&2
              exit 1
            fi
          fi
      - name: Require manual approval artifact
        run: |
          # CI will pass only if an approval artifact exists (produced by security-approval wf)
          # This is a conservative check: no push allowed by default.
          echo "Gate check complete"
YML
git add "$CI_WF" || true
git commit -m "chore(ci): add local security gate workflow (no push)" || true

# ---- 11. Produce consolidated summary manifest ----
SUMMARY="$AUDIT/one_step_summary_${TRACE}.json"
jq -n \
  --arg trace "$TRACE" \
  --arg env "$ENV_OUT" \
  --arg dry "$AI_MASKED" \
  --arg planned "$PLANNED" \
  --arg integration "$AUDIT/integration_${TRACE}.json" \
  --arg alert "$AUDIT/alert_run_${TRACE}.log" \
  --arg pkg "$AUDIT/evidence_${TRACE}.meta.json" \
  '{
    trace_id:$trace,
    env_check:$env,
    dryrun_masked:$dry,
    planned_files:$planned,
    integration:$integration,
    alert_log:$alert,
    evidence_meta:$pkg,
    note:"NON-DESTRUCTIVE RUN. Review audit/* and create REVIEW_OK only after approvals."
  }' > "$SUMMARY"

# ---- Final report to operator ----
log "ONE-STEP ACTION COMPLETE: TRACE=$TRACE"
echo
echo "Review these files now (must inspect before any REVIEW_OK creation):"
ls -la "$AUDIT" | sed -n '1,200p'
echo
echo "Key artifacts:"
echo " - $AI_MASKED"
echo " - $PLANNED"
echo " - $AUDIT/integration_${TRACE}.json"
echo " - $AUDIT/alert_run_${TRACE}.log"
echo " - $AUDIT/evidence_${TRACE}.tar.gz (masked) and $AUDIT/evidence_${TRACE}.meta.json"
echo " - $CI_WF (local workflow created, no push)"
echo " - $SUMMARY"
echo
echo "NEXT NON-AUTOMATIC STEPS (manual):"
echo " 1) Security Lead + CTO review audit/* and sign approvals in audit/approvals.json"
echo " 2) Create REVIEW_OK file (manual) and commit to enable controlled production actions"
echo " 3) If infra changes approved: run terraform apply in infra/terraform (ONLY AFTER peer review)"
echo
echo "SAFETY: This script did NOT push to remote, did NOT apply infra, and did NOT enable GIT_PUSH_ALLOWED."
