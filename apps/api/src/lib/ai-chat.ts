// ============================================================================
// SISTEMA DE AI CHAT AVANZADO
// ============================================================================

import { logger } from './logger.js';

// Interfaces
export interface ChatSession {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    messageCount?: number;
    totalTokens?: number;
    totalCost?: number;
    averageSentiment?: number;
  };
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    cost?: number;
    sentiment?: number;
    functionCalls?: FunctionCall[];
  };
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  model?: string;
  functions?: string[];
  context?: Record<string, any>;
}

export interface ChatResponse {
  messageId: string;
  content: string;
  model: string;
  tokens: number;
  cost: number;
  sentiment?: number;
  functionCalls?: FunctionCall[];
  timestamp: Date;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPerToken: number;
  capabilities: string[];
  isAvailable: boolean;
}

export interface SentimentAnalysis {
  score: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions?: Record<string, number>;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

// Sistema de AI Chat Avanzado
export class AdvancedAIChatSystem {
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private models: AIModel[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      maxTokens: 8192,
      costPerToken: 0.00003,
      capabilities: ['chat', 'function-calling', 'sentiment-analysis'],
      isAvailable: true,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      maxTokens: 4096,
      costPerToken: 0.000002,
      capabilities: ['chat', 'function-calling'],
      isAvailable: true,
    },
    {
      id: 'claude-3',
      name: 'Claude 3',
      provider: 'Anthropic',
      maxTokens: 100000,
      costPerToken: 0.000015,
      capabilities: ['chat', 'function-calling', 'sentiment-analysis'],
      isAvailable: true,
    },
  ];

  private availableFunctions = [
    {
      name: 'get_weather',
      description: 'Get current weather information',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
    {
      name: 'search_products',
      description: 'Search for products in inventory',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          category: { type: 'string', description: 'Product category' },
          limit: { type: 'number', description: 'Maximum results' },
        },
        required: ['query'],
      },
    },
    {
      name: 'calculate_cost',
      description: 'Calculate operation cost',
      parameters: {
        type: 'object',
        properties: {
          operation: { type: 'string', description: 'Operation type' },
          tokens: { type: 'number', description: 'Number of tokens' },
          model: { type: 'string', description: 'AI model used' },
        },
        required: ['operation', 'tokens'],
      },
    },
  ];

  // Gestión de sesiones
  async listSessions(userId: string, orgId: string): Promise<ChatSession[]> {
    const userSessions = Array.from(this.sessions.values()).filter(
      session => session.userId === userId && session.orgId === orgId
    );
    
    logger.info('Listed chat sessions', { userId, orgId, count: userSessions.length });
    return userSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createSession(userId: string, orgId: string, title: string, model: string = 'gpt-4'): Promise<ChatSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      userId,
      orgId,
      title,
      model,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        messageCount: 0,
        totalTokens: 0,
        totalCost: 0,
        averageSentiment: 0,
      },
    };

    this.sessions.set(sessionId, session);
    this.messages.set(sessionId, []);

    logger.info('Created chat session', { sessionId, userId, orgId, title, model });
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const session = this.sessions.get(sessionId);
    if (session) {
      logger.info('Retrieved chat session', { sessionId });
    }
    return session || null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const deleted = this.sessions.delete(sessionId);
    this.messages.delete(sessionId);
    
    if (deleted) {
      logger.info('Deleted chat session', { sessionId });
    }
  }

  // Procesamiento de mensajes
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const session = await this.getSession(request.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const model = this.models.find(m => m.id === (request.model || session.model));
    if (!model || !model.isAvailable) {
      throw new Error('Model not available');
    }

    // Simular procesamiento de mensaje
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tokens = Math.ceil(request.message.length / 4); // Estimación simple
    const cost = tokens * model.costPerToken;
    const sentiment = await this.analyzeSentiment(request.message);

    // Simular respuesta del AI
    const responseContent = `This is a simulated AI response to: "${request.message}". I understand your request and can help you with various tasks.`;

    const response: ChatResponse = {
      messageId,
      content: responseContent,
      model: model.id,
      tokens,
      cost,
      sentiment: sentiment.score,
      timestamp: new Date(),
    };

    // Guardar mensajes
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sessionId: request.sessionId,
      role: 'user',
      content: request.message,
      timestamp: new Date(),
      metadata: { tokens, cost: 0, sentiment: sentiment.score },
    };

    const assistantMessage: ChatMessage = {
      id: messageId,
      sessionId: request.sessionId,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      metadata: { tokens, cost, sentiment: sentiment.score },
    };

    const sessionMessages = this.messages.get(request.sessionId) || [];
    sessionMessages.push(userMessage, assistantMessage);
    this.messages.set(request.sessionId, sessionMessages);

    // Actualizar sesión
    session.updatedAt = new Date();
    session.metadata = session.metadata || {};
    session.metadata.messageCount = (session.metadata.messageCount || 0) + 2;
    session.metadata.totalTokens = (session.metadata.totalTokens || 0) + tokens * 2;
    session.metadata.totalCost = (session.metadata.totalCost || 0) + cost;
    session.metadata.averageSentiment = this.calculateAverageSentiment(sessionMessages);

    logger.info('Processed chat message', { 
      sessionId: request.sessionId, 
      messageId, 
      tokens, 
      cost, 
      sentiment: sentiment.score 
    });

    return response;
  }

  // Modelos disponibles
  getAvailableModels(): AIModel[] {
    return this.models.filter(model => model.isAvailable);
  }

  // Funciones disponibles
  getAvailableFunctions(): any[] {
    return this.availableFunctions;
  }

  // Análisis de sentimientos
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Simulación simple de análisis de sentimientos
    const words = text.toLowerCase().split(' ');
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated'];

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    let score = 0;
    let label: 'positive' | 'negative' | 'neutral' = 'neutral';

    if (positiveCount > negativeCount) {
      score = Math.min(1, (positiveCount - negativeCount) / 10);
      label = 'positive';
    } else if (negativeCount > positiveCount) {
      score = Math.max(-1, (negativeCount - positiveCount) / 10);
      label = 'negative';
    }

    const confidence = Math.abs(score);

    logger.info('Analyzed sentiment', { text: text.substring(0, 50), score, label, confidence });

    return {
      score,
      label,
      confidence,
      emotions: {
        joy: positiveCount > 0 ? positiveCount / words.length : 0,
        sadness: negativeCount > 0 ? negativeCount / words.length : 0,
        anger: negativeCount > 0 ? negativeCount / words.length : 0,
      },
    };
  }

  // Estadísticas
  async getStatistics(): Promise<any> {
    const totalSessions = this.sessions.size;
    const totalMessages = Array.from(this.messages.values()).reduce((sum, messages) => sum + messages.length, 0);
    const totalTokens = Array.from(this.sessions.values()).reduce((sum, session) => sum + (session.metadata?.totalTokens || 0), 0);
    const totalCost = Array.from(this.sessions.values()).reduce((sum, session) => sum + (session.metadata?.totalCost || 0), 0);

    const stats = {
      totalSessions,
      totalMessages,
      totalTokens,
      totalCost,
      averageMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
      averageTokensPerSession: totalSessions > 0 ? totalTokens / totalSessions : 0,
      averageCostPerSession: totalSessions > 0 ? totalCost / totalSessions : 0,
      models: this.models.map(model => ({
        id: model.id,
        name: model.name,
        usage: 0, // Implementar tracking de uso por modelo
      })),
    };

    logger.info('Generated AI chat statistics', stats);
    return stats;
  }

  // Métodos auxiliares
  private calculateAverageSentiment(messages: ChatMessage[]): number {
    const sentiments = messages
      .map(msg => msg.metadata?.sentiment)
      .filter(sentiment => sentiment !== undefined) as number[];

    if (sentiments.length === 0) return 0;
    return sentiments.reduce((sum, sentiment) => sum + sentiment, 0) / sentiments.length;
  }
}

// Instancia singleton
export const advancedAIChatSystem = new AdvancedAIChatSystem();
