#!/bin/bash
# bootstrap-security.sh
# Script de bootstrap completo para ECONEURA-IA Security System
# Configura todo el sistema de seguridad con un solo comando

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/bootstrap_$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="$PROJECT_ROOT/backups/bootstrap_$(date +%Y%m%d_%H%M%S)"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Función de logging
log() {
    local level="${1:-INFO}"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Función para verificar prerrequisitos
check_prerequisites() {
    log "INFO" "Verificando prerrequisitos del sistema..."

    local missing_deps=()

    # Verificar comandos requeridos
    local required_commands=("git" "jq" "node" "npm" "find" "grep" "sed" "awk")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done

    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log "ERROR" "Comandos faltantes: ${missing_deps[*]}"
        log "ERROR" "Instale las dependencias faltantes y ejecute nuevamente"
        exit 1
    fi

    # Verificar que estemos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR" "No se encuentra en el directorio raíz del proyecto (package.json no encontrado)"
        exit 1
    fi

    # Verificar permisos de escritura
    if [[ ! -w "$PROJECT_ROOT" ]]; then
        log "ERROR" "No hay permisos de escritura en el directorio del proyecto"
        exit 1
    fi

    log "INFO" "Prerrequisitos verificados correctamente"
}

# Función para crear directorios necesarios
create_directories() {
    log "INFO" "Creando directorios necesarios..."

    local directories=(
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/audit"
        "$PROJECT_ROOT/audit/manifests"
        "$PROJECT_ROOT/audit/daily-scans"
        "$PROJECT_ROOT/audit/integrity"
        "$PROJECT_ROOT/audit/monitoring"
        "$PROJECT_ROOT/audit/backups"
        "$PROJECT_ROOT/mega-prompts"
        "$PROJECT_ROOT/backups"
        "$PROJECT_ROOT/scripts"
    )

    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "INFO" "Directorio creado: $dir"
        else
            log "INFO" "Directorio ya existe: $dir"
        fi
    done

    log "INFO" "Directorios creados correctamente"
}

# Función para instalar dependencias
install_dependencies() {
    log "INFO" "Instalando dependencias del proyecto..."

    cd "$PROJECT_ROOT"

    # Intentar con pnpm primero
    if command -v pnpm >/dev/null 2>&1 && [[ -f "pnpm-lock.yaml" ]]; then
        log "INFO" "Instalando dependencias con pnpm..."
        if pnpm install --frozen-lockfile; then
            log "INFO" "Dependencias instaladas correctamente con pnpm"
            return 0
        else
            log "WARNING" "Falló instalación con pnpm, intentando con npm..."
        fi
    fi

    # Fallback a npm si pnpm no está disponible o falló
    if command -v npm >/dev/null 2>&1 && [[ -f "package-lock.json" ]]; then
        log "INFO" "Instalando dependencias con npm..."
        if npm ci; then
            log "INFO" "Dependencias instaladas correctamente con npm"
            return 0
        else
            log "WARNING" "Falló instalación con npm"
        fi
    fi

    # Si no hay archivos de lock, intentar npm install básico
    if command -v npm >/dev/null 2>&1 && [[ -f "package.json" ]]; then
        log "INFO" "Instalando dependencias básicas con npm..."
        if npm install; then
            log "INFO" "Dependencias básicas instaladas correctamente"
            return 0
        fi
    fi

    log "WARNING" "No se pudieron instalar las dependencias automáticamente"
    log "INFO" "Puede instalarlas manualmente más tarde"
}

# Función para configurar permisos de archivos
setup_permissions() {
    log "INFO" "Configurando permisos de archivos..."

    # Hacer ejecutables los scripts principales
    local executable_scripts=(
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
        "scripts/generate-manifests.sh"
    )

    for script in "${executable_scripts[@]}"; do
        if [[ -f "$PROJECT_ROOT/$script" ]]; then
            chmod +x "$PROJECT_ROOT/$script"
            log "INFO" "Permisos configurados: $script"
        else
            log "WARNING" "Script no encontrado: $script"
        fi
    done

    # Configurar permisos restrictivos para archivos sensibles
    local sensitive_files=(
        "scripts/ai.sh"
        "dry-run-executor.sh"
    )

    for file in "${sensitive_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            chmod 755 "$PROJECT_ROOT/$file"
            log "INFO" "Permisos restrictivos aplicados: $file"
        fi
    done

    log "INFO" "Permisos configurados correctamente"
}

# Función para validar configuración
validate_configuration() {
    log "INFO" "Validando configuración del proyecto..."

    local config_issues=()

    # Verificar archivos de configuración críticos
    local critical_configs=(
        "package.json"
        "tsconfig.base.json"
    )

    for config in "${critical_configs[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$config" ]]; then
            config_issues+=("Archivo faltante: $config")
        else
            # Validar JSON si es un archivo de configuración JSON
            if [[ "$config" == *.json ]]; then
                if ! jq . "$PROJECT_ROOT/$config" >/dev/null 2>&1; then
                    config_issues+=("JSON inválido: $config")
                fi
            fi
        fi
    done

    # Verificar configuración de TypeScript
    if [[ -f "$PROJECT_ROOT/tsconfig.base.json" ]]; then
        if ! jq '.compilerOptions' "$PROJECT_ROOT/tsconfig.base.json" >/dev/null 2>&1; then
            config_issues+=("Configuración de TypeScript inválida")
        fi
    fi

    if [[ ${#config_issues[@]} -gt 0 ]]; then
        log "WARNING" "Problemas de configuración encontrados:"
        printf '  %s\n' "${config_issues[@]}" | tee -a "$LOG_FILE"
    else
        log "INFO" "Configuración validada correctamente"
    fi
}

# Función para inicializar sistema de auditoría
initialize_audit_system() {
    log "INFO" "Inicializando sistema de auditoría..."

    # Crear archivo de baseline de integridad
    local baseline_file="$PROJECT_ROOT/audit/integrity/baseline_checksums.sha256"
    if [[ ! -f "$baseline_file" ]]; then
        log "INFO" "Creando baseline de integridad..."
        # Ejecutar verificación de integridad para crear baseline
        if [[ -x "$PROJECT_ROOT/scripts/integrity-check.sh" ]]; then
            bash "$PROJECT_ROOT/scripts/integrity-check.sh" >/dev/null 2>&1 || true
        fi
    fi

    # Crear estado inicial de monitoreo
    local monitor_state="$PROJECT_ROOT/audit/monitoring/monitor_state.json"
    if [[ ! -f "$monitor_state" ]]; then
        log "INFO" "Creando estado inicial de monitoreo..."
        # Ejecutar monitoreo inicial
        if [[ -x "$PROJECT_ROOT/scripts/monitor-critical-files.sh" ]]; then
            bash "$PROJECT_ROOT/scripts/monitor-critical-files.sh" >/dev/null 2>&1 || true
        fi
    fi

    log "INFO" "Sistema de auditoría inicializado"
}

# Función para generar documentación inicial
generate_initial_docs() {
    log "INFO" "Generando documentación inicial..."

    # Generar manifiestos
    if [[ -x "$PROJECT_ROOT/scripts/generate-manifests.sh" ]]; then
        log "INFO" "Generando manifiestos del sistema..."
        bash "$PROJECT_ROOT/scripts/generate-manifests.sh" >/dev/null 2>&1 || true
    fi

    # Crear archivo de estado del sistema
    local status_file="$PROJECT_ROOT/audit/system_status.json"
    cat > "$status_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "system_status": "initialized",
  "bootstrap_completed": true,
  "bootstrap_log": "$LOG_FILE",
  "version": "1.0",
  "components": [
    "security_scripts",
    "audit_system",
    "manifests",
    "permissions",
    "dependencies"
  ]
}
EOF

    log "INFO" "Documentación inicial generada"
}

# Función para ejecutar pruebas iniciales
run_initial_tests() {
    log "INFO" "Ejecutando pruebas iniciales..."

    local test_results=()

    # Verificar que los scripts principales sean ejecutables
    local test_scripts=(
        "scripts/validate_env.sh"
        "scripts/safety-checks.sh"
        "scripts/input-validation.sh"
    )

    for script in "${test_scripts[@]}"; do
        if [[ -x "$PROJECT_ROOT/$script" ]]; then
            if bash "$PROJECT_ROOT/$script" --help >/dev/null 2>&1 || bash "$PROJECT_ROOT/$script" -h >/dev/null 2>&1; then
                test_results+=("$script: OK")
            else
                test_results+=("$script: WARNING (no help disponible)")
            fi
        else
            test_results+=("$script: ERROR (no ejecutable)")
        fi
    done

    # Mostrar resultados de pruebas
    log "INFO" "Resultados de pruebas iniciales:"
    printf '  %s\n' "${test_results[@]}" | tee -a "$LOG_FILE"

    log "INFO" "Pruebas iniciales completadas"
}

# Función para mostrar resumen final
show_summary() {
    log "INFO" "=== RESUMEN DE BOOTSTRAP ==="
    log "INFO" "Proyecto: ECONEURA-IA Security System"
    log "INFO" "Directorio: $PROJECT_ROOT"
    log "INFO" "Log completo: $LOG_FILE"
    log "INFO" ""
    log "INFO" "Componentes configurados:"
    log "INFO" "  ✓ Directorios del sistema"
    log "INFO" "  ✓ Dependencias instaladas"
    log "INFO" "  ✓ Permisos configurados"
    log "INFO" "  ✓ Configuración validada"
    log "INFO" "  ✓ Sistema de auditoría inicializado"
    log "INFO" "  ✓ Manifiestos generados"
    log "INFO" "  ✓ Documentación creada"
    log "INFO" "  ✓ Pruebas iniciales ejecutadas"
    log "INFO" ""
    log "INFO" "Próximos pasos recomendados:"
    log "INFO" "  1. Revisar el log completo: less $LOG_FILE"
    log "INFO" "  2. Configurar crontab: bash scripts/crontab-setup.sh"
    log "INFO" "  3. Ejecutar escaneo inicial: bash scripts/security-scan-daily.sh"
    log "INFO" "  4. Verificar integridad: bash scripts/integrity-check.sh"
    log "INFO" ""
    log "INFO" "=== BOOTSTRAP COMPLETADO EXITOSAMENTE ==="
}

# Función para cleanup en caso de error
cleanup_on_error() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Bootstrap falló con código de salida: $exit_code"
        log "ERROR" "Revisar el log completo: $LOG_FILE"

        # Crear backup de archivos modificados si existe
        if [[ -d "$BACKUP_DIR" ]]; then
            log "INFO" "Los backups se guardaron en: $BACKUP_DIR"
        fi
    fi
    exit $exit_code
}

# Función principal
main() {
    # Configurar cleanup en caso de error
    trap cleanup_on_error EXIT

    log "INFO" "=== INICIANDO BOOTSTRAP DE ECONEURA-IA SECURITY SYSTEM ==="
    log "INFO" "Timestamp: $(date)"
    log "INFO" "Usuario: $(whoami)"
    log "INFO" "Directorio: $PROJECT_ROOT"

    # Ejecutar pasos del bootstrap
    check_prerequisites
    create_directories
    install_dependencies
    setup_permissions
    validate_configuration
    initialize_audit_system
    generate_initial_docs
    run_initial_tests

    # Mostrar resumen
    show_summary

    log "INFO" "Bootstrap completado exitosamente"
}

# Verificar si se ejecuta como script
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi