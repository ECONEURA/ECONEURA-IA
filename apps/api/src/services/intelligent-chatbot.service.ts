import { AIRouter } from '@econeura/shared';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId?: string;
  content: string;
  type: 'user' | 'bot' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
  intent?: string;
  confidence?: number;
  entities?: ChatEntity[];
}

export interface ChatEntity {
  type: string;
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface ChatSession {
  id: string;
  userId?: string;
  status: 'active' | 'closed' | 'transferred';
  createdAt: Date;
  lastActivity: Date;
  messages: ChatMessage[];
  context: ChatContext;
  metadata: Record<string, any>;
}

export interface ChatContext {
  userProfile?: {
    name?: string;
    role?: string;
    department?: string;
    preferences?: Record<string, any>;
  };
  conversationHistory: string[];
  currentIntent?: string;
  pendingActions: string[];
  sessionData: Record<string, any>;
}

export interface ChatbotResponse {
  message: string;
  confidence: number;
  intent: string;
  entities: ChatEntity[];
  suggestedActions: string[];
  followUpQuestions: string[];
  metadata: Record<string, any>;
}

export interface ChatbotAnalytics {
  totalSessions: number;
  activeSessions: number;
  averageSessionDuration: number;
  commonIntents: Array<{ intent: string; count: number }>;
  userSatisfaction: number;
  resolutionRate: number;
}

export interface ChatbotSkill {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'sales' | 'support' | 'technical' | 'custom';
  enabled: boolean;
  confidence: number;
  examples: string[];
  responses: string[];
  actions: string[];
}

class IntelligentChatbotService {
  private sessions: Map<string, ChatSession> = new Map();
  private skills: Map<string, ChatbotSkill> = new Map();
  private conversationHistory: Array<{ sessionId: string; message: string; timestamp: Date }> = [];

  constructor() {
    this.initializeDefaultSkills();
  }

  async createSession(userId?: string): Promise<ChatSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const session: ChatSession = {
        id: sessionId,
        userId,
        status: 'active',
        createdAt: now,
        lastActivity: now,
        messages: [],
        context: {
          conversationHistory: [],
          pendingActions: [],
          sessionData: {}
        },
        metadata: {}
      };

      this.sessions.set(sessionId, session);
      
      // Mensaje de bienvenida
      await this.addMessage(sessionId, {
        content: this.generateWelcomeMessage(),
        type: 'bot',
        intent: 'greeting',
        confidence: 1.0
      });

      return session;
    } catch (error) {
      throw error;
    }
  }

  async sendMessage(sessionId: string, content: string, userId?: string): Promise<ChatbotResponse> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Agregar mensaje del usuario
      await this.addMessage(sessionId, {
        content,
        type: 'user',
        userId
      });

      // Procesar mensaje y generar respuesta
      const response = await this.processMessage(session, content);
      
      // Agregar respuesta del bot
      await this.addMessage(sessionId, {
        content: response.message,
        type: 'bot',
        intent: response.intent,
        confidence: response.confidence,
        entities: response.entities
      });

      // Actualizar contexto
      this.updateSessionContext(session, response);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'closed';
      session.lastActivity = new Date();
    }
  }

  async addSkill(skill: Omit<ChatbotSkill, 'id'>): Promise<ChatbotSkill> {
    try {
      const id = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newSkill: ChatbotSkill = {
        ...skill,
        id
      };

      this.skills.set(id, newSkill);
      return newSkill;
    } catch (error) {
      throw error;
    }
  }

  async getSkills(): Promise<ChatbotSkill[]> {
    return Array.from(this.skills.values());
  }

  async updateSkill(skillId: string, updates: Partial<ChatbotSkill>): Promise<ChatbotSkill> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`);
    }

    const updatedSkill = { ...skill, ...updates };
    this.skills.set(skillId, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(skillId: string): Promise<void> {
    if (!this.skills.has(skillId)) {
      throw new Error(`Skill ${skillId} not found`);
    }

    this.skills.delete(skillId);
  }

  async getChatbotAnalytics(): Promise<ChatbotAnalytics> {
    const totalSessions = this.sessions.size;
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active').length;
    const averageSessionDuration = this.calculateAverageSessionDuration();
    
    const commonIntents = this.getCommonIntents();
    const userSatisfaction = this.calculateUserSatisfaction();
    const resolutionRate = this.calculateResolutionRate();

    return {
      totalSessions,
      activeSessions,
      averageSessionDuration,
      commonIntents,
      userSatisfaction,
      resolutionRate
    };
  }

  async transferToHuman(sessionId: string, reason: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'transferred';
      session.metadata.transferReason = reason;
      session.metadata.transferredAt = new Date();
      
      // Agregar mensaje de transferencia
      await this.addMessage(sessionId, {
        content: `I'm transferring you to a human agent. Reason: ${reason}`,
        type: 'bot',
        intent: 'transfer',
        confidence: 1.0
      });
    }
  }

  async getConversationSummary(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      const conversation = session.messages
        .map(msg => `${msg.type}: ${msg.content}`)
        .join('\n');

      const response = await AIRouter.route({
        prompt: `Summarize this customer service conversation in 2-3 sentences: ${conversation}`,
        model: 'mistral-7b',
        maxTokens: 200,
        temperature: 0.3
      });

      return response.content;
    } catch (error) {
      return 'Conversation summary unavailable';
    }
  }

  private async addMessage(sessionId: string, messageData: Partial<ChatMessage>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      content: messageData.content || '',
      type: messageData.type || 'user',
      timestamp: new Date(),
      metadata: messageData.metadata || {},
      intent: messageData.intent,
      confidence: messageData.confidence,
      entities: messageData.entities || []
    };

    session.messages.push(message);
    session.lastActivity = new Date();

    // Actualizar historial de conversación
    this.conversationHistory.push({
      sessionId,
      message: message.content,
      timestamp: message.timestamp
    });

    // Mantener solo los últimos 1000 mensajes en el historial
    if (this.conversationHistory.length > 1000) {
      this.conversationHistory = this.conversationHistory.slice(-900);
    }
  }

  private async processMessage(session: ChatSession, content: string): Promise<ChatbotResponse> {
    try {
      // Detectar intención y entidades
      const intentAnalysis = await this.analyzeIntent(content, session.context);
      
      // Buscar skill apropiado
      const skill = this.findBestSkill(intentAnalysis.intent, content);
      
      // Generar respuesta
      const response = await this.generateResponse(skill, intentAnalysis, session.context);
      
      return response;
    } catch (error) {
      // Respuesta de fallback
      return {
        message: "I'm sorry, I didn't understand that. Could you please rephrase your question?",
        confidence: 0.1,
        intent: 'unknown',
        entities: [],
        suggestedActions: ['rephrase', 'contact_human'],
        followUpQuestions: ['How can I help you today?', 'What specific information do you need?'],
        metadata: { error: true }
      };
    }
  }

  private async analyzeIntent(content: string, context: ChatContext): Promise<{
    intent: string;
    confidence: number;
    entities: ChatEntity[];
  }> {
    try {
      const response = await AIRouter.routeRequest({
        prompt: `Analyze this message and identify the intent and entities. Return JSON: {"intent": "string", "confidence": number, "entities": [{"type": "string", "value": "string", "confidence": number}]} Message: "${content}"`,
        model: 'mistral-7b',
        maxTokens: 300,
        temperature: 0.1
      });

      const analysisMatch = response.content.match(/\{.*\}/);
      if (analysisMatch) {
        const analysis = JSON.parse(analysisMatch[0]);
        return {
          intent: analysis.intent || 'unknown',
          confidence: analysis.confidence || 0.5,
          entities: analysis.entities || []
        };
      }
    } catch (error) {
      // Fallback: análisis simple
    }

    // Análisis fallback basado en palabras clave
    const intent = this.simpleIntentDetection(content);
    const entities = this.simpleEntityExtraction(content);

    return {
      intent,
      confidence: 0.6,
      entities
    };
  }

  private findBestSkill(intent: string, content: string): ChatbotSkill | null {
    const enabledSkills = Array.from(this.skills.values()).filter(skill => skill.enabled);
    
    // Buscar por intención exacta
    let bestSkill = enabledSkills.find(skill => 
      skill.examples.some(example => 
        example.toLowerCase().includes(intent.toLowerCase())
      )
    );

    // Si no se encuentra, buscar por similitud de contenido
    if (!bestSkill) {
      bestSkill = enabledSkills.find(skill => 
        skill.examples.some(example => 
          this.calculateSimilarity(content.toLowerCase(), example.toLowerCase()) > 0.7
        )
      );
    }

    return bestSkill || null;
  }

  private async generateResponse(
    skill: ChatbotSkill | null, 
    intentAnalysis: any, 
    context: ChatContext
  ): Promise<ChatbotResponse> {
    if (!skill) {
      return this.generateFallbackResponse();
    }

    try {
      // Generar respuesta usando IA
      const prompt = `You are a helpful customer service chatbot. Generate a natural response for this intent: "${intentAnalysis.intent}". 
      
Available responses: ${skill.responses.join(', ')}
Available actions: ${skill.actions.join(', ')}

Context: ${context.conversationHistory.slice(-3).join(' | ')}

Generate a helpful, professional response.`;

      const response = await AIRouter.route({
        prompt,
        model: 'mistral-7b',
        maxTokens: 200,
        temperature: 0.7
      });

      return {
        message: response.content,
        confidence: intentAnalysis.confidence,
        intent: intentAnalysis.intent,
        entities: intentAnalysis.entities,
        suggestedActions: skill.actions.slice(0, 3),
        followUpQuestions: this.generateFollowUpQuestions(intentAnalysis.intent),
        metadata: { skillId: skill.id }
      };
    } catch (error) {
      // Respuesta de fallback del skill
      const fallbackResponse = skill.responses[Math.floor(Math.random() * skill.responses.length)];
      
      return {
        message: fallbackResponse,
        confidence: intentAnalysis.confidence,
        intent: intentAnalysis.intent,
        entities: intentAnalysis.entities,
        suggestedActions: skill.actions.slice(0, 3),
        followUpQuestions: [],
        metadata: { skillId: skill.id, fallback: true }
      };
    }
  }

  private generateFallbackResponse(): ChatbotResponse {
    const fallbackMessages = [
      "I'm here to help! Could you please provide more details about what you need?",
      "I want to make sure I understand correctly. Can you rephrase your question?",
      "I'm still learning. Could you try asking that in a different way?",
      "Let me connect you with a human agent who can better assist you."
    ];

    return {
      message: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)],
      confidence: 0.1,
      intent: 'unknown',
      entities: [],
      suggestedActions: ['contact_human', 'rephrase'],
      followUpQuestions: ['How can I help you today?'],
      metadata: { fallback: true }
    };
  }

  private updateSessionContext(session: ChatSession, response: ChatbotResponse): void {
    // Actualizar historial de conversación
    session.context.conversationHistory.push(response.message);
    
    // Mantener solo los últimos 10 mensajes en el contexto
    if (session.context.conversationHistory.length > 10) {
      session.context.conversationHistory = session.context.conversationHistory.slice(-10);
    }

    // Actualizar intención actual
    session.context.currentIntent = response.intent;

    // Agregar acciones pendientes
    session.context.pendingActions.push(...response.suggestedActions);
  }

  private generateWelcomeMessage(): string {
    const welcomeMessages = [
      "Hello! I'm your AI assistant. How can I help you today?",
      "Welcome! I'm here to assist you with any questions or concerns.",
      "Hi there! I'm ready to help. What can I do for you?",
      "Greetings! I'm your virtual assistant. How may I be of service?"
    ];

    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  private simpleIntentDetection(content: string): string {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('hello') || contentLower.includes('hi') || contentLower.includes('greetings')) {
      return 'greeting';
    }
    if (contentLower.includes('help') || contentLower.includes('support')) {
      return 'help_request';
    }
    if (contentLower.includes('price') || contentLower.includes('cost') || contentLower.includes('quote')) {
      return 'pricing_inquiry';
    }
    if (contentLower.includes('order') || contentLower.includes('purchase') || contentLower.includes('buy')) {
      return 'order_inquiry';
    }
    if (contentLower.includes('problem') || contentLower.includes('issue') || contentLower.includes('error')) {
      return 'problem_report';
    }
    if (contentLower.includes('thank')) {
      return 'gratitude';
    }
    if (contentLower.includes('bye') || contentLower.includes('goodbye')) {
      return 'farewell';
    }
    
    return 'general_inquiry';
  }

  private simpleEntityExtraction(content: string): ChatEntity[] {
    const entities: ChatEntity[] = [];
    
    // Extraer números
    const numbers = content.match(/\d+/g);
    numbers?.forEach((num, index) => {
      entities.push({
        type: 'number',
        value: num,
        confidence: 0.8,
        start: content.indexOf(num),
        end: content.indexOf(num) + num.length
      });
    });

    // Extraer emails
    const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    emails?.forEach(email => {
      entities.push({
        type: 'email',
        value: email,
        confidence: 0.9,
        start: content.indexOf(email),
        end: content.indexOf(email) + email.length
      });
    });

    return entities;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  private generateFollowUpQuestions(intent: string): string[] {
    const followUpMap: Record<string, string[]> = {
      'pricing_inquiry': [
        'Would you like a detailed quote?',
        'Are you looking for bulk pricing?'
      ],
      'order_inquiry': [
        'Do you have an order number?',
        'Would you like to track your order?'
      ],
      'problem_report': [
        'Can you provide more details about the issue?',
        'When did this problem start?'
      ],
      'help_request': [
        'What specific area do you need help with?',
        'Are you looking for technical support?'
      ]
    };

    return followUpMap[intent] || ['Is there anything else I can help you with?'];
  }

  private initializeDefaultSkills(): void {
    const defaultSkills: Omit<ChatbotSkill, 'id'>[] = [
      {
        name: 'Greeting',
        description: 'Handle greetings and introductions',
        category: 'general',
        enabled: true,
        confidence: 0.9,
        examples: ['hello', 'hi', 'greetings', 'good morning'],
        responses: [
          'Hello! How can I help you today?',
          'Hi there! I\'m here to assist you.',
          'Greetings! How may I be of service?'
        ],
        actions: ['greet', 'introduce']
      },
      {
        name: 'Help Request',
        description: 'Handle general help requests',
        category: 'general',
        enabled: true,
        confidence: 0.8,
        examples: ['help', 'support', 'assistance', 'need help'],
        responses: [
          'I\'m here to help! What do you need assistance with?',
          'I\'d be happy to help. What can I do for you?',
          'How can I assist you today?'
        ],
        actions: ['provide_help', 'redirect', 'escalate']
      },
      {
        name: 'Pricing Inquiry',
        description: 'Handle pricing and cost questions',
        category: 'sales',
        enabled: true,
        confidence: 0.7,
        examples: ['price', 'cost', 'quote', 'how much'],
        responses: [
          'I can help you with pricing information. What specific product or service are you interested in?',
          'Let me get you the pricing details. What are you looking for?'
        ],
        actions: ['provide_pricing', 'generate_quote', 'schedule_call']
      }
    ];

    defaultSkills.forEach(skill => {
      this.addSkill(skill);
    });
  }

  private calculateAverageSessionDuration(): number {
    const sessions = Array.from(this.sessions.values());
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.lastActivity.getTime() - session.createdAt.getTime();
      return sum + duration;
    }, 0);

    return totalDuration / sessions.length;
  }

  private getCommonIntents(): Array<{ intent: string; count: number }> {
    const intentCounts: Record<string, number> = {};
    
    Array.from(this.sessions.values()).forEach(session => {
      session.messages.forEach(message => {
        if (message.intent) {
          intentCounts[message.intent] = (intentCounts[message.intent] || 0) + 1;
        }
      });
    });
    
    return Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count }));
  }

  private calculateUserSatisfaction(): number {
    // Simulación de cálculo de satisfacción del usuario
    return Math.random() * 0.3 + 0.7; // 70-100%
  }

  private calculateResolutionRate(): number {
    // Simulación de tasa de resolución
    return Math.random() * 0.2 + 0.8; // 80-100%
  }
}

export const intelligentChatbotService = new IntelligentChatbotService();
