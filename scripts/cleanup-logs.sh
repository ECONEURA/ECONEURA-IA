#!/bin/bash
# scripts/cleanup-logs.sh
# Limpieza mensual de logs antiguos para ECONEURA-IA
# Ejecutado automáticamente por crontab el primer día del mes

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
AUDIT_DIR="$PROJECT_ROOT/audit"
BACKUP_DIR="$LOG_DIR/backups"

# Configuración de retención (en días)
LOG_RETENTION_DAYS=90
AUDIT_RETENTION_DAYS=180
BACKUP_RETENTION_DAYS=365

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Función para crear backup antes de limpieza
create_backup() {
    local backup_file="$BACKUP_DIR/logs_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    local temp_backup
    temp_backup=$(mktemp -d)

    log "Creando backup de logs antes de limpieza..."

    # Copiar estructura de directorios
    if [[ -d "$LOG_DIR" ]]; then
        cp -r "$LOG_DIR" "$temp_backup/"
    fi

    if [[ -d "$AUDIT_DIR" ]]; then
        mkdir -p "$temp_backup/audit"
        cp -r "$AUDIT_DIR"/* "$temp_backup/audit/" 2>/dev/null || true
    fi

    # Crear archivo tar.gz
    if tar -czf "$backup_file" -C "$temp_backup" .; then
        log "Backup creado exitosamente: $backup_file"
        echo "$backup_file"
    else
        log "ERROR: No se pudo crear el backup"
        rm -rf "$temp_backup"
        return 1
    fi

    # Limpiar directorio temporal
    rm -rf "$temp_backup"
}

# Función para limpiar logs antiguos
cleanup_old_logs() {
    local retention_days="$1"
    local target_dir="$2"
    local log_type="$3"

    log "Limpiando $log_type antiguos (retención: $retention_days días)..."

    if [[ ! -d "$target_dir" ]]; then
        log "Directorio $target_dir no existe, saltando..."
        return 0
    fi

    local files_deleted=0
    local space_reclaimed=0

    # Encontrar y eliminar archivos antiguos
    while IFS= read -r -d '' file; do
        local file_size
        file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)

        if rm -f "$file"; then
            ((files_deleted++))
            ((space_reclaimed += file_size))
            log "Eliminado: $file"
        fi
    done < <(find "$target_dir" -type f -mtime +"$retention_days" -print0)

    # Limpiar directorios vacíos
    find "$target_dir" -type d -empty -delete 2>/dev/null || true

    log "$log_type: $files_deleted archivos eliminados, $(($space_reclaimed / 1024)) KB liberados"

    echo "cleanup_${log_type}:" >&3
    echo "  files_deleted: $files_deleted" >&3
    echo "  space_reclaimed_kb: $(($space_reclaimed / 1024))" >&3
}

# Función para limpiar backups antiguos
cleanup_old_backups() {
    log "Limpiando backups antiguos (retención: $BACKUP_RETENTION_DAYS días)..."

    local backups_deleted=0
    local space_reclaimed=0

    while IFS= read -r -d '' backup; do
        local backup_size
        backup_size=$(stat -f%z "$backup" 2>/dev/null || stat -c%s "$backup" 2>/dev/null || echo 0)

        if rm -f "$backup"; then
            ((backups_deleted++))
            ((space_reclaimed += backup_size))
            log "Backup eliminado: $backup"
        fi
    done < <(find "$BACKUP_DIR" -name "*.tar.gz" -mtime +"$BACKUP_RETENTION_DAYS" -print0)

    log "Backups: $backups_deleted archivos eliminados, $(($space_reclaimed / 1024 / 1024)) MB liberados"

    echo "cleanup_backups:" >&3
    echo "  backups_deleted: $backups_deleted" >&3
    echo "  space_reclaimed_mb: $(($space_reclaimed / 1024 / 1024))" >&3
}

# Función para verificar espacio en disco
check_disk_space() {
    log "Verificando espacio en disco..."

    local disk_usage
    disk_usage=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | sed 's/%//')

    if [[ $disk_usage -gt 90 ]]; then
        log "ALERTA: Uso de disco alto ($disk_usage%)"
        echo "disk_alert: high_usage" >&3
    elif [[ $disk_usage -gt 75 ]]; then
        log "ADVERTENCIA: Uso de disco moderado ($disk_usage%)"
        echo "disk_warning: moderate_usage" >&3
    else
        log "Uso de disco normal ($disk_usage%)"
        echo "disk_status: normal" >&3
    fi

    echo "disk_usage_percent: $disk_usage" >&3
}

# Función para comprimir logs grandes
compress_large_logs() {
    log "Comprimiendo logs grandes..."

    local compressed=0

    # Encontrar logs mayores a 10MB y comprimirlos
    while IFS= read -r -d '' log_file; do
        local compressed_file="${log_file}.gz"

        if [[ ! -f "$compressed_file" ]]; then
            if gzip -c "$log_file" > "$compressed_file" && rm "$log_file"; then
                log "Comprimido: $log_file -> $compressed_file"
                ((compressed++))
            fi
        fi
    done < <(find "$LOG_DIR" -name "*.log" -size +10M -print0)

    log "Logs comprimidos: $compressed"

    echo "logs_compressed: $compressed" >&3
}

# Función para generar reporte de limpieza
generate_cleanup_report() {
    local backup_file="$1"
    local report_file="$LOG_DIR/cleanup_report_$(date +%Y%m%d).json"
    local temp_report
    temp_report=$(mktemp)

    log "Generando reporte de limpieza: $report_file"

    cat > "$temp_report" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "cleanup_type": "monthly_log_cleanup",
  "project_root": "$PROJECT_ROOT",
  "backup_created": "$backup_file",
  "retention_policies": {
    "logs_days": $LOG_RETENTION_DAYS,
    "audit_days": $AUDIT_RETENTION_DAYS,
    "backups_days": $BACKUP_RETENTION_DAYS
  },
  "results": {
EOF

    # Ejecutar operaciones de limpieza y capturar output en fd 3
    exec 3>> "$temp_report"

    cleanup_old_logs "$LOG_RETENTION_DAYS" "$LOG_DIR" "logs"
    cleanup_old_logs "$AUDIT_RETENTION_DAYS" "$AUDIT_DIR" "audit_files"
    cleanup_old_backups
    check_disk_space
    compress_large_logs

    exec 3>&-

    cat >> "$temp_report" << EOF
  }
}
EOF

    mv "$temp_report" "$report_file"
    log "Reporte de limpieza generado: $report_file"
}

# Función principal
main() {
    log "=== ECONEURA-IA Monthly Log Cleanup ==="
    log "Iniciando limpieza mensual de logs..."

    # Verificar que estemos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR: No se encuentra en el directorio raíz del proyecto"
        exit 1
    fi

    # Crear backup antes de limpiar
    local backup_file
    if backup_file=$(create_backup); then
        log "Backup creado: $backup_file"
    else
        log "ERROR: No se pudo crear backup, abortando limpieza"
        exit 1
    fi

    # Generar reporte de limpieza
    generate_cleanup_report "$backup_file"

    log "Limpieza mensual de logs completada"
    log "=== Fin de la limpieza mensual ==="
}

# Ejecutar función principal
main "$@"
