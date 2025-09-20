import { BaseUseCase } from '../base.use-case.js';
export class AnalyzeDatabaseSchemaUseCase extends BaseUseCase {
    databaseSchemaRepository;
    constructor(databaseSchemaRepository) {
        super();
        this.databaseSchemaRepository = databaseSchemaRepository;
    }
    async execute(request) {
        this.validateId(request.id, 'Database Schema ID');
        const existingDatabaseSchema = await this.databaseSchemaRepository.findById(request.id);
        if (!existingDatabaseSchema) {
            throw new Error(`Database schema with ID '${request.id}' not found`);
        }
        if (!request.forceReanalysis && existingDatabaseSchema.metrics) {
            const daysSinceLastAnalysis = Math.floor((Date.now() - existingDatabaseSchema.metrics.lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastAnalysis < 1) {
                throw new Error('Database schema was analyzed recently. Use forceReanalysis=true to force reanalysis.');
            }
        }
        const startTime = Date.now();
        const metrics = existingDatabaseSchema.analyzeSchema();
        const endTime = Date.now();
        metrics.analysisDuration = (endTime - startTime) / 1000;
        if (!existingDatabaseSchema.validate()) {
            throw new Error('Invalid database schema data after analysis');
        }
        const updatedDatabaseSchema = await this.databaseSchemaRepository.update(existingDatabaseSchema);
        return this.createSuccessResponse({
            databaseSchema: updatedDatabaseSchema,
            metrics: {
                totalTables: metrics.totalTables,
                totalViews: metrics.totalViews,
                totalFunctions: metrics.totalFunctions,
                totalProcedures: metrics.totalProcedures,
                totalTriggers: metrics.totalTriggers,
                totalIndexes: metrics.totalIndexes,
                totalConstraints: metrics.totalConstraints,
                totalPolicies: metrics.totalPolicies,
                totalSize: metrics.totalSize,
                averageTableSize: metrics.averageTableSize,
                largestTable: metrics.largestTable,
                smallestTable: metrics.smallestTable,
                mostIndexedTable: metrics.mostIndexedTable,
                leastIndexedTable: metrics.leastIndexedTable,
                lastBackupDate: metrics.lastBackupDate,
                lastMaintenanceDate: metrics.lastMaintenanceDate,
                healthScore: metrics.healthScore,
                performanceScore: metrics.performanceScore,
                securityScore: metrics.securityScore,
                maintainabilityScore: metrics.maintainabilityScore,
                lastAnalysisDate: metrics.lastAnalysisDate,
                analysisDuration: metrics.analysisDuration
            }
        }, 'Database schema analyzed successfully');
    }
}
//# sourceMappingURL=analyze-database-schema.use-case.js.map