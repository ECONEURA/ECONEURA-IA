/**
 * PR-30: GDPR Compliance API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('GDPR Compliance API Integration Tests', () => {
  let testUserId: string;
  let testAdminId: string;
  let testRequestId: string;

  beforeAll(() => {
    testUserId = 'test-user-123';
    testAdminId = 'test-admin-456';
  });

  describe('GDPR Request Management', () => {
    it('should create a GDPR export request', async () => {
      const requestData = {
        userId: testUserId,
        type: 'export',
        requestedBy: testAdminId,
        dataCategories: ['personal_info', 'financial_data'],
        options: {
          reason: 'User requested data export',
          priority: 'medium'
        }
      };

      const response = await request(app)
        .post('/v1/gdpr/requests')
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(testUserId);
      expect(response.body.data.type).toBe('export');
      expect(response.body.data.status).toBe('pending');

      testRequestId = response.body.data.id;
    });

    it('should create a GDPR erase request', async () => {
      const requestData = {
        userId: testUserId,
        type: 'erase',
        requestedBy: testAdminId,
        dataCategories: ['personal_info'],
        options: {
          reason: 'User requested data deletion',
          priority: 'high'
        }
      };

      const response = await request(app)
        .post('/v1/gdpr/requests')
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('erase');
      expect(response.body.data.status).toBe('pending');
    });

    it('should get GDPR request by ID', async () => {
      const response = await request(app)
        .get(`/v1/gdpr/requests/${testRequestId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testRequestId);
      expect(response.body.data.userId).toBe(testUserId);
    });

    it('should get GDPR requests with filters', async () => {
      const response = await request(app)
        .get('/v1/gdpr/requests')
        .query({
          userId: testUserId,
          type: 'export',
          status: 'pending'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('should update GDPR request status', async () => {
      const updateData = {
        status: 'processing',
        processedBy: testAdminId,
        details: {
          startedAt: new Date().toISOString()
        }
      };

      const response = await request(app)
        .patch(`/v1/gdpr/requests/${testRequestId}/status`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processing');
      expect(response.body.data.processedBy).toBe(testAdminId);
    });
  });

  describe('Data Export Management', () => {
    it('should get user exports', async () => {
      const response = await request(app)
        .get(`/v1/gdpr/exports/user/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('should download export', async () => {
      // First get user exports to find an export ID
      const exportsResponse = await request(app)
        .get(`/v1/gdpr/exports/user/${testUserId}`)
        .expect(200);

      if (exportsResponse.body.data.length > 0) {
        const exportId = exportsResponse.body.data[0].id;

        const response = await request(app)
          .post(`/v1/gdpr/exports/${exportId}/download`)
          .send({ userId: testUserId })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });
  });

  describe('Data Erase Management', () => {
    it('should get user erasures', async () => {
      const response = await request(app)
        .get(`/v1/gdpr/erasures/user/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('Legal Holds Management', () => {
    it('should create a legal hold', async () => {
      const legalHoldData = {
        name: 'Financial Records Retention',
        description: 'Legal requirement to retain financial records',
        type: 'regulatory',
        dataCategories: ['financial_data'],
        startDate: new Date('2020-01-01').toISOString(),
        endDate: new Date('2030-01-01').toISOString(),
        status: 'active',
        createdBy: testAdminId,
        legalBasis: 'EU Banking Regulation',
        metadata: {}
      };

      const response = await request(app)
        .post('/v1/gdpr/legal-holds')
        .send(legalHoldData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(legalHoldData.name);
      expect(response.body.data.type).toBe(legalHoldData.type);
    });

    it('should get legal holds with filters', async () => {
      const response = await request(app)
        .get('/v1/gdpr/legal-holds')
        .query({
          status: 'active',
          type: 'regulatory'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('Consent Management', () => {
    it('should create a consent record', async () => {
      const consentData = {
        userId: testUserId,
        dataCategory: 'personal_info',
        consentGiven: true,
        consentDate: new Date().toISOString(),
        purpose: 'Marketing communications',
        legalBasis: 'consent',
        metadata: {}
      };

      const response = await request(app)
        .post('/v1/gdpr/consent')
        .send(consentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(testUserId);
      expect(response.body.data.consentGiven).toBe(true);
    });

    it('should get consent records for user', async () => {
      const response = await request(app)
        .get(`/v1/gdpr/consent/user/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });

    it('should withdraw consent', async () => {
      // First create a consent record
      const consentData = {
        userId: testUserId,
        dataCategory: 'marketing_data',
        consentGiven: true,
        consentDate: new Date().toISOString(),
        purpose: 'Marketing communications',
        legalBasis: 'consent',
        metadata: {}
      };

      const createResponse = await request(app)
        .post('/v1/gdpr/consent')
        .send(consentData)
        .expect(201);

      const consentId = createResponse.body.data.id;

      // Then withdraw it
      const response = await request(app)
        .post(`/v1/gdpr/consent/${consentId}/withdraw`)
        .send({ userId: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.consentGiven).toBe(false);
      expect(response.body.data.withdrawalDate).toBeDefined();
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
        retentionPeriod: 1095,
        dataController: 'ECONEURA',
        metadata: {}
      };

      const response = await request(app)
        .post('/v1/gdpr/data-processing-activities')
        .send(activityData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(activityData.name);
      expect(response.body.data.purpose).toBe(activityData.purpose);
    });

    it('should get all data processing activities', async () => {
      const response = await request(app)
        .get('/v1/gdpr/data-processing-activities')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('Breach Management', () => {
    it('should create a breach record', async () => {
      const breachData = {
        type: 'confidentiality',
        severity: 'medium',
        description: 'Unauthorized access to customer data',
        affectedDataCategories: ['personal_info'],
        affectedUsers: 10,
        discoveredAt: new Date().toISOString(),
        status: 'investigating',
        impact: 'Limited exposure of customer information',
        metadata: {}
      };

      const response = await request(app)
        .post('/v1/gdpr/breaches')
        .send(breachData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.type).toBe(breachData.type);
      expect(response.body.data.severity).toBe(breachData.severity);
    });

    it('should get breach records with filters', async () => {
      const response = await request(app)
        .get('/v1/gdpr/breaches')
        .query({
          status: 'investigating',
          severity: 'medium'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeDefined();
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate compliance report', async () => {
      const reportData = {
        organizationId: 'org-123',
        period: {
          start: new Date('2024-01-01').toISOString(),
          end: new Date('2024-12-31').toISOString()
        },
        generatedBy: testAdminId
      };

      const response = await request(app)
        .post('/v1/gdpr/compliance-reports')
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.organizationId).toBe(reportData.organizationId);
      expect(response.body.data.complianceScore).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get GDPR stats', async () => {
      const response = await request(app)
        .get('/v1/gdpr/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data.totalRequests).toBe('number');
      expect(typeof response.body.data.pendingRequests).toBe('number');
      expect(typeof response.body.data.completedRequests).toBe('number');
    });

    it('should get service stats', async () => {
      const response = await request(app)
        .get('/v1/gdpr/service-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.gdpr).toBeDefined();
      expect(response.body.data.exports).toBeDefined();
      expect(response.body.data.erasures).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/v1/gdpr/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for invalid request data', async () => {
      const invalidData = {
        userId: 'invalid-uuid',
        type: 'invalid-type',
        requestedBy: 'invalid-uuid',
        dataCategories: []
      };

      const response = await request(app)
        .post('/v1/gdpr/requests')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .get('/v1/gdpr/requests/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('GDPR request not found');
    });

    it('should return 400 for missing user ID in download', async () => {
      const response = await request(app)
        .post('/v1/gdpr/exports/test-export-id/download')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User ID is required');
    });
  });
});
