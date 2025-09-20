#!/bin/bash
# scripts/integrity-check.sh
# Verificación semanal de integridad para ECONEURA-IA
# Ejecutado automáticamente por crontab los domingos

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
INTEGRITY_DIR="$PROJECT_ROOT/audit/integrity"
CHECKSUM_FILE="$INTEGRITY_DIR/file_checksums.sha256"

# Crear directorios si no existen
mkdir -p "$LOG_DIR" "$INTEGRITY_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Función para calcular checksums de archivos críticos
calculate_checksums() {
    log "Calculando checksums de archivos críticos..."

    local temp_checksum
    temp_checksum=$(mktemp)

    # Archivos críticos a monitorear
    local critical_files=(
        "package.json"
        "pnpm-lock.yaml"
        "tsconfig.base.json"
        "apps/api/src/db/schema.prisma"
        "scripts/validate_env.sh"
        "scripts/ai.sh"
        "dry-run-executor.sh"
        ".github/copilot-instructions.md"
    )

    for file in "${critical_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            sha256sum "$PROJECT_ROOT/$file" >> "$temp_checksum"
        else
            log "ADVERTENCIA: Archivo crítico no encontrado: $file"
        fi
    done

    # Archivos de configuración
    find "$PROJECT_ROOT" -name "*.config.*" -type f | while read -r config_file; do
        sha256sum "$config_file" >> "$temp_checksum"
    done

    # Scripts de seguridad
    find "$PROJECT_ROOT/scripts" -name "*.sh" -type f | while read -r script_file; do
        sha256sum "$script_file" >> "$temp_checksum"
    done

    mv "$temp_checksum" "$CHECKSUM_FILE"
    log "Checksums calculados y guardados en: $CHECKSUM_FILE"
}

# Función para verificar integridad
verify_integrity() {
    log "Verificando integridad de archivos..."

    local baseline_file="$INTEGRITY_DIR/baseline_checksums.sha256"
    local changes_file="$INTEGRITY_DIR/integrity_changes_$(date +%Y%m%d).txt"
    local temp_changes
    temp_changes=$(mktemp)

    # Si no existe baseline, crear uno
    if [[ ! -f "$baseline_file" ]]; then
        log "Creando baseline de integridad..."
        cp "$CHECKSUM_FILE" "$baseline_file"
        echo "BASELINE_CREATED" > "$temp_changes"
    else
        # Comparar con baseline
        if ! diff -u "$baseline_file" "$CHECKSUM_FILE" > "$temp_changes" 2>/dev/null; then
            log "ADVERTENCIA: Cambios detectados en archivos críticos"
            echo "CHANGES_DETECTED" >> "$temp_changes"
        else
            log "Integridad verificada: No se detectaron cambios"
            echo "NO_CHANGES" > "$temp_changes"
        fi
    fi

    mv "$temp_changes" "$changes_file"
    log "Reporte de cambios guardado en: $changes_file"
}

# Función para verificar archivos de auditoría
check_audit_files() {
    log "Verificando archivos de auditoría..."

    local audit_dir="$PROJECT_ROOT/audit"
    local issues=()

    # Verificar que existan archivos de auditoría recientes
    if [[ -d "$audit_dir" ]]; then
        local recent_audits
        recent_audits=$(find "$audit_dir" -name "*.json" -mtime -7 | wc -l)

        if [[ $recent_audits -eq 0 ]]; then
            issues+=("No se encontraron archivos de auditoría recientes")
        fi

        # Verificar archivos de dry-run
        if ! find "$audit_dir" -name "ai_run_dry_*.json" -mtime -30 | grep -q .; then
            issues+=("No se encontraron ejecuciones de dry-run recientes")
        fi
    else
        issues+=("Directorio de auditoría no encontrado")
    fi

    if [[ ${#issues[@]} -gt 0 ]]; then
        log "Problemas encontrados en auditoría:"
        printf '%s\n' "${issues[@]}" >&2
    fi

    echo "audit_check:" >&3
    echo "  issues: [$(printf '"%s",' "${issues[@]}")]" >&3
}

# Función para verificar backups
check_backups() {
    log "Verificando backups..."

    local backup_dirs=(
        "$PROJECT_ROOT/audit/backups"
        "$LOG_DIR/backups"
    )

    local issues=()

    for backup_dir in "${backup_dirs[@]}"; do
        if [[ ! -d "$backup_dir" ]]; then
            mkdir -p "$backup_dir"
            continue
        fi

        # Verificar backups recientes (últimos 7 días)
        local recent_backups
        recent_backups=$(find "$backup_dir" -mtime -7 | wc -l)

        if [[ $recent_backups -eq 0 ]]; then
            issues+=("No hay backups recientes en $backup_dir")
        fi
    done

    if [[ ${#issues[@]} -gt 0 ]]; then
        log "Problemas con backups:"
        printf '%s\n' "${issues[@]}" >&2
    fi

    echo "backup_check:" >&3
    echo "  issues: [$(printf '"%s",' "${issues[@]}")]" >&3
}

# Función para generar reporte semanal
generate_weekly_report() {
    local report_file="$INTEGRITY_DIR/weekly_integrity_$(date +%Y%m%d).json"
    local temp_report
    temp_report=$(mktemp)

    log "Generando reporte semanal de integridad: $report_file"

    cat > "$temp_report" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_type": "weekly_integrity_check",
  "project_root": "$PROJECT_ROOT",
  "results": {
EOF

    # Ejecutar verificaciones y capturar output en fd 3
    exec 3>> "$temp_report"

    check_audit_files
    check_backups

    exec 3>&-

    # Agregar información de checksums
    cat >> "$temp_report" << EOF
  },
  "checksums_file": "$CHECKSUM_FILE",
  "baseline_file": "$INTEGRITY_DIR/baseline_checksums.sha256"
}
EOF

    # Mover a ubicación final
    mv "$temp_report" "$report_file"
    log "Reporte semanal generado: $report_file"
}

# Función principal
main() {
    log "=== ECONEURA-IA Weekly Integrity Check ==="
    log "Iniciando verificación semanal de integridad..."

    # Verificar que estemos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR: No se encuentra en el directorio raíz del proyecto"
        exit 1
    fi

    # Calcular checksums actuales
    calculate_checksums

    # Verificar integridad
    verify_integrity

    # Generar reporte semanal
    generate_weekly_report

    log "Verificación semanal de integridad completada"
    log "=== Fin de la verificación semanal ==="
}

# Ejecutar función principal
main "$@"