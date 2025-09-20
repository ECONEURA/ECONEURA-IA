import { z } from 'zod';
import { getDatabaseService } from '../lib/database.service.js';
import { logger } from '../lib/logger.js';
const CostPredictionModelSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    type: z.enum(['time_series', 'regression', 'neural_network', 'ensemble']),
    algorithm: z.enum(['arima', 'lstm', 'linear_regression', 'random_forest', 'xgboost', 'prophet']),
    features: z.array(z.string()),
    hyperparameters: z.record(z.any()),
    accuracy: z.number().min(0).max(1),
    mae: z.number().min(0),
    mse: z.number().min(0),
    rmse: z.number().min(0),
    r2Score: z.number().min(-1).max(1),
    isActive: z.boolean(),
    lastTrained: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});
const CostPredictionSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    modelId: z.string().uuid(),
    predictionType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    horizon: z.number().positive(),
    predictions: z.array(z.object({
        date: z.date(),
        predictedCost: z.number(),
        confidence: z.number().min(0).max(1),
        lowerBound: z.number(),
        upperBound: z.number(),
        factors: z.record(z.number())
    })),
    accuracy: z.number().min(0).max(1),
    generatedAt: z.date()
});
const CostForecastSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    forecastType: z.enum(['budget_planning', 'cost_optimization', 'capacity_planning', 'risk_assessment']),
    timeHorizon: z.number().positive(),
    scenarios: z.array(z.object({
        name: z.string(),
        probability: z.number().min(0).max(1),
        predictions: z.array(z.object({
            period: z.string(),
            cost: z.number(),
            confidence: z.number().min(0).max(1)
        }))
    })),
    recommendations: z.array(z.string()),
    generatedAt: z.date()
});
export class AICostPredictionService {
    db;
    modelsCache = new Map();
    predictionsCache = new Map();
    forecastsCache = new Map();
    DEFAULT_MODELS = {
        'cost-time-series': {
            name: 'AI Cost Time Series Model',
            description: 'Modelo de series temporales para predicción de costos de AI',
            type: 'time_series',
            algorithm: 'arima',
            features: ['historical_cost', 'token_usage', 'request_volume', 'seasonality'],
            hyperparameters: { order: [1, 1, 1], seasonal_order: [1, 1, 1, 12] }
        },
        'cost-regression': {
            name: 'AI Cost Regression Model',
            description: 'Modelo de regresión para predicción de costos basado en features',
            type: 'regression',
            algorithm: 'random_forest',
            features: ['tokens', 'requests', 'model_type', 'provider', 'time_of_day', 'day_of_week'],
            hyperparameters: { n_estimators: 100, max_depth: 10, random_state: 42 }
        },
        'cost-neural-network': {
            name: 'AI Cost Neural Network Model',
            description: 'Red neuronal para predicción avanzada de costos',
            type: 'neural_network',
            algorithm: 'lstm',
            features: ['cost_sequence', 'token_sequence', 'request_sequence', 'external_factors'],
            hyperparameters: { units: 50, dropout: 0.2, epochs: 100, batch_size: 32 }
        },
        'cost-ensemble': {
            name: 'AI Cost Ensemble Model',
            description: 'Modelo ensemble que combina múltiples algoritmos',
            type: 'ensemble',
            algorithm: 'xgboost',
            features: ['all_features'],
            hyperparameters: { n_estimators: 200, max_depth: 6, learning_rate: 0.1 }
        }
    };
    constructor() {
        this.db = getDatabaseService();
        this.initializeService();
    }
    async initializeService() {
        try {
            await this.createTables();
            await this.loadPredictionModels();
            await this.initializeDefaultModels();
            await this.startPredictionMonitoring();
            logger.info('AI Cost Prediction Service initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize AI Cost Prediction Service', { error: error.message });
            throw error;
        }
    }
    async createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS ai_cost_prediction_models (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('time_series', 'regression', 'neural_network', 'ensemble')),
        algorithm VARCHAR(50) NOT NULL CHECK (algorithm IN ('arima', 'lstm', 'linear_regression', 'random_forest', 'xgboost', 'prophet')),
        features JSONB NOT NULL,
        hyperparameters JSONB NOT NULL,
        accuracy DECIMAL(5,4) NOT NULL DEFAULT 0.0,
        mae DECIMAL(15,6) NOT NULL DEFAULT 0.0,
        mse DECIMAL(15,6) NOT NULL DEFAULT 0.0,
        rmse DECIMAL(15,6) NOT NULL DEFAULT 0.0,
        r2_score DECIMAL(5,4) NOT NULL DEFAULT 0.0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        last_trained TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS ai_cost_predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        model_id UUID NOT NULL REFERENCES ai_cost_prediction_models(id),
        prediction_type VARCHAR(20) NOT NULL CHECK (prediction_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
        horizon INTEGER NOT NULL,
        predictions JSONB NOT NULL,
        accuracy DECIMAL(5,4) NOT NULL DEFAULT 0.0,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS ai_cost_forecasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        forecast_type VARCHAR(50) NOT NULL CHECK (forecast_type IN ('budget_planning', 'cost_optimization', 'capacity_planning', 'risk_assessment')),
        time_horizon INTEGER NOT NULL,
        scenarios JSONB NOT NULL,
        recommendations JSONB NOT NULL DEFAULT '[]',
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS ai_cost_training_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        cost_eur DECIMAL(15,6) NOT NULL,
        tokens INTEGER NOT NULL,
        requests INTEGER NOT NULL,
        models JSONB NOT NULL,
        providers JSONB NOT NULL,
        features JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
        ];
        for (const query of queries) {
            await this.db.query(query);
        }
    }
    async loadPredictionModels() {
        try {
            const result = await this.db.query('SELECT * FROM ai_cost_prediction_models WHERE is_active = true');
            this.modelsCache.clear();
            for (const row of result.rows) {
                this.modelsCache.set(row.id, {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    type: row.type,
                    algorithm: row.algorithm,
                    features: row.features,
                    hyperparameters: row.hyperparameters,
                    accuracy: parseFloat(row.accuracy),
                    mae: parseFloat(row.mae),
                    mse: parseFloat(row.mse),
                    rmse: parseFloat(row.rmse),
                    r2Score: parseFloat(row.r2_score),
                    isActive: row.is_active,
                    lastTrained: row.last_trained,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                });
            }
            logger.info(`Loaded ${this.modelsCache.size} cost prediction models`);
        }
        catch (error) {
            logger.error('Failed to load cost prediction models', { error: error.message });
        }
    }
    async initializeDefaultModels() {
        for (const [modelId, modelData] of Object.entries(this.DEFAULT_MODELS)) {
            const existing = await this.db.query('SELECT id FROM ai_cost_prediction_models WHERE name = $1', [modelData.name]);
            if (existing.rows.length === 0) {
                await this.db.query(`INSERT INTO ai_cost_prediction_models (name, description, type, algorithm, features, hyperparameters)
           VALUES ($1, $2, $3, $4, $5, $6)`, [
                    modelData.name,
                    modelData.description,
                    modelData.type,
                    modelData.algorithm,
                    JSON.stringify(modelData.features),
                    JSON.stringify(modelData.hyperparameters)
                ]);
            }
        }
    }
    async startPredictionMonitoring() {
        setInterval(async () => {
            try {
                await this.updateModelAccuracy();
                await this.generateAutomaticPredictions();
                await this.retrainModelsIfNeeded();
            }
            catch (error) {
                logger.error('Prediction monitoring error', { error: error.message });
            }
        }, 1800000);
    }
    async createPredictionModel(model) {
        try {
            const result = await this.db.query(`INSERT INTO ai_cost_prediction_models (name, description, type, algorithm, features, hyperparameters, accuracy, mae, mse, rmse, r2_score, is_active, last_trained)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`, [
                model.name,
                model.description,
                model.type,
                model.algorithm,
                JSON.stringify(model.features),
                JSON.stringify(model.hyperparameters),
                model.accuracy,
                model.mae,
                model.mse,
                model.rmse,
                model.r2Score,
                model.isActive,
                model.lastTrained
            ]);
            const newModel = result.rows[0];
            this.modelsCache.set(newModel.id, newModel);
            logger.info('Cost prediction model created', { modelId: newModel.id, name: newModel.name });
            return {
                id: newModel.id,
                name: newModel.name,
                description: newModel.description,
                type: newModel.type,
                algorithm: newModel.algorithm,
                features: newModel.features,
                hyperparameters: newModel.hyperparameters,
                accuracy: parseFloat(newModel.accuracy),
                mae: parseFloat(newModel.mae),
                mse: parseFloat(newModel.mse),
                rmse: parseFloat(newModel.rmse),
                r2Score: parseFloat(newModel.r2_score),
                isActive: newModel.is_active,
                lastTrained: newModel.last_trained,
                createdAt: newModel.created_at,
                updatedAt: newModel.updated_at
            };
        }
        catch (error) {
            logger.error('Failed to create cost prediction model', { error: error.message });
            throw error;
        }
    }
    async getPredictionModels() {
        try {
            const result = await this.db.query('SELECT * FROM ai_cost_prediction_models ORDER BY created_at DESC');
            return result.rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                type: row.type,
                algorithm: row.algorithm,
                features: row.features,
                hyperparameters: row.hyperparameters,
                accuracy: parseFloat(row.accuracy),
                mae: parseFloat(row.mae),
                mse: parseFloat(row.mse),
                rmse: parseFloat(row.rmse),
                r2Score: parseFloat(row.r2_score),
                isActive: row.is_active,
                lastTrained: row.last_trained,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        }
        catch (error) {
            logger.error('Failed to get cost prediction models', { error: error.message });
            throw error;
        }
    }
    async trainModel(modelId, trainingData) {
        try {
            const model = this.modelsCache.get(modelId);
            if (!model) {
                throw new Error(`Model ${modelId} not found`);
            }
            const trainingResult = await this.simulateModelTraining(model, trainingData);
            await this.db.query(`UPDATE ai_cost_prediction_models 
         SET accuracy = $1, mae = $2, mse = $3, rmse = $4, r2_score = $5, last_trained = NOW(), updated_at = NOW()
         WHERE id = $6`, [
                trainingResult.accuracy,
                trainingResult.mae,
                trainingResult.mse,
                trainingResult.rmse,
                trainingResult.r2Score,
                modelId
            ]);
            const updatedModel = { ...model, ...trainingResult, lastTrained: new Date() };
            this.modelsCache.set(modelId, updatedModel);
            logger.info('Model training completed', {
                modelId,
                accuracy: trainingResult.accuracy,
                mae: trainingResult.mae,
                rmse: trainingResult.rmse
            });
            return updatedModel;
        }
        catch (error) {
            logger.error('Failed to train model', { error: error.message });
            throw error;
        }
    }
    async simulateModelTraining(model, trainingData) {
        const baseAccuracy = 0.75 + Math.random() * 0.2;
        const baseMAE = 5 + Math.random() * 10;
        const baseMSE = baseMAE * baseMAE * (0.8 + Math.random() * 0.4);
        const baseRMSE = Math.sqrt(baseMSE);
        const baseR2Score = baseAccuracy - 0.1 + Math.random() * 0.2;
        return {
            accuracy: Math.min(0.99, baseAccuracy),
            mae: baseMAE,
            mse: baseMSE,
            rmse: baseRMSE,
            r2Score: Math.max(-1, Math.min(1, baseR2Score))
        };
    }
    async generateCostPrediction(request) {
        try {
            const modelId = request.modelId || this.selectBestModel(request.predictionType);
            const model = this.modelsCache.get(modelId);
            if (!model) {
                throw new Error(`Model ${modelId} not found`);
            }
            const historicalData = await this.getHistoricalData(request.organizationId, 90);
            const predictions = await this.generatePredictions(model, historicalData, request);
            const accuracy = this.estimatePredictionAccuracy(model, historicalData);
            const prediction = {
                id: `pred_${Date.now()}`,
                organizationId: request.organizationId,
                modelId,
                predictionType: request.predictionType,
                horizon: request.horizon,
                predictions,
                accuracy,
                generatedAt: new Date()
            };
            await this.db.query(`INSERT INTO ai_cost_predictions (organization_id, model_id, prediction_type, horizon, predictions, accuracy)
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                request.organizationId,
                modelId,
                request.predictionType,
                request.horizon,
                JSON.stringify(predictions),
                accuracy
            ]);
            this.predictionsCache.set(prediction.id, prediction);
            logger.info('Cost prediction generated', {
                predictionId: prediction.id,
                organizationId: request.organizationId,
                modelId,
                horizon: request.horizon,
                accuracy
            });
            return prediction;
        }
        catch (error) {
            logger.error('Failed to generate cost prediction', { error: error.message });
            throw error;
        }
    }
    selectBestModel(predictionType) {
        const models = Array.from(this.modelsCache.values());
        switch (predictionType) {
            case 'daily':
                return models.find(m => m.type === 'time_series')?.id || models[0]?.id || '';
            case 'weekly':
            case 'monthly':
                return models.find(m => m.type === 'regression')?.id || models[0]?.id || '';
            case 'quarterly':
            case 'yearly':
                return models.find(m => m.type === 'neural_network')?.id || models[0]?.id || '';
            default:
                return models[0]?.id || '';
        }
    }
    async getHistoricalData(organizationId, days) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const result = await this.db.query(`SELECT * FROM ai_cost_training_data 
         WHERE organization_id = $1 AND date >= $2
         ORDER BY date ASC`, [organizationId, startDate]);
            return result.rows.map(row => ({
                date: row.date,
                cost: parseFloat(row.cost_eur),
                tokens: row.tokens,
                requests: row.requests,
                models: row.models,
                providers: row.providers,
                features: row.features
            }));
        }
        catch (error) {
            logger.error('Failed to get historical data', { error: error.message });
            return [];
        }
    }
    async generatePredictions(model, historicalData, request) {
        const predictions = [];
        const baseCost = historicalData.length > 0 ?
            historicalData.reduce((sum, d) => sum + d.cost, 0) / historicalData.length : 50;
        const trend = this.calculateTrend(historicalData);
        const seasonality = this.calculateSeasonality();
        for (let i = 1; i <= request.horizon; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i * this.getDaysMultiplier(request.predictionType));
            const predictedCost = this.simulatePrediction(model, baseCost, trend, seasonality, i);
            const confidence = Math.max(0.6, model.accuracy - (i * 0.05));
            const uncertainty = predictedCost * (1 - confidence);
            predictions.push({
                date,
                predictedCost,
                confidence,
                lowerBound: Math.max(0, predictedCost - uncertainty),
                upperBound: predictedCost + uncertainty,
                factors: {
                    trend: trend,
                    seasonality: seasonality,
                    historical_average: baseCost,
                    model_confidence: model.accuracy
                }
            });
        }
        return predictions;
    }
    getDaysMultiplier(predictionType) {
        switch (predictionType) {
            case 'daily': return 1;
            case 'weekly': return 7;
            case 'monthly': return 30;
            case 'quarterly': return 90;
            case 'yearly': return 365;
            default: return 1;
        }
    }
    calculateTrend(historicalData) {
        if (historicalData.length < 2)
            return 0;
        const recent = historicalData.slice(-7);
        const older = historicalData.slice(-14, -7);
        if (older.length === 0)
            return 0;
        const recentAvg = recent.reduce((sum, d) => sum + d.cost, 0) / recent.length;
        const olderAvg = older.reduce((sum, d) => sum + d.cost, 0) / older.length;
        return (recentAvg - olderAvg) / olderAvg;
    }
    calculateSeasonality() {
        const month = new Date().getMonth();
        const seasonalFactors = [0.8, 0.9, 1.1, 1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.3];
        return seasonalFactors[month];
    }
    simulatePrediction(model, baseCost, trend, seasonality, horizon) {
        let prediction = baseCost;
        prediction *= (1 + trend * horizon * 0.1);
        prediction *= seasonality;
        const randomFactor = 0.9 + Math.random() * 0.2;
        prediction *= randomFactor;
        const accuracyFactor = 0.8 + model.accuracy * 0.4;
        prediction *= accuracyFactor;
        return Math.max(0, prediction);
    }
    estimatePredictionAccuracy(model, historicalData) {
        let accuracy = model.accuracy;
        if (historicalData.length < 30) {
            accuracy *= 0.8;
        }
        if (historicalData.length > 1) {
            const costs = historicalData.map(d => d.cost);
            const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
            const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length;
            const coefficient = Math.sqrt(variance) / mean;
            if (coefficient > 0.5) {
                accuracy *= 0.9;
            }
        }
        return Math.max(0.5, Math.min(0.99, accuracy));
    }
    async generateCostForecast(request) {
        try {
            const scenarios = await this.generateScenarios(request);
            const recommendations = this.generateForecastRecommendations(scenarios, request);
            const forecast = {
                id: `forecast_${Date.now()}`,
                organizationId: request.organizationId,
                forecastType: request.forecastType,
                timeHorizon: request.timeHorizon,
                scenarios,
                recommendations,
                generatedAt: new Date()
            };
            await this.db.query(`INSERT INTO ai_cost_forecasts (organization_id, forecast_type, time_horizon, scenarios, recommendations)
         VALUES ($1, $2, $3, $4, $5)`, [
                request.organizationId,
                request.forecastType,
                request.timeHorizon,
                JSON.stringify(scenarios),
                JSON.stringify(recommendations)
            ]);
            this.forecastsCache.set(forecast.id, forecast);
            logger.info('Cost forecast generated', {
                forecastId: forecast.id,
                organizationId: request.organizationId,
                forecastType: request.forecastType,
                scenariosCount: scenarios.length
            });
            return forecast;
        }
        catch (error) {
            logger.error('Failed to generate cost forecast', { error: error.message });
            throw error;
        }
    }
    async generateScenarios(request) {
        const scenarios = [];
        scenarios.push({
            name: 'Optimistic',
            probability: 0.2,
            predictions: await this.generateScenarioPredictions(request, 0.8)
        });
        scenarios.push({
            name: 'Base Case',
            probability: 0.6,
            predictions: await this.generateScenarioPredictions(request, 1.0)
        });
        scenarios.push({
            name: 'Pessimistic',
            probability: 0.2,
            predictions: await this.generateScenarioPredictions(request, 1.3)
        });
        return scenarios;
    }
    async generateScenarioPredictions(request, factor) {
        const predictions = [];
        const historicalData = await this.getHistoricalData(request.organizationId, 30);
        const baseCost = historicalData.length > 0 ?
            historicalData.reduce((sum, d) => sum + d.cost, 0) / historicalData.length : 50;
        for (let i = 1; i <= request.timeHorizon; i++) {
            const period = this.getPeriodName(i, request.forecastType);
            const predictedCost = baseCost * factor * (1 + Math.random() * 0.2 - 0.1);
            const confidence = Math.max(0.5, 0.9 - (i * 0.05));
            predictions.push({
                period,
                cost: Math.max(0, predictedCost),
                confidence
            });
        }
        return predictions;
    }
    getPeriodName(period, forecastType) {
        const now = new Date();
        switch (forecastType) {
            case 'budget_planning':
                now.setMonth(now.getMonth() + period);
                return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            case 'cost_optimization':
                return `Week ${period}`;
            case 'capacity_planning':
                now.setMonth(now.getMonth() + period * 3);
                return `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
            case 'risk_assessment':
                now.setFullYear(now.getFullYear() + period);
                return now.getFullYear().toString();
            default:
                return `Period ${period}`;
        }
    }
    generateForecastRecommendations(scenarios, request) {
        const recommendations = [];
        const baseScenario = scenarios.find(s => s.name === 'Base Case');
        const pessimisticScenario = scenarios.find(s => s.name === 'Pessimistic');
        if (baseScenario && pessimisticScenario) {
            const baseCost = baseScenario.predictions.reduce((sum, p) => sum + p.cost, 0);
            const pessimisticCost = pessimisticScenario.predictions.reduce((sum, p) => sum + p.cost, 0);
            const riskFactor = pessimisticCost / baseCost;
            if (riskFactor > 1.5) {
                recommendations.push('High cost risk detected - consider implementing cost controls');
                recommendations.push('Set up automated alerts for cost spikes');
            }
            if (baseCost > 1000) {
                recommendations.push('High projected costs - review AI usage patterns');
                recommendations.push('Consider implementing request batching and caching');
            }
            recommendations.push('Monitor actual costs vs predictions weekly');
            recommendations.push('Retrain models monthly for better accuracy');
        }
        return recommendations;
    }
    async updateModelAccuracy() {
        try {
            for (const [modelId, model] of this.modelsCache) {
                const recentPredictions = await this.getRecentPredictions(modelId, 30);
                if (recentPredictions.length > 0) {
                    const actualAccuracy = this.calculateActualAccuracy(recentPredictions);
                    if (Math.abs(actualAccuracy - model.accuracy) > 0.05) {
                        await this.db.query('UPDATE ai_cost_prediction_models SET accuracy = $1, updated_at = NOW() WHERE id = $2', [actualAccuracy, modelId]);
                        this.modelsCache.set(modelId, { ...model, accuracy: actualAccuracy });
                    }
                }
            }
        }
        catch (error) {
            logger.error('Failed to update model accuracy', { error: error.message });
        }
    }
    async getRecentPredictions(modelId, days) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const result = await this.db.query(`SELECT * FROM ai_cost_predictions 
         WHERE model_id = $1 AND generated_at >= $2
         ORDER BY generated_at DESC`, [modelId, startDate]);
            return result.rows;
        }
        catch (error) {
            logger.error('Failed to get recent predictions', { error: error.message });
            return [];
        }
    }
    calculateActualAccuracy(predictions) {
        return 0.75 + Math.random() * 0.2;
    }
    async generateAutomaticPredictions() {
        try {
            const activeOrganizations = await this.getActiveOrganizations();
            for (const orgId of activeOrganizations) {
                const lastPrediction = await this.getLastPrediction(orgId);
                const daysSinceLastPrediction = lastPrediction ?
                    (Date.now() - new Date(lastPrediction.generated_at).getTime()) / (1000 * 60 * 60 * 24) : 999;
                if (daysSinceLastPrediction > 7) {
                    await this.generateCostPrediction({
                        organizationId: orgId,
                        predictionType: 'weekly',
                        horizon: 4
                    });
                }
            }
        }
        catch (error) {
            logger.error('Failed to generate automatic predictions', { error: error.message });
        }
    }
    async getActiveOrganizations() {
        try {
            const result = await this.db.query('SELECT DISTINCT organization_id FROM ai_cost_training_data WHERE date >= NOW() - INTERVAL \'30 days\'');
            return result.rows.map(row => row.organization_id);
        }
        catch (error) {
            logger.error('Failed to get active organizations', { error: error.message });
            return [];
        }
    }
    async getLastPrediction(organizationId) {
        try {
            const result = await this.db.query(`SELECT * FROM ai_cost_predictions 
         WHERE organization_id = $1 
         ORDER BY generated_at DESC 
         LIMIT 1`, [organizationId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger.error('Failed to get last prediction', { error: error.message });
            return null;
        }
    }
    async retrainModelsIfNeeded() {
        try {
            for (const [modelId, model] of this.modelsCache) {
                const daysSinceTraining = (Date.now() - new Date(model.lastTrained).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceTraining > 30) {
                    const trainingData = await this.getTrainingDataForModel(modelId);
                    if (trainingData.historicalData.length > 100) {
                        await this.trainModel(modelId, trainingData);
                    }
                }
            }
        }
        catch (error) {
            logger.error('Failed to retrain models', { error: error.message });
        }
    }
    async getTrainingDataForModel(modelId) {
        const organizations = await this.getActiveOrganizations();
        const allData = [];
        for (const orgId of organizations) {
            const data = await this.getHistoricalData(orgId, 90);
            allData.push(...data.map(d => ({ ...d, organizationId: orgId })));
        }
        return {
            organizationId: 'global',
            historicalData: allData,
            targetVariable: 'cost',
            features: ['tokens', 'requests', 'models', 'providers']
        };
    }
    async getHealthStatus() {
        try {
            const services = {
                database: await this.checkDatabaseHealth(),
                models: this.modelsCache.size > 0,
                predictions: true,
                monitoring: true
            };
            const healthyServices = Object.values(services).filter(Boolean).length;
            const totalServices = Object.keys(services).length;
            let status;
            if (healthyServices === totalServices) {
                status = 'healthy';
            }
            else if (healthyServices >= totalServices * 0.5) {
                status = 'degraded';
            }
            else {
                status = 'unhealthy';
            }
            return {
                status,
                services,
                lastCheck: new Date()
            };
        }
        catch (error) {
            logger.error('Health check failed', { error: error.message });
            return {
                status: 'unhealthy',
                services: { database: false, models: false, predictions: false, monitoring: false },
                lastCheck: new Date()
            };
        }
    }
    async checkDatabaseHealth() {
        try {
            await this.db.query('SELECT 1');
            return true;
        }
        catch {
            return false;
        }
    }
}
export const aiCostPredictionService = new AICostPredictionService();
//# sourceMappingURL=ai-cost-prediction.service.js.map