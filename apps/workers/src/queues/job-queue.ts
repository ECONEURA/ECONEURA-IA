/**
 * JobQueue - Bull queue management for email processing jobs
 * ECONEURA WORKERS OUTLOOK - Job Queue Management
 */

import Bull, { Queue, Job, JobOptions } from 'bull';
import Redis from 'ioredis';
import { EmailProcessor } from '../processors/email-processor';
import { GraphService } from '../services/graph-service';
import { logger } from '../utils/logger';
import { prometheusMetrics } from '../utils/metrics';

interface BaseJobData {
  jobId: string;
  timestamp: number;
  priority?: number;
  userId?: string;
}

interface EmailClassifyJobData extends BaseJobData {
  type: 'email:classify';
  messageId: string;
  message: {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: string;
  };
}

interface EmailDraftJobData extends BaseJobData {
  type: 'email:draft';
  request: {
    to: string;
    subject?: string;
    context?: string;
    tone?: 'professional' | 'friendly' | 'urgent';
    replyTo?: {
      messageId: string;
      subject: string;
      body: string;
    };
  };
}

interface EmailExtractJobData extends BaseJobData {
  type: 'email:extract';
  messageId: string;
  message: {
    id: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    timestamp: string;
  };
  schema: any;
}

interface InboxMonitorJobData extends BaseJobData {
  type: 'monitor:inbox';
  userId: string;
  subscriptionId?: string;
}

type JobData = EmailClassifyJobData | EmailDraftJobData | EmailExtractJobData | InboxMonitorJobData;

export class JobQueue {
  private redis: Redis;
  private emailQueue: Queue;
  private monitorQueue: Queue;
  private emailProcessor: EmailProcessor;
  private graphService: GraphService;
  private isProcessing: boolean = false;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    // Initialize queues
    this.emailQueue = new Bull('email-processing', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.monitorQueue = new Bull('inbox-monitoring', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      },
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    // Initialize services
    this.emailProcessor = new EmailProcessor();
    this.graphService = new GraphService();

    this.setupEventListeners();
  }

  /**
   * Initialize queue processing
   */
  async initialize(): Promise<void> {
    try {
      // Connect to Redis
      await this.redis.connect();
      logger.info('Connected to Redis for job queue');

      // Setup queue processors
      this.setupProcessors();

      // Start processing
      this.isProcessing = true;
      logger.info('Job queue initialized and processing started');

      // Setup recurring jobs
      await this.setupRecurringJobs();

    } catch (error) {
      logger.error('Failed to initialize job queue', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Add email classification job
   */
  async addClassifyJob(
    messageId: string,
    message: any,
    options: { priority?: number; userId?: string } = {}
  ): Promise<string> {
    const jobId = `classify-${messageId}-${Date.now()}`;
    
    const jobData: EmailClassifyJobData = {
      type: 'email:classify',
      jobId,
      messageId,
      message,
      timestamp: Date.now(),
      priority: options.priority || 5,
      userId: options.userId
    };

    const jobOptions: JobOptions = {
      priority: options.priority || 5,
      delay: 0,
      jobId
    };

    await this.emailQueue.add('classify', jobData, jobOptions);
    
    logger.info('Added email classification job', { 
      jobId, 
      messageId, 
      priority: options.priority 
    });
    
    prometheusMetrics.jobsQueued.inc({ type: 'email:classify' });
    return jobId;
  }

  /**
   * Add email draft generation job
   */
  async addDraftJob(
    request: any,
    options: { priority?: number; userId?: string } = {}
  ): Promise<string> {
    const jobId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const jobData: EmailDraftJobData = {
      type: 'email:draft',
      jobId,
      request,
      timestamp: Date.now(),
      priority: options.priority || 5,
      userId: options.userId
    };

    const jobOptions: JobOptions = {
      priority: options.priority || 5,
      delay: 0,
      jobId
    };

    await this.emailQueue.add('draft', jobData, jobOptions);
    
    logger.info('Added email draft job', { 
      jobId, 
      recipient: request.to,
      priority: options.priority 
    });
    
    prometheusMetrics.jobsQueued.inc({ type: 'email:draft' });
    return jobId;
  }

  /**
   * Add email data extraction job
   */
  async addExtractJob(
    messageId: string,
    message: any,
    schema: any,
    options: { priority?: number; userId?: string } = {}
  ): Promise<string> {
    const jobId = `extract-${messageId}-${Date.now()}`;
    
    const jobData: EmailExtractJobData = {
      type: 'email:extract',
      jobId,
      messageId,
      message,
      schema,
      timestamp: Date.now(),
      priority: options.priority || 5,
      userId: options.userId
    };

    const jobOptions: JobOptions = {
      priority: options.priority || 5,
      delay: 0,
      jobId
    };

    await this.emailQueue.add('extract', jobData, jobOptions);
    
    logger.info('Added email extraction job', { 
      jobId, 
      messageId,
      schemaFields: Object.keys(schema || {}),
      priority: options.priority 
    });
    
    prometheusMetrics.jobsQueued.inc({ type: 'email:extract' });
    return jobId;
  }

  /**
   * Add inbox monitoring job
   */
  async addMonitorJob(
    userId: string,
    options: { priority?: number; subscriptionId?: string; delay?: number } = {}
  ): Promise<string> {
    const jobId = `monitor-${userId}-${Date.now()}`;
    
    const jobData: InboxMonitorJobData = {
      type: 'monitor:inbox',
      jobId,
      userId,
      subscriptionId: options.subscriptionId,
      timestamp: Date.now(),
      priority: options.priority || 3
    };

    const jobOptions: JobOptions = {
      priority: options.priority || 3,
      delay: options.delay || 0,
      jobId
    };

    await this.monitorQueue.add('monitor', jobData, jobOptions);
    
    logger.info('Added inbox monitoring job', { 
      jobId, 
      userId,
      subscriptionId: options.subscriptionId,
      delay: options.delay
    });
    
    prometheusMetrics.jobsQueued.inc({ type: 'monitor:inbox' });
    return jobId;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      // Try email queue first
      let job = await this.emailQueue.getJob(jobId);
      if (!job) {
        // Try monitor queue
        job = await this.monitorQueue.getJob(jobId);
      }

      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      
      return {
        id: job.id,
        status: state,
        progress: job.progress(),
        data: job.data,
        result: job.returnvalue,
        error: job.failedReason,
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      };
    } catch (error) {
      logger.error('Failed to get job status', { jobId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<any> {
    try {
      const [emailWaiting, emailActive, emailCompleted, emailFailed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed()
      ]);

      const [monitorWaiting, monitorActive, monitorCompleted, monitorFailed] = await Promise.all([
        this.monitorQueue.getWaiting(),
        this.monitorQueue.getActive(),
        this.monitorQueue.getCompleted(),
        this.monitorQueue.getFailed()
      ]);

      return {
        email: {
          waiting: emailWaiting.length,
          active: emailActive.length,
          completed: emailCompleted.length,
          failed: emailFailed.length
        },
        monitor: {
          waiting: monitorWaiting.length,
          active: monitorActive.length,
          completed: monitorCompleted.length,
          failed: monitorFailed.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get queue stats', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Setup queue processors
   */
  private setupProcessors(): void {
    // Email processing queue
    this.emailQueue.process('classify', 5, async (job: Job<EmailClassifyJobData>) => {
      const { jobId, messageId, message } = job.data;
      
      logger.info('Processing email classification', { jobId, messageId });
      
      try {
        const result = await this.emailProcessor.classifyEmail(message, jobId);
        
        logger.info('Email classification completed', { 
          jobId, 
          messageId, 
          category: result.category 
        });
        
        return result;
      } catch (error) {
        logger.error('Email classification failed', { 
          jobId, 
          messageId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    });

    this.emailQueue.process('draft', 3, async (job: Job<EmailDraftJobData>) => {
      const { jobId, request } = job.data;
      
      logger.info('Processing email draft generation', { jobId, recipient: request.to });
      
      try {
        const result = await this.emailProcessor.generateDraft(request, jobId);
        
        logger.info('Email draft generation completed', { 
          jobId, 
          recipient: request.to 
        });
        
        return result;
      } catch (error) {
        logger.error('Email draft generation failed', { 
          jobId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    });

    this.emailQueue.process('extract', 3, async (job: Job<EmailExtractJobData>) => {
      const { jobId, messageId, message, schema } = job.data;
      
      logger.info('Processing email data extraction', { jobId, messageId });
      
      try {
        const result = await this.emailProcessor.extractData(message, schema, jobId);
        
        logger.info('Email data extraction completed', { 
          jobId, 
          messageId,
          extractedFields: Object.keys(result)
        });
        
        return result;
      } catch (error) {
        logger.error('Email data extraction failed', { 
          jobId, 
          messageId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    });

    // Monitor processing queue
    this.monitorQueue.process('monitor', 2, async (job: Job<InboxMonitorJobData>) => {
      const { jobId, userId, subscriptionId } = job.data;
      
      logger.info('Processing inbox monitoring', { jobId, userId, subscriptionId });
      
      try {
        const result = await this.graphService.executeDeltaQuery(userId);
        
        logger.info('Inbox monitoring completed', { 
          jobId, 
          userId,
          messagesFound: result.messages?.length || 0
        });
        
        return result;
      } catch (error) {
        logger.error('Inbox monitoring failed', { 
          jobId, 
          userId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Email queue events
    this.emailQueue.on('completed', (job, result) => {
      logger.debug('Email job completed', { 
        jobId: job.id, 
        type: job.data.type,
        duration: Date.now() - job.data.timestamp
      });
      
      prometheusMetrics.jobsCompleted.inc({ type: job.data.type });
    });

    this.emailQueue.on('failed', (job, err) => {
      logger.error('Email job failed', { 
        jobId: job.id, 
        type: job.data.type,
        error: err instanceof Error ? err.message : 'Unknown error',
        attempts: job.attemptsMade
      });
      
      prometheusMetrics.jobsFailed.inc({ type: job.data.type });
    });

    // Monitor queue events
    this.monitorQueue.on('completed', (job, result) => {
      logger.debug('Monitor job completed', { 
        jobId: job.id, 
        type: job.data.type,
        userId: job.data.userId
      });
      
      prometheusMetrics.jobsCompleted.inc({ type: job.data.type });
    });

    this.monitorQueue.on('failed', (job, err) => {
      logger.error('Monitor job failed', { 
        jobId: job.id, 
        type: job.data.type,
        userId: job.data.userId,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      prometheusMetrics.jobsFailed.inc({ type: job.data.type });
    });
  }

  /**
   * Setup recurring jobs
   */
  private async setupRecurringJobs(): Promise<void> {
    try {
      // Add recurring inbox monitoring (every 5 minutes for active users)
      await this.monitorQueue.add('monitor', {
        type: 'monitor:inbox',
        jobId: `recurring-monitor-${Date.now()}`,
        userId: 'system',
        timestamp: Date.now()
      }, {
        repeat: { cron: '*/5 * * * *' }, // Every 5 minutes
        jobId: 'recurring-inbox-monitor'
      });

      logger.info('Setup recurring jobs for inbox monitoring');

    } catch (error) {
      logger.error('Failed to setup recurring jobs', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isProcessing = false;
    
    logger.info('Shutting down job queues...');
    
    await Promise.all([
      this.emailQueue.close(),
      this.monitorQueue.close(),
      this.redis.disconnect()
    ]);
    
    logger.info('Job queues shut down successfully');
  }
}