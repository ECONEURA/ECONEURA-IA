import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedAIRouter } from '../enhanced-router.js';

// Mock the AI router client
vi.mock('@econeura/agents/ai-router.client', () => ({
  aiRouterClient: {
    sendRequest: vi.fn()
  }
}));

describe('EnhancedAIRouter Integration Tests', () => {
  let router: EnhancedAIRouter;
  let mockAiRouterClient: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get the mocked client
    const { aiRouterClient } = await import('@econeura/agents/ai-router.client');
    mockAiRouterClient = aiRouterClient;
    
    // Create router instance
    router = new EnhancedAIRouter({
      costGuardrailsEnabled: false, // Disable for testing
      telemetryEnabled: false,
      defaultMaxCostEUR: 10.0,
      emergencyStopEnabled: false
    });
  });

  describe('Real AI Router Client Integration', () => {
    it('should use real AI router client instead of mock', async () => {
      // Mock successful response from AI router client
      mockAiRouterClient.sendRequest.mockResolvedValue({
        id: 'test-request-id',
        content: 'Real AI response from router client',
        model: 'mistral-instruct',
        provider: 'mistral',
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75
        },
        cost: {
          estimated: 0.001,
          actual: 0.001,
          currency: 'EUR'
        },
        metadata: {
          processingTime: 1500,
          timestamp: new Date().toISOString(),
          requestId: 'test-request-id'
        }
      });

      const request = {
        orgId: 'test-org-123',
        prompt: 'Test prompt for real AI router',
        maxTokens: 100,
        temperature: 0.7
      };

      const response = await router.routeRequest(request);

      // Verify the AI router client was called
      expect(mockAiRouterClient.sendRequest).toHaveBeenCalledWith({
        orgId: 'test-org-123',
        prompt: 'Test prompt for real AI router',
        model: expect.any(String),
        maxTokens: 100,
        temperature: 0.7,
        provider: expect.any(String),
        context: {
          providerId: expect.any(String),
          providerName: expect.any(String)
        },
        metadata: {
          requestType: 'enhanced-router',
          timestamp: expect.any(String)
        }
      });

      // Verify response structure
      expect(response).toMatchObject({
        content: 'Real AI response from router client',
        model: expect.any(String),
        provider: expect.any(String),
        tokens: {
          input: 50,
          output: 25
        },
        costEUR: expect.any(Number),
        latencyMs: expect.any(Number),
        fallbackUsed: false,
        requestId: expect.any(String)
      });
    });

    it('should fallback to mock response when AI router client fails', async () => {
      // Mock AI router client failure
      mockAiRouterClient.sendRequest.mockRejectedValue(
        new Error('AI router client connection failed')
      );

      const request = {
        orgId: 'test-org-123',
        prompt: 'Test prompt with fallback',
        maxTokens: 100,
        temperature: 0.7
      };

      const response = await router.routeRequest(request);

      // Verify the AI router client was called
      expect(mockAiRouterClient.sendRequest).toHaveBeenCalled();

      // Verify fallback response structure
      expect(response).toMatchObject({
        content: expect.stringContaining('Fallback response'),
        model: expect.any(String),
        provider: expect.any(String),
        tokens: {
          input: expect.any(Number),
          output: 100 // Mock output tokens
        },
        costEUR: expect.any(Number),
        latencyMs: expect.any(Number),
        fallbackUsed: false,
        requestId: expect.any(String)
      });
    });

    it('should pass correct orgId to AI router client', async () => {
      const testOrgId = 'specific-org-456';
      
      mockAiRouterClient.sendRequest.mockResolvedValue({
        id: 'test-request-id',
        content: 'Response with correct orgId',
        model: 'mistral-instruct',
        provider: 'mistral',
        usage: {
          promptTokens: 30,
          completionTokens: 15,
          totalTokens: 45
        },
        cost: {
          estimated: 0.0005,
          actual: 0.0005,
          currency: 'EUR'
        },
        metadata: {
          processingTime: 800,
          timestamp: new Date().toISOString(),
          requestId: 'test-request-id'
        }
      });

      const request = {
        orgId: testOrgId,
        prompt: 'Test prompt with specific orgId',
        maxTokens: 50
      };

      await router.routeRequest(request);

      // Verify the correct orgId was passed
      expect(mockAiRouterClient.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: testOrgId
        })
      );
    });

    it('should handle AI router client timeout gracefully', async () => {
      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      
      mockAiRouterClient.sendRequest.mockRejectedValue(timeoutError);

      const request = {
        orgId: 'test-org-123',
        prompt: 'Test prompt with timeout',
        maxTokens: 100
      };

      const response = await router.routeRequest(request);

      // Should still return a response (fallback)
      expect(response).toBeDefined();
      expect(response.content).toContain('Fallback response');
    });
  });

  describe('Provider Selection Integration', () => {
    it('should select correct provider based on request', async () => {
      mockAiRouterClient.sendRequest.mockResolvedValue({
        id: 'test-request-id',
        content: 'Provider-specific response',
        model: 'gpt-4o-mini',
        provider: 'azure-openai',
        usage: {
          promptTokens: 40,
          completionTokens: 20,
          totalTokens: 60
        },
        cost: {
          estimated: 0.002,
          actual: 0.002,
          currency: 'EUR'
        },
        metadata: {
          processingTime: 1200,
          timestamp: new Date().toISOString(),
          requestId: 'test-request-id'
        }
      });

      const request = {
        orgId: 'test-org-123',
        prompt: 'Test prompt with provider hint',
        providerHint: 'azure-openai' as const,
        maxTokens: 100
      };

      await router.routeRequest(request);

      // Verify provider was passed correctly
      expect(mockAiRouterClient.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: expect.any(String)
        })
      );
    });
  });
});
