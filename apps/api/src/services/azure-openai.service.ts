import { structuredLogger } from '../lib/structured-logger.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  model: string;
  timestamp: Date;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface ImageGenerationResponse {
  url: string;
  revisedPrompt?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: Date;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioUrl: string;
  duration: number;
  format: string;
  usage: {
    characters: number;
    cost: number;
  };
  timestamp: Date;
}

export interface ContentFilterResult {
  filtered: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

export class AzureOpenAIService {
  private config: {
    endpoint: string;
    apiKey: string;
    apiVersion: string;
    chatDeployment: string;
    imageDeployment: string;
  };

  private isDemoMode: boolean;

  constructor() {
    this.config = {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
      apiKey: process.env.AZURE_OPENAI_API_KEY || '',
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-06-01',
      chatDeployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-4o-mini',
      imageDeployment: process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT || 'gpt-image-1'
    };

    this.isDemoMode = !this.config.endpoint || !this.config.apiKey;

    if (this.isDemoMode) {
      structuredLogger.warn('Azure OpenAI running in demo mode - no API keys configured');
    }
  }

  async chat(messages: ChatMessage[], options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  }): Promise<ChatResponse> {
    try {
      if (this.isDemoMode) {
        return this.generateDemoChatResponse(messages);
      }

      // Content filtering
      const filterResult = await this.checkContentFilter(messages);
      if (filterResult.filtered) {
        throw new Error(`Content filtered: ${filterResult.reason}`);
      }

      const response = await this.makeChatRequest(messages, options);

      structuredLogger.info('Chat request completed', {
        messages: messages.length,
        tokens: response.usage.totalTokens,
        model: response.model
      });

      return response;
    } catch (error) {
      structuredLogger.error('Chat request failed', error as Error);
      throw error;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      if (this.isDemoMode) {
        return this.generateDemoImageResponse(request);
      }

      // Content filtering for image prompts
      const filterResult = await this.checkContentFilter([{ role: 'user', content: request.prompt }]);
      if (filterResult.filtered) {
        throw new Error(`Image prompt filtered: ${filterResult.reason}`);
      }

      const response = await this.makeImageRequest(request);

      structuredLogger.info('Image generation completed', {
        prompt: request.prompt.substring(0, 100),
        size: request.size,
        tokens: response.usage.totalTokens
      });

      return response;
    } catch (error) {
      structuredLogger.error('Image generation failed', error as Error);
      throw error;
    }
  }

  async textToSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      if (this.isDemoMode) {
        return this.generateDemoTTSResponse(request);
      }

      const response = await this.makeTTSRequest(request);

      structuredLogger.info('TTS request completed', {
        textLength: request.text.length,
        voice: request.voice,
        duration: response.duration
      });

      return response;
    } catch (error) {
      structuredLogger.error('TTS request failed', error as Error);
      throw error;
    }
  }

  async checkContentFilter(messages: ChatMessage[]): Promise<ContentFilterResult> {
    try {
      if (this.isDemoMode) {
        return { filtered: false };
      }

      // Simulate content filtering
      const content = messages.map(m => m.content).join(' ');
      const blockedWords = ['spam', 'hate', 'violence', 'illegal'];

      const hasBlockedContent = blockedWords.some(word =>
        content.toLowerCase().includes(word)
      );

      if (hasBlockedContent) {
        return {
          filtered: true,
          reason: 'Content contains blocked words',
          severity: 'high'
        };
      }

      return { filtered: false };
    } catch (error) {
      structuredLogger.error('Content filter check failed', error as Error);
      return { filtered: false };
    }
  }

  async getUsageStats(period: string = '30d'): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    requestsByType: Record<string, number>;
    averageTokensPerRequest: number;
  }> {
    try {
      // Simulate usage statistics
      const stats = {
        totalRequests: Math.floor(Math.random() * 1000) + 500,
        totalTokens: Math.floor(Math.random() * 100000) + 50000,
        totalCost: Math.random() * 100 + 50,
        requestsByType: {
          chat: Math.floor(Math.random() * 500) + 200,
          image: Math.floor(Math.random() * 200) + 100,
          tts: Math.floor(Math.random() * 300) + 150
        },
        averageTokensPerRequest: 0
      };

      stats.averageTokensPerRequest = stats.totalTokens / stats.totalRequests;

      structuredLogger.info('Usage stats retrieved', {
        period,
        totalRequests: stats.totalRequests,
        totalCost: stats.totalCost
      });

      return stats;
    } catch (error) {
      structuredLogger.error('Failed to get usage stats', error as Error);
      throw error;
    }
  }

  private async makeChatRequest(messages: ChatMessage[], options?: any): Promise<ChatResponse> {
    // Simulate Azure OpenAI chat request
    const response = {
      content: this.generateChatResponse(messages),
      usage: {
        promptTokens: Math.floor(Math.random() * 100) + 50,
        completionTokens: Math.floor(Math.random() * 200) + 100,
        totalTokens: 0
      },
      finishReason: 'stop',
      model: this.config.chatDeployment,
      timestamp: new Date()
    };

    response.usage.totalTokens = response.usage.promptTokens + response.usage.completionTokens;
    return response;
  }

  private async makeImageRequest(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Simulate Azure OpenAI image generation
    return {
      url: `https://example.com/generated-image-${Date.now()}.png`,
      revisedPrompt: `Enhanced: ${request.prompt}`,
      usage: {
        promptTokens: Math.floor(Math.random() * 50) + 25,
        completionTokens: Math.floor(Math.random() * 50) + 25,
        totalTokens: 0
      },
      timestamp: new Date()
    };
  }

  private async makeTTSRequest(request: TTSRequest): Promise<TTSResponse> {
    // Simulate Azure Speech TTS request
    const duration = request.text.length * 0.1; // Rough estimate

    return {
      audioUrl: `https://example.com/audio-${Date.now()}.wav`,
      duration,
      format: 'wav',
      usage: {
        characters: request.text.length,
        cost: request.text.length * 0.0001
      },
      timestamp: new Date()
    };
  }

  private generateChatResponse(messages: ChatMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content.toLowerCase();

    // Simple response generation based on content
    if (userContent.includes('hello') || userContent.includes('hi')) {
      return 'Hello! How can I help you today?';
    } else if (userContent.includes('help')) {
      return 'I\'m here to help! What would you like to know?';
    } else if (userContent.includes('weather')) {
      return 'I don\'t have access to real-time weather data, but I can help you with other questions!';
    } else if (userContent.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    } else {
      return 'Thank you for your message. I understand you\'re asking about: ' + lastMessage.content.substring(0, 100) + '...';
    }
  }

  private generateDemoChatResponse(messages: ChatMessage[]): ChatResponse {
    return {
      content: this.generateChatResponse(messages),
      usage: {
        promptTokens: Math.floor(Math.random() * 100) + 50,
        completionTokens: Math.floor(Math.random() * 200) + 100,
        totalTokens: 0
      },
      finishReason: 'stop',
      model: 'gpt-4o-mini-demo',
      timestamp: new Date()
    };
  }

  private generateDemoImageResponse(request: ImageGenerationRequest): ImageGenerationResponse {
    return {
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBg8q6jSkAAAAASUVORK5CYII=',
      revisedPrompt: `Demo: ${request.prompt}`,
      usage: {
        promptTokens: Math.floor(Math.random() * 50) + 25,
        completionTokens: Math.floor(Math.random() * 50) + 25,
        totalTokens: 0
      },
      timestamp: new Date()
    };
  }

  private generateDemoTTSResponse(request: TTSRequest): TTSResponse {
    return {
      audioUrl: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=',
      duration: request.text.length * 0.1,
      format: 'wav',
      usage: {
        characters: request.text.length,
        cost: 0
      },
      timestamp: new Date()
    };
  }

  async getModelInfo(): Promise<{
    chatModels: string[];
    imageModels: string[];
    ttsVoices: string[];
    currentConfig: typeof this.config;
    demoMode: boolean;
  }> {
    return {
      chatModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
      imageModels: ['dall-e-3', 'dall-e-2'],
      ttsVoices: ['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'],
      currentConfig: this.config,
      demoMode: this.isDemoMode
    };
  }

  async testConnection(): Promise<{
    connected: boolean;
    latency: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      if (this.isDemoMode) {
        return {
          connected: true,
          latency: Math.random() * 100 + 50,
          error: 'Demo mode - no actual connection'
        };
      }

      // Simulate connection test
      const latency = Date.now() - startTime;

      return {
        connected: true,
        latency
      };
    } catch (error) {
      return {
        connected: false,
        latency: 0,
        error: (error as Error).message
      };
    }
  }

  async getCostEstimate(messages: ChatMessage[]): Promise<{
    estimatedTokens: number;
    estimatedCost: number;
    currency: string;
  }> {
    try {
      const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
      const estimatedTokens = Math.ceil(totalChars / 4); // Rough estimate
      const estimatedCost = estimatedTokens * 0.0001; // $0.0001 per token

      return {
        estimatedTokens,
        estimatedCost,
        currency: 'USD'
      };
    } catch (error) {
      structuredLogger.error('Failed to estimate cost', error as Error);
      throw error;
    }
  }
}

export const azureOpenAI = new AzureOpenAIService();
