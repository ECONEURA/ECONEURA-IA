import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JobQueue, Job } from '../queues/job-queue.js';

// Mock Redis
const mockRedis = {
  hset: vi.fn(),
  hgetall: vi.fn(),
  zadd: vi.fn(),
  zpopmax: vi.fn(),
  del: vi.fn(),
  keys: vi.fn()
};

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => mockRedis)
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
    }),
    gauge: vi.fn().mockReturnValue({
      inc: vi.fn(),
      dec: vi.fn(),
      set: vi.fn()
    })
  }
}));

describe('JobQueue', () => {
  let jobQueue: JobQueue;

  beforeEach(() => {
    jobQueue = new JobQueue();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('enqueue', () => {
    it('should enqueue a job successfully', async () => {
      const jobData = {
        type: 'email_processing' as const,
        payload: { messageId: 'email_123' },
        organizationId: 'org_456',
        priority: 'high' as const,
        maxRetries: 3
      };

      mockRedis.hset.mockResolvedValue(1);
      mockRedis.zadd.mockResolvedValue(1);

      const jobId = await jobQueue.enqueue(jobData);

      expect(jobId).toMatch(/^job_\d+_[a-z0-9]+$/);
      expect(mockRedis.hset).toHaveBeenCalledWith(
        `job:${jobId}`,
        expect.objectContaining({
          id: jobId,
          type: 'email_processing',
          status: 'pending',
          priority: 'high',
          organizationId: 'org_456'
        })
      );
      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'queue:email_processing',
        800, // high priority score
        jobId
      );
    });

    it('should handle enqueue errors', async () => {
      const jobData = {
        type: 'email_processing' as const,
        payload: { messageId: 'email_123' },
        organizationId: 'org_456',
        priority: 'high' as const,
        maxRetries: 3
      };

      mockRedis.hset.mockRejectedValue(new Error('Redis error'));

      await expect(jobQueue.enqueue(jobData)).rejects.toThrow('Redis error');
    });
  });

  describe('dequeue', () => {
    it('should dequeue a job successfully', async () => {
      const jobId = 'job_123';
      const jobData = {
        id: jobId,
        type: 'email_processing',
        payload: JSON.stringify({ messageId: 'email_123' }),
        organizationId: 'org_456',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00Z',
        retryCount: '0',
        maxRetries: '3'
      };

      mockRedis.zpopmax.mockResolvedValue([jobId]);
      mockRedis.hgetall.mockResolvedValue(jobData);
      mockRedis.hset.mockResolvedValue(1);

      const job = await jobQueue.dequeue('email_processing');

      expect(job).toMatchObject({
        id: jobId,
        type: 'email_processing',
        payload: { messageId: 'email_123' },
        organizationId: 'org_456',
        priority: 'high',
        status: 'processing'
      });
      expect(mockRedis.hset).toHaveBeenCalledWith(
        `job:${jobId}`,
        {
          status: 'processing',
          startedAt: expect.any(String)
        }
      );
    });

    it('should return null when no jobs available', async () => {
      mockRedis.zpopmax.mockResolvedValue([]);

      const job = await jobQueue.dequeue('email_processing');

      expect(job).toBeNull();
    });

    it('should return null when job data not found', async () => {
      const jobId = 'job_123';
      mockRedis.zpopmax.mockResolvedValue([jobId]);
      mockRedis.hgetall.mockResolvedValue({});

      const job = await jobQueue.dequeue('email_processing');

      expect(job).toBeNull();
    });
  });

  describe('completeJob', () => {
    it('should complete a job successfully', async () => {
      const jobId = 'job_123';
      const jobData = {
        id: jobId,
        type: 'email_processing',
        payload: JSON.stringify({ messageId: 'email_123' }),
        organizationId: 'org_456',
        priority: 'high',
        status: 'processing',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:01:00Z',
        retryCount: '0',
        maxRetries: '3'
      };

      mockRedis.hgetall.mockResolvedValue(jobData);
      mockRedis.hset.mockResolvedValue(1);

      await jobQueue.completeJob(jobId, { result: 'success' });

      expect(mockRedis.hset).toHaveBeenCalledWith(
        `job:${jobId}`,
        {
          status: 'completed',
          completedAt: expect.any(String),
          result: JSON.stringify({ result: 'success' })
        }
      );
    });

    it('should throw error when job not found', async () => {
      const jobId = 'job_123';
      mockRedis.hgetall.mockResolvedValue({});

      await expect(jobQueue.completeJob(jobId)).rejects.toThrow('Job job_123 not found');
    });
  });

  describe('failJob', () => {
    it('should retry job when retry count is below max', async () => {
      const jobId = 'job_123';
      const jobData = {
        id: jobId,
        type: 'email_processing',
        payload: JSON.stringify({ messageId: 'email_123' }),
        organizationId: 'org_456',
        priority: 'high',
        status: 'processing',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:01:00Z',
        retryCount: '1',
        maxRetries: '3'
      };

      mockRedis.hgetall.mockResolvedValue(jobData);
      mockRedis.hset.mockResolvedValue(1);
      mockRedis.zadd.mockResolvedValue(1);

      await jobQueue.failJob(jobId, 'Processing error');

      expect(mockRedis.hset).toHaveBeenCalledWith(
        `job:${jobId}`,
        {
          status: 'retrying',
          retryCount: 2,
          error: 'Processing error'
        }
      );
      expect(mockRedis.zadd).toHaveBeenCalledWith(
        'queue:email_processing',
        1800, // high priority + 1000 for retry
        jobId
      );
    });

    it('should mark job as failed when max retries exceeded', async () => {
      const jobId = 'job_123';
      const jobData = {
        id: jobId,
        type: 'email_processing',
        payload: JSON.stringify({ messageId: 'email_123' }),
        organizationId: 'org_456',
        priority: 'high',
        status: 'processing',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:01:00Z',
        retryCount: '3',
        maxRetries: '3'
      };

      mockRedis.hgetall.mockResolvedValue(jobData);
      mockRedis.hset.mockResolvedValue(1);

      await jobQueue.failJob(jobId, 'Final error');

      expect(mockRedis.hset).toHaveBeenCalledWith(
        `job:${jobId}`,
        {
          status: 'failed',
          completedAt: expect.any(String),
          error: 'Final error'
        }
      );
    });
  });

  describe('getJob', () => {
    it('should get job successfully', async () => {
      const jobId = 'job_123';
      const jobData = {
        id: jobId,
        type: 'email_processing',
        payload: JSON.stringify({ messageId: 'email_123' }),
        organizationId: 'org_456',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-15T10:00:00Z',
        retryCount: '0',
        maxRetries: '3'
      };

      mockRedis.hgetall.mockResolvedValue(jobData);

      const job = await jobQueue.getJob(jobId);

      expect(job).toMatchObject({
        id: jobId,
        type: 'email_processing',
        payload: { messageId: 'email_123' },
        organizationId: 'org_456',
        priority: 'high',
        status: 'pending'
      });
    });

    it('should return null when job not found', async () => {
      const jobId = 'job_123';
      mockRedis.hgetall.mockResolvedValue({});

      const job = await jobQueue.getJob(jobId);

      expect(job).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return job statistics', async () => {
      const jobKeys = ['job:job_1', 'job:job_2', 'job:job_3'];
      const jobData1 = {
        id: 'job_1',
        type: 'email_processing',
        status: 'pending',
        priority: 'high'
      };
      const jobData2 = {
        id: 'job_2',
        type: 'email_processing',
        status: 'processing',
        priority: 'normal'
      };
      const jobData3 = {
        id: 'job_3',
        type: 'graph_sync',
        status: 'completed',
        priority: 'low'
      };

      mockRedis.keys.mockResolvedValue(jobKeys);
      mockRedis.hgetall
        .mockResolvedValueOnce(jobData1)
        .mockResolvedValueOnce(jobData2)
        .mockResolvedValueOnce(jobData3);

      const stats = await jobQueue.getStats();

      expect(stats).toMatchObject({
        total: 3,
        pending: 1,
        processing: 1,
        completed: 1,
        failed: 0,
        retrying: 0,
        byType: {
          'email_processing': 2,
          'graph_sync': 1
        },
        byPriority: {
          'high': 1,
          'normal': 1,
          'low': 1
        }
      });
    });
  });

  describe('clearCompletedJobs', () => {
    it('should clear old completed jobs', async () => {
      const jobKeys = ['job:job_1', 'job:job_2'];
      const oldJobData = {
        id: 'job_1',
        status: 'completed',
        completedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
      };
      const recentJobData = {
        id: 'job_2',
        status: 'completed',
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
      };

      mockRedis.keys.mockResolvedValue(jobKeys);
      mockRedis.hgetall
        .mockResolvedValueOnce(oldJobData)
        .mockResolvedValueOnce(recentJobData);
      mockRedis.del.mockResolvedValue(1);

      const clearedCount = await jobQueue.clearCompletedJobs(24);

      expect(clearedCount).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith('job:job_1');
      expect(mockRedis.del).not.toHaveBeenCalledWith('job:job_2');
    });
  });

  describe('priority scoring', () => {
    it('should assign correct priority scores', async () => {
      const testCases = [
        { priority: 'urgent' as const, expectedScore: 1000 },
        { priority: 'high' as const, expectedScore: 800 },
        { priority: 'normal' as const, expectedScore: 500 },
        { priority: 'low' as const, expectedScore: 200 }
      ];

      for (const testCase of testCases) {
        const jobData = {
          type: 'email_processing' as const,
          payload: { messageId: 'email_123' },
          organizationId: 'org_456',
          priority: testCase.priority,
          maxRetries: 3
        };

        mockRedis.hset.mockResolvedValue(1);
        mockRedis.zadd.mockResolvedValue(1);

        await jobQueue.enqueue(jobData);

        expect(mockRedis.zadd).toHaveBeenCalledWith(
          'queue:email_processing',
          testCase.expectedScore,
          expect.any(String);
        );
      }
    });
  });
});
