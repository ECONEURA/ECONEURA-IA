/**
 * Cockpit BFF Live Routes
 * PR-98: Cockpit BFF Live (web+api) - SSE y WebSocket routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { cockpitBFFLiveService } from '../services/cockpit-bff-live.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// ============================================================================
// SCHEMAS
// ============================================================================

const DepartmentSchema = z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']);

const SSESubscriptionSchema = z.object({
  subscribe: z.string().optional(), // Comma-separated event types
});

const MetricsRequestSchema = z.object({
  department: DepartmentSchema,
  limit: z.number().min(1).max(100).default(10),
});

const AgentStatusRequestSchema = z.object({
  agentId: z.string().min(1),
});

const DepartmentAgentsRequestSchema = z.object({
  department: DepartmentSchema,
});

const EventHistoryRequestSchema = z.object({
  department: DepartmentSchema,
  limit: z.number().min(1).max(100).default(20),
  type: z.enum(['agent_status', 'metrics_update', 'system_alert', 'user_action', 'department_update']).optional(),
});

// ============================================================================
// SSE ENDPOINTS
// ============================================================================

/**
 * GET /v1/cockpit-bff-live/sse
 * Establish SSE connection for real-time cockpit updates
 */
router.get('/sse', (req: Request, res: Response) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const userId = Array.isArray(req.headers['x-user-id']) ? req.headers['x-user-id'][0] : req.headers['x-user-id'] as string || 'user-demo';
    const subscriptions = req.query.subscribe as string;
    
    // Parse subscriptions
    const eventTypes = subscriptions ? subscriptions.split(',').map(s => s.trim()) : [];
    
    // Establish SSE connection
    const clientId = cockpitBFFLiveService.establishSSEConnection(orgId, userId, res, eventTypes);
    
    // Add FinOps headers
    res.set({
      'X-Est-Cost-EUR': '0.001',
      'X-Budget-Pct': '0.2',
      'X-Latency-ms': '5',
      'X-Route': '/v1/cockpit-bff-live/sse',
      'X-Correlation-Id': clientId
    });

    structuredLogger.info('Cockpit SSE connection established', {
      clientId,
      orgId,
      userId,
      subscriptions: eventTypes
    });

  } catch (error) {
    structuredLogger.error('Failed to establish cockpit SSE connection', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: Array.isArray(req.headers['x-user-id']) ? req.headers['x-user-id'][0] : req.headers['x-user-id']
    });

    res.status(500).json({
      error: 'Failed to establish SSE connection',
      message: (error as Error).message
    });
  }
});

// ============================================================================
// METRICS ENDPOINTS
// ============================================================================

/**
 * GET /v1/cockpit-bff-live/metrics/:department
 * Get latest metrics for a department
 */
router.get('/metrics/:department', (req: Request, res: Response) => {
  try {
    const { department } = MetricsRequestSchema.parse({
      department: req.params.department,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    });

    const metrics = cockpitBFFLiveService.getLatestMetrics(department);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'METRICS_NOT_FOUND',
        message: `No metrics found for department: ${department}`
      });
    }

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Error getting cockpit metrics', error as Error, {
      department: req.params.department
    });

    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /v1/cockpit-bff-live/metrics/:department/history
 * Get metrics history for a department
 */
router.get('/metrics/:department/history', (req: Request, res: Response) => {
  try {
    const { department, limit } = MetricsRequestSchema.parse({
      department: req.params.department,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    });

    const history = cockpitBFFLiveService.getMetricsHistory(department, limit);

    res.json({
      success: true,
      data: {
        department,
        history,
        totalRecords: history.length,
        limit
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Error getting cockpit metrics history', error as Error, {
      department: req.params.department
    });

    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// AGENT STATUS ENDPOINTS
// ============================================================================

/**
 * GET /v1/cockpit-bff-live/agent/:agentId/status
 * Get status of a specific agent
 */
router.get('/agent/:agentId/status', (req: Request, res: Response) => {
  try {
    const { agentId } = AgentStatusRequestSchema.parse({
      agentId: req.params.agentId
    });

    const status = cockpitBFFLiveService.getAgentStatus(agentId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'AGENT_NOT_FOUND',
        message: `Agent not found: ${agentId}`
      });
    }

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Error getting agent status', error as Error, {
      agentId: req.params.agentId
    });

    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /v1/cockpit-bff-live/department/:department/agents
 * Get all agents for a department
 */
router.get('/department/:department/agents', (req: Request, res: Response) => {
  try {
    const { department } = DepartmentAgentsRequestSchema.parse({
      department: req.params.department
    });

    const agents = cockpitBFFLiveService.getDepartmentAgentStatuses(department);

    res.json({
      success: true,
      data: {
        department,
        agents,
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'running').length,
        errorAgents: agents.filter(a => a.status === 'error').length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Error getting department agents', error as Error, {
      department: req.params.department
    });

    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// EVENT ENDPOINTS
// ============================================================================

/**
 * GET /v1/cockpit-bff-live/events/:department/history
 * Get event history for a department
 */
router.get('/events/:department/history', (req: Request, res: Response) => {
  try {
    const { department, limit, type } = EventHistoryRequestSchema.parse({
      department: req.params.department,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      type: req.query.type as any
    });

    // This would be implemented in the service
    // For now, return mock data
    const mockEvents = [
      {
        id: `event-${department}-${Date.now()}`,
        type: 'metrics_update',
        department,
        data: { message: 'Metrics updated' },
        timestamp: new Date().toISOString(),
        priority: 'medium',
        source: 'metrics-collector'
      }
    ];

    res.json({
      success: true,
      data: {
        department,
        events: mockEvents,
        totalRecords: mockEvents.length,
        limit,
        type: type || 'all'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Error getting event history', error as Error, {
      department: req.params.department
    });

    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// WEBSOCKET ENDPOINTS
// ============================================================================

/**
 * GET /v1/cockpit-bff-live/websocket/info
 * Get WebSocket connection information
 */
router.get('/websocket/info', (req: Request, res: Response) => {
  try {
    const collaborationAnalytics = require('../lib/real-time-collaboration.js').realTimeCollaborationSystem.getCollaborationAnalytics();
    
    res.json({
      success: true,
      data: {
        websocketEnabled: true,
        collaborationAnalytics,
        connectionInfo: {
          protocol: 'ws',
          endpoint: '/ws',
          supportedEvents: [
            'join_room',
            'leave_room',
            'send_message',
            'document_change',
            'update_presence',
            'get_room_info',
            'get_participants',
            'get_messages',
            'get_document_changes'
          ]
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Error getting WebSocket info', error as Error);

    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// SYSTEM ENDPOINTS
// ============================================================================

/**
 * GET /v1/cockpit-bff-live/status
 * Get overall cockpit system status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'];
    const departmentStatuses = departments.map(dept => {
      const metrics = cockpitBFFLiveService.getLatestMetrics(dept);
      const agents = cockpitBFFLiveService.getDepartmentAgentStatuses(dept);
      
      return {
        department: dept,
        status: agents.some(a => a.status === 'error') ? 'error' : 
                agents.some(a => a.status === 'paused') ? 'warning' : 'healthy',
        activeAgents: agents.filter(a => a.status === 'running').length,
        totalAgents: agents.length,
        lastMetricsUpdate: metrics?.timestamp || null
      };
    });

    const overallStatus = departmentStatuses.every(d => d.status === 'healthy') ? 'healthy' :
                         departmentStatuses.some(d => d.status === 'error') ? 'error' : 'warning';

    res.json({
      success: true,
      data: {
        overallStatus,
        totalDepartments: departments.length,
        healthyDepartments: departmentStatuses.filter(d => d.status === 'healthy').length,
        warningDepartments: departmentStatuses.filter(d => d.status === 'warning').length,
        errorDepartments: departmentStatuses.filter(d => d.status === 'error').length,
        departments: departmentStatuses,
        features: {
          sse: true,
          websocket: true,
          realTimeUpdates: true,
          metrics: true,
          agentStatus: true
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    structuredLogger.error('Error getting cockpit status', error as Error);

    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /v1/cockpit-bff-live/health
 * Health check for cockpit BFF live service
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'cockpit-bff-live',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        features: {
          sse: true,
          websocket: true,
          realTimeUpdates: true,
          metrics: true,
          agentStatus: true,
          eventHistory: true
        }
      }
    });

  } catch (error) {
    structuredLogger.error('Error in cockpit health check', error as Error);

    res.status(500).json({
      success: false,
      error: 'HEALTH_CHECK_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
