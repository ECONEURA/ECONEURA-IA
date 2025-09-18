import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

// ============================================================================
// AZURE INTEGRATION API INTEGRATION TESTS - PR-17
// ============================================================================

describe('Azure Integration API', () => {
  const authToken = 'test-jwt-token';
  const baseUrl = '/v1/azure-integration';

  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup
  });

  describe('POST /chat/completions', () => {
    it('should generate chat completion successfully', async () => {
      const requestBody = {
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        maxTokens: 100,
        temperature: 0.7
      };

      const response = await request(app)
        .post(`${baseUrl}/chat/completions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('choices');
      expect(response.body.data.choices[0]).toHaveProperty('message');
      expect(response.body.metadata).toHaveProperty('service', 'azure-openai');
    });

    it('should handle validation errors', async () => {
      const invalidRequestBody = {
        messages: [
          { role: 'invalid-role', content: 'test' }
        ]
      };

      const response = await request(app)
        .post(`${baseUrl}/chat/completions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should require authentication', async () => {
      const requestBody = {
        messages: [
          { role: 'user', content: 'test' }
        ]
      };

      await request(app)
        .post(`${baseUrl}/chat/completions`)
        .send(requestBody)
        .expect(401);
    });

    it('should handle empty messages array', async () => {
      const requestBody = {
        messages: []
      };

      const response = await request(app)
        .post(`${baseUrl}/chat/completions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle long messages', async () => {
      const longMessage = 'a'.repeat(5000);
      const requestBody = {
        messages: [
          { role: 'user', content: longMessage }
        ]
      };

      const response = await request(app)
        .post(`${baseUrl}/chat/completions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /images/generations', () => {
    it('should generate image successfully', async () => {
      const requestBody = {
        prompt: 'A beautiful sunset over mountains',
        size: '1024x1024',
        quality: 'standard'
      };

      const response = await request(app)
        .post(`${baseUrl}/images/generations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('created');
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data.data[0]).toHaveProperty('url');
      expect(response.body.metadata).toHaveProperty('service', 'azure-openai-dalle');
    });

    it('should handle invalid image parameters', async () => {
      const requestBody = {
        prompt: 'test',
        size: 'invalid-size',
        quality: 'invalid-quality'
      };

      const response = await request(app)
        .post(`${baseUrl}/images/generations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should handle empty prompt', async () => {
      const requestBody = {
        prompt: ''
      };

      const response = await request(app)
        .post(`${baseUrl}/images/generations`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /speech/synthesis', () => {
    it('should generate speech successfully', async () => {
      const requestBody = {
        text: 'Hello, this is a test message for speech synthesis',
        voice: 'es-ES-ElviraNeural',
        rate: 1.0,
        pitch: 1.0
      };

      const response = await request(app)
        .post(`${baseUrl}/speech/synthesis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/audio\//);
      expect(response.headers['x-audio-duration']).toBeDefined();
      expect(parseFloat(response.headers['x-audio-duration'])).toBeGreaterThan(0);
    });

    it('should handle invalid TTS parameters', async () => {
      const requestBody = {
        text: 'test',
        rate: 5.0, // Invalid rate
        pitch: 5.0 // Invalid pitch
      };

      const response = await request(app)
        .post(`${baseUrl}/speech/synthesis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

    it('should handle empty text', async () => {
      const requestBody = {
        text: ''
      };

      const response = await request(app)
        .post(`${baseUrl}/speech/synthesis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);
      const requestBody = {
        text: longText
      };

      const response = await request(app)
        .post(`${baseUrl}/speech/synthesis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('overall');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('configuration');
      expect(response.body.data).toHaveProperty('availableServices');
      expect(response.body.data).toHaveProperty('isConfigured');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.data.overall);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`${baseUrl}/health`)
        .expect(401);
    });
  });

  describe('GET /status', () => {
    it('should return service status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('service', 'Azure OpenAI Integration');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('configuration');
      expect(response.body.data).toHaveProperty('availableServices');
      expect(response.body.data).toHaveProperty('isConfigured');
      expect(response.body.data).toHaveProperty('mode');
    });
  });

  describe('GET /config', () => {
    it('should return configuration without sensitive data', async () => {
      const response = await request(app)
        .get(`${baseUrl}/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('endpoint');
      expect(response.body.data).toHaveProperty('apiVersion');
      expect(response.body.data).toHaveProperty('chatDeployment');
      // Should not expose actual API key
      expect(response.body.data.apiKey).not.toBe('test-key');
    });
  });

  describe('GET /demo/chat', () => {
    it('should return demo chat response', async () => {
      const response = await request(app)
        .get(`${baseUrl}/demo/chat`)
        .query({ message: 'Hello, how are you?' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('choices');
      expect(response.body.metadata).toHaveProperty('mode', 'demo');
    });

    it('should handle missing message parameter', async () => {
      const response = await request(app)
        .get(`${baseUrl}/demo/chat`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Message parameter is required');
    });
  });

  describe('GET /demo/image', () => {
    it('should return demo image URL', async () => {
      const response = await request(app)
        .get(`${baseUrl}/demo/image`)
        .query({ prompt: 'A beautiful sunset' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data.data[0]).toHaveProperty('url');
      expect(response.body.metadata).toHaveProperty('mode', 'demo');
    });

    it('should handle missing prompt parameter', async () => {
      const response = await request(app)
        .get(`${baseUrl}/demo/image`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Prompt parameter is required');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      const requestBody = {
        messages: [{ role: 'user', content: 'test' }]
      };

      // Make multiple requests quickly
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post(`${baseUrl}/chat/completions`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(requestBody)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(`${baseUrl}/chat/completions`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle missing content type', async () => {
      const response = await request(app)
        .post(`${baseUrl}/chat/completions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send('test')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
