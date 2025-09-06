import { DatabaseSchema } from '../../../domain/entities/database-schema.entity.js';
import { DatabaseSchemaRepository } from '../../../domain/repositories/database-schema.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// ANALYZE DATABASE SCHEMA USE CASE - PR-1: DATABASE SCHEMA COMPLETO
// ============================================================================

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

export class AnalyzeDatabaseSchemaUseCase extends BaseUseCase<AnalyzeDatabaseSchemaRequest, AnalyzeDatabaseSchemaResponse> {
  constructor(
    private readonly databaseSchemaRepository: DatabaseSchemaRepository
  ) {
    super();
  }

  async execute(request: AnalyzeDatabaseSchemaRequest): Promise<AnalyzeDatabaseSchemaResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateId(request.id, 'Database Schema ID');

    // ========================================================================
    // FIND EXISTING DATABASE SCHEMA
    // ========================================================================

    const existingDatabaseSchema = await this.databaseSchemaRepository.findById(request.id);
    if (!existingDatabaseSchema) {
      throw new Error(`Database schema with ID '${request.id}' not found`);
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if analysis is needed
    if (!request.forceReanalysis && existingDatabaseSchema.metrics) {
      const daysSinceLastAnalysis = Math.floor(
        (Date.now() - existingDatabaseSchema.metrics.lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastAnalysis < 1) {
        throw new Error('Database schema was analyzed recently. Use forceReanalysis=true to force reanalysis.');
      }
    }

    // ========================================================================
    // ANALYZE DATABASE SCHEMA
    // ========================================================================

    const startTime = Date.now();
    const metrics = existingDatabaseSchema.analyzeSchema();
    const endTime = Date.now();
    
    // Update analysis duration
    metrics.analysisDuration = (endTime - startTime) / 1000; // Convert to seconds

    // ========================================================================
    // VALIDATE UPDATED DATABASE SCHEMA
    // ========================================================================

    if (!existingDatabaseSchema.validate()) {
      throw new Error('Invalid database schema data after analysis');
    }

    // ========================================================================
    // SAVE UPDATED DATABASE SCHEMA
    // ========================================================================

    const updatedDatabaseSchema = await this.databaseSchemaRepository.update(existingDatabaseSchema);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

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
