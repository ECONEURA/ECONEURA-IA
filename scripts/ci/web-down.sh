#!/usr/bin/env bash
set -euo pipefail

echo "🛑 Stopping WEB processes..."

# Matar procesos de la web
pkill -f "apps/web" || echo "No web processes found"
pkill -f "next.*start" || echo "No Next.js processes found"

# Esperar un momento para que los procesos terminen
sleep 2

# Verificar que no queden procesos
if pgrep -f "apps/web" > /dev/null; then
  echo "⚠️ Some web processes still running, force killing..."
  pkill -9 -f "apps/web" || true
fi

echo "✅ Web teardown completed"
