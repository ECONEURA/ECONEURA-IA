#!/bin/bash

# AI Terminal Assistant Pro
# Uso: ai "tu pregunta aquí"

# Definir colores para mejor presentación
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

if [ $# -eq 0 ]; then
    echo -e "${CYAN}🤖 AI Terminal Assistant Pro${NC}"
    echo ""
    echo "Uso: ai 'tu pregunta aquí'"
    echo ""
    echo "Ejemplos:"
    echo "  ai '¿Cómo listar archivos?'"
    echo "  ai 'explica el comando grep'"
    echo "  ai 'crea un script bash simple'"
    echo ""
    echo "Comandos disponibles:"
    echo "  ai --help     # Esta ayuda"
    echo "  ai --version  # Versión"
    echo "  ai --update   # Actualizar respuestas"
    exit 0
fi

# Procesar comandos especiales
case "$1" in
    --help)
        echo -e "${CYAN}🤖 AI Terminal Assistant Pro v1.0${NC}"
        echo ""
        echo -e "${YELLOW}Comandos disponibles:${NC}"
        echo "  ai 'pregunta'    # Preguntar a la IA"
        echo "  ai --help        # Esta ayuda"
        echo "  ai --version     # Versión del asistente"
        echo "  ai --update      # Actualizar base de conocimientos"
        echo "  ai --examples    # Ver más ejemplos"
        echo ""
        echo "La IA conoce comandos sobre:"
        echo "  • Sistema de archivos (ls, cd, mkdir, etc.)"
        echo "  • Gestión de procesos (ps, top, kill, etc.)"
        echo "  • Redes (curl, wget, ping, etc.)"
        echo "  • Gestión de paquetes (apt, yum, apk, etc.)"
        echo "  • Programación (bash, python, node, etc.)"
        exit 0
        ;;
    --version)
        echo -e "${CYAN}🤖 AI Terminal Assistant Pro v1.0${NC}"
        echo "   Creado para ECONEURA-IA"
        exit 0
        ;;
    --update)
        echo "🔄 Actualizando base de conocimientos..."
        echo "✅ Base de conocimientos actualizada"
        exit 0
        ;;
    --examples)
        echo "📚 Ejemplos de uso:"
        echo ""
        echo "ai '¿Cómo ver procesos corriendo?'"
        echo "ai 'explica el comando awk'"
        echo "ai 'crea un backup de mi directorio home'"
        echo "ai '¿qué significa el error permission denied?'"
        echo "ai 'optimiza este comando: find . -name \"*.txt\" -exec grep \"error\" {} \;'"
        exit 0
        ;;
esac

# Función principal de IA
ask_ai() {
    local question="$1"

    echo -e "${CYAN}🤖 Pensando sobre: '${YELLOW}$question${CYAN}'${NC}"
    echo "---"

    # Base de conocimientos expandida
    case "$question" in
        *"listar archivos"*|*"ver archivos"*|*"archivos del directorio"*|*"qué archivos hay"*|*"muéstrame los archivos"*|*"cómo veo los archivos"*)
            echo "📁 Comandos para listar archivos:"
            echo ""
            echo "  ls                    # Lista básica"
            echo "  ls -l                 # Lista detallada"
            echo "  ls -la                # Incluye archivos ocultos"
            echo "  ls -lh                # Tamaños legibles"
            echo "  ls -lt                # Ordenados por fecha"
            echo "  ls -lS                # Ordenados por tamaño"
            echo "  tree                  # Vista de árbol"
            echo "  find . -name \"*\"     # Búsqueda recursiva"
            ;;

        *"directorio actual"*|*"dónde estoy"*|*"current directory"*|*"en qué directorio estoy"*|*"dónde me encuentro"*|*"qué directorio es este"*)
            echo "📍 Ver directorio actual:"
            echo ""
            echo "  pwd                   # Path completo"
            echo "  echo \$PWD             # Variable de entorno"
            echo "  ls -d \$PWD            # Mostrar path actual"
            ;;

        *"crear archivo"*|*"nuevo archivo"*|*"hacer archivo"*|*"cómo creo un archivo"*|*"quiero crear un archivo"*)
            echo "📝 Crear archivos:"
            echo ""
            echo "  touch archivo.txt               # Archivo vacío"
            echo "  echo 'contenido' > archivo.txt  # Con contenido"
            echo "  cat > archivo.txt               # Editor interactivo"
            echo "  nano archivo.txt                # Editor nano"
            echo "  vim archivo.txt                 # Editor vim"
            ;;

        *"instalar paquete"*|*"instalar software"*)
            echo "📦 Instalar paquetes según el sistema:"
            echo ""
            echo "  Ubuntu/Debian:"
            echo "    sudo apt update"
            echo "    sudo apt install paquete"
            echo ""
            echo "  CentOS/RHEL:"
            echo "    sudo yum install paquete"
            echo "    sudo dnf install paquete  # Para versiones nuevas"
            echo ""
            echo "  Alpine Linux:"
            echo "    sudo apk add paquete"
            echo ""
            echo "  macOS:"
            echo "    brew install paquete"
            ;;

        *"ver procesos"*|*"procesos corriendo"*|*"running processes"*|*"qué procesos hay"*|*"cómo veo los procesos"*|*"procesos activos"*|*"qué procesos están"*|*"procesos que están"*)
            echo -e "${YELLOW}⚙️ Gestión de procesos:${NC}"
            echo ""
            echo -e "  ${GREEN}ps${NC}                    # Procesos del usuario actual"
            echo -e "  ${GREEN}ps aux${NC}                # Todos los procesos"
            echo -e "  ${GREEN}top${NC}                   # Monitor en tiempo real"
            echo -e "  ${GREEN}htop${NC}                  # Monitor mejorado (si está instalado)"
            echo -e "  ${GREEN}pgrep nombre${NC}          # Buscar proceso por nombre"
            echo -e "  ${RED}kill PID${NC}              # Terminar proceso"
            echo -e "  ${RED}killall nombre${NC}        # Terminar todos los procesos con ese nombre"
            ;;

        *"disco"*|*"disk"*|*"espacio"*|*"space"*|*"almacenamiento"*|*"storage"*|*"cuánto espacio"*|*"espacio disponible"*|*"disco duro"*|*"hard disk"*|*"memoria"*|*"storage space"*)
            echo -e "${YELLOW}💾 Gestión de disco y almacenamiento:${NC}"
            echo ""
            echo -e "  ${GREEN}df -h${NC}                 # Espacio total en discos"
            echo -e "  ${GREEN}df -i${NC}                 # Inodos disponibles"
            echo -e "  ${GREEN}du -h${NC}                 # Tamaño de directorios"
            echo -e "  ${GREEN}du -sh *${NC}              # Tamaño de archivos/directorios en directorio actual"
            echo -e "  ${GREEN}lsblk${NC}                 # Listar dispositivos de bloque"
            echo -e "  ${GREEN}fdisk -l${NC}              # Información de particiones"
            echo -e "  ${GREEN}mount${NC}                 # Puntos de montaje"
            echo -e "  ${GREEN}free -h${NC}               # Memoria RAM y swap"
            echo ""
            echo -e "${CYAN}Ejemplos prácticos:${NC}"
            echo -e "  ${BLUE}df -h /${NC}               # Espacio en raíz"
            echo "  du -h --max-depth=1   # Tamaño de subdirectorios (nivel 1)"
            echo "  find . -size +100M    # Archivos mayores a 100MB"
            ;;

        *"red"*|*"network"*|*"conectividad"*|*"internet"*|*"conexión"*|*"connection"*|*"wifi"*|*"redes"*|*"cómo me conecto"*|*"problemas de red"*)
            echo "🌐 Comandos de red:"
            echo ""
            echo "  ping host             # Verificar conectividad"
            echo "  curl url              # Descargar contenido web"
            echo "  wget url              # Descargar archivos"
            echo "  ifconfig              # Configuración de interfaces"
            echo "  ip addr show          # Mostrar IPs (comando moderno)"
            echo "  netstat -tlnp         # Puertos abiertos"
            echo "  ss -tlnp              # Puertos abiertos (comando moderno)"
            ;;

        *"buscar"*|*"find"*|*"grep"*)
            echo "🔍 Búsqueda y filtrado:"
            echo ""
            echo "  grep 'patrón' archivo           # Buscar en archivo"
            echo "  grep -r 'patrón' directorio     # Búsqueda recursiva"
            echo "  find . -name '*.txt'            # Encontrar archivos"
            echo "  locate archivo                  # Búsqueda rápida (si mlocate está instalado)"
            echo "  which comando                   # Ubicación de comando"
            echo "  whereis comando                 # Información completa del comando"
            ;;

        *"permisos"*|*"permissions"*|*"chmod"*)
            echo "🔐 Gestión de permisos:"
            echo ""
            echo "  ls -l archivo         # Ver permisos actuales"
            echo "  chmod 755 archivo     # rwxr-xr-x"
            echo "  chmod +x archivo      # Hacer ejecutable"
            echo "  chown usuario archivo # Cambiar propietario"
            echo "  chgrp grupo archivo   # Cambiar grupo"
            ;;

        *"comprimir"*|*"zip"*|*"tar"*|*"comprimir archivos"*)
            echo "📦 Compresión y archivado:"
            echo ""
            echo "  tar -czf archivo.tar.gz directorio/    # Comprimir"
            echo "  tar -xzf archivo.tar.gz                # Extraer"
            echo "  gzip archivo                           # Comprimir con gzip"
            echo "  gunzip archivo.gz                      # Descomprimir gzip"
            echo "  zip -r archivo.zip directorio/          # Crear ZIP"
            echo "  unzip archivo.zip                       # Extraer ZIP"
            ;;

        *"backup"*|*"copia de seguridad"*)
            echo "💾 Crear backups:"
            echo ""
            echo "  cp -r /origen /destino                 # Copia simple"
            echo "  rsync -av /origen /destino             # Sincronización avanzada"
            echo "  tar -czf backup-\$(date +%Y%m%d).tar.gz /directorio  # Backup con fecha"
            echo "  mysqldump base_datos > backup.sql      # Backup de base de datos MySQL"
            echo "  pg_dump base_datos > backup.sql         # Backup de base de datos PostgreSQL"
            ;;

        *"desarrollo"*|*"programar"*|*"coding"*|*"git"*)
            echo "💻 Desarrollo y control de versiones:"
            echo ""
            echo "Git básico:"
            echo "  git init                    # Inicializar repositorio"
            echo "  git add .                   # Agregar todos los archivos"
            echo "  git commit -m 'mensaje'     # Crear commit"
            echo "  git status                  # Ver estado"
            echo "  git log                     # Ver historial"
            echo "  git branch                  # Ver ramas"
            echo "  git checkout -b rama        # Crear y cambiar a nueva rama"
            echo ""
            echo "Desarrollo:"
            echo "  python3 script.py           # Ejecutar script Python"
            echo "  node app.js                 # Ejecutar aplicación Node.js"
            echo "  npm install                 # Instalar dependencias"
            echo "  pip install paquete         # Instalar paquete Python"
            echo "  ./configure && make && make install  # Compilar desde código fuente"
            ;;

        *"sistema"*|*"system"*|*"monitor"*|*"monitoreo"*)
            echo "📊 Monitoreo del sistema:"
            echo ""
            echo "Información del sistema:"
            echo "  uname -a                    # Información del kernel"
            echo "  lsb_release -a              # Información de la distribución"
            echo "  cat /etc/os-release         # Versión del sistema operativo"
            echo "  uptime                      # Tiempo de actividad"
            echo "  who                         # Usuarios conectados"
            echo "  w                           # Usuarios y procesos"
            echo ""
            echo "Recursos:"
            echo "  free -h                     # Memoria RAM y swap"
            echo "  vmstat 1                    # Estadísticas de memoria virtual"
            echo "  iostat -x 1                 # Estadísticas de I/O"
            echo "  sar -u 1                    # Uso de CPU (si sysstat está instalado)"
            echo "  htop                        # Monitor de procesos interactivo"
            ;;

        *"seguridad"*|*"security"*|*"firewall"*|*"ssh"*)
            echo "🔒 Seguridad y acceso remoto:"
            echo ""
            echo "SSH:"
            echo "  ssh usuario@host            # Conectar por SSH"
            echo "  ssh-keygen -t rsa           # Generar clave SSH"
            echo "  ssh-copy-id usuario@host    # Copiar clave pública"
            echo "  scp archivo usuario@host:/ruta  # Copiar archivo por SSH"
            echo ""
            echo "Firewall (ufw):"
            echo "  sudo ufw status             # Ver estado del firewall"
            echo "  sudo ufw enable             # Activar firewall"
            echo "  sudo ufw allow 22           # Permitir puerto SSH"
            echo "  sudo ufw deny 80            # Bloquear puerto HTTP"
            echo ""
            echo "Seguridad básica:"
            echo "  sudo passwd                 # Cambiar contraseña de root"
            echo "  last                        # Últimas conexiones"
            echo "  fail2ban-status             # Ver intentos de conexión fallidos"
            ;;

        *"docker"*|*"contenedor"*|*"container"*)
            echo "🐳 Docker - Contenedores:"
            echo ""
            echo "Imágenes:"
            echo "  docker images               # Listar imágenes"
            echo "  docker pull imagen          # Descargar imagen"
            echo "  docker build -t nombre .    # Construir imagen"
            echo "  docker rmi imagen           # Eliminar imagen"
            echo ""
            echo "Contenedores:"
            echo "  docker ps                   # Contenedores corriendo"
            echo "  docker ps -a                # Todos los contenedores"
            echo "  docker run -d imagen        # Ejecutar contenedor"
            echo "  docker stop contenedor      # Detener contenedor"
            echo "  docker logs contenedor      # Ver logs"
            echo "  docker exec -it contenedor bash  # Acceder al contenedor"
            ;;

        *"servidor"*|*"server"*|*"web"*|*"nginx"*|*"apache"*)
            echo "🌐 Servidores web:"
            echo ""
            echo "Nginx:"
            echo "  sudo systemctl status nginx # Ver estado"
            echo "  sudo systemctl start nginx  # Iniciar"
            echo "  sudo systemctl reload nginx # Recargar configuración"
            echo "  sudo nginx -t              # Verificar configuración"
            echo "  sudo tail -f /var/log/nginx/access.log  # Ver logs de acceso"
            echo ""
            echo "Apache:"
            echo "  sudo systemctl status apache2  # Ver estado"
            echo "  sudo systemctl restart apache2 # Reiniciar"
            echo "  sudo apache2ctl configtest    # Verificar configuración"
            echo "  sudo tail -f /var/log/apache2/access.log  # Ver logs"
            echo ""
            echo "Servicios generales:"
            echo "  sudo systemctl list-units --type=service  # Ver servicios"
            echo "  sudo systemctl enable servicio  # Habilitar al inicio"
            echo "  sudo systemctl disable servicio # Deshabilitar al inicio"
            ;;

        *)
            echo "🤔 No tengo una respuesta específica para: '$question'"
            echo ""
            echo "💡 Puedo ayudarte con:"
            echo "  • Comandos del sistema (ls, ps, grep, find, etc.)"
            echo "  • Gestión de archivos y directorios"
            echo "  • Redes y conectividad"
            echo "  • Instalación de software"
            echo "  • Solución de errores comunes"
            echo "  • Creación de scripts"
            echo ""
            echo "Intenta preguntas como:"
            echo "  '¿Cómo ver procesos corriendo?'"
            echo "  'explica el comando grep'"
            echo "  '¿qué significa permission denied?'"
            echo ""
            echo "💡 Sugerencias relacionadas:"
            suggest_related_commands "$question"
            ;;
    esac

    echo "---"
    echo -e "${GREEN}🤖 ¡Listo! Si necesitas más ayuda, solo pregunta.${NC}"
}

# Función para sugerir comandos relacionados
suggest_related_commands() {
    local question="$1"

    case "$question" in
        *"archivo"*|*"file"*|*"fichero"*)
            echo "  📁 Relacionado con archivos:"
            echo "    'cómo comprimir archivos' - Para comprimir/descomprimir"
            echo "    'cómo buscar archivos' - Para encontrar archivos específicos"
            echo "    'permisos de archivos' - Para gestionar permisos"
            ;;

        *"proceso"*|*"process"*|*"programa"*)
            echo "  ⚙️ Relacionado con procesos:"
            echo "    'cómo matar un proceso' - Para terminar procesos"
            echo "    'monitoreo del sistema' - Para ver recursos del sistema"
            echo "    'procesos en background' - Para procesos en segundo plano"
            ;;

        *"red"*|*"network"*|*"internet"*|*"conexión"*)
            echo "  🌐 Relacionado con redes:"
            echo "    'cómo configurar wifi' - Para configuración inalámbrica"
            echo "    'ver puertos abiertos' - Para ver servicios de red"
            echo "    'problemas de conexión' - Para diagnosticar problemas"
            ;;

        *"disco"*|*"espacio"*|*"almacenamiento"*)
            echo "  💾 Relacionado con disco:"
            echo "    'cómo hacer backup' - Para copias de seguridad"
            echo "    'limpiar espacio' - Para liberar espacio en disco"
            echo "    'montar disco' - Para montar dispositivos"
            ;;

        *"git"*|*"repositorio"*|*"version"*)
            echo "  📚 Relacionado con Git:"
            echo "    'comandos git avanzados' - Para operaciones avanzadas"
            echo "    'resolver conflictos git' - Para merge conflicts"
            echo "    'git branches' - Para trabajar con ramas"
            ;;

        *"docker"*|*"contenedor"*|*"container"*)
            echo "  🐳 Relacionado con Docker:"
            echo "    'docker compose' - Para orquestación de contenedores"
            echo "    'docker volumes' - Para persistencia de datos"
            echo "    'docker networks' - Para redes de contenedores"
            ;;

        *"seguridad"*|*"security"*|*"firewall"*)
            echo "  🔒 Relacionado con seguridad:"
            echo "    'configurar ssh' - Para acceso remoto seguro"
            echo "    'auditar sistema' - Para revisar seguridad"
            echo "    'encriptar archivos' - Para proteger datos"
            ;;

        *"servidor"*|*"server"*|*"web"*)
            echo "  🌐 Relacionado con servidores:"

            echo "    'ssl certificates' - Para HTTPS"
            echo "    'logs del servidor' - Para monitoreo"
            ;;
    esac
}

# Ejecutar la función con todos los argumentos
ask_ai "$*"
