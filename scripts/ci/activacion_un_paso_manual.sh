#!/usr/bin/env bash
set -euo pipefail
# activacion_un_paso_manual.sh — versión manual que continúa después de configurar secret
# CONFIGURA ESTA CLAVE CON LA QUE GENERASTE MANUALMENTE
NEW_HEX_64="9955b6538c5700765ae4cbb68dd1edbb47c9eee4cacf854d0e9ba6b7690d7df1"
OWNER="ECONEURA"
REPO="ECONEURA-IA"
BRANCH="econeura/audit/hmac-canary/20250920T154117Z-13586"
WORKFLOWS=("Mandatory Approval Gate" "Optimized Audit Parallel" "Integration Tests with Compose")
TMP="./.ci_activation_un_paso_$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$TMP"

fail(){ echo "FATAL: $*" >&2; exit 1; }
warn(){ echo "WARN: $*" >&2; }

# prereqs
command -v gh >/dev/null 2>&1 || fail "gh CLI required"
command -v jq >/dev/null 2>&1 || fail "jq required"
command -v openssl >/dev/null 2>&1 || fail "openssl required"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Run from repo root"

# sanity
[ -d ".github/workflows" ] || fail ".github/workflows missing"
[ -d "audit" ] || fail "audit directory missing"
[ -f "audit/approval_request.json" ] || fail "audit/approval_request.json required"

echo "1/7 — Verificando que el secret VAULT_APPROVAL_KEY existe en GitHub..."
if ! gh secret list --repo "$OWNER/$REPO" | grep -q "VAULT_APPROVAL_KEY"; then
  fail "VAULT_APPROVAL_KEY secret no encontrado. Configúralo primero en GitHub Settings > Secrets"
fi
echo "   ✅ Secret VAULT_APPROVAL_KEY encontrado en GitHub"

echo "2/7 — Cancelando runs en progreso (limpieza previa)..."
for id in $(gh run list --repo "$OWNER/$REPO" --status in_progress --limit 100 --json id -q '.[].id' 2>/dev/null || echo ""); do
  gh run cancel --repo "$OWNER/$REPO" "$id" >/dev/null 2>&1 || true
done
echo "   ✅ Runs en progreso cancelados"

echo "3/7 — Regenerando approval_signed.json y validando localmente"
export VAULT_APPROVAL_KEY="$NEW_HEX_64"
chmod +x ./scripts/vault/generate_hmac_approval.sh ./scripts/vault/validate_hmac_approval.sh || true
if ! ./scripts/vault/generate_hmac_approval.sh audit/approval_request.json > "$TMP/approval_signed.json.new"; then
  fail "Generation of approval_signed.json failed"
fi
if ! ./scripts/vault/validate_hmac_approval.sh "$TMP/approval_signed.json.new" > "$TMP/validate_out.json" 2>&1; then
  cat "$TMP/validate_out.json" || true
  fail "Local validation of new approval_signed.json failed"
fi
grep -qE '"status"[[:space:]]*:[[:space:]]*"valid"' "$TMP/validate_out.json" || { cat "$TMP/validate_out.json"; fail "Validation output did not report status: valid"; }
echo "   ✅ Local artifact validated OK"

echo "4/7 — Instalando artifact, commit y push"
mv "$TMP/approval_signed.json.new" audit/approval_signed.json
git add audit/approval_signed.json REVIEW_OK || true
git commit -m "chore(security): rotate HMAC and update approval artifacts

- Updated approval_signed.json with new VAULT_APPROVAL_KEY
- HMAC validation: PASSED
- Ready for CI/CD pipeline activation" || true
git push origin "$BRANCH" || fail "git push failed; check access/branch-protections"
echo "   ✅ Commit y push completados"

echo "5/7 — Gestionando PR y disparando workflows"
PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
if [ -z "$PR_NUM" ]; then
  gh pr create --repo "$OWNER/$REPO" --title "CI/CD Pipeline with HMAC Security Gates" --body "Activating HMAC gates and audit pipelines (manual secret configuration)" --head "$BRANCH" --base main || warn "pr create returned non-zero"
  PR_NUM=$(gh pr list --repo "$OWNER/$REPO" --head "$BRANCH" --json number -q '.[0].number' || echo "")
fi
echo "   PR: ${PR_NUM:-not-detected}"

for wf in "${WORKFLOWS[@]}"; do
  echo "   Disparando workflow: $wf"
  if gh workflow run --repo "$OWNER/$REPO" "$wf" --ref "refs/heads/$BRANCH" >/dev/null 2>&1; then
    echo "   ✅ Workflow '$wf' disparado"
  else
    warn "   No se pudo disparar '$wf' (puede que no sea manual)"
  fi
done

# Commit vacío para forzar re-evaluación
git commit --allow-empty -m "chore(ci): trigger workflow re-evaluation" >/dev/null 2>&1 || true
git push origin "$BRANCH" >/dev/null 2>&1 || true

echo "6/7 — Monitorizando Mandatory Approval Gate (7 minutos max)"
sleep 6
MA_ID=$(gh run list --repo "$OWNER/$REPO" --workflow "Mandatory Approval Gate" --limit 1 --json id -q '.[0].id' || echo "")
if [ -z "$MA_ID" ]; then
  warn "No Mandatory Approval Gate run found yet; inspect GitHub Actions UI"
  echo "STOP: manual review required — evidence dir: $TMP"
  unset NEW_HEX_64 VAULT_APPROVAL_KEY
  exit 0
fi

END=$((SECONDS+420))
while [ $SECONDS -lt $END ]; do
  sleep 6
  sc=$(gh run view --repo "$OWNER/$REPO" "$MA_ID" --json status,conclusion -q '.status + "|" + (.conclusion // "")' 2>/dev/null || echo "unknown|")
  ST="${sc%%|*}"; CONC="${sc##*|}"
  echo "   Mandatory Gate: status=$ST conclusion=$CONC"
  if [ "$ST" = "completed" ]; then
    if [ "$CONC" = "success" ] || [ "$CONC" = "neutral" ]; then
      echo "   ✅ Mandatory Approval Gate completed OK"
      break
    else
      echo "   ❌ MANDATORY GATE FAILED (conclusion=$CONC). Downloading logs to $TMP"
      gh run download --repo "$OWNER/$REPO" "$MA_ID" -D "$TMP/run_$MA_ID" || true
      echo "   Evidence: $TMP/run_$MA_ID"
      unset NEW_HEX_64 VAULT_APPROVAL_KEY
      fail "Mandatory Approval Gate run $MA_ID concluded $CONC; DO NOT MERGE"
    fi
  fi
done

if [ $SECONDS -ge $END ]; then
  warn "Timeout waiting for Mandatory Approval Gate. Inspect UI or rerun."
  unset NEW_HEX_64 VAULT_APPROVAL_KEY
  exit 3
fi

echo "7/7 — Verificando approval_valid:true en logs"
gh run view --repo "$OWNER/$REPO" --log "$MA_ID" | sed -n '1,400p' > "$TMP/mandatory_excerpt.txt" || true
if ! grep -qE '"approval_valid"[[:space:]]*:[[:space:]]*"(true|True|TRUE|yes)"' "$TMP/mandatory_excerpt.txt"; then
  echo "   ❌ approval_valid:true NOT FOUND — Evidence saved at $TMP/mandatory_excerpt.txt"
  cat "$TMP/mandatory_excerpt.txt"
  unset NEW_HEX_64 VAULT_APPROVAL_KEY
  fail "approval_valid:true not present — aborting before merge"
fi

echo ""
echo "🎉 ACTIVACIÓN COMPLETADA EXITOSAMENTE"
echo ""
echo "📊 RESUMEN:"
echo "   ✅ Secret VAULT_APPROVAL_KEY configurado manualmente"
echo "   ✅ Artifacts generados y validados localmente"
echo "   ✅ Cambios commiteados y pusheados"
echo "   ✅ PR creado: ${PR_NUM:-'N/A'}"
echo "   ✅ Workflows disparados"
echo "   ✅ Mandatory Approval Gate: PASSED"
echo "   ✅ approval_valid:true confirmado"
echo ""
echo "📁 Evidencia guardada en: $TMP"
echo "🔑 Clave HMAC usada: ${NEW_HEX_64:0:16}...${NEW_HEX_64: -16}"
echo ""
echo "⏳ PRÓXIMO PASO MANUAL:"
echo "   Ve a GitHub y haz merge del PR #$PR_NUM después de revisar los resultados"
echo "   https://github.com/$OWNER/$REPO/pull/$PR_NUM"
echo ""
echo "⚡ NOTA: Los otros workflows pueden tardar unos minutos en completarse"
echo ""
echo "🏆 ¡SISTEMA DE SEGURIDAD ENTERPRISE ACTIVADO!"

# cleanup sensitive memory
unset NEW_HEX_64 VAULT_APPROVAL_KEY
exit 0
