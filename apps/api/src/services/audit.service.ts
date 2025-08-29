import { logger } from '../lib/logger';
import { db } from '../lib/db';
import { audit_events } from '../../../db/src/schema';
import { eq, and, sql, desc, asc, count, sum, avg } from 'drizzle-orm';

export interface AuditEvent {
  id: string;
  org_id: string;
  user_id?: string;
  event_type: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance_tags: string[];
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  rule_type: 'data_access' | 'data_modification' | 'user_activity' | 'system_change';
  conditions: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ComplianceViolation {
  id: string;
  rule_id: string;
  rule_name: string;
  event_id: string;
  org_id: string;
  user_id?: string;
  violation_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: Date;
}

export interface AuditReport {
  period: string;
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
  top_users: Array<{
    user_id: string;
    event_count: number;
    last_activity: Date;
  }>;
  compliance_violations: number;
  data_access_events: number;
  system_changes: number;
  risk_score: number;
  recommendations: string[];
}

export class AuditService {
  private complianceRules: Map<string, ComplianceRule> = new Map();

  constructor() {
    this.initializeComplianceRules();
  }

  // Log audit event
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const [result] = await db
        .insert(audit_events)
        .values({
          org_id: event.org_id,
          user_id: event.user_id,
          event_type: event.event_type,
          resource_type: event.resource_type,
          resource_id: event.resource_id,
          action: event.action,
          details: event.details,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          severity: event.severity,
          compliance_tags: event.compliance_tags
        })
        .returning({ id: audit_events.id });

      const eventId = result.id;

      // Check for compliance violations
      await this.checkComplianceViolations(eventId, event);

      logger.info(`Audit event logged: ${eventId} - ${event.event_type} - ${event.action}`);
      return eventId;
    } catch (error) {
      logger.error('Error logging audit event:', error);
      throw error;
    }
  }

  // Log data access event
  async logDataAccess(
    orgId: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: userId,
      event_type: 'data_access',
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      severity: this.determineDataAccessSeverity(action, details),
      compliance_tags: ['data_access', 'privacy', 'gdpr']
    });
  }

  // Log data modification event
  async logDataModification(
    orgId: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: userId,
      event_type: 'data_modification',
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      details: {
        old_data: oldData,
        new_data: newData,
        changes: this.calculateChanges(oldData, newData)
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      severity: this.determineModificationSeverity(action, oldData, newData),
      compliance_tags: ['data_modification', 'integrity', 'audit_trail']
    });
  }

  // Log system change event
  async logSystemChange(
    orgId: string,
    userId: string,
    changeType: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: userId,
      event_type: 'system_change',
      resource_type: 'system',
      action: changeType,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      severity: this.determineSystemChangeSeverity(changeType, details),
      compliance_tags: ['system_change', 'security', 'configuration']
    });
  }

  // Log security event
  async logSecurityEvent(
    orgId: string,
    eventType: string,
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      org_id: orgId,
      user_id: userId,
      event_type: 'security',
      resource_type: 'security',
      action: eventType,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      severity: this.determineSecuritySeverity(eventType, details),
      compliance_tags: ['security', 'incident', 'threat_detection']
    });
  }

  // Get audit events with filtering
  async getAuditEvents(
    orgId: string,
    filters: {
      event_type?: string;
      resource_type?: string;
      user_id?: string;
      severity?: string;
      start_date?: Date;
      end_date?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ events: AuditEvent[]; total: number }> {
    try {
      const conditions = [eq(audit_events.org_id, orgId)];

      if (filters.event_type) {
        conditions.push(eq(audit_events.event_type, filters.event_type));
      }
      if (filters.resource_type) {
        conditions.push(eq(audit_events.resource_type, filters.resource_type));
      }
      if (filters.user_id) {
        conditions.push(eq(audit_events.user_id, filters.user_id));
      }
      if (filters.severity) {
        conditions.push(eq(audit_events.severity, filters.severity));
      }
      if (filters.start_date) {
        conditions.push(sql`${audit_events.timestamp} >= ${filters.start_date}`);
      }
      if (filters.end_date) {
        conditions.push(sql`${audit_events.timestamp} <= ${filters.end_date}`);
      }

      const [events, totalCount] = await Promise.all([
        db
          .select()
          .from(audit_events)
          .where(and(...conditions))
          .orderBy(desc(audit_events.timestamp))
          .limit(filters.limit || 100)
          .offset(filters.offset || 0),
        db
          .select({ count: count() })
          .from(audit_events)
          .where(and(...conditions))
      ]);

      return {
        events: events.map(event => ({
          ...event,
          timestamp: event.timestamp,
          details: event.details as Record<string, any>
        })),
        total: totalCount[0].count
      };
    } catch (error) {
      logger.error('Error getting audit events:', error);
      throw error;
    }
  }

  // Generate audit report
  async generateAuditReport(
    orgId: string,
    period: string = '30d'
  ): Promise<AuditReport> {
    try {
      const startDate = this.calculateStartDate(period);
      const endDate = new Date();

      const [events, violations] = await Promise.all([
        this.getAuditEvents(orgId, { start_date: startDate, end_date: endDate, limit: 10000 }),
        this.getComplianceViolations(orgId, startDate, endDate)
      ]);

      const eventsByType = this.groupEventsByType(events.events);
      const eventsBySeverity = this.groupEventsBySeverity(events.events);
      const topUsers = this.getTopUsers(events.events);
      const riskScore = this.calculateRiskScore(events.events, violations);

      const report: AuditReport = {
        period,
        total_events: events.total,
        events_by_type: eventsByType,
        events_by_severity: eventsBySeverity,
        top_users: topUsers,
        compliance_violations: violations.length,
        data_access_events: eventsByType['data_access'] || 0,
        system_changes: eventsByType['system_change'] || 0,
        risk_score: riskScore,
        recommendations: this.generateAuditRecommendations(events.events, violations, riskScore)
      };

      logger.info(`Generated audit report for org ${orgId} with ${events.total} events`);
      return report;
    } catch (error) {
      logger.error('Error generating audit report:', error);
      throw error;
    }
  }

  // Compliance violation methods
  private async checkComplianceViolations(eventId: string, event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      for (const [ruleId, rule] of this.complianceRules) {
        if (!rule.enabled) continue;

        if (this.evaluateComplianceRule(rule, event)) {
          await this.createComplianceViolation(ruleId, eventId, event);
        }
      }
    } catch (error) {
      logger.error('Error checking compliance violations:', error);
    }
  }

  private evaluateComplianceRule(rule: ComplianceRule, event: Omit<AuditEvent, 'id' | 'timestamp'>): boolean {
    const conditions = rule.conditions;

    // Check event type
    if (conditions.event_type && conditions.event_type !== event.event_type) {
      return false;
    }

    // Check resource type
    if (conditions.resource_type && conditions.resource_type !== event.resource_type) {
      return false;
    }

    // Check action
    if (conditions.action && conditions.action !== event.action) {
      return false;
    }

    // Check severity
    if (conditions.min_severity && this.getSeverityLevel(event.severity) < this.getSeverityLevel(conditions.min_severity)) {
      return false;
    }

    // Check time-based conditions
    if (conditions.time_window) {
      const now = new Date();
      const eventTime = new Date();
      const timeDiff = now.getTime() - eventTime.getTime();
      if (timeDiff > conditions.time_window) {
        return false;
      }
    }

    // Check user-based conditions
    if (conditions.user_restrictions && event.user_id) {
      if (conditions.user_restrictions.includes(event.user_id)) {
        return true;
      }
    }

    return true;
  }

  private async createComplianceViolation(
    ruleId: string,
    eventId: string,
    event: Omit<AuditEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    const rule = this.complianceRules.get(ruleId);
    if (!rule) return;

    const violation: Omit<ComplianceViolation, 'id' | 'timestamp'> = {
      rule_id: ruleId,
      rule_name: rule.name,
      event_id: eventId,
      org_id: event.org_id,
      user_id: event.user_id,
      violation_type: rule.rule_type,
      description: `Compliance violation: ${rule.description}`,
      severity: rule.severity,
      resolved: false
    };

    // In a real implementation, this would be stored in a compliance_violations table
    logger.warn(`Compliance violation detected: ${violation.description}`, violation);
  }

  private async getComplianceViolations(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceViolation[]> {
    // Mock implementation - in real app, this would query the compliance_violations table
    return [];
  }

  // Helper methods
  private initializeComplianceRules(): void {
    const rules: ComplianceRule[] = [
      {
        id: 'rule_001',
        name: 'Sensitive Data Access',
        description: 'Monitor access to sensitive data',
        rule_type: 'data_access',
        conditions: {
          resource_type: 'products',
          min_severity: 'medium'
        },
        severity: 'high',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'rule_002',
        name: 'Bulk Data Export',
        description: 'Monitor bulk data export activities',
        rule_type: 'data_access',
        conditions: {
          action: 'export',
          min_severity: 'medium'
        },
        severity: 'medium',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'rule_003',
        name: 'System Configuration Changes',
        description: 'Monitor system configuration changes',
        rule_type: 'system_change',
        conditions: {
          event_type: 'system_change',
          min_severity: 'high'
        },
        severity: 'critical',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    rules.forEach(rule => {
      this.complianceRules.set(rule.id, rule);
    });
  }

  private determineDataAccessSeverity(action: string, details: Record<string, any>): 'low' | 'medium' | 'high' | 'critical' {
    if (action === 'export' || action === 'bulk_read') return 'high';
    if (action === 'read' && details.sensitive_data) return 'medium';
    return 'low';
  }

  private determineModificationSeverity(
    action: string,
    oldData: Record<string, any>,
    newData: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (action === 'delete') return 'critical';
    if (action === 'update' && this.hasSensitiveChanges(oldData, newData)) return 'high';
    if (action === 'create') return 'medium';
    return 'low';
  }

  private determineSystemChangeSeverity(changeType: string, details: Record<string, any>): 'low' | 'medium' | 'high' | 'critical' {
    if (changeType === 'security_config' || changeType === 'permissions') return 'critical';
    if (changeType === 'system_config') return 'high';
    if (changeType === 'feature_toggle') return 'medium';
    return 'low';
  }

  private determineSecuritySeverity(eventType: string, details: Record<string, any>): 'low' | 'medium' | 'high' | 'critical' {
    if (eventType === 'failed_login' || eventType === 'suspicious_activity') return 'high';
    if (eventType === 'password_change' || eventType === 'session_timeout') return 'medium';
    return 'low';
  }

  private calculateChanges(oldData: Record<string, any>, newData: Record<string, any>): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = { old: oldData[key], new: newData[key] };
      }
    }

    return changes;
  }

  private hasSensitiveChanges(oldData: Record<string, any>, newData: Record<string, any>): boolean {
    const sensitiveFields = ['price', 'cost', 'stock_quantity', 'supplier_id'];
    return sensitiveFields.some(field => oldData[field] !== newData[field]);
  }

  private getSeverityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity as keyof typeof levels] || 1;
  }

  private calculateStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private groupEventsByType(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupEventsBySeverity(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopUsers(events: AuditEvent[]): Array<{ user_id: string; event_count: number; last_activity: Date }> {
    const userStats = new Map<string, { count: number; lastActivity: Date }>();

    events.forEach(event => {
      if (event.user_id) {
        const stats = userStats.get(event.user_id) || { count: 0, lastActivity: new Date(0) };
        stats.count++;
        if (event.timestamp > stats.lastActivity) {
          stats.lastActivity = event.timestamp;
        }
        userStats.set(event.user_id, stats);
      }
    });

    return Array.from(userStats.entries())
      .map(([user_id, stats]) => ({
        user_id,
        event_count: stats.count,
        last_activity: stats.lastActivity
      }))
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, 10);
  }

  private calculateRiskScore(events: AuditEvent[], violations: ComplianceViolation[]): number {
    let score = 0;

    // Base score from events
    events.forEach(event => {
      score += this.getSeverityLevel(event.severity) * 10;
    });

    // Penalty for violations
    violations.forEach(violation => {
      score += this.getSeverityLevel(violation.severity) * 50;
    });

    // Normalize to 0-100 scale
    return Math.min(100, Math.max(0, score / 10));
  }

  private generateAuditRecommendations(
    events: AuditEvent[],
    violations: ComplianceViolation[],
    riskScore: number
  ): string[] {
    const recommendations = [];

    if (riskScore > 70) {
      recommendations.push('Implementar controles de seguridad adicionales');
    }

    if (violations.length > 0) {
      recommendations.push('Revisar y corregir violaciones de compliance');
    }

    const highSeverityEvents = events.filter(e => e.severity === 'high' || e.severity === 'critical');
    if (highSeverityEvents.length > 10) {
      recommendations.push('Investigar eventos de alta severidad');
    }

    const dataAccessEvents = events.filter(e => e.event_type === 'data_access');
    if (dataAccessEvents.length > 100) {
      recommendations.push('Revisar patrones de acceso a datos');
    }

    return recommendations;
  }
}

export const auditService = new AuditService();

