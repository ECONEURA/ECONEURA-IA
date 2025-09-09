// GDPR Audit Service for PR-43
import { GDPRRequest, AuditEntry, GDPRStats, BreachRecord } from './gdpr-types';
import { logger } from './logger.js';

export class GDPRAuditService {
  private auditEntries: AuditEntry[] = [];
  private gdprRequests: GDPRRequest[] = [];
  private breaches: BreachRecord[] = [];

  constructor() {
    this.initializeBreaches();
  }

  private initializeBreaches(): void {
    // Initialize with some example breach records
    this.breaches = [
      {
        id: 'breach_1',
        type: 'confidentiality',
        severity: 'medium',
        description: 'Unauthorized access to user data',
        affectedDataCategories: ['personal_info'],
        affectedDataSubjects: 5,
        discoveredAt: new Date('2024-01-15'),
        reportedAt: new Date('2024-01-16'),
        containedAt: new Date('2024-01-16'),
        resolvedAt: new Date('2024-01-20'),
        dpaNotified: true,
        dpaNotificationDate: new Date('2024-01-17'),
        dataSubjectsNotified: true,
        dataSubjectsNotificationDate: new Date('2024-01-18'),
        measures: ['Access revoked', 'System patched', 'Additional monitoring'],
        status: 'resolved',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async logAuditEntry(
    requestId: string,
    action: 'created' | 'updated' | 'processed' | 'completed' | 'failed',
    actor: string,
    details: Record<string, unknown>,
    ipAddress: string,
    userAgent: string
  ): Promise<AuditEntry> {
    try {
      const auditEntry: AuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        action,
        actor,
        timestamp: new Date(),
        details,
        ipAddress,
        userAgent,
        signature: this.generateSignature(requestId, action, actor, details)
      };

      this.auditEntries.push(auditEntry);

      logger.info('GDPR audit entry logged', {
        auditId: auditEntry.id,
        requestId,
        action,
        actor
      });

      return auditEntry;
    } catch (error) {
      logger.error('Failed to log audit entry', {
        requestId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async createGDPRRequest(
    userId: string,
    type: 'export' | 'erase' | 'rectification' | 'portability',
    requestedBy: string,
    dataCategories: string[],
    scope: 'user' | 'organization' = 'user',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    reason?: string
  ): Promise<GDPRRequest> {
    try {
      const requestId = `gdpr_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const gdprRequest: GDPRRequest = {
        id: requestId,
        userId,
        type,
        status: 'pending',
        requestedAt: new Date(),
        requestedBy,
        reason,
        legalBasis: this.getLegalBasis(type),
        dataCategories,
        scope,
        priority,
        metadata: {
          ipAddress: '127.0.0.1', // Would be extracted from request
          userAgent: 'GDPR-System/1.0'
        },
        auditTrail: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.gdprRequests.push(gdprRequest);

      // Log initial audit entry
      await this.logAuditEntry(
        requestId,
        'created',
        requestedBy,
        { type, dataCategories, scope, priority },
        '127.0.0.1',
        'GDPR-System/1.0'
      );

      logger.info('GDPR request created', {
        requestId,
        userId,
        type,
        requestedBy,
        dataCategories
      });

      return gdprRequest;
    } catch (error) {
      logger.error('Failed to create GDPR request', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async updateRequestStatus(
    requestId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    processedBy: string,
    details?: Record<string, unknown>
  ): Promise<GDPRRequest | null> {
    try {
      const request = this.gdprRequests.find(r => r.id === requestId);
      if (!request) return null;

      const oldStatus = request.status;
      request.status = status;
      request.updatedAt = new Date();

      if (status === 'processing') {
        request.processedAt = new Date();
        request.processedBy = processedBy;
      } else if (status === 'completed' || status === 'failed') {
        request.completedAt = new Date();
      }

      // Log status change
      await this.logAuditEntry(
        requestId,
        'updated',
        processedBy,
        {
          oldStatus,
          newStatus: status,
          ...details
        },
        '127.0.0.1',
        'GDPR-System/1.0'
      );

      logger.info('GDPR request status updated', {
        requestId,
        oldStatus,
        newStatus: status,
        processedBy
      });

      return request;
    } catch (error) {
      logger.error('Failed to update request status', {
        requestId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async recordBreach(
    type: 'confidentiality' | 'integrity' | 'availability',
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    affectedDataCategories: string[],
    affectedDataSubjects: number,
    discoveredBy: string
  ): Promise<BreachRecord> {
    try {
      const breach: BreachRecord = {
        id: `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        severity,
        description,
        affectedDataCategories,
        affectedDataSubjects,
        discoveredAt: new Date(),
        status: 'investigating',
        measures: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.breaches.push(breach);

      // Log breach discovery
      await this.logAuditEntry(
        'system',
        'created',
        discoveredBy,
        {
          breachId: breach.id,
          type,
          severity,
          affectedDataSubjects
        },
        '127.0.0.1',
        'GDPR-System/1.0'
      );

      logger.warn('Data breach recorded', {
        breachId: breach.id,
        type,
        severity,
        affectedDataSubjects,
        discoveredBy
      });

      return breach;
    } catch (error) {
      logger.error('Failed to record breach', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async updateBreach(
    breachId: string,
    updates: Partial<BreachRecord>,
    updatedBy: string
  ): Promise<BreachRecord | null> {
    try {
      const breach = this.breaches.find(b => b.id === breachId);
      if (!breach) return null;

      const oldStatus = breach.status;
      Object.assign(breach, updates);
      breach.updatedAt = new Date();

      // Log breach update
      await this.logAuditEntry(
        'system',
        'updated',
        updatedBy,
        {
          breachId,
          oldStatus,
          newStatus: breach.status,
          updates
        },
        '127.0.0.1',
        'GDPR-System/1.0'
      );

      logger.info('Breach record updated', {
        breachId,
        oldStatus,
        newStatus: breach.status,
        updatedBy
      });

      return breach;
    } catch (error) {
      logger.error('Failed to update breach', {
        breachId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private getLegalBasis(type: string): string {
    const legalBases: Record<string, string> = {
      'export': 'Article 20 - Right to data portability',
      'erase': 'Article 17 - Right to erasure',
      'rectification': 'Article 16 - Right to rectification',
      'portability': 'Article 20 - Right to data portability'
    };

    return legalBases[type] || 'Article 6 - Lawfulness of processing';
  }

  private generateSignature(
    requestId: string,
    action: string,
    actor: string,
    details: Record<string, unknown>
  ): string {
    // Simulate digital signature generation
    const data = `${requestId}_${action}_${actor}_${JSON.stringify(details)}_${Date.now()}`;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  getAuditEntries(requestId?: string): AuditEntry[] {
    if (requestId) {
      return this.auditEntries.filter(entry => entry.requestId === requestId);
    }
    return [...this.auditEntries];
  }

  getGDPRRequests(userId?: string): GDPRRequest[] {
    if (userId) {
      return this.gdprRequests.filter(request => request.userId === userId);
    }
    return [...this.gdprRequests];
  }

  getGDPRRequest(requestId: string): GDPRRequest | null {
    return this.gdprRequests.find(r => r.id === requestId) || null;
  }

  getBreaches(): BreachRecord[] {
    return [...this.breaches];
  }

  getBreach(breachId: string): BreachRecord | null {
    return this.breaches.find(b => b.id === breachId) || null;
  }

  getGDPRStats(): GDPRStats {
    const totalRequests = this.gdprRequests.length;
    const pendingRequests = this.gdprRequests.filter(r => r.status === 'pending').length;
    const completedRequests = this.gdprRequests.filter(r => r.status === 'completed').length;
    const failedRequests = this.gdprRequests.filter(r => r.status === 'failed').length;

    // Calculate average processing time
    const completedRequestsWithTime = this.gdprRequests.filter(r =>
      r.status === 'completed' && r.completedAt && r.requestedAt
    );
    const averageProcessingTime = completedRequestsWithTime.length > 0
      ? completedRequestsWithTime.reduce((sum, r) => {
          const processingTime = r.completedAt!.getTime() - r.requestedAt.getTime();
          return sum + processingTime;
        }, 0) / completedRequestsWithTime.length
      : 0;

    const exportRequests = this.gdprRequests.filter(r => r.type === 'export').length;
    const eraseRequests = this.gdprRequests.filter(r => r.type === 'erase').length;
    const rectificationRequests = this.gdprRequests.filter(r => r.type === 'rectification').length;
    const portabilityRequests = this.gdprRequests.filter(r => r.type === 'portability').length;

    const activeBreaches = this.breaches.filter(b => b.status === 'investigating' || b.status === 'contained').length;
    const resolvedBreaches = this.breaches.filter(b => b.status === 'resolved' || b.status === 'closed').length;

    // Calculate data retention compliance (simplified)
    const dataRetentionCompliance = totalRequests > 0
      ? (completedRequests / totalRequests) * 100
      : 100;

    return {
      totalRequests,
      pendingRequests,
      completedRequests,
      failedRequests,
      averageProcessingTime,
      exportRequests,
      eraseRequests,
      rectificationRequests,
      portabilityRequests,
      activeLegalHolds: 0, // Would be calculated from legal holds service
      expiredLegalHolds: 0, // Would be calculated from legal holds service
      dataRetentionCompliance
    };
  }

  getComplianceReport(period: { start: Date; end: Date }): {
    period: { start: Date; end: Date };
    stats: GDPRStats;
    breaches: BreachRecord[];
    auditEntries: AuditEntry[];
    complianceScore: number;
  } {
    const stats = this.getGDPRStats();
    const periodBreaches = this.breaches.filter(b =>
      b.discoveredAt >= period.start && b.discoveredAt <= period.end
    );
    const periodAuditEntries = this.auditEntries.filter(a =>
      a.timestamp >= period.start && a.timestamp <= period.end
    );

    // Calculate compliance score (simplified)
    const complianceScore = Math.min(100, Math.max(0,
      (stats.completedRequests / Math.max(1, stats.totalRequests)) * 100 -
      (periodBreaches.length * 10) -
      (stats.failedRequests * 5)
    ));

    return {
      period,
      stats,
      breaches: periodBreaches,
      auditEntries: periodAuditEntries,
      complianceScore
    };
  }

  exportAuditTrail(requestId: string): {
    request: GDPRRequest | null;
    auditTrail: AuditEntry[];
    exportedAt: Date;
  } {
    const request = this.getGDPRRequest(requestId);
    const auditTrail = this.getAuditEntries(requestId);

    return {
      request,
      auditTrail,
      exportedAt: new Date()
    };
  }
}
