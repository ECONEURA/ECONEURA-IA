/**
 * Observability OpenTelemetry Integration Tests
 * PR-103: Observabilidad/OTel (api) - propagación y trazas
 * 
 * Tests de integración para el servicio de observabilidad OpenTelemetry
 */

import request from 'supertest';
import { Express } from 'express';
import { observabilityOTelService } from '../../services/observability-otel.service.js';
import { tracePropagationMiddleware, traceLoggingMiddleware } from '../../middleware/trace-propagation.middleware.js';

// Mock de la aplicación Express
let app: Express;

describe('Observability OpenTelemetry Integration Tests', () => {
  beforeAll(async () => {
    // Configurar aplicación de prueba
    const express = await import('express');
    app = express.default();
    
    // Aplicar middleware de observabilidad
    app.use(tracePropagationMiddleware());
    app.use(traceLoggingMiddleware());
    
    // Montar rutas de observabilidad
    const observabilityRouter = await import('../../routes/observability-otel.js');
    app.use('/v1/observability-otel', observabilityRouter.default);
    
    // Ruta de prueba
    app.get('/test', (req, res) => {
      res.json({ message: 'Test endpoint' });
    });
  });

  describe('GET /v1/observability-otel/config', () => {
    it('should return observability configuration', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data).toHaveProperty('tracing');
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('logging');
      expect(response.body.data.service.name).toBe('econeura-api');
      expect(response.body.data.tracing.enabled).toBe(true);
      expect(response.body.data.metrics.enabled).toBe(true);
    });
  });

  describe('GET /v1/observability-otel/spans/metrics', () => {
    it('should return span metrics', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/spans/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSpans');
      expect(response.body.data).toHaveProperty('activeSpans');
      expect(response.body.data).toHaveProperty('completedSpans');
      expect(response.body.data).toHaveProperty('errorSpans');
      expect(response.body.data).toHaveProperty('averageDuration');
      expect(response.body.data).toHaveProperty('p95Duration');
      expect(response.body.data).toHaveProperty('p99Duration');
    });
  });

  describe('GET /v1/observability-otel/spans/active', () => {
    it('should return active spans', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/spans/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('spans');
      expect(Array.isArray(response.body.data.spans)).toBe(true);
    });
  });

  describe('GET /v1/observability-otel/service/metrics', () => {
    it('should return service metrics', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/service/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data).toHaveProperty('latency');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('resources');
      expect(response.body.data.requests).toHaveProperty('total');
      expect(response.body.data.requests).toHaveProperty('successful');
      expect(response.body.data.requests).toHaveProperty('failed');
    });
  });

  describe('GET /v1/observability-otel/trace/context', () => {
    it('should return trace context', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/trace/context')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('traceContext');
      expect(response.body.data).toHaveProperty('currentSpan');
    });
  });

  describe('GET /v1/observability-otel/trace/current', () => {
    it('should return current trace information', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/trace/current')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('traceId');
      expect(response.body.data).toHaveProperty('spanId');
      expect(response.body.data).toHaveProperty('span');
    });
  });

  describe('POST /v1/observability-otel/spans/create', () => {
    it('should create a new span', async () => {
      const spanData = {
        name: 'test-span',
        kind: 'INTERNAL',
        attributes: {
          'test.attribute': 'test-value'
        }
      };

      const response = await request(app)
        .post('/v1/observability-otel/spans/create')
        .send(spanData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('spanId');
      expect(response.body.data).toHaveProperty('traceId');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.name).toBe('test-span');
    });

    it('should return error for invalid span name', async () => {
      const response = await request(app)
        .post('/v1/observability-otel/spans/create')
        .send({ name: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid span name');
    });
  });

  describe('POST /v1/observability-otel/spans/business', () => {
    it('should create a business span', async () => {
      const businessData = {
        operation: 'test-operation',
        organizationId: 'org-123',
        attributes: {
          'business.attribute': 'test-value'
        }
      };

      const response = await request(app)
        .post('/v1/observability-otel/spans/business')
        .send(businessData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('spanId');
      expect(response.body.data).toHaveProperty('traceId');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.name).toBe('business.test-operation');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/v1/observability-otel/spans/business')
        .send({ operation: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /v1/observability-otel/spans/database', () => {
    it('should create a database span', async () => {
      const dbData = {
        operation: 'SELECT',
        table: 'users',
        attributes: {
          'db.attribute': 'test-value'
        }
      };

      const response = await request(app)
        .post('/v1/observability-otel/spans/database')
        .send(dbData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('spanId');
      expect(response.body.data).toHaveProperty('traceId');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.name).toBe('db.SELECT');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/v1/observability-otel/spans/database')
        .send({ operation: 'SELECT' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /v1/observability-otel/spans/external', () => {
    it('should create an external API span', async () => {
      const externalData = {
        service: 'external-service',
        endpoint: 'https://api.example.com/data',
        attributes: {
          'external.attribute': 'test-value'
        }
      };

      const response = await request(app)
        .post('/v1/observability-otel/spans/external')
        .send(externalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('spanId');
      expect(response.body.data).toHaveProperty('traceId');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.name).toBe('external.external-service');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/v1/observability-otel/spans/external')
        .send({ service: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /v1/observability-otel/execute/span', () => {
    it('should execute operation with span', async () => {
      const executeData = {
        name: 'test-execution',
        operation: 'test-operation',
        attributes: {
          'execution.attribute': 'test-value'
        }
      };

      const response = await request(app)
        .post('/v1/observability-otel/execute/span')
        .send(executeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('result');
      expect(response.body.data.result).toBe('Operation completed successfully');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/v1/observability-otel/execute/span')
        .send({ name: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /v1/observability-otel/execute/http', () => {
    it('should execute HTTP operation with span', async () => {
      const httpData = {
        operation: 'http-test-operation',
        attributes: {
          'http.attribute': 'test-value'
        }
      };

      const response = await request(app)
        .post('/v1/observability-otel/execute/http')
        .send(httpData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('result');
      expect(response.body.data.result).toBe('HTTP operation completed successfully');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/v1/observability-otel/execute/http')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /v1/observability-otel/errors/trace', () => {
    it('should trace an error', async () => {
      const errorData = {
        error: {
          name: 'TestError',
          message: 'Test error message',
          stack: 'Error stack trace'
        },
        context: {
          'error.context': 'test-value'
        }
      };

      const response = await request(app)
        .post('/v1/observability-otel/errors/trace')
        .send(errorData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Error traced successfully');
    });

    it('should return error for missing error data', async () => {
      const response = await request(app)
        .post('/v1/observability-otel/errors/trace')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('GET /v1/observability-otel/status', () => {
    it('should return observability status', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data).toHaveProperty('tracing');
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('logging');
      expect(response.body.data).toHaveProperty('performance');
      expect(response.body.data.service.name).toBe('econeura-api');
      expect(response.body.data.tracing.enabled).toBe(true);
      expect(response.body.data.metrics.enabled).toBe(true);
    });
  });

  describe('GET /v1/observability-otel/health', () => {
    it('should return health check', async () => {
      const response = await request(app)
        .get('/v1/observability-otel/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('features');
      expect(response.body.data).toHaveProperty('capabilities');
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('Observability OpenTelemetry');
      expect(Array.isArray(response.body.data.features)).toBe(true);
      expect(response.body.data.capabilities.tracing).toBe(true);
      expect(response.body.data.capabilities.metrics).toBe(true);
      expect(response.body.data.capabilities.logging).toBe(true);
    });
  });

  describe('Trace Propagation', () => {
    it('should propagate trace headers in requests', async () => {
      const response = await request(app)
        .get('/test')
        .set('X-Trace-Id', 'test-trace-id')
        .set('X-Span-Id', 'test-span-id')
        .set('X-Request-ID', 'test-request-id')
        .set('X-Correlation-ID', 'test-correlation-id')
        .expect(200);

      expect(response.headers['x-trace-id']).toBeDefined();
      expect(response.headers['x-span-id']).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['traceparent']).toBeDefined();
    });

    it('should generate trace headers when not provided', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-trace-id']).toBeDefined();
      expect(response.headers['x-span-id']).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['traceparent']).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should have observability service instance', () => {
      expect(observabilityOTelService).toBeDefined();
      expect(observabilityOTelService.getConfig).toBeDefined();
      expect(observabilityOTelService.getSpanMetrics).toBeDefined();
      expect(observabilityOTelService.getServiceMetrics).toBeDefined();
    });

    it('should return valid configuration', () => {
      const config = observabilityOTelService.getConfig();
      expect(config).toHaveProperty('service');
      expect(config).toHaveProperty('tracing');
      expect(config).toHaveProperty('metrics');
      expect(config).toHaveProperty('logging');
      expect(config.service.name).toBe('econeura-api');
    });

    it('should return valid span metrics', () => {
      const spanMetrics = observabilityOTelService.getSpanMetrics();
      expect(spanMetrics).toHaveProperty('totalSpans');
      expect(spanMetrics).toHaveProperty('activeSpans');
      expect(spanMetrics).toHaveProperty('completedSpans');
      expect(spanMetrics).toHaveProperty('errorSpans');
      expect(typeof spanMetrics.totalSpans).toBe('number');
      expect(typeof spanMetrics.activeSpans).toBe('number');
    });

    it('should return valid service metrics', () => {
      const serviceMetrics = observabilityOTelService.getServiceMetrics();
      expect(serviceMetrics).toHaveProperty('requests');
      expect(serviceMetrics).toHaveProperty('latency');
      expect(serviceMetrics).toHaveProperty('errors');
      expect(serviceMetrics).toHaveProperty('resources');
      expect(typeof serviceMetrics.requests.total).toBe('number');
      expect(typeof serviceMetrics.requests.successful).toBe('number');
      expect(typeof serviceMetrics.requests.failed).toBe('number');
    });
  });
});
