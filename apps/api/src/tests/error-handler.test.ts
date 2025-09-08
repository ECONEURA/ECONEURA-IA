import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import {
  createErrorHandler,
  createNotFoundHandler,
  createHealthCheckErrorHandler,
  asyncHandler,
  errorBoundary,
} from '../middleware/error-handler';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ExternalServiceError,
  BusinessLogicError,
  ResourceNotFoundError,
  RateLimitError,
  ERROR_CODES,
} from '@econeura/shared/errors';

// ============================================================================
// TEST SETUP
// ============================================================================

const app = express();
app.use(express.json());

// Test routes
app.get('/test-success', (req, res) => {
  res.json({ success: true, message: 'Success' });
});

app.get('/test-app-error', (req, res, next) => {
  next(new AppError(ERROR_CODES.VALIDATION_ERROR, 'Test validation error'));
});

app.get('/test-validation-error', (req, res, next) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });
  
  try {
    schema.parse({ name: '', email: 'invalid' });
  } catch (error) {
    next(error);
  }
});

app.get('/test-authentication-error', (req, res, next) => {
  next(new AuthenticationError(ERROR_CODES.AUTH_REQUIRED, 'Authentication required'));
});

app.get('/test-authorization-error', (req, res, next) => {
  next(new AuthorizationError('Insufficient permissions'));
});

app.get('/test-database-error', (req, res, next) => {
  next(new DatabaseError('Database connection failed'));
});

app.get('/test-external-service-error', (req, res, next) => {
  next(new ExternalServiceError('External API timeout'));
});

app.get('/test-business-logic-error', (req, res, next) => {
  next(new BusinessLogicError('Business rule violation'));
});

app.get('/test-resource-not-found', (req, res, next) => {
  next(new ResourceNotFoundError('User'));
});

app.get('/test-rate-limit-error', (req, res, next) => {
  next(new RateLimitError('Rate limit exceeded'));
});

app.get('/test-generic-error', (req, res, next) => {
  next(new Error('Generic error'));
});

app.get('/test-async-error', asyncHandler(async (req, res) => {
  throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR, 'Async error');
}));

app.get('/test-error-boundary', errorBoundary(async (req, res) => {
  throw new Error('Error in boundary');
}));

app.get('/health', (req, res, next) => {
  next(new Error('Health check error'));
});

// Apply error handlers
app.use(createErrorHandler());
app.use(createNotFoundHandler());

// ============================================================================
// ERROR HANDLER TESTS
// ============================================================================

describe('Error Handler Middleware', () => {
  beforeEach(() => {
    // Reset any mocks or state
  });

  afterEach(() => {
    // Clean up
  });

  // ============================================================================
  // SUCCESS CASES
  // ============================================================================

  describe('Success cases', () => {
    it('should handle successful requests', async () => {
      const response = await request(app)
        .get('/test-success')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Success',
      });
    });
  });

  // ============================================================================
  // APP ERROR TESTS
  // ============================================================================

  describe('AppError handling', () => {
    it('should handle AppError with proper structure', async () => {
      const response = await request(app)
        .get('/test-app-error')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Test validation error',
          statusCode: 400,
          timestamp: expect.any(String),
          path: '/test-app-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });

  // ============================================================================
  // VALIDATION ERROR TESTS
  // ============================================================================

  describe('Validation error handling', () => {
    it('should handle Zod validation errors', async () => {
      const response = await request(app)
        .get('/test-validation-error')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          statusCode: 400,
          timestamp: expect.any(String),
          path: '/test-validation-error',
          method: 'GET',
          details: expect.any(Object),
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // AUTHENTICATION ERROR TESTS
  // ============================================================================

  describe('Authentication error handling', () => {
    it('should handle authentication errors', async () => {
      const response = await request(app)
        .get('/test-authentication-error')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_REQUIRED,
          message: 'Authentication required',
          statusCode: 401,
          timestamp: expect.any(String),
          path: '/test-authentication-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // AUTHORIZATION ERROR TESTS
  // ============================================================================

  describe('Authorization error handling', () => {
    it('should handle authorization errors', async () => {
      const response = await request(app)
        .get('/test-authorization-error')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Insufficient permissions',
          statusCode: 403,
          timestamp: expect.any(String),
          path: '/test-authorization-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // DATABASE ERROR TESTS
  // ============================================================================

  describe('Database error handling', () => {
    it('should handle database errors', async () => {
      const response = await request(app)
        .get('/test-database-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Database connection failed',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test-database-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // EXTERNAL SERVICE ERROR TESTS
  // ============================================================================

  describe('External service error handling', () => {
    it('should handle external service errors', async () => {
      const response = await request(app)
        .get('/test-external-service-error')
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          message: 'External API timeout',
          statusCode: 502,
          timestamp: expect.any(String),
          path: '/test-external-service-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // BUSINESS LOGIC ERROR TESTS
  // ============================================================================

  describe('Business logic error handling', () => {
    it('should handle business logic errors', async () => {
      const response = await request(app)
        .get('/test-business-logic-error')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.BUSINESS_LOGIC_ERROR,
          message: 'Business rule violation',
          statusCode: 400,
          timestamp: expect.any(String),
          path: '/test-business-logic-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // RESOURCE NOT FOUND ERROR TESTS
  // ============================================================================

  describe('Resource not found error handling', () => {
    it('should handle resource not found errors', async () => {
      const response = await request(app)
        .get('/test-resource-not-found')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'User not found',
          statusCode: 404,
          timestamp: expect.any(String),
          path: '/test-resource-not-found',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // RATE LIMIT ERROR TESTS
  // ============================================================================

  describe('Rate limit error handling', () => {
    it('should handle rate limit errors', async () => {
      const response = await request(app)
        .get('/test-rate-limit-error')
        .expect(429);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded',
          statusCode: 429,
          timestamp: expect.any(String),
          path: '/test-rate-limit-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // GENERIC ERROR TESTS
  // ============================================================================

  describe('Generic error handling', () => {
    it('should handle generic errors', async () => {
      const response = await request(app)
        .get('/test-generic-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'Generic error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test-generic-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // ASYNC ERROR TESTS
  // ============================================================================

  describe('Async error handling', () => {
    it('should handle async errors', async () => {
      const response = await request(app)
        .get('/test-async-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'Async error',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test-async-error',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // ERROR BOUNDARY TESTS
  // ============================================================================

  describe('Error boundary handling', () => {
    it('should handle errors in error boundary', async () => {
      const response = await request(app)
        .get('/test-error-boundary')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
          message: 'Error in boundary',
          statusCode: 500,
          timestamp: expect.any(String),
          path: '/test-error-boundary',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // NOT FOUND HANDLER TESTS
  // ============================================================================

  describe('Not found handler', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'Route /non-existent-route not found',
          statusCode: 404,
          timestamp: expect.any(String),
          path: '/non-existent-route',
          method: 'GET',
        },
        correlationId: expect.any(String),
      });
    });
  });

  // ============================================================================
  // CORRELATION ID TESTS
  // ============================================================================

  describe('Correlation ID handling', () => {
    it('should use provided correlation ID', async () => {
      const correlationId = 'test-correlation-id-123';
      
      const response = await request(app)
        .get('/test-app-error')
        .set('X-Correlation-ID', correlationId)
        .expect(400);

      expect(response.body.correlationId).toBe(correlationId);
      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });

    it('should generate correlation ID if not provided', async () => {
      const response = await request(app)
        .get('/test-app-error')
        .expect(400);

      expect(response.body.correlationId).toBeDefined();
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.body.correlationId).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });
  });

  // ============================================================================
  // ERROR RESPONSE STRUCTURE TESTS
  // ============================================================================

  describe('Error response structure', () => {
    it('should include all required fields in error response', async () => {
      const response = await request(app)
        .get('/test-app-error')
        .expect(400);

      const { error } = response.body;
      
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('timestamp');
      expect(error).toHaveProperty('statusCode');
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('method');
      
      expect(typeof error.code).toBe('string');
      expect(typeof error.message).toBe('string');
      expect(typeof error.timestamp).toBe('string');
      expect(typeof error.statusCode).toBe('number');
      expect(typeof error.path).toBe('string');
      expect(typeof error.method).toBe('string');
    });

    it('should include request ID if provided', async () => {
      const requestId = 'test-request-id-456';
      
      const response = await request(app)
        .get('/test-app-error')
        .set('X-Request-ID', requestId)
        .expect(400);

      expect(response.body.requestId).toBe(requestId);
    });
  });
});
