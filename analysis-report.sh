#!/bin/bash
# analysis-report.sh
# Análisis exhaustivo del proyecto ECONEURA-IA

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_FILE="$PROJECT_ROOT/analysis_report.txt"

# Función de logging
log() {
    echo "$*" | tee -a "$REPORT_FILE"
}

log_header() {
    echo "==================================================================================" | tee -a "$REPORT_FILE"
    echo "=== $1 ===" | tee -a "$REPORT_FILE"
    echo "==================================================================================" | tee -a "$REPORT_FILE"
}

# Función para verificar comandos
check_command() {
    local cmd="$1"
    local desc="$2"
    if command -v "$cmd" >/dev/null 2>&1; then
        log "✓ $desc: $cmd encontrado ($(which $cmd))"
    else
        log "✗ $desc: $cmd NO encontrado"
    fi
}

# Función para verificar archivos
check_file() {
    local file="$1"
    local desc="$2"
    if [[ -f "$file" ]]; then
        local size
        size=$(stat -c%s "$file" 2>/dev/null || echo "desconocido")
        log "✓ $desc: $file existe (${size} bytes)"
    else
        log "✗ $desc: $file NO existe"
    fi
}

# Función para verificar JSON
check_json() {
    local file="$1"
    local desc="$2"
    if [[ -f "$file" ]]; then
        if jq . "$file" >/dev/null 2>&1; then
            log "✓ $desc: JSON válido"
        else
            log "✗ $desc: JSON inválido"
        fi
    else
        log "✗ $desc: archivo no encontrado"
    fi
}

# Función para verificar sintaxis de scripts
check_script_syntax() {
    local file="$1"
    local desc="$2"
    if [[ -f "$file" ]]; then
        if bash -n "$file" 2>/dev/null; then
            log "✓ $desc: sintaxis correcta"
        else
            log "✗ $desc: errores de sintaxis"
        fi
    else
        log "✗ $desc: archivo no encontrado"
    fi
}

# Inicio del análisis
log_header "ANÁLISIS EXHAUSTIVO DEL PROYECTO ECONEURA-IA"
log "Fecha: $(date)"
log "Directorio: $PROJECT_ROOT"
log ""

# 1. Verificación de comandos del sistema
log_header "VERIFICACIÓN DE COMANDOS DEL SISTEMA"
check_command "node" "Node.js"
check_command "npm" "NPM"
check_command "pnpm" "PNPM"
check_command "git" "Git"
check_command "jq" "JQ"
check_command "docker" "Docker"
check_command "curl" "cURL"
log ""

# 2. Verificación de archivos de configuración principales
log_header "ARCHIVOS DE CONFIGURACIÓN PRINCIPALES"
check_file "package.json" "Package.json principal"
check_file "pnpm-workspace.yaml" "Configuración de workspaces PNPM"
check_file "tsconfig.json" "Configuración TypeScript"
check_file "tsconfig.base.json" "Configuración base TypeScript"
check_file ".nvmrc" "Versión de Node.js"
check_file ".gitignore" "Archivo .gitignore"
check_file "README.md" "Documentación principal"
log ""

# 3. Validación de archivos JSON
log_header "VALIDACIÓN DE ARCHIVOS JSON"
check_json "package.json" "Package.json"
check_json "tsconfig.json" "TypeScript config"
check_json "tsconfig.base.json" "TypeScript base config"
check_json ".size-limit.json" "Size limit config"
check_json ".spectral.yml" "Spectral config (YAML)"

# Verificar JSON en subdirectorios
log "Verificando JSON en apps/ y packages/..."
find "$PROJECT_ROOT/apps" "$PROJECT_ROOT/packages" -name "*.json" -type f 2>/dev/null | while read -r json_file; do
    if ! jq . "$json_file" >/dev/null 2>&1; then
        log "✗ JSON inválido: $json_file"
    fi
done
log ""

# 4. Verificación de sintaxis de scripts
log_header "VERIFICACIÓN DE SINTAXIS DE SCRIPTS"
find "$PROJECT_ROOT" -name "*.sh" -type f | while read -r script_file; do
    if [[ "$script_file" == *"/node_modules/"* ]]; then continue; fi
    if [[ "$script_file" == *"/.git/"* ]]; then continue; fi

    script_name=$(basename "$script_file")
    if ! bash -n "$script_file" 2>/dev/null; then
        log "✗ Script con errores: $script_file"
    fi
done
log "✓ Todos los scripts principales verificados"
log ""

# 5. Verificación de dependencias
log_header "VERIFICACIÓN DE DEPENDENCIAS"
if [[ -f "package.json" ]]; then
    deps_count=$(jq '.dependencies // {} | length' package.json 2>/dev/null || echo "0")
    dev_deps_count=$(jq '.devDependencies // {} | length' package.json 2>/dev/null || echo "0")

    log "Dependencias de producción: $deps_count"
    log "Dependencias de desarrollo: $dev_deps_count"

    # Verificar si las dependencias están instaladas
    if [[ -d "node_modules" ]]; then
        installed_count=$(find node_modules -maxdepth 1 -type d | wc -l)
        installed_count=$((installed_count - 1)) # Restar el directorio node_modules mismo
        log "Dependencias instaladas: $installed_count"
    else
        log "✗ node_modules no encontrado - dependencias no instaladas"
    fi
fi
log ""

# 6. Verificación de estructura de directorios
log_header "ESTRUCTURA DE DIRECTORIOS"
expected_dirs=("apps" "packages" "scripts" "audit" "logs" "backups")
for dir in "${expected_dirs[@]}"; do
    if [[ -d "$dir" ]]; then
        file_count=$(find "$dir" -type f | wc -l)
        log "✓ Directorio $dir existe ($file_count archivos)"
    else
        log "✗ Directorio $dir no existe"
    fi
done
log ""

# 7. Verificación de archivos críticos de seguridad
log_header "ARCHIVOS CRÍTICOS DE SEGURIDAD"
security_files=(
    "scripts/validate_env.sh"
    "scripts/ai.sh"
    "dry-run-executor.sh"
    "bootstrap-security.sh"
    "scripts/safety-checks.sh"
    "scripts/input-validation.sh"
)

for file in "${security_files[@]}"; do
    check_file "$file" "Archivo de seguridad"
done
log ""

# 8. Verificación de permisos
log_header "VERIFICACIÓN DE PERMISOS"
find "$PROJECT_ROOT/scripts" -name "*.sh" -type f 2>/dev/null | while read -r script_file; do
    if [[ ! -x "$script_file" ]]; then
        log "✗ Script sin permisos de ejecución: $script_file"
    fi
done
log "✓ Verificación de permisos completada"
log ""

# 9. Verificación de archivos duplicados
log_header "ARCHIVOS DUPLICADOS POTENCIALES"
duplicate_files=(
    "bootstrap-security.sh:bootstrap_security.sh"
    "ai.sh:ai-run.sh"
)

for pair in "${duplicate_files[@]}"; do
    IFS=':' read -r file1 file2 <<< "$pair"
    if [[ -f "$file1" && -f "$file2" ]]; then
        if cmp -s "$file1" "$file2"; then
            log "⚠ Archivos idénticos: $file1 y $file2"
        else
            log "⚠ Archivos similares encontrados: $file1 y $file2"
        fi
    fi
done
log ""

# 10. Verificación de archivos vacíos
log_header "ARCHIVOS VACÍOS PROBLEMÁTICOS"
find "$PROJECT_ROOT" -name "*.json" -type f -size 0 2>/dev/null | while read -r empty_file; do
    if [[ "$empty_file" == *"/node_modules/"* ]]; then continue; fi
    log "⚠ Archivo JSON vacío: $empty_file"
done
log ""

# 11. Resumen final
log_header "RESUMEN DEL ANÁLISIS"
log "Análisis completado: $(date)"
log "Reporte guardado en: $REPORT_FILE"
log ""
log "PRÓXIMOS PASOS RECOMENDADOS:"
log "1. Instalar pnpm para manejar workspaces correctamente"
log "2. Corregir archivos JSON vacíos o inválidos"
log "3. Verificar y corregir permisos de archivos"
log "4. Limpiar archivos duplicados"
log "5. Configurar .nvmrc con la versión correcta de Node.js"
log "6. Ejecutar instalación completa de dependencias"
log ""

log "=================================================================================="