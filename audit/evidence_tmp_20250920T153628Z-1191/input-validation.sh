#!/bin/bash
# scripts/input-validation.sh
# Validación de entrada mejorada para ECONEURA-IA
# Proporciona validaciones avanzadas para diferentes tipos de input

set -euo pipefail

# Configuración de validación
MAX_STRING_LENGTH=1000
MAX_ARRAY_SIZE=100
MAX_FILE_SIZE_MB=50
SAFE_PATTERN='^[a-zA-Z0-9._/-]+$'
EMAIL_PATTERN='^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
URL_PATTERN='^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/[a-zA-Z0-9._/-]*)?$'
UUID_PATTERN='^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Función para validar strings básicos
validate_string() {
    local input="$1"
    local max_length="${2:-$MAX_STRING_LENGTH}"
    local allow_empty="${3:-false}"

    # Verificar si está vacío
    if [[ -z "$input" && "$allow_empty" != "true" ]]; then
        log "ERROR: String vacío no permitido"
        return 1
    fi

    # Verificar longitud máxima
    if [[ ${#input} -gt $max_length ]]; then
        log "ERROR: String demasiado largo (${#input} > $max_length)"
        return 1
    fi

    # Verificar caracteres de control
    if echo "$input" | grep -q $'[\x00-\x1F\x7F-\x9F]'; then
        log "ERROR: String contiene caracteres de control"
        return 1
    fi

    return 0
}

# Función para validar nombres de archivo
validate_filename() {
    local filename="$1"
    local max_length="${2:-255}"

    # Verificar caracteres peligrosos
    if echo "$filename" | grep -qE '[<>:"|?*\x00-\x1F]'; then
        log "ERROR: Nombre de archivo contiene caracteres peligrosos: $filename"
        return 1
    fi

    # Verificar nombres especiales de Windows
    local forbidden_names=("CON" "PRN" "AUX" "NUL" "COM1" "COM2" "COM3" "COM4" "COM5" "COM6" "COM7" "COM8" "COM9" "LPT1" "LPT2" "LPT3" "LPT4" "LPT5" "LPT6" "LPT7" "LPT8" "LPT9")
    local base_name
    base_name=$(basename "$filename" | tr '[:lower:]' '[:upper:]' | sed 's/\..*//')

    for forbidden in "${forbidden_names[@]}"; do
        if [[ "$base_name" == "$forbidden" ]]; then
            log "ERROR: Nombre de archivo reservado: $filename"
            return 1
        fi
    done

    # Verificar longitud
    if [[ ${#filename} -gt $max_length ]]; then
        log "ERROR: Nombre de archivo demasiado largo: $filename"
        return 1
    fi

    return 0
}

# Función para validar rutas de directorio
validate_directory_path() {
    local path="$1"
    local base_dir="${2:-/workspaces/ECONEURA-IA}"

    # Verificar que no sea absoluta peligrosa
    if [[ "$path" == "/etc"* || "$path" == "/usr"* || "$path" == "/var"* || "$path" == "/root"* ]]; then
        log "ERROR: Ruta de sistema no permitida: $path"
        return 1
    fi

    # Resolver ruta absoluta
    local abs_path
    if ! abs_path=$(realpath -m "$path" 2>/dev/null); then
        log "ERROR: No se puede resolver la ruta: $path"
        return 1
    fi

    # Verificar que esté dentro del directorio base
    if [[ "$abs_path" != "$base_dir"* ]]; then
        log "ERROR: Ruta fuera del directorio permitido: $abs_path"
        return 1
    fi

    # Verificar que no sea un enlace simbólico
    if [[ -L "$path" ]]; then
        log "ERROR: Enlaces simbólicos no permitidos: $path"
        return 1
    fi

    echo "$abs_path"
    return 0
}

# Función para validar números enteros
validate_integer() {
    local input="$1"
    local min_value="${2:-0}"
    local max_value="${3:-999999}"

    # Verificar que sea un número
    if ! echo "$input" | grep -qE '^-?[0-9]+$'; then
        log "ERROR: No es un número entero válido: $input"
        return 1
    fi

    # Verificar rango
    if [[ $input -lt $min_value || $input -gt $max_value ]]; then
        log "ERROR: Número fuera de rango ($min_value - $max_value): $input"
        return 1
    fi

    return 0
}

# Función para validar emails
validate_email() {
    local email="$1"

    if [[ -z "$email" ]]; then
        log "ERROR: Email vacío"
        return 1
    fi

    if [[ ${#email} -gt 254 ]]; then
        log "ERROR: Email demasiado largo"
        return 1
    fi

    if ! echo "$email" | grep -qE "$EMAIL_PATTERN"; then
        log "ERROR: Formato de email inválido: $email"
        return 1
    fi

    # Verificar dominio básico
    local domain
    domain=$(echo "$email" | sed 's/.*@//')
    if [[ ${#domain} -gt 253 ]]; then
        log "ERROR: Dominio del email demasiado largo"
        return 1
    fi

    return 0
}

# Función para validar URLs
validate_url() {
    local url="$1"

    if [[ -z "$url" ]]; then
        log "ERROR: URL vacía"
        return 1
    fi

    if [[ ${#url} -gt 2000 ]]; then
        log "ERROR: URL demasiado larga"
        return 1
    fi

    if ! echo "$url" | grep -qE "$URL_PATTERN"; then
        log "ERROR: Formato de URL inválido: $url"
        return 1
    fi

    # Verificar esquemas seguros
    if echo "$url" | grep -qE '^https?://'; then
        return 0
    else
        log "ERROR: Solo se permiten URLs HTTP/HTTPS"
        return 1
    fi
}

# Función para validar UUIDs
validate_uuid() {
    local uuid="$1"

    if [[ -z "$uuid" ]]; then
        log "ERROR: UUID vacío"
        return 1
    fi

    if ! echo "$uuid" | grep -qE "$UUID_PATTERN"; then
        log "ERROR: Formato de UUID inválido: $uuid"
        return 1
    fi

    return 0
}

# Función para validar arrays JSON
validate_json_array() {
    local json_array="$1"
    local max_size="${2:-$MAX_ARRAY_SIZE}"

    # Verificar que sea JSON válido
    if ! echo "$json_array" | jq . >/dev/null 2>&1; then
        log "ERROR: JSON inválido: $json_array"
        return 1
    fi

    # Verificar que sea un array
    if ! echo "$json_array" | jq -e 'type == "array"' >/dev/null 2>&1; then
        log "ERROR: No es un array JSON: $json_array"
        return 1
    fi

    # Verificar tamaño del array
    local array_size
    array_size=$(echo "$json_array" | jq length)

    if [[ $array_size -gt $max_size ]]; then
        log "ERROR: Array demasiado grande ($array_size > $max_size)"
        return 1
    fi

    return 0
}

# Función para validar objetos JSON
validate_json_object() {
    local json_object="$1"
    local max_keys="${2:-50}"

    # Verificar que sea JSON válido
    if ! echo "$json_object" | jq . >/dev/null 2>&1; then
        log "ERROR: JSON inválido: $json_object"
        return 1
    fi

    # Verificar que sea un objeto
    if ! echo "$json_object" | jq -e 'type == "object"' >/dev/null 2>&1; then
        log "ERROR: No es un objeto JSON: $json_object"
        return 1
    fi

    # Verificar número de keys
    local keys_count
    keys_count=$(echo "$json_object" | jq 'keys | length')

    if [[ $keys_count -gt $max_keys ]]; then
        log "ERROR: Objeto tiene demasiadas keys ($keys_count > $max_keys)"
        return 1
    fi

    return 0
}

# Función para sanitizar strings
sanitize_string() {
    local input="$1"
    local max_length="${2:-$MAX_STRING_LENGTH}"

    # Remover caracteres de control
    local sanitized
    sanitized=$(echo "$input" | tr -d '\000-\037\177-\237')

    # Limitar longitud
    sanitized=$(echo "$sanitized" | cut -c1-"$max_length")

    # Escapar caracteres peligrosos para SQL/HTML (básico)
    sanitized=$(echo "$sanitized" | sed 's/[;<>&|]//g')

    echo "$sanitized"
}

# Función para validar y sanitizar input completo
validate_and_sanitize_input() {
    local input_type="$1"
    local input_value="$2"
    local options="${3:-}"

    case "$input_type" in
        "string")
            if validate_string "$input_value"; then
                sanitize_string "$input_value"
                return 0
            fi
            ;;
        "filename")
            if validate_filename "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        "directory")
            if validate_directory_path "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        "integer")
            if validate_integer "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        "email")
            if validate_email "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        "url")
            if validate_url "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        "uuid")
            if validate_uuid "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        "json_array")
            if validate_json_array "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        "json_object")
            if validate_json_object "$input_value"; then
                echo "$input_value"
                return 0
            fi
            ;;
        *)
            log "ERROR: Tipo de input desconocido: $input_type"
            return 1
            ;;
    esac

    return 1
}

# Función para mostrar ayuda
show_help() {
    cat << 'EOF'
ECONEURA-IA Input Validation v1.0

Validaciones disponibles:
  string       - String básico con sanitización
  filename     - Nombre de archivo seguro
  directory    - Ruta de directorio dentro del proyecto
  integer      - Número entero con rango
  email        - Dirección de email
  url          - URL HTTP/HTTPS
  uuid         - UUID v4
  json_array   - Array JSON válido
  json_object  - Objeto JSON válido

Uso:
  validate_and_sanitize_input <tipo> <valor> [opciones]

Ejemplos:
  validate_and_sanitize_input string "hello world"
  validate_and_sanitize_input email "<REDACTED_EMAIL>"
  validate_and_sanitize_input integer "42"
EOF
}

# Función principal
main() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi

    local input_type="$1"
    local input_value="$2"
    local options="${3:-}"

    if validate_and_sanitize_input "$input_type" "$input_value" "$options"; then
        exit 0
    else
        log "ERROR: Validación fallida para $input_type: $input_value"
        exit 1
    fi
}

# Si se ejecuta como script independiente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi