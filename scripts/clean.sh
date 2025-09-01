#!/usr/bin/env zsh

echo "🧹 Limpiando archivos generados..."

# Limpiar node_modules
echo "\n📦 Limpiando node_modules..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Limpiar builds
echo "\n🏗️  Limpiando builds..."
rm -rf apps/*/.next
rm -rf apps/*/dist
rm -rf packages/*/dist

# Limpiar caches
echo "\n🗑️  Limpiando caches..."
rm -rf .next
rm -rf .cache
rm -rf apps/*/.cache
rm -rf packages/*/.cache

# Limpiar archivos de TypeScript
echo "\n🧬 Limpiando archivos de TypeScript..."
find . -name "*.tsbuildinfo" -exec rm -f {} +

# Limpiar archivos de cobertura
echo "\n📊 Limpiando archivos de cobertura..."
rm -rf coverage
rm -rf apps/*/coverage
rm -rf packages/*/coverage

echo "\n✨ Limpieza completada!"
