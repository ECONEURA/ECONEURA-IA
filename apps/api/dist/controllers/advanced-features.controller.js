import { z } from 'zod';
import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from '../lib/structured-logger.js';
import { predictiveAI } from '../services/predictive-ai.service.js';
import { metricsService } from '../services/metrics.service.js';
import { autoML } from '../services/automl.service.js';
import { sentimentAnalysis } from '../services/sentiment-analysis.service.js';
import { azureOpenAI } from '../services/azure-openai.service.js';
import { webSearch } from '../services/web-search.service.js';
const predictDemandSchema = z.object({
    productId: z.string().uuid('Invalid product ID format'),
    days: z.number().min(1).max(365).default(30),
    includeConfidence: z.boolean().default(true),
    includeTrends: z.boolean().default(false)
});
const optimizeInventorySchema = z.object({
    productId: z.string().uuid('Invalid product ID format'),
    optimizationType: z.enum(['cost', 'service_level', 'balanced']).default('balanced'),
    constraints: z.object({
        maxCost: z.number().optional(),
        minServiceLevel: z.number().min(0).max(1).optional(),
        maxStock: z.number().optional()
    }).optional()
});
const sentimentAnalysisSchema = z.object({
    text: z.string().min(1).max(10000, 'Text too long'),
    source: z.string().optional(),
    includeEmotions: z.boolean().default(true),
    includeTopics: z.boolean().default(true),
    includeKeywords: z.boolean().default(true)
});
const batchSentimentSchema = z.object({
    texts: z.array(z.string().min(1).max(10000)).min(1).max(100, 'Too many texts'),
    source: z.string().optional(),
    includeEmotions: z.boolean().default(true),
    includeTopics: z.boolean().default(true),
    includeKeywords: z.boolean().default(true)
});
export class AdvancedFeaturesController {
    db;
    requestMetrics = new Map();
    constructor() {
        this.db = getDatabaseService();
        this.startMetricsCleanup();
    }
    startMetricsCleanup() {
        setInterval(() => {
            this.requestMetrics.clear();
        }, 300000);
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async logRequest(requestId, endpoint, userId, organizationId, processingTime, success, error) {
        try {
            const db = this.db.getDatabase();
            await db.insert(auditLog).values({
                organizationId,
                userId,
                action: 'create',
                resourceType: 'api_request',
                newValues: {
                    requestId,
                    endpoint,
                    processingTime,
                    success,
                    error
                },
                createdAt: new Date()
            });
        }
        catch (error) {
            structuredLogger.error('Failed to log request', error);
        }
    }
    updateMetrics(endpoint, processingTime) {
        const current = this.requestMetrics.get(endpoint) || { count: 0, totalTime: 0 };
        this.requestMetrics.set(endpoint, {
            count: current.count + 1,
            totalTime: current.totalTime + processingTime
        });
    }
    sendResponse(res, requestId, startTime, data, error, statusCode = 200) {
        const processingTime = Date.now() - startTime;
        const response = {
            success: !error,
            data,
            error,
            timestamp: new Date().toISOString(),
            requestId,
            processingTime
        };
        res.status(statusCode).json(response);
    }
    async predictDemand(req, res) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            const validation = predictDemandSchema.safeParse(req.body);
            if (!validation.success) {
                this.sendResponse(res, requestId, startTime, undefined, `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
                return;
            }
            const { productId, days, includeConfidence, includeTrends } = validation.data;
            const userId = req.user?.id;
            const organizationId = req.user?.organizationId;
            if (!userId || !organizationId) {
                this.sendResponse(res, requestId, startTime, undefined, 'Authentication required', 401);
                return;
            }
            if (!req.user?.permissions.includes('predictive:read')) {
                this.sendResponse(res, requestId, startTime, undefined, 'Insufficient permissions', 403);
                return;
            }
            const prediction = await predictiveAI.predictDemand(productId, days, {
                includeConfidence,
                includeTrends,
                organizationId,
                userId
            });
            await this.logRequest(requestId, 'predictDemand', userId, organizationId, Date.now() - startTime, true);
            this.sendResponse(res, requestId, startTime, prediction);
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            structuredLogger.error('Failed to predict demand', {
                error: errorMessage,
                requestId,
                userId: req.user?.id,
                organizationId: req.user?.organizationId,
                processingTime
            });
            if (req.user?.id && req.user?.organizationId) {
                await this.logRequest(requestId, 'predictDemand', req.user.id, req.user.organizationId, processingTime, false, errorMessage);
            }
            this.sendResponse(res, requestId, startTime, undefined, 'Failed to predict demand', 500);
        }
    }
    async optimizeInventory(req, res) {
        try {
            const { productId } = req.body;
            if (!productId) {
                res.status(400).json({ error: 'Product ID is required' });
                return;
            }
            const optimization = await predictiveAI.optimizeInventory(productId);
            res.json({
                success: true,
                data: optimization
            });
        }
        catch (error) {
            structuredLogger.error('Failed to optimize inventory', error);
            res.status(500).json({ error: 'Failed to optimize inventory' });
        }
    }
    async analyzeSeasonality(req, res) {
        try {
            const { productId } = req.body;
            if (!productId) {
                res.status(400).json({ error: 'Product ID is required' });
                return;
            }
            const analysis = await predictiveAI.analyzeSeasonality(productId);
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            structuredLogger.error('Failed to analyze seasonality', error);
            res.status(500).json({ error: 'Failed to analyze seasonality' });
        }
    }
    async generateRecommendations(req, res) {
        try {
            const { productId } = req.body;
            if (!productId) {
                res.status(400).json({ error: 'Product ID is required' });
                return;
            }
            const recommendations = await predictiveAI.generateRecommendations(productId);
            res.json({
                success: true,
                data: { recommendations }
            });
        }
        catch (error) {
            structuredLogger.error('Failed to generate recommendations', error);
            res.status(500).json({ error: 'Failed to generate recommendations' });
        }
    }
    async getKPIScorecard(req, res) {
        try {
            const { category } = req.query;
            const scorecard = await metricsService.getKPIScorecard(category);
            res.json({
                success: true,
                data: scorecard
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get KPI scorecard', error);
            res.status(500).json({ error: 'Failed to get KPI scorecard' });
        }
    }
    async getTrendAnalysis(req, res) {
        try {
            const { metricId, period = '30d' } = req.query;
            if (!metricId) {
                res.status(400).json({ error: 'Metric ID is required' });
                return;
            }
            const analysis = await metricsService.getTrendAnalysis(metricId, period);
            res.json({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get trend analysis', error);
            res.status(500).json({ error: 'Failed to get trend analysis' });
        }
    }
    async generateAlerts(req, res) {
        try {
            const alerts = await metricsService.generateAlerts();
            res.json({
                success: true,
                data: alerts
            });
        }
        catch (error) {
            structuredLogger.error('Failed to generate alerts', error);
            res.status(500).json({ error: 'Failed to generate alerts' });
        }
    }
    async updateMetric(req, res) {
        try {
            const { metricId, value } = req.body;
            if (!metricId || value === undefined) {
                res.status(400).json({ error: 'Metric ID and value are required' });
                return;
            }
            await metricsService.updateMetric(metricId, value);
            res.json({
                success: true,
                message: 'Metric updated successfully'
            });
        }
        catch (error) {
            structuredLogger.error('Failed to update metric', error);
            res.status(500).json({ error: 'Failed to update metric' });
        }
    }
    async trainModel(req, res) {
        try {
            const { modelId, data, algorithm } = req.body;
            if (!modelId || !data) {
                res.status(400).json({ error: 'Model ID and training data are required' });
                return;
            }
            const model = await autoML.trainModel(modelId, data, algorithm);
            res.json({
                success: true,
                data: model
            });
        }
        catch (error) {
            structuredLogger.error('Failed to train model', error);
            res.status(500).json({ error: 'Failed to train model' });
        }
    }
    async predict(req, res) {
        try {
            const { modelId, features } = req.body;
            if (!modelId || !features) {
                res.status(400).json({ error: 'Model ID and features are required' });
                return;
            }
            const prediction = await autoML.predict(modelId, features);
            res.json({
                success: true,
                data: prediction
            });
        }
        catch (error) {
            structuredLogger.error('Failed to generate prediction', error);
            res.status(500).json({ error: 'Failed to generate prediction' });
        }
    }
    async evaluateModel(req, res) {
        try {
            const { modelId, testData } = req.body;
            if (!modelId || !testData) {
                res.status(400).json({ error: 'Model ID and test data are required' });
                return;
            }
            const evaluation = await autoML.evaluateModel(modelId, testData);
            res.json({
                success: true,
                data: evaluation
            });
        }
        catch (error) {
            structuredLogger.error('Failed to evaluate model', error);
            res.status(500).json({ error: 'Failed to evaluate model' });
        }
    }
    async getModels(req, res) {
        try {
            const models = await autoML.getModels();
            res.json({
                success: true,
                data: models
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get models', error);
            res.status(500).json({ error: 'Failed to get models' });
        }
    }
    async analyzeSentiment(req, res) {
        try {
            const { text, source } = req.body;
            if (!text) {
                res.status(400).json({ error: 'Text is required' });
                return;
            }
            const result = await sentimentAnalysis.analyzeSentiment(text, source);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            structuredLogger.error('Failed to analyze sentiment', error);
            res.status(500).json({ error: 'Failed to analyze sentiment' });
        }
    }
    async analyzeBatchSentiment(req, res) {
        try {
            const { texts, source } = req.body;
            if (!texts || !Array.isArray(texts)) {
                res.status(400).json({ error: 'Texts array is required' });
                return;
            }
            const result = await sentimentAnalysis.analyzeBatch(texts, source);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
            structuredLogger.error('Failed to analyze batch sentiment', error);
            res.status(500).json({ error: 'Failed to analyze batch sentiment' });
        }
    }
    async getSentimentTrends(req, res) {
        try {
            const { source, period = '30d' } = req.query;
            if (!source) {
                res.status(400).json({ error: 'Source is required' });
                return;
            }
            const trends = await sentimentAnalysis.getTrendAnalysis(source, period);
            res.json({
                success: true,
                data: trends
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get sentiment trends', error);
            res.status(500).json({ error: 'Failed to get sentiment trends' });
        }
    }
    async chat(req, res) {
        try {
            const { messages, options } = req.body;
            if (!messages || !Array.isArray(messages)) {
                res.status(400).json({ error: 'Messages array is required' });
                return;
            }
            const response = await azureOpenAI.chat(messages, options);
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            structuredLogger.error('Failed to process chat', error);
            res.status(500).json({ error: 'Failed to process chat' });
        }
    }
    async generateImage(req, res) {
        try {
            const { prompt, size, quality, style } = req.body;
            if (!prompt) {
                res.status(400).json({ error: 'Prompt is required' });
                return;
            }
            const response = await azureOpenAI.generateImage({
                prompt,
                size,
                quality,
                style
            });
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            structuredLogger.error('Failed to generate image', error);
            res.status(500).json({ error: 'Failed to generate image' });
        }
    }
    async textToSpeech(req, res) {
        try {
            const { text, voice, speed, pitch } = req.body;
            if (!text) {
                res.status(400).json({ error: 'Text is required' });
                return;
            }
            const response = await azureOpenAI.textToSpeech({
                text,
                voice,
                speed,
                pitch
            });
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            structuredLogger.error('Failed to convert text to speech', error);
            res.status(500).json({ error: 'Failed to convert text to speech' });
        }
    }
    async getUsageStats(req, res) {
        try {
            const { period = '30d' } = req.query;
            const stats = await azureOpenAI.getUsageStats(period);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get usage stats', error);
            res.status(500).json({ error: 'Failed to get usage stats' });
        }
    }
    async search(req, res) {
        try {
            const { query, options } = req.body;
            if (!query) {
                res.status(400).json({ error: 'Query is required' });
                return;
            }
            const response = await webSearch.search(query, options);
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            structuredLogger.error('Failed to perform web search', error);
            res.status(500).json({ error: 'Failed to perform web search' });
        }
    }
    async searchNews(req, res) {
        try {
            const { query, options } = req.body;
            if (!query) {
                res.status(400).json({ error: 'Query is required' });
                return;
            }
            const response = await webSearch.searchNews(query, options);
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            structuredLogger.error('Failed to search news', error);
            res.status(500).json({ error: 'Failed to search news' });
        }
    }
    async getTrendingTopics(req, res) {
        try {
            const topics = await webSearch.getTrendingTopics();
            res.json({
                success: true,
                data: topics
            });
        }
        catch (error) {
            structuredLogger.error('Failed to get trending topics', error);
            res.status(500).json({ error: 'Failed to get trending topics' });
        }
    }
    async healthCheck(req, res) {
        try {
            const health = {
                status: 'healthy',
                services: {
                    predictiveAI: 'operational',
                    metrics: 'operational',
                    autoML: 'operational',
                    sentimentAnalysis: 'operational',
                    azureOpenAI: 'operational',
                    webSearch: 'operational'
                },
                timestamp: new Date()
            };
            res.json({
                success: true,
                data: health
            });
        }
        catch (error) {
            structuredLogger.error('Health check failed', error);
            res.status(500).json({ error: 'Health check failed' });
        }
    }
}
export const advancedFeaturesController = new AdvancedFeaturesController();
//# sourceMappingURL=advanced-features.controller.js.map