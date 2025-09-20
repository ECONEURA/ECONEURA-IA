#!/bin/bash

# Wrapper para scripts de análisis
# Uso: ./analyze.sh <script-name> [args...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANALYSIS_DIR="$SCRIPT_DIR/scripts/analysis"

if [ $# -eq 0 ]; then
    echo "📊 Scripts de análisis disponibles:"
    echo ""
    ls -1 "$ANALYSIS_DIR"/*.sh | xargs -n1 basename | sed 's/\.sh$//' | sort
    echo ""
    echo "Uso: ./analyze.sh <script-name> [argumentos...]"
    exit 0
fi

SCRIPT_NAME="$1"
SCRIPT_PATH="$ANALYSIS_DIR/$SCRIPT_NAME.sh"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script '$SCRIPT_NAME' no encontrado en $ANALYSIS_DIR"
    echo "Ejecuta './analyze.sh' sin argumentos para ver scripts disponibles"
    exit 1
fi

shift
echo "🚀 Ejecutando: $SCRIPT_NAME $@"
exec "$SCRIPT_PATH" "$@"