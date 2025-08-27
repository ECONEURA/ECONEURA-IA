import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { logger } from '@econeura/shared/logging';
import { asyncHandler, ApiError } from '../mw/problemJson.js';
import { requireAdminAuth, AuthenticatedRequest } from '../mw/auth.js';
import { orgRateLimiter } from '../mw/rateLimitOrg.js';

export const adminRoutes = Router();

// All admin routes require admin authentication
adminRoutes.use(requireAdminAuth);

// Validation schemas
const UpdateOrgLimitsSchema = z.object({
  rps_limit: z.number().int().min(1).optional(),
  burst: z.number().int().min(1).optional(),
  monthly_cost_cap_eur: z.number().min(0).optional(),
  max_parallel_jobs: z.number().int().min(1).optional(),
  storage_quota_gb: z.number().int().min(1).optional(),
});

const UpdateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
});

// GET /api/admin/tenants/{orgId}/status - Get organization status
adminRoutes.get('/tenants/:orgId/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { orgId } = req.params;
  const corrId = res.locals.corr_id;
  
  logger.info('Admin: Getting organization status', {
    corr_id: corrId,
    admin_org: req.org!.org_id,
    target_org: orgId,
  });
  
  try {
    // Get organization details
    const orgResult = await db.query<{
      org_id: string;
      name: string;
      enabled: boolean;
      created_at: Date;
    }>(
      'SELECT org_id, name, enabled, created_at FROM organizations WHERE org_id = $1',
      [orgId]
    );
    
    if (orgResult.rows.length === 0) {
      throw ApiError.notFound(`Organization '${orgId}'`);
    }
    
    const org = orgResult.rows[0];
    
    // Get organization limits
    const limitsResult = await db.query<{
      rps_limit: number;
      burst: number;
      monthly_cost_cap_eur: number;
      max_parallel_jobs: number;
      storage_quota_gb: number;
    }>(
      'SELECT rps_limit, burst, monthly_cost_cap_eur, max_parallel_jobs, storage_quota_gb FROM org_limits WHERE org_id = $1',
      [orgId]
    );
    
    const limits = limitsResult.rows[0];
    
    // Get current usage stats
    const usageResult = await db.query<{
      total_requests: string;
      total_ai_cost: string;
      active_jobs: string;
    }>(
      `SELECT 
         COALESCE(SUM(http_requests), 0) as total_requests,
         COALESCE(SUM(ai_cost_eur), 0) as total_ai_cost,
         COALESCE(SUM(jobs_running), 0) as active_jobs
       FROM org_usage_daily 
       WHERE org_id = $1 AND day >= date_trunc('month', CURRENT_DATE)`,
      [orgId]
    );
    
    const usage = usageResult.rows[0];
    
    // Get active flows
    const flowsResult = await db.query<{
      flow_type: string;
      count: string;
    }>(
      `SELECT flow_type, COUNT(*) as count 
       FROM flow_executions 
       WHERE org_id = $1 AND status IN ('pending', 'running')
       GROUP BY flow_type`,
      [orgId]
    );
    
    // Get feature flags
    const flagsResult = await db.query<{
      flag: string;
      enabled: boolean;
    }>(
      'SELECT flag, enabled FROM org_feature_flags WHERE org_id = $1',
      [orgId]
    );
    
    // Get rate limiting status
    const rateLimitStatus = orgRateLimiter.getRateLimitStatus(orgId);
    
    const status = {
      organization: org,
      limits,
      current_usage: {
        http_requests_month: parseInt(usage.total_requests || '0'),
        ai_cost_eur_month: parseFloat(usage.total_ai_cost || '0'),
        active_jobs: parseInt(usage.active_jobs || '0'),
        cost_utilization_percent: limits ? 
          Math.round((parseFloat(usage.total_ai_cost || '0') / limits.monthly_cost_cap_eur) * 100) : 0,
      },
      active_flows: flowsResult.rows.reduce((acc, row) => {
        acc[row.flow_type] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      feature_flags: flagsResult.rows.reduce((acc, row) => {
        acc[row.flag] = row.enabled;
        return acc;
      }, {} as Record<string, boolean>),
      rate_limit: rateLimitStatus,
      last_updated: new Date().toISOString(),
    };
    
    res.json(status);
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Failed to get organization status', error as Error, {
      corr_id: corrId,
      admin_org: req.org!.org_id,
      target_org: orgId,
    });
    
    throw ApiError.internalServerError('Failed to retrieve organization status');
  }
}));

// GET /api/admin/tenants/{orgId}/usage - Get detailed usage statistics
adminRoutes.get('/tenants/:orgId/usage', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { orgId } = req.params;
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  
  const usageResult = await db.query<{
    day: Date;
    http_requests: number;
    ai_cost_eur: number;
    jobs_enqueued: number;
    jobs_running: number;
  }>(
    `SELECT day, http_requests, ai_cost_eur, jobs_enqueued, jobs_running
     FROM org_usage_daily 
     WHERE org_id = $1 AND day >= CURRENT_DATE - INTERVAL '${days} days'
     ORDER BY day DESC`,
    [orgId]
  );
  
  res.json({
    org_id: orgId,
    period_days: days,
    daily_usage: usageResult.rows,
    summary: {
      total_requests: usageResult.rows.reduce((sum, day) => sum + day.http_requests, 0),
      total_ai_cost_eur: usageResult.rows.reduce((sum, day) => sum + Number(day.ai_cost_eur), 0),
      avg_daily_requests: Math.round(
        usageResult.rows.reduce((sum, day) => sum + day.http_requests, 0) / Math.max(usageResult.rows.length, 1)
      ),
    },
  });
}));

// PUT /api/admin/tenants/{orgId}/limits - Update organization limits
adminRoutes.put('/tenants/:orgId/limits', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { orgId } = req.params;
  const corrId = res.locals.corr_id;
  
  const validation = UpdateOrgLimitsSchema.safeParse(req.body);
  if (!validation.success) {
    throw ApiError.unprocessableEntity(
      'Invalid limits update request',
      { validation_errors: validation.error.issues }
    );
  }
  
  const updates = validation.data;
  
  logger.info('Admin: Updating organization limits', {
    corr_id: corrId,
    admin_org: req.org!.org_id,
    target_org: orgId,
    updates,
  });
  
  try {
    // Check if organization exists
    const orgExists = await db.query(
      'SELECT 1 FROM organizations WHERE org_id = $1',
      [orgId]
    );
    
    if (orgExists.rows.length === 0) {
      throw ApiError.notFound(`Organization '${orgId}'`);
    }
    
    // Build dynamic update query
    const setParts: string[] = [];
    const values: any[] = [orgId];
    let paramIndex = 2;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setParts.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });
    
    if (setParts.length === 0) {
      throw ApiError.badRequest('No valid updates provided');
    }
    
    const updateQuery = `
      UPDATE org_limits 
      SET ${setParts.join(', ')}
      WHERE org_id = $1
      RETURNING rps_limit, burst, monthly_cost_cap_eur, max_parallel_jobs, storage_quota_gb
    `;
    
    const result = await db.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      throw ApiError.notFound(`Limits for organization '${orgId}'`);
    }
    
    const updatedLimits = result.rows[0];
    
    // Update rate limiter cache if RPS or burst changed
    if (updates.rps_limit !== undefined || updates.burst !== undefined) {
      await orgRateLimiter.updateOrgLimits(
        orgId,
        updates.rps_limit || updatedLimits.rps_limit,
        updates.burst || updatedLimits.burst
      );
    }
    
    logger.info('Organization limits updated successfully', {
      corr_id: corrId,
      admin_org: req.org!.org_id,
      target_org: orgId,
      updated_limits: updatedLimits,
    });
    
    res.json({
      org_id: orgId,
      limits: updatedLimits,
      updated_at: new Date().toISOString(),
    });
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Failed to update organization limits', error as Error, {
      corr_id: corrId,
      admin_org: req.org!.org_id,
      target_org: orgId,
    });
    
    throw ApiError.internalServerError('Failed to update organization limits');
  }
}));

// PATCH /api/admin/flags/{flag} - Update feature flag for organization
adminRoutes.patch('/flags/:flag', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { flag } = req.params;
  const orgId = req.header('x-org-id');
  const corrId = res.locals.corr_id;
  
  if (!orgId) {
    throw ApiError.badRequest('x-org-id header is required for feature flag operations');
  }
  
  const validation = UpdateFeatureFlagSchema.safeParse(req.body);
  if (!validation.success) {
    throw ApiError.unprocessableEntity(
      'Invalid feature flag request',
      { validation_errors: validation.error.issues }
    );
  }
  
  const { enabled } = validation.data;
  
  logger.info('Admin: Updating feature flag', {
    corr_id: corrId,
    admin_org: req.org!.org_id,
    target_org: orgId,
    flag,
    enabled,
  });
  
  try {
    const result = await db.query(
      `INSERT INTO org_feature_flags (org_id, flag, enabled) 
       VALUES ($1, $2, $3)
       ON CONFLICT (org_id, flag) 
       DO UPDATE SET enabled = EXCLUDED.enabled
       RETURNING org_id, flag, enabled`,
      [orgId, flag, enabled]
    );
    
    const featureFlag = result.rows[0];
    
    logger.info('Feature flag updated successfully', {
      corr_id: corrId,
      admin_org: req.org!.org_id,
      target_org: orgId,
      flag,
      enabled,
    });
    
    res.json(featureFlag);
    
  } catch (error) {
    logger.error('Failed to update feature flag', error as Error, {
      corr_id: corrId,
      admin_org: req.org!.org_id,
      target_org: orgId,
      flag,
    });
    
    throw ApiError.internalServerError('Failed to update feature flag');
  }
}));

// POST /api/admin/flags/{flag}/kill - Emergency kill switch for feature flag
adminRoutes.post('/flags/:flag/kill', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { flag } = req.params;
  const corrId = res.locals.corr_id;
  
  logger.warn('Admin: Emergency kill switch activated', {
    corr_id: corrId,
    admin_org: req.org!.org_id,
    flag,
  });
  
  try {
    const result = await db.query(
      'UPDATE org_feature_flags SET enabled = false WHERE flag = $1 RETURNING org_id',
      [flag]
    );
    
    const affectedOrgs = result.rowCount || 0;
    
    logger.warn('Feature flag killed globally', {
      corr_id: corrId,
      admin_org: req.org!.org_id,
      flag,
      affected_orgs: affectedOrgs,
    });
    
    res.json({
      status: 'disabled',
      flag,
      affected_orgs: affectedOrgs,
      killed_at: new Date().toISOString(),
      killed_by: req.org!.org_id,
    });
    
  } catch (error) {
    logger.error('Failed to kill feature flag', error as Error, {
      corr_id: corrId,
      admin_org: req.org!.org_id,
      flag,
    });
    
    throw ApiError.internalServerError('Failed to disable feature flag');
  }
}));

// GET /api/admin/health - Admin health check with system stats
adminRoutes.get('/health', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const dbHealth = await db.healthCheck();
  const poolStats = db.getPoolStats();
  
  // Get system stats
  const [orgCount, jobCount, activeFlows] = await Promise.all([
    db.query<{ count: string }>('SELECT COUNT(*) as count FROM organizations WHERE enabled = true'),
    db.query<{ count: string }>('SELECT COUNT(*) as count FROM job_queue WHERE lease_until IS NULL OR lease_until < NOW()'),
    db.query<{ count: string }>('SELECT COUNT(*) as count FROM flow_executions WHERE status IN (\'pending\', \'running\')'),
  ]);
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    connection_pool: poolStats,
    system_stats: {
      active_organizations: parseInt(orgCount.rows[0]?.count || '0'),
      pending_jobs: parseInt(jobCount.rows[0]?.count || '0'),
      active_flows: parseInt(activeFlows.rows[0]?.count || '0'),
    },
    admin_org: req.org!.org_id,
  });
}));