#!/bin/bash
# scripts/monitor-critical-files.sh
# Monitoreo continuo de archivos críticos para ECONEURA-IA
# Ejecutado automáticamente por crontab cada 4 horas

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
MONITOR_DIR="$PROJECT_ROOT/audit/monitoring"
STATE_FILE="$MONITOR_DIR/monitor_state.json"

# Crear directorios si no existen
mkdir -p "$LOG_DIR" "$MONITOR_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Función para definir archivos críticos a monitorear
get_critical_files() {
    cat << 'EOF'
package.json
pnpm-lock.yaml
tsconfig.base.json
apps/api/src/db/schema.prisma
scripts/validate_env.sh
scripts/ai.sh
dry-run-executor.sh
.github/copilot-instructions.md
README.md
README.dev.md
EOF
}

# Función para calcular hash de archivo
calculate_file_hash() {
    local file="$1"
    if [[ -f "$file" ]]; then
        sha256sum "$file" | cut -d' ' -f1
    else
        echo "FILE_NOT_FOUND"
    fi
}

# Función para obtener tamaño de archivo
get_file_size() {
    local file="$1"
    if [[ -f "$file" ]]; then
        stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Función para obtener fecha de modificación
get_file_mtime() {
    local file="$1"
    if [[ -f "$file" ]]; then
        stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || date -r "$file" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "UNKNOWN"
    else
        echo "FILE_NOT_FOUND"
    fi
}

# Función para cargar estado anterior
load_previous_state() {
    if [[ -f "$STATE_FILE" ]]; then
        cat "$STATE_FILE"
    else
        echo "{}"
    fi
}

# Función para guardar estado actual
save_current_state() {
    local temp_state
    temp_state=$(mktemp)

    cat > "$temp_state" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "files": {
EOF

    local first=true
    while IFS= read -r file; do
        if [[ -z "$file" ]]; then continue; fi

        local full_path="$PROJECT_ROOT/$file"
        local hash
        local size
        local mtime

        hash=$(calculate_file_hash "$full_path")
        size=$(get_file_size "$full_path")
        mtime=$(get_file_mtime "$full_path")

        if [[ $first == true ]]; then
            first=false
        else
            echo "," >> "$temp_state"
        fi

        cat >> "$temp_state" << EOF
    "$file": {
      "hash": "$hash",
      "size": "$size",
      "mtime": "$mtime"
    }
EOF
    done < <(get_critical_files)

    cat >> "$temp_state" << EOF
  }
}
EOF

    mv "$temp_state" "$STATE_FILE"
}

# Función para detectar cambios
detect_changes() {
    local previous_state
    local current_state
    local changes_file="$MONITOR_DIR/changes_$(date +%Y%m%d_%H%M%S).json"

    previous_state=$(load_previous_state)
    current_state=$(jq . "$STATE_FILE" 2>/dev/null || echo "{}")

    local temp_changes
    temp_changes=$(mktemp)

    cat > "$temp_changes" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "changes": {
EOF

    local changes_found=false
    local first=true

    while IFS= read -r file; do
        if [[ -z "$file" ]]; then continue; fi

        local prev_hash
        local curr_hash
        local prev_size
        local curr_size
        local prev_mtime
        local curr_mtime

        prev_hash=$(echo "$previous_state" | jq -r ".files.\"$file\".hash" 2>/dev/null || echo "")
        curr_hash=$(echo "$current_state" | jq -r ".files.\"$file\".hash" 2>/dev/null || echo "")

        prev_size=$(echo "$previous_state" | jq -r ".files.\"$file\".size" 2>/dev/null || echo "")
        curr_size=$(echo "$current_state" | jq -r ".files.\"$file\".size" 2>/dev/null || echo "")

        prev_mtime=$(echo "$previous_state" | jq -r ".files.\"$file\".mtime" 2>/dev/null || echo "")
        curr_mtime=$(echo "$current_state" | jq -r ".files.\"$file\".mtime" 2>/dev/null || echo "")

        local file_changed=false
        local change_type=""

        if [[ "$prev_hash" != "$curr_hash" && "$curr_hash" != "FILE_NOT_FOUND" ]]; then
            file_changed=true
            change_type="modified"
        elif [[ "$curr_hash" == "FILE_NOT_FOUND" && -n "$prev_hash" ]]; then
            file_changed=true
            change_type="deleted"
        elif [[ "$curr_hash" != "FILE_NOT_FOUND" && -z "$prev_hash" ]]; then
            file_changed=true
            change_type="created"
        fi

        if [[ $file_changed == true ]]; then
            if [[ $changes_found == true ]]; then
                echo "," >> "$temp_changes"
            fi
            changes_found=true

            cat >> "$temp_changes" << EOF
    "$file": {
      "change_type": "$change_type",
      "previous_hash": "$prev_hash",
      "current_hash": "$curr_hash",
      "previous_size": "$prev_size",
      "current_size": "$curr_size",
      "previous_mtime": "$prev_mtime",
      "current_mtime": "$curr_mtime"
    }
EOF
        fi
    done < <(get_critical_files)

    cat >> "$temp_changes" << EOF
  }
}
EOF

    mv "$temp_changes" "$changes_file"

    if [[ $changes_found == true ]]; then
        log "ALERTA: Cambios detectados en archivos críticos"
        log "Detalle de cambios: $changes_file"

        # Mostrar resumen de cambios
        echo "$current_state" | jq -r '.changes | keys[]' | while read -r changed_file; do
            local change_type
            change_type=$(echo "$current_state" | jq -r ".changes.\"$changed_file\".change_type")
            log "  $change_type: $changed_file"
        done
    else
        log "No se detectaron cambios en archivos críticos"
    fi

    echo "$changes_file"
}

# Función para verificar permisos de archivos críticos
check_critical_permissions() {
    log "Verificando permisos de archivos críticos..."

    local issues=()

    while IFS= read -r file; do
        if [[ -z "$file" ]]; then continue; fi

        local full_path="$PROJECT_ROOT/$file"

        if [[ -f "$full_path" ]]; then
            # Verificar permisos (no world-writable para archivos sensibles)
            local perms
            perms=$(stat -c %a "$full_path" 2>/dev/null || echo "")

            if [[ -n "$perms" && ${perms:2:1} -gt 0 ]]; then
                issues+=("$file es world-writable (permisos: $perms)")
            fi
        fi
    done < <(get_critical_files)

    if [[ ${#issues[@]} -gt 0 ]]; then
        log "Problemas de permisos encontrados:"
        printf '  %s\n' "${issues[@]}" >&2
    fi

    echo "permissions_issues: [$(printf '"%s",' "${issues[@]}")]" >&3
}

# Función para generar reporte de monitoreo
generate_monitor_report() {
    local changes_file="$1"
    local report_file="$MONITOR_DIR/monitor_report_$(date +%Y%m%d_%H%M%S).json"
    local temp_report
    temp_report=$(mktemp)

    log "Generando reporte de monitoreo: $report_file"

    cat > "$temp_report" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_type": "critical_files_monitoring",
  "project_root": "$PROJECT_ROOT",
  "changes_file": "$changes_file",
  "results": {
EOF

    # Ejecutar verificación de permisos y capturar output en fd 3
    exec 3>> "$temp_report"

    check_critical_permissions

    exec 3>&-

    cat >> "$temp_report" << EOF
  },
  "state_file": "$STATE_FILE"
}
EOF

    mv "$temp_report" "$report_file"
    log "Reporte de monitoreo generado: $report_file"
}

# Función principal
main() {
    log "=== ECONEURA-IA Critical Files Monitor ==="
    log "Iniciando monitoreo de archivos críticos..."

    # Verificar que estemos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR: No se encuentra en el directorio raíz del proyecto"
        exit 1
    fi

    # Guardar estado actual
    save_current_state

    # Detectar cambios
    local changes_file
    changes_file=$(detect_changes)

    # Generar reporte
    generate_monitor_report "$changes_file"

    log "Monitoreo de archivos críticos completado"
    log "=== Fin del monitoreo ==="
}

# Ejecutar función principal
main "$@"
