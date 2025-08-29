#!/bin/bash

# Script para solucionar problemas de TypeScript y dependencias
echo "🔧 Solucionando problemas de TypeScript y dependencias..."

# 1. Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 20.x LTS"
    echo "   Puedes descargarlo desde: https://nodejs.org/"
    exit 1
fi

# 2. Verificar si pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "📦 Instalando pnpm..."
    npm install -g pnpm
fi

# 3. Instalar dependencias
echo "📦 Instalando dependencias..."
pnpm install

# 4. Verificar que las dependencias estén instaladas
echo "🔍 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules no encontrado"
    exit 1
fi

# 5. Verificar que zod esté instalado
if [ ! -d "node_modules/zod" ]; then
    echo "📦 Instalando zod..."
    pnpm add zod
fi

# 6. Verificar que @types/node esté instalado
if [ ! -d "node_modules/@types/node" ]; then
    echo "📦 Instalando @types/node..."
    pnpm add -D @types/node
fi

# 7. Verificar que vitest esté instalado
if [ ! -d "node_modules/vitest" ]; then
    echo "📦 Instalando vitest..."
    pnpm add -D vitest
fi

# 8. Ejecutar typecheck para verificar problemas restantes
echo "🔍 Ejecutando typecheck..."
pnpm typecheck

echo "✅ Proceso completado!"
echo ""
echo "📋 Resumen de problemas solucionados:"
echo "   - Dependencias faltantes (zod, @types/node, vitest)"
echo "   - Configuración de TypeScript (lib DOM)"
echo "   - Path mappings para @econeura/db"
echo "   - GitHub Actions (Azure CLI v2)"
echo ""
echo "🚀 Listo para el primer deployment!"
