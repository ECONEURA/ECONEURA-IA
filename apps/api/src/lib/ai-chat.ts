// ============================================================================
// SISTEMA DE AI CHAT AVANZADO
// ============================================================================

import { logger } from './logger.js';
import { metrics } from './metrics.js';
import { tracing } from './tracing.js';
import { finOpsSystem } from './finops.js';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: string[];
  isAvailable: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    sentiment?: SentimentAnalysis;
    functionCall?: FunctionCall;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    totalTokens: number;
    totalCost: number;
    messageCount: number;
    averageSentiment: SentimentAnalysis;
  };
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  functions?: string[];
  stream?: boolean;
  userId: string;
  orgId: string;
}

export interface ChatResponse {
  sessionId: string;
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  sentiment?: SentimentAnalysis;
  functionCalls?: FunctionCall[];
}

// ============================================================================
// MODELOS AI DISPONIBLES
// ============================================================================

const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    maxTokens: 8192,
    costPer1kTokens: 0.03,
    capabilities: ['chat', 'functions', 'sentiment', 'streaming'],
    isAvailable: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    maxTokens: 128000,
    costPer1kTokens: 0.01,
    capabilities: ['chat', 'functions', 'sentiment', 'streaming'],
    isAvailable: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    costPer1kTokens: 0.002,
    capabilities: ['chat', 'functions', 'streaming'],
    isAvailable: true,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    capabilities: ['chat', 'functions', 'sentiment', 'streaming'],
    isAvailable: true,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    maxTokens: 200000,
    costPer1kTokens: 0.003,
    capabilities: ['chat', 'functions', 'sentiment', 'streaming'],
    isAvailable: true,
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    maxTokens: 32768,
    costPer1kTokens: 0.001,
    capabilities: ['chat', 'functions', 'streaming'],
    isAvailable: true,
  },
];

// ============================================================================
// FUNCIONES PERSONALIZADAS
// ============================================================================

export interface CustomFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  handler: (args: Record<string, any>) => Promise<any>;
}

const CUSTOM_FUNCTIONS: CustomFunction[] = [
  {
    name: 'get_weather',
    description: 'Get current weather information for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or coordinates',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit',
        },
      },
      required: ['location'],
    },
    handler: async (args) => {
      const { location, unit = 'celsius' } = args;
      logger.info('Getting weather for location', { location, unit });
      
      return {
        location,
        temperature: unit === 'celsius' ? 22 : 72,
        condition: 'sunny',
        humidity: 65,
        windSpeed: 10,
        unit,
      };
    },
  },
  {
    name: 'search_products',
    description: 'Search for products in the inventory system',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        category: {
          type: 'string',
          description: 'Product category filter',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
        },
      },
      required: ['query'],
    },
    handler: async (args) => {
      const { query, category, limit = 10 } = args;
      logger.info('Searching products', { query, category, limit });
      
      return {
        query,
        results: [
          {
            id: 'prod-1',
            name: 'Sample Product',
            category: 'electronics',
            price: 99.99,
            inStock: true,
          },
        ],
        total: 1,
      };
    },
  },
];

// ============================================================================
// CLASE PRINCIPAL DEL SISTEMA DE AI CHAT
// ============================================================================

export class AdvancedAIChatSystem {
  private sessions: Map<string, ChatSession> = new Map();
  private models: Map<string, AIModel> = new Map();
  private functions: Map<string, CustomFunction> = new Map();

  constructor() {
    // Inicializar modelos
    AVAILABLE_MODELS.forEach(model => {
      this.models.set(model.id, model);
    });

    // Inicializar funciones personalizadas
    CUSTOM_FUNCTIONS.forEach(func => {
      this.functions.set(func.name, func);
    });

    logger.info('Advanced AI Chat System initialized', {
      modelsCount: this.models.size,
      functionsCount: this.functions.size,
    });
  }

  // ============================================================================
  // GESTIÓN DE SESIONES
  // ============================================================================

  async createSession(userId: string, orgId: string, title: string, model: string = 'gpt-4'): Promise<ChatSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      orgId,
      title,
      model,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        totalTokens: 0,
        totalCost: 0,
        messageCount: 0,
        averageSentiment: {
          score: 0,
          label: 'neutral',
          confidence: 0,
          emotions: {
            joy: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0,
          },
        },
      },
    };

    this.sessions.set(sessionId, session);
    
          logger.info('Chat session created', {
        sessionId,
        userId,
        orgId,
        aiModel: model,
      });

    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async listSessions(userId: string, orgId: string): Promise<ChatSession[]> {
    const userSessions: ChatSession[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.orgId === orgId) {
        userSessions.push(session);
      }
    }

    return userSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      logger.info('Chat session deleted', { sessionId });
    }
  }

  // ============================================================================
  // PROCESAMIENTO DE MENSAJES
  // ============================================================================

  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Obtener o crear sesión
      let session: ChatSession;
      if (request.sessionId) {
        const existingSession = await this.getSession(request.sessionId);
        if (!existingSession) {
          throw new Error('Session not found');
        }
        session = existingSession;
      } else {
        session = await this.createSession(
          request.userId,
          request.orgId,
          request.message.substring(0, 50) + '...',
          request.model || 'gpt-4'
        );
      }

      // Validar modelo
      const model = this.models.get(session.model);
      if (!model || !model.isAvailable) {
        throw new Error(`Model ${session.model} is not available`);
      }

      // Crear mensaje del usuario
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: request.message,
        timestamp: new Date(),
      };

      // Analizar sentimiento del mensaje del usuario
      const userSentiment = await this.analyzeSentiment(request.message);
      userMessage.metadata = { sentiment: userSentiment };

      // Agregar mensaje a la sesión
      session.messages.push(userMessage);

      // Procesar con AI
      const aiResponse = await this.generateAIResponse(session, request);

      // Crear mensaje de respuesta
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        metadata: {
          model: session.model,
          tokens: aiResponse.usage.totalTokens,
          cost: aiResponse.usage.cost,
          functionCall: aiResponse.functionCalls?.[0],
        },
      };

      // Agregar respuesta a la sesión
      session.messages.push(assistantMessage);

      // Actualizar metadatos de la sesión
      session.updatedAt = new Date();
      session.metadata!.totalTokens += aiResponse.usage.totalTokens;
      session.metadata!.totalCost += aiResponse.usage.cost;
      session.metadata!.messageCount += 2;

      // Actualizar sentimiento promedio
      this.updateSessionSentiment(session);

      // Registrar métricas
      metrics.increment('ai_chat.messages_processed', 1, {
        model: session.model,
        orgId: session.orgId,
      });

      metrics.histogram('ai_chat.response_time_ms', Date.now() - startTime, {
        model: session.model,
      });

      metrics.histogram('ai_chat.tokens_used', aiResponse.usage.totalTokens, {
        model: session.model,
      });

      // Registrar costos en FinOps
      // await finOpsSystem.trackCost(aiResponse.usage.cost);

      return {
        sessionId: session.id,
        message: assistantMessage,
        usage: aiResponse.usage,
        sentiment: userSentiment,
        functionCalls: aiResponse.functionCalls,
      };

    } catch (error) {
      logger.error('Error processing chat message', {
        error: (error as Error).message,
        request,
      });
      throw error;
    }
  }

  // ============================================================================
  // GENERACIÓN DE RESPUESTAS AI
  // ============================================================================

  private async generateAIResponse(session: ChatSession, request: ChatRequest): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number; cost: number };
    functionCalls?: FunctionCall[];
  }> {
    const model = this.models.get(session.model)!;
    
    // Preparar mensajes para el modelo
    const messages = this.prepareMessagesForModel(session.messages);
    
    // Preparar funciones si se solicitan
    const availableFunctions = request.functions 
      ? request.functions.map(name => this.functions.get(name)).filter(Boolean)
      : [];

    // Simular llamada a API de AI
    const response = await this.callAIModel(model, messages, {
      temperature: request.temperature || 0.7,
      maxTokens: request.maxTokens || model.maxTokens,
      functions: availableFunctions.length > 0 ? availableFunctions.map(f => ({
        name: f!.name,
        description: f!.description,
        parameters: f!.parameters,
      })) : undefined,
    });

    // Procesar llamadas a funciones si existen
    let functionCalls: FunctionCall[] | undefined;
    if (response.functionCalls) {
      functionCalls = await this.executeFunctionCalls(response.functionCalls);
      
      // Si hay llamadas a funciones, generar una nueva respuesta
      if (functionCalls.length > 0) {
        const functionMessages = functionCalls.map(fc => ({
          role: 'function' as const,
          name: fc.name,
          content: JSON.stringify(fc.result),
        }));

        const finalResponse = await this.callAIModel(model, [
          ...messages,
          ...functionMessages,
        ], {
          temperature: request.temperature || 0.7,
          maxTokens: request.maxTokens || model.maxTokens,
        });

        return {
          content: finalResponse.content,
          usage: {
            promptTokens: response.usage.promptTokens + finalResponse.usage.promptTokens,
            completionTokens: response.usage.completionTokens + finalResponse.usage.completionTokens,
            totalTokens: response.usage.totalTokens + finalResponse.usage.totalTokens,
            cost: response.usage.cost + finalResponse.usage.cost,
          },
          functionCalls,
        };
      }
    }

    return {
      content: response.content,
      usage: response.usage,
      functionCalls,
    };
  }

  private async callAIModel(
    model: AIModel,
    messages: any[],
    options: {
      temperature?: number;
      maxTokens?: number;
      functions?: any[];
    }
  ): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number; cost: number };
    functionCalls?: FunctionCall[];
  }> {
    // Simulación de llamada a API de AI
    const promptTokens = Math.ceil(JSON.stringify(messages).length / 4);
    const completionTokens = Math.ceil(Math.random() * 100) + 50;
    const totalTokens = promptTokens + completionTokens;
    const cost = (totalTokens / 1000) * model.costPer1kTokens;

    // Simular respuesta
    const content = `This is a simulated response from ${model.name}. The user said: "${messages[messages.length - 1]?.content}". I'm here to help with any questions or tasks you might have.`;

    // Simular llamadas a funciones (20% de probabilidad)
    let functionCalls: FunctionCall[] | undefined;
    if (options.functions && Math.random() < 0.2) {
      const randomFunction = options.functions[Math.floor(Math.random() * options.functions.length)];
      functionCalls = [{
        name: randomFunction.name,
        arguments: { query: 'sample query' },
      }];
    }

    return {
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
      },
      functionCalls,
    };
  }

  // ============================================================================
  // EJECUCIÓN DE FUNCIONES PERSONALIZADAS
  // ============================================================================

  private async executeFunctionCalls(functionCalls: FunctionCall[]): Promise<FunctionCall[]> {
    const results: FunctionCall[] = [];

    for (const call of functionCalls) {
      const func = this.functions.get(call.name);
      if (func) {
        try {
          const result = await func.handler(call.arguments);
          results.push({
            ...call,
            result,
          });

          logger.info('Function executed successfully', {
            functionName: call.name,
            arguments: call.arguments,
          });
        } catch (error) {
          logger.error('Function execution failed', {
            functionName: call.name,
            error: (error as Error).message,
          });

          results.push({
            ...call,
            result: { error: (error as Error).message },
          });
        }
      } else {
        logger.warn('Function not found', { functionName: call.name });
        results.push({
          ...call,
          result: { error: 'Function not found' },
        });
      }
    }

    return results;
  }

  // ============================================================================
  // ANÁLISIS DE SENTIMIENTOS
  // ============================================================================

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Simulación de análisis de sentimientos
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;

    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'fear'];

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore += 1;
      if (negativeWords.includes(word)) negativeScore += 1;
    });

    const score = (positiveScore - negativeScore) / Math.max(words.length, 1);
    const normalizedScore = Math.max(-1, Math.min(1, score));

    return {
      score: normalizedScore,
      label: normalizedScore > 0.1 ? 'positive' : normalizedScore < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(normalizedScore),
      emotions: {
        joy: Math.max(0, normalizedScore),
        sadness: Math.max(0, -normalizedScore),
        anger: Math.random() * 0.3,
        fear: Math.random() * 0.2,
        surprise: Math.random() * 0.1,
      },
    };
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  private prepareMessagesForModel(messages: ChatMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.metadata?.functionCall && {
        name: msg.metadata.functionCall.name,
      }),
    }));
  }

  private updateSessionSentiment(session: ChatSession): void {
    const sentiments = session.messages
      .map(m => m.metadata?.sentiment)
      .filter(Boolean) as SentimentAnalysis[];

    if (sentiments.length > 0) {
      const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      const avgConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

      session.metadata!.averageSentiment = {
        score: avgScore,
        label: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral',
        confidence: avgConfidence,
        emotions: {
          joy: sentiments.reduce((sum, s) => sum + s.emotions.joy, 0) / sentiments.length,
          sadness: sentiments.reduce((sum, s) => sum + s.emotions.sadness, 0) / sentiments.length,
          anger: sentiments.reduce((sum, s) => sum + s.emotions.anger, 0) / sentiments.length,
          fear: sentiments.reduce((sum, s) => sum + s.emotions.fear, 0) / sentiments.length,
          surprise: sentiments.reduce((sum, s) => sum + s.emotions.surprise, 0) / sentiments.length,
        },
      };
    }
  }

  // ============================================================================
  // MÉTODOS PÚBLICOS
  // ============================================================================

  getAvailableModels(): AIModel[] {
    return Array.from(this.models.values()).filter(m => m.isAvailable);
  }

  getAvailableFunctions(): CustomFunction[] {
    return Array.from(this.functions.values());
  }

  async getStatistics(): Promise<{
    totalSessions: number;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    averageSentiment: SentimentAnalysis;
    modelUsage: Record<string, number>;
  }> {
    let totalSessions = 0;
    let totalMessages = 0;
    let totalTokens = 0;
    let totalCost = 0;
    const modelUsage: Record<string, number> = {};
    const allSentiments: SentimentAnalysis[] = [];

    for (const session of this.sessions.values()) {
      totalSessions++;
      totalMessages += session.metadata?.messageCount || 0;
      totalTokens += session.metadata?.totalTokens || 0;
      totalCost += session.metadata?.totalCost || 0;
      
      modelUsage[session.model] = (modelUsage[session.model] || 0) + 1;
      
      if (session.metadata?.averageSentiment) {
        allSentiments.push(session.metadata.averageSentiment);
      }
    }

    const averageSentiment: SentimentAnalysis = allSentiments.length > 0
      ? {
          score: allSentiments.reduce((sum, s) => sum + s.score, 0) / allSentiments.length,
          label: 'neutral',
          confidence: allSentiments.reduce((sum, s) => sum + s.confidence, 0) / allSentiments.length,
          emotions: {
            joy: allSentiments.reduce((sum, s) => sum + s.emotions.joy, 0) / allSentiments.length,
            sadness: allSentiments.reduce((sum, s) => sum + s.emotions.sadness, 0) / allSentiments.length,
            anger: allSentiments.reduce((sum, s) => sum + s.emotions.anger, 0) / allSentiments.length,
            fear: allSentiments.reduce((sum, s) => sum + s.emotions.fear, 0) / allSentiments.length,
            surprise: allSentiments.reduce((sum, s) => sum + s.emotions.surprise, 0) / allSentiments.length,
          },
        }
      : {
          score: 0,
          label: 'neutral',
          confidence: 0,
          emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 },
        };

    return {
      totalSessions,
      totalMessages,
      totalTokens,
      totalCost,
      averageSentiment,
      modelUsage,
    };
  }
}

// Instancia global
export const advancedAIChatSystem = new AdvancedAIChatSystem();
