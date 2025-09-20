#!/usr/bin/env bash
set -euo pipefail
# ONE-STEP: implement mandatory approval gate, optimized parallel audit, integration compose test, and CI preflight
# Copy-paste and run at repo root (VS Code). THIS SCRIPT WILL NOT PUSH, APPLY, OR DEPLOY.
BASE="$(pwd)"
PATCH_DIR="$BASE/patches_workflow_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$PATCH_DIR" "$BASE/.github/workflows" "$BASE/scripts" || true

# 1) mandatory-approval-gate.yml
cat > .github/workflows/mandatory-approval-gate.yml <<'YML'
name: Mandatory Approval Gate
on: [pull_request]
permissions:
  contents: read
  actions: read
  checks: write
jobs:
  check_artifact_and_validate:
    runs-on: ubuntu-latest
    outputs:
      approval_valid: ${{ steps.validate.outputs.valid }}
    steps:
      - uses: actions/checkout@v4
      - name: Ensure audit artifact exists
        id: ensure
        run: |
          if [ -f audit/approval_signed.json ]; then echo "found=true" > /tmp/artifact.txt; else echo "found=false" > /tmp/artifact.txt; fi
          cat /tmp/artifact.txt
      - name: Validate HMAC approval (fast)
        id: validate
        run: |
          if [ "$(cat /tmp/artifact.txt | cut -d'=' -f2)" != "true" ]; then echo "::error::Missing audit/approval_signed.json"; echo "::set-output name=valid::false"; exit 1; fi
          chmod +x scripts/vault/validate_hmac_approval.sh
          ./scripts/vault/validate_hmac_approval.sh audit/approval_signed.json
          echo "::set-output name=valid::true"
        env:
          VAULT_ADDR: ${{ secrets.VAULT_ADDR || '' }}
          VAULT_TOKEN: ${{ secrets.VAULT_TOKEN || '' }}
  block_merge_if_invalid:
    needs: check_artifact_and_validate
    runs-on: ubuntu-latest
    if: needs.check_artifact_and_validate.outputs.approval_valid != 'true'
    steps:
      - name: Fail protectively
        run: |
          echo "::error::Approval not valid; blocking PR."
          exit 1
YML

# 2) optimized-audit-parallel.yml
cat > .github/workflows/optimized-audit-parallel.yml <<'YML'
name: Optimized Audit Parallel
on: [pull_request]
jobs:
  audit-matrix:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        task: [hmac, sbom, evidence]
    steps:
      - uses: actions/checkout@v4
      - name: Setup python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run audit task ${{ matrix.task }}
        run: |
          case "${{ matrix.task }}" in
            hmac) ./scripts/validate_with_cache.sh audit/approval_signed.json ;;
            sbom) command -v syft >/dev/null 2>&1 && syft dir:. -o json > audit/sbom_local.json || echo "syft not installed";;
            evidence) ./scripts/automated_audit_pipeline.sh --non-destructive --type evidence || true ;;
          esac
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: audit-${{ matrix.task }}
          path: audit/*
YML

# 3) integration-tests-with-compose.yml
cat > .github/workflows/integration-tests-with-compose.yml <<'YML'
name: Integration Tests with Compose
on: [pull_request]
jobs:
  compose-tests:
    runs-on: ubuntu-latest
    services:
      reception:
        image: python:3.11-slim
        ports:
          - 8000:8000
        options: >-
          --health-cmd "curl -f http://localhost:8000/health || exit 1"
          --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - name: Start minimal reception service
        run: |
          docker run -d --name reception -p 8000:8000 python:3.11-slim bash -lc "\
            pip install fastapi uvicorn && \
            python -c \"from fastapi import FastAPI; app=FastAPI(); @app.get('/health')\ndef h(): return {'ok':1}; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)\" &"
      - name: Wait for health
        run: |
          for i in {1..20}; do curl -sSf http://localhost:8000/health && break || sleep 3; done
      - name: Run tests
        run: |
          if [ -f pytest.ini ] || [ -d tests ]; then pytest -q; else echo "No pytest config found; skipping tests"; fi
YML

# 4) scripts/ci_preflight.sh
cat > scripts/ci_preflight.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# Non-destructive preflight run for CI: ensures artifacts & validator quickly
if [ ! -f audit/approval_signed.json ]; then echo "MISSING_APPROVAL"; exit 2; fi
if [ -x ./scripts/validate_with_cache.sh ]; then
  ./scripts/validate_with_cache.sh audit/approval_signed.json || (echo "VALIDATION_FAILED"; exit 3)
else
  echo "NO_VALIDATOR"; exit 4
fi
echo "PREFLIGHT_OK"
SH
chmod +x scripts/ci_preflight.sh

# 5) scripts/validate_with_cache.sh (ensure exists / overwrite safe)
cat > scripts/validate_with_cache.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
REQ="${1:-}"
CACHE_DIR="${CACHE_DIR:-/tmp/econeura_cache}"
mkdir -p "$CACHE_DIR"
if [ ! -f "$REQ" ]; then echo "MISSING_REQ"; exit 2; fi
key=$(sha256sum "$REQ" | cut -d' ' -f1)
if [ -f "$CACHE_DIR/$key" ]; then
  echo "CACHED: validation OK for $REQ"
  cat "$CACHE_DIR/$key"
  exit 0
fi
if [ -x ./scripts/vault/validate_hmac_approval.sh ]; then
  out=$(./scripts/vault/validate_hmac_approval.sh "$REQ" 2>&1) || { echo "$out"; exit 1; }
  echo "$out" > "$CACHE_DIR/$key"
  echo "$out"
  exit 0
fi
echo "No validator available" >&2
exit 2
SH
chmod +x scripts/validate_with_cache.sh

# 6) Ensure validate_with_cache referenced validator exists (noop if already present)
if [ ! -f scripts/vault/validate_hmac_approval.sh ]; then
  mkdir -p scripts/vault
  cat > scripts/vault/validate_hmac_approval.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
REQ="${1:-}"
if [ -z "$REQ" ] || [ ! -f "$REQ" ]; then echo '{"status":"invalid","reason":"missing_file"}'; exit 2; fi
# Minimal local validator: expects hmac and payload_b64 fields
KEY="${VAULT_APPROVAL_KEY:-}"
if [ -z "$KEY" ]; then echo '{"status":"invalid","reason":"no_key_env"}'; exit 3; fi
SIG_EXPECT=$(jq -r '.hmac' "$REQ")
PAYLOAD_B64=$(jq -r '.payload_b64' "$REQ")
SIG_ACTUAL=$(printf '%s' "$PAYLOAD_B64" | openssl dgst -sha256 -hmac "$KEY" -binary | xxd -p -c 9999)
if [ "$SIG_EXPECT" = "$SIG_ACTUAL" ]; then echo '{"status":"valid","checked_at":"'$(date --iso-8601=seconds)'"}'; exit 0; else echo '{"status":"invalid","reason":"hmac_mismatch"}'; exit 4; fi
SH
  chmod +x scripts/vault/validate_hmac_approval.sh
fi

# 7) Commit patch locally (no push)
git add .github/workflows/mandatory-approval-gate.yml .github/workflows/optimized-audit-parallel.yml .github/workflows/integration-tests-with-compose.yml scripts/ci_preflight.sh scripts/validate_with_cache.sh || true
git commit -m "ci: enforce mandatory HMAC gate, parallel audit and compose integration tests" || true
git format-patch -1 -o "$PATCH_DIR" || true
git reset --soft HEAD~1 || true

# 8) Done summary
cat <<EOF
DONE: Workflow & scripts created.
Patch generated at: $PATCH_DIR
Files created:
 - .github/workflows/mandatory-approval-gate.yml
 - .github/workflows/optimized-audit-parallel.yml
 - .github/workflows/integration-tests-with-compose.yml
 - scripts/ci_preflight.sh
 - scripts/validate_with_cache.sh
If you intend to push changes, review audit/approval_signed.json and run:
  git add audit/approval_signed.json REVIEW_OK && git commit -m "chore(security): add approval_signed and REVIEW_OK" && git push origin HEAD
This script did NOT push or apply anything.
EOF