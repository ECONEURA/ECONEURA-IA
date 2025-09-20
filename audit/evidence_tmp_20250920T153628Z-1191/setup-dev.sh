#!/usr/bin/env bash
# =====================================================
# ECONEURA-IA: Configuración de Desarrollo
# =====================================================
# Configura el entorno completo para desarrollo
# =====================================================

set -euo pipefail

echo "🧠 ECONEURA-IA: Configurando entorno de desarrollo"
echo "=================================================="

# Verificar que estamos en el directorio correcto
if [[ ! -f "package.json" ]] || [[ ! -d "apps" ]] || [[ ! -d "packages" ]]; then
  echo "❌ Error: Ejecuta este script desde la raíz del proyecto ECONEURA-IA"
  exit 1
fi

echo "📍 Directorio correcto: $(pwd)"

# Instalar dependencias
echo "📦 Instalando dependencias..."
if command -v pnpm &> /dev/null; then
  pnpm install
else
  echo "⚠️  pnpm no encontrado, instalando..."
  npm install -g pnpm
  pnpm install
fi

# Verificar configuración de VS Code
echo "🔧 Verificando configuración de VS Code..."
if [[ -f ".vscode/settings.json" ]] && [[ -f ".vscode/extensions.json" ]] && [[ -f ".vscode/tasks.json" ]]; then
  echo "✅ Configuración de VS Code encontrada"
else
  echo "❌ Configuración de VS Code incompleta"
  exit 1
fi

# Verificar TypeScript
echo "🔍 Verificando TypeScript..."
if command -v tsc &> /dev/null; then
  echo "✅ TypeScript instalado"
else
  echo "⚠️  TypeScript no encontrado globalmente"
fi

# Verificar Node.js
echo "🔍 Verificando Node.js..."
node_version=$(node --version)
echo "✅ Node.js: $node_version"

# Verificar pnpm
echo "🔍 Verificando pnpm..."
pnpm_version=$(pnpm --version)
echo "✅ pnpm: $pnpm_version"

# Configurar variables de entorno
echo "🔧 Configurando variables de entorno..."
if [[ ! -f ".env" ]] && [[ -f ".env.example" ]]; then
  cp .env.example .env
  echo "✅ Archivo .env creado desde .env.example"
fi

# Verificar scripts disponibles
echo "📋 Scripts disponibles:"
if [[ -f "package.json" ]]; then
  echo "  - pnpm dev:api     # Iniciar servidor API"
  echo "  - pnpm dev:web     # Iniciar servidor web"
  echo "  - pnpm typecheck   # Verificar tipos TypeScript"
  echo "  - pnpm lint        # Ejecutar linter"
  echo "  - pnpm test        # Ejecutar tests"
  echo "  - pnpm build       # Construir para producción"
fi

# Verificar estado de Git
echo "📊 Estado de Git:"
git status --porcelain | head -10 || echo "No se pudo verificar git"

echo ""
echo "🎯 ¡Entorno configurado exitosamente!"
echo "======================================"
echo "Comandos para comenzar:"
echo "  1. pnpm dev:api    # Iniciar API en http://localhost:4000"
echo "  2. pnpm dev:web    # Iniciar web en http://localhost:3000"
echo "  3. pnpm typecheck  # Verificar tipos"
echo "  4. pnpm test       # Ejecutar tests"
echo ""
echo "Extensiones de VS Code recomendadas:"
echo "  - TypeScript, ESLint, Prettier"
echo "  - Tailwind CSS, Docker"
echo "  - GitHub Copilot"
echo ""
echo "¡Listo para desarrollar! 🚀"