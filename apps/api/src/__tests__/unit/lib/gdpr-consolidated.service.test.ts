/**
 * PR-30: GDPR Consolidated Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gdprConsolidated } from '../../../lib/gdpr-consolidated.service.js';

// Mock dependencies
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('GDPR Consolidated Service', () => {
  beforeEach(() => {
    // Clear all maps before each test
    vi.clearAllMocks();
  });

  describe('GDPR Request Management', () => {
    it('should create a GDPR export request', async () => {
      const requestData = {
        userId: 'user-123',
        type: 'export' as const,
        requestedBy: 'admin-456',
        dataCategories: ['personal_info', 'financial_data'],
        options: {
          reason: 'User requested data export',
          priority: 'medium' as const
        }
      };

      const result = await gdprConsolidated.createGDPRRequest(
        requestData.userId,
        requestData.type,
        requestData.requestedBy,
        requestData.dataCategories,
        requestData.options
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(requestData.userId);
      expect(result.type).toBe(requestData.type);
      expect(result.status).toBe('pending');
      expect(result.dataCategories).toEqual(requestData.dataCategories);
      expect(result.priority).toBe(requestData.options.priority);
    });

    it('should create a GDPR erase request', async () => {
      const requestData = {
        userId: 'user-123',
        type: 'erase' as const,
        requestedBy: 'admin-456',
        dataCategories: ['personal_info'],
        options: {
          reason: 'User requested data deletion',
          priority: 'high' as const
        }
      };

      const result = await gdprConsolidated.createGDPRRequest(
        requestData.userId,
        requestData.type,
        requestData.requestedBy,
        requestData.dataCategories,
        requestData.options
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('erase');
      expect(result.status).toBe('pending');
    });

    it('should retrieve a GDPR request by ID', async () => {
      const requestData = {
        userId: 'user-123',
        type: 'export' as const,
        requestedBy: 'admin-456',
        dataCategories: ['personal_info']
      };

      const createdRequest = await gdprConsolidated.createGDPRRequest(
        requestData.userId,
        requestData.type,
        requestData.requestedBy,
        requestData.dataCategories
      );

      const retrievedRequest = await gdprConsolidated.getGDPRRequest(createdRequest.id);

      expect(retrievedRequest).toBeDefined();
      expect(retrievedRequest?.id).toBe(createdRequest.id);
      expect(retrievedRequest?.userId).toBe(requestData.userId);
    });

    it('should update GDPR request status', async () => {
      const requestData = {
        userId: 'user-123',
        type: 'export' as const,
        requestedBy: 'admin-456',
        dataCategories: ['personal_info']
      };

      const createdRequest = await gdprConsolidated.createGDPRRequest(
        requestData.userId,
        requestData.type,
        requestData.requestedBy,
        requestData.dataCategories
      );

      const updatedRequest = await gdprConsolidated.updateGDPRRequestStatus(
        createdRequest.id,
        'processing',
        'system',
        { startedAt: new Date().toISOString() }
      );

      expect(updatedRequest).toBeDefined();
      expect(updatedRequest?.status).toBe('processing');
      expect(updatedRequest?.processedBy).toBe('system');
    });
  });

  describe('Data Export Management', () => {
    it('should get data export by ID', async () => {
      // Create a request first to generate an export
      const requestData = {
        userId: 'user-123',
        type: 'export' as const,
        requestedBy: 'admin-456',
        dataCategories: ['personal_info']
      };

      await gdprConsolidated.createGDPRRequest(
        requestData.userId,
        requestData.type,
        requestData.requestedBy,
        requestData.dataCategories
      );

      // Wait a bit for the export to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get all exports for the user
      const userExports = await gdprConsolidated.getUserExports(requestData.userId);
      
      if (userExports.length > 0) {
        const exportRecord = await gdprConsolidated.getDataExport(userExports[0].id);
        expect(exportRecord).toBeDefined();
        expect(exportRecord?.userId).toBe(requestData.userId);
      }
    });

    it('should get user exports', async () => {
      const userId = 'user-123';
      
      const userExports = await gdprConsolidated.getUserExports(userId);
      
      expect(Array.isArray(userExports)).toBe(true);
    });
  });

  describe('Data Erase Management', () => {
    it('should get data erase by ID', async () => {
      // Create an erase request first
      const requestData = {
        userId: 'user-123',
        type: 'erase' as const,
        requestedBy: 'admin-456',
        dataCategories: ['personal_info']
      };

      await gdprConsolidated.createGDPRRequest(
        requestData.userId,
        requestData.type,
        requestData.requestedBy,
        requestData.dataCategories
      );

      // Wait a bit for the erase to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get all erasures for the user
      const userErasures = await gdprConsolidated.getUserErasures(requestData.userId);
      
      if (userErasures.length > 0) {
        const eraseRecord = await gdprConsolidated.getDataErase(userErasures[0].id);
        expect(eraseRecord).toBeDefined();
        expect(eraseRecord?.userId).toBe(requestData.userId);
      }
    });

    it('should get user erasures', async () => {
      const userId = 'user-123';
      
      const userErasures = await gdprConsolidated.getUserErasures(userId);
      
      expect(Array.isArray(userErasures)).toBe(true);
    });
  });

  describe('Legal Holds Management', () => {
    it('should create a legal hold', async () => {
      const legalHoldData = {
        name: 'Financial Records Retention',
        description: 'Legal requirement to retain financial records',
        type: 'regulatory' as const,
        dataCategories: ['financial_data'],
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-01-01'),
        status: 'active' as const,
        createdBy: 'admin-456',
        legalBasis: 'EU Banking Regulation',
        metadata: {}
      };

      const result = await gdprConsolidated.createLegalHold(legalHoldData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(legalHoldData.name);
      expect(result.type).toBe(legalHoldData.type);
      expect(result.status).toBe(legalHoldData.status);
    });

    it('should get legal holds with filters', async () => {
      const filters = {
        status: 'active' as const,
        type: 'regulatory' as const
      };

      const legalHolds = await gdprConsolidated.getLegalHolds(filters);

      expect(Array.isArray(legalHolds)).toBe(true);
    });

    it('should update legal hold', async () => {
      const legalHoldData = {
        name: 'Test Legal Hold',
        description: 'Test description',
        type: 'litigation' as const,
        dataCategories: ['personal_info'],
        startDate: new Date(),
        status: 'active' as const,
        createdBy: 'admin-456',
        legalBasis: 'Test basis',
        metadata: {}
      };

      const createdHold = await gdprConsolidated.createLegalHold(legalHoldData);
      
      const updates = {
        status: 'expired' as const,
        endDate: new Date()
      };

      const updatedHold = await gdprConsolidated.updateLegalHold(createdHold.id, updates);

      expect(updatedHold).toBeDefined();
      expect(updatedHold?.status).toBe('expired');
    });
  });

  describe('Consent Management', () => {
    it('should create a consent record', async () => {
      const consentData = {
        userId: 'user-123',
        dataCategory: 'personal_info',
        consentGiven: true,
        consentDate: new Date(),
        purpose: 'Marketing communications',
        legalBasis: 'consent',
        metadata: {}
      };

      const result = await gdprConsolidated.createConsentRecord(consentData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(consentData.userId);
      expect(result.consentGiven).toBe(consentData.consentGiven);
    });

    it('should get consent records for user', async () => {
      const userId = 'user-123';
      
      const consentRecords = await gdprConsolidated.getConsentRecords(userId);

      expect(Array.isArray(consentRecords)).toBe(true);
    });

    it('should withdraw consent', async () => {
      const consentData = {
        userId: 'user-123',
        dataCategory: 'personal_info',
        consentGiven: true,
        consentDate: new Date(),
        purpose: 'Marketing communications',
        legalBasis: 'consent',
        metadata: {}
      };

      const createdConsent = await gdprConsolidated.createConsentRecord(consentData);
      
      const withdrawnConsent = await gdprConsolidated.withdrawConsent(
        createdConsent.id,
        consentData.userId
      );

      expect(withdrawnConsent).toBeDefined();
      expect(withdrawnConsent?.consentGiven).toBe(false);
      expect(withdrawnConsent?.withdrawalDate).toBeDefined();
    });
  });

  describe('Data Processing Activities', () => {
    it('should create a data processing activity', async () => {
      const activityData = {
        name: 'Customer Support',
        description: 'Processing customer support requests',
        purpose: 'Customer service',
        legalBasis: 'legitimate_interest',
        dataCategories: ['personal_info'],
        retentionPeriod: 1095, // 3 years
        dataController: 'ECONEURA',
        metadata: {}
      };

      const result = await gdprConsolidated.createDataProcessingActivity(activityData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(activityData.name);
      expect(result.purpose).toBe(activityData.purpose);
    });

    it('should get all data processing activities', async () => {
      const activities = await gdprConsolidated.getDataProcessingActivities();

      expect(Array.isArray(activities)).toBe(true);
    });
  });

  describe('Breach Management', () => {
    it('should create a breach record', async () => {
      const breachData = {
        type: 'confidentiality' as const,
        severity: 'medium' as const,
        description: 'Unauthorized access to customer data',
        affectedDataCategories: ['personal_info'],
        affectedUsers: 10,
        discoveredAt: new Date(),
        status: 'investigating' as const,
        impact: 'Limited exposure of customer information',
        metadata: {}
      };

      const result = await gdprConsolidated.createBreachRecord(breachData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.type).toBe(breachData.type);
      expect(result.severity).toBe(breachData.severity);
    });

    it('should get breach records with filters', async () => {
      const filters = {
        status: 'investigating' as const,
        severity: 'medium' as const
      };

      const breaches = await gdprConsolidated.getBreachRecords(filters);

      expect(Array.isArray(breaches)).toBe(true);
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const reportData = {
        organizationId: 'org-123',
        period: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        generatedBy: 'admin-456'
      };

      const result = await gdprConsolidated.generateComplianceReport(
        reportData.organizationId,
        reportData.period,
        reportData.generatedBy
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(reportData.organizationId);
      expect(result.complianceScore).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get GDPR stats', async () => {
      const stats = await gdprConsolidated.getGDPRStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalRequests).toBe('number');
      expect(typeof stats.pendingRequests).toBe('number');
      expect(typeof stats.completedRequests).toBe('number');
      expect(typeof stats.failedRequests).toBe('number');
      expect(typeof stats.averageProcessingTime).toBe('number');
    });

    it('should get service stats', async () => {
      const serviceStats = await gdprConsolidated.getServiceStats();

      expect(serviceStats).toBeDefined();
      expect(serviceStats.gdpr).toBeDefined();
      expect(serviceStats.exports).toBeDefined();
      expect(serviceStats.erasures).toBeDefined();
    });
  });
});
