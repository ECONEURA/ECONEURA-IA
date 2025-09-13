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
