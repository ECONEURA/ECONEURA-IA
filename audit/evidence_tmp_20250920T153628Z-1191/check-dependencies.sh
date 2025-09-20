#!/bin/bash
# scripts/check-dependencies.sh
# Verificación semanal de dependencias para ECONEURA-IA
# Ejecutado automáticamente por crontab los miércoles

set -euo pipefail

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
DEPS_DIR="$PROJECT_ROOT/audit/dependencies"

# Crear directorios si no existen
mkdir -p "$LOG_DIR" "$DEPS_DIR"

# Función de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

# Función para verificar dependencias de Node.js/pnpm
check_nodejs_dependencies() {
    log "Verificando dependencias de Node.js/pnpm..."

    local issues=()

    # Verificar que existe package.json
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        issues+=("package.json no encontrado")
        echo "nodejs_check: MISSING_PACKAGE_JSON" >&3
        return 1
    fi

    # Verificar que existe pnpm-lock.yaml
    if [[ ! -f "$PROJECT_ROOT/pnpm-lock.yaml" ]]; then
        issues+=("pnpm-lock.yaml no encontrado")
        echo "nodejs_check: MISSING_LOCKFILE" >&3
    fi

    # Verificar instalación de pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        issues+=("pnpm no está instalado")
        echo "nodejs_check: PNPM_NOT_INSTALLED" >&3
        return 1
    fi

    # Verificar que las dependencias estén instaladas
    if ! pnpm list --depth=0 >/dev/null 2>&1; then
        issues+=("Dependencias no instaladas correctamente")
        echo "nodejs_check: DEPENDENCIES_NOT_INSTALLED" >&3

        # Intentar instalar dependencias
        log "Intentando instalar dependencias..."
        if cd "$PROJECT_ROOT" && pnpm install; then
            log "Dependencias instaladas exitosamente"
        else
            issues+=("Error al instalar dependencias")
        fi
    else
        log "Dependencias verificadas correctamente"
        echo "nodejs_check: OK" >&3
    fi

    # Verificar dependencias desactualizadas
    if cd "$PROJECT_ROOT" && pnpm outdated >/dev/null 2>&1; then
        local outdated_count
        outdated_count=$(pnpm outdated --format json | jq length 2>/dev/null || echo 0)
        if [[ $outdated_count -gt 0 ]]; then
            issues+=("$outdated_count dependencias desactualizadas")
            log "ADVERTENCIA: $outdated_count dependencias desactualizadas"
        fi
    fi

    if [[ ${#issues[@]} -gt 0 ]]; then
        log "Problemas encontrados en dependencias Node.js:"
        printf '  %s\n' "${issues[@]}" >&2
    fi

    echo "nodejs_issues: [$(printf '"%s",' "${issues[@]}")]" >&3
}

# Función para verificar dependencias del sistema
check_system_dependencies() {
    log "Verificando dependencias del sistema..."

    local required_commands=(
        "git"
        "curl"
        "jq"
        "node"
        "npm"
    )

    local missing_commands=()

    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_commands+=("$cmd")
        fi
    done

    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        log "Comandos del sistema faltantes: ${missing_commands[*]}"
        echo "system_check: MISSING_COMMANDS" >&3
    else
        log "Dependencias del sistema verificadas correctamente"
        echo "system_check: OK" >&3
    fi

    echo "missing_commands: [$(printf '"%s",' "${missing_commands[@]}")]" >&3
}

# Función para verificar versiones de herramientas
check_tool_versions() {
    log "Verificando versiones de herramientas..."

    local version_info=""

    # Node.js version
    if command -v node >/dev/null 2>&1; then
        version_info+="node:$(node --version),"
    fi

    # npm version
    if command -v npm >/dev/null 2>&1; then
        version_info+="npm:$(npm --version),"
    fi

    # pnpm version
    if command -v pnpm >/dev/null 2>&1; then
        version_info+="pnpm:$(pnpm --version),"
    fi

    # jq version
    if command -v jq >/dev/null 2>&1; then
        version_info+="jq:$(jq --version | head -1),"
    fi

    # Git version
    if command -v git >/dev/null 2>&1; then
        version_info+="git:$(git --version | awk '{print $3}'),"
    fi

    log "Versiones de herramientas: ${version_info%,}"

    echo "tool_versions: {$version_info}" >&3
}

# Función para verificar configuración de Git
check_git_config() {
    log "Verificando configuración de Git..."

    local git_issues=()

    # Verificar que estemos en un repositorio git
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        git_issues+=("No es un repositorio Git")
        echo "git_check: NOT_A_REPO" >&3
        return 1
    fi

    # Verificar configuración básica
    local git_user
    local git_email

    git_user=$(git config user.name 2>/dev/null || echo "")
    git_email=$(git config user.email 2>/dev/null || echo "")

    if [[ -z "$git_user" ]]; then
        git_issues+=("Nombre de usuario de Git no configurado")
    fi

    if [[ -z "$git_email" ]]; then
        git_issues+=("Email de Git no configurado")
    fi

    # Verificar estado del repositorio
    if [[ -n "$(git status --porcelain)" ]]; then
        git_issues+=("Repositorio tiene cambios sin commitear")
    fi

    if [[ ${#git_issues[@]} -gt 0 ]]; then
        log "Problemas encontrados en configuración de Git:"
        printf '  %s\n' "${git_issues[@]}" >&2
        echo "git_check: ISSUES_FOUND" >&3
    else
        log "Configuración de Git verificada correctamente"
        echo "git_check: OK" >&3
    fi

    echo "git_issues: [$(printf '"%s",' "${git_issues[@]}")]" >&3
}

# Función para verificar archivos de configuración
check_config_files() {
    log "Verificando archivos de configuración..."

    local config_files=(
        "tsconfig.base.json"
        "apps/api/tsconfig.json"
        "apps/web/tsconfig.json"
        "packages/shared/tsconfig.json"
    )

    local missing_configs=()
    local invalid_configs=()

    for config in "${config_files[@]}"; do
        if [[ ! -f "$PROJECT_ROOT/$config" ]]; then
            missing_configs+=("$config")
        else
            # Verificar que sea JSON válido
            if ! jq . "$PROJECT_ROOT/$config" >/dev/null 2>&1; then
                invalid_configs+=("$config")
            fi
        fi
    done

    if [[ ${#missing_configs[@]} -gt 0 ]]; then
        log "Archivos de configuración faltantes: ${missing_configs[*]}"
    fi

    if [[ ${#invalid_configs[@]} -gt 0 ]]; then
        log "Archivos de configuración inválidos: ${invalid_configs[*]}"
    fi

    echo "config_check:" >&3
    echo "  missing: [$(printf '"%s",' "${missing_configs[@]}")]" >&3
    echo "  invalid: [$(printf '"%s",' "${invalid_configs[@]}")]" >&3
}

# Función para generar reporte de dependencias
generate_dependencies_report() {
    local report_file="$DEPS_DIR/dependencies_check_$(date +%Y%m%d).json"
    local temp_report
    temp_report=$(mktemp)

    log "Generando reporte de dependencias: $report_file"

    cat > "$temp_report" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "check_type": "weekly_dependencies_check",
  "project_root": "$PROJECT_ROOT",
  "results": {
EOF

    # Ejecutar verificaciones y capturar output en fd 3
    exec 3>> "$temp_report"

    check_nodejs_dependencies
    check_system_dependencies
    check_tool_versions
    check_git_config
    check_config_files

    exec 3>&-

    cat >> "$temp_report" << EOF
  }
}
EOF

    mv "$temp_report" "$report_file"
    log "Reporte de dependencias generado: $report_file"
}

# Función principal
main() {
    log "=== ECONEURA-IA Weekly Dependencies Check ==="
    log "Iniciando verificación semanal de dependencias..."

    # Verificar que estemos en el directorio correcto
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR: No se encuentra en el directorio raíz del proyecto"
        exit 1
    fi

    # Generar reporte de dependencias
    generate_dependencies_report

    log "Verificación semanal de dependencias completada"
    log "=== Fin de la verificación semanal ==="
}

# Ejecutar función principal
main "$@"