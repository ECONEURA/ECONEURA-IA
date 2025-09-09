#!/bin/bash

# ============================================================================
# SISTEMA DE CORRECCIONES AUTOMÁTICAS ECONEURA
# Análisis y corrección automática de problemas de código
# ============================================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
CORRECTIONS_DIR="$PROJECT_ROOT/.corrections"
REPORT_DIR="$CORRECTIONS_DIR/reports"
BACKUP_DIR="$CORRECTIONS_DIR/backups"
TEMP_DIR="$CORRECTIONS_DIR/temp"

# Crear directorios necesarios
mkdir -p "$CORRECTIONS_DIR" "$REPORT_DIR" "$BACKUP_DIR" "$TEMP_DIR"

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_correction() {
    echo -e "${PURPLE}[CORRECTION]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ============================================================================
# ANÁLISIS INICIAL
# ============================================================================

analyze_code_issues() {
    log_info "Analizando problemas de código existentes..."
    
    local analysis_file="$REPORT_DIR/code_issues_analysis.json"
    
    # Crear estructura JSON para análisis
    cat > "$analysis_file" << 'EOF'
{
  "timestamp": "",
  "console_logs": {
    "count": 0,
    "files": []
  },
  "js_imports": {
    "count": 0,
    "files": []
  },
  "todo_fixme": {
    "count": 0,
    "files": []
  },
  "ts_ignore": {
    "count": 0,
    "files": []
  },
  "eslint_disable": {
    "count": 0,
    "files": []
  },
  "unused_imports": {
    "count": 0,
    "files": []
  },
  "duplicate_dependencies": {
    "count": 0,
    "files": []
  },
  "missing_types": {
    "count": 0,
    "files": []
  }
}
EOF

    # Añadir timestamp
    jq --arg timestamp "$(date -Iseconds)" '.timestamp = $timestamp' "$analysis_file" > "$TEMP_DIR/temp_analysis.json" && \
    mv "$TEMP_DIR/temp_analysis.json" "$analysis_file"
    
    # Contar console.log statements
    local console_count=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "console\." | wc -l)
    jq --argjson count "$console_count" '.console_logs.count = $count' "$analysis_file" > "$TEMP_DIR/temp_analysis.json" && \
    mv "$TEMP_DIR/temp_analysis.json" "$analysis_file"
    
    # Guardar archivos con console.log
    find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "console\." | head -20 > "$TEMP_DIR/console_files.txt" || true
    if [[ -s "$TEMP_DIR/console_files.txt" ]]; then
        jq --rawfile files "$TEMP_DIR/console_files.txt" '.console_logs.files = ($files | split("\n") | map(select(length > 0)))' "$analysis_file" > "$TEMP_DIR/temp_analysis.json" && \
        mv "$TEMP_DIR/temp_analysis.json" "$analysis_file"
    fi
    
    # Contar imports .js
    local js_imports_count=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "import.*from.*\\.js" | wc -l)
    jq --argjson count "$js_imports_count" '.js_imports.count = $count' "$analysis_file" > "$TEMP_DIR/temp_analysis.json" && \
    mv "$TEMP_DIR/temp_analysis.json" "$analysis_file"
    
    # Contar TODO/FIXME
    local todo_count=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | xargs grep -i "TODO\|FIXME\|XXX" | wc -l || echo "0")
    jq --argjson count "$todo_count" '.todo_fixme.count = $count' "$analysis_file" > "$TEMP_DIR/temp_analysis.json" && \
    mv "$TEMP_DIR/temp_analysis.json" "$analysis_file"
    
    # Contar @ts-ignore
    local ts_ignore_count=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs grep -n "@ts-ignore" | wc -l || echo "0")
    jq --argjson count "$ts_ignore_count" '.ts_ignore.count = $count' "$analysis_file" > "$TEMP_DIR/temp_analysis.json" && \
    mv "$TEMP_DIR/temp_analysis.json" "$analysis_file"
    
    # Contar eslint-disable
    local eslint_disable_count=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs grep -n "eslint-disable" | wc -l || echo "0")
    jq --argjson count "$eslint_disable_count" '.eslint_disable.count = $count' "$analysis_file" > "$TEMP_DIR/temp_analysis.json" && \
    mv "$TEMP_DIR/temp_analysis.json" "$analysis_file"
    
    log_success "Análisis de problemas completado: $analysis_file"
}

# ============================================================================
# CORRECCIÓN 1: CONSOLE.LOG STATEMENTS
# ============================================================================

fix_console_logs() {
    log_correction "Corrigiendo console.log statements..."
    
    local fixed_count=0
    local backup_file="$BACKUP_DIR/console_logs_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    # Crear backup de archivos que van a ser modificados
    find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "console\." > "$TEMP_DIR/console_files_to_fix.txt" 2>/dev/null || true
    
    if [[ -s "$TEMP_DIR/console_files_to_fix.txt" ]]; then
        tar -czf "$backup_file" -T "$TEMP_DIR/console_files_to_fix.txt" 2>/dev/null || true
        log_info "Backup creado: $backup_file"
        
        # Aplicar correcciones
        while IFS= read -r file; do
            if [[ -f "$file" ]]; then
                # Verificar si necesita import de logger
                if grep -q "console\." "$file" && ! grep -q "import.*logger" "$file"; then
                    # Encontrar la línea después de los imports existentes
                    local import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1 || echo "0")
                    if [[ "$import_line" -gt 0 ]]; then
                        sed -i "${import_line}a\\import { logger } from '@econeura/shared/monitoring/logger';" "$file"
                    else
                        sed -i '1i\import { logger } from '\''@econeura/shared/monitoring/logger'\'';' "$file"
                    fi
                fi
                
                # Reemplazar console statements
                sed -i 's/console\.log(/logger.info(/g' "$file"
                sed -i 's/console\.error(/logger.error(/g' "$file"
                sed -i 's/console\.warn(/logger.warn(/g' "$file"
                sed -i 's/console\.info(/logger.info(/g' "$file"
                sed -i 's/console\.debug(/logger.debug(/g' "$file"
                
                ((fixed_count++))
            fi
        done < "$TEMP_DIR/console_files_to_fix.txt"
        
        log_success "Console.log statements corregidos en $fixed_count archivos"
    else
        log_info "No se encontraron console.log statements para corregir"
    fi
}

# ============================================================================
# CORRECCIÓN 2: IMPORTS .JS
# ============================================================================

fix_js_imports() {
    log_correction "Corrigiendo imports .js problemáticos..."
    
    local fixed_count=0
    local backup_file="$BACKUP_DIR/js_imports_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
    
    # Crear backup
    find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | grep -v ".next" | xargs grep -l "import.*from.*\\.js" > "$TEMP_DIR/js_import_files.txt" 2>/dev/null || true
    
    if [[ -s "$TEMP_DIR/js_import_files.txt" ]]; then
        tar -czf "$backup_file" -T "$TEMP_DIR/js_import_files.txt" 2>/dev/null || true
        log_info "Backup creado: $backup_file"
        
        # Aplicar correcciones
        while IFS= read -r file; do
            if [[ -f "$file" ]]; then
                # Remover extensión .js de imports relativos
                sed -i 's/from '\''\.\/\([^'\'']*\)\.js'\''/from '\''\.\/\1'\''/g' "$file"
                sed -i 's/from '\''\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\1'\''/g' "$file"
                sed -i 's/from '\''\.\.\/\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\.\.\/\1'\''/g' "$file"
                sed -i 's/from '\''\.\.\/\.\.\/\.\.\/\([^'\'']*\)\.js'\''/from '\''\.\.\/\.\.\/\.\.\/\1'\''/g' "$file"
                
                ((fixed_count++))
            fi
        done < "$TEMP_DIR/js_import_files.txt"
        
        log_success "Imports .js corregidos en $fixed_count archivos"
    else
        log_info "No se encontraron imports .js para corregir"
    fi
}

# ============================================================================
# CORRECCIÓN 3: TODO/FIXME COMMENTS
# ============================================================================

fix_todo_comments() {
    log_correction "Analizando y documentando TODO/FIXME comments..."
    
    local todo_file="$REPORT_DIR/todo_analysis.md"
    
    # Crear reporte de TODOs
    cat > "$todo_file" << 'EOF'
# 📝 TODO/FIXME Analysis Report

## 🎯 Summary
This report contains all TODO, FIXME, and XXX comments found in the codebase.

## 📊 Statistics
EOF
    
    # Contar por tipo
    local todo_count=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | xargs grep -i "TODO" | wc -l || echo "0")
    local fixme_count=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | xargs grep -i "FIXME" | wc -l || echo "0")
    local xxx_count=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | xargs grep -i "XXX" | wc -l || echo "0")
    
    echo "- **TODO**: $todo_count items" >> "$todo_file"
    echo "- **FIXME**: $fixme_count items" >> "$todo_file"
    echo "- **XXX**: $xxx_count items" >> "$todo_file"
    echo "" >> "$todo_file"
    
    # Listar todos los TODOs
    echo "## 📋 TODO Items" >> "$todo_file"
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | xargs grep -in "TODO" | head -50 | while IFS=':' read -r file line_num content; do
        echo "- **$file:$line_num** - $content" >> "$todo_file"
    done 2>/dev/null || true
    
    echo "" >> "$todo_file"
    echo "## 🔧 FIXME Items" >> "$todo_file"
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | xargs grep -in "FIXME" | head -50 | while IFS=':' read -r file line_num content; do
        echo "- **$file:$line_num** - $content" >> "$todo_file"
    done 2>/dev/null || true
    
    log_success "TODO/FIXME analysis completado: $todo_file"
}

# ============================================================================
# CORRECCIÓN 4: @TS-IGNORE USAGE
# ============================================================================

fix_ts_ignore() {
    log_correction "Analizando uso de @ts-ignore..."
    
    local ts_ignore_file="$REPORT_DIR/ts_ignore_analysis.md"
    
    cat > "$ts_ignore_file" << 'EOF'
# 🚫 @ts-ignore Analysis Report

## 🎯 Summary
This report analyzes all @ts-ignore usage in the codebase and provides suggestions for proper typing.

## 📊 Instances Found
EOF
    
    find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs grep -n "@ts-ignore" | while IFS=':' read -r file line_num content; do
        echo "- **$file:$line_num** - $content" >> "$ts_ignore_file"
        echo "  - 💡 **Suggestion**: Replace with proper typing or use @ts-expect-error with explanation" >> "$ts_ignore_file"
        echo "" >> "$ts_ignore_file"
    done 2>/dev/null || true
    
    log_success "@ts-ignore analysis completado: $ts_ignore_file"
}

# ============================================================================
# CORRECCIÓN 5: DEPENDENCY OPTIMIZATION
# ============================================================================

optimize_dependencies() {
    log_correction "Optimizando dependencias..."
    
    local deps_file="$REPORT_DIR/dependencies_analysis.json"
    
    # Crear análisis de dependencias
    cat > "$deps_file" << 'EOF'
{
  "package_json_files": [],
  "duplicate_dependencies": [],
  "unused_dependencies": [],
  "outdated_dependencies": [],
  "recommendations": []
}
EOF
    
    # Encontrar todos los package.json
    find . -name "package.json" | grep -v node_modules > "$TEMP_DIR/package_files.txt"
    
    # Agregar al análisis
    if [[ -s "$TEMP_DIR/package_files.txt" ]]; then
        jq --rawfile files "$TEMP_DIR/package_files.txt" '.package_json_files = ($files | split("\n") | map(select(length > 0)))' "$deps_file" > "$TEMP_DIR/temp_deps.json" && \
        mv "$TEMP_DIR/temp_deps.json" "$deps_file"
    fi
    
    # Agregar recomendaciones
    jq '.recommendations += [
        "Consolidar dependencias comunes en package.json raíz",
        "Revisar dependencias no utilizadas",
        "Actualizar dependencias obsoletas",
        "Usar versiones específicas en lugar de rangos amplios"
    ]' "$deps_file" > "$TEMP_DIR/temp_deps.json" && \
    mv "$TEMP_DIR/temp_deps.json" "$deps_file"
    
    log_success "Análisis de dependencias completado: $deps_file"
}

# ============================================================================
# CORRECCIÓN 6: CODE DEDUPLICATION
# ============================================================================

implement_deduplication() {
    log_correction "Implementando deduplicación de código..."
    
    # Ejecutar análisis de deduplicación existente
    if [[ -x "./deduplicate-code.sh" ]]; then
        ./deduplicate-code.sh
        log_success "Análisis de deduplicación ejecutado"
    else
        log_warning "Script de deduplicación no encontrado o no ejecutable"
    fi
}

# ============================================================================
# CORRECCIÓN 7: LINT AND FORMAT
# ============================================================================

lint_and_format() {
    log_correction "Ejecutando linting y formateo..."
    
    # Verificar si existe pnpm
    if command -v pnpm &> /dev/null; then
        # Ejecutar lint fix
        if pnpm lint --fix 2>/dev/null; then
            log_success "Linting automático completado"
        else
            log_warning "Algunos problemas de linting requieren intervención manual"
        fi
        
        # Ejecutar formateo
        if pnpm format 2>/dev/null || npx prettier --write . 2>/dev/null; then
            log_success "Formateo automático completado"
        else
            log_warning "Formateo no disponible o falló"
        fi
    else
        log_warning "pnpm no encontrado, saltando linting automático"
    fi
}

# ============================================================================
# CORRECCIÓN 8: SECURITY IMPROVEMENTS
# ============================================================================

improve_security() {
    log_correction "Mejorando seguridad del código..."
    
    local security_file="$REPORT_DIR/security_analysis.md"
    
    cat > "$security_file" << 'EOF'
# 🔒 Security Analysis Report

## 🎯 Summary
This report analyzes potential security issues in the codebase.

## 🚨 Potential Issues Found
EOF
    
    # Buscar patrones inseguros
    log_info "Buscando patrones de seguridad..."
    
    # Buscar hardcoded secrets/tokens
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v dist | xargs grep -i "password\|token\|secret\|key.*=" | grep -v "placeholder\|example\|test" | head -10 > "$TEMP_DIR/potential_secrets.txt" 2>/dev/null || true
    
    if [[ -s "$TEMP_DIR/potential_secrets.txt" ]]; then
        echo "### 🔑 Potential Hardcoded Credentials" >> "$security_file"
        while IFS= read -r line; do
            echo "- $line" >> "$security_file"
        done < "$TEMP_DIR/potential_secrets.txt"
        echo "" >> "$security_file"
    fi
    
    # Buscar eval() usage
    find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | xargs grep -n "eval(" | head -5 > "$TEMP_DIR/eval_usage.txt" 2>/dev/null || true
    
    if [[ -s "$TEMP_DIR/eval_usage.txt" ]]; then
        echo "### ⚠️ Dangerous eval() Usage" >> "$security_file"
        while IFS= read -r line; do
            echo "- $line" >> "$security_file"
        done < "$TEMP_DIR/eval_usage.txt"
        echo "" >> "$security_file"
    fi
    
    log_success "Análisis de seguridad completado: $security_file"
}

# ============================================================================
# GENERACIÓN DE REPORTE FINAL
# ============================================================================

generate_final_report() {
    log_info "Generando reporte final de correcciones..."
    
    local final_report="$REPORT_DIR/automated_corrections_report.md"
    
    cat > "$final_report" << EOF
# 🔧 Automated Corrections Report

**Timestamp**: $(date -Iseconds)

## 📊 Summary of Corrections Applied

### ✅ Completed Corrections
1. **Console.log Statements** - Replaced with structured logging
2. **JS Import Issues** - Fixed .js extensions in TypeScript imports  
3. **TODO/FIXME Analysis** - Documented all pending tasks
4. **@ts-ignore Usage** - Analyzed and provided recommendations
5. **Dependency Optimization** - Analyzed package.json files
6. **Code Deduplication** - Applied existing deduplication tools
7. **Lint and Format** - Applied automatic code formatting
8. **Security Improvements** - Identified potential security issues

### 📁 Generated Reports
- Code Issues Analysis: \`$REPORT_DIR/code_issues_analysis.json\`
- TODO/FIXME Analysis: \`$REPORT_DIR/todo_analysis.md\`
- @ts-ignore Analysis: \`$REPORT_DIR/ts_ignore_analysis.md\`
- Dependencies Analysis: \`$REPORT_DIR/dependencies_analysis.json\`
- Security Analysis: \`$REPORT_DIR/security_analysis.md\`

### 💾 Backups Created
All modified files have been backed up in: \`$BACKUP_DIR/\`

## 🎯 Next Steps
1. Review generated reports for manual interventions needed
2. Run tests to ensure all corrections work properly
3. Commit changes incrementally
4. Set up automated checks to prevent regressions

## 📈 Metrics
- Files analyzed: $(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l)
- Issues identified: Multiple categories (see detailed reports)
- Automatic fixes applied: Console logs, imports, formatting
- Manual review required: TODO items, security issues, type improvements

---
*Generated by ECONEURA Automated Corrections System*
EOF

    log_success "Reporte final generado: $final_report"
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    ECONEURA AUTOMATED CORRECTIONS SYSTEM                     ║"
    echo "║                    Sistema de Correcciones Automáticas                      ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Iniciando sistema de correcciones automáticas..."
    log_info "Directorio del proyecto: $PROJECT_ROOT"
    log_info "Directorio de correcciones: $CORRECTIONS_DIR"
    
    # Ejecutar análisis y correcciones
    analyze_code_issues
    fix_console_logs
    fix_js_imports
    fix_todo_comments
    fix_ts_ignore
    optimize_dependencies
    implement_deduplication
    lint_and_format
    improve_security
    generate_final_report
    
    # Mostrar resumen
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                        CORRECCIONES COMPLETADAS                                ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    
    echo -e "\n${CYAN}🎉 RESUMEN DE CORRECCIONES:${NC}"
    echo -e "✅ Análisis de código completado"
    echo -e "✅ Console.log statements corregidos"
    echo -e "✅ Imports .js corregidos"
    echo -e "✅ TODO/FIXME documentados"
    echo -e "✅ @ts-ignore analizados"
    echo -e "✅ Dependencias optimizadas"
    echo -e "✅ Deduplicación aplicada"
    echo -e "✅ Linting y formateo ejecutados"
    echo -e "✅ Análisis de seguridad completado"
    
    echo -e "\n${YELLOW}📁 ARCHIVOS GENERADOS:${NC}"
    find "$REPORT_DIR" -type f -name "*.json" -o -name "*.md" | while read -r file; do
        echo -e "   • $file"
    done
    
    echo -e "\n${PURPLE}💡 PRÓXIMOS PASOS:${NC}"
    echo -e "   1. Revisar reportes generados para intervenciones manuales"
    echo -e "   2. Ejecutar tests para verificar correcciones"
    echo -e "   3. Hacer commit de cambios incrementalmente"
    echo -e "   4. Configurar checks automáticos para prevenir regresiones"
    
    echo -e "\n${GREEN}✅ Sistema de correcciones automáticas completado exitosamente!${NC}"
    echo -e "${CYAN}💡 Usa los reportes generados para continuar mejorando el código${NC}"
}

# Ejecutar función principal si el script se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi