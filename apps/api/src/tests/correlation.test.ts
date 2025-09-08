import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  correlationMiddleware,
  correlationLoggingMiddleware,
  correlationPropagationMiddleware,
  correlationErrorMiddleware,
  getCorrelationContext,
  createChildSpanFromRequest,
  logWithCorrelation,
  addCorrelationToResponse,
  createMockCorrelationRequest,
  createMockCorrelationResponse,
} from '../middleware/correlation';
import {
  generateCorrelationId,
  generateRequestId,
  generateTraceId,
  generateSpanId,
  isValidCorrelationId,
  isValidRequestId,
  isValidTraceId,
  isValidSpanId,
  extractCorrelationId,
  extractRequestId,
  extractTraceId,
  extractSpanId,
  extractParentSpanId,
  createCorrelationContext,
  createCorrelationHeaders,
  propagateCorrelationId,
  createChildSpan,
  addCorrelationToLog,
  createLogContext,
  getCorrelationIdFromRequest,
  setCorrelationIdOnResponse,
  addCorrelationToRequest,
  withCorrelationContext,
  getCurrentCorrelationContext,
} from '@econeura/shared/correlation';

// ============================================================================
// TEST SETUP
// ============================================================================

const app = express();
app.use(express.json());

// Test routes
app.get('/test-correlation', correlationMiddleware, (req: any, res: any) => {
  res.json({
    success: true,
    correlationId: req.correlationId,
    requestId: req.requestId,
    traceId: req.traceId,
    spanId: req.spanId,
    parentSpanId: req.parentSpanId,
  });
});

app.get('/test-correlation-logging', correlationMiddleware, correlationLoggingMiddleware, (req: any, res: any) => {
  res.json({ success: true });
});

app.get('/test-correlation-propagation', correlationMiddleware, correlationPropagationMiddleware, (req: any, res: any) => {
  res.json({ success: true });
});

app.get('/test-correlation-error', correlationMiddleware, (req: any, res: any, next: any) => {
  next(new Error('Test error'));
});

// Apply error handler
app.use(correlationErrorMiddleware);

// ============================================================================
// CORRELATION UTILITIES TESTS
// ============================================================================

describe('Correlation Utilities', () => {
  beforeEach(() => {
    // Reset any mocks or state
  });

  afterEach(() => {
    // Clean up
  });

  // ============================================================================
  // CORRELATION ID GENERATION TESTS
  // ============================================================================

  describe('Correlation ID Generation', () => {
    it('should generate valid correlation IDs', () => {
      const correlationId = generateCorrelationId();
      expect(correlationId).toMatch(/^corr_\d+_[a-f0-9]{8}$/);
      expect(isValidCorrelationId(correlationId)).toBe(true);
    });

    it('should generate valid request IDs', () => {
      const requestId = generateRequestId();
      expect(requestId).toMatch(/^req_\d+_[a-f0-9]{8}$/);
      expect(isValidRequestId(requestId)).toBe(true);
    });

    it('should generate valid trace IDs', () => {
      const traceId = generateTraceId();
      expect(traceId).toMatch(/^trace_\d+_[a-f0-9]{8}$/);
      expect(isValidTraceId(traceId)).toBe(true);
    });

    it('should generate valid span IDs', () => {
      const spanId = generateSpanId();
      expect(spanId).toMatch(/^span_\d+_[a-f0-9]{8}$/);
      expect(isValidSpanId(spanId)).toBe(true);
    });
  });

  // ============================================================================
  // CORRELATION ID VALIDATION TESTS
  // ============================================================================

  describe('Correlation ID Validation', () => {
    it('should validate correlation IDs correctly', () => {
      expect(isValidCorrelationId('corr_1234567890_abcdef12')).toBe(true);
      expect(isValidCorrelationId('invalid')).toBe(false);
      expect(isValidCorrelationId('')).toBe(false);
      expect(isValidCorrelationId(null as any)).toBe(false);
      expect(isValidCorrelationId(undefined as any)).toBe(false);
    });

    it('should validate request IDs correctly', () => {
      expect(isValidRequestId('req_1234567890_abcdef12')).toBe(true);
      expect(isValidRequestId('invalid')).toBe(false);
      expect(isValidRequestId('')).toBe(false);
      expect(isValidRequestId(null as any)).toBe(false);
      expect(isValidRequestId(undefined as any)).toBe(false);
    });

    it('should validate trace IDs correctly', () => {
      expect(isValidTraceId('trace_1234567890_abcdef12')).toBe(true);
      expect(isValidTraceId('invalid')).toBe(false);
      expect(isValidTraceId('')).toBe(false);
      expect(isValidTraceId(null as any)).toBe(false);
      expect(isValidTraceId(undefined as any)).toBe(false);
    });

    it('should validate span IDs correctly', () => {
      expect(isValidSpanId('span_1234567890_abcdef12')).toBe(true);
      expect(isValidSpanId('invalid')).toBe(false);
      expect(isValidSpanId('')).toBe(false);
      expect(isValidSpanId(null as any)).toBe(false);
      expect(isValidSpanId(undefined as any)).toBe(false);
    });
  });

  // ============================================================================
  // CORRELATION ID EXTRACTION TESTS
  // ============================================================================

  describe('Correlation ID Extraction', () => {
    it('should extract correlation ID from headers', () => {
      const headers = {
        'x-correlation-id': 'corr_1234567890_abcdef12',
        'x-request-id': 'req_1234567890_abcdef12',
        'x-trace-id': 'trace_1234567890_abcdef12',
        'x-span-id': 'span_1234567890_abcdef12',
        'x-parent-span-id': 'span_0987654321_fedcba98',
      };

      expect(extractCorrelationId(headers)).toBe('corr_1234567890_abcdef12');
      expect(extractRequestId(headers)).toBe('req_1234567890_abcdef12');
      expect(extractTraceId(headers)).toBe('trace_1234567890_abcdef12');
      expect(extractSpanId(headers)).toBe('span_1234567890_abcdef12');
      expect(extractParentSpanId(headers)).toBe('span_0987654321_fedcba98');
    });

    it('should handle array headers', () => {
      const headers = {
        'x-correlation-id': ['corr_1234567890_abcdef12'],
        'x-request-id': ['req_1234567890_abcdef12'],
        'x-trace-id': ['trace_1234567890_abcdef12'],
        'x-span-id': ['span_1234567890_abcdef12'],
        'x-parent-span-id': ['span_0987654321_fedcba98'],
      };

      expect(extractCorrelationId(headers)).toBe('corr_1234567890_abcdef12');
      expect(extractRequestId(headers)).toBe('req_1234567890_abcdef12');
      expect(extractTraceId(headers)).toBe('trace_1234567890_abcdef12');
      expect(extractSpanId(headers)).toBe('span_1234567890_abcdef12');
      expect(extractParentSpanId(headers)).toBe('span_0987654321_fedcba98');
    });

    it('should return null for invalid headers', () => {
      const headers = {
        'x-correlation-id': 'invalid',
        'x-request-id': 'invalid',
        'x-trace-id': 'invalid',
        'x-span-id': 'invalid',
        'x-parent-span-id': 'invalid',
      };

      expect(extractCorrelationId(headers)).toBe(null);
      expect(extractRequestId(headers)).toBe(null);
      expect(extractTraceId(headers)).toBe(null);
      expect(extractSpanId(headers)).toBe(null);
      expect(extractParentSpanId(headers)).toBe(null);
    });
  });

  // ============================================================================
  // CORRELATION CONTEXT TESTS
  // ============================================================================

  describe('Correlation Context', () => {
    it('should create correlation context from headers', () => {
      const headers = {
        'x-correlation-id': 'corr_1234567890_abcdef12',
        'x-request-id': 'req_1234567890_abcdef12',
        'x-trace-id': 'trace_1234567890_abcdef12',
        'x-span-id': 'span_1234567890_abcdef12',
        'x-parent-span-id': 'span_0987654321_fedcba98',
      };

      const context = createCorrelationContext(headers);

      expect(context).toMatchObject({
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: 'span_1234567890_abcdef12',
        parentSpanId: 'span_0987654321_fedcba98',
      });
    });

    it('should generate new IDs when headers are missing', () => {
      const headers = {};

      const context = createCorrelationContext(headers);

      expect(context.correlationId).toMatch(/^corr_\d+_[a-f0-9]{8}$/);
      expect(context.requestId).toMatch(/^req_\d+_[a-f0-9]{8}$/);
      expect(context.traceId).toMatch(/^trace_\d+_[a-f0-9]{8}$/);
      expect(context.spanId).toMatch(/^span_\d+_[a-f0-9]{8}$/);
      expect(context.parentSpanId).toBeUndefined();
    });

    it('should create correlation headers from context', () => {
      const context = {
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: 'span_1234567890_abcdef12',
        parentSpanId: 'span_0987654321_fedcba98',
      };

      const headers = createCorrelationHeaders(context);

      expect(headers).toMatchObject({
        'x-correlation-id': 'corr_1234567890_abcdef12',
        'x-request-id': 'req_1234567890_abcdef12',
        'x-trace-id': 'trace_1234567890_abcdef12',
        'x-span-id': 'span_1234567890_abcdef12',
        'x-parent-span-id': 'span_0987654321_fedcba98',
      });
    });
  });

  // ============================================================================
  // CORRELATION PROPAGATION TESTS
  // ============================================================================

  describe('Correlation Propagation', () => {
    it('should propagate correlation IDs', () => {
      const sourceHeaders = {
        'x-correlation-id': 'corr_1234567890_abcdef12',
        'x-request-id': 'req_1234567890_abcdef12',
        'x-trace-id': 'trace_1234567890_abcdef12',
        'x-span-id': 'span_1234567890_abcdef12',
        'x-parent-span-id': 'span_0987654321_fedcba98',
      };

      const targetHeaders = propagateCorrelationId(sourceHeaders);

      expect(targetHeaders).toMatchObject({
        'x-correlation-id': 'corr_1234567890_abcdef12',
        'x-request-id': 'req_1234567890_abcdef12',
        'x-trace-id': 'trace_1234567890_abcdef12',
        'x-span-id': 'span_1234567890_abcdef12',
        'x-parent-span-id': 'span_0987654321_fedcba98',
      });
    });

    it('should create child spans', () => {
      const parentContext = {
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: 'span_1234567890_abcdef12',
        parentSpanId: 'span_0987654321_fedcba98',
      };

      const childContext = createChildSpan(parentContext, 'test-operation');

      expect(childContext).toMatchObject({
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
        parentSpanId: 'span_1234567890_abcdef12',
      });
    });
  });

  // ============================================================================
  // CORRELATION LOGGING TESTS
  // ============================================================================

  describe('Correlation Logging', () => {
    it('should add correlation to log data', () => {
      const context = {
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: 'span_1234567890_abcdef12',
        parentSpanId: 'span_0987654321_fedcba98',
      };

      const logData = { message: 'Test log' };
      const enrichedLogData = addCorrelationToLog(logData, context);

      expect(enrichedLogData).toMatchObject({
        message: 'Test log',
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: 'span_1234567890_abcdef12',
        parentSpanId: 'span_0987654321_fedcba98',
      });
    });

    it('should create log context', () => {
      const context = {
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: 'span_1234567890_abcdef12',
        parentSpanId: 'span_0987654321_fedcba98',
      };

      const additionalData = { operation: 'test' };
      const logContext = createLogContext(context, additionalData);

      expect(logContext).toMatchObject({
        operation: 'test',
        correlationId: 'corr_1234567890_abcdef12',
        requestId: 'req_1234567890_abcdef12',
        traceId: 'trace_1234567890_abcdef12',
        spanId: 'span_1234567890_abcdef12',
        parentSpanId: 'span_0987654321_fedcba98',
      });
    });
  });
});

// ============================================================================
// CORRELATION MIDDLEWARE TESTS
// ============================================================================

describe('Correlation Middleware', () => {
  beforeEach(() => {
    // Reset any mocks or state
  });

  afterEach(() => {
    // Clean up
  });

  // ============================================================================
  // CORRELATION MIDDLEWARE TESTS
  // ============================================================================

  describe('Correlation Middleware', () => {
    it('should add correlation IDs to request and response', async () => {
      const response = await request(app)
        .get('/test-correlation')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
        requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
        traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
        spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
      });

      expect(response.headers['x-correlation-id']).toMatch(/^corr_\d+_[a-f0-9]{8}$/);
      expect(response.headers['x-request-id']).toMatch(/^req_\d+_[a-f0-9]{8}$/);
      expect(response.headers['x-trace-id']).toMatch(/^trace_\d+_[a-f0-9]{8}$/);
      expect(response.headers['x-span-id']).toMatch(/^span_\d+_[a-f0-9]{8}$/);
    });

    it('should use provided correlation IDs', async () => {
      const correlationId = 'corr_1234567890_abcdef12';
      const requestId = 'req_1234567890_abcdef12';
      const traceId = 'trace_1234567890_abcdef12';
      const spanId = 'span_1234567890_abcdef12';
      const parentSpanId = 'span_0987654321_fedcba98';

      const response = await request(app)
        .get('/test-correlation')
        .set('X-Correlation-ID', correlationId)
        .set('X-Request-ID', requestId)
        .set('X-Trace-ID', traceId)
        .set('X-Span-ID', spanId)
        .set('X-Parent-Span-ID', parentSpanId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        correlationId,
        requestId,
        traceId,
        spanId,
        parentSpanId,
      });

      expect(response.headers['x-correlation-id']).toBe(correlationId);
      expect(response.headers['x-request-id']).toBe(requestId);
      expect(response.headers['x-trace-id']).toBe(traceId);
      expect(response.headers['x-span-id']).toBe(spanId);
      expect(response.headers['x-parent-span-id']).toBe(parentSpanId);
    });

    it('should handle invalid correlation IDs', async () => {
      const response = await request(app)
        .get('/test-correlation')
        .set('X-Correlation-ID', 'invalid')
        .set('X-Request-ID', 'invalid')
        .set('X-Trace-ID', 'invalid')
        .set('X-Span-ID', 'invalid')
        .set('X-Parent-Span-ID', 'invalid')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
        requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
        traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
        spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
      });
    });
  });

  // ============================================================================
  // CORRELATION LOGGING MIDDLEWARE TESTS
  // ============================================================================

  describe('Correlation Logging Middleware', () => {
    it('should log request start and end', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const response = await request(app)
        .get('/test-correlation-logging')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Request started:',
        expect.objectContaining({
          correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
          requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
          traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
          spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
          event: 'request_start',
          method: 'GET',
          path: '/test-correlation-logging',
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Request completed:',
        expect.objectContaining({
          correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
          requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
          traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
          spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
          event: 'request_end',
          method: 'GET',
          path: '/test-correlation-logging',
          statusCode: 200,
          duration: expect.any(Number),
        })
      );

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // CORRELATION ERROR MIDDLEWARE TESTS
  // ============================================================================

  describe('Correlation Error Middleware', () => {
    it('should handle errors with correlation context', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const response = await request(app)
        .get('/test-correlation-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: expect.any(String),
          message: 'Test error',
          timestamp: expect.any(String),
          statusCode: 500,
          path: '/test-correlation-error',
          method: 'GET',
        }),
        correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
      });

      expect(response.headers['x-correlation-id']).toMatch(/^corr_\d+_[a-f0-9]{8}$/);
      expect(response.headers['x-request-id']).toMatch(/^req_\d+_[a-f0-9]{8}$/);
      expect(response.headers['x-trace-id']).toMatch(/^trace_\d+_[a-f0-9]{8}$/);
      expect(response.headers['x-span-id']).toMatch(/^span_\d+_[a-f0-9]{8}$/);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Request error:',
        expect.objectContaining({
          correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
          requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
          traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
          spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
          event: 'error',
          method: 'GET',
          path: '/test-correlation-error',
        })
      );

      consoleSpy.mockRestore();
    });
  });
});

// ============================================================================
// CORRELATION UTILITIES TESTS
// ============================================================================

describe('Correlation Utilities', () => {
  it('should create mock correlation request', () => {
    const mockRequest = createMockCorrelationRequest();

    expect(mockRequest).toMatchObject({
      correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
      requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
      traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
      spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
      correlationContext: expect.objectContaining({
        correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
        requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
        traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
        spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
      }),
      headers: expect.objectContaining({
        'x-correlation-id': expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
        'x-request-id': expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
        'x-trace-id': expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
        'x-span-id': expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
      }),
    });
  });

  it('should create mock correlation response', () => {
    const mockResponse = createMockCorrelationResponse();

    expect(mockResponse).toMatchObject({
      correlationId: expect.stringMatching(/^corr_\d+_[a-f0-9]{8}$/),
      requestId: expect.stringMatching(/^req_\d+_[a-f0-9]{8}$/),
      traceId: expect.stringMatching(/^trace_\d+_[a-f0-9]{8}$/),
      spanId: expect.stringMatching(/^span_\d+_[a-f0-9]{8}$/),
      setHeader: expect.any(Function),
    });
  });
});

// Import vi for mocking
import { vi } from 'vitest';
