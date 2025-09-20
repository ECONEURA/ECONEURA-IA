import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { db } from '../lib/db.js';
import { eq, desc, gte, and } from 'drizzle-orm';
import { aiCostOptimization, aiCostPrediction, aiSecurityCompliance, aiPerformanceOptimization } from '../lib/schema.js';
const DashboardMetricsSchema = z.object({
    department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
    timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
    includePredictions: z.boolean().default(true),
    includeOptimizations: z.boolean().default(true),
    includeSecurity: z.boolean().default(true),
});
const RealTimeMetricsSchema = z.object({
    department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
    agentId: z.string().optional(),
});
const AgentStatusSchema = z.object({
    agentId: z.string(),
    department: z.enum(['ceo', 'ia', 'cso', 'cto', 'ciso', 'coo', 'chro', 'cgo', 'cfo', 'cdo']),
    status: z.enum(['active', 'paused', 'error', 'maintenance']),
    lastActivity: z.date(),
    metrics: z.object({
        tokens: z.number(),
        cost: z.number(),
        latency: z.number(),
        calls: z.number(),
    }),
});
export class AIDashboardConsolidationService {
    static instance;
    realTimeConnections = new Map();
    metricsCache = new Map();
    cacheTimeout = 30000;
    static getInstance() {
        if (!AIDashboardConsolidationService.instance) {
            AIDashboardConsolidationService.instance = new AIDashboardConsolidationService();
        }
        return AIDashboardConsolidationService.instance;
    }
    async getDashboardMetrics(input) {
        try {
            const validatedInput = DashboardMetricsSchema.parse(input);
            const cacheKey = `${validatedInput.department}-${validatedInput.timeframe}`;
            const cached = this.metricsCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheTimeout) {
                return cached;
            }
            logger.info('Generating consolidated dashboard metrics', {
                department: validatedInput.department,
                timeframe: validatedInput.timeframe,
            });
            const data = await this.generateConsolidatedData(validatedInput);
            this.metricsCache.set(cacheKey, data);
            return data;
        }
        catch (error) {
            logger.error('Error getting dashboard metrics', { error, input });
            throw new Error('Failed to get dashboard metrics');
        }
    }
    async getRealTimeMetrics(input) {
        try {
            const validatedInput = RealTimeMetricsSchema.parse(input);
            logger.info('Getting real-time metrics', {
                department: validatedInput.department,
                agentId: validatedInput.agentId,
            });
            return await this.generateRealTimeData(validatedInput);
        }
        catch (error) {
            logger.error('Error getting real-time metrics', { error, input });
            throw new Error('Failed to get real-time metrics');
        }
    }
    async updateAgentStatus(agentStatus) {
        try {
            logger.info('Updating agent status', {
                agentId: agentStatus.agentId,
                department: agentStatus.department,
                status: agentStatus.status,
            });
            this.notifyRealTimeConnections(agentStatus.department, {
                type: 'agent_status_update',
                data: agentStatus,
            });
        }
        catch (error) {
            logger.error('Error updating agent status', { error, agentStatus });
            throw new Error('Failed to update agent status');
        }
    }
    registerRealTimeConnection(department, ws) {
        if (!this.realTimeConnections.has(department)) {
            this.realTimeConnections.set(department, new Set());
        }
        this.realTimeConnections.get(department).add(ws);
        ws.on('close', () => {
            this.realTimeConnections.get(department)?.delete(ws);
        });
        logger.info('Registered real-time connection', { department });
    }
    async generateConsolidatedData(input) {
        const now = new Date();
        const timeframeMs = this.getTimeframeMs(input.timeframe);
        const since = new Date(now.getTime() - timeframeMs);
        const costMetrics = await this.getCostMetrics(input.department, since);
        const predictions = input.includePredictions ?
            await this.getPredictionMetrics(input.department) : undefined;
        const optimizations = input.includeOptimizations ?
            await this.getOptimizationMetrics(input.department) : undefined;
        const security = input.includeSecurity ?
            await this.getSecurityMetrics(input.department) : undefined;
        const performance = await this.getPerformanceMetrics(input.department);
        const timeline = await this.getTimelineEvents(input.department, since);
        const agents = await this.getAgentStatuses(input.department);
        return {
            department: input.department,
            timestamp: now,
            agents,
            kpis: {
                totalCost: costMetrics.totalCost,
                totalTokens: costMetrics.totalTokens,
                averageLatency: costMetrics.averageLatency,
                successRate: costMetrics.successRate,
                activeAgents: agents.filter(a => a.status === 'active').length,
                errorRate: costMetrics.errorRate,
            },
            predictions,
            optimizations,
            security,
            performance,
            timeline,
        };
    }
    async generateRealTimeData(input) {
        const now = new Date();
        const since = new Date(now.getTime() - 5 * 60 * 1000);
        const costMetrics = await this.getCostMetrics(input.department, since);
        const agents = await this.getAgentStatuses(input.department, input.agentId);
        const timeline = await this.getTimelineEvents(input.department, since);
        return {
            department: input.department,
            timestamp: now,
            agents,
            kpis: {
                totalCost: costMetrics.totalCost,
                totalTokens: costMetrics.totalTokens,
                averageLatency: costMetrics.averageLatency,
                successRate: costMetrics.successRate,
                activeAgents: agents.filter(a => a.status === 'active').length,
                errorRate: costMetrics.errorRate,
            },
            timeline,
        };
    }
    async getCostMetrics(department, since) {
        try {
            const costData = await db.select()
                .from(aiCostOptimization)
                .where(and(eq(aiCostOptimization.department, department), gte(aiCostOptimization.createdAt, since)))
                .orderBy(desc(aiCostOptimization.createdAt))
                .limit(100);
            const totalCost = costData.reduce((sum, record) => sum + (record.costSavings || 0), 0);
            const totalTokens = costData.reduce((sum, record) => sum + (record.tokensUsed || 0), 0);
            const averageLatency = costData.reduce((sum, record) => sum + (record.latencyMs || 0), 0) / costData.length || 0;
            const successRate = costData.filter(r => r.status === 'success').length / costData.length || 0;
            const errorRate = costData.filter(r => r.status === 'error').length / costData.length || 0;
            return {
                totalCost,
                totalTokens,
                averageLatency,
                successRate,
                errorRate,
            };
        }
        catch (error) {
            logger.error('Error getting cost metrics', { error, department });
            return {
                totalCost: 0,
                totalTokens: 0,
                averageLatency: 0,
                successRate: 0,
                errorRate: 0,
            };
        }
    }
    async getPredictionMetrics(department) {
        try {
            const predictionData = await db.select()
                .from(aiCostPrediction)
                .where(eq(aiCostPrediction.department, department))
                .orderBy(desc(aiCostPrediction.createdAt))
                .limit(1);
            if (predictionData.length === 0) {
                return undefined;
            }
            const latest = predictionData[0];
            return {
                costForecast: {
                    optimistic: latest.optimisticForecast || 0,
                    base: latest.baseForecast || 0,
                    pessimistic: latest.pessimisticForecast || 0,
                },
                usageForecast: {
                    tokens: latest.predictedTokens || 0,
                    calls: latest.predictedCalls || 0,
                },
                confidence: latest.confidenceScore || 0,
            };
        }
        catch (error) {
            logger.error('Error getting prediction metrics', { error, department });
            return undefined;
        }
    }
    async getOptimizationMetrics(department) {
        try {
            const optimizationData = await db.select()
                .from(aiCostOptimization)
                .where(eq(aiCostOptimization.department, department))
                .orderBy(desc(aiCostOptimization.createdAt))
                .limit(10);
            const activeRules = optimizationData.filter(r => r.status === 'active').length;
            const savings = optimizationData.reduce((sum, r) => sum + (r.costSavings || 0), 0);
            const recommendations = optimizationData
                .filter(r => r.recommendations)
                .map(r => r.recommendations)
                .slice(0, 5);
            return {
                activeRules,
                savings,
                recommendations: recommendations,
            };
        }
        catch (error) {
            logger.error('Error getting optimization metrics', { error, department });
            return undefined;
        }
    }
    async getSecurityMetrics(department) {
        try {
            const securityData = await db.select()
                .from(aiSecurityCompliance)
                .where(eq(aiSecurityCompliance.department, department))
                .orderBy(desc(aiSecurityCompliance.createdAt))
                .limit(1);
            if (securityData.length === 0) {
                return undefined;
            }
            const latest = securityData[0];
            return {
                complianceScore: latest.complianceScore || 0,
                activePolicies: latest.activePolicies || 0,
                incidents: latest.securityIncidents || 0,
                lastAudit: latest.lastAuditDate || new Date(),
            };
        }
        catch (error) {
            logger.error('Error getting security metrics', { error, department });
            return undefined;
        }
    }
    async getPerformanceMetrics(department) {
        try {
            const performanceData = await db.select()
                .from(aiPerformanceOptimization)
                .where(eq(aiPerformanceOptimization.department, department))
                .orderBy(desc(aiPerformanceOptimization.createdAt))
                .limit(1);
            if (performanceData.length === 0) {
                return undefined;
            }
            const latest = performanceData[0];
            return {
                optimizationScore: latest.optimizationScore || 0,
                activeOptimizations: latest.activeOptimizations || 0,
                performanceGains: latest.performanceGains || 0,
            };
        }
        catch (error) {
            logger.error('Error getting performance metrics', { error, department });
            return undefined;
        }
    }
    async getTimelineEvents(department, since) {
        const events = [
            {
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                type: 'success',
                message: `Agente NEURA-${department.toUpperCase()} completó tarea`,
                agentId: `NEURA-${department.toUpperCase()}`,
            },
            {
                timestamp: new Date(Date.now() - 10 * 60 * 1000),
                type: 'info',
                message: 'Optimización de costos aplicada',
            },
            {
                timestamp: new Date(Date.now() - 15 * 60 * 1000),
                type: 'warning',
                message: 'Límite de tokens alcanzado',
                agentId: `AGENTE-${department.toUpperCase()}-1`,
            },
        ];
        return events.filter(e => e.timestamp >= since);
    }
    async getAgentStatuses(department, agentId) {
        const agents = [
            {
                agentId: `NEURA-${department.toUpperCase()}`,
                department,
                status: 'active',
                lastActivity: new Date(Date.now() - 2 * 60 * 1000),
                metrics: {
                    tokens: Math.floor(Math.random() * 1000) + 100,
                    cost: Math.random() * 10 + 1,
                    latency: Math.floor(Math.random() * 500) + 100,
                    calls: Math.floor(Math.random() * 50) + 10,
                },
            },
            {
                agentId: `AGENTE-${department.toUpperCase()}-1`,
                department,
                status: 'active',
                lastActivity: new Date(Date.now() - 5 * 60 * 1000),
                metrics: {
                    tokens: Math.floor(Math.random() * 800) + 50,
                    cost: Math.random() * 8 + 0.5,
                    latency: Math.floor(Math.random() * 400) + 80,
                    calls: Math.floor(Math.random() * 30) + 5,
                },
            },
        ];
        if (agentId) {
            return agents.filter(a => a.agentId === agentId);
        }
        return agents;
    }
    getTimeframeMs(timeframe) {
        switch (timeframe) {
            case '1h': return 60 * 60 * 1000;
            case '24h': return 24 * 60 * 60 * 1000;
            case '7d': return 7 * 24 * 60 * 60 * 1000;
            case '30d': return 30 * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000;
        }
    }
    notifyRealTimeConnections(department, data) {
        const connections = this.realTimeConnections.get(department);
        if (connections) {
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(data));
                }
            });
        }
    }
}
export const aiDashboardConsolidationService = AIDashboardConsolidationService.getInstance();
//# sourceMappingURL=ai-dashboard-consolidation.service.js.map