import { Router } from 'express';
import { z } from 'zod';
import { verifyHmac } from '../mw/verifyHmac.js';
import { db } from '../db/connection.js';
import { logger } from '@econeura/shared/logging';
import { asyncHandler, ApiError } from '../mw/problemJson.js';
import { recordWebhook } from '@econeura/shared/metrics';

export const webhookRoutes = Router();

// Validation schemas
const WebhookEventSchema = z.object({
  source: z.enum(['make', 'zapier', 'outlook', 'teams']),
  event_type: z.string().min(1).max(100),
  timestamp: z.number().optional(),
  data: z.record(z.unknown()),
});

// Get webhook secret from environment
const WEBHOOK_SECRETS = {
  make: process.env.MAKE_WEBHOOK_SECRET || 'dev-secret',
  zapier: process.env.ZAPIER_WEBHOOK_SECRET || 'dev-secret',
  outlook: process.env.OUTLOOK_WEBHOOK_SECRET || 'dev-secret',
  teams: process.env.TEAMS_WEBHOOK_SECRET || 'dev-secret',
  stripe: process.env.STRIPE_WEBHOOK_SECRET || 'dev-secret',
  github: process.env.GITHUB_WEBHOOK_SECRET || 'dev-secret',
  slack: process.env.SLACK_SIGNING_SECRET || 'dev-secret',
};

const WEBHOOK_MAX_SKEW = parseInt(process.env.WEBHOOK_MAX_SKEW_SEC || '300');

// POST /api/webhooks/make - Receive Make.com webhooks
webhookRoutes.post('/make', 
  verifyHmac(WEBHOOK_SECRETS.make, WEBHOOK_MAX_SKEW),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const corrId = res.locals.corr_id;
    
    // Validate webhook payload
    const validation = WebhookEventSchema.safeParse(req.body);
    if (!validation.success) {
      recordWebhook('make', 'unknown', Date.now() - startTime, false);
      
      throw ApiError.unprocessableEntity(
        'Invalid webhook payload',
        { validation_errors: validation.error.issues }
      );
    }
    
    const event = validation.data;
    
    logger.logWebhookReceived('Make webhook received', {
      source: 'make',
      event_type: event.event_type,
      signature_valid: res.locals.hmac_verified,
      idempotent: false, // Will be set if idempotency key used
      corr_id: corrId,
    });
    
    try {
      // Queue webhook for processing
      await db.query(
        `INSERT INTO job_queue (job_type, payload, priority, scheduled_for) 
         VALUES ($1, $2, $3, NOW())`,
        [
          'webhook_processing',
          JSON.stringify({
            source: 'make',
            event_type: event.event_type,
            data: event.data,
            webhook_timestamp: res.locals.webhook_timestamp,
            corr_id: corrId,
          }),
          2 // Medium priority for webhooks
        ]
      );
      
      recordWebhook('make', event.event_type, Date.now() - startTime, true);
      
      logger.info('Make webhook queued for processing', {
        corr_id: corrId,
        event_type: event.event_type,
        processing_time_ms: Date.now() - startTime,
      });
      
      res.status(202).json({
        status: 'accepted',
        corr_id: corrId,
        message: 'Webhook received and queued for processing',
      });
      
    } catch (error) {
      recordWebhook('make', event.event_type, Date.now() - startTime, false);
      
      logger.error('Failed to queue Make webhook', error as Error, {
        corr_id: corrId,
        event_type: event.event_type,
      });
      
      throw ApiError.internalServerError('Failed to process webhook');
    }
  })
);

// POST /api/webhooks/zapier - Receive Zapier webhooks
webhookRoutes.post('/zapier',
  verifyHmac(WEBHOOK_SECRETS.zapier, WEBHOOK_MAX_SKEW),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const corrId = res.locals.corr_id;
    
    const validation = WebhookEventSchema.safeParse(req.body);
    if (!validation.success) {
      recordWebhook('zapier', 'unknown', Date.now() - startTime, false);
      throw ApiError.unprocessableEntity(
        'Invalid webhook payload',
        { validation_errors: validation.error.issues }
      );
    }
    
    const event = validation.data;
    
    logger.logWebhookReceived('Zapier webhook received', {
      source: 'zapier',
      event_type: event.event_type,
      signature_valid: res.locals.hmac_verified,
      idempotent: false,
      corr_id: corrId,
    });
    
    // Queue for processing
    await db.query(
      `INSERT INTO job_queue (job_type, payload, priority) 
       VALUES ($1, $2, $3)`,
      [
        'webhook_processing',
        JSON.stringify({
          source: 'zapier',
          event_type: event.event_type,
          data: event.data,
          webhook_timestamp: res.locals.webhook_timestamp,
          corr_id: corrId,
        }),
        2
      ]
    );
    
    recordWebhook('zapier', event.event_type, Date.now() - startTime, true);
    
    res.status(202).json({
      status: 'accepted',
      corr_id: corrId,
      message: 'Zapier webhook processed',
    });
  })
);

// POST /api/webhooks/outlook - Receive Outlook/Graph webhooks
webhookRoutes.post('/outlook',
  verifyHmac(WEBHOOK_SECRETS.outlook, WEBHOOK_MAX_SKEW),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const corrId = res.locals.corr_id;
    
    // Outlook webhook validation is more complex
    const OutlookWebhookSchema = z.object({
      value: z.array(z.object({
        subscriptionId: z.string(),
        changeType: z.string(),
        resource: z.string(),
        resourceData: z.record(z.unknown()).optional(),
        clientState: z.string().optional(),
        subscriptionExpirationDateTime: z.string().optional(),
      })),
    });
    
    const validation = OutlookWebhookSchema.safeParse(req.body);
    if (!validation.success) {
      recordWebhook('outlook', 'unknown', Date.now() - startTime, false);
      throw ApiError.unprocessableEntity(
        'Invalid Outlook webhook payload',
        { validation_errors: validation.error.issues }
      );
    }
    
    const outlookData = validation.data;
    
    logger.logWebhookReceived('Outlook webhook received', {
      source: 'outlook',
      event_type: 'graph_notification',
      signature_valid: res.locals.hmac_verified,
      idempotent: false,
      corr_id: corrId,
    });
    
    // Process each notification in the batch
    for (const notification of outlookData.value) {
      await db.query(
        `INSERT INTO job_queue (job_type, payload, priority) 
         VALUES ($1, $2, $3)`,
        [
          'graph_notification',
          JSON.stringify({
            source: 'outlook',
            subscription_id: notification.subscriptionId,
            change_type: notification.changeType,
            resource: notification.resource,
            resource_data: notification.resourceData,
            client_state: notification.clientState,
            corr_id: corrId,
          }),
          3 // Lower priority for notifications
        ]
      );
    }
    
    recordWebhook('outlook', 'graph_notification', Date.now() - startTime, true);
    
    res.status(202).json({
      status: 'accepted',
      corr_id: corrId,
      notifications_processed: outlookData.value.length,
    });
  })
);

// POST /api/webhooks/teams - Receive Teams webhooks
webhookRoutes.post('/teams',
  verifyHmac(WEBHOOK_SECRETS.teams, WEBHOOK_MAX_SKEW),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const corrId = res.locals.corr_id;
    
    // Teams webhook can have various formats
    const event = {
      source: 'teams' as const,
      event_type: req.body.type || 'message',
      data: req.body,
    };
    
    logger.logWebhookReceived('Teams webhook received', {
      source: 'teams',
      event_type: event.event_type,
      signature_valid: res.locals.hmac_verified,
      idempotent: false,
      corr_id: corrId,
    });
    
    await db.query(
      `INSERT INTO job_queue (job_type, payload, priority) 
       VALUES ($1, $2, $3)`,
      [
        'teams_event',
        JSON.stringify({
          source: 'teams',
          event_type: event.event_type,
          data: event.data,
          webhook_timestamp: res.locals.webhook_timestamp,
          corr_id: corrId,
        }),
        3
      ]
    );
    
    recordWebhook('teams', event.event_type, Date.now() - startTime, true);
    
    res.status(202).json({
      status: 'accepted',
      corr_id: corrId,
    });
  })
);

// POST /api/webhooks/stripe - Receive Stripe webhooks
webhookRoutes.post('/stripe', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const corrId = res.locals.corr_id;
  
  logger.logWebhookReceived('Stripe webhook received', {
    source: 'stripe',
    event_type: req.body.type || 'unknown',
    signature_valid: res.locals.hmac_verified,
    idempotent: true, // Stripe provides idempotency
    corr_id: corrId,
  });
  
  // Queue for processing
  await db.query(
    `INSERT INTO job_queue (job_type, payload, priority, idempotency_key) 
     VALUES ($1, $2, $3, $4)`,
    [
      'stripe_event',
      JSON.stringify({
        source: 'stripe',
        event_id: req.body.id,
        event_type: req.body.type,
        data: req.body.data,
        corr_id: corrId,
      }),
      1, // High priority for payment events
      req.body.id // Stripe event ID as idempotency key
    ]
  );
  
  recordWebhook('stripe', req.body.type || 'unknown', Date.now() - startTime, true);
  
  res.status(200).json({ received: true });
}));

// POST /api/webhooks/github - Receive GitHub webhooks
webhookRoutes.post('/github', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const corrId = res.locals.corr_id;
  const eventType = req.headers['x-github-event'] as string || 'unknown';
  
  logger.logWebhookReceived('GitHub webhook received', {
    source: 'github',
    event_type: eventType,
    signature_valid: res.locals.hmac_verified,
    idempotent: true,
    corr_id: corrId,
  });
  
  // Queue for processing
  await db.query(
    `INSERT INTO job_queue (job_type, payload, priority, idempotency_key) 
     VALUES ($1, $2, $3, $4)`,
    [
      'github_event',
      JSON.stringify({
        source: 'github',
        event_type: eventType,
        delivery_id: req.headers['x-github-delivery'],
        data: req.body,
        corr_id: corrId,
      }),
      2,
      req.headers['x-github-delivery'] as string
    ]
  );
  
  recordWebhook('github', eventType, Date.now() - startTime, true);
  
  res.status(200).json({ status: 'ok' });
}));

// POST /api/webhooks/slack - Receive Slack webhooks
webhookRoutes.post('/slack', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const corrId = res.locals.corr_id;
  const eventType = req.body.type || 'unknown';
  
  // Handle Slack URL verification
  if (eventType === 'url_verification') {
    return res.json({ challenge: req.body.challenge });
  }
  
  logger.logWebhookReceived('Slack webhook received', {
    source: 'slack',
    event_type: eventType,
    signature_valid: res.locals.hmac_verified,
    idempotent: true,
    corr_id: corrId,
  });
  
  // Queue for processing
  await db.query(
    `INSERT INTO job_queue (job_type, payload, priority, idempotency_key) 
     VALUES ($1, $2, $3, $4)`,
    [
      'slack_event',
      JSON.stringify({
        source: 'slack',
        event_type: eventType,
        team_id: req.body.team_id,
        data: req.body,
        corr_id: corrId,
      }),
      2,
      req.body.event_id || `${req.body.team_id}-${Date.now()}`
    ]
  );
  
  recordWebhook('slack', eventType, Date.now() - startTime, true);
  
  res.status(200).json({ status: 'ok' });
}));

// GET /api/webhooks/health - Webhook health check (no auth required)
webhookRoutes.get('/health', asyncHandler(async (req, res) => {
  // Simple health check for webhook endpoints
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      make: { configured: !!WEBHOOK_SECRETS.make },
      zapier: { configured: !!WEBHOOK_SECRETS.zapier },
      outlook: { configured: !!WEBHOOK_SECRETS.outlook },
      teams: { configured: !!WEBHOOK_SECRETS.teams },
      stripe: { configured: !!WEBHOOK_SECRETS.stripe },
      github: { configured: !!WEBHOOK_SECRETS.github },
      slack: { configured: !!WEBHOOK_SECRETS.slack },
    },
    max_skew_seconds: WEBHOOK_MAX_SKEW,
  };
  
  res.json(health);
}));