/**
 * Workers Integration Routes
 * 
 * API endpoints for communicating with Workers service
 */

import { Router } from 'express';
import { z } from 'zod';

import { workersIntegrationService } from '../lib/workers-integration.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Validation schemas
const emailProcessingSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  metadata: z.record(z.any()).optional()
});

const bulkEmailProcessingSchema = z.object({
  messageIds: z.array(z.string().min(1)).min(1, 'At least one message ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  metadata: z.record(z.any()).optional()
});

const cronJobSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  action: z.enum(['enable', 'disable', 'status']),
  organizationId: z.string().min(1, 'Organization ID is required')
});

/**
 * Process single email through workers
 */
router.post('/emails/process', async (req, res) => {
  try {
    const validatedData = emailProcessingSchema.parse(req.body);
    
    structuredLogger.info('API: Processing email through workers', {
      messageId: validatedData.messageId,
      organizationId: validatedData.organizationId,
      priority: validatedData.priority
    });

    const result = await workersIntegrationService.processEmail(validatedData);

    if (result.success) {
      res.json({
        success: true,
        data: {
          messageId: result.messageId,
          result: result.result,
          serviceId: result.serviceId,
          responseTime: result.responseTime
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    structuredLogger.error('API: Failed to process email through workers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * Process bulk emails through workers
 */
router.post('/emails/process/bulk', async (req, res) => {
  try {
    const validatedData = bulkEmailProcessingSchema.parse(req.body);
    
    structuredLogger.info('API: Processing bulk emails through workers', {
      count: validatedData.messageIds.length,
      organizationId: validatedData.organizationId,
      priority: validatedData.priority
    });

    const requests = validatedData.messageIds.map(messageId => ({
      messageId,
      organizationId: validatedData.organizationId,
      priority: validatedData.priority,
      metadata: validatedData.metadata
    }));

    const results = await workersIntegrationService.processBulkEmails(requests);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results.map(r => ({
          messageId: r.messageId,
          success: r.success,
          result: r.result,
          error: r.error,
          serviceId: r.serviceId,
          responseTime: r.responseTime
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('API: Failed to process bulk emails through workers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * Manage cron jobs
 */
router.post('/cron/manage', async (req, res) => {
  try {
    const validatedData = cronJobSchema.parse(req.body);
    
    structuredLogger.info('API: Managing cron job through workers', {
      jobId: validatedData.jobId,
      action: validatedData.action,
      organizationId: validatedData.organizationId
    });

    const result = await workersIntegrationService.manageCronJob(validatedData);

    if (result.success) {
      res.json({
        success: true,
        data: {
          jobId: result.jobId,
          action: validatedData.action,
          result: result.result,
          serviceId: result.serviceId,
          responseTime: result.responseTime
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        jobId: result.jobId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    structuredLogger.error('API: Failed to manage cron job through workers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      body: req.body
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

/**
 * Get workers health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await workersIntegrationService.getWorkersHealth();

    res.json({
      success: true,
      data: {
        healthy: health.healthy,
        services: health.services,
        stats: health.stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('API: Failed to get workers health', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get integration statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = workersIntegrationService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('API: Failed to get integration stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Webhook endpoint for receiving events from workers
 */
router.post('/webhooks/workers', async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const eventType = req.headers['x-webhook-event'] as string;
    const deliveryId = req.headers['x-webhook-delivery'] as string;

    if (!signature || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required webhook headers'
      });
    }

    // Verify webhook signature
    const payload = JSON.stringify(req.body);
    const secret = process.env.WEBHOOK_SECRET || 'default-secret';
    
    // In a real implementation, you'd verify the signature here
    // const isValid = webhookManager.verifySignature(payload, signature, secret);
    // if (!isValid) {
    //   return res.status(401).json({ success: false, error: 'Invalid signature' });
    // }

    structuredLogger.info('API: Received webhook from workers', {
      eventType,
      deliveryId,
      data: req.body
    });

    // Process the webhook event
    // In a real implementation, you'd handle the event here
    // For example, update database, send notifications, etc.

    res.json({
      success: true,
      message: 'Webhook received successfully',
      eventType,
      deliveryId
    });

  } catch (error) {
    structuredLogger.error('API: Failed to process webhook from workers', {
      error: error instanceof Error ? error.message : 'Unknown error',
      headers: req.headers,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
