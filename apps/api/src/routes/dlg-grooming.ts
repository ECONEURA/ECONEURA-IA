import { Router } from 'express';
import { z } from 'zod';
import { dlgGroomingService } from '../lib/dlg-grooming.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const dlgGroomingRouter = Router();

// Validation schemas
const GetDLQMessagesSchema = z.object({
  organizationId: z.string().min(1),
  queueName: z.string().optional(),
  status: z.enum(['pending', 'analyzed', 'retried', 'skipped', 'escalated', 'resolved']).optional(),
  category: z.enum(['transient', 'permanent', 'configuration', 'data', 'system']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateDLQMessageSchema = z.object({
  organizationId: z.string().min(1),
  queueName: z.string().min(1),
  originalMessage: z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    payload: z.record(z.any()),
    headers: z.record(z.string()),
    timestamp: z.string().datetime(),
    retryCount: z.coerce.number().int().min(0),
    maxRetries: z.coerce.number().int().positive(),
  }),
  failureInfo: z.object({
    errorType: z.string().min(1),
    errorMessage: z.string().min(1),
    stackTrace: z.string().optional(),
    failureTimestamp: z.string().datetime(),
    retryAttempts: z.coerce.number().int().min(0),
    lastRetryAt: z.string().datetime().optional(),
  }),
  analysis: z.object({
    rootCause: z.string().optional(),
    category: z.enum(['transient', 'permanent', 'configuration', 'data', 'system']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    suggestedAction: z.enum(['retry', 'skip', 'manual_review', 'escalate']).optional(),
    confidence: z.coerce.number().min(0).max(100).optional(),
    patterns: z.array(z.string()).optional(),
    similarFailures: z.coerce.number().int().min(0).optional(),
  }).optional(),
  grooming: z.object({
    status: z.enum(['pending', 'analyzed', 'retried', 'skipped', 'escalated', 'resolved']).optional(),
    groomedBy: z.string().optional(),
    groomedAt: z.string().datetime().optional(),
    notes: z.string().optional(),
    autoRetryScheduled: z.string().datetime().optional(),
    manualReviewRequired: z.coerce.boolean().optional(),
  }).optional(),
  metrics: z.object({
    processingTime: z.coerce.number().positive().optional(),
    memoryUsage: z.coerce.number().positive().optional(),
    cpuUsage: z.coerce.number().positive().optional(),
    networkLatency: z.coerce.number().positive().optional(),
  }).optional(),
});

const GetPatternsSchema = z.object({
  organizationId: z.string().min(1),
  enabled: z.coerce.boolean().optional(),
  actionType: z.enum(['auto_retry', 'skip', 'escalate', 'manual_review']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreatePatternSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  pattern: z.object({
    errorType: z.string().min(1),
    errorMessage: z.string().optional(),
    queueName: z.string().optional(),
    messageType: z.string().optional(),
    conditions: z.array(z.object({
      field: z.string().min(1),
      operator: z.enum(['equals', 'contains', 'regex', 'starts_with', 'ends_with']),
      value: z.string().min(1),
    })).min(1),
  }),
  action: z.object({
    type: z.enum(['auto_retry', 'skip', 'escalate', 'manual_review']),
    config: z.object({
      maxRetries: z.coerce.number().int().positive().optional(),
      retryDelay: z.coerce.number().int().positive().optional(),
      escalationLevel: z.coerce.number().int().positive().optional(),
      notificationChannels: z.array(z.string()).optional(),
    }),
  }),
  statistics: z.object({
    matches: z.coerce.number().int().min(0).optional(),
    successRate: z.coerce.number().min(0).max(100).optional(),
    lastMatch: z.string().optional(),
    averageResolutionTime: z.coerce.number().int().min(0).optional(),
  }).optional(),
  enabled: z.coerce.boolean().default(true),
});

const GroomMessageSchema = z.object({
  status: z.enum(['retried', 'skipped', 'escalated', 'resolved']),
  notes: z.string().optional(),
  groomedBy: z.string().min(1),
});

const GenerateReportSchema = z.object({
  organizationId: z.string().min(1),
  reportType: z.enum(['daily', 'weekly', 'monthly', 'ad_hoc']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  generatedBy: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// DLQ Message Management
dlgGroomingRouter.get('/messages', async (req, res) => {
  try {
    const filters = GetDLQMessagesSchema.parse(req.query);
    const messages = await dlgGroomingService.getDLQMessages(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        messages,
        total: messages.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting DLQ messages', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

dlgGroomingRouter.get('/messages/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 1000 });
    const message = messages.find(m => m.id === id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting DLQ message', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

dlgGroomingRouter.post('/messages', async (req, res) => {
  try {
    const messageData = CreateDLQMessageSchema.parse(req.body);
    const message = await dlgGroomingService.createDLQMessage(messageData);

    res.status(201).json({
      success: true,
      data: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating DLQ message', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Pattern Management
dlgGroomingRouter.get('/patterns', async (req, res) => {
  try {
    const filters = GetPatternsSchema.parse(req.query);
    const patterns = await dlgGroomingService.getPatterns(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        patterns,
        total: patterns.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting DLQ patterns', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

dlgGroomingRouter.post('/patterns', async (req, res) => {
  try {
    const patternData = CreatePatternSchema.parse(req.body);
    const pattern = await dlgGroomingService.createPattern(patternData);

    res.status(201).json({
      success: true,
      data: pattern,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating DLQ pattern', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Message Analysis and Grooming
dlgGroomingRouter.post('/messages/:id/analyze', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const message = await dlgGroomingService.analyzeMessage(id);

    res.json({
      success: true,
      data: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error analyzing DLQ message', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

dlgGroomingRouter.post('/messages/:id/groom', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const action = GroomMessageSchema.parse(req.body);
    const message = await dlgGroomingService.groomMessage(id, action);

    res.json({
      success: true,
      data: message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error grooming DLQ message', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Auto-processing
dlgGroomingRouter.post('/process-pending', async (req, res) => {
  try {
    await dlgGroomingService.processPendingMessages();

    res.json({
      success: true,
      message: 'Pending messages processed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error processing pending messages', { error });
    res.status(500).json({
      success: false,
      error: 'Processing failed'
    });
  }
});

dlgGroomingRouter.post('/process-retries', async (req, res) => {
  try {
    await dlgGroomingService.processScheduledRetries();

    res.json({
      success: true,
      message: 'Scheduled retries processed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error processing scheduled retries', { error });
    res.status(500).json({
      success: false,
      error: 'Retry processing failed'
    });
  }
});

// Reports
dlgGroomingRouter.post('/reports', async (req, res) => {
  try {
    const reportData = GenerateReportSchema.parse(req.body);
    const report = await dlgGroomingService.generateReport(
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
    structuredLogger.error('Error generating DLQ report', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
dlgGroomingRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await dlgGroomingService.getStats(organizationId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting DLQ stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
dlgGroomingRouter.get('/health', async (req, res) => {
  try {
    const stats = await dlgGroomingService.getStats('demo-org-1');

    res.json({
      success: true,
      data: {
        status: 'ok',
        totalMessages: stats.totalMessages,
        totalPatterns: stats.totalPatterns,
        totalRetryJobs: stats.totalRetryJobs,
        last24Hours: stats.last24Hours,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking DLQ health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { dlgGroomingRouter };
