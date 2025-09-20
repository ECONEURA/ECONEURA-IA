#!/usr/bin/env bash
set -euo pipefail
BASE="$(pwd)"
AUDIT="$BASE/audit"
TRACE="$(date --utc +%Y%m%dT%H%M%SZ)-$RANDOM"
BRANCH="econeura/section1-implement/${TRACE}"
PATCH_DIR="$BASE/patches_${TRACE}"
mkdir -p "$AUDIT" "$PATCH_DIR" services/neuras make_templates infra ci .github/workflows

log(){ printf "%s %s\n" "$(date --iso-8601=seconds)" "$*"; }
mask(){ sed -E -e 's/[[:alnum:]]{32,}/<REDACTED>/g' -e 's/AKIA[0-9A-Z]{8,}/<REDACTED_AKIA>/g' -e 's/tok_live_[A-Za-z0-9_\-]{8,}/<REDACTED_TOKEN>/g' -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/<REDACTED_EMAIL>/g' "$1" > "$2" || cp "$1" "$2"; }
require(){ command -v "$1" >/dev/null 2>&1 || { echo "Missing required: $1"; exit 2; } || true; }

# 0. Preflight critical tools (non-fatal warning)
echo "Preflight tools:"
for t in git jq openssl; do
  if command -v $t >/dev/null 2>&1; then echo "  OK: $t"; else echo "  MISSING (required later): $t"; fi
done
for opt in docker syft trivy snyk terraform helm gpg; do
  if command -v $opt >/dev/null 2>&1; then echo "  OPT: $opt"; else echo "  OPT missing: $opt (will skip related steps)"; fi
done

# 1. Create concrete Neura stubs (10 services) with health & OpenAPI contract
echo "Generating 10 Neura stubs..."
for name in reception cfo cmo ciso cto cdo chro legal support analytics research; do
  svc_dir="services/neuras/${name}"
  mkdir -p "$svc_dir"
  cat > "$svc_dir/app.py" <<PY
from fastapi import FastAPI, Request
app = FastAPI(title="neura-${name}")
@app.get("/health")
def health():
    return {"service":"neura-${name}","status":"ok"}
@app.post("/v1/task")
async def task(req: Request):
    payload = await req.json()
    # placeholder: validate contract keys
    return {"status":"accepted","agent":"neura-${name}","task_id":payload.get("task_id")}
PY
  cat > "$svc_dir/openapi.yaml" <<YAML
openapi: "3.0.0"
info:
  title: "Neura ${name} API"
  version: "0.1.0"
paths:
  /v1/task:
    post:
      summary: "Submit task to neura-${name}"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                task_id: { type: string }
                tenant_id: { type: string }
                input: { type: object }
              required: [task_id, tenant_id, input]
      responses:
        "200":
          description: "accepted"
YAML
done

# 2. Make Adapter skeleton + 50 scenario templates (non-sensitive)
echo "Generating Make Adapter and 50 scenario templates..."
mkdir -p services/make_adapter scenarios
cat > services/make_adapter/app.py <<PY
from fastapi import FastAPI, Request, Header, HTTPException
import hmac, hashlib, os
app = FastAPI(title="make-adapter")
VAULT_TOKEN = os.environ.get("VAULT_TOKEN","")
# Replace with real Vault retrieval in production
SCENARIOS = {}
@app.post("/register_scenario")
async def register(req: Request):
    body = await req.json()
    scenario_id = body.get("scenario_id")
    SCENARIOS[scenario_id] = body
    return {"status":"ok","scenario_id":scenario_id}
@app.post("/trigger")
async def trigger(req: Request, x_signature: str = Header(None)):
    payload = await req.json()
    # verify signature placeholder
    return {"status":"triggered","payload":payload}
PY

for i in $(seq 1 50); do
  sid="scenario_${i}"
  cat > "scenarios/${sid}.json" <<JSON
{"scenario_id":"${sid}","make_webhook":"https://hook.make.example/${sid}","description":"Template scenario ${i}","auth":"vault:make_token_${i}"}
JSON
done

# 3. CI gating workflow stub with HMAC approval artifact concept
echo "Generating CI gate workflow stub (.github/workflows/hmac_gate.yml)"
mkdir -p .github/workflows
cat > .github/workflows/hmac_gate.yml <<YML
name: ECONEURA HMAC Approval Gate
on: [pull_request]
jobs:
  security_gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate audit artifacts presence
        run: |
          if [ ! -d audit ]; then echo "Missing audit artifacts" >&2; exit 1; fi
      - name: Check HMAC approval artifact
        run: |
          if [ ! -f audit/approval_artifact.json ]; then echo "Approval artifact missing - manual sign required" >&2; exit 1; fi
YML

# 4. Approval artifact template (to be signed by Security Lead)
echo "Creating approval request template (audit/approval_request_${TRACE}.json)"
mkdir -p audit
cat > audit/approval_request_${TRACE}.json <<JSON
{
  "trace":"${TRACE}",
  "action":"promote_models_and_apply_infra",
  "required":"HMAC or GPG signature by Security Lead",
  "details":"Review audit/final_manifest_${TRACE}_masked.json and evidence",
  "timestamp":"$(date --iso-8601=seconds)"
}
JSON
mask audit/approval_request_${TRACE}.json audit/approval_request_${TRACE}_masked.json

# 5. Generate ML retrain trigger test & make adapter test scripts
cat > scripts/test_retrain_trigger.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
python3 -c "from ml.training.train import train_model; print(train_model(version='test-0'))"
SH
chmod +x scripts/test_retrain_trigger.sh

cat > scripts/test_make_adapter.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
python3 - <<PY
import requests, json
print("Make adapter test placeholder - ensure services/make_adapter running")
PY
SH
chmod +x scripts/test_make_adapter.sh

# 6. Run lightweight validation: linters/tests if present, ML smoke, collect outputs
echo "Running lightweight validation tasks (non-destructive)..."
if [ -x scripts/run_tests.sh ]; then
  bash scripts/run_tests.sh 2>&1 | tee "$AUDIT/run_tests_${TRACE}.log" || true
fi
if [ -f ml/training/train.py ]; then
  python3 ml/training/train.py 2>&1 | tee "$AUDIT/ml_train_${TRACE}.log" || true
fi
# collect planned (ai) if exists
if [ -x ./ai.sh ]; then
  ./ai.sh --dry-run > "$AUDIT/ai_planned_${TRACE}.raw" 2>&1 || true
  mask "$AUDIT/ai_planned_${TRACE}.raw" "$AUDIT/ai_planned_${TRACE}_masked.json"
fi

# 7. Package masked evidence (select key artifacts) and create audit branch + patch
echo "Packaging evidence and creating local audit branch + patch"
EVID_TMP="$AUDIT/evidence_tmp_${TRACE}"
mkdir -p "$EVID_TMP"
for f in audit/*.json audit/*.log services/neuras/*/openapi.yaml services/make_adapter/* scripts/*.sh .github/workflows/hmac_gate.yml; do
  [ -f "$f" ] || continue
  bn="$(basename "$f")"
  mask "$f" "$EVID_TMP/$bn"
done
tar -czf "$AUDIT/evidence_${TRACE}.tar.gz" -C "$EVID_TMP" . || true
EVID_SHA=$(python3 -c "import hashlib; import sys; print(hashlib.sha256(open(sys.argv[1], 'rb').read()).hexdigest())" "$AUDIT/evidence_${TRACE}.tar.gz")
echo "{\"evidence\":\"evidence_${TRACE}.tar.gz\",\"sha256\":\"$EVID_SHA\"}" > "$AUDIT/evidence_${TRACE}.meta.json"
rm -rf "$EVID_TMP"

# create branch and patch (no push)
git add services scenarios scripts .github audit || true
git commit -m "feat(section1): neuras + make adapter + approval artifact (${TRACE})" || true
git checkout -b "$BRANCH"
git format-patch -1 -o "$PATCH_DIR" HEAD || true
git reset --soft HEAD~1 || true

# 8. Final masked manifest for Security Lead review
jq -n --arg trace "$TRACE" --arg branch "$BRANCH" --arg patch "$(ls $PATCH_DIR/*.patch 2>/dev/null | head -n1 || '')" --arg evidence "$AUDIT/evidence_${TRACE}.meta.json" \
  '{trace_id:$trace, branch:$branch, patch:$patch, evidence_meta:$evidence, note:"Review required: Security Lead must sign approval artifact (audit/approval_request_*.json) before any push/apply."}' > "$AUDIT/final_manifest_${TRACE}.json"
mask "$AUDIT/final_manifest_${TRACE}.json" "$AUDIT/final_manifest_${TRACE}_masked.json"

# Summary to operator
log "DONE - Section1 alignment scaffolded with 10 Neuras + 50 Make templates"
echo "Trace: $TRACE"
echo "Audit artifacts: ls -la $AUDIT"
ls -la "$AUDIT" | sed -n '1,200p'
echo ""
echo "Patch directory (for manual PR): $PATCH_DIR"
ls -la "$PATCH_DIR" | sed -n '1,200p'
echo ""
echo "HUMAN NEXT STEPS (must do BEFORE any production action):"
echo " 1) Security Lead review $AUDIT/final_manifest_${TRACE}_masked.json and evidence file."
echo " 2) Security Lead signs approval by creating HMAC/GPG signature referenced in audit/approvals.json."
echo " 3) After approval, operator may push branch $BRANCH and open PR using patch file(s) in $PATCH_DIR (manual)."
echo ""
exit 0