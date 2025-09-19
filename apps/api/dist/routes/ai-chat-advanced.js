import { Router } from 'express';
import { z } from 'zod';
import { aiChatAdvancedService } from '../lib/ai-chat-advanced.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const aiChatAdvancedRouter = Router();
const CreateConversationSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    context: z.object({
        domain: z.string().optional(),
        intent: z.string().optional(),
        entities: z.record(z.any()).optional(),
        preferences: z.record(z.any()).optional(),
        sessionData: z.record(z.any()).optional()
    }).optional()
});
const UpdateConversationSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'archived', 'deleted']).optional(),
    tags: z.array(z.string()).optional(),
    context: z.object({
        domain: z.string().optional(),
        intent: z.string().optional(),
        entities: z.record(z.any()).optional(),
        preferences: z.record(z.any()).optional(),
        sessionData: z.record(z.any()).optional()
    }).optional()
});
const GetConversationsSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().optional(),
    status: z.enum(['active', 'archived', 'deleted']).optional(),
    tags: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(20).optional()
});
const GetMessagesSchema = z.object({
    conversationId: z.string().min(1),
    limit: z.coerce.number().int().positive().max(100).default(50).optional(),
    offset: z.coerce.number().int().nonnegative().default(0).optional(),
    role: z.enum(['user', 'assistant', 'system']).optional()
});
const CreateMessageSchema = z.object({
    conversationId: z.string().min(1),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(10000),
    metadata: z.object({
        provider: z.string().optional(),
        model: z.string().optional(),
        latency: z.number().optional(),
        costEur: z.number().optional(),
        tokensIn: z.number().optional(),
        tokensOut: z.number().optional(),
        confidence: z.number().optional(),
        sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
        intent: z.string().optional(),
        entities: z.array(z.object({
            type: z.string(),
            value: z.string(),
            confidence: z.number()
        })).optional()
    }).optional()
});
const ProcessChatMessageSchema = z.object({
    conversationId: z.string().min(1),
    content: z.string().min(1).max(10000),
    userId: z.string().min(1),
    organizationId: z.string().min(1)
});
const CreateSessionSchema = z.object({
    conversationId: z.string().min(1),
    userId: z.string().min(1),
    organizationId: z.string().min(1),
    context: z.object({
        currentTopic: z.string().optional(),
        userPreferences: z.record(z.any()).optional(),
        conversationHistory: z.array(z.any()).optional(),
        activeEntities: z.record(z.any()).optional(),
        sessionVariables: z.record(z.any()).optional()
    }).optional()
});
const UpdateSessionSchema = z.object({
    context: z.object({
        currentTopic: z.string().optional(),
        userPreferences: z.record(z.any()).optional(),
        conversationHistory: z.array(z.any()).optional(),
        activeEntities: z.record(z.any()).optional(),
        sessionVariables: z.record(z.any()).optional()
    }).optional(),
    isActive: z.boolean().optional()
});
const GetStatisticsSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});
aiChatAdvancedRouter.post('/conversations', async (req, res) => {
    try {
        const conversationData = CreateConversationSchema.parse(req.body);
        const conversation = await aiChatAdvancedService.createConversation(conversationData);
        res.status(201).json({
            success: true,
            data: conversation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating conversation', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.get('/conversations', async (req, res) => {
    try {
        const filters = GetConversationsSchema.parse(req.query);
        const conversations = await aiChatAdvancedService.getConversations(filters.organizationId, {
            userId: filters.userId,
            status: filters.status,
            tags: filters.tags ? filters.tags.split(',').map(t => t.trim()) : undefined,
            limit: filters.limit
        });
        res.json({
            success: true,
            data: {
                conversations,
                total: conversations.length,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting conversations', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.get('/conversations/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const conversation = await aiChatAdvancedService.getConversation(id);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }
        res.json({
            success: true,
            data: conversation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting conversation', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.put('/conversations/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const updates = UpdateConversationSchema.parse(req.body);
        const conversation = await aiChatAdvancedService.updateConversation(id, updates);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }
        res.json({
            success: true,
            data: conversation,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error updating conversation', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.delete('/conversations/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const success = await aiChatAdvancedService.deleteConversation(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found'
            });
        }
        res.json({
            success: true,
            message: 'Conversation deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error deleting conversation', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.get('/conversations/:id/messages', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const filters = GetMessagesSchema.parse({ ...req.query, conversationId: id });
        const messages = await aiChatAdvancedService.getMessages(id, {
            limit: filters.limit,
            offset: filters.offset,
            role: filters.role
        });
        res.json({
            success: true,
            data: {
                messages,
                total: messages.length,
                conversationId: id,
                filters
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting messages', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.post('/messages', async (req, res) => {
    try {
        const messageData = CreateMessageSchema.parse(req.body);
        const message = await aiChatAdvancedService.createMessage(messageData);
        res.status(201).json({
            success: true,
            data: message,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating message', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.get('/messages/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const message = await aiChatAdvancedService.getMessage(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                error: 'Message not found'
            });
        }
        res.json({
            success: true,
            data: message,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting message', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.post('/chat/process', async (req, res) => {
    try {
        const chatData = ProcessChatMessageSchema.parse(req.body);
        const response = await aiChatAdvancedService.processChatMessage(chatData.conversationId, chatData.content, chatData.userId, chatData.organizationId);
        res.status(201).json({
            success: true,
            data: response,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error processing chat message', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.post('/chat/analyze', async (req, res) => {
    try {
        const { content, context } = z.object({
            content: z.string().min(1).max(10000),
            context: z.record(z.any()).optional()
        }).parse(req.body);
        const analysis = await aiChatAdvancedService.analyzeMessage(content, context);
        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error analyzing message', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.post('/sessions', async (req, res) => {
    try {
        const sessionData = CreateSessionSchema.parse(req.body);
        const session = await aiChatAdvancedService.createSession(sessionData);
        res.status(201).json({
            success: true,
            data: session,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating session', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.get('/sessions/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const session = await aiChatAdvancedService.getSession(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        res.json({
            success: true,
            data: session,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting session', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.put('/sessions/:id', async (req, res) => {
    try {
        const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
        const updates = UpdateSessionSchema.parse(req.body);
        const session = await aiChatAdvancedService.updateSession(id, updates);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        res.json({
            success: true,
            data: session,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error updating session', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.get('/statistics', async (req, res) => {
    try {
        const filters = GetStatisticsSchema.parse(req.query);
        const statistics = await aiChatAdvancedService.getChatStatistics(filters.organizationId, {
            userId: filters.userId,
            startDate: filters.startDate,
            endDate: filters.endDate
        });
        res.json({
            success: true,
            data: statistics,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting statistics', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
aiChatAdvancedRouter.get('/health', async (req, res) => {
    try {
        const stats = await aiChatAdvancedService.getChatStatistics('demo-org-1');
        res.json({
            success: true,
            data: {
                status: 'ok',
                totalConversations: stats.totalConversations,
                totalMessages: stats.totalMessages,
                activeConversations: stats.activeConversations,
                averageResponseTime: stats.averageResponseTime,
                totalCost: stats.totalCost,
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking AI chat health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
export { aiChatAdvancedRouter };
//# sourceMappingURL=ai-chat-advanced.js.map