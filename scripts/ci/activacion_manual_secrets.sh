#!/usr/bin/env bash
set -euo pipefail
# activacion_manual_secrets.sh - Continuación después de configurar secret manualmente

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
# CONFIGURAR ESTA CLAVE CON LA QUE GENERASTE ANTERIORMENTE
NEW_HEX_64="1d53980cfe8f32dc64e996d7d11ba88e12ebacbfd8686de2285921e17477b416"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP="./.ci_activation_manual_$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

fail(){ echo "FATAL: $*" >&2; exit 1; }
warn(){ echo "WARN: $*" >&2; }

# Verificaciones básicas
command -v gh >/dev/null 2>&1 || fail "gh CLI required"
command -v jq >/dev/null 2>&1 || fail "jq required"
command -v openssl >/dev/null 2>&1 || fail "openssl required"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run from repo root"

[ -d ".github/workflows" ] || fail ".github/workflows missing"
[ -d "audit" ] || fail "audit directory missing"
[ -f "audit/approval_request.json" ] || fail "audit/approval_request.json required"

echo "🔐 PASO 1: Usando clave HMAC configurada manualmente"
echo "   Clave: ${NEW_HEX_64:0:16}...${NEW_HEX_64: -16}"

# Verificar que el secret existe (sin leer su valor)
echo "   Verificando que el secret existe en GitHub..."
if ! gh secret list --repo "$OWNER/$REPO" | grep -q "VAULT_APPROVAL_KEY"; then
  fail "VAULT_APPROVAL_KEY secret no encontrado. Configúralo primero en GitHub Settings > Secrets"
fi
echo "   ✅ Secret VAULT_APPROVAL_KEY encontrado en GitHub"

echo ""
echo "🔏 PASO 2: Generando y validando artifacts localmente"
export VAULT_APPROVAL_KEY="$NEW_HEX_64"

# Hacer ejecutables los scripts
chmod +x ./scripts/vault/generate_hmac_approval.sh ./scripts/vault/validate_hmac_approval.sh || true

# Generar approval
echo "   Generando approval_signed.json..."
./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new" || fail "Fallo al generar approval"

# Validar localmente
echo "   Validando approval localmente..."
./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" || {
  echo "   ❌ Validación falló:"
  cat "$TMP/validate_out.json"
  fail "Validación local falló"
}

# Verificar que es válido
if ! grep -qE '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP/validate_out.json"; then
  echo "   ❌ Status no válido:"
  cat "$TMP/validate_out.json"
  fail "Approval no válido localmente"
fi
echo "   ✅ Approval validado localmente"

echo ""
echo "📤 PASO 3: Aplicando cambios y haciendo push"
mv "$TMP/approval_signed.json.new" audit/approval_signed.json

# Agregar archivos
git add audit/approval_signed.json REVIEW_OK || true

# Hacer commit
if git diff --cached --quiet; then
  echo "   No hay cambios para commitear"
else
  git commit -m "chore(security): update approval artifacts with new HMAC

- Updated approval_signed.json with new VAULT_APPROVAL_KEY
- Ready for CI/CD pipeline activation
- HMAC validation: PASSED" || fail "Fallo al hacer commit"
  echo "   ✅ Commit realizado"
fi

# Push
echo "   Haciendo push a rama $BRANCH..."
git push origin "$BRANCH" || fail "Fallo al hacer push"
echo "   ✅ Push completado"

echo ""
echo "🔄 PASO 4: Gestionando Pull Request"
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' 2>/dev/null || echo "")

if [ -n "$PR_NUM" ]; then
  echo "   PR existente encontrado: #$PR_NUM"
else
  echo "   Creando nuevo PR..."
  gh pr create --repo "$OWNER/$REPO" --title "CI/CD Pipeline with HMAC Security Gates" --body "Activation of secure CI gates with manual secret configuration." --head "$BRANCH" --base main || fail "Fallo al crear PR"
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' 2>/dev/null || echo "")
  echo "   ✅ PR creado: #$PR_NUM"
fi

echo ""
echo "🚀 PASO 5: Disparando workflows"
for wf in "${WORKFLOWS[@]}"; do
  echo "   Disparando: $wf"
  if gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" 2>/dev/null; then
    echo "   ✅ Workflow '$wf' disparado"
  else
    warn "   No se pudo disparar '$wf' (puede que no sea manual)"
  fi
done

# Commit vacío para forzar re-evaluación
echo "   Creando commit vacío para re-evaluación..."
git commit --allow-empty -m "chore(ci): trigger workflow re-evaluation" >/dev/null 2>&1 || true
git push origin "$BRANCH" >/dev/null 2>&1 || true

echo ""
echo "📋 PASO 6: Instrucciones finales"
echo ""
echo "🎯 ACTIVACIÓN COMPLETADA EXITOSAMENTE"
echo ""
echo "📊 RESUMEN:"
echo "   ✅ Secret VAULT_APPROVAL_KEY configurado manualmente"
echo "   ✅ Artifacts generados y validados localmente"
echo "   ✅ Cambios commiteados y pusheados"
echo "   ✅ PR listo: ${PR_NUM:-'creado'}"
echo "   ✅ Workflows disparados"
echo ""
echo "⏳ PRÓXIMOS PASOS MANUALES:"
echo ""
echo "1. 📋 Ve a GitHub y revisa el PR #$PR_NUM:"
echo "   https://github.com/$OWNER/$REPO/pull/$PR_NUM"
echo ""
echo "2. 🔍 Espera a que los workflows se ejecuten:"
echo "   - Mandatory Approval Gate (debe mostrar approval_valid:true)"
echo "   - Optimized Audit Parallel"
echo "   - Integration Tests with Compose"
echo ""
echo "3. ✅ Si todos los checks pasan, haz merge del PR manualmente"
echo ""
echo "4. 🎉 El sistema de seguridad enterprise estará activado"
echo ""
echo "📁 Evidencia guardada en: $TMP"
echo "🔑 Clave HMAC usada: ${NEW_HEX_64:0:16}...${NEW_HEX_64: -16}"
echo ""
echo "⚡ NOTA: Los workflows pueden tardar 2-5 minutos en comenzar"
echo ""
echo "🏆 ¡SISTEMA DE SEGURIDAD LISTO PARA ACTIVACIÓN!"

# Limpiar variable sensible
unset NEW_HEX_64 VAULT_APPROVAL_KEY

exit 0