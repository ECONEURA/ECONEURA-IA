import { BaseUseCase } from '../base.use-case.js';
export class GeneratePredictionUseCase extends BaseUseCase {
    predictiveAnalyticsRepository;
    constructor(predictiveAnalyticsRepository) {
        super();
        this.predictiveAnalyticsRepository = predictiveAnalyticsRepository;
    }
    async execute(request) {
        this.validateId(request.id, 'Predictive Analytics ID');
        if (!request.inputData || Object.keys(request.inputData).length === 0) {
            throw new Error('Input data is required');
        }
        if (request.confidence !== undefined && (request.confidence < 0 || request.confidence > 1)) {
            throw new Error('Confidence must be between 0 and 1');
        }
        const existingPredictiveAnalytics = await this.predictiveAnalyticsRepository.findById(request.id);
        if (!existingPredictiveAnalytics) {
            throw new Error(`Predictive analytics with ID '${request.id}' not found`);
        }
        if (!existingPredictiveAnalytics.isReadyForPrediction()) {
            throw new Error('Model is not ready for prediction. Please ensure the model is trained and has sufficient accuracy.');
        }
        const expectedFeatures = existingPredictiveAnalytics.settings.features;
        const inputFeatures = Object.keys(request.inputData);
        const missingFeatures = expectedFeatures.filter(feature => !inputFeatures.includes(feature));
        if (missingFeatures.length > 0) {
            throw new Error(`Missing required features: ${missingFeatures.join(', ')}`);
        }
        const prediction = existingPredictiveAnalytics.generatePrediction(request.inputData, request.confidence);
        if (!existingPredictiveAnalytics.validate()) {
            throw new Error('Invalid predictive analytics data after prediction');
        }
        const updatedPredictiveAnalytics = await this.predictiveAnalyticsRepository.update(existingPredictiveAnalytics);
        return this.createSuccessResponse({
            prediction: {
                id: prediction.id,
                timestamp: prediction.timestamp,
                inputData: prediction.inputData,
                predictedValue: prediction.predictedValue,
                confidence: prediction.confidence,
                probability: prediction.probability,
                metadata: prediction.metadata
            },
            predictiveAnalytics: updatedPredictiveAnalytics
        }, 'Prediction generated successfully');
    }
}
//# sourceMappingURL=generate-prediction.use-case.js.map