// Métodos faltantes para compatibilidad
import { Job } from './job-queue.js';
import { logger } from '../utils/logger.js';
import Redis from 'ioredis';

export class JobQueueMethods {
  protected redis!: Redis;
  // Métodos que se añadirán a JobQueue
  async addMonitorJob(userId: string, options: any): Promise<string> {
    return (this as any).enqueue({
      type: 'email_processing',
      payload: { userId, ...options },
      organizationId: options.organizationId || 'default',
      priority: options.priority || 'normal',
      maxRetries: 3
    });
  }

  async addClassifyJob(messageId: string, message: any, options: any): Promise<string> {
    return (this as any).enqueue({
      type: 'email_processing',
      payload: { messageId, message, ...options },
      organizationId: options.organizationId || 'default',
      priority: options.priority || 'normal',
      maxRetries: 3
    });
  }

  async addDraftJob(request: any, options: any): Promise<string> {
    return (this as any).enqueue({
      type: 'email_processing',
      payload: { request, ...options },
      organizationId: options.organizationId || 'default',
      priority: options.priority || 'normal',
      maxRetries: 3
    });
  }

  async addExtractJob(messageId: string, message: any, schema: any, options: any): Promise<string> {
    return (this as any).enqueue({
      type: 'email_processing',
      payload: { messageId, message, schema, ...options },
      organizationId: options.organizationId || 'default',
      priority: options.priority || 'normal',
      maxRetries: 3
    });
  }

  async getJobStatus(jobId: string): Promise<Job | null> {
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
      logger.error('Failed to get job status', { jobId, error });
      return null;
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Job queue shutdown completed');
    } catch (error) {
      logger.error('Error during job queue shutdown', { error });
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.ping();
      logger.info('Job queue initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize job queue', { error });
      throw error;
    }
  }
}
