#!/usr/bin/env bash
set -euo pipefail
# ejecucion_manual_workflows.sh
# Versión manual del script de ejecución de workflows sin gh CLI
# Ejecutar desde la raíz del repo

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
VAULT_APPROVAL_KEY="${VAULT_APPROVAL_KEY:-<TU_VAULT_APPROVAL_KEY_DE_64_HEX>}"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Implementa pipeline completo con validación HMAC y auditoría paralela"

echo "🚀 EJECUCIÓN MANUAL DE WORKFLOWS CI/CD"
echo "======================================"
echo "Fecha: $(date)"
echo "Repositorio: $OWNER/$REPO"
echo "Branch: $BRANCH"
echo ""

# Verificar si la clave está configurada
if [ "$VAULT_APPROVAL_KEY" = "<TU_VAULT_APPROVAL_KEY_DE_64_HEX>" ]; then
    echo "⚠️  ADVERTENCIA: VAULT_APPROVAL_KEY no configurada"
    echo "   Reemplaza <TU_VAULT_APPROVAL_KEY_DE_64_HEX> con tu clave real"
    echo ""
fi

echo "📋 INSTRUCCIONES PARA EJECUCIÓN MANUAL:"
echo ""

echo "1️⃣ CONFIGURAR SECRET EN GITHUB:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/settings/secrets/actions"
echo "   ➕ Haz clic en 'New repository secret'"
echo "   📝 Name: VAULT_APPROVAL_KEY"
echo "   🔑 Value: $VAULT_APPROVAL_KEY"
echo "   💾 Haz clic en 'Add secret'"
echo ""

echo "2️⃣ CREAR PULL REQUEST:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/compare"
echo "   📊 Selecciona:"
echo "      • Base: main"
echo "      • Compare: $BRANCH"
echo "   📝 Título: '$PR_TITLE'"
echo "   📄 Descripción: '$PR_BODY'"
echo "   ✅ Haz clic en 'Create pull request'"
echo ""

echo "3️⃣ FORZAR EJECUCIÓN DE WORKFLOWS:"
echo "   Después de crear el PR, los workflows se ejecutarán automáticamente."
echo "   Si quieres forzar la ejecución manual:"
echo ""
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/actions"
echo ""
echo "   Para cada workflow:"
echo "   • Haz clic en el workflow"
echo "   • Haz clic en 'Run workflow'"
echo "   • Selecciona la branch: $BRANCH"
echo "   • Haz clic en 'Run workflow'"
echo ""

echo "   Workflows a ejecutar:"
echo "   🔐 Mandatory Approval Gate"
echo "   ⚡ Optimized Audit Parallel"
echo "   🐳 Integration Tests with Compose"
echo ""

echo "4️⃣ MONITOREAR EJECUCIONES:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/actions/runs"
echo "   📊 Actualiza la página cada 30-60 segundos"
echo "   👀 Espera que aparezcan las 3 nuevas ejecuciones"
echo ""
echo "   Para cada ejecución:"
echo "   • Status debe ser: completed"
echo "   • Conclusion debe ser: success"
echo "   • Si es failure, anota el RUN_ID"
echo ""

echo "5️⃣ REVISAR LOGS DETALLADOS:"
echo "   Para el workflow 'Mandatory Approval Gate':"
echo "   • Haz clic en la ejecución más reciente"
echo "   • Ve a la pestaña 'Jobs'"
echo "   • Haz clic en el job 'check_artifact_and_validate'"
echo "   • Revisa los logs de cada step"
echo ""

echo "6️⃣ DETECTAR RUNS FALLIDOS:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/actions/runs"
echo "   🔍 Filtra por status: 'Failure' o 'Cancelled'"
echo "   📝 Anota los RUN_ID de cualquier ejecución fallida"
echo ""
echo "   Si encuentras runs fallidos:"
echo "   • Copia el RUN_ID (número de la URL)"
echo "   • Ejecuta: ./diagnostico_workflow.sh [RUN_ID]"
echo ""

echo "7️⃣ VERIFICACIÓN FINAL:"
echo "   Una vez que todos los workflows pasan:"
echo "   • El PR debe mostrar 'All checks have passed'"
echo "   • El botón 'Merge pull request' debe estar disponible"
echo "   • Confirma que no hay conflictos"
echo "   • Haz merge del PR"
echo ""

echo "📊 RESUMEN DE EJECUCIÓN ESPERADA:"
echo ""
echo "🔐 Mandatory Approval Gate:"
echo "   • Valida HMAC-SHA256 del approval_signed.json"
echo "   • Bloquea merge si la validación falla"
echo "   • Job: check_artifact_and_validate"
echo ""

echo "⚡ Optimized Audit Parallel:"
echo "   • Ejecuta auditorías en paralelo (hmac, sbom, evidence)"
echo "   • Usa matrix strategy para concurrencia"
echo "   • Jobs: audit-matrix (3 instancias)"
echo ""

echo "🐳 Integration Tests with Compose:"
echo "   • Levanta servicios con Docker Compose"
echo "   • Ejecuta health checks automáticos"
echo "   • Job: compose-tests"
echo ""

echo "⏱️  TIEMPOS ESTIMADOS:"
echo "   • Mandatory: 2-5 minutos"
echo "   • Audit Parallel: 3-8 minutos"
echo "   • Integration: 5-10 minutos"
echo "   • Total: 10-23 minutos"
echo ""

echo "🔧 HERRAMIENTAS DE DIAGNÓSTICO:"
echo "   • ./diagnostico_workflow.sh [RUN_ID] - Diagnóstico detallado"
echo "   • ./validacion_manual_ci.sh - Verificación completa"
echo "   • Logs en GitHub Actions - Información detallada"
echo ""

echo "✅ INSTRUCCIONES GENERADAS"
echo "Log guardado en: ./ejecucion_manual_$(date +%Y%m%d_%H%M%S).log"

# Guardar instrucciones en archivo
log_file="./ejecucion_manual_$(date +%Y%m%d_%H%M%S).log"
cat > "$log_file" << EOF
EJECUCIÓN MANUAL DE WORKFLOWS CI/CD
===================================
Fecha: $(date)
Repositorio: $OWNER/$REPO
Branch: $BRANCH
VAULT_APPROVAL_KEY: $(if [ "$VAULT_APPROVAL_KEY" != "<TU_VAULT_APPROVAL_KEY_DE_64_HEX>" ]; then echo "CONFIGURADA"; else echo "PENDIENTE"; fi)

INSTRUCCIONES: Ver output arriba para pasos detallados

WORKFLOWS A EJECUTAR:
- Mandatory Approval Gate
- Optimized Audit Parallel
- Integration Tests with Compose

URLS IMPORTANTES:
- Secrets: https://github.com/$OWNER/$REPO/settings/secrets/actions
- Compare: https://github.com/$OWNER/$REPO/compare
- Actions: https://github.com/$OWNER/$REPO/actions
- Runs: https://github.com/$OWNER/$REPO/actions/runs
EOF

echo "Log guardado: $log_file"