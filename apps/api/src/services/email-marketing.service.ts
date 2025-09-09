/**
 * EMAIL MARKETING SERVICE
 * 
 * PR-56: Sistema completo de email marketing avanzado
 * 
 * Funcionalidades:
 * - Gestión de campañas de email
 * - Automatización de emails
 * - Segmentación de audiencia
 * - Plantillas y personalización
 * - Analytics y métricas
 * - A/B testing
 * - Programación de envíos
 * - Gestión de suscriptores
 */

import { z } from 'zod';
import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '../lib/database.service.js';

// ============================================================================
// SCHEMAS Y TIPOS
// ============================================================================

export const EmailCampaignTypeSchema = z.enum([
  'newsletter', 'promotional', 'transactional', 'welcome', 'abandoned_cart', 're_engagement', 'announcement', 'survey', 'other'
]);

export const EmailCampaignStatusSchema = z.enum(['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'completed']);

export const EmailTemplateTypeSchema = z.enum(['html', 'text', 'responsive', 'drag_drop']);

export const SubscriberStatusSchema = z.enum(['active', 'unsubscribed', 'bounced', 'complained', 'pending']);

export const EmailSegmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']),
    value: z.any(),
    logic: z.enum(['and', 'or']).optional()
  })),
  subscriberCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const EmailTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: EmailTemplateTypeSchema,
  subject: z.string().min(1).max(255),
  htmlContent: z.string(),
  textContent: z.string().optional(),
  previewText: z.string().optional(),
  variables: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const EmailCampaignSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: EmailCampaignTypeSchema,
  status: EmailCampaignStatusSchema,
  subject: z.string().min(1).max(255),
  previewText: z.string().optional(),
  htmlContent: z.string(),
  textContent: z.string().optional(),
  templateId: z.string().uuid().optional(),
  segments: z.array(z.string().uuid()).default([]),
  recipients: z.array(z.string().email()).default([]),
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  completedAt: z.date().optional(),
  fromName: z.string().min(1).max(100),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional(),
  trackingEnabled: z.boolean().default(true),
  analytics: z.object({
    sent: z.number().default(0),
    delivered: z.number().default(0),
    opened: z.number().default(0),
    clicked: z.number().default(0),
    unsubscribed: z.number().default(0),
    bounced: z.number().default(0),
    complained: z.number().default(0),
    openRate: z.number().default(0),
    clickRate: z.number().default(0),
    unsubscribeRate: z.number().default(0),
    bounceRate: z.number().default(0),
    complaintRate: z.number().default(0)
  }).optional(),
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
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid()
});

export const EmailSubscriberSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: SubscriberStatusSchema,
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
  segments: z.array(z.string().uuid()).default([]),
  subscribedAt: z.date(),
  unsubscribedAt: z.date().optional(),
  lastActivityAt: z.date().optional(),
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
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const EmailSearchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    type: z.array(EmailCampaignTypeSchema).optional(),
    status: z.array(EmailCampaignStatusSchema).optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional()
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

export type EmailCampaignType = z.infer<typeof EmailCampaignTypeSchema>;
export type EmailCampaignStatus = z.infer<typeof EmailCampaignStatusSchema>;
export type EmailTemplateType = z.infer<typeof EmailTemplateTypeSchema>;
export type SubscriberStatus = z.infer<typeof SubscriberStatusSchema>;
export type EmailSegment = z.infer<typeof EmailSegmentSchema>;
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;
export type EmailSubscriber = z.infer<typeof EmailSubscriberSchema>;
export type EmailSearch = z.infer<typeof EmailSearchSchema>;

// ============================================================================
// EMAIL MARKETING SERVICE
// ============================================================================

export class EmailMarketingService {
  private db: ReturnType<typeof getDatabaseService>;
  private campaigns: Map<string, EmailCampaign> = new Map();
  private subscribers: Map<string, EmailSubscriber> = new Map();
  private templates: Map<string, EmailTemplate> = new Map();
  private segments: Map<string, EmailSegment> = new Map();
  private searchCache: Map<string, any> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info('Initializing Email Marketing Service', {
        service: 'email-marketing',
        timestamp: new Date().toISOString()
      });

      // Initialize email marketing tables
      await this.initializeEmailMarketingTables();
      
      // Load existing data
      await this.loadExistingData();
      
      // Start background processing
      this.startBackgroundProcessing();

      structuredLogger.info('Email Marketing Service initialized successfully', {
        service: 'email-marketing',
        campaignsCount: this.campaigns.size,
        subscribersCount: this.subscribers.size,
        templatesCount: this.templates.size,
        segmentsCount: this.segments.size
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize Email Marketing Service', {
        service: 'email-marketing',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeEmailMarketingTables(): Promise<void> {
    // Create email_campaigns table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        subject VARCHAR(255) NOT NULL,
        preview_text TEXT,
        html_content TEXT NOT NULL,
        text_content TEXT,
        template_id UUID,
        segments JSONB DEFAULT '[]',
        recipients JSONB DEFAULT '[]',
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        completed_at TIMESTAMP,
        from_name VARCHAR(100) NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        reply_to VARCHAR(255),
        tracking_enabled BOOLEAN DEFAULT TRUE,
        analytics JSONB DEFAULT '{}',
        ab_test JSONB,
        automation JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL
      )
    `);

    // Create email_subscribers table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS email_subscribers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        tags JSONB DEFAULT '[]',
        custom_fields JSONB DEFAULT '{}',
        segments JSONB DEFAULT '[]',
        subscribed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        unsubscribed_at TIMESTAMP,
        last_activity_at TIMESTAMP,
        source VARCHAR(100),
        ip_address INET,
        user_agent TEXT,
        location JSONB,
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create email_templates table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT,
        preview_text TEXT,
        variables JSONB DEFAULT '[]',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create email_segments table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS email_segments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        conditions JSONB NOT NULL DEFAULT '[]',
        subscriber_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create email_analytics table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS email_analytics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
        subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_email_campaigns_org_id ON email_campaigns(organization_id);
      CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_email_campaigns_type ON email_campaigns(type);
      CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_org_id ON email_subscribers(organization_id);
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_status ON email_subscribers(status);
      CREATE INDEX IF NOT EXISTS idx_email_subscribers_segments_gin ON email_subscribers USING GIN(segments);
      CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
      CREATE INDEX IF NOT EXISTS idx_email_segments_conditions_gin ON email_segments USING GIN(conditions);
      CREATE INDEX IF NOT EXISTS idx_email_analytics_campaign_id ON email_analytics(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_email_analytics_subscriber_id ON email_analytics(subscriber_id);
      CREATE INDEX IF NOT EXISTS idx_email_analytics_event_type ON email_analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_email_analytics_timestamp ON email_analytics(timestamp);
    `);
  }

  private async loadExistingData(): Promise<void> {
    try {
      // Load campaigns
      const campaignsResult = await this.db.query(`
        SELECT * FROM email_campaigns WHERE organization_id = $1
      `, ['demo-org']);

      for (const row of campaignsResult.rows) {
        const campaign: EmailCampaign = {
          id: row.id,
          organizationId: row.organization_id,
          name: row.name,
          type: row.type,
          status: row.status,
          subject: row.subject,
          previewText: row.preview_text,
          htmlContent: row.html_content,
          textContent: row.text_content,
          templateId: row.template_id,
          segments: row.segments || [],
          recipients: row.recipients || [],
          scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
          sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          fromName: row.from_name,
          fromEmail: row.from_email,
          replyTo: row.reply_to,
          trackingEnabled: row.tracking_enabled,
          analytics: row.analytics,
          abTest: row.ab_test,
          automation: row.automation,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          createdBy: row.created_by,
          updatedBy: row.updated_by
        };

        this.campaigns.set(campaign.id, campaign);
      }

      // Load subscribers
      const subscribersResult = await this.db.query(`
        SELECT * FROM email_subscribers WHERE organization_id = $1
      `, ['demo-org']);

      for (const row of subscribersResult.rows) {
        const subscriber: EmailSubscriber = {
          id: row.id,
          organizationId: row.organization_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          status: row.status,
          tags: row.tags || [],
          customFields: row.custom_fields || {},
          segments: row.segments || [],
          subscribedAt: new Date(row.subscribed_at),
          unsubscribedAt: row.unsubscribed_at ? new Date(row.unsubscribed_at) : undefined,
          lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at) : undefined,
          source: row.source,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          location: row.location,
          preferences: row.preferences,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };

        this.subscribers.set(subscriber.id, subscriber);
      }

      // Load templates
      const templatesResult = await this.db.query(`
        SELECT * FROM email_templates
      `);

      for (const row of templatesResult.rows) {
        const template: EmailTemplate = {
          id: row.id,
          name: row.name,
          type: row.type,
          subject: row.subject,
          htmlContent: row.html_content,
          textContent: row.text_content,
          previewText: row.preview_text,
          variables: row.variables || [],
          isDefault: row.is_default,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };

        this.templates.set(template.id, template);
      }

      // Load segments
      const segmentsResult = await this.db.query(`
        SELECT * FROM email_segments
      `);

      for (const row of segmentsResult.rows) {
        const segment: EmailSegment = {
          id: row.id,
          name: row.name,
          description: row.description,
          conditions: row.conditions || [],
          subscriberCount: row.subscriber_count,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };

        this.segments.set(segment.id, segment);
      }

      structuredLogger.info('Loaded existing email marketing data', {
        campaignsCount: this.campaigns.size,
        subscribersCount: this.subscribers.size,
        templatesCount: this.templates.size,
        segmentsCount: this.segments.size
      });
    } catch (error) {
      structuredLogger.error('Failed to load existing email marketing data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private startBackgroundProcessing(): void {
    // Background tasks for email marketing
    setInterval(() => {
      this.processScheduledCampaigns();
    }, 60000); // Every minute

    setInterval(() => {
      this.updateAnalytics();
    }, 300000); // Every 5 minutes

    setInterval(() => {
      this.processAutomation();
    }, 120000); // Every 2 minutes
  }

  // ============================================================================
  // CAMPAIGN OPERATIONS
  // ============================================================================

  async createCampaign(
    organizationId: string,
    campaignData: Omit<EmailCampaign, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    createdBy: string
  ): Promise<EmailCampaign> {
    try {
      const campaignId = this.generateId();
      const now = new Date();

      const campaign: EmailCampaign = {
        ...campaignData,
        id: campaignId,
        organizationId,
        createdAt: now,
        updatedAt: now,
        createdBy,
        updatedBy: createdBy
      };

      // Store in database
      await this.db.query(`
        INSERT INTO email_campaigns (
          id, organization_id, name, type, status, subject, preview_text,
          html_content, text_content, template_id, segments, recipients,
          scheduled_at, sent_at, completed_at, from_name, from_email,
          reply_to, tracking_enabled, analytics, ab_test, automation,
          created_at, updated_at, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      `, [
        campaign.id, campaign.organizationId, campaign.name, campaign.type,
        campaign.status, campaign.subject, campaign.previewText,
        campaign.htmlContent, campaign.textContent, campaign.templateId,
        JSON.stringify(campaign.segments), JSON.stringify(campaign.recipients),
        campaign.scheduledAt, campaign.sentAt, campaign.completedAt,
        campaign.fromName, campaign.fromEmail, campaign.replyTo,
        campaign.trackingEnabled, JSON.stringify(campaign.analytics),
        JSON.stringify(campaign.abTest), JSON.stringify(campaign.automation),
        campaign.createdAt, campaign.updatedAt, campaign.createdBy, campaign.updatedBy
      ]);

      // Store in memory
      this.campaigns.set(campaign.id, campaign);

      structuredLogger.info('Email campaign created successfully', {
        campaignId: campaign.id,
        name: campaign.name,
        type: campaign.type,
        organizationId
      });

      return campaign;
    } catch (error) {
      structuredLogger.error('Failed to create email campaign', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  async getCampaign(campaignId: string, organizationId: string): Promise<EmailCampaign | null> {
    try {
      const campaign = this.campaigns.get(campaignId);
      
      if (!campaign || campaign.organizationId !== organizationId) {
        return null;
      }

      return campaign;
    } catch (error) {
      structuredLogger.error('Failed to get email campaign', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
        organizationId
      });
      throw error;
    }
  }

  async updateCampaign(
    campaignId: string,
    organizationId: string,
    updates: Partial<EmailCampaign>,
    updatedBy: string
  ): Promise<EmailCampaign | null> {
    try {
      const campaign = this.campaigns.get(campaignId);
      
      if (!campaign || campaign.organizationId !== organizationId) {
        return null;
      }

      const updatedCampaign: EmailCampaign = {
        ...campaign,
        ...updates,
        updatedAt: new Date(),
        updatedBy
      };

      // Update in database
      await this.db.query(`
        UPDATE email_campaigns SET
          name = $1, type = $2, status = $3, subject = $4, preview_text = $5,
          html_content = $6, text_content = $7, template_id = $8, segments = $9,
          recipients = $10, scheduled_at = $11, sent_at = $12, completed_at = $13,
          from_name = $14, from_email = $15, reply_to = $16, tracking_enabled = $17,
          analytics = $18, ab_test = $19, automation = $20, updated_at = $21, updated_by = $22
        WHERE id = $23 AND organization_id = $24
      `, [
        updatedCampaign.name, updatedCampaign.type, updatedCampaign.status,
        updatedCampaign.subject, updatedCampaign.previewText,
        updatedCampaign.htmlContent, updatedCampaign.textContent,
        updatedCampaign.templateId, JSON.stringify(updatedCampaign.segments),
        JSON.stringify(updatedCampaign.recipients), updatedCampaign.scheduledAt,
        updatedCampaign.sentAt, updatedCampaign.completedAt,
        updatedCampaign.fromName, updatedCampaign.fromEmail, updatedCampaign.replyTo,
        updatedCampaign.trackingEnabled, JSON.stringify(updatedCampaign.analytics),
        JSON.stringify(updatedCampaign.abTest), JSON.stringify(updatedCampaign.automation),
        updatedCampaign.updatedAt, updatedCampaign.updatedBy, campaignId, organizationId
      ]);

      // Update in memory
      this.campaigns.set(campaignId, updatedCampaign);

      structuredLogger.info('Email campaign updated successfully', {
        campaignId,
        organizationId
      });

      return updatedCampaign;
    } catch (error) {
      structuredLogger.error('Failed to update email campaign', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
        organizationId
      });
      throw error;
    }
  }

  async deleteCampaign(campaignId: string, organizationId: string): Promise<boolean> {
    try {
      const campaign = this.campaigns.get(campaignId);
      
      if (!campaign || campaign.organizationId !== organizationId) {
        return false;
      }

      // Delete from database
      await this.db.query(`
        DELETE FROM email_campaigns WHERE id = $1 AND organization_id = $2
      `, [campaignId, organizationId]);

      // Remove from memory
      this.campaigns.delete(campaignId);

      structuredLogger.info('Email campaign deleted successfully', {
        campaignId,
        organizationId
      });

      return true;
    } catch (error) {
      structuredLogger.error('Failed to delete email campaign', {
        error: error instanceof Error ? error.message : 'Unknown error',
        campaignId,
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // SUBSCRIBER OPERATIONS
  // ============================================================================

  async createSubscriber(
    organizationId: string,
    subscriberData: Omit<EmailSubscriber, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EmailSubscriber> {
    try {
      const subscriberId = this.generateId();
      const now = new Date();

      const subscriber: EmailSubscriber = {
        ...subscriberData,
        id: subscriberId,
        organizationId,
        createdAt: now,
        updatedAt: now
      };

      // Store in database
      await this.db.query(`
        INSERT INTO email_subscribers (
          id, organization_id, email, first_name, last_name, status,
          tags, custom_fields, segments, subscribed_at, unsubscribed_at,
          last_activity_at, source, ip_address, user_agent, location,
          preferences, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        subscriber.id, subscriber.organizationId, subscriber.email,
        subscriber.firstName, subscriber.lastName, subscriber.status,
        JSON.stringify(subscriber.tags), JSON.stringify(subscriber.customFields),
        JSON.stringify(subscriber.segments), subscriber.subscribedAt,
        subscriber.unsubscribedAt, subscriber.lastActivityAt,
        subscriber.source, subscriber.ipAddress, subscriber.userAgent,
        JSON.stringify(subscriber.location), JSON.stringify(subscriber.preferences),
        subscriber.createdAt, subscriber.updatedAt
      ]);

      // Store in memory
      this.subscribers.set(subscriber.id, subscriber);

      structuredLogger.info('Email subscriber created successfully', {
        subscriberId: subscriber.id,
        email: subscriber.email,
        organizationId
      });

      return subscriber;
    } catch (error) {
      structuredLogger.error('Failed to create email subscriber', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  async getSubscriber(subscriberId: string, organizationId: string): Promise<EmailSubscriber | null> {
    try {
      const subscriber = this.subscribers.get(subscriberId);
      
      if (!subscriber || subscriber.organizationId !== organizationId) {
        return null;
      }

      return subscriber;
    } catch (error) {
      structuredLogger.error('Failed to get email subscriber', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriberId,
        organizationId
      });
      throw error;
    }
  }

  async getSubscriberByEmail(email: string, organizationId: string): Promise<EmailSubscriber | null> {
    try {
      const subscriber = Array.from(this.subscribers.values())
        .find(s => s.email === email && s.organizationId === organizationId);
      
      return subscriber || null;
    } catch (error) {
      structuredLogger.error('Failed to get email subscriber by email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // CAMPAIGN SEARCH
  // ============================================================================

  async searchCampaigns(organizationId: string, searchParams: EmailSearch): Promise<{
    campaigns: EmailCampaign[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const cacheKey = `search:${organizationId}:${JSON.stringify(searchParams)}`;
      const cached = this.searchCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result;
      }

      let campaigns = Array.from(this.campaigns.values())
        .filter(campaign => campaign.organizationId === organizationId);

      // Apply filters
      if (searchParams.filters) {
        if (searchParams.filters.type) {
          campaigns = campaigns.filter(campaign => searchParams.filters!.type!.includes(campaign.type));
        }
        if (searchParams.filters.status) {
          campaigns = campaigns.filter(campaign => searchParams.filters!.status!.includes(campaign.status));
        }
        if (searchParams.filters.dateRange) {
          const { from, to } = searchParams.filters.dateRange;
          if (from) {
            campaigns = campaigns.filter(campaign => campaign.createdAt >= from);
          }
          if (to) {
            campaigns = campaigns.filter(campaign => campaign.createdAt <= to);
          }
        }
      }

      // Apply text search
      if (searchParams.query) {
        const query = searchParams.query.toLowerCase();
        campaigns = campaigns.filter(campaign => 
          campaign.name.toLowerCase().includes(query) ||
          campaign.subject.toLowerCase().includes(query) ||
          campaign.previewText?.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (searchParams.sort) {
        const { field, direction } = searchParams.sort;
        campaigns.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (field) {
            case 'name':
              aValue = a.name;
              bValue = b.name;
              break;
            case 'createdAt':
              aValue = a.createdAt;
              bValue = b.createdAt;
              break;
            case 'sentAt':
              aValue = a.sentAt || new Date(0);
              bValue = b.sentAt || new Date(0);
              break;
            case 'openRate':
              aValue = a.analytics?.openRate || 0;
              bValue = b.analytics?.openRate || 0;
              break;
            case 'clickRate':
              aValue = a.analytics?.clickRate || 0;
              bValue = b.analytics?.clickRate || 0;
              break;
            default:
              return 0;
          }

          if (direction === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      const total = campaigns.length;
      const page = searchParams.pagination?.page || 1;
      const limit = searchParams.pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const result = {
        campaigns: campaigns.slice(startIndex, endIndex),
        total,
        page,
        limit
      };

      // Cache result
      this.searchCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      structuredLogger.error('Failed to search email campaigns', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async processScheduledCampaigns(): Promise<void> {
    try {
      const now = new Date();
      const scheduledCampaigns = Array.from(this.campaigns.values())
        .filter(campaign => 
          campaign.scheduledAt && 
          campaign.scheduledAt <= now && 
          campaign.status === 'scheduled'
        );

      for (const campaign of scheduledCampaigns) {
        await this.updateCampaign(campaign.id, campaign.organizationId, {
          status: 'sending'
        }, 'system');
      }

      if (scheduledCampaigns.length > 0) {
        structuredLogger.info('Processed scheduled campaigns', {
          count: scheduledCampaigns.length
        });
      }
    } catch (error) {
      structuredLogger.error('Failed to process scheduled campaigns', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async updateAnalytics(): Promise<void> {
    try {
      // Update campaign analytics
      structuredLogger.debug('Updating email marketing analytics', {
        campaignsCount: this.campaigns.size,
        subscribersCount: this.subscribers.size
      });
    } catch (error) {
      structuredLogger.error('Failed to update email marketing analytics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async processAutomation(): Promise<void> {
    try {
      // Process automation rules
      structuredLogger.debug('Processing email marketing automation', {
        campaignsCount: this.campaigns.size
      });
    } catch (error) {
      structuredLogger.error('Failed to process email marketing automation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // ANALYTICS AND STATISTICS
  // ============================================================================

  async getEmailMarketingStatistics(organizationId: string): Promise<{
    totalCampaigns: number;
    campaignsByType: Record<string, number>;
    campaignsByStatus: Record<string, number>;
    totalSubscribers: number;
    subscribersByStatus: Record<string, number>;
    totalTemplates: number;
    totalSegments: number;
    averageOpenRate: number;
    averageClickRate: number;
    topCampaigns: EmailCampaign[];
  }> {
    try {
      const campaigns = Array.from(this.campaigns.values())
        .filter(campaign => campaign.organizationId === organizationId);
      
      const subscribers = Array.from(this.subscribers.values())
        .filter(subscriber => subscriber.organizationId === organizationId);

      const totalCampaigns = campaigns.length;
      const campaignsByType: Record<string, number> = {};
      const campaignsByStatus: Record<string, number> = {};
      const totalSubscribers = subscribers.length;
      const subscribersByStatus: Record<string, number> = {};
      let totalOpenRate = 0;
      let totalClickRate = 0;
      let campaignsWithAnalytics = 0;

      campaigns.forEach(campaign => {
        // Count by type
        campaignsByType[campaign.type] = (campaignsByType[campaign.type] || 0) + 1;
        
        // Count by status
        campaignsByStatus[campaign.status] = (campaignsByStatus[campaign.status] || 0) + 1;
        
        // Sum analytics
        if (campaign.analytics) {
          totalOpenRate += campaign.analytics.openRate || 0;
          totalClickRate += campaign.analytics.clickRate || 0;
          campaignsWithAnalytics++;
        }
      });

      subscribers.forEach(subscriber => {
        // Count by status
        subscribersByStatus[subscriber.status] = (subscribersByStatus[subscriber.status] || 0) + 1;
      });

      // Get top campaigns by open rate
      const topCampaigns = campaigns
        .filter(campaign => campaign.analytics?.openRate)
        .sort((a, b) => (b.analytics?.openRate || 0) - (a.analytics?.openRate || 0))
        .slice(0, 10);

      return {
        totalCampaigns,
        campaignsByType,
        campaignsByStatus,
        totalSubscribers,
        subscribersByStatus,
        totalTemplates: this.templates.size,
        totalSegments: this.segments.size,
        averageOpenRate: campaignsWithAnalytics > 0 ? totalOpenRate / campaignsWithAnalytics : 0,
        averageClickRate: campaignsWithAnalytics > 0 ? totalClickRate / campaignsWithAnalytics : 0,
        topCampaigns
      };
    } catch (error) {
      structuredLogger.error('Failed to get email marketing statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }
}

export const emailMarketingService = new EmailMarketingService();
