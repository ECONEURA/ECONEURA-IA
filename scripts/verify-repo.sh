#!/bin/bash

# ============================================================================
# VERIFICACIÓN COMPLETA ECONEURA - PR-92
# ============================================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARN") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

echo -e "${BLUE}🚀 VERIFICACIÓN COMPLETA ECONEURA - PR-92${NC}"
echo "=============================================="
echo

# ============================================================================
# VERIFICAR ESTRUCTURA
# ============================================================================
print_status "INFO" "VERIFICANDO ESTRUCTURA..."
echo "----------------------------"

# Verificar archivos principales
files_to_check=(
    "package.json"
    "pnpm-workspace.yaml"
    "turbo.json"
    ".nvmrc"
    "tsconfig.base.json"
    ".editorconfig"
    ".gitattributes"
    ".size-limit.json"
)

for file in "${files_to_check[@]}"; do
    if [[ -f "$file" ]]; then
        print_status "OK" "📁 $file... ✅ EXISTS"
    else
        print_status "ERROR" "📁 $file... ❌ MISSING"
        exit 1
    fi
done

echo

# ============================================================================
# VERIFICAR SCRIPTS
# ============================================================================
print_status "INFO" "VERIFICANDO SCRIPTS..."
echo "-------------------------"

scripts_to_check=(
    "scripts/check-openapi-diff.mjs"
    "scripts/openapi/snapshot.mjs"
    "scripts/openapi/diff.mjs"
    "scripts/refactor/update-imports.mjs"
    "scripts/verify-repo.sh"
)

for script in "${scripts_to_check[@]}"; do
    if [[ -f "$script" ]]; then
        print_status "OK" "📁 $script... ✅ EXISTS"
    else
        print_status "ERROR" "📁 $script... ❌ MISSING"
        exit 1
    fi
done

echo

# ============================================================================
# VERIFICAR MÉTRICAS
# ============================================================================
print_status "INFO" "VERIFICANDO MÉTRICAS..."
echo "-------------------------"

metrics_to_check=(
    "reports/jscpd.json"
    "reports/openapi-diff.json"
    "snapshots/openapi.runtime.json"
)

for metric in "${metrics_to_check[@]}"; do
    if [[ -f "$metric" ]]; then
        print_status "OK" "📁 $metric... ✅ EXISTS"
    else
        print_status "ERROR" "📁 $metric... ❌ MISSING"
        exit 1
    fi
done

echo

# ============================================================================
# VERIFICAR CALIDAD - CRITERIOS BLOQUEANTES
# ============================================================================
print_status "INFO" "VERIFICANDO CALIDAD..."
echo "-------------------------"

# 1. Verificar OpenAPI diff = 0
if [[ -f "reports/openapi-diff.json" ]]; then
    diff_count=$(jq -r '.summary.total_differences // 0' reports/openapi-diff.json 2>/dev/null || echo "0")
    if [[ "$diff_count" -eq 0 ]]; then
        print_status "OK" "📊 OpenAPI diff... ✅ $diff_count = 0"
    else
        print_status "ERROR" "📊 OpenAPI diff... ❌ $diff_count > 0"
        exit 1
    fi
else
    print_status "ERROR" "📊 Reporte de OpenAPI diff no encontrado"
    exit 1
fi

# 2. Verificar duplicados ≤ 50
if [[ -f "reports/jscpd.json" ]]; then
    duplicates=$(jq -r '.statistics.duplicated // 0' reports/jscpd.json 2>/dev/null || echo "0")
    if [[ "$duplicates" -le 50 ]]; then
        print_status "OK" "📊 Duplicados encontrados... ✅ $duplicates ≤ 50"
    else
        print_status "ERROR" "📊 Duplicados encontrados... ❌ $duplicates > 50"
        exit 1
    fi
else
    print_status "ERROR" "📊 Reporte de duplicados no encontrado"
    exit 1
fi

# 3. Verificar jscpd ≤ 5%
if [[ -f "reports/jscpd.json" ]]; then
    jscpd_percentage=$(jq -r '.statistics.percentage // 0' reports/jscpd.json 2>/dev/null || echo "0")
    if (( $(echo "$jscpd_percentage <= 5" | bc -l) )); then
        print_status "OK" "📊 jscpd percentage... ✅ $jscpd_percentage% ≤ 5%"
    else
        print_status "ERROR" "📊 jscpd percentage... ❌ $jscpd_percentage% > 5%"
        exit 1
    fi
else
    print_status "ERROR" "📊 Reporte de jscpd no encontrado"
    exit 1
fi

# 4. Verificar archivos de reorganización
reorg_files=(
    "docs/RENAME_MAP.csv"
    "docs/DEDUP_REPORT.md"
    ".cpdignore"
)

for file in "${reorg_files[@]}"; do
    if [[ -f "$file" ]]; then
        print_status "OK" "📁 $file... ✅ EXISTS"
    else
        print_status "ERROR" "📁 $file... ❌ MISSING"
        exit 1
    fi
done

echo

# ============================================================================
# VERIFICAR HUSKY Y CI
# ============================================================================
print_status "INFO" "VERIFICANDO HUSKY Y CI..."
echo "-------------------------"

# Verificar hooks de Husky
husky_hooks=(
    ".husky/pre-commit"
    ".husky/pre-push"
    ".husky/commit-msg"
)

for hook in "${husky_hooks[@]}"; do
    if [[ -f "$hook" ]]; then
        print_status "OK" "📁 $hook... ✅ EXISTS"
    else
        print_status "ERROR" "📁 $hook... ❌ MISSING"
        exit 1
    fi
done

# Verificar workflows de GitHub Actions
workflows=(
    ".github/workflows/ci.yml"
    ".github/workflows/workers-ci.yml"
    ".github/workflows/ci-gates.yml"
)

for workflow in "${workflows[@]}"; do
    if [[ -f "$workflow" ]]; then
        print_status "OK" "📁 $workflow... ✅ EXISTS"
    else
        print_status "ERROR" "📁 $workflow... ❌ MISSING"
        exit 1
    fi
done

echo

# ============================================================================
# RESULTADO FINAL
# ============================================================================
print_status "OK" "🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE"
echo "=============================================="
echo -e "${GREEN}VERIFY=PASS${NC}"
echo "=============================================="