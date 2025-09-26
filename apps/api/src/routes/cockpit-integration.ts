import { Router } from 'express';
import { z } from 'zod';

import { logger } from '../lib/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limiter.js';
import { cockpitIntegrationService } from '../services/cockpit-integration.service.js';

const router = Router();

// Aplicar middleware de autenticación y rate limiting a todas las rutas
router.use(authenticateToken);
router.use(rateLimiter);

// Schemas de validación
const AgentActionSchema = z.object({
  agentId: z.string(),
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  action: z.enum(['run', 'pause', 'stop', 'status']),
  parameters: z.record(z.any()).optional(),
});

const MetricsRequestSchema = z.object({
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  includeDetails: z.boolean().default(false),
});

const ChatRequestSchema = z.object({
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  message: z.string().min(1).max(1000),
  context: z.object({
    agentId: z.string().optional(),
    previousMessages: z.array(z.string()).optional(),
    includeMetrics: z.boolean().default(true),
  }).optional(),
});

/**
 * POST /v1/cockpit-integration/agent-action
 * Ejecuta una acción en un agente del cockpit
 */
router.post('/agent-action', async (req, res) => {
  try {
    const validatedInput = AgentActionSchema.parse(req.body);

    logger.info('Executing cockpit agent action', {
      agentId: validatedInput.agentId,
      department: validatedInput.department,
      action: validatedInput.action,
      userId: req.user?.id,
    });

    const response = await cockpitIntegrationService.executeAgentAction(validatedInput);

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error executing cockpit agent action', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: 'Invalid request body',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /v1/cockpit-integration/metrics/:department
 * Obtiene métricas consolidadas para un departamento
 */
router.get('/metrics/:department', async (req, res) => {
  try {
    const department = req.params.department as any;
    
    if (!['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'].includes(department)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department',
      });
    }

    const validatedInput = MetricsRequestSchema.parse({
      department,
      timeframe: req.query.timeframe || '24h',
      includeDetails: req.query.includeDetails === 'true',
    });

    logger.info('Getting cockpit metrics', {
      department: validatedInput.department,
      timeframe: validatedInput.timeframe,
      includeDetails: validatedInput.includeDetails,
      userId: req.user?.id,
    });

    const metrics = await cockpitIntegrationService.getCockpitMetrics(validatedInput);

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting cockpit metrics', { error, department: req.params.department });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /v1/cockpit-integration/chat
 * Procesa un mensaje de chat del cockpit
 */
router.post('/chat', async (req, res) => {
  try {
    const validatedInput = ChatRequestSchema.parse(req.body);

    logger.info('Processing cockpit chat', {
      department: validatedInput.department,
      messageLength: validatedInput.message.length,
      hasContext: !!validatedInput.context,
      userId: req.user?.id,
    });

    const response = await cockpitIntegrationService.processCockpitChat(validatedInput);

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error processing cockpit chat', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: 'Invalid request body',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /v1/cockpit-integration/agent-status/:agentId
 * Obtiene el estado actual de un agente
 */
router.get('/agent-status/:agentId', async (req, res) => {
  try {
    const agentId = req.params.agentId;

    logger.info('Getting agent status', {
      agentId,
      userId: req.user?.id,
    });

    const status = await cockpitIntegrationService.getAgentStatus(agentId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting agent status', { error, agentId: req.params.agentId });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /v1/cockpit-integration/chat-history/:department
 * Obtiene el historial de chat de un departamento
 */
router.get('/chat-history/:department', async (req, res) => {
  try {
    const department = req.params.department as any;
    
    if (!['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'].includes(department)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department',
      });
    }

    const agentId = req.query.agentId as string;

    logger.info('Getting chat history', {
      department,
      agentId,
      userId: req.user?.id,
    });

    const history = await cockpitIntegrationService.getChatHistory(department, agentId);

    res.json({
      success: true,
      data: {
        department,
        agentId,
        history,
        totalMessages: history.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting chat history', { error, department: req.params.department });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /v1/cockpit-integration/departments
 * Obtiene información de todos los departamentos
 */
router.get('/departments', async (req, res) => {
  try {
    const departments = [
      { key: 'ceo', name: 'Ejecutivo (CEO)', color: '#5D7177' },
      { key: 'ia', name: 'Plataforma IA', color: '#7084B5' },
      { key: 'cso', name: 'Estrategia (CSO)', color: '#896D67' },
      { key: 'cto', name: 'Tecnología (CTO)', color: '#9194A4' },
      { key: 'ciso', name: 'Seguridad (CISO)', color: '#7E9099' },
      { key: 'coo', name: 'Operaciones (COO)', color: '#C7A98C' },
      { key: 'chro', name: 'RRHH (CHRO)', color: '#EED1B8' },
      { key: 'cgo', name: 'Marketing y Ventas (CGO)', color: '#B49495' },
      { key: 'cfo', name: 'Finanzas (CFO)', color: '#899796' },
      { key: 'cdo', name: 'Datos (CDO)', color: '#AAB7CA' },
    ];

    logger.info('Getting departments info', { userId: req.user?.id });

    res.json({
      success: true,
      data: {
        departments,
        totalDepartments: departments.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting departments info', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /v1/cockpit-integration/agents/:department
 * Obtiene agentes de un departamento
 */
router.get('/agents/:department', async (req, res) => {
  try {
    const department = req.params.department as any;
    
    if (!['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'].includes(department)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department',
      });
    }

    logger.info('Getting department agents', {
      department,
      userId: req.user?.id,
    });

    // Obtener métricas para el departamento
    const metrics = await cockpitIntegrationService.getCockpitMetrics({
      department,
      timeframe: '24h',
      includeDetails: false,
    });

    res.json({
      success: true,
      data: {
        department,
        agents: metrics.summary.activeAgents,
        totalCost: metrics.summary.totalCost,
        totalTokens: metrics.summary.totalTokens,
        successRate: metrics.summary.successRate,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting department agents', { error, department: req.params.department });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /v1/cockpit-integration/health
 * Health check del servicio
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      service: 'cockpit-integration',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        agentActions: true,
        metrics: true,
        chat: true,
        realTimeUpdates: true,
      },
    };

    logger.info('Health check requested', { userId: req.user?.id });

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Error in health check', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as cockpitIntegrationRoutes };
