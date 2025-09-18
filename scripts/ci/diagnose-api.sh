#!/usr/bin/env bash
set -euo pipefail

echo "🔍 API TESTS DIAGNOSTIC TOOL"
echo "=============================="

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar si un puerto está en uso
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Función para verificar si un servicio está corriendo
service_running() {
    pgrep -f "$1" >/dev/null 2>&1
}

echo "📋 SYSTEM CHECK:"
echo "----------------"

# Verificar Node.js
if command_exists node; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js: NOT FOUND"
fi

# Verificar pnpm
if command_exists pnpm; then
    echo "✅ pnpm: $(pnpm --version)"
else
    echo "❌ pnpm: NOT FOUND"
fi

# Verificar Postgres client
if command_exists pg_isready; then
    echo "✅ Postgres client: AVAILABLE"
else
    echo "❌ Postgres client: NOT FOUND"
fi

# Verificar wait-on
if command_exists npx; then
    echo "✅ npx: AVAILABLE"
else
    echo "❌ npx: NOT FOUND"
fi

echo ""
echo "🌐 NETWORK CHECK:"
echo "-----------------"

# Verificar puerto 3001
if port_in_use 3001; then
    echo "⚠️  Port 3001: IN USE"
    echo "   Processes using port 3001:"
    lsof -i :3001 || echo "   (lsof not available)"
else
    echo "✅ Port 3001: AVAILABLE"
fi

# Verificar puerto 5432 (Postgres)
if port_in_use 5432; then
    echo "✅ Port 5432: IN USE (Postgres expected)"
else
    echo "❌ Port 5432: NOT IN USE (Postgres not running)"
fi

echo ""
echo "🗄️  DATABASE CHECK:"
echo "------------------"

# Verificar conexión a Postgres
if command_exists pg_isready; then
    if pg_isready -h 127.0.0.1 -p 5432 -U ci; then
        echo "✅ Postgres: READY"
    else
        echo "❌ Postgres: NOT READY"
    fi
else
    echo "⚠️  Postgres: Cannot check (pg_isready not available)"
fi

echo ""
echo "🚀 API PROCESS CHECK:"
echo "--------------------"

# Verificar procesos de API
if service_running "apps/api"; then
    echo "✅ API Process: RUNNING"
    echo "   API processes:"
    pgrep -f "apps/api" | while read pid; do
        echo "   - PID $pid: $(ps -p $pid -o comm= 2>/dev/null || echo 'unknown')"
    done
else
    echo "❌ API Process: NOT RUNNING"
fi

echo ""
echo "📁 FILE CHECK:"
echo "--------------"

# Verificar archivos críticos
files=(
    "scripts/ci/api-env.sh"
    "scripts/ci/api-up.sh"
    "scripts/ci/api-down.sh"
    "apps/api/package.json"
    "apps/api/vitest.e2e.config.ts"
    "apps/api/tests/setup-e2e.ts"
    "apps/api/tests/e2e/health.e2e.test.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file: EXISTS"
    else
        echo "❌ $file: MISSING"
    fi
done

echo ""
echo "🔧 ENVIRONMENT CHECK:"
echo "--------------------"

# Verificar variables de entorno
env_vars=(
    "NODE_ENV"
    "PORT"
    "DATABASE_URL"
    "MOCK_EXTERNAL"
    "BASE_URL"
    "HEALTH_PATH"
)

for var in "${env_vars[@]}"; do
    if [ -n "${!var:-}" ]; then
        echo "✅ $var: ${!var}"
    else
        echo "⚠️  $var: NOT SET"
    fi
done

echo ""
echo "📊 RECOMMENDATIONS:"
echo "------------------"

# Recomendaciones basadas en los checks
if ! command_exists node; then
    echo "❌ Install Node.js 20.x"
fi

if ! command_exists pnpm; then
    echo "❌ Install pnpm 8.x"
fi

if ! command_exists pg_isready; then
    echo "❌ Install postgresql-client"
fi

if port_in_use 3001; then
    echo "⚠️  Kill processes using port 3001 or change PORT"
fi

if ! port_in_use 5432; then
    echo "❌ Start Postgres service"
fi

if ! service_running "apps/api"; then
    echo "❌ Start API with: bash scripts/ci/api-up.sh"
fi

echo ""
echo "🎯 DIAGNOSTIC COMPLETE"
echo "======================"
