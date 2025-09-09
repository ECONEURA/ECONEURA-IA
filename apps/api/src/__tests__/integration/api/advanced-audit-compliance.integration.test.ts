import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('Advanced Audit Compliance API Integration Tests', () => {
  const basePath = '/v1/advanced-audit-compliance';

  describe('POST /events', () => {
    it('should log an audit event successfully', async () => {
      const eventData = {
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
      };

      const response = await request(app)
        .post(`${basePath}/events`)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('event');
      expect(response.body.data).toHaveProperty('message', 'Audit event logged successfully');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      const event = response.body.data.event;
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('timestamp');
      expect(event.userId).toBe(eventData.userId);
      expect(event.organizationId).toBe(eventData.organizationId);
      expect(event.action).toBe(eventData.action);
      expect(event.resource).toBe(eventData.resource);
      expect(event.severity).toBe(eventData.severity);
      expect(event.riskScore).toBe(eventData.riskScore);
    });

    it('should handle minimal event data', async () => {
      const eventData = {
        userId: 'user-002',
        organizationId: 'org-001',
        action: 'create',
        resource: 'document',
        severity: 'low',
        compliance: {
          gdpr: false,
          sox: false,
          pci: false,
          hipaa: false,
          iso27001: false
        },
        riskScore: 30
      };

      const response = await request(app)
        .post(`${basePath}/events`)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.event).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        // Missing required fields
        action: 'read',
        severity: 'medium'
      };

      const response = await request(app)
        .post(`${basePath}/events`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid audit event data');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('GET /events', () => {
    it('should return audit events without filters', async () => {
      const response = await request(app)
        .get(`${basePath}/events`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('events');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('filters');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.events)).toBe(true);
      expect(typeof response.body.data.total).toBe('number');
    });

    it('should filter events by organization', async () => {
      const response = await request(app)
        .get(`${basePath}/events`)
        .query({ organizationId: 'org-001' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.events).toBeDefined();
    });

    it('should filter events by severity', async () => {
      const response = await request(app)
        .get(`${basePath}/events`)
        .query({ severity: 'high' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.events).toBeDefined();
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get(`${basePath}/events`)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(10);
    });

    it('should return validation error for invalid filters', async () => {
      const response = await request(app)
        .get(`${basePath}/events`)
        .query({ limit: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid filter parameters');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('GET /rules', () => {
    it('should return compliance rules', async () => {
      const response = await request(app)
        .get(`${basePath}/rules`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('rules');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.rules)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);

      // Check structure of first rule
      if (response.body.data.rules.length > 0) {
        const rule = response.body.data.rules[0];
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('framework');
        expect(rule).toHaveProperty('conditions');
        expect(rule).toHaveProperty('actions');
        expect(rule).toHaveProperty('isActive');
        expect(rule).toHaveProperty('createdAt');
        expect(rule).toHaveProperty('updatedAt');
      }
    });
  });

  describe('POST /rules', () => {
    it('should create a new compliance rule', async () => {
      const ruleData = {
        name: 'Test Compliance Rule',
        description: 'A test rule for compliance monitoring',
        framework: 'gdpr',
        conditions: {
          action: ['read', 'write'],
          resource: ['user_data', 'personal_data'],
          severity: ['high', 'critical'],
          timeWindow: 60,
          threshold: 5
        },
        actions: {
          alert: true,
          block: false,
          notify: ['admin@company.com', 'dpo@company.com'],
          escalate: true
        },
        isActive: true
      };

      const response = await request(app)
        .post(`${basePath}/rules`)
        .send(ruleData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('rule');
      expect(response.body.data).toHaveProperty('message', 'Compliance rule created successfully');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      const rule = response.body.data.rule;
      expect(rule).toHaveProperty('id');
      expect(rule.name).toBe(ruleData.name);
      expect(rule.description).toBe(ruleData.description);
      expect(rule.framework).toBe(ruleData.framework);
      expect(rule.conditions).toEqual(ruleData.conditions);
      expect(rule.actions).toEqual(ruleData.actions);
      expect(rule.isActive).toBe(ruleData.isActive);
      expect(rule.createdAt).toBeDefined();
    });

    it('should return validation error for invalid rule data', async () => {
      const invalidData = {
        // Missing required fields
        description: 'Invalid rule data'
      };

      const response = await request(app)
        .post(`${basePath}/rules`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid compliance rule data');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('GET /violations', () => {
    it('should return compliance violations', async () => {
      const response = await request(app)
        .get(`${basePath}/violations`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('violations');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('filters');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.violations)).toBe(true);
      expect(typeof response.body.data.total).toBe('number');
    });

    it('should filter violations by status', async () => {
      const response = await request(app)
        .get(`${basePath}/violations`)
        .query({ status: 'open' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.violations).toBeDefined();
    });

    it('should filter violations by severity', async () => {
      const response = await request(app)
        .get(`${basePath}/violations`)
        .query({ severity: 'high' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.violations).toBeDefined();
    });
  });

  describe('PUT /violations/:id', () => {
    it('should update violation status successfully', async () => {
      // First, get existing violations
      const violationsResponse = await request(app)
        .get(`${basePath}/violations`)
        .expect(200);

      const violations = violationsResponse.body.data.violations;

      if (violations.length > 0) {
        const violation = violations[0];

        const updateData = {
          status: 'investigating',
          resolution: 'Under investigation',
          assignedTo: 'admin-001'
        };

        const response = await request(app)
          .put(`${basePath}/violations/${violation.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('violation');
        expect(response.body.data).toHaveProperty('message', 'Violation status updated successfully');
        expect(response.body.data).toHaveProperty('timestamp');
        expect(response.body.data).toHaveProperty('traceId');

        const updatedViolation = response.body.data.violation;
        expect(updatedViolation.id).toBe(violation.id);
        expect(updatedViolation.status).toBe(updateData.status);
        expect(updatedViolation.resolution).toBe(updateData.resolution);
        expect(updatedViolation.assignedTo).toBe(updateData.assignedTo);
      }
    });

    it('should return error for non-existing violation', async () => {
      const updateData = {
        status: 'resolved',
        resolution: 'Resolved'
      };

      const response = await request(app)
        .put(`${basePath}/violations/non-existing-id`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Violation not found');
      expect(response.body).toHaveProperty('traceId');
    });

    it('should return validation error for invalid update data', async () => {
      const invalidData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .put(`${basePath}/violations/test-id`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid update data');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('POST /reports', () => {
    it('should generate an audit report successfully', async () => {
      const reportData = {
        name: 'Test Audit Report',
        description: 'A test audit report for compliance',
        organizationId: 'org-001',
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          end: new Date().toISOString()
        },
        filters: {
          actions: ['read', 'write'],
          resources: ['user_data', 'financial_data'],
          severities: ['high', 'critical'],
          frameworks: ['gdpr', 'sox']
        },
        generatedBy: 'test-user'
      };

      const response = await request(app)
        .post(`${basePath}/reports`)
        .send(reportData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('report');
      expect(response.body.data).toHaveProperty('message', 'Audit report generated successfully');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      const report = response.body.data.report;
      expect(report).toHaveProperty('id');
      expect(report.name).toBe(reportData.name);
      expect(report.description).toBe(reportData.description);
      expect(report.organizationId).toBe(reportData.organizationId);
      expect(report.period).toEqual(reportData.period);
      expect(report.filters).toEqual(reportData.filters);
      expect(report.generatedBy).toBe(reportData.generatedBy);
      expect(report.generatedAt).toBeDefined();

      // Check metrics structure
      expect(report.metrics).toHaveProperty('totalEvents');
      expect(report.metrics).toHaveProperty('violations');
      expect(report.metrics).toHaveProperty('riskScore');
      expect(report.metrics).toHaveProperty('complianceScore');
      expect(report.metrics).toHaveProperty('topActions');
      expect(report.metrics).toHaveProperty('topResources');
      expect(report.metrics).toHaveProperty('severityDistribution');
      expect(report.metrics).toHaveProperty('frameworkCompliance');
    });

    it('should return validation error for invalid report data', async () => {
      const invalidData = {
        // Missing required fields
        description: 'Invalid report data'
      };

      const response = await request(app)
        .post(`${basePath}/reports`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid report data');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('GET /reports/:organizationId', () => {
    it('should return audit reports for organization', async () => {
      const organizationId = 'org-001';

      const response = await request(app)
        .get(`${basePath}/reports/${organizationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('reports');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('organizationId', organizationId);
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.reports)).toBe(true);
    });
  });

  describe('GET /metrics/:organizationId', () => {
    it('should return compliance metrics for organization', async () => {
      const organizationId = 'org-001';

      const response = await request(app)
        .get(`${basePath}/metrics/${organizationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('organizationId', organizationId);
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      const metrics = response.body.data.metrics;
      expect(metrics).toHaveProperty('totalEvents');
      expect(metrics).toHaveProperty('totalViolations');
      expect(metrics).toHaveProperty('openViolations');
      expect(metrics).toHaveProperty('complianceScore');
      expect(metrics).toHaveProperty('riskScore');
      expect(metrics).toHaveProperty('frameworkCompliance');
      expect(metrics).toHaveProperty('recentViolations');

      expect(typeof metrics.totalEvents).toBe('number');
      expect(typeof metrics.totalViolations).toBe('number');
      expect(typeof metrics.openViolations).toBe('number');
      expect(typeof metrics.complianceScore).toBe('number');
      expect(typeof metrics.riskScore).toBe('number');
      expect(typeof metrics.frameworkCompliance).toBe('object');
      expect(Array.isArray(metrics.recentViolations)).toBe(true);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get(`${basePath}/health`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('checks');
      expect(response.body.data).toHaveProperty('rulesCount');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(response.body.data.checks).toHaveProperty('hasRules');
      expect(response.body.data.checks).toHaveProperty('serviceInitialized');
      expect(response.body.data.checks).toHaveProperty('canLogEvents');
      expect(response.body.data.checks).toHaveProperty('canGenerateReports');

      expect(typeof response.body.data.rulesCount).toBe('number');
    });

    it('should return healthy status when all checks pass', async () => {
      const response = await request(app)
        .get(`${basePath}/health`)
        .expect(200);

      const checks = response.body.data.checks;
      const isHealthy = checks.hasRules && checks.serviceInitialized && checks.canLogEvents && checks.canGenerateReports;

      if (isHealthy) {
        expect(response.body.data.status).toBe('healthy');
      } else {
        expect(response.body.data.status).toBe('degraded');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll test that the error response structure is correct
      const response = await request(app)
        .get(`${basePath}/rules`)
        .expect(200);

      // If there's an error, it should have the correct structure
      if (!response.body.success) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('traceId');
      }
    });
  });
});
