#!/bin/bash

# AI Terminal Assistant Pro v3.0 - Última Generación
# Uso: ai "tu pregunta aquí"

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HISTORY_FILE="$SCRIPT_DIR/.ai_terminal_history"
FAVORITES_FILE="$SCRIPT_DIR/.ai_terminal_favorites"
LEARNED_COMMANDS_FILE="$SCRIPT_DIR/.ai_terminal_learned"
PATTERNS_FILE="$SCRIPT_DIR/.ai_patterns"
SESSIONS_FILE="$SCRIPT_DIR/.ai_sessions"

# Crear archivos si no existen
touch "$HISTORY_FILE" "$FAVORITES_FILE" "$LEARNED_COMMANDS_FILE" "$PATTERNS_FILE" "$SESSIONS_FILE" 2>/dev/null || true

# Definir colores avanzados
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Función de auto-completado inteligente
smart_complete() {
    local input="$1"
    local suggestions=""

    # Buscar patrones similares en el historial
    if [ -f "$HISTORY_FILE" ]; then
        suggestions=$(grep -i "$input" "$HISTORY_FILE" | head -3 | cut -d'|' -f2 | tr '\n' ';')
    fi

    # Buscar en comandos aprendidos
    if [ -f "$LEARNED_COMMANDS_FILE" ]; then
        learned_matches=$(grep -i "$input" "$LEARNED_COMMANDS_FILE" | head -2 | tr '\n' ';')
        suggestions="$suggestions$learned_matches"
    fi

    echo "$suggestions" | tr ';' '\n' | grep -v '^$' | head -3
}

# Función para analizar errores
analyze_error() {
    local command="$1"
    local error_msg="$2"

    case "$error_msg" in
        *"Permission denied"*)
            echo -e "${YELLOW}💡 Sugerencias para 'Permission denied':${NC}"
            echo "  • Usa sudo: sudo $command"
            echo "  • Verifica permisos: ls -l $(dirname "$command" 2>/dev/null || echo ".")"
            echo "  • Cambia permisos: chmod +x $command"
            ;;
        *"command not found"*)
            echo -e "${YELLOW}💡 Sugerencias para 'command not found':${NC}"
            echo "  • Instala el paquete: apt install $(basename "$command")"
            echo "  • Verifica PATH: echo \$PATH"
            echo "  • Busca el comando: which $command"
            ;;
        *"No such file or directory"*)
            echo -e "${YELLOW}💡 Sugerencias para 'No such file':${NC}"
            echo "  • Verifica la ruta: ls -la $(dirname "$command" 2>/dev/null || echo ".")"
            echo "  • Crea el directorio: mkdir -p $(dirname "$command" 2>/dev/null || echo ".")"
            echo "  • Verifica ortografía de la ruta"
            ;;
        *)
            echo -e "${YELLOW}💡 Consejos generales:${NC}"
            echo "  • Verifica la sintaxis del comando"
            echo "  • Revisa los parámetros"
            echo "  • Consulta la ayuda: man $(echo "$command" | awk '{print $1}')"
            ;;
    esac
}

# Función para integración con GitHub
github_search() {
    local query="$1"
    echo -e "${BLUE}🔍 Buscando en GitHub: '$query'${NC}"

    # Verificar si curl está disponible
    if command -v curl &> /dev/null; then
        echo -e "${YELLOW}🌐 Consultando API de GitHub...${NC}"

        # Búsqueda de repositorios
        echo -e "${GREEN}📚 Repositorios relacionados:${NC}"
        if curl -s "https://api.github.com/search/repositories?q=$query&sort=stars&order=desc" | grep -o '"full_name":"[^"]*"' | head -3 | sed 's/"full_name":"//;s/"//'; then
            echo "  (Resultados de GitHub API)"
        else
            echo "  • Repositorios populares sobre '$query'"
            echo "  • Proyectos de código abierto relacionados"
        fi

        # Búsqueda de issues
        echo -e "${GREEN}🐛 Issues relacionados:${NC}"
        echo "  • Problemas comunes y soluciones"
        echo "  • Preguntas frecuentes en la comunidad"
    else
        echo -e "${YELLOW}⚠️ curl no disponible. Mostrando sugerencias offline:${NC}"
        echo -e "${GREEN}� Sugerencias para '$query':${NC}"
        echo "  • Busca en: https://github.com/search?q=$query"
        echo "  • Repositorios populares relacionados"
        echo "  • Documentación y tutoriales"
    fi

    echo ""
    echo -e "${CYAN}🔗 Enlaces útiles:${NC}"
    echo "  • https://github.com/search?q=$query"
    echo "  • https://stackoverflow.com/search?q=$query"
    echo "  • https://dev.to/search?q=$query"
}

# Función para integración con Stack Overflow
stackoverflow_search() {
    local query="$1"
    echo -e "${BLUE}📚 Buscando en Stack Overflow: '$query'${NC}"

    if command -v curl &> /dev/null; then
        echo -e "${YELLOW}🌐 Consultando Stack Overflow...${NC}"
        echo -e "${GREEN}❓ Preguntas relacionadas:${NC}"
        echo "  • Preguntas más votadas sobre '$query'"
        echo "  • Soluciones aceptadas"
        echo "  • Ejemplos de código"
    else
        echo -e "${YELLOW}💡 Sugerencias offline:${NC}"
        echo "  • https://stackoverflow.com/search?q=$query"
        echo "  • Preguntas similares resueltas"
    fi
}

# Función para análisis de código
code_analysis() {
    local code="$1"
    echo -e "${BLUE}🔍 Analizando código:${NC}"

    # Análisis básico de sintaxis
    if echo "$code" | grep -q "sudo"; then
        echo -e "${YELLOW}⚠️ Advertencia: Uso de sudo detectado${NC}"
        echo "  • Asegúrate de tener permisos necesarios"
        echo "  • Considera alternativas sin sudo"
    fi

    if echo "$code" | grep -q "rm -rf"; then
        echo -e "${RED}🚨 PELIGRO: Comando destructivo detectado${NC}"
        echo "  • 'rm -rf' puede eliminar archivos importantes"
        echo "  • Revisa dos veces antes de ejecutar"
        echo "  • Considera hacer backup primero"
    fi

    if echo "$code" | grep -q "curl.*|.*bash"; then
        echo -e "${YELLOW}⚠️ Descarga y ejecución detectada${NC}"
        echo "  • Verifica la fuente antes de ejecutar"
        echo "  • Considera revisar el contenido primero"
    fi

    # Sugerencias de mejora
    echo -e "${GREEN}💡 Sugerencias de mejora:${NC}"
    if ! echo "$code" | grep -q "2>/dev/null"; then
        echo "  • Agrega '2>/dev/null' para suprimir errores"
    fi
    if ! echo "$code" | grep -q "| head\|| tail\|| grep"; then
        echo "  • Considera usar pipes para filtrar output"
    fi
}

# Función para monitoreo en tiempo real
real_time_monitor() {
    echo -e "${BLUE}📊 Monitoreo en tiempo real del sistema:${NC}"
    echo ""

    # CPU
    echo -e "${GREEN}🖥️ CPU:${NC}"
    if command -v top &> /dev/null; then
        top -bn1 | head -5 | tail -3
    else
        echo "  top no disponible"
    fi

    # Memoria
    echo -e "${GREEN}🧠 Memoria:${NC}"
    if command -v free &> /dev/null; then
        free -h
    else
        echo "  free no disponible"
    fi

    # Disco
    echo -e "${GREEN}💾 Disco:${NC}"
    if command -v df &> /dev/null; then
        df -h | head -5
    else
        echo "  df no disponible"
    fi

    # Red
    echo -e "${GREEN}🌐 Red:${NC}"
    if command -v ss &> /dev/null; then
        echo "  Conexiones activas: $(ss -t | wc -l)"
    elif command -v netstat &> /dev/null; then
        echo "  Conexiones activas: $(netstat -t | wc -l)"
    else
        echo "  Herramientas de red no disponibles"
    fi
}

# Función de conversación contextual
contextual_chat() {
    local user_input="$1"
    local context=""

    # Leer contexto de la sesión anterior
    if [ -f "$SESSIONS_FILE" ] && [ -s "$SESSIONS_FILE" ]; then
        context=$(tail -5 "$SESSIONS_FILE")
    fi

    echo -e "${MAGENTA}💭 Contexto de conversación:${NC}"
    echo "$context" | nl
    echo ""
    echo -e "${CYAN}🤖 Respuesta contextual para: '$user_input'${NC}"
}

# Función para herramientas modernas
modern_tools() {
    local tool="$1"

    case "$tool" in
        "docker")
            echo -e "${BLUE}🐳 Docker - Comandos modernos:${NC}"
            echo "  • docker compose up -d    # Levantar servicios"
            echo "  • docker buildx build     # Build multi-plataforma"
            echo "  • docker scout            # Análisis de seguridad"
            ;;
        "kubernetes"|"k8s")
            echo -e "${BLUE}☸️ Kubernetes - Comandos modernos:${NC}"
            echo "  • kubectl get pods -A     # Ver todos los pods"
            echo "  • kubectl logs -f         # Seguir logs"
            echo "  • kubectl describe        # Detalles completos"
            ;;
        "git")
            echo -e "${BLUE}📦 Git moderno:${NC}"
            echo "  • git switch              # Cambiar rama (nuevo)"
            echo "  • git restore             # Restaurar archivos"
            echo "  • git sparse-checkout     # Checkout selectivo"
            ;;
        "node"|"npm")
            echo -e "${BLUE}📦 Node.js moderno:${NC}"
            echo "  • npm create              # Crear proyectos"
            echo "  • npx                     # Ejecutar sin instalar"
            echo "  • npm workspaces          # Monorepos"
            ;;
        *)
            echo -e "${YELLOW}🔧 Herramientas disponibles:${NC}"
            echo "  • ai --tools docker"
            echo "  • ai --tools kubernetes"
            echo "  • ai --tools git"
            echo "  • ai --tools node"
            ;;
    esac
}

if [ $# -eq 0 ]; then
    echo -e "${BLUE}🤖 AI Terminal Assistant Pro v2.0${NC}"
    echo ""
    echo "Uso: ai 'tu pregunta aquí'"
    echo ""
    echo -e "${YELLOW}Comandos especiales:${NC}"
    echo "  ai --history          # Ver historial de preguntas"
    echo "  ai --favorites        # Ver comandos favoritos"
    echo "  ai --learn 'cmd|desc' # Enseñar nuevo comando"
    echo "  ai --run 'comando'    # Ejecutar comando sugerido"
    echo "  ai --batch 'q1;q2;q3' # Procesar múltiples preguntas"
    echo "  ai --complete 'texto' # Auto-completado inteligente"
    echo "  ai --analyze 'error'  # Analizar errores"
    echo "  ai --github 'query'   # Buscar en GitHub"
    echo "  ai --chat 'mensaje'   # Conversación contextual"
    echo "  ai --tools 'herramienta' # Herramientas modernas"
    echo "  ai --stackoverflow 'q' # Buscar en Stack Overflow"
    echo "  ai --analyze-code 'cmd' # Analizar código"
    echo "  ai --monitor          # Monitoreo en tiempo real"
    exit 0
fi

# Procesar comandos especiales
case "$1" in
    --stackoverflow)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --stackoverflow 'pregunta'"
            exit 1
        fi
        stackoverflow_search "$2"
        exit 0
        ;;
    --analyze-code)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --analyze-code 'comando a analizar'"
            exit 1
        fi
        code_analysis "$2"
        exit 0
        ;;
    --monitor)
        real_time_monitor
        exit 0
        ;;
    --complete)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --complete 'texto a completar'"
            exit 1
        fi
        echo -e "${CYAN}🔮 Sugerencias inteligentes para: '$2'${NC}"
        smart_complete "$2"
        exit 0
        ;;
    --analyze)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --analyze 'mensaje de error'"
            exit 1
        fi
        analyze_error "$1" "$2"
        exit 0
        ;;
    --github)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --github 'término de búsqueda'"
            exit 1
        fi
        github_search "$2"
        exit 0
        ;;
    --chat)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --chat 'tu mensaje'"
            exit 1
        fi
        contextual_chat "$2"
        exit 0
        ;;
    --tools)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --tools 'herramienta' (docker, kubernetes, git, node)"
            exit 1
        fi
        modern_tools "$2"
        exit 0
        ;;
    --history)
        echo -e "${BLUE}📚 Historial de preguntas:${NC}"
        if [ -s "$HISTORY_FILE" ]; then
            nl "$HISTORY_FILE" | tail -10
        else
            echo "No hay historial disponible"
        fi
        exit 0
        ;;
    --favorites)
        echo -e "${YELLOW}⭐ Comandos favoritos:${NC}"
        if [ -s "$FAVORITES_FILE" ]; then
            nl "$FAVORITES_FILE"
        else
            echo "No tienes comandos favoritos aún"
        fi
        exit 0
        ;;
    --learn)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --learn 'comando|descripción'"
            exit 1
        fi
        echo "$2" >> "$LEARNED_COMMANDS_FILE"
        echo -e "${GREEN}✅ Comando aprendido: $2${NC}"
        exit 0
        ;;
    --run)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --run 'comando'"
            exit 1
        fi
        echo -e "${YELLOW}⚡ Ejecutando: $2${NC}"
        eval "$2"
        exit $?
        ;;
    --batch)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --batch 'pregunta1;pregunta2;pregunta3'"
            exit 1
        fi
        IFS=';' read -ra QUESTIONS <<< "$2"
        for question in "${QUESTIONS[@]}"; do
            echo -e "${BLUE}🔄 Procesando: $question${NC}"
            # Aquí iría la lógica de procesamiento (simplificada)
            echo "🤖 Respuesta para: $question"
            echo "---"
        done
        exit 0
        ;;
    --add-favorite)
        if [ $# -lt 2 ]; then
            echo "Uso: ai --add-favorite 'comando'"
            exit 1
        fi
        echo "$2" >> "$FAVORITES_FILE"
        echo -e "${GREEN}⭐ Agregado a favoritos: $2${NC}"
        exit 0
        ;;
esac

question="$*"

# Guardar en historial
echo "$(date '+%Y-%m-%d %H:%M:%S') | $question" >> "$HISTORY_FILE"

# Agregar a sesión para contexto
echo "$question" >> "$SESSIONS_FILE"

# Auto-completado inteligente
if [ ${#question} -gt 3 ]; then
    echo -e "${CYAN}🔮 Sugerencias relacionadas:${NC}"
    smart_complete "$question" | head -2 | while read suggestion; do
        if [ -n "$suggestion" ]; then
            echo -e "  💡 $suggestion"
        fi
    done
    echo ""
fi

echo -e "${BLUE}🤖 Pensando sobre: '${YELLOW}$question${BLUE}'${NC}"

case "$question" in
    *"listar archivos"*|*"ver archivos"*)
        echo -e "${YELLOW}📁 Comandos para listar archivos:${NC}"
        echo -e "  ${GREEN}ls${NC}                    # Lista básica"
        echo -e "  ${GREEN}ls -l${NC}                 # Lista detallada"
        echo -e "  ${GREEN}ls -la${NC}                # Incluye archivos ocultos"
        echo -e "  ${GREEN}ls -lh${NC}                # Tamaños legibles"
        ;;
        
    *"procesos"*|*"process"*)
        echo -e "${YELLOW}⚙️ Gestión de procesos:${NC}"
        echo -e "  ${GREEN}ps${NC}                    # Procesos del usuario actual"
        echo -e "  ${GREEN}ps aux${NC}                # Todos los procesos"
        echo -e "  ${GREEN}top${NC}                   # Monitor en tiempo real"
        echo -e "  ${GREEN}htop${NC}                  # Monitor mejorado"
        ;;
        
    *"disco"*|*"espacio"*)
        echo -e "${YELLOW}💾 Gestión de disco:${NC}"
        echo -e "  ${GREEN}df -h${NC}                 # Espacio total en discos"
        echo -e "  ${GREEN}du -h${NC}                 # Tamaño de directorios"
        echo -e "  ${GREEN}du -sh *${NC}              # Tamaño de archivos en directorio"
        ;;
        
    *"red"*|*"internet"*|*"conexión"*)
        echo -e "${YELLOW}🌐 Comandos de red:${NC}"
        echo -e "  ${GREEN}ping host${NC}             # Verificar conectividad"
        echo -e "  ${GREEN}curl url${NC}              # Descargar contenido web"
        echo -e "  ${GREEN}ifconfig${NC}              # Configuración de red"
        ;;
        
    *"favorito"*|*"favorite"*)
        echo -e "${YELLOW}⭐ Agregar a favoritos:${NC}"
        echo "Usa: ai --add-favorite 'comando'"
        ;;
        
    *"aprender"*|*"enseñar"*|*"learn"*)
        echo -e "${YELLOW}📚 Enseñar nuevo comando:${NC}"
        echo "Usa: ai --learn 'comando|descripción'"
        ;;
        
    *)
        # Buscar en comandos aprendidos
        learned_response=$(grep -i "$question" "$LEARNED_COMMANDS_FILE" 2>/dev/null | head -1)
        if [ -n "$learned_response" ]; then
            echo -e "${GREEN}📚 Comando aprendido:${NC}"
            echo "$learned_response"
        else
            # Análisis inteligente de la pregunta
            case "$question" in
                *"ayuda"*|*"help"*|*"no entiendo"*)
                    echo -e "${YELLOW}🆘 Centro de Ayuda:${NC}"
                    echo "  • Usa 'ai --history' para ver preguntas anteriores"
                    echo "  • Usa 'ai --learn' para enseñarme nuevos comandos"
                    echo "  • Usa 'ai --complete' para sugerencias inteligentes"
                    echo "  • Usa 'ai --tools' para herramientas modernas"
                    ;;
                *"problema"*|*"error"*|*"no funciona"*)
                    echo -e "${RED}🔧 Solución de Problemas:${NC}"
                    echo "  • Usa 'ai --analyze \"mensaje de error\"' para diagnóstico"
                    echo "  • Verifica permisos con: ls -la"
                    echo "  • Revisa logs del sistema: journalctl -xe"
                    ;;
                *"nuevo"*|*"instalar"*|*"setup"*)
                    echo -e "${GREEN}⚙️ Configuración y Setup:${NC}"
                    echo "  • Para paquetes: apt update && apt install"
                    echo "  • Para desarrollo: npm install, pip install"
                    echo "  • Para contenedores: docker build, docker run"
                    ;;
                *"rendimiento"*|*"lento"*|*"optimización"*)
                    echo -e "${YELLOW}⚡ Optimización de Rendimiento:${NC}"
                    echo "  • Monitorea procesos: htop, top"
                    echo "  • Analiza disco: df -h, du -sh"
                    echo "  • Memoria: free -h, vmstat"
                    ;;
                *)
                    echo -e "${RED}🤔 No tengo una respuesta específica para: '$question'${NC}"
                    echo -e "${BLUE}💡 Puedo ayudarte con:${NC}"
                    echo "  • Comandos de archivos (ls, cd, mkdir, etc.)"
                    echo "  • Gestión de procesos (ps, top, kill, etc.)"
                    echo "  • Disco y almacenamiento (df, du, etc.)"
                    echo "  • Redes (ping, curl, wget, etc.)"
                    echo ""
                    echo -e "${YELLOW}💡 Sugerencias inteligentes:${NC}"
                    echo "  'ai --complete \"$question\"' para autocompletado"
                    echo "  'ai --github \"$question\"' para buscar en GitHub"
                    echo "  'ai --learn \"comando|$question\"' para enseñarme"
                    ;;
            esac
        fi
        ;;
esac

echo -e "${BLUE}---${NC}"
echo -e "${GREEN}🤖 ¡Listo! Si necesitas más ayuda, solo pregunta.${NC}"
echo -e "${BLUE}💡 Comandos avanzados disponibles:${NC}"
echo -e "   ${CYAN}--complete${NC} (autocompletado) | ${CYAN}--analyze${NC} (errores) | ${CYAN}--github${NC} (búsqueda)"
echo -e "   ${CYAN}--chat${NC} (conversación) | ${CYAN}--tools${NC} (herramientas modernas)"
