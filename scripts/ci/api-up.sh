#!/bin/bash
# Script para arrancar la API en CI

set -euo pipefail

echo "=== Iniciando API para CI ==="

# Cargar variables de entorno
source scripts/ci/api-env.sh

echo "📦 Instalando dependencias..."
pnpm -w install --frozen-lockfile

echo "🔨 Construyendo API..."
pnpm --filter @econeura/api build

echo "🚀 Iniciando servidor API..."
pnpm --filter @econeura/api dev &
API_PID=$!

echo "⏱️ Esperando que la API esté lista..."
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null 2>&1; then
    echo "✅ API está lista en puerto $PORT"
    exit 0
  fi
  echo "Intento $i/30 - esperando..."
  sleep 3
done

echo "❌ Timeout: API no arrancó en 90 segundos"
kill $API_PID 2>/dev/null || true
exit 1
