import { EventEmitter } from 'events';
import { sseManager } from '../lib/sse-manager.js';
import { realTimeCollaborationSystem } from '../lib/real-time-collaboration.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { z } from 'zod';
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
export class CockpitBFFLiveService extends EventEmitter {
    eventHistory = new Map();
    metricsHistory = new Map();
    agentStatuses = new Map();
    activeConnections = new Map();
    updateInterval;
    constructor() {
        super();
        this.updateInterval = setInterval(() => {
            this.generateMockUpdates();
        }, 5000);
        this.initializeSampleData();
        structuredLogger.info('Cockpit BFF Live Service initialized', {
            service: 'cockpit-bff-live',
            features: ['sse', 'websocket', 'real-time-updates', 'metrics', 'agent-status']
        });
    }
    establishSSEConnection(orgId, userId, response, subscriptions = []) {
        const clientId = sseManager.addClient(orgId, userId, response, subscriptions);
        if (!this.activeConnections.has(orgId)) {
            this.activeConnections.set(orgId, new Set());
        }
        this.activeConnections.get(orgId).add(clientId);
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
    sendInitialCockpitState(orgId, clientId) {
        const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'];
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
    initializeWebSocketServer(server) {
        realTimeCollaborationSystem.initializeWebSocketServer(server);
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
    emitCockpitEvent(event) {
        if (!this.eventHistory.has(event.department)) {
            this.eventHistory.set(event.department, []);
        }
        const history = this.eventHistory.get(event.department);
        history.push(event);
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        this.broadcastSSEEvent(event);
        this.broadcastWebSocketEvent(event);
        this.emit('cockpit_event', event);
        structuredLogger.info('Cockpit event emitted', {
            eventId: event.id,
            type: event.type,
            department: event.department,
            priority: event.priority
        });
    }
    broadcastSSEEvent(event) {
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
    broadcastWebSocketEvent(event) {
        const rooms = realTimeCollaborationSystem.listRooms();
        const cockpitRoom = rooms.find(room => room.name === 'Cockpit Control Center');
        if (cockpitRoom) {
            this.emit('websocket_broadcast', {
                roomId: cockpitRoom.id,
                event: {
                    type: 'cockpit_event',
                    data: event
                }
            });
        }
    }
    updateMetrics(metrics) {
        if (!this.metricsHistory.has(metrics.department)) {
            this.metricsHistory.set(metrics.department, []);
        }
        const history = this.metricsHistory.get(metrics.department);
        history.push(metrics);
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }
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
    getLatestMetrics(department) {
        const history = this.metricsHistory.get(department);
        return history && history.length > 0 ? history[history.length - 1] : null;
    }
    getMetricsHistory(department, limit = 10) {
        const history = this.metricsHistory.get(department) || [];
        return history.slice(-limit);
    }
    updateAgentStatus(status) {
        this.agentStatuses.set(status.agentId, status);
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
    getAgentStatus(agentId) {
        return this.agentStatuses.get(agentId) || null;
    }
    getDepartmentAgentStatuses(department) {
        return Array.from(this.agentStatuses.values())
            .filter(status => status.department === department);
    }
    generateMockUpdates() {
        const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'];
        const randomDept = departments[Math.floor(Math.random() * departments.length)];
        const metrics = {
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
                    severity: 'warning',
                    timestamp: new Date()
                }] : []
        };
        this.updateMetrics(metrics);
        if (Math.random() > 0.7) {
            const agentId = `agent-${randomDept}-${Math.floor(Math.random() * 5) + 1}`;
            const status = {
                agentId,
                department: randomDept,
                status: ['running', 'paused', 'stopped', 'error'][Math.floor(Math.random() * 4)],
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
    initializeSampleData() {
        const departments = ['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo'];
        for (const department of departments) {
            const metrics = {
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
        for (const department of departments) {
            for (let i = 1; i <= 3; i++) {
                const agentId = `agent-${department}-${i}`;
                const status = {
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
    cleanup() {
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
export const cockpitBFFLiveService = new CockpitBFFLiveService();
//# sourceMappingURL=cockpit-bff-live.service.js.map