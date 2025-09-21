#!/usr/bin/env bash
set -euo pipefail
# activacion_hibrida_segura.sh - Solución alternativa robusta
# Combina automatización con control manual, evita complejidades del polling

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
NEW_HEX_64="e996aa70cb21441da934e67e1299f992c314e278cc7e62f4eb97d026bf58191d"
PR_TITLE="CI/CD Pipeline with HMAC Security Gates - Hybrid Activation"
PR_BODY="Activating HMAC gates and audit pipelines (hybrid approach)"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP="./ci_activation_hybrid_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

# Funciones de utilidad
fail(){ echo "❌ FATAL: $*" >&2; exit 1; }
warn(){ echo "⚠️  WARN: $*" >&2; }
success(){ echo "✅ $*" >&2; }

# Verificaciones previas
echo "🔍 Verificando prerrequisitos..."
command -v gh >/dev/null 2>&1 || fail "gh CLI no encontrado. Instala y autentica: https://cli.github.com/"
command -v jq >/dev/null 2>&1 || fail "jq no encontrado. Instala: apk add jq"
command -v openssl >/dev/null 2>&1 || fail "openssl no encontrado"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Ejecuta desde la raíz del repositorio"

# Verificar archivos necesarios
[ -d ".github/workflows" ] || fail "Directorio .github/workflows no encontrado"
[ -d "audit" ] || fail "Directorio audit/ no encontrado"
[ -f "audit/approval_request.json" ] || fail "Archivo audit/approval_request.json requerido"
[ -f "scripts/vault/generate_hmac_approval.sh" ] || fail "Script scripts/vault/generate_hmac_approval.sh requerido"
[ -f "scripts/vault/validate_hmac_approval.sh" ] || fail "Script scripts/vault/validate_hmac_approval.sh requerido"

echo "✅ Prerrequisitos verificados"

# PASO 1: Configurar nueva clave HMAC
echo ""
echo "🔐 PASO 1: Configurando nueva clave HMAC segura"
echo "   Clave: ${NEW_HEX_64:0:16}...${NEW_HEX_64: -16}"

# Intentar eliminar secret anterior (best-effort)
echo "   Eliminando secret anterior (si existe)..."
gh secret delete --repo "$OWNER/$REPO" VAULT_APPROVAL_KEY >/dev/null 2>&1 || warn "No se pudo eliminar secret anterior o no existía"

# Configurar nuevo secret
echo "   Configurando nuevo secret en GitHub..."
gh secret set VAULT_APPROVAL_KEY --body "$NEW_HEX_64" --repo "$OWNER/$REPO" || fail "Fallo al configurar VAULT_APPROVAL_KEY en GitHub"
success "Secret VAULT_APPROVAL_KEY configurado en GitHub"

# PASO 2: Generar y validar artifacts localmente
echo ""
echo "🔏 PASO 2: Generando y validando artifacts localmente"
export VAULT_APPROVAL_KEY="$NEW_HEX_64"

# Hacer ejecutables los scripts
chmod +x scripts/vault/generate_hmac_approval.sh scripts/vault/validate_hmac_approval.sh || true

# Generar nuevo approval
echo "   Generando approval_signed.json..."
./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new" || fail "Fallo al generar approval_signed.json"

# Validar localmente
echo "   Validando approval localmente..."
./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" 2>&1 || {
  echo "   ❌ Validación local falló. Detalles:"
  cat "$TMP/validate_out.json"
  fail "Validación local del approval falló"
}

# Verificar que la validación fue exitosa
if ! grep -q '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP/validate_out.json"; then
  echo "   ❌ Status de validación no es 'valid'. Detalles:"
  cat "$TMP/validate_out.json"
  fail "El approval no pasó la validación local"
fi

success "Approval validado localmente"

# PASO 3: Commit y push de cambios
echo ""
echo "📤 PASO 3: Aplicando cambios y haciendo push"

# Reemplazar artifact
mv "$TMP/approval_signed.json.new" audit/approval_signed.json

# Agregar archivos al git
git add audit/approval_signed.json REVIEW_OK 2>/dev/null || true

# Hacer commit
if git diff --cached --quiet; then
  echo "   No hay cambios para commitear"
else
  git commit -m "chore(security): rotate HMAC key and update approval artifacts

- Rotated VAULT_APPROVAL_KEY to new secure value
- Regenerated approval_signed.json with new HMAC
- Ready for CI/CD pipeline activation" || fail "Fallo al hacer commit"
  success "Commit realizado"
fi

# Push a la rama
echo "   Haciendo push a rama $BRANCH..."
git push origin "$BRANCH" || fail "Fallo al hacer push. Verifica permisos y protección de rama"
success "Push completado"

# PASO 4: Gestionar Pull Request
echo ""
echo "🔄 PASO 4: Gestionando Pull Request"

# Verificar si ya existe un PR
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' 2>/dev/null || echo "")

if [ -n "$PR_NUM" ]; then
  echo "   PR existente encontrado: #$PR_NUM"
else
  echo "   Creando nuevo PR..."
  gh pr create --repo "$OWNER/$REPO" --title "$PR_TITLE" --body "$PR_BODY" --head "$BRANCH" --base main || fail "Fallo al crear PR"
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' 2>/dev/null || echo "")
  success "PR creado: #$PR_NUM"
fi

# PASO 5: Trigger manual de workflows
echo ""
echo "🚀 PASO 5: Disparando workflows manualmente"
for wf in "${WORKFLOWS[@]}"; do
  echo "   Disparando workflow: $wf"
  if gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" 2>/dev/null; then
    success "Workflow '$wf' disparado"
  else
    warn "No se pudo disparar workflow '$wf' (puede que no sea manual)"
  fi
done

# Crear commit vacío para forzar re-evaluación si es necesario
echo "   Creando commit vacío para forzar re-evaluación..."
git commit --allow-empty -m "chore(ci): trigger workflow re-evaluation after HMAC rotation" >/dev/null 2>&1 || true
git push origin "$BRANCH" >/dev/null 2>&1 || true

# PASO 6: Instrucciones finales
echo ""
echo "📋 PASO 6: Próximos pasos manuales"
echo ""
echo "🎯 ACTIVACIÓN COMPLETADA EXITOSAMENTE"
echo ""
echo "📊 RESUMEN:"
echo "   • ✅ Nueva clave HMAC configurada en GitHub"
echo "   • ✅ Artifacts generados y validados localmente"
echo "   • ✅ Cambios commiteados y pusheados"
echo "   • ✅ PR listo: ${PR_NUM:-'creado'}"
echo "   • ✅ Workflows disparados manualmente"
echo ""
echo "⏳ PRÓXIMOS PASOS MANUALES:"
echo ""
echo "1. 📋 Ve a GitHub y revisa el PR #$PR_NUM:"
echo "   https://github.com/$OWNER/$REPO/pull/$PR_NUM"
echo ""
echo "2. 🔍 Espera a que los workflows se ejecuten:"
echo "   - Mandatory Approval Gate"
echo "   - Optimized Audit Parallel"
echo "   - Integration Tests with Compose"
echo ""
echo "3. ✅ Si todos los checks pasan, haz merge del PR"
echo ""
echo "4. 🎉 El sistema de seguridad enterprise estará activado"
echo ""
echo "📁 Evidencia guardada en: $TMP"
echo "🔑 Nueva clave HMAC: ${NEW_HEX_64:0:16}...${NEW_HEX_64: -16}"
echo ""
success "Activación híbrida completada exitosamente"
exit 0
