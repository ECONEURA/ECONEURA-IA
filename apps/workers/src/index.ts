import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import Redis from 'ioredis';
import cron from 'node-cron';
import { GraphService } from './services/graph-service.js';
import { EmailProcessor } from './processors/email-processor.js';
import { JobQueue } from './queues/job-queue.js';
import { CronService } from './services/cron-service.js';
import { logger, logApiRequest } from './utils/logger.js';
import { prometheusMetrics, getMetricsHandler, recordHttpRequest } from './utils/metrics.js';

const app = express();
const port = process.env.PORT || 3001;

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 3
});

// Use centralized metrics from utils
const { register } = prometheusMetrics;

// Initialize services
const graphService = new GraphService();
const emailProcessor = new EmailProcessor();
const jobQueue = new JobQueue();
const cronService = new CronService();

// Helper function for API responses
const createApiResponse = (success: boolean, data?: any, error?: string) => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString()
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const routeLabel = req.route?.path || req.baseUrl || 'unknown';
    recordHttpRequest(req.method, routeLabel, res.statusCode.toString(), duration);
    logApiRequest(req.method, req.url, res.statusCode, duration, {
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length')
    });
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const redisStatus = redis.status === 'ready' ? 'connected' : redis.status;
    const jobStats = await jobQueue.getStats();
    
    res.json(createApiResponse(true, {
      status: 'healthy',
      service: 'workers',
      version: '1.0.0',
      uptime: process.uptime(),
      redis: redisStatus,
      jobQueue: jobStats,
      features: ['outlook-integration', 'graph-subscriptions', 'delta-queries', 'job-processing', 'cron-jobs', 'email-processing', 'metrics']
    }));
  } catch (error) {
    logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Health check failed'));
  }
});

// Microsoft Graph webhook listener
app.post('/listen', async (req, res) => {
  try {
    // Handle Microsoft Graph subscription validation
    if (req.query.validationToken) {
      logger.info('Graph subscription validation received', { token: req.query.validationToken });
      return res.status(200).send(req.query.validationToken);
    }

    // Process Graph webhook notification
    const notifications = req.body.value || [];
    
    for (const notification of notifications) {
      logger.info('Graph notification received', {
        changeType: notification.changeType,
        resource: notification.resource,
        subscriptionId: notification.subscriptionId
      });
      
      // Add to monitoring queue for processing
      await jobQueue.addMonitorJob('system', {
        subscriptionId: notification.subscriptionId,
        priority: 3
      });
    }

    res.status(200).json(createApiResponse(true, {
      message: 'Graph notifications received',
      count: notifications.length
    }));

  } catch (error) {
    logger.error('Graph webhook processing error', { error: error instanceof Error ? error.message : 'Unknown error' });
    prometheusMetrics.errors.inc({ type: 'webhook', source: 'graph' });
    res.status(500).json(createApiResponse(false, null, 'Webhook processing error'));
  }
});

// Job management endpoints
app.post('/jobs/:jobType', async (req, res) => {
  try {
    const { jobType } = req.params;
    const jobData = req.body;

    const validJobTypes = ['email:classify', 'email:draft', 'email:extract', 'monitor:inbox'];
    if (!validJobTypes.includes(jobType)) {
      return res.status(400).json(createApiResponse(false, null, 'Invalid job type'));
    }

    let jobId: string;
    
    // Route to appropriate job method
    switch (jobType) {
      case 'email:classify':
        if (!jobData.messageId || !jobData.message) {
          return res.status(400).json(createApiResponse(false, null, 'messageId and message required for classify'));
        }
        jobId = await jobQueue.addClassifyJob(jobData.messageId, jobData.message, { priority: jobData.priority, userId: jobData.userId });
        break;
      case 'email:draft':
        if (!jobData.request?.to) {
          return res.status(400).json(createApiResponse(false, null, 'request.to required for draft'));
        }
        jobId = await jobQueue.addDraftJob(jobData.request, { priority: jobData.priority, userId: jobData.userId });
        break;
      case 'email:extract':
        if (!jobData.messageId || !jobData.message) {
          return res.status(400).json(createApiResponse(false, null, 'messageId and message required for extract'));
        }
        jobId = await jobQueue.addExtractJob(jobData.messageId, jobData.message, jobData.schema || {}, { priority: jobData.priority, userId: jobData.userId });
        break;
      case 'monitor:inbox':
        if (!jobData.userId) {
          return res.status(400).json(createApiResponse(false, null, 'userId required for monitoring'));
        }
        jobId = await jobQueue.addMonitorJob(jobData.userId, { priority: jobData.priority, subscriptionId: jobData.subscriptionId });
        break;
      default:
        return res.status(400).json(createApiResponse(false, null, 'Invalid job type'));
    }
    
    res.json(createApiResponse(true, {
      jobId,
      jobType,
      status: 'queued',
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    logger.error('Job creation error', { jobType: req.params.jobType, error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Job creation failed'));
  }
});

// Get job status endpoint
app.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await jobQueue.getJobStatus(jobId);
    
    if (status.status === 'not_found') {
      return res.status(404).json(createApiResponse(false, null, 'Job not found'));
    }
    
    res.json(createApiResponse(true, status));
  } catch (error) {
    logger.error('Job status error', { jobId: req.params.jobId, error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to get job status'));
  }
});

app.get('/jobs/stats', async (req, res) => {
  try {
    const stats = await jobQueue.getStats();
    
    res.json(createApiResponse(true, {
      stats,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    logger.error('Job stats error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to get job stats'));
  }
});

// Subscription management endpoints
app.post('/subscriptions', async (req, res) => {
  try {
    const { mailbox, changeTypes = ['created', 'updated'] } = req.body;
    
    if (!mailbox) {
      return res.status(400).json(createApiResponse(false, null, 'Mailbox is required'));
    }

    const subscription = await graphService.createSubscription(mailbox, changeTypes);
    
    res.json(createApiResponse(true, {
      subscriptionId: subscription.id,
      mailbox,
      changeTypes,
      expirationDateTime: subscription.expirationDateTime,
      notificationUrl: subscription.notificationUrl
    }));

  } catch (error) {
    logger.error('Subscription creation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to create subscription'));
  }
});

app.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await graphService.listSubscriptions();
    
    res.json(createApiResponse(true, {
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        resource: sub.resource,
        changeType: sub.changeType,
        expirationDateTime: sub.expirationDateTime,
        notificationUrl: sub.notificationUrl
      })),
      count: subscriptions.length
    }));

  } catch (error) {
    logger.error('List subscriptions failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to list subscriptions'));
  }
});

app.delete('/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await graphService.deleteSubscription(id);
    
    res.json(createApiResponse(true, {
      message: 'Subscription deleted',
      subscriptionId: id
    }));

  } catch (error) {
    logger.error('Delete subscription failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to delete subscription'));
  }
});

// Delta query endpoints
app.post('/delta/:mailbox', async (req, res) => {
  try {
    const { mailbox } = req.params;
    
    const result = await graphService.executeDeltaQuery(mailbox);
    
    res.json(createApiResponse(true, {
      mailbox,
      newMessages: result.messages?.length || 0,
      deltaLink: result.deltaLink,
      nextLink: result.nextLink,
      processed: true
    }));

  } catch (error) {
    logger.error('Delta query failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    prometheusMetrics.errors.inc({ type: 'delta_query', source: 'graph' });
    res.status(500).json(createApiResponse(false, null, 'Delta query failed'));
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metricsData = await getMetricsHandler();
    res.set('Content-Type', metricsData.contentType);
    res.end(metricsData.metrics);
  } catch (error) {
    logger.error('Error getting metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).end('Error generating metrics');
  }
});

// Worker status endpoint
app.get('/workers/status', async (req, res) => {
  try {
    const jobStats = await jobQueue.getStats();
    const subscriptions = await graphService.listSubscriptions();
    
    res.json(createApiResponse(true, {
      service: 'outlook-workers',
      jobProcessing: jobStats,
      graphSubscriptions: {
        active: subscriptions.length,
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          resource: s.resource,
          expiresIn: new Date(s.expirationDateTime).getTime() - Date.now()
        }))
      },
      supportedJobs: ['email:classify', 'email:draft', 'email:extract', 'monitor:inbox'],
      features: {
        deltaQueries: 'Active with deltaLink persistence',
        idempotency: 'internetMessageId based',
        backoffStrategy: 'Exponential for 429/5xx errors'
      }
    }));

  } catch (error) {
    logger.error('Worker status failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to get worker status'));
  }
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Worker service error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  prometheusMetrics.errors.inc({ type: 'api_error', source: 'express' });
  res.status(500).json(createApiResponse(false, null, 'Internal worker service error'));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  try {
    await jobQueue.shutdown();
    await redis.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
});

// Schedule subscription renewal (every hour, renew if < 72h remaining)
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Starting subscription renewal check');
    await graphService.renewExpiringSubscriptions();
  } catch (error) {
    logger.error('Subscription renewal failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Schedule inbox monitoring (every 15 minutes)
cron.schedule('*/15 * * * *', async () => {
  try {
    logger.info('Starting inbox monitoring cycle');
    const mailboxes = await graphService.getMonitoredMailboxes();
    
    for (const mailbox of mailboxes) {
      await jobQueue.addMonitorJob(mailbox, { priority: 3 });
    }
    
    logger.info('Inbox monitoring jobs queued', { count: mailboxes.length });
  } catch (error) {
    logger.error('Inbox monitoring failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Redis connection handling
redis.on('connect', () => {
  logger.info('Connected to Redis for job queue');
});

redis.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

// Cron job management endpoints
app.get('/cron/jobs', async (req, res) => {
  try {
    const jobs = cronService.getAllJobs();
    res.json(createApiResponse(true, { jobs }));
  } catch (error) {
    logger.error('Failed to get cron jobs', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to get cron jobs'));
  }
});

app.get('/cron/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = cronService.getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json(createApiResponse(false, null, 'Cron job not found'));
    }
    
    res.json(createApiResponse(true, { job }));
  } catch (error) {
    logger.error('Failed to get cron job', { 
      jobId: req.params.jobId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createApiResponse(false, null, 'Failed to get cron job'));
  }
});

app.post('/cron/jobs/:jobId/enable', async (req, res) => {
  try {
    const { jobId } = req.params;
    cronService.enableJob(jobId);
    res.json(createApiResponse(true, { message: 'Cron job enabled' }));
  } catch (error) {
    logger.error('Failed to enable cron job', { 
      jobId: req.params.jobId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createApiResponse(false, null, 'Failed to enable cron job'));
  }
});

app.post('/cron/jobs/:jobId/disable', async (req, res) => {
  try {
    const { jobId } = req.params;
    cronService.disableJob(jobId);
    res.json(createApiResponse(true, { message: 'Cron job disabled' }));
  } catch (error) {
    logger.error('Failed to disable cron job', { 
      jobId: req.params.jobId,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createApiResponse(false, null, 'Failed to disable cron job'));
  }
});

app.get('/cron/stats', async (req, res) => {
  try {
    const stats = cronService.getJobStats();
    res.json(createApiResponse(true, { stats }));
  } catch (error) {
    logger.error('Failed to get cron stats', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json(createApiResponse(false, null, 'Failed to get cron stats'));
  }
});

// Email processing endpoints
app.post('/emails/process', async (req, res) => {
  try {
    const { messageId, organizationId } = req.body;
    
    if (!messageId || !organizationId) {
      return res.status(400).json(createApiResponse(false, null, 'messageId and organizationId are required'));
    }

    const result = await emailProcessor.processEmail(messageId, organizationId);
    res.json(createApiResponse(true, { result }));
  } catch (error) {
    logger.error('Failed to process email', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createApiResponse(false, null, 'Failed to process email'));
  }
});

app.post('/emails/process/bulk', async (req, res) => {
  try {
    const { messageIds, organizationId } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || !organizationId) {
      return res.status(400).json(createApiResponse(false, null, 'messageIds array and organizationId are required'));
    }

    const results = await emailProcessor.processBulkEmails(messageIds, organizationId);
    res.json(createApiResponse(true, { results }));
  } catch (error) {
    logger.error('Failed to process bulk emails', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json(createApiResponse(false, null, 'Failed to process bulk emails'));
  }
});

// Initialize job queue and start the server
async function startServer() {
  try {
    // Initialize job queue
    await jobQueue.initialize();
    logger.info('Job queue initialized successfully');
    
    // Start the server
    app.listen(port, () => {
      logger.info('ECONEURA Workers started', {
        port,
        endpoints: {
          health: `/health`,
          metrics: `/metrics`,
          status: `/workers/status`,
          webhook: `/listen`,
          subscriptions: `/subscriptions`,
          cronJobs: `/cron/jobs`,
          cronStats: `/cron/stats`,
          emailProcess: `/emails/process`,
          emailBulk: `/emails/process/bulk`
        },
        features: [
          'Microsoft Graph subscriptions with auto-renewal',
          'Delta queries with deltaLink persistence', 
          'Job processing: email:classify, email:draft, email:extract, monitor:inbox',
          'Exponential backoff for 429/5xx errors',
          'Idempotency via internetMessageId',
          'Webhook listener and subscription management',
          'Cron job scheduling and management',
          'Email processing with AI categorization',
          'Prometheus metrics and monitoring',
          'Redis-based job queue with retry logic'
        ]
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
}

startServer();