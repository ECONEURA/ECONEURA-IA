#!/bin/bash

# Script maestro para gestión completa de Pull Requests
# Coordina fusión automática, resolución de conflictos y reporting

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MASTER_LOG="$SCRIPT_DIR/pr-management-$(date +%Y%m%d-%H%M%S).log"

# Función de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$MASTER_LOG"
}

log "🚀 INICIANDO GESTIÓN MAESTRA DE PULL REQUESTS"
log "============================================="

# Verificar dependencias
log "🔧 Verificando dependencias..."
if ! command -v gh &> /dev/null; then
    log "❌ Error: GitHub CLI no está instalado"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log "❌ Error: jq no está instalado"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    log "❌ Error: No estás autenticado en GitHub CLI"
    exit 1
fi

log "✅ Todas las dependencias verificadas"

# Fase 1: Análisis de PRs
log "📊 FASE 1: Análisis de PRs"
PRS_DATA=$(gh pr list --state open --limit 50 --json number,title,author,mergeable,mergeStateStatus,reviewDecision,headRefName)
TOTAL_PRS=$(echo "$PRS_DATA" | jq '. | length')
DEPENDABOT_PRS=$(echo "$PRS_DATA" | jq '[.[] | select(.author.login | contains("dependabot"))] | length')
CONFLICTING_PRS=$(echo "$PRS_DATA" | jq '[.[] | select(.mergeable == "CONFLICTING")] | length')
MERGEABLE_PRS=$(echo "$PRS_DATA" | jq '[.[] | select(.mergeable == "MERGEABLE")] | length')

log "   📋 Total PRs: $TOTAL_PRS"
log "   🤖 Dependabot: $DEPENDABOT_PRS"
log "   ⚠️  Con conflictos: $CONFLICTING_PRS"
log "   ✅ Fusionables: $MERGEABLE_PRS"

# Fase 2: Fusión automática de PRs seguros
log "🔄 FASE 2: Fusión automática de PRs seguros"
if [ "$MERGEABLE_PRS" -gt 0 ]; then
    log "   Ejecutando script de fusión automática..."
    if bash "$SCRIPT_DIR/auto-merge-prs.sh" >> "$MASTER_LOG" 2>&1; then
        log "   ✅ Fusión automática completada"
    else
        log "   ⚠️  Algunos PRs no pudieron fusionarse automáticamente"
    fi
else
    log "   ℹ️  No hay PRs fusionables automáticamente"
fi

# Fase 3: Resolución de conflictos
log "🔧 FASE 3: Resolución automática de conflictos"
if [ "$CONFLICTING_PRS" -gt 0 ]; then
    log "   Ejecutando resolución de conflictos..."
    if bash "$SCRIPT_DIR/resolve-conflicts.sh" >> "$MASTER_LOG" 2>&1; then
        log "   ✅ Resolución de conflictos completada"
    else
        log "   ⚠️  Algunos conflictos requieren resolución manual"
    fi
else
    log "   ℹ️  No hay PRs con conflictos"
fi

# Fase 4: Generar reporte final
log "📊 FASE 4: Generando reporte final"
FINAL_PRS=$(gh pr list --state open --json number | jq '. | length')
MERGED_TODAY=$(git log --oneline --since="1 day ago" | grep -i "merge pull request" | wc -l)

log "📈 RESULTADOS FINALES:"
log "   📋 PRs restantes: $FINAL_PRS (antes: $TOTAL_PRS)"
log "   🔄 Fusionados hoy: $MERGED_TODAY"
log "   ⚠️  Requieren atención manual: $CONFLICTING_PRS"

# Fase 5: Recomendaciones
log "🎯 RECOMENDACIONES:"
if [ "$MERGEABLE_PRS" -gt 0 ]; then
    log "   1. 🔄 Revisar PRs de Dependabot que esperan checks de CI"
    log "   2. ✅ Ejecutar fusión manual cuando checks pasen"
fi

if [ "$CONFLICTING_PRS" -gt 0 ]; then
    log "   3. 🔧 Resolver conflictos en package.json/pnpm-lock.yaml"
    log "   4. 👀 Revisar cambios antes de fusionar"
fi

if [ "$FINAL_PRS" -eq 0 ]; then
    log "   🎉 ¡Todos los PRs han sido procesados!"
else
    log "   📋 Lista de PRs pendientes:"
    gh pr list --state open --json number,title | jq -r '.[] | "      - PR #\(.number): \(.title)"' >> "$MASTER_LOG"
fi

log "📄 Log maestro completo: $MASTER_LOG"
log "🎉 Gestión de PRs completada exitosamente"

# Crear resumen para GitHub Actions
echo "PR_MANAGEMENT_SUMMARY<<EOF" >> $GITHUB_ENV
echo "Total PRs analizados: $TOTAL_PRS" >> $GITHUB_ENV
echo "PRs fusionables: $MERGEABLE_PRS" >> $GITHUB_ENV
echo "PRs con conflictos: $CONFLICTING_PRS" >> $GITHUB_ENV
echo "PRs restantes: $FINAL_PRS" >> $GITHUB_ENV
echo "Fusionados hoy: $MERGED_TODAY" >> $GITHUB_ENV
echo "EOF" >> $GITHUB_ENV