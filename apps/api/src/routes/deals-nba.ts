import { Router } from 'express';
import { z } from 'zod';
import { dealsNBAService } from '../lib/deals-nba.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const dealsNBARouter = Router();

// Validation schemas
const GetDealsSchema = z.object({
  organizationId: z.string().min(1),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  status: z.enum(['active', 'paused', 'cancelled', 'completed']).optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  minProbability: z.coerce.number().int().min(0).max(100).optional(),
  maxProbability: z.coerce.number().int().min(0).max(100).optional(),
  hasNBA: z.coerce.boolean().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const GetDealSchema = z.object({
  id: z.string().min(1),
});

const AnalyzeDealSchema = z.object({
  dealId: z.string().min(1),
});

const GetInsightsSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['trend', 'pattern', 'anomaly', 'opportunity', 'risk']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['new', 'acknowledged', 'investigating', 'resolved', 'dismissed']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Deal Management
dealsNBARouter.get('/deals', async (req, res) => {
  try {
    const filters = GetDealsSchema.parse(req.query);
    const deals = await dealsNBAService.getDeals(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        deals,
        total: deals.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting deals', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

dealsNBARouter.get('/deals/:id', async (req, res) => {
  try {
    const { id } = GetDealSchema.parse(req.params);
    const deal = await dealsNBAService.getDeal(id);
    
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }
    
    res.json({
      success: true,
      data: deal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting deal', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// NBA Analysis
dealsNBARouter.post('/deals/:id/analyze', async (req, res) => {
  try {
    const { id } = GetDealSchema.parse(req.params);
    const prediction = await dealsNBAService.analyzeDeal(id);
    
    res.status(201).json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error analyzing deal', { error });
    res.status(400).json({
      success: false,
      error: error.message || 'Analysis failed',
      details: error.errors
    });
  }
});

// Insights Management
dealsNBARouter.get('/insights', async (req, res) => {
  try {
    const filters = GetInsightsSchema.parse(req.query);
    const insights = await dealsNBAService.getInsights(filters.organizationId, filters);
    
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
    structuredLogger.error('Error getting insights', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
dealsNBARouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await dealsNBAService.getNBAStats(organizationId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting NBA stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
dealsNBARouter.get('/health', async (req, res) => {
  try {
    const stats = await dealsNBAService.getNBAStats('demo-org-1');
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        totalDeals: stats.totalDeals,
        dealsWithNBA: stats.dealsWithNBA,
        totalPredictions: stats.totalPredictions,
        averageConfidence: stats.averageConfidence,
        activeModels: stats.activeModels,
        totalInsights: stats.totalInsights,
        criticalInsights: stats.criticalInsights,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking deals NBA health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { dealsNBARouter };
