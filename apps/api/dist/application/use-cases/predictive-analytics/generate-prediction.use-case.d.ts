import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { PredictiveAnalyticsRepository } from '../../../domain/repositories/predictive-analytics.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
export interface GeneratePredictionRequest extends BaseRequest {
    id: string;
    inputData: Record<string, any>;
    confidence?: number;
}
export interface GeneratePredictionResponse extends BaseResponse {
    data: {
        prediction: {
            id: string;
            timestamp: Date;
            inputData: Record<string, any>;
            predictedValue: number | string | boolean;
            confidence: number;
            probability?: number;
            metadata: Record<string, any>;
        };
        predictiveAnalytics: PredictiveAnalytics;
    };
}
export declare class GeneratePredictionUseCase extends BaseUseCase<GeneratePredictionRequest, GeneratePredictionResponse> {
    private readonly predictiveAnalyticsRepository;
    constructor(predictiveAnalyticsRepository: PredictiveAnalyticsRepository);
    execute(request: GeneratePredictionRequest): Promise<GeneratePredictionResponse>;
}
//# sourceMappingURL=generate-prediction.use-case.d.ts.map