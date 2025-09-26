/**
 * FinOps Administration Routes
 * PR-97: FinOps ENFORCE e2e - Admin endpoints for budget management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { finOpsEnforcement } from '../middleware/finops-enforce-v2.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// ============================================================================
// SCHEMAS
// ============================================================================

const SetBudgetLimitsSchema = z.object({
  dailyLimitEUR: z.number().min(0).optional(),
  monthlyLimitEUR: z.number().min(0).optional(),
  perRequestLimitEUR: z.number().min(0).optional(),
  warningThreshold: z.number().min(0).max(1).optional(),
  criticalThreshold: z.number().min(0).max(1).optional(),
  emergencyThreshold: z.number().min(0).max(1).optional(),
});

const OrgIdSchema = z.object({
  orgId: z.string().min(1),
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Admin authentication middleware (simplified for demo)
const adminAuth = (req: Request, res: Response, next: any) => {
  const adminKey = req.headers['x-admin-key'] as string;
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Admin key required'
    });
  }
  next();
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /v1/finops-admin/status/:orgId
 * Get current cost status for an organization
 */
router.get('/status/:orgId', adminAuth, async (req: Request, res: Response) => {
  try {
    const { orgId } = OrgIdSchema.parse({ orgId: req.params.orgId });
    
    const status = await finOpsEnforcement.getCostStatus(orgId);
    
    structuredLogger.info('FinOps status requested', {
      org_id: orgId,
      requested_by: req.ip,
      status: status.status
    });
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    structuredLogger.error('Error getting FinOps status', error as Error, {
      org_id: req.params.orgId,
      requested_by: req.ip
    });
    
    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /v1/finops-admin/limits/:orgId
 * Set budget limits for an organization
 */
router.post('/limits/:orgId', adminAuth, async (req: Request, res: Response) => {
  try {
    const { orgId } = OrgIdSchema.parse({ orgId: req.params.orgId });
    const limits = SetBudgetLimitsSchema.parse(req.body);
    
    await finOpsEnforcement.setBudgetLimits(orgId, limits);
    
    const updatedStatus = await finOpsEnforcement.getCostStatus(orgId);
    
    structuredLogger.info('FinOps limits updated', {
      org_id: orgId,
      limits,
      requested_by: req.ip,
      new_status: updatedStatus.status
    });
    
    res.json({
      success: true,
      message: 'Budget limits updated successfully',
      data: updatedStatus
    });
  } catch (error) {
    structuredLogger.error('Error setting FinOps limits', error as Error, {
      org_id: req.params.orgId,
      limits: req.body,
      requested_by: req.ip
    });
    
    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /v1/finops-admin/kill-switch/:orgId/reset
 * Reset kill switch for an organization
 */
router.post('/kill-switch/:orgId/reset', adminAuth, async (req: Request, res: Response) => {
  try {
    const { orgId } = OrgIdSchema.parse({ orgId: req.params.orgId });
    
    finOpsEnforcement.resetKillSwitch(orgId);
    
    const status = await finOpsEnforcement.getCostStatus(orgId);
    
    structuredLogger.warn('FinOps kill switch reset', {
      org_id: orgId,
      requested_by: req.ip,
      previous_status: status.status
    });
    
    res.json({
      success: true,
      message: 'Kill switch reset successfully',
      data: {
        orgId,
        killSwitchActive: false,
        status: status.status
      }
    });
  } catch (error) {
    structuredLogger.error('Error resetting kill switch', error as Error, {
      org_id: req.params.orgId,
      requested_by: req.ip
    });
    
    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /v1/finops-admin/kill-switch/:orgId/status
 * Check kill switch status for an organization
 */
router.get('/kill-switch/:orgId/status', adminAuth, async (req: Request, res: Response) => {
  try {
    const { orgId } = OrgIdSchema.parse({ orgId: req.params.orgId });
    
    const isActive = finOpsEnforcement.isKillSwitchActive(orgId);
    const status = await finOpsEnforcement.getCostStatus(orgId);
    
    res.json({
      success: true,
      data: {
        orgId,
        killSwitchActive: isActive,
        status: status.status,
        currentDaily: status.currentDaily,
        currentMonthly: status.currentMonthly,
        limits: status.limits
      }
    });
  } catch (error) {
    structuredLogger.error('Error checking kill switch status', error as Error, {
      org_id: req.params.orgId,
      requested_by: req.ip
    });
    
    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /v1/finops-admin/test-budget-exceeded
 * Test endpoint to trigger budget exceeded scenario
 */
router.post('/test-budget-exceeded', adminAuth, async (req: Request, res: Response) => {
  try {
    const { orgId, cost } = z.object({
      orgId: z.string().min(1),
      cost: z.number().min(0)
    }).parse(req.body);
    
    // Set very low limits to trigger budget exceeded
    await finOpsEnforcement.setBudgetLimits(orgId, {
      dailyLimitEUR: 0.01,
      monthlyLimitEUR: 0.01,
      perRequestLimitEUR: 0.01
    });
    
    // Add cost to trigger budget exceeded
    const status = await finOpsEnforcement.getCostStatus(orgId);
    // Note: In a real implementation, we would need to add a method to manually add cost
    
    structuredLogger.info('Budget exceeded test triggered', {
      org_id: orgId,
      test_cost: cost,
      requested_by: req.ip
    });
    
    res.json({
      success: true,
      message: 'Budget exceeded test scenario configured',
      data: {
        orgId,
        testCost: cost,
        status: status.status,
        limits: status.limits
      }
    });
  } catch (error) {
    structuredLogger.error('Error in budget exceeded test', error as Error, {
      test_data: req.body,
      requested_by: req.ip
    });
    
    res.status(400).json({
      success: false,
      error: 'INVALID_REQUEST',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /v1/finops-admin/health
 * Health check for FinOps enforcement system
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: [
        'budget_enforcement',
        'kill_switch',
        'cost_tracking',
        '402_responses',
        'admin_endpoints'
      ]
    }
  });
});

export default router;
