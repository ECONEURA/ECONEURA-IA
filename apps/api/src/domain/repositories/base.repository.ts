// ============================================================================
// BASE REPOSITORY INTERFACE - Interfaz base para todos los repositorios
// ============================================================================

export interface BaseEntity {
  id: { value: string };
  organizationId: { value: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseFilters {
  organizationId?: string;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

export interface BaseSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
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

export interface BaseStats {
  total: number;
  active: number;
  inactive: number;
  createdThisMonth: number;
  createdThisYear: number;
  updatedThisMonth: number;
  updatedThisYear: number;
}

export interface BaseRepository<T extends BaseEntity> {
  // ========================================================================
  // OPERACIONES CRUD BÁSICAS
  // ========================================================================

  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findByOrganizationId(organizationId: string, options?: BaseSearchOptions): Promise<PaginatedResult<T>>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<void>;

  // ========================================================================
  // OPERACIONES DE BÚSQUEDA
  // ========================================================================

  search(query: string, organizationId: string, options?: BaseSearchOptions): Promise<PaginatedResult<T>>;
  findAll(options?: BaseSearchOptions): Promise<PaginatedResult<T>>;

  // ========================================================================
  // OPERACIONES EN LOTE
  // ========================================================================

  saveMany(entities: T[]): Promise<T[]>;
  updateMany(entities: T[]): Promise<T[]>;
  deleteMany(ids: string[]): Promise<void>;

  // ========================================================================
  // ESTADÍSTICAS
  // ========================================================================

  getStats(organizationId: string, filters?: BaseFilters): Promise<BaseStats>;
  countByOrganizationId(organizationId: string): Promise<number>;

  // ========================================================================
  // UTILIDADES
  // ========================================================================

  exists(id: string): Promise<boolean>;
}
