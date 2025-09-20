import { PredictiveAnalytics } from '../../../domain/entities/predictive-analytics.entity.js';
import { BaseUseCase } from '../base.use-case.js';
export class CreatePredictiveAnalyticsUseCase extends BaseUseCase {
    predictiveAnalyticsRepository;
    constructor(predictiveAnalyticsRepository) {
        super();
        this.predictiveAnalyticsRepository = predictiveAnalyticsRepository;
    }
    async execute(request) {
        this.validateBaseRequest(request);
        this.validateString(request.name, 'Name');
        this.validateString(request.type, 'Analytics type');
        this.validateString(request.settings.modelType, 'Model type');
        this.validateString(request.settings.targetVariable, 'Target variable');
        if (request.settings.trainingPeriod <= 0) {
            throw new Error('Training period must be greater than 0');
        }
        if (request.settings.predictionHorizon <= 0) {
            throw new Error('Prediction horizon must be greater than 0');
        }
        if (request.settings.confidenceThreshold < 0 || request.settings.confidenceThreshold > 1) {
            throw new Error('Confidence threshold must be between 0 and 1');
        }
        if (request.settings.retrainFrequency <= 0) {
            throw new Error('Retrain frequency must be greater than 0');
        }
        if (!request.settings.features || request.settings.features.length === 0) {
            throw new Error('At least one feature must be specified');
        }
        if (!request.settings.dataSource || request.settings.dataSource.length === 0) {
            throw new Error('At least one data source must be specified');
        }
        const existingAnalytics = await this.predictiveAnalyticsRepository.existsByName(request.name, request.organizationId);
        if (existingAnalytics) {
            throw new Error(`Predictive analytics with name '${request.name}' already exists`);
        }
        if (request.modelId) {
            const existingModel = await this.predictiveAnalyticsRepository.existsByModelId(request.modelId, request.organizationId);
            if (existingModel) {
                throw new Error(`Model with ID '${request.modelId}' is already in use`);
            }
        }
        const predictiveAnalytics = PredictiveAnalytics.create({
            organizationId: request.organizationId,
            name: request.name,
            type: request.type,
            status: 'pending',
            modelId: request.modelId,
            description: request.description,
            settings: {
                modelType: request.settings.modelType,
                trainingPeriod: request.settings.trainingPeriod,
                predictionHorizon: request.settings.predictionHorizon,
                confidenceThreshold: request.settings.confidenceThreshold,
                autoRetrain: request.settings.autoRetrain,
                retrainFrequency: request.settings.retrainFrequency,
                dataSource: request.settings.dataSource,
                features: request.settings.features,
                targetVariable: request.settings.targetVariable,
                validationMethod: request.settings.validationMethod,
                hyperparameters: request.settings.hyperparameters,
                customFields: request.settings.customFields,
                tags: request.settings.tags,
                notes: request.settings.notes,
            },
            predictions: [],
            isActive: true,
        });
        if (!predictiveAnalytics.validate()) {
            throw new Error('Invalid predictive analytics data');
        }
        const savedPredictiveAnalytics = await this.predictiveAnalyticsRepository.save(predictiveAnalytics);
        return this.createSuccessResponse({
            predictiveAnalytics: savedPredictiveAnalytics,
        }, 'Predictive analytics created successfully');
    }
}
//# sourceMappingURL=create-predictive-analytics.use-case.js.map