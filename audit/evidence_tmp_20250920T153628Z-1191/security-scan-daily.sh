#!/bin/bash
# scripts/security-scan-daily.sh
# Escaneo diario de seguridad para ECONEURA-IA
# Ejecutado automáticamente por crontab

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
SCAN_DIR="$PROJECT_ROOT/audit/daily-scans"

# Crear directorios si no existen
mkdir -p "$LOG_DIR" "$SCAN_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Función para verificar archivos críticos
check_critical_files() {
    log "Verificando archivos críticos..."

    local critical_files=(
        "package.json"
        "pnpm-lock.yaml"
        "tsconfig.base.json"
        "apps/api/src/db/schema.prisma"
        "scripts/validate_env.sh"
        "scripts/ai.sh"
    )

    local missing_files=()
    local modified_files=()

    for file in "${critical_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
            missing_files+=("$file")
        else
            # Verificar si el archivo fue modificado en las últimas 24 horas
            if [[ "$PROJECT_ROOT/$file" -nt "$SCAN_DIR/last_scan" ]] 2>/dev/null; then
                modified_files+=("$file")
            fi
        fi
    done

    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log "ADVERTENCIA: Archivos críticos faltantes: ${missing_files[*]}"
    fi

    if [[ ${#modified_files[@]} -gt 0 ]]; then
        log "Archivos modificados recientemente: ${modified_files[*]}"
    fi

    # Reportar hallazgos
    echo "critical_files_check:" >&3
    echo "  missing: [$(printf '"%s",' "${missing_files[@]}")]" >&3
    echo "  modified: [$(printf '"%s",' "${modified_files[@]}")]" >&3
}

# Función para verificar permisos de archivos
check_file_permissions() {
    log "Verificando permisos de archivos..."

    local issues=()

    # Verificar que scripts sean ejecutables
    while IFS= read -r -d '' script; do
        if [[ ! -x "$script" ]]; then
            issues+=("Script no ejecutable: $script")
        fi
    done < <(find "$PROJECT_ROOT/scripts" -name "*.sh" -print0)

    # Verificar archivos sensibles no sean world-writable
    while IFS= read -r -d '' file; do
        if [[ -w "$file" && $(stat -c %a "$file" 2>/dev/null | cut -c3) -gt 0 ]]; then
            issues+=("Archivo world-writable: $file")
        fi
    done < <(find "$PROJECT_ROOT" -name "*.key" -o -name "*.pem" -o -name "*secret*" -print0)

    if [[ ${#issues[@]} -gt 0 ]]; then
        log "Problemas de permisos encontrados:"
        printf '%s\n' "${issues[@]}" >&2
    fi

    echo "permissions_check:" >&3
    echo "  issues: [$(printf '"%s",' "${issues[@]}")]" >&3
}

# Función para verificar integridad de dependencias
check_dependencies() {
    log "Verificando integridad de dependencias..."

    if [[ -f "$PROJECT_ROOT/pnpm-lock.yaml" ]]; then
        if ! pnpm list --depth=0 >/dev/null 2>&1; then
            log "ADVERTENCIA: Problemas con dependencias de pnpm"
            echo "dependencies_check: FAILED" >&3
        else
            log "Dependencias verificadas correctamente"
            echo "dependencies_check: OK" >&3
        fi
    else
        log "ADVERTENCIA: pnpm-lock.yaml no encontrado"
        echo "dependencies_check: MISSING_LOCKFILE" >&3
    fi
}

# Función para verificar logs de seguridad
check_security_logs() {
    log "Verificando logs de seguridad..."

    local recent_alerts=0

    # Contar alertas recientes en logs
    if [[ -d "$LOG_DIR" ]]; then
        recent_alerts=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -l "ERROR\|WARNING\|ALERT" {} \; | wc -l)
    fi

    log "Alertas recientes en logs: $recent_alerts"

    echo "security_logs_check:" >&3
    echo "  recent_alerts: $recent_alerts" >&3
}

# Función para generar reporte diario
generate_daily_report() {
    local report_file="$SCAN_DIR/daily_scan_$(date +%Y%m%d).json"
    local temp_report
    temp_report=$(mktemp)

    log "Generando reporte diario: $report_file"

    cat > "$temp_report" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "scan_type": "daily_security_scan",
  "project_root": "$PROJECT_ROOT",
  "results": {
EOF

    # Ejecutar verificaciones y capturar output en fd 3
    exec 3>> "$temp_report"

    check_critical_files
    check_file_permissions
    check_dependencies
    check_security_logs

    exec 3>&-

    # Cerrar JSON
    echo "  }" >> "$temp_report"
    echo "}" >> "$temp_report"

    # Mover a ubicación final
    mv "$temp_report" "$report_file"
    log "Reporte generado: $report_file"
}

# Función principal
main() {
    log "=== ECONEURA-IA Daily Security Scan ==="
    log "Iniciando escaneo diario de seguridad..."

    # Verificar que estemos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR: No se encuentra en el directorio raíz del proyecto"
        exit 1
    fi

    # Crear marca de último escaneo
    touch "$SCAN_DIR/last_scan"

    # Ejecutar verificaciones
    generate_daily_report

    log "Escaneo diario completado exitosamente"
    log "=== Fin del escaneo diario ==="
}

# Ejecutar función principal
main "$@"