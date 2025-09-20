#!/bin/bash
# scripts/generate-manifests.sh
# Generador de manifiestos JSON para el sistema de seguridad ECONEURA-IA
# Crea metadatos completos para todos los archivos de seguridad

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MANIFEST_DIR="$PROJECT_ROOT/audit/manifests"
LOG_DIR="$PROJECT_ROOT/logs"

# Crear directorios si no existen
mkdir -p "$MANIFEST_DIR" "$LOG_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Función para calcular hash de archivo
calculate_file_hash() {
    local file="$1"
    if [[ -f "$file" ]]; then
        sha256sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "CALCULATION_FAILED"
    else
        echo "FILE_NOT_FOUND"
    fi
}

# Función para obtener metadatos de archivo
get_file_metadata() {
    local file="$1"
    local relative_path="${file#$PROJECT_ROOT/}"

    if [[ ! -f "$file" ]]; then
        cat << EOF
{
  "path": "$relative_path",
  "status": "not_found",
  "error": "File does not exist"
}
EOF
        return 1
    fi

    local size
    local mtime
    local permissions
    local owner
    local group
    local hash
    local mime_type
    local encoding

    size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
    mtime=$(stat -c%Y "$file" 2>/dev/null || stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || echo "UNKNOWN")
    permissions=$(stat -c%a "$file" 2>/dev/null || stat -f%p "$file" 2>/dev/null | tail -c 3 || echo "000")
    owner=$(stat -c%U "$file" 2>/dev/null || stat -f%Su "$file" 2>/dev/null || echo "unknown")
    group=$(stat -c%G "$file" 2>/dev/null || stat -f%Sg "$file" 2>/dev/null || echo "unknown")
    hash=$(calculate_file_hash "$file")
    mime_type=$(file -b --mime-type "$file" 2>/dev/null || echo "unknown")
    encoding=$(file -b --mime-encoding "$file" 2>/dev/null || echo "unknown")

    # Determinar tipo de archivo basado en extensión y contenido
    local file_type="unknown"
    local file_category="other"

    case "${file,,}" in
        *.sh) file_type="bash_script" ;;
        *.js) file_type="javascript" ;;
        *.ts) file_type="typescript" ;;
        *.json) file_type="json" ;;
        *.md) file_type="markdown" ;;
        *.txt) file_type="text" ;;
        *.yml|*.yaml) file_type="yaml" ;;
        *.prisma) file_type="prisma_schema" ;;
        *.css) file_type="stylesheet" ;;
        *.html) file_type="html" ;;
        *) file_type=$(echo "$mime_type" | cut -d'/' -f1) ;;
    esac

    # Categorizar archivos
    if [[ "$relative_path" == scripts/* ]]; then
        file_category="script"
    elif [[ "$relative_path" == apps/* ]]; then
        file_category="application"
    elif [[ "$relative_path" == packages/* ]]; then
        file_category="package"
    elif [[ "$relative_path" == audit/* ]]; then
        file_category="audit"
    elif [[ "$relative_path" == logs/* ]]; then
        file_category="log"
    elif [[ "$relative_path" == *.config.* || "$relative_path" == *config* ]]; then
        file_category="configuration"
    fi

    # Verificar si es ejecutable
    local is_executable="false"
    if [[ -x "$file" ]]; then
        is_executable="true"
    fi

    # Verificar si es un enlace simbólico
    local is_symlink="false"
    local symlink_target=""
    if [[ -L "$file" ]]; then
        is_symlink="true"
        symlink_target=$(readlink "$file" 2>/dev/null || echo "")
    fi

    # Obtener líneas de código (para archivos de código)
    local lines_count=0
    if [[ "$file_type" == "bash_script" || "$file_type" == "javascript" || "$file_type" == "typescript" ]]; then
        lines_count=$(wc -l < "$file" 2>/dev/null || echo 0)
    fi

    cat << EOF
{
  "path": "$relative_path",
  "absolute_path": "$file",
  "status": "found",
  "file_type": "$file_type",
  "file_category": "$file_category",
  "size_bytes": $size,
  "modified_time": "$mtime",
  "permissions": "$permissions",
  "owner": "$owner",
  "group": "$group",
  "hash_sha256": "$hash",
  "mime_type": "$mime_type",
  "encoding": "$encoding",
  "is_executable": $is_executable,
  "is_symlink": $is_symlink,
  "symlink_target": "$symlink_target",
  "lines_count": $lines_count
}
EOF
}

# Función para escanear archivos de seguridad
scan_security_files() {
    log "Escaneando archivos de seguridad..."

    local security_files=(
        # Scripts principales
        "scripts/validate_env.sh"
        "scripts/ai.sh"
        "dry-run-executor.sh"
        "scripts/crontab-setup.sh"
        "scripts/security-scan-daily.sh"
        "scripts/integrity-check.sh"
        "scripts/monitor-critical-files.sh"
        "scripts/cleanup-logs.sh"
        "scripts/check-dependencies.sh"
        "scripts/safety-checks.sh"
        "scripts/input-validation.sh"

        # Archivos de configuración
        "package.json"
        "pnpm-lock.yaml"
        "tsconfig.base.json"
        "apps/api/tsconfig.json"
        "apps/web/tsconfig.json"
        "packages/shared/tsconfig.json"
        "apps/api/src/db/schema.prisma"

        # Documentación
        "README.md"
        "README.dev.md"
        ".github/copilot-instructions.md"

        # Archivos de auditoría recientes
        $(find "$PROJECT_ROOT/audit" -name "*.json" -mtime -7 2>/dev/null | head -20)
    )

    local manifests=()

    for file in "${security_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            log "Procesando: $file"
            local metadata
            metadata=$(get_file_metadata "$PROJECT_ROOT/$file")
            manifests+=("$metadata")
        fi
    done

    # Unir todos los manifiestos en un array JSON
    printf '%s\n' "${manifests[@]}" | jq -s '.'
}

# Función para generar manifiesto de dependencias
generate_dependencies_manifest() {
    log "Generando manifiesto de dependencias..."

    local manifest_file="$MANIFEST_DIR/dependencies_manifest.json"

    if [[ -f "$PROJECT_ROOT/package.json" ]]; then
        local deps
        deps=$(jq '.dependencies // {}' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "{}")
        local dev_deps
        dev_deps=$(jq '.devDependencies // {}' "$PROJECT_ROOT/package.json" 2>/dev/null || echo "{}")

        cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "type": "dependencies_manifest",
  "package_json_exists": true,
  "dependencies": $deps,
  "dev_dependencies": $dev_deps,
  "total_dependencies": $(echo "$deps" | jq 'length'),
  "total_dev_dependencies": $(echo "$dev_deps" | jq 'length')
}
EOF
    else
        cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "type": "dependencies_manifest",
  "package_json_exists": false,
  "error": "package.json not found"
}
EOF
    fi

    log "Manifiesto de dependencias generado: $manifest_file"
}

# Función para generar manifiesto de configuración
generate_config_manifest() {
    log "Generando manifiesto de configuración..."

    local manifest_file="$MANIFEST_DIR/config_manifest.json"
    local config_files=(
        "tsconfig.base.json"
        "apps/api/tsconfig.json"
        "apps/web/tsconfig.json"
        "packages/shared/tsconfig.json"
        "apps/api/src/db/schema.prisma"
    )

    local configs=()

    for config in "${config_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$config" ]]; then
            local metadata
            metadata=$(get_file_metadata "$PROJECT_ROOT/$config")

            # Agregar validación de configuración
            local is_valid="false"
            case "$config" in
                *.json)
                    if jq . "$PROJECT_ROOT/$config" >/dev/null 2>&1; then
                        is_valid="true"
                    fi
                    ;;
                *.prisma)
                    # Validación básica de Prisma
                    if grep -q "generator\|datasource\|model" "$PROJECT_ROOT/$config"; then
                        is_valid="true"
                    fi
                    ;;
            esac

            # Agregar información de validación al metadata
            metadata=$(echo "$metadata" | jq --arg valid "$is_valid" '. + {config_valid: ($valid == "true")}')
            configs+=("$metadata")
        fi
    done

    # Crear manifiesto completo
    cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "type": "config_manifest",
  "config_files": $(printf '%s\n' "${configs[@]}" | jq -s '.'),
  "total_configs": ${#configs[@]}
}
EOF

    log "Manifiesto de configuración generado: $manifest_file"
}

# Función para generar manifiesto de seguridad
generate_security_manifest() {
    log "Generando manifiesto de seguridad..."

    local manifest_file="$MANIFEST_DIR/security_manifest.json"

    # Recopilar información de seguridad
    local security_info="{}"

    # Verificar permisos de archivos críticos
    local critical_files=(
        "scripts/validate_env.sh"
        "scripts/ai.sh"
        "dry-run-executor.sh"
    )

    local permissions_check="{}"
    for file in "${critical_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            local perms
            perms=$(stat -c%a "$PROJECT_ROOT/$file" 2>/dev/null || echo "unknown")
            permissions_check=$(echo "$permissions_check" | jq --arg file "$file" --arg perms "$perms" '. + {($file): $perms}')
        fi
    done

    # Verificar archivos de auditoría recientes
    local recent_audits
    recent_audits=$(find "$PROJECT_ROOT/audit" -name "*.json" -mtime -7 2>/dev/null | wc -l)

    # Verificar archivos de log recientes
    local recent_logs
    recent_logs=$(find "$PROJECT_ROOT/logs" -name "*.log" -mtime -1 2>/dev/null | wc -l)

    cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "type": "security_manifest",
  "critical_files_permissions": $permissions_check,
  "recent_audit_files": $recent_audits,
  "recent_log_files": $recent_logs,
  "security_features": [
    "dry_run_executor",
    "input_validation",
    "safety_checks",
    "audit_trail",
    "integrity_monitoring",
    "automated_scanning"
  ]
}
EOF

    log "Manifiesto de seguridad generado: $manifest_file"
}

# Función para generar manifiesto maestro
generate_master_manifest() {
    log "Generando manifiesto maestro..."

    local manifest_file="$MANIFEST_DIR/master_manifest.json"

    # Obtener información de todos los manifiestos
    local security_files
    security_files=$(scan_security_files)

    cat > "$manifest_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "type": "master_manifest",
  "version": "1.0",
  "project_root": "$PROJECT_ROOT",
  "generator": "generate-manifests.sh",
  "security_files": $security_files,
  "manifests_generated": [
    "dependencies_manifest.json",
    "config_manifest.json",
    "security_manifest.json"
  ],
  "total_security_files": $(echo "$security_files" | jq length)
}
EOF

    log "Manifiesto maestro generado: $manifest_file"
}

# Función principal
main() {
    log "=== ECONEURA-IA Manifest Generator ==="
    log "Iniciando generación de manifiestos JSON..."

    # Verificar que estemos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR: No se encuentra en el directorio raíz del proyecto"
        exit 1
    fi

    # Generar todos los manifiestos
    generate_dependencies_manifest
    generate_config_manifest
    generate_security_manifest
    generate_master_manifest

    # Crear checksum del directorio de manifiestos
    local checksum_file="$MANIFEST_DIR/manifests_checksum.sha256"
    find "$MANIFEST_DIR" -name "*.json" -type f -exec sha256sum {} \; > "$checksum_file"

    log "Generación de manifiestos completada"
    log "Archivos generados en: $MANIFEST_DIR"
    log "Checksum: $checksum_file"
    log "=== Fin de la generación de manifiestos ==="
}

# Ejecutar función principal
main "$@"