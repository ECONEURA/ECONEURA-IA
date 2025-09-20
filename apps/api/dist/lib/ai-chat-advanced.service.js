import { structuredLogger } from './structured-logger.js';
class AIChatAdvancedService {
    conversations = new Map();
    messages = new Map();
    sessions = new Map();
    messageIndex = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('AI Chat Advanced Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const conversation1 = {
            id: 'conv_1',
            organizationId: 'demo-org-1',
            userId: 'user_1',
            title: 'Análisis de Inventario Q3',
            description: 'Conversación sobre análisis de inventario del tercer trimestre',
            status: 'active',
            tags: ['inventory', 'analysis', 'q3'],
            context: {
                domain: 'inventory_management',
                intent: 'analysis',
                entities: {
                    period: 'Q3 2024',
                    focus: 'stock_levels'
                },
                preferences: {
                    detail_level: 'high',
                    format: 'structured'
                }
            },
            summary: 'Análisis detallado del inventario del Q3 con enfoque en niveles de stock',
            messageCount: 5,
            lastMessageAt: oneHourAgo.toISOString(),
            createdAt: twoHoursAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString()
        };
        const conversation2 = {
            id: 'conv_2',
            organizationId: 'demo-org-1',
            userId: 'user_2',
            title: 'Optimización de Procesos',
            description: 'Discusión sobre optimización de procesos de negocio',
            status: 'active',
            tags: ['optimization', 'processes', 'efficiency'],
            context: {
                domain: 'business_processes',
                intent: 'optimization',
                entities: {
                    department: 'operations',
                    focus: 'efficiency'
                },
                preferences: {
                    detail_level: 'medium',
                    format: 'actionable'
                }
            },
            summary: 'Optimización de procesos operacionales para mejorar eficiencia',
            messageCount: 3,
            lastMessageAt: twoHoursAgo.toISOString(),
            createdAt: twoHoursAgo.toISOString(),
            updatedAt: twoHoursAgo.toISOString()
        };
        this.conversations.set(conversation1.id, conversation1);
        this.conversations.set(conversation2.id, conversation2);
        const messages = [
            {
                id: 'msg_1',
                conversationId: 'conv_1',
                role: 'user',
                content: 'Necesito un análisis del inventario del Q3, especialmente los niveles de stock',
                timestamp: twoHoursAgo.toISOString(),
                metadata: {
                    provider: 'Azure OpenAI',
                    model: 'gpt-4o-mini',
                    latency: 1200,
                    costEur: 0.002,
                    tokensIn: 25,
                    tokensOut: 150,
                    confidence: 0.95,
                    sentiment: 'neutral',
                    intent: 'analysis_request',
                    entities: [
                        { type: 'period', value: 'Q3', confidence: 0.9 },
                        { type: 'domain', value: 'inventory', confidence: 0.95 },
                        { type: 'focus', value: 'stock_levels', confidence: 0.85 }
                    ]
                }
            },
            {
                id: 'msg_2',
                conversationId: 'conv_1',
                role: 'assistant',
                content: 'Te ayudo con el análisis del inventario del Q3. Basándome en los datos disponibles, puedo generar un reporte detallado de los niveles de stock, incluyendo:\n\n• Análisis de rotación por categoría\n• Identificación de productos con bajo stock\n• Recomendaciones de reorden\n• Análisis de tendencias\n\n¿Te gustaría que profundice en algún aspecto específico?',
                timestamp: new Date(twoHoursAgo.getTime() + 2 * 60 * 1000).toISOString(),
                metadata: {
                    provider: 'Azure OpenAI',
                    model: 'gpt-4o-mini',
                    latency: 1800,
                    costEur: 0.005,
                    tokensIn: 25,
                    tokensOut: 200,
                    confidence: 0.92,
                    sentiment: 'positive',
                    intent: 'information_provision',
                    entities: [
                        { type: 'period', value: 'Q3', confidence: 0.9 },
                        { type: 'analysis_type', value: 'stock_analysis', confidence: 0.95 }
                    ]
                }
            },
            {
                id: 'msg_3',
                conversationId: 'conv_2',
                role: 'user',
                content: '¿Cómo puedo optimizar los procesos de mi departamento de operaciones?',
                timestamp: twoHoursAgo.toISOString(),
                metadata: {
                    provider: 'Azure OpenAI',
                    model: 'gpt-4o-mini',
                    latency: 1000,
                    costEur: 0.001,
                    tokensIn: 20,
                    tokensOut: 120,
                    confidence: 0.88,
                    sentiment: 'neutral',
                    intent: 'optimization_request',
                    entities: [
                        { type: 'department', value: 'operations', confidence: 0.9 },
                        { type: 'focus', value: 'optimization', confidence: 0.95 }
                    ]
                }
            }
        ];
        messages.forEach(msg => {
            this.messages.set(msg.id, msg);
        });
        this.messageIndex.set('conv_1', ['msg_1', 'msg_2']);
        this.messageIndex.set('conv_2', ['msg_3']);
        const session1 = {
            id: 'session_1',
            conversationId: 'conv_1',
            userId: 'user_1',
            organizationId: 'demo-org-1',
            context: {
                currentTopic: 'inventory_analysis',
                userPreferences: {
                    detail_level: 'high',
                    format: 'structured'
                },
                conversationHistory: messages.slice(0, 2),
                activeEntities: {
                    period: 'Q3 2024',
                    focus: 'stock_levels'
                },
                sessionVariables: {
                    last_analysis_date: '2024-08-01',
                    preferred_metrics: ['turnover', 'stock_levels', 'reorder_points']
                }
            },
            isActive: true,
            lastActivityAt: oneHourAgo.toISOString(),
            createdAt: twoHoursAgo.toISOString()
        };
        this.sessions.set(session1.id, session1);
    }
    async createConversation(conversationData) {
        const now = new Date().toISOString();
        const newConversation = {
            id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...conversationData,
            messageCount: 0,
            lastMessageAt: now,
            createdAt: now,
            updatedAt: now
        };
        this.conversations.set(newConversation.id, newConversation);
        this.messageIndex.set(newConversation.id, []);
        structuredLogger.info('Conversation created', {
            conversationId: newConversation.id,
            organizationId: newConversation.organizationId,
            userId: newConversation.userId,
            title: newConversation.title
        });
        return newConversation;
    }
    async getConversation(conversationId) {
        return this.conversations.get(conversationId);
    }
    async getConversations(organizationId, filters = {}) {
        let conversations = Array.from(this.conversations.values())
            .filter(c => c.organizationId === organizationId);
        if (filters.userId) {
            conversations = conversations.filter(c => c.userId === filters.userId);
        }
        if (filters.status) {
            conversations = conversations.filter(c => c.status === filters.status);
        }
        if (filters.tags && filters.tags.length > 0) {
            conversations = conversations.filter(c => filters.tags.some(tag => c.tags.includes(tag)));
        }
        if (filters.limit) {
            conversations = conversations.slice(0, filters.limit);
        }
        return conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    }
    async updateConversation(conversationId, updates) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation)
            return undefined;
        const updatedConversation = {
            ...conversation,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.conversations.set(conversationId, updatedConversation);
        structuredLogger.info('Conversation updated', {
            conversationId,
            updates: Object.keys(updates)
        });
        return updatedConversation;
    }
    async deleteConversation(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation)
            return false;
        conversation.status = 'deleted';
        conversation.updatedAt = new Date().toISOString();
        this.conversations.set(conversationId, conversation);
        structuredLogger.info('Conversation deleted', { conversationId });
        return true;
    }
    async createMessage(messageData) {
        const now = new Date().toISOString();
        const newMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...messageData,
            timestamp: now
        };
        this.messages.set(newMessage.id, newMessage);
        const messageIds = this.messageIndex.get(newMessage.conversationId) || [];
        messageIds.push(newMessage.id);
        this.messageIndex.set(newMessage.conversationId, messageIds);
        const conversation = this.conversations.get(newMessage.conversationId);
        if (conversation) {
            conversation.messageCount += 1;
            conversation.lastMessageAt = now;
            conversation.updatedAt = now;
            this.conversations.set(newMessage.conversationId, conversation);
        }
        structuredLogger.info('Message created', {
            messageId: newMessage.id,
            conversationId: newMessage.conversationId,
            role: newMessage.role,
            contentLength: newMessage.content.length
        });
        return newMessage;
    }
    async getMessages(conversationId, filters = {}) {
        const messageIds = this.messageIndex.get(conversationId) || [];
        let messages = messageIds
            .map(id => this.messages.get(id))
            .filter((msg) => msg !== undefined);
        if (filters.role) {
            messages = messages.filter(m => m.role === filters.role);
        }
        if (filters.offset) {
            messages = messages.slice(filters.offset);
        }
        if (filters.limit) {
            messages = messages.slice(0, filters.limit);
        }
        return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    async getMessage(messageId) {
        return this.messages.get(messageId);
    }
    async createSession(sessionData) {
        const now = new Date().toISOString();
        const newSession = {
            id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...sessionData,
            lastActivityAt: now,
            createdAt: now
        };
        this.sessions.set(newSession.id, newSession);
        structuredLogger.info('Session created', {
            sessionId: newSession.id,
            conversationId: newSession.conversationId,
            userId: newSession.userId
        });
        return newSession;
    }
    async getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    async updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return undefined;
        const updatedSession = {
            ...session,
            ...updates,
            lastActivityAt: new Date().toISOString()
        };
        this.sessions.set(sessionId, updatedSession);
        return updatedSession;
    }
    async analyzeMessage(content, context) {
        const sentiment = this.analyzeSentiment(content);
        const intent = this.extractIntent(content);
        const entities = this.extractEntities(content);
        const topics = this.extractTopics(content);
        const confidence = Math.random() * 0.3 + 0.7;
        const suggestions = this.generateSuggestions(content, intent, entities);
        return {
            sentiment,
            intent,
            entities,
            topics,
            confidence,
            suggestions
        };
    }
    analyzeSentiment(content) {
        const positiveWords = ['bueno', 'excelente', 'perfecto', 'genial', 'gracias', 'ayuda', 'sí', 'correcto'];
        const negativeWords = ['malo', 'error', 'problema', 'no', 'incorrecto', 'fallo', 'mal'];
        const lowerContent = content.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
        if (positiveCount > negativeCount)
            return 'positive';
        if (negativeCount > positiveCount)
            return 'negative';
        return 'neutral';
    }
    extractIntent(content) {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('análisis') || lowerContent.includes('analizar'))
            return 'analysis_request';
        if (lowerContent.includes('optimizar') || lowerContent.includes('mejorar'))
            return 'optimization_request';
        if (lowerContent.includes('reporte') || lowerContent.includes('informe'))
            return 'report_request';
        if (lowerContent.includes('ayuda') || lowerContent.includes('cómo'))
            return 'help_request';
        if (lowerContent.includes('explicar') || lowerContent.includes('qué es'))
            return 'explanation_request';
        return 'general_inquiry';
    }
    extractEntities(content) {
        const entities = [];
        const periodRegex = /(Q[1-4]|trimestre|semestre|año|mes)/gi;
        const periods = content.match(periodRegex);
        if (periods) {
            periods.forEach(period => {
                entities.push({ type: 'period', value: period, confidence: 0.9 });
            });
        }
        const domainKeywords = {
            'inventory': ['inventario', 'stock', 'almacén'],
            'finance': ['financiero', 'costos', 'presupuesto'],
            'operations': ['operaciones', 'procesos', 'eficiencia'],
            'sales': ['ventas', 'clientes', 'ingresos']
        };
        Object.entries(domainKeywords).forEach(([domain, keywords]) => {
            keywords.forEach(keyword => {
                if (content.toLowerCase().includes(keyword)) {
                    entities.push({ type: 'domain', value: domain, confidence: 0.8 });
                }
            });
        });
        return entities;
    }
    extractTopics(content) {
        const topics = [];
        const lowerContent = content.toLowerCase();
        const topicKeywords = {
            'inventory_management': ['inventario', 'stock', 'almacén', 'productos'],
            'financial_analysis': ['financiero', 'costos', 'presupuesto', 'análisis'],
            'process_optimization': ['procesos', 'optimización', 'eficiencia', 'mejora'],
            'reporting': ['reporte', 'informe', 'métricas', 'kpi'],
            'data_analysis': ['datos', 'análisis', 'estadísticas', 'tendencias']
        };
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                topics.push(topic);
            }
        });
        return topics;
    }
    generateSuggestions(content, intent, entities) {
        const suggestions = [];
        switch (intent) {
            case 'analysis_request':
                suggestions.push('¿Te gustaría un análisis más detallado?');
                suggestions.push('¿Necesitas visualizaciones específicas?');
                suggestions.push('¿Quieres comparar con períodos anteriores?');
                break;
            case 'optimization_request':
                suggestions.push('¿Qué procesos específicos quieres optimizar?');
                suggestions.push('¿Tienes métricas de rendimiento actuales?');
                suggestions.push('¿Quieres un plan de implementación?');
                break;
            case 'report_request':
                suggestions.push('¿Qué tipo de reporte necesitas?');
                suggestions.push('¿Para qué período?');
                suggestions.push('¿Qué formato prefieres?');
                break;
            default:
                suggestions.push('¿Puedo ayudarte con algo más específico?');
                suggestions.push('¿Te interesa algún análisis en particular?');
        }
        return suggestions;
    }
    async processChatMessage(conversationId, content, userId, organizationId) {
        const conversation = await this.getConversation(conversationId);
        const recentMessages = await this.getMessages(conversationId, { limit: 10 });
        const analysis = await this.analyzeMessage(content, conversation?.context);
        const userMessage = await this.createMessage({
            conversationId,
            role: 'user',
            content,
            metadata: {
                provider: 'Azure OpenAI',
                model: 'gpt-4o-mini',
                latency: Math.random() * 1000 + 500,
                costEur: Math.random() * 0.01 + 0.001,
                tokensIn: Math.floor(content.length / 4),
                tokensOut: 0,
                confidence: analysis.confidence,
                sentiment: analysis.sentiment,
                intent: analysis.intent,
                entities: analysis.entities
            }
        });
        const aiResponse = await this.generateAIResponse(content, analysis, recentMessages, conversation?.context);
        const assistantMessage = await this.createMessage({
            conversationId,
            role: 'assistant',
            content: aiResponse,
            metadata: {
                provider: 'Azure OpenAI',
                model: 'gpt-4o-mini',
                latency: Math.random() * 2000 + 1000,
                costEur: Math.random() * 0.02 + 0.005,
                tokensIn: Math.floor(content.length / 4),
                tokensOut: Math.floor(aiResponse.length / 4),
                confidence: analysis.confidence,
                sentiment: 'positive',
                intent: 'information_provision',
                entities: analysis.entities
            }
        });
        if (conversation && conversation.messageCount % 10 === 0) {
            await this.updateConversationSummary(conversationId);
        }
        return {
            message: assistantMessage,
            analysis,
            suggestions: analysis.suggestions,
            relatedTopics: analysis.topics,
            contextUpdate: {
                lastIntent: analysis.intent,
                activeEntities: analysis.entities.reduce((acc, entity) => {
                    acc[entity.type] = entity.value;
                    return acc;
                }, {}),
                conversationTopics: analysis.topics
            }
        };
    }
    async generateAIResponse(content, analysis, recentMessages, context) {
        const responses = {
            'analysis_request': 'Te ayudo con el análisis solicitado. Basándome en los datos disponibles, puedo proporcionarte insights detallados y recomendaciones específicas.',
            'optimization_request': 'Perfecto, puedo ayudarte a optimizar tus procesos. Vamos a identificar las áreas de mejora y crear un plan de acción específico.',
            'report_request': 'Te genero el reporte que necesitas. ¿Hay algún formato o métricas específicas que prefieras incluir?',
            'help_request': 'Estoy aquí para ayudarte. ¿En qué aspecto específico necesitas asistencia?',
            'explanation_request': 'Te explico el concepto de manera clara y detallada, con ejemplos prácticos cuando sea posible.',
            'general_inquiry': 'Entiendo tu consulta. Te proporciono información relevante y te sugiero próximos pasos.'
        };
        let baseResponse = responses[analysis.intent] || responses['general_inquiry'];
        if (analysis.entities.some(e => e.type === 'domain')) {
            const domain = analysis.entities.find(e => e.type === 'domain')?.value;
            baseResponse += ` Me enfocaré en el dominio de ${domain}.`;
        }
        if (analysis.entities.some(e => e.type === 'period')) {
            const period = analysis.entities.find(e => e.type === 'period')?.value;
            baseResponse += ` Para el período ${period}.`;
        }
        if (analysis.suggestions.length > 0) {
            baseResponse += `\n\n¿Te gustaría que profundice en alguno de estos aspectos?`;
        }
        return baseResponse;
    }
    async updateConversationSummary(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation)
            return;
        const messages = await this.getMessages(conversationId, { limit: 20 });
        const topics = new Set();
        const intents = new Set();
        messages.forEach(msg => {
            if (msg.metadata?.intent)
                intents.add(msg.metadata.intent);
            if (msg.metadata?.entities) {
                msg.metadata.entities.forEach(entity => {
                    if (entity.type === 'domain')
                        topics.add(entity.value);
                });
            }
        });
        const summary = `Conversación sobre ${Array.from(topics).join(', ')} con enfoque en ${Array.from(intents).join(', ')}. ${conversation.messageCount} mensajes intercambiados.`;
        conversation.summary = summary;
        conversation.updatedAt = new Date().toISOString();
        this.conversations.set(conversationId, conversation);
    }
    async getChatStatistics(organizationId, filters = {}) {
        const conversations = await this.getConversations(organizationId, { userId: filters.userId });
        const allMessages = [];
        for (const conv of conversations) {
            const messages = await this.getMessages(conv.id);
            allMessages.push(...messages);
        }
        let filteredMessages = allMessages;
        if (filters.startDate || filters.endDate) {
            filteredMessages = allMessages.filter(msg => {
                const msgDate = new Date(msg.timestamp);
                if (filters.startDate && msgDate < new Date(filters.startDate))
                    return false;
                if (filters.endDate && msgDate > new Date(filters.endDate))
                    return false;
                return true;
            });
        }
        const intents = {};
        const topics = {};
        const sentiments = {};
        let totalResponseTime = 0;
        let responseCount = 0;
        let totalCost = 0;
        filteredMessages.forEach(msg => {
            if (msg.metadata?.intent) {
                intents[msg.metadata.intent] = (intents[msg.metadata.intent] || 0) + 1;
            }
            if (msg.metadata?.entities) {
                msg.metadata.entities.forEach(entity => {
                    if (entity.type === 'domain') {
                        topics[entity.value] = (topics[entity.value] || 0) + 1;
                    }
                });
            }
            if (msg.metadata?.sentiment) {
                sentiments[msg.metadata.sentiment] = (sentiments[msg.metadata.sentiment] || 0) + 1;
            }
            if (msg.metadata?.latency) {
                totalResponseTime += msg.metadata.latency;
                responseCount++;
            }
            if (msg.metadata?.costEur) {
                totalCost += msg.metadata.costEur;
            }
        });
        return {
            totalConversations: conversations.length,
            totalMessages: filteredMessages.length,
            activeConversations: conversations.filter(c => c.status === 'active').length,
            averageMessagesPerConversation: conversations.length > 0 ? filteredMessages.length / conversations.length : 0,
            topIntents: Object.entries(intents)
                .map(([intent, count]) => ({ intent, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            topTopics: Object.entries(topics)
                .map(([topic, count]) => ({ topic, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            sentimentDistribution: sentiments,
            averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
            totalCost
        };
    }
}
export const aiChatAdvancedService = new AIChatAdvancedService();
//# sourceMappingURL=ai-chat-advanced.service.js.map