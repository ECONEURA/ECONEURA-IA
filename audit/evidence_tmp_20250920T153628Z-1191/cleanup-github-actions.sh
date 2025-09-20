#!/bin/bash

# 🗑️ SCRIPT DE LIMPIEZA DE GITHUB ACTIONS (Linux/Mac)
# Versión bash del script de limpieza

echo "🚀 INICIANDO LIMPIEZA DE GITHUB ACTIONS..."

# Verificar GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI no está instalado. Instalar desde: https://cli.github.com/"
    exit 1
fi

REPO="ECONEURA/ECONEURA-IA"

echo "📊 OBTENIENDO LISTA DE WORKFLOWS..."

# Listar workflows
gh workflow list --repo $REPO --json id,name,state

echo ""
echo "🗑️ LIMPIANDO RUNS FALLIDOS..."

# Eliminar runs fallidos
gh run list --repo $REPO --status failure --limit 50 --json databaseId --jq '.[].databaseId' | while read run_id; do
    echo "🗑️ Eliminando run $run_id..."
    gh run delete $run_id --repo $REPO --confirm 2>/dev/null || echo "⚠️ Error eliminando run $run_id"
done

echo ""
echo "🎯 LIMPIEZA COMPLETADA"
echo ""
echo "💡 COMANDOS ÚTILES:"
echo "  # Deshabilitar workflow:"
echo "  gh workflow disable [WORKFLOW_ID] --repo $REPO"
echo ""
echo "  # Ver workflows activos:"
echo "  gh workflow list --repo $REPO"