#!/bin/bash
# Script para configurar branch protection rules

OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="main"

echo "🔒 Configurando branch protection para $BRANCH..."

# Configurar branch protection con GitHub CLI
gh api repos/$OWNER/$REPO/branches/$BRANCH/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["mandatory-approval-gate","basic-validation","openapi-check"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"dismissal_restrictions":{}}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false \
  --field required_linear_history=true

if [ $? -eq 0 ]; then
    echo "✅ Branch protection configurado exitosamente"
    echo ""
    echo "🛡️  Reglas aplicadas:"
    echo "  • Status checks requeridos: mandatory-approval-gate, basic-validation, openapi-check"
    echo "  • Pull request reviews requeridos (1 aprobación)"
    echo "  • Historial lineal requerido"
    echo "  • Force push deshabilitado"
    echo "  • Eliminación de rama deshabilitada"
    echo "  • Enforce admins habilitado"
else
    echo "❌ Error configurando branch protection"
    echo "   Asegúrate de tener permisos de admin en el repositorio"
fi
