import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';
import { getDatabaseService } from '@econeura/db';

// ============================================================================
// BASIC AI INTEGRATION TESTS - PR-16
// ============================================================================

describe('Basic AI API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let testOrganizationId: string;

  beforeEach(async () => {
    // Setup test data
    testUserId = 'test-user-123';
    testOrganizationId = 'test-org-456';

    // Mock authentication token
    authToken = 'Bearer test-token-123';
  });

  afterEach(async () => {
    // Cleanup test data
    const db = getDatabaseService();
    await db.query('DELETE FROM ai_interactions WHERE user_id = $1', [testUserId]);
  });

  describe('POST /v1/basic-ai/generate', () => {
    it('should generate AI response for text prompt', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/generate')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          prompt: 'Hello, how are you?',
          options: {
            maxTokens: 100,
            temperature: 0.7
          }
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          response: {
            id: expect.any(String),
            type: 'text',
            content: expect.any(String),
            confidence: expect.any(Number),
            metadata: {
              model: expect.any(String),
              timestamp: expect.any(String),
              processingTime: expect.any(Number)
            }
          },
          sessionId: expect.any(String)
        }
      });
    });

    it('should generate analysis response for sentiment prompt', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/generate')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          prompt: 'Analyze the sentiment of this text: I love this product!',
          options: {
            includeAnalysis: true
          }
        })
        .expect(200);

      expect(response.body.data.response.type).toBe('analysis');
      expect(response.body.data.response.content).toContain('Análisis de Sentimiento');
    });

    it('should generate prediction response for forecast prompt', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/generate')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          prompt: 'Predict the future sales for next quarter'
        })
        .expect(200);

      expect(response.body.data.response.type).toBe('prediction');
      expect(response.body.data.response.content).toContain('Predicción Generada');
    });

    it('should generate search response for search prompt', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/generate')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          prompt: 'Search for information about artificial intelligence'
        })
        .expect(200);

      expect(response.body.data.response.type).toBe('search');
      expect(response.body.data.response.content).toContain('Resultados de Búsqueda');
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/generate')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          prompt: '', // Empty prompt should fail
          options: {
            maxTokens: 5000 // Too high
          }
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/generate')
        .send({
          prompt: 'Test prompt'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Authentication required'
      });
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests quickly to trigger rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .post('/v1/basic-ai/generate')
          .set('Authorization', authToken)
          .set('X-User-ID', testUserId)
          .set('X-Organization-ID', testOrganizationId)
          .send({
            prompt: 'Test prompt'
          })
      );

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /v1/basic-ai/sessions', () => {
    it('should create new AI session', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/sessions')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          preferences: {
            language: 'es',
            responseStyle: 'formal',
            maxLength: 1000
          }
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          sessionId: expect.any(String),
          preferences: {
            language: 'es',
            responseStyle: 'formal',
            maxLength: 1000
          }
        }
      });
    });

    it('should create session with default preferences', async () => {
      const response = await request(app)
        .post('/v1/basic-ai/sessions')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({})
        .expect(200);

      expect(response.body.data.preferences).toMatchObject({
        language: 'es',
        responseStyle: 'formal',
        maxLength: 500
      });
    });
  });

  describe('GET /v1/basic-ai/sessions/:sessionId/history', () => {
    it('should get session history', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/v1/basic-ai/sessions')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({});

      const sessionId = sessionResponse.body.data.sessionId;

      // Generate a response to create history
      await request(app)
        .post('/v1/basic-ai/generate')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          prompt: 'Test prompt',
          sessionId
        });

      // Get session history
      const response = await request(app)
        .get(`/v1/basic-ai/sessions/${sessionId}/history`)
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          sessionId,
          history: expect.any(Array),
          totalMessages: expect.any(Number)
        }
      });
    });

    it('should return empty history for new session', async () => {
      const sessionResponse = await request(app)
        .post('/v1/basic-ai/sessions')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({});

      const sessionId = sessionResponse.body.data.sessionId;

      const response = await request(app)
        .get(`/v1/basic-ai/sessions/${sessionId}/history`)
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .expect(200);

      expect(response.body.data.history).toHaveLength(0);
      expect(response.body.data.totalMessages).toBe(0);
    });
  });

  describe('DELETE /v1/basic-ai/sessions/:sessionId', () => {
    it('should clear session data', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/v1/basic-ai/sessions')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({});

      const sessionId = sessionResponse.body.data.sessionId;

      // Clear session
      const response = await request(app)
        .delete(`/v1/basic-ai/sessions/${sessionId}`)
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Session cleared successfully'
      });
    });
  });

  describe('GET /v1/basic-ai/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/v1/basic-ai/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: expect.stringMatching(/^(healthy|degraded|unhealthy)$/),
          services: expect.any(Object),
          lastCheck: expect.any(String)
        }
      });
    });
  });

  describe('GET /v1/basic-ai/capabilities', () => {
    it('should return AI capabilities', async () => {
      const response = await request(app)
        .get('/v1/basic-ai/capabilities')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          textGeneration: {
            available: true,
            models: expect.any(Array),
            maxTokens: expect.any(Number),
            supportedLanguages: expect.any(Array)
          },
          sentimentAnalysis: {
            available: true,
            models: expect.any(Array),
            supportedLanguages: expect.any(Array),
            features: expect.any(Array)
          },
          predictiveAnalytics: {
            available: true,
            models: expect.any(Array),
            features: expect.any(Array)
          },
          webSearch: {
            available: true,
            models: expect.any(Array),
            maxResults: expect.any(Number),
            features: expect.any(Array)
          },
          sessionManagement: {
            available: true,
            maxSessions: expect.any(Number),
            maxMessagesPerSession: expect.any(Number),
            features: expect.any(Array)
          }
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', async () => {
      // This test would require mocking service failures
      // For now, we'll test the error response structure
      const response = await request(app)
        .post('/v1/basic-ai/generate')
        .set('Authorization', authToken)
        .set('X-User-ID', testUserId)
        .set('X-Organization-ID', testOrganizationId)
        .send({
          prompt: 'Test prompt'
        });

      // Should either succeed or return a proper error structure
      if (!response.body.success) {
        expect(response.body).toMatchObject({
          success: false,
          error: expect.any(String),
          code: expect.any(String)
        });
      }
    });
  });
});

