import { BaseEntity } from './base.entity.js';
export class PredictiveAnalytics extends BaseEntity {
    props;
    constructor(props) {
        super(props);
        this.props = props;
    }
    static create(props) {
        const now = new Date();
        return new PredictiveAnalytics({
            ...props,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        });
    }
    static fromJSON(data) {
        return new PredictiveAnalytics(data);
    }
    get name() { return this.props.name; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get organizationId() { return this.props.organizationId; }
    get modelId() { return this.props.modelId; }
    get description() { return this.props.description; }
    get settings() { return this.props.settings; }
    get metrics() { return this.props.metrics; }
    get predictions() { return this.props.predictions; }
    get lastPredictionDate() { return this.props.lastPredictionDate; }
    get nextRetrainDate() { return this.props.nextRetrainDate; }
    updateName(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('Name cannot be empty');
        }
        this.props.name = name.trim();
        this.updateTimestamp();
    }
    updateType(type) {
        this.props.type = type;
        this.updateTimestamp();
    }
    updateStatus(status) {
        this.props.status = status;
        this.updateTimestamp();
    }
    updateModelId(modelId) {
        this.props.modelId = modelId;
        this.updateTimestamp();
    }
    updateDescription(description) {
        this.props.description = description;
        this.updateTimestamp();
    }
    updateSettings(settings) {
        this.props.settings = settings;
        this.updateTimestamp();
    }
    updateMetrics(metrics) {
        this.props.metrics = metrics;
        this.updateTimestamp();
    }
    addPrediction(prediction) {
        this.props.predictions.push(prediction);
        this.props.lastPredictionDate = new Date();
        this.updateTimestamp();
    }
    removePrediction(predictionId) {
        this.props.predictions = this.props.predictions.filter(prediction => prediction.id !== predictionId);
        this.updateTimestamp();
    }
    updatePrediction(predictionId, updates) {
        const predictionIndex = this.props.predictions.findIndex(prediction => prediction.id === predictionId);
        if (predictionIndex !== -1) {
            this.props.predictions[predictionIndex] = { ...this.props.predictions[predictionIndex], ...updates };
            this.updateTimestamp();
        }
    }
    updateNextRetrainDate() {
        if (this.props.settings.autoRetrain) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + this.props.settings.retrainFrequency);
            this.props.nextRetrainDate = nextDate;
            this.updateTimestamp();
        }
    }
    generatePrediction(inputData, confidence) {
        const prediction = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            inputData,
            predictedValue: this.calculatePrediction(inputData),
            confidence: confidence || this.calculateConfidence(inputData),
            metadata: {
                modelVersion: this.props.metrics?.modelVersion || '1.0.0',
                predictionType: this.props.type.value,
                inputFeatures: Object.keys(inputData),
                processingTime: Date.now()
            }
        };
        this.addPrediction(prediction);
        return prediction;
    }
    batchPredict(inputDataArray) {
        const predictions = [];
        for (const inputData of inputDataArray) {
            const prediction = this.generatePrediction(inputData);
            predictions.push(prediction);
        }
        return predictions;
    }
    startTraining() {
        this.props.status = 'processing';
        this.updateTimestamp();
    }
    completeTraining(metrics) {
        this.props.status = 'completed';
        this.props.metrics = metrics;
        this.updateNextRetrainDate();
        this.updateTimestamp();
    }
    failTraining(error) {
        this.props.status = 'failed';
        this.updateTimestamp();
    }
    retrainModel() {
        this.props.status = 'processing';
        this.updateTimestamp();
    }
    calculatePrediction(inputData) {
        switch (this.props.type.value) {
            case 'sales_forecast':
                return Math.random() * 10000;
            case 'demand_prediction':
                return Math.floor(Math.random() * 1000);
            case 'churn_prediction':
                return Math.random() > 0.5;
            case 'revenue_forecast':
                return Math.random() * 50000;
            case 'inventory_optimization':
                return Math.floor(Math.random() * 500);
            case 'customer_lifetime_value':
                return Math.random() * 5000;
            case 'market_trend':
                return Math.random() > 0.5 ? 'up' : 'down';
            case 'risk_assessment':
                return Math.random() * 10;
            default:
                return 0;
        }
    }
    calculateConfidence(inputData) {
        const baseConfidence = this.props.metrics?.accuracy || 0.8;
        const dataQuality = Object.keys(inputData).length / 10;
        return Math.min(baseConfidence * dataQuality, 1.0);
    }
    validate() {
        if (!this.validateBase()) {
            return false;
        }
        if (!this.props.name || this.props.name.trim().length === 0) {
            return false;
        }
        if (!this.props.organizationId || this.props.organizationId.trim().length === 0) {
            return false;
        }
        if (this.props.settings.confidenceThreshold < 0 || this.props.settings.confidenceThreshold > 1) {
            return false;
        }
        if (this.props.settings.trainingPeriod <= 0) {
            return false;
        }
        if (this.props.settings.predictionHorizon <= 0) {
            return false;
        }
        return true;
    }
    toJSON() {
        return { ...this.props };
    }
    clone() {
        return PredictiveAnalytics.fromJSON(this.toJSON());
    }
    isReadyForPrediction() {
        return this.props.status.value === 'completed' &&
            this.props.metrics !== undefined &&
            this.props.metrics.accuracy >= this.props.settings.confidenceThreshold;
    }
    needsRetraining() {
        if (!this.props.settings.autoRetrain || !this.props.nextRetrainDate) {
            return false;
        }
        return new Date() >= this.props.nextRetrainDate;
    }
    getPredictionAccuracy() {
        return this.props.metrics?.accuracy || 0;
    }
    getLatestPrediction() {
        if (this.props.predictions.length === 0) {
            return undefined;
        }
        return this.props.predictions[this.props.predictions.length - 1];
    }
    getPredictionsByDateRange(startDate, endDate) {
        return this.props.predictions.filter(prediction => prediction.timestamp >= startDate && prediction.timestamp <= endDate);
    }
    getAverageConfidence() {
        if (this.props.predictions.length === 0) {
            return 0;
        }
        const totalConfidence = this.props.predictions.reduce((sum, prediction) => sum + prediction.confidence, 0);
        return totalConfidence / this.props.predictions.length;
    }
    static createSalesForecast(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'sales_forecast',
        });
    }
    static createDemandPrediction(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'demand_prediction',
        });
    }
    static createChurnPrediction(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'churn_prediction',
        });
    }
    static createRevenueForecast(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'revenue_forecast',
        });
    }
    static createInventoryOptimization(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'inventory_optimization',
        });
    }
    static createCustomerLifetimeValue(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'customer_lifetime_value',
        });
    }
    static createMarketTrend(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'market_trend',
        });
    }
    static createRiskAssessment(props) {
        return PredictiveAnalytics.create({
            ...props,
            type: 'risk_assessment',
        });
    }
}
//# sourceMappingURL=predictive-analytics.entity.js.map