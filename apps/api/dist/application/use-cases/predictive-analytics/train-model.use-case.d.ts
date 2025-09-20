import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { PredictiveAnalyticsRepository } from '../../../domain/repositories/predictive-analytics.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
export interface TrainModelRequest extends BaseRequest {
    id: string;
    trainingData?: Record<string, any>[];
    forceRetrain?: boolean;
}
export interface TrainModelResponse extends BaseResponse {
    data: {
        predictiveAnalytics: PredictiveAnalytics;
        trainingMetrics: {
            accuracy: number;
            precision: number;
            recall: number;
            f1Score: number;
            mae: number;
            mse: number;
            rmse: number;
            r2Score: number;
            lastTrainingDate: Date;
            trainingDuration: number;
            dataPoints: number;
            modelVersion: string;
        };
    };
}
export declare class TrainModelUseCase extends BaseUseCase<TrainModelRequest, TrainModelResponse> {
    private readonly predictiveAnalyticsRepository;
    constructor(predictiveAnalyticsRepository: PredictiveAnalyticsRepository);
    execute(request: TrainModelRequest): Promise<TrainModelResponse>;
    private calculateTrainingTime;
    private generateTrainingMetrics;
    private generateModelVersion;
}
//# sourceMappingURL=train-model.use-case.d.ts.map