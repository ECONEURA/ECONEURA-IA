import { structuredLogger } from '../lib/structured-logger.js';
import { env } from '@econeura/shared/env';

// ============================================================================
// AZURE OPENAI INTEGRATION SERVICE - PR-17
// ============================================================================

export interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  chatDeployment: string;
  imageDeployment?: string;
  speechKey?: string;
  speechRegion?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ImageRequest {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
}

export interface ImageResponse {
  created: number;
  data: Array<{
    url: string;
    revisedPrompt?: string;
  }>;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  outputFormat?: 'mp3' | 'wav' | 'ogg';
  rate?: number;
  pitch?: number;
}

export interface TTSResponse {
  audioData: ArrayBuffer;
  contentType: string;
  duration: number;
}

export interface AzureServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

export class AzureIntegrationService {
  private config: AzureOpenAIConfig;
  private isInitialized: boolean = false;
  private healthCache: Map<string, AzureServiceHealth> = new Map();
  private lastHealthCheck: Date = new Date(0);

  constructor() {
    this.config = this.loadConfiguration();
    this.initializeService();
  }

  private loadConfiguration(): AzureOpenAIConfig {
    const config = {
      endpoint: env().AZURE_OPENAI_ENDPOINT || '',
      apiKey: env().AZURE_OPENAI_API_KEY || '',
      apiVersion: env().AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
      chatDeployment: env().AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
      imageDeployment: process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT,
      speechKey: process.env.AZURE_SPEECH_KEY,
      speechRegion: process.env.AZURE_SPEECH_REGION
    };

    if (!config.endpoint || !config.apiKey) {
      structuredLogger.warn('Azure OpenAI configuration incomplete, running in demo mode');
    }

    return config;
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info('Initializing Azure OpenAI Integration Service', {
        service: 'AzureIntegrationService',
        endpoint: this.config.endpoint ? 'configured' : 'demo mode',
        timestamp: new Date().toISOString()
      });

      // Verificar conectividad si está configurado
      if (this.config.endpoint && this.config.apiKey) {
        await this.checkServiceHealth();
      }

      this.isInitialized = true;
      structuredLogger.info('Azure OpenAI Integration Service initialized successfully');
    } catch (error) {
      structuredLogger.error('Failed to initialize Azure OpenAI Integration Service', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // CHAT COMPLETION
  // ============================================================================

  async generateChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    if (!this.isInitialized) {
      throw new Error('Azure Integration Service not initialized');
    }

    if (!this.config.endpoint || !this.config.apiKey) {
      return this.generateDemoChatResponse(request);
    }

    try {
      const startTime = Date.now();

      const response = await fetch(`${this.config.endpoint}/openai/deployments/${this.config.chatDeployment}/chat/completions?api-version=${this.config.apiVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          messages: request.messages,
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
          top_p: request.topP || 1,
          frequency_penalty: request.frequencyPenalty || 0,
          presence_penalty: request.presencePenalty || 0,
          stop: request.stop
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      const responseTime = Date.now() - startTime;

      structuredLogger.info('Chat completion generated successfully', {
        model: data.model,
        tokens: data.usage.totalTokens,
        responseTime,
        finishReason: data.choices[0]?.finishReason
      });

      return data;

    } catch (error) {
      structuredLogger.error('Failed to generate chat completion', error as Error);
      throw error;
    }
  }

  private generateDemoChatResponse(request: ChatRequest): ChatResponse {
    const lastMessage = request.messages[request.messages.length - 1];
    const demoResponse = this.generateDemoResponse(lastMessage.content);

    return {
      id: `chatcmpl-demo-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-4o-mini-demo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: demoResponse
        },
        finishReason: 'stop'
      }],
      usage: {
        promptTokens: lastMessage.content.length / 4,
        completionTokens: demoResponse.length / 4,
        totalTokens: (lastMessage.content.length + demoResponse.length) / 4
      }
    };
  }

  private generateDemoResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      return '¡Hola! Soy un asistente de IA en modo demo. ¿En qué puedo ayudarte hoy?';
    }

    if (lowerPrompt.includes('weather') || lowerPrompt.includes('clima')) {
      return 'En modo demo, no puedo acceder a datos meteorológicos en tiempo real. Para obtener información del clima, necesitarías configurar las credenciales de Azure OpenAI.';
    }

    if (lowerPrompt.includes('code') || lowerPrompt.includes('programming')) {
      return 'Puedo ayudarte con programación. Aquí tienes un ejemplo de función en JavaScript:\n\n```javascript\nfunction saludar(nombre): void {\n  return `¡Hola, ${nombre}!`;\n}\n```\n\n¿Te gustaría que te ayude con algo específico?';
    }

    return `He recibido tu mensaje: "${prompt}". En modo demo, puedo simular respuestas pero para funcionalidad completa necesitarías configurar Azure OpenAI. ¿Hay algo específico en lo que pueda ayudarte?`;
  }

  // ============================================================================
  // IMAGE GENERATION
  // ============================================================================

  async generateImage(request: ImageRequest): Promise<ImageResponse> {
    if (!this.isInitialized) {
      throw new Error('Azure Integration Service not initialized');
    }

    if (!this.config.endpoint || !this.config.apiKey || !this.config.imageDeployment) {
      return this.generateDemoImageResponse(request);
    }

    try {
      const response = await fetch(`${this.config.endpoint}/openai/deployments/${this.config.imageDeployment}/images/generations?api-version=${this.config.apiVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        },
        body: JSON.stringify({
          prompt: request.prompt,
          size: request.size || '1024x1024',
          quality: request.quality || 'standard',
          style: request.style || 'vivid',
          n: request.n || 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure OpenAI Image API error: ${response.status} - ${errorText}`);
      }

      const data: ImageResponse = await response.json();

      structuredLogger.info('Image generated successfully', {
        prompt: request.prompt,
        size: request.size,
        quality: request.quality
      });

      return data;

    } catch (error) {
      structuredLogger.error('Failed to generate image', error as Error);
      throw error;
    }
  }

  private generateDemoImageResponse(request: ImageRequest): ImageResponse {
    return {
      created: Math.floor(Date.now() / 1000),
      data: [{
        url: `https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=${encodeURIComponent(request.prompt)}`,
        revisedPrompt: `Demo image for: ${request.prompt}`
      }]
    };
  }

  // ============================================================================
  // TEXT TO SPEECH
  // ============================================================================

  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    if (!this.isInitialized) {
      throw new Error('Azure Integration Service not initialized');
    }

    if (!this.config.speechKey || !this.config.speechRegion) {
      return this.generateDemoSpeechResponse(request);
    }

    try {
      const ssml = this.generateSSML(request);

      const response = await fetch(`https://${this.config.speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'Ocp-Apim-Subscription-Key': this.config.speechKey
        },
        body: ssml
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
      }

      const audioData = await response.arrayBuffer();
      const duration = this.estimateAudioDuration(request.text);

      structuredLogger.info('Speech generated successfully', {
        textLength: request.text.length,
        voice: request.voice,
        duration
      });

      return {
        audioData,
        contentType: 'audio/mpeg',
        duration
      };

    } catch (error) {
      structuredLogger.error('Failed to generate speech', error as Error);
      throw error;
    }
  }

  private generateSSML(request: TTSRequest): string {
    const voice = request.voice || 'es-ES-ElviraNeural';
    const rate = request.rate || 1.0;
    const pitch = request.pitch || 1.0;

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${request.language || 'es-ES'}">
      <voice name="${voice}">
        <prosody rate="${rate}" pitch="${pitch}">
          ${this.escapeXml(request.text)}
        </prosody>
      </voice>
    </speak>`;
  }

  private escapeXml(text: string): string {
    return text;
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private estimateAudioDuration(text: string): number {
    // Estimación aproximada: 150 palabras por minuto
    const wordsPerMinute = 150;
    const wordCount = text.split(/\s+/).length;
    return (wordCount / wordsPerMinute) * 60;
  }

  private generateDemoSpeechResponse(request: TTSRequest): TTSResponse {
    // Generar un audio demo simple (silencio)
    const duration = this.estimateAudioDuration(request.text);
    const audioData = new ArrayBuffer(1024); // Audio demo vacío

    return {
      audioData,
      contentType: 'audio/mpeg',
      duration
    };
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  async checkServiceHealth(): Promise<Map<string, AzureServiceHealth>> {
    const now = new Date();

    // Cache health checks for 5 minutes
    if (now.getTime() - this.lastHealthCheck.getTime() < 5 * 60 * 1000) {
      return this.healthCache;
    }

    const services = ['chat', 'image', 'speech'];
    const healthResults = new Map<string, AzureServiceHealth>();

    for (const service of services) {
      try {
        const startTime = Date.now();
        await this.checkSpecificService(service);
        const responseTime = Date.now() - startTime;

        healthResults.set(service, {
          service,
          status: 'healthy',
          lastCheck: now,
          responseTime
        });
      } catch (error) {
        healthResults.set(service, {
          service,
          status: 'unhealthy',
          lastCheck: now,
          error: (error as Error).message
        });
      }
    }

    this.healthCache = healthResults;
    this.lastHealthCheck = now;

    return healthResults;
  }

  private async checkSpecificService(service: string): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) {
      // En modo demo, todos los servicios están "disponibles"
      return;
    }

    switch (service) {
      case 'chat':
        await this.testChatService();
        break;
      case 'image':
        await this.testImageService();
        break;
      case 'speech':
        await this.testSpeechService();
        break;
    }
  }

  private async testChatService(): Promise<void> {
    const testRequest: ChatRequest = {
      messages: [{ role: 'user', content: 'test' }],
      maxTokens: 1
    };

    await this.generateChatCompletion(testRequest);
  }

  private async testImageService(): Promise<void> {
    if (!this.config.imageDeployment) {
      throw new Error('Image deployment not configured');
    }

    const testRequest: ImageRequest = {
      prompt: 'test',
      size: '1024x1024'
    };

    await this.generateImage(testRequest);
  }

  private async testSpeechService(): Promise<void> {
    if (!this.config.speechKey || !this.config.speechRegion) {
      throw new Error('Speech service not configured');
    }

    const testRequest: TTSRequest = {
      text: 'test'
    };

    await this.generateSpeech(testRequest);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getConfiguration(): Partial<AzureOpenAIConfig> {
    return {
      endpoint: this.config.endpoint ? 'configured' : 'demo mode',
      apiVersion: this.config.apiVersion,
      chatDeployment: this.config.chatDeployment,
      imageDeployment: this.config.imageDeployment ? 'configured' : 'not configured',
      speechKey: this.config.speechKey ? 'configured' : 'not configured',
      speechRegion: this.config.speechRegion
    };
  }

  isConfigured(): boolean {
    return !!(this.config.endpoint && this.config.apiKey);
  }

  getAvailableServices(): string[] {
    const services = ['chat'];

    if (this.config.imageDeployment) {
      services.push('image');
    }

    if (this.config.speechKey && this.config.speechRegion) {
      services.push('speech');
    }

    return services;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const azureIntegration = new AzureIntegrationService();
