import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        organizationId: string;
        role: string;
        permissions: string[];
    };
}
export declare class AdvancedFeaturesController {
    private db;
    private requestMetrics;
    constructor();
    private startMetricsCleanup;
    private generateRequestId;
    private logRequest;
    private updateMetrics;
    private sendResponse;
    predictDemand(req: AuthenticatedRequest, res: Response): Promise<void>;
    optimizeInventory(req: Request, res: Response): Promise<void>;
    analyzeSeasonality(req: Request, res: Response): Promise<void>;
    generateRecommendations(req: Request, res: Response): Promise<void>;
    getKPIScorecard(req: Request, res: Response): Promise<void>;
    getTrendAnalysis(req: Request, res: Response): Promise<void>;
    generateAlerts(req: Request, res: Response): Promise<void>;
    updateMetric(req: Request, res: Response): Promise<void>;
    trainModel(req: Request, res: Response): Promise<void>;
    predict(req: Request, res: Response): Promise<void>;
    evaluateModel(req: Request, res: Response): Promise<void>;
    getModels(req: Request, res: Response): Promise<void>;
    analyzeSentiment(req: Request, res: Response): Promise<void>;
    analyzeBatchSentiment(req: Request, res: Response): Promise<void>;
    getSentimentTrends(req: Request, res: Response): Promise<void>;
    chat(req: Request, res: Response): Promise<void>;
    generateImage(req: Request, res: Response): Promise<void>;
    textToSpeech(req: Request, res: Response): Promise<void>;
    getUsageStats(req: Request, res: Response): Promise<void>;
    search(req: Request, res: Response): Promise<void>;
    searchNews(req: Request, res: Response): Promise<void>;
    getTrendingTopics(req: Request, res: Response): Promise<void>;
    healthCheck(req: Request, res: Response): Promise<void>;
}
export declare const advancedFeaturesController: AdvancedFeaturesController;
export {};
//# sourceMappingURL=advanced-features.controller.d.ts.map