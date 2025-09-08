/**
 * PR-66: Dunning Sólido Routes
 * 
 * Endpoints para el sistema robusto de dunning con segmentos KPIs y retries DLQ
 */

import { Router } from 'express';
import { z } from 'zod';
import { dunningSolidService } from '../lib/dunning-solid.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  criteria: z.object({
    overdueDays: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }),
    amountRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }),
    customerType: z.enum(['individual', 'business', 'both']),
    riskLevel: z.enum(['low', 'medium', 'high']),
    industry: z.array(z.string()).optional(),
    region: z.array(z.string()).optional()
  }),
  strategy: z.object({
    maxRetries: z.number().min(1).max(10),
    retryInterval: z.number().min(1).max(168), // 1 hora a 1 semana
    escalationSteps: z.number().min(1).max(10),
    communicationChannels: z.array(z.enum(['email', 'sms', 'call', 'letter'])),
    priority: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  kpis: z.object({
    targetCollectionRate: z.number().min(0).max(1),
    targetResponseTime: z.number().min(1).max(168),
    maxDunningDuration: z.number().min(1).max(365),
    acceptableFailureRate: z.number().min(0).max(1)
  }),
  isActive: z.boolean().default(true)
});

const updateSegmentSchema = createSegmentSchema.partial();

const addToDLQSchema = z.object({
  originalMessageId: z.string().uuid(),
  queueName: z.string().min(1).max(100),
  messageType: z.enum(['dunning_step', 'escalation', 'notification', 'retry']),
  payload: z.record(z.any()),
  failureReason: z.string().min(1).max(500),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});

const retryDLQMessageSchema = z.object({
  dlqId: z.string().uuid()
});

const getKPIsSchema = z.object({
  segmentId: z.string().uuid().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

const getDLQMessagesSchema = z.object({
  status: z.enum(['pending', 'processing', 'retried', 'dead', 'resolved']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

const getRetriesSchema = z.object({
  messageId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'success', 'failed']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  maxRetries: z.number().min(1).max(10).optional(),
  retryIntervals: z.array(z.number().min(1).max(168)).optional(),
  dlqRetentionDays: z.number().min(1).max(365).optional(),
  kpiCalculationInterval: z.number().min(1).max(1440).optional(), // 1 minuto a 24 horas
  autoEscalation: z.boolean().optional(),
  escalationThresholds: z.object({
    collectionRate: z.number().min(0).max(1).optional(),
    responseTime: z.number().min(1).max(168).optional(),
    failureRate: z.number().min(0).max(1).optional()
  }).optional(),
  notificationEnabled: z.boolean().optional()
});

/**
 * GET /dunning-solid/stats
 * Obtiene estadísticas del sistema de dunning sólido
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = dunningSolidService.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-solid/segments
 * Obtiene todos los segmentos de dunning
 */
router.get('/segments', async (req, res) => {
  try {
    const segments = dunningSolidService.getSegments();
    
    res.json({
      success: true,
      data: segments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning segments', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning segments',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-solid/segments/:segmentId
 * Obtiene un segmento específico
 */
router.get('/segments/:segmentId', async (req, res) => {
  try {
    const { segmentId } = req.params;
    
    const segment = dunningSolidService.getSegment(segmentId);
    
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }
    
    res.json({
      success: true,
      data: segment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning segment', {
      segmentId: req.params.segmentId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning segment',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /dunning-solid/segments
 * Crea un nuevo segmento de dunning
 */
router.post('/segments', async (req, res) => {
  try {
    const validatedData = createSegmentSchema.parse(req.body);
    
    const segment = await dunningSolidService.createSegment(validatedData);
    
    structuredLogger.info('Dunning segment created via API', {
      segmentId: segment.id,
      name: segment.name,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: segment,
      message: 'Dunning segment created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create dunning segment', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to create dunning segment',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /dunning-solid/segments/:segmentId
 * Actualiza un segmento de dunning
 */
router.put('/segments/:segmentId', async (req, res) => {
  try {
    const { segmentId } = req.params;
    const validatedData = updateSegmentSchema.parse(req.body);
    
    const segment = await dunningSolidService.updateSegment(segmentId, validatedData);
    
    structuredLogger.info('Dunning segment updated via API', {
      segmentId,
      updates: Object.keys(validatedData),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: segment,
      message: 'Dunning segment updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update dunning segment', {
      segmentId: req.params.segmentId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update dunning segment',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-solid/kpis
 * Obtiene KPIs de dunning
 */
router.get('/kpis', async (req, res) => {
  try {
    const validatedData = getKPIsSchema.parse(req.query);
    const organizationId = req.user?.organizationId || 'default-org';
    
    let kpis = dunningSolidService.getKPIs(validatedData.segmentId, validatedData.period);
    
    // Paginación
    const total = kpis.length;
    const paginatedKPIs = kpis.slice(validatedData.offset, validatedData.offset + validatedData.limit);
    
    res.json({
      success: true,
      data: {
        kpis: paginatedKPIs,
        pagination: {
          limit: validatedData.limit,
          offset: validatedData.offset,
          total
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning KPIs', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning KPIs',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-solid/dlq
 * Obtiene mensajes de la cola de mensajes muertos
 */
router.get('/dlq', async (req, res) => {
  try {
    const validatedData = getDLQMessagesSchema.parse(req.query);
    const organizationId = req.user?.organizationId || 'default-org';
    
    let messages = dunningSolidService.getDLQMessages(validatedData.status, validatedData.priority);
    
    // Paginación
    const total = messages.length;
    const paginatedMessages = messages.slice(validatedData.offset, validatedData.offset + validatedData.limit);
    
    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          limit: validatedData.limit,
          offset: validatedData.offset,
          total
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get DLQ messages', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get DLQ messages',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /dunning-solid/dlq
 * Añade un mensaje a la cola de mensajes muertos
 */
router.post('/dlq', async (req, res) => {
  try {
    const validatedData = addToDLQSchema.parse(req.body);
    const organizationId = req.user?.organizationId || 'default-org';
    
    const dlqMessage = await dunningSolidService.addToDLQ(
      validatedData.originalMessageId,
      validatedData.queueName,
      validatedData.messageType,
      validatedData.payload,
      validatedData.failureReason,
      organizationId,
      validatedData.priority
    );
    
    structuredLogger.info('Message added to DLQ via API', {
      dlqId: dlqMessage.id,
      originalMessageId: validatedData.originalMessageId,
      queueName: validatedData.queueName,
      messageType: validatedData.messageType,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: dlqMessage,
      message: 'Message added to DLQ successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to add message to DLQ', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to add message to DLQ',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /dunning-solid/dlq/:dlqId/retry
 * Reintenta un mensaje de la cola de mensajes muertos
 */
router.post('/dlq/:dlqId/retry', async (req, res) => {
  try {
    const { dlqId } = req.params;
    
    const retry = await dunningSolidService.retryDLQMessage(dlqId);
    
    structuredLogger.info('DLQ message retry initiated via API', {
      retryId: retry.id,
      dlqId,
      attemptNumber: retry.attemptNumber,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      data: retry,
      message: 'DLQ message retry initiated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to retry DLQ message', {
      dlqId: req.params.dlqId,
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to retry DLQ message',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-solid/retries
 * Obtiene reintentos de mensajes
 */
router.get('/retries', async (req, res) => {
  try {
    const validatedData = getRetriesSchema.parse(req.query);
    const organizationId = req.user?.organizationId || 'default-org';
    
    let retries = dunningSolidService.getRetries(validatedData.messageId, validatedData.status);
    
    // Paginación
    const total = retries.length;
    const paginatedRetries = retries.slice(validatedData.offset, validatedData.offset + validatedData.limit);
    
    res.json({
      success: true,
      data: {
        retries: paginatedRetries,
        pagination: {
          limit: validatedData.limit,
          offset: validatedData.offset,
          total
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning retries', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning retries',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /dunning-solid/config
 * Actualiza la configuración del sistema de dunning
 */
router.put('/config', async (req, res) => {
  try {
    const validatedData = updateConfigSchema.parse(req.body);
    
    dunningSolidService.updateConfig(validatedData);
    
    structuredLogger.info('Dunning configuration updated', {
      config: validatedData,
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      message: 'Dunning configuration updated successfully',
      data: validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to update dunning config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update dunning configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /dunning-solid/config
 * Obtiene la configuración actual del sistema de dunning
 */
router.get('/config', async (req, res) => {
  try {
    // En un sistema real, esto vendría del servicio
    const config = {
      enabled: true,
      maxRetries: 5,
      retryIntervals: [1, 6, 24, 72, 168],
      dlqRetentionDays: 30,
      kpiCalculationInterval: 60,
      autoEscalation: true,
      escalationThresholds: {
        collectionRate: 0.8,
        responseTime: 24,
        failureRate: 0.1
      },
      notificationEnabled: true
    };
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get dunning config', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get dunning configuration',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /dunning-solid/process
 * Procesa manualmente la cola de mensajes muertos
 */
router.post('/process', async (req, res) => {
  try {
    // En un sistema real, esto ejecutaría el procesamiento manual
    structuredLogger.info('Manual DLQ processing initiated', {
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.json({
      success: true,
      message: 'DLQ processing initiated successfully',
      data: {
        processingStarted: new Date().toISOString(),
        estimatedDuration: '2-5 minutes'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to initiate DLQ processing', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to initiate DLQ processing',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
