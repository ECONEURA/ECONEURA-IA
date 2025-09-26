import { CreatePredictiveAnalyticsUseCase } from '../../application/use-cases/predictive-analytics/create-predictive-analytics.use-case.js';
import { UpdatePredictiveAnalyticsUseCase } from '../../application/use-cases/predictive-analytics/update-predictive-analytics.use-case.js';
import { GeneratePredictionUseCase } from '../../application/use-cases/predictive-analytics/generate-prediction.use-case.js';
import { TrainModelUseCase } from '../../application/use-cases/predictive-analytics/train-model.use-case.js';
import { CreatePredictiveAnalyticsRequestSchema, UpdatePredictiveAnalyticsRequestSchema, GeneratePredictionRequestSchema, TrainModelRequestSchema, PredictiveAnalyticsIdParamSchema, PredictiveAnalyticsOrganizationIdParamSchema, PredictiveAnalyticsSearchQuerySchema, PredictiveAnalyticsBulkUpdateSchema, PredictiveAnalyticsBulkDeleteSchema } from '../dto/predictive-analytics.dto.js';

import { BaseController } from './base.controller.js';
export class PredictiveAnalyticsController extends BaseController {
    predictiveAnalyticsRepository;
    createPredictiveAnalyticsUseCase;
    updatePredictiveAnalyticsUseCase;
    generatePredictionUseCase;
    trainModelUseCase;
    constructor(predictiveAnalyticsRepository) {
        super();
        this.predictiveAnalyticsRepository = predictiveAnalyticsRepository;
        this.createPredictiveAnalyticsUseCase = new CreatePredictiveAnalyticsUseCase(predictiveAnalyticsRepository);
        this.updatePredictiveAnalyticsUseCase = new UpdatePredictiveAnalyticsUseCase(predictiveAnalyticsRepository);
        this.generatePredictionUseCase = new GeneratePredictionUseCase(predictiveAnalyticsRepository);
        this.trainModelUseCase = new TrainModelUseCase(predictiveAnalyticsRepository);
    }
    async createPredictiveAnalytics(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = CreatePredictiveAnalyticsRequestSchema.parse(req.body);
            const createdBy = this.getUserId(req);
            const result = await this.createPredictiveAnalyticsUseCase.execute({
                ...requestData,
                createdBy
            });
            const response = this.transformPredictiveAnalyticsToResponse(result.data.predictiveAnalytics);
            this.sendSuccessResponse(res, response, 'Predictive analytics created successfully', 201);
        }, res, next);
    }
    async updatePredictiveAnalytics(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = PredictiveAnalyticsIdParamSchema.parse(req.params);
            const requestData = UpdatePredictiveAnalyticsRequestSchema.parse(req.body);
            const updatedBy = this.getUserId(req);
            const result = await this.updatePredictiveAnalyticsUseCase.execute({
                id,
                ...requestData,
                updatedBy
            });
            const response = this.transformPredictiveAnalyticsToResponse(result.data.predictiveAnalytics);
            this.sendSuccessResponse(res, response, 'Predictive analytics updated successfully');
        }, res, next);
    }
    async deletePredictiveAnalytics(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = PredictiveAnalyticsIdParamSchema.parse(req.params);
            const deletedBy = this.getUserId(req);
            await this.predictiveAnalyticsRepository.delete(id);
            this.sendSuccessResponse(res, null, 'Predictive analytics deleted successfully');
        }, res, next);
    }
    async getPredictiveAnalytics(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = PredictiveAnalyticsIdParamSchema.parse(req.params);
            const predictiveAnalytics = await this.predictiveAnalyticsRepository.findById(id);
            if (!predictiveAnalytics) {
                this.sendNotFoundResponse(res, 'Predictive analytics');
                return;
            }
            const response = this.transformPredictiveAnalyticsToResponse(predictiveAnalytics);
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getPredictiveAnalyticsByOrganization(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = PredictiveAnalyticsOrganizationIdParamSchema.parse(req.params);
            const query = PredictiveAnalyticsSearchQuerySchema.parse(req.query);
            const result = await this.predictiveAnalyticsRepository.findByOrganizationId(organizationId, query);
            const response = {
                data: result.data.map(predictiveAnalytics => this.transformPredictiveAnalyticsToResponse(predictiveAnalytics)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async searchPredictiveAnalytics(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = PredictiveAnalyticsOrganizationIdParamSchema.parse(req.params);
            const query = PredictiveAnalyticsSearchQuerySchema.parse(req.query);
            const result = await this.predictiveAnalyticsRepository.search(query.search || '', organizationId, query);
            const response = {
                data: result.data.map(predictiveAnalytics => this.transformPredictiveAnalyticsToResponse(predictiveAnalytics)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getPredictiveAnalyticsStats(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = PredictiveAnalyticsOrganizationIdParamSchema.parse(req.params);
            const stats = await this.predictiveAnalyticsRepository.getStats(organizationId);
            const response = this.transformStatsToResponse(stats);
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getAnalyticsByType(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = PredictiveAnalyticsOrganizationIdParamSchema.parse(req.params);
            const { type } = req.params;
            const query = PredictiveAnalyticsSearchQuerySchema.parse(req.query);
            const result = await this.predictiveAnalyticsRepository.findByType(type, organizationId, query);
            const response = {
                data: result.data.map(predictiveAnalytics => this.transformPredictiveAnalyticsToResponse(predictiveAnalytics)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getAnalyticsByStatus(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = PredictiveAnalyticsOrganizationIdParamSchema.parse(req.params);
            const { status } = req.params;
            const query = PredictiveAnalyticsSearchQuerySchema.parse(req.query);
            const result = await this.predictiveAnalyticsRepository.findByStatus(status, organizationId, query);
            const response = {
                data: result.data.map(predictiveAnalytics => this.transformPredictiveAnalyticsToResponse(predictiveAnalytics)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getActiveModels(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = PredictiveAnalyticsOrganizationIdParamSchema.parse(req.params);
            const query = PredictiveAnalyticsSearchQuerySchema.parse(req.query);
            const result = await this.predictiveAnalyticsRepository.findActiveModels(organizationId, query);
            const response = {
                data: result.data.map(predictiveAnalytics => this.transformPredictiveAnalyticsToResponse(predictiveAnalytics)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getNeedsRetraining(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = PredictiveAnalyticsOrganizationIdParamSchema.parse(req.params);
            const query = PredictiveAnalyticsSearchQuerySchema.parse(req.query);
            const result = await this.predictiveAnalyticsRepository.findNeedsRetraining(organizationId, query);
            const response = {
                data: result.data.map(predictiveAnalytics => this.transformPredictiveAnalyticsToResponse(predictiveAnalytics)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async generatePrediction(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = GeneratePredictionRequestSchema.parse(req.body);
            const createdBy = this.getUserId(req);
            const result = await this.generatePredictionUseCase.execute({
                ...requestData,
                createdBy
            });
            const response = {
                prediction: result.data.prediction,
                predictiveAnalytics: this.transformPredictiveAnalyticsToResponse(result.data.predictiveAnalytics)
            };
            this.sendSuccessResponse(res, response, 'Prediction generated successfully');
        }, res, next);
    }
    async trainModel(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = TrainModelRequestSchema.parse(req.body);
            const createdBy = this.getUserId(req);
            const result = await this.trainModelUseCase.execute({
                ...requestData,
                createdBy
            });
            const response = {
                predictiveAnalytics: this.transformPredictiveAnalyticsToResponse(result.data.predictiveAnalytics),
                trainingMetrics: result.data.trainingMetrics
            };
            this.sendSuccessResponse(res, response, 'Model trained successfully');
        }, res, next);
    }
    async bulkUpdatePredictiveAnalytics(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = PredictiveAnalyticsBulkUpdateSchema.parse(req.body);
            const updatedBy = this.getUserId(req);
            await this.predictiveAnalyticsRepository.updateStatusMany(requestData.ids, requestData.updates.status || 'pending');
            this.sendSuccessResponse(res, {
                updated: requestData.ids.length,
                ids: requestData.ids
            }, `${requestData.ids.length} predictive analytics updated successfully`);
        }, res, next);
    }
    async bulkDeletePredictiveAnalytics(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = PredictiveAnalyticsBulkDeleteSchema.parse(req.body);
            const deletedBy = this.getUserId(req);
            await this.predictiveAnalyticsRepository.deleteMany(requestData.ids);
            this.sendSuccessResponse(res, {
                deleted: requestData.ids.length,
                ids: requestData.ids
            }, `${requestData.ids.length} predictive analytics deleted successfully`);
        }, res, next);
    }
    transformPredictiveAnalyticsToResponse(predictiveAnalytics) {
        return {
            id: predictiveAnalytics.id.value,
            organizationId: predictiveAnalytics.organizationId.value,
            name: predictiveAnalytics.name,
            type: predictiveAnalytics.type.value,
            status: predictiveAnalytics.status.value,
            modelId: predictiveAnalytics.modelId,
            description: predictiveAnalytics.description,
            settings: {
                modelType: predictiveAnalytics.settings.modelType.value,
                trainingPeriod: predictiveAnalytics.settings.trainingPeriod,
                predictionHorizon: predictiveAnalytics.settings.predictionHorizon,
                confidenceThreshold: predictiveAnalytics.settings.confidenceThreshold,
                autoRetrain: predictiveAnalytics.settings.autoRetrain,
                retrainFrequency: predictiveAnalytics.settings.retrainFrequency,
                dataSource: predictiveAnalytics.settings.dataSource,
                features: predictiveAnalytics.settings.features,
                targetVariable: predictiveAnalytics.settings.targetVariable,
                validationMethod: predictiveAnalytics.settings.validationMethod,
                hyperparameters: predictiveAnalytics.settings.hyperparameters,
                customFields: predictiveAnalytics.settings.customFields,
                tags: predictiveAnalytics.settings.tags,
                notes: predictiveAnalytics.settings.notes
            },
            metrics: predictiveAnalytics.metrics ? {
                accuracy: predictiveAnalytics.metrics.accuracy,
                precision: predictiveAnalytics.metrics.precision,
                recall: predictiveAnalytics.metrics.recall,
                f1Score: predictiveAnalytics.metrics.f1Score,
                mae: predictiveAnalytics.metrics.mae,
                mse: predictiveAnalytics.metrics.mse,
                rmse: predictiveAnalytics.metrics.rmse,
                r2Score: predictiveAnalytics.metrics.r2Score,
                lastTrainingDate: predictiveAnalytics.metrics.lastTrainingDate,
                trainingDuration: predictiveAnalytics.metrics.trainingDuration,
                dataPoints: predictiveAnalytics.metrics.dataPoints,
                modelVersion: predictiveAnalytics.metrics.modelVersion
            } : undefined,
            predictions: predictiveAnalytics.predictions.map((prediction) => ({
                id: prediction.id,
                timestamp: prediction.timestamp,
                inputData: prediction.inputData,
                predictedValue: prediction.predictedValue,
                confidence: prediction.confidence,
                probability: prediction.probability,
                metadata: prediction.metadata
            })),
            lastPredictionDate: predictiveAnalytics.lastPredictionDate,
            nextRetrainDate: predictiveAnalytics.nextRetrainDate,
            isActive: predictiveAnalytics.isActive,
            createdAt: predictiveAnalytics.createdAt,
            updatedAt: predictiveAnalytics.updatedAt
        };
    }
    transformStatsToResponse(stats) {
        return {
            total: stats.total,
            active: stats.active,
            inactive: stats.inactive,
            createdThisMonth: stats.createdThisMonth,
            createdThisYear: stats.createdThisYear,
            updatedThisMonth: stats.updatedThisMonth,
            updatedThisYear: stats.updatedThisYear,
            byType: stats.byType,
            byStatus: stats.byStatus,
            byModelType: stats.byModelType,
            byAccuracy: stats.byAccuracy,
            totalPredictions: stats.totalPredictions,
            averageAccuracy: stats.averageAccuracy,
            averageConfidence: stats.averageConfidence,
            activeModels: stats.activeModels,
            pendingTraining: stats.pendingTraining,
            failedTraining: stats.failedTraining,
            needsRetraining: stats.needsRetraining,
            lastTrainingDate: stats.lastTrainingDate,
            totalTrainingTime: stats.totalTrainingTime,
            averagePredictionTime: stats.averagePredictionTime
        };
    }
}
//# sourceMappingURL=predictive-analytics.controller.js.map