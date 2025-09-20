#!/usr/bin/env bash
# ⚡ ECONEURA - Ejecución Segura con Confirmación
# Ejecuta código generado por IA solo con aprobación explícita

PROMPT="$*"

# Función para extraer código de una respuesta (simulación)
extract_code() {
    local prompt="$1"

    case "$prompt" in
        *"listar procesos"*)
            echo "ps aux | head -10"
            ;;
        *"espacio disco"*)
            echo "df -h"
            ;;
        *"conexiones red"*)
            echo "netstat -tuln | head -10"
            ;;
        *"archivos ocultos"*)
            echo "ls -la"
            ;;
        *"contenedores docker"*)
            echo "docker ps"
            ;;
        *"procesos activos"*)
            echo "ps aux | grep -v grep | wc -l"
            ;;
        *)
            echo "echo 'Comando no reconocido: $prompt'"
            ;;
    esac
}

# Extraer código del prompt
CODE=$(extract_code "$PROMPT")

# Mostrar código generado
echo -e "\033[1;33m⚠️  CÓDIGO GENERADO:\033[0m\n$CODE"
echo -e "\033[1;31m🚨 ADVERTENCIA: Este código se ejecutará en tu sistema\033[0m"

# Solicitar confirmación
read -p "¿Ejecutar? (s/n): " CONFIRM

if [[ "$CONFIRM" == "s" ]] || [[ "$CONFIRM" == "S" ]]; then
    echo -e "\033[1;32m▶️  Ejecutando...\033[0m"
    # Ejecutar el código
    bash -c "$CODE"
    echo -e "\033[1;32m✅ Ejecución completada\033[0m"
else
    echo -e "\033[1;33m❌ Ejecución cancelada por el usuario\033[0m"
fi