import { DatabaseSchema } from '../../../domain/entities/database-schema.entity.js';
import { DatabaseSchemaRepository } from '../../../domain/repositories/database-schema.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
export interface AnalyzeDatabaseSchemaRequest extends BaseRequest {
    id: string;
    forceReanalysis?: boolean;
}
export interface AnalyzeDatabaseSchemaResponse extends BaseResponse {
    data: {
        databaseSchema: DatabaseSchema;
        metrics: {
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
        };
    };
}
export declare class AnalyzeDatabaseSchemaUseCase extends BaseUseCase<AnalyzeDatabaseSchemaRequest, AnalyzeDatabaseSchemaResponse> {
    private readonly databaseSchemaRepository;
    constructor(databaseSchemaRepository: DatabaseSchemaRepository);
    execute(request: AnalyzeDatabaseSchemaRequest): Promise<AnalyzeDatabaseSchemaResponse>;
}
//# sourceMappingURL=analyze-database-schema.use-case.d.ts.map