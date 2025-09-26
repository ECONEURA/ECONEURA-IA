import { structuredLogger } from './structured-logger.js';
import { apiCache } from './advanced-cache.js';

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  orgId: string;
  metadata: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  correlationId?: string;
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface AnalyticsDashboard {
  totalEvents: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topEntities: Array<{ entityType: string; count: number }>;
  eventsByHour: Array<{ hour: string; count: number }>;
  userActivity: Array<{ userId: string; events: number; lastActivity: string }>;
  conversionFunnel: Array<{ stage: string; users: number; conversion: number }>;
}

export interface BusinessIntelligence {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    bySource: Array<{ source: string; amount: number }>;
  };
  customers: {
    total: number;
    new: number;
    churn: number;
    lifetimeValue: number;
  };
  operations: {
    dealsClosed: number;
    avgDealSize: number;
    salesCycle: number;
    winRate: number;
  };
  performance: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    userSatisfaction: number;
  };
}

export class AdvancedAnalyticsService {
  private events: Map<string, AnalyticsEvent> = new Map();
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private dashboards: Map<string, AnalyticsDashboard> = new Map();

  constructor() {
    this.initializeDemoData();
    structuredLogger.info('Advanced Analytics Service initialized');
  }

  // Track analytics event
  async trackEvent(eventData: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<string> {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event: AnalyticsEvent = {
      ...eventData,
      id,
      timestamp: new Date().toISOString()
    };

    this.events.set(id, event);
    
    // Cache for quick access
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

  // Record metric
  async recordMetric(metricData: Omit<AnalyticsMetric, 'timestamp'>): Promise<void> {
    const metric: AnalyticsMetric = {
      ...metricData,
      timestamp: new Date().toISOString()
    };

    this.metrics.set(metric.name, metric);
    
    // Cache for quick access
    apiCache.set(`analytics:metric:${metric.name}`, metric);
    
    structuredLogger.debug('Analytics metric recorded', {
      name: metric.name,
      value: metric.value,
      labels: metric.labels
    });
  }

  // Get analytics dashboard
  async getDashboard(orgId: string, timeRange: string = '24h'): Promise<AnalyticsDashboard> {
    const cacheKey = `analytics:dashboard:${orgId}:${timeRange}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      return cached as AnalyticsDashboard;
    }

    const events = Array.from(this.events.values()).filter(e => e.orgId === orgId);
    const now = new Date();
    const timeFilter = this.getTimeFilter(timeRange, now);
    const filteredEvents = events.filter(e => new Date(e.timestamp) >= timeFilter);

    const dashboard: AnalyticsDashboard = {
      totalEvents: filteredEvents.length,
      uniqueUsers: new Set(filteredEvents.map(e => e.userId)).size,
      topActions: this.getTopActions(filteredEvents),
      topEntities: this.getTopEntities(filteredEvents),
      eventsByHour: this.getEventsByHour(filteredEvents),
      userActivity: this.getUserActivity(filteredEvents),
      conversionFunnel: this.getConversionFunnel(filteredEvents)
    };

    // Cache for 5 minutes
    apiCache.set(cacheKey, dashboard);
    
    return dashboard;
  }

  // Get business intelligence
  async getBusinessIntelligence(orgId: string): Promise<BusinessIntelligence> {
    const cacheKey = `analytics:bi:${orgId}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      return cached as BusinessIntelligence;
    }

    const bi: BusinessIntelligence = {
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

    // Cache for 10 minutes
    apiCache.set(cacheKey, bi);
    
    return bi;
  }

  // Get event analytics
  async getEventAnalytics(orgId: string, filters: {
    eventType?: string;
    action?: string;
    entityType?: string;
    userId?: string;
    timeRange?: string;
  } = {}): Promise<AnalyticsEvent[]> {
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

  // Export analytics data
  async exportAnalytics(orgId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
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

  // Private helper methods
  private getTimeFilter(timeRange: string, now: Date): Date {
    const ranges: Record<string, number> = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const ms = ranges[timeRange] || ranges['24h'];
    return new Date(now.getTime() - ms);
  }

  private getTopActions(events: AnalyticsEvent[]): Array<{ action: string; count: number }> {
    const actionCounts = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopEntities(events: AnalyticsEvent[]): Array<{ entityType: string; count: number }> {
    const entityCounts = events.reduce((acc, event) => {
      acc[event.entityType] = (acc[event.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(entityCounts)
      .map(([entityType, count]) => ({ entityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getEventsByHour(events: AnalyticsEvent[]): Array<{ hour: string; count: number }> {
    const hourCounts = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours().toString().padStart(2, '0') + ':00';
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  private getUserActivity(events: AnalyticsEvent[]): Array<{ userId: string; events: number; lastActivity: string }> {
    const userActivity = events.reduce((acc, event) => {
      if (!acc[event.userId]) {
        acc[event.userId] = { events: 0, lastActivity: event.timestamp };
      }
      acc[event.userId].events++;
      if (new Date(event.timestamp) > new Date(acc[event.userId].lastActivity)) {
        acc[event.userId].lastActivity = event.timestamp;
      }
      return acc;
    }, {} as Record<string, { events: number; lastActivity: string }>);
    
    return Object.entries(userActivity)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 20);
  }

  private getConversionFunnel(events: AnalyticsEvent[]): Array<{ stage: string; users: number; conversion: number }> {
    const stages = ['view', 'interest', 'consideration', 'purchase'];
    const stageUsers = stages.map(stage => {
      const users = new Set(events.filter(e => e.action === stage).map(e => e.userId)).size;
      return { stage, users, conversion: 0 };
    });
    
    // Calculate conversion rates
    for (let i = 1; i < stageUsers.length; i++) {
      const prevUsers = stageUsers[i - 1].users;
      const currentUsers = stageUsers[i].users;
      stageUsers[i].conversion = prevUsers > 0 ? (currentUsers / prevUsers) * 100 : 0;
    }
    
    return stageUsers;
  }

  private initializeDemoData(): void {
    // Initialize with demo analytics events
    const demoEvents: Omit<AnalyticsEvent, 'id' | 'timestamp'>[] = [
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

  // Get analytics stats
  getStats(): any {
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
