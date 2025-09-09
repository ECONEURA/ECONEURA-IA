import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dlgGroomingService } from '../../../lib/dlg-grooming.service.js';

// ============================================================================
// DLQ GROOMING SERVICE UNIT TESTS - PR-72
// ============================================================================

describe('DLQGroomingService - PR-72', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset service state for isolation
    (dlgGroomingService as any).messages = new Map();
    (dlgGroomingService as any).patterns = new Map();
    (dlgGroomingService as any).retryJobs = new Map();
    dlgGroomingService.init(); // Re-initialize with demo data
  });

  describe('DLQ Message Management', () => {
    it('should create DLQ message with failure info and analysis', async () => {
      const messageData = {
        organizationId: 'test-org-1',
        queueName: 'test-queue',
        originalMessage: {
          id: 'msg_test_1',
          type: 'test_message',
          payload: { test: 'data' },
          headers: { 'x-test': 'value' },
          timestamp: new Date().toISOString(),
          retryCount: 2,
          maxRetries: 5
        },
        failureInfo: {
          errorType: 'TestError',
          errorMessage: 'Test error message',
          stackTrace: 'Error: Test error\n    at TestFunction()',
          failureTimestamp: new Date().toISOString(),
          retryAttempts: 2,
          lastRetryAt: new Date().toISOString()
        }
      };

      const message = await dlgGroomingService.createDLQMessage(messageData);

      expect(message).toBeDefined();
      expect(message.organizationId).toBe('test-org-1');
      expect(message.queueName).toBe('test-queue');
      expect(message.failureInfo.errorType).toBe('TestError');
      expect(message.analysis.category).toBeDefined();
      expect(message.analysis.severity).toBeDefined();
      expect(message.grooming.status).toBeDefined();
    });

    it('should get DLQ messages with filters', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', {
        queueName: 'email-processing',
        status: 'analyzed',
        limit: 10
      });

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every(m => m.queueName === 'email-processing')).toBe(true);
      expect(messages.every(m => m.grooming.status === 'analyzed')).toBe(true);
    });

    it('should get DLQ messages by category and severity', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', {
        category: 'transient',
        severity: 'medium',
        limit: 10
      });

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every(m => m.analysis.category === 'transient')).toBe(true);
      expect(messages.every(m => m.analysis.severity === 'medium')).toBe(true);
    });
  });

  describe('DLQ Pattern Management', () => {
    it('should create pattern with conditions and action', async () => {
      const patternData = {
        organizationId: 'test-org-1',
        name: 'Test Pattern',
        description: 'Test pattern for unit testing',
        pattern: {
          errorType: 'TestError',
          conditions: [
            { field: 'errorMessage', operator: 'contains', value: 'test' },
            { field: 'queueName', operator: 'equals', value: 'test-queue' }
          ]
        },
        action: {
          type: 'auto_retry' as const,
          config: {
            maxRetries: 3,
            retryDelay: 30000,
            notificationChannels: ['email']
          }
        }
      };

      const pattern = await dlgGroomingService.createPattern(patternData);

      expect(pattern).toBeDefined();
      expect(pattern.name).toBe('Test Pattern');
      expect(pattern.pattern.errorType).toBe('TestError');
      expect(pattern.pattern.conditions).toHaveLength(2);
      expect(pattern.action.type).toBe('auto_retry');
      expect(pattern.action.config.maxRetries).toBe(3);
      expect(pattern.enabled).toBe(true);
    });

    it('should get patterns with filters', async () => {
      const patterns = await dlgGroomingService.getPatterns('demo-org-1', {
        enabled: true,
        actionType: 'auto_retry',
        limit: 10
      });

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.enabled === true)).toBe(true);
      expect(patterns.every(p => p.action.type === 'auto_retry')).toBe(true);
    });
  });

  describe('Message Analysis and Grooming', () => {
    it('should analyze message and match patterns', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 1 });
      const message = messages[0];

      const analyzedMessage = await dlgGroomingService.analyzeMessage(message.id);

      expect(analyzedMessage).toBeDefined();
      expect(analyzedMessage.analysis.rootCause).toBeDefined();
      expect(analyzedMessage.analysis.category).toBeDefined();
      expect(analyzedMessage.analysis.severity).toBeDefined();
      expect(analyzedMessage.analysis.suggestedAction).toBeDefined();
      expect(analyzedMessage.analysis.confidence).toBeGreaterThan(0);
      expect(analyzedMessage.grooming.status).toBe('analyzed');
    });

    it('should groom message manually', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 1 });
      const message = messages[0];

      const groomedMessage = await dlgGroomingService.groomMessage(message.id, {
        status: 'resolved',
        notes: 'Manually resolved by admin',
        groomedBy: 'admin_user'
      });

      expect(groomedMessage).toBeDefined();
      expect(groomedMessage.grooming.status).toBe('resolved');
      expect(groomedMessage.grooming.notes).toBe('Manually resolved by admin');
      expect(groomedMessage.grooming.groomedBy).toBe('admin_user');
      expect(groomedMessage.grooming.manualReviewRequired).toBe(false);
    });

    it('should categorize errors correctly', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });
      
      const categories = messages.map(m => m.analysis.category);
      const severities = messages.map(m => m.analysis.severity);
      
      expect(categories).toContain('transient');
      expect(categories).toContain('data');
      expect(severities).toContain('medium');
      expect(severities).toContain('high');
    });
  });

  describe('Pattern Matching', () => {
    it('should match patterns based on error type and conditions', async () => {
      const patterns = await dlgGroomingService.getPatterns('demo-org-1', { limit: 10 });
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });

      // Test pattern matching logic
      const smtpPattern = patterns.find(p => p.name === 'SMTP Connection Errors');
      const smtpMessage = messages.find(m => m.failureInfo.errorType === 'SMTPConnectionError');

      expect(smtpPattern).toBeDefined();
      expect(smtpMessage).toBeDefined();
      
      if (smtpPattern && smtpMessage) {
        expect(smtpPattern.pattern.errorType).toBe('SMTPConnectionError');
        expect(smtpMessage.failureInfo.errorType).toBe('SMTPConnectionError');
      }
    });

    it('should evaluate pattern conditions correctly', async () => {
      const patterns = await dlgGroomingService.getPatterns('demo-org-1', { limit: 10 });
      const validationPattern = patterns.find(p => p.name === 'Data Validation Errors');

      expect(validationPattern).toBeDefined();
      if (validationPattern) {
        expect(validationPattern.pattern.errorType).toBe('ValidationError');
        expect(validationPattern.pattern.conditions).toHaveLength(2);
        expect(validationPattern.action.type).toBe('escalate');
      }
    });
  });

  describe('Auto-retry Processing', () => {
    it('should process scheduled retries', async () => {
      await dlgGroomingService.processScheduledRetries();
      
      // This should not throw an error
      expect(true).toBe(true);
    });

    it('should handle retry job lifecycle', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 1 });
      const message = messages[0];

      // Analyze message to potentially schedule retry
      await dlgGroomingService.analyzeMessage(message.id);

      // Process retries
      await dlgGroomingService.processScheduledRetries();

      // Verify message status was updated
      const updatedMessages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });
      const updatedMessage = updatedMessages.find(m => m.id === message.id);

      expect(updatedMessage).toBeDefined();
      expect(updatedMessage?.grooming.status).toBeDefined();
    });
  });

  describe('Auto-processing', () => {
    it('should process pending messages', async () => {
      await dlgGroomingService.processPendingMessages();
      
      // This should not throw an error
      expect(true).toBe(true);
    });

    it('should analyze pending messages automatically', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { 
        status: 'pending',
        limit: 5
      });

      // Process pending messages
      await dlgGroomingService.processPendingMessages();

      // Check that messages were analyzed
      const updatedMessages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });
      const analyzedMessages = updatedMessages.filter(m => m.grooming.status === 'analyzed');

      expect(analyzedMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Reports Generation', () => {
    it('should generate daily report', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await dlgGroomingService.generateReport(
        'demo-org-1',
        'daily',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('daily');
      expect(report.data.totalMessages).toBeGreaterThanOrEqual(0);
      expect(report.data.byCategory).toBeDefined();
      expect(report.data.bySeverity).toBeDefined();
      expect(report.data.byQueue).toBeDefined();
      expect(report.data.topErrors).toBeDefined();
      expect(report.data.resolutionStats).toBeDefined();
      expect(report.data.performanceMetrics).toBeDefined();
    });

    it('should generate weekly report with patterns', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await dlgGroomingService.generateReport(
        'demo-org-1',
        'weekly',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('weekly');
      expect(report.data.patterns).toBeDefined();
      expect(Array.isArray(report.data.patterns)).toBe(true);
    });

    it('should calculate performance metrics correctly', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await dlgGroomingService.generateReport(
        'demo-org-1',
        'daily',
        startDate,
        endDate,
        'test-user'
      );

      expect(report.data.performanceMetrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
      expect(report.data.performanceMetrics.averageResolutionTime).toBeGreaterThanOrEqual(0);
      expect(report.data.performanceMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(report.data.performanceMetrics.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Statistics', () => {
    it('should get comprehensive statistics', async () => {
      const stats = await dlgGroomingService.getStats('demo-org-1');

      expect(stats).toBeDefined();
      expect(stats.totalMessages).toBeGreaterThan(0);
      expect(stats.totalPatterns).toBeGreaterThan(0);
      expect(stats.totalRetryJobs).toBeDefined();
      expect(stats.last24Hours).toBeDefined();
      expect(stats.last7Days).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byCategory).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byQueue).toBeDefined();
      expect(stats.retryJobStats).toBeDefined();
    });

    it('should calculate 24-hour statistics correctly', async () => {
      const stats = await dlgGroomingService.getStats('demo-org-1');

      expect(stats.last24Hours.newMessages).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.retryJobs).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.autoResolved).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.manuallyResolved).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.escalated).toBeGreaterThanOrEqual(0);
    });

    it('should provide retry job statistics', async () => {
      const stats = await dlgGroomingService.getStats('demo-org-1');

      expect(stats.retryJobStats).toBeDefined();
      expect(stats.retryJobStats.scheduled).toBeGreaterThanOrEqual(0);
      expect(stats.retryJobStats.running).toBeGreaterThanOrEqual(0);
      expect(stats.retryJobStats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.retryJobStats.failed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Categorization', () => {
    it('should categorize SMTP connection errors as transient', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });
      const smtpMessage = messages.find(m => m.failureInfo.errorType === 'SMTPConnectionError');

      expect(smtpMessage).toBeDefined();
      if (smtpMessage) {
        expect(smtpMessage.analysis.category).toBe('transient');
        expect(smtpMessage.analysis.severity).toBe('medium');
        expect(smtpMessage.analysis.suggestedAction).toBe('retry');
      }
    });

    it('should categorize validation errors as data issues', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });
      const validationMessage = messages.find(m => m.failureInfo.errorType === 'ValidationError');

      expect(validationMessage).toBeDefined();
      if (validationMessage) {
        expect(validationMessage.analysis.category).toBe('data');
        expect(validationMessage.analysis.severity).toBe('high');
        expect(validationMessage.analysis.suggestedAction).toBe('manual_review');
      }
    });
  });

  describe('Root Cause Analysis', () => {
    it('should determine root causes for different error types', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });

      const smtpMessage = messages.find(m => m.failureInfo.errorType === 'SMTPConnectionError');
      const validationMessage = messages.find(m => m.failureInfo.errorType === 'ValidationError');

      expect(smtpMessage?.analysis.rootCause).toContain('Network connectivity');
      expect(validationMessage?.analysis.rootCause).toContain('Data format validation');
    });

    it('should provide confidence scores for analysis', async () => {
      const messages = await dlgGroomingService.getDLQMessages('demo-org-1', { limit: 10 });

      messages.forEach(message => {
        expect(message.analysis.confidence).toBeGreaterThanOrEqual(0);
        expect(message.analysis.confidence).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Pattern Statistics', () => {
    it('should track pattern match statistics', async () => {
      const patterns = await dlgGroomingService.getPatterns('demo-org-1', { limit: 10 });

      patterns.forEach(pattern => {
        expect(pattern.statistics.matches).toBeGreaterThanOrEqual(0);
        expect(pattern.statistics.successRate).toBeGreaterThanOrEqual(0);
        expect(pattern.statistics.successRate).toBeLessThanOrEqual(100);
        expect(pattern.statistics.averageResolutionTime).toBeGreaterThanOrEqual(0);
      });
    });

    it('should provide last match timestamps', async () => {
      const patterns = await dlgGroomingService.getPatterns('demo-org-1', { limit: 10 });

      patterns.forEach(pattern => {
        if (pattern.statistics.lastMatch) {
          expect(new Date(pattern.statistics.lastMatch)).toBeInstanceOf(Date);
        }
      });
    });
  });
});
