// ============================================================================
// CLIENTE DEL SISTEMA DE AI CHAT AVANZADO - BFF
// ============================================================================

// Este archivo contiene la lógica del cliente para interactuar con el sistema de AI Chat
// a través del BFF (Backend for Frontend) de Next.js

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
  score: number;
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

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: string[];
  isAvailable: boolean;
}

class WebAIChatSystem {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/ai-chat';
    console.log('WebAIChatSystem initialized (client-side)');
  }

  // ============================================================================
  // GESTIÓN DE SESIONES
  // ============================================================================

  async createSession(userId: string, orgId: string, title: string, model: string = 'gpt-4'): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, orgId, title, model }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    return response.json();
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }
    return response.json();
  }

  async listSessions(userId: string, orgId: string): Promise<ChatSession[]> {
    const params = new URLSearchParams({ userId, orgId });
    const response = await fetch(`${this.baseUrl}/sessions?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to list sessions: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  // ============================================================================
  // PROCESAMIENTO DE MENSAJES
  // ============================================================================

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    return response.json();
  }

  async sendMessageStream(request: ChatRequest): Promise<ReadableStream<ChatResponse>> {
    const response = await fetch(`${this.baseUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Failed to send message stream: ${response.statusText}`);
    }
    return response.body!;
  }

  // ============================================================================
  // MODELOS Y FUNCIONES
  // ============================================================================

  async getAvailableModels(): Promise<AIModel[]> {
    const response = await fetch(`${this.baseUrl}/models`);
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }
    return response.json();
  }

  async getAvailableFunctions(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/functions`);
    if (!response.ok) {
      throw new Error(`Failed to get functions: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // ANÁLISIS DE SENTIMIENTOS
  // ============================================================================

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    const response = await fetch(`${this.baseUrl}/sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      throw new Error(`Failed to analyze sentiment: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================

  async getStatistics(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to get statistics: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.getSession(sessionId);
    return session.messages;
  }

  async getSessionSentiment(sessionId: string): Promise<SentimentAnalysis | null> {
    const session = await this.getSession(sessionId);
    return session.metadata?.averageSentiment || null;
  }

  async getSessionCost(sessionId: string): Promise<number> {
    const session = await this.getSession(sessionId);
    return session.metadata?.totalCost || 0;
  }

  // ============================================================================
  // MÉTODOS DE CONVENIENCIA
  // ============================================================================

  async startNewChat(userId: string, orgId: string, initialMessage: string, model: string = 'gpt-4'): Promise<ChatResponse> {
    const title = initialMessage.substring(0, 50) + '...';
    const session = await this.createSession(userId, orgId, title, model);
    
    return this.sendMessage({
      sessionId: session.id,
      message: initialMessage,
      model,
      userId,
      orgId,
    });
  }

  async continueChat(sessionId: string, message: string, userId: string, orgId: string): Promise<ChatResponse> {
    return this.sendMessage({
      sessionId,
      message,
      userId,
      orgId,
    });
  }

  async getRecentSessions(userId: string, orgId: string, limit: number = 10): Promise<ChatSession[]> {
    const sessions = await this.listSessions(userId, orgId);
    return sessions.slice(0, limit);
  }

  async getSessionSummary(sessionId: string): Promise<{
    messageCount: number;
    totalTokens: number;
    totalCost: number;
    averageSentiment: SentimentAnalysis | null;
    duration: number;
  }> {
    const session = await this.getSession(sessionId);
    const duration = session.updatedAt.getTime() - session.createdAt.getTime();
    
    return {
      messageCount: session.metadata?.messageCount || 0,
      totalTokens: session.metadata?.totalTokens || 0,
      totalCost: session.metadata?.totalCost || 0,
      averageSentiment: session.metadata?.averageSentiment || null,
      duration,
    };
  }
}

// Instancia global
export const webAIChatSystem = new WebAIChatSystem();
