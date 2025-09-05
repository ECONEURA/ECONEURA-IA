import { z } from 'zod';
import { 
  AgentDescriptor, 
  AgentContext, 
  AgentResult, 
  AgentExecutionRequest,
  AgentExecutionRecord,
  AgentExecutionStatus
} from './types.js';
import { getAgentById } from './registry.js';

// Agent execution error
export class AgentExecutionError extends Error {
  constructor(
    message: string,
    public readonly agentId: string,
    public readonly context: AgentContext,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'AgentExecutionError';
  }
}

// Agent executor class
export class AgentExecutor {
  private executions = new Map<string, AgentExecutionRecord>();

  /**
   * Execute an agent with the given inputs and context
   */
  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionRecord> {
    const { agentId, inputs, context } = request;
    
    // Find the agent
    const agent = getAgentById(agentId);
    if (!agent) {
      throw new AgentExecutionError(
        `Agent not found: ${agentId}`,
        agentId,
        context
      );
    }

    // Create execution record
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const execution: AgentExecutionRecord = {
      id: executionId,
      agentId,
      status: 'pending',
      inputs,
      context,
      startedAt: new Date(),
      retryCount: 0,
    };

    this.executions.set(executionId, execution);

    try {
      // Validate inputs
      const validatedInputs = agent.inputs.parse(inputs);
      
      // Update status to running
      execution.status = 'running';
      this.executions.set(executionId, execution);

      // Execute with timeout and retries
      const result = await this.executeWithRetries(agent, validatedInputs, context);
      
      // Validate outputs
      const validatedOutputs = agent.outputs.parse(result.data);
      
      // Update execution record
      execution.status = 'completed';
      execution.outputs = validatedOutputs;
      execution.completedAt = new Date();
      execution.costEur = result.costEur;
      execution.executionTimeMs = result.executionTimeMs;
      
      this.executions.set(executionId, execution);
      
      return execution;
      
    } catch (error) {
      // Update execution record with error
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.executions.set(executionId, execution);
      
      throw new AgentExecutionError(
        `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentId,
        context,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Execute agent with retry logic
   */
  private async executeWithRetries(
    agent: AgentDescriptor,
    inputs: unknown,
    context: AgentContext
  ): Promise<AgentResult> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= agent.policy.maxRetries; attempt++) {
      try {
        // Add timeout
        const result = await Promise.race([
          agent.run(inputs, context),
          this.createTimeoutPromise(agent.policy.maxExecutionTimeMs)
        ]);
        
        if (result.success) {
          return result;
        } else {
          lastError = new Error(result.error || 'Agent execution failed');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < agent.policy.maxRetries) {
        await this.delay(agent.policy.retryDelayMs * Math.pow(2, attempt)); // Exponential backoff
      }
    }
    
    throw lastError || new Error('Maximum retries exceeded');
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): AgentExecutionRecord | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for an organization
   */
  getExecutionsByOrg(orgId: string): AgentExecutionRecord[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.context.orgId === orgId);
  }

  /**
   * Get executions by status
   */
  getExecutionsByStatus(status: AgentExecutionStatus): AgentExecutionRecord[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.status === status);
  }

  /**
   * Cancel a running execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && (execution.status === 'pending' || execution.status === 'running')) {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      execution.error = 'Execution cancelled by user';
      this.executions.set(executionId, execution);
      return true;
    }
    return false;
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(orgId?: string): {
    total: number;
    byStatus: Record<AgentExecutionStatus, number>;
    byAgent: Record<string, number>;
    avgExecutionTime: number;
    totalCost: number;
  } {
    let executions = Array.from(this.executions.values());
    
    if (orgId) {
      executions = executions.filter(e => e.context.orgId === orgId);
    }
    
    const byStatus = executions.reduce((acc, exec) => {
      acc[exec.status] = (acc[exec.status] || 0) + 1;
      return acc;
    }, {} as Record<AgentExecutionStatus, number>);
    
    const byAgent = executions.reduce((acc, exec) => {
      acc[exec.agentId] = (acc[exec.agentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const avgExecutionTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.executionTimeMs || 0), 0) / completedExecutions.length
      : 0;
    
    const totalCost = executions.reduce((sum, e) => sum + (e.costEur || 0), 0);
    
    return {
      total: executions.length,
      byStatus,
      byAgent,
      avgExecutionTime,
      totalCost,
    };
  }

  /**
   * Clear old executions (cleanup)
   */
  clearOldExecutions(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - olderThanMs);
    let cleared = 0;
    
    for (const [id, execution] of this.executions.entries()) {
      if (execution.startedAt < cutoff && execution.status !== 'running') {
        this.executions.delete(id);
        cleared++;
      }
    }
    
    return cleared;
  }
}

// Singleton executor instance
export const agentExecutor = new AgentExecutor();