#!/usr/bin/env bash
set -euxo pipefail
export NODE_ENV=test
export PORT_WEB="${PORT_WEB:-3000}"

echo "🚀 Starting WEB bring-up process..."

# Crear directorio de artefactos
mkdir -p .artifacts

# Build de la aplicación web
echo "🔨 Building web application..."
pnpm --filter apps/web build

# Arranque de la aplicación web
echo "🚀 Starting web server..."
pnpm --filter apps/web start -- -p ${PORT_WEB} > .artifacts/web.log 2>&1 &
WEB_PID=$!
echo "Web started with PID: $WEB_PID"

# Esperar a que la web esté lista
echo "⏳ Waiting for web to be ready at http://127.0.0.1:${PORT_WEB}..."
npx wait-on -t 90000 "http://127.0.0.1:${PORT_WEB}" || {
  echo "❌ Web failed to start within timeout"
  echo "📋 Web logs:"
  cat .artifacts/web.log || echo "No logs available"
  exit 1
}

echo "✅ Web is ready and responding"
