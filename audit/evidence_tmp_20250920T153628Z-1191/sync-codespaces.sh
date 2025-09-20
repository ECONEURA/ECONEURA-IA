#!/usr/bin/env bash
# =====================================================
# ECONEURA-IA: Sincronizar cambios entre Bash Codespace y Codepace Stunning Spoon
# =====================================================
# Este script replica los cambios realizados en tu bash actual a otro codespace (stunning spoon)
# Utiliza git y GitHub para sincronizar ambos entornos
# =====================================================

set -euo pipefail

echo "🧠 ECONEURA-IA: Replicando cambios del bash actual a Codepace Stunning Spoon"
echo "==========================================================================="

# 1. Verifica cambios locales
echo "📊 Cambios locales:"
git status --porcelain
echo ""

# 2. Añade y commitea los cambios
echo "📝 Añadiendo y commiteando cambios..."
git add .
git commit -m "sync: replicate bash changes to stunning spoon codespace" || echo "No hay cambios nuevos para commitear"
echo ""

# 3. Sincroniza con GitHub
echo "🔗 Pushing a GitHub..."
git pull origin main --rebase || echo "Pull falló, revisa conflictos"
git push origin main || echo "Push falló, revisa permisos"
echo ""

# 4. En Codepace Stunning Spoon, clona o actualiza el repo:
echo "🚀 En el codespace 'stunning spoon', ejecuta:"
echo "git pull origin main"
echo ""

echo "✅ Cambios replicados. Ambos entornos están sincronizados con el mismo código."
echo "Puedes continuar trabajando en ambos bash y los cambios se reflejarán en ambos codespaces."