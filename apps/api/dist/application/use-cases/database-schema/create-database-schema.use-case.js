import { DatabaseSchema } from '../../../domain/entities/database-schema.entity.js';
import { BaseUseCase } from '../base.use-case.js';
export class CreateDatabaseSchemaUseCase extends BaseUseCase {
    databaseSchemaRepository;
    constructor(databaseSchemaRepository) {
        super();
        this.databaseSchemaRepository = databaseSchemaRepository;
    }
    async execute(request) {
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
        const existingSchema = await this.databaseSchemaRepository.existsByName(request.name, request.organizationId);
        if (existingSchema) {
            throw new Error(`Database schema with name '${request.name}' already exists`);
        }
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
        if (!databaseSchema.validate()) {
            throw new Error('Invalid database schema data');
        }
        const savedDatabaseSchema = await this.databaseSchemaRepository.save(databaseSchema);
        return this.createSuccessResponse({
            databaseSchema: savedDatabaseSchema,
        }, 'Database schema created successfully');
    }
}
//# sourceMappingURL=create-database-schema.use-case.js.map