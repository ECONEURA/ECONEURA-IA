import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiTrainingService } from '../../../services/ai-training.service.js';

// ============================================================================
// AI TRAINING SERVICE UNIT TESTS - PR-18
// ============================================================================

// Mock de database service
const mockDb = {
  query: vi.fn()
};

vi.mock('@econeura/db', () => ({
  getDatabaseService: () => mockDb
}));

// Mock de structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AITrainingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Dataset Management', () => {
    it('should create a new dataset', async () => {
      const datasetData = {
        name: 'Test Dataset',
        description: 'A test dataset for unit testing',
        type: 'classification' as const,
        size: 1000,
        features: ['feature1', 'feature2', 'feature3'],
        targetColumn: 'target',
        status: 'uploading' as const,
        metadata: {
          source: 'test_source',
          format: 'csv' as const,
          encoding: 'utf-8',
          delimiter: ',',
          hasHeader: true
        }
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const dataset = await aiTrainingService.createDataset(datasetData);

      expect(dataset).toHaveProperty('id');
      expect(dataset.name).toBe(datasetData.name);
      expect(dataset.type).toBe(datasetData.type);
      expect(dataset.size).toBe(datasetData.size);
      expect(dataset.features).toEqual(datasetData.features);
      expect(dataset.targetColumn).toBe(datasetData.targetColumn);
      expect(dataset.status).toBe('uploading');
      expect(dataset.metadata).toEqual(datasetData.metadata);
      expect(dataset.createdAt).toBeInstanceOf(Date);
      expect(dataset.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO training_datasets'),
        expect.arrayContaining([
          expect.any(String), // id
          datasetData.name,
          datasetData.description,
          datasetData.type,
          datasetData.size,
          datasetData.features,
          datasetData.targetColumn,
          datasetData.status,
          JSON.stringify(datasetData.metadata),
          expect.any(Date), // createdAt
          expect.any(Date)  // updatedAt
        ])
      );
    });

    it('should get a dataset by ID', async () => {
      const mockDataset = {
        id: 'dataset_123',
        name: 'Test Dataset',
        description: 'A test dataset',
        type: 'classification',
        size: 1000,
        features: ['feature1', 'feature2'],
        target_column: 'target',
        status: 'ready',
        metadata: { source: 'test', format: 'csv' },
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockDataset] });

      const dataset = await aiTrainingService.getDataset('dataset_123');

      expect(dataset).not.toBeNull();
      expect(dataset?.id).toBe('dataset_123');
      expect(dataset?.name).toBe('Test Dataset');
      expect(dataset?.type).toBe('classification');
      expect(dataset?.size).toBe(1000);
      expect(dataset?.features).toEqual(['feature1', 'feature2']);
      expect(dataset?.targetColumn).toBe('target');
      expect(dataset?.status).toBe('ready');
      expect(dataset?.createdAt).toBeInstanceOf(Date);
      expect(dataset?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent dataset', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const dataset = await aiTrainingService.getDataset('non-existent');

      expect(dataset).toBeNull();
    });

    it('should list datasets with pagination', async () => {
      const mockDatasets = [
        {
          id: 'dataset_1',
          name: 'Dataset 1',
          description: 'First dataset',
          type: 'classification',
          size: 1000,
          features: ['feature1'],
          target_column: 'target',
          status: 'ready',
          metadata: { source: 'test', format: 'csv' },
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'dataset_2',
          name: 'Dataset 2',
          description: 'Second dataset',
          type: 'regression',
          size: 2000,
          features: ['feature1', 'feature2'],
          target_column: null,
          status: 'processing',
          metadata: { source: 'test', format: 'json' },
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockDatasets });

      const datasets = await aiTrainingService.listDatasets(10, 0);

      expect(datasets).toHaveLength(2);
      expect(datasets[0].id).toBe('dataset_1');
      expect(datasets[1].id).toBe('dataset_2');
      expect(datasets[0].type).toBe('classification');
      expect(datasets[1].type).toBe('regression');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM training_datasets'),
        [10, 0]
      );
    });

    it('should update dataset status', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await aiTrainingService.updateDatasetStatus('dataset_123', 'ready');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE training_datasets'),
        ['ready', 'dataset_123']
      );
    });
  });

  describe('Training Job Management', () => {
    it('should create a new training job', async () => {
      const jobData = {
        name: 'Test Training Job',
        description: 'A test training job',
        datasetId: 'dataset_123',
        modelType: 'neural_network' as const,
        hyperparameters: {
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001
        }
      };

      mockDb.query.mockResolvedValueOnce({ rows: [] });

      const job = await aiTrainingService.createTrainingJob(jobData);

      expect(job).toHaveProperty('id');
      expect(job.name).toBe(jobData.name);
      expect(job.description).toBe(jobData.description);
      expect(job.datasetId).toBe(jobData.datasetId);
      expect(job.modelType).toBe(jobData.modelType);
      expect(job.hyperparameters).toEqual(jobData.hyperparameters);
      expect(job.status).toBe('pending');
      expect(job.progress).toBe(0);
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO training_jobs'),
        expect.arrayContaining([
          expect.any(String), // id
          jobData.name,
          jobData.description,
          jobData.datasetId,
          jobData.modelType,
          JSON.stringify(jobData.hyperparameters),
          'pending',
          0,
          expect.any(Date), // createdAt
          expect.any(Date)  // updatedAt
        ])
      );
    });

    it('should get a training job by ID', async () => {
      const mockJob = {
        id: 'job_123',
        name: 'Test Job',
        description: 'A test job',
        dataset_id: 'dataset_123',
        model_type: 'neural_network',
        hyperparameters: { epochs: 100 },
        status: 'running',
        progress: 50,
        started_at: new Date(),
        completed_at: null,
        estimated_duration: 3600000,
        actual_duration: null,
        metrics: null,
        error: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockJob] });

      const job = await aiTrainingService.getTrainingJob('job_123');

      expect(job).not.toBeNull();
      expect(job?.id).toBe('job_123');
      expect(job?.name).toBe('Test Job');
      expect(job?.datasetId).toBe('dataset_123');
      expect(job?.modelType).toBe('neural_network');
      expect(job?.status).toBe('running');
      expect(job?.progress).toBe(50);
      expect(job?.startedAt).toBeInstanceOf(Date);
      expect(job?.createdAt).toBeInstanceOf(Date);
    });

    it('should list training jobs with pagination', async () => {
      const mockJobs = [
        {
          id: 'job_1',
          name: 'Job 1',
          description: 'First job',
          dataset_id: 'dataset_1',
          model_type: 'neural_network',
          hyperparameters: { epochs: 100 },
          status: 'completed',
          progress: 100,
          started_at: new Date(),
          completed_at: new Date(),
          estimated_duration: 3600000,
          actual_duration: 3500000,
          metrics: { accuracy: 0.95 },
          error: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockJobs });

      const jobs = await aiTrainingService.listTrainingJobs(10, 0);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toBe('job_1');
      expect(jobs[0].status).toBe('completed');
      expect(jobs[0].progress).toBe(100);
      expect(jobs[0].metrics).toEqual({ accuracy: 0.95 });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM training_jobs'),
        [10, 0]
      );
    });

    it('should start a training job', async () => {
      // Mock job exists in memory
      const mockJob = {
        id: 'job_123',
        name: 'Test Job',
        description: 'A test job',
        datasetId: 'dataset_123',
        modelType: 'neural_network' as const,
        hyperparameters: { epochs: 100 },
        status: 'pending' as const,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the service to have this job
      vi.spyOn(aiTrainingService, 'getTrainingJob').mockResolvedValueOnce(mockJob);
      mockDb.query.mockResolvedValueOnce({ rows: [] });

      await aiTrainingService.startTrainingJob('job_123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE training_jobs'),
        ['running', 'job_123']
      );
    });

    it('should throw error when starting non-existent job', async () => {
      vi.spyOn(aiTrainingService, 'getTrainingJob').mockResolvedValueOnce(null);

      await expect(aiTrainingService.startTrainingJob('non-existent'))
        .rejects.toThrow('Training job non-existent not found');
    });

    it('should throw error when starting job not in pending status', async () => {
      const mockJob = {
        id: 'job_123',
        name: 'Test Job',
        description: 'A test job',
        datasetId: 'dataset_123',
        modelType: 'neural_network' as const,
        hyperparameters: { epochs: 100 },
        status: 'running' as const,
        progress: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.spyOn(aiTrainingService, 'getTrainingJob').mockResolvedValueOnce(mockJob);

      await expect(aiTrainingService.startTrainingJob('job_123'))
        .rejects.toThrow('Training job job_123 is not in pending status');
    });
  });

  describe('Model Version Management', () => {
    it('should get model versions', async () => {
      const mockVersions = [
        {
          id: 'version_1',
          model_id: 'model_123',
          version: '1.0.0',
          training_job_id: 'job_123',
          status: 'ready',
          metrics: { accuracy: 0.95 },
          file_path: '/models/model_123/1.0.0/model.pkl',
          file_size: 5000000,
          performance: { accuracy: 0.95, latency: 50, throughput: 1000, memoryUsage: 200 },
          created_at: new Date(),
          deployed_at: null
        }
      ];

      mockDb.query.mockResolvedValueOnce({ rows: mockVersions });

      const versions = await aiTrainingService.getModelVersions('model_123');

      expect(versions).toHaveLength(1);
      expect(versions[0].id).toBe('version_1');
      expect(versions[0].modelId).toBe('model_123');
      expect(versions[0].version).toBe('1.0.0');
      expect(versions[0].status).toBe('ready');
      expect(versions[0].metrics).toEqual({ accuracy: 0.95 });
      expect(versions[0].performance.accuracy).toBe(0.95);
      expect(versions[0].performance.latency).toBe(50);
      expect(versions[0].performance.throughput).toBe(1000);
      expect(versions[0].performance.memoryUsage).toBe(200);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM model_versions'),
        ['model_123']
      );
    });
  });

  describe('Training Progress', () => {
    it('should get training progress', async () => {
      const mockProgress = {
        jobId: 'job_123',
        currentEpoch: 50,
        totalEpochs: 100,
        currentBatch: 25,
        totalBatches: 100,
        loss: 0.5,
        validationLoss: 0.6,
        accuracy: 0.85,
        learningRate: 0.001,
        estimatedTimeRemaining: 1800000,
        status: 'training',
        timestamp: new Date()
      };

      // Mock the service to return this progress
      vi.spyOn(aiTrainingService, 'getTrainingProgress').mockResolvedValueOnce(mockProgress);

      const progress = await aiTrainingService.getTrainingProgress('job_123');

      expect(progress).not.toBeNull();
      expect(progress?.jobId).toBe('job_123');
      expect(progress?.currentEpoch).toBe(50);
      expect(progress?.totalEpochs).toBe(100);
      expect(progress?.loss).toBe(0.5);
      expect(progress?.accuracy).toBe(0.85);
      expect(progress?.status).toBe('training');
    });

    it('should return null for non-existent progress', async () => {
      vi.spyOn(aiTrainingService, 'getTrainingProgress').mockResolvedValueOnce(null);

      const progress = await aiTrainingService.getTrainingProgress('non-existent');

      expect(progress).toBeNull();
    });
  });

  describe('Health Status', () => {
    it('should return health status', async () => {
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // datasets count
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }); // models count

      const healthStatus = await aiTrainingService.getHealthStatus();

      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('activeJobs');
      expect(healthStatus).toHaveProperty('totalDatasets');
      expect(healthStatus).toHaveProperty('totalModels');
      expect(healthStatus).toHaveProperty('lastCheck');
      expect(healthStatus.lastCheck).toBeInstanceOf(Date);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthStatus.status);
    });

    it('should return unhealthy status on error', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const healthStatus = await aiTrainingService.getHealthStatus();

      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.activeJobs).toBe(0);
      expect(healthStatus.totalDatasets).toBe(0);
      expect(healthStatus.totalModels).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when service not initialized', async () => {
      // Reset the service to uninitialized state
      const service = new (aiTrainingService.constructor as any)();
      
      await expect(service.createDataset({
        name: 'test',
        type: 'classification',
        size: 100,
        features: ['feature1'],
        status: 'uploading',
        metadata: { source: 'test', format: 'csv' }
      })).rejects.toThrow('AI Training Service not initialized');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(aiTrainingService.getDataset('dataset_123'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Data Mapping', () => {
    it('should map database rows to dataset objects correctly', async () => {
      const mockRow = {
        id: 'dataset_123',
        name: 'Test Dataset',
        description: 'A test dataset',
        type: 'classification',
        size: 1000,
        features: ['feature1', 'feature2'],
        target_column: 'target',
        status: 'ready',
        metadata: { source: 'test', format: 'csv' },
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockRow] });

      const dataset = await aiTrainingService.getDataset('dataset_123');

      expect(dataset?.id).toBe(mockRow.id);
      expect(dataset?.name).toBe(mockRow.name);
      expect(dataset?.type).toBe(mockRow.type);
      expect(dataset?.size).toBe(mockRow.size);
      expect(dataset?.features).toEqual(mockRow.features);
      expect(dataset?.targetColumn).toBe(mockRow.target_column);
      expect(dataset?.status).toBe(mockRow.status);
      expect(dataset?.metadata).toEqual(mockRow.metadata);
      expect(dataset?.createdAt).toEqual(mockRow.created_at);
      expect(dataset?.updatedAt).toEqual(mockRow.updated_at);
    });

    it('should map database rows to training job objects correctly', async () => {
      const mockRow = {
        id: 'job_123',
        name: 'Test Job',
        description: 'A test job',
        dataset_id: 'dataset_123',
        model_type: 'neural_network',
        hyperparameters: { epochs: 100 },
        status: 'running',
        progress: 50,
        started_at: new Date('2024-01-01'),
        completed_at: null,
        estimated_duration: 3600000,
        actual_duration: null,
        metrics: null,
        error: null,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02')
      };

      mockDb.query.mockResolvedValueOnce({ rows: [mockRow] });

      const job = await aiTrainingService.getTrainingJob('job_123');

      expect(job?.id).toBe(mockRow.id);
      expect(job?.name).toBe(mockRow.name);
      expect(job?.datasetId).toBe(mockRow.dataset_id);
      expect(job?.modelType).toBe(mockRow.model_type);
      expect(job?.hyperparameters).toEqual(mockRow.hyperparameters);
      expect(job?.status).toBe(mockRow.status);
      expect(job?.progress).toBe(mockRow.progress);
      expect(job?.startedAt).toEqual(mockRow.started_at);
      expect(job?.completedAt).toBeUndefined();
      expect(job?.estimatedDuration).toBe(mockRow.estimated_duration);
      expect(job?.actualDuration).toBeUndefined();
      expect(job?.metrics).toBeNull();
      expect(job?.error).toBeNull();
      expect(job?.createdAt).toEqual(mockRow.created_at);
      expect(job?.updatedAt).toEqual(mockRow.updated_at);
    });
  });
});
