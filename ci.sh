#!/bin/bash

# Wrapper para scripts de CI/CD
# Uso: ./ci.sh <script-name> [args...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CI_DIR="$SCRIPT_DIR/scripts/ci"

if [ $# -eq 0 ]; then
    echo "📋 Scripts de CI/CD disponibles:"
    echo ""
    ls -1 "$CI_DIR"/*.sh | xargs -n1 basename | sed 's/\.sh$//' | sort
    echo ""
    echo "Uso: ./ci.sh <script-name> [argumentos...]"
    exit 0
fi

SCRIPT_NAME="$1"
SCRIPT_PATH="$CI_DIR/$SCRIPT_NAME.sh"

if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script '$SCRIPT_NAME' no encontrado en $CI_DIR"
    echo "Ejecuta './ci.sh' sin argumentos para ver scripts disponibles"
    exit 1
fi

shift
echo "🚀 Ejecutando: $SCRIPT_NAME $@"
exec "$SCRIPT_PATH" "$@"