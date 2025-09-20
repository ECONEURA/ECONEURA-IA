import { BaseUseCase } from '../base.use-case.js';
export class AnalyzeArchitectureUseCase extends BaseUseCase {
    architectureRepository;
    constructor(architectureRepository) {
        super();
        this.architectureRepository = architectureRepository;
    }
    async execute(request) {
        this.validateId(request.id, 'Architecture ID');
        const existingArchitecture = await this.architectureRepository.findById(request.id);
        if (!existingArchitecture) {
            throw new Error(`Architecture with ID '${request.id}' not found`);
        }
        if (!request.forceReanalysis && existingArchitecture.lastAnalysisDate) {
            const daysSinceLastAnalysis = Math.floor((Date.now() - existingArchitecture.lastAnalysisDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastAnalysis < 1) {
                throw new Error('Architecture was analyzed recently. Use forceReanalysis=true to force reanalysis.');
            }
        }
        const startTime = Date.now();
        const metrics = existingArchitecture.analyzeArchitecture();
        const endTime = Date.now();
        metrics.analysisDuration = (endTime - startTime) / 1000;
        if (!existingArchitecture.validate()) {
            throw new Error('Invalid architecture data after analysis');
        }
        const updatedArchitecture = await this.architectureRepository.update(existingArchitecture);
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
//# sourceMappingURL=analyze-architecture.use-case.js.map