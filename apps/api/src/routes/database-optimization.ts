/**
 * PR-56: Database Optimization Routes
 *
 * Endpoints para el sistema de optimización de base de datos
 */

import { Router } from 'express';
import { z } from 'zod';
import { databaseOptimizerService } from '../db/optimization/database-optimizer.service.js';
import { indexManagerService } from '../db/indexes/index-manager.service.js';
import { partitionManagerService } from '../db/partitions/partition-manager.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Schemas de validación
const createIndexSchema = z.object({
  name: z.string().min(3).max(100),
  table: z.string().min(3).max(100),
  columns: z.array(z.string()).min(1),
  type: z.enum(['btree', 'hash', 'gin', 'gist', 'spgist', 'brin']).default('btree'),
  unique: z.boolean().default(false),
  partial: z.string().optional(),
  include: z.array(z.string()).optional(),
  concurrent: z.boolean().default(true)
});

const createPartitionSchema = z.object({
  tableName: z.string().min(3).max(100),
  partitionName: z.string().min(3).max(100),
  condition: z.string().min(10),
  partitionType: z.enum(['range', 'list', 'hash']).default('range')
});

const optimizeQuerySchema = z.object({
  query: z.string().min(10),
  params: z.array(z.any()).optional()
});

/**
 * GET /database-optimization/stats
 * Obtiene estadísticas de la base de datos
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await databaseOptimizerService.getDatabaseStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get database stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get database stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/optimize-query
 * Optimiza una consulta SQL
 */
router.post('/optimize-query', async (req, res) => {
  try {
    const validatedData = optimizeQuerySchema.parse(req.body);

    const optimization = await databaseOptimizerService.optimizeQuery(
      validatedData.query,
      validatedData.params
    );

    structuredLogger.info('Query optimization completed', {
      query: validatedData.query.substring(0, 200),
      improvement: optimization.improvement,
      recommendations: optimization.recommendations.length,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      data: optimization,
      message: 'Query optimization completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to optimize query', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to optimize query',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/vacuum
 * Ejecuta VACUUM en la base de datos
 */
router.post('/vacuum', async (req, res) => {
  try {
    const { table } = req.body;

    const result = await databaseOptimizerService.performVacuum(table);

    if (result) {
      structuredLogger.info('Database vacuum completed', {
        table: table || 'all tables',
        requestId: req.headers['x-request-id'] as string || ''
      });

      res.json({
        success: true,
        message: `Vacuum completed successfully for ${table || 'all tables'}`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Vacuum operation failed'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to perform vacuum', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to perform vacuum',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/analyze
 * Ejecuta ANALYZE en la base de datos
 */
router.post('/analyze', async (req, res) => {
  try {
    const { table } = req.body;

    const result = await databaseOptimizerService.performAnalyze(table);

    if (result) {
      structuredLogger.info('Database analyze completed', {
        table: table || 'all tables',
        requestId: req.headers['x-request-id'] as string || ''
      });

      res.json({
        success: true,
        message: `Analyze completed successfully for ${table || 'all tables'}`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Analyze operation failed'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to perform analyze', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to perform analyze',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /database-optimization/indexes/usage
 * Obtiene análisis de uso de índices
 */
router.get('/indexes/usage', async (req, res) => {
  try {
    const usage = await indexManagerService.analyzeIndexUsage();

    res.json({
      success: true,
      data: usage,
      count: usage.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get index usage', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get index usage',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /database-optimization/indexes/recommendations
 * Obtiene recomendaciones de índices
 */
router.get('/indexes/recommendations', async (req, res) => {
  try {
    const recommendations = await indexManagerService.generateIndexRecommendations();

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get index recommendations', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get index recommendations',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/indexes/create
 * Crea un nuevo índice
 */
router.post('/indexes/create', async (req, res) => {
  try {
    const validatedData = createIndexSchema.parse(req.body);

    const result = await indexManagerService.createIndexFromRecommendation({
      table: validatedData.table,
      columns: validatedData.columns,
      type: validatedData.type,
      reason: 'Manual creation',
      expectedImprovement: 50,
      priority: 'medium'
    });

    if (result) {
      structuredLogger.info('Index created successfully', {
        name: validatedData.name,
        table: validatedData.table,
        columns: validatedData.columns,
        type: validatedData.type,
        requestId: req.headers['x-request-id'] as string || ''
      });

      res.json({
        success: true,
        message: 'Index created successfully',
        data: validatedData,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create index'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to create index', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create index',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /database-optimization/indexes/maintenance
 * Obtiene análisis de mantenimiento de índices
 */
router.get('/indexes/maintenance', async (req, res) => {
  try {
    const maintenance = await indexManagerService.analyzeIndexMaintenance();

    res.json({
      success: true,
      data: maintenance,
      count: maintenance.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get index maintenance', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get index maintenance',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/indexes/maintenance
 * Ejecuta mantenimiento de índices
 */
router.post('/indexes/maintenance', async (req, res) => {
  try {
    const { indexName } = req.body;

    const result = await indexManagerService.performIndexMaintenance(indexName);

    if (result) {
      structuredLogger.info('Index maintenance completed', {
        indexName: indexName || 'all indexes',
        requestId: req.headers['x-request-id'] as string || ''
      });

      res.json({
        success: true,
        message: `Index maintenance completed for ${indexName || 'all indexes'}`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Index maintenance failed'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to perform index maintenance', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to perform index maintenance',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /database-optimization/partitions/stats
 * Obtiene estadísticas de particiones
 */
router.get('/partitions/stats', async (req, res) => {
  try {
    const stats = partitionManagerService.getPartitionStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get partition stats', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get partition stats',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/partitions/create
 * Crea una nueva partición
 */
router.post('/partitions/create', async (req, res) => {
  try {
    const validatedData = createPartitionSchema.parse(req.body);

    const result = await partitionManagerService.createPartition(
      validatedData.tableName,
      validatedData.partitionName,
      validatedData.condition,
      validatedData.partitionType
    );

    if (result) {
      structuredLogger.info('Partition created successfully', {
        tableName: validatedData.tableName,
        partitionName: validatedData.partitionName,
        condition: validatedData.condition,
        partitionType: validatedData.partitionType,
        requestId: req.headers['x-request-id'] as string || ''
      });

      res.json({
        success: true,
        message: 'Partition created successfully',
        data: validatedData,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create partition'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to create partition', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create partition',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /database-optimization/partitions/maintenance
 * Obtiene análisis de mantenimiento de particiones
 */
router.get('/partitions/maintenance', async (req, res) => {
  try {
    const maintenance = await partitionManagerService.analyzePartitionMaintenance();

    res.json({
      success: true,
      data: maintenance,
      count: maintenance.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get partition maintenance', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get partition maintenance',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/partitions/maintenance
 * Ejecuta mantenimiento de particiones
 */
router.post('/partitions/maintenance', async (req, res) => {
  try {
    const { partitionName } = req.body;

    const result = await partitionManagerService.performPartitionMaintenance(partitionName);

    if (result) {
      structuredLogger.info('Partition maintenance completed', {
        partitionName: partitionName || 'all partitions',
        requestId: req.headers['x-request-id'] as string || ''
      });

      res.json({
        success: true,
        message: `Partition maintenance completed for ${partitionName || 'all partitions'}`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Partition maintenance failed'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to perform partition maintenance', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to perform partition maintenance',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/partitions/auto-create
 * Crea particiones automáticamente
 */
router.post('/partitions/auto-create', async (req, res) => {
  try {
    const createdCount = await partitionManagerService.createPartitionsAutomatically();

    structuredLogger.info('Automatic partition creation completed', {
      createdCount,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      message: `Automatic partition creation completed`,
      data: { createdCount },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to create partitions automatically', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create partitions automatically',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /database-optimization/partitions/cleanup
 * Elimina particiones expiradas
 */
router.post('/partitions/cleanup', async (req, res) => {
  try {
    const droppedCount = await partitionManagerService.dropExpiredPartitions();

    structuredLogger.info('Expired partitions cleanup completed', {
      droppedCount,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.json({
      success: true,
      message: `Expired partitions cleanup completed`,
      data: { droppedCount },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to cleanup expired partitions', {
      error: error instanceof Error ? error.message : String(error),
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired partitions',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
