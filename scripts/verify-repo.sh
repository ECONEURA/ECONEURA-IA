#!/bin/bash
# Script de verificación completa del repositorio
# Ejecuta todos los checks de calidad

set -e

echo "🚀 VERIFICACIÓN COMPLETA ECONEURA"
echo "=================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# Función para verificar comando
check_command() {
    local cmd="$1"
    local description="$2"
    
    echo -n "🔍 $description... "
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((ERRORS++))
    fi
}

# Función para verificar archivo
check_file() {
    local file="$1"
    local description="$2"
    
    echo -n "📁 $description... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
    else
        echo -e "${RED}❌ MISSING${NC}"
        ((ERRORS++))
    fi
}

# Función para verificar métrica
check_metric() {
    local metric="$1"
    local threshold="$2"
    local description="$3"
    
    echo -n "📊 $description... "
    
    if [ "$metric" -le "$threshold" ]; then
        echo -e "${GREEN}✅ $metric ≤ $threshold${NC}"
    else
        echo -e "${RED}❌ $metric > $threshold${NC}"
        ((ERRORS++))
    fi
}

echo ""
echo "📋 VERIFICANDO ESTRUCTURA..."
echo "----------------------------"

check_file "package.json" "Package.json principal"
check_file "pnpm-workspace.yaml" "Configuración pnpm workspace"
check_file "turbo.json" "Configuración Turbo"
check_file ".nvmrc" "Versión Node.js"
check_file "tsconfig.base.json" "Configuración TypeScript base"
check_file ".editorconfig" "Configuración Editor"
check_file ".gitattributes" "Configuración Git attributes"
check_file ".size-limit.json" "Configuración size-limit"

echo ""
echo "🔧 VERIFICANDO SCRIPTS..."
echo "-------------------------"

check_file "scripts/metrics/collect.js" "Script de métricas"
check_file "scripts/refactor/detect-duplicates.js" "Script de duplicados"
check_file "scripts/refactor/update-imports.mjs" "Script de imports"
check_file "scripts/check-openapi-diff.mjs" "Script OpenAPI diff"
check_file "scripts/verify-repo.sh" "Script de verificación"

echo ""
echo "📊 VERIFICANDO MÉTRICAS..."
echo "-------------------------"

# Ejecutar recolección de métricas
if [ -f "scripts/metrics/collect.js" ]; then
    node scripts/metrics/collect.js > /dev/null 2>&1
fi

# Verificar archivos de reporte
check_file ".artifacts/metrics.json" "Métricas baseline"
check_file "reports/jscpd.json" "Reporte duplicados"
check_file "reports/unused.json" "Reporte código muerto"
check_file "reports/openapi-diff.json" "Reporte OpenAPI diff"

echo ""
echo "🔍 VERIFICANDO CALIDAD..."
echo "-------------------------"

# Verificar duplicados (jscpd ≤ 5%)
if [ -f "reports/jscpd.json" ]; then
    DUPLICATES=$(jq '.summary.duplicates // 0' reports/jscpd.json)
    check_metric "$DUPLICATES" 50 "Duplicados encontrados"
fi

# Verificar código muerto
if [ -f "reports/unused.json" ]; then
    UNUSED_FILES=$(jq '.summary.unusedFiles // 0' reports/unused.json)
    check_metric "$UNUSED_FILES" 10 "Archivos no utilizados"
fi

# Verificar OpenAPI diff
if [ -f "reports/openapi-diff.json" ]; then
    OPENAPI_DIFF=$(jq '.differences // 0' reports/openapi-diff.json)
    check_metric "$OPENAPI_DIFF" 0 "Diferencias OpenAPI"
fi

echo ""
echo "🔒 VERIFICANDO SEGURIDAD..."
echo "---------------------------"

check_file ".env.example" "Variables de entorno"
check_file ".gitignore" "Configuración Git ignore"

# Verificar que no hay secretos en el código
if command -v detect-secrets > /dev/null 2>&1; then
    check_command "detect-secrets scan --baseline .secrets.baseline" "Scan de secretos"
else
    echo -e "${YELLOW}⚠️  detect-secrets no instalado${NC}"
fi

echo ""
echo "📚 VERIFICANDO DOCUMENTACIÓN..."
echo "-------------------------------"

check_file "docs/TREE.md" "Árbol de directorios"
check_file "docs/METRICAS_BEFORE.md" "Métricas baseline"
check_file "docs/DEDUP_REPORT.md" "Reporte deduplicación"
check_file "docs/RENAME_MAP.csv" "Mapa de renombrado"
check_file "docs/RUNBOOK_BACKUP.md" "Runbook de backup"

echo ""
echo "🎯 VERIFICANDO HUSKY..."
echo "-----------------------"

check_file ".husky/pre-commit" "Hook pre-commit"
check_file ".husky/commit-msg" "Hook commit-msg"

# Verificar que Husky está instalado
if [ -d ".husky" ]; then
    echo -e "🔍 Husky hooks... ${GREEN}✅ INSTALLED${NC}"
else
    echo -e "🔍 Husky hooks... ${RED}❌ NOT INSTALLED${NC}"
    ((ERRORS++))
fi

echo ""
echo "📊 RESUMEN FINAL"
echo "================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 VERIFICACIÓN EXITOSA${NC}"
    echo -e "${GREEN}✅ Todos los checks pasaron${NC}"
    echo -e "${GREEN}✅ Repositorio listo para desarrollo${NC}"
    exit 0
else
    echo -e "${RED}❌ VERIFICACIÓN FALLIDA${NC}"
    echo -e "${RED}❌ $ERRORS errores encontrados${NC}"
    echo -e "${YELLOW}💡 Revisar los errores arriba y corregir${NC}"
    exit 1
fi