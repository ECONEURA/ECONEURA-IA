import { DatabaseSchema } from '../../../domain/entities/database-schema.entity.js';
import { DatabaseSchemaRepository } from '../../../domain/repositories/database-schema.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// CREATE DATABASE SCHEMA USE CASE - PR-1: DATABASE SCHEMA COMPLETO
// ============================================================================

export interface CreateDatabaseSchemaRequest extends BaseRequest {
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'elasticsearch';
  description?: string;
  settings: {
    version: string;
    encoding: string;
    collation: string;
    timezone: string;
    connectionPool: {
      min: number;
      max: number;
      idle: number;
      acquire: number;
      evict: number;
    };
    migrations: {
      enabled: boolean;
      directory: string;
      table: string;
      lockTable: string;
    };
    backup: {
      enabled: boolean;
      frequency: string;
      retention: number;
      compression: boolean;
    };
    monitoring: {
      enabled: boolean;
      slowQueryThreshold: number;
      logLevel: string;
      metrics: boolean;
    };
    security: {
      ssl: boolean;
      encryption: boolean;
      auditLog: boolean;
      rowLevelSecurity: boolean;
    };
    performance: {
      queryOptimization: boolean;
      indexOptimization: boolean;
      connectionPooling: boolean;
      caching: boolean;
    };
    customFields: Record<string, any>;
    tags: string[];
    notes: string;
  };
  tables?: Array<{
    id: string;
    name: string;
    type: 'table' | 'view' | 'materialized_view' | 'function' | 'procedure' | 'trigger' | 'index' | 'sequence';
    schema: string;
    description: string;
    columns: Array<{
      id: string;
      name: string;
      type: 'varchar' | 'text' | 'integer' | 'bigint' | 'decimal' | 'boolean' | 'date' | 'timestamp' | 'json' | 'jsonb' | 'uuid' | 'array' | 'enum';
      length?: number;
      precision?: number;
      scale?: number;
      nullable: boolean;
      defaultValue?: any;
      constraints: Array<{
        id: string;
        name: string;
        type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null' | 'default' | 'index';
        columns: string[];
        referencedTable?: string;
        referencedColumns?: string[];
        condition?: string;
        description: string;
        isDeferrable: boolean;
        initiallyDeferred: boolean;
        onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
        onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
      }>;
      description: string;
      isIndexed: boolean;
      isPrimaryKey: boolean;
      isForeignKey: boolean;
      referencedTable?: string;
      referencedColumn?: string;
    }>;
    constraints: Array<{
      id: string;
      name: string;
      type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null' | 'default' | 'index';
      columns: string[];
      referencedTable?: string;
      referencedColumns?: string[];
      condition?: string;
      description: string;
      isDeferrable: boolean;
      initiallyDeferred: boolean;
      onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
      onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    }>;
    indexes: Array<{
      id: string;
      name: string;
      table: string;
      columns: string[];
      type: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
      unique: boolean;
      partial: boolean;
      condition?: string;
      description: string;
      isActive: boolean;
    }>;
    triggers: Array<{
      id: string;
      name: string;
      table: string;
      event: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
      timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
      function: string;
      condition?: string;
      description: string;
      isActive: boolean;
    }>;
    rowLevelSecurity: boolean;
    policies: Array<{
      id: string;
      name: string;
      table: string;
      command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
      roles: string[];
      using?: string;
      withCheck?: string;
      description: string;
      isActive: boolean;
    }>;
    statistics: {
      rowCount: number;
      tableSize: number;
      indexSize: number;
      totalSize: number;
      lastAnalyzed: Date;
      lastVacuumed: Date;
      lastAutoVacuumed: Date;
      deadTuples: number;
      liveTuples: number;
      nDistinct: number;
      correlation: number;
      mostCommonValues: any[];
      mostCommonFrequencies: number[];
      histogramBounds: any[];
    };
  }>;
}

export interface CreateDatabaseSchemaResponse extends BaseResponse {
  data: {
    databaseSchema: DatabaseSchema;
  };
}

export class CreateDatabaseSchemaUseCase extends BaseUseCase<CreateDatabaseSchemaRequest, CreateDatabaseSchemaResponse> {
  constructor(
    private readonly databaseSchemaRepository: DatabaseSchemaRepository
  ) {
    super();
  }

  async execute(request: CreateDatabaseSchemaRequest): Promise<CreateDatabaseSchemaResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateBaseRequest(request);
    this.validateString(request.name, 'Name');
    this.validateString(request.type, 'Database type');
    this.validateString(request.settings.version, 'Version');

    if (request.settings.connectionPool.min < 0) {
      throw new Error('Connection pool minimum cannot be negative');
    }

    if (request.settings.connectionPool.max <= request.settings.connectionPool.min) {
      throw new Error('Connection pool maximum must be greater than minimum');
    }

    if (request.settings.backup.retention < 0) {
      throw new Error('Backup retention cannot be negative');
    }

    if (request.settings.monitoring.slowQueryThreshold < 0) {
      throw new Error('Slow query threshold cannot be negative');
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if schema with same name already exists
    const existingSchema = await this.databaseSchemaRepository.existsByName(request.name, request.organizationId);
    if (existingSchema) {
      throw new Error(`Database schema with name '${request.name}' already exists`);
    }

    // ========================================================================
    // CREATE DATABASE SCHEMA
    // ========================================================================

    const databaseSchema = DatabaseSchema.create({
      organizationId: request.organizationId,
      name: request.name,
      type: request.type,
      status: 'design',
      description: request.description,
      settings: {
        type: request.type,
        version: request.settings.version,
        encoding: request.settings.encoding,
        collation: request.settings.collation,
        timezone: request.settings.timezone,
        connectionPool: request.settings.connectionPool,
        migrations: request.settings.migrations,
        backup: request.settings.backup,
        monitoring: request.settings.monitoring,
        security: request.settings.security,
        performance: request.settings.performance,
        customFields: request.settings.customFields,
        tags: request.settings.tags,
        notes: request.settings.notes,
      },
      tables: request.tables ? request.tables.map(table => ({
        id: table.id,
        name: table.name,
        type: table.type,
        schema: table.schema,
        description: table.description,
        columns: table.columns.map(column => ({
          id: column.id,
          name: column.name,
          type: column.type,
          length: column.length,
          precision: column.precision,
          scale: column.scale,
          nullable: column.nullable,
          defaultValue: column.defaultValue,
          constraints: column.constraints.map(constraint => ({
            id: constraint.id,
            name: constraint.name,
            type: constraint.type,
            columns: constraint.columns,
            referencedTable: constraint.referencedTable,
            referencedColumns: constraint.referencedColumns,
            condition: constraint.condition,
            description: constraint.description,
            isDeferrable: constraint.isDeferrable,
            initiallyDeferred: constraint.initiallyDeferred,
            onDelete: constraint.onDelete,
            onUpdate: constraint.onUpdate,
            createdAt: new Date(),
            updatedAt: new Date()
          })),
          description: column.description,
          isIndexed: column.isIndexed,
          isPrimaryKey: column.isPrimaryKey,
          isForeignKey: column.isForeignKey,
          referencedTable: column.referencedTable,
          referencedColumn: column.referencedColumn,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        constraints: table.constraints.map(constraint => ({
          id: constraint.id,
          name: constraint.name,
          type: constraint.type,
          columns: constraint.columns,
          referencedTable: constraint.referencedTable,
          referencedColumns: constraint.referencedColumns,
          condition: constraint.condition,
          description: constraint.description,
          isDeferrable: constraint.isDeferrable,
          initiallyDeferred: constraint.initiallyDeferred,
          onDelete: constraint.onDelete,
          onUpdate: constraint.onUpdate,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        indexes: table.indexes.map(index => ({
          id: index.id,
          name: index.name,
          table: index.table,
          columns: index.columns,
          type: index.type,
          unique: index.unique,
          partial: index.partial,
          condition: index.condition,
          description: index.description,
          isActive: index.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        triggers: table.triggers.map(trigger => ({
          id: trigger.id,
          name: trigger.name,
          table: trigger.table,
          event: trigger.event,
          timing: trigger.timing,
          function: trigger.function,
          condition: trigger.condition,
          description: trigger.description,
          isActive: trigger.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        rowLevelSecurity: table.rowLevelSecurity,
        policies: table.policies.map(policy => ({
          id: policy.id,
          name: policy.name,
          table: policy.table,
          command: policy.command,
          roles: policy.roles,
          using: policy.using,
          withCheck: policy.withCheck,
          description: policy.description,
          isActive: policy.isActive,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        statistics: table.statistics,
        createdAt: new Date(),
        updatedAt: new Date()
      })) : [],
      views: [],
      functions: [],
      procedures: [],
      triggers: [],
      indexes: [],
      policies: [],
      isActive: true,
    });

    // ========================================================================
    // VALIDATE DATABASE SCHEMA
    // ========================================================================

    if (!databaseSchema.validate()) {
      throw new Error('Invalid database schema data');
    }

    // ========================================================================
    // SAVE DATABASE SCHEMA
    // ========================================================================

    const savedDatabaseSchema = await this.databaseSchemaRepository.save(databaseSchema);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      databaseSchema: savedDatabaseSchema,
    }, 'Database schema created successfully');
  }
}
