// GDPR Erase Service for PR-43
import { GDPRRequest, DataErase, LegalHold } from './gdpr-types';
import { logger } from './logger.js';

export class GDPREraseService {
  private erasures: DataErase[] = [];
  private legalHolds: LegalHold[] = [];

  constructor() {
    this.initializeLegalHolds();
  }

  private initializeLegalHolds(): void {
    // Initialize with some default legal holds
    this.legalHolds = [
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
  }

  async createEraseRequest(
    userId: string,
    requestedBy: string,
    dataCategories: string[],
    type: 'soft' | 'hard' | 'anonymize' | 'pseudonymize' = 'soft',
    reason?: string
  ): Promise<DataErase> {
    try {
      const requestId = `gdpr_erase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check for legal holds
      const conflictingHolds = this.checkLegalHolds(userId, dataCategories);
      if (conflictingHolds.length > 0) {
        throw new Error(`Cannot erase data due to active legal holds: ${conflictingHolds.map(h => h.name).join(', ')}`);
      }

      // Validate erase type for data categories
      const validCategories = this.validateEraseCategories(dataCategories, type);
      if (validCategories.length === 0) {
        throw new Error('No valid data categories for erase operation');
      }

      const dataErase: DataErase = {
        id: `erase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        userId,
        type,
        status: 'pending',
        dataCategories: validCategories,
        recordCount: 0,
        erasedCount: 0,
        verificationHash: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.erasures.push(dataErase);

      // Start erase process in background
      this.processErase(dataErase).catch(error => {
        logger.error('Erase process failed', {
          eraseId: dataErase.id,
          error: (error as Error).message
        });
      });

      logger.info('GDPR erase request created', {
        eraseId: dataErase.id,
        userId,
        requestedBy,
        dataCategories: validCategories,
        type,
        reason
      });

      return dataErase;
    } catch (error) {
      logger.error('Failed to create erase request', {
        userId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async processErase(dataErase: DataErase): Promise<void> {
    try {
      const eraseRecord = this.erasures.find(e => e.id === dataErase.id);
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

      logger.info('GDPR erase completed successfully', {
        eraseId: dataErase.id,
        recordCount,
        erasedCount,
        type: dataErase.type
      });
    } catch (error) {
      const eraseRecord = this.erasures.find(e => e.id === dataErase.id);
      if (eraseRecord) {
        eraseRecord.status = 'failed';
        eraseRecord.updatedAt = new Date();
      }

      logger.error('Erase process failed', {
        eraseId: dataErase.id,
        error: (error as Error).message
      });
      throw error;
    }
  }

  private async countRecordsToErase(userId: string, dataCategories: string[]): Promise<number> {
    let count = 0;

    for (const category of dataCategories) {
      switch (category) {
        case 'personal_info':
          count += await this.countPersonalInfoRecords(userId);
          break;
        case 'financial_data':
          count += await this.countFinancialRecords(userId);
          break;
        case 'sepa_transactions':
          count += await this.countSEPARecords(userId);
          break;
        case 'crm_data':
          count += await this.countCRMRecords(userId);
          break;
        case 'audit_logs':
          count += await this.countAuditRecords(userId);
          break;
      }
    }

    return count;
  }

  private async countPersonalInfoRecords(userId: string): Promise<number> {
    // Simulate counting personal info records
    return Math.floor(Math.random() * 10) + 1;
  }

  private async countFinancialRecords(userId: string): Promise<number> {
    // Simulate counting financial records
    return Math.floor(Math.random() * 50) + 1;
  }

  private async countSEPARecords(userId: string): Promise<number> {
    // Simulate counting SEPA records
    return Math.floor(Math.random() * 100) + 1;
  }

  private async countCRMRecords(userId: string): Promise<number> {
    // Simulate counting CRM records
    return Math.floor(Math.random() * 20) + 1;
  }

  private async countAuditRecords(userId: string): Promise<number> {
    // Simulate counting audit records
    return Math.floor(Math.random() * 200) + 1;
  }

  private async createBackup(dataErase: DataErase): Promise<string> {
    // Simulate backup creation
    const backupPath = `/backups/gdpr/${dataErase.id}_${Date.now()}.backup`;

    logger.info('Backup created', {
      eraseId: dataErase.id,
      backupPath
    });

    return backupPath;
  }

  private async performErase(dataErase: DataErase): Promise<number> {
    let erasedCount = 0;

    for (const category of dataErase.dataCategories) {
      switch (category) {
        case 'personal_info':
          erasedCount += await this.erasePersonalInfo(dataErase.userId, dataErase.type);
          break;
        case 'financial_data':
          erasedCount += await this.eraseFinancialData(dataErase.userId, dataErase.type);
          break;
        case 'sepa_transactions':
          erasedCount += await this.eraseSEPAData(dataErase.userId, dataErase.type);
          break;
        case 'crm_data':
          erasedCount += await this.eraseCRMData(dataErase.userId, dataErase.type);
          break;
        case 'audit_logs':
          erasedCount += await this.eraseAuditLogs(dataErase.userId, dataErase.type);
          break;
      }
    }

    return erasedCount;
  }

  private async erasePersonalInfo(userId: string, type: string): Promise<number> {
    // Simulate personal info erasure
    const count = Math.floor(Math.random() * 10) + 1;

    logger.info('Personal info erased', {
      userId,
      type,
      count
    });

    return count;
  }

  private async eraseFinancialData(userId: string, type: string): Promise<number> {
    // Simulate financial data erasure
    const count = Math.floor(Math.random() * 50) + 1;

    logger.info('Financial data erased', {
      userId,
      type,
      count
    });

    return count;
  }

  private async eraseSEPAData(userId: string, type: string): Promise<number> {
    // Simulate SEPA data erasure
    const count = Math.floor(Math.random() * 100) + 1;

    logger.info('SEPA data erased', {
      userId,
      type,
      count
    });

    return count;
  }

  private async eraseCRMData(userId: string, type: string): Promise<number> {
    // Simulate CRM data erasure
    const count = Math.floor(Math.random() * 20) + 1;

    logger.info('CRM data erased', {
      userId,
      type,
      count
    });

    return count;
  }

  private async eraseAuditLogs(userId: string, type: string): Promise<number> {
    // Simulate audit logs erasure
    const count = Math.floor(Math.random() * 200) + 1;

    logger.info('Audit logs erased', {
      userId,
      type,
      count
    });

    return count;
  }

  private generateVerificationHash(dataErase: DataErase, erasedCount: number): string {
    // Simulate verification hash generation
    const data = `${dataErase.id}_${dataErase.userId}_${erasedCount}_${Date.now()}`;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  private checkLegalHolds(userId: string, dataCategories: string[]): LegalHold[] {
    const activeHolds = this.legalHolds.filter(hold =>
      hold.status === 'active' &&
      (hold.userId === userId || !hold.userId) &&
      hold.dataCategories.some(cat => dataCategories.includes(cat))
    );

    return activeHolds;
  }

  private validateEraseCategories(dataCategories: string[], type: string): string[] {
    // Define which categories can be erased with which types
    const eraseRules: Record<string, string[]> = {
      'soft': ['personal_info', 'crm_data'],
      'hard': ['personal_info', 'crm_data'],
      'anonymize': ['personal_info', 'crm_data', 'audit_logs'],
      'pseudonymize': ['personal_info', 'crm_data', 'audit_logs']
    };

    const allowedCategories = eraseRules[type] || [];
    return dataCategories.filter(cat => allowedCategories.includes(cat));
  }

  getErase(eraseId: string): DataErase | null {
    return this.erasures.find(e => e.id === eraseId) || null;
  }

  getUserErasures(userId: string): DataErase[] {
    return this.erasures.filter(e => e.userId === userId);
  }

  getAllErasures(): DataErase[] {
    return [...this.erasures];
  }

  addLegalHold(legalHold: Omit<LegalHold, 'id' | 'createdAt' | 'updatedAt'>): LegalHold {
    const newHold: LegalHold = {
      ...legalHold,
      id: `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.legalHolds.push(newHold);
    return newHold;
  }

  getLegalHolds(): LegalHold[] {
    return [...this.legalHolds];
  }

  getActiveLegalHolds(): LegalHold[] {
    return this.legalHolds.filter(hold => hold.status === 'active');
  }

  updateLegalHold(holdId: string, updates: Partial<LegalHold>): LegalHold | null {
    const holdIndex = this.legalHolds.findIndex(hold => hold.id === holdId);
    if (holdIndex === -1) return null;

    this.legalHolds[holdIndex] = {
      ...this.legalHolds[holdIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.legalHolds[holdIndex];
  }

  deleteLegalHold(holdId: string): boolean {
    const holdIndex = this.legalHolds.findIndex(hold => hold.id === holdId);
    if (holdIndex === -1) return false;

    this.legalHolds.splice(holdIndex, 1);
    return true;
  }

  getEraseStats(): {
    totalErasures: number;
    pendingErasures: number;
    processingErasures: number;
    completedErasures: number;
    failedErasures: number;
    totalRecordsErased: number;
    averageProcessingTime: number;
  } {
    const total = this.erasures.length;
    const pending = this.erasures.filter(e => e.status === 'pending').length;
    const processing = this.erasures.filter(e => e.status === 'processing').length;
    const completed = this.erasures.filter(e => e.status === 'completed').length;
    const failed = this.erasures.filter(e => e.status === 'failed').length;
    const totalRecordsErased = this.erasures.reduce((sum, e) => sum + e.erasedCount, 0);

    // Calculate average processing time
    const completedErasures = this.erasures.filter(e => e.completedAt);
    const averageProcessingTime = completedErasures.length > 0
      ? completedErasures.reduce((sum, e) => {
          const processingTime = e.completedAt!.getTime() - e.createdAt.getTime();
          return sum + processingTime;
        }, 0) / completedErasures.length
      : 0;

    return {
      totalErasures: total,
      pendingErasures: pending,
      processingErasures: processing,
      completedErasures: completed,
      failedErasures: failed,
      totalRecordsErased,
      averageProcessingTime
    };
  }
}
