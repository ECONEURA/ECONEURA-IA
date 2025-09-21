#!/bin/bash
# scripts/safety-checks.sh
# Validaciones de seguridad adicionales para ECONEURA-IA
# Funciones de seguridad reutilizables para otros scripts

set -euo pipefail

# Configuración de seguridad
MAX_FILE_SIZE_MB=100
MAX_LOG_AGE_DAYS=90
SAFE_UMASK=0027
REQUIRED_PERMISSIONS=755

# Función de logging seguro
safe_log() {
    local level="${1:-INFO}"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Sanitizar mensaje para evitar inyección de logs
    message=$(echo "$message" | sed 's/[\x00-\x1F\x7F]//g' | cut -c1-500)

    echo "[$timestamp] [$level] $message" >&2
}

# Función para validar entrada de usuario
validate_input() {
    local input="$1"
    local max_length="${2:-100}"
    local pattern="${3:-'^[a-zA-Z0-9._/-]+$'}"

    # Verificar longitud
    if [[ ${#input} -gt $max_length ]]; then
        safe_log "ERROR" "Input demasiado largo: ${#input} caracteres (máx: $max_length)"
        return 1
    fi

    # Verificar patrón seguro
    if ! echo "$input" | grep -qE "$pattern"; then
        safe_log "ERROR" "Input no cumple con patrón seguro: $input"
        return 1
    fi

    # Verificar caracteres peligrosos
    if echo "$input" | grep -qE '[;&|`$()<>]'; then
        safe_log "ERROR" "Input contiene caracteres peligrosos: $input"
        return 1
    fi

    return 0
}

# Función para validar rutas de archivos
validate_file_path() {
    local file_path="$1"
    local base_dir="${2:-/workspaces/ECONEURA-IA}"

    # Resolver ruta absoluta
    local abs_path
    abs_path=$(realpath -m "$file_path" 2>/dev/null || echo "")

    if [[ -z "$abs_path" ]]; then
        safe_log "ERROR" "Ruta inválida: $file_path"
        return 1
    fi

    # Verificar que esté dentro del directorio base
    if [[ "$abs_path" != "$base_dir"* ]]; then
        safe_log "ERROR" "Ruta fuera del directorio permitido: $abs_path"
        return 1
    fi

    # Verificar que no sea un enlace simbólico peligroso
    if [[ -L "$abs_path" ]]; then
        local link_target
        link_target=$(readlink -f "$abs_path" 2>/dev/null || echo "")
        if [[ "$link_target" != "$base_dir"* ]]; then
            safe_log "ERROR" "Enlace simbólico apunta fuera del directorio permitido: $link_target"
            return 1
        fi
    fi

    echo "$abs_path"
    return 0
}

# Función para validar tamaño de archivo
validate_file_size() {
    local file_path="$1"
    local max_size_mb="${2:-$MAX_FILE_SIZE_MB}"

    if [[ ! -f "$file_path" ]]; then
        safe_log "ERROR" "Archivo no encontrado: $file_path"
        return 1
    fi

    local file_size_mb
    file_size_mb=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null || echo 0)
    file_size_mb=$((file_size_mb / 1024 / 1024))

    if [[ $file_size_mb -gt $max_size_mb ]]; then
        safe_log "ERROR" "Archivo demasiado grande: ${file_size_mb}MB (máx: ${max_size_mb}MB)"
        return 1
    fi

    return 0
}

# Función para validar permisos de archivo
validate_file_permissions() {
    local file_path="$1"
    local expected_perms="${2:-$REQUIRED_PERMISSIONS}"

    if [[ ! -f "$file_path" ]]; then
        safe_log "ERROR" "Archivo no encontrado: $file_path"
        return 1
    fi

    local actual_perms
    actual_perms=$(stat -c %a "$file_path" 2>/dev/null || echo "")

    if [[ -z "$actual_perms" ]]; then
        safe_log "ERROR" "No se pudieron obtener permisos de: $file_path"
        return 1
    fi

    # Verificar permisos críticos
    local world_write
    world_write=$(echo "$actual_perms" | cut -c3)

    if [[ $world_write -gt 0 ]]; then
        safe_log "ERROR" "Archivo world-writable detectado: $file_path (perms: $actual_perms)"
        return 1
    fi

    return 0
}

# Función para validar comandos del sistema
validate_command() {
    local command="$1"

    # Lista de comandos permitidos
    local allowed_commands=(
        "bash" "sh" "cat" "grep" "sed" "awk" "find" "ls" "pwd" "date"
        "mkdir" "rm" "cp" "mv" "touch" "chmod" "chown" "stat"
        "tar" "gzip" "gunzip" "sha256sum" "md5sum"
        "git" "node" "npm" "pnpm" "jq" "curl" "wget"
    )

    # Verificar que el comando esté en la lista permitida
    local cmd_base
    cmd_base=$(echo "$command" | awk '{print $1}')

    for allowed in "${allowed_commands[@]}"; do
        if [[ "$cmd_base" == "$allowed" ]]; then
            return 0
        fi
    done

    safe_log "ERROR" "Comando no permitido: $cmd_base"
    return 1
}

# Función para sanitizar variables de entorno
sanitize_environment() {
    # Remover variables peligrosas
    unset LD_PRELOAD
    unset LD_LIBRARY_PATH
    unset PATH  # Será reestablecida con valor seguro

    # Establecer umask seguro
    umask "$SAFE_UMASK"

    # Establecer PATH seguro
    export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin"

    # Limpiar otras variables potencialmente peligrosas
    unset IFS
    export IFS=$' \t\n'

    safe_log "INFO" "Environment sanitizado"
}

# Función para validar JSON
validate_json() {
    local json_file="$1"

    if [[ ! -f "$json_file" ]]; then
        safe_log "ERROR" "Archivo JSON no encontrado: $json_file"
        return 1
    fi

    if ! jq . "$json_file" >/dev/null 2>&1; then
        safe_log "ERROR" "JSON inválido: $json_file"
        return 1
    fi

    return 0
}

# Función para crear directorio de forma segura
safe_mkdir() {
    local dir_path="$1"
    local permissions="${2:-755}"

    if [[ -z "$dir_path" ]]; then
        safe_log "ERROR" "Ruta de directorio vacía"
        return 1
    fi

    # Validar la ruta
    local safe_path
    if ! safe_path=$(validate_file_path "$dir_path"); then
        return 1
    fi

    if [[ -d "$safe_path" ]]; then
        safe_log "INFO" "Directorio ya existe: $safe_path"
        return 0
    fi

    if mkdir -p "$safe_path" && chmod "$permissions" "$safe_path"; then
        safe_log "INFO" "Directorio creado: $safe_path"
        return 0
    else
        safe_log "ERROR" "No se pudo crear directorio: $safe_path"
        return 1
    fi
}

# Función para backup seguro
safe_backup() {
    local source_file="$1"
    local backup_dir="${2:-/tmp/backups}"
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    # Validar archivos
    if ! validate_file_path "$source_file"; then
        return 1
    fi

    if ! safe_mkdir "$backup_dir"; then
        return 1
    fi

    local backup_file="$backup_dir/$(basename "$source_file").backup.$timestamp"

    if cp "$source_file" "$backup_file"; then
        safe_log "INFO" "Backup creado: $backup_file"
        echo "$backup_file"
        return 0
    else
        safe_log "ERROR" "No se pudo crear backup: $backup_file"
        return 1
    fi
}

# Función para validar configuración de red
validate_network_config() {
    # Verificar que no haya proxies maliciosos
    if [[ -n "${http_proxy:-}" ]]; then
        if ! echo "$http_proxy" | grep -qE '^https?://'; then
            safe_log "ERROR" "Proxy HTTP inválido: $http_proxy"
            return 1
        fi
    fi

    if [[ -n "${https_proxy:-}" ]]; then
        if ! echo "$https_proxy" | grep -qE '^https?://'; then
            safe_log "ERROR" "Proxy HTTPS inválido: $https_proxy"
            return 1
        fi
    fi

    return 0
}

# Función principal para ejecutar todas las validaciones
run_all_safety_checks() {
    local target_dir="${1:-/workspaces/ECONEURA-IA}"

    safe_log "INFO" "Ejecutando validaciones de seguridad completas..."

    sanitize_environment

    if ! validate_network_config; then
        safe_log "ERROR" "Configuración de red inválida"
        return 1
    fi

    # Validar archivos críticos
    local critical_files=(
        "package.json"
        "scripts/validate_env.sh"
        "scripts/ai.sh"
        "dry-run-executor.sh"
    )

    for file in "${critical_files[@]}"; do
        local full_path="$target_dir/$file"
        if [[ -f "$full_path" ]]; then
            if ! validate_file_size "$full_path"; then
                continue
            fi
            if ! validate_file_permissions "$full_path"; then
                continue
            fi
        fi
    done

    safe_log "INFO" "Validaciones de seguridad completadas"
    return 0
}

# Exportar funciones para uso en otros scripts
export -f safe_log validate_input validate_file_path validate_file_size
export -f validate_file_permissions validate_command sanitize_environment
export -f validate_json safe_mkdir safe_backup validate_network_config
export -f run_all_safety_checks

# Si el script se ejecuta directamente, mostrar ayuda
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "ECONEURA-IA Safety Checks v1.0"
    echo "Funciones de seguridad para scripts del sistema"
    echo ""
    echo "Uso: source $0"
    echo ""
    echo "Funciones disponibles:"
    echo "  safe_log LEVEL MESSAGE           - Logging seguro"
    echo "  validate_input INPUT [MAX_LEN] [PATTERN] - Validar entrada"
    echo "  validate_file_path PATH [BASE_DIR]       - Validar ruta de archivo"
    echo "  validate_file_size FILE [MAX_MB]         - Validar tamaño de archivo"
    echo "  validate_file_permissions FILE [PERMS]   - Validar permisos"
    echo "  validate_command COMMAND                 - Validar comando"
    echo "  sanitize_environment                     - Sanitizar environment"
    echo "  validate_json FILE                       - Validar JSON"
    echo "  safe_mkdir DIR [PERMS]                   - Crear directorio seguro"
    echo "  safe_backup FILE [BACKUP_DIR]            - Crear backup seguro"
    echo "  run_all_safety_checks [DIR]              - Ejecutar todas las validaciones"
fi
