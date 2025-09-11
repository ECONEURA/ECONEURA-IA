#!/usr/bin/env bash
set -euo pipefail

echo "🚨 API TESTS FALLBACK MODE"
echo "=========================="
echo "This script provides fallback solutions for API test failures"
echo ""

# Función para limpiar todo
cleanup_all() {
    echo "🧹 Cleaning up all processes and ports..."
    
    # Matar todos los procesos relacionados con la API
    pkill -f "apps/api" || true
    pkill -f "node.*dist/index.js" || true
    pkill -f "ts-node.*src/index.ts" || true
    pkill -f "vitest" || true
    
    # Esperar un momento
    sleep 3
    
    # Forzar kill si es necesario
    pkill -9 -f "apps/api" || true
    pkill -9 -f "vitest" || true
    
    echo "✅ Cleanup completed"
}

# Función para reiniciar Postgres
restart_postgres() {
    echo "🔄 Restarting Postgres service..."
    
    # En CI, Postgres es un servicio, no podemos reiniciarlo directamente
    # Pero podemos verificar que esté funcionando
    if command -v pg_isready >/dev/null 2>&1; then
        echo "⏳ Waiting for Postgres to be ready..."
        for i in {1..30}; do
            if pg_isready -h 127.0.0.1 -p 5432 -U ci; then
                echo "✅ Postgres is ready"
                return 0
            fi
            echo "Attempt $i/30: Postgres not ready, waiting..."
            sleep 2
        done
        echo "❌ Postgres failed to become ready"
        return 1
    else
        echo "⚠️ pg_isready not available, assuming Postgres is ready"
        return 0
    fi
}

# Función para arrancar API en modo simple
start_api_simple() {
    echo "🚀 Starting API in simple mode..."
    
    # Crear directorio de artefactos
    mkdir -p .artifacts
    
    # Variables de entorno básicas
    export NODE_ENV=test
    export PORT=3001
    export DATABASE_URL="postgresql://ci:ci@127.0.0.1:5432/econeura_ci"
    export MOCK_EXTERNAL=1
    
    # Intentar arrancar la API de diferentes maneras
    echo "📦 Attempting to start API..."
    
    # Método 1: Directamente con ts-node
    if command -v ts-node >/dev/null 2>&1; then
        echo "🔄 Trying ts-node method..."
        cd apps/api
        ts-node src/index.ts > ../../.artifacts/api.log 2>&1 &
        API_PID=$!
        cd ../..
        echo "API started with PID: $API_PID"
        
        # Esperar un poco
        sleep 5
        
        # Verificar si está funcionando
        if curl -f http://127.0.0.1:3001/health >/dev/null 2>&1; then
            echo "✅ API started successfully with ts-node"
            return 0
        else
            echo "❌ API failed to start with ts-node"
            kill $API_PID 2>/dev/null || true
        fi
    fi
    
    # Método 2: Con node después de build
    echo "🔄 Trying build + node method..."
    cd apps/api
    if pnpm build; then
        node dist/index.js > ../../.artifacts/api.log 2>&1 &
        API_PID=$!
        cd ../..
        echo "API started with PID: $API_PID"
        
        # Esperar un poco
        sleep 5
        
        # Verificar si está funcionando
        if curl -f http://127.0.0.1:3001/health >/dev/null 2>&1; then
            echo "✅ API started successfully with build + node"
            return 0
        else
            echo "❌ API failed to start with build + node"
            kill $API_PID 2>/dev/null || true
        fi
    fi
    cd ../..
    
    echo "❌ All API start methods failed"
    return 1
}

# Función para ejecutar tests en modo simple
run_tests_simple() {
    echo "🧪 Running tests in simple mode..."
    
    # Variables de entorno para tests
    export BASE_URL="http://127.0.0.1:3001"
    export HEALTH_PATH="/health"
    export MOCK_EXTERNAL=1
    
    # Ejecutar tests con configuración mínima
    cd apps/api
    
    # Crear configuración temporal de vitest
    cat > vitest.fallback.config.ts << 'EOF'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.e2e.{ts,tsx}"],
    setupFiles: ["tests/setup-e2e.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ["default"],
    env: {
      BASE_URL: process.env.BASE_URL || "http://127.0.0.1:3001",
      HEALTH_PATH: process.env.HEALTH_PATH || "/health",
      MOCK_EXTERNAL: process.env.MOCK_EXTERNAL || "1",
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
EOF
    
    # Ejecutar tests
    if pnpm vitest run --config vitest.fallback.config.ts; then
        echo "✅ Tests passed in fallback mode"
        cd ../..
        return 0
    else
        echo "❌ Tests failed in fallback mode"
        cd ../..
        return 1
    fi
}

# Función principal
main() {
    echo "🎯 Starting fallback procedures..."
    
    # Paso 1: Limpiar todo
    cleanup_all
    
    # Paso 2: Reiniciar Postgres
    if ! restart_postgres; then
        echo "❌ Postgres restart failed"
        exit 1
    fi
    
    # Paso 3: Arrancar API en modo simple
    if ! start_api_simple; then
        echo "❌ API start failed"
        exit 1
    fi
    
    # Paso 4: Ejecutar tests en modo simple
    if ! run_tests_simple; then
        echo "❌ Tests failed"
        exit 1
    fi
    
    echo "✅ Fallback mode completed successfully"
}

# Ejecutar función principal
main "$@"
