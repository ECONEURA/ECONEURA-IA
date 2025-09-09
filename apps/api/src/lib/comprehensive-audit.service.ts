/**
 * Comprehensive Audit Service
 *
 * This service provides comprehensive auditing capabilities including complete
 * audit trail logging, compliance auditing, security auditing, and forensic
 * analysis capabilities.
 */

import {
  AuditLog,
  AuditReport,
  AuditFinding,
  AuditRecommendation,
  AuditTrail,
  AuditChange,
  CreateAuditLogRequest,
  AuditConfig
} from './security-types.js';

export class ComprehensiveAuditService {
  private config: AuditConfig;
  private auditLogs: Map<string, AuditLog> = new Map();
  private auditReports: Map<string, AuditReport> = new Map();
  private auditTrails: Map<string, AuditTrail[]> = new Map();

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = {
      comprehensiveLogging: true,
      realTimeAuditing: true,
      auditReporting: true,
      forensicAnalysis: true,
      dataRetention: 2555, // 7 years in days
      logRetention: 365, // 1 year in days
      encryption: true,
      integrity: true,
      ...config
    };
  }

  // ============================================================================
  // AUDIT LOG MANAGEMENT
  // ============================================================================

  async createAuditLog(request: CreateAuditLogRequest, organizationId: string, userId?: string): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      eventType: request.eventType,
      timestamp: new Date(),
      userId,
      organizationId,
      resource: request.resource,
      action: request.action,
      result: request.result,
      details: request.details,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      sessionId: request.sessionId,
      requestId: request.requestId,
      duration: request.duration,
      metadata: request.metadata,
      tags: request.tags,
      severity: this.determineSeverity(request),
      category: request.category,
      subcategory: request.subcategory,
      createdAt: new Date()
    };

    this.auditLogs.set(auditLog.id, auditLog);

    // Real-time auditing
    if (this.config.realTimeAuditing) {
      await this.processAuditLog(auditLog);
    }

    return auditLog;
  }

  async getAuditLog(logId: string): Promise<AuditLog | null> {
    return this.auditLogs.get(logId) || null;
  }

  async getAuditLogs(organizationId: string, filters?: {
    eventType?: string;
    userId?: string;
    resource?: string;
    action?: string;
    result?: string;
    severity?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values())
      .filter(l => l.organizationId === organizationId);

    if (filters) {
      if (filters.eventType) {
        logs = logs.filter(l => l.eventType === filters.eventType);
      }
      if (filters.userId) {
        logs = logs.filter(l => l.userId === filters.userId);
      }
      if (filters.resource) {
        logs = logs.filter(l => l.resource === filters.resource);
      }
      if (filters.action) {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.result) {
        logs = logs.filter(l => l.result === filters.result);
      }
      if (filters.severity) {
        logs = logs.filter(l => l.severity === filters.severity);
      }
      if (filters.category) {
        logs = logs.filter(l => l.category === filters.category);
      }
      if (filters.dateFrom) {
        logs = logs.filter(l => l.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        logs = logs.filter(l => l.timestamp <= filters.dateTo!);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private determineSeverity(request: CreateAuditLogRequest): AuditLog['severity'] {
    // Determine severity based on action and result
    if (request.result === 'denied' || request.result === 'failure') {
      return 'high';
    }

    if (request.action === 'delete' || request.action === 'export') {
      return 'medium';
    }

    if (request.action === 'create' || request.action === 'update') {
      return 'low';
    }

    return 'low';
  }

  private async processAuditLog(auditLog: AuditLog): Promise<void> {
    // Real-time audit processing
    await this.checkAuditPatterns(auditLog);
    await this.validateAuditIntegrity(auditLog);
    await this.updateAuditTrail(auditLog);
  }

  private async checkAuditPatterns(auditLog: AuditLog): Promise<void> {
    // Check for suspicious patterns
    const recentLogs = await this.getRecentLogs(auditLog.organizationId, auditLog.userId, 1);

    // Check for rapid successive actions
    if (recentLogs.length > 10) {
      await this.flagSuspiciousActivity(auditLog, 'Rapid successive actions detected');
    }

    // Check for unusual access patterns
    if (auditLog.action === 'read' && recentLogs.filter(l => l.action === 'read').length > 50) {
      await this.flagSuspiciousActivity(auditLog, 'Excessive read operations detected');
    }

    // Check for failed authentication attempts
    if (auditLog.eventType === 'authentication' && auditLog.result === 'failure') {
      const failedAttempts = recentLogs.filter(l =>
        l.eventType === 'authentication' && l.result === 'failure'
      ).length;

      if (failedAttempts > 5) {
        await this.flagSuspiciousActivity(auditLog, 'Multiple failed authentication attempts');
      }
    }
  }

  private async getRecentLogs(organizationId: string, userId?: string, hours: number = 1): Promise<AuditLog[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.auditLogs.values());
      .filter(l =>
        l.organizationId === organizationId &&
        l.timestamp >= cutoff &&
        (!userId || l.userId === userId)
      );
  }

  private async flagSuspiciousActivity(auditLog: AuditLog, reason: string): Promise<void> {
    console.log(`Suspicious activity flagged: ${reason} - Log ID: ${auditLog.id}`);

    // In a real implementation, this would:
    // 1. Create a security event
    // 2. Send alerts to security team
    // 3. Trigger additional monitoring
    // 4. Log to SIEM system
  }

  private async validateAuditIntegrity(auditLog: AuditLog): Promise<void> {
    if (this.config.integrity) {
      // Validate audit log integrity
      const hash = this.calculateHash(auditLog);
      auditLog.metadata.integrityHash = hash;
    }
  }

  private calculateHash(auditLog: AuditLog): string {
    // Simple hash calculation - in real implementation, use proper cryptographic hash
    const data = JSON.stringify({
      id: auditLog.id,
      timestamp: auditLog.timestamp,
      userId: auditLog.userId,
      action: auditLog.action,
      resource: auditLog.resource
    });

    return Buffer.from(data).toString('base64');
  }

  private async updateAuditTrail(auditLog: AuditLog): Promise<void> {
    const entityKey = `${auditLog.resource}_${auditLog.organizationId}`;
    const existingTrails = this.auditTrails.get(entityKey) || [];

    const trail: AuditTrail = {
      id: this.generateId(),
      entityType: this.extractEntityType(auditLog.resource),
      entityId: this.extractEntityId(auditLog.resource),
      action: this.mapToTrailAction(auditLog.action),
      userId: auditLog.userId,
      organizationId: auditLog.organizationId,
      timestamp: auditLog.timestamp,
      changes: this.extractChanges(auditLog),
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      sessionId: auditLog.sessionId,
      reason: auditLog.metadata.reason,
      metadata: auditLog.metadata
    };

    existingTrails.push(trail);
    this.auditTrails.set(entityKey, existingTrails);
  }

  private extractEntityType(resource: string): string {
    // Extract entity type from resource path
    const parts = resource.split('/');
    return parts[parts.length - 2] || 'unknown';
  }

  private extractEntityId(resource: string): string {
    // Extract entity ID from resource path
    const parts = resource.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  private mapToTrailAction(action: string): AuditTrail['action'] {
    switch (action.toLowerCase()) {
      case 'create': return 'create';
      case 'read': return 'read';
      case 'update': return 'update';
      case 'delete': return 'delete';
      case 'export': return 'export';
      case 'import': return 'import';
      default: return 'read';
    }
  }

  private extractChanges(auditLog: AuditLog): AuditChange[] {
    // Extract changes from audit log details
    const changes: AuditChange[] = [];

    if (auditLog.details.changes) {
      for (const [field, change] of Object.entries(auditLog.details.changes)) {
        changes.push({
          field,
          oldValue: (change as any).oldValue,
          newValue: (change as any).newValue,
          type: (change as any).type || 'modified'
        });
      }
    }

    return changes;
  }

  // ============================================================================
  // AUDIT TRAIL MANAGEMENT
  // ============================================================================

  async getAuditTrail(entityType: string, entityId: string, organizationId: string): Promise<AuditTrail[]> {
    const entityKey = `${entityType}/${entityId}_${organizationId}`;
    return this.auditTrails.get(entityKey) || [];
  }

  async getAuditTrails(organizationId: string, filters?: {
    entityType?: string;
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AuditTrail[]> {
    let trails: AuditTrail[] = [];

    for (const [key, trailList] of this.auditTrails.entries()) {
      if (key.endsWith(`_${organizationId}`)) {
        trails.push(...trailList);
      }
    }

    if (filters) {
      if (filters.entityType) {
        trails = trails.filter(t => t.entityType === filters.entityType);
      }
      if (filters.userId) {
        trails = trails.filter(t => t.userId === filters.userId);
      }
      if (filters.action) {
        trails = trails.filter(t => t.action === filters.action);
      }
      if (filters.dateFrom) {
        trails = trails.filter(t => t.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        trails = trails.filter(t => t.timestamp <= filters.dateTo!);
      }
    }

    return trails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // ============================================================================
  // AUDIT REPORT GENERATION
  // ============================================================================

  async createAuditReport(report: Omit<AuditReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuditReport> {
    const newReport: AuditReport = {
      id: this.generateId(),
      ...report,
      status: 'draft',
      findings: [],
      recommendations: [],
      overallScore: 0,
      riskLevel: 'low',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.auditReports.set(newReport.id, newReport);
    return newReport;
  }

  async executeAudit(auditReport: AuditReport): Promise<AuditReport> {
    const updatedReport: AuditReport = {
      ...auditReport,
      status: 'in_progress',
      updatedAt: new Date()
    };

    this.auditReports.set(auditReport.id, updatedReport);

    // Execute audit
    await this.performAuditExecution(updatedReport);

    return updatedReport;
  }

  private async performAuditExecution(report: AuditReport): Promise<void> {
    const findings: AuditFinding[] = [];
    const recommendations: AuditRecommendation[] = [];

    // Analyze audit logs for the specified period
    const auditLogs = await this.getAuditLogs(report.organizationId, {
      dateFrom: report.period.start,
      dateTo: report.period.end
    });

    // Generate findings based on audit analysis
    const securityFindings = await this.analyzeSecurityAudit(auditLogs);
    const complianceFindings = await this.analyzeComplianceAudit(auditLogs);
    const operationalFindings = await this.analyzeOperationalAudit(auditLogs);

    findings.push(...securityFindings, ...complianceFindings, ...operationalFindings);

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(findings));

    // Calculate overall score and risk level
    const overallScore = this.calculateOverallScore(findings);
    const riskLevel = this.determineRiskLevel(findings);

    const completedReport: AuditReport = {
      ...report,
      status: 'completed',
      completedAt: new Date(),
      findings,
      recommendations,
      overallScore,
      riskLevel,
      updatedAt: new Date()
    };

    this.auditReports.set(report.id, completedReport);
  }

  private async analyzeSecurityAudit(auditLogs: AuditLog[]): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check for failed authentication attempts
    const failedAuths = auditLogs.filter(l =>
      l.eventType === 'authentication' && l.result === 'failure'
    );

    if (failedAuths.length > 10) {
      findings.push({
        id: this.generateId(),
        severity: 'high',
        category: 'Authentication',
        title: 'Excessive Failed Authentication Attempts',
        description: `${failedAuths.length} failed authentication attempts detected during audit period`,
        impact: 'Potential brute force attacks or compromised credentials',
        recommendation: 'Implement account lockout policies and monitor for suspicious login patterns',
        evidence: failedAuths.map(l => l.id),
        status: 'open',
        assignedTo: 'security_team',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
      });
    }

    // Check for unauthorized access attempts
    const deniedAccess = auditLogs.filter(l => l.result === 'denied');
    if (deniedAccess.length > 5) {
      findings.push({
        id: this.generateId(),
        severity: 'medium',
        category: 'Access Control',
        title: 'Unauthorized Access Attempts',
        description: `${deniedAccess.length} unauthorized access attempts detected`,
        impact: 'Potential security breaches or privilege escalation attempts',
        recommendation: 'Review access controls and implement additional monitoring',
        evidence: deniedAccess.map(l => l.id),
        status: 'open',
        assignedTo: 'security_team',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
      });
    }

    return findings;
  }

  private async analyzeComplianceAudit(auditLogs: AuditLog[]): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check for data access without proper authorization
    const dataAccess = auditLogs.filter(l =>
      l.eventType === 'data_access' && l.result === 'success'
    );

    const unauthorizedDataAccess = dataAccess.filter(l =>
      !l.metadata.authorized || l.metadata.authorized =
    );

    if (unauthorizedDataAccess.length > 0) {
      findings.push({
        id: this.generateId(),
        severity: 'critical',
        category: 'Data Protection',
        title: 'Unauthorized Data Access',
        description: `${unauthorizedDataAccess.length} instances of unauthorized data access detected`,
        impact: 'Potential data breach and compliance violations',
        recommendation: 'Implement strict data access controls and regular access reviews',
        evidence: unauthorizedDataAccess.map(l => l.id),
        status: 'open',
        assignedTo: 'compliance_team',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      });
    }

    return findings;
  }

  private async analyzeOperationalAudit(auditLogs: AuditLog[]): Promise<AuditFinding[]> {
    const findings: AuditFinding[] = [];

    // Check for system changes without proper approval
    const systemChanges = auditLogs.filter(l =>
      l.eventType === 'system_change' && l.result === 'success'
    );

    const unapprovedChanges = systemChanges.filter(l =>
      !l.metadata.approved || l.metadata.approved =
    );

    if (unapprovedChanges.length > 0) {
      findings.push({
        id: this.generateId(),
        severity: 'medium',
        category: 'Change Management',
        title: 'Unapproved System Changes',
        description: `${unapprovedChanges.length} system changes made without proper approval`,
        impact: 'Potential system instability and compliance violations',
        recommendation: 'Implement change management process and approval workflows',
        evidence: unapprovedChanges.map(l => l.id),
        status: 'open',
        assignedTo: 'operations_team',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
      });
    }

    return findings;
  }

  private generateRecommendations(findings: AuditFinding[]): AuditRecommendation[] {
    const recommendations: AuditRecommendation[] = [];

    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      recommendations.push({
        id: this.generateId(),
        priority: 'critical',
        category: 'Security',
        title: 'Address Critical Security Findings',
        description: 'Immediately address all critical security findings to prevent potential breaches',
        implementation: 'Implement emergency response procedures and security controls',
        estimatedEffort: '2-4 weeks',
        estimatedCost: 50000,
        status: 'pending',
        assignedTo: 'security_team',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
      });
    }

    if (highFindings.length > 0) {
      recommendations.push({
        id: this.generateId(),
        priority: 'high',
        category: 'Security',
        title: 'Address High Priority Security Findings',
        description: 'Address high priority security findings within the next 30 days',
        implementation: 'Implement security controls and monitoring systems',
        estimatedEffort: '4-8 weeks',
        estimatedCost: 25000,
        status: 'pending',
        assignedTo: 'security_team',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
      });
    }

    recommendations.push({
      id: this.generateId(),
      priority: 'medium',
      category: 'Process',
      title: 'Implement Continuous Monitoring',
      description: 'Implement continuous audit monitoring and automated alerting',
      implementation: 'Deploy SIEM system and automated monitoring tools',
      estimatedEffort: '8-12 weeks',
      estimatedCost: 100000,
      status: 'pending',
      assignedTo: 'security_team',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
    });

    return recommendations;
  }

  private calculateOverallScore(findings: AuditFinding[]): number {
    if (findings.length === 0) return 100;

    let score = 100;

    findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });

    return Math.max(0, score);
  }

  private determineRiskLevel(findings: AuditFinding[]): AuditReport['riskLevel'] {
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;

    if (criticalFindings > 0) return 'critical';
    if (highFindings > 2) return 'high';
    if (highFindings > 0 || findings.length > 5) return 'medium';
    return 'low';
  }

  async getAuditReport(reportId: string): Promise<AuditReport | null> {
    return this.auditReports.get(reportId) || null;
  }

  async getAuditReports(organizationId: string): Promise<AuditReport[]> {
    return Array.from(this.auditReports.values());
      .filter(r => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ============================================================================
  // AUDIT ANALYTICS
  // ============================================================================

  async getAuditAnalytics(organizationId: string, period?: { start: Date; end: Date }): Promise<{
    totalLogs: number;
    logsByType: Record<string, number>;
    logsByResult: Record<string, number>;
    logsBySeverity: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    securityEvents: number;
    complianceEvents: number;
    riskScore: number;
  }> {
    const logs = await this.getAuditLogs(organizationId, {
      dateFrom: period?.start,
      dateTo: period?.end
    });

    const logsByType: Record<string, number> = {};
    const logsByResult: Record<string, number> = {};
    const logsBySeverity: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    const resourceCounts: Record<string, number> = {};

    logs.forEach(log => {
      logsByType[log.eventType] = (logsByType[log.eventType] || 0) + 1;
      logsByResult[log.result] = (logsByResult[log.result] || 0) + 1;
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;

      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }

      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    });

    const topUsers = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    const topResources = Object.entries(resourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([resource, count]) => ({ resource, count }));

    const securityEvents = logs.filter(l => l.eventType === 'authentication' || l.eventType === 'authorization').length;
    const complianceEvents = logs.filter(l => l.eventType === 'compliance').length;

    const riskScore = this.calculateRiskScore(logs);

    return {
      totalLogs: logs.length,
      logsByType,
      logsByResult,
      logsBySeverity,
      topUsers,
      topResources,
      securityEvents,
      complianceEvents,
      riskScore
    };
  }

  private calculateRiskScore(logs: AuditLog[]): number {
    if (logs.length === 0) return 0;

    let riskScore = 0;

    logs.forEach(log => {
      if (log.result === 'denied' || log.result === 'failure') {
        riskScore += 10;
      }

      if (log.severity === 'critical') {
        riskScore += 20;
      } else if (log.severity === 'high') {
        riskScore += 10;
      } else if (log.severity === 'medium') {
        riskScore += 5;
      }
    });

    return Math.min(100, riskScore);
  }

  // ============================================================================
  // FORENSIC ANALYSIS
  // ============================================================================

  async performForensicAnalysis(organizationId: string, criteria: {
    userId?: string;
    resource?: string;
    timeRange?: { start: Date; end: Date };
    eventTypes?: string[];
  }): Promise<{
    analysisId: string;
    summary: string;
    timeline: Array<{ timestamp: Date; event: string; details: any }>;
    patterns: string[];
    anomalies: string[];
    recommendations: string[];
  }> {
    const analysisId = this.generateId();

    const logs = await this.getAuditLogs(organizationId, {
      userId: criteria.userId,
      resource: criteria.resource,
      dateFrom: criteria.timeRange?.start,
      dateTo: criteria.timeRange?.end
    });

    const filteredLogs = criteria.eventTypes
      ? logs.filter(l => criteria.eventTypes!.includes(l.eventType))
      : logs;

    const timeline = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      event: `${log.action} on ${log.resource}`,
      details: {
        userId: log.userId,
        result: log.result,
        severity: log.severity,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      }
    }));

    const patterns = this.identifyPatterns(filteredLogs);
    const anomalies = this.identifyAnomalies(filteredLogs);
    const recommendations = this.generateForensicRecommendations(patterns, anomalies);

    const summary = `Forensic analysis of ${filteredLogs.length} audit logs identified ${patterns.length} patterns and ${anomalies.length} anomalies.`;

    return {
      analysisId,
      summary,
      timeline,
      patterns,
      anomalies,
      recommendations
    };
  }

  private identifyPatterns(logs: AuditLog[]): string[] {
    const patterns: string[] = [];

    // Check for repeated actions
    const actionCounts: Record<string, number> = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    Object.entries(actionCounts).forEach(([action, count]) => {
      if (count > 10) {
        patterns.push(`Repeated ${action} actions (${count} times)`);
      }
    });

    // Check for time-based patterns
    const hourlyCounts: Record<number, number> = {};
    logs.forEach(log => {
      const hour = log.timestamp.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourlyCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (peakHour && peakHour[1] > 5) {
      patterns.push(`Peak activity at hour ${peakHour[0]} (${peakHour[1]} events)`);
    }

    return patterns;
  }

  private identifyAnomalies(logs: AuditLog[]): string[] {
    const anomalies: string[] = [];

    // Check for unusual timing
    const nightLogs = logs.filter(log => {
      const hour = log.timestamp.getHours();
      return hour < 6 || hour > 22;
    });

    if (nightLogs.length > 0) {
      anomalies.push(`${nightLogs.length} activities during non-business hours`);
    }

    // Check for failed operations
    const failedLogs = logs.filter(log => log.result === 'failure' || log.result === 'denied');
    if (failedLogs.length > 5) {
      anomalies.push(`${failedLogs.length} failed or denied operations`);
    }

    // Check for high-severity events
    const highSeverityLogs = logs.filter(log => log.severity === 'high' || log.severity === 'critical');
    if (highSeverityLogs.length > 0) {
      anomalies.push(`${highSeverityLogs.length} high-severity security events`);
    }

    return anomalies;
  }

  private generateForensicRecommendations(patterns: string[], anomalies: string[]): string[] {
    const recommendations: string[] = [];

    if (anomalies.length > 0) {
      recommendations.push('Investigate identified anomalies for potential security incidents');
    }

    if (patterns.some(p => p.includes('Repeated'))) {
      recommendations.push('Review repeated actions for potential abuse or automation');
    }

    if (patterns.some(p => p.includes('Peak activity'))) {
      recommendations.push('Analyze peak activity patterns for capacity planning and security monitoring');
    }

    recommendations.push('Implement automated anomaly detection for real-time monitoring');
    recommendations.push('Establish baseline activity patterns for future comparisons');

    return recommendations;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getServiceStats(): Promise<{
    totalLogs: number;
    totalReports: number;
    totalTrails: number;
    config: AuditConfig;
  }> {
    const totalTrails = Array.from(this.auditTrails.values())
      .reduce((sum, trails) => sum + trails.length, 0);

    return {
      totalLogs: this.auditLogs.size,
      totalReports: this.auditReports.size,
      totalTrails,
      config: this.config
    };
  }
}
