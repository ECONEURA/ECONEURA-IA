#!/bin/bash

# 🚀 SCRIPT PRINCIPAL DE IMPLEMENTACIÓN MASIVA PRs 0-56
# Ejecuta la implementación completa de todos los PRs faltantes

set -e

echo "🚀 ECONEURA - IMPLEMENTACIÓN MASIVA PRs 0-56"
echo "=============================================="
echo "📅 Fecha: $(date)"
echo "👤 Usuario: $(whoami)"
echo "📁 Directorio: $(pwd)"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecutar desde la raíz del proyecto."
    exit 1
fi

# Verificar que pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    error "pnpm no está instalado. Instalar pnpm primero."
    exit 1
fi

# Mostrar menú de opciones
echo -e "${PURPLE}🎯 OPCIONES DE IMPLEMENTACIÓN:${NC}"
echo ""
echo "1. 🔍 Validar implementación actual"
echo "2. 🚀 Implementar PRs faltantes (25-30)"
echo "3. 🔧 Implementar PRs restantes (31-56)"
echo "4. 🎉 Implementación completa (25-56)"
echo "5. ✅ Validación final completa"
echo "6. 📊 Mostrar estado actual"
echo "7. 🚪 Salir"
echo ""

read -p "Selecciona una opción (1-7): " choice

case $choice in
    1)
        log "🔍 Ejecutando validación de implementación actual..."
        if [ -f "./validate-implementation.sh" ]; then
            ./validate-implementation.sh
        else
            error "Script de validación no encontrado"
            exit 1
        fi
        ;;
    2)
        log "🚀 Ejecutando implementación de PRs 25-30..."
        if [ -f "./implement-all-prs.sh" ]; then
            ./implement-all-prs.sh
        else
            error "Script de implementación no encontrado"
            exit 1
        fi
        ;;
    3)
        log "🔧 Ejecutando implementación de PRs restantes 31-56..."
        if [ -f "./implement-remaining-prs.sh" ]; then
            ./implement-remaining-prs.sh
        else
            error "Script de implementación restante no encontrado"
            exit 1
        fi
        ;;
    4)
        log "🎉 Ejecutando implementación completa de PRs 25-56..."
        info "Esto puede tomar varios minutos..."
        echo ""
        
        # Ejecutar implementación de PRs 25-30
        log "Fase 1: Implementando PRs 25-30..."
        if [ -f "./implement-all-prs.sh" ]; then
            ./implement-all-prs.sh
        else
            error "Script de implementación no encontrado"
            exit 1
        fi
        
        echo ""
        log "Fase 2: Implementando PRs 31-56..."
        if [ -f "./implement-remaining-prs.sh" ]; then
            ./implement-remaining-prs.sh
        else
            error "Script de implementación restante no encontrado"
            exit 1
        fi
        
        echo ""
        log "Fase 3: Validación final..."
        if [ -f "./validate-implementation.sh" ]; then
            ./validate-implementation.sh
        else
            error "Script de validación no encontrado"
            exit 1
        fi
        
        success "🎉 Implementación completa finalizada!"
        ;;
    5)
        log "✅ Ejecutando validación final completa..."
        if [ -f "./validate-implementation.sh" ]; then
            ./validate-implementation.sh
        else
            error "Script de validación no encontrado"
            exit 1
        fi
        ;;
    6)
        log "📊 Mostrando estado actual del proyecto..."
        echo ""
        info "📁 Estructura del proyecto:"
        echo "  - apps/api: $(find apps/api/src -name "*.ts" | wc -l) archivos TypeScript"
        echo "  - apps/web: $(find apps/web/src -name "*.tsx" -o -name "*.ts" | wc -l) archivos TypeScript/TSX"
        echo "  - packages: $(find packages -name "*.ts" | wc -l) archivos TypeScript"
        echo ""
        info "📋 PRs implementados:"
        echo "  - PRs 0-24: ✅ Base del monorepo (implementados)"
        echo "  - PRs 25-30: 🔄 Operabilidad (parcialmente implementados)"
        echo "  - PRs 31-56: ❌ Integraciones y avanzados (pendientes)"
        echo ""
        info "🔧 Scripts disponibles:"
        ls -la *.sh | grep -E "(implement|validate)" | awk '{print "  - " $9}'
        echo ""
        info "📚 Documentación disponible:"
        ls -la *.md | grep -E "(IMPLEMENTACION|ANALISIS|RESUMEN)" | awk '{print "  - " $9}'
        ;;
    7)
        log "🚪 Saliendo..."
        exit 0
        ;;
    *)
        error "Opción inválida. Selecciona un número del 1 al 7."
        exit 1
        ;;
esac

echo ""
success "🎯 Operación completada exitosamente!"
echo ""
info "📚 Documentación disponible:"
echo "  - IMPLEMENTACION-MASIVA-PR-0-56.md"
echo "  - ANALISIS-COMPLETO-PRS-0-57.md"
echo "  - RESUMEN-EJECUTIVO-IMPLEMENTACION-COMPLETA.md"
echo ""
info "🚀 Próximos pasos recomendados:"
echo "  1. Revisar implementaciones realizadas"
echo "  2. Ejecutar tests adicionales"
echo "  3. Deploy a staging para validación"
echo "  4. Deploy a producción con blue/green"
echo ""
success "¡Gracias por usar el sistema de implementación masiva de ECONEURA! 🎉"
