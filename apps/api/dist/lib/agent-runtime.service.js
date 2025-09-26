import { EventEmitter } from 'events';

import { z } from 'zod';
import { EnhancedAIRouter } from '@econeura/shared/src/ai/enhanced-router.js';
import { agentTasks } from '@econeura/db/src/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { db } from './database.js';
import { structuredLogger } from './structured-logger.js';
import { aiAgentsRegistry } from './ai-agents-registry.service.js';
export const AgentRuntimeConfigSchema = z.object({
    maxConcurrentExecutions: z.number().default(50),
    defaultTimeoutMs: z.number().default(30000),
    maxRetries: z.number().default(3),
    retryDelayMs: z.number().default(1000),
    healthCheckIntervalMs: z.number().default(30000),
    cleanupIntervalMs: z.number().default(300000),
    maxExecutionHistory: z.number().default(1000),
    enableMetrics: z.boolean().default(true),
    enableTracing: z.boolean().default(true)
});
export const AgentTaskSchema = z.object({
    id: z.string(),
    agentId: z.string(),
    inputs: z.record(z.any()),
    context: z.object({
        orgId: z.string(),
        userId: z.string(),
        correlationId: z.string(),
        idempotencyKey: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        budget: z.number().optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
    }),
    status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    scheduledAt: z.string().optional(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
    retryCount: z.number().default(0),
    maxRetries: z.number().default(3),
    timeoutMs: z.number().default(30000),
    dependencies: z.array(z.string()).optional(),
    outputs: z.record(z.any()).optional(),
    error: z.string().optional(),
    costEur: z.number().optional(),
    executionTimeMs: z.number().optional(),
    createdAt: z.string(),
    updatedAt: z.string()
});
export const AgentRuntimeMetricsSchema = z.object({
    totalExecutions: z.number(),
    successfulExecutions: z.number(),
    failedExecutions: z.number(),
    cancelledExecutions: z.number(),
    averageExecutionTime: z.number(),
    averageCost: z.number(),
    totalCost: z.number(),
    activeExecutions: z.number(),
    queuedTasks: z.number(),
    systemHealth: z.enum(['healthy', 'degraded', 'unhealthy']),
    lastUpdated: z.string()
});
export class AgentRuntimeService extends EventEmitter {
    config;
    aiRouter;
    taskQueue = new Map();
    activeExecutions = new Map();
    executionHistory = [];
    metrics;
    isRunning = false;
    healthCheckInterval;
    cleanupInterval;
    workerPool = [];
    constructor(config = {}) {
        super();
        this.config = AgentRuntimeConfigSchema.parse(config);
        this.aiRouter = new EnhancedAIRouter();
        this.metrics = {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            cancelledExecutions: 0,
            averageExecutionTime: 0,
            averageCost: 0,
            totalCost: 0,
            activeExecutions: 0,
            queuedTasks: 0,
            systemHealth: 'healthy',
            lastUpdated: new Date().toISOString()
        };
        this.setupEventHandlers();
    }
    async start() {
        if (this.isRunning) {
            throw new Error('Agent runtime is already running');
        }
        this.isRunning = true;
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckIntervalMs);
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupIntervalMs);
        await this.loadPendingTasks();
        this.startTaskProcessing();
        structuredLogger.info('Agent runtime started', {
            config: this.config,
            metrics: this.metrics
        });
        this.emit('runtime:started');
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        for (const [taskId, task] of this.activeExecutions) {
            await this.cancelTask(taskId, 'Runtime shutdown');
        }
        const shutdownTimeout = 10000;
        const startTime = Date.now();
        while (this.activeExecutions.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        structuredLogger.info('Agent runtime stopped', {
            finalMetrics: this.metrics
        });
        this.emit('runtime:stopped');
    }
    async submitTask(request) {
        const agent = aiAgentsRegistry.getAgent(request.agentId);
        if (!agent) {
            throw new Error(`Agent ${request.agentId} not found`);
        }
        if (request.context.idempotencyKey) {
            const existingTask = await this.findTaskByIdempotencyKey(request.context.idempotencyKey, request.context.orgId);
            if (existingTask) {
                structuredLogger.info('Task already exists (idempotent)', {
                    taskId: existingTask.id,
                    agentId: request.agentId,
                    idempotencyKey: request.context.idempotencyKey
                });
                return existingTask;
            }
        }
        const taskId = uuidv4();
        const now = new Date().toISOString();
        const task = {
            id: taskId,
            agentId: request.agentId,
            inputs: request.inputs,
            context: request.context,
            status: 'pending',
            priority: request.context.priority || agent.priority,
            retryCount: 0,
            maxRetries: this.config.maxRetries,
            timeoutMs: agent.timeoutMs || this.config.defaultTimeoutMs,
            dependencies: agent.dependencies,
            createdAt: now,
            updatedAt: now
        };
        if (task.dependencies && task.dependencies.length > 0) {
            const dependencyStatus = await this.checkDependencies(task.dependencies);
            if (!dependencyStatus.allCompleted) {
                task.status = 'pending';
            }
        }
        this.taskQueue.set(taskId, task);
        await this.persistTask(task);
        this.metrics.queuedTasks = this.taskQueue.size;
        this.metrics.lastUpdated = new Date().toISOString();
        structuredLogger.info('Task submitted', {
            taskId,
            agentId: request.agentId,
            priority: task.priority,
            orgId: request.context.orgId
        });
        this.emit('task:created', task);
        return task;
    }
    async getTaskStatus(taskId) {
        const activeTask = this.activeExecutions.get(taskId);
        if (activeTask) {
            return activeTask;
        }
        const queuedTask = this.taskQueue.get(taskId);
        if (queuedTask) {
            return queuedTask;
        }
        return await this.loadTaskFromDatabase(taskId);
    }
    async cancelTask(taskId, reason = 'User requested') {
        const task = this.activeExecutions.get(taskId) || this.taskQueue.get(taskId);
        if (!task) {
            return false;
        }
        task.status = 'cancelled';
        task.completedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();
        task.error = reason;
        this.activeExecutions.delete(taskId);
        this.taskQueue.delete(taskId);
        await this.updateTaskInDatabase(task);
        this.metrics.cancelledExecutions++;
        this.metrics.activeExecutions = this.activeExecutions.size;
        this.metrics.queuedTasks = this.taskQueue.size;
        this.metrics.lastUpdated = new Date().toISOString();
        structuredLogger.info('Task cancelled', {
            taskId,
            agentId: task.agentId,
            reason
        });
        this.emit('task:cancelled', task);
        return true;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getActiveExecutions() {
        return Array.from(this.activeExecutions.values());
    }
    getQueuedTasks() {
        return Array.from(this.taskQueue.values());
    }
    getExecutionHistory(limit = 100) {
        return this.executionHistory.slice(-limit);
    }
    setupEventHandlers() {
        this.on('task:completed', (task) => {
            this.metrics.successfulExecutions++;
            this.updateAverageMetrics(task);
        });
        this.on('task:failed', (task) => {
            this.metrics.failedExecutions++;
            this.updateAverageMetrics(task);
        });
        this.on('task:cancelled', (task) => {
            this.metrics.cancelledExecutions++;
        });
    }
    startTaskProcessing() {
        const processTasks = async () => {
            if (!this.isRunning)
                return;
            if (this.activeExecutions.size >= this.config.maxConcurrentExecutions) {
                setTimeout(processTasks, 100);
                return;
            }
            const nextTask = this.getNextTask();
            if (!nextTask) {
                setTimeout(processTasks, 100);
                return;
            }
            await this.executeTask(nextTask);
            setTimeout(processTasks, 10);
        };
        processTasks();
    }
    getNextTask() {
        const tasks = Array.from(this.taskQueue.values());
        if (tasks.length === 0)
            return null;
        tasks.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        return tasks[0];
    }
    async executeTask(task) {
        const startTime = Date.now();
        try {
            this.taskQueue.delete(task.id);
            this.activeExecutions.set(task.id, task);
            task.status = 'running';
            task.startedAt = new Date().toISOString();
            task.updatedAt = new Date().toISOString();
            await this.updateTaskInDatabase(task);
            this.metrics.totalExecutions++;
            this.metrics.activeExecutions = this.activeExecutions.size;
            this.metrics.queuedTasks = this.taskQueue.size;
            this.metrics.lastUpdated = new Date().toISOString();
            structuredLogger.info('Task execution started', {
                taskId: task.id,
                agentId: task.agentId,
                orgId: task.context.orgId
            });
            this.emit('task:started', task);
            const executionRequest = {
                agentId: task.agentId,
                inputs: task.inputs,
                context: task.context
            };
            const result = await aiAgentsRegistry.executeAgent(executionRequest);
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            task.updatedAt = new Date().toISOString();
            task.outputs = result.outputs;
            task.costEur = result.costEur;
            task.executionTimeMs = result.executionTimeMs;
            await this.updateTaskInDatabase(task);
            this.executionHistory.push(task);
            this.activeExecutions.delete(task.id);
            this.metrics.activeExecutions = this.activeExecutions.size;
            this.metrics.totalCost += task.costEur || 0;
            this.metrics.lastUpdated = new Date().toISOString();
            structuredLogger.info('Task execution completed', {
                taskId: task.id,
                agentId: task.agentId,
                executionTimeMs: task.executionTimeMs,
                costEur: task.costEur
            });
            this.emit('task:completed', task);
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            if (task.retryCount < task.maxRetries) {
                task.retryCount++;
                task.status = 'pending';
                task.updatedAt = new Date().toISOString();
                setTimeout(() => {
                    this.taskQueue.set(task.id, task);
                }, this.config.retryDelayMs * task.retryCount);
                structuredLogger.warn('Task execution failed, retrying', {
                    taskId: task.id,
                    agentId: task.agentId,
                    retryCount: task.retryCount,
                    maxRetries: task.maxRetries,
                    error: error.message
                });
                this.emit('task:retry', task, task.retryCount);
                return;
            }
            task.status = 'failed';
            task.completedAt = new Date().toISOString();
            task.updatedAt = new Date().toISOString();
            task.error = error.message;
            task.executionTimeMs = executionTime;
            await this.updateTaskInDatabase(task);
            this.executionHistory.push(task);
            this.activeExecutions.delete(task.id);
            this.metrics.activeExecutions = this.activeExecutions.size;
            this.metrics.lastUpdated = new Date().toISOString();
            structuredLogger.error('Task execution failed', error, {
                taskId: task.id,
                agentId: task.agentId,
                retryCount: task.retryCount,
                executionTimeMs: executionTime
            });
            this.emit('task:failed', task, error);
        }
    }
    async checkDependencies(dependencies) {
        const completed = [];
        const pending = [];
        for (const depId of dependencies) {
            const depTask = await this.loadTaskFromDatabase(depId);
            if (depTask && depTask.status === 'completed') {
                completed.push(depId);
            }
            else {
                pending.push(depId);
            }
        }
        return {
            allCompleted: pending.length === 0,
            completed,
            pending
        };
    }
    async loadPendingTasks() {
        try {
            const pendingTasks = await db
                .select()
                .from(agentTasks)
                .where(eq(agentTasks.status, 'pending'))
                .orderBy(desc(agentTasks.createdAt))
                .limit(100);
            for (const dbTask of pendingTasks) {
                const task = {
                    id: dbTask.id,
                    agentId: dbTask.agentId,
                    inputs: JSON.parse(dbTask.inputs),
                    context: JSON.parse(dbTask.context),
                    status: dbTask.status,
                    priority: dbTask.priority,
                    retryCount: dbTask.retryCount,
                    maxRetries: dbTask.maxRetries,
                    timeoutMs: dbTask.timeoutMs,
                    dependencies: dbTask.dependencies ? JSON.parse(dbTask.dependencies) : undefined,
                    outputs: dbTask.outputs ? JSON.parse(dbTask.outputs) : undefined,
                    error: dbTask.error || undefined,
                    costEur: dbTask.costEur || undefined,
                    executionTimeMs: dbTask.executionTimeMs || undefined,
                    createdAt: dbTask.createdAt,
                    updatedAt: dbTask.updatedAt
                };
                this.taskQueue.set(task.id, task);
            }
            structuredLogger.info('Loaded pending tasks from database', {
                count: pendingTasks.length
            });
        }
        catch (error) {
            structuredLogger.error('Failed to load pending tasks', error);
        }
    }
    async persistTask(task) {
        try {
            await db.insert(agentTasks).values({
                id: task.id,
                orgId: task.context.orgId,
                agentId: task.agentId,
                inputs: JSON.stringify(task.inputs),
                context: JSON.stringify(task.context),
                status: task.status,
                priority: task.priority,
                retryCount: task.retryCount,
                maxRetries: task.maxRetries,
                timeoutMs: task.timeoutMs,
                dependencies: task.dependencies ? JSON.stringify(task.dependencies) : null,
                outputs: task.outputs ? JSON.stringify(task.outputs) : null,
                error: task.error || null,
                costEur: task.costEur || null,
                executionTimeMs: task.executionTimeMs || null,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            });
        }
        catch (error) {
            structuredLogger.error('Failed to persist task', error, {
                taskId: task.id
            });
        }
    }
    async updateTaskInDatabase(task) {
        try {
            await db.update(agentTasks)
                .set({
                status: task.status,
                priority: task.priority,
                retryCount: task.retryCount,
                outputs: task.outputs ? JSON.stringify(task.outputs) : null,
                error: task.error || null,
                costEur: task.costEur || null,
                executionTimeMs: task.executionTimeMs || null,
                startedAt: task.startedAt || null,
                completedAt: task.completedAt || null,
                updatedAt: task.updatedAt
            })
                .where(eq(agentTasks.id, task.id));
        }
        catch (error) {
            structuredLogger.error('Failed to update task in database', error, {
                taskId: task.id
            });
        }
    }
    async loadTaskFromDatabase(taskId) {
        try {
            const [dbTask] = await db
                .select()
                .from(agentTasks)
                .where(eq(agentTasks.id, taskId))
                .limit(1);
            if (!dbTask)
                return null;
            return {
                id: dbTask.id,
                agentId: dbTask.agentId,
                inputs: JSON.parse(dbTask.inputs),
                context: JSON.parse(dbTask.context),
                status: dbTask.status,
                priority: dbTask.priority,
                retryCount: dbTask.retryCount,
                maxRetries: dbTask.maxRetries,
                timeoutMs: dbTask.timeoutMs,
                dependencies: dbTask.dependencies ? JSON.parse(dbTask.dependencies) : undefined,
                outputs: dbTask.outputs ? JSON.parse(dbTask.outputs) : undefined,
                error: dbTask.error || undefined,
                costEur: dbTask.costEur || undefined,
                executionTimeMs: dbTask.executionTimeMs || undefined,
                createdAt: dbTask.createdAt,
                updatedAt: dbTask.updatedAt
            };
        }
        catch (error) {
            structuredLogger.error('Failed to load task from database', error, {
                taskId
            });
            return null;
        }
    }
    async findTaskByIdempotencyKey(idempotencyKey, orgId) {
        try {
            const [dbTask] = await db
                .select()
                .from(agentTasks)
                .where(and(eq(agentTasks.orgId, orgId)))
                .limit(1);
            for (const task of [...this.taskQueue.values(), ...this.activeExecutions.values()]) {
                if (task.context.idempotencyKey === idempotencyKey && task.context.orgId === orgId) {
                    return task;
                }
            }
            return null;
        }
        catch (error) {
            structuredLogger.error('Failed to find task by idempotency key', error, {
                idempotencyKey,
                orgId
            });
            return null;
        }
    }
    updateAverageMetrics(task) {
        if (task.executionTimeMs) {
            const totalExecutions = this.metrics.successfulExecutions + this.metrics.failedExecutions;
            this.metrics.averageExecutionTime =
                (this.metrics.averageExecutionTime * (totalExecutions - 1) + task.executionTimeMs) / totalExecutions;
        }
        if (task.costEur) {
            const totalExecutions = this.metrics.successfulExecutions + this.metrics.failedExecutions;
            this.metrics.averageCost =
                (this.metrics.averageCost * (totalExecutions - 1) + task.costEur) / totalExecutions;
        }
    }
    performHealthCheck() {
        const totalExecutions = this.metrics.successfulExecutions + this.metrics.failedExecutions;
        const successRate = totalExecutions > 0 ? this.metrics.successfulExecutions / totalExecutions : 1;
        let systemHealth = 'healthy';
        if (successRate < 0.8) {
            systemHealth = 'unhealthy';
        }
        else if (successRate < 0.95) {
            systemHealth = 'degraded';
        }
        this.metrics.systemHealth = systemHealth;
        this.metrics.lastUpdated = new Date().toISOString();
        this.emit('runtime:health-check', this.metrics);
    }
    performCleanup() {
        if (this.executionHistory.length > this.config.maxExecutionHistory) {
            this.executionHistory = this.executionHistory.slice(-this.config.maxExecutionHistory);
        }
        const now = Date.now();
        const cleanupThreshold = 300000;
        for (const [taskId, task] of this.activeExecutions) {
            if (task.status === 'completed' || task.status === 'failed') {
                const completedTime = new Date(task.completedAt || task.updatedAt).getTime();
                if (now - completedTime > cleanupThreshold) {
                    this.activeExecutions.delete(taskId);
                }
            }
        }
        structuredLogger.debug('Runtime cleanup performed', {
            executionHistorySize: this.executionHistory.length,
            activeExecutions: this.activeExecutions.size
        });
    }
}
export const agentRuntime = new AgentRuntimeService();
//# sourceMappingURL=agent-runtime.service.js.map