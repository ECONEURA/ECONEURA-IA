#!/usr/bin/env bash
# 🔄 ECONEURA - Procesamiento por Lotes
# Procesa múltiples preguntas en una sola ejecución

IFS=';' read -ra QUERIES <<< "$*"

if [[ ${#QUERIES[@]} -eq 0 ]]; then
    echo -e "\033[1;31m❌ Error: Debes proporcionar preguntas separadas por ;\033[0m"
    echo "Uso: ./batch.sh 'pregunta1;pregunta2;pregunta3'"
    exit 1
fi

echo -e "\033[1;35m🔄 PROCESANDO ${#QUERIES[@]} PREGUNTAS:\033[0m"
echo "=========================================="

for i in "${!QUERIES[@]}"; do
    QUERY="${QUERIES[$i]}"
    QUERY=$(echo "$QUERY" | xargs)  # Trim whitespace

    if [[ -z "$QUERY" ]]; then
        continue
    fi

    echo -e "\033[1;34m🔹 Pregunta $((i+1)):\033[0m $QUERY"

    # Procesar con el motor de IA
    ./ai.sh "$QUERY"

    echo -e "\033[0;90m----------------------------------------\033[0m"

    # Pequeña pausa entre preguntas
    sleep 1
done

echo -e "\033[1;32m✅ Procesamiento por lotes completado\033[0m"