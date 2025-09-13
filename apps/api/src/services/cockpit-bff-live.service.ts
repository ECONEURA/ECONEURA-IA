/**
 * Cockpit BFF Live Service
 * PR-98: Cockpit BFF Live (web+api) - SSE y WebSocket integration
 * 
 * Integrates SSE and WebSocket for real-time cockpit updates
 */

import { EventEmitter } from 'events';
import { sseManager } from '../lib/sse-manager.js';
import { realTimeCollaborationSystem } from '../lib/real-time-collaboration.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const CockpitEventSchema = z.object({
  id: z.string(),
  type: z.enum(['agent_status', 'metrics_update', 'system_alert', 'user_action', 'department_update']),
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  data: z.record(z.any()),
  timestamp: z.date(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  source: z.string(),
});

const CockpitMetricsSchema = z.object({
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  timestamp: z.date(),
  metrics: z.object({
    activeAgents: z.number(),
    totalCost: z.number(),
    totalTokens: z.number(),
    successRate: z.number(),
    responseTime: z.number(),
    errorRate: z.number(),
    uptime: z.number(),
  }),
  alerts: z.array(z.object({
    type: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'error', 'critical']),
    timestamp: z.date(),
  })).default([]),
});

const CockpitAgentStatusSchema = z.object({
  agentId: z.string(),
  department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
  status: z.enum(['running', 'paused', 'stopped', 'error', 'maintenance']),
  lastActivity: z.date(),
  metrics: z.object({
    requestsProcessed: z.number(),
    averageResponseTime: z.number(),
    errorCount: z.number(),
    cost: z.number(),
  }),
  health: z.object({
    cpu: z.number(),
    memory: z.number(),
    disk: z.number(),
    network: z.number(),
  }),
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface CockpitEvent {
  id: string;
  type: 'agent_status' | 'metrics_update' | 'system_alert' | 'user_action' | 'department_update';
  department: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

export interface CockpitMetrics {
  department: string;
  timestamp: Date;
  metrics: {
    activeAgents: number;
    totalCost: number;
    totalTokens: number;
    successRate: number;
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    timestamp: Date;
  }>;
}

export interface CockpitAgentStatus {
  agentId: string;
  department: string;
  status: 'running' | 'paused' | 'stopped' | 'error' | 'maintenance';
  lastActivity: Date;
  metrics: {
    requestsProcessed: number;
    averageResponseTime: number;
    errorCount: number;
    cost: number;
  };
  health: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

// ============================================================================
// COCKPIT BFF LIVE SERVICE
// ============================================================================

export class CockpitBFFLiveService extends EventEmitter {
  private eventHistory: Map<string, CockpitEvent[]> = new Map();
  private metricsHistory: Map<string, CockpitMetrics[]> = new Map();
  private agentStatuses: Map<string, CockpitAgentStatus> = new Map();
  private activeConnections: Map<string, Set<string>> = new Map(); // orgId -> Set<connectionId>
  private updateInterval: NodeJS.Timeout;

  constructor() {
    super();
    
    // Initialize update intervals
    this.updateInterval = setInterval(() => {
      this.generateMockUpdates();
    }, 5000); // Update every 5 seconds

    // Initialize sample data
    this.initializeSampleData();
    
    structuredLogger.info('Cockpit BFF Live Service initialized', {
      service: 'cockpit-bff-live',
      features: ['sse', 'websocket', 'real-time-updates', 'metrics', 'agent-status']
    });
  }

  // ============================================================================
  // SSE INTEGRATION
  // ============================================================================

  /**
   * Establish SSE connection for cockpit updates
   */
  establishSSEConnection(orgId: string, userId: string, response: any, subscriptions: string[] = []): string {
    const clientId = sseManager.addClient(orgId, userId, response, subscriptions);
    
    // Track active connections
    if (!this.activeConnections.has(orgId)) {
      this.activeConnections.set(orgId, new Set());
    }
    this.activeConnections.get(orgId)!.add(clientId);

    // Send initial cockpit state
    setTimeout(() => {
      this.sendInitialCockpitState(orgId, clientId);
    }, 100);

    structuredLogger.info('SSE connection established for cockpit', {
      clientId,
      orgId,
      userId,
      subscriptions
    });

    return clientId;
  }

  /**
   * Send initial cockpit state to new connection
   */
  private sendInitialCockpitState(orgId: string, clientId: string): void {
    const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'];
    
    // Send current metrics for all departments
    for (const department of departments) {
      const metrics = this.getLatestMetrics(department);
      if (metrics) {
        sseManager.sendToClient(clientId, {
          event: 'cockpit_metrics',
          data: {
            type: 'metrics_update',
            department,
            metrics,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Send agent statuses
    for (const [agentId, status] of this.agentStatuses) {
      sseManager.sendToClient(clientId, {
        event: 'agent_status',
        data: {
          type: 'agent_status',
          agentId,
          status,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Send system status
    sseManager.sendToClient(clientId, {
      event: 'system_status',
      data: {
        type: 'system_status',
        status: 'connected',
        timestamp: new Date().toISOString(),
        totalDepartments: departments.length,
        activeAgents: this.agentStatuses.size
      }
    });
  }

  // ============================================================================
  // WEBSOCKET INTEGRATION
  // ============================================================================

  /**
   * Initialize WebSocket server for cockpit
   */
  initializeWebSocketServer(server: any): void {
    realTimeCollaborationSystem.initializeWebSocketServer(server);
    
    // Create cockpit collaboration room
    const cockpitRoom = realTimeCollaborationSystem.createRoom({
      name: 'Cockpit Control Center',
      description: 'Real-time cockpit monitoring and control',
      type: 'workspace',
      ownerId: 'system',
      participants: [],
      settings: {
        maxParticipants: 100,
        allowAnonymous: false,
        requireApproval: false,
        enableChat: true,
        enableScreenShare: true,
        enableRecording: false,
      }
    });

    structuredLogger.info('WebSocket server initialized for cockpit', {
      roomId: cockpitRoom.id,
      roomName: cockpitRoom.name
    });
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  /**
   * Emit cockpit event to all connected clients
   */
  emitCockpitEvent(event: CockpitEvent): void {
    // Store in history
    if (!this.eventHistory.has(event.department)) {
      this.eventHistory.set(event.department, []);
    }
    const history = this.eventHistory.get(event.department)!;
    history.push(event);
    
    // Keep only last 100 events per department
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    // Broadcast via SSE
    this.broadcastSSEEvent(event);

    // Broadcast via WebSocket
    this.broadcastWebSocketEvent(event);

    // Emit to local listeners
    this.emit('cockpit_event', event);

    structuredLogger.info('Cockpit event emitted', {
      eventId: event.id,
      type: event.type,
      department: event.department,
      priority: event.priority
    });
  }

  /**
   * Broadcast event via SSE
   */
  private broadcastSSEEvent(event: CockpitEvent): void {
    for (const [orgId, connections] of this.activeConnections) {
      for (const clientId of connections) {
        sseManager.sendToClient(clientId, {
          event: 'cockpit_event',
          data: {
            type: event.type,
            department: event.department,
            data: event.data,
            timestamp: event.timestamp.toISOString(),
            priority: event.priority,
            source: event.source
          }
        });
      }
    }
  }

  /**
   * Broadcast event via WebSocket
   */
  private broadcastWebSocketEvent(event: CockpitEvent): void {
    // Send to cockpit collaboration room
    const rooms = realTimeCollaborationSystem.listRooms();
    const cockpitRoom = rooms.find(room => room.name === 'Cockpit Control Center');
    
    if (cockpitRoom) {
      // This would be implemented in the real-time collaboration system
      // For now, we'll emit a local event
      this.emit('websocket_broadcast', {
        roomId: cockpitRoom.id,
        event: {
          type: 'cockpit_event',
          data: event
        }
      });
    }
  }

  // ============================================================================
  // METRICS MANAGEMENT
  // ============================================================================

  /**
   * Update department metrics
   */
  updateMetrics(metrics: CockpitMetrics): void {
    // Store in history
    if (!this.metricsHistory.has(metrics.department)) {
      this.metricsHistory.set(metrics.department, []);
    }
    const history = this.metricsHistory.get(metrics.department)!;
    history.push(metrics);
    
    // Keep only last 50 metrics per department
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }

    // Emit metrics update event
    this.emitCockpitEvent({
      id: `metrics-${metrics.department}-${Date.now()}`,
      type: 'metrics_update',
      department: metrics.department,
      data: metrics,
      timestamp: new Date(),
      priority: 'medium',
      source: 'metrics-collector'
    });

    structuredLogger.debug('Metrics updated', {
      department: metrics.department,
      activeAgents: metrics.metrics.activeAgents,
      totalCost: metrics.metrics.totalCost
    });
  }

  /**
   * Get latest metrics for department
   */
  getLatestMetrics(department: string): CockpitMetrics | null {
    const history = this.metricsHistory.get(department);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Get metrics history for department
   */
  getMetricsHistory(department: string, limit: number = 10): CockpitMetrics[] {
    const history = this.metricsHistory.get(department) || [];
    return history.slice(-limit);
  }

  // ============================================================================
  // AGENT STATUS MANAGEMENT
  // ============================================================================

  /**
   * Update agent status
   */
  updateAgentStatus(status: CockpitAgentStatus): void {
    this.agentStatuses.set(status.agentId, status);

    // Emit agent status event
    this.emitCockpitEvent({
      id: `agent-${status.agentId}-${Date.now()}`,
      type: 'agent_status',
      department: status.department,
      data: status,
      timestamp: new Date(),
      priority: status.status === 'error' ? 'high' : 'medium',
      source: 'agent-monitor'
    });

    structuredLogger.debug('Agent status updated', {
      agentId: status.agentId,
      department: status.department,
      status: status.status
    });
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): CockpitAgentStatus | null {
    return this.agentStatuses.get(agentId) || null;
  }

  /**
   * Get all agent statuses for department
   */
  getDepartmentAgentStatuses(department: string): CockpitAgentStatus[] {
    return Array.from(this.agentStatuses.values())
      .filter(status => status.department === department);
  }

  // ============================================================================
  // MOCK DATA GENERATION
  // ============================================================================

  /**
   * Generate mock updates for demonstration
   */
  private generateMockUpdates(): void {
    const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'];
    
    // Update metrics for random department
    const randomDept = departments[Math.floor(Math.random() * departments.length)];
    const metrics: CockpitMetrics = {
      department: randomDept,
      timestamp: new Date(),
      metrics: {
        activeAgents: Math.floor(Math.random() * 10) + 1,
        totalCost: Math.random() * 100,
        totalTokens: Math.floor(Math.random() * 10000),
        successRate: Math.random() * 100,
        responseTime: Math.random() * 1000,
        errorRate: Math.random() * 5,
        uptime: Math.random() * 100,
      },
      alerts: Math.random() > 0.8 ? [{
        type: 'performance',
        message: 'High response time detected',
        severity: 'warning' as const,
        timestamp: new Date()
      }] : []
    };

    this.updateMetrics(metrics);

    // Update random agent status
    if (Math.random() > 0.7) {
      const agentId = `agent-${randomDept}-${Math.floor(Math.random() * 5) + 1}`;
      const status: CockpitAgentStatus = {
        agentId,
        department: randomDept,
        status: ['running', 'paused', 'stopped', 'error'][Math.floor(Math.random() * 4)] as any,
        lastActivity: new Date(),
        metrics: {
          requestsProcessed: Math.floor(Math.random() * 1000),
          averageResponseTime: Math.random() * 500,
          errorCount: Math.floor(Math.random() * 10),
          cost: Math.random() * 10,
        },
        health: {
          cpu: Math.random() * 100,
          memory: Math.random() * 100,
          disk: Math.random() * 100,
          network: Math.random() * 100,
        }
      };

      this.updateAgentStatus(status);
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize sample data
   */
  private initializeSampleData(): void {
    const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'];
    
    // Initialize metrics for all departments
    for (const department of departments) {
      const metrics: CockpitMetrics = {
        department,
        timestamp: new Date(),
        metrics: {
          activeAgents: Math.floor(Math.random() * 5) + 1,
          totalCost: Math.random() * 50,
          totalTokens: Math.floor(Math.random() * 5000),
          successRate: 85 + Math.random() * 15,
          responseTime: 100 + Math.random() * 400,
          errorRate: Math.random() * 2,
          uptime: 95 + Math.random() * 5,
        },
        alerts: []
      };
      
      this.updateMetrics(metrics);
    }

    // Initialize sample agents
    for (const department of departments) {
      for (let i = 1; i <= 3; i++) {
        const agentId = `agent-${department}-${i}`;
        const status: CockpitAgentStatus = {
          agentId,
          department,
          status: 'running',
          lastActivity: new Date(),
          metrics: {
            requestsProcessed: Math.floor(Math.random() * 500),
            averageResponseTime: Math.random() * 300,
            errorCount: Math.floor(Math.random() * 5),
            cost: Math.random() * 5,
          },
          health: {
            cpu: 20 + Math.random() * 60,
            memory: 30 + Math.random() * 50,
            disk: 10 + Math.random() * 30,
            network: 40 + Math.random() * 40,
          }
        };
        
        this.updateAgentStatus(status);
      }
    }

    structuredLogger.info('Sample data initialized for cockpit BFF live', {
      departments: departments.length,
      totalAgents: this.agentStatuses.size
    });
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.activeConnections.clear();
    this.eventHistory.clear();
    this.metricsHistory.clear();
    this.agentStatuses.clear();
    
    structuredLogger.info('Cockpit BFF Live Service cleaned up');
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const cockpitBFFLiveService = new CockpitBFFLiveService();
