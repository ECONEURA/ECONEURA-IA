import { Architecture } from '../../../domain/entities/architecture.entity.js';
import { ArchitectureRepository } from '../../../domain/repositories/architecture.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
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
export declare class AnalyzeArchitectureUseCase extends BaseUseCase<AnalyzeArchitectureRequest, AnalyzeArchitectureResponse> {
    private readonly architectureRepository;
    constructor(architectureRepository: ArchitectureRepository);
    execute(request: AnalyzeArchitectureRequest): Promise<AnalyzeArchitectureResponse>;
}
//# sourceMappingURL=analyze-architecture.use-case.d.ts.map