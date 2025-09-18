import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { basicAIService, AIRequest, AIContext } from '../../../lib/basic-ai/basic-ai.service.js';

// ============================================================================
// BASIC AI SERVICE TESTS - PR-16
// ============================================================================

// Mock de servicios externos
vi.mock('../../../services/sentiment-analysis.service.js', () => ({
  sentimentAnalysis: {
    analyzeText: vi.fn()
  }
}));

vi.mock('../../../services/predictive-ai.service.js', () => ({
  predictiveAI: {
    predictDemand: vi.fn()
  }
}));

vi.mock('../../../services/automl.service.js', () => ({
  autoML: {
    trainModel: vi.fn()
  }
}));

vi.mock('../../../services/azure-openai.service.js', () => ({
  azureOpenAI: {
    generateText: vi.fn()
  }
}));

vi.mock('../../../services/web-search.service.js', () => ({
  webSearch: {
    search: vi.fn()
  }
}));

vi.mock('@econeura/db', () => ({
  getDatabaseService: vi.fn(() => ({
    query: vi.fn()
  }))
}));

describe('BasicAIService', () => {
  let mockContext: AIContext;
  let mockRequest: AIRequest;

  beforeEach(() => {
    mockContext = {
      userId: 'user-123',
      organizationId: 'org-456',
      sessionId: 'session-789',
      userPreferences: {
        language: 'es',
        responseStyle: 'formal',
        maxLength: 500
      }
    };

    mockRequest = {
      prompt: 'Test prompt',
      context: mockContext,
      options: {
        maxTokens: 100,
        temperature: 0.7,
        includeAnalysis: true,
        includeSuggestions: true
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('should generate text response for general prompts', async () => {
      const { azureOpenAI } = await import('../../../services/azure-openai.service.js');
      
      vi.mocked(azureOpenAI.generateText).mockResolvedValue({
        text: 'Test response',
        confidence: 0.9,
        tokens: 50
      });

      const response = await basicAIService.generateResponse(mockRequest);

      expect(response).toMatchObject({
        type: 'text',
        content: 'Test response',
        confidence: 0.9,
        metadata: {
          model: 'azure-openai-gpt-4',
          tokens: 50
        }
      });
    });

    it('should generate analysis response for sentiment prompts', async () => {
      const { sentimentAnalysis } = await import('../../../services/sentiment-analysis.service.js');
      
      vi.mocked(sentimentAnalysis.analyzeText).mockResolvedValue({
        sentiment: 'positive',
        confidence: 0.85,
        emotions: { joy: 0.8, trust: 0.7 },
        analysis: 'Positive sentiment detected',
        tokens: 30
      });

      const analysisRequest = {
        ...mockRequest,
        prompt: 'Analyze the sentiment of this text: I love this product!'
      };

      const response = await basicAIService.generateResponse(analysisRequest);

      expect(response).toMatchObject({
        type: 'analysis',
        confidence: 0.85,
        metadata: {
          model: 'sentiment-analysis-v2',
          tokens: 30
        }
      });
      expect(response.content).toContain('Análisis de Sentimiento');
      expect(response.content).toContain('positive');
    });

    it('should generate prediction response for forecast prompts', async () => {
      const { predictiveAI } = await import('../../../services/predictive-ai.service.js');
      
      vi.mocked(predictiveAI.predictDemand).mockResolvedValue({
        confidence: 0.8,
        period: 'Q1 2024',
        results: [
          { metric: 'Sales', value: '1000' },
          { metric: 'Growth', value: '15%' }
        ],
        recommendations: ['Increase inventory', 'Expand marketing']
      });

      const predictionRequest = {
        ...mockRequest,
        prompt: 'Predict the future sales for next quarter'
      };

      const response = await basicAIService.generateResponse(predictionRequest);

      expect(response).toMatchObject({
        type: 'prediction',
        confidence: 0.8,
        metadata: {
          model: 'predictive-ai-v1'
        }
      });
      expect(response.content).toContain('Predicción Generada');
      expect(response.content).toContain('Q1 2024');
    });

    it('should generate search response for search prompts', async () => {
      const { webSearch } = await import('../../../services/web-search.service.js');
      
      vi.mocked(webSearch.search).mockResolvedValue({
        results: [
          {
            title: 'Test Result',
            url: 'https://example.com',
            summary: 'Test summary',
            relevance: 0.9
          }
        ],
        summary: 'Search summary',
        confidence: 0.85
      });

      const searchRequest = {
        ...mockRequest,
        prompt: 'Search for information about AI'
      };

      const response = await basicAIService.generateResponse(searchRequest);

      expect(response).toMatchObject({
        type: 'search',
        confidence: 0.85,
        metadata: {
          model: 'web-search-v1'
        }
      });
      expect(response.content).toContain('Resultados de Búsqueda');
      expect(response.content).toContain('Test Result');
    });

    it('should handle errors gracefully', async () => {
      const { azureOpenAI } = await import('../../../services/azure-openai.service.js');
      
      vi.mocked(azureOpenAI.generateText).mockRejectedValue(new Error('Service unavailable'));

      await expect(basicAIService.generateResponse(mockRequest)).rejects.toThrow('Service unavailable');
    });
  });

  describe('session management', () => {
    it('should create new session', async () => {
      const sessionId = await basicAIService.createSession('user-123', 'org-456');
      
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should get session history', async () => {
      const sessionId = await basicAIService.createSession('user-123', 'org-456');
      
      // Generar una respuesta para crear historial
      const { azureOpenAI } = await import('../../../services/azure-openai.service.js');
      vi.mocked(azureOpenAI.generateText).mockResolvedValue({
        text: 'Test response',
        confidence: 0.9,
        tokens: 50
      });

      await basicAIService.generateResponse(mockRequest);
      
      const history = await basicAIService.getSessionHistory(sessionId);
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Test response');
    });

    it('should clear session', async () => {
      const sessionId = await basicAIService.createSession('user-123', 'org-456');
      
      await basicAIService.clearSession(sessionId);
      
      const history = await basicAIService.getSessionHistory(sessionId);
      expect(history).toHaveLength(0);
    });
  });

  describe('health check', () => {
    it('should return healthy status when all services are available', async () => {
      const healthStatus = await basicAIService.getHealthStatus();
      
      expect(healthStatus).toMatchObject({
        status: 'healthy',
        services: {
          sentimentAnalysis: true,
          predictiveAI: true,
          autoML: true,
          azureOpenAI: true,
          webSearch: true
        }
      });
      expect(healthStatus.lastCheck).toBeInstanceOf(Date);
    });

    it('should return degraded status when some services are unavailable', async () => {
      // Mock algunos servicios como no disponibles
      const { sentimentAnalysis } = await import('../../../services/sentiment-analysis.service.js');
      vi.mocked(sentimentAnalysis).mockImplementation(() => null as any);

      const healthStatus = await basicAIService.getHealthStatus();
      
      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.services.sentimentAnalysis).toBe(false);
    });
  });

  describe('response type determination', () => {
    it('should determine analysis type for sentiment keywords', () => {
      const service = basicAIService as any;
      
      expect(service.determineResponseType('Analyze the sentiment')).toBe('analysis');
      expect(service.determineResponseType('What is the emotion?')).toBe('analysis');
    });

    it('should determine prediction type for forecast keywords', () => {
      const service = basicAIService as any;
      
      expect(service.determineResponseType('Predict future sales')).toBe('prediction');
      expect(service.determineResponseType('Forecast trends')).toBe('prediction');
    });

    it('should determine search type for search keywords', () => {
      const service = basicAIService as any;
      
      expect(service.determineResponseType('Search for information')).toBe('search');
      expect(service.determineResponseType('Find data about')).toBe('search');
    });

    it('should default to text type for general prompts', () => {
      const service = basicAIService as any;
      
      expect(service.determineResponseType('Hello, how are you?')).toBe('text');
      expect(service.determineResponseType('Tell me a story')).toBe('text');
    });
  });

  describe('suggestions generation', () => {
    it('should generate appropriate suggestions for different response types', () => {
      const service = basicAIService as any;
      
      const textSuggestions = service.generateSuggestions('Hello');
      expect(textSuggestions).toHaveLength(3);
      expect(textSuggestions[0]).toContain('explicar');
      
      const analysisSuggestions = service.generateAnalysisSuggestions({ sentiment: 'positive' });
      expect(analysisSuggestions).toHaveLength(3);
      expect(analysisSuggestions[0]).toContain('analizar');
      
      const predictionSuggestions = service.generatePredictionSuggestions({ period: 'Q1' });
      expect(predictionSuggestions).toHaveLength(3);
      expect(predictionSuggestions[0]).toContain('predicciones');
      
      const searchSuggestions = service.generateSearchSuggestions({ results: [] });
      expect(searchSuggestions).toHaveLength(3);
      expect(searchSuggestions[0]).toContain('buscar');
    });
  });
});

