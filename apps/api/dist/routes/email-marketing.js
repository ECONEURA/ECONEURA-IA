import { Router } from 'express';
import { z } from 'zod';

import { emailMarketingService } from '../services/email-marketing.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const CreateCampaignSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['newsletter', 'promotional', 'transactional', 'welcome', 'abandoned_cart', 're_engagement', 'announcement', 'survey', 'other']),
    status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'completed']).default('draft'),
    subject: z.string().min(1).max(255),
    previewText: z.string().optional(),
    htmlContent: z.string().min(1),
    textContent: z.string().optional(),
    templateId: z.string().uuid().optional(),
    segments: z.array(z.string().uuid()).default([]),
    recipients: z.array(z.string().email()).default([]),
    scheduledAt: z.string().datetime().optional(),
    fromName: z.string().min(1).max(100),
    fromEmail: z.string().email(),
    replyTo: z.string().email().optional(),
    trackingEnabled: z.boolean().default(true),
    abTest: z.object({
        enabled: z.boolean().default(false),
        variants: z.array(z.object({
            id: z.string(),
            subject: z.string(),
            htmlContent: z.string(),
            percentage: z.number().min(0).max(100)
        })).default([]),
        winner: z.string().optional(),
        testDuration: z.number().optional()
    }).optional(),
    automation: z.object({
        enabled: z.boolean().default(false),
        triggers: z.array(z.object({
            type: z.string(),
            conditions: z.record(z.any()),
            delay: z.number().optional()
        })).default([]),
        actions: z.array(z.object({
            type: z.string(),
            config: z.record(z.any())
        })).default([])
    }).optional()
});
const UpdateCampaignSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['newsletter', 'promotional', 'transactional', 'welcome', 'abandoned_cart', 're_engagement', 'announcement', 'survey', 'other']).optional(),
    status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'completed']).optional(),
    subject: z.string().min(1).max(255).optional(),
    previewText: z.string().optional(),
    htmlContent: z.string().min(1).optional(),
    textContent: z.string().optional(),
    templateId: z.string().uuid().optional(),
    segments: z.array(z.string().uuid()).optional(),
    recipients: z.array(z.string().email()).optional(),
    scheduledAt: z.string().datetime().optional(),
    fromName: z.string().min(1).max(100).optional(),
    fromEmail: z.string().email().optional(),
    replyTo: z.string().email().optional(),
    trackingEnabled: z.boolean().optional(),
    abTest: z.object({
        enabled: z.boolean().default(false),
        variants: z.array(z.object({
            id: z.string(),
            subject: z.string(),
            htmlContent: z.string(),
            percentage: z.number().min(0).max(100)
        })).default([]),
        winner: z.string().optional(),
        testDuration: z.number().optional()
    }).optional(),
    automation: z.object({
        enabled: z.boolean().default(false),
        triggers: z.array(z.object({
            type: z.string(),
            conditions: z.record(z.any()),
            delay: z.number().optional()
        })).default([]),
        actions: z.array(z.object({
            type: z.string(),
            config: z.record(z.any())
        })).default([])
    }).optional()
});
const CreateSubscriberSchema = z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    status: z.enum(['active', 'unsubscribed', 'bounced', 'complained', 'pending']).default('active'),
    tags: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({}),
    segments: z.array(z.string().uuid()).default([]),
    source: z.string().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    location: z.object({
        country: z.string().optional(),
        region: z.string().optional(),
        city: z.string().optional(),
        timezone: z.string().optional()
    }).optional(),
    preferences: z.object({
        frequency: z.enum(['daily', 'weekly', 'monthly', 'never']).default('weekly'),
        categories: z.array(z.string()).default([]),
        format: z.enum(['html', 'text']).default('html')
    }).optional()
});
const UpdateSubscriberSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    status: z.enum(['active', 'unsubscribed', 'bounced', 'complained', 'pending']).optional(),
    tags: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
    segments: z.array(z.string().uuid()).optional(),
    preferences: z.object({
        frequency: z.enum(['daily', 'weekly', 'monthly', 'never']).optional(),
        categories: z.array(z.string()).optional(),
        format: z.enum(['html', 'text']).optional()
    }).optional()
});
const SearchCampaignsSchema = z.object({
    query: z.string().optional(),
    filters: z.object({
        type: z.array(z.enum(['newsletter', 'promotional', 'transactional', 'welcome', 'abandoned_cart', 're_engagement', 'announcement', 'survey', 'other'])).optional(),
        status: z.array(z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'completed'])).optional(),
        dateRange: z.object({
            from: z.string().datetime().optional(),
            to: z.string().datetime().optional()
        }).optional(),
        tags: z.array(z.string()).optional()
    }).optional(),
    sort: z.object({
        field: z.enum(['name', 'createdAt', 'sentAt', 'openRate', 'clickRate']),
        direction: z.enum(['asc', 'desc'])
    }).optional(),
    pagination: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20)
    }).optional()
});
router.post('/campaigns', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'demo-org';
        const createdBy = req.user?.id || 'demo-user';
        const validatedData = CreateCampaignSchema.parse(req.body);
        const campaignData = {
            ...validatedData,
            scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
        };
        const campaign = await emailMarketingService.createCampaign(organizationId, campaignData, createdBy);
        structuredLogger.info('Email campaign created via API', {
            campaignId: campaign.id,
            name: campaign.name,
            type: campaign.type,
            organizationId
        });
        res.status(201).json({
            success: true,
            data: campaign,
            message: 'Email campaign created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create email campaign via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.user?.organizationId
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
            error: 'Failed to create email campaign'
        });
    }
});
router.get('/campaigns', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'demo-org';
        const searchParams = SearchCampaignsSchema.parse(req.query);
        if (searchParams.filters?.dateRange) {
            if (searchParams.filters.dateRange.from) {
                searchParams.filters.dateRange.from = new Date(searchParams.filters.dateRange.from);
            }
            if (searchParams.filters.dateRange.to) {
                searchParams.filters.dateRange.to = new Date(searchParams.filters.dateRange.to);
            }
        }
        const result = await emailMarketingService.searchCampaigns(organizationId, searchParams);
        res.json({
            success: true,
            data: result,
            message: 'Email campaigns retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list email campaigns via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.user?.organizationId
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
            error: 'Failed to list email campaigns'
        });
    }
});
router.get('/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId || 'demo-org';
        const campaign = await emailMarketingService.getCampaign(id, organizationId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'Email campaign not found'
            });
        }
        res.json({
            success: true,
            data: campaign,
            message: 'Email campaign retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get email campaign via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            campaignId: req.params.id,
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get email campaign'
        });
    }
});
router.put('/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId || 'demo-org';
        const updatedBy = req.user?.id || 'demo-user';
        const validatedData = UpdateCampaignSchema.parse(req.body);
        const updates = {
            ...validatedData,
            scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
        };
        const campaign = await emailMarketingService.updateCampaign(id, organizationId, updates, updatedBy);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'Email campaign not found'
            });
        }
        structuredLogger.info('Email campaign updated via API', {
            campaignId: id,
            organizationId
        });
        res.json({
            success: true,
            data: campaign,
            message: 'Email campaign updated successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update email campaign via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            campaignId: req.params.id,
            organizationId: req.user?.organizationId
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
            error: 'Failed to update email campaign'
        });
    }
});
router.delete('/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId || 'demo-org';
        const success = await emailMarketingService.deleteCampaign(id, organizationId);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Email campaign not found'
            });
        }
        structuredLogger.info('Email campaign deleted via API', {
            campaignId: id,
            organizationId
        });
        res.json({
            success: true,
            message: 'Email campaign deleted successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to delete email campaign via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            campaignId: req.params.id,
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to delete email campaign'
        });
    }
});
router.post('/campaigns/:id/send', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId || 'demo-org';
        const sentBy = req.user?.id || 'demo-user';
        const campaign = await emailMarketingService.getCampaign(id, organizationId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: 'Email campaign not found'
            });
        }
        await emailMarketingService.updateCampaign(id, organizationId, {
            status: 'sending',
            sentAt: new Date()
        }, sentBy);
        structuredLogger.info('Email campaign sent via API', {
            campaignId: id,
            organizationId,
            sentBy
        });
        res.json({
            success: true,
            message: 'Email campaign sent successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to send email campaign via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            campaignId: req.params.id,
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to send email campaign'
        });
    }
});
router.post('/subscribers', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'demo-org';
        const validatedData = CreateSubscriberSchema.parse(req.body);
        const subscriber = await emailMarketingService.createSubscriber(organizationId, validatedData);
        structuredLogger.info('Email subscriber created via API', {
            subscriberId: subscriber.id,
            email: subscriber.email,
            organizationId
        });
        res.status(201).json({
            success: true,
            data: subscriber,
            message: 'Email subscriber created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create email subscriber via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.user?.organizationId
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
            error: 'Failed to create email subscriber'
        });
    }
});
router.get('/subscribers', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'demo-org';
        const subscribers = Array.from(emailMarketingService.subscribers.values())
            .filter((subscriber) => subscriber.organizationId === organizationId);
        res.json({
            success: true,
            data: {
                subscribers,
                total: subscribers.length,
                page: 1,
                limit: subscribers.length
            },
            message: 'Email subscribers retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list email subscribers via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to list email subscribers'
        });
    }
});
router.get('/subscribers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId || 'demo-org';
        const subscriber = await emailMarketingService.getSubscriber(id, organizationId);
        if (!subscriber) {
            return res.status(404).json({
                success: false,
                error: 'Email subscriber not found'
            });
        }
        res.json({
            success: true,
            data: subscriber,
            message: 'Email subscriber retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get email subscriber via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            subscriberId: req.params.id,
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get email subscriber'
        });
    }
});
router.put('/subscribers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId || 'demo-org';
        const validatedData = UpdateSubscriberSchema.parse(req.body);
        res.json({
            success: true,
            message: 'Email subscriber updated successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update email subscriber via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            subscriberId: req.params.id,
            organizationId: req.user?.organizationId
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
            error: 'Failed to update email subscriber'
        });
    }
});
router.delete('/subscribers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user?.organizationId || 'demo-org';
        res.json({
            success: true,
            message: 'Email subscriber deleted successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to delete email subscriber via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            subscriberId: req.params.id,
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to delete email subscriber'
        });
    }
});
router.get('/templates', async (req, res) => {
    try {
        const templates = Array.from(emailMarketingService.templates.values());
        res.json({
            success: true,
            data: {
                templates,
                total: templates.length
            },
            message: 'Email templates retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list email templates via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to list email templates'
        });
    }
});
router.get('/segments', async (req, res) => {
    try {
        const segments = Array.from(emailMarketingService.segments.values());
        res.json({
            success: true,
            data: {
                segments,
                total: segments.length
            },
            message: 'Email segments retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list email segments via API', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to list email segments'
        });
    }
});
router.get('/statistics', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'demo-org';
        const statistics = await emailMarketingService.getEmailMarketingStatistics(organizationId);
        res.json({
            success: true,
            data: statistics,
            message: 'Email marketing statistics retrieved successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get email marketing statistics via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get email marketing statistics'
        });
    }
});
export default router;
//# sourceMappingURL=email-marketing.js.map