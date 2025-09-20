#!/bin/bash

# Script para aplicar configuraciones compartidas a proyectos
# Uso: ./apply-config.sh <tipo> <ruta-proyecto>
# Tipos: base, api, web, shared

set -e

if [ $# -ne 2 ]; then
    echo "Uso: $0 <tipo> <ruta-proyecto>"
    echo "Tipos disponibles: base, api, web, shared"
    exit 1
fi

TYPE=$1
PROJECT_PATH=$2
CONFIG_DIR="packages/configs"

if [ ! -f "$CONFIG_DIR/package.$TYPE.json" ]; then
    echo "❌ Configuración '$TYPE' no encontrada"
    exit 1
fi

if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ Proyecto '$PROJECT_PATH' no encontrado"
    exit 1
fi

echo "🔄 Aplicando configuración '$TYPE' a $PROJECT_PATH..."

# Copiar dependencias del config al proyecto
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_DIR/package.$TYPE.json', 'utf8'));
const projectPkg = JSON.parse(fs.readFileSync('$PROJECT_PATH/package.json', 'utf8'));

// Merge dependencies
projectPkg.dependencies = { ...config.dependencies, ...projectPkg.dependencies };
projectPkg.devDependencies = { ...config.devDependencies, ...projectPkg.devDependencies };

// Merge scripts (no sobrescribir existentes)
projectPkg.scripts = { ...config.scripts, ...projectPkg.scripts };

fs.writeFileSync('$PROJECT_PATH/package.json', JSON.stringify(projectPkg, null, 2));
"

echo "✅ Configuración aplicada exitosamente"
echo "📦 Ejecuta 'pnpm install' en $PROJECT_PATH para instalar nuevas dependencias"