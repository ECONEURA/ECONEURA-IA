import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { prometheusMetrics } from '../utils/metrics.js';
import { JobQueueMethods } from './job-queue-methods.js';

export interface Job {
    id: string;
  type: 'email_processing' | 'graph_sync' | 'data_export' | 'report_generation';
  payload: any;
  organizationId: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  averageProcessingTime: number;
}

export class JobQueue extends JobQueueMethods {
  protected redis: Redis;
  private processingCounter = prometheusMetrics.counter({
    name: 'econeura_jobs_processed_total',
    help: 'Total number of jobs processed',
    labelNames: ['type', 'status', 'organization_id']
  });

  private jobDuration = prometheusMetrics.histogram({
    name: 'econeura_job_duration_seconds',
    help: 'Time spent processing jobs',
    labelNames: ['type', 'status']
  });

  private queueSize = prometheusMetrics.gauge({
    name: 'econeura_job_queue_size',
    help: 'Current size of job queues',
    labelNames: ['type', 'status']
  });

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 3
    });
  }

  async enqueue(job: Omit<Job, 'id' | 'status' | 'createdAt' | 'retryCount'>): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullJob: Job = {
      ...job,
      id: jobId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    try {
      // Store job data
      await this.redis.hset(`job:${jobId}`, fullJob);
      
      // Add to priority queue
      const priorityScore = this.getPriorityScore(job.priority);
      await this.redis.zadd(`queue:${job.type}`, priorityScore, jobId);
      
      // Update metrics
      this.queueSize.inc({ type: job.type, status: 'pending' });
      
      logger.info('Job enqueued', {
        jobId,
        type: job.type,
        priority: job.priority,
        organizationId: job.organizationId
      });

      return jobId;
    } catch (error) {
      logger.error('Failed to enqueue job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async dequeue(type: string): Promise<Job | null> {
    try {
      // Get highest priority job
      const result = await this.redis.zpopmax(`queue:${type}`);
      
      if (!result || result.length === 0) {
        return null;
      }

      const jobId = result[0];
      
      // Get job data
      const jobData = await this.redis.hgetall(`job:${jobId}`);
      
      if (!jobData || Object.keys(jobData).length === 0) {
        logger.warn('Job data not found', { jobId });
        return null;
      }

      const job: Job = {
        id: jobData.id,
        type: jobData.type as Job['type'],
        payload: JSON.parse(jobData.payload || '{}'),
        organizationId: jobData.organizationId,
        priority: jobData.priority as Job['priority'],
        status: 'processing' as Job['status'],
        createdAt: jobData.createdAt,
        startedAt: jobData.startedAt,
        completedAt: jobData.completedAt,
        retryCount: parseInt(jobData.retryCount || '0'),
        maxRetries: parseInt(jobData.maxRetries || '3'),
        error: jobData.error,
        metadata: jobData.metadata ? JSON.parse(jobData.metadata) : undefined
      };

      // Update job status
      await this.redis.hset(`job:${jobId}`, {
        status: 'processing',
        startedAt: new Date().toISOString()
      });

      // Update metrics
      this.queueSize.dec({ type: job.type, status: 'pending' });
      this.queueSize.inc({ type: job.type, status: 'processing' });

      logger.info('Job dequeued', {
      jobId,
        type: job.type,
        priority: job.priority,
        organizationId: job.organizationId
      });

      return job;
    } catch (error) {
      logger.error('Failed to dequeue job', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async completeJob(jobId: string, result?: any): Promise<void> {
    try {
      const jobData = await this.redis.hgetall(`job:${jobId}`);
      
      if (!jobData || Object.keys(jobData).length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const job: Job = {
        id: jobData.id,
        type: jobData.type as Job['type'],
        payload: JSON.parse(jobData.payload || '{}'),
        organizationId: jobData.organizationId,
        priority: jobData.priority as Job['priority'],
        status: 'completed' as Job['status'],
        createdAt: jobData.createdAt,
        startedAt: jobData.startedAt,
        completedAt: new Date().toISOString(),
        retryCount: parseInt(jobData.retryCount || '0'),
        maxRetries: parseInt(jobData.maxRetries || '3'),
        error: jobData.error,
        metadata: jobData.metadata ? JSON.parse(jobData.metadata) : undefined
      };

      // Update job status
      await this.redis.hset(`job:${jobId}`, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        result: result ? JSON.stringify(result) : undefined
      });

      // Update metrics
      this.queueSize.dec({ type: job.type, status: 'processing' });
      this.processingCounter.inc({
        type: job.type,
        status: 'completed',
        organization_id: job.organizationId
      });

      // Calculate processing time
      if (job.startedAt) {
        const processingTime = new Date().getTime() - new Date(job.startedAt).getTime();
        this.jobDuration.observe(
          { type: job.type, status: 'completed' },
          processingTime / 1000
        );
      }

      logger.info('Job completed', {
        jobId,
        type: job.type,
        organizationId: job.organizationId,
        processingTime: job.startedAt ? 
          new Date().getTime() - new Date(job.startedAt).getTime() : 0
      });

    } catch (error) {
      logger.error('Failed to complete job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async failJob(jobId: string, error: string): Promise<void> {
    try {
      const jobData = await this.redis.hgetall(`job:${jobId}`);
      
      if (!jobData || Object.keys(jobData).length === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      const job: Job = {
        id: jobData.id,
        type: jobData.type as Job['type'],
        payload: JSON.parse(jobData.payload || '{}'),
        organizationId: jobData.organizationId,
        priority: jobData.priority as Job['priority'],
        status: 'failed' as Job['status'],
        createdAt: jobData.createdAt,
        startedAt: jobData.startedAt,
        completedAt: new Date().toISOString(),
        retryCount: parseInt(jobData.retryCount || '0'),
        maxRetries: parseInt(jobData.maxRetries || '3'),
        error,
        metadata: jobData.metadata ? JSON.parse(jobData.metadata) : undefined
      };

      // Check if we should retry
      if (job.retryCount < job.maxRetries) {
        // Retry job
        job.retryCount++;
        job.status = 'retrying';
        
        await this.redis.hset(`job:${jobId}`, {
          status: 'retrying',
          retryCount: job.retryCount,
          error
        });

        // Re-enqueue with higher priority for retry
        const priorityScore = this.getPriorityScore(job.priority) + 1000; // Higher priority for retries
        await this.redis.zadd(`queue:${job.type}`, priorityScore, jobId);

        this.queueSize.inc({ type: job.type, status: 'pending' });
        
        logger.info('Job retrying', {
          jobId, 
          type: job.type,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          organizationId: job.organizationId
        });
      } else {
        // Mark as failed
        await this.redis.hset(`job:${jobId}`, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          error
        });

        this.queueSize.dec({ type: job.type, status: 'processing' });
        this.processingCounter.inc({
          type: job.type,
          status: 'failed',
          organization_id: job.organizationId
        });

        logger.error('Job failed permanently', {
          jobId, 
          type: job.type,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          organizationId: job.organizationId,
          error
        });
      }

      } catch (error) {
      logger.error('Failed to fail job', {
          jobId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
  }

  async getJob(jobId: string): Promise<Job | null> {
    try {
      const jobData = await this.redis.hgetall(`job:${jobId}`);
      
      if (!jobData || Object.keys(jobData).length === 0) {
        return null;
      }

      return {
        id: jobData.id,
        type: jobData.type as Job['type'],
        payload: JSON.parse(jobData.payload || '{}'),
        organizationId: jobData.organizationId,
        priority: jobData.priority as Job['priority'],
        status: jobData.status as Job['status'],
        createdAt: jobData.createdAt,
        startedAt: jobData.startedAt,
        completedAt: jobData.completedAt,
        retryCount: parseInt(jobData.retryCount || '0'),
        maxRetries: parseInt(jobData.maxRetries || '3'),
        error: jobData.error,
        metadata: jobData.metadata ? JSON.parse(jobData.metadata) : undefined
      };
      } catch (error) {
      logger.error('Failed to get job', {
          jobId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      return null;
    }
  }

  async getStats(): Promise<JobStats> {
    try {
      const stats: JobStats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retrying: 0,
        byType: {},
        byPriority: {},
        averageProcessingTime: 0
      };

      // Get all job keys
      const jobKeys = await this.redis.keys('job:*');
      
      for (const key of jobKeys) {
        const jobData = await this.redis.hgetall(key);
        
        if (jobData && Object.keys(jobData).length > 0) {
          const status = jobData.status as Job['status'];
          const type = jobData.type as Job['type'];
          const priority = jobData.priority as Job['priority'];
          
          stats.total++;
          stats[status]++;
          
          stats.byType[type] = (stats.byType[type] || 0) + 1;
          stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        }
      }

      return stats;
      } catch (error) {
      logger.error('Failed to get job stats', {
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw error;
      }
  }

  private getPriorityScore(priority: Job['priority']): number {
    const scores = {
      urgent: 1000,
      high: 800,
      normal: 500,
      low: 200
    };
    return scores[priority];
  }

  async clearCompletedJobs(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      const jobKeys = await this.redis.keys('job:*');
      let clearedCount = 0;

      for (const key of jobKeys) {
        const jobData = await this.redis.hgetall(key);
        
        if (jobData && jobData.status === 'completed' && jobData.completedAt) {
          const completedAt = new Date(jobData.completedAt);
          
          if (completedAt < cutoffTime) {
            await this.redis.del(key);
            clearedCount++;
          }
        }
      }

      logger.info('Cleared completed jobs', {
        count: clearedCount,
        olderThanHours
      });

      return clearedCount;
    } catch (error) {
      logger.error('Failed to clear completed jobs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
