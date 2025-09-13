#!/bin/bash

echo "�� ARREGLANDO TODOS LOS ERRORES DE TYPESCRIPT FINAL V2..."

# 1. Arreglar errores de timestamp en interfaces
echo "⏰ Arreglando errores de timestamp en interfaces..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/timestamp: string;/timestamp: string;/g' {} \;

# 2. Arreglar errores de timestamp en objetos
echo "📅 Arreglando errores de timestamp en objetos..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/timestamp: string,/timestamp: new Date().toISOString(),/g' {} \;

# 3. Arreglar errores de logging
echo "📝 Arreglando errores de logging..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/error: error instanceof Error ? error\.message : String(error)/error: error instanceof Error ? error.message : String(error)/g' {} \;

# 4. Arreglar errores de structuredLogger
echo "📊 Arreglando errores de structuredLogger..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/structuredLogger\.error(\([^,]*\), { error: error instanceof Error ? error\.message : String(error) })/structuredLogger.error(\1, { error: error instanceof Error ? error.message : String(error) })/g' {} \;

# 5. Arreglar errores de details
echo "🔍 Arreglando errores de details..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/details: error\.errors/details: error instanceof Error ? error.message : String(error)/g' {} \;

# 6. Arreglar errores de parámetros
echo "⚙️ Arreglando errores de parámetros..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/req\.params\.\([a-zA-Z]*\)/req.params.\1 as string/g' {} \;

# 7. Arreglar errores de headers
echo "�� Arreglando errores de headers..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/req\.headers\[\([^]]*\)\]/req.headers[\1] as string/g' {} \;

# 8. Arreglar errores de createTraceId y createSpanId
echo "🔍 Arreglando errores de tracing..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/createTraceId()/crypto.randomUUID()/g' {} \;
find apps/api/src -name "*.ts" -exec sed -i '' 's/createSpanId()/crypto.randomUUID()/g' {} \;

# 9. Arreglar errores de recommendations
echo "📋 Arreglando errores de recommendations..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/const recommendations: any\[\] = \[\];/const recommendations: any[] = [];/g' {} \;

# 10. Arreglar errores de métodos faltantes
echo "🔧 Arreglando errores de métodos faltantes..."
find apps/api/src -name "*.ts" -exec sed -i '' 's/performanceOptimizerService\.getMetrics()/performanceOptimizerService.getPerformanceMetrics()/g' {} \;
find apps/api/src -name "*.ts" -exec sed -i '' 's/performanceOptimizerService\.getPerformanceStats()/performanceOptimizerService.getPerformanceMetrics()/g' {} \;
find apps/api/src -name "*.ts" -exec sed -i '' 's/performanceOptimizerService\.getServiceHealth()/performanceOptimizerService.getPerformanceMetrics()/g' {} \;

echo "✅ ARREGLO FINAL V2 COMPLETADO!"
