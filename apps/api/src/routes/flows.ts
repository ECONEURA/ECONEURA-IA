import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { logger } from '@econeura/shared/logging';
import { asyncHandler, ApiError } from '../mw/problemJson.js';
import { AuthenticatedRequest } from '../mw/auth.js';
import { flowExecutionsTotal, recordFlowExecution } from '@econeura/shared/metrics';

export const flowRoutes = Router();

// Validation schemas
const StartFlowSchema = z.object({
  flow_type: z.enum(['cobro_proactivo', 'follow_up', 'reminder']),
  input_data: z.record(z.unknown()),
});

// POST /api/flows/cobro - Start cobro proactivo flow
flowRoutes.post('/cobro', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const corrId = res.locals.corr_id;
  
  // Validate request body
  const validation = StartFlowSchema.safeParse(req.body);
  if (!validation.success) {
    throw ApiError.unprocessableEntity(
      'Invalid flow request',
      { validation_errors: validation.error.issues }
    );
  }
  
  const { flow_type, input_data } = validation.data;
  
  // Ensure it's cobro_proactivo flow for this endpoint
  if (flow_type !== 'cobro_proactivo') {
    throw ApiError.badRequest('This endpoint only accepts cobro_proactivo flows');
  }
  
  logger.logFlowExecution('Starting cobro proactivo flow', {
    flow_type,
    flow_id: corrId,
    step: 'initiation',
    status: 'started',
    corr_id: corrId,
    org_id: orgId,
  });
  
  try {
    // Create flow execution record
    const flowId = uuid();
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO flow_executions (id, org_id, flow_type, status, input_data, corr_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [flowId, orgId, flow_type, 'pending', JSON.stringify(input_data), corrId]
    );
    
    // Queue the job for background processing
    await db.queryWithOrgScope(
      orgId,
      `INSERT INTO job_queue (org_id, job_type, payload, priority) 
       VALUES ($1, $2, $3, $4)`,
      [
        orgId, 
        'flow_execution',
        JSON.stringify({
          flow_id: flowId,
          flow_type,
          input_data,
          corr_id: corrId,
        }),
        1 // High priority for cobro flows
      ]
    );
    
    // Record metrics
    recordFlowExecution(orgId, flow_type, 'started');
    
    logger.logFlowExecution('Cobro proactivo flow queued successfully', {
      flow_type,
      flow_id: flowId,
      step: 'queued',
      status: 'completed',
      corr_id: corrId,
      org_id: orgId,
    });
    
    res.status(202).json({
      corr_id: corrId,
      flow_id: flowId,
      status: 'accepted',
      message: 'Cobro proactivo flow started successfully',
    });
    
  } catch (error) {
    recordFlowExecution(orgId, flow_type, 'failed');
    
    logger.error('Failed to start cobro proactivo flow', error as Error, {
      corr_id: corrId,
      org_id: orgId,
      flow_type,
    });
    
    throw ApiError.internalServerError('Failed to start flow execution');
  }
}));

// GET /api/flows/:flowId/status - Get flow status
flowRoutes.get('/:flowId/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const { flowId } = req.params;
  
  // Validate UUID format
  if (!flowId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw ApiError.badRequest('Invalid flow ID format');
  }
  
  const result = await db.queryWithOrgScope<{
    id: string;
    flow_type: string;
    status: string;
    input_data: any;
    output_data: any;
    steps_completed: string[];
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
    corr_id: string;
  }>(
    orgId,
    `SELECT id, flow_type, status, input_data, output_data, steps_completed, 
            error_message, created_at, updated_at, corr_id
     FROM flow_executions 
     WHERE id = $1 AND org_id = $2`,
    [flowId, orgId]
  );
  
  if (result.rows.length === 0) {
    throw ApiError.notFound('Flow execution');
  }
  
  const flow = result.rows[0];
  
  res.json({
    id: flow.id,
    flow_type: flow.flow_type,
    status: flow.status,
    input_data: flow.input_data,
    output_data: flow.output_data,
    steps_completed: flow.steps_completed,
    error_message: flow.error_message,
    created_at: flow.created_at,
    updated_at: flow.updated_at,
    corr_id: flow.corr_id,
  });
}));

// GET /api/flows - List flow executions for organization
flowRoutes.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  
  // Parse query parameters
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const status = req.query.status as string;
  const flowType = req.query.flow_type as string;
  
  // Build WHERE clause
  let whereClause = 'WHERE org_id = $1';
  const params: any[] = [orgId];
  let paramIndex = 2;
  
  if (status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  if (flowType) {
    whereClause += ` AND flow_type = $${paramIndex}`;
    params.push(flowType);
    paramIndex++;
  }
  
  // Get flows with pagination
  const flowsResult = await db.queryWithOrgScope<{
    id: string;
    flow_type: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    corr_id: string;
  }>(
    orgId,
    `SELECT id, flow_type, status, created_at, updated_at, corr_id
     FROM flow_executions 
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );
  
  // Get total count for pagination
  const countResult = await db.queryWithOrgScope<{ count: string }>(
    orgId,
    `SELECT COUNT(*) as count FROM flow_executions ${whereClause}`,
    params
  );
  
  const total = parseInt(countResult.rows[0]?.count || '0');
  
  res.json({
    flows: flowsResult.rows,
    pagination: {
      limit,
      offset,
      total,
      has_more: offset + flowsResult.rows.length < total,
    },
  });
}));

// POST /api/flows/:flowId/cancel - Cancel flow execution
flowRoutes.post('/:flowId/cancel', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.org!.org_id;
  const { flowId } = req.params;
  const corrId = res.locals.corr_id;
  
  if (!flowId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw ApiError.badRequest('Invalid flow ID format');
  }
  
  const result = await db.queryWithOrgScope(
    orgId,
    `UPDATE flow_executions 
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND org_id = $2 AND status IN ('pending', 'running')
     RETURNING id, flow_type, status`,
    [flowId, orgId]
  );
  
  if (result.rows.length === 0) {
    throw ApiError.notFound('Flow execution not found or cannot be cancelled');
  }
  
  const flow = result.rows[0];
  
  logger.logFlowExecution('Flow execution cancelled', {
    flow_type: flow.flow_type,
    flow_id: flowId,
    step: 'cancellation',
    status: 'completed',
    corr_id: corrId,
    org_id: orgId,
  });
  
  res.json({
    id: flowId,
    status: 'cancelled',
    message: 'Flow execution cancelled successfully',
  });
}));