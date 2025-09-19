import { Router } from 'express';
import { z } from 'zod';
import { graphWrappersService } from '../lib/graph-wrappers.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const GetUsersSchema = z.object({
    organizationId: z.string().min(1)
});
const GetUserSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().min(1)
});
const GetMessagesSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().min(1),
    limit: z.coerce.number().int().positive().max(100).default(50)
});
const GetCalendarEventsSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().min(1),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});
const GetDriveItemsSchema = z.object({
    organizationId: z.string().min(1),
    userId: z.string().min(1),
    folderId: z.string().optional()
});
const GetTeamsSchema = z.object({
    organizationId: z.string().min(1)
});
const GetTeamChannelsSchema = z.object({
    organizationId: z.string().min(1),
    teamId: z.string().min(1)
});
const AddToOutboxSchema = z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
    toRecipients: z.array(z.string().email()).min(1),
    ccRecipients: z.array(z.string().email()).optional(),
    bccRecipients: z.array(z.string().email()).optional(),
    importance: z.enum(['low', 'normal', 'high']).default('normal'),
    isDraft: z.boolean().default(false),
    scheduledDateTime: z.string().optional()
});
const GetOutboxMessagesSchema = z.object({
    organizationId: z.string().min(1),
    status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional()
});
router.get('/users', async (req, res) => {
    try {
        const validatedData = GetUsersSchema.parse(req.query);
        const users = await graphWrappersService.getUsers(validatedData.organizationId);
        res.json({
            success: true,
            data: {
                users,
                total: users.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get users', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get users',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/users/:userId', async (req, res) => {
    try {
        const validatedData = GetUserSchema.parse({
            ...req.params,
            ...req.query
        });
        const user = await graphWrappersService.getUser(validatedData.userId, validatedData.organizationId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.json({
            success: true,
            data: user,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get user', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.params.userId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get user',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/messages', async (req, res) => {
    try {
        const validatedData = GetMessagesSchema.parse(req.query);
        const messages = await graphWrappersService.getMessages(validatedData.organizationId, validatedData.userId, validatedData.limit);
        res.json({
            success: true,
            data: {
                messages,
                total: messages.length,
                limit: validatedData.limit
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get messages', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get messages',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/calendar/events', async (req, res) => {
    try {
        const validatedData = GetCalendarEventsSchema.parse(req.query);
        const events = await graphWrappersService.getCalendarEvents(validatedData.organizationId, validatedData.userId, validatedData.startDate, validatedData.endDate);
        res.json({
            success: true,
            data: {
                events,
                total: events.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get calendar events', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get calendar events',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/drive/items', async (req, res) => {
    try {
        const validatedData = GetDriveItemsSchema.parse(req.query);
        const items = await graphWrappersService.getDriveItems(validatedData.organizationId, validatedData.userId, validatedData.folderId);
        res.json({
            success: true,
            data: {
                items,
                total: items.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get drive items', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get drive items',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/teams', async (req, res) => {
    try {
        const validatedData = GetTeamsSchema.parse(req.query);
        const teams = await graphWrappersService.getTeams(validatedData.organizationId);
        res.json({
            success: true,
            data: {
                teams,
                total: teams.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get teams', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get teams',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/teams/:teamId/channels', async (req, res) => {
    try {
        const validatedData = GetTeamChannelsSchema.parse({
            ...req.params,
            ...req.query
        });
        const channels = await graphWrappersService.getTeamChannels(validatedData.teamId, validatedData.organizationId);
        res.json({
            success: true,
            data: {
                channels,
                total: channels.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get team channels', {
            error: error instanceof Error ? error.message : 'Unknown error',
            teamId: req.params.teamId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get team channels',
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/outbox', async (req, res) => {
    try {
        const validatedData = AddToOutboxSchema.parse(req.body);
        const message = await graphWrappersService.addToOutbox(validatedData);
        res.json({
            success: true,
            data: message,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to add message to outbox', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to add message to outbox',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/outbox', async (req, res) => {
    try {
        const validatedData = GetOutboxMessagesSchema.parse(req.query);
        const messages = await graphWrappersService.getOutboxMessages(validatedData.organizationId, validatedData.status);
        res.json({
            success: true,
            data: {
                messages,
                total: messages.length,
                status: validatedData.status || 'all'
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to get outbox messages', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get outbox messages',
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/outbox/:messageId/send', async (req, res) => {
    try {
        const { messageId } = req.params;
        const success = await graphWrappersService.sendOutboxMessage(messageId);
        res.json({
            success,
            message: success ? 'Message sent successfully' : 'Failed to send message',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: 'Message not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (error instanceof Error && error.message.includes('not in pending status')) {
            res.status(400).json({
                success: false,
                error: 'Message cannot be sent',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to send outbox message', {
            error: error instanceof Error ? error.message : 'Unknown error',
            messageId: req.params.messageId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to send outbox message',
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/outbox/:messageId/cancel', async (req, res) => {
    try {
        const { messageId } = req.params;
        const success = await graphWrappersService.cancelOutboxMessage(messageId);
        res.json({
            success,
            message: success ? 'Message cancelled successfully' : 'Failed to cancel message',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: 'Message not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        if (error instanceof Error && error.message.includes('cannot be cancelled')) {
            res.status(400).json({
                success: false,
                error: 'Message cannot be cancelled',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return;
        }
        structuredLogger.error('Failed to cancel outbox message', {
            error: error instanceof Error ? error.message : 'Unknown error',
            messageId: req.params.messageId,
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to cancel outbox message',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = await graphWrappersService.getHealth();
        res.json({
            success: true,
            data: health,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get graph health', {
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: req.headers['x-request-id'] || ''
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get graph health',
            timestamp: new Date().toISOString()
        });
    }
});
export { router as graphWrappersRouter };
//# sourceMappingURL=graph-wrappers.js.map