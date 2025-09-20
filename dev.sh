#!/bin/bash

# Wrapper para scripts de desarrollo
# Uso: ./dev.sh <script-name> [args...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="$SCRIPT_DIR/scripts/dev"

if [ $# -eq 0 ]; then
    echo "🛠️ Scripts de desarrollo disponibles:"
    echo ""
    ls -1 "$DEV_DIR"/*.sh | xargs -n1 basename | sed 's/\.sh$//' | sort
    echo ""
    echo "Uso: ./dev.sh <script-name> [argumentos...]"
    exit 0
fi

SCRIPT_NAME="$1"
SCRIPT_PATH="$DEV_DIR/$SCRIPT_NAME.sh"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script '$SCRIPT_NAME' no encontrado en $DEV_DIR"
    echo "Ejecuta './dev.sh' sin argumentos para ver scripts disponibles"
    exit 1
fi

shift
echo "🚀 Ejecutando: $SCRIPT_NAME $@"
exec "$SCRIPT_PATH" "$@"