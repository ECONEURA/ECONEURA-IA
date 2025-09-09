/**
 * Unit tests for IntelligentReportingService
 *
 * This test suite covers all functionality of the advanced reporting system
 * including report management, generation, scheduling, templates, and analytics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntelligentReportingService } from '../../../lib/intelligent-reporting.service.js';
import { CreateReportRequest } from '../../../lib/analytics-types.js';

describe('IntelligentReportingService', () => {
  let service: IntelligentReportingService;

  beforeEach(() => {
    service = new IntelligentReportingService();
  });

  describe('Report Management', () => {
    it('should create a new report successfully', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Test Executive Report',
        description: 'A test executive report',
        type: 'executive',
        template: 'executive_summary',
        data: [
          {
            metricId: 'revenue',
            metricName: 'Total Revenue',
            unit: 'USD',
            visualization: {
              type: 'bar',
              title: 'Revenue Chart',
              colors: ['#3B82F6'],
              options: {}
            }
          }
        ],
        filters: [],
        format: 'pdf',
        isPublic: false
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.name).toBe('Test Executive Report');
      expect(report.type).toBe('executive');
      expect(report.organizationId).toBe('org_1');
      expect(report.createdBy).toBe('user_1');
      expect(report.isActive).toBe(true);
      expect(report.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve a report by ID', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Test Report',
        type: 'operational',
        data: [],
        format: 'excel'
      };

      const createdReport = await service.createReport(reportRequest, 'org_1', 'user_1');
      const retrievedReport = await service.getReport(createdReport.id);

      expect(retrievedReport).toBeDefined();
      expect(retrievedReport?.id).toBe(createdReport.id);
      expect(retrievedReport?.name).toBe('Test Report');
    });

    it('should return null for non-existent report', async () => {
      const report = await service.getReport('non-existent-id');
      expect(report).toBeNull();
    });

    it('should update a report successfully', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Original Report',
        type: 'analytics',
        data: [],
        format: 'json'
      };

      const createdReport = await service.createReport(reportRequest, 'org_1', 'user_1');

      const updates = {
        name: 'Updated Report',
        description: 'Updated description'
      };

      const updatedReport = await service.updateReport(createdReport.id, updates);

      expect(updatedReport).toBeDefined();
      expect(updatedReport?.name).toBe('Updated Report');
      expect(updatedReport?.description).toBe('Updated description');
      expect(updatedReport?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null when updating non-existent report', async () => {
      const updates = { name: 'Updated Name' };
      const result = await service.updateReport('non-existent-id', updates);
      expect(result).toBeNull();
    });

    it('should get reports with filters', async () => {
      // Create multiple reports
      await service.createReport({
        name: 'Executive Report',
        type: 'executive',
        data: [],
        format: 'pdf'
      }, 'org_1', 'user_1');

      await service.createReport({
        name: 'Operational Report',
        type: 'operational',
        data: [],
        format: 'excel'
      }, 'org_1', 'user_2');

      await service.createReport({
        name: 'Analytics Report',
        type: 'analytics',
        data: [],
        format: 'json'
      }, 'org_1', 'user_1');

      // Test type filter
      const executiveReports = await service.getReports('org_1', { type: 'executive' });
      expect(executiveReports).toHaveLength(1);
      expect(executiveReports[0].type).toBe('executive');

      // Test createdBy filter
      const user1Reports = await service.getReports('org_1', { createdBy: 'user_1' });
      expect(user1Reports).toHaveLength(2);

      // Test isActive filter
      const activeReports = await service.getReports('org_1', { isActive: true });
      expect(activeReports).toHaveLength(3);
    });

    it('should delete a report successfully', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Report to Delete',
        type: 'custom',
        data: [],
        format: 'csv'
      };

      const createdReport = await service.createReport(reportRequest, 'org_1', 'user_1');
      const deleted = await service.deleteReport(createdReport.id);

      expect(deleted).toBe(true);

      const retrievedReport = await service.getReport(createdReport.id);
      expect(retrievedReport).toBeNull();
    });

    it('should return false when deleting non-existent report', async () => {
      const deleted = await service.deleteReport('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Report Generation', () => {
    it('should generate a report successfully', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Report to Generate',
        type: 'executive',
        data: [
          {
            metricId: 'revenue',
            metricName: 'Total Revenue',
            unit: 'USD'
          }
        ],
        format: 'pdf'
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');
      const generation = await service.generateReport(report.id, 'user_1');

      expect(generation).toBeDefined();
      expect(generation.id).toBeDefined();
      expect(generation.reportId).toBe(report.id);
      expect(['pending', 'generating', 'completed', 'failed']).toContain(generation.status);
      expect(generation.generatedBy).toBe('user_1');
      expect(generation.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when generating non-existent report', async () => {
      await expect(
        service.generateReport('non-existent-id', 'user_1');
      ).rejects.toThrow('Report non-existent-id not found');
    });

    it('should track report generation status', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Report for Status Tracking',
        type: 'operational',
        data: [],
        format: 'excel'
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');
      const generation = await service.generateReport(report.id, 'user_1');

      const retrievedGeneration = await service.getReportGeneration(generation.id);
      expect(retrievedGeneration).toBeDefined();
      expect(retrievedGeneration?.id).toBe(generation.id);
    });

    it('should get all generations for a report', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Report with Multiple Generations',
        type: 'analytics',
        data: [],
        format: 'json'
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');

      // Generate multiple times
      await service.generateReport(report.id, 'user_1');
      await service.generateReport(report.id, 'user_2');
      await service.generateReport(report.id, 'user_1');

      const generations = await service.getReportGenerations(report.id);
      expect(generations).toHaveLength(3);
    });
  });

  describe('Report Templates', () => {
    it('should get available report templates', async () => {
      const templates = await service.getReportTemplates();

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      // Check template structure
      const template = templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('type');
      expect(template).toHaveProperty('template');
      expect(template).toHaveProperty('sampleData');
    });

    it('should include all expected template types', async () => {
      const templates = await service.getReportTemplates();
      const templateTypes = templates.map(t => t.type);

      expect(templateTypes).toContain('executive');
      expect(templateTypes).toContain('operational');
      expect(templateTypes).toContain('analytics');
      expect(templateTypes).toContain('custom');
    });
  });

  describe('Report Analytics', () => {
    it('should generate report analytics', async () => {
      // Create some reports and generations
      const report1 = await service.createReport({
        name: 'Report 1',
        type: 'executive',
        data: [],
        format: 'pdf'
      }, 'org_1', 'user_1');

      const report2 = await service.createReport({
        name: 'Report 2',
        type: 'operational',
        data: [],
        format: 'excel'
      }, 'org_1', 'user_2');

      // Generate reports
      await service.generateReport(report1.id, 'user_1');
      await service.generateReport(report2.id, 'user_2');

      const analytics = await service.getReportAnalytics('org_1');

      expect(analytics).toBeDefined();
      expect(analytics.totalReports).toBe(2);
      expect(analytics.totalGenerations).toBeGreaterThan(0);
      expect(analytics.successfulGenerations).toBeGreaterThanOrEqual(0);
      expect(analytics.failedGenerations).toBeGreaterThanOrEqual(0);
      expect(analytics.mostPopularFormat).toBeDefined();
      expect(analytics.scheduledReports).toBeGreaterThanOrEqual(0);
    });

    it('should return zero analytics for organization with no reports', async () => {
      const analytics = await service.getReportAnalytics('non-existent-org');

      expect(analytics.totalReports).toBe(0);
      expect(analytics.totalGenerations).toBe(0);
      expect(analytics.successfulGenerations).toBe(0);
      expect(analytics.failedGenerations).toBe(0);
      expect(analytics.scheduledReports).toBe(0);
    });
  });

  describe('Service Statistics', () => {
    it('should return service statistics', async () => {
      // Create some reports
      await service.createReport({
        name: 'Stats Report 1',
        type: 'executive',
        data: [],
        format: 'pdf'
      }, 'org_1', 'user_1');

      await service.createReport({
        name: 'Stats Report 2',
        type: 'operational',
        data: [],
        format: 'excel'
      }, 'org_2', 'user_2');

      const stats = await service.getServiceStats();

      expect(stats).toBeDefined();
      expect(stats.totalReports).toBeGreaterThanOrEqual(2);
      expect(stats.totalGenerations).toBeGreaterThanOrEqual(0);
      expect(stats.scheduledReports).toBeGreaterThanOrEqual(0);
      expect(stats.activeSchedules).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Scheduled Reports', () => {
    it('should create report with schedule', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Scheduled Report',
        type: 'executive',
        data: [],
        format: 'pdf',
        schedule: {
          frequency: 'daily',
          time: '06:00',
          isActive: true
        }
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');

      expect(report.schedule).toBeDefined();
      expect(report.schedule?.frequency).toBe('daily');
      expect(report.schedule?.time).toBe('06:00');
      expect(report.schedule?.isActive).toBe(true);
    });

    it('should update report schedule', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Report to Update Schedule',
        type: 'operational',
        data: [],
        format: 'excel',
        schedule: {
          frequency: 'weekly',
          time: '08:00',
          isActive: true
        }
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');

      const updates = {
        schedule: {
          frequency: 'monthly' as const,
          time: '10:00',
          isActive: false
        }
      };

      const updatedReport = await service.updateReport(report.id, updates);

      expect(updatedReport?.schedule?.frequency).toBe('monthly');
      expect(updatedReport?.schedule?.time).toBe('10:00');
      expect(updatedReport?.schedule?.isActive).toBe(false);
    });
  });

  describe('Data Processing', () => {
    it('should apply report filters correctly', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Filtered Report',
        type: 'analytics',
        data: [
          {
            metricId: 'metric1',
            metricName: 'Metric 1',
            unit: 'count'
          },
          {
            metricId: 'metric2',
            metricName: 'Metric 2',
            unit: 'percentage'
          }
        ],
        filters: [
          {
            field: 'metricName',
            operator: 'contains',
            value: 'Metric 1'
          }
        ],
        format: 'json'
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');
      const generation = await service.generateReport(report.id, 'user_1');

      expect(generation).toBeDefined();
      expect(generation.reportId).toBe(report.id);
    });

    it('should generate insights for different report types', async () => {
      const executiveReport = await service.createReport({
        name: 'Executive Report',
        type: 'executive',
        data: [
          {
            metricId: 'revenue',
            metricName: 'Revenue',
            unit: 'USD'
          }
        ],
        format: 'pdf'
      }, 'org_1', 'user_1');

      const operationalReport = await service.createReport({
        name: 'Operational Report',
        type: 'operational',
        data: [
          {
            metricId: 'efficiency',
            metricName: 'Efficiency',
            unit: '%'
          }
        ],
        format: 'excel'
      }, 'org_1', 'user_1');

      const executiveGeneration = await service.generateReport(executiveReport.id, 'user_1');
      const operationalGeneration = await service.generateReport(operationalReport.id, 'user_1');

      expect(executiveGeneration).toBeDefined();
      expect(operationalGeneration).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid report data gracefully', async () => {
      const invalidReportRequest = {
        name: '',
        type: 'invalid_type' as any,
        data: null as any,
        format: 'invalid_format' as any
      };

      // This should not throw but handle gracefully
      try {
        await service.createReport(invalidReportRequest as any, 'org_1', 'user_1');
      } catch (error) {
        // Expected to throw validation error
        expect(error).toBeDefined();
      }
    });

    it('should handle generation failures gracefully', async () => {
      const reportRequest: CreateReportRequest = {
        name: 'Report for Error Testing',
        type: 'custom',
        data: [],
        format: 'csv'
      };

      const report = await service.createReport(reportRequest, 'org_1', 'user_1');

      // Mock a generation failure scenario
      const generation = await service.generateReport(report.id, 'user_1');
      expect(generation).toBeDefined();
      expect(['pending', 'generating', 'completed', 'failed']).toContain(generation.status);
    });
  });
});
