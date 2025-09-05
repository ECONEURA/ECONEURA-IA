import express from 'express';
import { z } from 'zod';
import { AGENT_REGISTRY, getAgentById, getAgentsByCategory, getAllCategories, agentExecutor } from '@econeura/agents';
import { AgentExecutionRequestSchema } from '@econeura/agents';

const router = express.Router();

// GET /v1/agents - List all available agents
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let agents = AGENT_REGISTRY;
    
    // Filter by category if provided
    if (category && typeof category === 'string') {
      agents = getAgentsByCategory(category);
    }
    
    // Search by name or description if provided
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      agents = agents.filter(agent => 
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower) ||
        agent.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Return agent metadata (without run function)
    const agentMetadata = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      version: agent.version,
      costHint: agent.costHint,
      tags: agent.tags,
      deprecated: agent.deprecated,
      policy: {
        maxExecutionTimeMs: agent.policy.maxExecutionTimeMs,
        maxRetries: agent.policy.maxRetries,
        requiresApproval: agent.policy.requiresApproval,
        costCategory: agent.policy.costCategory,
      }
    }));
    
    res.json({
      agents: agentMetadata,
      total: agentMetadata.length,
      categories: getAllCategories(),
    });
    
  } catch (error) {
    console.error('Error listing agents:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/agents/categories - List all agent categories
router.get('/categories', async (req, res) => {
  try {
    const categories = getAllCategories();
    const categoryStats = categories.map(category => {
      const agents = getAgentsByCategory(category);
      return {
        name: category,
        count: agents.length,
        agents: agents.map(a => ({ id: a.id, name: a.name }))
      };
    });
    
    res.json({
      categories: categoryStats,
      total: categories.length
    });
    
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/agents/:id - Get specific agent details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = getAgentById(id);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        message: `Agent with ID '${id}' does not exist`
      });
    }
    
    // Return agent metadata with input/output schemas
    const agentDetails = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      version: agent.version,
      costHint: agent.costHint,
      tags: agent.tags,
      deprecated: agent.deprecated,
      policy: agent.policy,
      // Note: We can't serialize Zod schemas directly, so we provide schema info
      inputSchema: 'Zod schema - see API documentation',
      outputSchema: 'Zod schema - see API documentation',
    };
    
    res.json(agentDetails);
    
  } catch (error) {
    console.error('Error getting agent details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /v1/agents/run - Execute an agent
router.post('/run', async (req, res) => {
  try {
    // Validate request body
    const requestData = AgentExecutionRequestSchema.parse(req.body);
    
    // Add correlation ID if not provided
    if (!requestData.context.correlationId) {
      requestData.context.correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Execute the agent
    const execution = await agentExecutor.executeAgent(requestData);
    
    // Return execution details
    res.status(202).json({
      executionId: execution.id,
      agentId: execution.agentId,
      status: execution.status,
      startedAt: execution.startedAt,
      correlationId: requestData.context.correlationId,
    });
    
    // Add cost tracking headers
    if (execution.costEur) {
      res.set('X-Est-Cost-EUR', execution.costEur.toString());
    }
    res.set('X-Correlation-Id', requestData.context.correlationId);
    res.set('X-Route', 'agent-execution');
    
  } catch (error) {
    console.error('Error executing agent:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid request data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/agents/runs/:id - Get execution status and results
router.get('/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const execution = agentExecutor.getExecution(id);
    
    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `Execution with ID '${id}' does not exist`
      });
    }
    
    // Check if user has access to this execution (basic org check)
    const userOrgId = req.headers['x-org-id'] as string;
    if (userOrgId && execution.context.orgId !== userOrgId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this execution'
      });
    }
    
    res.json({
      id: execution.id,
      agentId: execution.agentId,
      status: execution.status,
      inputs: execution.inputs,
      outputs: execution.outputs,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      costEur: execution.costEur,
      executionTimeMs: execution.executionTimeMs,
      error: execution.error,
      retryCount: execution.retryCount,
    });
    
    // Add cost tracking headers
    if (execution.costEur) {
      res.set('X-Est-Cost-EUR', execution.costEur.toString());
    }
    if (execution.executionTimeMs) {
      res.set('X-Latency-ms', execution.executionTimeMs.toString());
    }
    res.set('X-Correlation-Id', execution.context.correlationId);
    
  } catch (error) {
    console.error('Error getting execution status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/agents/runs - List executions for current org
router.get('/runs', async (req, res) => {
  try {
    const userOrgId = req.headers['x-org-id'] as string;
    const { status, agent_id, limit = '50', offset = '0' } = req.query;
    
    if (!userOrgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-org-id header is required'
      });
    }
    
    // Get executions for org
    let executions = agentExecutor.getExecutionsByOrg(userOrgId);
    
    // Filter by status if provided
    if (status && typeof status === 'string') {
      executions = executions.filter(e => e.status === status);
    }
    
    // Filter by agent ID if provided
    if (agent_id && typeof agent_id === 'string') {
      executions = executions.filter(e => e.agentId === agent_id);
    }
    
    // Sort by start time (newest first)
    executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string, 10) || 50;
    const offsetNum = parseInt(offset as string, 10) || 0;
    const paginatedExecutions = executions.slice(offsetNum, offsetNum + limitNum);
    
    // Return execution summaries
    const executionSummaries = paginatedExecutions.map(execution => ({
      id: execution.id,
      agentId: execution.agentId,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      costEur: execution.costEur,
      executionTimeMs: execution.executionTimeMs,
      error: execution.error,
    }));
    
    res.json({
      executions: executionSummaries,
      total: executions.length,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < executions.length,
    });
    
  } catch (error) {
    console.error('Error listing executions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /v1/agents/runs/:id - Cancel a running execution
router.delete('/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userOrgId = req.headers['x-org-id'] as string;
    
    const execution = agentExecutor.getExecution(id);
    
    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `Execution with ID '${id}' does not exist`
      });
    }
    
    // Check if user has access to this execution
    if (userOrgId && execution.context.orgId !== userOrgId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this execution'
      });
    }
    
    // Try to cancel the execution
    const cancelled = agentExecutor.cancelExecution(id);
    
    if (cancelled) {
      res.json({
        message: 'Execution cancelled successfully',
        executionId: id,
        status: 'cancelled'
      });
    } else {
      res.status(400).json({
        error: 'Cannot cancel execution',
        message: 'Execution is not in a cancellable state'
      });
    }
    
  } catch (error) {
    console.error('Error cancelling execution:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/agents/stats - Get execution statistics
router.get('/stats', async (req, res) => {
  try {
    const userOrgId = req.headers['x-org-id'] as string;
    
    if (!userOrgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-org-id header is required'
      });
    }
    
    const stats = agentExecutor.getExecutionStats(userOrgId);
    
    res.json({
      organizationId: userOrgId,
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error getting execution stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;