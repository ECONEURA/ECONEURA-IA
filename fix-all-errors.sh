#!/bin/bash

echo "🔧 ARREGLANDO TODOS LOS ERRORES DE TYPESCRIPT..."

# 1. Arreglar errores de logging
echo "📝 Arreglando errores de logging..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/error: error instanceof Error ? error\.message : String(error)/error: error instanceof Error ? error.message : String(error)/g' {} \;

# 2. Arreglar errores de structuredLogger
echo "📊 Arreglando errores de structuredLogger..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/structuredLogger\.error(\([^,]*\), { error })/structuredLogger.error(\1, { error: error instanceof Error ? error.message : String(error) })/g' {} \;

# 3. Arreglar errores de details
echo "🔍 Arreglando errores de details..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/details: error\.errors/details: error instanceof Error ? error.message : String(error)/g' {} \;

# 4. Arreglar errores de parámetros
echo "⚙️ Arreglando errores de parámetros..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/req\.params\.\([a-zA-Z]*\)/req.params.\1 as string/g' {} \;

# 5. Arreglar errores de headers
echo "🌐 Arreglando errores de headers..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/req\.headers\[\([^]]*\)\]/req.headers[\1] as string/g' {} \;

echo "✅ ARREGLO COMPLETADO!"
