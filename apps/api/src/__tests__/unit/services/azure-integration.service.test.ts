import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { azureIntegration } from '../../../services/azure-integration.service.js';

// ============================================================================
// AZURE INTEGRATION SERVICE UNIT TESTS - PR-17
// ============================================================================

// Mock de fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock de env
vi.mock('@econeura/shared/env', () => ({
  env: () => ({
    AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com',
    AZURE_OPENAI_API_KEY: 'test-key',
    AZURE_OPENAI_API_VERSION: '2024-02-15-preview',
    AZURE_OPENAI_DEPLOYMENT: 'gpt-4o-mini'
  })
}));

// Mock de structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AzureIntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Configuration', () => {
    it('should load configuration correctly', () => {
      const config = azureIntegration.getConfiguration();

      expect(config).toHaveProperty('endpoint');
      expect(config).toHaveProperty('apiVersion');
      expect(config).toHaveProperty('chatDeployment');
    });

    it('should detect if service is configured', () => {
      const isConfigured = azureIntegration.isConfigured();
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should return available services', () => {
      const services = azureIntegration.getAvailableServices();
      expect(Array.isArray(services)).toBe(true);
      expect(services).toContain('chat');
    });
  });

  describe('Chat Completion', () => {
    it('should generate demo chat response when not configured', async () => {
      const request = {
        messages: [
          { role: 'user' as const, content: 'Hello, how are you?' }
        ],
        maxTokens: 100
      };

      const response = await azureIntegration.generateChatCompletion(request);

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('choices');
      expect(response.choices[0]).toHaveProperty('message');
      expect(response.choices[0].message.role).toBe('assistant');
      expect(response.choices[0].message.content).toContain('Hola');
    });

    it('should handle different types of prompts in demo mode', async () => {
      const testCases = [
        { prompt: 'Hello', expectedContent: 'Hola' },
        { prompt: 'What is the weather?', expectedContent: 'clima' },
        { prompt: 'Show me some code', expectedContent: 'programación' }
      ];

      for (const testCase of testCases) {
        const request = {
          messages: [
            { role: 'user' as const, content: testCase.prompt }
          ]
        };

        const response = await azureIntegration.generateChatCompletion(request);
        expect(response.choices[0].message.content.toLowerCase()).toContain(testCase.expectedContent);
      }
    });

    it('should generate production response when configured', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-test-123',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-4o-mini',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a test response from Azure OpenAI'
            },
            finishReason: 'stop'
          }],
          usage: {
            promptTokens: 10,
            completionTokens: 20,
            totalTokens: 30
          }
        })
      });

      const request = {
        messages: [
          { role: 'user' as const, content: 'Test message' }
        ],
        maxTokens: 100
      };

      const response = await azureIntegration.generateChatCompletion(request);

      expect(response.id).toBe('chatcmpl-test-123');
      expect(response.choices[0].message.content).toBe('This is a test response from Azure OpenAI');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'api-key': 'test-key'
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request'
      });

      const request = {
        messages: [
          { role: 'user' as const, content: 'Test message' }
        ]
      };

      await expect(azureIntegration.generateChatCompletion(request))
        .rejects.toThrow('Azure OpenAI API error: 400 - Bad Request');
    });
  });

  describe('Image Generation', () => {
    it('should generate demo image response when not configured', async () => {
      const request = {
        prompt: 'A beautiful sunset',
        size: '1024x1024' as const
      };

      const response = await azureIntegration.generateImage(request);

      expect(response).toHaveProperty('created');
      expect(response).toHaveProperty('data');
      expect(response.data[0]).toHaveProperty('url');
      expect(response.data[0].url).toContain('via.placeholder.com');
      expect(response.data[0].revisedPrompt).toContain('A beautiful sunset');
    });

    it('should generate production image when configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          created: Math.floor(Date.now() / 1000),
          data: [{
            url: 'https://example.com/generated-image.jpg',
            revisedPrompt: 'A beautiful sunset over mountains'
          }]
        })
      });

      const request = {
        prompt: 'A beautiful sunset',
        size: '1024x1024' as const,
        quality: 'hd' as const
      };

      const response = await azureIntegration.generateImage(request);

      expect(response.data[0].url).toBe('https://example.com/generated-image.jpg');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/images/generations'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"prompt":"A beautiful sunset"')
        })
      );
    });
  });

  describe('Text to Speech', () => {
    it('should generate demo speech response when not configured', async () => {
      const request = {
        text: 'Hello, this is a test message',
        voice: 'es-ES-ElviraNeural'
      };

      const response = await azureIntegration.generateSpeech(request);

      expect(response).toHaveProperty('audioData');
      expect(response).toHaveProperty('contentType');
      expect(response).toHaveProperty('duration');
      expect(response.contentType).toBe('audio/mpeg');
      expect(response.duration).toBeGreaterThan(0);
    });

    it('should generate SSML correctly', async () => {
      const request = {
        text: 'Hello <world>',
        voice: 'es-ES-ElviraNeural',
        rate: 1.2,
        pitch: 1.1
      };

      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024)
      });

      const response = await azureIntegration.generateSpeech(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('tts.speech.microsoft.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/ssml+xml'
          }),
          body: expect.stringContaining('<speak')
        })
      );
    });

    it('should escape XML characters in text', async () => {
      const request = {
        text: 'Hello & welcome <to> "our" service'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024)
      });

      await azureIntegration.generateSpeech(request);

      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toContain('&amp;');
      expect(callBody).toContain('&lt;');
      expect(callBody).toContain('&gt;');
      expect(callBody).toContain('&quot;');
    });
  });

  describe('Health Monitoring', () => {
    it('should check service health', async () => {
      const healthStatus = await azureIntegration.checkServiceHealth();

      expect(healthStatus).toBeInstanceOf(Map);
      expect(healthStatus.has('chat')).toBe(true);
    });

    it('should cache health checks', async () => {
      const firstCheck = await azureIntegration.checkServiceHealth();
      const secondCheck = await azureIntegration.checkServiceHealth();

      // Should return cached results
      expect(firstCheck).toBe(secondCheck);
    });

    it('should handle health check errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const healthStatus = await azureIntegration.checkServiceHealth();
      const chatHealth = healthStatus.get('chat');

      expect(chatHealth?.status).toBe('unhealthy');
      expect(chatHealth?.error).toContain('Network error');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when service not initialized', async () => {
      // Reset the service to uninitialized state
      const service = new (azureIntegration.constructor as any)();

      await expect(service.generateChatCompletion({
        messages: [{ role: 'user', content: 'test' }]
      })).rejects.toThrow('Azure Integration Service not initialized');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const request = {
        messages: [{ role: 'user' as const, content: 'test' }]
      };

      await expect(azureIntegration.generateChatCompletion(request))
        .rejects.toThrow('Request timeout');
    });
  });

  describe('Utility Methods', () => {
    it('should estimate audio duration correctly', async () => {
      const shortText = 'Hello';
      const longText = 'This is a much longer text that should take more time to speak because it has many more words and will result in a longer duration estimate';

      const shortRequest = { text: shortText };
      const longRequest = { text: longText };

      const shortResponse = await azureIntegration.generateSpeech(shortRequest);
      const longResponse = await azureIntegration.generateSpeech(longRequest);

      expect(longResponse.duration).toBeGreaterThan(shortResponse.duration);
    });

    it('should return proper service information', () => {
      const config = azureIntegration.getConfiguration();
      const services = azureIntegration.getAvailableServices();
      const isConfigured = azureIntegration.isConfigured();

      expect(typeof config).toBe('object');
      expect(Array.isArray(services)).toBe(true);
      expect(typeof isConfigured).toBe('boolean');
    });
  });
});
