import { Request, Response } from 'express'
import { z } from 'zod'
import { Problems } from '../middleware/problem-json.js'
import { logger } from '@econeura/shared'
import { db, setOrg } from '@econeura/db'
import { v4 as uuidv4 } from 'uuid'

// Make webhook event schemas
const MakeWebhookEventSchema = z.object({
  event_type: z.enum([
    'invoice_overdue',
    'payment_received',
    'customer_created',
    'deal_won',
    'task_completed',
    'custom_event',
  ]),
  data: z.record(z.unknown()),
  timestamp: z.string().datetime().optional(),
  source: z.string().optional(),
  correlation_id: z.string().optional(),
})

const MakeWebhookResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  correlation_id: z.string(),
  processed_at: z.string().datetime(),
  event_type: z.string(),
})

export type MakeWebhookEvent = z.infer<typeof MakeWebhookEventSchema>
export type MakeWebhookResponse = z.infer<typeof MakeWebhookResponseSchema>

export class MakeWebhooksController {
  /**
   * Process Make webhook event
   */
  async processWebhook(req: Request, res: Response) {
    const startTime = Date.now()
    const corrId = res.locals.corr_id
    const clientIP = res.locals.client_ip

    try {
      // Validate webhook payload
      const validation = MakeWebhookEventSchema.safeParse(req.body)
      if (!validation.success) {
        logger.warn('Invalid Make webhook payload', {
          errors: validation.error.errors,
          corr_id: corrId,
          client_ip: clientIP,
        })
        
        throw Problems.badRequest('Invalid webhook payload', {
          details: validation.error.errors,
        })
      }

      const event = validation.data
      const orgId = this.extractOrgId(event) || 'system'

      // Set organization context for RLS
      await setOrg(orgId)

      logger.info('Processing Make webhook event', {
        event_type: event.event_type,
        org_id: orgId,
        corr_id: corrId,
        client_ip: clientIP,
        timestamp: event.timestamp,
      })

      // Process event based on type
      const result = await this.processEventByType(event, orgId, corrId)

      // Record webhook processing
      await this.recordWebhookProcessing(event, orgId, corrId, startTime, true)

      const response: MakeWebhookResponse = {
        success: true,
        message: 'Webhook processed successfully',
        correlation_id: corrId,
        processed_at: new Date().toISOString(),
        event_type: event.event_type,
      }

      res.status(200).json(response)

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      logger.error('Make webhook processing failed', error as Error, {
        corr_id: corrId,
        client_ip: clientIP,
        processing_time_ms: processingTime,
      })

      // Record failed processing
      try {
        const event = MakeWebhookEventSchema.safeParse(req.body)
        if (event.success) {
          const orgId = this.extractOrgId(event.data) || 'system'
          await this.recordWebhookProcessing(event.data, orgId, corrId, startTime, false)
        }
      } catch (recordError) {
        logger.error('Failed to record webhook processing error', recordError as Error)
      }

      throw error
    }
  }

  /**
   * Process event based on its type
   */
  private async processEventByType(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string
  ): Promise<{ success: boolean; message: string }> {
    switch (event.event_type) {
      case 'invoice_overdue':
        return this.processInvoiceOverdue(event, orgId, corrId)
      
      case 'payment_received':
        return this.processPaymentReceived(event, orgId, corrId)
      
      case 'customer_created':
        return this.processCustomerCreated(event, orgId, corrId)
      
      case 'deal_won':
        return this.processDealWon(event, orgId, corrId)
      
      case 'task_completed':
        return this.processTaskCompleted(event, orgId, corrId)
      
      case 'custom_event':
        return this.processCustomEvent(event, orgId, corrId)
      
      default:
        throw new Error(`Unknown event type: ${event.event_type}`)
    }
  }

  /**
   * Process invoice overdue event
   */
  private async processInvoiceOverdue(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string
  ): Promise<{ success: boolean; message: string }> {
    const { invoice_id, amount, due_date, customer_email } = event.data as any

    logger.info('Processing invoice overdue event', {
      invoice_id,
      amount,
      due_date,
      customer_email,
      org_id: orgId,
      corr_id: corrId,
    })

    // Queue for CFO collection playbook
    await db.query.
      `INSERT INTO job_queue (org_id, job_type, payload, priority) 
       VALUES ($1, $2, $3, $4)`,
      [
        orgId,
        'cfo_collection_trigger',
        JSON.stringify({
          trigger_source: 'make_webhook',
          invoice_id,
          amount,
          due_date,
          customer_email,
          corr_id: corrId,
        }),
        1, // High priority
      ]
    )

    return {
      success: true,
      message: 'Invoice overdue event queued for collection processing',
    }
  }

  /**
   * Process payment received event
   */
  private async processPaymentReceived(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string
  ): Promise<{ success: boolean; message: string }> {
    const { invoice_id, amount, payment_method, transaction_id } = event.data as any

    logger.info('Processing payment received event', {
      invoice_id,
      amount,
      payment_method,
      transaction_id,
      org_id: orgId,
      corr_id: corrId,
    })

    // Update invoice status
    await db.query.
      `UPDATE invoices 
       SET status = 'paid', 
           paid_at = NOW(), 
           payment_method = $1,
           transaction_id = $2
       WHERE id = $3 AND org_id = $4`,
      [payment_method, transaction_id, invoice_id, orgId]
    )

    // Queue notification
    await db.query.
      `INSERT INTO job_queue (org_id, job_type, payload, priority) 
       VALUES ($1, $2, $3, $4)`,
      [
        orgId,
        'payment_notification',
        JSON.stringify({
          invoice_id,
          amount,
          payment_method,
          transaction_id,
          corr_id: corrId,
        }),
        2, // Medium priority
      ]
    )

    return {
      success: true,
      message: 'Payment received and processed successfully',
    }
  }

  /**
   * Process customer created event
   */
  private async processCustomerCreated(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string
  ): Promise<{ success: boolean; message: string }> {
    const { name, email, phone, company } = event.data as any

    logger.info('Processing customer created event', {
      name,
      email,
      company,
      org_id: orgId,
      corr_id: corrId,
    })

    // Create customer record
    await db.query.
      `INSERT INTO companies (org_id, name, email, phone, contact_person, status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orgId, company || name, email, phone, name, 'active']
    )

    return {
      success: true,
      message: 'Customer created successfully',
    }
  }

  /**
   * Process deal won event
   */
  private async processDealWon(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string
  ): Promise<{ success: boolean; message: string }> {
    const { deal_id, amount, customer_id, close_date } = event.data as any

    logger.info('Processing deal won event', {
      deal_id,
      amount,
      customer_id,
      close_date,
      org_id: orgId,
      corr_id: corrId,
    })

    // Update deal status
    await db.query.
      `UPDATE deals 
       SET status = 'won', 
           closed_at = $1,
           amount = $2
       WHERE id = $3 AND org_id = $4`,
      [close_date || new Date(), amount, deal_id, orgId]
    )

    return {
      success: true,
      message: 'Deal marked as won successfully',
    }
  }

  /**
   * Process task completed event
   */
  private async processTaskCompleted(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string
  ): Promise<{ success: boolean; message: string }> {
    const { task_id, completed_by, completion_notes } = event.data as any

    logger.info('Processing task completed event', {
      task_id,
      completed_by,
      org_id: orgId,
      corr_id: corrId,
    })

    // Update task status
    await db.query.
      `UPDATE tasks 
       SET status = 'completed', 
           completed_at = NOW(),
           completed_by = $1,
           notes = $2
       WHERE id = $3 AND org_id = $4`,
      [completed_by, completion_notes, task_id, orgId]
    )

    return {
      success: true,
      message: 'Task marked as completed successfully',
    }
  }

  /**
   * Process custom event
   */
  private async processCustomEvent(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string
  ): Promise<{ success: boolean; message: string }> {
    const { custom_type, custom_data } = event.data as any

    logger.info('Processing custom event', {
      custom_type,
      org_id: orgId,
      corr_id: corrId,
    })

    // Queue for custom processing
    await db.query.
      `INSERT INTO job_queue (org_id, job_type, payload, priority) 
       VALUES ($1, $2, $3, $4)`,
      [
        orgId,
        'custom_webhook_event',
        JSON.stringify({
          custom_type,
          custom_data,
          corr_id: corrId,
        }),
        3, // Lower priority
      ]
    )

    return {
      success: true,
      message: 'Custom event queued for processing',
    }
  }

  /**
   * Extract organization ID from event data
   */
  private extractOrgId(event: MakeWebhookEvent): string | null {
    // Try to extract org_id from various possible locations
    const orgId = (event.data as any)?.org_id || 
                  (event.data as any)?.organization_id ||
                  (event.data as any)?.tenant_id ||
                  event.source

    return orgId || null
  }

  /**
   * Record webhook processing for audit
   */
  private async recordWebhookProcessing(
    event: MakeWebhookEvent,
    orgId: string,
    corrId: string,
    startTime: number,
    success: boolean
  ): Promise<void> {
    const processingTime = Date.now() - startTime

    try {
      await db.query.
        `INSERT INTO audit_events (org_id, actor, action, payload_json, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [
          orgId,
          'make_webhook',
          `webhook_${event.event_type}_${success ? 'success' : 'failed'}`,
          JSON.stringify({
            event_type: event.event_type,
            correlation_id: corrId,
            processing_time_ms: processingTime,
            success,
            timestamp: event.timestamp,
            source: event.source,
          }),
        ]
      )
    } catch (error) {
      logger.error('Failed to record webhook processing audit', error as Error, {
        org_id: orgId,
        corr_id: corrId,
      })
    }
  }

  /**
   * Get webhook processing statistics
   */
  async getWebhookStats(req: Request, res: Response) {
    try {
      const orgId = req.orgId
      if (!orgId) {
        throw Problems.unauthorized('Organization context required')
      }

      await setOrg(orgId)

      // Get statistics from audit events
      const result = await db.query<{
        event_type: string
        success_count: string
        failure_count: string
        avg_processing_time: string
      }>(
        `SELECT 
           SUBSTRING(action FROM 'webhook_(.+)_(success|failed)') as event_type,
           COUNT(CASE WHEN action LIKE '%_success' THEN 1 END) as success_count,
           COUNT(CASE WHEN action LIKE '%_failed' THEN 1 END) as failure_count,
           AVG(CAST(payload_json->>'processing_time_ms' AS INTEGER)) as avg_processing_time
         FROM audit_events 
         WHERE action LIKE 'webhook_%'
           AND created_at >= NOW() - INTERVAL '24 hours'
         GROUP BY event_type
         ORDER BY event_type`,
        []
      )

      res.json({
        success: true,
        data: {
          stats: result.rows,
          period: '24h',
          total_events: result.rows.reduce((sum, row) => 
            sum + parseInt(row.success_count) + parseInt(row.failure_count), 0
          ),
        },
      })

    } catch (error) {
      throw error
    }
  }
}

export const makeWebhooksController = new MakeWebhooksController()
