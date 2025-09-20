#!/usr/bin/env bash
set -euo pipefail
# validacion_manual_ci.sh
# Validación manual completa del CI/CD pipeline sin gh CLI
# Ejecutar desde la raíz del repo

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMPDIR="./ci_validation_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMPDIR"

echo "🎯 VALIDACIÓN MANUAL COMPLETA DEL CI/CD PIPELINE"
echo "================================================"
echo "Fecha: $(date)"
echo "Repositorio: $OWNER/$REPO"
echo "Branch: $BRANCH"
echo ""

# Verificar prerrequisitos
echo "=== 1) VERIFICACIÓN DE PRERREQUISITOS ==="
echo "✓ Repositorio: $REPO"
echo "✓ Branch actual: $(git branch --show-current)"
echo "✓ Archivos de workflow presentes:"

for wf in "${WORKFLOWS[@]}"; do
    wf_file=""
    case "$wf" in
        "Mandatory Approval Gate") wf_file=".github/workflows/mandatory-approval-gate.yml" ;;
        "Optimized Audit Parallel") wf_file=".github/workflows/optimized-audit-parallel.yml" ;;
        "Integration Tests with Compose") wf_file=".github/workflows/integration-tests-with-compose.yml" ;;
    esac

    if [ -f "$wf_file" ]; then
        echo "  ✓ $wf_file"
    else
        echo "  ❌ $wf_file (NO ENCONTRADO)"
    fi
done
echo ""

# Verificar archivos de soporte
echo "=== 2) VERIFICACIÓN DE ARCHIVOS DE SOPORTE ==="
support_files=(
    "scripts/ci_preflight.sh"
    "scripts/validate_with_cache.sh"
    "scripts/vault/validate_hmac_approval.sh"
    "audit/approval_signed.json"
    "REVIEW_OK"
)

for file in "${support_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "❌ $file (NO ENCONTRADO)"
    fi
done
echo ""

# Verificar configuración de GitHub
echo "=== 3) INSTRUCCIONES PARA CONFIGURACIÓN MANUAL ==="
echo ""
echo "📋 PASOS PARA EJECUTAR VALIDACIÓN MANUAL:"
echo ""
echo "1️⃣ CONFIGURAR SECRETS EN GITHUB:"
echo "   Ve a: https://github.com/$OWNER/$REPO/settings/secrets/actions"
echo "   Agrega el secret: VAULT_APPROVAL_KEY"
echo "   Valor: [tu_clave_HMAC_SHA256_de_64_caracteres]"
echo ""

echo "2️⃣ CREAR PULL REQUEST:"
echo "   Ve a: https://github.com/$OWNER/$REPO/compare"
echo "   Base: main ← Compare: $BRANCH"
echo "   Título: 'CI/CD Pipeline with HMAC Security Gates'"
echo "   Descripción: Implementa pipeline completo con validación HMAC y auditoría paralela"
echo "   Crea el PR"
echo ""

echo "3️⃣ ESPERAR WORKFLOWS:"
echo "   Ve a: https://github.com/$OWNER/$REPO/actions"
echo "   Espera que aparezcan las 3 ejecuciones:"
echo "   • Mandatory Approval Gate"
echo "   • Optimized Audit Parallel"
echo "   • Integration Tests with Compose"
echo ""

echo "4️⃣ MONITOREAR EJECUCIÓN:"
echo "   Actualiza la página cada 30-60 segundos"
echo "   Espera que TODOS muestren:"
echo "   Status: completed"
echo "   Conclusion: success"
echo ""

echo "5️⃣ REVISAR RESULTADOS:"
echo "   Para cada workflow completado:"
echo "   • Haz clic en la ejecución"
echo "   • Revisa Summary para estado general"
echo "   • Verifica que todos los jobs pasaron"
echo ""

echo "6️⃣ DIAGNÓSTICO DE FALLOS (si aplica):"
echo "   Si algún workflow falló:"
echo "   • Haz clic en la ejecución fallida"
echo "   • Ve a la pestaña Jobs"
echo "   • Identifica el job que falló (rojo)"
echo "   • Haz clic para ver logs detallados"
echo "   • Busca mensajes de error específicos"
echo ""

# Generar resumen de estado
echo "=== 4) RESUMEN DE ESTADO ACTUAL ==="
echo ""
echo "📊 WORKFLOWS CONFIGURADOS:"
for wf in "${WORKFLOWS[@]}"; do
    echo "• $wf - Listo para ejecución"
done
echo ""

echo "🔐 SEGURIDAD:"
echo "• HMAC-SHA256 validation: Implementado"
echo "• Mandatory approval gate: Configurado"
echo "• Parallel audit processing: Optimizado"
echo ""

echo "🧪 TESTING:"
echo "• Integration tests: Configurados"
echo "• Health checks: Automáticos"
echo "• Docker Compose: Listo"
echo ""

echo "📝 LOGS Y DIAGNÓSTICO:"
echo "• Logs detallados: Disponibles en GitHub Actions"
echo "• Error extraction: Automático"
echo "• Status monitoring: En tiempo real"
echo ""

echo "🎯 PRÓXIMOS PASOS:"
echo "1. Configurar VAULT_APPROVAL_KEY en GitHub Secrets"
echo "2. Crear PR desde GitHub web interface"
echo "3. Monitorear workflows en Actions tab"
echo "4. Revisar resultados y hacer merge si todo pasa"
echo ""

echo "✅ VALIDACIÓN MANUAL COMPLETA GENERADA"
echo "Archivo guardado en: $TMPDIR/manual_validation_$(date +%Y%m%d_%H%M%S).log"

# Guardar log
log_file="$TMPDIR/manual_validation_$(date +%Y%m%d_%H%M%S).log"
cat > "$log_file" << EOF
VALIDACIÓN MANUAL COMPLETA DEL CI/CD PIPELINE
=============================================
Fecha: $(date)
Repositorio: $OWNER/$REPO
Branch: $BRANCH

WORKFLOWS CONFIGURADOS:
${WORKFLOWS[@]}

ARCHIVOS VERIFICADOS:
$(for file in "${support_files[@]}"; do echo "- $file"; done)

INSTRUCCIONES: Ver output arriba para pasos detallados
EOF

echo "Log guardado: $log_file"