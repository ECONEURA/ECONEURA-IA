import { z } from 'zod';
import { BaseEntity, BaseEntityProps } from './base.entity.js';

// ============================================================================
// DATABASE SCHEMA ENTITY - PR-1: DATABASE SCHEMA COMPLETO
// ============================================================================

export interface DatabaseSchemaId {
  value: string;
}

export interface SchemaType {
  value: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'elasticsearch';
}

export interface SchemaStatus {
  value: 'design' | 'development' | 'testing' | 'production' | 'deprecated';
}

export interface TableType {
  value: 'table' | 'view' | 'materialized_view' | 'function' | 'procedure' | 'trigger' | 'index' | 'sequence';
}

export interface ColumnType {
  value: 'varchar' | 'text' | 'integer' | 'bigint' | 'decimal' | 'boolean' | 'date' | 'timestamp' | 'json' | 'jsonb' | 'uuid' | 'array' | 'enum';
}

export interface ConstraintType {
  value: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null' | 'default' | 'index';
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: ColumnType;
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  defaultValue?: any;
  constraints: DatabaseConstraint[];
  description: string;
  isIndexed: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencedTable?: string;
  referencedColumn?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseConstraint {
  id: string;
  name: string;
  type: ConstraintType;
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  condition?: string;
  description: string;
  isDeferrable: boolean;
  initiallyDeferred: boolean;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseTable {
  id: string;
  name: string;
  type: TableType;
  schema: string;
  description: string;
  columns: DatabaseColumn[];
  constraints: DatabaseConstraint[];
  indexes: DatabaseIndex[];
  triggers: DatabaseTrigger[];
  rowLevelSecurity: boolean;
  policies: DatabasePolicy[];
  statistics: DatabaseStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseIndex {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseTrigger {
  id: string;
  name: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE';
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  function: string;
  condition?: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabasePolicy {
  id: string;
  name: string;
  table: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  roles: string[];
  using?: string;
  withCheck?: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseStatistics {
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
}

export interface DatabaseSchemaSettings {
  type: SchemaType;
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
}

export interface DatabaseSchemaMetrics {
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
  largestTable: string;
  smallestTable: string;
  mostIndexedTable: string;
  leastIndexedTable: string;
  lastBackupDate?: Date;
  lastMaintenanceDate?: Date;
  healthScore: number;
  performanceScore: number;
  securityScore: number;
  maintainabilityScore: number;
  lastAnalysisDate: Date;
  analysisDuration: number;
}

export interface DatabaseSchemaProps extends BaseEntityProps {
  name: string;
  type: SchemaType;
  status: SchemaStatus;
  organizationId: string;
  description?: string;
  settings: DatabaseSchemaSettings;
  metrics?: DatabaseSchemaMetrics;
  tables: DatabaseTable[];
  views: DatabaseTable[];
  functions: DatabaseTable[];
  procedures: DatabaseTable[];
  triggers: DatabaseTrigger[];
  indexes: DatabaseIndex[];
  policies: DatabasePolicy[];
  lastBackupDate?: Date;
  lastMaintenanceDate?: Date;
  isActive: boolean;
}

export class DatabaseSchema extends BaseEntity {
  private constructor(private props: DatabaseSchemaProps) {
    super(props);
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<DatabaseSchemaProps, 'id' | 'createdAt' | 'updatedAt'>): DatabaseSchema {
    const now = new Date();
    return new DatabaseSchema({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromJSON(data: DatabaseSchemaProps): DatabaseSchema {
    return new DatabaseSchema(data);
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get name(): string { return this.props.name; }
  get type(): SchemaType { return this.props.type; }
  get status(): SchemaStatus { return this.props.status; }
  get organizationId(): string { return this.props.organizationId; }
  get description(): string | undefined { return this.props.description; }
  get settings(): DatabaseSchemaSettings { return this.props.settings; }
  get metrics(): DatabaseSchemaMetrics | undefined { return this.props.metrics; }
  get tables(): DatabaseTable[] { return this.props.tables; }
  get views(): DatabaseTable[] { return this.props.views; }
  get functions(): DatabaseTable[] { return this.props.functions; }
  get procedures(): DatabaseTable[] { return this.props.procedures; }
  get triggers(): DatabaseTrigger[] { return this.props.triggers; }
  get indexes(): DatabaseIndex[] { return this.props.indexes; }
  get policies(): DatabasePolicy[] { return this.props.policies; }
  get lastBackupDate(): Date | undefined { return this.props.lastBackupDate; }
  get lastMaintenanceDate(): Date | undefined { return this.props.lastMaintenanceDate; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.props.name = name.trim();
    this.updateTimestamp();
  }

  updateType(type: SchemaType): void {
    this.props.type = type;
    this.updateTimestamp();
  }

  updateStatus(status: SchemaStatus): void {
    this.props.status = status;
    this.updateTimestamp();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.updateTimestamp();
  }

  updateSettings(settings: DatabaseSchemaSettings): void {
    this.props.settings = settings;
    this.updateTimestamp();
  }

  updateMetrics(metrics: DatabaseSchemaMetrics): void {
    this.props.metrics = metrics;
    this.updateTimestamp();
  }

  addTable(table: DatabaseTable): void {
    this.props.tables.push(table);
    this.updateTimestamp();
  }

  removeTable(tableId: string): void {
    this.props.tables = this.props.tables.filter(table => table.id !== tableId);
    this.updateTimestamp();
  }

  updateTable(tableId: string, updates: Partial<DatabaseTable>): void {
    const tableIndex = this.props.tables.findIndex(table => table.id === tableId);
    if (tableIndex !== -1) {
      this.props.tables[tableIndex] = { ...this.props.tables[tableIndex], ...updates };
      this.updateTimestamp();
    }
  }

  addView(view: DatabaseTable): void {
    this.props.views.push(view);
    this.updateTimestamp();
  }

  removeView(viewId: string): void {
    this.props.views = this.props.views.filter(view => view.id !== viewId);
    this.updateTimestamp();
  }

  addFunction(func: DatabaseTable): void {
    this.props.functions.push(func);
    this.updateTimestamp();
  }

  removeFunction(functionId: string): void {
    this.props.functions = this.props.functions.filter(func => func.id !== functionId);
    this.updateTimestamp();
  }

  addProcedure(procedure: DatabaseTable): void {
    this.props.procedures.push(procedure);
    this.updateTimestamp();
  }

  removeProcedure(procedureId: string): void {
    this.props.procedures = this.props.procedures.filter(proc => proc.id !== procedureId);
    this.updateTimestamp();
  }

  addTrigger(trigger: DatabaseTrigger): void {
    this.props.triggers.push(trigger);
    this.updateTimestamp();
  }

  removeTrigger(triggerId: string): void {
    this.props.triggers = this.props.triggers.filter(trigger => trigger.id !== triggerId);
    this.updateTimestamp();
  }

  addIndex(index: DatabaseIndex): void {
    this.props.indexes.push(index);
    this.updateTimestamp();
  }

  removeIndex(indexId: string): void {
    this.props.indexes = this.props.indexes.filter(index => index.id !== indexId);
    this.updateTimestamp();
  }

  addPolicy(policy: DatabasePolicy): void {
    this.props.policies.push(policy);
    this.updateTimestamp();
  }

  removePolicy(policyId: string): void {
    this.props.policies = this.props.policies.filter(policy => policy.id !== policyId);
    this.updateTimestamp();
  }

  updateLastBackupDate(): void {
    this.props.lastBackupDate = new Date();
    this.updateTimestamp();
  }

  updateLastMaintenanceDate(): void {
    this.props.lastMaintenanceDate = new Date();
    this.updateTimestamp();
  }

  // ========================================================================
  // SCHEMA ANALYSIS METHODS
  // ========================================================================

  analyzeSchema(): DatabaseSchemaMetrics {
    const metrics: DatabaseSchemaMetrics = {
      totalTables: this.props.tables.length,
      totalViews: this.props.views.length,
      totalFunctions: this.props.functions.length,
      totalProcedures: this.props.procedures.length,
      totalTriggers: this.props.triggers.length,
      totalIndexes: this.props.indexes.length,
      totalConstraints: this.calculateTotalConstraints(),
      totalPolicies: this.props.policies.length,
      totalSize: this.calculateTotalSize(),
      averageTableSize: this.calculateAverageTableSize(),
      largestTable: this.findLargestTable(),
      smallestTable: this.findSmallestTable(),
      mostIndexedTable: this.findMostIndexedTable(),
      leastIndexedTable: this.findLeastIndexedTable(),
      lastBackupDate: this.props.lastBackupDate,
      lastMaintenanceDate: this.props.lastMaintenanceDate,
      healthScore: this.calculateHealthScore(),
      performanceScore: this.calculatePerformanceScore(),
      securityScore: this.calculateSecurityScore(),
      maintainabilityScore: this.calculateMaintainabilityScore(),
      lastAnalysisDate: new Date(),
      analysisDuration: 0
    };

    this.props.metrics = metrics;
    this.updateTimestamp();

    return metrics;
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private calculateTotalConstraints(): number {
    let total = 0;
    for (const table of this.props.tables) {
      total += table.constraints.length;
    }
    return total;
  }

  private calculateTotalSize(): number {
    let total = 0;
    for (const table of this.props.tables) {
      total += table.statistics.totalSize;
    }
    return total;
  }

  private calculateAverageTableSize(): number {
    if (this.props.tables.length === 0) return 0;
    return this.calculateTotalSize() / this.props.tables.length;
  }

  private findLargestTable(): string {
    if (this.props.tables.length === 0) return '';
    return this.props.tables.reduce((largest, current) => 
      current.statistics.totalSize > largest.statistics.totalSize ? current : largest
    ).name;
  }

  private findSmallestTable(): string {
    if (this.props.tables.length === 0) return '';
    return this.props.tables.reduce((smallest, current) => 
      current.statistics.totalSize < smallest.statistics.totalSize ? current : smallest
    ).name;
  }

  private findMostIndexedTable(): string {
    if (this.props.tables.length === 0) return '';
    return this.props.tables.reduce((most, current) => 
      current.indexes.length > most.indexes.length ? current : most
    ).name;
  }

  private findLeastIndexedTable(): string {
    if (this.props.tables.length === 0) return '';
    return this.props.tables.reduce((least, current) => 
      current.indexes.length < least.indexes.length ? current : least
    ).name;
  }

  private calculateHealthScore(): number {
    // Calculate health score based on various factors
    let score = 100;
    
    // Deduct points for tables without indexes
    for (const table of this.props.tables) {
      if (table.indexes.length === 0) score -= 5;
    }
    
    // Deduct points for tables without constraints
    for (const table of this.props.tables) {
      if (table.constraints.length === 0) score -= 3;
    }
    
    // Deduct points for large tables without proper indexing
    for (const table of this.props.tables) {
      if (table.statistics.totalSize > 1000000 && table.indexes.length < 3) score -= 10;
    }
    
    return Math.max(0, score);
  }

  private calculatePerformanceScore(): number {
    // Calculate performance score based on indexing and optimization
    let score = 100;
    
    // Deduct points for missing indexes on foreign keys
    for (const table of this.props.tables) {
      for (const column of table.columns) {
        if (column.isForeignKey && !column.isIndexed) score -= 5;
      }
    }
    
    // Deduct points for tables with high dead tuple ratio
    for (const table of this.props.tables) {
      const deadRatio = table.statistics.deadTuples / (table.statistics.liveTuples + table.statistics.deadTuples);
      if (deadRatio > 0.1) score -= 10;
    }
    
    return Math.max(0, score);
  }

  private calculateSecurityScore(): number {
    // Calculate security score based on security features
    let score = 100;
    
    // Deduct points for tables without RLS
    for (const table of this.props.tables) {
      if (!table.rowLevelSecurity) score -= 15;
    }
    
    // Deduct points for tables without policies
    for (const table of this.props.tables) {
      if (table.policies.length === 0) score -= 10;
    }
    
    // Deduct points for tables without proper constraints
    for (const table of this.props.tables) {
      const hasPrimaryKey = table.constraints.some(c => c.type.value === 'primary_key');
      if (!hasPrimaryKey) score -= 20;
    }
    
    return Math.max(0, score);
  }

  private calculateMaintainabilityScore(): number {
    // Calculate maintainability score based on documentation and structure
    let score = 100;
    
    // Deduct points for tables without description
    for (const table of this.props.tables) {
      if (!table.description || table.description.trim().length === 0) score -= 5;
    }
    
    // Deduct points for columns without description
    for (const table of this.props.tables) {
      for (const column of table.columns) {
        if (!column.description || column.description.trim().length === 0) score -= 1;
      }
    }
    
    // Deduct points for tables with too many columns (complexity)
    for (const table of this.props.tables) {
      if (table.columns.length > 20) score -= 5;
    }
    
    return Math.max(0, score);
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    if (!this.validateBase()) {
      return false;
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      return false;
    }

    if (!this.props.organizationId || this.props.organizationId.trim().length === 0) {
      return false;
    }

    if (!this.props.settings.version || this.props.settings.version.trim().length === 0) {
      return false;
    }

    return true;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): DatabaseSchemaProps {
    return { ...this.props };
  }

  clone(): DatabaseSchema {
    return DatabaseSchema.fromJSON(this.toJSON());
  }

  // ========================================================================
  // FACTORY METHODS FOR SPECIFIC DATABASE TYPES
  // ========================================================================

  static createPostgreSQLSchema(props: Omit<DatabaseSchemaProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): DatabaseSchema {
    return DatabaseSchema.create({
      ...props,
      type: 'postgresql',
    });
  }

  static createMySQLSchema(props: Omit<DatabaseSchemaProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): DatabaseSchema {
    return DatabaseSchema.create({
      ...props,
      type: 'mysql',
    });
  }

  static createMongoDBSchema(props: Omit<DatabaseSchemaProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): DatabaseSchema {
    return DatabaseSchema.create({
      ...props,
      type: 'mongodb',
    });
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { DatabaseSchemaId, SchemaType, SchemaStatus, TableType, ColumnType, ConstraintType, DatabaseColumn, DatabaseConstraint, DatabaseTable, DatabaseIndex, DatabaseTrigger, DatabasePolicy, DatabaseStatistics, DatabaseSchemaSettings, DatabaseSchemaMetrics };
