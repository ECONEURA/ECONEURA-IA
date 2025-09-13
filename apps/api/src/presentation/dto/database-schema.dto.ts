import { z } from 'zod';
import {
  UUIDSchema,
  OrganizationIdSchema,
  NameSchema,
  DescriptionSchema,
  NotesSchema,
  TagsSchema,
  CustomFieldsSchema,
  BaseSearchQuerySchema,
  IdParamSchema,
  OrganizationIdParamSchema,
  BaseResponseSchema,
  ListResponseSchema,
  BaseStatsSchema,
  BulkUpdateSchema,
  BulkDeleteSchema,
  DateRangeSchema
} from './base.dto.js';

// ============================================================================
// DATABASE SCHEMA DTOs - PR-1: DATABASE SCHEMA COMPLETO
// ============================================================================

// ========================================================================
// REQUEST DTOs
// ========================================================================

export const CreateDatabaseSchemaRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  name: NameSchema,
  type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch'], {
    errorMap: () => ({ message: 'Type must be one of: postgresql, mysql, sqlite, mongodb, redis, elasticsearch' })
  }),
  description: DescriptionSchema.optional(),
  settings: z.object({
    version: z.string().min(1, 'Version is required').max(50, 'Version cannot exceed 50 characters'),
    encoding: z.string().min(1, 'Encoding is required').max(50, 'Encoding cannot exceed 50 characters').default('UTF8'),
    collation: z.string().min(1, 'Collation is required').max(100, 'Collation cannot exceed 100 characters').default('en_US.UTF-8'),
    timezone: z.string().min(1, 'Timezone is required').max(50, 'Timezone cannot exceed 50 characters').default('UTC'),
    connectionPool: z.object({
      min: z.number().int().min(0, 'Minimum connections cannot be negative').max(100, 'Minimum connections cannot exceed 100').default(1),
      max: z.number().int().min(1, 'Maximum connections must be at least 1').max(1000, 'Maximum connections cannot exceed 1000').default(10),
      idle: z.number().int().min(0, 'Idle timeout cannot be negative').max(3600, 'Idle timeout cannot exceed 1 hour').default(30),
      acquire: z.number().int().min(0, 'Acquire timeout cannot be negative').max(60000, 'Acquire timeout cannot exceed 60 seconds').default(30000),
      evict: z.number().int().min(0, 'Evict timeout cannot be negative').max(60000, 'Evict timeout cannot exceed 60 seconds').default(60000)
    }),
    migrations: z.object({
      enabled: z.boolean().default(true),
      directory: z.string().min(1, 'Migration directory is required').max(255, 'Migration directory cannot exceed 255 characters').default('migrations'),
      table: z.string().min(1, 'Migration table is required').max(100, 'Migration table cannot exceed 100 characters').default('migrations'),
      lockTable: z.string().min(1, 'Lock table is required').max(100, 'Lock table cannot exceed 100 characters').default('migrations_lock')
    }),
    backup: z.object({
      enabled: z.boolean().default(false),
      frequency: z.string().min(1, 'Backup frequency is required').max(50, 'Backup frequency cannot exceed 50 characters').default('daily'),
      retention: z.number().int().min(0, 'Retention cannot be negative').max(365, 'Retention cannot exceed 365 days').default(30),
      compression: z.boolean().default(true)
    }),
    monitoring: z.object({
      enabled: z.boolean().default(true),
      slowQueryThreshold: z.number().int().min(0, 'Slow query threshold cannot be negative').max(60000, 'Slow query threshold cannot exceed 60 seconds').default(1000),
      logLevel: z.enum(['debug', 'info', 'warn', 'error'], {
        errorMap: () => ({ message: 'Log level must be one of: debug, info, warn, error' })
      }).default('info'),
      metrics: z.boolean().default(true)
    }),
    security: z.object({
      ssl: z.boolean().default(true),
      encryption: z.boolean().default(true),
      auditLog: z.boolean().default(false),
      rowLevelSecurity: z.boolean().default(false)
    }),
    performance: z.object({
      queryOptimization: z.boolean().default(true),
      indexOptimization: z.boolean().default(true),
      connectionPooling: z.boolean().default(true),
      caching: z.boolean().default(false)
    }),
    customFields: CustomFieldsSchema,
    tags: TagsSchema,
    notes: NotesSchema
  }),
  tables: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Table name is required').max(255, 'Table name cannot exceed 255 characters'),
    type: z.enum(['table', 'view', 'materialized_view', 'function', 'procedure', 'trigger', 'index', 'sequence'], {
      errorMap: () => ({ message: 'Table type must be one of: table, view, materialized_view, function, procedure, trigger, index, sequence' })
    }),
    schema: z.string().min(1, 'Schema is required').max(100, 'Schema cannot exceed 100 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
    columns: z.array(z.object({
      id: z.string().uuid(),
      name: z.string().min(1, 'Column name is required').max(255, 'Column name cannot exceed 255 characters'),
      type: z.enum(['varchar', 'text', 'integer', 'bigint', 'decimal', 'boolean', 'date', 'timestamp', 'json', 'jsonb', 'uuid', 'array', 'enum'], {
        errorMap: () => ({ message: 'Column type must be one of: varchar, text, integer, bigint, decimal, boolean, date, timestamp, json, jsonb, uuid, array, enum' })
      }),
      length: z.number().int().min(1).max(65535).optional(),
      precision: z.number().int().min(1).max(65).optional(),
      scale: z.number().int().min(0).max(30).optional(),
      nullable: z.boolean().default(true),
      defaultValue: z.any().optional(),
      constraints: z.array(z.object({
        id: z.string().uuid(),
        name: z.string().min(1, 'Constraint name is required').max(255, 'Constraint name cannot exceed 255 characters'),
        type: z.enum(['primary_key', 'foreign_key', 'unique', 'check', 'not_null', 'default', 'index'], {
          errorMap: () => ({ message: 'Constraint type must be one of: primary_key, foreign_key, unique, check, not_null, default, index' })
        }),
        columns: z.array(z.string()).min(1, 'At least one column is required'),
        referencedTable: z.string().max(255).optional(),
        referencedColumns: z.array(z.string()).optional(),
        condition: z.string().max(1000).optional(),
        description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
        isDeferrable: z.boolean().default(false),
        initiallyDeferred: z.boolean().default(false),
        onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
        onUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional()
      })).default([]),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
      isIndexed: z.boolean().default(false),
      isPrimaryKey: z.boolean().default(false),
      isForeignKey: z.boolean().default(false),
      referencedTable: z.string().max(255).optional(),
      referencedColumn: z.string().max(255).optional()
    })).min(1, 'At least one column is required per table'),
    constraints: z.array(z.object({
      id: z.string().uuid(),
      name: z.string().min(1, 'Constraint name is required').max(255, 'Constraint name cannot exceed 255 characters'),
      type: z.enum(['primary_key', 'foreign_key', 'unique', 'check', 'not_null', 'default', 'index'], {
        errorMap: () => ({ message: 'Constraint type must be one of: primary_key, foreign_key, unique, check, not_null, default, index' })
      }),
      columns: z.array(z.string()).min(1, 'At least one column is required'),
      referencedTable: z.string().max(255).optional(),
      referencedColumns: z.array(z.string()).optional(),
      condition: z.string().max(1000).optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
      isDeferrable: z.boolean().default(false),
      initiallyDeferred: z.boolean().default(false),
      onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
      onUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional()
    })).default([]),
    indexes: z.array(z.object({
      id: z.string().uuid(),
      name: z.string().min(1, 'Index name is required').max(255, 'Index name cannot exceed 255 characters'),
      table: z.string().min(1, 'Table name is required').max(255, 'Table name cannot exceed 255 characters'),
      columns: z.array(z.string()).min(1, 'At least one column is required'),
      type: z.enum(['btree', 'hash', 'gin', 'gist', 'spgist', 'brin'], {
        errorMap: () => ({ message: 'Index type must be one of: btree, hash, gin, gist, spgist, brin' })
      }),
      unique: z.boolean().default(false),
      partial: z.boolean().default(false),
      condition: z.string().max(1000).optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
      isActive: z.boolean().default(true)
    })).default([]),
    triggers: z.array(z.object({
      id: z.string().uuid(),
      name: z.string().min(1, 'Trigger name is required').max(255, 'Trigger name cannot exceed 255 characters'),
      table: z.string().min(1, 'Table name is required').max(255, 'Table name cannot exceed 255 characters'),
      event: z.enum(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'], {
        errorMap: () => ({ message: 'Event must be one of: INSERT, UPDATE, DELETE, TRUNCATE' })
      }),
      timing: z.enum(['BEFORE', 'AFTER', 'INSTEAD OF'], {
        errorMap: () => ({ message: 'Timing must be one of: BEFORE, AFTER, INSTEAD OF' })
      }),
      function: z.string().min(1, 'Function is required').max(255, 'Function cannot exceed 255 characters'),
      condition: z.string().max(1000).optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
      isActive: z.boolean().default(true)
    })).default([]),
    rowLevelSecurity: z.boolean().default(false),
    policies: z.array(z.object({
      id: z.string().uuid(),
      name: z.string().min(1, 'Policy name is required').max(255, 'Policy name cannot exceed 255 characters'),
      table: z.string().min(1, 'Table name is required').max(255, 'Table name cannot exceed 255 characters'),
      command: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'], {
        errorMap: () => ({ message: 'Command must be one of: SELECT, INSERT, UPDATE, DELETE, ALL' })
      }),
      roles: z.array(z.string()).min(1, 'At least one role is required'),
      using: z.string().max(1000).optional(),
      withCheck: z.string().max(1000).optional(),
      description: z.string().max(1000, 'Description cannot exceed 1000 characters'),
      isActive: z.boolean().default(true)
    })).default([]),
    statistics: z.object({
      rowCount: z.number().int().min(0).default(0),
      tableSize: z.number().int().min(0).default(0),
      indexSize: z.number().int().min(0).default(0),
      totalSize: z.number().int().min(0).default(0),
      lastAnalyzed: z.coerce.date().default(() => new Date()),
      lastVacuumed: z.coerce.date().default(() => new Date()),
      lastAutoVacuumed: z.coerce.date().default(() => new Date()),
      deadTuples: z.number().int().min(0).default(0),
      liveTuples: z.number().int().min(0).default(0),
      nDistinct: z.number().default(0),
      correlation: z.number().default(0),
      mostCommonValues: z.array(z.any()).default([]),
      mostCommonFrequencies: z.array(z.number()).default([]),
      histogramBounds: z.array(z.any()).default([])
    })
  })).optional()
});

export const UpdateDatabaseSchemaRequestSchema = z.object({
  name: NameSchema.optional(),
  type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch']).optional(),
  description: DescriptionSchema.optional(),
  settings: z.object({
    version: z.string().min(1).max(50).optional(),
    encoding: z.string().min(1).max(50).optional(),
    collation: z.string().min(1).max(100).optional(),
    timezone: z.string().min(1).max(50).optional(),
    connectionPool: z.object({
      min: z.number().int().min(0).max(100).optional(),
      max: z.number().int().min(1).max(1000).optional(),
      idle: z.number().int().min(0).max(3600).optional(),
      acquire: z.number().int().min(0).max(60000).optional(),
      evict: z.number().int().min(0).max(60000).optional()
    }).optional(),
    migrations: z.object({
      enabled: z.boolean().optional(),
      directory: z.string().min(1).max(255).optional(),
      table: z.string().min(1).max(100).optional(),
      lockTable: z.string().min(1).max(100).optional()
    }).optional(),
    backup: z.object({
      enabled: z.boolean().optional(),
      frequency: z.string().min(1).max(50).optional(),
      retention: z.number().int().min(0).max(365).optional(),
      compression: z.boolean().optional()
    }).optional(),
    monitoring: z.object({
      enabled: z.boolean().optional(),
      slowQueryThreshold: z.number().int().min(0).max(60000).optional(),
      logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
      metrics: z.boolean().optional()
    }).optional(),
    security: z.object({
      ssl: z.boolean().optional(),
      encryption: z.boolean().optional(),
      auditLog: z.boolean().optional(),
      rowLevelSecurity: z.boolean().optional()
    }).optional(),
    performance: z.object({
      queryOptimization: z.boolean().optional(),
      indexOptimization: z.boolean().optional(),
      connectionPooling: z.boolean().optional(),
      caching: z.boolean().optional()
    }).optional(),
    customFields: CustomFieldsSchema.optional(),
    tags: TagsSchema.optional(),
    notes: NotesSchema.optional()
  }).optional()
});

export const AnalyzeDatabaseSchemaRequestSchema = z.object({
  id: UUIDSchema,
  forceReanalysis: z.boolean().default(false)
});

// ========================================================================
// PARAMETER DTOs
// ========================================================================

export const DatabaseSchemaIdParamSchema = IdParamSchema;
export const DatabaseSchemaOrganizationIdParamSchema = OrganizationIdParamSchema;

// ========================================================================
// QUERY DTOs
// ========================================================================

export const DatabaseSchemaSearchQuerySchema = BaseSearchQuerySchema.extend({
  type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch']).optional(),
  status: z.enum(['design', 'development', 'testing', 'production', 'deprecated']).optional(),
  tableType: z.enum(['table', 'view', 'materialized_view', 'function', 'procedure', 'trigger', 'index', 'sequence']).optional(),
  columnType: z.enum(['varchar', 'text', 'integer', 'bigint', 'decimal', 'boolean', 'date', 'timestamp', 'json', 'jsonb', 'uuid', 'array', 'enum']).optional(),
  constraintType: z.enum(['primary_key', 'foreign_key', 'unique', 'check', 'not_null', 'default', 'index']).optional(),
  isActive: z.coerce.boolean().optional(),
  hasBackup: z.coerce.boolean().optional(),
  hasMaintenance: z.coerce.boolean().optional(),
  minHealthScore: z.coerce.number().min(0).max(100).optional(),
  maxHealthScore: z.coerce.number().min(0).max(100).optional(),
  minPerformanceScore: z.coerce.number().min(0).max(100).optional(),
  maxPerformanceScore: z.coerce.number().min(0).max(100).optional(),
  minSecurityScore: z.coerce.number().min(0).max(100).optional(),
  maxSecurityScore: z.coerce.number().min(0).max(100).optional(),
  lastBackupFrom: z.coerce.date().optional(),
  lastBackupTo: z.coerce.date().optional(),
  lastMaintenanceFrom: z.coerce.date().optional(),
  lastMaintenanceTo: z.coerce.date().optional()
});

export const DatabaseSchemaBulkUpdateSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one database schema ID is required'),
  updates: z.object({
    status: z.enum(['design', 'development', 'testing', 'production', 'deprecated']).optional(),
    tags: z.array(z.string()).optional()
  })
});

export const DatabaseSchemaBulkDeleteSchema = BulkDeleteSchema;

// ========================================================================
// RESPONSE DTOs
// ========================================================================

export const DatabaseColumnResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['varchar', 'text', 'integer', 'bigint', 'decimal', 'boolean', 'date', 'timestamp', 'json', 'jsonb', 'uuid', 'array', 'enum']),
  length: z.number().optional(),
  precision: z.number().optional(),
  scale: z.number().optional(),
  nullable: z.boolean(),
  defaultValue: z.any().optional(),
  constraints: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['primary_key', 'foreign_key', 'unique', 'check', 'not_null', 'default', 'index']),
    columns: z.array(z.string()),
    referencedTable: z.string().optional(),
    referencedColumns: z.array(z.string()).optional(),
    condition: z.string().optional(),
    description: z.string(),
    isDeferrable: z.boolean(),
    initiallyDeferred: z.boolean(),
    onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
    onUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
  })),
  description: z.string(),
  isIndexed: z.boolean(),
  isPrimaryKey: z.boolean(),
  isForeignKey: z.boolean(),
  referencedTable: z.string().optional(),
  referencedColumn: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DatabaseConstraintResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['primary_key', 'foreign_key', 'unique', 'check', 'not_null', 'default', 'index']),
  columns: z.array(z.string()),
  referencedTable: z.string().optional(),
  referencedColumns: z.array(z.string()).optional(),
  condition: z.string().optional(),
  description: z.string(),
  isDeferrable: z.boolean(),
  initiallyDeferred: z.boolean(),
  onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
  onUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DatabaseIndexResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  table: z.string(),
  columns: z.array(z.string()),
  type: z.enum(['btree', 'hash', 'gin', 'gist', 'spgist', 'brin']),
  unique: z.boolean(),
  partial: z.boolean(),
  condition: z.string().optional(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DatabaseTriggerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  table: z.string(),
  event: z.enum(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']),
  timing: z.enum(['BEFORE', 'AFTER', 'INSTEAD OF']),
  function: z.string(),
  condition: z.string().optional(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DatabasePolicyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  table: z.string(),
  command: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL']),
  roles: z.array(z.string()),
  using: z.string().optional(),
  withCheck: z.string().optional(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DatabaseStatisticsResponseSchema = z.object({
  rowCount: z.number(),
  tableSize: z.number(),
  indexSize: z.number(),
  totalSize: z.number(),
  lastAnalyzed: z.date(),
  lastVacuumed: z.date(),
  lastAutoVacuumed: z.date(),
  deadTuples: z.number(),
  liveTuples: z.number(),
  nDistinct: z.number(),
  correlation: z.number(),
  mostCommonValues: z.array(z.any()),
  mostCommonFrequencies: z.array(z.number()),
  histogramBounds: z.array(z.any())
});

export const DatabaseTableResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['table', 'view', 'materialized_view', 'function', 'procedure', 'trigger', 'index', 'sequence']),
  schema: z.string(),
  description: z.string(),
  columns: z.array(DatabaseColumnResponseSchema),
  constraints: z.array(DatabaseConstraintResponseSchema),
  indexes: z.array(DatabaseIndexResponseSchema),
  triggers: z.array(DatabaseTriggerResponseSchema),
  rowLevelSecurity: z.boolean(),
  policies: z.array(DatabasePolicyResponseSchema),
  statistics: DatabaseStatisticsResponseSchema,
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DatabaseSchemaMetricsResponseSchema = z.object({
  totalTables: z.number(),
  totalViews: z.number(),
  totalFunctions: z.number(),
  totalProcedures: z.number(),
  totalTriggers: z.number(),
  totalIndexes: z.number(),
  totalConstraints: z.number(),
  totalPolicies: z.number(),
  totalSize: z.number(),
  averageTableSize: z.number(),
  largestTable: z.string(),
  smallestTable: z.string(),
  mostIndexedTable: z.string(),
  leastIndexedTable: z.string(),
  lastBackupDate: z.date().optional(),
  lastMaintenanceDate: z.date().optional(),
  healthScore: z.number(),
  performanceScore: z.number(),
  securityScore: z.number(),
  maintainabilityScore: z.number(),
  lastAnalysisDate: z.date(),
  analysisDuration: z.number()
});

export const DatabaseSchemaResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch']),
  status: z.enum(['design', 'development', 'testing', 'production', 'deprecated']),
  description: z.string().optional(),
  settings: z.object({
    type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch']),
    version: z.string(),
    encoding: z.string(),
    collation: z.string(),
    timezone: z.string(),
    connectionPool: z.object({
      min: z.number(),
      max: z.number(),
      idle: z.number(),
      acquire: z.number(),
      evict: z.number()
    }),
    migrations: z.object({
      enabled: z.boolean(),
      directory: z.string(),
      table: z.string(),
      lockTable: z.string()
    }),
    backup: z.object({
      enabled: z.boolean(),
      frequency: z.string(),
      retention: z.number(),
      compression: z.boolean()
    }),
    monitoring: z.object({
      enabled: z.boolean(),
      slowQueryThreshold: z.number(),
      logLevel: z.string(),
      metrics: z.boolean()
    }),
    security: z.object({
      ssl: z.boolean(),
      encryption: z.boolean(),
      auditLog: z.boolean(),
      rowLevelSecurity: z.boolean()
    }),
    performance: z.object({
      queryOptimization: z.boolean(),
      indexOptimization: z.boolean(),
      connectionPooling: z.boolean(),
      caching: z.boolean()
    }),
    customFields: z.record(z.any()),
    tags: z.array(z.string()),
    notes: z.string()
  }),
  metrics: DatabaseSchemaMetricsResponseSchema.optional(),
  tables: z.array(DatabaseTableResponseSchema),
  views: z.array(DatabaseTableResponseSchema),
  functions: z.array(DatabaseTableResponseSchema),
  procedures: z.array(DatabaseTableResponseSchema),
  triggers: z.array(DatabaseTriggerResponseSchema),
  indexes: z.array(DatabaseIndexResponseSchema),
  policies: z.array(DatabasePolicyResponseSchema),
  lastBackupDate: z.date().optional(),
  lastMaintenanceDate: z.date().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DatabaseSchemaListResponseSchema = ListResponseSchema.extend({
  data: z.array(DatabaseSchemaResponseSchema)
});

export const DatabaseSchemaStatsResponseSchema = BaseStatsSchema.extend({
  byType: z.record(z.number()),
  byStatus: z.record(z.number()),
  byTableType: z.record(z.number()),
  byColumnType: z.record(z.number()),
  byConstraintType: z.record(z.number()),
  totalTables: z.number(),
  totalViews: z.number(),
  totalFunctions: z.number(),
  totalProcedures: z.number(),
  totalTriggers: z.number(),
  totalIndexes: z.number(),
  totalConstraints: z.number(),
  totalPolicies: z.number(),
  totalSize: z.number(),
  averageTableSize: z.number(),
  averageHealthScore: z.number(),
  averagePerformanceScore: z.number(),
  averageSecurityScore: z.number(),
  averageMaintainabilityScore: z.number(),
  lastBackupDate: z.date().optional(),
  lastMaintenanceDate: z.date().optional(),
  totalBackupSize: z.number(),
  totalMaintenanceTime: z.number(),
  schemasWithBackup: z.number(),
  schemasWithMaintenance: z.number()
});

// ========================================================================
// BATCH OPERATION DTOs
// ========================================================================

export const BatchAnalysisRequestSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one database schema ID is required'),
  forceReanalysis: z.boolean().default(false)
});

// ========================================================================
// REPORT DTOs
// ========================================================================

export const DatabaseSchemaReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  filters: z.object({
    type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch']).optional(),
    status: z.enum(['design', 'development', 'testing', 'production', 'deprecated']).optional(),
    tableType: z.enum(['table', 'view', 'materialized_view', 'function', 'procedure', 'trigger', 'index', 'sequence']).optional(),
    columnType: z.enum(['varchar', 'text', 'integer', 'bigint', 'decimal', 'boolean', 'date', 'timestamp', 'json', 'jsonb', 'uuid', 'array', 'enum']).optional(),
    constraintType: z.enum(['primary_key', 'foreign_key', 'unique', 'check', 'not_null', 'default', 'index']).optional(),
    isActive: z.boolean().optional(),
    hasBackup: z.boolean().optional(),
    hasMaintenance: z.boolean().optional(),
    dateRange: DateRangeSchema.optional()
  }).optional()
});

export const TableReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema
});

export const PerformanceReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema
});

export const MaintenanceReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  filters: z.object({
    type: z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch']).optional(),
    status: z.enum(['design', 'development', 'testing', 'production', 'deprecated']).optional(),
    minHealthScore: z.number().min(0).max(100).optional(),
    maxHealthScore: z.number().min(0).max(100).optional(),
    minPerformanceScore: z.number().min(0).max(100).optional(),
    maxPerformanceScore: z.number().min(0).max(100).optional()
  }).optional()
});

// ========================================================================
// TYPE EXPORTS
// ========================================================================

export type CreateDatabaseSchemaRequest = z.infer<typeof CreateDatabaseSchemaRequestSchema>;
export type UpdateDatabaseSchemaRequest = z.infer<typeof UpdateDatabaseSchemaRequestSchema>;
export type AnalyzeDatabaseSchemaRequest = z.infer<typeof AnalyzeDatabaseSchemaRequestSchema>;
export type DatabaseSchemaIdParam = z.infer<typeof DatabaseSchemaIdParamSchema>;
export type DatabaseSchemaOrganizationIdParam = z.infer<typeof DatabaseSchemaOrganizationIdParamSchema>;
export type DatabaseSchemaSearchQuery = z.infer<typeof DatabaseSchemaSearchQuerySchema>;
export type DatabaseSchemaBulkUpdate = z.infer<typeof DatabaseSchemaBulkUpdateSchema>;
export type DatabaseSchemaBulkDelete = z.infer<typeof DatabaseSchemaBulkDeleteSchema>;
export type DatabaseSchemaResponse = z.infer<typeof DatabaseSchemaResponseSchema>;
export type DatabaseSchemaListResponse = z.infer<typeof DatabaseSchemaListResponseSchema>;
export type DatabaseSchemaStatsResponse = z.infer<typeof DatabaseSchemaStatsResponseSchema>;
export type DatabaseColumnResponse = z.infer<typeof DatabaseColumnResponseSchema>;
export type DatabaseConstraintResponse = z.infer<typeof DatabaseConstraintResponseSchema>;
export type DatabaseIndexResponse = z.infer<typeof DatabaseIndexResponseSchema>;
export type DatabaseTriggerResponse = z.infer<typeof DatabaseTriggerResponseSchema>;
export type DatabasePolicyResponse = z.infer<typeof DatabasePolicyResponseSchema>;
export type DatabaseStatisticsResponse = z.infer<typeof DatabaseStatisticsResponseSchema>;
export type DatabaseTableResponse = z.infer<typeof DatabaseTableResponseSchema>;
export type DatabaseSchemaMetricsResponse = z.infer<typeof DatabaseSchemaMetricsResponseSchema>;
export type BatchAnalysisRequest = z.infer<typeof BatchAnalysisRequestSchema>;
export type DatabaseSchemaReportRequest = z.infer<typeof DatabaseSchemaReportRequestSchema>;
export type TableReportRequest = z.infer<typeof TableReportRequestSchema>;
export type PerformanceReportRequest = z.infer<typeof PerformanceReportRequestSchema>;
export type MaintenanceReportRequest = z.infer<typeof MaintenanceReportRequestSchema>;
