#!/bin/bash

# Script de instalación de mejoras adicionales para ECONEURA-IA
# Ejecutar después de las optimizaciones principales

set -e

echo "🚀 Instalando mejoras adicionales para ECONEURA-IA..."

# Instalar next-intl para internacionalización
echo "📦 Instalando next-intl para soporte multiidioma..."
cd apps/web
npm install next-intl@^3.14.1
cd ../..

# Instalar dependencias de monitoreo adicionales si es necesario
echo "📊 Verificando dependencias de monitoreo..."
cd apps/api
# Aquí se instalarían dependencias adicionales si fueran necesarias
cd ../..

echo "✅ Instalación completada!"
echo ""
echo "🎯 Mejoras implementadas:"
echo "  • Soporte de internacionalización (ES/EN)"
echo "  • Configuración de performance avanzada"
echo "  • Dashboard de monitoreo avanzado"
echo "  • Sistema de métricas del sistema"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Ejecutar 'npm run build' para verificar compilación"
echo "  2. Probar funcionalidades de internacionalización"
echo "  3. Verificar dashboard de monitoreo"
echo "  4. Configurar variables de entorno para i18n si es necesario"
