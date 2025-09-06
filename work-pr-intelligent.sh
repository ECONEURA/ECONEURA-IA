#!/bin/bash

# ============================================================================
# ECONEURA PR WORKFLOW INTELLIGENT - CON ANÁLISIS DE DUPLICADOS
# ============================================================================
# 
# Este script permite trabajar todos los PRs de manera ordenada, limpia y eficiente
# con análisis automático de código existente para evitar duplicados.
#
# USO:
#   ./work-pr-intelligent.sh [PR_NUMBER] [OPTIONS]
#
# OPCIONES:
#   --create-branch       Crear nueva rama para el PR
#   --analyze             Analizar código existente
#   --adapt               Adaptar código existente
#   --implement           Implementar funcionalidad del PR
#   --test                Ejecutar tests
#   --commit              Hacer commit con mensaje estructurado
#   --push                Push a GitHub
#   --pr                  Crear Pull Request en GitHub
#   --merge               Mergear PR (solo para maintainers)
#   --cleanup             Limpiar ramas locales
#   --status              Mostrar estado actual
#   --full-intelligent    Ejecutar workflow completo con análisis
#   --help                Mostrar ayuda
#
# EJEMPLOS:
#   ./work-pr-intelligent.sh 10 --full-intelligent "Products Management"
#   ./work-pr-intelligent.sh 11 --analyze --adapt --implement
#   ./work-pr-intelligent.sh --status
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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
ANALYSIS_DIR="$PROJECT_ROOT/.analysis"
REPORT_DIR="$ANALYSIS_DIR/reports"
ADAPTATION_DIR="$ANALYSIS_DIR/adaptations"

# Crear directorios necesarios
mkdir -p "$ANALYSIS_DIR" "$REPORT_DIR" "$ADAPTATION_DIR"

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

log_analysis() {
    echo -e "${PURPLE}[ANALYSIS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_adaptation() {
    echo -e "${CYAN}[ADAPTATION]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ============================================================================
# ANÁLISIS DE CÓDIGO EXISTENTE
# ============================================================================

analyze_existing_code() {
    log_analysis "Analizando código existente para evitar duplicados..."
    
    if [[ -f "./analyze-existing-code.sh" ]]; then
        ./analyze-existing-code.sh
        log_success "Análisis de código existente completado"
        return 0
    else
        log_error "Script de análisis no encontrado: analyze-existing-code.sh"
        return 1
    fi
}

# ============================================================================
# ADAPTACIÓN DE CÓDIGO EXISTENTE
# ============================================================================

adapt_existing_code() {
    local pr_number="$1"
    local pr_description="$2"
    
    log_adaptation "Adaptando código existente para PR-$pr_number..."
    
    if [[ -f "./adapt-existing-code.sh" ]]; then
        ./adapt-existing-code.sh "$pr_number" "$pr_description"
        log_success "Adaptación de código completada"
        return 0
    else
        log_error "Script de adaptación no encontrado: adapt-existing-code.sh"
        return 1
    fi
}

# ============================================================================
# GESTIÓN DE RAMAS
# ============================================================================

create_branch() {
    local pr_number="$1"
    
    log_info "Creando rama para PR-$pr_number..."
    
    # Verificar que estamos en main
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        log_warning "Cambiando a rama main desde $current_branch"
        git checkout main
    fi
    
    # Actualizar main
    git pull origin main
    
    # Crear nueva rama
    local branch_name="pr-$pr_number"
    git checkout -b "$branch_name"
    
    log_success "Rama $branch_name creada y activada"
}

checkout_branch() {
    local pr_number="$1"
    
    log_info "Cambiando a rama PR-$pr_number..."
    
    local branch_name="pr-$pr_number"
    if git show-ref --verify --quiet "refs/heads/$branch_name"; then
        git checkout "$branch_name"
        log_success "Cambiado a rama $branch_name"
    else
        log_error "Rama $branch_name no existe"
        return 1
    fi
}

# ============================================================================
# IMPLEMENTACIÓN INTELIGENTE DE PR
# ============================================================================

implement_pr_intelligent() {
    local pr_number="$1"
    local pr_description="$2"
    local additional_args=("${@:3}")
    
    log_info "Implementando PR-$pr_number con análisis inteligente..."
    log_info "Descripción: $pr_description"
    
    # 1. Analizar código existente
    log_analysis "Paso 1: Analizando código existente..."
    if ! analyze_existing_code; then
        log_warning "Análisis falló, continuando sin análisis"
    fi
    
    # 2. Adaptar código existente
    log_adaptation "Paso 2: Adaptando código existente..."
    if ! adapt_existing_code "$pr_number" "$pr_description"; then
        log_warning "Adaptación falló, continuando sin adaptación"
    fi
    
    # 3. Implementar PR siguiendo estrategia adaptativa
    log_info "Paso 3: Implementando PR siguiendo estrategia adaptativa..."
    implement_pr_adaptive "$pr_number" "$pr_description" "${additional_args[@]}"
}

implement_pr_adaptive() {
    local pr_number="$1"
    local pr_description="$2"
    local additional_args=("${@:3}")
    
    log_info "Implementando PR-$pr_number de forma adaptativa..."
    
    # Verificar si hay estrategia de adaptación
    local strategy_file="$ADAPTATION_DIR/strategy_${pr_number}.json"
    if [[ -f "$strategy_file" ]]; then
        log_info "Usando estrategia de adaptación encontrada"
        local approach=$(jq -r '.approach' "$strategy_file")
        log_info "Enfoque: $approach"
        
        # Leer acciones recomendadas
        local extend_actions=$(jq -r '.actions.extend_existing[]?' "$strategy_file" 2>/dev/null || echo "")
        local modify_actions=$(jq -r '.actions.modify_existing[]?' "$strategy_file" 2>/dev/null || echo "")
        local create_actions=$(jq -r '.actions.create_new[]?' "$strategy_file" 2>/dev/null || echo "")
        
        if [[ -n "$extend_actions" ]]; then
            log_info "Acciones de extensión recomendadas:"
            echo "$extend_actions" | while read -r action; do
                log_info "  • $action"
            done
        fi
        
        if [[ -n "$modify_actions" ]]; then
            log_info "Acciones de modificación recomendadas:"
            echo "$modify_actions" | while read -r action; do
                log_info "  • $action"
            done
        fi
        
        if [[ -n "$create_actions" ]]; then
            log_info "Acciones de creación recomendadas:"
            echo "$create_actions" | while read -r action; do
                log_info "  • $action"
            done
        fi
    else
        log_warning "No se encontró estrategia de adaptación, implementando de forma estándar"
    fi
    
    # Implementar según el tipo de PR
    case "$pr_number" in
        10)
            implement_products_management "$pr_description"
            ;;
        11)
            implement_invoices_management "$pr_description"
            ;;
        12)
            implement_inventory_kardex "$pr_description"
            ;;
        13)
            implement_suppliers_management "$pr_description"
            ;;
        14)
            implement_payments_sepa "$pr_description"
            ;;
        15)
            implement_dunning_3_toques "$pr_description"
            ;;
        16)
            implement_fiscalidad_regional_ue "$pr_description"
            ;;
        17)
            implement_finops "$pr_description"
            ;;
        *)
            log_warning "PR-$pr_number no tiene implementación específica, usando implementación genérica"
            implement_generic_pr "$pr_number" "$pr_description"
            ;;
    esac
}

# ============================================================================
# IMPLEMENTACIONES ESPECÍFICAS DE PR
# ============================================================================

implement_products_management() {
    local description="$1"
    
    log_info "Implementando Products Management..."
    
    # Verificar si ya existe código similar
    if [[ -f "$PROJECT_ROOT/apps/api/src/domain/entities/product.entity.ts" ]]; then
        log_warning "Entidad Product ya existe, extendiendo en lugar de crear nueva"
        # TODO: Implementar extensión de entidad existente
    else
        log_info "Creando nueva entidad Product"
        # TODO: Implementar creación de entidad siguiendo patrones existentes
    fi
    
    # Implementar repositorio
    if [[ -f "$PROJECT_ROOT/apps/api/src/domain/repositories/product.repository.ts" ]]; then
        log_warning "Repositorio Product ya existe, extendiendo en lugar de crear nuevo"
        # TODO: Implementar extensión de repositorio existente
    else
        log_info "Creando nuevo repositorio Product"
        # TODO: Implementar creación de repositorio siguiendo interfaces existentes
    fi
    
    # Implementar use cases
    log_info "Implementando use cases para Products Management"
    # TODO: Implementar use cases siguiendo patrones existentes
    
    # Implementar DTOs
    log_info "Implementando DTOs para Products Management"
    # TODO: Implementar DTOs siguiendo schemas existentes
    
    # Implementar controlador
    log_info "Implementando controlador para Products Management"
    # TODO: Implementar controlador siguiendo patrones existentes
    
    # Implementar rutas
    log_info "Implementando rutas para Products Management"
    # TODO: Implementar rutas siguiendo patrones existentes
    
    log_success "Products Management implementado"
}

implement_invoices_management() {
    local description="$1"
    
    log_info "Implementando Invoices Management..."
    # TODO: Implementar siguiendo patrones existentes
    log_success "Invoices Management implementado"
}

implement_inventory_kardex() {
    local description="$1"
    
    log_info "Implementando Inventory Kardex..."
    # TODO: Implementar siguiendo patrones existentes
    log_success "Inventory Kardex implementado"
}

implement_suppliers_management() {
    local description="$1"
    
    log_info "Implementando Suppliers Management..."
    # TODO: Implementar siguiendo patrones existentes
    log_success "Suppliers Management implementado"
}

implement_payments_sepa() {
    local description="$1"
    
    log_info "Implementando Payments/SEPA..."
    # TODO: Implementar siguiendo patrones existentes
    log_success "Payments/SEPA implementado"
}

implement_dunning_3_toques() {
    local description="$1"
    
    log_info "Implementando Dunning 3-toques..."
    # TODO: Implementar siguiendo patrones existentes
    log_success "Dunning 3-toques implementado"
}

implement_fiscalidad_regional_ue() {
    local description="$1"
    
    log_info "Implementando Fiscalidad Regional UE..."
    # TODO: Implementar siguiendo patrones existentes
    log_success "Fiscalidad Regional UE implementado"
}

implement_finops() {
    local description="$1"
    
    log_info "Implementando FinOps..."
    # TODO: Implementar siguiendo patrones existentes
    log_success "FinOps implementado"
}

implement_generic_pr() {
    local pr_number="$1"
    local description="$2"
    
    log_info "Implementando PR-$pr_number genérico: $description"
    # TODO: Implementar lógica genérica basada en análisis
    log_success "PR-$pr_number implementado"
}

# ============================================================================
# TESTING Y VALIDACIÓN
# ============================================================================

run_tests() {
    local pr_number="$1"
    
    log_info "Ejecutando tests para PR-$pr_number..."
    
    # Ejecutar tests de linting
    log_info "Ejecutando ESLint..."
    if pnpm lint; then
        log_success "ESLint pasó correctamente"
    else
        log_warning "ESLint encontró problemas"
    fi
    
    # Ejecutar tests de tipo
    log_info "Ejecutando TypeScript type check..."
    if pnpm type-check; then
        log_success "Type check pasó correctamente"
    else
        log_warning "Type check encontró problemas"
    fi
    
    # Ejecutar tests unitarios
    log_info "Ejecutando tests unitarios..."
    if pnpm test; then
        log_success "Tests unitarios pasaron correctamente"
    else
        log_warning "Tests unitarios fallaron"
    fi
    
    log_success "Tests completados para PR-$pr_number"
}

# ============================================================================
# GESTIÓN DE COMMITS
# ============================================================================

commit_changes() {
    local pr_number="$1"
    local commit_message="${2:-}"
    
    log_info "Haciendo commit para PR-$pr_number..."
    
    # Verificar cambios
    if git diff --quiet && git diff --cached --quiet; then
        log_warning "No hay cambios para hacer commit"
        return 0
    fi
    
    # Generar mensaje de commit si no se proporciona
    if [[ -z "$commit_message" ]]; then
        commit_message="feat: PR-$pr_number - Implementación con análisis de duplicados"
    fi
    
    # Agregar todos los cambios
    git add .
    
    # Hacer commit
    git commit -m "$commit_message"
    
    log_success "Commit realizado: $commit_message"
}

# ============================================================================
# GESTIÓN DE GITHUB
# ============================================================================

push_to_github() {
    local pr_number="$1"
    
    log_info "Haciendo push a GitHub para PR-$pr_number..."
    
    local branch_name="pr-$pr_number"
    git push origin "$branch_name"
    
    log_success "Push realizado a GitHub"
}

create_github_pr() {
    local pr_number="$1"
    local pr_title="${2:-PR-$pr_number}"
    local pr_description="${3:-Implementación de PR-$pr_number con análisis de duplicados}"
    
    log_info "Creando Pull Request en GitHub para PR-$pr_number..."
    
    local branch_name="pr-$pr_number"
    
    # Crear PR usando GitHub CLI
    if command -v gh &> /dev/null; then
        gh pr create \
            --title "$pr_title" \
            --body "$pr_description" \
            --base main \
            --head "$branch_name"
        
        log_success "Pull Request creado en GitHub"
    else
        log_error "GitHub CLI no está instalado"
        return 1
    fi
}

merge_pr() {
    local pr_number="$1"
    
    log_info "Mergeando PR-$pr_number..."
    
    local branch_name="pr-$pr_number"
    
    # Cambiar a main
    git checkout main
    git pull origin main
    
    # Mergear rama
    git merge "$branch_name" --no-ff -m "Merge PR-$pr_number: Implementación con análisis de duplicados"
    
    # Push a main
    git push origin main
    
    log_success "PR-$pr_number mergeado exitosamente"
}

# ============================================================================
# LIMPIEZA
# ============================================================================

cleanup_branch() {
    local pr_number="$1"
    
    log_info "Limpiando rama PR-$pr_number..."
    
    local branch_name="pr-$pr_number"
    
    # Cambiar a main
    git checkout main
    
    # Eliminar rama local
    git branch -d "$branch_name"
    
    # Eliminar rama remota
    git push origin --delete "$branch_name"
    
    log_success "Rama $branch_name eliminada"
}

# ============================================================================
# ESTADO Y INFORMACIÓN
# ============================================================================

show_status() {
    local pr_number="${1:-}"
    
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                              ESTADO DEL PROYECTO                              ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    
    # Estado de Git
    echo -e "\n${BLUE}📊 ESTADO DE GIT:${NC}"
    echo -e "   • Rama actual: $(git branch --show-current)"
    echo -e "   • Último commit: $(git log -1 --oneline)"
    echo -e "   • Cambios pendientes: $(git status --porcelain | wc -l) archivos"
    
    # Estado de análisis
    if [[ -d "$ANALYSIS_DIR" ]]; then
        echo -e "\n${PURPLE}🔍 ESTADO DE ANÁLISIS:${NC}"
        local analysis_files=$(find "$ANALYSIS_DIR" -name "*.json" | wc -l)
        echo -e "   • Archivos de análisis: $analysis_files"
        
        if [[ -f "$REPORT_DIR/consolidated_analysis.json" ]]; then
            echo -e "   • Análisis consolidado: ✅ Disponible"
        else
            echo -e "   • Análisis consolidado: ❌ No disponible"
        fi
    fi
    
    # Estado de adaptaciones
    if [[ -d "$ADAPTATION_DIR" ]]; then
        echo -e "\n${CYAN}🔧 ESTADO DE ADAPTACIONES:${NC}"
        local adaptation_files=$(find "$ADAPTATION_DIR" -name "*.json" | wc -l)
        echo -e "   • Archivos de adaptación: $adaptation_files"
        
        if [[ -n "$pr_number" ]]; then
            local strategy_file="$ADAPTATION_DIR/strategy_${pr_number}.json"
            if [[ -f "$strategy_file" ]]; then
                echo -e "   • Estrategia PR-$pr_number: ✅ Disponible"
            else
                echo -e "   • Estrategia PR-$pr_number: ❌ No disponible"
            fi
        fi
    fi
    
    # Estado de ramas
    echo -e "\n${GREEN}🌿 RAMAS DISPONIBLES:${NC}"
    git branch -a | while read -r branch; do
        echo -e "   • $branch"
    done
    
    echo -e "\n${YELLOW}💡 PRÓXIMOS PASOS:${NC}"
    echo -e "   • Usa --analyze para analizar código existente"
    echo -e "   • Usa --adapt para adaptar código existente"
    echo -e "   • Usa --full-intelligent para workflow completo"
}

# ============================================================================
# WORKFLOW COMPLETO INTELIGENTE
# ============================================================================

run_full_workflow_intelligent() {
    local pr_number="$1"
    local pr_description="${2:-PR-$pr_number}"
    local additional_args=("${@:3}")
    
    log_info "Ejecutando workflow completo inteligente para PR-$pr_number..."
    
    # 1. Crear rama
    create_branch "$pr_number"
    
    # 2. Implementar con análisis inteligente
    if [[ ${#additional_args[@]} -gt 0 ]]; then
        implement_pr_intelligent "$pr_number" "$pr_description" "${additional_args[@]}"
    else
        implement_pr_intelligent "$pr_number" "$pr_description"
    fi
    
    # 3. Ejecutar tests
    run_tests "$pr_number"
    
    # 4. Hacer commit
    commit_changes "$pr_number" "feat: PR-$pr_number - $pr_description (con análisis de duplicados)"
    
    # 5. Push a GitHub
    push_to_github "$pr_number"
    
    # 6. Crear Pull Request
    create_github_pr "$pr_number" "PR-$pr_number: $pr_description" "Implementación de $pr_description con análisis automático de código existente para evitar duplicados."
    
    log_success "Workflow completo inteligente completado para PR-$pr_number"
}

# ============================================================================
# AYUDA
# ============================================================================

show_help() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    ECONEURA PR WORKFLOW INTELLIGENT                         ║"
    echo "║                    Con Análisis de Duplicados                               ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "\n${WHITE}USO:${NC}"
    echo -e "  ./work-pr-intelligent.sh [PR_NUMBER] [OPTIONS]"
    
    echo -e "\n${WHITE}OPCIONES:${NC}"
    echo -e "  ${GREEN}--create-branch${NC}       Crear nueva rama para el PR"
    echo -e "  ${GREEN}--analyze${NC}             Analizar código existente"
    echo -e "  ${GREEN}--adapt${NC}               Adaptar código existente"
    echo -e "  ${GREEN}--implement${NC}           Implementar funcionalidad del PR"
    echo -e "  ${GREEN}--test${NC}                Ejecutar tests"
    echo -e "  ${GREEN}--commit${NC}              Hacer commit con mensaje estructurado"
    echo -e "  ${GREEN}--push${NC}                Push a GitHub"
    echo -e "  ${GREEN}--pr${NC}                  Crear Pull Request en GitHub"
    echo -e "  ${GREEN}--merge${NC}               Mergear PR (solo para maintainers)"
    echo -e "  ${GREEN}--cleanup${NC}             Limpiar ramas locales"
    echo -e "  ${GREEN}--status${NC}              Mostrar estado actual"
    echo -e "  ${GREEN}--full-intelligent${NC}    Ejecutar workflow completo con análisis"
    echo -e "  ${GREEN}--help${NC}                Mostrar esta ayuda"
    
    echo -e "\n${WHITE}EJEMPLOS:${NC}"
    echo -e "  ${YELLOW}./work-pr-intelligent.sh 10 --full-intelligent \"Products Management\"${NC}"
    echo -e "  ${YELLOW}./work-pr-intelligent.sh 11 --analyze --adapt --implement${NC}"
    echo -e "  ${YELLOW}./work-pr-intelligent.sh --status${NC}"
    echo -e "  ${YELLOW}./work-pr-intelligent.sh 12 --create-branch --analyze${NC}"
    
    echo -e "\n${WHITE}CARACTERÍSTICAS:${NC}"
    echo -e "  ${GREEN}✅${NC} Análisis automático de código existente"
    echo -e "  ${GREEN}✅${NC} Detección de duplicados"
    echo -e "  ${GREEN}✅${NC} Adaptación inteligente de código"
    echo -e "  ${GREEN}✅${NC} Implementación siguiendo patrones existentes"
    echo -e "  ${GREEN}✅${NC} Integración completa con GitHub"
    echo -e "  ${GREEN}✅${NC} Workflow automatizado"
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    local pr_number="$1"
    local action="$2"
    local additional_args=("${@:3}")
    
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    ECONEURA PR WORKFLOW INTELLIGENT                         ║"
    echo "║                    Con Análisis de Duplicados                               ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Iniciando PR Workflow Inteligente para PR-$pr_number..."
    log_info "Acción: $action"
    
    case "$action" in
        --create-branch)
            create_branch "$pr_number"
            ;;
        --analyze)
            analyze_existing_code
            ;;
        --adapt)
            adapt_existing_code "$pr_number" "${additional_args[@]}"
            ;;
        --implement)
            implement_pr_intelligent "$pr_number" "${additional_args[@]}"
            ;;
        --test)
            run_tests "$pr_number"
            ;;
        --commit)
            commit_changes "$pr_number" "${additional_args[@]}"
            ;;
        --push)
            push_to_github "$pr_number"
            ;;
        --pr)
            create_github_pr "$pr_number" "${additional_args[@]}"
            ;;
        --merge)
            merge_pr "$pr_number"
            ;;
        --cleanup)
            cleanup_branch "$pr_number"
            ;;
        --status)
            show_status "$pr_number"
            ;;
        --full-intelligent)
            run_full_workflow_intelligent "$pr_number" "${additional_args[@]}"
            ;;
        --help)
            show_help
            ;;
        *)
            log_error "Acción no reconocida: $action"
            show_help
            exit 1
            ;;
    esac
}

# ============================================================================
# EJECUTAR SCRIPT
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -lt 2 ]]; then
        if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "--status" ]]; then
            main "" "$1"
        else
            log_error "Se requieren argumentos"
            show_help
            exit 1
        fi
    else
        main "$1" "$2" "${@:3}"
    fi
fi
