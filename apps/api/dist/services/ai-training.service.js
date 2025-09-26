import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from '../lib/structured-logger.js';
export class AITrainingService {
    db;
    trainingJobs = new Map();
    trainingProgress = new Map();
    isInitialized = false;
    constructor() {
        this.db = getDatabaseService();
        this.initializeService();
    }
    async initializeService() {
        try {
            structuredLogger.info('Initializing AI Training Platform Service', {
                service: 'AITrainingService',
                timestamp: new Date().toISOString()
            });
            await this.createTables();
            await this.loadActiveJobs();
            this.isInitialized = true;
            structuredLogger.info('AI Training Platform Service initialized successfully');
        }
        catch (error) {
            structuredLogger.error('Failed to initialize AI Training Platform Service', error);
            throw error;
        }
    }
    async createTables() {
        try {
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS training_datasets (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          description TEXT,
          type VARCHAR NOT NULL,
          size INTEGER NOT NULL,
          features TEXT[] NOT NULL,
          target_column VARCHAR,
          status VARCHAR NOT NULL DEFAULT 'uploading',
          metadata JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS training_jobs (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          description TEXT,
          dataset_id VARCHAR NOT NULL REFERENCES training_datasets(id),
          model_type VARCHAR NOT NULL,
          hyperparameters JSONB NOT NULL,
          status VARCHAR NOT NULL DEFAULT 'pending',
          progress INTEGER DEFAULT 0,
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          estimated_duration INTEGER,
          actual_duration INTEGER,
          metrics JSONB,
          error TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS model_versions (
          id VARCHAR PRIMARY KEY,
          model_id VARCHAR NOT NULL,
          version VARCHAR NOT NULL,
          training_job_id VARCHAR NOT NULL REFERENCES training_jobs(id),
          status VARCHAR NOT NULL DEFAULT 'training',
          metrics JSONB NOT NULL,
          file_path VARCHAR NOT NULL,
          file_size INTEGER NOT NULL,
          performance JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          deployed_at TIMESTAMP
        )
      `);
            await this.db.query(`
        CREATE TABLE IF NOT EXISTS training_progress (
          id SERIAL PRIMARY KEY,
          job_id VARCHAR NOT NULL REFERENCES training_jobs(id),
          current_epoch INTEGER,
          total_epochs INTEGER,
          current_batch INTEGER,
          total_batches INTEGER,
          loss DECIMAL NOT NULL,
          validation_loss DECIMAL,
          accuracy DECIMAL,
          learning_rate DECIMAL NOT NULL,
          estimated_time_remaining INTEGER,
          status VARCHAR NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW()
        )
      `);
            structuredLogger.info('AI Training Platform tables created successfully');
        }
        catch (error) {
            structuredLogger.error('Failed to create AI Training Platform tables', error);
            throw error;
        }
    }
    async loadActiveJobs() {
        try {
            const result = await this.db.query(`
        SELECT * FROM training_jobs 
        WHERE status IN ('pending', 'running')
      `);
            for (const row of result.rows) {
                this.trainingJobs.set(row.id, this.mapRowToTrainingJob(row));
            }
            structuredLogger.info(`Loaded ${this.trainingJobs.size} active training jobs`);
        }
        catch (error) {
            structuredLogger.error('Failed to load active training jobs', error);
        }
    }
    async createDataset(dataset) {
        if (!this.isInitialized) {
            throw new Error('AI Training Service not initialized');
        }
        try {
            const id = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            const newDataset = {
                id,
                ...dataset,
                createdAt: now,
                updatedAt: now
            };
            await this.db.query(`
        INSERT INTO training_datasets (
          id, name, description, type, size, features, target_column, 
          status, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
                newDataset.id,
                newDataset.name,
                newDataset.description,
                newDataset.type,
                newDataset.size,
                newDataset.features,
                newDataset.targetColumn,
                newDataset.status,
                JSON.stringify(newDataset.metadata),
                newDataset.createdAt,
                newDataset.updatedAt
            ]);
            structuredLogger.info('Training dataset created successfully', {
                datasetId: newDataset.id,
                name: newDataset.name,
                type: newDataset.type,
                size: newDataset.size
            });
            return newDataset;
        }
        catch (error) {
            structuredLogger.error('Failed to create training dataset', error);
            throw error;
        }
    }
    async getDataset(datasetId) {
        try {
            const result = await this.db.query('SELECT * FROM training_datasets WHERE id = $1', [datasetId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToDataset(result.rows[0]);
        }
        catch (error) {
            structuredLogger.error('Failed to get training dataset', error);
            throw error;
        }
    }
    async listDatasets(limit = 50, offset = 0) {
        try {
            const result = await this.db.query(`
        SELECT * FROM training_datasets 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
            return result.rows.map(row => this.mapRowToDataset(row));
        }
        catch (error) {
            structuredLogger.error('Failed to list training datasets', error);
            throw error;
        }
    }
    async updateDatasetStatus(datasetId, status) {
        try {
            await this.db.query(`
        UPDATE training_datasets 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
      `, [status, datasetId]);
            structuredLogger.info('Dataset status updated', {
                datasetId,
                status
            });
        }
        catch (error) {
            structuredLogger.error('Failed to update dataset status', error);
            throw error;
        }
    }
    async createTrainingJob(job) {
        if (!this.isInitialized) {
            throw new Error('AI Training Service not initialized');
        }
        try {
            const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            const newJob = {
                id,
                ...job,
                status: 'pending',
                progress: 0,
                createdAt: now,
                updatedAt: now
            };
            await this.db.query(`
        INSERT INTO training_jobs (
          id, name, description, dataset_id, model_type, hyperparameters,
          status, progress, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
                newJob.id,
                newJob.name,
                newJob.description,
                newJob.datasetId,
                newJob.modelType,
                JSON.stringify(newJob.hyperparameters),
                newJob.status,
                newJob.progress,
                newJob.createdAt,
                newJob.updatedAt
            ]);
            this.trainingJobs.set(newJob.id, newJob);
            structuredLogger.info('Training job created successfully', {
                jobId: newJob.id,
                name: newJob.name,
                modelType: newJob.modelType,
                datasetId: newJob.datasetId
            });
            return newJob;
        }
        catch (error) {
            structuredLogger.error('Failed to create training job', error);
            throw error;
        }
    }
    async startTrainingJob(jobId) {
        try {
            const job = this.trainingJobs.get(jobId);
            if (!job) {
                throw new Error(`Training job ${jobId} not found`);
            }
            if (job.status !== 'pending') {
                throw new Error(`Training job ${jobId} is not in pending status`);
            }
            await this.db.query(`
        UPDATE training_jobs 
        SET status = 'running', started_at = NOW(), updated_at = NOW() 
        WHERE id = $1
      `, [jobId]);
            job.status = 'running';
            job.startedAt = new Date();
            job.updatedAt = new Date();
            this.simulateTraining(jobId);
            structuredLogger.info('Training job started', {
                jobId,
                modelType: job.modelType,
                datasetId: job.datasetId
            });
        }
        catch (error) {
            structuredLogger.error('Failed to start training job', error);
            throw error;
        }
    }
    async simulateTraining(jobId) {
        const job = this.trainingJobs.get(jobId);
        if (!job)
            return;
        try {
            const totalEpochs = job.hyperparameters.epochs || 100;
            const batchSize = job.hyperparameters.batchSize || 32;
            const learningRate = job.hyperparameters.learningRate || 0.001;
            for (let epoch = 1; epoch <= totalEpochs; epoch++) {
                const progress = Math.round((epoch / totalEpochs) * 100);
                const loss = Math.max(0.1, 1.0 - (epoch / totalEpochs) * 0.8 + Math.random() * 0.1);
                const accuracy = Math.min(0.95, (epoch / totalEpochs) * 0.9 + Math.random() * 0.05);
                await this.updateTrainingProgress(jobId, {
                    jobId,
                    currentEpoch: epoch,
                    totalEpochs,
                    currentBatch: 1,
                    totalBatches: 100,
                    loss,
                    validationLoss: loss * 1.1,
                    accuracy,
                    learningRate,
                    estimatedTimeRemaining: (totalEpochs - epoch) * 1000,
                    status: 'training',
                    timestamp: new Date()
                });
                await new Promise(resolve => setTimeout(resolve, 100));
                const currentJob = this.trainingJobs.get(jobId);
                if (!currentJob || currentJob.status === 'cancelled') {
                    return;
                }
            }
            await this.completeTrainingJob(jobId);
        }
        catch (error) {
            await this.failTrainingJob(jobId, error);
        }
    }
    async updateTrainingProgress(jobId, progress) {
        try {
            await this.db.query(`
        INSERT INTO training_progress (
          job_id, current_epoch, total_epochs, current_batch, total_batches,
          loss, validation_loss, accuracy, learning_rate, estimated_time_remaining, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
                progress.jobId,
                progress.currentEpoch,
                progress.totalEpochs,
                progress.currentBatch,
                progress.totalBatches,
                progress.loss,
                progress.validationLoss,
                progress.accuracy,
                progress.learningRate,
                progress.estimatedTimeRemaining,
                progress.status
            ]);
            this.trainingProgress.set(jobId, progress);
            const job = this.trainingJobs.get(jobId);
            if (job) {
                job.progress = progress.currentEpoch ? Math.round((progress.currentEpoch / progress.totalEpochs) * 100) : 0;
                job.updatedAt = new Date();
                await this.db.query(`
          UPDATE training_jobs 
          SET progress = $1, updated_at = NOW() 
          WHERE id = $2
        `, [job.progress, jobId]);
            }
        }
        catch (error) {
            structuredLogger.error('Failed to update training progress', error);
        }
    }
    async completeTrainingJob(jobId) {
        try {
            const job = this.trainingJobs.get(jobId);
            if (!job)
                return;
            const completedAt = new Date();
            const actualDuration = job.startedAt ? completedAt.getTime() - job.startedAt.getTime() : 0;
            const metrics = {
                accuracy: 0.85 + Math.random() * 0.1,
                precision: 0.82 + Math.random() * 0.1,
                recall: 0.80 + Math.random() * 0.1,
                f1Score: 0.81 + Math.random() * 0.1,
                loss: 0.1 + Math.random() * 0.05,
                validationLoss: 0.12 + Math.random() * 0.05,
                epochs: job.hyperparameters.epochs || 100,
                learningRate: job.hyperparameters.learningRate || 0.001,
                batchSize: job.hyperparameters.batchSize || 32
            };
            await this.db.query(`
        UPDATE training_jobs 
        SET status = 'completed', completed_at = $1, actual_duration = $2, 
            metrics = $3, updated_at = NOW() 
        WHERE id = $4
      `, [completedAt, actualDuration, JSON.stringify(metrics), jobId]);
            job.status = 'completed';
            job.completedAt = completedAt;
            job.actualDuration = actualDuration;
            job.metrics = metrics;
            job.progress = 100;
            job.updatedAt = completedAt;
            await this.createModelVersion(jobId, metrics);
            structuredLogger.info('Training job completed successfully', {
                jobId,
                actualDuration,
                metrics
            });
        }
        catch (error) {
            structuredLogger.error('Failed to complete training job', error);
        }
    }
    async failTrainingJob(jobId, error) {
        try {
            const job = this.trainingJobs.get(jobId);
            if (!job)
                return;
            await this.db.query(`
        UPDATE training_jobs 
        SET status = 'failed', error = $1, updated_at = NOW() 
        WHERE id = $2
      `, [error.message, jobId]);
            job.status = 'failed';
            job.error = error.message;
            job.updatedAt = new Date();
            structuredLogger.error('Training job failed', error, {
                jobId,
                modelType: job.modelType
            });
        }
        catch (dbError) {
            structuredLogger.error('Failed to update failed training job', dbError);
        }
    }
    async createModelVersion(jobId, metrics) {
        try {
            const job = this.trainingJobs.get(jobId);
            if (!job)
                return;
            const versionId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const modelId = `model_${job.modelType}_${job.datasetId}`;
            const version = '1.0.0';
            const filePath = `/models/${modelId}/${version}/model.pkl`;
            const fileSize = Math.floor(Math.random() * 10000000) + 1000000;
            const modelVersion = {
                id: versionId,
                modelId,
                version,
                trainingJobId: jobId,
                status: 'ready',
                metrics,
                filePath,
                fileSize,
                createdAt: new Date(),
                performance: {
                    accuracy: metrics.accuracy || 0,
                    latency: Math.random() * 100 + 10,
                    throughput: Math.random() * 1000 + 100,
                    memoryUsage: Math.random() * 500 + 100
                }
            };
            await this.db.query(`
        INSERT INTO model_versions (
          id, model_id, version, training_job_id, status, metrics, 
          file_path, file_size, performance, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
                modelVersion.id,
                modelVersion.modelId,
                modelVersion.version,
                modelVersion.trainingJobId,
                modelVersion.status,
                JSON.stringify(modelVersion.metrics),
                modelVersion.filePath,
                modelVersion.fileSize,
                JSON.stringify(modelVersion.performance),
                modelVersion.createdAt
            ]);
            structuredLogger.info('Model version created successfully', {
                versionId,
                modelId,
                version,
                jobId
            });
        }
        catch (error) {
            structuredLogger.error('Failed to create model version', error);
        }
    }
    async getTrainingJob(jobId) {
        const job = this.trainingJobs.get(jobId);
        if (job)
            return job;
        try {
            const result = await this.db.query('SELECT * FROM training_jobs WHERE id = $1', [jobId]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToTrainingJob(result.rows[0]);
        }
        catch (error) {
            structuredLogger.error('Failed to get training job', error);
            throw error;
        }
    }
    async listTrainingJobs(limit = 50, offset = 0) {
        try {
            const result = await this.db.query(`
        SELECT * FROM training_jobs 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
            return result.rows.map(row => this.mapRowToTrainingJob(row));
        }
        catch (error) {
            structuredLogger.error('Failed to list training jobs', error);
            throw error;
        }
    }
    async getTrainingProgress(jobId) {
        return this.trainingProgress.get(jobId) || null;
    }
    async getModelVersions(modelId) {
        try {
            const result = await this.db.query(`
        SELECT * FROM model_versions 
        WHERE model_id = $1 
        ORDER BY created_at DESC
      `, [modelId]);
            return result.rows.map(row => this.mapRowToModelVersion(row));
        }
        catch (error) {
            structuredLogger.error('Failed to get model versions', error);
            throw error;
        }
    }
    mapRowToDataset(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            type: row.type,
            size: row.size,
            features: row.features,
            targetColumn: row.target_column,
            status: row.status,
            metadata: row.metadata,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapRowToTrainingJob(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            datasetId: row.dataset_id,
            modelType: row.model_type,
            hyperparameters: row.hyperparameters,
            status: row.status,
            progress: row.progress,
            startedAt: row.started_at ? new Date(row.started_at) : undefined,
            completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
            estimatedDuration: row.estimated_duration,
            actualDuration: row.actual_duration,
            metrics: row.metrics,
            error: row.error,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
    mapRowToModelVersion(row) {
        return {
            id: row.id,
            modelId: row.model_id,
            version: row.version,
            trainingJobId: row.training_job_id,
            status: row.status,
            metrics: row.metrics,
            filePath: row.file_path,
            fileSize: row.file_size,
            createdAt: new Date(row.created_at),
            deployedAt: row.deployed_at ? new Date(row.deployed_at) : undefined,
            performance: row.performance
        };
    }
    async getHealthStatus() {
        try {
            const activeJobs = this.trainingJobs.size;
            const datasetsResult = await this.db.query('SELECT COUNT(*) FROM training_datasets');
            const totalDatasets = parseInt(datasetsResult.rows[0].count);
            const modelsResult = await this.db.query('SELECT COUNT(*) FROM model_versions');
            const totalModels = parseInt(modelsResult.rows[0].count);
            const status = activeJobs > 0 ? 'healthy' : 'degraded';
            return {
                status,
                activeJobs,
                totalDatasets,
                totalModels,
                lastCheck: new Date()
            };
        }
        catch (error) {
            structuredLogger.error('Failed to get health status', error);
            return {
                status: 'unhealthy',
                activeJobs: 0,
                totalDatasets: 0,
                totalModels: 0,
                lastCheck: new Date()
            };
        }
    }
}
export const aiTrainingService = new AITrainingService();
//# sourceMappingURL=ai-training.service.js.map