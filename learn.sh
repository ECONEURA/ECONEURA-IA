#!/usr/bin/env bash
# 📚 ECONEURA - Modo Aprendizaje
# Enseña nuevos comandos y conceptos al sistema

ENTRY="$*"

if [[ -z "$ENTRY" ]]; then
    echo -e "\033[1;31m❌ Error: Debes proporcionar una entrada de aprendizaje\033[0m"
    echo "Uso: ./learn.sh 'comando|descripción'"
    echo "Ejemplo: ./learn.sh 'htop|Monitor de procesos interactivo'"
    exit 1
fi

# Validar formato
if [[ "$ENTRY" != *"|"* ]]; then
    echo -e "\033[1;31m❌ Error: Formato incorrecto\033[0m"
    echo "Usa: comando|descripción"
    exit 1
fi

# Agregar timestamp y guardar
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "$TIMESTAMP | $ENTRY" >> data/learned.log

echo -e "\033[1;36m📘 COMANDO APRENDIDO:\033[0m $ENTRY"

# Mostrar estadísticas
LEARN_COUNT=$(wc -l < data/learned.log)
echo -e "\033[1;32m🧠 Base de conocimiento: $LEARN_COUNT entradas\033[0m"