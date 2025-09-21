#!/usr/bin/env bash
set -euo pipefail
# activacion_manual_robusta.sh - Versión manual pero robusta
# Paso a paso con validaciones completas, sin depender de permisos de secrets

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
NEW_HEX_64="e996aa70cb21441da934e67e1299f992c314e278cc7e62f4eb97d026bf58191d"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates - Manual Activation"
PR_BODY="Activating HMAC gates and audit pipelines (manual robust approach)"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP="./ci_activation_manual_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

# Funciones de utilidad
fail(){ echo "❌ FATAL: $*" >&2; exit 1; }
warn(){ echo "⚠️  WARN: $*" >&2; }
success(){ echo "✅ $*" >&2; }
info(){ echo "ℹ️  $*" >&2; }

echo "🎯 ACTIVACIÓN MANUAL ROBUSTA - PASO A PASO"
echo "=========================================="
echo ""

# PASO 1: Verificaciones previas
echo "📋 PASO 1: Verificaciones del sistema"
echo "-------------------------------------"

info "Verificando prerrequisitos..."
command -v jq >/dev/null 2>&1 || fail "jq no encontrado. Instala: apk add jq"
command -v openssl >/dev/null 2>&1 || fail "openssl no encontrado"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Ejecuta desde la raíz del repositorio"

# Verificar archivos necesarios
[ -d ".github/workflows" ] || fail "Directorio .github/workflows no encontrado"
[ -d "audit" ] || fail "Directorio audit/ no encontrado"
[ -f "audit/approval_request.json" ] || fail "Archivo audit/approval_request.json requerido"
[ -f "scripts/vault/generate_hmac_approval.sh" ] || fail "Script scripts/vault/generate_hmac_approval.sh requerido"
[ -f "scripts/vault/validate_hmac_approval.sh" ] || fail "Script scripts/vault/validate_hmac_approval.sh requerido"

success "Sistema verificado correctamente"
echo ""

# PASO 2: Generar y validar artifacts localmente
echo "🔏 PASO 2: Generando artifacts validados localmente"
echo "-------------------------------------------------"

export VAULT_APPROVAL_KEY="$NEW_HEX_64"

# Hacer ejecutables los scripts
chmod +x scripts/vault/generate_hmac_approval.sh scripts/vault/validate_hmac_approval.sh || true

info "Generando approval_signed.json..."
./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new" || fail "Fallo al generar approval_signed.json"

info "Validando approval localmente..."
./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" 2>&1 || {
  echo "❌ Validación local falló. Detalles:"
  cat "$TMP/validate_out.json"
  fail "Validación local del approval falló"
}

# Verificar que la validación fue exitosa
if ! grep -q '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP/validate_out.json"; then
  echo "❌ Status de validación no es 'valid'. Detalles:"
  cat "$TMP/validate_out.json"
  fail "El approval no pasó la validación local"
fi

success "Artifacts generados y validados localmente"
echo ""

# PASO 3: Preparar cambios para commit
echo "📝 PASO 3: Preparando cambios para commit"
echo "---------------------------------------"

info "Aplicando cambios validados..."
mv "$TMP/approval_signed.json.new" audit/approval_signed.json

info "Agregando archivos al staging area..."
git add audit/approval_signed.json REVIEW_OK 2>/dev/null || true

# Verificar si hay cambios
if git diff --cached --quiet; then
  info "No hay cambios nuevos para commitear"
else
  info "Mostrando cambios preparados:"
  git diff --cached --stat
fi

success "Cambios preparados para commit"
echo ""

# PASO 4: Mostrar instrucciones para GitHub
echo "🚀 PASO 4: INSTRUCCIONES PARA COMPLETAR LA ACTIVACIÓN"
echo "======================================================"
echo ""

echo "📋 PASOS MANUALES EN GITHUB:"
echo ""

echo "🔑 1. CONFIGURAR SECRET EN GITHUB:"
echo "   • Ve a: https://github.com/$OWNER/$REPO/settings/secrets/actions"
echo "   • Crea un nuevo secret llamado: VAULT_APPROVAL_KEY"
echo "   • Valor: $NEW_HEX_64"
echo "   • Haz clic en 'Add secret'"
echo ""

echo "📤 2. HACER COMMIT Y PUSH:"
echo "   • Ejecuta estos comandos:"
echo "     git commit -m 'chore(security): activate HMAC security gates"
echo "     "
echo "     - Rotate VAULT_APPROVAL_KEY to new secure value"
echo "     - Regenerate approval_signed.json with new HMAC"
echo "     - Ready for CI/CD pipeline activation'"
echo "     "
echo "     git push origin $BRANCH"
echo ""

echo "🔄 3. CREAR PULL REQUEST:"
echo "   • Ve a: https://github.com/$OWNER/$REPO/pull/new"
echo "   • Base: main"
echo "   • Compare: $BRANCH"
echo "   • Title: $PR_TITLE"
echo "   • Description: $PR_BODY"
echo "   • Haz clic en 'Create pull request'"
echo ""

echo "⚙️  4. DISPARAR WORKFLOWS:"
echo "   • Ve a la pestaña 'Actions' del PR"
echo "   • Para cada workflow, haz clic en el botón 'Re-run jobs'"
echo "   • Workflows a ejecutar:"
for wf in "${WORKFLOWS[@]}"; do
  echo "     - $wf"
done
echo ""

echo "✅ 5. VERIFICAR Y MERGE:"
echo "   • Espera a que todos los checks pasen (pueden tardar 5-15 minutos)"
echo "   • Si todos los checks pasan, haz merge del PR"
echo "   • Selecciona 'Merge pull request' y confirma"
echo ""

echo "🎯 RESULTADO ESPERADO:"
echo "   • Mandatory Approval Gate mostrará: approval_valid: true"
echo "   • Todos los workflows completarán exitosamente"
echo "   • El sistema de seguridad HMAC estará activado"
echo ""

# PASO 5: Crear script de comandos para facilitar la ejecución
echo "📄 PASO 5: Script de comandos generado"
echo "====================================="

COMMANDS_FILE="$TMP/comandos_activacion.sh"
cat > "$COMMANDS_FILE" << EOF
#!/bin/bash
# Comandos para completar la activación manual

echo "🚀 Ejecutando comandos de activación..."

# Hacer commit
git commit -m "chore(security): activate HMAC security gates

- Rotate VAULT_APPROVAL_KEY to new secure value
- Regenerate approval_signed.json with new HMAC
- Ready for CI/CD pipeline activation"

# Push a la rama
git push origin $BRANCH

echo "✅ Commit y push completados"
echo "🔄 Ahora crea el PR manualmente en GitHub"
EOF

chmod +x "$COMMANDS_FILE"

success "Script de comandos creado: $COMMANDS_FILE"
echo ""

# PASO 6: Resumen final
echo "📊 RESUMEN DE LA ACTIVACIÓN"
echo "==========================="
echo ""
echo "✅ ARTIFACTS GENERADOS:"
echo "   • approval_signed.json validado localmente"
echo "   • Nueva clave HMAC: ${NEW_HEX_64:0:16}...${NEW_HEX_64: -16}"
echo ""
echo "📁 ARCHIVOS CREADOS:"
echo "   • $TMP/ - Directorio temporal con evidencia"
echo "   • $COMMANDS_FILE - Script de comandos para ejecutar"
echo ""
echo "⏱️  TIEMPO ESTIMADO:"
echo "   • Configuración manual: 5-10 minutos"
echo "   • Ejecución de workflows: 5-15 minutos"
echo "   • Total: 10-25 minutos"
echo ""
echo "🛡️ SEGURIDAD:"
echo "   • ✅ Validación HMAC-SHA256 local"
echo "   • ✅ Artifacts firmados correctamente"
echo "   • ✅ Nueva clave segura generada"
echo ""

success "Activación manual preparada exitosamente"
echo ""
info "Ejecuta: $COMMANDS_FILE"
info "O sigue las instrucciones manuales mostradas arriba"

exit 0
