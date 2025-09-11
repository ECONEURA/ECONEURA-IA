#!/usr/bin/env bash
set -euxo pipefail
source scripts/ci/api-env.sh
# Migraciones y seed (tolera Drizzle o Prisma)
pnpm --filter apps/api db:migrate || pnpm --filter apps/api prisma migrate deploy || true
pnpm --filter apps/api db:seed || true
# Arranque (TS o JS) y espera de health
pnpm --filter apps/api build || true
pnpm --filter apps/api start:test > .artifacts/api.log 2>&1 &
npx wait-on -t 90000 "http://127.0.0.1:${PORT}${HEALTH_PATH}"
