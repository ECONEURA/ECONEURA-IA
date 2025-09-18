#!/bin/bash

# ============================================================================
# ADAPT EXISTING CODE - Adaptación de código existente para evitar duplicados
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
ADAPTATION_DIR="$ANALYSIS_DIR/adaptations"
TEMP_DIR="$ANALYSIS_DIR/temp"

# Crear directorios necesarios
mkdir -p "$ANALYSIS_DIR" "$REPORT_DIR" "$ADAPTATION_DIR" "$TEMP_DIR"

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

log_adaptation() {
    echo -e "${PURPLE}[ADAPTATION]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ============================================================================
# ANÁLISIS DE PR SOLICITADO
# ============================================================================

analyze_pr_request() {
    local pr_number="$1"
    local pr_description="$2"
    
    log_adaptation "Analizando solicitud de PR-$pr_number: $pr_description"
    
    local pr_analysis_file="$ADAPTATION_DIR/pr_${pr_number}_analysis.json"
    
    # Crear análisis de la solicitud PR
    cat > "$pr_analysis_file" << 'EOF'
{
  "pr_number": "",
  "description": "",
  "requested_features": [],
  "existing_similar_code": [],
  "adaptation_strategy": {
    "extend_existing": [],
    "modify_existing": [],
    "create_new": [],
    "consolidate": []
  },
  "implementation_plan": [],
  "files_to_modify": [],
  "files_to_create": [],
  "files_to_remove": []
}
EOF
    
    # Actualizar con datos específicos
    jq --arg pr_number "$pr_number" --arg description "$pr_description" \
       '.pr_number = $pr_number | .description = $description' \
       "$pr_analysis_file" > "$TEMP_DIR/temp_pr_analysis.json" && \
    mv "$TEMP_DIR/temp_pr_analysis.json" "$pr_analysis_file"
    
    # Analizar descripción para identificar características solicitadas
    local features=$(echo "$pr_description" | tr '[:upper:]' '[:lower:]' | \
                    grep -oE "(entity|repository|use case|dto|controller|route|service|middleware)" | \
                    sort | uniq)
    
    # Agregar características identificadas
    echo "$features" | while read -r feature; do
        if [[ -n "$feature" ]]; then
            jq --arg feature "$feature" \
               '.requested_features += [$feature]' \
               "$pr_analysis_file" > "$TEMP_DIR/temp_pr_analysis.json" && \
            mv "$TEMP_DIR/temp_pr_analysis.json" "$pr_analysis_file"
        fi
    done
    
    log_success "Análisis de PR-$pr_number completado: $pr_analysis_file"
    echo "$pr_analysis_file"
}

# ============================================================================
# BÚSQUEDA DE CÓDIGO SIMILAR EXISTENTE
# ============================================================================

find_similar_code() {
    local pr_analysis_file="$1"
    local pr_number=$(jq -r '.pr_number' "$pr_analysis_file")
    
    log_adaptation "Buscando código similar existente para PR-$pr_number..."
    
    local similar_code_file="$ADAPTATION_DIR/similar_code_${pr_number}.json"
    
    # Crear estructura para código similar
    cat > "$similar_code_file" << 'EOF'
{
  "similar_entities": [],
  "similar_repositories": [],
  "similar_use_cases": [],
  "similar_dtos": [],
  "similar_controllers": [],
  "similar_routes": [],
  "similar_patterns": [],
  "adaptation_opportunities": []
}
EOF
    
    # Buscar entidades similares
    if [[ -d "$PROJECT_ROOT/apps/api/src/domain/entities" ]]; then
        find "$PROJECT_ROOT/apps/api/src/domain/entities" -name "*.entity.ts" | \
        while read -r entity_file; do
            local entity_name=$(basename "$entity_file" .entity.ts)
            local entity_content=$(cat "$entity_file")
            
            # Buscar patrones similares
            if echo "$entity_content" | grep -q "export class"; then
                jq --arg name "$entity_name" --arg file "$entity_file" \
                   '.similar_entities += [{"name": $name, "file": $file, "type": "entity"}]' \
                   "$similar_code_file" > "$TEMP_DIR/temp_similar.json" && \
                mv "$TEMP_DIR/temp_similar.json" "$similar_code_file"
            fi
        done
    fi
    
    # Buscar repositorios similares
    if [[ -d "$PROJECT_ROOT/apps/api/src/domain/repositories" ]]; then
        find "$PROJECT_ROOT/apps/api/src/domain/repositories" -name "*.repository.ts" | \
        while read -r repo_file; do
            local repo_name=$(basename "$repo_file" .repository.ts)
            local repo_content=$(cat "$repo_file")
            
            if echo "$repo_content" | grep -q "interface"; then
                jq --arg name "$repo_name" --arg file "$repo_file" \
                   '.similar_repositories += [{"name": $name, "file": $file, "type": "repository"}]' \
                   "$similar_code_file" > "$TEMP_DIR/temp_similar.json" && \
                mv "$TEMP_DIR/temp_similar.json" "$similar_code_file"
            fi
        done
    fi
    
    # Buscar use cases similares
    if [[ -d "$PROJECT_ROOT/apps/api/src/application/use-cases" ]]; then
        find "$PROJECT_ROOT/apps/api/src/application/use-cases" -name "*.use-case.ts" | \
        while read -r usecase_file; do
            local usecase_name=$(basename "$usecase_file" .use-case.ts)
            local usecase_content=$(cat "$usecase_file")
            
            if echo "$usecase_content" | grep -q "export class.*UseCase"; then
                jq --arg name "$usecase_name" --arg file "$usecase_file" \
                   '.similar_use_cases += [{"name": $name, "file": $file, "type": "use_case"}]' \
                   "$similar_code_file" > "$TEMP_DIR/temp_similar.json" && \
                mv "$TEMP_DIR/temp_similar.json" "$similar_code_file"
            fi
        done
    fi
    
    log_success "Búsqueda de código similar completada: $similar_code_file"
    echo "$similar_code_file"
}

# ============================================================================
# GENERACIÓN DE ESTRATEGIA DE ADAPTACIÓN
# ============================================================================

generate_adaptation_strategy() {
    local pr_analysis_file="$1"
    local similar_code_file="$2"
    local pr_number=$(jq -r '.pr_number' "$pr_analysis_file")
    
    log_adaptation "Generando estrategia de adaptación para PR-$pr_number..."
    
    local strategy_file="$ADAPTATION_DIR/strategy_${pr_number}.json"
    
    # Crear estrategia de adaptación
    cat > "$strategy_file" << 'EOF'
{
  "strategy_type": "adaptive",
  "approach": "extend_and_consolidate",
  "actions": {
    "extend_existing": [],
    "modify_existing": [],
    "create_new": [],
    "consolidate": [],
    "remove_duplicates": []
  },
  "implementation_steps": [],
  "risk_assessment": {
    "low_risk": [],
    "medium_risk": [],
    "high_risk": []
  },
  "benefits": [],
  "estimated_effort": "medium"
}
EOF
    
    # Analizar características solicitadas vs código existente
    local requested_features=$(jq -r '.requested_features[]' "$pr_analysis_file")
    local similar_entities=$(jq -r '.similar_entities[].name' "$similar_code_file" 2>/dev/null || echo "")
    local similar_repos=$(jq -r '.similar_repositories[].name' "$similar_code_file" 2>/dev/null || echo "")
    local similar_usecases=$(jq -r '.similar_use_cases[].name' "$similar_code_file" 2>/dev/null || echo "")
    
    # Generar acciones de adaptación
    echo "$requested_features" | while read -r feature; do
        case "$feature" in
            "entity")
                if echo "$similar_entities" | grep -q ".*"; then
                    jq '.actions.extend_existing += ["Extender entidades existentes con nuevas funcionalidades"]' \
                       "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
                    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
                else
                    jq '.actions.create_new += ["Crear nuevas entidades siguiendo patrones existentes"]' \
                       "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
                    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
                fi
                ;;
            "repository")
                if echo "$similar_repos" | grep -q ".*"; then
                    jq '.actions.extend_existing += ["Extender repositorios existentes con nuevos métodos"]' \
                       "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
                    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
                else
                    jq '.actions.create_new += ["Crear nuevos repositorios siguiendo interfaces existentes"]' \
                       "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
                    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
                fi
                ;;
            "use case")
                if echo "$similar_usecases" | grep -q ".*"; then
                    jq '.actions.extend_existing += ["Extender use cases existentes con nueva lógica de negocio"]' \
                       "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
                    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
                else
                    jq '.actions.create_new += ["Crear nuevos use cases siguiendo patrones existentes"]' \
                       "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
                    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
                fi
                ;;
        esac
    done
    
    # Agregar pasos de implementación
    jq '.implementation_steps = [
        "1. Analizar código existente similar",
        "2. Identificar patrones y convenciones",
        "3. Extender código existente cuando sea posible",
        "4. Crear nuevo código siguiendo patrones establecidos",
        "5. Consolidar duplicados encontrados",
        "6. Validar consistencia con arquitectura existente",
        "7. Actualizar documentación y exports"
    ]' "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
    
    # Agregar beneficios
    jq '.benefits = [
        "Mantiene consistencia en el código",
        "Reduce duplicación",
        "Aprovecha patrones establecidos",
        "Facilita mantenimiento futuro",
        "Mejora la calidad del código"
    ]' "$strategy_file" > "$TEMP_DIR/temp_strategy.json" && \
    mv "$TEMP_DIR/temp_strategy.json" "$strategy_file"
    
    log_success "Estrategia de adaptación generada: $strategy_file"
    echo "$strategy_file"
}

# ============================================================================
# GENERACIÓN DE PLAN DE IMPLEMENTACIÓN
# ============================================================================

generate_implementation_plan() {
    local pr_analysis_file="$1"
    local strategy_file="$2"
    local pr_number=$(jq -r '.pr_number' "$pr_analysis_file")
    
    log_adaptation "Generando plan de implementación para PR-$pr_number..."
    
    local plan_file="$ADAPTATION_DIR/implementation_plan_${pr_number}.json"
    
    # Crear plan de implementación
    cat > "$plan_file" << 'EOF'
{
  "plan_id": "",
  "pr_number": "",
  "phases": [],
  "tasks": [],
  "dependencies": [],
  "timeline": {
    "estimated_hours": 0,
    "phases": []
  },
  "resources_needed": [],
  "success_criteria": [],
  "rollback_plan": []
}
EOF
    
    # Actualizar información básica
    jq --arg pr_number "$pr_number" \
       --arg plan_id "plan_${pr_number}_$(date +%Y%m%d_%H%M%S)" \
       '.plan_id = $plan_id | .pr_number = $pr_number' \
       "$plan_file" > "$TEMP_DIR/temp_plan.json" && \
    mv "$TEMP_DIR/temp_plan.json" "$plan_file"
    
    # Generar fases de implementación
    jq '.phases = [
        {
            "phase": 1,
            "name": "Análisis y Preparación",
            "description": "Analizar código existente y preparar adaptaciones",
            "tasks": [
                "Revisar análisis de código existente",
                "Identificar patrones y convenciones",
                "Planificar adaptaciones necesarias"
            ],
            "estimated_hours": 2
        },
        {
            "phase": 2,
            "name": "Adaptación de Código Existente",
            "description": "Extender y modificar código existente",
            "tasks": [
                "Extender entidades existentes",
                "Modificar repositorios existentes",
                "Actualizar use cases existentes"
            ],
            "estimated_hours": 4
        },
        {
            "phase": 3,
            "name": "Creación de Nuevo Código",
            "description": "Crear nuevo código siguiendo patrones existentes",
            "tasks": [
                "Crear nuevas entidades si es necesario",
                "Implementar nuevos repositorios",
                "Desarrollar nuevos use cases"
            ],
            "estimated_hours": 6
        },
        {
            "phase": 4,
            "name": "Consolidación y Validación",
            "description": "Consolidar duplicados y validar implementación",
            "tasks": [
                "Eliminar código duplicado",
                "Validar consistencia",
                "Actualizar exports y documentación"
            ],
            "estimated_hours": 2
        }
    ]' "$plan_file" > "$TEMP_DIR/temp_plan.json" && \
    mv "$TEMP_DIR/temp_plan.json" "$plan_file"
    
    # Generar tareas específicas
    jq '.tasks = [
        {
            "id": "task_1",
            "name": "Análisis de Entidades Existentes",
            "description": "Analizar entidades existentes para identificar patrones",
            "phase": 1,
            "estimated_hours": 1,
            "dependencies": []
        },
        {
            "id": "task_2",
            "name": "Análisis de Repositorios Existentes",
            "description": "Analizar repositorios existentes para identificar interfaces",
            "phase": 1,
            "estimated_hours": 1,
            "dependencies": []
        },
        {
            "id": "task_3",
            "name": "Extensión de Código Existente",
            "description": "Extender código existente con nuevas funcionalidades",
            "phase": 2,
            "estimated_hours": 4,
            "dependencies": ["task_1", "task_2"]
        },
        {
            "id": "task_4",
            "name": "Creación de Nuevo Código",
            "description": "Crear nuevo código siguiendo patrones existentes",
            "phase": 3,
            "estimated_hours": 6,
            "dependencies": ["task_3"]
        },
        {
            "id": "task_5",
            "name": "Consolidación Final",
            "description": "Consolidar duplicados y validar implementación",
            "phase": 4,
            "estimated_hours": 2,
            "dependencies": ["task_4"]
        }
    ]' "$plan_file" > "$TEMP_DIR/temp_plan.json" && \
    mv "$TEMP_DIR/temp_plan.json" "$plan_file"
    
    # Calcular tiempo estimado total
    local total_hours=$(jq '[.phases[].estimated_hours] | add' "$plan_file")
    jq --argjson hours "$total_hours" \
       '.timeline.estimated_hours = $hours' \
       "$plan_file" > "$TEMP_DIR/temp_plan.json" && \
    mv "$TEMP_DIR/temp_plan.json" "$plan_file"
    
    # Agregar criterios de éxito
    jq '.success_criteria = [
        "Código implementado sigue patrones existentes",
        "No hay duplicación innecesaria",
        "Todas las funcionalidades solicitadas están implementadas",
        "Código pasa todas las validaciones",
        "Documentación actualizada",
        "Tests pasan correctamente"
    ]' "$plan_file" > "$TEMP_DIR/temp_plan.json" && \
    mv "$TEMP_DIR/temp_plan.json" "$plan_file"
    
    log_success "Plan de implementación generado: $plan_file"
    echo "$plan_file"
}

# ============================================================================
# GENERACIÓN DE TEMPLATES ADAPTATIVOS
# ============================================================================

generate_adaptive_templates() {
    local pr_analysis_file="$1"
    local strategy_file="$2"
    local pr_number=$(jq -r '.pr_number' "$pr_analysis_file")
    
    log_adaptation "Generando templates adaptativos para PR-$pr_number..."
    
    local templates_dir="$ADAPTATION_DIR/templates_${pr_number}"
    mkdir -p "$templates_dir"
    
    # Template para entidad adaptativa
    cat > "$templates_dir/adaptive_entity.template.ts" << 'EOF'
import { z } from 'zod';

// ============================================================================
// ADAPTIVE ENTITY TEMPLATE
// ============================================================================

// Analizar entidades existentes para extraer patrones comunes
// TODO: Reemplazar con patrones específicos encontrados en el análisis

export const {{ENTITY_NAME}}TypeSchema = z.enum([
  // TODO: Definir tipos basados en entidades existentes
]);

export const {{ENTITY_NAME}}StatusSchema = z.enum([
  // TODO: Definir estados basados en patrones existentes
]);

export type {{ENTITY_NAME}}Type = z.infer<typeof {{ENTITY_NAME}}TypeSchema>;
export type {{ENTITY_NAME}}Status = z.infer<typeof {{ENTITY_NAME}}StatusSchema>;

// ============================================================================
// {{ENTITY_NAME}} ID TYPES
// ============================================================================

export type {{ENTITY_NAME}}Id = string;
export type OrganizationId = string; // Reutilizar de entidades existentes

// ============================================================================
// {{ENTITY_NAME}} PROPS INTERFACE
// ============================================================================

export interface {{ENTITY_NAME}}Props {
  id: {{ENTITY_NAME}}Id;
  organizationId: OrganizationId;
  // TODO: Agregar campos específicos basados en análisis de entidades existentes
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// {{ENTITY_NAME}} ENTITY CLASS
// ============================================================================

export class {{ENTITY_NAME}} {
  private props: {{ENTITY_NAME}}Props;

  constructor(props: {{ENTITY_NAME}}Props) {
    this.props = props;
  }

  // ========================================================================
  // GETTERS - Seguir patrón de entidades existentes
  // ========================================================================

  get id(): {{ENTITY_NAME}}Id { return this.props.id; }
  get organizationId(): OrganizationId { return this.props.organizationId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ========================================================================
  // BUSINESS METHODS - Adaptar de entidades existentes
  // ========================================================================

  // TODO: Implementar métodos de negocio basados en patrones existentes

  // ========================================================================
  // VALIDATION METHODS - Seguir patrón de validación existente
  // ========================================================================

  validate(): boolean {
    // TODO: Implementar validación basada en patrones existentes
    return true;
  }

  // ========================================================================
  // UTILITY METHODS - Reutilizar patrones existentes
  // ========================================================================

  toJSON(): {{ENTITY_NAME}}Props {
    return { ...this.props };
  }

  static fromJSON(data: {{ENTITY_NAME}}Props): {{ENTITY_NAME}} {
    return new {{ENTITY_NAME}}(data);
  }

  // ========================================================================
  // FACTORY METHODS - Seguir patrones de factory existentes
  // ========================================================================

  static create(props: Omit<{{ENTITY_NAME}}Props, 'id' | 'createdAt' | 'updatedAt'>): {{ENTITY_NAME}} {
    const now = new Date();
    return new {{ENTITY_NAME}}({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  }
}
EOF

    # Template para repositorio adaptativo
    cat > "$templates_dir/adaptive_repository.template.ts" << 'EOF'
import { {{ENTITY_NAME}}, {{ENTITY_NAME}}Id, OrganizationId } from '../entities/{{ENTITY_NAME_LOWER}}.entity.js';

// ============================================================================
// ADAPTIVE REPOSITORY TEMPLATE
// ============================================================================

// Analizar repositorios existentes para extraer patrones comunes
// TODO: Reemplazar con patrones específicos encontrados en el análisis

export interface {{ENTITY_NAME}}Filters {
  organizationId?: OrganizationId;
  // TODO: Agregar filtros basados en análisis de repositorios existentes
}

export interface {{ENTITY_NAME}}SearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface {{ENTITY_NAME}}Stats {
  total: number;
  // TODO: Agregar estadísticas basadas en patrones existentes
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface {{ENTITY_NAME}}Repository {
  // ========================================================================
  // BASIC CRUD OPERATIONS - Seguir patrón de repositorios existentes
  // ========================================================================

  findById(id: {{ENTITY_NAME}}Id): Promise<{{ENTITY_NAME}} | null>;
  findByOrganizationId(organizationId: OrganizationId, options?: {{ENTITY_NAME}}SearchOptions): Promise<PaginatedResult<{{ENTITY_NAME}}>>;
  save({{ENTITY_NAME_LOWER}}: {{ENTITY_NAME}}): Promise<{{ENTITY_NAME}}>;
  update({{ENTITY_NAME_LOWER}}: {{ENTITY_NAME}}): Promise<{{ENTITY_NAME}}>;
  delete(id: {{ENTITY_NAME}}Id): Promise<void>;

  // ========================================================================
  // SEARCH AND FILTER OPERATIONS - Adaptar de repositorios existentes
  // ========================================================================

  search(filters: {{ENTITY_NAME}}Filters, options?: {{ENTITY_NAME}}SearchOptions): Promise<PaginatedResult<{{ENTITY_NAME}}>>;

  // ========================================================================
  // BULK OPERATIONS - Seguir patrón de operaciones en lote existentes
  // ========================================================================

  saveMany({{ENTITY_NAME_LOWER}}s: {{ENTITY_NAME}}[]): Promise<{{ENTITY_NAME}}[]>;
  updateMany({{ENTITY_NAME_LOWER}}s: {{ENTITY_NAME}}[]): Promise<{{ENTITY_NAME}}[]>;
  deleteMany(ids: {{ENTITY_NAME}}Id[]): Promise<void>;

  // ========================================================================
  // STATISTICS AND ANALYTICS - Adaptar de repositorios existentes
  // ========================================================================

  getStats(organizationId: OrganizationId, filters?: {{ENTITY_NAME}}Filters): Promise<{{ENTITY_NAME}}Stats>;
  countByOrganizationId(organizationId: OrganizationId): Promise<number>;

  // ========================================================================
  // UTILITY METHODS - Reutilizar patrones existentes
  // ========================================================================

  exists(id: {{ENTITY_NAME}}Id): Promise<boolean>;
}
EOF

    # Template para use case adaptativo
    cat > "$templates_dir/adaptive_usecase.template.ts" << 'EOF'
import { {{ENTITY_NAME}}, {{ENTITY_NAME}}Id, OrganizationId } from '../../../domain/entities/{{ENTITY_NAME_LOWER}}.entity.js';
import { {{ENTITY_NAME}}Repository } from '../../../domain/repositories/{{ENTITY_NAME_LOWER}}.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';

// ============================================================================
// ADAPTIVE USE CASE TEMPLATE
// ============================================================================

// Analizar use cases existentes para extraer patrones comunes
// TODO: Reemplazar con patrones específicos encontrados en el análisis

export interface Create{{ENTITY_NAME}}Request {
  organizationId: OrganizationId;
  // TODO: Agregar campos específicos basados en análisis de use cases existentes
}

export interface Create{{ENTITY_NAME}}Response {
  success: true;
  data: {
    {{ENTITY_NAME_LOWER}}: {{ENTITY_NAME}};
  };
}

export class Create{{ENTITY_NAME}}UseCase {
  constructor(
    private readonly {{ENTITY_NAME_LOWER}}Repository: {{ENTITY_NAME}}Repository,
    private readonly userDomainService: UserDomainService
  ) {}

  async execute(request: Create{{ENTITY_NAME}}Request): Promise<Create{{ENTITY_NAME}}Response> {
    // ========================================================================
    // VALIDATION - Seguir patrón de validación de use cases existentes
    // ========================================================================

    // TODO: Implementar validaciones basadas en patrones existentes

    // ========================================================================
    // BUSINESS LOGIC VALIDATION - Adaptar de use cases existentes
    // ========================================================================

    // TODO: Implementar validaciones de negocio basadas en patrones existentes

    // ========================================================================
    // CREATE {{ENTITY_NAME}} - Seguir patrón de creación existente
    // ========================================================================

    // TODO: Implementar creación basada en patrones existentes

    // ========================================================================
    // VALIDATE {{ENTITY_NAME}} - Seguir patrón de validación existente
    // ========================================================================

    // TODO: Implementar validación de entidad

    // ========================================================================
    // SAVE {{ENTITY_NAME}} - Seguir patrón de guardado existente
    // ========================================================================

    // TODO: Implementar guardado

    // ========================================================================
    // RETURN RESPONSE - Seguir patrón de respuesta existente
    // ========================================================================

    // TODO: Implementar respuesta
    return {
      success: true,
      data: {
        {{ENTITY_NAME_LOWER}}: {} as {{ENTITY_NAME}}
      }
    };
  }
}
EOF

    # Template para DTO adaptativo
    cat > "$templates_dir/adaptive_dto.template.ts" << 'EOF'
import { z } from 'zod';
import { UUIDSchema, NameSchema, DescriptionSchema, TagsSchema, CustomFieldsSchema } from '../../../shared/utils/validation.utils.js';

// ============================================================================
// ADAPTIVE DTO TEMPLATE
// ============================================================================

// Analizar DTOs existentes para extraer patrones comunes
// TODO: Reemplazar con patrones específicos encontrados en el análisis

// ========================================================================
// BASIC SCHEMAS - Reutilizar schemas existentes
// ========================================================================

export const {{ENTITY_NAME}}TypeSchema = z.enum([
  // TODO: Definir tipos basados en DTOs existentes
]);

export const {{ENTITY_NAME}}StatusSchema = z.enum([
  // TODO: Definir estados basados en DTOs existentes
]);

// ========================================================================
// CREATE {{ENTITY_NAME}} SCHEMAS - Seguir patrón de DTOs existentes
// ========================================================================

export const Create{{ENTITY_NAME}}Schema = z.object({
  // TODO: Agregar campos basados en análisis de DTOs existentes
  organizationId: UUIDSchema,
  // name: NameSchema,
  // description: DescriptionSchema.optional(),
  // tags: TagsSchema,
  // customFields: CustomFieldsSchema
});

// ========================================================================
// UPDATE {{ENTITY_NAME}} SCHEMAS - Seguir patrón de DTOs existentes
// ========================================================================

export const Update{{ENTITY_NAME}}Schema = z.object({
  // TODO: Agregar campos basados en análisis de DTOs existentes
  // name: NameSchema.optional(),
  // description: DescriptionSchema.optional(),
  // tags: TagsSchema,
  // customFields: CustomFieldsSchema
});

// ========================================================================
// PARAMETER SCHEMAS - Reutilizar patrones existentes
// ========================================================================

export const {{ENTITY_NAME}}IdParamSchema = z.object({
  id: UUIDSchema
});

export const {{ENTITY_NAME}}OrganizationIdParamSchema = z.object({
  organizationId: UUIDSchema
});

// ========================================================================
// QUERY SCHEMAS - Seguir patrón de queries existentes
// ========================================================================

export const {{ENTITY_NAME}}SearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200, 'Search term cannot exceed 200 characters').optional()
});

// ========================================================================
// RESPONSE SCHEMAS - Seguir patrón de respuestas existentes
// ========================================================================

export const {{ENTITY_NAME}}ResponseSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  // TODO: Agregar campos basados en análisis de DTOs existentes
  createdAt: z.date(),
  updatedAt: z.date()
});

export const {{ENTITY_NAME}}ListResponseSchema = z.object({
  data: z.array({{ENTITY_NAME}}ResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
});

// ========================================================================
// TYPE EXPORTS - Seguir patrón de exports existentes
// ========================================================================

export type Create{{ENTITY_NAME}}Request = z.infer<typeof Create{{ENTITY_NAME}}Schema>;
export type Update{{ENTITY_NAME}}Request = z.infer<typeof Update{{ENTITY_NAME}}Schema>;
export type {{ENTITY_NAME}}IdParam = z.infer<typeof {{ENTITY_NAME}}IdParamSchema>;
export type {{ENTITY_NAME}}OrganizationIdParam = z.infer<typeof {{ENTITY_NAME}}OrganizationIdParamSchema>;
export type {{ENTITY_NAME}}SearchQuery = z.infer<typeof {{ENTITY_NAME}}SearchQuerySchema>;
export type {{ENTITY_NAME}}Response = z.infer<typeof {{ENTITY_NAME}}ResponseSchema>;
export type {{ENTITY_NAME}}ListResponse = z.infer<typeof {{ENTITY_NAME}}ListResponseSchema>;
EOF

    log_success "Templates adaptativos generados en: $templates_dir"
    echo "$templates_dir"
}

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

main() {
    local pr_number="$1"
    local pr_description="$2"
    
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    ECONEURA CODE ADAPTATION TOOL                           ║"
    echo "║                    Adaptación de Código Existente                          ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Iniciando adaptación de código para PR-$pr_number..."
    log_info "Descripción: $pr_description"
    log_info "Directorio del proyecto: $PROJECT_ROOT"
    log_info "Directorio de adaptación: $ADAPTATION_DIR"
    
    # Ejecutar proceso de adaptación
    local pr_analysis_file=$(analyze_pr_request "$pr_number" "$pr_description")
    local similar_code_file=$(find_similar_code "$pr_analysis_file")
    local strategy_file=$(generate_adaptation_strategy "$pr_analysis_file" "$similar_code_file")
    local plan_file=$(generate_implementation_plan "$pr_analysis_file" "$strategy_file")
    local templates_dir=$(generate_adaptive_templates "$pr_analysis_file" "$strategy_file")
    
    # Mostrar resumen
    echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                            ADAPTACIÓN COMPLETADA                                ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
    
    echo -e "\n${CYAN}📊 RESUMEN DE LA ADAPTACIÓN:${NC}"
    echo -e "   • PR Analizado: PR-$pr_number"
    echo -e "   • Estrategia: $(jq -r '.approach' "$strategy_file")"
    echo -e "   • Esfuerzo Estimado: $(jq -r '.estimated_effort' "$strategy_file")"
    echo -e "   • Tiempo Estimado: $(jq -r '.timeline.estimated_hours' "$plan_file") horas"
    
    echo -e "\n${CYAN}📁 ARCHIVOS GENERADOS:${NC}"
    echo -e "   • $pr_analysis_file"
    echo -e "   • $similar_code_file"
    echo -e "   • $strategy_file"
    echo -e "   • $plan_file"
    echo -e "   • $templates_dir/"
    
    echo -e "\n${CYAN}🎯 PRÓXIMOS PASOS:${NC}"
    jq -r '.implementation_steps[] | "   • " + .' "$strategy_file"
    
    echo -e "\n${CYAN}💡 BENEFICIOS:${NC}"
    jq -r '.benefits[] | "   • " + .' "$strategy_file"
    
    echo -e "\n${GREEN}✅ Adaptación completada exitosamente!${NC}"
    echo -e "${YELLOW}💡 Usa estos archivos para implementar PR-$pr_number sin duplicados${NC}"
}

# ============================================================================
# EJECUTAR ADAPTACIÓN
# ============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -lt 2 ]]; then
        echo -e "${RED}Error: Se requieren argumentos${NC}"
        echo -e "${YELLOW}Uso: $0 <pr_number> <pr_description>${NC}"
        echo -e "${YELLOW}Ejemplo: $0 10 \"Products Management\"${NC}"
        exit 1
    fi
    
    main "$1" "$2"
fi
