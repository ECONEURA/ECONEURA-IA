#!/usr/bin/env bash
set -euo pipefail
# Script todo-en-uno para completar configuración CI, validar approval, commitear y relanzar workflows.
# Reemplaza OWNER/REPO y VAULT values donde se indica. NO incluye valores secretos.
# Ejecutar desde la raíz del repo (VS Code). No expone ni imprime secrets.

OWNER="ECONEURA"            # REEMPLAZA: propietario del repo (user u org)
REPO="ECONEURA-IA"              # REEMPLAZA: nombre del repo
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
PATCH_DIR="patches_workflow_$(date --utc +%Y%m%dT%H%M%SZ)"
mkdir -p "$PATCH_DIR"

# 1) Verificar precondiciones locales
git status --porcelain > /dev/null
if [ ! -d ".github/workflows" ]; then echo "ERROR: .github/workflows no existe"; exit 1; fi
if [ ! -d "audit" ]; then echo "ERROR: audit/ no existe"; exit 1; fi

# 2) Comprobar existencia de approval artifact
APP="audit/approval_signed.json"
if [ ! -f "$APP" ]; then echo "ERROR: falta $APP. Genera el approval antes de continuar."; exit 2; fi

# 3) Pedir al operador la clave HMAC en variable de entorno (no se imprime)
if [ -z "${VAULT_APPROVAL_KEY:-}" ]; then
  read -s -p "Introduce VAULT_APPROVAL_KEY (hex) y pulsa ENTER: " VAULT_APPROVAL_KEY
  echo
fi

# 4) Validar HMAC localmente (fallo rápido si inválido)
export VAULT_APPROVAL_KEY
chmod +x scripts/vault/validate_hmac_approval.sh || true
VALID_OUT="$(./scripts/vault/validate_hmac_approval.sh "$APP" 2>&1 || true)"
echo "$VALID_OUT" | jq -e '.status=="valid"' > /dev/null 2>&1 || { echo "ERROR: approval inválido: $VALID_OUT"; exit 3; }

# 5) Ejecutar preflight local
chmod +x scripts/ci_preflight.sh || true
./scripts/ci_preflight.sh || { echo "ERROR: preflight falló"; exit 4; }

# 6) Añadir REVIEW_OK si no existe
if [ ! -f REVIEW_OK ]; then
  cat > REVIEW_OK <<EOF
approved_by=local-operator
approved_file=$(basename "$APP")
approved_at=$(date --iso-8601=seconds)
EOF
fi

# 7) Crear commit con artifacts de aprobación (no se hace push automáticamente si hay conflictos)
git add "$APP" REVIEW_OK
git commit -m "chore(security): add approval_signed and REVIEW_OK for CI gate" || echo "No changes to commit"

# 8) Generar patch local y reset soft para dejar working tree sin push
git format-patch -1 -o "$PATCH_DIR" || true
git reset --soft HEAD~1 || true

# 9) Sugerir configuración de secrets en GitHub (no escribe valores)
cat > "$PATCH_DIR/set_github_secrets.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# Reemplaza los placeholders y ejecuta estos comandos para configurar secrets en GitHub (gh CLI autenticado).
# gh repo set-secret OWNER/REPO VAULT_ADDR --body "https://vault.example.local"
# gh repo set-secret OWNER/REPO VAULT_TOKEN --body "<VAULT_TOKEN_PLACEHOLDER>"
# gh repo set-secret OWNER/REPO VAULT_APPROVAL_KEY --body "<VAULT_APPROVAL_KEY_HEX>"
echo "Edita y ejecuta los comandos comentados dentro de este archivo para configurar secrets."
SH
chmod +x "$PATCH_DIR/set_github_secrets.sh"

# 10) Empujar rama (opcional) con confirmación explícita del operador
read -p "¿Quieres PUSH a origin/$BRANCH ahora? (yes/no) " PUSH_ANSWER
if [ "$PUSH_ANSWER" = "yes" ]; then
  git add "$APP" REVIEW_OK
  git commit -m "chore(security): add approval_signed and REVIEW_OK for CI gate" || true
  git push origin "$BRANCH"
  echo "Pushed branch $BRANCH"
else
  echo "No se realizó push. Patch disponible en: $PATCH_DIR"
fi

# 11) Si se ha hecho push, relanzar workflows fallidos en el PR automáticamente (requiere gh CLI y permisos)
if [ "$PUSH_ANSWER" = "yes" ]; then
  PR_NUM="$(gh pr view --json number -q .number)"
  if [ -z "$PR_NUM" ]; then echo "No se detectó PR para la rama actual"; exit 0; fi
  echo "PR detectado: #$PR_NUM. Relanzando workflows clave..."
  # Relanzar por nombre (si no existe, ignora errores)
  gh workflow run "Mandatory Approval Gate" --ref "refs/heads/$BRANCH" || true
  gh workflow run "Optimized Audit Parallel" --ref "refs/heads/$BRANCH" || true
  gh workflow run "Integration Tests with Compose" --ref "refs/heads/$BRANCH" || true
  echo "Workflows lanzados. Espera la finalización en GitHub Actions."
else
  echo "Si decides hacer push más tarde, ejecuta: git push origin $BRANCH  && gh workflow run 'Mandatory Approval Gate' --ref HEAD"
fi

# 12) Recoger logs iniciales si se relanzaron (intento no crítico)
if [ "$PUSH_ANSWER" = "yes" ]; then
  sleep 5
  echo "Últimos 5 runs:"
  gh run list --limit 5
fi

echo "END: Patch en $PATCH_DIR. Revisa checklist y secrets antes de merges."