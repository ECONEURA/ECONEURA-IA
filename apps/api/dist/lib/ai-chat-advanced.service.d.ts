interface ChatMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
        provider?: string;
        model?: string;
        latency?: number;
        costEur?: number;
        tokensIn?: number;
        tokensOut?: number;
        confidence?: number;
        sentiment?: 'positive' | 'negative' | 'neutral';
        intent?: string;
        entities?: Array<{
            type: string;
            value: string;
            confidence: number;
        }>;
    };
}
interface Conversation {
    id: string;
    organizationId: string;
    userId: string;
    title: string;
    description?: string;
    status: 'active' | 'archived' | 'deleted';
    tags: string[];
    context: {
        domain?: string;
        intent?: string;
        entities?: Record<string, any>;
        preferences?: Record<string, any>;
        sessionData?: Record<string, any>;
    };
    summary?: string;
    messageCount: number;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
}
interface ChatSession {
    id: string;
    conversationId: string;
    userId: string;
    organizationId: string;
    context: {
        currentTopic?: string;
        userPreferences?: Record<string, any>;
        conversationHistory?: ChatMessage[];
        activeEntities?: Record<string, any>;
        sessionVariables?: Record<string, any>;
    };
    isActive: boolean;
    lastActivityAt: string;
    createdAt: string;
}
interface AIAnalysis {
    sentiment: 'positive' | 'negative' | 'neutral';
    intent: string;
    entities: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
    topics: string[];
    confidence: number;
    suggestions: string[];
}
interface ChatResponse {
    message: ChatMessage;
    analysis: AIAnalysis;
    suggestions: string[];
    relatedTopics: string[];
    contextUpdate: Record<string, any>;
}
declare class AIChatAdvancedService {
    private conversations;
    private messages;
    private sessions;
    private messageIndex;
    constructor();
    init(): void;
    private createDemoData;
    createConversation(conversationData: Omit<Conversation, 'id' | 'messageCount' | 'lastMessageAt' | 'createdAt' | 'updatedAt'>): Promise<Conversation>;
    getConversation(conversationId: string): Promise<Conversation | undefined>;
    getConversations(organizationId: string, filters?: {
        userId?: string;
        status?: string;
        tags?: string[];
        limit?: number;
    }): Promise<Conversation[]>;
    updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
    deleteConversation(conversationId: string): Promise<boolean>;
    createMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage>;
    getMessages(conversationId: string, filters?: {
        limit?: number;
        offset?: number;
        role?: string;
    }): Promise<ChatMessage[]>;
    getMessage(messageId: string): Promise<ChatMessage | undefined>;
    createSession(sessionData: Omit<ChatSession, 'id' | 'lastActivityAt' | 'createdAt'>): Promise<ChatSession>;
    getSession(sessionId: string): Promise<ChatSession | undefined>;
    updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
    analyzeMessage(content: string, context?: Record<string, any>): Promise<AIAnalysis>;
    private analyzeSentiment;
    private extractIntent;
    private extractEntities;
    private extractTopics;
    private generateSuggestions;
    processChatMessage(conversationId: string, content: string, userId: string, organizationId: string): Promise<ChatResponse>;
    private generateAIResponse;
    private updateConversationSummary;
    getChatStatistics(organizationId: string, filters?: {
        userId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<{
        totalConversations: number;
        totalMessages: number;
        activeConversations: number;
        averageMessagesPerConversation: number;
        topIntents: Array<{
            intent: string;
            count: number;
        }>;
        topTopics: Array<{
            topic: string;
            count: number;
        }>;
        sentimentDistribution: Record<string, number>;
        averageResponseTime: number;
        totalCost: number;
    }>;
}
export declare const aiChatAdvancedService: AIChatAdvancedService;
export {};
//# sourceMappingURL=ai-chat-advanced.service.d.ts.map