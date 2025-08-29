import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { apiRouter } from '../routes/index.js'
import { Problems } from '../middleware/problem-json.js'

const app = express()
app.use(express.json())
app.use('/api', apiRouter)

// Mock database
vi.mock('@econeura/db', () => ({
  db: {
    query: vi.fn(),
  },
  setOrg: vi.fn(() => Promise.resolve()),
}))

// Mock environment
vi.mock('@econeura/shared', () => ({
  env: () => ({
    MAKE_WEBHOOK_HMAC_SECRET: 'test-secret',
    MAKE_ALLOWED_IPS: '127.0.0.1,192.168.1.1',
    NODE_ENV: 'test',
  }),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Make Webhooks Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/webhooks/make', () => {
    it('should process invoice overdue event successfully', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockResolvedValue({ rows: [] } as any)

      const webhookPayload = {
        event_type: 'invoice_overdue',
        data: {
          invoice_id: 'inv-123',
          amount: 1500.00,
          due_date: '2024-01-15',
          customer_email: 'customer@example.com',
          org_id: 'org1',
        },
        timestamp: new Date().toISOString(),
        source: 'make',
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Webhook processed successfully',
        event_type: 'invoice_overdue',
      })

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO job_queue'),
        expect.arrayContaining(['cfo_collection_trigger'])
      )
    })

    it('should process payment received event successfully', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockResolvedValue({ rows: [] } as any)

      const webhookPayload = {
        event_type: 'payment_received',
        data: {
          invoice_id: 'inv-123',
          amount: 1500.00,
          payment_method: 'credit_card',
          transaction_id: 'txn-456',
          org_id: 'org1',
        },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Payment received and processed successfully',
        event_type: 'payment_received',
      })

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE invoices'),
        expect.arrayContaining(['paid'])
      )
    })

    it('should process customer created event successfully', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockResolvedValue({ rows: [] } as any)

      const webhookPayload = {
        event_type: 'customer_created',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          org_id: 'org1',
        },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Customer created successfully',
        event_type: 'customer_created',
      })

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO companies'),
        expect.arrayContaining(['Acme Corp'])
      )
    })

    it('should process deal won event successfully', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockResolvedValue({ rows: [] } as any)

      const webhookPayload = {
        event_type: 'deal_won',
        data: {
          deal_id: 'deal-123',
          amount: 50000.00,
          customer_id: 'cust-456',
          close_date: '2024-01-15',
          org_id: 'org1',
        },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Deal marked as won successfully',
        event_type: 'deal_won',
      })

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE deals'),
        expect.arrayContaining(['won'])
      )
    })

    it('should process task completed event successfully', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockResolvedValue({ rows: [] } as any)

      const webhookPayload = {
        event_type: 'task_completed',
        data: {
          task_id: 'task-123',
          completed_by: 'user-456',
          completion_notes: 'Task completed successfully',
          org_id: 'org1',
        },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task marked as completed successfully',
        event_type: 'task_completed',
      })

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tasks'),
        expect.arrayContaining(['completed'])
      )
    })

    it('should process custom event successfully', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockResolvedValue({ rows: [] } as any)

      const webhookPayload = {
        event_type: 'custom_event',
        data: {
          custom_type: 'lead_converted',
          custom_data: { lead_id: 'lead-123', conversion_value: 10000 },
          org_id: 'org1',
        },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Custom event queued for processing',
        event_type: 'custom_event',
      })

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO job_queue'),
        expect.arrayContaining(['custom_webhook_event'])
      )
    })

    it('should return 400 for invalid event type', async () => {
      const webhookPayload = {
        event_type: 'invalid_event',
        data: { test: 'data' },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(400)

      expect(response.body).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
      })
    })

    it('should return 400 for missing required fields', async () => {
      const webhookPayload = {
        event_type: 'invoice_overdue',
        // Missing data field
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(400)

      expect(response.body).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Bad Request',
        status: 400,
      })
    })

    it('should handle database errors gracefully', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockRejectedValue(new Error('Database connection failed'))

      const webhookPayload = {
        event_type: 'invoice_overdue',
        data: {
          invoice_id: 'inv-123',
          amount: 1500.00,
          org_id: 'org1',
        },
        timestamp: new Date().toISOString(),
      }

      const response = await request(app)
        .post('/api/webhooks/make')
        .set('x-forwarded-for', '127.0.0.1')
        .set('x-make-signature', 'valid-signature')
        .set('x-make-timestamp', Math.floor(Date.now() / 1000).toString())
        .send(webhookPayload)
        .expect(500)

      expect(response.body).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
        title: 'Internal Server Error',
        status: 500,
      })
    })
  })

  describe('GET /api/webhooks/make/stats', () => {
    it('should return webhook statistics', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.query).mockResolvedValue({
        rows: [
          {
            event_type: 'invoice_overdue',
            success_count: '10',
            failure_count: '2',
            avg_processing_time: '150.5',
          },
          {
            event_type: 'payment_received',
            success_count: '25',
            failure_count: '1',
            avg_processing_time: '75.2',
          },
        ],
      } as any)

      const response = await request(app)
        .get('/api/webhooks/make/stats')
        .set('x-org-id', 'org1')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          stats: expect.arrayContaining([
            expect.objectContaining({
              event_type: 'invoice_overdue',
              success_count: '10',
              failure_count: '2',
            }),
          ]),
          period: '24h',
          total_events: 38, // 10+2+25+1
        },
      })
    })

    it('should return 401 without organization context', async () => {
      const response = await request(app)
        .get('/api/webhooks/make/stats')
        .expect(401)

      expect(response.body).toMatchObject({
        type: 'https://tools.ietf.org/html/rfc7235#section-3.1',
        title: 'Unauthorized',
        status: 401,
      })
    })
  })

  describe('GET /api/webhooks/make/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/webhooks/make/health')
        .expect(200)

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'make-webhooks',
        features: {
          ip_allowlist: true,
          hmac_verification: true,
          idempotency: true,
          audit_trail: true,
        },
      })
    })
  })
})
