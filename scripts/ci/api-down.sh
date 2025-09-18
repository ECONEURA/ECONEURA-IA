#!/usr/bin/env bash
set -euo pipefail

echo "🛑 Stopping API processes..."

# Matar procesos de la API
pkill -f "apps/api" || echo "No API processes found"
pkill -f "node.*dist/index.js" || echo "No Node API processes found"
pkill -f "ts-node.*src/index.ts" || echo "No TS-Node API processes found"

# Esperar un momento para que los procesos terminen
sleep 2

# Verificar que no queden procesos
if pgrep -f "apps/api" > /dev/null; then
  echo "⚠️ Some API processes still running, force killing..."
  pkill -9 -f "apps/api" || true
fi

echo "✅ API teardown completed"
