import { DatabaseSchema } from '../../../domain/entities/database-schema.entity.js';
import { DatabaseSchemaRepository } from '../../../domain/repositories/database-schema.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
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
export declare class CreateDatabaseSchemaUseCase extends BaseUseCase<CreateDatabaseSchemaRequest, CreateDatabaseSchemaResponse> {
    private readonly databaseSchemaRepository;
    constructor(databaseSchemaRepository: DatabaseSchemaRepository);
    execute(request: CreateDatabaseSchemaRequest): Promise<CreateDatabaseSchemaResponse>;
}
//# sourceMappingURL=create-database-schema.use-case.d.ts.map