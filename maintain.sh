#!/bin/bash

# Wrapper para scripts de mantenimiento
# Uso: ./maintain.sh <script-name> [args...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAINTENANCE_DIR="$SCRIPT_DIR/scripts/maintenance"

if [ $# -eq 0 ]; then
    echo "🛡️ Scripts de mantenimiento disponibles:"
    echo ""
    ls -1 "$MAINTENANCE_DIR"/*.sh | xargs -n1 basename | sed 's/\.sh$//' | sort
    echo ""
    echo "Uso: ./maintain.sh <script-name> [argumentos...]"
    exit 0
fi

SCRIPT_NAME="$1"
SCRIPT_PATH="$MAINTENANCE_DIR/$SCRIPT_NAME.sh"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script '$SCRIPT_NAME' no encontrado en $MAINTENANCE_DIR"
    echo "Ejecuta './maintain.sh' sin argumentos para ver scripts disponibles"
    exit 1
fi

shift
echo "🚀 Ejecutando: $SCRIPT_NAME $@"
exec "$SCRIPT_PATH" "$@"