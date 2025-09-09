import { structuredLogger } from './structured-logger.js';

// Advanced Error Management Service - PR-73
// Sistema de gestión de errores avanzado con monitoreo de performance

interface ErrorEvent {
  id: string;
  organizationId: string;
  service: string;
  environment: 'development' | 'staging' | 'production';
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    userAgent?: string;
    ipAddress?: string;
    timestamp: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'application' | 'database' | 'network' | 'authentication' | 'authorization' | 'validation' | 'external' | 'system';
  impact: {
    affectedUsers: number;
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
    revenueImpact?: number;
    slaImpact?: boolean;
  };
  performance: {
    responseTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    databaseQueries?: number;
    cacheHitRate?: number;
  };
  resolution: {
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    assignedTo?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedResolution?: string;
    actualResolution?: string;
    resolutionNotes?: string;
  };
  metadata: {
    tags: string[];
    customFields: Record<string, any>;
    relatedErrors: string[];
    escalationLevel: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ErrorPattern {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  pattern: {
    errorType?: string;
    errorMessage?: string;
    service?: string;
    category?: string;
    conditions: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'regex' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
      value: string | number;
    }>;
  };
  action: {
    type: 'alert' | 'escalate' | 'auto_resolve' | 'create_ticket' | 'notify_team';
    config: {
      alertChannels?: string[];
      escalationLevel?: number;
      notificationTemplate?: string;
      autoResolveAfter?: number; // minutes
      ticketPriority?: string;
    };
  };
  statistics: {
    matches: number;
    falsePositives: number;
    accuracy: number;
    lastMatch: string;
    averageResolutionTime: number;
  };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PerformanceMetric {
  id: string;
  organizationId: string;
  service: string;
  metricType: 'response_time' | 'throughput' | 'error_rate' | 'availability' | 'resource_usage';
  value: number;
  unit: string;
  timestamp: string;
  dimensions: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    environment?: string;
    region?: string;
  };
  thresholds: {
    warning: number;
    critical: number;
  };
  status: 'normal' | 'warning' | 'critical';
  createdAt: string;
}

interface Alert {
  id: string;
  organizationId: string;
  type: 'error' | 'performance' | 'availability' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: {
    service: string;
    component?: string;
    endpoint?: string;
  };
  condition: {
    metric?: string;
    threshold?: number;
    operator?: string;
    duration?: number;
  };
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  assignedTo?: string;
  escalationLevel: number;
  notifications: {
    channels: string[];
    sent: boolean;
    sentAt?: string;
    acknowledged: boolean;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
  };
  metadata: {
    tags: string[];
    customFields: Record<string, any>;
    relatedAlerts: string[];
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface ErrorReport {
  id: string;
  organizationId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  period: {
    startDate: string;
    endDate: string;
  };
  data: {
    totalErrors: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byService: Record<string, number>;
    topErrors: Array<{
      errorType: string;
      count: number;
      percentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    resolutionStats: {
      averageResolutionTime: number;
      resolutionRate: number;
      escalationRate: number;
      autoResolutionRate: number;
    };
    performanceImpact: {
      averageResponseTime: number;
      availabilityPercentage: number;
      throughputImpact: number;
    };
    businessImpact: {
      affectedUsers: number;
      revenueImpact: number;
      slaBreaches: number;
    };
  };
  generatedBy: string;
  createdAt: string;
}

class AdvancedErrorManagementService {
  private errors: Map<string, ErrorEvent> = new Map();
  private patterns: Map<string, ErrorPattern> = new Map();
  private metrics: Map<string, PerformanceMetric> = new Map();
  private alerts: Map<string, Alert> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    this.generateTagsForDemoErrors();
    this.startErrorProcessing();
    this.startPerformanceMonitoring();
    this.startAlertProcessing();
    structuredLogger.info('Advanced Error Management Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Demo error events
    const error1: ErrorEvent = {
      id: 'error_1',
      organizationId: 'demo-org-1',
      service: 'api-gateway',
      environment: 'production',
      errorType: 'DatabaseConnectionError',
      errorMessage: 'Connection timeout to primary database',
      stackTrace: 'Error: Connection timeout\n    at DatabaseClient.connect()\n    at APIGateway.authenticate()',
      context: {
        userId: 'user_123',
        sessionId: 'session_456',
        requestId: 'req_789',
        endpoint: '/api/v1/users',
        method: 'GET',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '192.168.1.100',
        timestamp: oneHourAgo.toISOString()
      },
      severity: 'high',
      category: 'database',
      impact: {
        affectedUsers: 150,
        businessImpact: 'high',
        revenueImpact: 2500,
        slaImpact: true
      },
      performance: {
        responseTime: 5000,
        memoryUsage: 85.5,
        cpuUsage: 92.3,
        databaseQueries: 0,
        cacheHitRate: 0
      },
      resolution: {
        status: 'investigating',
        assignedTo: 'dev-team',
        priority: 'high',
        estimatedResolution: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
      },
      metadata: {
        tags: ['database', 'timeout', 'production'],
        customFields: {
          databaseHost: 'db-primary-01',
          connectionPool: 'exhausted'
        },
        relatedErrors: [],
        escalationLevel: 1
      },
      createdAt: oneHourAgo.toISOString(),
      updatedAt: oneHourAgo.toISOString()
    };

    const error2: ErrorEvent = {
      id: 'error_2',
      organizationId: 'demo-org-1',
      service: 'user-service',
      environment: 'production',
      errorType: 'ValidationError',
      errorMessage: 'Invalid email format provided',
      context: {
        userId: 'user_456',
        requestId: 'req_101',
        endpoint: '/api/v1/users/register',
        method: 'POST',
        timestamp: oneDayAgo.toISOString()
      },
      severity: 'medium',
      category: 'validation',
      impact: {
        affectedUsers: 1,
        businessImpact: 'low',
        revenueImpact: 0
      },
      performance: {
        responseTime: 150,
        memoryUsage: 45.2,
        cpuUsage: 12.8,
        databaseQueries: 1,
        cacheHitRate: 95.5
      },
      resolution: {
        status: 'resolved',
        assignedTo: 'support-team',
        priority: 'medium',
        actualResolution: new Date(oneDayAgo.getTime() + 30 * 60 * 1000).toISOString(),
        resolutionNotes: 'Fixed email validation regex pattern'
      },
      metadata: {
        tags: ['validation', 'email', 'user-registration'],
        customFields: {
          emailProvided: 'invalid-email@',
          validationRule: 'email_format'
        },
        relatedErrors: [],
        escalationLevel: 0
      },
      createdAt: oneDayAgo.toISOString(),
      updatedAt: new Date(oneDayAgo.getTime() + 30 * 60 * 1000).toISOString()
    };

    this.errors.set(error1.id, error1);
    this.errors.set(error2.id, error2);

    // Demo patterns
    const pattern1: ErrorPattern = {
      id: 'pattern_1',
      organizationId: 'demo-org-1',
      name: 'Database Connection Errors',
      description: 'Auto-escalate database connection issues',
      pattern: {
        errorType: 'DatabaseConnectionError',
        category: 'database',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'high' },
          { field: 'impact.businessImpact', operator: 'equals', value: 'high' }
        ]
      },
      action: {
        type: 'escalate',
        config: {
          escalationLevel: 2,
          alertChannels: ['slack', 'pagerduty'],
          notificationTemplate: 'database_critical'
        }
      },
      statistics: {
        matches: 12,
        falsePositives: 1,
        accuracy: 92,
        lastMatch: oneHourAgo.toISOString(),
        averageResolutionTime: 1800000 // 30 minutes
      },
      enabled: true,
      createdAt: oneDayAgo.toISOString(),
      updatedAt: oneHourAgo.toISOString()
    };

    this.patterns.set(pattern1.id, pattern1);

    // Demo performance metrics
    const metric1: PerformanceMetric = {
      id: 'metric_1',
      organizationId: 'demo-org-1',
      service: 'api-gateway',
      metricType: 'response_time',
      value: 250,
      unit: 'ms',
      timestamp: now.toISOString(),
      dimensions: {
        endpoint: '/api/v1/users',
        method: 'GET',
        statusCode: 200,
        environment: 'production'
      },
      thresholds: {
        warning: 500,
        critical: 1000
      },
      status: 'normal',
      createdAt: now.toISOString()
    };

    this.metrics.set(metric1.id, metric1);

    // Demo alerts
    const alert1: Alert = {
      id: 'alert_1',
      organizationId: 'demo-org-1',
      type: 'error',
      severity: 'high',
      title: 'Database Connection Timeout',
      description: 'Multiple database connection timeouts detected',
      source: {
        service: 'api-gateway',
        component: 'database-connection-pool'
      },
      condition: {
        metric: 'database_connection_errors',
        threshold: 5,
        operator: 'greater_than',
        duration: 300 // 5 minutes
      },
      status: 'active',
      escalationLevel: 1,
      notifications: {
        channels: ['slack', 'email'],
        sent: true,
        sentAt: oneHourAgo.toISOString(),
        acknowledged: false
      },
      metadata: {
        tags: ['database', 'critical', 'production'],
        customFields: {
          affectedServices: ['api-gateway', 'user-service'],
          estimatedImpact: 'high'
        },
        relatedAlerts: []
      },
      createdAt: oneHourAgo.toISOString(),
      updatedAt: oneHourAgo.toISOString()
    };

    this.alerts.set(alert1.id, alert1);
  }

  private generateTagsForDemoErrors() {
    // Generate tags for all demo errors
    for (const error of this.errors.values()) {
      error.metadata.tags = this.generateTags(error);
    }
  }

  private startErrorProcessing() {
    // Error processing runs every 30 seconds
    setInterval(() => {
      this.processNewErrors();
    }, 30 * 1000);
  }

  private startPerformanceMonitoring() {
    // Performance monitoring runs every minute
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60 * 1000);
  }

  private startAlertProcessing() {
    // Alert processing runs every 15 seconds
    setInterval(() => {
      this.processAlerts();
    }, 15 * 1000);
  }

  // Error Management
  async createError(errorData: Omit<ErrorEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ErrorEvent> {
    const now = new Date().toISOString();
    const newError: ErrorEvent = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...errorData,
      metadata: {
        tags: [],
        customFields: {},
        ...errorData.metadata
      },
      createdAt: now,
      updatedAt: now
    };

    this.errors.set(newError.id, newError);

    // Auto-analyze the error
    await this.analyzeError(newError.id);

    structuredLogger.info('Error event created', {
      errorId: newError.id,
      organizationId: newError.organizationId,
      service: newError.service,
      errorType: newError.errorType,
      severity: newError.severity
    });

    return newError;
  }

  async getErrors(organizationId: string, filters: {
    service?: string;
    severity?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<ErrorEvent[]> {
    let errors = Array.from(this.errors.values())
      .filter(e => e.organizationId === organizationId);

    if (filters.service) {
      errors = errors.filter(e => e.service === filters.service);
    }

    if (filters.severity) {
      errors = errors.filter(e => e.severity === filters.severity);
    }

    if (filters.category) {
      errors = errors.filter(e => e.category === filters.category);
    }

    if (filters.status) {
      errors = errors.filter(e => e.resolution.status === filters.status);
    }

    if (filters.startDate) {
      errors = errors.filter(e => e.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      errors = errors.filter(e => e.createdAt <= filters.endDate!);
    }

    if (filters.limit) {
      errors = errors.slice(0, filters.limit);
    }

    return errors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pattern Management
  async createPattern(patternData: Omit<ErrorPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<ErrorPattern> {
    const now = new Date().toISOString();
    const newPattern: ErrorPattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...patternData,
      enabled: patternData.enabled !== undefined ? patternData.enabled : true,
      statistics: {
        matches: 0,
        falsePositives: 0,
        accuracy: 0,
        lastMatch: '',
        averageResolutionTime: 0,
        ...patternData.statistics
      },
      createdAt: now,
      updatedAt: now
    };

    this.patterns.set(newPattern.id, newPattern);

    structuredLogger.info('Error pattern created', {
      patternId: newPattern.id,
      organizationId: newPattern.organizationId,
      name: newPattern.name,
      actionType: newPattern.action.type
    });

    return newPattern;
  }

  async getPatterns(organizationId: string, filters: {
    enabled?: boolean;
    actionType?: string;
    limit?: number;
  } = {}): Promise<ErrorPattern[]> {
    let patterns = Array.from(this.patterns.values())
      .filter(p => p.organizationId === organizationId);

    if (filters.enabled !== undefined) {
      patterns = patterns.filter(p => p.enabled === filters.enabled);
    }

    if (filters.actionType) {
      patterns = patterns.filter(p => p.action.type === filters.actionType);
    }

    if (filters.limit) {
      patterns = patterns.slice(0, filters.limit);
    }

    return patterns.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Performance Monitoring
  async createPerformanceMetric(metricData: Omit<PerformanceMetric, 'id' | 'createdAt'>): Promise<PerformanceMetric> {
    const now = new Date().toISOString();
    const newMetric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...metricData,
      createdAt: now
    };

    // Determine status based on thresholds
    if (newMetric.value >= newMetric.thresholds.critical) {
      newMetric.status = 'critical';
    } else if (newMetric.value >= newMetric.thresholds.warning) {
      newMetric.status = 'warning';
    } else {
      newMetric.status = 'normal';
    }

    this.metrics.set(newMetric.id, newMetric);

    structuredLogger.info('Performance metric created', {
      metricId: newMetric.id,
      organizationId: newMetric.organizationId,
      service: newMetric.service,
      metricType: newMetric.metricType,
      value: newMetric.value,
      status: newMetric.status
    });

    return newMetric;
  }

  async getPerformanceMetrics(organizationId: string, filters: {
    service?: string;
    metricType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<PerformanceMetric[]> {
    let metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId);

    if (filters.service) {
      metrics = metrics.filter(m => m.service === filters.service);
    }

    if (filters.metricType) {
      metrics = metrics.filter(m => m.metricType === filters.metricType);
    }

    if (filters.status) {
      metrics = metrics.filter(m => m.status === filters.status);
    }

    if (filters.startDate) {
      metrics = metrics.filter(m => m.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      metrics = metrics.filter(m => m.timestamp <= filters.endDate!);
    }

    if (filters.limit) {
      metrics = metrics.slice(0, filters.limit);
    }

    return metrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Alert Management
  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
    const now = new Date().toISOString();
    const newAlert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...alertData,
      notifications: {
        channels: alertData.notifications.channels,
        sent: false,
        acknowledged: false,
        ...alertData.notifications
      },
      createdAt: now,
      updatedAt: now
    };

    this.alerts.set(newAlert.id, newAlert);

    structuredLogger.info('Alert created', {
      alertId: newAlert.id,
      organizationId: newAlert.organizationId,
      type: newAlert.type,
      severity: newAlert.severity,
      title: newAlert.title
    });

    return newAlert;
  }

  async getAlerts(organizationId: string, filters: {
    type?: string;
    severity?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId);

    if (filters.type) {
      alerts = alerts.filter(a => a.type === filters.type);
    }

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }

    if (filters.startDate) {
      alerts = alerts.filter(a => a.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      alerts = alerts.filter(a => a.createdAt <= filters.endDate!);
    }

    if (filters.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Error Analysis
  async analyzeError(errorId: string): Promise<ErrorEvent> {
    const error = this.errors.get(errorId);
    if (!error) {
      throw new Error(`Error ${errorId} not found`);
    }

    // Find matching patterns
    const matchingPatterns = Array.from(this.patterns.values())
      .filter(p => p.organizationId === error.organizationId && p.enabled)
      .filter(p => this.matchesPattern(error, p));

    if (matchingPatterns.length > 0) {
      const bestPattern = matchingPatterns[0];

      // Update pattern statistics
      bestPattern.statistics.matches++;
      bestPattern.statistics.lastMatch = new Date().toISOString();
      this.patterns.set(bestPattern.id, bestPattern);

      // Execute pattern action
      await this.executePatternAction(error, bestPattern);
    }

    // Update error metadata
    error.metadata.tags = this.generateTags(error);
    error.updatedAt = new Date().toISOString();
    this.errors.set(errorId, error);

    structuredLogger.info('Error analyzed', {
      errorId,
      organizationId: error.organizationId,
      matchingPatterns: matchingPatterns.length,
      tags: error.metadata.tags
    });

    return error;
  }

  private matchesPattern(error: ErrorEvent, pattern: ErrorPattern): boolean {
    // Check error type
    if (pattern.pattern.errorType && error.errorType !== pattern.pattern.errorType) {
      return false;
    }

    // Check error message
    if (pattern.pattern.errorMessage && !error.errorMessage.includes(pattern.pattern.errorMessage)) {
      return false;
    }

    // Check service
    if (pattern.pattern.service && error.service !== pattern.pattern.service) {
      return false;
    }

    // Check category
    if (pattern.pattern.category && error.category !== pattern.pattern.category) {
      return false;
    }

    // Check conditions
    for (const condition of pattern.pattern.conditions) {
      if (!this.evaluateCondition(error, condition)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(error: ErrorEvent, condition: any): boolean {
    const fieldValue = this.getNestedValue(error, condition.field);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'contains':
        return String(fieldValue).includes(String(expectedValue));
      case 'regex':
        return new RegExp(String(expectedValue)).test(String(fieldValue));
      case 'starts_with':
        return String(fieldValue).startsWith(String(expectedValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(expectedValue));
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executePatternAction(error: ErrorEvent, pattern: ErrorPattern): Promise<void> {
    switch (pattern.action.type) {
      case 'alert':
        await this.createAlert({
          organizationId: error.organizationId,
          type: 'error',
          severity: error.severity,
          title: `Pattern Match: ${pattern.name}`,
          description: `Error matches pattern: ${error.errorMessage}`,
          source: {
            service: error.service
          },
          condition: {
            metric: 'error_pattern_match'
          },
          status: 'active',
          escalationLevel: pattern.action.config.escalationLevel || 1,
          notifications: {
            channels: pattern.action.config.alertChannels || ['slack']
          },
          metadata: {
            tags: ['pattern-match', pattern.name],
            customFields: {
              patternId: pattern.id,
              errorId: error.id
            },
            relatedAlerts: []
          }
        });
        break;

      case 'escalate':
        error.metadata.escalationLevel = pattern.action.config.escalationLevel || 2;
        error.resolution.priority = 'critical';
        break;

      case 'auto_resolve':
        if (pattern.action.config.autoResolveAfter) {
          setTimeout(() => {
            error.resolution.status = 'resolved';
            error.resolution.actualResolution = new Date().toISOString();
            error.resolution.resolutionNotes = 'Auto-resolved by pattern';
            error.updatedAt = new Date().toISOString();
            this.errors.set(error.id, error);
          }, pattern.action.config.autoResolveAfter * 60 * 1000);
        }
        break;

      case 'create_ticket':
        // Simulate ticket creation
        structuredLogger.info('Ticket created for error', {
          errorId: error.id,
          patternId: pattern.id,
          priority: pattern.action.config.ticketPriority || 'medium'
        });
        break;

      case 'notify_team':
        // Simulate team notification
        structuredLogger.info('Team notified for error', {
          errorId: error.id,
          patternId: pattern.id,
          template: pattern.action.config.notificationTemplate
        });
        break;
    }
  }

  private generateTags(error: ErrorEvent): string[] {
    const tags: string[] = [];

    tags.push(error.category);
    tags.push(error.severity);
    tags.push(error.service);
    tags.push(error.environment);

    if (error.errorType) {
      tags.push(error.errorType.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase());
    }

    if (error.context.endpoint) {
      tags.push(`endpoint:${error.context.endpoint}`);
    }

    if (error.impact.businessImpact === 'critical') {
      tags.push('business-critical');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  // Processing Methods
  async processNewErrors(): Promise<void> {
    const newErrors = Array.from(this.errors.values())
      .filter(e => e.resolution.status === 'open' &&
                  new Date(e.createdAt).getTime() > Date.now() - 5 * 60 * 1000); // Last 5 minutes

    for (const error of newErrors) {
      await this.analyzeError(error.id);
    }
  }

  async collectPerformanceMetrics(): Promise<void> {
    // Simulate collecting performance metrics
    const services = ['api-gateway', 'user-service', 'payment-service'];

    for (const service of services) {
      const responseTime = Math.random() * 1000; // 0-1000ms
      const errorRate = Math.random() * 5; // 0-5%

      await this.createPerformanceMetric({
        organizationId: 'demo-org-1',
        service,
        metricType: 'response_time',
        value: responseTime,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        dimensions: {
          environment: 'production'
        },
        thresholds: {
          warning: 500,
          critical: 1000
        }
      });

      await this.createPerformanceMetric({
        organizationId: 'demo-org-1',
        service,
        metricType: 'error_rate',
        value: errorRate,
        unit: '%',
        timestamp: new Date().toISOString(),
        dimensions: {
          environment: 'production'
        },
        thresholds: {
          warning: 2,
          critical: 5
        }
      });
    }
  }

  async processAlerts(): Promise<void> {
    const activeAlerts = Array.from(this.alerts.values())
      .filter(a => a.status === 'active' && !a.notifications.sent);

    for (const alert of activeAlerts) {
      // Simulate sending notifications
      alert.notifications.sent = true;
      alert.notifications.sentAt = new Date().toISOString();
      alert.updatedAt = new Date().toISOString();
      this.alerts.set(alert.id, alert);

      structuredLogger.info('Alert notification sent', {
        alertId: alert.id,
        channels: alert.notifications.channels,
        severity: alert.severity
      });
    }
  }

  // Reports
  async generateErrorReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<ErrorReport> {
    const errors = Array.from(this.errors.values())
      .filter(e => e.organizationId === organizationId &&
                  e.createdAt >= startDate &&
                  e.createdAt <= endDate);

    const byCategory = errors.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = errors.reduce((acc, e) => {
      acc[e.severity] = (acc[e.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byService = errors.reduce((acc, e) => {
      acc[e.service] = (acc[e.service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorCounts = errors.reduce((acc, e) => {
      acc[e.errorType] = (acc[e.errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .map(([errorType, count]) => ({
        errorType,
        count,
        percentage: (count / errors.length) * 100,
        trend: 'stable' as const
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const resolvedErrors = errors.filter(e => e.resolution.status === 'resolved');
    const escalatedErrors = errors.filter(e => e.metadata.escalationLevel > 0);

    const resolutionStats = {
      averageResolutionTime: this.calculateAverageResolutionTime(resolvedErrors),
      resolutionRate: errors.length > 0 ? (resolvedErrors.length / errors.length) * 100 : 0,
      escalationRate: errors.length > 0 ? (escalatedErrors.length / errors.length) * 100 : 0,
      autoResolutionRate: 0 // Would be calculated based on auto-resolved errors
    };

    const performanceImpact = {
      averageResponseTime: errors.reduce((sum, e) => sum + (e.performance.responseTime || 0), 0) / errors.length,
      availabilityPercentage: 99.5, // Would be calculated from metrics
      throughputImpact: 0.5 // Would be calculated from metrics
    };

    const businessImpact = {
      affectedUsers: errors.reduce((sum, e) => sum + e.impact.affectedUsers, 0),
      revenueImpact: errors.reduce((sum, e) => sum + (e.impact.revenueImpact || 0), 0),
      slaBreaches: errors.filter(e => e.impact.slaImpact).length
    };

    const report: ErrorReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      reportType: reportType as any,
      period: { startDate, endDate },
      data: {
        totalErrors: errors.length,
        byCategory,
        bySeverity,
        byService,
        topErrors,
        resolutionStats,
        performanceImpact,
        businessImpact
      },
      generatedBy,
      createdAt: new Date().toISOString()
    };

    structuredLogger.info('Error report generated', {
      reportId: report.id,
      organizationId,
      reportType,
      period: `${startDate} to ${endDate}`
    });

    return report;
  }

  private calculateAverageResolutionTime(errors: ErrorEvent[]): number {
    if (errors.length === 0) return 0;

    const totalTime = errors.reduce((sum, error) => {
      if (error.resolution.actualResolution) {
        const created = new Date(error.createdAt);
        const resolved = new Date(error.resolution.actualResolution);
        return sum + (resolved.getTime() - created.getTime());
      }
      return sum;
    }, 0);

    return totalTime / errors.length;
  }

  // Statistics
  async getStats(organizationId: string) {
    const errors = Array.from(this.errors.values()).filter(e => e.organizationId === organizationId);
    const patterns = Array.from(this.patterns.values()).filter(p => p.organizationId === organizationId);
    const metrics = Array.from(this.metrics.values()).filter(m => m.organizationId === organizationId);
    const alerts = Array.from(this.alerts.values()).filter(a => a.organizationId === organizationId);

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentErrors = errors.filter(e => new Date(e.createdAt) >= last24Hours);
    const recentAlerts = alerts.filter(a => new Date(a.createdAt) >= last24Hours);

    return {
      totalErrors: errors.length,
      totalPatterns: patterns.length,
      totalMetrics: metrics.length,
      totalAlerts: alerts.length,
      last24Hours: {
        newErrors: recentErrors.length,
        newAlerts: recentAlerts.length,
        resolvedErrors: recentErrors.filter(e => e.resolution.status === 'resolved').length,
        escalatedErrors: recentErrors.filter(e => e.metadata.escalationLevel > 0).length
      },
      last7Days: {
        newErrors: errors.filter(e => new Date(e.createdAt) >= last7Days).length,
        newAlerts: alerts.filter(a => new Date(a.createdAt) >= last7Days).length
      },
      byStatus: errors.reduce((acc, e) => {
        acc[e.resolution.status] = (acc[e.resolution.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: errors.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: errors.reduce((acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byService: errors.reduce((acc, e) => {
        acc[e.service] = (acc[e.service] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      alertStats: {
        active: alerts.filter(a => a.status === 'active').length,
        acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
        resolved: alerts.filter(a => a.status === 'resolved').length,
        suppressed: alerts.filter(a => a.status === 'suppressed').length
      },
      performanceStats: {
        normal: metrics.filter(m => m.status === 'normal').length,
        warning: metrics.filter(m => m.status === 'warning').length,
        critical: metrics.filter(m => m.status === 'critical').length
      }
    };
  }
}

export const advancedErrorManagementService = new AdvancedErrorManagementService();
