#!/bin/bash

# ============================================================================
# ANALYZE EXISTING CODE - Análisis de código existente para evitar duplicados
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
ANALYSIS_DIR="$PROJECT_ROOT/.analysis"
REPORT_DIR="$ANALYSIS_DIR/reports"
TEMP_DIR="$ANALYSIS_DIR/temp"

# Crear directorios necesarios
mkdir -p "$ANALYSIS_DIR" "$REPORT_DIR" "$TEMP_DIR"

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

# ============================================================================
# ANÁLISIS DE ENTIDADES EXISTENTES
# ============================================================================

analyze_entities() {
    log_analysis "Analizando entidades existentes..."
    
    local entities_file="$REPORT_DIR/entities_analysis.json"
    local entities_dir="$PROJECT_ROOT/apps/api/src/domain/entities"
    
    if [[ ! -d "$entities_dir" ]]; then
        log_warning "Directorio de entidades no encontrado: $entities_dir"
        return 1
    fi
    
    # Crear estructura JSON para análisis
    cat > "$entities_file" << 'EOF'
{
  "entities": [],
  "patterns": {
    "common_fields": [],
    "common_methods": [],
    "validation_patterns": [],
    "factory_patterns": []
  },
  "duplicates": [],
  "recommendations": []
}
EOF
    
    # Analizar cada entidad
    while IFS= read -r -d '' entity_file; do
        local entity_name=$(basename "$entity_file" .entity.ts)
        log_info "Analizando entidad: $entity_name"
        
        # Extraer información de la entidad
        local entity_info=$(cat "$entity_file" | jq -R -s -c '
            split("\n") |
            map(select(length > 0)) |
            {
                name: .[0] | capture("export class (?<name>\\w+)") | .name,
                fields: [.[] | select(test("^\\s*get\\s+\\w+")) | capture("get\\s+(?<field>\\w+)") | .field],
                methods: [.[] | select(test("^\\s*\\w+\\s*\\(")) | capture("^\\s*(?<method>\\w+)\\s*\\(") | .method],
                validations: [.[] | select(test("validate|Validation")) | .],
                factories: [.[] | select(test("static\\s+create|Factory")) | .]
            }
        ' 2>/dev/null || echo '{}')
        
        # Agregar a análisis
        jq --arg name "$entity_name" --argjson info "$entity_info" \
           '.entities += [{"name": $name, "info": $info}]' \
           "$entities_file" > "$TEMP_DIR/temp_entities.json" && \
        mv "$TEMP_DIR/temp_entities.json" "$entities_file"
        
    done < <(find "$entities_dir" -name "*.entity.ts" -print0)
    
    log_success "Análisis de entidades completado: $entities_file"
}

# ============================================================================
# ANÁLISIS DE REPOSITORIOS EXISTENTES
# ============================================================================

analyze_repositories() {
    log_analysis "Analizando repositorios existentes..."
    
    local repos_file="$REPORT_DIR/repositories_analysis.json"
    local repos_dir="$PROJECT_ROOT/apps/api/src/domain/repositories"
    
    if [[ ! -d "$repos_dir" ]]; then
        log_warning "Directorio de repositorios no encontrado: $repos_dir"
        return 1
    fi
    
    # Crear estructura JSON para análisis
    cat > "$repos_file" << 'EOF'
{
  "repositories": [],
  "patterns": {
    "common_methods": [],
    "query_patterns": [],
    "filter_patterns": [],
    "stats_patterns": []
  },
  "duplicates": [],
  "recommendations": []
}
EOF
    
    # Analizar cada repositorio
    while IFS= read -r -d '' repo_file; do
        local repo_name=$(basename "$repo_file" .repository.ts)
        log_info "Analizando repositorio: $repo_name"
        
        # Extraer métodos del repositorio
        local methods=$(grep -E "^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(" "$repo_file" | \
                       sed 's/^[[:space:]]*//' | \
                       sed 's/(.*$//' | \
                       sort | uniq)
        
        # Agregar a análisis
        jq --arg name "$repo_name" --arg methods "$methods" \
           '.repositories += [{"name": $name, "methods": ($methods | split("\n") | map(select(length > 0)))}]' \
           "$repos_file" > "$TEMP_DIR/temp_repos.json" && \
        mv "$TEMP_DIR/temp_repos.json" "$repos_file"
        
    done < <(find "$repos_dir" -name "*.repository.ts" -print0)
    
    log_success "Análisis de repositorios completado: $repos_file"
}

# ============================================================================
# ANÁLISIS DE USE CASES EXISTENTES
# ============================================================================

analyze_use_cases() {
    log_analysis "Analizando use cases existentes..."
    
    local usecases_file="$REPORT_DIR/usecases_analysis.json"
    local usecases_dir="$PROJECT_ROOT/apps/api/src/application/use-cases"
    
    if [[ ! -d "$usecases_dir" ]]; then
        log_warning "Directorio de use cases no encontrado: $usecases_dir"
        return 1
    fi
    
    # Crear estructura JSON para análisis
    cat > "$usecases_file" << 'EOF'
{
  "use_cases": [],
  "patterns": {
    "common_validation": [],
    "common_business_logic": [],
    "common_error_handling": [],
    "common_response_patterns": []
  },
  "duplicates": [],
  "recommendations": []
}
EOF
    
    # Analizar cada use case
    while IFS= read -r -d '' usecase_file; do
        local usecase_name=$(basename "$usecase_file" .use-case.ts)
        log_info "Analizando use case: $usecase_name"
        
        # Extraer información del use case
        local class_name=$(grep -E "export class \w+" "$usecase_file" | head -1 | sed 's/export class //' | sed 's/ .*$//')
        local methods=$(grep -E "^\s*async\s+\w+\s*\(" "$usecase_file" | \
                       sed 's/^[[:space:]]*async[[:space:]]*//' | \
                       sed 's/(.*$//' | \
                       sort | uniq)
        
        # Agregar a análisis
        jq --arg name "$usecase_name" --arg class "$class_name" --arg methods "$methods" \
           '.use_cases += [{"name": $name, "class": $class, "methods": ($methods | split("\n") | map(select(length > 0)))}]' \
           "$usecases_file" > "$TEMP_DIR/temp_usecases.json" && \
        mv "$TEMP_DIR/temp_usecases.json" "$usecases_file"
        
    done < <(find "$usecases_dir" -name "*.use-case.ts" -print0)
    
    log_success "Análisis de use cases completado: $usecases_file"
}

# ============================================================================
# ANÁLISIS DE DTOs EXISTENTES
# ============================================================================

analyze_dtos() {
    log_analysis "Analizando DTOs existentes..."
    
    local dtos_file="$REPORT_DIR/dtos_analysis.json"
    local dtos_dir="$PROJECT_ROOT/apps/api/src/presentation/dto"
    
    if [[ ! -d "$dtos_dir" ]]; then
        log_warning "Directorio de DTOs no encontrado: $dtos_dir"
        return 1
    fi
    
    # Crear estructura JSON para análisis
    cat > "$dtos_file" << 'EOF'
{
  "dtos": [],
  "patterns": {
    "common_schemas": [],
    "validation_patterns": [],
    "response_patterns": [],
    "query_patterns": []
  },
  "duplicates": [],
  "recommendations": []
}
EOF
    
    # Analizar cada DTO
    while IFS= read -r -d '' dto_file; do
        local dto_name=$(basename "$dto_file" .dto.ts)
        log_info "Analizando DTO: $dto_name"
        
        # Extraer schemas del DTO
        local schemas=$(grep -E "export const \w+Schema" "$dto_file" | \
                       sed 's/export const //' | \
                       sed 's/Schema.*$//' | \
                       sort | uniq)
        
        # Agregar a análisis
        jq --arg name "$dto_name" --arg schemas "$schemas" \
           '.dtos += [{"name": $name, "schemas": ($schemas | split("\n") | map(select(length > 0)))}]' \
           "$dtos_file" > "$TEMP_DIR/temp_dtos.json" && \
        mv "$TEMP_DIR/temp_dtos.json" "$dtos_file"
        
    done < <(find "$dtos_dir" -name "*.dto.ts" -print0)
    
    log_success "Análisis de DTOs completado: $dtos_file"
}

# ============================================================================
# ANÁLISIS DE CONTROLADORES EXISTENTES
# ============================================================================

analyze_controllers() {
    log_analysis "Analizando controladores existentes..."
    
    local controllers_file="$REPORT_DIR/controllers_analysis.json"
    local controllers_dir="$PROJECT_ROOT/apps/api/src/presentation/controllers"
    
    if [[ ! -d "$controllers_dir" ]]; then
        log_warning "Directorio de controladores no encontrado: $controllers_dir"
        return 1
    fi
    
    # Crear estructura JSON para análisis
    cat > "$controllers_file" << 'EOF'
{
  "controllers": [],
  "patterns": {
    "common_methods": [],
    "common_responses": [],
    "common_error_handling": [],
    "common_validation": []
  },
  "duplicates": [],
  "recommendations": []
}
EOF
    
    # Analizar cada controlador
    while IFS= read -r -d '' controller_file; do
        local controller_name=$(basename "$controller_file" .controller.ts)
        log_info "Analizando controlador: $controller_name"
        
        # Extraer métodos del controlador
        local methods=$(grep -E "^\s*async\s+\w+\s*\(" "$controller_file" | \
                       sed 's/^[[:space:]]*async[[:space:]]*//' | \
                       sed 's/(.*$//' | \
                       sort | uniq)
        
        # Agregar a análisis
        jq --arg name "$controller_name" --arg methods "$methods" \
           '.controllers += [{"name": $name, "methods": ($methods | split("\n") | map(select(length > 0)))}]' \
           "$controllers_file" > "$TEMP_DIR/temp_controllers.json" && \
        mv "$TEMP_DIR/temp_controllers.json" "$controllers_file"
        
    done < <(find "$controllers_dir" -name "*.controller.ts" -print0)
    
    log_success "Análisis de controladores completado: $controllers_file"
}

# ============================================================================
# ANÁLISIS DE RUTAS EXISTENTES
# ============================================================================

analyze_routes() {
    log_analysis "Analizando rutas existentes..."
    
    local routes_file="$REPORT_DIR/routes_analysis.json"
    local routes_dir="$PROJECT_ROOT/apps/api/src/presentation/routes"
    
    if [[ ! -d "$routes_dir" ]]; then
        log_warning "Directorio de rutas no encontrado: $routes_dir"
        return 1
    fi
    
    # Crear estructura JSON para análisis
    cat > "$routes_file" << 'EOF'
{
  "routes": [],
  "patterns": {
    "common_endpoints": [],
    "common_middleware": [],
    "common_validation": [],
    "common_authorization": []
  },
  "duplicates": [],
  "recommendations": []
}
EOF
    
    # Analizar cada archivo de rutas
    while IFS= read -r -d '' route_file; do
        local route_name=$(basename "$route_file" .routes.ts)
        log_info "Analizando rutas: $route_name"
        
        # Extraer endpoints de las rutas
        local endpoints=$(grep -E "router\.(get|post|put|patch|delete)" "$route_file" | \
                         sed 's/.*router\.//' | \
                         sed 's/(.*$//' | \
                         sort | uniq)
        
        # Agregar a análisis
        jq --arg name "$route_name" --arg endpoints "$endpoints" \
           '.routes += [{"name": $name, "endpoints": ($endpoints | split("\n") | map(select(length > 0)))}]' \
           "$routes_file" > "$TEMP_DIR/temp_routes.json" && \
        mv "$TEMP_DIR/temp_routes.json" "$routes_file"
        
    done < <(find "$routes_dir" -name "*.routes.ts" -print0)
    
    log_success "Análisis de rutas completado: $routes_file"
}

# ============================================================================
# DETECCIÓN DE DUPLICADOS
# ============================================================================

detect_duplicates() {
    log_analysis "Detectando duplicados en el código..."
    
    local duplicates_file="$REPORT_DIR/duplicates_analysis.json"
    
    # Crear estructura JSON para duplicados
    cat > "$duplicates_file" << 'EOF'
{
  "entity_duplicates": [],
  "repository_duplicates": [],
  "usecase_duplicates": [],
  "dto_duplicates": [],
  "controller_duplicates": [],
  "route_duplicates": [],
  "code_duplicates": [],
  "recommendations": []
}
EOF
    
    # Detectar duplicados en entidades
    log_info "Detectando duplicados en entidades..."
    local entities_dir="$PROJECT_ROOT/apps/api/src/domain/entities"
    if [[ -d "$entities_dir" ]]; then
        # Buscar patrones similares en entidades
        find "$entities_dir" -name "*.entity.ts" -exec grep -l "export class" {} \; | \
        while read -r file1; do
            find "$entities_dir" -name "*.entity.ts" -exec grep -l "export class" {} \; | \
            while read -r file2; do
                if [[ "$file1" != "$file2" ]]; then
                    local similarity=$(diff -u "$file1" "$file2" | wc -l)
                    if [[ $similarity -lt 50 ]]; then
                        jq --arg file1 "$file1" --arg file2 "$file2" --arg similarity "$similarity" \
                           '.entity_duplicates += [{"file1": $file1, "file2": $file2, "similarity": ($similarity | tonumber)}]' \
                           "$duplicates_file" > "$TEMP_DIR/temp_duplicates.json" && \
                        mv "$TEMP_DIR/temp_duplicates.json" "$duplicates_file"
                    fi
                fi
            done
        done
    fi
    
    # Detectar duplicados en repositorios
    log_info "Detectando duplicados en repositorios..."
    local repos_dir="$PROJECT_ROOT/apps/api/src/domain/repositories"
    if [[ -d "$repos_dir" ]]; then
        find "$repos_dir" -name "*.repository.ts" -exec grep -l "interface" {} \; | \
        while read -r file1; do
            find "$repos_dir" -name "*.repository.ts" -exec grep -l "interface" {} \; | \
            while read -r file2; do
                if [[ "$file1" != "$file2" ]]; then
                    local similarity=$(diff -u "$file1" "$file2" | wc -l)
                    if [[ $similarity -lt 100 ]]; then
                        jq --arg file1 "$file1" --arg file2 "$file2" --arg similarity "$similarity" \
                           '.repository_duplicates += [{"file1": $file1, "file2": $file2, "similarity": ($similarity | tonumber)}]' \
                           "$duplicates_file" > "$TEMP_DIR/temp_duplicates.json" && \
                        mv "$TEMP_DIR/temp_duplicates.json" "$duplicates_file"
                    fi
                fi
            done
        done
    fi
    
    log_success "Detección de duplicados completada: $duplicates_file"
}

# ============================================================================
# GENERACIÓN DE RECOMENDACIONES
# ============================================================================

generate_recommendations() {
    log_analysis "Generando recomendaciones de mejora..."
    
    local recommendations_file="$REPORT_DIR/recommendations.json"
    
    # Crear estructura JSON para recomendaciones
    cat > "$recommendations_file" << 'EOF'
{
  "consolidation_opportunities": [],
  "refactoring_suggestions": [],
  "pattern_improvements": [],
  "duplicate_removals": [],
  "code_optimizations": [],
  "architecture_improvements": []
}
EOF
    
    # Analizar archivos de análisis para generar recomendaciones
    if [[ -f "$REPORT_DIR/duplicates_analysis.json" ]]; then
        # Recomendaciones basadas en duplicados
        jq -r '.entity_duplicates[]? | select(.similarity < 30) | "Consolidar entidades similares: \(.file1) y \(.file2)"' \
           "$REPORT_DIR/duplicates_analysis.json" | \
        while read -r recommendation; do
            jq --arg rec "$recommendation" \
               '.consolidation_opportunities += [$rec]' \
               "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
            mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
        done
    fi
    
    # Recomendaciones de patrones comunes
    jq '.consolidation_opportunities += [
        "Crear base classes para entidades con campos comunes",
        "Implementar interfaces base para repositorios",
        "Establecer patrones estándar para use cases",
        "Unificar esquemas de validación en DTOs",
        "Estandarizar respuestas de controladores",
        "Consolidar middleware común en rutas"
    ]' "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
    mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
    
    log_success "Recomendaciones generadas: $recommendations_file"
}

# ============================================================================
# GENERACIÓN DE REPORTE CONSOLIDADO
# ============================================================================

generate_consolidated_report() {
    log_analysis "Generando reporte consolidado..."
    
    local consolidated_file="$REPORT_DIR/consolidated_analysis.json"
    
    # Crear reporte consolidado
    cat > "$consolidated_file" << 'EOF'
{
  "analysis_timestamp": "",
  "project_structure": {
    "entities": 0,
    "repositories": 0,
    "use_cases": 0,
    "dtos": 0,
    "controllers": 0,
    "routes": 0
  },
  "code_quality": {
    "duplicates_found": 0,
    "consolidation_opportunities": 0,
    "refactoring_suggestions": 0
  },
  "recommendations": {
    "high_priority": [],
    "medium_priority": [],
    "low_priority": []
  },
  "next_steps": []
}
EOF
    
    # Actualizar timestamp
    jq --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.analysis_timestamp = $timestamp' \
       "$consolidated_file" > "$TEMP_DIR/temp_consolidated.json" && \
    mv "$TEMP_DIR/temp_consolidated.json" "$consolidated_file"
    
    # Contar archivos por tipo
    local entities_count=$(find "$PROJECT_ROOT/apps/api/src/domain/entities" -name "*.entity.ts" 2>/dev/null | wc -l)
    local repos_count=$(find "$PROJECT_ROOT/apps/api/src/domain/repositories" -name "*.repository.ts" 2>/dev/null | wc -l)
    local usecases_count=$(find "$PROJECT_ROOT/apps/api/src/application/use-cases" -name "*.use-case.ts" 2>/dev/null | wc -l)
    local dtos_count=$(find "$PROJECT_ROOT/apps/api/src/presentation/dto" -name "*.dto.ts" 2>/dev/null | wc -l)
    local controllers_count=$(find "$PROJECT_ROOT/apps/api/src/presentation/controllers" -name "*.controller.ts" 2>/dev/null | wc -l)
    local routes_count=$(find "$PROJECT_ROOT/apps/api/src/presentation/routes" -name "*.routes.ts" 2>/dev/null | wc -l)
    
    jq --argjson entities "$entities_count" \
       --argjson repos "$repos_count" \
       --argjson usecases "$usecases_count" \
       --argjson dtos "$dtos_count" \
       --argjson controllers "$controllers_count" \
       --argjson routes "$routes_count" \
       '.project_structure.entities = $entities |
        .project_structure.repositories = $repos |
        .project_structure.use_cases = $usecases |
        .project_structure.dtos = $dtos |
        .project_structure.controllers = $controllers |
        .project_structure.routes = $routes' \
       "$consolidated_file" > "$TEMP_DIR/temp_consolidated.json" && \
    mv "$TEMP_DIR/temp_consolidated.json" "$consolidated_file"
    
    # Agregar próximos pasos
    jq '.next_steps = [
        "Revisar duplicados identificados",
        "Implementar consolidaciones recomendadas",
        "Aplicar patrones estándar",
        "Optimizar código existente",
        "Documentar mejoras implementadas"
    ]' "$consolidated_file" > "$TEMP_DIR/temp_consolidated.json" && \
    mv "$TEMP_DIR/temp_consolidated.json" "$consolidated_file"
    
    log_success "Reporte consolidado generado: $consolidated_file"
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    ECONEURA CODE ANALYSIS TOOL                               ║"
    echo "║                    Análisis de Código Existente                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Iniciando análisis de código existente..."
    log_info "Directorio del proyecto: $PROJECT_ROOT"
    log_info "Directorio de análisis: $ANALYSIS_DIR"
    
    # Ejecutar análisis
    analyze_entities
    analyze_repositories
    analyze_use_cases
    analyze_dtos
    analyze_controllers
    analyze_routes
    detect_duplicates
    generate_recommendations
    generate_consolidated_report
    
    # Mostrar resumen
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                            ANÁLISIS COMPLETADO                                ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    
    if [[ -f "$REPORT_DIR/consolidated_analysis.json" ]]; then
        echo -e "\n${CYAN}📊 RESUMEN DEL ANÁLISIS:${NC}"
        jq -r '
            "📁 Estructura del Proyecto:",
            "   • Entidades: " + (.project_structure.entities | tostring),
            "   • Repositorios: " + (.project_structure.repositories | tostring),
            "   • Use Cases: " + (.project_structure.use_cases | tostring),
            "   • DTOs: " + (.project_structure.dtos | tostring),
            "   • Controladores: " + (.project_structure.controllers | tostring),
            "   • Rutas: " + (.project_structure.routes | tostring),
            "",
            "🎯 PRÓXIMOS PASOS:",
            (.next_steps[] | "   • " + .)
        ' "$REPORT_DIR/consolidated_analysis.json"
    fi
    
    echo -e "\n${CYAN}📁 ARCHIVOS GENERADOS:${NC}"
    echo -e "   • $REPORT_DIR/entities_analysis.json"
    echo -e "   • $REPORT_DIR/repositories_analysis.json"
    echo -e "   • $REPORT_DIR/usecases_analysis.json"
    echo -e "   • $REPORT_DIR/dtos_analysis.json"
    echo -e "   • $REPORT_DIR/controllers_analysis.json"
    echo -e "   • $REPORT_DIR/routes_analysis.json"
    echo -e "   • $REPORT_DIR/duplicates_analysis.json"
    echo -e "   • $REPORT_DIR/recommendations.json"
    echo -e "   • $REPORT_DIR/consolidated_analysis.json"
    
    echo -e "\n${GREEN}✅ Análisis completado exitosamente!${NC}"
    echo -e "${YELLOW}💡 Usa estos archivos para evitar duplicados en futuros PRs${NC}"
}

# ============================================================================
# EJECUTAR ANÁLISIS
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
