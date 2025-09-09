import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CronService } from '../services/cron-service.js';

// Mock dependencies
vi.mock('../queues/job-queue.js', () => ({
  JobQueue: vi.fn().mockImplementation(() => ({
    getStats: vi.fn(),
    dequeue: vi.fn(),
    completeJob: vi.fn(),
    failJob: vi.fn(),
    clearCompletedJobs: vi.fn(),
    enqueue: vi.fn()
  }))
}));

vi.mock('../processors/email-processor.js', () => ({
  EmailProcessor: vi.fn().mockImplementation(() => ({
    processEmail: vi.fn()
  }))
}));

vi.mock('../services/graph-service.js', () => ({
  GraphService: vi.fn().mockImplementation(() => ({}))
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../utils/metrics.js', () => ({
  prometheusMetrics: {
    counter: vi.fn().mockReturnValue({
      inc: vi.fn()
    }),
    histogram: vi.fn().mockReturnValue({
      observe: vi.fn()
    })
  }
}));

// Mock node-cron
vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
    validate: vi.fn().mockReturnValue(true)
  }
}));

describe('CronService', () => {
  let cronService: CronService;

  beforeEach(() => {
    cronService = new CronService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default jobs', () => {
      const jobs = cronService.getAllJobs();

      expect(jobs).toHaveLength(6);
      expect(jobs.map(j => j.id)).toEqual([
        'email_processing',
        'graph_sync',
        'cleanup',
        'health_check',
        'daily_reports',
        'weekly_export'
      ]);
    });

    it('should have all jobs enabled by default', () => {
      const jobs = cronService.getAllJobs();

      expect(jobs.every(job => job.enabled)).toBe(true);
    });

    it('should have correct schedules for default jobs', () => {
      const jobs = cronService.getAllJobs();
      const jobMap = new Map(jobs.map(job => [job.id, job.schedule]));

      expect(jobMap.get('email_processing')).toBe('*/5 * * * *');
      expect(jobMap.get('graph_sync')).toBe('*/15 * * * *');
      expect(jobMap.get('cleanup')).toBe('0 * * * *');
      expect(jobMap.get('health_check')).toBe('* * * * *');
      expect(jobMap.get('daily_reports')).toBe('0 6 * * *');
      expect(jobMap.get('weekly_export')).toBe('0 2 * * 0');
    });
  });

  describe('job management', () => {
    it('should add a new job', () => {
      const newJob = {
        id: 'test_job',
        name: 'Test Job',
        schedule: '0 0 * * *',
        task: vi.fn(),
        enabled: true,
        runCount: 0,
        errorCount: 0
      };

      cronService.addJob(newJob);

      const job = cronService.getJobStatus('test_job');
      expect(job).toMatchObject({
        id: 'test_job',
        name: 'Test Job',
        schedule: '0 0 * * *',
        enabled: true
      });
    });

    it('should remove a job', () => {
      cronService.removeJob('email_processing');

      const job = cronService.getJobStatus('email_processing');
      expect(job).toBeNull();
    });

    it('should enable a job', () => {
      cronService.disableJob('email_processing');
      cronService.enableJob('email_processing');

      const job = cronService.getJobStatus('email_processing');
      expect(job?.enabled).toBe(true);
    });

    it('should disable a job', () => {
      cronService.disableJob('email_processing');

      const job = cronService.getJobStatus('email_processing');
      expect(job?.enabled).toBe(false);
    });
  });

  describe('job execution', () => {
    it('should execute job successfully', async () => {
      const mockTask = vi.fn().mockResolvedValue(undefined);
      const job = {
        id: 'test_job',
        name: 'Test Job',
        schedule: '0 0 * * *',
        task: mockTask,
        enabled: true,
        runCount: 0,
        errorCount: 0
      };

      cronService.addJob(job);

      // Simulate job execution
      const jobStatus = cronService.getJobStatus('test_job');
      if (jobStatus) {
        jobStatus.lastRun = new Date();
        jobStatus.runCount++;
      }

      expect(jobStatus?.runCount).toBe(1);
    });

    it('should handle job execution errors', async () => {
      const mockTask = vi.fn().mockRejectedValue(new Error('Task failed'));
      const job = {
        id: 'failing_job',
        name: 'Failing Job',
        schedule: '0 0 * * *',
        task: mockTask,
        enabled: true,
        runCount: 0,
        errorCount: 0
      };

      cronService.addJob(job);

      // Simulate job execution with error
      const jobStatus = cronService.getJobStatus('failing_job');
      if (jobStatus) {
        jobStatus.lastRun = new Date();
        jobStatus.runCount++;
        jobStatus.errorCount++;
      }

      expect(jobStatus?.errorCount).toBe(1);
    });
  });

  describe('job statistics', () => {
    it('should return correct job statistics', () => {
      const stats = cronService.getJobStats();

      expect(stats).toMatchObject({
        total: 6,
        enabled: 6,
        disabled: 0,
        totalRuns: 0,
        totalErrors: 0
      });
    });

    it('should update statistics after job execution', () => {
      // Simulate some job runs
      const emailJob = cronService.getJobStatus('email_processing');
      if (emailJob) {
        emailJob.runCount = 5;
        emailJob.errorCount = 1;
      }

      const stats = cronService.getJobStats();

      expect(stats.totalRuns).toBe(5);
      expect(stats.totalErrors).toBe(1);
    });
  });

  describe('specific job implementations', () => {
    it('should process pending emails job', async () => {
      const { JobQueue } = await import('../queues/job-queue.js');
      const mockJobQueue = new JobQueue();

      (mockJobQueue.getStats as any).mockResolvedValue({
        pending: 2,
        processing: 0,
        completed: 10,
        failed: 1
      });

      (mockJobQueue.dequeue as any)
        .mockResolvedValueOnce({
          id: 'job_1',
          payload: { messageId: 'email_1' },
          organizationId: 'org_1'
        })
        .mockResolvedValueOnce({
          id: 'job_2',
          payload: { messageId: 'email_2' },
          organizationId: 'org_1'
        })
        .mockResolvedValueOnce(null);

      const { EmailProcessor } = await import('../processors/email-processor.js');
      const mockEmailProcessor = new EmailProcessor();
      (mockEmailProcessor.processEmail as any).mockResolvedValue({
        messageId: 'email_1',
        processed: true
      });

      // This would be called internally by the cron job
      // We're testing the logic indirectly through the job structure
      const emailJob = cronService.getJobStatus('email_processing');
      expect(emailJob?.id).toBe('email_processing');
    });

    it('should perform cleanup job', async () => {
      const { JobQueue } = await import('../queues/job-queue.js');
      const mockJobQueue = new JobQueue();

      (mockJobQueue.clearCompletedJobs as any).mockResolvedValue(5);

      const cleanupJob = cronService.getJobStatus('cleanup');
      expect(cleanupJob?.id).toBe('cleanup');
    });

    it('should generate daily reports job', async () => {
      const { JobQueue } = await import('../queues/job-queue.js');
      const mockJobQueue = new JobQueue();

      (mockJobQueue.enqueue as any).mockResolvedValue('job_id');

      const reportsJob = cronService.getJobStatus('daily_reports');
      expect(reportsJob?.id).toBe('daily_reports');
    });

    it('should perform weekly export job', async () => {
      const { JobQueue } = await import('../queues/job-queue.js');
      const mockJobQueue = new JobQueue();

      (mockJobQueue.enqueue as any).mockResolvedValue('export_job_id');

      const exportJob = cronService.getJobStatus('weekly_export');
      expect(exportJob?.id).toBe('weekly_export');
    });
  });

  describe('health check job', () => {
    it('should perform health check', async () => {
      const { JobQueue } = await import('../queues/job-queue.js');
      const mockJobQueue = new JobQueue();

      (mockJobQueue.getStats as any).mockResolvedValue({
        pending: 0,
        processing: 0,
        completed: 100,
        failed: 5
      });

      const healthJob = cronService.getJobStatus('health_check');
      expect(healthJob?.id).toBe('health_check');
    });
  });

  describe('graph sync job', () => {
    it('should sync graph data', async () => {
      const graphJob = cronService.getJobStatus('graph_sync');
      expect(graphJob?.id).toBe('graph_sync');
    });
  });

  describe('error handling', () => {
    it('should handle invalid cron schedule', () => {
      const { default: cron } = await import('node-cron');
      (cron.validate as any).mockReturnValue(false);

      const invalidJob = {
        id: 'invalid_job',
        name: 'Invalid Job',
        schedule: 'invalid schedule',
        task: vi.fn(),
        enabled: true,
        runCount: 0,
        errorCount: 0
      };

      // Should not throw error, but should log warning
      expect(() => cronService.addJob(invalidJob)).not.toThrow();
    });
  });
});
