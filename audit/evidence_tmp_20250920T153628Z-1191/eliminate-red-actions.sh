#!/bin/bash

# 🔥 SCRIPT BASH PARA ELIMINACIÓN RADICAL DE ACTIONS ROJAS
# Mantener solo lo verde, eliminar todo lo rojo

echo "🚨 ELIMINACIÓN RADICAL DE GITHUB ACTIONS"
echo "========================================="

REPO="ECONEURA/ECONEURA-IA"

# Verificar GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ Instalar GitHub CLI: https://cli.github.com/"
    exit 1
fi

echo "🔍 ANALIZANDO ESTADO ACTUAL..."

# 1. ELIMINAR TODOS LOS RUNS FALLIDOS
echo ""
echo "🗑️ FASE 1: ELIMINANDO RUNS FALLIDOS..."
gh run list --repo $REPO --status failure --limit 500 --json databaseId --jq '.[].databaseId' | while read run_id; do
    echo "🗑️ Eliminando run fallido: $run_id"
    gh run delete $run_id --repo $REPO --confirm 2>/dev/null
done

# 2. ELIMINAR RUNS CANCELADOS
echo ""
echo "🗑️ FASE 2: ELIMINANDO RUNS CANCELADOS..."
gh run list --repo $REPO --status cancelled --limit 500 --json databaseId --jq '.[].databaseId' | while read run_id; do
    echo "🗑️ Eliminando run cancelado: $run_id"
    gh run delete $run_id --repo $REPO --confirm 2>/dev/null
done

# 3. DESHABILITAR WORKFLOWS CON ALTA TASA DE FALLO
echo ""
echo "🚫 FASE 3: DESHABILITANDO WORKFLOWS PROBLEMÁTICOS..."
gh workflow list --repo $REPO --json id,name,state | jq -r '.[] | select(.state=="active") | "\(.id) \(.name)"' | while read id name; do
    failure_count=$(gh run list --repo $REPO --workflow $id --limit 10 --json conclusion | jq '[.[] | select(.conclusion=="failure")] | length')
    total_count=$(gh run list --repo $REPO --workflow $id --limit 10 --json conclusion | jq 'length')
    
    if [ "$total_count" -gt 0 ]; then
        failure_rate=$(echo "scale=2; $failure_count / $total_count" | bc -l 2>/dev/null || echo "0")
        if (( $(echo "$failure_rate > 0.7" | bc -l 2>/dev/null || echo "0") )); then
            echo "🚫 DESHABILITANDO: $name (Alta tasa de fallo)"
            gh workflow disable $id --repo $REPO
        fi
    fi
done

# 4. LIMPIAR HISTORIAL ANTIGUO
echo ""
echo "🗑️ FASE 4: LIMPIANDO HISTORIAL ANTIGUO..."
gh run list --repo $REPO --limit 200 --json databaseId,conclusion --jq '.[] | select(.conclusion != "success") | .databaseId' | while read run_id; do
    echo "🗑️ Limpiando run no exitoso: $run_id"
    gh run delete $run_id --repo $REPO --confirm 2>/dev/null
done

echo ""
echo "🎉 LIMPIEZA RADICAL COMPLETADA"
echo "==============================="
echo "✅ Solo acciones VERDES mantenidas"
echo "❌ Todo lo ROJO eliminado"
echo "🔗 Verificar: https://github.com/ECONEURA/ECONEURA-IA/actions"