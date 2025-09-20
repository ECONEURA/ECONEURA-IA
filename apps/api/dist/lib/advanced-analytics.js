import { structuredLogger } from './structured-logger.js';
import { apiCache } from './advanced-cache.js';
export class AdvancedAnalyticsService {
    events = new Map();
    metrics = new Map();
    dashboards = new Map();
    constructor() {
        this.initializeDemoData();
        structuredLogger.info('Advanced Analytics Service initialized');
    }
    async trackEvent(eventData) {
        const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const event = {
            ...eventData,
            id,
            timestamp: new Date().toISOString()
        };
        this.events.set(id, event);
        apiCache.set(`analytics:event:${id}`, event);
        structuredLogger.info('Analytics event tracked', {
            eventId: id,
            eventType: event.eventType,
            action: event.action,
            entityType: event.entityType,
            orgId: event.orgId
        });
        return id;
    }
    async recordMetric(metricData) {
        const metric = {
            ...metricData,
            timestamp: new Date().toISOString()
        };
        this.metrics.set(metric.name, metric);
        apiCache.set(`analytics:metric:${metric.name}`, metric);
        structuredLogger.debug('Analytics metric recorded', {
            name: metric.name,
            value: metric.value,
            labels: metric.labels
        });
    }
    async getDashboard(orgId, timeRange = '24h') {
        const cacheKey = `analytics:dashboard:${orgId}:${timeRange}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const events = Array.from(this.events.values()).filter(e => e.orgId === orgId);
        const now = new Date();
        const timeFilter = this.getTimeFilter(timeRange, now);
        const filteredEvents = events.filter(e => new Date(e.timestamp) >= timeFilter);
        const dashboard = {
            totalEvents: filteredEvents.length,
            uniqueUsers: new Set(filteredEvents.map(e => e.userId)).size,
            topActions: this.getTopActions(filteredEvents),
            topEntities: this.getTopEntities(filteredEvents),
            eventsByHour: this.getEventsByHour(filteredEvents),
            userActivity: this.getUserActivity(filteredEvents),
            conversionFunnel: this.getConversionFunnel(filteredEvents)
        };
        apiCache.set(cacheKey, dashboard);
        return dashboard;
    }
    async getBusinessIntelligence(orgId) {
        const cacheKey = `analytics:bi:${orgId}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const bi = {
            revenue: {
                total: 125000,
                monthly: 15000,
                growth: 12.5,
                bySource: [
                    { source: 'Direct Sales', amount: 80000 },
                    { source: 'Online', amount: 35000 },
                    { source: 'Partners', amount: 10000 }
                ]
            },
            customers: {
                total: 1250,
                new: 45,
                churn: 8,
                lifetimeValue: 2500
            },
            operations: {
                dealsClosed: 23,
                avgDealSize: 8500,
                salesCycle: 45,
                winRate: 68
            },
            performance: {
                responseTime: 245,
                uptime: 99.8,
                errorRate: 0.2,
                userSatisfaction: 4.6
            }
        };
        apiCache.set(cacheKey, bi);
        return bi;
    }
    async getEventAnalytics(orgId, filters = {}) {
        let events = Array.from(this.events.values()).filter(e => e.orgId === orgId);
        if (filters.eventType) {
            events = events.filter(e => e.eventType === filters.eventType);
        }
        if (filters.action) {
            events = events.filter(e => e.action === filters.action);
        }
        if (filters.entityType) {
            events = events.filter(e => e.entityType === filters.entityType);
        }
        if (filters.userId) {
            events = events.filter(e => e.userId === filters.userId);
        }
        if (filters.timeRange) {
            const timeFilter = this.getTimeFilter(filters.timeRange, new Date());
            events = events.filter(e => new Date(e.timestamp) >= timeFilter);
        }
        return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    async exportAnalytics(orgId, format = 'json') {
        const events = Array.from(this.events.values()).filter(e => e.orgId === orgId);
        if (format === 'csv') {
            const headers = ['id', 'eventType', 'action', 'entityType', 'entityId', 'userId', 'timestamp'];
            const rows = events.map(e => [
                e.id, e.eventType, e.action, e.entityType, e.entityId, e.userId, e.timestamp
            ]);
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }
        return JSON.stringify(events, null, 2);
    }
    getTimeFilter(timeRange, now) {
        const ranges = {
            '1h': 1 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        const ms = ranges[timeRange] || ranges['24h'];
        return new Date(now.getTime() - ms);
    }
    getTopActions(events) {
        const actionCounts = events.reduce((acc, event) => {
            acc[event.action] = (acc[event.action] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    getTopEntities(events) {
        const entityCounts = events.reduce((acc, event) => {
            acc[event.entityType] = (acc[event.entityType] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(entityCounts)
            .map(([entityType, count]) => ({ entityType, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    getEventsByHour(events) {
        const hourCounts = events.reduce((acc, event) => {
            const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0') + ':00';
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(hourCounts)
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour.localeCompare(b.hour));
    }
    getUserActivity(events) {
        const userActivity = events.reduce((acc, event) => {
            if (!acc[event.userId]) {
                acc[event.userId] = { events: 0, lastActivity: event.timestamp };
            }
            acc[event.userId].events++;
            if (new Date(event.timestamp) > new Date(acc[event.userId].lastActivity)) {
                acc[event.userId].lastActivity = event.timestamp;
            }
            return acc;
        }, {});
        return Object.entries(userActivity)
            .map(([userId, data]) => ({ userId, ...data }))
            .sort((a, b) => b.events - a.events)
            .slice(0, 20);
    }
    getConversionFunnel(events) {
        const stages = ['view', 'interest', 'consideration', 'purchase'];
        const stageUsers = stages.map(stage => {
            const users = new Set(events.filter(e => e.action === stage).map(e => e.userId)).size;
            return { stage, users, conversion: 0 };
        });
        for (let i = 1; i < stageUsers.length; i++) {
            const prevUsers = stageUsers[i - 1].users;
            const currentUsers = stageUsers[i].users;
            stageUsers[i].conversion = prevUsers > 0 ? (currentUsers / prevUsers) * 100 : 0;
        }
        return stageUsers;
    }
    initializeDemoData() {
        const demoEvents = [
            {
                eventType: 'user_action',
                action: 'login',
                entityType: 'user',
                entityId: 'user_123',
                userId: 'user_123',
                orgId: 'demo-org',
                metadata: { source: 'web' }
            },
            {
                eventType: 'business_action',
                action: 'create_deal',
                entityType: 'deal',
                entityId: 'deal_456',
                userId: 'user_123',
                orgId: 'demo-org',
                metadata: { amount: 5000, stage: 'prospect' }
            },
            {
                eventType: 'business_action',
                action: 'update_deal',
                entityType: 'deal',
                entityId: 'deal_456',
                userId: 'user_123',
                orgId: 'demo-org',
                metadata: { amount: 5000, stage: 'qualified' }
            }
        ];
        demoEvents.forEach(async (eventData) => {
            await this.trackEvent(eventData);
        });
        structuredLogger.info('Demo analytics data initialized', {
            eventsCount: demoEvents.length
        });
    }
    getStats() {
        const totalEvents = this.events.size;
        const totalMetrics = this.metrics.size;
        const orgs = new Set(Array.from(this.events.values()).map(e => e.orgId)).size;
        const users = new Set(Array.from(this.events.values()).map(e => e.userId)).size;
        return {
            totalEvents,
            totalMetrics,
            organizations: orgs,
            uniqueUsers: users,
            cacheHitRate: apiCache.getStats().hitRate,
            lastUpdated: new Date().toISOString()
        };
    }
}
export const advancedAnalytics = new AdvancedAnalyticsService();
//# sourceMappingURL=advanced-analytics.js.map