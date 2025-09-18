#!/bin/bash

# ============================================================================
# DEDUPLICATE CODE - Herramienta de deduplicación de código
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
DEDUPLICATION_DIR="$ANALYSIS_DIR/deduplication"
TEMP_DIR="$ANALYSIS_DIR/temp"

# Crear directorios necesarios
mkdir -p "$ANALYSIS_DIR" "$REPORT_DIR" "$DEDUPLICATION_DIR" "$TEMP_DIR"

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

log_deduplication() {
    echo -e "${PURPLE}[DEDUPLICATION]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ============================================================================
# DETECCIÓN DE DUPLICADOS EN ENTIDADES
# ============================================================================

detect_entity_duplicates() {
    log_deduplication "Detectando duplicados en entidades..."
    
    local entities_dir="$PROJECT_ROOT/apps/api/src/domain/entities"
    local duplicates_file="$DEDUPLICATION_DIR/entity_duplicates.json"
    
    if [[ ! -d "$entities_dir" ]]; then
        log_warning "Directorio de entidades no encontrado: $entities_dir"
        return 1
    fi
    
    # Crear estructura JSON para duplicados
    cat > "$duplicates_file" << 'EOF'
{
  "duplicates": [],
  "similarities": [],
  "consolidation_opportunities": [],
  "recommendations": []
}
EOF
    
    # Buscar entidades similares
    local entities=()
    while IFS= read -r -d '' entity_file; do
        entities+=("$entity_file")
    done < <(find "$entities_dir" -name "*.entity.ts" -print0)
    
    # Comparar cada par de entidades
    for i in "${!entities[@]}"; do
        for j in "${!entities[@]}"; do
            if [[ $i -lt $j ]]; then
                local file1="${entities[$i]}"
                local file2="${entities[$j]}"
                local name1=$(basename "$file1" .entity.ts)
                local name2=$(basename "$file2" .entity.ts)
                
                # Calcular similitud
                local similarity=$(calculate_file_similarity "$file1" "$file2")
                
                if [[ $similarity -gt 70 ]]; then
                    log_warning "Entidades similares encontradas: $name1 y $name2 (${similarity}% similitud)"
                    
                    # Agregar a duplicados
                    jq --arg name1 "$name1" --arg name2 "$name2" --arg file1 "$file1" --arg file2 "$file2" --argjson similarity "$similarity" \
                       '.duplicates += [{"entity1": $name1, "entity2": $name2, "file1": $file1, "file2": $file2, "similarity": $similarity}]' \
                       "$duplicates_file" > "$TEMP_DIR/temp_duplicates.json" && \
                    mv "$TEMP_DIR/temp_duplicates.json" "$duplicates_file"
                fi
            fi
        done
    done
    
    log_success "Detección de duplicados en entidades completada: $duplicates_file"
}

# ============================================================================
# DETECCIÓN DE DUPLICADOS EN REPOSITORIOS
# ============================================================================

detect_repository_duplicates() {
    log_deduplication "Detectando duplicados en repositorios..."
    
    local repos_dir="$PROJECT_ROOT/apps/api/src/domain/repositories"
    local duplicates_file="$DEDUPLICATION_DIR/repository_duplicates.json"
    
    if [[ ! -d "$repos_dir" ]]; then
        log_warning "Directorio de repositorios no encontrado: $repos_dir"
        return 1
    fi
    
    # Crear estructura JSON para duplicados
    cat > "$duplicates_file" << 'EOF'
{
  "duplicates": [],
  "similarities": [],
  "consolidation_opportunities": [],
  "recommendations": []
}
EOF
    
    # Buscar repositorios similares
    local repos=()
    while IFS= read -r -d '' repo_file; do
        repos+=("$repo_file")
    done < <(find "$repos_dir" -name "*.repository.ts" -print0)
    
    # Comparar cada par de repositorios
    for i in "${!repos[@]}"; do
        for j in "${!repos[@]}"; do
            if [[ $i -lt $j ]]; then
                local file1="${repos[$i]}"
                local file2="${repos[$j]}"
                local name1=$(basename "$file1" .repository.ts)
                local name2=$(basename "$file2" .repository.ts)
                
                # Calcular similitud
                local similarity=$(calculate_file_similarity "$file1" "$file2")
                
                if [[ $similarity -gt 60 ]]; then
                    log_warning "Repositorios similares encontrados: $name1 y $name2 (${similarity}% similitud)"
                    
                    # Agregar a duplicados
                    jq --arg name1 "$name1" --arg name2 "$name2" --arg file1 "$file1" --arg file2 "$file2" --argjson similarity "$similarity" \
                       '.duplicates += [{"repo1": $name1, "repo2": $name2, "file1": $file1, "file2": $file2, "similarity": $similarity}]' \
                       "$duplicates_file" > "$TEMP_DIR/temp_duplicates.json" && \
                    mv "$TEMP_DIR/temp_duplicates.json" "$duplicates_file"
                fi
            fi
        done
    done
    
    log_success "Detección de duplicados en repositorios completada: $duplicates_file"
}

# ============================================================================
# DETECCIÓN DE DUPLICADOS EN USE CASES
# ============================================================================

detect_usecase_duplicates() {
    log_deduplication "Detectando duplicados en use cases..."
    
    local usecases_dir="$PROJECT_ROOT/apps/api/src/application/use-cases"
    local duplicates_file="$DEDUPLICATION_DIR/usecase_duplicates.json"
    
    if [[ ! -d "$usecases_dir" ]]; then
        log_warning "Directorio de use cases no encontrado: $usecases_dir"
        return 1
    fi
    
    # Crear estructura JSON para duplicados
    cat > "$duplicates_file" << 'EOF'
{
  "duplicates": [],
  "similarities": [],
  "consolidation_opportunities": [],
  "recommendations": []
}
EOF
    
    # Buscar use cases similares
    local usecases=()
    while IFS= read -r -d '' usecase_file; do
        usecases+=("$usecase_file")
    done < <(find "$usecases_dir" -name "*.use-case.ts" -print0)
    
    # Comparar cada par de use cases
    for i in "${!usecases[@]}"; do
        for j in "${!usecases[@]}"; do
            if [[ $i -lt $j ]]; then
                local file1="${usecases[$i]}"
                local file2="${usecases[$j]}"
                local name1=$(basename "$file1" .use-case.ts)
                local name2=$(basename "$file2" .use-case.ts)
                
                # Calcular similitud
                local similarity=$(calculate_file_similarity "$file1" "$file2")
                
                if [[ $similarity -gt 50 ]]; then
                    log_warning "Use cases similares encontrados: $name1 y $name2 (${similarity}% similitud)"
                    
                    # Agregar a duplicados
                    jq --arg name1 "$name1" --arg name2 "$name2" --arg file1 "$file1" --arg file2 "$file2" --argjson similarity "$similarity" \
                       '.duplicates += [{"usecase1": $name1, "usecase2": $name2, "file1": $file1, "file2": $file2, "similarity": $similarity}]' \
                       "$duplicates_file" > "$TEMP_DIR/temp_duplicates.json" && \
                    mv "$TEMP_DIR/temp_duplicates.json" "$duplicates_file"
                fi
            fi
        done
    done
    
    log_success "Detección de duplicados en use cases completada: $duplicates_file"
}

# ============================================================================
# DETECCIÓN DE DUPLICADOS EN DTOs
# ============================================================================

detect_dto_duplicates() {
    log_deduplication "Detectando duplicados en DTOs..."
    
    local dtos_dir="$PROJECT_ROOT/apps/api/src/presentation/dto"
    local duplicates_file="$DEDUPLICATION_DIR/dto_duplicates.json"
    
    if [[ ! -d "$dtos_dir" ]]; then
        log_warning "Directorio de DTOs no encontrado: $dtos_dir"
        return 1
    fi
    
    # Crear estructura JSON para duplicados
    cat > "$duplicates_file" << 'EOF'
{
  "duplicates": [],
  "similarities": [],
  "consolidation_opportunities": [],
  "recommendations": []
}
EOF
    
    # Buscar DTOs similares
    local dtos=()
    while IFS= read -r -d '' dto_file; do
        dtos+=("$dto_file")
    done < <(find "$dtos_dir" -name "*.dto.ts" -print0)
    
    # Comparar cada par de DTOs
    for i in "${!dtos[@]}"; do
        for j in "${!dtos[@]}"; do
            if [[ $i -lt $j ]]; then
                local file1="${dtos[$i]}"
                local file2="${dtos[$j]}"
                local name1=$(basename "$file1" .dto.ts)
                local name2=$(basename "$file2" .dto.ts)
                
                # Calcular similitud
                local similarity=$(calculate_file_similarity "$file1" "$file2")
                
                if [[ $similarity -gt 40 ]]; then
                    log_warning "DTOs similares encontrados: $name1 y $name2 (${similarity}% similitud)"
                    
                    # Agregar a duplicados
                    jq --arg name1 "$name1" --arg name2 "$name2" --arg file1 "$file1" --arg file2 "$file2" --argjson similarity "$similarity" \
                       '.duplicates += [{"dto1": $name1, "dto2": $name2, "file1": $file1, "file2": $file2, "similarity": $similarity}]' \
                       "$duplicates_file" > "$TEMP_DIR/temp_duplicates.json" && \
                    mv "$TEMP_DIR/temp_duplicates.json" "$duplicates_file"
                fi
            fi
        done
    done
    
    log_success "Detección de duplicados en DTOs completada: $duplicates_file"
}

# ============================================================================
# CÁLCULO DE SIMILITUD DE ARCHIVOS
# ============================================================================

calculate_file_similarity() {
    local file1="$1"
    local file2="$2"
    
    # Usar diff para calcular similitud
    local total_lines=$(wc -l < "$file1")
    local diff_lines=$(diff -u "$file1" "$file2" | wc -l)
    
    # Calcular porcentaje de similitud
    local similarity=$((100 - (diff_lines * 100 / total_lines)))
    
    # Asegurar que el resultado esté entre 0 y 100
    if [[ $similarity -lt 0 ]]; then
        similarity=0
    elif [[ $similarity -gt 100 ]]; then
        similarity=100
    fi
    
    echo "$similarity"
}

# ============================================================================
# GENERACIÓN DE RECOMENDACIONES DE CONSOLIDACIÓN
# ============================================================================

generate_consolidation_recommendations() {
    log_deduplication "Generando recomendaciones de consolidación..."
    
    local recommendations_file="$DEDUPLICATION_DIR/consolidation_recommendations.json"
    
    # Crear estructura JSON para recomendaciones
    cat > "$recommendations_file" << 'EOF'
{
  "entity_recommendations": [],
  "repository_recommendations": [],
  "usecase_recommendations": [],
  "dto_recommendations": [],
  "general_recommendations": [],
  "implementation_plan": []
}
EOF
    
    # Analizar duplicados de entidades
    local entity_duplicates_file="$DEDUPLICATION_DIR/entity_duplicates.json"
    if [[ -f "$entity_duplicates_file" ]]; then
        jq -r '.duplicates[]? | select(.similarity > 80) | "Consolidar entidades \(.entity1) y \(.entity2) (similitud: \(.similarity)%)"' \
           "$entity_duplicates_file" | \
        while read -r recommendation; do
            jq --arg rec "$recommendation" \
               '.entity_recommendations += [$rec]' \
               "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
            mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
        done
    fi
    
    # Analizar duplicados de repositorios
    local repo_duplicates_file="$DEDUPLICATION_DIR/repository_duplicates.json"
    if [[ -f "$repo_duplicates_file" ]]; then
        jq -r '.duplicates[]? | select(.similarity > 70) | "Consolidar repositorios \(.repo1) y \(.repo2) (similitud: \(.similarity)%)"' \
           "$repo_duplicates_file" | \
        while read -r recommendation; do
            jq --arg rec "$recommendation" \
               '.repository_recommendations += [$rec]' \
               "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
            mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
        done
    fi
    
    # Analizar duplicados de use cases
    local usecase_duplicates_file="$DEDUPLICATION_DIR/usecase_duplicates.json"
    if [[ -f "$usecase_duplicates_file" ]]; then
        jq -r '.duplicates[]? | select(.similarity > 60) | "Consolidar use cases \(.usecase1) y \(.usecase2) (similitud: \(.similarity)%)"' \
           "$usecase_duplicates_file" | \
        while read -r recommendation; do
            jq --arg rec "$recommendation" \
               '.usecase_recommendations += [$rec]' \
               "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
            mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
        done
    fi
    
    # Analizar duplicados de DTOs
    local dto_duplicates_file="$DEDUPLICATION_DIR/dto_duplicates.json"
    if [[ -f "$dto_duplicates_file" ]]; then
        jq -r '.duplicates[]? | select(.similarity > 50) | "Consolidar DTOs \(.dto1) y \(.dto2) (similitud: \(.similarity)%)"' \
           "$dto_duplicates_file" | \
        while read -r recommendation; do
            jq --arg rec "$recommendation" \
               '.dto_recommendations += [$rec]' \
               "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
            mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
        done
    fi
    
    # Agregar recomendaciones generales
    jq '.general_recommendations = [
        "Crear clases base para entidades con campos comunes",
        "Implementar interfaces base para repositorios",
        "Establecer patrones estándar para use cases",
        "Unificar esquemas de validación en DTOs",
        "Consolidar middleware común en controladores",
        "Estandarizar respuestas de API"
    ]' "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
    mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
    
    # Agregar plan de implementación
    jq '.implementation_plan = [
        {
            "phase": 1,
            "name": "Análisis y Preparación",
            "description": "Analizar duplicados y preparar consolidaciones",
            "estimated_hours": 2
        },
        {
            "phase": 2,
            "name": "Consolidación de Entidades",
            "description": "Consolidar entidades duplicadas",
            "estimated_hours": 4
        },
        {
            "phase": 3,
            "name": "Consolidación de Repositorios",
            "description": "Consolidar repositorios duplicados",
            "estimated_hours": 3
        },
        {
            "phase": 4,
            "name": "Consolidación de Use Cases",
            "description": "Consolidar use cases duplicados",
            "estimated_hours": 3
        },
        {
            "phase": 5,
            "name": "Consolidación de DTOs",
            "description": "Consolidar DTOs duplicados",
            "estimated_hours": 2
        },
        {
            "phase": 6,
            "name": "Validación y Testing",
            "description": "Validar consolidaciones y ejecutar tests",
            "estimated_hours": 2
        }
    ]' "$recommendations_file" > "$TEMP_DIR/temp_recommendations.json" && \
    mv "$TEMP_DIR/temp_recommendations.json" "$recommendations_file"
    
    log_success "Recomendaciones de consolidación generadas: $recommendations_file"
}

# ============================================================================
# GENERACIÓN DE REPORTE CONSOLIDADO
# ============================================================================

generate_consolidated_report() {
    log_deduplication "Generando reporte consolidado de deduplicación..."
    
    local consolidated_file="$DEDUPLICATION_DIR/consolidated_deduplication_report.json"
    
    # Crear reporte consolidado
    cat > "$consolidated_file" << 'EOF'
{
  "report_timestamp": "",
  "summary": {
    "total_duplicates_found": 0,
    "entity_duplicates": 0,
    "repository_duplicates": 0,
    "usecase_duplicates": 0,
    "dto_duplicates": 0,
    "consolidation_opportunities": 0
  },
  "duplicates": {
    "entities": [],
    "repositories": [],
    "use_cases": [],
    "dtos": []
  },
  "recommendations": {
    "high_priority": [],
    "medium_priority": [],
    "low_priority": []
  },
  "implementation_plan": [],
  "benefits": [],
  "next_steps": []
}
EOF
    
    # Actualizar timestamp
    jq --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
       '.report_timestamp = $timestamp' \
       "$consolidated_file" > "$TEMP_DIR/temp_consolidated.json" && \
    mv "$TEMP_DIR/temp_consolidated.json" "$consolidated_file"
    
    # Contar duplicados
    local entity_count=0
    local repo_count=0
    local usecase_count=0
    local dto_count=0
    
    if [[ -f "$DEDUPLICATION_DIR/entity_duplicates.json" ]]; then
        entity_count=$(jq '.duplicates | length' "$DEDUPLICATION_DIR/entity_duplicates.json")
    fi
    
    if [[ -f "$DEDUPLICATION_DIR/repository_duplicates.json" ]]; then
        repo_count=$(jq '.duplicates | length' "$DEDUPLICATION_DIR/repository_duplicates.json")
    fi
    
    if [[ -f "$DEDUPLICATION_DIR/usecase_duplicates.json" ]]; then
        usecase_count=$(jq '.duplicates | length' "$DEDUPLICATION_DIR/usecase_duplicates.json")
    fi
    
    if [[ -f "$DEDUPLICATION_DIR/dto_duplicates.json" ]]; then
        dto_count=$(jq '.duplicates | length' "$DEDUPLICATION_DIR/dto_duplicates.json")
    fi
    
    local total_duplicates=$((entity_count + repo_count + usecase_count + dto_count))
    
    # Actualizar resumen
    jq --argjson total "$total_duplicates" \
       --argjson entities "$entity_count" \
       --argjson repos "$repo_count" \
       --argjson usecases "$usecase_count" \
       --argjson dtos "$dto_count" \
       '.summary.total_duplicates_found = $total |
        .summary.entity_duplicates = $entities |
        .summary.repository_duplicates = $repos |
        .summary.usecase_duplicates = $usecases |
        .summary.dto_duplicates = $dtos |
        .summary.consolidation_opportunities = $total' \
       "$consolidated_file" > "$TEMP_DIR/temp_consolidated.json" && \
    mv "$TEMP_DIR/temp_consolidated.json" "$consolidated_file"
    
    # Agregar beneficios
    jq '.benefits = [
        "Reduce la complejidad del código",
        "Mejora la mantenibilidad",
        "Elimina inconsistencias",
        "Facilita la comprensión del código",
        "Reduce el tiempo de desarrollo",
        "Mejora la calidad del código"
    ]' "$consolidated_file" > "$TEMP_DIR/temp_consolidated.json" && \
    mv "$TEMP_DIR/temp_consolidated.json" "$consolidated_file"
    
    # Agregar próximos pasos
    jq '.next_steps = [
        "Revisar duplicados identificados",
        "Priorizar consolidaciones por impacto",
        "Implementar consolidaciones en fases",
        "Validar cambios con tests",
        "Documentar mejoras implementadas",
        "Establecer patrones para evitar futuros duplicados"
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
    echo "║                    ECONEURA CODE DEDUPLICATION TOOL                         ║"
    echo "║                    Herramienta de Deduplicación de Código                   ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Iniciando proceso de deduplicación de código..."
    log_info "Directorio del proyecto: $PROJECT_ROOT"
    log_info "Directorio de deduplicación: $DEDUPLICATION_DIR"
    
    # Ejecutar detección de duplicados
    detect_entity_duplicates
    detect_repository_duplicates
    detect_usecase_duplicates
    detect_dto_duplicates
    
    # Generar recomendaciones
    generate_consolidation_recommendations
    
    # Generar reporte consolidado
    generate_consolidated_report
    
    # Mostrar resumen
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                            DEDUPLICACIÓN COMPLETADA                            ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    
    if [[ -f "$DEDUPLICATION_DIR/consolidated_deduplication_report.json" ]]; then
        echo -e "\n${CYAN}📊 RESUMEN DE DEDUPLICACIÓN:${NC}"
        jq -r '
            "📁 Duplicados Encontrados:",
            "   • Total: " + (.summary.total_duplicates_found | tostring),
            "   • Entidades: " + (.summary.entity_duplicates | tostring),
            "   • Repositorios: " + (.summary.repository_duplicates | tostring),
            "   • Use Cases: " + (.summary.usecase_duplicates | tostring),
            "   • DTOs: " + (.summary.dto_duplicates | tostring),
            "",
            "🎯 PRÓXIMOS PASOS:",
            (.next_steps[] | "   • " + .)
        ' "$DEDUPLICATION_DIR/consolidated_deduplication_report.json"
    fi
    
    echo -e "\n${CYAN}📁 ARCHIVOS GENERADOS:${NC}"
    echo -e "   • $DEDUPLICATION_DIR/entity_duplicates.json"
    echo -e "   • $DEDUPLICATION_DIR/repository_duplicates.json"
    echo -e "   • $DEDUPLICATION_DIR/usecase_duplicates.json"
    echo -e "   • $DEDUPLICATION_DIR/dto_duplicates.json"
    echo -e "   • $DEDUPLICATION_DIR/consolidation_recommendations.json"
    echo -e "   • $DEDUPLICATION_DIR/consolidated_deduplication_report.json"
    
    echo -e "\n${GREEN}✅ Deduplicación completada exitosamente!${NC}"
    echo -e "${YELLOW}💡 Revisa los archivos generados para implementar las consolidaciones${NC}"
}

# ============================================================================
# EJECUTAR DEDUPLICACIÓN
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
