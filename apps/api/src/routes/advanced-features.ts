import { Router } from 'express';
import { z } from 'zod';

import { advancedFeaturesController } from '../controllers/advanced-features.controller.js';

const router = Router();

// Validation schemas
const productIdSchema = z.object({
  productId: z.string().min(1, 'Product ID is required')
});

const demandPredictionSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  days: z.number().min(1).max(365).optional().default(30)
});

const metricUpdateSchema = z.object({
  metricId: z.string().min(1, 'Metric ID is required'),
  value: z.number()
});

const modelTrainingSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required'),
  data: z.object({
    features: z.array(z.array(z.number())),
    labels: z.array(z.number()),
    featureNames: z.array(z.string())
  }),
  algorithm: z.enum(['linear', 'random_forest', 'neural_network', 'xgboost']).optional()
});

const predictionSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required'),
  features: z.array(z.number())
});

const sentimentAnalysisSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  source: z.string().optional()
});

const batchSentimentSchema = z.object({
  texts: z.array(z.string().min(1)),
  source: z.string().optional()
});

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1)
  })),
  options: z.object({
    maxTokens: z.number().min(1).max(4000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional()
  }).optional()
});

const imageGenerationSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional()
});

const ttSSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  voice: z.string().optional(),
  speed: z.number().min(0.5).max(2).optional(),
  pitch: z.number().min(0.5).max(2).optional()
});

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  options: z.object({
    maxResults: z.number().min(1).max(100).optional(),
    language: z.string().optional(),
    region: z.string().optional(),
    safeSearch: z.enum(['off', 'moderate', 'strict']).optional(),
    dateRange: z.enum(['day', 'week', 'month', 'year']).optional()
  }).optional()
});

// PR-13: Predictive AI routes
router.post('/ai/predict-demand', async (req, res) => {
  try {
    const validatedData = demandPredictionSchema.parse(req.body);
    await advancedFeaturesController.predictDemand(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/ai/optimize-inventory', async (req, res) => {
  try {
    const validatedData = productIdSchema.parse(req.body);
    await advancedFeaturesController.optimizeInventory(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/ai/analyze-seasonality', async (req, res) => {
  try {
    const validatedData = productIdSchema.parse(req.body);
    await advancedFeaturesController.analyzeSeasonality(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/ai/generate-recommendations', async (req, res) => {
  try {
    const validatedData = productIdSchema.parse(req.body);
    await advancedFeaturesController.generateRecommendations(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PR-13: Metrics routes
router.get('/metrics/kpi-scorecard', async (req, res) => {
  try {
    await advancedFeaturesController.getKPIScorecard(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/metrics/trend-analysis', async (req, res) => {
  try {
    await advancedFeaturesController.getTrendAnalysis(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/metrics/alerts', async (req, res) => {
  try {
    await advancedFeaturesController.generateAlerts(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/metrics/update', async (req, res) => {
  try {
    const validatedData = metricUpdateSchema.parse(req.body);
    await advancedFeaturesController.updateMetric(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// PR-14: AutoML routes
router.post('/ml/train', async (req, res) => {
  try {
    const validatedData = modelTrainingSchema.parse(req.body);
    await advancedFeaturesController.trainModel(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/ml/predict', async (req, res) => {
  try {
    const validatedData = predictionSchema.parse(req.body);
    await advancedFeaturesController.predict(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/ml/evaluate', async (req, res) => {
  try {
    const validatedData = z.object({
      modelId: z.string().min(1, 'Model ID is required'),
      testData: z.object({
        features: z.array(z.array(z.number())),
        labels: z.array(z.number()),
        featureNames: z.array(z.string())
      })
    }).parse(req.body);
    await advancedFeaturesController.evaluateModel(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/ml/models', async (req, res) => {
  try {
    await advancedFeaturesController.getModels(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PR-14: Sentiment Analysis routes
router.post('/sentiment/analyze', async (req, res) => {
  try {
    const validatedData = sentimentAnalysisSchema.parse(req.body);
    await advancedFeaturesController.analyzeSentiment(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/sentiment/batch', async (req, res) => {
  try {
    const validatedData = batchSentimentSchema.parse(req.body);
    await advancedFeaturesController.analyzeBatchSentiment(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/sentiment/trends', async (req, res) => {
  try {
    await advancedFeaturesController.getSentimentTrends(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PR-15: Azure OpenAI routes
router.post('/azure/chat', async (req, res) => {
  try {
    const validatedData = chatSchema.parse(req.body);
    await advancedFeaturesController.chat(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/azure/generate-image', async (req, res) => {
  try {
    const validatedData = imageGenerationSchema.parse(req.body);
    await advancedFeaturesController.generateImage(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/azure/text-to-speech', async (req, res) => {
  try {
    const validatedData = ttSSchema.parse(req.body);
    await advancedFeaturesController.textToSpeech(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/azure/usage-stats', async (req, res) => {
  try {
    await advancedFeaturesController.getUsageStats(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Web Search routes
router.post('/search/web', async (req, res) => {
  try {
    const validatedData = searchSchema.parse(req.body);
    await advancedFeaturesController.search(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.post('/search/news', async (req, res) => {
  try {
    const validatedData = searchSchema.parse(req.body);
    await advancedFeaturesController.searchNews(req, res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/search/trending', async (req, res) => {
  try {
    await advancedFeaturesController.getTrendingTopics(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check route
router.get('/health', async (req, res) => {
  try {
    await advancedFeaturesController.healthCheck(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as advancedFeaturesRouter };
