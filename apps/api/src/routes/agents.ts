import { Router } from 'express';
import { z } from 'zod';
import { PaginationRequestSchema } from '@econeura/shared/src/schemas/common';
import { db } from '../lib/database.js';
import { agentRuns, agentTasks } from '@econeura/db/src/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { structuredLogger } from '../lib/structured-logger.js';
import { v4 as uuidv4 } from 'uuid';
import { aiAgentsRegistry, AgentExecutionRequest } from '../lib/ai-agents-registry.service.js';
import { agentRuntime } from '../lib/agent-runtime.service.js';

const router = Router();

// In-memory agent execution store (should be replaced with Redis in production)
const executionStore = new Map<string, any>();

// GET /v1/agents - List available agents
router.get('/', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Get agents from registry
    const agents = aiAgentsRegistry.getAgents();
    
    // Add cost estimates and FinOps headers
    const costEur = 0.001 * agents.length; // Estimate for listing agents
    
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '1.2',
      'X-Latency-ms': '45',
      'X-Route': 'local',
      'X-Correlation-Id': req.headers['x-correlation-id'] || uuidv4()
    });

    structuredLogger.info('Agent registry retrieved', {
      orgId,
      count: agents.length,
      costEur
    });

    res.json({
      success: true,
      data: agents,
      count: agents.length,
      categories: {
        ejecutivo: agents.filter(a => a.category === 'ejecutivo').length,
        ventas: agents.filter(a => a.category === 'ventas').length,
        marketing: agents.filter(a => a.category === 'marketing').length,
        operaciones: agents.filter(a => a.category === 'operaciones').length,
        finanzas: agents.filter(a => a.category === 'finanzas').length,
        soporte_qa: agents.filter(a => a.category === 'soporte_qa').length
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve agent registry', error as Error, {
      orgId: req.headers['x-org-id']
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve agent registry',
      message: (error as Error).message 
    });
  }
});

// POST /v1/agents/run - Execute an agent
router.post('/run', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    const { agentId, inputs, idempotencyKey, budget, priority } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    // Check if agent exists
    const agent = aiAgentsRegistry.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `Agent ${agentId} is not available`
      });
    }

    // Create execution request
    const executionRequest: AgentExecutionRequest = {
      agentId,
      inputs,
      context: {
        orgId,
        userId: userId || 'system',
        correlationId,
        idempotencyKey,
        budget,
        priority
      }
    };

    // Submit task to runtime
    const task = await agentRuntime.submitTask(executionRequest);

    // Estimate cost based on agent type
    const baseCosts = { low: 0.01, medium: 0.05, high: 0.15 };
    const estimatedCost = baseCosts[agent.costHint] || 0.05;

    // Add FinOps headers
    res.set({
      'X-Est-Cost-EUR': estimatedCost.toFixed(4),
      'X-Budget-Pct': '2.5',
      'X-Latency-ms': '120',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    structuredLogger.info('Agent execution started', {
      orgId,
      userId,
      correlationId,
      taskId: task.id,
      agentId,
      estimatedCostEur: estimatedCost
    });

    res.status(202).json({
      success: true,
      data: {
        executionId: task.id,
        agentId,
        status: task.status,
        startedAt: task.createdAt,
        estimatedCostEur: estimatedCost
      },
      message: 'Agent execution started'
    });

  } catch (error) {
    structuredLogger.error('Failed to start agent execution', error as Error, {
      orgId: req.headers['x-org-id'],
      userId: req.headers['x-user-id'],
      body: req.body
    });
    
    res.status(500).json({ 
      error: 'Failed to start agent execution',
      message: (error as Error).message 
    });
  }
});

// GET /v1/agents/runs/:id - Get agent execution status
router.get('/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Try to get from database first
    const [dbRecord] = await db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.id, id))
      .limit(1);

    if (!dbRecord) {
      return res.status(404).json({ 
        error: 'Execution not found',
        message: `Agent execution with ID ${id} not found or access denied`
      });
    }

    // Get from memory store for real-time status
    const memoryRecord = executionStore.get(id);
    
    const executionRecord = {
      id: dbRecord.id,
      agentId: dbRecord.agentId,
      status: dbRecord.status,
      inputs: JSON.parse(dbRecord.inputs),
      outputs: dbRecord.outputs ? JSON.parse(dbRecord.outputs) : undefined,
      context: JSON.parse(dbRecord.context),
      startedAt: dbRecord.startedAt,
      completedAt: dbRecord.completedAt,
      costEur: dbRecord.costEur,
      executionTimeMs: dbRecord.executionTimeMs,
      error: dbRecord.error,
      retryCount: dbRecord.retryCount
    };

    // Add real-time info from memory if available
    if (memoryRecord && memoryRecord.status === 'running') {
      executionRecord.status = 'running';
    }

    structuredLogger.info('Agent execution status retrieved', { 
      orgId, 
      executionId: id,
      status: executionRecord.status
    });

    res.json({
      success: true,
      data: executionRecord
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve agent execution', error as Error, {
      orgId: req.headers['x-org-id'],
      executionId: req.params.id
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve agent execution',
      message: (error as Error).message 
    });
  }
});

// GET /v1/agents/runs - List agent executions
router.get('/runs', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string;
    if (!orgId) {
      return res.status(400).json({ error: 'Missing x-org-id header' });
    }

    // Validate query parameters
    const pagination = PaginationRequestSchema.parse(req.query);
    const { agentId, status } = req.query;

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${orgId}'`);

    // Build query with filters
    let query = db.select().from(agentRuns);
    
    const conditions = [];
    
    if (agentId) {
      conditions.push(eq(agentRuns.agentId, agentId as string));
    }
    
    if (status) {
      conditions.push(eq(agentRuns.status, status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by creation date (most recent first)
    query = query.orderBy(desc(agentRuns.createdAt));

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit).offset(offset);

    const result = await query;

    // Get total count for pagination
    const totalQuery = db.select({ count: count() }).from(agentRuns);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const [{ count: total }] = await totalQuery;

    // Parse JSON fields
    const executions = result.map(record => ({
      ...record,
      inputs: JSON.parse(record.inputs),
      outputs: record.outputs ? JSON.parse(record.outputs) : undefined,
      context: JSON.parse(record.context)
    }));

    structuredLogger.info('Agent executions retrieved', {
      orgId,
      count: executions.length,
      total,
      filters: { agentId, status }
    });

    res.json({
      success: true,
      data: executions,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    });

  } catch (error) {
    structuredLogger.error('Failed to retrieve agent executions', error as Error, {
      orgId: req.headers['x-org-id'],
      query: req.query
    });
    
    res.status(500).json({ 
      error: 'Failed to retrieve agent executions',
      message: (error as Error).message 
    });
  }
});

// Simulate agent execution (replace with actual implementation)
async function executeAgent(executionId: string, agentId: string, inputs: any, context: any) {
  try {
    // Update status to running
    const record = executionStore.get(executionId);
    if (record) {
      record.status = 'running';
      executionStore.set(executionId, record);
    }

    // Set RLS context
    await db.execute(`SET LOCAL app.org_id = '${context.orgId}'`);

    // Update database
    await db.update(agentRuns)
      .set({ 
        status: 'running',
        updatedAt: new Date().toISOString()
      })
      .where(eq(agentRuns.id, executionId));

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate agent execution based on type
    let outputs: any = {};
    let costEur = 0;

    switch (agentId) {
      case 'lead-enrich':
        outputs = {
          enrichedData: {
            company: 'Example Corp',
            industry: 'Technology',
            employees: 150,
            revenue: '$10M'
          },
          confidence: 0.85
        };
        costEur = 0.02;
        break;
      
      case 'invoice-extract':
        outputs = {
          extractedData: {
            invoiceNumber: 'INV-2025-0001',
            amount: 1250.00,
            dueDate: '2025-02-15',
            vendor: 'Supplier Inc'
          },
          accuracy: 0.92
        };
        costEur = 0.05;
        break;
      
      case 'email-draft':
        outputs = {
          subject: 'Following up on our conversation',
          body: 'Hi [Name], I wanted to follow up on our discussion about [Topic]...',
          personalization: {
            tone: 'professional',
            references: ['previous meeting', 'company news']
          }
        };
        costEur = 0.01;
        break;
      
      case 'ar-prioritize':
        outputs = {
          prioritizedList: [
            { invoiceId: 'inv-1', priority: 'high', score: 0.9 },
            { invoiceId: 'inv-2', priority: 'medium', score: 0.6 }
          ],
          recommendations: [
            'Contact customer immediately for inv-1',
            'Send reminder email for inv-2'
          ]
        };
        costEur = 0.03;
        break;
      
      default:
        throw new Error(`Unknown agent: ${agentId}`);
    }

    const completedAt = new Date();
    const executionTimeMs = completedAt.getTime() - record.startedAt.getTime();

    // Update record
    if (record) {
      record.status = 'completed';
      record.outputs = outputs;
      record.completedAt = completedAt;
      record.costEur = costEur;
      record.executionTimeMs = executionTimeMs;
      executionStore.set(executionId, record);
    }

    // Update database
    await db.update(agentRuns)
      .set({ 
        status: 'completed',
        outputs: JSON.stringify(outputs),
        completedAt: completedAt.toISOString(),
        costEur,
        executionTimeMs,
        updatedAt: new Date().toISOString()
      })
      .where(eq(agentRuns.id, executionId));

    structuredLogger.info('Agent execution completed', {
      orgId: context.orgId,
      executionId,
      agentId,
      executionTimeMs,
      costEur
    });

  } catch (error) {
    // Update status to failed
    const record = executionStore.get(executionId);
    if (record) {
      record.status = 'failed';
      record.error = (error as Error).message;
      record.completedAt = new Date();
      executionStore.set(executionId, record);
    }

    // Update database
    await db.update(agentRuns)
      .set({ 
        status: 'failed',
        error: (error as Error).message,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(agentRuns.id, executionId));

    structuredLogger.error('Agent execution failed', error as Error, {
      orgId: context.orgId,
      executionId,
      agentId
    });
  }
}

export { router as agentsRouter };
