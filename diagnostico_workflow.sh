#!/usr/bin/env bash
set -euo pipefail
# diagnostico_workflow.sh
# Diagnóstico rápido de workflows fallidos sin gh CLI
# Uso: ./diagnostico_workflow.sh [RUN_ID]

OWNER="ECONEURA"
REPO="ECONEURA-IA"
RUN_ID="${1:-}"

if [ -z "$RUN_ID" ]; then
    echo "❌ ERROR: Debes proporcionar un RUN_ID"
    echo "Uso: $0 <RUN_ID>"
    echo ""
    echo "Para encontrar el RUN_ID:"
    echo "1. Ve a: https://github.com/$OWNER/$REPO/actions/runs"
    echo "2. Haz clic en la ejecución fallida"
    echo "3. Copia el número del RUN_ID de la URL"
    echo "   Ejemplo: https://github.com/ECONEURA/ECONEURA-IA/actions/runs/1234567890"
    echo "   RUN_ID sería: 1234567890"
    exit 1
fi

echo "🔍 DIAGNÓSTICO DE WORKFLOW FALLIDO"
echo "==================================="
echo "Repositorio: $OWNER/$REPO"
echo "RUN_ID: $RUN_ID"
echo "Fecha: $(date)"
echo ""

echo "📋 INSTRUCCIONES PARA DIAGNÓSTICO MANUAL:"
echo ""
echo "1️⃣ ACCEDER A LOS LOGS:"
echo "   Ve a: https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID"
echo ""

echo "2️⃣ REVISAR ESTADO GENERAL:"
echo "   • Status debe ser: completed"
echo "   • Conclusion debe ser: success (si falló será: failure)"
echo "   • Revisa la duración total"
echo ""

echo "3️⃣ IDENTIFICAR JOB FALLIDO:"
echo "   • Ve a la pestaña 'Jobs'"
echo "   • Busca jobs marcados en rojo (failed)"
echo "   • Jobs verdes son exitosos"
echo ""

echo "4️⃣ REVISAR LOGS DETALLADOS:"
echo "   • Haz clic en el job fallido"
echo "   • Revisa las pestañas: 'Set up job', 'Run ...', etc."
echo "   • Busca mensajes de error específicos"
echo ""

echo "5️⃣ ERRORES COMUNES A BUSCAR:"
echo ""
echo "🔐 ERRORES DE HMAC/APROBACIÓN:"
echo "   • 'HMAC validation failed'"
echo "   • 'approval_signed.json not found'"
echo "   • 'VAULT_APPROVAL_KEY not configured'"
echo "   • 'REVIEW_OK file missing'"
echo ""

echo "⚡ ERRORES DE AUDITORÍA:"
echo "   • 'validate_with_cache.sh not found'"
echo "   • 'automated_audit_pipeline.sh not found'"
echo "   • 'Permission denied' en scripts"
echo "   • 'Command not found' para herramientas"
echo ""

echo "🐳 ERRORES DE DOCKER/INTEGRACIÓN:"
echo "   • 'docker-compose up failed'"
echo "   • 'health check timeout'"
echo "   • 'service not responding'"
echo "   • 'port already in use'"
echo ""

echo "📁 ERRORES DE ARCHIVOS:"
echo "   • 'No such file or directory'"
echo "   • 'Permission denied'"
echo "   • 'File not found' para scripts de soporte"
echo ""

echo "6️⃣ SOLUCIONES COMUNES:"
echo ""
echo "🔧 PARA ERRORES DE SECRET:"
echo "   • Configurar VAULT_APPROVAL_KEY en GitHub Secrets"
echo "   • Verificar que sea una clave HMAC-SHA256 válida (64 chars hex)"
echo ""

echo "🔧 PARA ERRORES DE PERMISOS:"
echo "   • Verificar que los scripts tengan chmod +x"
echo "   • Asegurar que los archivos estén en las rutas correctas"
echo ""

echo "🔧 PARA ERRORES DE DEPENDENCIAS:"
echo "   • Verificar que jq esté instalado"
echo "   • Verificar que unzip esté disponible"
echo "   • Verificar que openssl esté instalado"
echo ""

echo "7️⃣ GENERAR REPORTE DE ERROR:"
echo "   Una vez identificado el error, copia:"
echo "   • El mensaje de error exacto"
echo "   • El job que falló"
echo "   • Los últimos 10-20 líneas del log"
echo "   • La configuración del workflow"
echo ""

echo "8️⃣ REINTENTAR WORKFLOW:"
echo "   Después de corregir el problema:"
echo "   • Haz commit de los cambios"
echo "   • Push a la rama"
echo "   • El workflow se ejecutará automáticamente"
echo "   • O fuerza re-ejecución desde GitHub Actions"
echo ""

echo "📞 CONTACTO PARA SOPORTE:"
echo "   Si no puedes resolver el error:"
echo "   • Documenta todos los pasos seguidos"
echo "   • Incluye el RUN_ID y mensajes de error"
echo "   • Describe qué cambios hiciste antes del fallo"
echo ""

echo "✅ DIAGNÓSTICO GENERADO PARA RUN_ID: $RUN_ID"
echo "Log guardado en: ./diagnostico_run_${RUN_ID}_$(date +%Y%m%d_%H%M%S).log"

# Guardar diagnóstico en archivo
log_file="./diagnostico_run_${RUN_ID}_$(date +%Y%m%d_%H%M%S).log"
cat > "$log_file" << EOF
DIAGNÓSTICO DE WORKFLOW FALLIDO
===============================
Fecha: $(date)
Repositorio: $OWNER/$REPO
RUN_ID: $RUN_ID

URL del Run: https://github.com/$OWNER/$REPO/actions/runs/$RUN_ID

INSTRUCCIONES: Ver output arriba para diagnóstico detallado
EOF

echo "Log guardado: $log_file"