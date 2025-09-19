import { BaseEntity, BaseEntityProps } from './base.entity.js';
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
export declare class DatabaseSchema extends BaseEntity {
    private props;
    private constructor();
    static create(props: Omit<DatabaseSchemaProps, 'id' | 'createdAt' | 'updatedAt'>): DatabaseSchema;
    static fromJSON(data: DatabaseSchemaProps): DatabaseSchema;
    get name(): string;
    get type(): SchemaType;
    get status(): SchemaStatus;
    get organizationId(): string;
    get description(): string | undefined;
    get settings(): DatabaseSchemaSettings;
    get metrics(): DatabaseSchemaMetrics | undefined;
    get tables(): DatabaseTable[];
    get views(): DatabaseTable[];
    get functions(): DatabaseTable[];
    get procedures(): DatabaseTable[];
    get triggers(): DatabaseTrigger[];
    get indexes(): DatabaseIndex[];
    get policies(): DatabasePolicy[];
    get lastBackupDate(): Date | undefined;
    get lastMaintenanceDate(): Date | undefined;
    updateName(name: string): void;
    updateType(type: SchemaType): void;
    updateStatus(status: SchemaStatus): void;
    updateDescription(description: string): void;
    updateSettings(settings: DatabaseSchemaSettings): void;
    updateMetrics(metrics: DatabaseSchemaMetrics): void;
    addTable(table: DatabaseTable): void;
    removeTable(tableId: string): void;
    updateTable(tableId: string, updates: Partial<DatabaseTable>): void;
    addView(view: DatabaseTable): void;
    removeView(viewId: string): void;
    addFunction(func: DatabaseTable): void;
    removeFunction(functionId: string): void;
    addProcedure(procedure: DatabaseTable): void;
    removeProcedure(procedureId: string): void;
    addTrigger(trigger: DatabaseTrigger): void;
    removeTrigger(triggerId: string): void;
    addIndex(index: DatabaseIndex): void;
    removeIndex(indexId: string): void;
    addPolicy(policy: DatabasePolicy): void;
    removePolicy(policyId: string): void;
    updateLastBackupDate(): void;
    updateLastMaintenanceDate(): void;
    analyzeSchema(): DatabaseSchemaMetrics;
    private calculateTotalConstraints;
    private calculateTotalSize;
    private calculateAverageTableSize;
    private findLargestTable;
    private findSmallestTable;
    private findMostIndexedTable;
    private findLeastIndexedTable;
    private calculateHealthScore;
    private calculatePerformanceScore;
    private calculateSecurityScore;
    private calculateMaintainabilityScore;
    validate(): boolean;
    toJSON(): DatabaseSchemaProps;
    clone(): DatabaseSchema;
    static createPostgreSQLSchema(props: Omit<DatabaseSchemaProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): DatabaseSchema;
    static createMySQLSchema(props: Omit<DatabaseSchemaProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): DatabaseSchema;
    static createMongoDBSchema(props: Omit<DatabaseSchemaProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): DatabaseSchema;
}
export type { DatabaseSchemaId, SchemaType, SchemaStatus, TableType, ColumnType, ConstraintType, DatabaseColumn, DatabaseConstraint, DatabaseTable, DatabaseIndex, DatabaseTrigger, DatabasePolicy, DatabaseStatistics, DatabaseSchemaSettings, DatabaseSchemaMetrics };
//# sourceMappingURL=database-schema.entity.d.ts.map