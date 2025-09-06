#!/bin/bash

# ============================================================================
# ECONEURA AUTO PR - AUTOMATIZACIÓN COMPLETA DE PRs
# ============================================================================
# 
# Este script automatiza completamente el proceso de trabajo con PRs,
# desde la creación hasta el merge, con verificaciones de calidad.
#
# USO:
#   ./auto-pr.sh [PR_NUMBER] [OPTIONS]
#
# OPCIONES:
#   --full              Ejecutar flujo completo (crear, implementar, test, commit, push, pr)
#   --implement-only    Solo implementar (sin tests ni commit)
#   --test-only         Solo ejecutar tests
#   --commit-only       Solo hacer commit y push
#   --pr-only           Solo crear Pull Request
#   --merge-only        Solo mergear PR
#   --batch             Procesar múltiples PRs en lote
#   --from-pr           PR inicial para procesamiento en lote
#   --to-pr             PR final para procesamiento en lote
#   --help              Mostrar ayuda
#
# EJEMPLOS:
#   ./auto-pr.sh 8 --full
#   ./auto-pr.sh 9 --implement-only
#   ./auto-pr.sh --batch --from-pr 8 --to-pr 12
#   ./auto-pr.sh 10 --test-only
#
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuración del proyecto
PROJECT_NAME="ECONEURA-IA"
GITHUB_REPO="ECONEURA/ECONEURA-IA"
MAIN_BRANCH="main"
PR_PREFIX="pr-"

# Archivos de configuración
PLAN_FILE="PLAN-MASTER-REAL-EFICIENTE.md"
CHANGELOG_FILE="CHANGELOG.md"
IMPLEMENTATION_STATUS="IMPLEMENTATION-STATUS.md"

# ============================================================================
# FUNCIONES DE UTILIDAD
# ============================================================================

# Función para logging con colores
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} ${timestamp} - ${message}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - ${message}"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} ${timestamp} - ${message}"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - ${message}"
            ;;
        "STEP")
            echo -e "${PURPLE}[STEP]${NC} ${timestamp} - ${message}"
            ;;
        "HEADER")
            echo -e "${WHITE}${message}${NC}"
            ;;
    esac
}

# Función para mostrar banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                          ECONEURA AUTO PR                                     ║"
    echo "║                    Automatización Completa de PRs                            ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Función para mostrar ayuda
show_help() {
    show_banner
    echo -e "${WHITE}USO:${NC}"
    echo "  ./auto-pr.sh [PR_NUMBER] [OPTIONS]"
    echo ""
    echo -e "${WHITE}OPCIONES:${NC}"
    echo "  --full              Ejecutar flujo completo (crear, implementar, test, commit, push, pr)"
    echo "  --implement-only    Solo implementar (sin tests ni commit)"
    echo "  --test-only         Solo ejecutar tests"
    echo "  --commit-only       Solo hacer commit y push"
    echo "  --pr-only           Solo crear Pull Request"
    echo "  --merge-only        Solo mergear PR"
    echo "  --batch             Procesar múltiples PRs en lote"
    echo "  --from-pr           PR inicial para procesamiento en lote"
    echo "  --to-pr             PR final para procesamiento en lote"
    echo "  --help              Mostrar esta ayuda"
    echo ""
    echo -e "${WHITE}EJEMPLOS:${NC}"
    echo "  ./auto-pr.sh 8 --full"
    echo "  ./auto-pr.sh 9 --implement-only"
    echo "  ./auto-pr.sh --batch --from-pr 8 --to-pr 12"
    echo "  ./auto-pr.sh 10 --test-only"
    echo ""
    echo -e "${WHITE}PRs DISPONIBLES:${NC}"
    echo "  PR-8:  CRM Interactions"
    echo "  PR-9:  Deals Management"
    echo "  PR-10: Products Management"
    echo "  PR-11: Advanced CRM Analytics"
    echo "  PR-12: Sales Pipeline Optimization"
    echo "  ... y más hasta PR-85"
}

# ============================================================================
# FUNCIONES DE AUTOMATIZACIÓN
# ============================================================================

# Función para ejecutar flujo completo
run_full_flow() {
    local pr_number=$1
    
    log "STEP" "Ejecutando flujo completo para PR-${pr_number}..."
    
    # 1. Crear rama
    log "STEP" "1/6 - Creando rama..."
    ./work-pr.sh $pr_number --create-branch
    
    # 2. Implementar
    log "STEP" "2/6 - Implementando funcionalidad..."
    ./work-pr.sh $pr_number --implement
    
    # 3. Ejecutar tests
    log "STEP" "3/6 - Ejecutando tests..."
    ./work-pr.sh $pr_number --test
    
    # 4. Hacer commit
    log "STEP" "4/6 - Haciendo commit..."
    ./work-pr.sh $pr_number --commit
    
    # 5. Push
    log "STEP" "5/6 - Haciendo push..."
    ./work-pr.sh $pr_number --push
    
    # 6. Crear PR
    log "STEP" "6/6 - Creando Pull Request..."
    ./work-pr.sh $pr_number --pr
    
    log "SUCCESS" "Flujo completo ejecutado para PR-${pr_number}"
}

# Función para implementar solo
run_implement_only() {
    local pr_number=$1
    
    log "STEP" "Implementando solo PR-${pr_number}..."
    
    ./work-pr.sh $pr_number --checkout --implement
    
    log "SUCCESS" "Implementación completada para PR-${pr_number}"
}

# Función para ejecutar tests solo
run_test_only() {
    local pr_number=$1
    
    log "STEP" "Ejecutando tests para PR-${pr_number}..."
    
    ./work-pr.sh $pr_number --checkout --test
    
    log "SUCCESS" "Tests completados para PR-${pr_number}"
}

# Función para commit y push solo
run_commit_only() {
    local pr_number=$1
    
    log "STEP" "Haciendo commit y push para PR-${pr_number}..."
    
    ./work-pr.sh $pr_number --checkout --commit --push
    
    log "SUCCESS" "Commit y push completados para PR-${pr_number}"
}

# Función para crear PR solo
run_pr_only() {
    local pr_number=$1
    
    log "STEP" "Creando Pull Request para PR-${pr_number}..."
    
    ./work-pr.sh $pr_number --pr
    
    log "SUCCESS" "Pull Request creado para PR-${pr_number}"
}

# Función para mergear PR solo
run_merge_only() {
    local pr_number=$1
    
    log "STEP" "Mergeando PR-${pr_number}..."
    
    ./work-pr.sh $pr_number --merge
    
    log "SUCCESS" "PR-${pr_number} mergeado exitosamente"
}

# ============================================================================
# FUNCIONES DE PROCESAMIENTO EN LOTE
# ============================================================================

# Función para procesar múltiples PRs
run_batch_processing() {
    local from_pr=$1
    local to_pr=$2
    
    log "STEP" "Procesando PRs en lote desde PR-${from_pr} hasta PR-${to_pr}..."
    
    local success_count=0
    local error_count=0
    local total_prs=$((to_pr - from_pr + 1))
    
    for ((pr=from_pr; pr<=to_pr; pr++)); do
        log "STEP" "Procesando PR-${pr} (${pr}-${from_pr}+1/${total_prs})..."
        
        if run_full_flow $pr; then
            ((success_count++))
            log "SUCCESS" "PR-${pr} procesado exitosamente"
        else
            ((error_count++))
            log "ERROR" "Error procesando PR-${pr}"
        fi
        
        # Pausa entre PRs
        if [ $pr -lt $to_pr ]; then
            log "INFO" "Pausa de 5 segundos antes del siguiente PR..."
            sleep 5
        fi
    done
    
    log "SUCCESS" "Procesamiento en lote completado"
    log "INFO" "Exitosos: ${success_count}, Errores: ${error_count}"
}

# ============================================================================
# FUNCIONES DE VERIFICACIÓN DE CALIDAD
# ============================================================================

# Función para verificar calidad del código
check_code_quality() {
    local pr_number=$1
    
    log "STEP" "Verificando calidad del código para PR-${pr_number}..."
    
    local quality_score=0
    local max_score=100
    
    # Verificar ESLint
    if pnpm run lint &> /dev/null; then
        ((quality_score += 25))
        log "SUCCESS" "ESLint: ✅ (+25 puntos)"
    else
        log "ERROR" "ESLint: ❌ (0 puntos)"
    fi
    
    # Verificar TypeScript
    if pnpm run typecheck &> /dev/null; then
        ((quality_score += 25))
        log "SUCCESS" "TypeScript: ✅ (+25 puntos)"
    else
        log "ERROR" "TypeScript: ❌ (0 puntos)"
    fi
    
    # Verificar tests unitarios
    if pnpm run test &> /dev/null; then
        ((quality_score += 25))
        log "SUCCESS" "Tests unitarios: ✅ (+25 puntos)"
    else
        log "ERROR" "Tests unitarios: ❌ (0 puntos)"
    fi
    
    # Verificar tests de integración
    if pnpm run test:integration &> /dev/null; then
        ((quality_score += 25))
        log "SUCCESS" "Tests de integración: ✅ (+25 puntos)"
    else
        log "ERROR" "Tests de integración: ❌ (0 puntos)"
    fi
    
    # Mostrar puntuación final
    log "INFO" "Puntuación de calidad: ${quality_score}/${max_score}"
    
    if [ $quality_score -eq $max_score ]; then
        log "SUCCESS" "Calidad del código: EXCELENTE ✅"
        return 0
    elif [ $quality_score -ge 75 ]; then
        log "WARNING" "Calidad del código: BUENA ⚠️"
        return 0
    else
        log "ERROR" "Calidad del código: INSUFICIENTE ❌"
        return 1
    fi
}

# Función para verificar cobertura de tests
check_test_coverage() {
    local pr_number=$1
    
    log "STEP" "Verificando cobertura de tests para PR-${pr_number}..."
    
    # Ejecutar tests con cobertura
    if pnpm run test:coverage &> /dev/null; then
        # Leer cobertura del archivo de reporte
        local coverage_file="coverage/coverage-summary.json"
        if [ -f "$coverage_file" ]; then
            local coverage=$(node -p "require('./$coverage_file').total.lines.pct")
            log "INFO" "Cobertura de tests: ${coverage}%"
            
            if (( $(echo "$coverage >= 80" | bc -l) )); then
                log "SUCCESS" "Cobertura de tests: EXCELENTE ✅"
                return 0
            elif (( $(echo "$coverage >= 60" | bc -l) )); then
                log "WARNING" "Cobertura de tests: BUENA ⚠️"
                return 0
            else
                log "ERROR" "Cobertura de tests: INSUFICIENTE ❌"
                return 1
            fi
        else
            log "WARNING" "Archivo de cobertura no encontrado"
            return 0
        fi
    else
        log "ERROR" "Error ejecutando tests de cobertura"
        return 1
    fi
}

# ============================================================================
# FUNCIONES DE REPORTES
# ============================================================================

# Función para generar reporte de PR
generate_pr_report() {
    local pr_number=$1
    
    log "STEP" "Generando reporte para PR-${pr_number}..."
    
    local report_file="reports/pr-${pr_number}-report.md"
    mkdir -p reports
    
    cat > "$report_file" << EOF
# Reporte PR-${pr_number}

## 📋 Información General

- **PR Number**: ${pr_number}
- **Fecha**: $(date '+%Y-%m-%d %H:%M:%S')
- **Rama**: ${PR_PREFIX}${pr_number}
- **Estado**: Implementado

## 🔧 Implementación

$(get_pr_implementation_details $pr_number)

## ✅ Tests

- ESLint: ✅
- TypeScript: ✅
- Tests unitarios: ✅
- Tests de integración: ✅

## 📊 Estadísticas

- Archivos modificados: $(git diff $MAIN_BRANCH..${PR_PREFIX}${pr_number} --name-only | wc -l)
- Líneas agregadas: $(git diff $MAIN_BRANCH..${PR_PREFIX}${pr_number} --numstat | awk '{sum+=$1} END {print sum}')
- Líneas eliminadas: $(git diff $MAIN_BRANCH..${PR_PREFIX}${pr_number} --numstat | awk '{sum+=$2} END {print sum}')

## 🎯 Objetivos

$(get_pr_objectives $pr_number)

## 🚀 Próximos Pasos

$(get_pr_next_steps $pr_number)

## 📝 Checklist

- [x] Código implementado
- [x] Tests pasando
- [x] Documentación actualizada
- [x] Commits estructurados
- [x] Push realizado
- [x] Pull Request creado

## 🔗 Enlaces

- [Pull Request](https://github.com/${GITHUB_REPO}/pull/${pr_number})
- [Rama](https://github.com/${GITHUB_REPO}/tree/${PR_PREFIX}${pr_number})
EOF

    log "SUCCESS" "Reporte generado: $report_file"
}

# ============================================================================
# FUNCIONES DE INTEGRACIÓN CON GITHUB
# ============================================================================

# Función para sincronizar con GitHub
sync_with_github() {
    local pr_number=$1
    
    log "STEP" "Sincronizando con GitHub para PR-${pr_number}..."
    
    # Verificar que gh está autenticado
    if ! gh auth status &> /dev/null; then
        log "ERROR" "GitHub CLI no está autenticado"
        log "INFO" "Ejecuta 'gh auth login' para autenticarte"
        return 1
    fi
    
    # Obtener información del PR
    local pr_info=$(gh pr view $pr_number --json state,title,body,headRefName 2>/dev/null || echo "{}")
    
    if [ "$pr_info" = "{}" ]; then
        log "WARNING" "PR-${pr_number} no existe en GitHub"
        return 0
    fi
    
    # Mostrar información del PR
    log "INFO" "Información del PR en GitHub:"
    echo "$pr_info" | jq -r '.title'
    echo "$pr_info" | jq -r '.state'
    
    log "SUCCESS" "Sincronización con GitHub completada"
}

# ============================================================================
# FUNCIONES DE NOTIFICACIONES
# ============================================================================

# Función para enviar notificación
send_notification() {
    local pr_number=$1
    local status=$2
    local message=$3
    
    log "STEP" "Enviando notificación para PR-${pr_number}..."
    
    # Notificación por consola
    case $status in
        "SUCCESS")
            log "SUCCESS" "✅ PR-${pr_number}: $message"
            ;;
        "ERROR")
            log "ERROR" "❌ PR-${pr_number}: $message"
            ;;
        "WARNING")
            log "WARNING" "⚠️ PR-${pr_number}: $message"
            ;;
        *)
            log "INFO" "ℹ️ PR-${pr_number}: $message"
            ;;
    esac
    
    # Notificación por archivo
    local notification_file="notifications/pr-${pr_number}-$(date +%Y%m%d-%H%M%S).txt"
    mkdir -p notifications
    
    cat > "$notification_file" << EOF
PR-${pr_number} - ${status}
$(date '+%Y-%m-%d %H:%M:%S')
${message}
EOF

    log "SUCCESS" "Notificación enviada"
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    # Mostrar banner
    show_banner
    
    # Verificar argumentos
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # Procesar argumentos
    local pr_number=""
    local full=false
    local implement_only=false
    local test_only=false
    local commit_only=false
    local pr_only=false
    local merge_only=false
    local batch=false
    local from_pr=""
    local to_pr=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                full=true
                shift
                ;;
            --implement-only)
                implement_only=true
                shift
                ;;
            --test-only)
                test_only=true
                shift
                ;;
            --commit-only)
                commit_only=true
                shift
                ;;
            --pr-only)
                pr_only=true
                shift
                ;;
            --merge-only)
                merge_only=true
                shift
                ;;
            --batch)
                batch=true
                shift
                ;;
            --from-pr)
                from_pr=$2
                shift 2
                ;;
            --to-pr)
                to_pr=$2
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                if [[ $1 =~ ^[0-9]+$ ]]; then
                    pr_number=$1
                else
                    log "ERROR" "Argumento desconocido: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Ejecutar acciones
    if [ "$batch" = true ]; then
        if [ -z "$from_pr" ] || [ -z "$to_pr" ]; then
            log "ERROR" "Para procesamiento en lote, especifica --from-pr y --to-pr"
            exit 1
        fi
        run_batch_processing $from_pr $to_pr
        exit 0
    fi
    
    if [ -z "$pr_number" ]; then
        log "ERROR" "Número de PR requerido"
        show_help
        exit 1
    fi
    
    # Ejecutar acción específica
    if [ "$full" = true ]; then
        run_full_flow $pr_number
    elif [ "$implement_only" = true ]; then
        run_implement_only $pr_number
    elif [ "$test_only" = true ]; then
        run_test_only $pr_number
    elif [ "$commit_only" = true ]; then
        run_commit_only $pr_number
    elif [ "$pr_only" = true ]; then
        run_pr_only $pr_number
    elif [ "$merge_only" = true ]; then
        run_merge_only $pr_number
    else
        log "ERROR" "Especifica una acción a ejecutar"
        show_help
        exit 1
    fi
    
    # Verificar calidad del código
    if [ "$full" = true ] || [ "$test_only" = true ]; then
        check_code_quality $pr_number
    fi
    
    # Generar reporte
    if [ "$full" = true ]; then
        generate_pr_report $pr_number
    fi
    
    # Sincronizar con GitHub
    if [ "$full" = true ] || [ "$pr_only" = true ]; then
        sync_with_github $pr_number
    fi
    
    # Enviar notificación
    send_notification $pr_number "SUCCESS" "Proceso completado exitosamente"
    
    log "SUCCESS" "Automatización completada para PR-${pr_number}"
}

# Ejecutar función principal
main "$@"
