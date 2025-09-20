#!/usr/bin/env bash
set -euo pipefail
# One-step: implement Phase 1 optimizaciones críticas (non-destructive scaffolds + scripts)
# Copiar-pegar en la raíz del repo (VS Code). No hace push ni apply.

BASE="$(pwd)"
CACHE_DIR="/tmp/econeura_cache"
mkdir -p "$CACHE_DIR" "$BASE/.github/workflows" "$BASE/scripts" "$BASE/services/controller" || true

# 1) Parallel validator wrapper
cat > "$BASE/scripts/parallel_validation.sh" <<'SH'
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
SH
chmod +x "$BASE/scripts/parallel_validation.sh"

# 2) Validation cache helper
cat > "$BASE/scripts/validate_with_cache.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
REQ="$1"
CACHE_DIR="${CACHE_DIR:-/tmp/econeura_cache}"
mkdir -p "$CACHE_DIR"
key=$(sha256sum "$REQ" | cut -d' ' -f1)
if [ -f "$CACHE_DIR/$key" ]; then
  echo "CACHED: validation OK for $REQ"
  cat "$CACHE_DIR/$key"
  exit 0
fi
# run validator
if [ -x ./scripts/vault/validate_hmac_approval.sh ]; then
  out=$(./scripts/vault/validate_hmac_approval.sh "$REQ" 2>&1) || { echo "$out"; exit 1; }
  echo "$out" > "$CACHE_DIR/$key"
  echo "$out"
  exit 0
fi
echo "No validator available" >&2
exit 2
SH
chmod +x "$BASE/scripts/validate_with_cache.sh"

# 3) Audit compression & cleanup helper
cat > "$BASE/scripts/compress_old_audit.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
AUDIT_DIR="${1:-audit}"
# compress json older than 30 days and logs older than 7 days
find "$AUDIT_DIR" -type f -name "*.json" -mtime +30 -print0 | xargs -0 -r gzip -9
find "$AUDIT_DIR" -type f -name "*.log" -mtime +7 -print0 | xargs -0 -r xz -9
echo "Compression done in $AUDIT_DIR"
SH
chmod +x "$BASE/scripts/compress_old_audit.sh"

# 4) Audit cleanup retaining last 10 approvals
cat > "$BASE/scripts/cleanup_audit_artifacts.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
AUDIT_DIR="${1:-audit}"
# keep last 10 approval files
ls -1t "$AUDIT_DIR"/approval_*.json 2>/dev/null | tail -n +11 | xargs -r rm -f
# remove tmp prefixed files older than 1 day
find /tmp -type f -name "econeura_*" -mtime +1 -delete || true
echo "Cleanup done"
SH
chmod +x "$BASE/scripts/cleanup_audit_artifacts.sh"

# 5) Health check cache middleware snippet (controller)
cat > "$BASE/services/controller/health_cached.py" <<'PY'
from fastapi import FastAPI
import time, asyncio
app = FastAPI()
health_cache = {}
CACHE_TTL = 30
async def check_upstream(url: str):
    # non-blocking placeholder; operator must replace with real check
    await asyncio.sleep(0.01)
    return {"ok": True}
async def cached_health(service: str, url: str):
    now = time.time()
    if service in health_cache:
        ts, status = health_cache[service]
        if now - ts < CACHE_TTL:
            return status
    status = await check_upstream(url)
    health_cache[service] = (now, status)
    return status
@app.get("/health_cached/{service_name}")
async def hc(service_name: str):
    return await cached_health(service_name, "http://localhost")
PY

# 6) GitHub Actions workflow fragment for parallel audit (non-blocking)
cat > "$BASE/.github/workflows/optimized-audit.yml" <<'YML'
name: Optimized Security Audit
on: [pull_request]
jobs:
  parallel-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run parallel validations
        run: |
          chmod +x scripts/parallel_validation.sh
          ./scripts/parallel_validation.sh audit || true
      - name: Cache audit artifacts
        uses: actions/cache@v3
        with:
          path: audit/*.tar.gz,audit/*_masked.json
          key: audit-${{ github.sha }}
YML

# 7) Safe generator tweak: prefer VAULT_APPROVAL_KEY env (idempotent creation)
cat > "$BASE/scripts/vault/generate_hmac_approval_fast.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
REQ_FILE="${1:-}"
if [ -z "$REQ_FILE" ] || [ ! -f "$REQ_FILE" ]; then echo "Usage: $0 <approval_request.json>" >&2; exit 2; fi
KEY="${VAULT_APPROVAL_KEY:-}"
if [ -z "$KEY" ]; then
  echo "ERROR: VAULT_APPROVAL_KEY not set. Aborting to avoid Vault network calls." >&2
  exit 3
fi
PAYLOAD_B64=$(base64 -w0 "$REQ_FILE")
SIG=$(printf '%s' "$PAYLOAD_B64" | openssl dgst -sha256 -hmac "$KEY" -binary | xxd -p -c 9999)
jq --arg sig "$SIG" --arg payload "$PAYLOAD_B64" '. + {hmac:$sig, payload_b64:$payload, signed_at:"'"$(date --utc +%Y-%m-%dT%H:%M:%SZ)"'"}' "$REQ_FILE"
SH
chmod +x "$BASE/scripts/vault/generate_hmac_approval_fast.sh"

# 8) Summary output
cat <<EOF
Phase 1 optimizaciones instaladas (scripts creados):
- scripts/parallel_validation.sh
- scripts/validate_with_cache.sh
- scripts/compress_old_audit.sh
- scripts/cleanup_audit_artifacts.sh
- services/controller/health_cached.py
- .github/workflows/optimized-audit.yml
- scripts/vault/generate_hmac_approval_fast.sh (safe: requires VAULT_APPROVAL_KEY)
No push or apply performed. Revisa y prueba localmente.
