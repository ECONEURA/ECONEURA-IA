import { Request, Response, NextFunction } from 'express';
import { PredictiveAnalyticsRepository } from '../../domain/repositories/predictive-analytics.repository.js';
import { BaseController } from './base.controller.js';
export declare class PredictiveAnalyticsController extends BaseController {
    private predictiveAnalyticsRepository;
    private createPredictiveAnalyticsUseCase;
    private updatePredictiveAnalyticsUseCase;
    private generatePredictionUseCase;
    private trainModelUseCase;
    constructor(predictiveAnalyticsRepository: PredictiveAnalyticsRepository);
    createPredictiveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    updatePredictiveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    deletePredictiveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPredictiveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPredictiveAnalyticsByOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchPredictiveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPredictiveAnalyticsStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAnalyticsByType(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAnalyticsByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getActiveModels(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNeedsRetraining(req: Request, res: Response, next: NextFunction): Promise<void>;
    generatePrediction(req: Request, res: Response, next: NextFunction): Promise<void>;
    trainModel(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdatePredictiveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDeletePredictiveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void>;
    private transformPredictiveAnalyticsToResponse;
    private transformStatsToResponse;
}
//# sourceMappingURL=predictive-analytics.controller.d.ts.map