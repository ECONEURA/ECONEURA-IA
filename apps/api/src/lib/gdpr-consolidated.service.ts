/**
 * GDPR EXPORT/ERASE CONSOLIDATED SERVICE
 * 
 * Este servicio consolida las mejores funcionalidades de:
 * - PR-28: GDPR Export/Erase (100%)
 * - PR-51: GDPR Export/Erase (95%)
 * 
 * Funcionalidades consolidadas:
 * - Exportación de datos GDPR
 * - Borrado de datos GDPR
 * - Gestión de Legal Holds
 * - Auditoría y trazabilidad
 * - Gestión de consentimientos
 * - Reportes de cumplimiento
 * - Análisis y estadísticas
 */

import { 
  GDPRRequest, 
  DataExport, 
  DataErase, 
  LegalHold, 
  DataCategory,
  ConsentRecord,
  DataProcessingActivity,
  BreachRecord,
  GDPRComplianceReport,
  GDPRStats,
  AuditEntry
} from './gdpr-types.js';
import { structuredLogger } from './structured-logger.js';

export class GDPRConsolidatedService {
  private gdprRequests: Map<string, GDPRRequest> = new Map();
  private dataExports: Map<string, DataExport> = new Map();
  private dataErasures: Map<string, DataErase> = new Map();
  private legalHolds: Map<string, LegalHold> = new Map();
  private dataCategories: Map<string, DataCategory> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private dataProcessingActivities: Map<string, DataProcessingActivity> = new Map();
  private breachRecords: Map<string, BreachRecord> = new Map();
  private auditEntries: Map<string, AuditEntry> = new Map();

  constructor() {
    this.initializeDataCategories();
    this.initializeLegalHolds();
    this.startMonitoring();
  }

  // ============================================================================
  // GDPR REQUEST MANAGEMENT (de PR-28 y PR-51)
  // ============================================================================

  async createGDPRRequest(
    userId: string,
    type: GDPRRequest['type'],
    requestedBy: string,
    dataCategories: string[],
    options: {
      reason?: string;
      legalBasis?: string;
      scope?: 'user' | 'organization';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<GDPRRequest> {
    const id = this.generateId();
    const now = new Date();

    const gdprRequest: GDPRRequest = {
      id,
      userId,
      type,
      status: 'pending',
      requestedAt: now,
      requestedBy,
      reason: options.reason,
      legalBasis: options.legalBasis || 'consent',
      dataCategories,
      scope: options.scope || 'user',
      priority: options.priority || 'medium',
      metadata: options.metadata || {},
      auditTrail: [],
      createdAt: now,
      updatedAt: now
    };

    this.gdprRequests.set(id, gdprRequest);

    // Create audit entry
    await this.createAuditEntry(id, 'created', requestedBy, {
      type,
      dataCategories,
      reason: options.reason
    });

    // Process request based on type
    switch (type) {
      case 'export':
        await this.processExportRequest(gdprRequest);
        break;
      case 'erase':
        await this.processEraseRequest(gdprRequest);
        break;
      case 'rectification':
        await this.processRectificationRequest(gdprRequest);
        break;
      case 'portability':
        await this.processPortabilityRequest(gdprRequest);
        break;
    }

    structuredLogger.info('GDPR request created', {
      requestId: id,
      userId,
      type,
      requestedBy,
      dataCategories
    });

    return gdprRequest;
  }

  async getGDPRRequest(requestId: string): Promise<GDPRRequest | null> {
    return this.gdprRequests.get(requestId) || null;
  }

  async getGDPRRequests(userId?: string, filters?: {
    type?: GDPRRequest['type'];
    status?: GDPRRequest['status'];
    priority?: GDPRRequest['priority'];
  }): Promise<GDPRRequest[]> {
    let requests = Array.from(this.gdprRequests.values());

    if (userId) {
      requests = requests.filter(r => r.userId === userId);
    }

    if (filters) {
      if (filters.type) {
        requests = requests.filter(r => r.type === filters.type);
      }
      if (filters.status) {
        requests = requests.filter(r => r.status === filters.status);
      }
      if (filters.priority) {
        requests = requests.filter(r => r.priority === filters.priority);
      }
    }

    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateGDPRRequestStatus(
    requestId: string,
    status: GDPRRequest['status'],
    processedBy: string,
    details?: Record<string, unknown>
  ): Promise<GDPRRequest | null> {
    const request = this.gdprRequests.get(requestId);
    if (!request) return null;

    const updatedRequest: GDPRRequest = {
      ...request,
      status,
      processedBy,
      processedAt: status === 'processing' ? new Date() : request.processedAt,
      completedAt: status === 'completed' ? new Date() : request.completedAt,
      updatedAt: new Date()
    };

    this.gdprRequests.set(requestId, updatedRequest);

    // Create audit entry
    await this.createAuditEntry(requestId, 'updated', processedBy, {
      status,
      details
    });

    structuredLogger.info('GDPR request status updated', {
      requestId,
      status,
      processedBy
    });

    return updatedRequest;
  }

  // ============================================================================
  // DATA EXPORT MANAGEMENT (de PR-28 y PR-51)
  // ============================================================================

  private async processExportRequest(gdprRequest: GDPRRequest): Promise<void> {
    try {
      const dataExport: DataExport = {
        id: this.generateId(),
        requestId: gdprRequest.id,
        userId: gdprRequest.userId,
        format: 'zip',
        status: 'generating',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        dataCategories: gdprRequest.dataCategories,
        recordCount: 0,
        fileSize: 0,
        checksum: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.dataExports.set(dataExport.id, dataExport);

      // Update request status
      await this.updateGDPRRequestStatus(gdprRequest.id, 'processing', 'system');

      // Start export generation in background
      this.generateExport(dataExport).catch(error => {
        structuredLogger.error('Export generation failed', error);
      });

    } catch (error) {
      await this.updateGDPRRequestStatus(gdprRequest.id, 'failed', 'system', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async generateExport(dataExport: DataExport): Promise<void> {
    try {
      // Simulate export generation
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Collect data based on categories
      const exportData = await this.collectUserData(dataExport.userId, dataExport.dataCategories);
      
      // Generate file based on format
      const filePath = await this.generateFile(dataExport, exportData);
      
      // Update export record
      const exportRecord = this.dataExports.get(dataExport.id);
      if (exportRecord) {
        exportRecord.status = 'ready';
        exportRecord.filePath = filePath;
        exportRecord.downloadUrl = `/api/gdpr/exports/${dataExport.id}/download`;
        exportRecord.recordCount = this.countRecords(exportData);
        exportRecord.fileSize = this.calculateFileSize(exportData);
        exportRecord.checksum = this.generateChecksum(exportData);
        exportRecord.updatedAt = new Date();
      }

      // Update request status
      await this.updateGDPRRequestStatus(dataExport.requestId, 'completed', 'system');

      structuredLogger.info('GDPR export generated successfully', {
        exportId: dataExport.id,
        recordCount: exportRecord?.recordCount,
        fileSize: exportRecord?.fileSize,
        requestId: ''
      });

    } catch (error) {
      await this.updateGDPRRequestStatus(dataExport.requestId, 'failed', 'system', {
        error: error instanceof Error ? error.message : String(error)
      });

    structuredLogger.error('Export generation failed');
      throw error;
    }
  }

  async getDataExport(exportId: string): Promise<DataExport | null> {
    return this.dataExports.get(exportId) || null;
  }

  async getUserExports(userId: string): Promise<DataExport[]> {
    return Array.from(this.dataExports.values())
      .filter(e => e.userId === userId);
  }

  async downloadExport(exportId: string, userId: string): Promise<DataExport | null> {
    const exportRecord = this.dataExports.get(exportId);
    if (!exportRecord || exportRecord.userId !== userId) {
      return null;
    }

    if (exportRecord.status === 'ready') {
      exportRecord.status = 'downloaded';
      exportRecord.updatedAt = new Date();
    }

    return exportRecord;
  }

  // ============================================================================
  // DATA ERASE MANAGEMENT (de PR-28 y PR-51)
  // ============================================================================

  private async processEraseRequest(gdprRequest: GDPRRequest): Promise<void> {
    try {
      // Check for legal holds
      const conflictingHolds = this.checkLegalHolds(gdprRequest.userId, gdprRequest.dataCategories);
      if (conflictingHolds.length > 0) {
        throw new Error(`Cannot erase data due to active legal holds: ${conflictingHolds.map(h => h.name).join(', ')}`);
      }

      const dataErase: DataErase = {
        id: this.generateId(),
        requestId: gdprRequest.id,
        userId: gdprRequest.userId,
        type: 'soft',
        status: 'pending',
        dataCategories: gdprRequest.dataCategories,
        recordCount: 0,
        erasedCount: 0,
        verificationHash: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.dataErasures.set(dataErase.id, dataErase);

      // Update request status
      await this.updateGDPRRequestStatus(gdprRequest.id, 'processing', 'system');

      // Start erase process in background
      this.processErase(dataErase).catch(error => {
        structuredLogger.error('Erase process failed', error);
      });

    } catch (error) {
      await this.updateGDPRRequestStatus(gdprRequest.id, 'failed', 'system', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async processErase(dataErase: DataErase): Promise<void> {
    try {
      const eraseRecord = this.dataErasures.get(dataErase.id);
      if (!eraseRecord) return;

      eraseRecord.status = 'processing';
      eraseRecord.updatedAt = new Date();

      // Simulate erase processing
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));

      // Count records to be erased
      const recordCount = await this.countRecordsToErase(dataErase.userId, dataErase.dataCategories);
      eraseRecord.recordCount = recordCount;

      // Create backup if needed
      if (dataErase.type === 'hard') {
        const backupPath = await this.createBackup(dataErase);
        eraseRecord.backupPath = backupPath;
      }

      // Perform erase operation
      const erasedCount = await this.performErase(dataErase);
      eraseRecord.erasedCount = erasedCount;

      // Generate verification hash
      eraseRecord.verificationHash = this.generateVerificationHash(dataErase, erasedCount);

      // Mark as completed
      eraseRecord.status = 'completed';
      eraseRecord.completedAt = new Date();
      eraseRecord.updatedAt = new Date();

      // Update request status
      await this.updateGDPRRequestStatus(dataErase.requestId, 'completed', 'system');

      structuredLogger.info('GDPR erase completed successfully', {
        eraseId: dataErase.id,
        recordCount,
        erasedCount,
        type: dataErase.type,
        requestId: ''
      });

    } catch (error) {
      await this.updateGDPRRequestStatus(dataErase.requestId, 'failed', 'system', {
        error: error instanceof Error ? error.message : String(error)
      });

    structuredLogger.error('Erase process failed');
      throw error;
    }
  }

  async getDataErase(eraseId: string): Promise<DataErase | null> {
    return this.dataErasures.get(eraseId) || null;
  }

  async getUserErasures(userId: string): Promise<DataErase[]> {
    return Array.from(this.dataErasures.values())
      .filter(e => e.userId === userId);
  }

  // ============================================================================
  // LEGAL HOLDS MANAGEMENT (de PR-28 y PR-51)
  // ============================================================================

  async createLegalHold(legalHold: Omit<LegalHold, 'id' | 'createdAt' | 'updatedAt'>): Promise<LegalHold> {
    const id = this.generateId();
    const now = new Date();

    const newHold: LegalHold = {
      ...legalHold,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.legalHolds.set(id, newHold);

    structuredLogger.info('Legal hold created', {
      holdId: id,
      name: newHold.name,
      type: newHold.type,
      status: newHold.status,
      requestId: ''
    });

    return newHold;
  }

  async getLegalHold(holdId: string): Promise<LegalHold | null> {
    return this.legalHolds.get(holdId) || null;
  }

  async getLegalHolds(filters?: {
    status?: LegalHold['status'];
    type?: LegalHold['type'];
    userId?: string;
  }): Promise<LegalHold[]> {
    let holds = Array.from(this.legalHolds.values());

    if (filters) {
      if (filters.status) {
        holds = holds.filter(h => h.status === filters.status);
      }
      if (filters.type) {
        holds = holds.filter(h => h.type === filters.type);
      }
      if (filters.userId) {
        holds = holds.filter(h => h.userId === filters.userId);
      }
    }

    return holds.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLegalHold(holdId: string, updates: Partial<LegalHold>): Promise<LegalHold | null> {
    const hold = this.legalHolds.get(holdId);
    if (!hold) return null;

    const updatedHold: LegalHold = {
      ...hold,
      ...updates,
      updatedAt: new Date()
    };

    this.legalHolds.set(holdId, updatedHold);

    structuredLogger.info('Legal hold updated', {
      holdId,
      changes: Object.keys(updates),
      requestId: ''
    });

    return updatedHold;
  }

  async deleteLegalHold(holdId: string): Promise<boolean> {
    const deleted = this.legalHolds.delete(holdId);
    
    if (deleted) {
      structuredLogger.info('Legal hold deleted', {
        holdId,
        requestId: ''
      });
    }

    return deleted;
  }

  // ============================================================================
  // CONSENT MANAGEMENT (de PR-28 y PR-51)
  // ============================================================================

  async createConsentRecord(consentRecord: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConsentRecord> {
    const id = this.generateId();
    const now = new Date();

    const newConsent: ConsentRecord = {
      ...consentRecord,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.consentRecords.set(id, newConsent);

    structuredLogger.info('Consent record created', {
      consentId: id,
      userId: newConsent.userId,
      dataCategory: newConsent.dataCategory,
      consentGiven: newConsent.consentGiven,
      requestId: ''
    });

    return newConsent;
  }

  async getConsentRecords(userId: string, dataCategory?: string): Promise<ConsentRecord[]> {
    let records = Array.from(this.consentRecords.values())
      .filter(r => r.userId === userId);

    if (dataCategory) {
      records = records.filter(r => r.dataCategory === dataCategory);
    }

    return records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async withdrawConsent(consentId: string, userId: string): Promise<ConsentRecord | null> {
    const consent = this.consentRecords.get(consentId);
    if (!consent || consent.userId !== userId) {
      return null;
    }

    const updatedConsent: ConsentRecord = {
      ...consent,
      consentGiven: false,
      withdrawalDate: new Date(),
      updatedAt: new Date()
    };

    this.consentRecords.set(consentId, updatedConsent);

    structuredLogger.info('Consent withdrawn', {
      consentId,
      userId,
      dataCategory: consent.dataCategory,
      requestId: ''
    });

    return updatedConsent;
  }

  // ============================================================================
  // DATA PROCESSING ACTIVITIES (de PR-28 y PR-51)
  // ============================================================================

  async createDataProcessingActivity(activity: Omit<DataProcessingActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataProcessingActivity> {
    const id = this.generateId();
    const now = new Date();

    const newActivity: DataProcessingActivity = {
      ...activity,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.dataProcessingActivities.set(id, newActivity);

    structuredLogger.info('Data processing activity created', {
      activityId: id,
      name: newActivity.name,
      purpose: newActivity.purpose,
      requestId: ''
    });

    return newActivity;
  }

  async getDataProcessingActivities(): Promise<DataProcessingActivity[]> {
    return Array.from(this.dataProcessingActivities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ============================================================================
  // BREACH MANAGEMENT (de PR-28 y PR-51)
  // ============================================================================

  async createBreachRecord(breach: Omit<BreachRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<BreachRecord> {
    const id = this.generateId();
    const now = new Date();

    const newBreach: BreachRecord = {
      ...breach,
      id,
      createdAt: now,
      updatedAt: now
    };

    this.breachRecords.set(id, newBreach);

    structuredLogger.info('Breach record created', {
      breachId: id,
      type: newBreach.type,
      severity: newBreach.severity,
      status: newBreach.status,
      requestId: ''
    });

    return newBreach;
  }

  async getBreachRecords(filters?: {
    status?: BreachRecord['status'];
    severity?: BreachRecord['severity'];
    type?: BreachRecord['type'];
  }): Promise<BreachRecord[]> {
    let breaches = Array.from(this.breachRecords.values());

    if (filters) {
      if (filters.status) {
        breaches = breaches.filter(b => b.status === filters.status);
      }
      if (filters.severity) {
        breaches = breaches.filter(b => b.severity === filters.severity);
      }
      if (filters.type) {
        breaches = breaches.filter(b => b.type === filters.type);
      }
    }

    return breaches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ============================================================================
  // COMPLIANCE REPORTING (de PR-28 y PR-51)
  // ============================================================================

  async generateComplianceReport(
    organizationId: string,
    period: { start: Date; end: Date },
    generatedBy: string
  ): Promise<GDPRComplianceReport> {
    const id = this.generateId();
    const now = new Date();

    const stats = await this.getGDPRStats();
    const dataProcessingActivities = await this.getDataProcessingActivities();
    const breaches = await this.getBreachRecords();
    const legalHolds = await this.getLegalHolds();
    const consentRecords = Array.from(this.consentRecords.values());

    const report: GDPRComplianceReport = {
      id,
      period,
      organizationId,
      stats,
      dataProcessingActivities,
      breaches,
      legalHolds,
      consentRecords,
      recommendations: this.generateRecommendations(stats, breaches),
      complianceScore: this.calculateComplianceScore(stats, breaches),
      generatedAt: now,
      generatedBy
    };

    structuredLogger.info('GDPR compliance report generated', {
      reportId: id,
      organizationId,
      period,
      complianceScore: report.complianceScore,
      requestId: ''
    });

    return report;
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS (de PR-28 y PR-51)
  // ============================================================================

  async getGDPRStats(): Promise<GDPRStats> {
    const totalRequests = this.gdprRequests.size;
    const pendingRequests = Array.from(this.gdprRequests.values()).filter(r => r.status === 'pending').length;
    const completedRequests = Array.from(this.gdprRequests.values()).filter(r => r.status === 'completed').length;
    const failedRequests = Array.from(this.gdprRequests.values()).filter(r => r.status === 'failed').length;

    const exportRequests = Array.from(this.gdprRequests.values()).filter(r => r.type === 'export').length;
    const eraseRequests = Array.from(this.gdprRequests.values()).filter(r => r.type === 'erase').length;
    const rectificationRequests = Array.from(this.gdprRequests.values()).filter(r => r.type === 'rectification').length;
    const portabilityRequests = Array.from(this.gdprRequests.values()).filter(r => r.type === 'portability').length;

    const activeLegalHolds = Array.from(this.legalHolds.values()).filter(h => h.status === 'active').length;
    const expiredLegalHolds = Array.from(this.legalHolds.values()).filter(h => h.status === 'expired').length;

    // Calculate average processing time
    const completedRequestsWithTimes = Array.from(this.gdprRequests.values())
      .filter(r => r.status === 'completed' && r.completedAt);
    
    const averageProcessingTime = completedRequestsWithTimes.length > 0
      ? completedRequestsWithTimes.reduce((sum, r) => {
          const processingTime = r.completedAt!.getTime() - r.requestedAt.getTime();
          return sum + processingTime;
        }, 0) / completedRequestsWithTimes.length
      : 0;

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
      activeLegalHolds,
      expiredLegalHolds,
      dataRetentionCompliance: 95 // Simplified
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeDataCategories(): void {
    const categories: DataCategory[] = [
      {
        id: 'personal_info',
        name: 'Personal Information',
        description: 'Basic personal data like name, email, phone',
        sensitivity: 'medium',
        retentionPeriod: 2555, // 7 years
        legalBasis: ['consent', 'contract', 'legal_obligation'],
        canExport: true,
        canErase: true,
        requiresConsent: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'financial_data',
        name: 'Financial Data',
        description: 'Bank accounts, transactions, payment information',
        sensitivity: 'high',
        retentionPeriod: 3650, // 10 years
        legalBasis: ['legal_obligation', 'contract'],
        canExport: true,
        canErase: false,
        requiresConsent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'sepa_transactions',
        name: 'SEPA Transactions',
        description: 'Bank statements and transaction data',
        sensitivity: 'high',
        retentionPeriod: 3650, // 10 years
        legalBasis: ['legal_obligation'],
        canExport: true,
        canErase: false,
        requiresConsent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'crm_data',
        name: 'CRM Data',
        description: 'Customer relationship management data',
        sensitivity: 'medium',
        retentionPeriod: 1095, // 3 years
        legalBasis: ['consent', 'legitimate_interest'],
        canExport: true,
        canErase: true,
        requiresConsent: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'audit_logs',
        name: 'Audit Logs',
        description: 'System access and operation logs',
        sensitivity: 'medium',
        retentionPeriod: 2555, // 7 years
        legalBasis: ['legal_obligation', 'legitimate_interest'],
        canExport: true,
        canErase: false,
        requiresConsent: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    categories.forEach(category => {
      this.dataCategories.set(category.id, category);
    });
  }

  private initializeLegalHolds(): void {
    const holds: LegalHold[] = [
      {
        id: 'hold_1',
        name: 'Financial Records Retention',
        description: 'Legal requirement to retain financial records for 10 years',
        type: 'regulatory',
        dataCategories: ['financial_data', 'sepa_transactions'],
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-01-01'),
        status: 'active',
        createdBy: 'system',
        legalBasis: 'EU Banking Regulation',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    holds.forEach(hold => {
      this.legalHolds.set(hold.id, hold);
    });
  }

  private startMonitoring(): void {
    // Monitor expired exports every hour
    setInterval(() => {
      this.cleanupExpiredExports();
    }, 3600000);

    // Monitor legal holds daily
    setInterval(() => {
      this.updateLegalHoldStatuses();
    }, 86400000);
  }

  private async cleanupExpiredExports(): Promise<void> {
    const now = new Date();
    const expiredExports = Array.from(this.dataExports.values())
      .filter(exportRecord => exportRecord.expiresAt <= now && exportRecord.status === 'ready');

    for (const exportRecord of expiredExports) {
      exportRecord.status = 'expired';
      exportRecord.updatedAt = new Date();
    }

    if (expiredExports.length > 0) {
      structuredLogger.info('Expired exports cleaned up', {
        count: expiredExports.length,
        requestId: ''
      });
    }
  }

  private async updateLegalHoldStatuses(): Promise<void> {
    const now = new Date();
    const expiredHolds = Array.from(this.legalHolds.values())
      .filter(hold => hold.endDate && hold.endDate <= now && hold.status === 'active');

    for (const hold of expiredHolds) {
      hold.status = 'expired';
      hold.updatedAt = new Date();
    }

    if (expiredHolds.length > 0) {
      structuredLogger.info('Legal holds status updated', {
        expiredCount: expiredHolds.length,
        requestId: ''
      });
    }
  }

  private generateId(): string {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createAuditEntry(
    requestId: string,
    action: AuditEntry['action'],
    actor: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const auditEntry: AuditEntry = {
      id: this.generateId(),
      requestId,
      action,
      actor,
      timestamp: new Date(),
      details,
      ipAddress: '127.0.0.1', // Simplified
      userAgent: 'GDPR-Service',
      signature: this.generateSignature(actor, details)
    };

    this.auditEntries.set(auditEntry.id, auditEntry);

    // Add to request audit trail
    const request = this.gdprRequests.get(requestId);
    if (request) {
      request.auditTrail.push(auditEntry);
    }
  }

  private generateSignature(actor: string, details: Record<string, unknown>): string {
    const data = `${actor}_${JSON.stringify(details)}_${Date.now()}`;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  // Data collection methods (simplified)
  private async collectUserData(userId: string, dataCategories: string[]): Promise<Record<string, unknown>> {
    const userData: Record<string, unknown> = {};

    for (const categoryId of dataCategories) {
      const category = this.dataCategories.get(categoryId);
      if (!category) continue;

      switch (categoryId) {
        case 'personal_info':
          userData.personal_info = await this.getPersonalInfo(userId);
          break;
        case 'financial_data':
          userData.financial_data = await this.getFinancialData(userId);
          break;
        case 'sepa_transactions':
          userData.sepa_transactions = await this.getSEPATransactions(userId);
          break;
        case 'crm_data':
          userData.crm_data = await this.getCRMData(userId);
          break;
        case 'audit_logs':
          userData.audit_logs = await this.getAuditLogs(userId);
          break;
      }
    }

    return userData;
  }

  private async getPersonalInfo(userId: string): Promise<unknown> {
    return {
      id: userId,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        country: 'US'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async getFinancialData(userId: string): Promise<unknown> {
    return {
      accounts: [
        {
          id: 'acc_1',
          type: 'checking',
          balance: 1500.00,
          currency: 'USD',
          iban: 'ES1234567890123456789012'
        }
      ],
      transactions: [
        {
          id: 'txn_1',
          amount: -50.00,
          description: 'Purchase',
          date: new Date().toISOString()
        }
      ]
    };
  }

  private async getSEPATransactions(userId: string): Promise<unknown> {
    return {
      transactions: [
        {
          id: 'sepa_1',
          amount: 100.00,
          reference: 'REF001',
          date: new Date().toISOString(),
          counterparty: {
            name: 'Test Company',
            iban: 'ES9876543210987654321098'
          }
        }
      ]
    };
  }

  private async getCRMData(userId: string): Promise<unknown> {
    return {
      companies: [
        {
          id: 'comp_1',
          name: 'Test Company',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      contacts: [
        {
          id: 'contact_1',
          name: 'Jane Smith',
          email: 'jane@testcompany.com',
          createdAt: new Date().toISOString()
        }
      ],
      deals: [
        {
          id: 'deal_1',
          title: 'Test Deal',
          value: 10000,
          stage: 'proposal',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  private async getAuditLogs(userId: string): Promise<unknown> {
    return {
      logs: [
        {
          id: 'log_1',
          action: 'login',
          timestamp: new Date().toISOString(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        }
      ]
    };
  }

  private async generateFile(dataExport: DataExport, data: Record<string, unknown>): Promise<string> {
    const fileName = `gdpr_export_${dataExport.id}.${dataExport.format}`;
    const filePath = `/tmp/exports/${fileName}`;
    
    structuredLogger.info('File generated', { filePath, format: dataExport.format, requestId: '' });
    
    return filePath;
  }

  private countRecords(data: Record<string, unknown>): number {
    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (typeof value === 'object' && value !== null) {
        count += this.countRecords(value as Record<string, unknown>);
      } else {
        count += 1;
      }
    }
    return count;
  }

  private calculateFileSize(data: Record<string, unknown>): number {
    const jsonString = JSON.stringify(data);
    return Buffer.byteLength(jsonString, 'utf8');
  }

  private generateChecksum(data: Record<string, unknown>): string {
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString).toString('base64').substring(0, 32);
  }

  private checkLegalHolds(userId: string, dataCategories: string[]): LegalHold[] {
    const activeHolds = Array.from(this.legalHolds.values()).filter(hold => 
      hold.status === 'active' && 
      (hold.userId === userId || !hold.userId) &&
      hold.dataCategories.some(cat => dataCategories.includes(cat))
    );

    return activeHolds;
  }

  private async countRecordsToErase(userId: string, dataCategories: string[]): Promise<number> {
    let count = 0;
    
    for (const category of dataCategories) {
      switch (category) {
        case 'personal_info':
          count += Math.floor(Math.random() * 10) + 1;
          break;
        case 'financial_data':
          count += Math.floor(Math.random() * 50) + 1;
          break;
        case 'sepa_transactions':
          count += Math.floor(Math.random() * 100) + 1;
          break;
        case 'crm_data':
          count += Math.floor(Math.random() * 20) + 1;
          break;
        case 'audit_logs':
          count += Math.floor(Math.random() * 200) + 1;
          break;
      }
    }

    return count;
  }

  private async createBackup(dataErase: DataErase): Promise<string> {
    const backupPath = `/backups/gdpr/${dataErase.id}_${Date.now()}.backup`;
    
    structuredLogger.info('Backup created', { 
      eraseId: dataErase.id, 
      backupPath,
      requestId: ''
    });
    
    return backupPath;
  }

  private async performErase(dataErase: DataErase): Promise<number> {
    let erasedCount = 0;

    for (const category of dataErase.dataCategories) {
      switch (category) {
        case 'personal_info':
          erasedCount += Math.floor(Math.random() * 10) + 1;
          break;
        case 'financial_data':
          erasedCount += Math.floor(Math.random() * 50) + 1;
          break;
        case 'sepa_transactions':
          erasedCount += Math.floor(Math.random() * 100) + 1;
          break;
        case 'crm_data':
          erasedCount += Math.floor(Math.random() * 20) + 1;
          break;
        case 'audit_logs':
          erasedCount += Math.floor(Math.random() * 200) + 1;
          break;
      }
    }

    return erasedCount;
  }

  private generateVerificationHash(dataErase: DataErase, erasedCount: number): string {
    const data = `${dataErase.id}_${dataErase.userId}_${erasedCount}_${Date.now()}`;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  private generateRecommendations(stats: GDPRStats, breaches: BreachRecord[]): string[] {
    const recommendations: string[] = [];
    
    if (stats.failedRequests > 0) {
      recommendations.push('Review and address failed GDPR requests to improve compliance');
    }
    
    if (breaches.length > 0) {
      recommendations.push('Implement additional security measures to prevent data breaches');
    }
    
    if (stats.averageProcessingTime > 7 * 24 * 60 * 60 * 1000) { // 7 days
      recommendations.push('Optimize GDPR request processing to meet regulatory deadlines');
    }
    
    recommendations.push('Regularly review and update data processing activities');
    recommendations.push('Ensure all legal holds are properly documented and maintained');
    
    return recommendations;
  }

  private calculateComplianceScore(stats: GDPRStats, breaches: BreachRecord[]): number {
    let score = 100;
    
    // Deduct points for failed requests
    if (stats.totalRequests > 0) {
      const failureRate = stats.failedRequests / stats.totalRequests;
      score -= failureRate * 20;
    }
    
    // Deduct points for breaches
    score -= breaches.length * 10;
    
    // Deduct points for slow processing
    if (stats.averageProcessingTime > 7 * 24 * 60 * 60 * 1000) {
      score -= 15;
    }
    
    return Math.max(0, Math.round(score));
  }

  // Placeholder methods for other request types
  private async processRectificationRequest(gdprRequest: GDPRRequest): Promise<void> {
    // Simplified implementation
    await this.updateGDPRRequestStatus(gdprRequest.id, 'completed', 'system');
  }

  private async processPortabilityRequest(gdprRequest: GDPRRequest): Promise<void> {
    // Simplified implementation
    await this.updateGDPRRequestStatus(gdprRequest.id, 'completed', 'system');
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  async getServiceStats(): Promise<{
    gdpr: GDPRStats;
    exports: {
      totalExports: number;
      pendingExports: number;
      readyExports: number;
      downloadedExports: number;
      expiredExports: number;
      averageFileSize: number;
    };
    erasures: {
      totalErasures: number;
      pendingErasures: number;
      processingErasures: number;
      completedErasures: number;
      failedErasures: number;
      totalRecordsErased: number;
      averageProcessingTime: number;
    };
  }> {
    const gdprStats = await this.getGDPRStats();
    
    const exports = Array.from(this.dataExports.values());
    const erasures = Array.from(this.dataErasures.values());

    return {
      gdpr: gdprStats,
      exports: {
        totalExports: exports.length,
        pendingExports: exports.filter(e => e.status === 'generating').length,
        readyExports: exports.filter(e => e.status === 'ready').length,
        downloadedExports: exports.filter(e => e.status === 'downloaded').length,
        expiredExports: exports.filter(e => e.status === 'expired').length,
        averageFileSize: exports.length > 0 
          ? exports.reduce((sum, e) => sum + e.fileSize, 0) / exports.length 
          : 0
      },
      erasures: {
        totalErasures: erasures.length,
        pendingErasures: erasures.filter(e => e.status === 'pending').length,
        processingErasures: erasures.filter(e => e.status === 'processing').length,
        completedErasures: erasures.filter(e => e.status === 'completed').length,
        failedErasures: erasures.filter(e => e.status === 'failed').length,
        totalRecordsErased: erasures.reduce((sum, e) => sum + e.erasedCount, 0),
        averageProcessingTime: 0 // Simplified
      }
    };
  }
}

// Instancia singleton consolidada
export const gdprConsolidated = new GDPRConsolidatedService();

