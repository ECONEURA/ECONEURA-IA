import { Router } from 'express';
import { z } from 'zod';
import { backupRecoveryService } from '../lib/backup-recovery.service.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Schemas de validación para las rutas
const CreateBackupConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['database', 'files', 'configuration', 'full', 'incremental']),
  source: z.object({
    type: z.enum(['database', 'filesystem', 'api', 'config']),
    path: z.string().optional(),
    connectionString: z.string().optional(),
    tables: z.array(z.string()).optional(),
    includeData: z.boolean().default(true),
    includeSchema: z.boolean().default(true)
  }),
  destination: z.object({
    type: z.enum(['local', 'azure_blob', 's3', 'ftp', 'sftp']),
    path: z.string(),
    credentials: z.record(z.string(), z.string()).optional(),
    compression: z.boolean().default(true),
    encryption: z.boolean().default(true)
  }),
  schedule: z.object({
    enabled: z.boolean().default(false),
    cron: z.string().optional(),
    timezone: z.string().default('UTC'),
    retention: z.object({
      days: z.number().min(1).max(365).default(30),
      maxBackups: z.number().min(1).max(1000).default(100)
    })
  }),
  filters: z.object({
    include: z.array(z.string()).default([]),
    exclude: z.array(z.string()).default([]),
    maxFileSize: z.number().optional(),
    fileTypes: z.array(z.string()).optional()
  }).optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

const UpdateBackupConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['database', 'files', 'configuration', 'full', 'incremental']).optional(),
  source: z.object({
    type: z.enum(['database', 'filesystem', 'api', 'config']),
    path: z.string().optional(),
    connectionString: z.string().optional(),
    tables: z.array(z.string()).optional(),
    includeData: z.boolean().default(true),
    includeSchema: z.boolean().default(true)
  }).optional(),
  destination: z.object({
    type: z.enum(['local', 'azure_blob', 's3', 'ftp', 'sftp']),
    path: z.string(),
    credentials: z.record(z.string(), z.string()).optional(),
    compression: z.boolean().default(true),
    encryption: z.boolean().default(true)
  }).optional(),
  schedule: z.object({
    enabled: z.boolean().default(false),
    cron: z.string().optional(),
    timezone: z.string().default('UTC'),
    retention: z.object({
      days: z.number().min(1).max(365).default(30),
      maxBackups: z.number().min(1).max(1000).default(100)
    })
  }).optional(),
  filters: z.object({
    include: z.array(z.string()).default([]),
    exclude: z.array(z.string()).default([]),
    maxFileSize: z.number().optional(),
    fileTypes: z.array(z.string()).optional()
  }).optional(),
  isActive: z.boolean().optional(),
  updatedBy: z.string().optional()
});

const ExecuteBackupSchema = z.object({
  userId: z.string(),
  type: z.enum(['manual', 'scheduled']).default('manual')
});

const ExecuteRecoverySchema = z.object({
  backupJobId: z.string(),
  target: z.object({
    type: z.enum(['database', 'filesystem', 'api']),
    path: z.string().optional(),
    connectionString: z.string().optional(),
    tables: z.array(z.string()).optional()
  }),
  options: z.object({
    overwrite: z.boolean().default(false),
    verify: z.boolean().default(true),
    restoreSchema: z.boolean().default(true),
    restoreData: z.boolean().default(true)
  }),
  userId: z.string()
});

// Rutas de configuraciones de backup
router.get('/configs', async (req, res) => {
  try {
    const configs = await backupRecoveryService.getBackupConfigs();

    logger.info('Backup configurations retrieved', {
      count: configs.length
    });

    res.json({
      success: true,
      data: configs,
      count: configs.length
    });
  } catch (error) {
    logger.error('Failed to retrieve backup configurations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup configurations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await backupRecoveryService.getBackupConfig(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Backup configuration not found'
      });
    }

    logger.info('Backup configuration retrieved', {
      configId: id,
      name: config.name
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Failed to retrieve backup configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/configs', async (req, res) => {
  try {
    const configData = CreateBackupConfigSchema.parse(req.body);
    const config = await backupRecoveryService.createBackupConfig(configData);

    logger.info('Backup configuration created', {
      configId: config.id,
      name: config.name,
      type: config.type
    });

    res.status(201).json({
      success: true,
      data: config,
      message: 'Backup configuration created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to create backup configuration', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create backup configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = UpdateBackupConfigSchema.parse(req.body);

    const config = await backupRecoveryService.updateBackupConfig(
      id,
      updateData,
      updateData.updatedBy || 'system'
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Backup configuration not found'
      });
    }

    logger.info('Backup configuration updated', {
      configId: id,
      name: config.name
    });

    res.json({
      success: true,
      data: config,
      message: 'Backup configuration updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to update backup configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update backup configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/configs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const success = await backupRecoveryService.deleteBackupConfig(
      id,
      userId || 'system'
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Backup configuration not found'
      });
    }

    logger.info('Backup configuration deleted', {
      configId: id,
      userId: userId || 'system'
    });

    res.json({
      success: true,
      message: 'Backup configuration deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete backup configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete backup configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de validación
router.post('/configs/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const config = await backupRecoveryService.getBackupConfig(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Backup configuration not found'
      });
    }

    const validation = await backupRecoveryService.validateBackupConfig(config);

    logger.info('Backup configuration validated', {
      configId: id,
      isValid: validation.isValid,
      errorsCount: validation.errors.length,
      warningsCount: validation.warnings.length
    });

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    logger.error('Failed to validate backup configuration', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate backup configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de ejecución de backups
router.post('/configs/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, type } = ExecuteBackupSchema.parse(req.body);

    const job = await backupRecoveryService.executeBackup(id, userId, type);

    logger.info('Backup job started', {
      jobId: job.id,
      configId: id,
      type,
      userId
    });

    res.status(201).json({
      success: true,
      data: job,
      message: 'Backup job started successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to execute backup', {
      configId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to execute backup',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de trabajos de backup
router.get('/jobs', async (req, res) => {
  try {
    const filters = {
      configId: req.query.configId as string,
      status: req.query.status as string,
      type: req.query.type as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const jobs = await backupRecoveryService.getBackupJobs(filters);

    logger.info('Backup jobs retrieved', {
      count: jobs.length,
      filters
    });

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    logger.error('Failed to retrieve backup jobs', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await backupRecoveryService.getBackupJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Backup job not found'
      });
    }

    logger.info('Backup job retrieved', {
      jobId: id,
      status: job.status
    });

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Failed to retrieve backup job', {
      jobId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/jobs/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const success = await backupRecoveryService.cancelBackupJob(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Backup job not found or cannot be cancelled'
      });
    }

    logger.info('Backup job cancelled', {
      jobId: id
    });

    res.json({
      success: true,
      message: 'Backup job cancelled successfully'
    });
  } catch (error) {
    logger.error('Failed to cancel backup job', {
      jobId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to cancel backup job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de recuperación
router.post('/recovery', async (req, res) => {
  try {
    const { backupJobId, target, options, userId } = ExecuteRecoverySchema.parse(req.body);

    const recoveryJob = await backupRecoveryService.executeRecovery(
      backupJobId,
      target,
      options,
      userId
    );

    logger.info('Recovery job started', {
      jobId: recoveryJob.id,
      backupJobId,
      userId
    });

    res.status(201).json({
      success: true,
      data: recoveryJob,
      message: 'Recovery job started successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Failed to execute recovery', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to execute recovery',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/recovery/jobs', async (req, res) => {
  try {
    const jobs = await backupRecoveryService.getRecoveryJobs();

    logger.info('Recovery jobs retrieved', {
      count: jobs.length
    });

    res.json({
      success: true,
      data: jobs,
      count: jobs.length
    });
  } catch (error) {
    logger.error('Failed to retrieve recovery jobs', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recovery jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/recovery/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const job = await backupRecoveryService.getRecoveryJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Recovery job not found'
      });
    }

    logger.info('Recovery job retrieved', {
      jobId: id,
      status: job.status
    });

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Failed to retrieve recovery job', {
      jobId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recovery job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Rutas de estadísticas
router.get('/stats/backup', async (req, res) => {
  try {
    const stats = await backupRecoveryService.getBackupStats();

    logger.info('Backup statistics retrieved', {
      totalBackups: stats.totalBackups,
      successfulBackups: stats.successfulBackups,
      totalSize: stats.totalSize
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to retrieve backup statistics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/stats/recovery', async (req, res) => {
  try {
    const stats = await backupRecoveryService.getRecoveryStats();

    logger.info('Recovery statistics retrieved', {
      totalRecoveries: stats.totalRecoveries,
      successfulRecoveries: stats.successfulRecoveries
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to retrieve recovery statistics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recovery statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
