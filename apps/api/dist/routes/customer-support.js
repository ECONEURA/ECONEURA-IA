import { Router } from 'express';
import { z } from 'zod';
import { customerSupportService } from '../services/customer-support.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const CreateTicketSchema = z.object({
    customerId: z.string().uuid(),
    customerEmail: z.string().email(),
    customerName: z.string().min(1).max(255),
    subject: z.string().min(1).max(255),
    description: z.string().min(1),
    category: z.enum(['technical', 'billing', 'general', 'feature_request', 'bug_report']),
    priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).default('medium'),
    source: z.enum(['email', 'chat', 'phone', 'portal', 'api', 'social']).default('portal'),
    tags: z.array(z.string()).default([]),
    attachments: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        size: z.number(),
        type: z.string()
    })).default([])
});
const UpdateTicketSchema = z.object({
    subject: z.string().min(1).max(255).optional(),
    description: z.string().min(1).optional(),
    category: z.enum(['technical', 'billing', 'general', 'feature_request', 'bug_report']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
    status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']).optional(),
    assignedTo: z.string().uuid().optional(),
    tags: z.array(z.string()).optional()
});
const SendMessageSchema = z.object({
    senderId: z.string().uuid(),
    senderType: z.enum(['customer', 'agent', 'bot']),
    message: z.string().min(1),
    messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
    attachments: z.array(z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        size: z.number(),
        type: z.string()
    })).default([])
});
const CreateArticleSchema = z.object({
    title: z.string().min(1).max(255),
    content: z.string().min(1),
    category: z.string().min(1),
    tags: z.array(z.string()).default([]),
    isPublished: z.boolean().default(true),
    authorId: z.string().uuid()
});
const CreateAgentSchema = z.object({
    userId: z.string().uuid(),
    name: z.string().min(1).max(255),
    email: z.string().email(),
    isActive: z.boolean().default(true),
    maxTickets: z.number().min(1).default(10),
    skills: z.array(z.string()).default([]),
    languages: z.array(z.string()).default(['en']),
    workingHours: z.object({
        timezone: z.string().default('UTC'),
        schedule: z.record(z.object({
            start: z.string(),
            end: z.string(),
            isWorking: z.boolean().default(true)
        }))
    }).optional()
});
router.post('/tickets', async (req, res) => {
    try {
        const organizationId = 'demo-org';
        const validatedData = CreateTicketSchema.parse(req.body);
        const ticket = await customerSupportService.createTicket(organizationId, validatedData);
        structuredLogger.info('Support ticket created via API', {
            ticketId: ticket.id,
            customerEmail: ticket.customerEmail,
            priority: ticket.priority,
            organizationId
        });
        res.status(201).json({
            success: true,
            data: ticket,
            message: 'Support ticket created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create support ticket via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create support ticket'
        });
    }
});
router.get('/tickets', async (req, res) => {
    try {
        const organizationId = 'demo-org';
        const { status, priority, category, assignedTo, customerId } = req.query;
        const tickets = Array.from(customerSupportService.tickets.values())
            .filter((ticket) => {
            if (ticket.organizationId !== organizationId)
                return false;
            if (status && ticket.status !== status)
                return false;
            if (priority && ticket.priority !== priority)
                return false;
            if (category && ticket.category !== category)
                return false;
            if (assignedTo && ticket.assignedTo !== assignedTo)
                return false;
            if (customerId && ticket.customerId !== customerId)
                return false;
            return true;
        });
        res.json({
            success: true,
            data: {
                tickets,
                total: tickets.length,
                page: 1,
                limit: tickets.length
            },
            message: 'Support tickets retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list support tickets via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to list support tickets'
        });
    }
});
router.get('/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = 'demo-org';
        const ticket = await customerSupportService.getTicket(id, organizationId);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                error: 'Support ticket not found'
            });
        }
        res.json({
            success: true,
            data: ticket,
            message: 'Support ticket retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get support ticket via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ticketId: req.params.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get support ticket'
        });
    }
});
router.put('/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = 'demo-org';
        const validatedData = UpdateTicketSchema.parse(req.body);
        res.json({
            success: true,
            message: 'Support ticket updated successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update support ticket via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ticketId: req.params.id
        });
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update support ticket'
        });
    }
});
router.post('/tickets/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, updatedBy } = req.body;
        const organizationId = 'demo-org';
        const updatedTicket = await customerSupportService.updateTicketStatus(id, organizationId, status, updatedBy || 'system');
        if (!updatedTicket) {
            return res.status(404).json({
                success: false,
                error: 'Support ticket not found'
            });
        }
        res.json({
            success: true,
            data: updatedTicket,
            message: 'Support ticket status updated successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update ticket status via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ticketId: req.params.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to update ticket status'
        });
    }
});
router.post('/tickets/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = SendMessageSchema.parse(req.body);
        const message = await customerSupportService.sendMessage(id, validatedData.senderId, validatedData.senderType, validatedData.message, validatedData.messageType, validatedData.attachments);
        structuredLogger.info('Chat message sent via API', {
            messageId: message.id,
            ticketId: id,
            senderType: validatedData.senderType
        });
        res.status(201).json({
            success: true,
            data: message,
            message: 'Message sent successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to send message via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ticketId: req.params.id
        });
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to send message'
        });
    }
});
router.get('/tickets/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const messages = await customerSupportService.getTicketMessages(id);
        res.json({
            success: true,
            data: {
                messages,
                total: messages.length
            },
            message: 'Messages retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get messages via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ticketId: req.params.id
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get messages'
        });
    }
});
router.post('/knowledge-base', async (req, res) => {
    try {
        const organizationId = 'demo-org';
        const validatedData = CreateArticleSchema.parse(req.body);
        const article = await customerSupportService.createArticle(organizationId, validatedData);
        structuredLogger.info('Knowledge base article created via API', {
            articleId: article.id,
            title: article.title,
            category: article.category,
            organizationId
        });
        res.status(201).json({
            success: true,
            data: article,
            message: 'Knowledge base article created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create knowledge base article via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create knowledge base article'
        });
    }
});
router.get('/knowledge-base', async (req, res) => {
    try {
        const organizationId = 'demo-org';
        const { q: query, category } = req.query;
        const articles = await customerSupportService.searchArticles(organizationId, query || '', category);
        res.json({
            success: true,
            data: {
                articles,
                total: articles.length
            },
            message: 'Knowledge base articles retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to search knowledge base articles via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to search knowledge base articles'
        });
    }
});
router.post('/agents', async (req, res) => {
    try {
        const organizationId = 'demo-org';
        const validatedData = CreateAgentSchema.parse(req.body);
        const agent = await customerSupportService.createAgent(organizationId, validatedData);
        structuredLogger.info('Support agent created via API', {
            agentId: agent.id,
            name: agent.name,
            email: agent.email,
            organizationId
        });
        res.status(201).json({
            success: true,
            data: agent,
            message: 'Support agent created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create support agent via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create support agent'
        });
    }
});
router.get('/agents', async (req, res) => {
    try {
        const organizationId = 'demo-org';
        const agents = Array.from(customerSupportService.agents.values())
            .filter((agent) => agent.organizationId === organizationId);
        res.json({
            success: true,
            data: {
                agents,
                total: agents.length
            },
            message: 'Support agents retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list support agents via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to list support agents'
        });
    }
});
router.get('/statistics', async (req, res) => {
    try {
        const organizationId = 'demo-org';
        const statistics = await customerSupportService.getSupportStatistics(organizationId);
        res.json({
            success: true,
            data: statistics,
            message: 'Support statistics retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get support statistics via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get support statistics'
        });
    }
});
export default router;
//# sourceMappingURL=customer-support.js.map