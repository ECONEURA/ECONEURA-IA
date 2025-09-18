import { Router } from 'express';
import { z } from 'zod';
import { graphChaosLightService } from '../lib/graph-chaos-light.service.js';
import { logger } from '../lib/logger.js';

const graphChaosLightRouter = Router();

// Validation schemas
const SimulateApiCallSchema = z.object({
  endpoint: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
});

const UpdateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  rotationIntervalMs: z.coerce.number().positive().optional(),
  failureRate: z.coerce.number().min(0).max(1).optional(),
  latencyMs: z.object({
    min: z.coerce.number().positive().optional(),
    max: z.coerce.number().positive().optional(),
  }).optional(),
  errorTypes: z.array(z.string()).optional(),
  simulationMode: z.boolean().optional(),
});

// Routes

// Get current tokens
graphChaosLightRouter.get('/tokens', async (req, res) => {
  try {
    const tokens = graphChaosLightService.getTokens();

    res.json({
      success: true,
      data: {
        tokens,
        total: tokens.length,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting Graph chaos tokens', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get chaos events
graphChaosLightRouter.get('/events', async (req, res) => {
  try {
    const events = graphChaosLightService.getChaosEvents();

    res.json({
      success: true,
      data: {
        events,
        total: events.length,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting Graph chaos events', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get chaos statistics
graphChaosLightRouter.get('/stats', async (req, res) => {
  try {
    const stats = graphChaosLightService.getChaosStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting Graph chaos stats', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simulate Graph API call
graphChaosLightRouter.post('/simulate', async (req, res) => {
  try {
    const validation = SimulateApiCallSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
      return;
    }

    const { endpoint, method } = validation.data;
    const result = await graphChaosLightService.simulateGraphApiCall(endpoint, method);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error simulating Graph API call', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update configuration
graphChaosLightRouter.put('/config', async (req, res) => {
  try {
    const validation = UpdateConfigSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
      return;
    }

    graphChaosLightService.updateConfig(validation.data);

    res.json({
      success: true,
      data: {
        message: 'Configuration updated successfully',
        config: validation.data,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating Graph chaos config', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset service
graphChaosLightRouter.post('/reset', async (req, res) => {
  try {
    graphChaosLightService.reset();

    res.json({
      success: true,
      data: {
        message: 'Graph chaos service reset successfully',
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error resetting Graph chaos service', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get service status
graphChaosLightRouter.get('/status', async (req, res) => {
  try {
    const tokens = graphChaosLightService.getTokens();
    const stats = graphChaosLightService.getChaosStats();

    res.json({
      success: true,
      data: {
        status: 'running',
        tokens: {
          count: tokens.length,
          active: tokens.filter(t => new Date(t.expiresAt) > new Date()).length,
        },
        chaos: {
          totalEvents: stats.totalEvents,
          failureRate: stats.failureRate,
          averageLatency: stats.averageLatency,
        },
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting Graph chaos status', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default graphChaosLightRouter;
