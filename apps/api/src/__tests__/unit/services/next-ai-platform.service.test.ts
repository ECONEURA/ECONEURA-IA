import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextAIPlatformService, NextAIRequestSchema } from '../../../services/next-ai-platform.service.js';

// Mock the database service
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: () => ({
    query: vi.fn(),
  }),
}));

// Mock the structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('NextAIPlatformService', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    };
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock the database service
    vi.mocked(nextAIPlatformService['db']).query = mockDb.query;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processRequest', () => {
    it('should process chat request successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'chat' as const,
        input: {
          text: 'Hello, how are you?',
        },
      };

      // Mock session creation
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          session_id: request.sessionId,
          user_id: request.userId,
          organization_id: request.organizationId,
        }],
      });

      // Mock request recording
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await nextAIPlatformService.processRequest(request);

      expect(result.success).toBe(true);
      expect(result.data.requestType).toBe('chat');
      expect(result.data.output).toBeDefined();
      expect(result.data.output.message).toBeDefined();
      expect(result.data.metadata.model).toBe('gpt-4o-mini');
      expect(result.data.metadata.tokens).toBeDefined();
      expect(result.data.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should process analysis request successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'analysis' as const,
        input: {
          data: { sales: 1000, profit: 200 },
        },
      };

      // Mock session creation
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          session_id: request.sessionId,
          user_id: request.userId,
          organization_id: request.organizationId,
        }],
      });

      // Mock request recording
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await nextAIPlatformService.processRequest(request);

      expect(result.success).toBe(true);
      expect(result.data.requestType).toBe('analysis');
      expect(result.data.output.analysis).toBeDefined();
      expect(result.data.output.summary).toBeDefined();
      expect(result.data.output.keyFindings).toBeInstanceOf(Array);
      expect(result.data.metadata.model).toBe('gpt-4o');
    });

    it('should process prediction request successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'prediction' as const,
        input: {
          data: { historical: [100, 120, 110] },
        },
      };

      // Mock session creation
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          session_id: request.sessionId,
          user_id: request.userId,
          organization_id: request.organizationId,
        }],
      });

      // Mock request recording
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await nextAIPlatformService.processRequest(request);

      expect(result.success).toBe(true);
      expect(result.data.requestType).toBe('prediction');
      expect(result.data.output.predictions).toBeInstanceOf(Array);
      expect(result.data.output.confidence).toBeDefined();
      expect(result.data.output.timeframe).toBeDefined();
      expect(result.data.output.factors).toBeInstanceOf(Array);
    });

    it('should process generation request successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'generation' as const,
        input: {
          text: 'Write a story about a robot',
        },
      };

      // Mock session creation
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          session_id: request.sessionId,
          user_id: request.userId,
          organization_id: request.organizationId,
        }],
      });

      // Mock request recording
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await nextAIPlatformService.processRequest(request);

      expect(result.success).toBe(true);
      expect(result.data.requestType).toBe('generation');
      expect(result.data.output.generated).toBeDefined();
      expect(result.data.output.alternatives).toBeInstanceOf(Array);
      expect(result.data.output.metadata).toBeDefined();
    });

    it('should process optimization request successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'optimization' as const,
        input: {
          data: { process: 'current_process', metrics: { efficiency: 0.7 } },
        },
      };

      // Mock session creation
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          session_id: request.sessionId,
          user_id: request.userId,
          organization_id: request.organizationId,
        }],
      });

      // Mock request recording
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await nextAIPlatformService.processRequest(request);

      expect(result.success).toBe(true);
      expect(result.data.requestType).toBe('optimization');
      expect(result.data.output.optimized).toBeDefined();
      expect(result.data.output.improvements).toBeInstanceOf(Array);
      expect(result.data.output.metrics).toBeDefined();
    });

    it('should process insights request successfully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'insights' as const,
        input: {
          data: { patterns: ['pattern1', 'pattern2'] },
        },
      };

      // Mock session creation
      mockDb.query.mockResolvedValueOnce({
        rows: [{
          id: 'session-123',
          session_id: request.sessionId,
          user_id: request.userId,
          organization_id: request.organizationId,
        }],
      });

      // Mock request recording
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const result = await nextAIPlatformService.processRequest(request);

      expect(result.success).toBe(true);
      expect(result.data.requestType).toBe('insights');
      expect(result.data.output.insights).toBeInstanceOf(Array);
      expect(result.data.output.patterns).toBeInstanceOf(Array);
      expect(result.data.output.recommendations).toBeInstanceOf(Array);
    });

    it('should handle database errors gracefully', async () => {
      const request = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'chat' as const,
        input: {
          text: 'Hello',
        },
      };

      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await nextAIPlatformService.processRequest(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data.output).toBeNull();
    });

    it('should validate request schema', () => {
      const validRequest = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'chat',
        input: {
          text: 'Hello',
        },
      };

      expect(() => NextAIRequestSchema.parse(validRequest)).not.toThrow();

      const invalidRequest = {
        sessionId: 'invalid-uuid',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: '123e4567-e89b-12d3-a456-426614174002',
        requestType: 'invalid-type',
        input: {
          text: 'Hello',
        },
      };

      expect(() => NextAIRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('getAvailableModels', () => {
    it('should return available models', async () => {
      const mockModels = [
        {
          model_name: 'gpt-4o-mini',
          model_type: 'chat',
          capabilities: ['text-generation', 'conversation'],
          cost_per_token: 0.00015,
          version: '1.0',
        },
        {
          model_name: 'gpt-4o',
          model_type: 'chat',
          capabilities: ['text-generation', 'conversation', 'reasoning'],
          cost_per_token: 0.005,
          version: '1.0',
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockModels });

      const models = await nextAIPlatformService.getAvailableModels();

      expect(models).toHaveLength(2);
      expect(models[0].name).toBe('gpt-4o-mini');
      expect(models[0].type).toBe('chat');
      expect(models[0].capabilities).toEqual(['text-generation', 'conversation']);
      expect(models[0].costPerToken).toBe(0.00015);
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const models = await nextAIPlatformService.getAvailableModels();

      expect(models).toEqual([]);
    });
  });

  describe('getSessionHistory', () => {
    it('should return session history', async () => {
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockHistory = [
        {
          id: 'req-1',
          request_type: 'chat',
          input_data: { text: 'Hello' },
          output_data: { message: 'Hi there!' },
          model_used: 'gpt-4o-mini',
          tokens_used: 50,
          processing_time_ms: 1000,
          confidence_score: 0.85,
          success: true,
          created_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockHistory });

      const history = await nextAIPlatformService.getSessionHistory(sessionId);

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('req-1');
      expect(history[0].requestType).toBe('chat');
      expect(history[0].input).toEqual({ text: 'Hello' });
      expect(history[0].output).toEqual({ message: 'Hi there!' });
      expect(history[0].model).toBe('gpt-4o-mini');
      expect(history[0].tokens).toBe(50);
      expect(history[0].processingTime).toBe(1000);
      expect(history[0].confidence).toBe(0.85);
      expect(history[0].success).toBe(true);
    });

    it('should handle database errors', async () => {
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const history = await nextAIPlatformService.getSessionHistory(sessionId);

      expect(history).toEqual([]);
    });
  });

  describe('getInsights', () => {
    it('should return insights for organization', async () => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174002';
      const mockInsights = [
        {
          id: 'insight-1',
          insight_type: 'performance',
          insight_title: 'Low confidence detected',
          insight_content: 'Chat requests have low confidence',
          insight_data: { confidence: 0.6 },
          confidence_score: 0.9,
          impact_level: 'medium',
          actionable: true,
          tags: ['performance'],
          created_at: new Date(),
        },
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockInsights });

      const insights = await nextAIPlatformService.getInsights(organizationId);

      expect(insights).toHaveLength(1);
      expect(insights[0].id).toBe('insight-1');
      expect(insights[0].type).toBe('performance');
      expect(insights[0].title).toBe('Low confidence detected');
      expect(insights[0].content).toBe('Chat requests have low confidence');
      expect(insights[0].data).toEqual({ confidence: 0.6 });
      expect(insights[0].confidence).toBe(0.9);
      expect(insights[0].impact).toBe('medium');
      expect(insights[0].actionable).toBe(true);
      expect(insights[0].tags).toEqual(['performance']);
    });

    it('should handle database errors', async () => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174002';
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const insights = await nextAIPlatformService.getInsights(organizationId);

      expect(insights).toEqual([]);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when all services are working', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const healthStatus = await nextAIPlatformService.getHealthStatus();

      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.services.database).toBe(true);
      expect(healthStatus.services.cache).toBe(true);
      expect(healthStatus.services.backgroundProcessing).toBe(true);
      expect(healthStatus.services.modelRegistry).toBe(true);
    });

    it('should return degraded status when some services are failing', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      const healthStatus = await nextAIPlatformService.getHealthStatus();

      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.services.database).toBe(false);
      expect(healthStatus.services.cache).toBe(true);
      expect(healthStatus.services.backgroundProcessing).toBe(true);
      expect(healthStatus.services.modelRegistry).toBe(true);
    });

    it('should return unhealthy status when most services are failing', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));
      
      // Mock cache to be empty (simulating failure)
      nextAIPlatformService['sessionCache'].clear();
      nextAIPlatformService['modelRegistry'].clear();

      const healthStatus = await nextAIPlatformService.getHealthStatus();

      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.services.database).toBe(false);
      expect(healthStatus.services.cache).toBe(false);
      expect(healthStatus.services.backgroundProcessing).toBe(false);
      expect(healthStatus.services.modelRegistry).toBe(false);
    });
  });

  describe('AI simulation methods', () => {
    it('should simulate chat response correctly', async () => {
      const input = 'Hello, how are you?';
      const type = 'chat';
      const model = 'gpt-4o-mini';

      const response = await nextAIPlatformService['simulateAIResponse'](input, type, model);

      expect(response.text).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.suggestions).toBeInstanceOf(Array);
      expect(response.insights).toBeInstanceOf(Array);
      expect(response.recommendations).toBeInstanceOf(Array);
    });

    it('should simulate analysis response correctly', async () => {
      const input = JSON.stringify({ sales: 1000, profit: 200 });
      const type = 'analysis';
      const model = 'gpt-4o';

      const response = await nextAIPlatformService['simulateAIResponse'](input, type, model);

      expect(response.analysis).toBeDefined();
      expect(response.summary).toBeDefined();
      expect(response.keyFindings).toBeInstanceOf(Array);
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should simulate prediction response correctly', async () => {
      const input = JSON.stringify({ historical: [100, 120, 110] });
      const type = 'prediction';
      const model = 'gpt-4o';

      const response = await nextAIPlatformService['simulateAIResponse'](input, type, model);

      expect(response.predictions).toBeInstanceOf(Array);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.timeframe).toBeDefined();
      expect(response.factors).toBeInstanceOf(Array);
    });
  });

  describe('utility methods', () => {
    it('should estimate tokens correctly', () => {
      const text = 'Hello world';
      const tokens = nextAIPlatformService['estimateTokens'](text);
      
      // Rough estimation: 1 token ≈ 4 characters
      expect(tokens).toBe(Math.ceil(text.length / 4));
    });

    it('should handle empty text in token estimation', () => {
      const tokens = nextAIPlatformService['estimateTokens']('');
      expect(tokens).toBe(0);
    });
  });
});
