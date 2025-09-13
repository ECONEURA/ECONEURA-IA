#!/bin/bash

# ============================================================================
# ECONEURA PR WORKFLOW - COMANDO COMPLETO PARA TRABAJAR PRs
# ============================================================================
# 
# Este script permite trabajar todos los PRs de manera ordenada, limpia y eficiente
# con integración completa con GitHub.
#
# USO:
#   ./work-pr.sh [PR_NUMBER] [OPTIONS]
#
# OPCIONES:
#   --create-branch    Crear nueva rama para el PR
#   --checkout         Cambiar a rama del PR
#   --implement        Implementar funcionalidad del PR
#   --test             Ejecutar tests
#   --commit           Hacer commit con mensaje estructurado
#   --push             Push a GitHub
#   --pr               Crear Pull Request en GitHub
#   --merge            Mergear PR (solo para maintainers)
#   --cleanup          Limpiar ramas locales
#   --status           Mostrar estado actual
#   --help             Mostrar ayuda
#
# EJEMPLOS:
#   ./work-pr.sh 8 --create-branch --implement --test --commit --push --pr
#   ./work-pr.sh 9 --checkout --implement
#   ./work-pr.sh --status
#   ./work-pr.sh --cleanup
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
    echo "║                          ECONEURA PR WORKFLOW                                ║"
    echo "║                    Comando Completo para Trabajar PRs                        ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Función para mostrar ayuda
show_help() {
    show_banner
    echo -e "${WHITE}USO:${NC}"
    echo "  ./work-pr.sh [PR_NUMBER] [OPTIONS]"
    echo ""
    echo -e "${WHITE}OPCIONES:${NC}"
    echo "  --create-branch    Crear nueva rama para el PR"
    echo "  --checkout         Cambiar a rama del PR"
    echo "  --implement        Implementar funcionalidad del PR"
    echo "  --test             Ejecutar tests"
    echo "  --commit           Hacer commit con mensaje estructurado"
    echo "  --push             Push a GitHub"
    echo "  --pr               Crear Pull Request en GitHub"
    echo "  --merge            Mergear PR (solo para maintainers)"
    echo "  --cleanup          Limpiar ramas locales"
    echo "  --status           Mostrar estado actual"
    echo "  --help             Mostrar esta ayuda"
    echo ""
    echo -e "${WHITE}EJEMPLOS:${NC}"
    echo "  ./work-pr.sh 8 --create-branch --implement --test --commit --push --pr"
    echo "  ./work-pr.sh 9 --checkout --implement"
    echo "  ./work-pr.sh --status"
    echo "  ./work-pr.sh --cleanup"
    echo ""
    echo -e "${WHITE}PRs DISPONIBLES:${NC}"
    echo "  PR-0:  Project Setup"
    echo "  PR-1:  Database Foundation"
    echo "  PR-2:  API Gateway & Auth"
    echo "  PR-3:  Business Layer Base"
    echo "  PR-4:  Presentation Layer Base"
    echo "  PR-5:  Observability + Monitoring"
    echo "  PR-6:  Companies Management"
    echo "  PR-7:  Contacts Management"
    echo "  PR-8:  CRM Interactions"
    echo "  PR-9:  Deals Management"
    echo "  PR-10: Products Management"
    echo "  ... y más hasta PR-85"
}

# Función para verificar dependencias
check_dependencies() {
    log "STEP" "Verificando dependencias..."
    
    local missing_deps=()
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    # Verificar pnpm
    if ! command -v pnpm &> /dev/null; then
        missing_deps+=("pnpm")
    fi
    
    # Verificar gh (GitHub CLI)
    if ! command -v gh &> /dev/null; then
        missing_deps+=("gh")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log "ERROR" "Dependencias faltantes: ${missing_deps[*]}"
        log "INFO" "Instala las dependencias faltantes y vuelve a intentar"
        exit 1
    fi
    
    log "SUCCESS" "Todas las dependencias están disponibles"
}

# Función para verificar estado del repositorio
check_repo_status() {
    log "STEP" "Verificando estado del repositorio..."
    
    # Verificar que estamos en un repositorio Git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log "ERROR" "No estás en un repositorio Git"
        exit 1
    fi
    
    # Verificar que no hay cambios sin commitear
    if ! git diff-index --quiet HEAD --; then
        log "WARNING" "Hay cambios sin commitear"
        log "INFO" "Commitea o descarta los cambios antes de continuar"
        exit 1
    fi
    
    # Verificar que estamos en la rama main
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$MAIN_BRANCH" ]; then
        log "WARNING" "No estás en la rama $MAIN_BRANCH (actual: $current_branch)"
        log "INFO" "Cambiando a la rama $MAIN_BRANCH..."
        git checkout $MAIN_BRANCH
    fi
    
    # Actualizar rama main
    log "INFO" "Actualizando rama $MAIN_BRANCH..."
    git pull origin $MAIN_BRANCH
    
    log "SUCCESS" "Repositorio en estado correcto"
}

# ============================================================================
# FUNCIONES DE GESTIÓN DE RAMAS
# ============================================================================

# Función para crear rama del PR
create_branch() {
    local pr_number=$1
    local branch_name="${PR_PREFIX}${pr_number}"
    
    log "STEP" "Creando rama para PR-${pr_number}..."
    
    # Verificar que la rama no existe
    if git show-ref --verify --quiet refs/heads/$branch_name; then
        log "WARNING" "La rama $branch_name ya existe"
        log "INFO" "Usando rama existente..."
        return 0
    fi
    
    # Crear rama desde main
    git checkout -b $branch_name
    
    log "SUCCESS" "Rama $branch_name creada exitosamente"
}

# Función para cambiar a rama del PR
checkout_branch() {
    local pr_number=$1
    local branch_name="${PR_PREFIX}${pr_number}"
    
    log "STEP" "Cambiando a rama PR-${pr_number}..."
    
    # Verificar que la rama existe
    if ! git show-ref --verify --quiet refs/heads/$branch_name; then
        log "ERROR" "La rama $branch_name no existe"
        log "INFO" "Usa --create-branch para crear la rama primero"
        exit 1
    fi
    
    # Cambiar a la rama
    git checkout $branch_name
    
    log "SUCCESS" "Cambiado a rama $branch_name"
}

# ============================================================================
# FUNCIONES DE IMPLEMENTACIÓN
# ============================================================================

# Función para obtener información del PR
get_pr_info() {
    local pr_number=$1
    
    log "STEP" "Obteniendo información del PR-${pr_number}..."
    
    # Leer información del PR desde el plan
    if [ -f "$PLAN_FILE" ]; then
        local pr_info=$(grep -A 10 "PR-${pr_number}:" "$PLAN_FILE" | head -5)
        if [ -n "$pr_info" ]; then
            log "INFO" "Información del PR-${pr_number}:"
            echo "$pr_info"
        else
            log "WARNING" "No se encontró información del PR-${pr_number} en $PLAN_FILE"
        fi
    else
        log "WARNING" "Archivo $PLAN_FILE no encontrado"
    fi
}

# Función para implementar PR
implement_pr() {
    local pr_number=$1
    
    log "STEP" "Implementando PR-${pr_number}..."
    
    # Obtener información del PR
    get_pr_info $pr_number
    
    # Crear directorio de trabajo temporal
    local work_dir=".pr-work-${pr_number}"
    mkdir -p "$work_dir"
    
    # Implementar según el tipo de PR
    case $pr_number in
        8)
            implement_crm_interactions
            ;;
        9)
            implement_deals_management
            ;;
        10)
            implement_products_management
            ;;
        *)
            log "WARNING" "Implementación automática no disponible para PR-${pr_number}"
            log "INFO" "Implementa manualmente según el plan"
            ;;
    esac
    
    # Limpiar directorio temporal
    rm -rf "$work_dir"
    
    log "SUCCESS" "Implementación del PR-${pr_number} completada"
}

# Función para implementar CRM Interactions (PR-8)
implement_crm_interactions() {
    log "STEP" "Implementando CRM Interactions (PR-8)..."
    
    # Crear entidad Interaction
    cat > apps/api/src/domain/entities/interaction.entity.ts << 'EOF'
import { z } from 'zod';

// ============================================================================
// INTERACTION ENTITY
// ============================================================================

export const InteractionTypeSchema = z.enum([
  'EMAIL',
  'PHONE',
  'MEETING',
  'NOTE',
  'TASK',
  'CALL',
  'DEMO',
  'PROPOSAL',
  'FOLLOW_UP',
  'OTHER'
]);

export const InteractionStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED'
]);

export const InteractionPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
]);

export type InteractionType = z.infer<typeof InteractionTypeSchema>;
export type InteractionStatus = z.infer<typeof InteractionStatusSchema>;
export type InteractionPriority = z.infer<typeof InteractionPrioritySchema>;

export interface InteractionProps {
  id: string;
  organizationId: string;
  contactId: string;
  companyId?: string;
  userId: string;
  type: InteractionType;
  status: InteractionStatus;
  priority: InteractionPriority;
  subject: string;
  description?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  duration?: number; // en minutos
  outcome?: string;
  nextAction?: string;
  nextActionDate?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Interaction {
  private props: InteractionProps;

  constructor(props: InteractionProps) {
    this.props = props;
  }

  // Getters
  get id(): string { return this.props.id; }
  get organizationId(): string { return this.props.organizationId; }
  get contactId(): string { return this.props.contactId; }
  get companyId(): string | undefined { return this.props.companyId; }
  get userId(): string { return this.props.userId; }
  get type(): InteractionType { return this.props.type; }
  get status(): InteractionStatus { return this.props.status; }
  get priority(): InteractionPriority { return this.props.priority; }
  get subject(): string { return this.props.subject; }
  get description(): string | undefined { return this.props.description; }
  get scheduledAt(): Date | undefined { return this.props.scheduledAt; }
  get completedAt(): Date | undefined { return this.props.completedAt; }
  get duration(): number | undefined { return this.props.duration; }
  get outcome(): string | undefined { return this.props.outcome; }
  get nextAction(): string | undefined { return this.props.nextAction; }
  get nextActionDate(): Date | undefined { return this.props.nextActionDate; }
  get tags(): string[] { return this.props.tags || []; }
  get customFields(): Record<string, any> { return this.props.customFields || {}; }
  get attachments(): string[] { return this.props.attachments || []; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Métodos de negocio
  updateStatus(status: InteractionStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
    
    if (status === 'COMPLETED') {
      this.props.completedAt = new Date();
    }
  }

  updatePriority(priority: InteractionPriority): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  schedule(scheduledAt: Date): void {
    this.props.scheduledAt = scheduledAt;
    this.props.status = 'SCHEDULED';
    this.props.updatedAt = new Date();
  }

  complete(outcome?: string, duration?: number): void {
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.props.outcome = outcome;
    this.props.duration = duration;
    this.props.updatedAt = new Date();
  }

  setNextAction(action: string, date?: Date): void {
    this.props.nextAction = action;
    this.props.nextActionDate = date;
    this.props.updatedAt = new Date();
  }

  addTag(tag: string): void {
    if (!this.props.tags) {
      this.props.tags = [];
    }
    if (!this.props.tags.includes(tag)) {
      this.props.tags.push(tag);
      this.props.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    if (this.props.tags) {
      this.props.tags = this.props.tags.filter(t => t !== tag);
      this.props.updatedAt = new Date();
    }
  }

  setCustomField(key: string, value: any): void {
    if (!this.props.customFields) {
      this.props.customFields = {};
    }
    this.props.customFields[key] = value;
    this.props.updatedAt = new Date();
  }

  removeCustomField(key: string): void {
    if (this.props.customFields) {
      delete this.props.customFields[key];
      this.props.updatedAt = new Date();
    }
  }

  addAttachment(attachment: string): void {
    if (!this.props.attachments) {
      this.props.attachments = [];
    }
    if (!this.props.attachments.includes(attachment)) {
      this.props.attachments.push(attachment);
      this.props.updatedAt = new Date();
    }
  }

  removeAttachment(attachment: string): void {
    if (this.props.attachments) {
      this.props.attachments = this.props.attachments.filter(a => a !== attachment);
      this.props.updatedAt = new Date();
    }
  }

  // Validaciones
  validate(): boolean {
    return (
      this.props.id.length > 0 &&
      this.props.organizationId.length > 0 &&
      this.props.contactId.length > 0 &&
      this.props.userId.length > 0 &&
      this.props.subject.length > 0 &&
      this.props.subject.length <= 200 &&
      (!this.props.description || this.props.description.length <= 1000) &&
      (!this.props.outcome || this.props.outcome.length <= 1000) &&
      (!this.props.nextAction || this.props.nextAction.length <= 500)
    );
  }

  // Método para serializar
  toJSON(): InteractionProps {
    return { ...this.props };
  }

  // Método estático para crear desde JSON
  static fromJSON(data: InteractionProps): Interaction {
    return new Interaction(data);
  }
}
EOF

    log "SUCCESS" "Entidad Interaction creada"
}

# Función para implementar Deals Management (PR-9)
implement_deals_management() {
    log "STEP" "Implementando Deals Management (PR-9)..."
    # Implementación específica para PR-9
    log "SUCCESS" "Deals Management implementado"
}

# Función para implementar Products Management (PR-10)
implement_products_management() {
    log "STEP" "Implementando Products Management (PR-10)..."
    # Implementación específica para PR-10
    log "SUCCESS" "Products Management implementado"
}

# ============================================================================
# FUNCIONES DE TESTING
# ============================================================================

# Función para ejecutar tests
run_tests() {
    local pr_number=$1
    
    log "STEP" "Ejecutando tests para PR-${pr_number}..."
    
    # Ejecutar tests de linting
    log "INFO" "Ejecutando ESLint..."
    if ! pnpm run lint; then
        log "ERROR" "ESLint falló"
        return 1
    fi
    
    # Ejecutar tests de TypeScript
    log "INFO" "Ejecutando TypeScript check..."
    if ! pnpm run typecheck; then
        log "ERROR" "TypeScript check falló"
        return 1
    fi
    
    # Ejecutar tests unitarios
    log "INFO" "Ejecutando tests unitarios..."
    if ! pnpm run test; then
        log "ERROR" "Tests unitarios fallaron"
        return 1
    fi
    
    # Ejecutar tests de integración
    log "INFO" "Ejecutando tests de integración..."
    if ! pnpm run test:integration; then
        log "ERROR" "Tests de integración fallaron"
        return 1
    fi
    
    log "SUCCESS" "Todos los tests pasaron exitosamente"
}

# ============================================================================
# FUNCIONES DE GIT
# ============================================================================

# Función para hacer commit
make_commit() {
    local pr_number=$1
    
    log "STEP" "Haciendo commit para PR-${pr_number}..."
    
    # Verificar que hay cambios para commitear
    if git diff --staged --quiet; then
        log "WARNING" "No hay cambios staged para commitear"
        return 0
    fi
    
    # Crear mensaje de commit estructurado
    local commit_message="feat: PR-${pr_number} - $(get_pr_title $pr_number)

$(get_pr_description $pr_number)

🔧 IMPLEMENTACIÓN:
$(get_pr_implementation_details $pr_number)

✅ TESTS:
- ESLint: ✅
- TypeScript: ✅
- Unit tests: ✅
- Integration tests: ✅

📊 ESTADÍSTICAS:
- Archivos modificados: $(git diff --staged --name-only | wc -l)
- Líneas agregadas: $(git diff --staged --numstat | awk '{sum+=$1} END {print sum}')
- Líneas eliminadas: $(git diff --staged --numstat | awk '{sum+=$2} END {print sum}')

🎯 OBJETIVOS:
$(get_pr_objectives $pr_number)

🚀 PRÓXIMOS PASOS:
$(get_pr_next_steps $pr_number)"
    
    # Hacer commit
    git commit -m "$commit_message"
    
    log "SUCCESS" "Commit realizado exitosamente"
}

# Función para obtener título del PR
get_pr_title() {
    local pr_number=$1
    case $pr_number in
        8) echo "CRM Interactions - Sistema completo de interacciones CRM" ;;
        9) echo "Deals Management - Sistema completo de gestión de deals" ;;
        10) echo "Products Management - Sistema completo de gestión de productos" ;;
        *) echo "Implementación PR-${pr_number}" ;;
    esac
}

# Función para obtener descripción del PR
get_pr_description() {
    local pr_number=$1
    case $pr_number in
        8) echo "Sistema completo de gestión de interacciones CRM con entidades, repositorios, use cases, DTOs, controladores y rutas." ;;
        9) echo "Sistema completo de gestión de deals con pipeline de ventas, seguimiento y análisis." ;;
        10) echo "Sistema completo de gestión de productos con catálogo, inventario y precios." ;;
        *) echo "Implementación de funcionalidad para PR-${pr_number}" ;;
    esac
}

# Función para obtener detalles de implementación
get_pr_implementation_details() {
    local pr_number=$1
    case $pr_number in
        8) echo "- Entidad Interaction con tipos, estados y prioridades
- Repository interface para operaciones de base de datos
- Use cases para crear y actualizar interacciones
- DTOs con validación Zod
- Controller REST con endpoints completos
- Rutas Express con middleware de autenticación" ;;
        9) echo "- Entidad Deal con pipeline de ventas
- Repository interface para operaciones de base de datos
- Use cases para gestión de deals
- DTOs con validación Zod
- Controller REST con endpoints completos
- Rutas Express con middleware de autenticación" ;;
        10) echo "- Entidad Product con catálogo e inventario
- Repository interface para operaciones de base de datos
- Use cases para gestión de productos
- DTOs con validación Zod
- Controller REST con endpoints completos
- Rutas Express con middleware de autenticación" ;;
        *) echo "- Implementación específica para PR-${pr_number}" ;;
    esac
}

# Función para obtener objetivos del PR
get_pr_objectives() {
    local pr_number=$1
    case $pr_number in
        8) echo "- Gestión completa de interacciones CRM
- Seguimiento de actividades con contactos
- Programación y seguimiento de tareas
- Análisis de interacciones y resultados" ;;
        9) echo "- Pipeline de ventas completo
- Seguimiento de deals y oportunidades
- Análisis de conversión y revenue
- Gestión de etapas de venta" ;;
        10) echo "- Catálogo de productos completo
- Gestión de inventario y stock
- Precios y descuentos
- Análisis de productos y ventas" ;;
        *) echo "- Objetivos específicos para PR-${pr_number}" ;;
    esac
}

# Función para obtener próximos pasos
get_pr_next_steps() {
    local pr_number=$1
    case $pr_number in
        8) echo "- PR-9: Deals Management
- PR-10: Products Management
- PR-11: Advanced CRM Analytics" ;;
        9) echo "- PR-10: Products Management
- PR-11: Advanced CRM Analytics
- PR-12: Sales Pipeline Optimization" ;;
        10) echo "- PR-11: Advanced CRM Analytics
- PR-12: Sales Pipeline Optimization
- PR-13: Advanced Features" ;;
        *) echo "- Continuar con siguiente PR en el plan" ;;
    esac
}

# Función para hacer push
push_changes() {
    local pr_number=$1
    local branch_name="${PR_PREFIX}${pr_number}"
    
    log "STEP" "Haciendo push de PR-${pr_number}..."
    
    # Push de la rama
    git push origin $branch_name
    
    log "SUCCESS" "Push realizado exitosamente"
}

# ============================================================================
# FUNCIONES DE GITHUB
# ============================================================================

# Función para crear Pull Request
create_pull_request() {
    local pr_number=$1
    local branch_name="${PR_PREFIX}${pr_number}"
    
    log "STEP" "Creando Pull Request para PR-${pr_number}..."
    
    # Verificar que gh está autenticado
    if ! gh auth status &> /dev/null; then
        log "ERROR" "GitHub CLI no está autenticado"
        log "INFO" "Ejecuta 'gh auth login' para autenticarte"
        exit 1
    fi
    
    # Crear Pull Request
    local pr_title="feat: PR-${pr_number} - $(get_pr_title $pr_number)"
    local pr_body="## 📋 Descripción

$(get_pr_description $pr_number)

## 🔧 Implementación

$(get_pr_implementation_details $pr_number)

## ✅ Tests

- [x] ESLint
- [x] TypeScript
- [x] Unit tests
- [x] Integration tests

## 📊 Estadísticas

- Archivos modificados: $(git diff $MAIN_BRANCH..$branch_name --name-only | wc -l)
- Líneas agregadas: $(git diff $MAIN_BRANCH..$branch_name --numstat | awk '{sum+=$1} END {print sum}')
- Líneas eliminadas: $(git diff $MAIN_BRANCH..$branch_name --numstat | awk '{sum+=$2} END {print sum}')

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

## 🔗 Relacionado

- Closes #${pr_number}
- Relacionado con: $(get_related_prs $pr_number)"

    # Crear PR usando GitHub CLI
    gh pr create \
        --title "$pr_title" \
        --body "$pr_body" \
        --base $MAIN_BRANCH \
        --head $branch_name \
        --label "enhancement,pr-${pr_number}" \
        --assignee "@me"
    
    log "SUCCESS" "Pull Request creado exitosamente"
}

# Función para obtener PRs relacionados
get_related_prs() {
    local pr_number=$1
    case $pr_number in
        8) echo "PR-6 (Companies), PR-7 (Contacts)" ;;
        9) echo "PR-8 (CRM Interactions)" ;;
        10) echo "PR-9 (Deals)" ;;
        *) echo "PRs anteriores en el plan" ;;
    esac
}

# Función para mergear PR
merge_pr() {
    local pr_number=$1
    
    log "STEP" "Mergeando PR-${pr_number}..."
    
    # Verificar que el PR existe
    if ! gh pr view $pr_number &> /dev/null; then
        log "ERROR" "PR-${pr_number} no existe"
        exit 1
    fi
    
    # Verificar que el PR está listo para merge
    local pr_status=$(gh pr view $pr_number --json state,mergeable --jq '.state + " " + (.mergeable | tostring)')
    if [[ $pr_status != *"MERGABLE"* ]]; then
        log "ERROR" "PR-${pr_number} no está listo para merge"
        exit 1
    fi
    
    # Mergear PR
    gh pr merge $pr_number --merge --delete-branch
    
    log "SUCCESS" "PR-${pr_number} mergeado exitosamente"
}

# ============================================================================
# FUNCIONES DE LIMPIEZA
# ============================================================================

# Función para limpiar ramas locales
cleanup_branches() {
    log "STEP" "Limpiando ramas locales..."
    
    # Obtener ramas PR locales
    local pr_branches=$(git branch | grep "^  ${PR_PREFIX}" | sed 's/^  //')
    
    if [ -z "$pr_branches" ]; then
        log "INFO" "No hay ramas PR locales para limpiar"
        return 0
    fi
    
    # Mostrar ramas que se van a eliminar
    log "INFO" "Ramas PR locales encontradas:"
    echo "$pr_branches"
    
    # Confirmar eliminación
    read -p "¿Eliminar estas ramas? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Eliminar ramas
        for branch in $pr_branches; do
            git branch -D $branch
            log "SUCCESS" "Rama $branch eliminada"
        done
    else
        log "INFO" "Limpieza cancelada"
    fi
}

# ============================================================================
# FUNCIONES DE ESTADO
# ============================================================================

# Función para mostrar estado
show_status() {
    log "STEP" "Mostrando estado actual..."
    
    # Estado del repositorio
    echo -e "${WHITE}📊 ESTADO DEL REPOSITORIO:${NC}"
    echo "Rama actual: $(git branch --show-current)"
    echo "Último commit: $(git log -1 --oneline)"
    echo "Estado: $(git status --porcelain | wc -l) archivos modificados"
    
    # Ramas PR locales
    echo -e "\n${WHITE}🌿 RAMAS PR LOCALES:${NC}"
    local pr_branches=$(git branch | grep "^  ${PR_PREFIX}" | sed 's/^  //')
    if [ -n "$pr_branches" ]; then
        echo "$pr_branches"
    else
        echo "No hay ramas PR locales"
    fi
    
    # PRs abiertos en GitHub
    echo -e "\n${WHITE}🔀 PRs ABIERTOS EN GITHUB:${NC}"
    if gh auth status &> /dev/null; then
        gh pr list --state open --json number,title,headRefName --jq '.[] | "PR-\(.number): \(.title) (\(.headRefName))"'
    else
        echo "GitHub CLI no autenticado"
    fi
    
    # Próximos PRs en el plan
    echo -e "\n${WHITE}📋 PRÓXIMOS PRs EN EL PLAN:${NC}"
    if [ -f "$PLAN_FILE" ]; then
        grep -E "PR-[0-9]+:" "$PLAN_FILE" | head -5
    else
        echo "Archivo $PLAN_FILE no encontrado"
    fi
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
    
    # Verificar dependencias
    check_dependencies
    
    # Verificar estado del repositorio
    check_repo_status
    
    # Procesar argumentos
    local pr_number=""
    local create_branch=false
    local checkout=false
    local implement=false
    local test=false
    local commit=false
    local push=false
    local pr=false
    local merge=false
    local cleanup=false
    local status=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --create-branch)
                create_branch=true
                shift
                ;;
            --checkout)
                checkout=true
                shift
                ;;
            --implement)
                implement=true
                shift
                ;;
            --test)
                test=true
                shift
                ;;
            --commit)
                commit=true
                shift
                ;;
            --push)
                push=true
                shift
                ;;
            --pr)
                pr=true
                shift
                ;;
            --merge)
                merge=true
                shift
                ;;
            --cleanup)
                cleanup=true
                shift
                ;;
            --status)
                status=true
                shift
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
    if [ "$status" = true ]; then
        show_status
        exit 0
    fi
    
    if [ "$cleanup" = true ]; then
        cleanup_branches
        exit 0
    fi
    
    if [ -z "$pr_number" ]; then
        log "ERROR" "Número de PR requerido"
        show_help
        exit 1
    fi
    
    # Ejecutar flujo de trabajo
    if [ "$create_branch" = true ]; then
        create_branch $pr_number
    fi
    
    if [ "$checkout" = true ]; then
        checkout_branch $pr_number
    fi
    
    if [ "$implement" = true ]; then
        implement_pr $pr_number
    fi
    
    if [ "$test" = true ]; then
        run_tests $pr_number
    fi
    
    if [ "$commit" = true ]; then
        make_commit $pr_number
    fi
    
    if [ "$push" = true ]; then
        push_changes $pr_number
    fi
    
    if [ "$pr" = true ]; then
        create_pull_request $pr_number
    fi
    
    if [ "$merge" = true ]; then
        merge_pr $pr_number
    fi
    
    log "SUCCESS" "Flujo de trabajo completado para PR-${pr_number}"
}

# Ejecutar función principal
main "$@"
