import { Architecture } from '../../../domain/entities/architecture.entity.js';
import { ArchitectureRepository } from '../../../domain/repositories/architecture.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// ANALYZE ARCHITECTURE USE CASE - PR-0: MONOREPO + HEXAGONAL ARCHITECTURE
// ============================================================================

export interface AnalyzeArchitectureRequest extends BaseRequest {
  id: string;
  forceReanalysis?: boolean;
}

export interface AnalyzeArchitectureResponse extends BaseResponse {
  data: {
    architecture: Architecture;
    metrics: {
      totalComponents: number;
      totalLayers: number;
      complexity: number;
      coupling: number;
      cohesion: number;
      maintainability: number;
      testability: number;
      scalability: number;
      performance: number;
      security: number;
      lastAnalysisDate: Date;
      analysisDuration: number;
      qualityScore: number;
    };
  };
}

export class AnalyzeArchitectureUseCase extends BaseUseCase<AnalyzeArchitectureRequest, AnalyzeArchitectureResponse> {
  constructor(
    private readonly architectureRepository: ArchitectureRepository
  ) {
    super();
  }

  async execute(request: AnalyzeArchitectureRequest): Promise<AnalyzeArchitectureResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateId(request.id, 'Architecture ID');

    // ========================================================================
    // FIND EXISTING ARCHITECTURE
    // ========================================================================

    const existingArchitecture = await this.architectureRepository.findById(request.id);
    if (!existingArchitecture) {
      throw new Error(`Architecture with ID '${request.id}' not found`);
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if analysis is needed
    if (!request.forceReanalysis && existingArchitecture.lastAnalysisDate) {
      const daysSinceLastAnalysis = Math.floor(
        (Date.now() - existingArchitecture.lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastAnalysis < 1) {
        throw new Error('Architecture was analyzed recently. Use forceReanalysis=true to force reanalysis.');
      }
    }

    // ========================================================================
    // ANALYZE ARCHITECTURE
    // ========================================================================

    const startTime = Date.now();
    const metrics = existingArchitecture.analyzeArchitecture();
    const endTime = Date.now();
    
    // Update analysis duration
    metrics.analysisDuration = (endTime - startTime) / 1000; // Convert to seconds

    // ========================================================================
    // VALIDATE UPDATED ARCHITECTURE
    // ========================================================================

    if (!existingArchitecture.validate()) {
      throw new Error('Invalid architecture data after analysis');
    }

    // ========================================================================
    // SAVE UPDATED ARCHITECTURE
    // ========================================================================

    const updatedArchitecture = await this.architectureRepository.update(existingArchitecture);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      architecture: updatedArchitecture,
      metrics: {
        totalComponents: metrics.totalComponents,
        totalLayers: metrics.totalLayers,
        complexity: metrics.complexity,
        coupling: metrics.coupling,
        cohesion: metrics.cohesion,
        maintainability: metrics.maintainability,
        testability: metrics.testability,
        scalability: metrics.scalability,
        performance: metrics.performance,
        security: metrics.security,
        lastAnalysisDate: metrics.lastAnalysisDate,
        analysisDuration: metrics.analysisDuration,
        qualityScore: metrics.qualityScore
      }
    }, 'Architecture analyzed successfully');
  }
}
