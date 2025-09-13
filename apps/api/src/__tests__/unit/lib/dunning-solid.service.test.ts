import { describe, it, expect, beforeEach } from 'vitest';
import { DunningSolidService, type DunningSegment, type DunningKPI, type DLQMessage, type DunningRetry } from '../../../lib/dunning-solid.service.js';

describe('DunningSolidService', () => {
  let service: DunningSolidService;

  beforeEach(() => {
    service = new DunningSolidService();
  });

  describe('createSegment', () => {
    it('should create a new dunning segment successfully', async () => {
      const segmentData = {
        name: 'Test Segment',
        description: 'Test segment for dunning',
        criteria: {
          overdueDays: { min: 1, max: 30 },
          amountRange: { min: 0, max: 1000 },
          customerType: 'both' as const,
          riskLevel: 'low' as const
        },
        strategy: {
          maxRetries: 3,
          retryInterval: 24,
          escalationSteps: 2,
          communicationChannels: ['email', 'sms'] as const,
          priority: 'low' as const
        },
        kpis: {
          targetCollectionRate: 0.85,
          targetResponseTime: 48,
          maxDunningDuration: 30,
          acceptableFailureRate: 0.05
        },
        isActive: true
      };

      const segment = await service.createSegment(segmentData);

      expect(segment).toBeDefined();
      expect(segment).toHaveProperty('id');
      expect(segment).toHaveProperty('name');
      expect(segment).toHaveProperty('description');
      expect(segment).toHaveProperty('criteria');
      expect(segment).toHaveProperty('strategy');
      expect(segment).toHaveProperty('kpis');
      expect(segment).toHaveProperty('isActive');
      expect(segment).toHaveProperty('createdAt');
      expect(segment).toHaveProperty('updatedAt');

      expect(segment.name).toBe('Test Segment');
      expect(segment.description).toBe('Test segment for dunning');
      expect(segment.criteria.overdueDays.min).toBe(1);
      expect(segment.criteria.overdueDays.max).toBe(30);
      expect(segment.strategy.maxRetries).toBe(3);
      expect(segment.kpis.targetCollectionRate).toBe(0.85);
      expect(segment.isActive).toBe(true);
    });

    it('should create segment with all required fields', async () => {
      const segmentData = {
        name: 'Complete Segment',
        description: 'Complete segment with all fields',
        criteria: {
          overdueDays: { min: 31, max: 90 },
          amountRange: { min: 1001, max: 10000 },
          customerType: 'business' as const,
          riskLevel: 'medium' as const,
          industry: ['technology', 'finance'],
          region: ['US', 'EU']
        },
        strategy: {
          maxRetries: 4,
          retryInterval: 12,
          escalationSteps: 3,
          communicationChannels: ['email', 'call', 'sms'] as const,
          priority: 'medium' as const
        },
        kpis: {
          targetCollectionRate: 0.75,
          targetResponseTime: 24,
          maxDunningDuration: 45,
          acceptableFailureRate: 0.1
        },
        isActive: true
      };

      const segment = await service.createSegment(segmentData);

      expect(segment.criteria.industry).toEqual(['technology', 'finance']);
      expect(segment.criteria.region).toEqual(['US', 'EU']);
      expect(segment.strategy.communicationChannels).toEqual(['email', 'call', 'sms']);
      expect(segment.strategy.priority).toBe('medium');
    });
  });

  describe('updateSegment', () => {
    it('should update an existing segment successfully', async () => {
      const segmentData = {
        name: 'Original Segment',
        description: 'Original description',
        criteria: {
          overdueDays: { min: 1, max: 30 },
          amountRange: { min: 0, max: 1000 },
          customerType: 'both' as const,
          riskLevel: 'low' as const
        },
        strategy: {
          maxRetries: 3,
          retryInterval: 24,
          escalationSteps: 2,
          communicationChannels: ['email'] as const,
          priority: 'low' as const
        },
        kpis: {
          targetCollectionRate: 0.85,
          targetResponseTime: 48,
          maxDunningDuration: 30,
          acceptableFailureRate: 0.05
        },
        isActive: true
      };

      const segment = await service.createSegment(segmentData);
      const updates = {
        name: 'Updated Segment',
        description: 'Updated description',
        strategy: {
          ...segmentData.strategy,
          maxRetries: 5,
          priority: 'high' as const
        }
      };

      // Esperar un poco para asegurar que el timestamp sea diferente
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const updatedSegment = await service.updateSegment(segment.id, updates);

      expect(updatedSegment.name).toBe('Updated Segment');
      expect(updatedSegment.description).toBe('Updated description');
      expect(updatedSegment.strategy.maxRetries).toBe(5);
      expect(updatedSegment.strategy.priority).toBe('high');
      expect(updatedSegment.updatedAt).not.toBe(segment.updatedAt);
    });

    it('should throw error for non-existent segment', async () => {
      const updates = {
        name: 'Updated Segment'
      };

      await expect(
        service.updateSegment('non-existent-id', updates)
      ).rejects.toThrow('Segment not found');
    });
  });

  describe('getSegments', () => {
    it('should return all segments', () => {
      const segments = service.getSegments();

      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);
      
      // Verificar que incluye los segmentos por defecto
      const segmentNames = segments.map(s => s.name);
      expect(segmentNames).toContain('Low Risk - Small Amounts');
      expect(segmentNames).toContain('Medium Risk - Medium Amounts');
      expect(segmentNames).toContain('High Risk - Large Amounts');
    });
  });

  describe('getSegment', () => {
    it('should return specific segment by ID', () => {
      const segments = service.getSegments();
      const firstSegment = segments[0];

      const segment = service.getSegment(firstSegment.id);

      expect(segment).toBeDefined();
      expect(segment?.id).toBe(firstSegment.id);
      expect(segment?.name).toBe(firstSegment.name);
    });

    it('should return null for non-existent segment', () => {
      const segment = service.getSegment('non-existent-id');
      expect(segment).toBeNull();
    });
  });

  describe('addToDLQ', () => {
    it('should add message to DLQ successfully', async () => {
      const dlqMessage = await service.addToDLQ(
        'original-msg-123',
        'dunning-queue',
        'dunning_step',
        { invoiceId: 'inv-123', customerId: 'cust-456' },
        'Network timeout',
        'org-123',
        'high'
      );

      expect(dlqMessage).toBeDefined();
      expect(dlqMessage).toHaveProperty('id');
      expect(dlqMessage).toHaveProperty('originalMessageId');
      expect(dlqMessage).toHaveProperty('queueName');
      expect(dlqMessage).toHaveProperty('messageType');
      expect(dlqMessage).toHaveProperty('payload');
      expect(dlqMessage).toHaveProperty('failureReason');
      expect(dlqMessage).toHaveProperty('retryCount');
      expect(dlqMessage).toHaveProperty('maxRetries');
      expect(dlqMessage).toHaveProperty('status');
      expect(dlqMessage).toHaveProperty('priority');
      expect(dlqMessage).toHaveProperty('organizationId');

      expect(dlqMessage.originalMessageId).toBe('original-msg-123');
      expect(dlqMessage.queueName).toBe('dunning-queue');
      expect(dlqMessage.messageType).toBe('dunning_step');
      expect(dlqMessage.failureReason).toBe('Network timeout');
      expect(dlqMessage.retryCount).toBe(0);
      expect(dlqMessage.status).toBe('pending');
      expect(dlqMessage.priority).toBe('high');
      expect(dlqMessage.organizationId).toBe('org-123');
    });

    it('should set default priority when not specified', async () => {
      const dlqMessage = await service.addToDLQ(
        'original-msg-456',
        'dunning-queue',
        'escalation',
        { invoiceId: 'inv-456' },
        'Processing error',
        'org-456'
      );

      expect(dlqMessage.priority).toBe('medium');
    });
  });

  describe('retryDLQMessage', () => {
    it('should retry DLQ message successfully', async () => {
      const dlqMessage = await service.addToDLQ(
        'original-msg-789',
        'dunning-queue',
        'notification',
        { invoiceId: 'inv-789' },
        'Delivery failed',
        'org-789',
        'medium'
      );

      const retry = await service.retryDLQMessage(dlqMessage.id);

      expect(retry).toBeDefined();
      expect(retry).toHaveProperty('id');
      expect(retry).toHaveProperty('messageId');
      expect(retry).toHaveProperty('attemptNumber');
      expect(retry).toHaveProperty('status');
      expect(retry).toHaveProperty('scheduledAt');
      expect(retry).toHaveProperty('retryStrategy');
      expect(retry).toHaveProperty('backoffMultiplier');
      expect(retry).toHaveProperty('maxBackoffTime');

      expect(retry.messageId).toBe(dlqMessage.id);
      expect(retry.attemptNumber).toBe(1);
      expect(retry.status).toBe('pending');
      expect(retry.retryStrategy).toBe('exponential_backoff');
    });

    it('should increment retry count in DLQ message', async () => {
      const dlqMessage = await service.addToDLQ(
        'original-msg-999',
        'dunning-queue',
        'retry',
        { invoiceId: 'inv-999' },
        'Timeout error',
        'org-999',
        'high'
      );

      await service.retryDLQMessage(dlqMessage.id);

      const updatedMessage = service.getDLQMessages().find(msg => msg.id === dlqMessage.id);
      expect(updatedMessage?.retryCount).toBe(1);
      expect(updatedMessage?.status).toBe('processing');
    });

    it('should throw error for non-existent DLQ message', async () => {
      await expect(
        service.retryDLQMessage('non-existent-id')
      ).rejects.toThrow('DLQ message not found');
    });

    it('should throw error when maximum retries exceeded', async () => {
      const dlqMessage = await service.addToDLQ(
        'original-msg-max',
        'dunning-queue',
        'dunning_step',
        { invoiceId: 'inv-max' },
        'Persistent error',
        'org-max',
        'low'
      );

      // Simular que ya se alcanzó el máximo de reintentos
      dlqMessage.retryCount = dlqMessage.maxRetries;

      await expect(
        service.retryDLQMessage(dlqMessage.id)
      ).rejects.toThrow('Maximum retries exceeded');
    });
  });

  describe('getKPIs', () => {
    it('should return KPIs for all segments', () => {
      const kpis = service.getKPIs();

      expect(Array.isArray(kpis)).toBe(true);
      expect(kpis.length).toBeGreaterThan(0);

      // Verificar estructura de KPI
      const firstKPI = kpis[0];
      expect(firstKPI).toHaveProperty('id');
      expect(firstKPI).toHaveProperty('segmentId');
      expect(firstKPI).toHaveProperty('metric');
      expect(firstKPI).toHaveProperty('value');
      expect(firstKPI).toHaveProperty('target');
      expect(firstKPI).toHaveProperty('unit');
      expect(firstKPI).toHaveProperty('period');
      expect(firstKPI).toHaveProperty('timestamp');
      expect(firstKPI).toHaveProperty('status');
      expect(firstKPI).toHaveProperty('trend');
    });

    it('should filter KPIs by segment ID', () => {
      const segments = service.getSegments();
      const firstSegment = segments[0];

      const kpis = service.getKPIs(firstSegment.id);

      expect(kpis.every(kpi => kpi.segmentId === firstSegment.id)).toBe(true);
    });

    it('should filter KPIs by period', () => {
      const kpis = service.getKPIs(undefined, 'daily');

      expect(kpis.every(kpi => kpi.period === 'daily')).toBe(true);
    });
  });

  describe('getDLQMessages', () => {
    it('should return all DLQ messages', async () => {
      // Añadir algunos mensajes de prueba
      await service.addToDLQ('msg-1', 'queue-1', 'dunning_step', {}, 'Error 1', 'org-1');
      await service.addToDLQ('msg-2', 'queue-2', 'escalation', {}, 'Error 2', 'org-2');

      const messages = service.getDLQMessages();

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter DLQ messages by status', async () => {
      await service.addToDLQ('msg-status', 'queue-status', 'notification', {}, 'Error', 'org-status');

      const pendingMessages = service.getDLQMessages('pending');
      expect(pendingMessages.every(msg => msg.status === 'pending')).toBe(true);
    });

    it('should filter DLQ messages by priority', async () => {
      await service.addToDLQ('msg-priority', 'queue-priority', 'retry', {}, 'Error', 'org-priority', 'high');

      const highPriorityMessages = service.getDLQMessages(undefined, 'high');
      expect(highPriorityMessages.every(msg => msg.priority === 'high')).toBe(true);
    });
  });

  describe('getRetries', () => {
    it('should return all retries', async () => {
      const dlqMessage = await service.addToDLQ('msg-retry', 'queue-retry', 'dunning_step', {}, 'Error', 'org-retry');
      await service.retryDLQMessage(dlqMessage.id);

      const retries = service.getRetries();

      expect(Array.isArray(retries)).toBe(true);
      expect(retries.length).toBeGreaterThan(0);
    });

    it('should filter retries by message ID', async () => {
      const dlqMessage = await service.addToDLQ('msg-filter', 'queue-filter', 'escalation', {}, 'Error', 'org-filter');
      await service.retryDLQMessage(dlqMessage.id);

      const retries = service.getRetries(dlqMessage.id);

      expect(retries.every(retry => retry.messageId === dlqMessage.id)).toBe(true);
    });

    it('should filter retries by status', async () => {
      const dlqMessage = await service.addToDLQ('msg-status-filter', 'queue-status-filter', 'notification', {}, 'Error', 'org-status-filter');
      await service.retryDLQMessage(dlqMessage.id);

      const pendingRetries = service.getRetries(undefined, 'pending');
      expect(pendingRetries.every(retry => retry.status === 'pending')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive dunning statistics', () => {
      const stats = service.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalInvoices');
      expect(stats).toHaveProperty('overdueInvoices');
      expect(stats).toHaveProperty('collectedAmount');
      expect(stats).toHaveProperty('pendingAmount');
      expect(stats).toHaveProperty('collectionRate');
      expect(stats).toHaveProperty('averageCollectionTime');
      expect(stats).toHaveProperty('segmentStats');
      expect(stats).toHaveProperty('dlqStats');
      expect(stats).toHaveProperty('kpiStats');
      expect(stats).toHaveProperty('lastUpdated');

      expect(typeof stats.totalInvoices).toBe('number');
      expect(typeof stats.overdueInvoices).toBe('number');
      expect(typeof stats.collectedAmount).toBe('number');
      expect(typeof stats.pendingAmount).toBe('number');
      expect(typeof stats.collectionRate).toBe('number');
      expect(typeof stats.averageCollectionTime).toBe('number');
      expect(typeof stats.segmentStats).toBe('object');
      expect(typeof stats.dlqStats).toBe('object');
      expect(typeof stats.kpiStats).toBe('object');
    });

    it('should include DLQ statistics', () => {
      const stats = service.getStats();

      expect(stats.dlqStats).toHaveProperty('totalMessages');
      expect(stats.dlqStats).toHaveProperty('pendingRetries');
      expect(stats.dlqStats).toHaveProperty('deadMessages');
      expect(stats.dlqStats).toHaveProperty('retrySuccessRate');
      expect(stats.dlqStats).toHaveProperty('avgRetryTime');

      expect(typeof stats.dlqStats.totalMessages).toBe('number');
      expect(typeof stats.dlqStats.pendingRetries).toBe('number');
      expect(typeof stats.dlqStats.deadMessages).toBe('number');
      expect(typeof stats.dlqStats.retrySuccessRate).toBe('number');
      expect(typeof stats.dlqStats.avgRetryTime).toBe('number');
    });

    it('should include KPI statistics', () => {
      const stats = service.getStats();

      expect(stats.kpiStats).toHaveProperty('onTarget');
      expect(stats.kpiStats).toHaveProperty('belowTarget');
      expect(stats.kpiStats).toHaveProperty('aboveTarget');
      expect(stats.kpiStats).toHaveProperty('critical');

      expect(typeof stats.kpiStats.onTarget).toBe('number');
      expect(typeof stats.kpiStats.belowTarget).toBe('number');
      expect(typeof stats.kpiStats.aboveTarget).toBe('number');
      expect(typeof stats.kpiStats.critical).toBe('number');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration successfully', () => {
      const newConfig = {
        enabled: false,
        maxRetries: 3,
        retryIntervals: [1, 12, 48],
        dlqRetentionDays: 15,
        kpiCalculationInterval: 30,
        autoEscalation: false,
        notificationEnabled: false
      };

      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });

    it('should update escalation thresholds', () => {
      const newConfig = {
        escalationThresholds: {
          collectionRate: 0.9,
          responseTime: 12,
          failureRate: 0.05
        }
      };

      expect(() => service.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop service without errors', () => {
      expect(() => service.stop()).not.toThrow();
    });
  });
});
