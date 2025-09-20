#!/usr/bin/env bash
set -euo pipefail
# activacion_ci_manual.sh
# Versión manual completa de activación del CI/CD pipeline sin gh CLI
# Ejecutar desde la raíz del repo

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
VAULT_APPROVAL_KEY="${VAULT_APPROVAL_KEY:-<TU_VAULT_APPROVAL_KEY_DE_64_HEX>}"
TIMEOUT=900
POLL=6
TMP="./ci_activation_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

echo "🚀 ACTIVACIÓN MANUAL COMPLETA DEL CI/CD PIPELINE"
echo "==============================================="
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

echo "✅ Estructura del proyecto correcta"

# Verificar estado de git
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "❌ ERROR: No estás en un repositorio git"
    echo "   Solución: Ejecutar desde la raíz del repo"
    exit 1
fi

# Verificar cambios sin commitear
if [ "$(git status --porcelain | wc -l)" != "0" ]; then
    echo "⚠️  ADVERTENCIA: Hay cambios sin commitear"
    echo "   Cambios detectados:"
    git status --porcelain
    echo ""
    echo "   Recomendación: Hacer commit antes de continuar"
fi

echo ""

# Verificar clave HMAC
if [ "$VAULT_APPROVAL_KEY" = "<TU_VAULT_APPROVAL_KEY_DE_64_HEX>" ]; then
    echo "⚠️  ADVERTENCIA: VAULT_APPROVAL_KEY no configurada"
    echo "   Reemplaza <TU_VAULT_APPROVAL_KEY_DE_64_HEX> con tu clave real"
    echo ""
fi

echo "=== 2) INSTRUCCIONES PARA CONFIGURACIÓN MANUAL ==="
echo ""

echo "1️⃣ CONFIGURAR SECRET EN GITHUB:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/settings/secrets/actions"
echo "   ➕ Haz clic en 'New repository secret'"
echo "   📝 Name: VAULT_APPROVAL_KEY"
echo "   🔑 Value: $VAULT_APPROVAL_KEY"
echo "   💾 Haz clic en 'Add secret'"
echo "   ✅ Verifica que aparezca en la lista de secrets"
echo ""

echo "2️⃣ ASEGURAR COMMIT DE ARTIFACTS CRÍTICOS:"
echo "   Ejecuta estos comandos:"
echo "   $ git add audit/approval_signed.json REVIEW_OK"
echo "   $ git commit -m 'chore(security): ensure approval artifacts for CI gate'"
echo "   $ git push origin $BRANCH"
echo ""
echo "   ✅ Confirma que el push fue exitoso"
echo ""

echo "3️⃣ CREAR PULL REQUEST:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/compare"
echo "   📊 Selecciona:"
echo "      • Base: main"
echo "      • Compare: $BRANCH"
echo "   📝 Título: 'CI/CD Pipeline with HMAC Security Gates'"
echo "   📄 Descripción: 'Activate HMAC gates and audits'"
echo "   ✅ Haz clic en 'Create pull request'"
echo ""
echo "   📝 Anota el número del PR creado: PR #_____"
echo ""

echo "4️⃣ FORZAR EJECUCIÓN DE WORKFLOWS:"
echo "   Después de crear el PR, los workflows se ejecutarán automáticamente."
echo "   Si quieres forzar ejecución manual:"
echo ""
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/actions"
echo ""
echo "   Para cada workflow:"
echo "   • Mandatory Approval Gate"
echo "   • Optimized Audit Parallel"
echo "   • Integration Tests with Compose"
echo ""
echo "   Pasos para forzar:"
echo "   1. Haz clic en el workflow"
echo "   2. Haz clic en 'Run workflow'"
echo "   3. Selecciona branch: $BRANCH"
echo "   4. Haz clic en 'Run workflow'"
echo ""

echo "5️⃣ MONITOREO AGRESIVO CON TIMEOUT:"
echo "   🔗 Ve a: https://github.com/$OWNER/$REPO/actions/runs"
echo "   📊 Actualiza cada $POLL segundos"
echo "   ⏱️ Timeout máximo: $TIMEOUT segundos ($((TIMEOUT/60)) minutos)"
echo ""
echo "   Espera que aparezcan las 3 ejecuciones:"
echo "   • Status debe ser: 'completed'"
echo "   • Conclusion debe ser: 'success'"
echo ""
echo "   Si algún workflow muestra 'failure':"
echo "   1. Copia el RUN_ID de la URL"
echo "   2. Ejecuta: ./diagnostico_workflow.sh [RUN_ID]"
echo "   3. Revisa los logs detallados"
echo ""

echo "6️⃣ MANEJO DETERMINISTA DE FALLOS:"
echo ""
echo "🔍 ERRORES COMUNES Y REMEDIOS:"
echo ""
echo "❌ VAULT_APPROVAL_KEY no configurada:"
echo "   • Verificar en: Settings > Secrets > Actions"
echo "   • Asegurar que sea exactamente 64 caracteres hex"
echo ""
echo "❌ audit/approval_signed.json inválido:"
echo "   • Verificar que existe en la rama remota"
echo "   • Ejecutar validación local: ./scripts/vault/validate_hmac_approval.sh audit/approval_signed.json"
echo ""
echo "❌ Permisos insuficientes:"
echo "   • Verificar que la branch no esté protegida"
echo "   • Asegurar permisos de escritura en el repo"
echo ""
echo "❌ Scripts sin permisos de ejecución:"
echo "   • Ejecutar: chmod +x scripts/*.sh scripts/vault/*.sh"
echo "   • Hacer commit y push de los cambios"
echo ""

echo "7️⃣ VERIFICACIÓN FINAL DE ÉXITO:"
echo ""
echo "✅ CRITERIOS DE ÉXITO:"
echo "   • Todos los workflows muestran: Status 'completed', Conclusion 'success'"
echo "   • Mandatory Approval Gate valida correctamente la firma HMAC"
echo "   • Optimized Audit Parallel ejecuta las 3 auditorías en paralelo"
echo "   • Integration Tests pasan todos los health checks"
echo "   • El PR muestra: 'All checks have passed'"
echo "   • El botón 'Merge pull request' está disponible"
echo ""

echo "8️⃣ POSTCHECKS MANUALES:"
echo ""
echo "🔍 VALIDACIONES ADICIONALES:"
echo "   • Revisa logs del Mandatory Approval Gate"
echo "   • Busca: 'approval_valid: true'"
echo "   • Verifica que no hay errores de validación HMAC"
echo "   • Confirma que las auditorías paralelas se ejecutaron"
echo "   • Valida que los health checks pasaron"
echo ""

echo "📊 MÉTRICAS ESPERADAS:"
echo "   • Tiempo total estimado: 10-23 minutos"
echo "   • Tasa de éxito esperada: >95%"
echo "   • Workflows completados: 3/3"
echo ""

echo "🔧 HERRAMIENTAS DE DIAGNÓSTICO:"
echo "   • ./diagnostico_workflow.sh [RUN_ID] - Diagnóstico detallado"
echo "   • ./validacion_manual_ci.sh - Verificación completa"
echo "   • ./checklist_final_verificacion.sh - Checklist de verificación"
echo ""

echo "⏰ TIMEOUT Y RECUPERACIÓN:"
echo "   Si los workflows no completan en $TIMEOUT segundos:"
echo "   1. Revisa el estado en GitHub Actions"
echo "   2. Identifica workflows atascados"
echo "   3. Fuerza re-ejecución manual si es necesario"
echo "   4. Revisa logs de workflows fallidos"
echo ""

echo "🎯 RESULTADO ESPERADO:"
echo "   ✅ Todos los workflows completan exitosamente"
echo "   ✅ HMAC validation pasa"
echo "   ✅ Auditorías paralelas ejecutan correctamente"
echo "   ✅ Tests de integración validan servicios"
echo "   ✅ PR listo para merge seguro"
echo ""

echo "📝 LOG DE ACTIVACIÓN GUARDADO: $TMP/activation_log_$(date +%Y%m%d_%H%M%S).log"

# Guardar log de activación
log_file="$TMP/activation_log_$(date +%Y%m%d_%H%M%S).log"
cat > "$log_file" << EOF
ACTIVACIÓN MANUAL COMPLETA DEL CI/CD PIPELINE
===========================================
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
2. Hacer commit y push de artifacts
3. Crear PR desde GitHub web interface
4. Monitorear workflows en Actions
5. Verificar funcionamiento completo

URLS IMPORTANTES:
- Secrets: https://github.com/$OWNER/$REPO/settings/secrets/actions
- Compare: https://github.com/$OWNER/$REPO/compare
- Actions: https://github.com/$OWNER/$REPO/actions
- Runs: https://github.com/$OWNER/$REPO/actions/runs

TIMEOUT CONFIGURADO: $TIMEOUT segundos
POLL INTERVAL: $POLL segundos
EOF

echo "Log guardado: $log_file"