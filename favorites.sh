#!/usr/bin/env bash
# ⭐ ECONEURA - Sistema de Favoritos
# Guarda comandos útiles para acceso rápido

CMD="$*"

if [[ -z "$CMD" ]]; then
    echo -e "\033[1;31m❌ Error: Debes proporcionar un comando\033[0m"
    echo "Uso: ./favorites.sh 'comando a guardar'"
    exit 1
fi

# Agregar timestamp y guardar
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "$TIMESTAMP | $CMD" >> data/favorites.log

echo -e "\033[1;35m⭐ FAVORITO GUARDADO:\033[0m $CMD"

# Mostrar estadísticas
FAV_COUNT=$(wc -l < data/favorites.log)
echo -e "\033[1;36m📊 Total de favoritos: $FAV_COUNT\033[0m"
