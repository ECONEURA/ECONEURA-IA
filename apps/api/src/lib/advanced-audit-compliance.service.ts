/**
 * PR-38: Advanced Audit & Compliance Monitoring Service
 */

import { structuredLogger } from './structured-logger.js';

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance: {
    gdpr: boolean;
    sox: boolean;
    pci: boolean;
    hipaa: boolean;
    iso27001: boolean;
  };
  riskScore: number;
  tags: string[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  framework: 'gdpr' | 'sox' | 'pci' | 'hipaa' | 'iso27001';
  conditions: {
    action?: string[];
    resource?: string[];
    severity?: string[];
    timeWindow?: number; // minutes
    threshold?: number;
  };
  actions: {
    alert: boolean;
    block: boolean;
    notify: string[];
    escalate: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  eventId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  filters: {
    actions?: string[];
    resources?: string[];
    severities?: string[];
    frameworks?: string[];
  };
  metrics: {
    totalEvents: number;
    violations: number;
    riskScore: number;
    complianceScore: number;
    topActions: Array<{ action: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    severityDistribution: Record<string, number>;
    frameworkCompliance: Record<string, number>;
  };
  generatedAt: string;
  generatedBy: string;
}

export class AdvancedAuditComplianceService {
  private auditEvents: Map<string, AuditEvent> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private violations: Map<string, ComplianceViolation> = new Map();
  private reports: Map<string, AuditReport> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeMockData();
  }

  private initializeDefaultRules(): void {
    const defaultRules: ComplianceRule[] = [
      {
        id: 'rule-001',
        name: 'GDPR Data Access Monitoring',
        description: 'Monitor access to personal data under GDPR',
        framework: 'gdpr',
        conditions: {
          resource: ['user_data', 'personal_data', 'customer_data'],
          severity: ['medium', 'high', 'critical'],
          timeWindow: 60,
          threshold: 10
        },
        actions: {
          alert: true,
          block: false,
          notify: ['dpo@company.com'],
          escalate: true
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rule-002',
        name: 'SOX Financial Data Access',
        description: 'Monitor access to financial data under SOX',
        framework: 'sox',
        conditions: {
          resource: ['financial_data', 'accounting_data', 'audit_trail'],
          severity: ['high', 'critical'],
          timeWindow: 30,
          threshold: 5
        },
        actions: {
          alert: true,
          block: true,
          notify: ['audit@company.com', 'cfo@company.com'],
          escalate: true
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'rule-003',
        name: 'PCI Card Data Protection',
        description: 'Monitor access to payment card data under PCI DSS',
        framework: 'pci',
        conditions: {
          resource: ['payment_data', 'card_data', 'transaction_data'],
          severity: ['high', 'critical'],
          timeWindow: 15,
          threshold: 3
        },
        actions: {
          alert: true,
          block: true,
          notify: ['security@company.com', 'compliance@company.com'],
          escalate: true
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const rule of defaultRules) {
      this.complianceRules.set(rule.id, rule);
    }

    structuredLogger.info('Default compliance rules initialized', {
      count: defaultRules.length,
      requestId: ''
    });
  }

  private initializeMockData(): void {
    // Generate mock audit events
    const mockEvents: AuditEvent[] = [
      {
        id: 'event-001',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'user-001',
        organizationId: 'org-001',
        action: 'read',
        resource: 'user_data',
        resourceId: 'user-123',
        details: { field: 'email', value: 'user@example.com' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        severity: 'medium',
        compliance: {
          gdpr: true,
          sox: false,
          pci: false,
          hipaa: false,
          iso27001: true
        },
        riskScore: 65,
        tags: ['data_access', 'gdpr']
      },
      {
        id: 'event-002',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        userId: 'user-002',
        organizationId: 'org-001',
        action: 'update',
        resource: 'financial_data',
        resourceId: 'invoice-456',
        details: { field: 'amount', oldValue: 1000, newValue: 1500 },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0...',
        severity: 'high',
        compliance: {
          gdpr: false,
          sox: true,
          pci: false,
          hipaa: false,
          iso27001: true
        },
        riskScore: 85,
        tags: ['financial_update', 'sox']
      }
    ];

    for (const event of mockEvents) {
      this.auditEvents.set(event.id, event);
    }

    structuredLogger.info('Mock audit data initialized', {
      eventCount: mockEvents.length,
      requestId: ''
    });
  }

  async logAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
    const event: AuditEvent = {
      ...eventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.auditEvents.set(event.id, event);

    // Check compliance rules
    await this.checkComplianceRules(event);

    structuredLogger.info('Audit event logged', {
      eventId: event.id,
      action: event.action,
      resource: event.resource,
      severity: event.severity,
      riskScore: event.riskScore,
      requestId: ''
    });

    return event;
  }

  private async checkComplianceRules(event: AuditEvent): Promise<void> {
    for (const rule of this.complianceRules.values()) {
      if (!rule.isActive) continue;

      const isViolation = this.evaluateRule(rule, event);
      if (isViolation) {
        await this.createViolation(rule, event);
      }
    }
  }

  private evaluateRule(rule: ComplianceRule, event: AuditEvent): boolean {
    const conditions = rule.conditions;

    // Check action condition
    if (conditions.action && !conditions.action.includes(event.action)) {
      return false;
    }

    // Check resource condition
    if (conditions.resource && !conditions.resource.includes(event.resource)) {
      return false;
    }

    // Check severity condition
    if (conditions.severity && !conditions.severity.includes(event.severity)) {
      return false;
    }

    // Check time window and threshold
    if (conditions.timeWindow && conditions.threshold) {
      const timeWindow = conditions.timeWindow * 60 * 1000; // Convert to milliseconds
      const cutoffTime = new Date(Date.now() - timeWindow);

      const recentEvents = Array.from(this.auditEvents.values())
        .filter(e =>
          e.organizationId === event.organizationId &&
          e.action === event.action &&
          new Date(e.timestamp) > cutoffTime
        );

      if (recentEvents.length < conditions.threshold) {
        return false;
      }
    }

    return true;
  }

  private async createViolation(rule: ComplianceRule, event: AuditEvent): Promise<ComplianceViolation> {
    const violation: ComplianceViolation = {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      eventId: event.id,
      timestamp: new Date().toISOString(),
      severity: event.severity,
      description: `Compliance violation: ${rule.name}`,
      details: {
        rule: rule.name,
        event: event.action,
        resource: event.resource,
        riskScore: event.riskScore
      },
      status: 'open'
    };

    this.violations.set(violation.id, violation);

    structuredLogger.warn('Compliance violation created', {
      violationId: violation.id,
      ruleId: rule.id,
      eventId: event.id,
      severity: violation.severity,
      requestId: ''
    });

    return violation;
  }

  async getAuditEvents(filters?: {
    organizationId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ events: AuditEvent[]; total: number }> {
    let events = Array.from(this.auditEvents.values());

    if (filters) {
      if (filters.organizationId) {
        events = events.filter(e => e.organizationId === filters.organizationId);
      }
      if (filters.userId) {
        events = events.filter(e => e.userId === filters.userId);
      }
      if (filters.action) {
        events = events.filter(e => e.action === filters.action);
      }
      if (filters.resource) {
        events = events.filter(e => e.resource === filters.resource);
      }
      if (filters.severity) {
        events = events.filter(e => e.severity === filters.severity);
      }
      if (filters.startDate) {
        events = events.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(e => e.timestamp <= filters.endDate!);
      }
    }

    const total = events.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    events = events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);

    return { events, total };
  }

  async getComplianceRules(): Promise<ComplianceRule[]> {
    return Array.from(this.complianceRules.values());
  }

  async createComplianceRule(ruleData: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceRule> {
    const rule: ComplianceRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.complianceRules.set(rule.id, rule);

    structuredLogger.info('Compliance rule created', {
      ruleId: rule.id,
      name: rule.name,
      framework: rule.framework,
      requestId: ''
    });

    return rule;
  }

  async getViolations(filters?: {
    organizationId?: string;
    status?: string;
    severity?: string;
    ruleId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ violations: ComplianceViolation[]; total: number }> {
    let violations = Array.from(this.violations.values());

    if (filters) {
      if (filters.status) {
        violations = violations.filter(v => v.status === filters.status);
      }
      if (filters.severity) {
        violations = violations.filter(v => v.severity === filters.severity);
      }
      if (filters.ruleId) {
        violations = violations.filter(v => v.ruleId === filters.ruleId);
      }
    }

    const total = violations.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    violations = violations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit);

    return { violations, total };
  }

  async updateViolationStatus(violationId: string, status: string, resolution?: string, assignedTo?: string): Promise<ComplianceViolation> {
    const violation = this.violations.get(violationId);
    if (!violation) {
      throw new Error('Violation not found');
    }

    violation.status = status as any;
    if (resolution) violation.resolution = resolution;
    if (assignedTo) violation.assignedTo = assignedTo;
    if (status === 'resolved') violation.resolvedAt = new Date().toISOString();

    this.violations.set(violationId, violation);

    structuredLogger.info('Violation status updated', {
      violationId,
      status,
      assignedTo,
      requestId: ''
    });

    return violation;
  }

  async generateAuditReport(reportData: {
    name: string;
    description: string;
    organizationId: string;
    period: { start: string; end: string };
    filters?: {
      actions?: string[];
      resources?: string[];
      severities?: string[];
      frameworks?: string[];
    };
    generatedBy: string;
  }): Promise<AuditReport> {
    const { events } = await this.getAuditEvents({
      organizationId: reportData.organizationId,
      startDate: reportData.period.start,
      endDate: reportData.period.end,
      limit: 10000 // Get all events for the period
    });

    const violations = Array.from(this.violations.values())
      .filter(v => {
        const event = this.auditEvents.get(v.eventId);
        return event && ;
               event.organizationId === reportData.organizationId &&
               event.timestamp >= reportData.period.start &&
               event.timestamp <= reportData.period.end;
      });

    // Calculate metrics
    const totalEvents = events.length;
    const totalViolations = violations.length;
    const riskScore = events.length > 0 ? events.reduce((sum, e) => sum + e.riskScore, 0) / events.length : 0;

    const complianceScore = this.calculateComplianceScore(events, violations);

    const topActions = this.getTopActions(events);
    const topResources = this.getTopResources(events);
    const severityDistribution = this.getSeverityDistribution(events);
    const frameworkCompliance = this.getFrameworkCompliance(events);

    const report: AuditReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: reportData.name,
      description: reportData.description,
      organizationId: reportData.organizationId,
      period: reportData.period,
      filters: reportData.filters || {},
      metrics: {
        totalEvents,
        violations: totalViolations,
        riskScore: Math.round(riskScore),
        complianceScore: Math.round(complianceScore),
        topActions,
        topResources,
        severityDistribution,
        frameworkCompliance
      },
      generatedAt: new Date().toISOString(),
      generatedBy: reportData.generatedBy
    };

    this.reports.set(report.id, report);

    structuredLogger.info('Audit report generated', {
      reportId: report.id,
      name: report.name,
      organizationId: report.organizationId,
      totalEvents,
      totalViolations,
      complianceScore: Math.round(complianceScore),
      requestId: ''
    });

    return report;
  }

  private calculateComplianceScore(events: AuditEvent[], violations: ComplianceViolation[]): number {
    if (events.length === 0) return 100;

    const violationRate = violations.length / events.length;
    const baseScore = 100 - (violationRate * 100);

    // Adjust for severity
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;

    const severityPenalty = (criticalViolations * 10) + (highViolations * 5);

    return Math.max(0, baseScore - severityPenalty);
  }

  private getTopActions(events: AuditEvent[]): Array<{ action: string; count: number }> {
    const actionCounts = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts);
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopResources(events: AuditEvent[]): Array<{ resource: string; count: number }> {
    const resourceCounts = events.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(resourceCounts);
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getSeverityDistribution(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getFrameworkCompliance(events: AuditEvent[]): Record<string, number> {
    const frameworks = ['gdpr', 'sox', 'pci', 'hipaa', 'iso27001'];
    const result: Record<string, number> = {};

    for (const framework of frameworks) {
      const relevantEvents = events.filter(e => e.compliance[framework as keyof typeof e.compliance]);
      const violations = relevantEvents.filter(e => e.riskScore > 70).length;
      result[framework] = relevantEvents.length > 0 ?
        Math.round(((relevantEvents.length - violations) / relevantEvents.length) * 100) : 100;
    }

    return result;
  }

  async getAuditReports(organizationId: string): Promise<AuditReport[]> {
    return Array.from(this.reports.values());
      .filter(r => r.organizationId === organizationId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  async getComplianceMetrics(organizationId: string): Promise<{
    totalEvents: number;
    totalViolations: number;
    openViolations: number;
    complianceScore: number;
    riskScore: number;
    frameworkCompliance: Record<string, number>;
    recentViolations: ComplianceViolation[];
  }> {
    const { events } = await this.getAuditEvents({ organizationId, limit: 10000 });
    const { violations } = await this.getViolations({ limit: 10000 });

    const relevantViolations = violations.filter(v => {
      const event = this.auditEvents.get(v.eventId);
      return event && event.organizationId === organizationId;
    });

    const openViolations = relevantViolations.filter(v => v.status === 'open').length;
    const complianceScore = this.calculateComplianceScore(events, relevantViolations);
    const riskScore = events.length > 0 ? events.reduce((sum, e) => sum + e.riskScore, 0) / events.length : 0;
    const frameworkCompliance = this.getFrameworkCompliance(events);

    const recentViolations = relevantViolations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalEvents: events.length,
      totalViolations: relevantViolations.length,
      openViolations,
      complianceScore: Math.round(complianceScore),
      riskScore: Math.round(riskScore),
      frameworkCompliance,
      recentViolations
    };
  }
}

export const advancedAuditComplianceService = new AdvancedAuditComplianceService();
