import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { db } from '../db/connection.js';
import { logger } from '@econeura/shared/logging';
import { asyncHandler, ApiError } from '../mw/problemJson.js';
import { AuthenticatedRequest } from '../mw/auth.js';
import { integrationRequestsTotal } from '@econeura/shared/metrics';

export const channelRoutes = Router();

// Validation schemas
const SendMessageSchema = z.object({
  channel: z.enum(['email', 'whatsapp', 'teams']),
  recipient: z.string().min(1),
  message: z.string().min(1).max(4000),
  template_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// POST /api/channels/email - Send email message
channelRoutes.post('/email', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const corrId = res.locals.corr_id;
  
  const validation = SendMessageSchema.safeParse({
    ...req.body,
    channel: 'email',
  });
  
  if (!validation.success) {
    throw ApiError.unprocessableEntity(
      'Invalid email request',
      { validation_errors: validation.error.issues }
    );
  }
  
  const { recipient, message, template_id, metadata } = validation.data;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipient)) {
    throw ApiError.badRequest('Invalid email address format');
  }
  
  logger.info('Sending email message', {
    corr_id: corrId,
    org_id: orgId,
    recipient,
    template_id,
    message_length: message.length,
  });
  
  try {
    const messageId = uuid();
    
    // Queue email for processing
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO job_queue (org_id, job_type, payload, priority) 
       VALUES ($1, $2, $3, $4)`,
      [
        orgId,
        'send_email',
        JSON.stringify({
          message_id: messageId,
          channel: 'email',
          recipient,
          message,
          template_id,
          metadata: {
            ...metadata,
            org_id: orgId,
            corr_id: corrId,
          },
        }),
        2, // Medium priority
      ]
    );
    
    // Record interaction
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO interactions (org_id, channel, payload) 
       VALUES ($1, $2, $3)`,
      [
        orgId,
        'email',
        JSON.stringify({
          message_id: messageId,
          recipient,
          template_id,
          corr_id: corrId,
          status: 'queued',
          type: 'outbound',
        }),
      ]
    );
    
    integrationRequestsTotal.labels('graph', 'send_email', 'queued').inc();
    
    logger.info('Email message queued successfully', {
      corr_id: corrId,
      org_id: orgId,
      message_id: messageId,
      recipient,
    });
    
    res.status(202).json({
      message_id: messageId,
      status: 'queued',
      channel: 'email',
      recipient,
      corr_id: corrId,
    });
    
  } catch (error) {
    integrationRequestsTotal.labels('graph', 'send_email', 'error').inc();
    
    logger.error('Failed to queue email message', error as Error, {
      corr_id: corrId,
      org_id: orgId,
      recipient,
    });
    
    throw ApiError.internalServerError('Failed to send email message');
  }
}));

// POST /api/channels/whatsapp - Send WhatsApp message
channelRoutes.post('/whatsapp', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const corrId = res.locals.corr_id;
  
  const validation = SendMessageSchema.safeParse({
    ...req.body,
    channel: 'whatsapp',
  });
  
  if (!validation.success) {
    throw ApiError.unprocessableEntity(
      'Invalid WhatsApp request',
      { validation_errors: validation.error.issues }
    );
  }
  
  const { recipient, message, template_id, metadata } = validation.data;
  
  // Validate phone number format (basic)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(recipient.replace(/[\s\-\(\)]/g, ''))) {
    throw ApiError.badRequest('Invalid phone number format');
  }
  
  logger.info('Sending WhatsApp message', {
    corr_id: corrId,
    org_id: orgId,
    recipient,
    template_id,
    message_length: message.length,
  });
  
  try {
    const messageId = uuid();
    
    // Queue WhatsApp message for processing
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO job_queue (org_id, job_type, payload, priority) 
       VALUES ($1, $2, $3, $4)`,
      [
        orgId,
        'send_whatsapp',
        JSON.stringify({
          message_id: messageId,
          channel: 'whatsapp',
          recipient: recipient.replace(/[\s\-\(\)]/g, ''), // Clean phone number
          message,
          template_id,
          metadata: {
            ...metadata,
            org_id: orgId,
            corr_id: corrId,
          },
        }),
        1, // High priority for WhatsApp (time-sensitive)
      ]
    );
    
    // Record interaction
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO interactions (org_id, channel, payload) 
       VALUES ($1, $2, $3)`,
      [
        orgId,
        'whatsapp',
        JSON.stringify({
          message_id: messageId,
          recipient: recipient.replace(/[\s\-\(\)]/g, ''),
          template_id,
          corr_id: corrId,
          status: 'queued',
          type: 'outbound',
        }),
      ]
    );
    
    integrationRequestsTotal.labels('whatsapp', 'send_message', 'queued').inc();
    
    logger.info('WhatsApp message queued successfully', {
      corr_id: corrId,
      org_id: orgId,
      message_id: messageId,
      recipient: recipient.replace(/[\s\-\(\)]/g, ''),
    });
    
    res.status(202).json({
      message_id: messageId,
      status: 'queued',
      channel: 'whatsapp',
      recipient: recipient.replace(/[\s\-\(\)]/g, ''),
      corr_id: corrId,
    });
    
  } catch (error) {
    integrationRequestsTotal.labels('whatsapp', 'send_message', 'error').inc();
    
    logger.error('Failed to queue WhatsApp message', error as Error, {
      corr_id: corrId,
      org_id: orgId,
      recipient,
    });
    
    throw ApiError.internalServerError('Failed to send WhatsApp message');
  }
}));

// POST /api/channels/teams - Send Teams message
channelRoutes.post('/teams', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const corrId = res.locals.corr_id;
  
  const validation = SendMessageSchema.safeParse({
    ...req.body,
    channel: 'teams',
  });
  
  if (!validation.success) {
    throw ApiError.unprocessableEntity(
      'Invalid Teams request',
      { validation_errors: validation.error.issues }
    );
  }
  
  const { recipient, message, template_id, metadata } = validation.data;
  
  // Recipient can be user email, channel ID, or team ID
  // Basic validation - should be email or UUID-like format
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  const isId = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(recipient);
  
  if (!isEmail && !isId) {
    throw ApiError.badRequest('Recipient must be valid email address or Teams ID');
  }
  
  logger.info('Sending Teams message', {
    corr_id: corrId,
    org_id: orgId,
    recipient,
    template_id,
    message_length: message.length,
  });
  
  try {
    const messageId = uuid();
    
    // Queue Teams message for processing
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO job_queue (org_id, job_type, payload, priority) 
       VALUES ($1, $2, $3, $4)`,
      [
        orgId,
        'send_teams_message',
        JSON.stringify({
          message_id: messageId,
          channel: 'teams',
          recipient,
          message,
          template_id,
          metadata: {
            ...metadata,
            org_id: orgId,
            corr_id: corrId,
          },
        }),
        2, // Medium priority
      ]
    );
    
    // Record interaction
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO interactions (org_id, channel, payload) 
       VALUES ($1, $2, $3)`,
      [
        orgId,
        'teams',
        JSON.stringify({
          message_id: messageId,
          recipient,
          template_id,
          corr_id: corrId,
          status: 'queued',
          type: 'outbound',
        }),
      ]
    );
    
    integrationRequestsTotal.labels('graph', 'send_teams_message', 'queued').inc();
    
    logger.info('Teams message queued successfully', {
      corr_id: corrId,
      org_id: orgId,
      message_id: messageId,
      recipient,
    });
    
    res.status(202).json({
      message_id: messageId,
      status: 'queued',
      channel: 'teams',
      recipient,
      corr_id: corrId,
    });
    
  } catch (error) {
    integrationRequestsTotal.labels('graph', 'send_teams_message', 'error').inc();
    
    logger.error('Failed to queue Teams message', error as Error, {
      corr_id: corrId,
      org_id: orgId,
      recipient,
    });
    
    throw ApiError.internalServerError('Failed to send Teams message');
  }
}));

// GET /api/channels/:messageId/status - Get message delivery status
channelRoutes.get('/:messageId/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const { messageId } = req.params;
  
  // Validate UUID format
  if (!messageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw ApiError.badRequest('Invalid message ID format');
  }
  
  // Look up message in interactions and job queue
  const [interactionResult, jobResult] = await Promise.all([
    db.queryWithOrgScope<{
      channel: string;
      payload: any;
      ts: Date;
    }>(
      orgId,
      `SELECT channel, payload, ts 
       FROM interactions 
       WHERE org_id = $1 AND payload->>'message_id' = $2
       ORDER BY ts DESC LIMIT 1`,
      [orgId, messageId]
    ),
    
    db.query<{
      job_type: string;
      payload: any;
      attempts: number;
      last_error: string | null;
      created_at: Date;
    }>(
      `SELECT job_type, payload, attempts, last_error, created_at
       FROM job_queue 
       WHERE payload->>'message_id' = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [messageId]
    ),
  ]);
  
  if (interactionResult.rows.length === 0) {
    throw ApiError.notFound('Message');
  }
  
  const interaction = interactionResult.rows[0];
  const job = jobResult.rows[0];
  
  // Determine status based on job queue and interaction data
  let status = 'unknown';
  let delivery_details: Record<string, unknown> = {};
  
  if (job) {
    if (job.last_error) {
      status = 'failed';
      delivery_details.error = job.last_error;
      delivery_details.attempts = job.attempts;
    } else if (job.attempts > 0) {
      status = 'processing';
      delivery_details.attempts = job.attempts;
    } else {
      status = 'queued';
    }
  } else {
    // Check interaction payload for status
    const payloadStatus = interaction.payload.status;
    status = payloadStatus || 'unknown';
  }
  
  res.json({
    message_id: messageId,
    channel: interaction.channel,
    status,
    created_at: interaction.ts,
    delivery_details,
    metadata: {
      corr_id: interaction.payload.corr_id,
      recipient: interaction.payload.recipient,
    },
  });
}));