#!/bin/bash

# Script para fusionar automáticamente Pull Requests seguros
# Solo fusiona PRs de Dependabot que sean MERGEABLE y no tengan conflictos

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/auto-merge-$(date +%Y%m%d-%H%M%S).log"

# Función de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "🚀 INICIANDO FUSIÓN AUTOMÁTICA DE PULL REQUESTS"
log "==============================================="

# Verificar que estamos en el directorio correcto
if [ ! -d ".git" ]; then
    log "❌ Error: No se encuentra repositorio Git"
    exit 1
fi

# Verificar que GitHub CLI esté disponible
if ! command -v gh &> /dev/null; then
    log "❌ Error: GitHub CLI no está instalado"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    log "❌ Error: No estás autenticado en GitHub CLI"
    log "Ejecuta: gh auth login"
    exit 1
fi

log "✅ Verificaciones completadas"

# Obtener lista de PRs abiertos
log "📋 Obteniendo lista de PRs abiertos..."
PRS_JSON=$(gh pr list --state open --limit 50 --json number,title,author,mergeable,mergeStateStatus,reviewDecision,headRefName)

# Procesar PRs de Dependabot que sean seguros
log "🔍 Analizando PRs candidatos para fusión automática..."

# Contadores
total_prs=0
safe_to_merge=0
merged=0
conflicts=0
failed=0

echo "$PRS_JSON" | jq -c '.[]' | while read -r pr; do
    total_prs=$((total_prs + 1))

    number=$(echo "$pr" | jq -r '.number')
    title=$(echo "$pr" | jq -r '.title')
    author=$(echo "$pr" | jq -r '.author.login')
    mergeable=$(echo "$pr" | jq -r '.mergeable')
    checks=$(echo "$pr" | jq -r '.mergeStateStatus')
    reviews=$(echo "$pr" | jq -r '.reviewDecision')
    branch=$(echo "$pr" | jq -r '.headRefName')

    log "📝 Analizando PR #$number: $title"
    log "   👤 Autor: $author"
    log "   🔄 Mergeable: $mergeable"
    log "   ✅ Checks: $checks"
    log "   👀 Reviews: $reviews"

    # Criterios para fusión automática
    is_dependabot=$(echo "$author" | grep -q "dependabot" && echo "true" || echo "false")
    is_mergeable=$( [ "$mergeable" = "MERGEABLE" ] && echo "true" || echo "false")
    has_clean_checks=$( [ "$checks" = "CLEAN" ] && echo "true" || echo "false")

    if [ "$is_dependabot" = "true" ] && [ "$is_mergeable" = "true" ]; then
        safe_to_merge=$((safe_to_merge + 1))
        log "   ✅ CANDIDATO PARA FUSIÓN AUTOMÁTICA"

        # Intentar fusionar
        if [ "$has_clean_checks" = "true" ]; then
            log "   🚀 Fusionando PR #$number..."
            if gh pr merge "$number" --merge --delete-branch=false 2>> "$LOG_FILE"; then
                merged=$((merged + 1))
                log "   ✅ PR #$number fusionado exitosamente"
            else
                failed=$((failed + 1))
                log "   ❌ Error al fusionar PR #$number"
            fi
        else
            log "   ⚠️  PR #$number tiene checks pendientes - saltando"
        fi
    elif [ "$mergeable" = "CONFLICTING" ]; then
        conflicts=$((conflicts + 1))
        log "   ⚠️  PR #$number tiene conflictos - requiere resolución manual"
    else
        log "   ⏭️  PR #$number no cumple criterios para fusión automática"
    fi

    log "   ---"
done

# Resumen final
log "📊 RESUMEN DE FUSIÓN AUTOMÁTICA:"
log "   📋 Total PRs analizados: $total_prs"
log "   ✅ Candidatos seguros: $safe_to_merge"
log "   🔄 Fusionados exitosamente: $merged"
log "   ⚠️  Con conflictos: $conflicts"
log "   ❌ Errores de fusión: $failed"

if [ $merged -gt 0 ]; then
    log "🎉 ¡Fusión automática completada!"
    log "Los PRs fusionados estarán disponibles después del próximo push"
else
    log "ℹ️  No se fusionaron PRs automáticamente"
fi

if [ $conflicts -gt 0 ]; then
    log "⚠️  Hay $conflicts PRs con conflictos que requieren atención manual"
    log "Ejecuta: gh pr list --state open para ver detalles"
fi

log "📄 Log completo: $LOG_FILE"