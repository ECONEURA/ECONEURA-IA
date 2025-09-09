import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { prometheusMetrics } from '../utils/metrics.js';
import { JobQueue } from '../queues/job-queue.js';
import { EmailProcessor } from '../processors/email-processor.js';
import { GraphService } from './graph-service.js';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  task: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
}

export class CronService {
  private jobs: Map<string, CronJob> = new Map();
  private jobQueue: JobQueue;
  private emailProcessor: EmailProcessor;
  private graphService: GraphService;
  private cronCounter = prometheusMetrics.counter({
    name: 'econeura_cron_jobs_executed_total',
    help: 'Total number of cron jobs executed',
    labelNames: ['job_id', 'status']
  });

  private cronDuration = prometheusMetrics.histogram({
    name: 'econeura_cron_job_duration_seconds',
    help: 'Duration of cron job execution',
    labelNames: ['job_id'],
    buckets: [1, 5, 10, 30, 60, 300, 600]
  });

  constructor() {
    this.jobQueue = new JobQueue();
    this.emailProcessor = new EmailProcessor();
    this.graphService = new GraphService();

    this.initializeDefaultJobs();
  }

  private initializeDefaultJobs(): void {
    // Email processing job - every 5 minutes
    this.addJob({
      id: 'email_processing',
      name: 'Email Processing',
      schedule: '*/5 * * * *', // Every 5 minutes
      task: this.processPendingEmails.bind(this),
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Graph sync job - every 15 minutes
    this.addJob({
      id: 'graph_sync',
      name: 'Microsoft Graph Sync',
      schedule: '*/15 * * * *', // Every 15 minutes
      task: this.syncGraphData.bind(this),
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Cleanup job - every hour
    this.addJob({
      id: 'cleanup',
      name: 'System Cleanup',
      schedule: '0 * * * *', // Every hour
      task: this.performCleanup.bind(this),
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Health check job - every minute
    this.addJob({
      id: 'health_check',
      name: 'Health Check',
      schedule: '* * * * *', // Every minute
      task: this.performHealthCheck.bind(this),
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Report generation job - daily at 6 AM
    this.addJob({
      id: 'daily_reports',
      name: 'Daily Reports',
      schedule: '0 6 * * *', // Daily at 6 AM
      task: this.generateDailyReports.bind(this),
      enabled: true,
      runCount: 0,
      errorCount: 0
    });

    // Data export job - weekly on Sunday at 2 AM
    this.addJob({
      id: 'weekly_export',
      name: 'Weekly Data Export',
      schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM
      task: this.performWeeklyExport.bind(this),
      enabled: true,
      runCount: 0,
      errorCount: 0
    });
  }

  addJob(job: Omit<CronJob, 'lastRun' | 'nextRun'>): void {
    const fullJob: CronJob = {
      ...job,
      lastRun: undefined,
      nextRun: undefined
    };

    this.jobs.set(job.id, fullJob);

    if (job.enabled) {
      this.scheduleJob(fullJob);
    }

    logger.info('Cron job added', {
      jobId: job.id,
      name: job.name,
      schedule: job.schedule,
      enabled: job.enabled
    });
  }

  removeJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.delete(jobId);
      logger.info('Cron job removed', { jobId });
    }
  }

  enableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && !job.enabled) {
      job.enabled = true;
      this.scheduleJob(job);
      logger.info('Cron job enabled', { jobId });
    }
  }

  disableJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job && job.enabled) {
      job.enabled = false;
      // Note: node-cron doesn't provide a direct way to unschedule
      // In a production environment, you'd want to track scheduled tasks
      logger.info('Cron job disabled', { jobId });
    }
  }

  private scheduleJob(job: CronJob): void {
    if (!cron.validate(job.schedule)) {
      logger.error('Invalid cron schedule', {
        jobId: job.id,
        schedule: job.schedule
      });
      return;
    }

    cron.schedule(job.schedule, async () => {
      await this.executeJob(job);
    });

    logger.info('Cron job scheduled', {
      jobId: job.id,
      schedule: job.schedule
    });
  }

  private async executeJob(job: CronJob): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('Executing cron job', {
        jobId: job.id,
        name: job.name
      });

      job.lastRun = new Date();
      job.runCount++;

      await job.task();

      const duration = Date.now() - startTime;

      this.cronCounter.inc({
        job_id: job.id,
        status: 'success'
      });

      this.cronDuration.observe(
        { job_id: job.id },
        duration / 1000
      );

      logger.info('Cron job completed', {
        jobId: job.id,
        name: job.name,
        duration,
        runCount: job.runCount
      });

    } catch (error) {
      const duration = Date.now() - startTime;

      job.errorCount++;

      this.cronCounter.inc({
        job_id: job.id,
        status: 'error'
      });

      this.cronDuration.observe(
        { job_id: job.id },
        duration / 1000
      );

      logger.error('Cron job failed', {
        jobId: job.id,
        name: job.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        errorCount: job.errorCount
      });
    }
  }

  // Job implementations
  private async processPendingEmails(): Promise<void> {
    try {
      logger.info('Processing pending emails');

      // Get pending email processing jobs
      const stats = await this.jobQueue.getStats();

      if (stats.pending > 0) {
        logger.info('Found pending email jobs', { count: stats.pending });

        // Process emails in batches
        const batchSize = 10;
        for (let i = 0; i < Math.min(stats.pending, batchSize); i++) {
          const job = await this.jobQueue.dequeue('email_processing');
          if (job) {
            try {
              await this.emailProcessor.processEmail(
                job.payload.messageId,
                job.organizationId
              );
              await this.jobQueue.completeJob(job.id);
            } catch (error) {
              await this.jobQueue.failJob(
                job.id,
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          }
        }
      }

    } catch (error) {
      logger.error('Failed to process pending emails', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async syncGraphData(): Promise<void> {
    try {
      logger.info('Syncing Microsoft Graph data');

      // Simulate Graph data synchronization
      // In a real implementation, this would sync calendar events, contacts, etc.

      const syncResults = {
        calendarEvents: 0,
        contacts: 0,
        emails: 0,
        lastSync: new Date().toISOString()
      };

      logger.info('Graph sync completed', syncResults);

    } catch (error) {
      logger.error('Failed to sync Graph data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async performCleanup(): Promise<void> {
    try {
      logger.info('Performing system cleanup');

      // Clean up completed jobs older than 24 hours
      const clearedJobs = await this.jobQueue.clearCompletedJobs(24);

      // Clean up old logs (simulated)
      const clearedLogs = 0; // In a real implementation, this would clean old log files

      // Clean up temporary files (simulated)
      const clearedFiles = 0; // In a real implementation, this would clean temp files

      logger.info('System cleanup completed', {
        clearedJobs,
        clearedLogs,
        clearedFiles
      });

    } catch (error) {
      logger.error('Failed to perform cleanup', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Check Redis connection
      const redisHealthy = true; // In a real implementation, ping Redis

      // Check Graph API connection
      const graphHealthy = true; // In a real implementation, ping Graph API

      // Check job queue health
      const queueStats = await this.jobQueue.getStats();
      const queueHealthy = queueStats.failed < 100; // Threshold for healthy queue

      const healthStatus = {
        redis: redisHealthy,
        graph: graphHealthy,
        queue: queueHealthy,
        timestamp: new Date().toISOString()
      };

      if (!redisHealthy || !graphHealthy || !queueHealthy) {
        logger.warn('Health check issues detected', healthStatus);
      }

    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async generateDailyReports(): Promise<void> {
    try {
      logger.info('Generating daily reports');

      // Enqueue report generation jobs
      const reportTypes = ['email_summary', 'job_statistics', 'system_health'];

      for (const reportType of reportTypes) {
        await this.jobQueue.enqueue({
          type: 'report_generation',
          payload: { reportType, date: new Date().toISOString().split('T')[0] },
          organizationId: 'system',
          priority: 'normal',
          maxRetries: 3
        });
      }

      logger.info('Daily report generation jobs enqueued', {
        reportTypes: reportTypes.length
      });

    } catch (error) {
      logger.error('Failed to generate daily reports', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async performWeeklyExport(): Promise<void> {
    try {
      logger.info('Performing weekly data export');

      // Enqueue data export job
      await this.jobQueue.enqueue({
        type: 'data_export',
        payload: {
          exportType: 'weekly',
          date: new Date().toISOString().split('T')[0],
          format: 'json'
        },
        organizationId: 'system',
        priority: 'low',
        maxRetries: 2
      });

      logger.info('Weekly data export job enqueued');

    } catch (error) {
      logger.error('Failed to perform weekly export', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  getJobStatus(jobId: string): CronJob | null {
    return this.jobs.get(jobId) || null;
  }

  getAllJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  getJobStats(): {
    total: number;
    enabled: number;
    disabled: number;
    totalRuns: number;
    totalErrors: number;
  } {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      enabled: jobs.filter(j => j.enabled).length,
      disabled: jobs.filter(j => !j.enabled).length,
      totalRuns: jobs.reduce((sum, j) => sum + j.runCount, 0),
      totalErrors: jobs.reduce((sum, j) => sum + j.errorCount, 0)
    };
  }
}
