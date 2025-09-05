import { Router } from 'express';
import { z } from 'zod';
import { dunning3ToquesService } from '../lib/dunning-3-toques.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const dunning3ToquesRouter = Router();

// Validation schemas
const GetInvoicesSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'disputed']).optional(),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  daysOverdue: z.coerce.number().int().nonnegative().optional(),
  hasDunning: z.coerce.boolean().optional(),
  dunningLevel: z.coerce.number().int().min(0).max(3).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const GetInvoiceSchema = z.object({
  id: z.string().min(1),
});

const StartDunningSchema = z.object({
  invoiceId: z.string().min(1),
  ruleId: z.string().optional(),
});

const CreateCampaignSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  configuration: z.object({
    ruleId: z.string().min(1),
    targetInvoices: z.array(z.string()).min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    batchSize: z.coerce.number().int().positive().max(100).default(10),
    maxConcurrency: z.coerce.number().int().positive().max(10).default(5),
    respectQuietHours: z.boolean().default(true),
    quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }),
  createdBy: z.string().min(1),
});

const ExecuteCampaignSchema = z.object({
  campaignId: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Invoice Management
dunning3ToquesRouter.get('/invoices', async (req, res) => {
  try {
    const filters = GetInvoicesSchema.parse(req.query);
    const invoices = await dunning3ToquesService.getInvoices(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        invoices,
        total: invoices.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting invoices', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

dunning3ToquesRouter.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = GetInvoiceSchema.parse(req.params);
    const invoice = await dunning3ToquesService.getInvoice(id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    res.json({
      success: true,
      data: invoice,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting invoice', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Dunning Management
dunning3ToquesRouter.post('/dunning/start', async (req, res) => {
  try {
    const { invoiceId, ruleId } = StartDunningSchema.parse(req.body);
    const attempt = await dunning3ToquesService.startDunningProcess(invoiceId, ruleId);
    
    res.status(201).json({
      success: true,
      data: attempt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error starting dunning process', { error });
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to start dunning process',
      details: error.errors
    });
  }
});

// Campaign Management
dunning3ToquesRouter.post('/campaigns', async (req, res) => {
  try {
    const campaignData = CreateCampaignSchema.parse(req.body);
    const campaign = await dunning3ToquesService.createDunningCampaign(campaignData);
    
    res.status(201).json({
      success: true,
      data: campaign,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating dunning campaign', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

dunning3ToquesRouter.post('/campaigns/:campaignId/execute', async (req, res) => {
  try {
    const { campaignId } = ExecuteCampaignSchema.parse({ ...req.params, ...req.body });
    await dunning3ToquesService.executeDunningCampaign(campaignId);
    
    res.json({
      success: true,
      data: {
        campaignId,
        status: 'executed'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error executing dunning campaign', { error });
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to execute campaign',
      details: error.errors
    });
  }
});

// Statistics
dunning3ToquesRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await dunning3ToquesService.getDunningStats(organizationId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting dunning stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
dunning3ToquesRouter.get('/health', async (req, res) => {
  try {
    const stats = await dunning3ToquesService.getDunningStats('demo-org-1');
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        totalInvoices: stats.totalInvoices,
        overdueInvoices: stats.overdueInvoices,
        activeDunning: stats.activeDunning,
        totalOutstanding: stats.totalOutstanding,
        totalCollected: stats.totalCollected,
        collectionRate: stats.collectionRate,
        totalAttempts: stats.totalAttempts,
        successRate: stats.successRate,
        activeCampaigns: stats.activeCampaigns,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking dunning health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { dunning3ToquesRouter };
