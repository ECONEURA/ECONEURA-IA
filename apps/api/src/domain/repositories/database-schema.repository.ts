import { DatabaseSchema } from '../entities/database-schema.entity.js';
import { BaseRepository, BaseEntity, BaseFilters, BaseSearchOptions, PaginatedResult, BaseStats } from './base.repository.js';

// ============================================================================
// DATABASE SCHEMA REPOSITORY INTERFACE - PR-1: DATABASE SCHEMA COMPLETO
// ============================================================================

export interface DatabaseSchemaFilters extends BaseFilters {
  type?: string;
  status?: string;
  tableType?: string;
  columnType?: string;
  constraintType?: string;
  isActive?: boolean;
  hasBackup?: boolean;
  hasMaintenance?: boolean;
  minHealthScore?: number;
  maxHealthScore?: number;
  minPerformanceScore?: number;
  maxPerformanceScore?: number;
  minSecurityScore?: number;
  maxSecurityScore?: number;
  lastBackupFrom?: Date;
  lastBackupTo?: Date;
  lastMaintenanceFrom?: Date;
  lastMaintenanceTo?: Date;
}

export interface DatabaseSchemaSearchOptions extends BaseSearchOptions {
  type?: string;
  status?: string;
  tableType?: string;
  columnType?: string;
  constraintType?: string;
  isActive?: boolean;
  hasBackup?: boolean;
  hasMaintenance?: boolean;
  minHealthScore?: number;
  maxHealthScore?: number;
  minPerformanceScore?: number;
  maxPerformanceScore?: number;
  minSecurityScore?: number;
  maxSecurityScore?: number;
  lastBackupFrom?: Date;
  lastBackupTo?: Date;
  lastMaintenanceFrom?: Date;
  lastMaintenanceTo?: Date;
}

export interface DatabaseSchemaStats extends BaseStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byTableType: Record<string, number>;
  byColumnType: Record<string, number>;
  byConstraintType: Record<string, number>;
  totalTables: number;
  totalViews: number;
  totalFunctions: number;
  totalProcedures: number;
  totalTriggers: number;
  totalIndexes: number;
  totalConstraints: number;
  totalPolicies: number;
  totalSize: number;
  averageTableSize: number;
  averageHealthScore: number;
  averagePerformanceScore: number;
  averageSecurityScore: number;
  averageMaintainabilityScore: number;
  lastBackupDate?: Date;
  lastMaintenanceDate?: Date;
  totalBackupSize: number;
  totalMaintenanceTime: number;
  schemasWithBackup: number;
  schemasWithMaintenance: number;
}

export interface DatabaseSchemaRepository extends BaseRepository<DatabaseSchema> {
  // ========================================================================
  // DATABASE SCHEMA-SPECIFIC QUERIES
  // ========================================================================

  findByType(type: string, organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByStatus(status: string, organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByTableType(tableType: string, organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByColumnType(columnType: string, organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByConstraintType(constraintType: string, organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findActiveSchemas(organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findWithBackup(organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findWithMaintenance(organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;

  // ========================================================================
  // SCORE-BASED QUERIES
  // ========================================================================

  findByHealthScoreRange(organizationId: string, minScore: number, maxScore: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByPerformanceScoreRange(organizationId: string, minScore: number, maxScore: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findBySecurityScoreRange(organizationId: string, minScore: number, maxScore: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByMaintainabilityScoreRange(organizationId: string, minScore: number, maxScore: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findHighPerformanceSchemas(organizationId: string, minScore: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findHighSecuritySchemas(organizationId: string, minScore: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;

  // ========================================================================
  // MAINTENANCE-BASED QUERIES
  // ========================================================================

  findByBackupDateRange(organizationId: string, startDate: Date, endDate: Date, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByMaintenanceDateRange(organizationId: string, startDate: Date, endDate: Date, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByLastBackupDate(organizationId: string, days: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findByLastMaintenanceDate(organizationId: string, days: number, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findNeedingBackup(organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;
  findNeedingMaintenance(organizationId: string, options?: DatabaseSchemaSearchOptions): Promise<PaginatedResult<DatabaseSchema>>;

  // ========================================================================
  // SEARCH OPERATIONS
  // ========================================================================

  searchByName(name: string, organizationId: string): Promise<DatabaseSchema[]>;
  searchByDescription(description: string, organizationId: string): Promise<DatabaseSchema[]>;
  searchByTableName(tableName: string, organizationId: string): Promise<DatabaseSchema[]>;
  searchByColumnName(columnName: string, organizationId: string): Promise<DatabaseSchema[]>;

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  updateStatusMany(ids: string[], status: string): Promise<void>;
  updateSettingsMany(ids: string[], settings: any): Promise<void>;
  backupSchemasMany(ids: string[]): Promise<void>;
  maintainSchemasMany(ids: string[]): Promise<void>;
  deleteTablesMany(ids: string[], tableIds: string[]): Promise<void>;

  // ========================================================================
  // STATISTICS AND ANALYTICS
  // ========================================================================

  getStats(organizationId: string, filters?: DatabaseSchemaFilters): Promise<DatabaseSchemaStats>;
  getStatsByType(organizationId: string, type: string): Promise<DatabaseSchemaStats>;
  getStatsByStatus(organizationId: string, status: string): Promise<DatabaseSchemaStats>;
  getStatsByTableType(organizationId: string, tableType: string): Promise<DatabaseSchemaStats>;

  // ========================================================================
  // DATABASE SCHEMA ANALYTICS
  // ========================================================================

  getSchemaAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalSchemas: number;
    averageHealthScore: number;
    averagePerformanceScore: number;
    averageSecurityScore: number;
    byType: Record<string, number>;
    byStatus: Array<{
      status: string;
      count: number;
      averageHealthScore: number;
      averagePerformanceScore: number;
      averageSecurityScore: number;
    }>;
    trends: Array<{
      date: Date;
      schemas: number;
      averageHealthScore: number;
      averagePerformanceScore: number;
    }>;
    scoreDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    analysisDate: Date;
  }>;

  getTableAnalytics(organizationId: string): Promise<{
    totalTables: number;
    averageTablesPerSchema: number;
    byType: Array<{
      type: string;
      count: number;
      averageSize: number;
      averageColumns: number;
    }>;
    bySchema: Array<{
      schema: string;
      count: number;
      averageSize: number;
      averageColumns: number;
    }>;
    sizeDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    analysisDate: Date;
  }>;

  getPerformanceAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalAnalyses: number;
    averageHealthScore: number;
    averagePerformanceScore: number;
    byType: Array<{
      type: string;
      count: number;
      averageHealthScore: number;
      averagePerformanceScore: number;
      bestHealthScore: number;
      worstHealthScore: number;
    }>;
    byStatus: Array<{
      status: string;
      count: number;
      averageHealthScore: number;
      averagePerformanceScore: number;
    }>;
    performanceTrends: Array<{
      date: Date;
      averageHealthScore: number;
      averagePerformanceScore: number;
      analysesPerformed: number;
    }>;
    analysisDate: Date;
  }>;

  getMaintenanceAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalBackups: number;
    totalMaintenances: number;
    averageBackupSize: number;
    averageMaintenanceTime: number;
    byType: Array<{
      type: string;
      backups: number;
      maintenances: number;
      averageBackupSize: number;
      averageMaintenanceTime: number;
    }>;
    byStatus: Array<{
      status: string;
      backups: number;
      maintenances: number;
      averageBackupSize: number;
      averageMaintenanceTime: number;
    }>;
    maintenanceTrends: Array<{
      date: Date;
      backups: number;
      maintenances: number;
      averageBackupSize: number;
      averageMaintenanceTime: number;
    }>;
    analysisDate: Date;
  }>;

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  existsByName(name: string, organizationId: string): Promise<boolean>;
  getSchemaCount(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalTables(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalViews(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalFunctions(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalProcedures(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalTriggers(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalIndexes(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalConstraints(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalPolicies(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getTotalSize(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getAverageHealthScore(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getAveragePerformanceScore(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getAverageSecurityScore(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getAverageMaintainabilityScore(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getSchemasWithBackupCount(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;
  getSchemasWithMaintenanceCount(organizationId: string, filters?: DatabaseSchemaFilters): Promise<number>;

  // ========================================================================
  // REPORTING
  // ========================================================================

  generateSchemaReport(organizationId: string, filters?: DatabaseSchemaFilters): Promise<{
    summary: DatabaseSchemaStats;
    schemas: DatabaseSchema[];
    generatedAt: Date;
  }>;

  generateTableReport(organizationId: string): Promise<{
    summary: {
      totalTables: number;
      averagePerSchema: number;
      byType: Record<string, number>;
    };
    tables: Array<{
      id: string;
      name: string;
      type: string;
      schema: string;
      columns: number;
      constraints: number;
      indexes: number;
      size: number;
      schemaId: string;
      schemaName: string;
    }>;
    generatedAt: Date;
  }>;

  generatePerformanceReport(organizationId: string): Promise<{
    summary: {
      totalSchemas: number;
      averageHealthScore: number;
      averagePerformanceScore: number;
      highPerformance: number;
      needsImprovement: number;
    };
    schemas: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      healthScore: number;
      performanceScore: number;
      securityScore: number;
      maintainabilityScore: number;
      totalSize: number;
      totalTables: number;
      lastBackupDate: Date;
      lastMaintenanceDate: Date;
    }>;
    generatedAt: Date;
  }>;

  generateMaintenanceReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
    summary: {
      totalBackups: number;
      totalMaintenances: number;
      averageBackupSize: number;
      averageMaintenanceTime: number;
    };
    maintenanceSessions: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      backupDate: Date;
      maintenanceDate: Date;
      backupSize: number;
      maintenanceTime: number;
      healthScore: number;
      performanceScore: number;
    }>;
    generatedAt: Date;
  }>;
}
