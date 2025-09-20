#!/bin/bash
# scripts/crontab-setup.sh
# Configuración de automatización de crontab para ECONEURA-IA Security System
# Este script configura escaneos automáticos programados para monitoreo continuo

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
CRONTAB_BACKUP="$LOG_DIR/crontab_backup_$(date +%Y%m%d_%H%M%S).txt"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_DIR/crontab-setup.log"
}

# Función para validar permisos
check_permissions() {
    if ! crontab -l >/dev/null 2>&1; then
        log "ERROR: No se puede acceder a crontab. Verificar permisos."
        exit 1
    fi
}

# Función para backup del crontab actual
backup_crontab() {
    log "Creando backup del crontab actual..."
    if crontab -l > "$CRONTAB_BACKUP" 2>/dev/null; then
        log "Backup creado: $CRONTAB_BACKUP"
    else
        log "No hay crontab existente o error al crear backup"
        touch "$CRONTAB_BACKUP"
    fi
}

# Función para agregar jobs de seguridad al crontab
add_security_jobs() {
    local temp_crontab
    temp_crontab=$(mktemp)

    # Obtener crontab actual
    crontab -l > "$temp_crontab" 2>/dev/null || true

    # Verificar si ya existen jobs de ECONEURA
    if grep -q "ECONEURA-SECURITY" "$temp_crontab"; then
        log "ADVERTENCIA: Ya existen jobs de ECONEURA en el crontab. Saltando configuración."
        rm -f "$temp_crontab"
        return 0
    fi

    # Agregar jobs de seguridad
    cat >> "$temp_crontab" << 'EOF'

# ECONEURA-SECURITY: Automated Security Monitoring Jobs
# Generado por crontab-setup.sh el $(date)

# Escaneo diario de seguridad a las 2:00 AM
0 2 * * * cd /workspaces/ECONEURA-IA && bash scripts/security-scan-daily.sh >> logs/security-daily.log 2>&1

# Verificación de integridad semanal los domingos a las 3:00 AM
0 3 * * 0 cd /workspaces/ECONEURA-IA && bash scripts/integrity-check.sh >> logs/integrity-weekly.log 2>&1

# Monitoreo de cambios en archivos críticos cada 4 horas
0 */4 * * * cd /workspaces/ECONEURA-IA && bash scripts/monitor-critical-files.sh >> logs/monitor-critical.log 2>&1

# Limpieza de logs antiguos mensual (primer día del mes a las 4:00 AM)
0 4 1 * * cd /workspaces/ECONEURA-IA && bash scripts/cleanup-logs.sh >> logs/cleanup-monthly.log 2>&1

# Verificación de dependencias semanales (miércoles a las 1:00 AM)
0 1 * * 3 cd /workspaces/ECONEURA-IA && bash scripts/check-dependencies.sh >> logs/dependencies-weekly.log 2>&1
EOF

    # Instalar nuevo crontab
    if crontab "$temp_crontab"; then
        log "Jobs de seguridad agregados exitosamente al crontab"
        log "Jobs configurados:"
        log "  - Escaneo diario: 2:00 AM"
        log "  - Verificación de integridad: Domingos 3:00 AM"
        log "  - Monitoreo de archivos críticos: Cada 4 horas"
        log "  - Limpieza de logs: Mensual 4:00 AM"
        log "  - Verificación de dependencias: Miércoles 1:00 AM"
    else
        log "ERROR: No se pudo instalar el nuevo crontab"
        rm -f "$temp_crontab"
        exit 1
    fi

    rm -f "$temp_crontab"
}

# Función para mostrar estado de jobs
show_status() {
    log "Estado actual de jobs de ECONEURA en crontab:"
    if crontab -l | grep -q "ECONEURA-SECURITY"; then
        crontab -l | grep "ECONEURA-SECURITY" -A 10
    else
        log "No se encontraron jobs de ECONEURA"
    fi
}

# Función para remover jobs de seguridad
remove_security_jobs() {
    local temp_crontab
    temp_crontab=$(mktemp)

    log "Removiendo jobs de seguridad de ECONEURA..."

    # Filtrar jobs que no sean de ECONEURA
    crontab -l 2>/dev/null | grep -v "ECONEURA-SECURITY" > "$temp_crontab" || true

    if crontab "$temp_crontab"; then
        log "Jobs de seguridad removidos exitosamente"
    else
        log "ERROR: No se pudieron remover los jobs"
        rm -f "$temp_crontab"
        exit 1
    fi

    rm -f "$temp_crontab"
}

# Función principal
main() {
    local action="${1:-add}"

    log "=== ECONEURA-IA Crontab Setup ==="
    log "Acción: $action"

    check_permissions
    backup_crontab

    case "$action" in
        "add")
            add_security_jobs
            show_status
            ;;
        "remove")
            remove_security_jobs
            ;;
        "status")
            show_status
            ;;
        *)
            log "Uso: $0 {add|remove|status}"
            log "  add    - Agregar jobs de seguridad (default)"
            log "  remove - Remover jobs de seguridad"
            log "  status - Mostrar estado de jobs"
            exit 1
            ;;
    esac

    log "=== Configuración completada ==="
}

# Ejecutar función principal
main "$@"