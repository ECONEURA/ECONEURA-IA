import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedAuditComplianceService } from '../../../lib/advanced-audit-compliance.service.js';

describe('AdvancedAuditComplianceService', () => {
  let service: AdvancedAuditComplianceService;

  beforeEach(() => {
    service = new AdvancedAuditComplianceService();
  });

  describe('logAuditEvent', () => {
    it('should log an audit event successfully', async () => {
      const eventData = {
        userId: 'user-001',
        organizationId: 'org-001',
        action: 'read',
        resource: 'user_data',
        resourceId: 'user-123',
        details: { field: 'email' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        severity: 'medium' as const,
        compliance: {
          gdpr: true,
          sox: false,
          pci: false,
          hipaa: false,
          iso27001: true
        },
        riskScore: 65,
        tags: ['data_access']
      };

      const event = await service.logAuditEvent(eventData);
      
      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
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
        severity: 'low' as const,
        compliance: {
          gdpr: false,
          sox: false,
          pci: false,
          hipaa: false,
          iso27001: false
        },
        riskScore: 30
      };

      const event = await service.logAuditEvent(eventData);
      
      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.userId).toBe(eventData.userId);
      expect(event.action).toBe(eventData.action);
      expect(event.resource).toBe(eventData.resource);
    });
  });

  describe('getAuditEvents', () => {
    it('should return all audit events without filters', async () => {
      const result = await service.getAuditEvents();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.events)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should filter events by organization', async () => {
      const result = await service.getAuditEvents({ organizationId: 'org-001' });
      
      expect(result).toBeDefined();
      expect(result.events.every(e => e.organizationId === 'org-001')).toBe(true);
    });

    it('should filter events by severity', async () => {
      const result = await service.getAuditEvents({ severity: 'high' });
      
      expect(result).toBeDefined();
      expect(result.events.every(e => e.severity === 'high')).toBe(true);
    });

    it('should respect pagination parameters', async () => {
      const result = await service.getAuditEvents({ limit: 5, offset: 0 });
      
      expect(result).toBeDefined();
      expect(result.events.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getComplianceRules', () => {
    it('should return all compliance rules', async () => {
      const rules = await service.getComplianceRules();
      
      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      
      // Check structure of first rule
      const firstRule = rules[0];
      expect(firstRule).toHaveProperty('id');
      expect(firstRule).toHaveProperty('name');
      expect(firstRule).toHaveProperty('description');
      expect(firstRule).toHaveProperty('framework');
      expect(firstRule).toHaveProperty('conditions');
      expect(firstRule).toHaveProperty('actions');
      expect(firstRule).toHaveProperty('isActive');
      expect(firstRule).toHaveProperty('createdAt');
      expect(firstRule).toHaveProperty('updatedAt');
    });
  });

  describe('createComplianceRule', () => {
    it('should create a new compliance rule', async () => {
      const ruleData = {
        name: 'Test Rule',
        description: 'A test compliance rule',
        framework: 'gdpr' as const,
        conditions: {
          action: ['read', 'write'],
          severity: ['high', 'critical'],
          timeWindow: 60,
          threshold: 5
        },
        actions: {
          alert: true,
          block: false,
          notify: ['admin@company.com'],
          escalate: true
        },
        isActive: true
      };

      const rule = await service.createComplianceRule(ruleData);
      
      expect(rule).toBeDefined();
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe(ruleData.name);
      expect(rule.description).toBe(ruleData.description);
      expect(rule.framework).toBe(ruleData.framework);
      expect(rule.conditions).toEqual(ruleData.conditions);
      expect(rule.actions).toEqual(ruleData.actions);
      expect(rule.isActive).toBe(ruleData.isActive);
      expect(rule.createdAt).toBeDefined();
      expect(rule.updatedAt).toBeDefined();
    });
  });

  describe('getViolations', () => {
    it('should return all violations without filters', async () => {
      const result = await service.getViolations();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should filter violations by status', async () => {
      const result = await service.getViolations({ status: 'open' });
      
      expect(result).toBeDefined();
      expect(result.violations.every(v => v.status === 'open')).toBe(true);
    });

    it('should filter violations by severity', async () => {
      const result = await service.getViolations({ severity: 'high' });
      
      expect(result).toBeDefined();
      expect(result.violations.every(v => v.severity === 'high')).toBe(true);
    });
  });

  describe('updateViolationStatus', () => {
    it('should update violation status successfully', async () => {
      // First create a violation by logging an event that triggers a rule
      const eventData = {
        userId: 'user-001',
        organizationId: 'org-001',
        action: 'read',
        resource: 'user_data',
        severity: 'high' as const,
        compliance: {
          gdpr: true,
          sox: false,
          pci: false,
          hipaa: false,
          iso27001: true
        },
        riskScore: 85
      };

      await service.logAuditEvent(eventData);
      
      // Get violations to find one to update
      const { violations } = await service.getViolations();
      if (violations.length > 0) {
        const violation = violations[0];
        
        const updatedViolation = await service.updateViolationStatus(
          violation.id,
          'investigating',
          'Under investigation',
          'admin-001'
        );
        
        expect(updatedViolation).toBeDefined();
        expect(updatedViolation.id).toBe(violation.id);
        expect(updatedViolation.status).toBe('investigating');
        expect(updatedViolation.resolution).toBe('Under investigation');
        expect(updatedViolation.assignedTo).toBe('admin-001');
      }
    });

    it('should throw error for non-existing violation', async () => {
      await expect(
        service.updateViolationStatus('non-existing-id', 'resolved')
      ).rejects.toThrow('Violation not found');
    });
  });

  describe('generateAuditReport', () => {
    it('should generate an audit report successfully', async () => {
      const reportData = {
        name: 'Test Report',
        description: 'A test audit report',
        organizationId: 'org-001',
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          end: new Date().toISOString()
        },
        filters: {
          actions: ['read', 'write'],
          severities: ['high', 'critical']
        },
        generatedBy: 'test-user'
      };

      const report = await service.generateAuditReport(reportData);
      
      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
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
      
      expect(typeof report.metrics.totalEvents).toBe('number');
      expect(typeof report.metrics.violations).toBe('number');
      expect(typeof report.metrics.riskScore).toBe('number');
      expect(typeof report.metrics.complianceScore).toBe('number');
      expect(Array.isArray(report.metrics.topActions)).toBe(true);
      expect(Array.isArray(report.metrics.topResources)).toBe(true);
      expect(typeof report.metrics.severityDistribution).toBe('object');
      expect(typeof report.metrics.frameworkCompliance).toBe('object');
    });
  });

  describe('getAuditReports', () => {
    it('should return reports for organization', async () => {
      const reports = await service.getAuditReports('org-001');
      
      expect(reports).toBeDefined();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.every(r => r.organizationId === 'org-001')).toBe(true);
    });

    it('should return empty array for non-existing organization', async () => {
      const reports = await service.getAuditReports('non-existing-org');
      
      expect(reports).toBeDefined();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(0);
    });
  });

  describe('getComplianceMetrics', () => {
    it('should return compliance metrics for organization', async () => {
      const metrics = await service.getComplianceMetrics('org-001');
      
      expect(metrics).toBeDefined();
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

  describe('default rules initialization', () => {
    it('should have GDPR rule initialized', async () => {
      const rules = await service.getComplianceRules();
      const gdprRule = rules.find(r => r.framework === 'gdpr');
      
      expect(gdprRule).toBeDefined();
      expect(gdprRule?.name).toBe('GDPR Data Access Monitoring');
      expect(gdprRule?.isActive).toBe(true);
    });

    it('should have SOX rule initialized', async () => {
      const rules = await service.getComplianceRules();
      const soxRule = rules.find(r => r.framework === 'sox');
      
      expect(soxRule).toBeDefined();
      expect(soxRule?.name).toBe('SOX Financial Data Access');
      expect(soxRule?.isActive).toBe(true);
    });

    it('should have PCI rule initialized', async () => {
      const rules = await service.getComplianceRules();
      const pciRule = rules.find(r => r.framework === 'pci');
      
      expect(pciRule).toBeDefined();
      expect(pciRule?.name).toBe('PCI Card Data Protection');
      expect(pciRule?.isActive).toBe(true);
    });
  });

  describe('compliance rule evaluation', () => {
    it('should create violation when rule conditions are met', async () => {
      // Log multiple high-severity events to trigger a rule
      for (let i = 0; i < 3; i++) {
        await service.logAuditEvent({
          userId: `user-${i}`,
          organizationId: 'org-001',
          action: 'read',
          resource: 'user_data',
          severity: 'high',
          compliance: {
            gdpr: true,
            sox: false,
            pci: false,
            hipaa: false,
            iso27001: true
          },
          riskScore: 85
        });
      }
      
      // Check if violations were created
      const { violations } = await service.getViolations();
      expect(violations.length).toBeGreaterThan(0);
    });
  });
});
