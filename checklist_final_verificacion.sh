#!/usr/bin/env bash
set -euo pipefail
# checklist_final_verificacion.sh
# Checklist final de verificación antes de activación del CI/CD pipeline

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"

echo "📋 CHECKLIST FINAL DE VERIFICACIÓN"
echo "=================================="
echo "Fecha: $(date)"
echo "Repositorio: $OWNER/$REPO"
echo "Branch: $BRANCH"
echo ""

check_count=0
total_checks=0

# Función para verificar y contar
check_item() {
    local description="$1"
    local command="$2"
    local expected="${3:-}"

    echo -n "🔍 $description... "
    total_checks=$((total_checks + 1))

    if eval "$command" 2>/dev/null; then
        if [ -n "$expected" ]; then
            local result
            result=$(eval "$command" 2>/dev/null || echo "")
            if [ "$result" = "$expected" ]; then
                echo "✅ PASS"
                check_count=$((check_count + 1))
            else
                echo "❌ FAIL (esperado: $expected, obtenido: $result)"
            fi
        else
            echo "✅ PASS"
            check_count=$((check_count + 1))
        fi
    else
        echo "❌ FAIL"
    fi
}

echo "🗂️  VERIFICACIÓN DE ARCHIVOS:"
echo "-----------------------------"

# Workflows
check_item "Workflow Mandatory Approval Gate existe" "[ -f '.github/workflows/mandatory-approval-gate.yml' ]"
check_item "Workflow Optimized Audit Parallel existe" "[ -f '.github/workflows/optimized-audit-parallel.yml' ]"
check_item "Workflow Integration Tests existe" "[ -f '.github/workflows/integration-tests-with-compose.yml' ]"

# Scripts de soporte
check_item "Script CI preflight existe" "[ -f 'scripts/ci_preflight.sh' ]"
check_item "Script validate with cache existe" "[ -f 'scripts/validate_with_cache.sh' ]"
check_item "Script HMAC validator existe" "[ -f 'scripts/vault/validate_hmac_approval.sh' ]"

# Archivos de configuración
check_item "Archivo approval_signed.json existe" "[ -f 'audit/approval_signed.json' ]"
check_item "Archivo REVIEW_OK existe" "[ -f 'REVIEW_OK' ]"

echo ""
echo "🔧 VERIFICACIÓN DE PERMISOS:"
echo "-----------------------------"

# Permisos de ejecución
check_item "Script ci_preflight.sh tiene permisos de ejecución" "[ -x 'scripts/ci_preflight.sh' ]"
check_item "Script validate_with_cache.sh tiene permisos" "[ -x 'scripts/validate_with_cache.sh' ]"
check_item "Script HMAC validator tiene permisos" "[ -x 'scripts/vault/validate_hmac_approval.sh' ]"

echo ""
echo "📊 VERIFICACIÓN DE CONTENIDO:"
echo "-----------------------------"

# Verificar contenido de approval_signed.json
check_item "approval_signed.json tiene contenido válido" "[ -s 'audit/approval_signed.json' ]"
check_item "approval_signed.json contiene 'hmac'" "grep -q 'hmac' audit/approval_signed.json"

# Verificar REVIEW_OK
check_item "REVIEW_OK tiene contenido" "[ -s 'REVIEW_OK' ]"

echo ""
echo "🔐 VERIFICACIÓN DE SEGURIDAD:"
echo "-----------------------------"

# Verificar que no hay claves hardcodeadas
check_item "No hay VAULT_APPROVAL_KEY hardcodeada en workflows" "! grep -r 'VAULT_APPROVAL_KEY' .github/workflows/ | grep -v '\$\{\{ secrets.VAULT_APPROVAL_KEY' | wc -l | grep -q '^0$'"

# Verificar configuración de secrets en workflows (usa VAULT_ADDR y VAULT_TOKEN)
check_item "Workflow usa secrets para configuración" "grep -q 'secrets.VAULT' .github/workflows/mandatory-approval-gate.yml"

echo ""
echo "⚙️  VERIFICACIÓN DE CONFIGURACIÓN:"
echo "---------------------------------"

# Verificar sintaxis YAML de workflows (usando alternativa sin python yaml)
check_item "Workflow mandatory-approval-gate.yml tiene estructura YAML básica" "head -1 .github/workflows/mandatory-approval-gate.yml | grep -q '^name:'"
check_item "Workflow optimized-audit-parallel.yml tiene estructura YAML básica" "head -1 .github/workflows/optimized-audit-parallel.yml | grep -q '^name:'"
check_item "Workflow integration-tests-with-compose.yml tiene estructura YAML básica" "head -1 .github/workflows/integration-tests-with-compose.yml | grep -q '^name:'"

echo ""
echo "🛠️  VERIFICACIÓN DE HERRAMIENTAS:"
echo "---------------------------------"

# Scripts de validación
check_item "Script validacion_manual_ci.sh existe" "[ -f 'validacion_manual_ci.sh' ]"
check_item "Script diagnostico_workflow.sh existe" "[ -f 'diagnostico_workflow.sh' ]"
check_item "Script ejecucion_manual_workflows.sh existe" "[ -f 'ejecucion_manual_workflows.sh' ]"
check_item "Script resumen_ejecutivo_ci_cd.sh existe" "[ -f 'resumen_ejecutivo_ci_cd.sh' ]"

# Permisos de herramientas
check_item "validacion_manual_ci.sh tiene permisos" "[ -x 'validacion_manual_ci.sh' ]"
check_item "diagnostico_workflow.sh tiene permisos" "[ -x 'diagnostico_workflow.sh' ]"
check_item "ejecucion_manual_workflows.sh tiene permisos" "[ -x 'ejecucion_manual_workflows.sh' ]"
check_item "resumen_ejecutivo_ci_cd.sh tiene permisos" "[ -x 'resumen_ejecutivo_ci_cd.sh' ]"

echo ""
echo "📈 RESULTADOS FINALES:"
echo "======================"

percentage=$((check_count * 100 / total_checks))

echo "✅ Checks pasados: $check_count/$total_checks ($percentage%)"

if [ $percentage -eq 100 ]; then
    echo ""
    echo "🎉 ¡TODOS LOS CHECKS PASARON!"
    echo "   El CI/CD pipeline está 100% listo para activación."
    echo ""
    echo "🚀 PRÓXIMOS PASOS:"
    echo "   1. Configurar VAULT_APPROVAL_KEY en GitHub Secrets"
    echo "   2. Crear PR desde GitHub web interface"
    echo "   3. Monitorear workflows en Actions"
    echo "   4. Verificar funcionamiento completo"
elif [ $percentage -ge 90 ]; then
    echo ""
    echo "⚠️  CASI LISTO ($percentage%)"
    echo "   Revisa los checks que fallaron arriba."
    echo "   La mayoría de componentes están correctos."
else
    echo ""
    echo "❌ REQUIERE ATENCIÓN ($percentage%)"
    echo "   Varios checks fallaron. Revisa la configuración."
fi

echo ""
echo "🔗 URLS IMPORTANTES:"
echo "   • Secrets: https://github.com/$OWNER/$REPO/settings/secrets/actions"
echo "   • Compare: https://github.com/$OWNER/$REPO/compare"
echo "   • Actions: https://github.com/$OWNER/$REPO/actions"
echo "   • Runs: https://github.com/$OWNER/$REPO/actions/runs"

echo ""
echo "📝 LOG GUARDADO: ./checklist_verificacion_$(date +%Y%m%d_%H%M%S).log"

# Guardar resultados en log
log_file="./checklist_verificacion_$(date +%Y%m%d_%H%M%S).log"
{
    echo "CHECKLIST FINAL DE VERIFICACIÓN"
    echo "==============================="
    echo "Fecha: $(date)"
    echo "Checks pasados: $check_count/$total_checks ($percentage%)"
    echo ""
    echo "Estado: $(if [ $percentage -eq 100 ]; then echo "100% LISTO"; elif [ $percentage -ge 90 ]; then echo "CASI LISTO"; else echo "REQUIERE ATENCIÓN"; fi)"
    echo ""
    echo "Repositorio: $OWNER/$REPO"
    echo "Branch: $BRANCH"
} > "$log_file"

echo "Log guardado: $log_file"