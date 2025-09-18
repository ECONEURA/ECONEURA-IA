import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIPerformanceOptimizationService } from '../../../services/ai-performance-optimization.service.js';

// Mock del servicio de base de datos
const mockDb = {
  query: vi.fn(),
  close: vi.fn()
};

// Mock del logger
vi.mock('../../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock del servicio de base de datos
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: () => mockDb
}));

describe('AIPerformanceOptimizationService', () => {
  let service: AIPerformanceOptimizationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIPerformanceOptimizationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recordPerformanceMetric', () => {
    it('should record a performance metric successfully', async () => {
      const metricData = {
        serviceName: 'ai-chat-service',
        metricType: 'latency' as const,
        value: 1500,
        unit: 'ms',
        metadata: { requestId: 'req-123' }
      };

      const mockResult = {
        rows: [{
          id: 'metric-123',
          service_name: metricData.serviceName,
          metric_type: metricData.metricType,
          value: metricData.value,
          unit: metricData.unit,
          timestamp: new Date(),
          metadata: JSON.stringify(metricData.metadata)
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await service.recordPerformanceMetric(metricData);

      expect(result).toBeDefined();
      expect(result.serviceName).toBe(metricData.serviceName);
      expect(result.metricType).toBe(metricData.metricType);
      expect(result.value).toBe(metricData.value);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_performance_metrics'),
        expect.arrayContaining([
          metricData.serviceName,
          metricData.metricType,
          metricData.value,
          metricData.unit,
          JSON.stringify(metricData.metadata)
        ])
      );
    });

    it('should handle database errors when recording metric', async () => {
      const metricData = {
        serviceName: 'ai-chat-service',
        metricType: 'latency' as const,
        value: 1500,
        unit: 'ms'
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.recordPerformanceMetric(metricData)).rejects.toThrow('Database error');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should retrieve performance metrics with filters', async () => {
      const mockMetrics = [
        {
          id: 'metric-1',
          service_name: 'ai-chat-service',
          metric_type: 'latency',
          value: 1500,
          unit: 'ms',
          timestamp: new Date(),
          metadata: {}
        },
        {
          id: 'metric-2',
          service_name: 'ai-chat-service',
          metric_type: 'throughput',
          value: 100,
          unit: 'req/min',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockMetrics });

      const result = await service.getPerformanceMetrics('ai-chat-service', 'latency', 50);

      expect(result).toHaveLength(2);
      expect(result[0].serviceName).toBe('ai-chat-service');
      expect(result[0].metricType).toBe('latency');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ai_performance_metrics'),
        expect.arrayContaining(['ai-chat-service', 'latency', 50])
      );
    });

    it('should retrieve all metrics when no filters provided', async () => {
      const mockMetrics = [
        {
          id: 'metric-1',
          service_name: 'ai-chat-service',
          metric_type: 'latency',
          value: 1500,
          unit: 'ms',
          timestamp: new Date(),
          metadata: {}
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockMetrics });

      const result = await service.getPerformanceMetrics();

      expect(result).toHaveLength(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM ai_performance_metrics'),
        expect.arrayContaining([100])
      );
    });
  });

  describe('createOptimizationRule', () => {
    it('should create an optimization rule successfully', async () => {
      const ruleData = {
        name: 'High Latency Rule',
        description: 'Alert when latency exceeds 5 seconds',
        condition: {
          metric: 'latency',
          operator: 'gt' as const,
          threshold: 5000,
          duration: 60
        },
        action: {
          type: 'scale_up' as const,
          parameters: { instances: 2 },
          priority: 'high' as const
        },
        isActive: true
      };

      const mockResult = {
        rows: [{
          id: 'rule-123',
          name: ruleData.name,
          description: ruleData.description,
          condition: JSON.stringify(ruleData.condition),
          action: JSON.stringify(ruleData.action),
          is_active: ruleData.isActive,
          created_at: new Date(),
          updated_at: new Date()
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await service.createOptimizationRule(ruleData);

      expect(result).toBeDefined();
      expect(result.name).toBe(ruleData.name);
      expect(result.condition).toEqual(ruleData.condition);
      expect(result.action).toEqual(ruleData.action);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_optimization_rules'),
        expect.arrayContaining([
          ruleData.name,
          ruleData.description,
          JSON.stringify(ruleData.condition),
          JSON.stringify(ruleData.action),
          ruleData.isActive
        ])
      );
    });
  });

  describe('getOptimizationRules', () => {
    it('should retrieve all optimization rules', async () => {
      const mockRules = [
        {
          id: 'rule-1',
          name: 'High Latency Rule',
          description: 'Alert when latency exceeds 5 seconds',
          condition: { metric: 'latency', operator: 'gt', threshold: 5000, duration: 60 },
          action: { type: 'scale_up', parameters: { instances: 2 }, priority: 'high' },
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockRules });

      const result = await service.getOptimizationRules();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('High Latency Rule');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM ai_optimization_rules ORDER BY created_at DESC'
      );
    });
  });

  describe('createPerformanceAlert', () => {
    it('should create a performance alert successfully', async () => {
      const alertData = {
        ruleId: 'rule-123',
        serviceName: 'ai-chat-service',
        metricType: 'latency',
        currentValue: 6000,
        threshold: 5000,
        severity: 'high' as const,
        status: 'active' as const,
        message: 'High latency detected',
        metadata: { ruleName: 'High Latency Rule' }
      };

      const mockResult = {
        rows: [{
          id: 'alert-123',
          rule_id: alertData.ruleId,
          service_name: alertData.serviceName,
          metric_type: alertData.metricType,
          current_value: alertData.currentValue,
          threshold: alertData.threshold,
          severity: alertData.severity,
          status: alertData.status,
          triggered_at: new Date(),
          resolved_at: null,
          message: alertData.message,
          metadata: JSON.stringify(alertData.metadata)
        }]
      };

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await service.createPerformanceAlert(alertData);

      expect(result).toBeDefined();
      expect(result.ruleId).toBe(alertData.ruleId);
      expect(result.severity).toBe(alertData.severity);
      expect(result.message).toBe(alertData.message);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ai_performance_alerts'),
        expect.arrayContaining([
          alertData.ruleId,
          alertData.serviceName,
          alertData.metricType,
          alertData.currentValue,
          alertData.threshold,
          alertData.severity,
          alertData.status,
          alertData.message,
          JSON.stringify(alertData.metadata)
        ])
      );
    });
  });

  describe('getPerformanceAlerts', () => {
    it('should retrieve performance alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          rule_id: 'rule-1',
          service_name: 'ai-chat-service',
          metric_type: 'latency',
          current_value: 6000,
          threshold: 5000,
          severity: 'high',
          status: 'active',
          triggered_at: new Date(),
          resolved_at: null,
          message: 'High latency detected',
          metadata: {}
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockAlerts });

      const result = await service.getPerformanceAlerts();

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('high');
      expect(result[0].status).toBe('active');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM ai_performance_alerts ORDER BY triggered_at DESC'
      );
    });
  });

  describe('optimizePerformance', () => {
    it('should optimize performance for high latency', async () => {
      const request = {
        serviceName: 'ai-chat-service',
        metricType: 'latency',
        value: 3000,
        metadata: { requestId: 'req-123' }
      };

      const result = await service.optimizePerformance(request);

      expect(result).toBeDefined();
      expect(result.optimized).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].type).toBe('scale_up');
      expect(result.recommendations).toContain('Consider implementing caching for frequently requested data');
      expect(result.metrics.before).toBe(3000);
      expect(result.metrics.after).toBeLessThan(3000);
    });

    it('should optimize performance for low accuracy', async () => {
      const request = {
        serviceName: 'ai-chat-service',
        metricType: 'accuracy',
        value: 0.8,
        metadata: { requestId: 'req-123' }
      };

      const result = await service.optimizePerformance(request);

      expect(result).toBeDefined();
      expect(result.optimized).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].type).toBe('model_switch');
      expect(result.recommendations).toContain('Review training data quality and model parameters');
    });

    it('should optimize performance for high cost', async () => {
      const request = {
        serviceName: 'ai-chat-service',
        metricType: 'cost',
        value: 0.02,
        metadata: { requestId: 'req-123' }
      };

      const result = await service.optimizePerformance(request);

      expect(result).toBeDefined();
      expect(result.optimized).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].type).toBe('model_switch');
      expect(result.recommendations).toContain('Implement request batching to reduce API calls');
    });

    it('should optimize performance for high error rate', async () => {
      const request = {
        serviceName: 'ai-chat-service',
        metricType: 'error_rate',
        value: 0.1,
        metadata: { requestId: 'req-123' }
      };

      const result = await service.optimizePerformance(request);

      expect(result).toBeDefined();
      expect(result.optimized).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].type).toBe('retry');
      expect(result.recommendations).toContain('Investigate root cause of errors and improve error handling');
    });

    it('should not optimize when metrics are within normal range', async () => {
      const request = {
        serviceName: 'ai-chat-service',
        metricType: 'latency',
        value: 1000,
        metadata: { requestId: 'req-123' }
      };

      const result = await service.optimizePerformance(request);

      expect(result).toBeDefined();
      expect(result.optimized).toBe(false);
      expect(result.actions).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('generateOptimizationReport', () => {
    it('should generate optimization report successfully', async () => {
      const serviceName = 'ai-chat-service';
      const reportType = 'daily' as const;
      const period = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-02')
      };

      const mockMetrics = [
        {
          id: 'metric-1',
          service_name: serviceName,
          metric_type: 'latency',
          value: 1500,
          unit: 'ms',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          metadata: {}
        },
        {
          id: 'metric-2',
          service_name: serviceName,
          metric_type: 'throughput',
          value: 100,
          unit: 'req/min',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          metadata: {}
        }
      ];

      mockDb.query
        .mockResolvedValueOnce({ rows: mockMetrics })
        .mockResolvedValueOnce({ rows: [] }); // Para el INSERT del reporte

      const result = await service.generateOptimizationReport(serviceName, reportType, period);

      expect(result).toBeDefined();
      expect(result.serviceName).toBe(serviceName);
      expect(result.reportType).toBe(reportType);
      expect(result.summary).toBeDefined();
      expect(result.optimizations).toHaveLength(3);
      expect(result.optimizations[0].type).toBe('latency_optimization');
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all services are working', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await service.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.services.database).toBe(true);
      expect(result.services.monitoring).toBe(true);
      expect(result.services.alerts).toBe(true);
    });

    it('should return degraded status when some services are failing', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await service.getHealthStatus();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database).toBe(false);
      expect(result.services.monitoring).toBe(false);
      expect(result.services.alerts).toBe(true);
    });
  });

  describe('evaluateCondition', () => {
    it('should evaluate greater than condition correctly', () => {
      const condition = {
        metric: 'latency',
        operator: 'gt' as const,
        threshold: 1000,
        duration: 60
      };

      // Acceder al método privado a través de la instancia
      const service = new AIPerformanceOptimizationService();
      const result = (service as any).evaluateCondition(condition, 1500);

      expect(result).toBe(true);
    });

    it('should evaluate less than condition correctly', () => {
      const condition = {
        metric: 'latency',
        operator: 'lt' as const,
        threshold: 1000,
        duration: 60
      };

      const service = new AIPerformanceOptimizationService();
      const result = (service as any).evaluateCondition(condition, 500);

      expect(result).toBe(true);
    });

    it('should evaluate equal condition correctly', () => {
      const condition = {
        metric: 'latency',
        operator: 'eq' as const,
        threshold: 1000,
        duration: 60
      };

      const service = new AIPerformanceOptimizationService();
      const result = (service as any).evaluateCondition(condition, 1000);

      expect(result).toBe(true);
    });
  });
});
