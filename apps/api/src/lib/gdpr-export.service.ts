// GDPR Export Service for PR-43
import { DataExport, DataCategory } from './gdpr-types.js';
import { logger } from './logger.js';

export class GDPRExportService {
  private exports: DataExport[] = [];
  private dataCategories: DataCategory[] = [];

  constructor() {
    this.initializeDataCategories();
  }

  private initializeDataCategories(): void {
    this.dataCategories = [
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
  }

  async createExportRequest(
    userId: string,
    requestedBy: string,
    dataCategories: string[],
    format: 'zip' | 'json' | 'csv' | 'pdf' = 'zip',
    scope: 'user' | 'organization' = 'user'
  ): Promise<DataExport> {
    try {
      const requestId = `gdpr_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Validate data categories
      const validCategories = this.validateDataCategories(dataCategories);
      if (validCategories.length === 0) {
        throw new Error('No valid data categories specified');
      }

      // Check if user has consent for exportable categories
      const exportableCategories = validCategories.filter(cat => cat.canExport);
      if (exportableCategories.length === 0) {
        throw new Error('No exportable data categories found');
      }

      const dataExport: DataExport = {
        id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        userId,
        format,
        status: 'generating',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        dataCategories: exportableCategories.map(cat => cat.id),
        recordCount: 0,
        fileSize: 0,
        checksum: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.exports.push(dataExport);

      // Start export generation in background
      this.generateExport(dataExport).catch(error => {
        logger.error('Export generation failed', { 
          exportId: dataExport.id, 
          error: (error as Error).message 
        });
      });

      logger.info('GDPR export request created', {
        exportId: dataExport.id,
        userId,
        requestedBy,
        dataCategories: exportableCategories.map(cat => cat.id),
        format
      });

      return dataExport;
    } catch (error) {
      logger.error('Failed to create export request', { 
        userId, 
        error: (error as Error).message 
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
      const exportRecord = this.exports.find(e => e.id === dataExport.id);
      if (exportRecord) {
        exportRecord.status = 'ready';
        exportRecord.filePath = filePath;
        exportRecord.downloadUrl = `/api/gdpr/exports/${dataExport.id}/download`;
        exportRecord.recordCount = this.countRecords(exportData);
        exportRecord.fileSize = this.calculateFileSize(exportData);
        exportRecord.checksum = this.generateChecksum(exportData);
        exportRecord.updatedAt = new Date();
      }

      logger.info('GDPR export generated successfully', {
        exportId: dataExport.id,
        recordCount: exportRecord?.recordCount,
        fileSize: exportRecord?.fileSize
      });
    } catch (error) {
      const exportRecord = this.exports.find(e => e.id === dataExport.id);
      if (exportRecord) {
        exportRecord.status = 'failed';
        exportRecord.updatedAt = new Date();
      }

      logger.error('Export generation failed', { 
        exportId: dataExport.id, 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  private async collectUserData(userId: string, dataCategories: string[]): Promise<Record<string, unknown>> {
    const userData: Record<string, unknown> = {};

    for (const categoryId of dataCategories) {
      const category = this.dataCategories.find(cat => cat.id === categoryId);
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
    // Simulate personal info retrieval
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
    // Simulate financial data retrieval
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
    // Simulate SEPA transactions retrieval
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
    // Simulate CRM data retrieval
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
    // Simulate audit logs retrieval
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
    // Simulate file generation
    const fileName = `gdpr_export_${dataExport.id}.${dataExport.format}`;
    const filePath = `/tmp/exports/${fileName}`;
    
    // In a real implementation, this would generate the actual file
    logger.info('File generated', { filePath, format: dataExport.format });
    
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
    // Simulate file size calculation
    const jsonString = JSON.stringify(data);
    return Buffer.byteLength(jsonString, 'utf8');
  }

  private generateChecksum(data: Record<string, unknown>): string {
    // Simulate checksum generation
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString).toString('base64').substring(0, 32);
  }

  private validateDataCategories(categoryIds: string[]): DataCategory[] {
    return categoryIds
      .map(id => this.dataCategories.find(cat => cat.id === id))
      .filter((cat): cat is DataCategory => cat !== undefined);
  }

  getExport(exportId: string): DataExport | null {
    return this.exports.find(e => e.id === exportId) || null;
  }

  getUserExports(userId: string): DataExport[] {
    return this.exports.filter(e => e.userId === userId);
  }

  getAllExports(): DataExport[] {
    return [...this.exports];
  }

  deleteExport(exportId: string): boolean {
    const index = this.exports.findIndex(e => e.id === exportId);
    if (index === -1) return false;

    this.exports.splice(index, 1);
    return true;
  }

  getDataCategories(): DataCategory[] {
    return [...this.dataCategories];
  }

  getExportStats(): {
    totalExports: number;
    pendingExports: number;
    readyExports: number;
    downloadedExports: number;
    expiredExports: number;
    averageFileSize: number;
  } {
    const total = this.exports.length;
    const pending = this.exports.filter(e => e.status === 'generating').length;
    const ready = this.exports.filter(e => e.status === 'ready').length;
    const downloaded = this.exports.filter(e => e.status === 'downloaded').length;
    const expired = this.exports.filter(e => e.status === 'expired').length;
    const averageFileSize = total > 0 
      ? this.exports.reduce((sum, e) => sum + e.fileSize, 0) / total 
      : 0;

    return {
      totalExports: total,
      pendingExports: pending,
      readyExports: ready,
      downloadedExports: downloaded,
      expiredExports: expired,
      averageFileSize
    };
  }
}
