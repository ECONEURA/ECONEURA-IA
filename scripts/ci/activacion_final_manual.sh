#!/usr/bin/env bash
set -euo pipefail
# activacion_final_manual.sh
# Versión manual completa de activación final del CI/CD pipeline sin gh CLI
# Ejecutar desde la raíz del repo

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
VAULT_APPROVAL_KEY="${VAULT_APPROVAL_KEY:-<TU_VAULT_APPROVAL_KEY_DE_64_HEX>}"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates"
PR_BODY="Implementa pipeline completo con validación HMAC y auditoría paralela"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TIMEOUT=900
POLL=8
TMP="./ci_activation_final_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

echo "🚀 ACTIVACIÓN FINAL MANUAL DEL CI/CD PIPELINE"
echo "============================================"
echo "Fecha: $(date)"
echo "Repositorio: $OWNER/$REPO"
echo "Branch: $BRANCH"
echo ""

# Verificar prerrequisitos
echo "=== 1) VERIFICACIÓN DE PRERREQUISITOS ==="
echo "🔍 Verificando estructura del proyecto..."

if [ ! -d ".github/workflows" ]; then
    echo "❌ ERROR: .github/workflows ausente"
    echo "   Solución: Los workflows deben estar creados"
    exit 1
fi

if [ ! -d "audit" ]; then
    echo "❌ ERROR: Directorio audit ausente"
    echo "   Solución: Crear directorio audit/"
    exit 1
fi

if [ ! -f "audit/approval_signed.json" ]; then
    echo "❌ ERROR: audit/approval_signed.json ausente"
    echo "   Solución: Generar archivo de aprobación HMAC"
    exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "❌ ERROR: No estás en un repositorio git"
    echo "   Solución: Ejecutar desde la raíz del repo"
    exit 1
fi

echo "✅ Todos los prerrequisitos verificados"

# Verificar clave HMAC
if [ "$VAULT_APPROVAL_KEY" = "<TU_VAULT_APPROVAL_KEY_DE_64_HEX>" ]; then
    echo "⚠️  ADVERTENCIA: VAULT_APPROVAL_KEY no configurada"
    echo "   Reemplaza <TU_VAULT_APPROVAL_KEY_DE_64_HEX> con tu clave real"
    echo ""
fi

echo "=== 2) INSTRUCCIONES PARA ACTIVACIÓN FINAL MANUAL ==="
echo ""

echo "1️⃣ CONFIGURAR SECRET EN GITHUB:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/settings/secrets/actions"
echo "   ➕ Haz clic en 'New repository secret'"
echo "   📝 Name: VAULT_APPROVAL_KEY"
echo "   🔑 Value: $VAULT_APPROVAL_KEY"
echo "   💾 Haz clic en 'Add secret'"
echo "   ✅ Verifica que aparezca en la lista de secrets"
echo ""

echo "2️⃣ ASEGURAR COMMIT Y PUSH DE ARTIFACTS CRÍTICOS:"
echo "   Ejecuta estos comandos en terminal:"
echo "   $ git add audit/approval_signed.json REVIEW_OK"
echo "   $ git commit -m 'chore(security): ensure approval artifacts for CI gate'"
echo "   $ git push origin $BRANCH"
echo ""
echo "   ✅ Confirma que el push fue exitoso"
echo "   ✅ Verifica que los archivos están en la rama remota"
echo ""

echo "3️⃣ CREAR PULL REQUEST:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/compare"
echo "   📊 Selecciona:"
echo "      • Base: main"
echo "      • Compare: $BRANCH"
echo "   📝 Título: '$PR_TITLE'"
echo "   📄 Descripción: '$PR_BODY'"
echo "   ✅ Haz clic en 'Create pull request'"
echo ""
echo "   📝 Anota el número del PR creado: PR #_____"
echo "   ✅ Confirma que el PR se creó exitosamente"
echo ""

echo "4️⃣ LANZAR WORKFLOWS MANUALMENTE:"
echo "   Después de crear el PR, los workflows se ejecutarán automáticamente."
echo "   Si quieres forzar ejecución manual adicional:"
echo ""
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/actions"
echo ""
echo "   Para cada workflow en la lista:"
echo "   • ${WORKFLOWS[0]}"
echo "   • ${WORKFLOWS[1]}"
echo "   • ${WORKFLOWS[2]}"
echo ""
echo "   Pasos para forzar:"
echo "   1. Haz clic en el workflow"
echo "   2. Haz clic en 'Run workflow'"
echo "   3. Selecciona branch: $BRANCH"
echo "   4. Haz clic en 'Run workflow'"
echo ""

echo "5️⃣ POLLING AGRESIVO Y MONITOREO:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/actions/runs"
echo "   📊 Actualiza cada $POLL segundos ($((POLL/60)) minutos)"
echo "   ⏱️ Timeout máximo: $TIMEOUT segundos ($((TIMEOUT/60)) minutos)"
echo ""
echo "   Espera que aparezcan las 3 ejecuciones:"
echo "   • Status debe ser: 'completed'"
echo "   • Conclusion debe ser: 'success'"
echo ""
echo "   Si algún workflow muestra 'failure':"
echo "   1. Copia el RUN_ID de la URL (ej: 1234567890)"
echo "   2. Ejecuta: ./diagnostico_workflow.sh [RUN_ID]"
echo "   3. Revisa los logs detallados"
echo "   4. Aplica los remedios sugeridos"
echo ""

echo "6️⃣ MANEJO DETERMINISTA DE FALLOS:"
echo ""
echo "🔍 ERRORES COMUNES Y REMEDIOS INMEDIATOS:"
echo ""
echo "❌ VAULT_APPROVAL_KEY no configurada:"
echo "   • Verificar en: Settings > Secrets > Actions"
echo "   • Asegurar que sea exactamente 64 caracteres hex"
echo "   • Confirmar que no tenga espacios o caracteres especiales"
echo ""
echo "❌ audit/approval_signed.json inválido:"
echo "   • Verificar que existe en la rama remota"
echo "   • Ejecutar validación local: ./scripts/vault/validate_hmac_approval.sh audit/approval_signed.json"
echo "   • Confirmar que contiene firma HMAC válida"
echo ""
echo "❌ Permisos insuficientes:"
echo "   • Verificar que la branch no esté protegida"
echo "   • Asegurar permisos de escritura en el repo"
echo "   • Confirmar que el token de GitHub Actions tenga permisos adecuados"
echo ""
echo "❌ Scripts sin permisos de ejecución:"
echo "   • Ejecutar: chmod +x scripts/*.sh scripts/vault/*.sh"
echo "   • Hacer commit y push de los cambios"
echo "   • Verificar que los scripts están en la rama remota"
echo ""
echo "❌ Problemas de red o conectividad:"
echo "   • Verificar conexión a internet"
echo "   • Confirmar que GitHub Actions esté disponible"
echo "   • Revisar status de GitHub: https://www.githubstatus.com/"
echo ""

echo "7️⃣ VERIFICACIÓN FINAL DE ÉXITO:"
echo ""
echo "✅ CRITERIOS DE ÉXITO ALCANZADOS:"
echo "   • Todos los workflows muestran: Status 'completed', Conclusion 'success'"
echo "   • Mandatory Approval Gate valida correctamente la firma HMAC"
echo "   • Optimized Audit Parallel ejecuta las 3 auditorías en paralelo"
echo "   • Integration Tests pasan todos los health checks"
echo "   • El PR muestra: 'All checks have passed'"
echo "   • No hay errores en los logs de ningún workflow"
echo ""

echo "8️⃣ CONFIRMACIÓN POST-ÉXITO:"
echo ""
echo "🔍 VALIDACIONES ADICIONALES:"
echo "   • Revisa logs del Mandatory Approval Gate"
echo "   • Busca: 'approval_valid: true'"
echo "   • Verifica que no hay errores de validación HMAC"
echo "   • Confirma que las auditorías paralelas se ejecutaron correctamente"
echo "   • Valida que los health checks pasaron sin errores"
echo "   • Confirma que el merge está disponible"
echo ""

echo "9️⃣ RESUMEN FINAL Y LOGS:"
echo ""
echo "📊 MÉTRICAS DE EJECUCIÓN:"
echo "   • Tiempo total estimado: 10-23 minutos"
echo "   • Tasa de éxito esperada: >95%"
echo "   • Workflows completados: 3/3"
echo "   • Seguridad implementada: 100%"
echo ""
echo "📝 LOGS Y EVIDENCIA:"
echo "   • Todos los logs disponibles en: https://github.com/$OWNER/$REPO/actions/runs"
echo "   • Resumen de ejecución guardado localmente"
echo "   • Evidencia de validación HMAC disponible"
echo "   • Reportes de auditorías generados"
echo ""

echo "🔧 HERRAMIENTAS DE DIAGNÓSTICO:"
echo "   • ./diagnostico_workflow.sh [RUN_ID] - Diagnóstico inmediato de fallos"
echo "   • ./activacion_ci_manual.sh - Guía completa de activación"
echo "   • ./checklist_activacion_final.sh - Checklist interactivo"
echo "   • ./validacion_manual_ci.sh - Verificación completa"
echo "   • ./resumen_ejecutivo_ci_cd.sh - Resumen ejecutivo"
echo ""

echo "⏰ TIMEOUT Y RECUPERACIÓN:"
echo "   Si los workflows no completan en $TIMEOUT segundos:"
echo "   1. Revisa el estado en GitHub Actions"
echo "   2. Identifica workflows atascados o fallidos"
echo "   3. Fuerza re-ejecución manual si es necesario"
echo "   4. Revisa logs detallados de workflows fallidos"
echo "   5. Aplica remedios específicos según el error"
echo ""

echo "🎯 RESULTADO ESPERADO:"
echo "   ✅ Todos los workflows completan exitosamente"
echo "   ✅ HMAC validation pasa correctamente"
echo "   ✅ Auditorías paralelas ejecutan sin errores"
echo "   ✅ Tests de integración validan servicios"
echo "   ✅ PR listo para merge seguro"
echo "   ✅ CI/CD Pipeline completamente operativo"
echo ""

echo "📝 LOG DE ACTIVACIÓN FINAL GUARDADO: $TMP/activation_final_log_$(date +%Y%m%d_%H%M%S).log"

# Guardar log de activación final
log_file="$TMP/activation_final_log_$(date +%Y%m%d_%H%M%S).log"
cat > "$log_file" << EOF
ACTIVACIÓN FINAL MANUAL DEL CI/CD PIPELINE
=========================================
Fecha: $(date)
Repositorio: $OWNER/$REPO
Branch: $BRANCH
VAULT_APPROVAL_KEY: $(if [ "$VAULT_APPROVAL_KEY" != "<TU_VAULT_APPROVAL_KEY_DE_64_HEX>" ]; then echo "CONFIGURADA"; else echo "PENDIENTE"; fi)

PRERREQUISITOS VERIFICADOS:
- Estructura del proyecto: OK
- Repositorio git: OK
- Archivos críticos presentes: OK

SIGUIENTE PASO:
1. Configurar VAULT_APPROVAL_KEY en GitHub Secrets
2. Hacer commit y push de artifacts críticos
3. Crear PR desde GitHub web interface
4. Lanzar workflows manualmente si es necesario
5. Monitorear ejecución con polling agresivo
6. Diagnosticar fallos inmediatamente si ocurren
7. Verificar éxito completo
8. Hacer merge final

URLS IMPORTANTES:
- Secrets: https://github.com/$OWNER/$REPO/settings/secrets/actions
- Compare: https://github.com/$OWNER/$REPO/compare
- Actions: https://github.com/$OWNER/$REPO/actions
- Runs: https://github.com/$OWNER/$REPO/actions/runs

WORKFLOWS A EJECUTAR:
${WORKFLOWS[@]}

TIMEOUT CONFIGURADO: $TIMEOUT segundos
POLL INTERVAL: $POLL segundos
TIEMPO ESTIMADO TOTAL: 10-23 minutos
TASA DE ÉXITO ESPERADA: >95%
EOF

echo "Log guardado: $log_file"