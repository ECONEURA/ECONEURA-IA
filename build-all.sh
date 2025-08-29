#!/bin/bash

echo "🏗️  Construyendo monorepo ECONEURA..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta desde la raíz del proyecto."
    exit 1
fi

# Clean previous builds
print_status "Limpiando builds anteriores..."
rm -rf node_modules/.cache
rm -rf apps/web/.next
rm -rf packages/*/dist

# Install dependencies
print_status "Instalando dependencias..."
pnpm install

# Build shared packages first
print_status "Construyendo paquetes compartidos..."
pnpm --filter @econeura/shared build
pnpm --filter @econeura/sdk build
pnpm --filter @econeura/db build

# Build applications
print_status "Construyendo aplicaciones..."
pnpm --filter @econeura/web build
pnpm --filter @econeura/api build

# Run type checking
print_status "Verificando tipos..."
pnpm typecheck

# Run tests
print_status "Ejecutando tests..."
pnpm test

print_status "¡Build completado exitosamente! 🎉"

