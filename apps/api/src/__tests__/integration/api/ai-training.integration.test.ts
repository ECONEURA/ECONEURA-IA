import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

// ============================================================================
// AI TRAINING PLATFORM API INTEGRATION TESTS - PR-18
// ============================================================================

describe('AI Training Platform API', () => {
  const authToken = 'test-jwt-token';
  const baseUrl = '/v1/ai-training';

  beforeEach(() => {
    // Setup test environment
  });

  afterEach(() => {
    // Cleanup
  });

  describe('POST /datasets', () => {
    it('should create a new training dataset successfully', async () => {
      const requestBody = {
        name: 'Test Classification Dataset',
        description: 'A test dataset for classification tasks',
        type: 'classification',
        size: 1000,
        features: ['feature1', 'feature2', 'feature3'],
        targetColumn: 'target',
        metadata: {
          source: 'test_source',
          format: 'csv',
          encoding: 'utf-8',
          delimiter: ',',
          hasHeader: true
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(requestBody.name);
      expect(response.body.data.type).toBe(requestBody.type);
      expect(response.body.data.size).toBe(requestBody.size);
      expect(response.body.data.features).toEqual(requestBody.features);
      expect(response.body.data.targetColumn).toBe(requestBody.targetColumn);
      expect(response.body.data.status).toBe('uploading');
      expect(response.body.data.metadata).toEqual(requestBody.metadata);
      expect(response.body.metadata).toHaveProperty('service', 'ai-training-platform');
    });

    it('should handle validation errors for invalid dataset data', async () => {
      const invalidRequestBody = {
        name: '', // Invalid: empty name
        type: 'invalid_type', // Invalid: not in enum
        size: -1, // Invalid: negative size
        features: [], // Invalid: empty features array
        metadata: {
          source: 'test',
          format: 'invalid_format' // Invalid: not in enum
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should require authentication', async () => {
      const requestBody = {
        name: 'Test Dataset',
        type: 'classification',
        size: 1000,
        features: ['feature1'],
        metadata: {
          source: 'test',
          format: 'csv'
        }
      };

      await request(app)
        .post(`${baseUrl}/datasets`)
        .send(requestBody)
        .expect(401);
    });

    it('should handle missing required fields', async () => {
      const incompleteRequestBody = {
        name: 'Test Dataset'
        // Missing required fields: type, size, features, metadata
      };

      const response = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('GET /datasets', () => {
    it('should list training datasets with pagination', async () => {
      const response = await request(app)
        .get(`${baseUrl}/datasets`)
        .query({ limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('count');
      expect(response.body.metadata).toHaveProperty('limit', 10);
      expect(response.body.metadata).toHaveProperty('offset', 0);
      expect(response.body.metadata).toHaveProperty('service', 'ai-training-platform');
    });

    it('should handle default pagination parameters', async () => {
      const response = await request(app)
        .get(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.metadata).toHaveProperty('limit', 50);
      expect(response.body.metadata).toHaveProperty('offset', 0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`${baseUrl}/datasets`)
        .expect(401);
    });
  });

  describe('GET /datasets/:id', () => {
    it('should get a specific training dataset', async () => {
      // First create a dataset
      const createResponse = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Dataset',
          type: 'classification',
          size: 1000,
          features: ['feature1'],
          metadata: { source: 'test', format: 'csv' }
        })
        .expect(201);

      const datasetId = createResponse.body.data.id;

      // Then get the dataset
      const response = await request(app)
        .get(`${baseUrl}/datasets/${datasetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(datasetId);
      expect(response.body.data.name).toBe('Test Dataset');
    });

    it('should return 404 for non-existent dataset', async () => {
      const response = await request(app)
        .get(`${baseUrl}/datasets/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Dataset not found');
    });
  });

  describe('PATCH /datasets/:id/status', () => {
    it('should update dataset status successfully', async () => {
      // First create a dataset
      const createResponse = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Dataset',
          type: 'classification',
          size: 1000,
          features: ['feature1'],
          metadata: { source: 'test', format: 'csv' }
        })
        .expect(201);

      const datasetId = createResponse.body.data.id;

      // Update status
      const response = await request(app)
        .patch(`${baseUrl}/datasets/${datasetId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'ready' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Dataset status updated successfully');
      expect(response.body.metadata).toHaveProperty('datasetId', datasetId);
      expect(response.body.metadata).toHaveProperty('newStatus', 'ready');
    });

    it('should handle invalid status values', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/datasets/test-id/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid status value');
    });
  });

  describe('POST /jobs', () => {
    it('should create a new training job successfully', async () => {
      // First create a dataset
      const datasetResponse = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Dataset',
          type: 'classification',
          size: 1000,
          features: ['feature1'],
          metadata: { source: 'test', format: 'csv' }
        })
        .expect(201);

      const datasetId = datasetResponse.body.data.id;

      const requestBody = {
        name: 'Test Training Job',
        description: 'A test training job for neural network',
        datasetId: datasetId,
        modelType: 'neural_network',
        hyperparameters: {
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/jobs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(requestBody.name);
      expect(response.body.data.description).toBe(requestBody.description);
      expect(response.body.data.datasetId).toBe(datasetId);
      expect(response.body.data.modelType).toBe(requestBody.modelType);
      expect(response.body.data.hyperparameters).toEqual(requestBody.hyperparameters);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.progress).toBe(0);
      expect(response.body.metadata).toHaveProperty('service', 'ai-training-platform');
    });

    it('should handle validation errors for invalid job data', async () => {
      const invalidRequestBody = {
        name: '', // Invalid: empty name
        datasetId: 'invalid-dataset-id',
        modelType: 'invalid_model_type', // Invalid: not in enum
        hyperparameters: 'invalid' // Invalid: should be object
      };

      const response = await request(app)
        .post(`${baseUrl}/jobs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should require authentication', async () => {
      const requestBody = {
        name: 'Test Job',
        datasetId: 'dataset-123',
        modelType: 'neural_network'
      };

      await request(app)
        .post(`${baseUrl}/jobs`)
        .send(requestBody)
        .expect(401);
    });
  });

  describe('GET /jobs', () => {
    it('should list training jobs with pagination', async () => {
      const response = await request(app)
        .get(`${baseUrl}/jobs`)
        .query({ limit: 10, offset: 0 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('count');
      expect(response.body.metadata).toHaveProperty('limit', 10);
      expect(response.body.metadata).toHaveProperty('offset', 0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`${baseUrl}/jobs`)
        .expect(401);
    });
  });

  describe('GET /jobs/:id', () => {
    it('should get a specific training job', async () => {
      // First create a dataset and job
      const datasetResponse = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Dataset',
          type: 'classification',
          size: 1000,
          features: ['feature1'],
          metadata: { source: 'test', format: 'csv' }
        })
        .expect(201);

      const jobResponse = await request(app)
        .post(`${baseUrl}/jobs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Job',
          datasetId: datasetResponse.body.data.id,
          modelType: 'neural_network'
        })
        .expect(201);

      const jobId = jobResponse.body.data.id;

      // Get the job
      const response = await request(app)
        .get(`${baseUrl}/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(jobId);
      expect(response.body.data.name).toBe('Test Job');
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get(`${baseUrl}/jobs/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Training job not found');
    });
  });

  describe('POST /jobs/:id/start', () => {
    it('should start a training job successfully', async () => {
      // First create a dataset and job
      const datasetResponse = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Dataset',
          type: 'classification',
          size: 1000,
          features: ['feature1'],
          metadata: { source: 'test', format: 'csv' }
        })
        .expect(201);

      const jobResponse = await request(app)
        .post(`${baseUrl}/jobs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Job',
          datasetId: datasetResponse.body.data.id,
          modelType: 'neural_network'
        })
        .expect(201);

      const jobId = jobResponse.body.data.id;

      // Start the job
      const response = await request(app)
        .post(`${baseUrl}/jobs/${jobId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Training job started successfully');
      expect(response.body.metadata).toHaveProperty('jobId', jobId);
    });

    it('should handle starting non-existent job', async () => {
      const response = await request(app)
        .post(`${baseUrl}/jobs/non-existent-id/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('GET /jobs/:id/progress', () => {
    it('should get training job progress', async () => {
      // First create and start a job
      const datasetResponse = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Dataset',
          type: 'classification',
          size: 1000,
          features: ['feature1'],
          metadata: { source: 'test', format: 'csv' }
        })
        .expect(201);

      const jobResponse = await request(app)
        .post(`${baseUrl}/jobs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Job',
          datasetId: datasetResponse.body.data.id,
          modelType: 'neural_network'
        })
        .expect(201);

      const jobId = jobResponse.body.data.id;

      // Start the job
      await request(app)
        .post(`${baseUrl}/jobs/${jobId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Wait a bit for progress to be generated
      await new Promise(resolve => setTimeout(resolve, 200));

      // Get progress
      const response = await request(app)
        .get(`${baseUrl}/jobs/${jobId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('jobId', jobId);
      expect(response.body.data).toHaveProperty('loss');
      expect(response.body.data).toHaveProperty('learningRate');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent progress', async () => {
      const response = await request(app)
        .get(`${baseUrl}/jobs/non-existent-id/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Training progress not found');
    });
  });

  describe('GET /models/:modelId/versions', () => {
    it('should get model versions', async () => {
      const response = await request(app)
        .get(`${baseUrl}/models/test-model-id/versions`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.metadata).toHaveProperty('modelId', 'test-model-id');
      expect(response.body.metadata).toHaveProperty('count');
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`${baseUrl}/models/test-model-id/versions`)
        .expect(401);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('activeJobs');
      expect(response.body.data).toHaveProperty('totalDatasets');
      expect(response.body.data).toHaveProperty('totalModels');
      expect(response.body.data).toHaveProperty('lastCheck');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.data.status);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`${baseUrl}/health`)
        .expect(401);
    });
  });

  describe('GET /status', () => {
    it('should return service status and statistics', async () => {
      const response = await request(app)
        .get(`${baseUrl}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('service', 'AI Training Platform');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('activeJobs');
      expect(response.body.data).toHaveProperty('totalDatasets');
      expect(response.body.data).toHaveProperty('totalModels');
      expect(response.body.data).toHaveProperty('capabilities');
      expect(response.body.data).toHaveProperty('supportedAlgorithms');
      expect(response.body.data).toHaveProperty('supportedDataTypes');
      expect(Array.isArray(response.body.data.capabilities)).toBe(true);
      expect(Array.isArray(response.body.data.supportedAlgorithms)).toBe(true);
      expect(Array.isArray(response.body.data.supportedDataTypes)).toBe(true);
    });
  });

  describe('POST /configure', () => {
    it('should configure training parameters successfully', async () => {
      const requestBody = {
        algorithm: 'neural_network',
        hyperparameters: {
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001
        },
        validationStrategy: 'holdout',
        validationSplit: 0.2,
        testSplit: 0.2,
        crossValidationFolds: 5,
        earlyStopping: {
          enabled: true,
          patience: 10,
          minDelta: 0.001
        },
        dataAugmentation: {
          enabled: true,
          techniques: ['rotation', 'flip']
        },
        preprocessing: {
          normalization: true,
          scaling: 'standard',
          encoding: 'onehot',
          featureSelection: true
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/configure`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Training configuration saved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(requestBody);
    });

    it('should handle validation errors for invalid configuration', async () => {
      const invalidRequestBody = {
        algorithm: '', // Invalid: empty algorithm
        hyperparameters: 'invalid', // Invalid: should be object
        validationStrategy: 'invalid_strategy', // Invalid: not in enum
        validationSplit: 1.5, // Invalid: > 1
        testSplit: -0.1, // Invalid: negative
        crossValidationFolds: 1, // Invalid: < 2
        earlyStopping: {
          enabled: 'invalid', // Invalid: should be boolean
          patience: -1, // Invalid: negative
          minDelta: 'invalid' // Invalid: should be number
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/configure`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
    });

    it('should require authentication', async () => {
      const requestBody = {
        algorithm: 'neural_network',
        hyperparameters: {},
        validationStrategy: 'holdout',
        validationSplit: 0.2,
        testSplit: 0.2
      };

      await request(app)
        .post(`${baseUrl}/configure`)
        .send(requestBody)
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      const requestBody = {
        name: 'Test Dataset',
        type: 'classification',
        size: 1000,
        features: ['feature1'],
        metadata: { source: 'test', format: 'csv' }
      };

      // Make multiple requests quickly
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post(`${baseUrl}/datasets`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(requestBody)
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle missing content type', async () => {
      const response = await request(app)
        .post(`${baseUrl}/datasets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send('test')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
