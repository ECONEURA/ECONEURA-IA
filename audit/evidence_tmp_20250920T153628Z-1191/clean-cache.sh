#!/bin/bash

echo "🧹 Limpiando caché del sistema..."

# Limpiar caché de Node.js
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Caché de Node.js limpiado"
fi

# Limpiar caché de TypeScript
if [ -f ".tsbuildinfo" ]; then
    rm -f .tsbuildinfo
    echo "✅ Caché de TypeScript limpiado"
fi

# Limpiar caché de ESLint
if [ -d ".eslintcache" ]; then
    rm -rf .eslintcache
    echo "✅ Caché de ESLint limpiado"
fi

# Limpiar caché personalizado
if [ -d ".cache" ]; then
    rm -rf .cache/*
    echo "✅ Caché personalizado limpiado"
fi

# Limpiar logs antiguos
find . -name "*.log" -mtime +7 -delete 2>/dev/null || true
echo "✅ Logs antiguos limpiados"

echo "🎉 Limpieza completada"
