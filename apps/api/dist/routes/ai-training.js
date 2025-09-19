import { Router } from 'express';
import { z } from 'zod';
import { aiTrainingService } from '../services/ai-training.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limiter.js';
const router = Router();
router.use(authenticateToken);
router.use(rateLimiter);
const DatasetSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    type: z.enum(['classification', 'regression', 'clustering', 'nlp', 'computer_vision']),
    size: z.number().positive(),
    features: z.array(z.string()).min(1),
    targetColumn: z.string().optional(),
    metadata: z.object({
        source: z.string(),
        format: z.enum(['csv', 'json', 'parquet', 'images']),
        encoding: z.string().optional(),
        delimiter: z.string().optional(),
        hasHeader: z.boolean().optional()
    })
});
const TrainingJobSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    datasetId: z.string().min(1),
    modelType: z.enum(['linear_regression', 'random_forest', 'neural_network', 'xgboost', 'transformer', 'cnn', 'lstm']),
    hyperparameters: z.record(z.any()).optional()
});
const TrainingConfigurationSchema = z.object({
    algorithm: z.string(),
    hyperparameters: z.record(z.any()),
    validationStrategy: z.enum(['holdout', 'kfold', 'stratified_kfold']),
    validationSplit: z.number().min(0).max(1),
    testSplit: z.number().min(0).max(1),
    crossValidationFolds: z.number().min(2).max(10).optional(),
    earlyStopping: z.object({
        enabled: z.boolean(),
        patience: z.number().positive(),
        minDelta: z.number().positive()
    }).optional(),
    dataAugmentation: z.object({
        enabled: z.boolean(),
        techniques: z.array(z.string())
    }).optional(),
    preprocessing: z.object({
        normalization: z.boolean(),
        scaling: z.enum(['standard', 'minmax', 'robust']),
        encoding: z.enum(['onehot', 'label', 'target']),
        featureSelection: z.boolean()
    }).optional()
});
router.post('/datasets', async (req, res) => {
    try {
        const validatedData = DatasetSchema.parse(req.body);
        structuredLogger.info('Dataset creation request received', {
            userId: req.user?.id,
            datasetName: validatedData.name,
            datasetType: validatedData.type,
            datasetSize: validatedData.size
        });
        const dataset = await aiTrainingService.createDataset({
            ...validatedData,
            status: 'uploading'
        });
        res.status(201).json({
            success: true,
            data: dataset,
            metadata: {
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Dataset creation failed', error, {
            userId: req.user?.id
        });
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/datasets', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const datasets = await aiTrainingService.listDatasets(limit, offset);
        res.json({
            success: true,
            data: datasets,
            metadata: {
                count: datasets.length,
                limit,
                offset,
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list datasets', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/datasets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dataset = await aiTrainingService.getDataset(id);
        if (!dataset) {
            return res.status(404).json({
                success: false,
                error: 'Dataset not found'
            });
        }
        res.json({
            success: true,
            data: dataset,
            metadata: {
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get dataset', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.patch('/datasets/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['uploading', 'processing', 'ready', 'error'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status value'
            });
        }
        await aiTrainingService.updateDatasetStatus(id, status);
        res.json({
            success: true,
            message: 'Dataset status updated successfully',
            metadata: {
                datasetId: id,
                newStatus: status,
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update dataset status', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/jobs', async (req, res) => {
    try {
        const validatedData = TrainingJobSchema.parse(req.body);
        structuredLogger.info('Training job creation request received', {
            userId: req.user?.id,
            jobName: validatedData.name,
            modelType: validatedData.modelType,
            datasetId: validatedData.datasetId
        });
        const job = await aiTrainingService.createTrainingJob({
            ...validatedData,
            hyperparameters: validatedData.hyperparameters || {}
        });
        res.status(201).json({
            success: true,
            data: job,
            metadata: {
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Training job creation failed', error, {
            userId: req.user?.id
        });
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/jobs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const jobs = await aiTrainingService.listTrainingJobs(limit, offset);
        res.json({
            success: true,
            data: jobs,
            metadata: {
                count: jobs.length,
                limit,
                offset,
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to list training jobs', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const job = await aiTrainingService.getTrainingJob(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Training job not found'
            });
        }
        res.json({
            success: true,
            data: job,
            metadata: {
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get training job', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/jobs/:id/start', async (req, res) => {
    try {
        const { id } = req.params;
        structuredLogger.info('Training job start request received', {
            userId: req.user?.id,
            jobId: id
        });
        await aiTrainingService.startTrainingJob(id);
        res.json({
            success: true,
            message: 'Training job started successfully',
            metadata: {
                jobId: id,
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to start training job', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/jobs/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;
        const progress = await aiTrainingService.getTrainingProgress(id);
        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'Training progress not found'
            });
        }
        res.json({
            success: true,
            data: progress,
            metadata: {
                jobId: id,
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get training progress', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/models/:modelId/versions', async (req, res) => {
    try {
        const { modelId } = req.params;
        const versions = await aiTrainingService.getModelVersions(modelId);
        res.json({
            success: true,
            data: versions,
            metadata: {
                modelId,
                count: versions.length,
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get model versions', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await aiTrainingService.getHealthStatus();
        res.json({
            success: true,
            data: healthStatus,
            metadata: {
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Health check failed', error);
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        const healthStatus = await aiTrainingService.getHealthStatus();
        res.json({
            success: true,
            data: {
                service: 'AI Training Platform',
                version: '1.0.0',
                status: healthStatus.status,
                activeJobs: healthStatus.activeJobs,
                totalDatasets: healthStatus.totalDatasets,
                totalModels: healthStatus.totalModels,
                capabilities: [
                    'dataset_management',
                    'training_jobs',
                    'model_versions',
                    'progress_monitoring',
                    'hyperparameter_tuning',
                    'model_evaluation'
                ],
                supportedAlgorithms: [
                    'linear_regression',
                    'random_forest',
                    'neural_network',
                    'xgboost',
                    'transformer',
                    'cnn',
                    'lstm'
                ],
                supportedDataTypes: [
                    'classification',
                    'regression',
                    'clustering',
                    'nlp',
                    'computer_vision'
                ],
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Status check failed', error);
        res.status(500).json({
            success: false,
            error: 'Status check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/configure', async (req, res) => {
    try {
        const validatedData = TrainingConfigurationSchema.parse(req.body);
        structuredLogger.info('Training configuration request received', {
            userId: req.user?.id,
            algorithm: validatedData.algorithm,
            validationStrategy: validatedData.validationStrategy
        });
        res.json({
            success: true,
            message: 'Training configuration saved successfully',
            data: validatedData,
            metadata: {
                service: 'ai-training-platform',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Training configuration failed', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export { router as aiTrainingRoutes };
//# sourceMappingURL=ai-training.js.map