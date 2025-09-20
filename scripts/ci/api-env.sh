#!/bin/bash
# Configuración de entorno para la API en CI

set -euo pipefail

echo "=== Configurando variables de entorno API ==="

# Variables básicas
export NODE_ENV=test
export PORT=3001
export LOG_LEVEL=info

# Base de datos (usa PostgreSQL service en workflows)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/econeura_test"

# Redis (configuración local de prueba)
export REDIS_URL="redis://localhost:6379"

# Deshabilitamos características que requieren servicios externos
export ENABLE_TRACING=false
export ENABLE_METRICS=false
export ENABLE_EXTERNAL_APIS=false

# JWT para pruebas
export JWT_SECRET="test-jwt-secret-not-for-production"
export JWT_EXPIRES_IN="1h"

# Rate limiting deshabilitado en pruebas
export ENABLE_RATE_LIMITING=false

# CORS permisivo para pruebas
export CORS_ORIGINS="*"

# Control de deployment
export DEPLOY_ENABLED=false
export CI=true

echo "✅ Variables de entorno configuradas"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: (configurado)"
echo "LOG_LEVEL: $LOG_LEVEL"
