/**
 * Advanced CI/CD API Routes
 * 
 * This module provides comprehensive API endpoints for the advanced CI/CD system,
 * including deployment orchestration, rollback mechanisms, and deployment analytics.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { AdvancedCICDService, Environment } from '../services/advanced-cicd.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();
const cicdService = new AdvancedCICDService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateDeploymentSchema = z.object({
  version: z.string().min(1),
  environment: z.enum(['dev', 'staging', 'prod']),
  strategy: z.enum(['blue_green', 'rolling', 'canary', 'recreate']),
  triggeredBy: z.string().min(1),
  commitSha: z.string().min(1),
  branch: z.string().min(1),
  buildNumber: z.string().min(1),
  artifacts: z.object({
    api: z.string(),
    web: z.string(),
    workers: z.string()
  })
});

const CreateArtifactSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  type: z.enum(['api', 'web', 'workers', 'infrastructure']),
  size: z.number().positive(),
  checksum: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

const RecordTestResultSchema = z.object({
  type: z.enum(['unit', 'integration', 'e2e', 'performance', 'security']),
  status: z.enum(['passed', 'failed', 'skipped']),
  duration: z.number().positive(),
  coverage: z.number().min(0).max(100).optional(),
  results: z.object({
    total: z.number().min(0),
    passed: z.number().min(0),
    failed: z.number().min(0),
    skipped: z.number().min(0)
  }),
  artifacts: z.array(z.string()).optional()
});

const UpdateConfigSchema = z.object({
  strategy: z.enum(['blue_green', 'rolling', 'canary', 'recreate']).optional(),
  healthCheckTimeout: z.number().positive().optional(),
  rollbackThreshold: z.number().min(0).max(1).optional(),
  canaryPercentage: z.number().min(0).max(100).optional(),
  autoRollback: z.boolean().optional(),
  notifications: z.object({
    slack: z.string().optional(),
    teams: z.string().optional(),
    email: z.array(z.string().email()).optional()
  }).optional()
});

// ============================================================================
// DEPLOYMENT ENDPOINTS
// ============================================================================

/**
 * Create a new deployment
 * POST /api/cicd/deployments
 */
router.post('/deployments', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateDeploymentSchema.parse(req.body);
    
    const deployment = await cicdService.createDeployment(
      validatedData.version,
      validatedData.environment,
      validatedData.strategy,
      validatedData.triggeredBy,
      validatedData.commitSha,
      validatedData.branch,
      validatedData.buildNumber,
      validatedData.artifacts
    );
    
    structuredLogger.info('Deployment created via API', {
      operation: 'deployment_create_api',
      deploymentId: deployment.id,
      version: deployment.version,
      environment: deployment.environment
    });
    
    res.status(201).json({
      success: true,
      data: deployment
    });
  } catch (error) {
    structuredLogger.error('Failed to create deployment', error as Error, {
      operation: 'deployment_create_api',
      body: req.body
    });
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create deployment'
      });
    }
  }
});

/**
 * Get all deployments
 * GET /api/cicd/deployments
 */
router.get('/deployments', async (req: Request, res: Response) => {
  try {
    const { environment, status, strategy, limit = '50', offset = '0' } = req.query;
    
    // This would be implemented with proper filtering in a real scenario
    const deployments = Array.from((cicdService as any).deployments.values());
    
    let filteredDeployments = deployments;
    
    if (environment) {
      filteredDeployments = filteredDeployments.filter((d: any) => d.environment === environment);
    }
    if (status) {
      filteredDeployments = filteredDeployments.filter((d: any) => d.status === status);
    }
    if (strategy) {
      filteredDeployments = filteredDeployments.filter((d: any) => d.strategy === strategy);
    }
    
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedDeployments = filteredDeployments
      .sort((a: any, b: any) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      data: paginatedDeployments,
      pagination: {
        total: filteredDeployments.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < filteredDeployments.length
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get deployments', error as Error, {
      operation: 'deployments_get',
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get deployments'
    });
  }
});

/**
 * Get a specific deployment
 * GET /api/cicd/deployments/:deploymentId
 */
router.get('/deployments/:deploymentId', async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    
    const deployment = (cicdService as any).deployments.get(deploymentId);
    
    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }
    
    res.json({
      success: true,
      data: deployment
    });
  } catch (error) {
    structuredLogger.error('Failed to get deployment', error as Error, {
      operation: 'deployment_get',
      deploymentId: req.params.deploymentId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment'
    });
  }
});

/**
 * Execute a deployment
 * POST /api/cicd/deployments/:deploymentId/execute
 */
router.post('/deployments/:deploymentId/execute', async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    
    const deployment = await cicdService.executeDeployment(deploymentId);
    
    structuredLogger.info('Deployment executed via API', {
      operation: 'deployment_execute_api',
      deploymentId,
      status: deployment.status
    });
    
    res.json({
      success: true,
      data: deployment
    });
  } catch (error) {
    structuredLogger.error('Failed to execute deployment', error as Error, {
      operation: 'deployment_execute_api',
      deploymentId: req.params.deploymentId
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute deployment'
    });
  }
});

/**
 * Rollback a deployment
 * POST /api/cicd/deployments/:deploymentId/rollback
 */
router.post('/deployments/:deploymentId/rollback', async (req: Request, res: Response) => {
  try {
    const { deploymentId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rollback reason is required'
      });
    }
    
    const deployment = await cicdService.rollbackDeployment(deploymentId, reason);
    
    structuredLogger.info('Deployment rolled back via API', {
      operation: 'deployment_rollback_api',
      deploymentId,
      reason
    });
    
    res.json({
      success: true,
      data: deployment
    });
  } catch (error) {
    structuredLogger.error('Failed to rollback deployment', error as Error, {
      operation: 'deployment_rollback_api',
      deploymentId: req.params.deploymentId
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rollback deployment'
    });
  }
});

// ============================================================================
// ARTIFACT ENDPOINTS
// ============================================================================

/**
 * Create a build artifact
 * POST /api/cicd/artifacts
 */
router.post('/artifacts', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateArtifactSchema.parse(req.body);
    
    const artifact = await cicdService.createBuildArtifact(
      validatedData.name,
      validatedData.version,
      validatedData.type,
      validatedData.size,
      validatedData.checksum,
      validatedData.metadata
    );
    
    structuredLogger.info('Artifact created via API', {
      operation: 'artifact_create_api',
      artifactId: artifact.id,
      name: artifact.name,
      type: artifact.type
    });
    
    res.status(201).json({
      success: true,
      data: artifact
    });
  } catch (error) {
    structuredLogger.error('Failed to create artifact', error as Error, {
      operation: 'artifact_create_api',
      body: req.body
    });
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create artifact'
      });
    }
  }
});

/**
 * Get build artifacts
 * GET /api/cicd/artifacts
 */
router.get('/artifacts', async (req: Request, res: Response) => {
  try {
    const { type, version, name, limit = '50', offset = '0' } = req.query;
    
    const filters = {
      type: type as any,
      version: version as string,
      name: name as string
    };
    
    const artifacts = await cicdService.getArtifacts(filters);
    
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedArtifacts = artifacts.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      data: paginatedArtifacts,
      pagination: {
        total: artifacts.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < artifacts.length
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get artifacts', error as Error, {
      operation: 'artifacts_get',
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get artifacts'
    });
  }
});

// ============================================================================
// TEST RESULTS ENDPOINTS
// ============================================================================

/**
 * Record test result
 * POST /api/cicd/test-results
 */
router.post('/test-results', async (req: Request, res: Response) => {
  try {
    const validatedData = RecordTestResultSchema.parse(req.body);
    
    const testResult = await cicdService.recordTestResult(
      validatedData.type,
      validatedData.status,
      validatedData.duration,
      validatedData.results,
      validatedData.coverage,
      validatedData.artifacts
    );
    
    structuredLogger.info('Test result recorded via API', {
      operation: 'test_result_record_api',
      testId: testResult.id,
      type: testResult.type,
      status: testResult.status
    });
    
    res.status(201).json({
      success: true,
      data: testResult
    });
  } catch (error) {
    structuredLogger.error('Failed to record test result', error as Error, {
      operation: 'test_result_record_api',
      body: req.body
    });
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to record test result'
      });
    }
  }
});

/**
 * Get test results
 * GET /api/cicd/test-results
 */
router.get('/test-results', async (req: Request, res: Response) => {
  try {
    const { type, status, since, limit = '50', offset = '0' } = req.query;
    
    const filters = {
      type: type as any,
      status: status as any,
      since: since ? new Date(since as string) : undefined
    };
    
    const testResults = await cicdService.getTestResults(filters);
    
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedResults = testResults.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        total: testResults.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < testResults.length
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get test results', error as Error, {
      operation: 'test_results_get',
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get test results'
    });
  }
});

// ============================================================================
// CONFIGURATION ENDPOINTS
// ============================================================================

/**
 * Update deployment configuration
 * PUT /api/cicd/config/:environment
 */
router.put('/config/:environment', async (req: Request, res: Response) => {
  try {
    const { environment } = req.params;
    const validatedData = UpdateConfigSchema.parse(req.body);
    
    if (!['dev', 'staging', 'prod'].includes(environment)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid environment'
      });
    }
    
    await cicdService.updateDeploymentConfig(environment as Environment, validatedData);
    
    structuredLogger.info('Deployment configuration updated via API', {
      operation: 'config_update_api',
      environment,
      changes: Object.keys(validatedData)
    });
    
    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to update configuration', error as Error, {
      operation: 'config_update_api',
      environment: req.params.environment,
      body: req.body
    });
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration'
      });
    }
  }
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * Get deployment analytics
 * GET /api/cicd/analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { environment } = req.query;
    
    const analytics = await cicdService.getDeploymentAnalytics(environment as Environment);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    structuredLogger.error('Failed to get deployment analytics', error as Error, {
      operation: 'analytics_get',
      query: req.query
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment analytics'
    });
  }
});

/**
 * Get service statistics
 * GET /api/cicd/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cicdService.getServiceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    structuredLogger.error('Failed to get service stats', error as Error, {
      operation: 'stats_get'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get service stats'
    });
  }
});

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

/**
 * Get deployment health status
 * GET /api/cicd/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await cicdService.getServiceStats();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        cicd: 'operational',
        deployments: stats.activeDeployments > 0 ? 'active' : 'idle',
        artifacts: 'operational',
        tests: 'operational'
      },
      metrics: {
        totalDeployments: stats.totalDeployments,
        activeDeployments: stats.activeDeployments,
        totalArtifacts: stats.totalArtifacts,
        totalTestResults: stats.totalTestResults
      }
    };
    
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    structuredLogger.error('Failed to get health status', error as Error, {
      operation: 'health_get'
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get health status'
    });
  }
});

export default router;
