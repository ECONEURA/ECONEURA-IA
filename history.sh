#!/usr/bin/env bash
# 📚 ECONEURA - Historial de Consultas
# Muestra el historial de preguntas y respuestas

echo -e "\033[1;32m📚 HISTORIAL DE PREGUNTAS:\033[0m"
echo "=========================================="

if [[ ! -f data/history.log ]]; then
    echo -e "\033[1;33m📝 No hay historial aún\033[0m"
    exit 0
fi

# Mostrar últimas 10 entradas
tail -10 data/history.log | while IFS='|' read -r timestamp prompt response; do
    echo -e "\033[1;34m📅 $timestamp\033[0m"
    echo -e "\033[1;33m❓ $prompt\033[0m"
    echo -e "\033[1;32m💡 $response\033[0m"
    echo "------------------------------------------"
done

# Estadísticas
TOTAL=$(wc -l < data/history.log)
echo -e "\033[1;35m📊 Total de consultas: $TOTAL\033[0m"