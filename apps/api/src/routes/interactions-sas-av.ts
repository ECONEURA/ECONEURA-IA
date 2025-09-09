import { Router } from 'express';
import { z } from 'zod';
import { interactionsSasAvService } from '../lib/interactions-sas-av.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const interactionsSasAvRouter = Router();

// Validation schemas
const GetInteractionsSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['call', 'email', 'chat', 'meeting', 'social_media', 'support_ticket', 'survey']).optional(),
  channel: z.enum(['phone', 'email', 'web', 'mobile', 'social', 'in_person', 'video']).optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'escalated', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  agentId: z.string().optional(),
  customerId: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateInteractionSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['call', 'email', 'chat', 'meeting', 'social_media', 'support_ticket', 'survey']),
  channel: z.enum(['phone', 'email', 'web', 'mobile', 'social', 'in_person', 'video']),
  direction: z.enum(['inbound', 'outbound']),
  status: z.enum(['active', 'completed', 'cancelled', 'escalated', 'resolved']).default('active'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  participants: z.object({
    customerId: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional(),
    agentId: z.string().optional(),
    agentName: z.string().optional(),
    department: z.string().optional(),
  }),
  content: z.object({
    subject: z.string().optional(),
    summary: z.string().optional(),
    transcript: z.string().optional(),
    attachments: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
  timing: z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    duration: z.coerce.number().int().nonnegative().optional(),
    responseTime: z.coerce.number().int().nonnegative().optional(),
    waitTime: z.coerce.number().int().nonnegative().optional(),
  }),
  sentimentAnalysis: z.object({
    overallSentiment: z.enum(['positive', 'neutral', 'negative']),
    confidence: z.coerce.number().min(0).max(1),
    emotions: z.object({
      joy: z.coerce.number().min(0).max(1),
      anger: z.coerce.number().min(0).max(1),
      fear: z.coerce.number().min(0).max(1),
      sadness: z.coerce.number().min(0).max(1),
      surprise: z.coerce.number().min(0).max(1),
      disgust: z.coerce.number().min(0).max(1),
    }),
    topics: z.array(z.object({
      topic: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      confidence: z.coerce.number().min(0).max(1),
    })).default([]),
    keywords: z.array(z.object({
      word: z.string(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      frequency: z.coerce.number().int().positive(),
    })).default([]),
    sentimentTrend: z.array(z.object({
      timestamp: z.string().datetime(),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      confidence: z.coerce.number().min(0).max(1),
    })).default([]),
  }),
  voiceAnalysis: z.object({
    audioQuality: z.object({
      clarity: z.coerce.number().min(0).max(1),
      volume: z.coerce.number().min(0).max(1),
      backgroundNoise: z.coerce.number().min(0).max(1),
      distortion: z.coerce.number().min(0).max(1),
    }),
    speechPatterns: z.object({
      speakingRate: z.coerce.number().positive(),
      pauseFrequency: z.coerce.number().nonnegative(),
      averagePauseLength: z.coerce.number().nonnegative(),
      speechClarity: z.coerce.number().min(0).max(1),
    }),
    emotionalTone: z.object({
      stress: z.coerce.number().min(0).max(1),
      excitement: z.coerce.number().min(0).max(1),
      calmness: z.coerce.number().min(0).max(1),
      frustration: z.coerce.number().min(0).max(1),
    }),
    languageAnalysis: z.object({
      language: z.string(),
      dialect: z.string().optional(),
      accent: z.string().optional(),
      formality: z.enum(['formal', 'informal', 'mixed']),
      politeness: z.coerce.number().min(0).max(1),
    }),
    voiceBiometrics: z.object({
      pitch: z.coerce.number().positive(),
      tone: z.coerce.number().min(0).max(1),
      rhythm: z.coerce.number().min(0).max(1),
      volume: z.coerce.number().min(0).max(1),
    }).optional(),
  }).optional(),
  outcomes: z.object({
    resolution: z.string().optional(),
    satisfaction: z.coerce.number().int().min(1).max(5).optional(),
    followUpRequired: z.boolean().optional(),
    escalationReason: z.string().optional(),
    actionItems: z.array(z.string()).default([]),
    nextSteps: z.array(z.string()).default([]),
  }).optional(),
  metadata: z.object({
    source: z.string(),
    campaignId: z.string().optional(),
    leadId: z.string().optional(),
    dealId: z.string().optional(),
    ticketId: z.string().optional(),
    customFields: z.record(z.any()).optional(),
  }),
});

const AnalyzeSentimentSchema = z.object({
  text: z.string().min(1),
  audioData: z.any().optional(),
});

const AnalyzeVoiceSchema = z.object({
  audioData: z.any(),
});

const GetSentimentInsightsSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['trend', 'alert', 'pattern', 'recommendation']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const GetVoiceInsightsSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['quality_issue', 'emotion_detection', 'speech_pattern', 'language_insight']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const GenerateReportSchema = z.object({
  organizationId: z.string().min(1),
  reportType: z.enum(['sentiment_summary', 'voice_analysis', 'interaction_trends', 'agent_performance', 'customer_satisfaction']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  generatedBy: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Interaction Management
interactionsSasAvRouter.get('/interactions', async (req, res) => {
  try {
    const filters = GetInteractionsSchema.parse(req.query);
    const interactions = await interactionsSasAvService.getInteractions(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        interactions,
        total: interactions.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting interactions', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

interactionsSasAvRouter.get('/interactions/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const interaction = await interactionsSasAvService.getInteraction(id);

    if (!interaction) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found'
      });
    }

    res.json({
      success: true,
      data: interaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting interaction', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

interactionsSasAvRouter.post('/interactions', async (req, res) => {
  try {
    const interactionData = CreateInteractionSchema.parse(req.body);
    const interaction = await interactionsSasAvService.createInteraction(interactionData);

    res.status(201).json({
      success: true,
      data: interaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating interaction', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Sentiment Analysis
interactionsSasAvRouter.post('/analyze/sentiment', async (req, res) => {
  try {
    const { text, audioData } = AnalyzeSentimentSchema.parse(req.body);
    const analysis = await interactionsSasAvService.analyzeSentiment(text, audioData);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error analyzing sentiment', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Voice Analysis
interactionsSasAvRouter.post('/analyze/voice', async (req, res) => {
  try {
    const { audioData } = AnalyzeVoiceSchema.parse(req.body);
    const analysis = await interactionsSasAvService.analyzeVoice(audioData);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error analyzing voice', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Sentiment Insights
interactionsSasAvRouter.get('/insights/sentiment', async (req, res) => {
  try {
    const filters = GetSentimentInsightsSchema.parse(req.query);
    const insights = await interactionsSasAvService.getSentimentInsights(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        insights,
        total: insights.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting sentiment insights', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Voice Insights
interactionsSasAvRouter.get('/insights/voice', async (req, res) => {
  try {
    const filters = GetVoiceInsightsSchema.parse(req.query);
    const insights = await interactionsSasAvService.getVoiceInsights(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        insights,
        total: insights.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting voice insights', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Reports
interactionsSasAvRouter.post('/reports', async (req, res) => {
  try {
    const reportData = GenerateReportSchema.parse(req.body);
    const report = await interactionsSasAvService.generateInteractionReport(
      reportData.organizationId,
      reportData.reportType,
      reportData.startDate,
      reportData.endDate,
      reportData.generatedBy
    );

    res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error generating interaction report', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
interactionsSasAvRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await interactionsSasAvService.getInteractionStats(organizationId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting interaction stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
interactionsSasAvRouter.get('/health', async (req, res) => {
  try {
    const stats = await interactionsSasAvService.getInteractionStats('demo-org-1');

    res.json({
      success: true,
      data: {
        status: 'ok',
        totalInteractions: stats.totalInteractions,
        activeInteractions: stats.activeInteractions,
        averageSentiment: stats.averageSentiment,
        positiveInteractions: stats.positiveInteractions,
        negativeInteractions: stats.negativeInteractions,
        activeInsights: stats.activeInsights,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking interactions health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { interactionsSasAvRouter };
