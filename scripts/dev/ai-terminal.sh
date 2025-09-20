#!/bin/bash

# AI Terminal Assistant
# Uso: ai "tu pregunta aquí"

if [ $# -eq 0 ]; then
    echo "Uso: ai 'tu pregunta aquí'"
    echo "Ejemplo: ai '¿Cómo listar archivos en Linux?'"
    exit 1
fi

# Función para hacer preguntas a la IA
ask_ai() {
    local question="$1"

    echo "🤖 Pensando..."
    echo "Pregunta: $question"
    echo "---"

    # Simular respuesta de IA (puedes reemplazar con API real)
    case "$question" in
        *"listar archivos"*)
            echo "Para listar archivos en Linux usa:"
            echo "  ls          # Lista archivos básicos"
            echo "  ls -la      # Lista con detalles y archivos ocultos"
            echo "  ls -lh      # Lista con tamaños legibles"
            echo "  tree        # Lista en forma de árbol"
            ;;
        *"directorio actual"*)
            echo "Para ver el directorio actual usa:"
            echo "  pwd         # Muestra el path completo"
            echo "  echo \$PWD   # Variable de entorno"
            ;;
        *"crear archivo"*)
            echo "Para crear archivos:"
            echo "  touch archivo.txt          # Archivo vacío"
            echo "  echo 'contenido' > archivo.txt    # Con contenido"
            echo "  nano archivo.txt           # Editor de texto"
            ;;
        *"instalar paquete"*)
            echo "Comandos de instalación según el sistema:"
            echo "  Ubuntu/Debian: sudo apt install paquete"
            echo "  CentOS/RHEL: sudo yum install paquete"
            echo "  Alpine: sudo apk add paquete"
            ;;
        *)
            echo "Lo siento, no tengo una respuesta específica para: '$question'"
            echo ""
            echo "💡 Comandos útiles que conozco:"
            echo "  - listar archivos"
            echo "  - directorio actual"
            echo "  - crear archivo"
            echo "  - instalar paquete"
            ;;
    esac

    echo "---"
    echo "🤖 ¡Listo! Si necesitas más ayuda, solo pregunta."
}

# Ejecutar la función con todos los argumentos
ask_ai "$*"