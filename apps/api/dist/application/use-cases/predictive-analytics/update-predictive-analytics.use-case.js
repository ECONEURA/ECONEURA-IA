import { BaseUseCase } from '../base.use-case.js';
export class UpdatePredictiveAnalyticsUseCase extends BaseUseCase {
    predictiveAnalyticsRepository;
    constructor(predictiveAnalyticsRepository) {
        super();
        this.predictiveAnalyticsRepository = predictiveAnalyticsRepository;
    }
    async execute(request) {
        this.validateId(request.id, 'Predictive Analytics ID');
        const existingPredictiveAnalytics = await this.predictiveAnalyticsRepository.findById(request.id);
        if (!existingPredictiveAnalytics) {
            throw new Error(`Predictive analytics with ID '${request.id}' not found`);
        }
        if (request.name && request.name !== existingPredictiveAnalytics.name) {
            const existingAnalytics = await this.predictiveAnalyticsRepository.existsByName(request.name, request.organizationId);
            if (existingAnalytics) {
                throw new Error(`Predictive analytics with name '${request.name}' already exists`);
            }
        }
        if (request.modelId && request.modelId !== existingPredictiveAnalytics.modelId) {
            const existingModel = await this.predictiveAnalyticsRepository.existsByModelId(request.modelId, request.organizationId);
            if (existingModel) {
                throw new Error(`Model with ID '${request.modelId}' is already in use`);
            }
        }
        if (request.name !== undefined) {
            existingPredictiveAnalytics.updateName(request.name);
        }
        if (request.type !== undefined) {
            existingPredictiveAnalytics.updateType(request.type);
        }
        if (request.description !== undefined) {
            existingPredictiveAnalytics.updateDescription(request.description);
        }
        if (request.modelId !== undefined) {
            existingPredictiveAnalytics.updateModelId(request.modelId);
        }
        if (request.settings !== undefined) {
            const currentSettings = existingPredictiveAnalytics.settings;
            const updatedSettings = {
                modelType: request.settings.modelType || currentSettings.modelType.value,
                trainingPeriod: request.settings.trainingPeriod !== undefined ? request.settings.trainingPeriod : currentSettings.trainingPeriod,
                predictionHorizon: request.settings.predictionHorizon !== undefined ? request.settings.predictionHorizon : currentSettings.predictionHorizon,
                confidenceThreshold: request.settings.confidenceThreshold !== undefined ? request.settings.confidenceThreshold : currentSettings.confidenceThreshold,
                autoRetrain: request.settings.autoRetrain !== undefined ? request.settings.autoRetrain : currentSettings.autoRetrain,
                retrainFrequency: request.settings.retrainFrequency !== undefined ? request.settings.retrainFrequency : currentSettings.retrainFrequency,
                dataSource: request.settings.dataSource || currentSettings.dataSource,
                features: request.settings.features || currentSettings.features,
                targetVariable: request.settings.targetVariable || currentSettings.targetVariable,
                validationMethod: request.settings.validationMethod || currentSettings.validationMethod,
                hyperparameters: { ...currentSettings.hyperparameters, ...request.settings.hyperparameters },
                customFields: { ...currentSettings.customFields, ...request.settings.customFields },
                tags: request.settings.tags || currentSettings.tags,
                notes: request.settings.notes || currentSettings.notes,
            };
            existingPredictiveAnalytics.updateSettings(updatedSettings);
        }
        if (!existingPredictiveAnalytics.validate()) {
            throw new Error('Invalid predictive analytics data after update');
        }
        const updatedPredictiveAnalytics = await this.predictiveAnalyticsRepository.update(existingPredictiveAnalytics);
        return this.createSuccessResponse({
            predictiveAnalytics: updatedPredictiveAnalytics,
        }, 'Predictive analytics updated successfully');
    }
}
//# sourceMappingURL=update-predictive-analytics.use-case.js.map