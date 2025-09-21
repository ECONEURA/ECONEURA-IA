#!/usr/bin/env bash
set -euo pipefail
# ECONEURA: HMAC Approval + Vault helpers + Canary Promotion API + FinOps Guard (NON-DESTRUCTIVE)
# Single copy/paste. DOES NOT push, DOES NOT apply infra, DOES NOT expose secrets.
BASE="$(pwd)"
AUDIT="$BASE/audit"
TRACE="$(date --utc +%Y%m%dT%H%M%SZ)-$RANDOM"
BRANCH="econeura/audit/hmac-canary/${TRACE}"
PATCH_DIR="$BASE/patches_${TRACE}"
mkdir -p "$AUDIT" "$PATCH_DIR" services/controller scripts ci .github/workflows infra docs

log(){ printf "%s %s\n" "$(date --iso-8601=seconds)" "$*"; }
mask(){ sed -E -e 's/[[:alnum:]]{32,}/<REDACTED>/g' -e 's/AKIA[0-9A-Z]{8,}/<REDACTED_AKIA>/g' -e 's/tok_live_[A-Za-z0-9_\-]{8,}/<REDACTED_TOKEN>/g' -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/<REDACTED_EMAIL>/g' "$1" > "$2" || cp "$1" "$2"; }

# Preflight basics
for c in git jq python3; do
  if ! command -v "$c" >/dev/null 2>&1; then log "WARN: $c not found - some steps will be skipped"; fi
done

# -------------------------
# 1) Controller stub: Canary promote endpoint + rollback endpoint (FastAPI)
# -------------------------
cat > services/controller/main.py <<'PY'
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import threading, time, logging, json, os

app = FastAPI(title="econeura-controller")
LOG = os.environ.get("CONTROLLER_LOG", "/tmp/econeura_controller.log")
logging.basicConfig(filename=LOG, level=logging.INFO)

# In-memory registry (replace with Postgres in prod)
MODEL_REGISTRY = {}
CANARY_STATE = {}

class PromoteRequest(BaseModel):
    model_id: str
    version: str
    canary_percent: int
    reason: str

@app.post("/v1/models/register")
async def register_model(payload: dict):
    model_id = payload.get("model_id")
    MODEL_REGISTRY.setdefault(model_id, []).append(payload)
    logging.info(f"model_registered:{model_id}")
    return {"status":"ok","model_id":model_id}

@app.post("/v1/models/promote")
async def promote(req: PromoteRequest):
    # Non-destructive preview: writes canary intent to state (no deploy)
    trace = f"{req.model_id}:{req.version}"
    CANARY_STATE[trace] = {"canary_percent": req.canary_percent, "status":"pending", "started_at": time.time()}
    logging.info(f"canary_preview:{trace}:{req.canary_percent}")
    return {"status":"canary_preview_created","trace":trace}

@app.post("/v1/models/rollback")
async def rollback(payload: dict):
    trace = payload.get("trace")
    if trace in CANARY_STATE:
        CANARY_STATE[trace]["status"] = "rolled_back"
        logging.info(f"rollback_executed:{trace}")
        return {"status":"rolled_back","trace":trace}
    raise HTTPException(status_code=404, detail="trace not found")

@app.get("/v1/canary_state")
async def canary_state():
    return CANARY_STATE

@app.get("/health")
def health():
    return {"service":"controller","status":"ok"}
PY

cat > services/controller/requirements.txt <<'TXT'
fastapi
uvicorn[standard]
pydantic
python-dotenv
TXT

# -------------------------
# 2) Vault HMAC helper scripts (generate + validate) - record-only: no secrets in repo
# -------------------------
mkdir -p scripts/vault
cat > scripts/vault/generate_hmac_approval.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# Usage: ./generate_hmac_approval.sh audit/approval_request.json > approval_signed.json
REQ_FILE="${1:-audit/approval_request.json}"
if [ ! -f "$REQ_FILE" ]; then echo "Missing request file: $REQ_FILE" >&2; exit 2; fi
PAYLOAD_B64=$(base64 -w0 "$REQ_FILE")
# fetch key from Vault (operator should set VAULT_ADDR and VAULT_TOKEN), fallback to prompt
if command -v vault >/dev/null 2>&1 && [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
  KEY=$(vault kv get -field=value secret/econeura/approval_key 2>/dev/null || echo "")
fi
if [ -z "${KEY:-}" ]; then
  read -s -p "Enter HMAC key (hex): " KEY
  echo
fi
SIG=$(python3 -c "import hmac, hashlib, base64; print(hmac.new(bytes.fromhex('$KEY'), '$PAYLOAD_B64'.encode(), hashlib.sha256).hexdigest())")
jq --arg sig "$SIG" --arg payload "$PAYLOAD_B64" '. + {hmac:$sig, payload_b64:$payload, signed_at:"'"$(date --iso-8601=seconds)"'"}' "$REQ_FILE"
SH
chmod +x scripts/vault/generate_hmac_approval.sh

cat > scripts/vault/validate_hmac_approval.sh <<'SH'
#!/usr/bin/env bash
# Usage: ./validate_hmac_approval.sh audit/approval_request.signed.json
REQ="${1:-}"
if [ -z "$REQ" ] || [ ! -f "$REQ" ]; then echo "Signed approval file required"; exit 2; fi
KEY="${VAULT_APPROVAL_KEY:-}"
if [ -z "$KEY" ]; then
  # try Vault
  if command -v vault >/dev/null 2>&1 && [ -n "${VAULT_ADDR:-}" ] && [ -n "${VAULT_TOKEN:-}" ]; then
    KEY=$(vault kv get -field=value secret/econeura/approval_key 2>/dev/null || echo "")
  fi
fi
if [ -z "$KEY" ]; then echo "No key available in env VAULT_APPROVAL_KEY or Vault"; exit 3; fi
SIG_EXPECT=$(jq -r '.hmac' "$REQ")
PAYLOAD_B64=$(jq -r '.payload_b64' "$REQ")
SIG_ACTUAL=$(python3 -c "import hmac, hashlib; print(hmac.new(bytes.fromhex('$KEY'), '$PAYLOAD_B64'.encode(), hashlib.sha256).hexdigest())")
if [ "$SIG_EXPECT" = "$SIG_ACTUAL" ]; then echo '{"status":"valid","checked_at":"'"$(date --iso-8601=seconds)"'"}'; exit 0; else echo '{"status":"invalid"}'; exit 4; fi
SH
chmod +x scripts/vault/validate_hmac_approval.sh

# -------------------------
# 3) CI workflow snippet to validate HMAC approval (local file created)
# -------------------------
mkdir -p .github/workflows
cat > .github/workflows/approval_gate.yml <<'YML'
name: Approval Gate (HMAC)
on: [pull_request]
jobs:
  validate_approval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check approval artifact
        run: |
          if [ ! -f audit/approval_request_*.json ]; then echo "No approval_request found" >&2; exit 1; fi
          # CI must fetch key from Vault (set VAULT_ADDR & VAULT_TOKEN in GitHub Secrets) and run validation script
          echo "Approval artifact present. Manual validation required."
YML

# -------------------------
# 4) FinOps guard middleware snippet (Python/ASGI) - integrate into services
# -------------------------
mkdir -p services/middleware
cat > services/middleware/finops_guard.py <<'PY'
# FinOps guard middleware (ASGI) - integrate into FastAPI apps
import time
from prometheus_client import Counter, Gauge
requests_total = Counter('econeura_requests_total','Total requests', ['agent','tenant'])
cost_gauge = Gauge('econeura_cost_estimate_usd','Estimated cost USD', ['tenant'])
# simple in-memory tenant caps (replace with persistent store)
TENANT_CAPS = {}  # tenant_id -> {'monthly_cap_usd':100.0,'used_usd':0.0}
def estimate_cost(request):
    # placeholder: estimate cost per request based on model_id header or route
    model = request.headers.get('X-Model-Id','default')
    return 0.01 if 'small' in model else 0.05
class FinOpsGuardMiddleware:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return
        tenant = None
        for h in scope.get('headers',[]):
            if h[0].decode().lower() == 'x-tenant-id':
                tenant = h[1].decode()
        cost = estimate_cost(scope)
        if tenant:
            cap = TENANT_CAPS.get(tenant, {'monthly_cap_usd':100.0,'used_usd':0.0})
            if cap['used_usd'] + cost > cap['monthly_cap_usd']:
                # throttle or respond with 429
                async def _send(resp):
                    await send({'type':'http.response.start','status':429,'headers':[(b'content-type',b'application/json')]})
                    await send({'type':'http.response.body','body':b'{"error":"quota_exceeded"}'})
                await _send(None)
                return
            else:
                cap['used_usd'] += cost
                TENANT_CAPS[tenant] = cap
                cost_gauge.labels(tenant=tenant).set(cap['used_usd'])
        await self.app(scope, receive, send)
PY

# -------------------------
# 5) Canary monitor worker stub (non-destructive)
# -------------------------
cat > services/controller/canary_monitor.py <<'PY'
# Canary monitor skeleton: polls canary_state and triggers rollback if SLO breached
import time, logging, os
LOG = os.environ.get("CONTROLLER_LOG","/tmp/econeura_controller.log")
logging.basicConfig(filename=LOG, level=logging.INFO)
def check_loop():
    while True:
        # placeholder: load canary state file or query controller; evaluate metrics
        # if breach detected: call controller rollback endpoint
        time.sleep(30)
if __name__ == "__main__":
    check_loop()
PY

# -------------------------
# 6) Create approval request and masked evidence sample
# -------------------------
APP_REQ="$AUDIT/approval_request_${TRACE}.json"
jq -n --arg trace "$TRACE" --arg time "$(date --iso-8601=seconds)" '{trace_id:$trace, action:"promote_models_and_apply_infra", created_at:$time, note:"Security lead must sign HMAC/GPG"}' > "$APP_REQ"
mask "$APP_REQ" "$AUDIT/approval_request_${TRACE}_masked.json"
# create small evidence meta
echo "{\"trace\":\"$TRACE\",\"created\":\"$(date --iso-8601=seconds)\"}" > "$AUDIT/evidence_${TRACE}.meta.json"

# -------------------------
# 7) Create local audit branch + patch (no push)
# -------------------------
git add services scripts .github audit || true
git commit -m "chore(sec): HMAC approval + canary stubs + FinOps guard (${TRACE})" || true
git checkout -b "$BRANCH"
git format-patch -1 -o "$PATCH_DIR" HEAD || true
git reset --soft HEAD~1 || true

# -------------------------
# 8) Final masked manifest for review
# -------------------------
jq -n --arg trace "$TRACE" --arg branch "$BRANCH" --arg patch "$(ls $PATCH_DIR/*.patch 2>/dev/null | head -n1 || '')" --arg evidence "$AUDIT/evidence_${TRACE}.meta.json" \
  '{trace_id:$trace, branch:$branch, patch:$patch, evidence_meta:$evidence, note:"Review approval_request_* and final_manifest before any push/apply."}' \
  > "$AUDIT/final_manifest_${TRACE}.json"
mask "$AUDIT/final_manifest_${TRACE}.json" "$AUDIT/final_manifest_${TRACE}_masked.json"

# -------------------------
# 9) Summary & next steps
# -------------------------
log "DONE - HMAC approval + Vault helpers + Canary API + FinOps guard scaffold created"
echo ""
echo "Trace: $TRACE"
echo "Audit artifacts (masked) at: $AUDIT"
ls -la "$AUDIT" | sed -n '1,200p'
echo ""
echo "Patch(s) for PR (manual push only): $PATCH_DIR"
ls -la "$PATCH_DIR" | sed -n '1,200p'
echo ""
echo "MANDATORY HUMAN STEPS (BEFORE ANY PRODUCTION ACTION):"
echo " 1) Security Lead reviews $AUDIT/final_manifest_${TRACE}_masked.json"
echo " 2) Security Lead generates signed approval with scripts/vault/generate_hmac_approval.sh"
echo " 3) Operator validates signature with scripts/vault/validate_hmac_approval.sh"
echo " 4) If valid, create REVIEW_OK (manual) and push branch + open PR with patch files for peer review"
echo ""
echo "This script made NO remote changes, NO terraform apply, NO kubectl apply, NO git push."
exit 0
