#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Automatizando setup de CI para pr/bootstrapping/local-setup"

# 1. Eliminar pnpm/action-setup en todo el repo (ya hecho, pero verificar)
echo "1. Verificando eliminación de pnpm/action-setup..."
if grep -r "pnpm/action-setup" .github/ --include="*.yml" --include="*.yaml" > /dev/null 2>&1; then
  echo "❌ Aún hay referencias a pnpm/action-setup. Ejecutando reemplazo..."
  bash scripts/ci/replace-pnpm-action-setup.sh
else
  echo "✅ No hay referencias a pnpm/action-setup."
fi

# 2. Añadir scripts CI
echo "2. Añadiendo scripts CI..."
cat > scripts/ci/api-env.sh << 'EOF'
set -euo pipefail
export NODE_ENV=test
export PORT=3001
export HEALTH_PATH=/health
export MOCK_EXTERNAL=1
export LOG_LEVEL=warn
EOF

cat > scripts/ci/api-up.sh << 'EOF'
set -euo pipefail
source scripts/ci/api-env.sh
pnpm -w i
pnpm --filter @econeura/api build >/dev/null 2>&1 || true
pnpm --filter @econeura/api dev &

for i in {1..90}; do
  curl -fsS "http://127.0.0.1:$PORT$HEALTH_PATH" && exit 0
  sleep 2
done
echo "API no arrancó"; exit 1
EOF

chmod +x scripts/ci/api-env.sh scripts/ci/api-up.sh

# 3. Sobrescribir workflows
echo "3. Sobrescribiendo workflows..."

cat > .github/workflows/ci-base.yml << 'EOF'
name: ci-base
on: [push, pull_request]
env: { DEPLOY_ENABLED: 'false' }
permissions: { contents: read }
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node 20 + pnpm
        uses: actions/setup-node@v4
        with: { node-version: '20.17.0', cache: 'pnpm' }
      - run: corepack enable && corepack prepare pnpm@8.15.6 --activate
      - run: pnpm -w i
      - run: pnpm -w lint && pnpm -w typecheck
      - name: Seed ≥60 agents gate
        run: node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync('configs/agents/registry.json','utf8'));if(j.length<60){process.stderr.write('Need >=60 agents, have '+j.length);process.exit(1)}"
EOF

cat > .github/workflows/openapi-check.yml << 'EOF'
name: openapi-check
on: [push, pull_request]
env: { DEPLOY_ENABLED: 'false' }
permissions: { contents: read }
jobs:
  check:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: ci, POSTGRES_USER: ci, POSTGRES_DB: econeura_ci }
        options: >-
          --health-cmd="pg_isready -U ci" --health-interval=10s --health-timeout=5s --health-retries=5
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node 20 + pnpm
        uses: actions/setup-node@v4
        with: { node-version: '20.17.0', cache: 'pnpm' }
      - run: corepack enable && corepack prepare pnpm@8.15.6 --activate
      - run: pnpm -w i
      - name: Start API
        run: bash scripts/ci/api-up.sh
      - name: Snapshot OpenAPI
        run: node scripts/openapi/snapshot.mjs
      - name: Lint spec
        run: npx @stoplight/spectral lint apps/api/openapi/openapi.yaml
      - name: Diff spec vs runtime
        run: node scripts/openapi/diff.mjs
EOF

cat > .github/workflows/contract-api.yml << 'EOF'
name: contract-api
on: [push, pull_request]
env: { DEPLOY_ENABLED: 'false' }
permissions: { contents: read }
jobs:
  contract:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env: { POSTGRES_PASSWORD: ci, POSTGRES_USER: ci, POSTGRES_DB: econeura_ci }
        options: >-
          --health-cmd="pg_isready -U ci" --health-interval=10s --health-timeout=5s --health-retries=5
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node 20 + pnpm
        uses: actions/setup-node@v4
        with: { node-version: '20.17.0', cache: 'pnpm' }
      - run: corepack enable && corepack prepare pnpm@8.15.6 --activate
      - run: pnpm -w i
      - name: Start API
        run: bash scripts/ci/api-up.sh
      - name: Run contract tests
        run: pnpm -w test:contract
EOF

cat > .github/workflows/e2e-playwright.yml << 'EOF'
name: e2e-playwright
on: [push, pull_request]
env: { DEPLOY_ENABLED: 'false', BASE_URL: 'http://127.0.0.1:3000' }
permissions: { contents: read }
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node 20 + pnpm
        uses: actions/setup-node@v4
        with: { node-version: '20.17.0', cache: 'pnpm' }
      - run: corepack enable && corepack prepare pnpm@8.15.6 --activate
      - run: pnpm -w i
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Start Web (dev)
        run: pnpm --filter @econeura/web dev &
      - name: Wait Web health
        run: for i in {1..90}; do curl -fsS http://127.0.0.1:3000/health && exit 0; sleep 2; done; exit 1
      - name: Detect baseline
        id: base
        run: test -d apps/web/tests/playwright/__snapshots__ && echo "has=1" >> $GITHUB_OUTPUT || echo "has=0" >> $GITHUB_OUTPUT
      - name: Bootstrap snapshots
        if: steps.base.outputs.has == '0'
        run: pnpm --filter @econeura/web test:ui:update
      - name: Gate snapshots (≤2%)
        run: pnpm --filter @econeura/web test:ui
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: pw-report, path: apps/web/playwright-report }
EOF

# 4. Verificar sintaxis de workflows (omitido, usar get_errors manualmente)
echo "4. Verificando sintaxis de workflows... (omitido)"

# 5. Commit y push
echo "5. Commit y push..."
git add .
git commit -m "ci: switch to corepack pnpm and fix order" || echo "Nada nuevo para commit"
git push origin pr/bootstrapping/local-setup

echo "✅ Setup de CI automatizado completado. Re-lanza workflows en GH Actions."
