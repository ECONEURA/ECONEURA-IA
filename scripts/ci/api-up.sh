#!/usr/bin/env bash
set -euxo pipefail
source scripts/ci/api-env.sh

echo "🚀 Starting API bring-up process..."

# Crear directorio de artefactos
mkdir -p .artifacts

# Verificar que Postgres esté listo
echo "⏳ Waiting for Postgres to be ready..."
until pg_isready -h 127.0.0.1 -p 5432 -U ci; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done
echo "✅ Postgres is ready"

# Migraciones y seed (tolera Drizzle o Prisma)
echo "📦 Running database migrations..."
pnpm --filter apps/api db:migrate || pnpm --filter apps/api prisma migrate deploy || echo "⚠️ Migration failed, continuing..."

echo "🌱 Seeding database..."
pnpm --filter apps/api db:seed || echo "⚠️ Seeding failed, continuing..."

# Build de la aplicación
echo "🔨 Building application..."
pnpm --filter apps/api build || echo "⚠️ Build failed, trying to run directly..."

# Arranque de la API
echo "🚀 Starting API server..."
pnpm --filter apps/api start:test > .artifacts/api.log 2>&1 &
API_PID=$!
echo "API started with PID: $API_PID"

# Esperar a que la API esté lista
echo "⏳ Waiting for API to be ready at http://127.0.0.1:${PORT}${HEALTH_PATH}..."
npx wait-on -t 90000 "http://127.0.0.1:${PORT}${HEALTH_PATH}" || {
  echo "❌ API failed to start within timeout"
  echo "📋 API logs:"
  cat .artifacts/api.log || echo "No logs available"
  exit 1
}

echo "✅ API is ready and responding"
