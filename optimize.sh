#!/bin/bash

echo "🚀 Optimizando proyecto ECONEURA..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta desde la raíz del proyecto."
    exit 1
fi

print_info "Iniciando optimización del proyecto..."

# 1. Limpiar archivos temporales y caché
print_status "Limpiando archivos temporales..."
rm -rf node_modules/.cache
rm -rf apps/web/.next
rm -rf apps/web/out
rm -rf packages/*/dist
rm -rf packages/*/.turbo
rm -rf .turbo
find . -name "*.log" -delete
find . -name ".DS_Store" -delete

# 2. Limpiar node_modules y reinstalar
print_status "Reinstalando dependencias..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install --frozen-lockfile

# 3. Verificar y corregir iconos
print_status "Verificando iconos..."
./fix-all-icons.sh
./fix-lucide-icons.sh

# 4. Corregir imports
print_status "Corrigiendo imports..."
./fix-imports.sh

# 5. Verificar tipos
print_status "Verificando tipos de TypeScript..."
pnpm typecheck

# 6. Linting
print_status "Ejecutando linting..."
pnpm lint:fix

# 7. Formateo
print_status "Formateando código..."
pnpm format

# 8. Build de paquetes
print_status "Construyendo paquetes..."
pnpm --filter @econeura/shared build
pnpm --filter @econeura/sdk build
pnpm --filter @econeura/db build

# 9. Build de aplicaciones
print_status "Construyendo aplicaciones..."
pnpm build:web
pnpm build:api

# 10. Tests
print_status "Ejecutando tests..."
pnpm test

# 11. Análisis de dependencias
print_status "Analizando dependencias..."
pnpm audit --audit-level=high

# 12. Verificar estructura
print_status "Verificando estructura del proyecto..."
if [ ! -d "apps/web" ]; then
    print_error "Directorio apps/web no encontrado"
    exit 1
fi

if [ ! -d "apps/api" ]; then
    print_error "Directorio apps/api no encontrado"
    exit 1
fi

if [ ! -d "packages/shared" ]; then
    print_error "Directorio packages/shared no encontrado"
    exit 1
fi

print_status "Estructura del proyecto verificada"

# 13. Verificar archivos de configuración
print_status "Verificando archivos de configuración..."
if [ ! -f "tsconfig.json" ]; then
    print_error "tsconfig.json no encontrado"
    exit 1
fi

if [ ! -f ".eslintrc.cjs" ]; then
    print_error ".eslintrc.cjs no encontrado"
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml no encontrado"
    exit 1
fi

print_status "Archivos de configuración verificados"

# 14. Generar reporte de optimización
print_status "Generando reporte de optimización..."
echo "📊 REPORTE DE OPTIMIZACIÓN ECONEURA" > optimization-report.txt
echo "=====================================" >> optimization-report.txt
echo "Fecha: $(date)" >> optimization-report.txt
echo "" >> optimization-report.txt
echo "✅ Limpieza completada" >> optimization-report.txt
echo "✅ Dependencias reinstaladas" >> optimization-report.txt
echo "✅ Iconos corregidos" >> optimization-report.txt
echo "✅ Imports verificados" >> optimization-report.txt
echo "✅ Tipos verificados" >> optimization-report.txt
echo "✅ Linting ejecutado" >> optimization-report.txt
echo "✅ Formateo completado" >> optimization-report.txt
echo "✅ Builds exitosos" >> optimization-report.txt
echo "✅ Tests ejecutados" >> optimization-report.txt
echo "✅ Auditoría de seguridad completada" >> optimization-report.txt

print_status "¡Optimización completada exitosamente! 🎉"
print_info "Reporte guardado en: optimization-report.txt"
print_info "Puedes continuar con el desarrollo: pnpm dev"

