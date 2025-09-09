import { z } from 'zod';
import { getDatabaseService } from '../lib/database.service.js';
import { logger } from '../lib/logger.js';

// Schemas de validación
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

// Tipos TypeScript
export type CostPredictionModel = z.infer<typeof CostPredictionModelSchema>;
export type CostPrediction = z.infer<typeof CostPredictionSchema>;
export type CostForecast = z.infer<typeof CostForecastSchema>;

export interface CostPredictionRequest {
  organizationId: string;
  predictionType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  horizon: number;
  features?: Record<string, any>;
  modelId?: string;
}

export interface CostForecastRequest {
  organizationId: string;
  forecastType: 'budget_planning' | 'cost_optimization' | 'capacity_planning' | 'risk_assessment';
  timeHorizon: number;
  scenarios?: string[];
  confidence?: number;
}

export interface ModelTrainingData {
  organizationId: string;
  historicalData: Array<{
    date: Date;
    cost: number;
    tokens: number;
    requests: number;
    models: string[];
    providers: string[];
    features: Record<string, number>;
  }>;
  targetVariable: string;
  features: string[];
}

export class AICostPredictionService {
  private db: ReturnType<typeof getDatabaseService>;
  private modelsCache: Map<string, CostPredictionModel> = new Map();
  private predictionsCache: Map<string, CostPrediction> = new Map();
  private forecastsCache: Map<string, CostForecast> = new Map();

  // Modelos de predicción predefinidos
  private readonly DEFAULT_MODELS = {
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

  private async initializeService(): Promise<void> {
    try {
      await this.createTables();
      await this.loadPredictionModels();
      await this.initializeDefaultModels();
      await this.startPredictionMonitoring();
      logger.info('AI Cost Prediction Service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize AI Cost Prediction Service', { error: error.message });
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      // Tabla de modelos de predicción
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

      // Tabla de predicciones
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

      // Tabla de pronósticos
      `CREATE TABLE IF NOT EXISTS ai_cost_forecasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        forecast_type VARCHAR(50) NOT NULL CHECK (forecast_type IN ('budget_planning', 'cost_optimization', 'capacity_planning', 'risk_assessment')),
        time_horizon INTEGER NOT NULL,
        scenarios JSONB NOT NULL,
        recommendations JSONB NOT NULL DEFAULT '[]',
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // Tabla de datos de entrenamiento
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

  private async loadPredictionModels(): Promise<void> {
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
    } catch (error: any) {
      logger.error('Failed to load cost prediction models', { error: error.message });
    }
  }

  private async initializeDefaultModels(): Promise<void> {
    for (const [modelId, modelData] of Object.entries(this.DEFAULT_MODELS)) {
      const existing = await this.db.query(
        'SELECT id FROM ai_cost_prediction_models WHERE name = $1',
        [modelData.name]
      );

      if (existing.rows.length === 0) {
        await this.db.query(
          `INSERT INTO ai_cost_prediction_models (name, description, type, algorithm, features, hyperparameters)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            modelData.name,
            modelData.description,
            modelData.type,
            modelData.algorithm,
            JSON.stringify(modelData.features),
            JSON.stringify(modelData.hyperparameters);
          ]
        );
      }
    }
  }

  private async startPredictionMonitoring(): Promise<void> {
    // Monitoreo de predicciones en background cada 30 minutos
    setInterval(async () => {
      try {
        await this.updateModelAccuracy();
        await this.generateAutomaticPredictions();
        await this.retrainModelsIfNeeded();
      } catch (error: any) {
        logger.error('Prediction monitoring error', { error: error.message });
      }
    }, 1800000); // Cada 30 minutos
  }

  // Gestión de modelos de predicción
  async createPredictionModel(model: Omit<CostPredictionModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostPredictionModel> {
    try {
      const result = await this.db.query(
        `INSERT INTO ai_cost_prediction_models (name, description, type, algorithm, features, hyperparameters, accuracy, mae, mse, rmse, r2_score, is_active, last_trained)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
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
        ]
      );

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
    } catch (error: any) {
      logger.error('Failed to create cost prediction model', { error: error.message });
      throw error;
    }
  }

  async getPredictionModels(): Promise<CostPredictionModel[]> {
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
    } catch (error: any) {
      logger.error('Failed to get cost prediction models', { error: error.message });
      throw error;
    }
  }

  // Entrenamiento de modelos
  async trainModel(modelId: string, trainingData: ModelTrainingData): Promise<CostPredictionModel> {
    try {
      const model = this.modelsCache.get(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      // Simular entrenamiento del modelo
      const trainingResult = await this.simulateModelTraining(model, trainingData);

      // Actualizar métricas del modelo
      await this.db.query(
        `UPDATE ai_cost_prediction_models
         SET accuracy = $1, mae = $2, mse = $3, rmse = $4, r2_score = $5, last_trained = NOW(), updated_at = NOW()
         WHERE id = $6`,
        [
          trainingResult.accuracy,
          trainingResult.mae,
          trainingResult.mse,
          trainingResult.rmse,
          trainingResult.r2Score,
          modelId
        ]
      );

      // Actualizar cache
      const updatedModel = { ...model, ...trainingResult, lastTrained: new Date() };
      this.modelsCache.set(modelId, updatedModel);

      logger.info('Model training completed', {
        modelId,
        accuracy: trainingResult.accuracy,
        mae: trainingResult.mae,
        rmse: trainingResult.rmse
      });

      return updatedModel;
    } catch (error: any) {
      logger.error('Failed to train model', { error: error.message });
      throw error;
    }
  }

  private async simulateModelTraining(model: CostPredictionModel, trainingData: ModelTrainingData): Promise<{
    accuracy: number;
    mae: number;
    mse: number;
    rmse: number;
    r2Score: number;
  }> {
    // Simular entrenamiento basado en el tipo de modelo
    const baseAccuracy = 0.75 + Math.random() * 0.2; // 75-95%
    const baseMAE = 5 + Math.random() * 10; // 5-15 EUR
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

  // Predicciones de costos
  async generateCostPrediction(request: CostPredictionRequest): Promise<CostPrediction> {
    try {
      const modelId = request.modelId || this.selectBestModel(request.predictionType);
      const model = this.modelsCache.get(modelId);

      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      // Obtener datos históricos
      const historicalData = await this.getHistoricalData(request.organizationId, 90);

      // Generar predicciones
      const predictions = await this.generatePredictions(model, historicalData, request);

      // Calcular accuracy estimada
      const accuracy = this.estimatePredictionAccuracy(model, historicalData);

      const prediction: CostPrediction = {
        id: `pred_${Date.now()}`,
        organizationId: request.organizationId,
        modelId,
        predictionType: request.predictionType,
        horizon: request.horizon,
        predictions,
        accuracy,
        generatedAt: new Date()
      };

      // Guardar predicción en base de datos
      await this.db.query(
        `INSERT INTO ai_cost_predictions (organization_id, model_id, prediction_type, horizon, predictions, accuracy)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          request.organizationId,
          modelId,
          request.predictionType,
          request.horizon,
          JSON.stringify(predictions),
          accuracy
        ]
      );

      this.predictionsCache.set(prediction.id, prediction);

      logger.info('Cost prediction generated', {
        predictionId: prediction.id,
        organizationId: request.organizationId,
        modelId,
        horizon: request.horizon,
        accuracy
      });

      return prediction;
    } catch (error: any) {
      logger.error('Failed to generate cost prediction', { error: error.message });
      throw error;
    }
  }

  private selectBestModel(predictionType: string): string {
    // Seleccionar el mejor modelo basado en el tipo de predicción
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

  private async getHistoricalData(organizationId: string, days: number): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await this.db.query(
        `SELECT * FROM ai_cost_training_data
         WHERE organization_id = $1 AND date >= $2
         ORDER BY date ASC`,
        [organizationId, startDate]
      );

      return result.rows.map(row => ({
        date: row.date,
        cost: parseFloat(row.cost_eur),
        tokens: row.tokens,
        requests: row.requests,
        models: row.models,
        providers: row.providers,
        features: row.features
      }));
    } catch (error: any) {
      logger.error('Failed to get historical data', { error: error.message });
      return [];
    }
  }

  private async generatePredictions(model: CostPredictionModel, historicalData: any[], request: CostPredictionRequest): Promise<CostPrediction['predictions']> {
    const predictions: CostPrediction['predictions'] = [];
    const baseCost = historicalData.length > 0 ?
      historicalData.reduce((sum, d) => sum + d.cost, 0) / historicalData.length : 50;

    const trend = this.calculateTrend(historicalData);
    const seasonality = this.calculateSeasonality();

    for (let i = 1; i <= request.horizon; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i * this.getDaysMultiplier(request.predictionType));

      // Simular predicción basada en el modelo
      const predictedCost = this.simulatePrediction(model, baseCost, trend, seasonality, i);
      const confidence = Math.max(0.6, model.accuracy - (i * 0.05)); // Decrece con el horizonte
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

  private getDaysMultiplier(predictionType: string): number {
    switch (predictionType) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'yearly': return 365;
      default: return 1;
    }
  }

  private calculateTrend(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;

    const recent = historicalData.slice(-7);
    const older = historicalData.slice(-14, -7);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((sum, d) => sum + d.cost, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.cost, 0) / older.length;

    return (recentAvg - olderAvg) / olderAvg;
  }

  private calculateSeasonality(): number {
    const month = new Date().getMonth();
    const seasonalFactors = [0.8, 0.9, 1.1, 1.2, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.3];
    return seasonalFactors[month];
  }

  private simulatePrediction(model: CostPredictionModel, baseCost: number, trend: number, seasonality: number, horizon: number): number {
    // Simular predicción basada en el tipo de modelo
    let prediction = baseCost;

    // Aplicar tendencia
    prediction *= (1 + trend * horizon * 0.1);

    // Aplicar estacionalidad
    prediction *= seasonality;

    // Aplicar variación aleatoria basada en el modelo
    const randomFactor = 0.9 + Math.random() * 0.2; // ±10%
    prediction *= randomFactor;

    // Ajustar basado en la precisión del modelo
    const accuracyFactor = 0.8 + model.accuracy * 0.4; // 80-120%
    prediction *= accuracyFactor;

    return Math.max(0, prediction);
  }

  private estimatePredictionAccuracy(model: CostPredictionModel, historicalData: any[]): number {
    // Estimar accuracy basada en la calidad del modelo y los datos históricos
    let accuracy = model.accuracy;

    // Reducir accuracy si hay pocos datos históricos
    if (historicalData.length < 30) {
      accuracy *= 0.8;
    }

    // Reducir accuracy si hay mucha variabilidad en los datos
    if (historicalData.length > 1) {
      const costs = historicalData.map(d => d.cost);
      const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
      const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length;
      const coefficient = Math.sqrt(variance) / mean;

      if (coefficient > 0.5) { // Alta variabilidad
        accuracy *= 0.9;
      }
    }

    return Math.max(0.5, Math.min(0.99, accuracy));
  }

  // Pronósticos de costos
  async generateCostForecast(request: CostForecastRequest): Promise<CostForecast> {
    try {
      // Generar múltiples escenarios
      const scenarios = await this.generateScenarios(request);

      // Generar recomendaciones
      const recommendations = this.generateForecastRecommendations(scenarios, request);

      const forecast: CostForecast = {
        id: `forecast_${Date.now()}`,
        organizationId: request.organizationId,
        forecastType: request.forecastType,
        timeHorizon: request.timeHorizon,
        scenarios,
        recommendations,
        generatedAt: new Date()
      };

      // Guardar pronóstico en base de datos
      await this.db.query(
        `INSERT INTO ai_cost_forecasts (organization_id, forecast_type, time_horizon, scenarios, recommendations)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          request.organizationId,
          request.forecastType,
          request.timeHorizon,
          JSON.stringify(scenarios),
          JSON.stringify(recommendations);
        ]
      );

      this.forecastsCache.set(forecast.id, forecast);

      logger.info('Cost forecast generated', {
        forecastId: forecast.id,
        organizationId: request.organizationId,
        forecastType: request.forecastType,
        scenariosCount: scenarios.length
      });

      return forecast;
    } catch (error: any) {
      logger.error('Failed to generate cost forecast', { error: error.message });
      throw error;
    }
  }

  private async generateScenarios(request: CostForecastRequest): Promise<CostForecast['scenarios']> {
    const scenarios: CostForecast['scenarios'] = [];

    // Escenario optimista (20% probabilidad)
    scenarios.push({
      name: 'Optimistic',
      probability: 0.2,
      predictions: await this.generateScenarioPredictions(request, 0.8) // 20% menos costos
    });

    // Escenario base (60% probabilidad)
    scenarios.push({
      name: 'Base Case',
      probability: 0.6,
      predictions: await this.generateScenarioPredictions(request, 1.0) // Costos normales
    });

    // Escenario pesimista (20% probabilidad)
    scenarios.push({
      name: 'Pessimistic',
      probability: 0.2,
      predictions: await this.generateScenarioPredictions(request, 1.3) // 30% más costos
    });

    return scenarios;
  }

  private async generateScenarioPredictions(request: CostForecastRequest, factor: number): Promise<CostForecast['scenarios'][0]['predictions']> {
    const predictions: CostForecast['scenarios'][0]['predictions'] = [];
    const historicalData = await this.getHistoricalData(request.organizationId, 30);
    const baseCost = historicalData.length > 0 ?
      historicalData.reduce((sum, d) => sum + d.cost, 0) / historicalData.length : 50;

    for (let i = 1; i <= request.timeHorizon; i++) {
      const period = this.getPeriodName(i, request.forecastType);
      const predictedCost = baseCost * factor * (1 + Math.random() * 0.2 - 0.1); // ±10% variación
      const confidence = Math.max(0.5, 0.9 - (i * 0.05)); // Decrece con el horizonte

      predictions.push({
        period,
        cost: Math.max(0, predictedCost),
        confidence
      });
    }

    return predictions;
  }

  private getPeriodName(period: number, forecastType: string): string {
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

  private generateForecastRecommendations(scenarios: CostForecast['scenarios'], request: CostForecastRequest): string[] {
    const recommendations: string[] = [];
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

  // Monitoreo y actualización automática
  private async updateModelAccuracy(): Promise<void> {
    try {
      // Actualizar accuracy de modelos basado en predicciones recientes
      for (const [modelId, model] of this.modelsCache) {
        const recentPredictions = await this.getRecentPredictions(modelId, 30);

        if (recentPredictions.length > 0) {
          const actualAccuracy = this.calculateActualAccuracy(recentPredictions);

          if (Math.abs(actualAccuracy - model.accuracy) > 0.05) {
            await this.db.query(
              'UPDATE ai_cost_prediction_models SET accuracy = $1, updated_at = NOW() WHERE id = $2',
              [actualAccuracy, modelId]
            );

            this.modelsCache.set(modelId, { ...model, accuracy: actualAccuracy });
          }
        }
      }
    } catch (error: any) {
      logger.error('Failed to update model accuracy', { error: error.message });
    }
  }

  private async getRecentPredictions(modelId: string, days: number): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await this.db.query(
        `SELECT * FROM ai_cost_predictions
         WHERE model_id = $1 AND generated_at >= $2
         ORDER BY generated_at DESC`,
        [modelId, startDate]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Failed to get recent predictions', { error: error.message });
      return [];
    }
  }

  private calculateActualAccuracy(predictions: any[]): number {
    // Calcular accuracy real basada en predicciones vs datos reales
    // Esto sería implementado con datos reales de costos
    return 0.75 + Math.random() * 0.2; // Simulado
  }

  private async generateAutomaticPredictions(): Promise<void> {
    try {
      // Generar predicciones automáticas para organizaciones activas
      const activeOrganizations = await this.getActiveOrganizations();

      for (const orgId of activeOrganizations) {
        const lastPrediction = await this.getLastPrediction(orgId);
        const daysSinceLastPrediction = lastPrediction ?
          (Date.now() - new Date(lastPrediction.generated_at).getTime()) / (1000 * 60 * 60 * 24) : 999;

        if (daysSinceLastPrediction > 7) { // Generar nueva predicción si han pasado más de 7 días
          await this.generateCostPrediction({
            organizationId: orgId,
            predictionType: 'weekly',
            horizon: 4
          });
        }
      }
    } catch (error: any) {
      logger.error('Failed to generate automatic predictions', { error: error.message });
    }
  }

  private async getActiveOrganizations(): Promise<string[]> {
    try {
      const result = await this.db.query(
        'SELECT DISTINCT organization_id FROM ai_cost_training_data WHERE date >= NOW() - INTERVAL \'30 days\''
      );
      return result.rows.map(row => row.organization_id);
    } catch (error: any) {
      logger.error('Failed to get active organizations', { error: error.message });
      return [];
    }
  }

  private async getLastPrediction(organizationId: string): Promise<any> {
    try {
      const result = await this.db.query(
        `SELECT * FROM ai_cost_predictions
         WHERE organization_id = $1
         ORDER BY generated_at DESC
         LIMIT 1`,
        [organizationId]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('Failed to get last prediction', { error: error.message });
      return null;
    }
  }

  private async retrainModelsIfNeeded(): Promise<void> {
    try {
      // Reentrenar modelos si han pasado más de 30 días desde el último entrenamiento
      for (const [modelId, model] of this.modelsCache) {
        const daysSinceTraining = (Date.now() - new Date(model.lastTrained).getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceTraining > 30) {
          const trainingData = await this.getTrainingDataForModel(modelId);
          if (trainingData.historicalData.length > 100) {
            await this.trainModel(modelId, trainingData);
          }
        }
      }
    } catch (error: any) {
      logger.error('Failed to retrain models', { error: error.message });
    }
  }

  private async getTrainingDataForModel(modelId: string): Promise<ModelTrainingData> {
    // Obtener datos de entrenamiento para un modelo específico
    const organizations = await this.getActiveOrganizations();
    const allData: any[] = [];

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

  // Health check
  async getHealthStatus(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; services: Record<string, boolean>; lastCheck: Date }> {
    try {
      const services = {
        database: await this.checkDatabaseHealth(),
        models: this.modelsCache.size > 0,
        predictions: true,
        monitoring: true
      };

      const healthyServices = Object.values(services).filter(Boolean).length;
      const totalServices = Object.keys(services).length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyServices === totalServices) {
        status = 'healthy';
      } else if (healthyServices >= totalServices * 0.5) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        services,
        lastCheck: new Date()
      };
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        services: { database: false, models: false, predictions: false, monitoring: false },
        lastCheck: new Date()
      };
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

export const aiCostPredictionService = new AICostPredictionService();
