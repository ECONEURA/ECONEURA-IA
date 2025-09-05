import { Router } from 'express';
import { structuredLogger } from '../lib/structured-logger.js';
import { healthModeManager } from '../lib/health-modes.js';
import { sseManager } from '../lib/sse-manager.js';
import { randomUUID } from 'crypto';

const router = Router();

// In-memory stores for demo (replace with real data sources)
const agentExecutions = new Map<string, any>();
const queueStats = new Map<string, any>();
const systemMetrics = new Map<string, any>();

// Initialize some demo data
function initializeCockpitData() {
  // Agent executions demo data
  agentExecutions.set('exec-1', {
    id: 'exec-1',
    agentId: 'lead-enrich',
    orgId: 'org-demo',
    status: 'running',
    startedAt: new Date(Date.now() - 30000).toISOString(),
    estimatedCompletion: new Date(Date.now() + 15000).toISOString()
  });

  agentExecutions.set('exec-2', {
    id: 'exec-2',
    agentId: 'invoice-extract',
    orgId: 'org-demo',
    status: 'completed',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    completedAt: new Date(Date.now() - 30000).toISOString(),
    costEur: 0.025
  });

  // Queue stats demo data
  queueStats.set('agent-queue', {
    name: 'agent-queue',
    pending: 5,
    running: 2,
    completed: 150,
    failed: 3,
    avgProcessingTime: 45000
  });

  queueStats.set('email-queue', {
    name: 'email-queue', 
    pending: 12,
    running: 1,
    completed: 89,
    failed: 1,
    avgProcessingTime: 15000
  });

  // System metrics demo data
  systemMetrics.set('api-performance', {
    name: 'API Performance',
    p95ResponseTime: 285,
    p99ResponseTime: 450,
    errorRate5xx: 0.2,
    requestsPerMinute: 125,
    lastUpdated: new Date().toISOString()
  });
}

initializeCockpitData();

// GET /v1/cockpit/overview - Panel operacional unificado
router.get('/overview', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Get current system health
    const healthStatus = await healthModeManager.getReadinessProbe();
    
    // Get agent execution stats
    const agentExecs = Array.from(agentExecutions.values())
      .filter(exec => exec.orgId === orgId);
    
    const agentStats = {
      running: agentExecs.filter(e => e.status === 'running').length,
      completed: agentExecs.filter(e => e.status === 'completed').length,
      failed: agentExecs.filter(e => e.status === 'failed').length,
      totalCostEur: agentExecs.reduce((sum, e) => sum + (e.costEur || 0), 0)
    };

    // Get queue stats
    const queues = Array.from(queueStats.values());
    const queueSummary = {
      totalPending: queues.reduce((sum, q) => sum + q.pending, 0),
      totalRunning: queues.reduce((sum, q) => sum + q.running, 0),
      avgProcessingTime: Math.round(
        queues.reduce((sum, q) => sum + q.avgProcessingTime, 0) / queues.length
      )
    };

    // Get system performance
    const performance = systemMetrics.get('api-performance') || {
      p95ResponseTime: 300,
      errorRate5xx: 0.5,
      requestsPerMinute: 100
    };

    // Calculate cache hit rate (simulated)
    const cacheHitRate = 0.85 + Math.random() * 0.1;

    // Budget status (simulated)
    const budgetStatus = {
      currentSpendEur: 15.50,
      monthlyLimitEur: 50.00,
      utilizationPct: 31.0,
      warningThreshold: 80,
      criticalThreshold: 90,
      status: 'ok' as 'ok' | 'warning' | 'critical'
    };

    if (budgetStatus.utilizationPct >= budgetStatus.criticalThreshold) {
      budgetStatus.status = 'critical';
    } else if (budgetStatus.utilizationPct >= budgetStatus.warningThreshold) {
      budgetStatus.status = 'warning';
    }

    // Dunning próximos 7 días (simulated)
    const upcomingDunning = [
      {
        invoiceId: 'inv-001',
        companyName: 'Acme Corp',
        amount: 1250.00,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        daysOverdue: 15,
        dunningLevel: 2
      },
      {
        invoiceId: 'inv-002', 
        companyName: 'Global Industries',
        amount: 750.00,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        daysOverdue: 8,
        dunningLevel: 1
      }
    ];

    const overview = {
      system: {
        status: healthStatus.status,
        mode: healthStatus.mode,
        degradedReason: healthStatus.degradedReason,
        uptime: process.uptime()
      },
      agents: agentStats,
      queues: queueSummary,
      performance: {
        p95ResponseTime: performance.p95ResponseTime,
        errorRate5xx: performance.errorRate5xx,
        requestsPerMinute: performance.requestsPerMinute,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100
      },
      budget: budgetStatus,
      dunning: {
        upcoming7Days: upcomingDunning.length,
        totalAmountEur: upcomingDunning.reduce((sum, d) => sum + d.amount, 0),
        items: upcomingDunning
      },
      connections: {
        sseClients: sseManager.getStats().totalClients,
        activeUsers: agentStats.running + queueSummary.totalRunning
      },
      timestamp: new Date().toISOString()
    };

    // Add FinOps headers
    const costEur = 0.005;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '1.0',
      'X-Latency-ms': '150',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId,
      'X-System-Mode': healthStatus.mode
    });

    structuredLogger.info('Cockpit overview retrieved', {
      orgId,
      correlationId,
      systemMode: healthStatus.mode,
      agentStats,
      budgetStatus: budgetStatus.status
    });

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    structuredLogger.error('Failed to get cockpit overview', error as Error, {
      orgId: req.headers['x-org-id']
    });

    res.status(500).json({
      error: 'Failed to get cockpit overview',
      message: (error as Error).message
    });
  }
});

// GET /v1/cockpit/agents - Estado detallado de agentes
router.get('/agents', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Get agent executions for org
    const executions = Array.from(agentExecutions.values())
      .filter(exec => exec.orgId === orgId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    // Group by status
    const byStatus = {
      running: executions.filter(e => e.status === 'running'),
      completed: executions.filter(e => e.status === 'completed'),
      failed: executions.filter(e => e.status === 'failed'),
      pending: executions.filter(e => e.status === 'pending')
    };

    // Group by category
    const byCategory = {
      ventas: executions.filter(e => e.agentId?.includes('lead') || e.agentId?.includes('email')),
      marketing: executions.filter(e => e.agentId?.includes('segment') || e.agentId?.includes('copy')),
      operaciones: executions.filter(e => e.agentId?.includes('ticket') || e.agentId?.includes('sop')),
      finanzas: executions.filter(e => e.agentId?.includes('invoice') || e.agentId?.includes('ar')),
      soporte_qa: executions.filter(e => e.agentId?.includes('bug') || e.agentId?.includes('test'))
    };

    // Calculate performance metrics
    const completedExecutions = byStatus.completed.filter(e => e.costEur !== undefined);
    const totalCost = completedExecutions.reduce((sum, e) => sum + (e.costEur || 0), 0);
    const avgCost = completedExecutions.length > 0 ? totalCost / completedExecutions.length : 0;
    
    const avgExecutionTime = completedExecutions.length > 0 
      ? completedExecutions.reduce((sum, e) => {
          const duration = e.completedAt ? 
            new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime() : 0;
          return sum + duration;
        }, 0) / completedExecutions.length
      : 0;

    const agentDetails = {
      summary: {
        total: executions.length,
        running: byStatus.running.length,
        completed: byStatus.completed.length,
        failed: byStatus.failed.length,
        pending: byStatus.pending.length
      },
      byCategory: {
        ventas: byCategory.ventas.length,
        marketing: byCategory.marketing.length,
        operaciones: byCategory.operaciones.length,
        finanzas: byCategory.finanzas.length,
        soporte_qa: byCategory.soporte_qa.length
      },
      performance: {
        totalCostEur: Math.round(totalCost * 10000) / 10000,
        avgCostEur: Math.round(avgCost * 10000) / 10000,
        avgExecutionTimeMs: Math.round(avgExecutionTime),
        successRate: executions.length > 0 ? 
          Math.round((byStatus.completed.length / executions.length) * 100) / 100 : 0
      },
      recent: executions.slice(0, 10), // Last 10 executions
      timestamp: new Date().toISOString()
    };

    // Add FinOps headers
    const costEur = 0.003;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '0.6',
      'X-Latency-ms': '95',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    structuredLogger.info('Cockpit agents data retrieved', {
      orgId,
      correlationId,
      totalExecutions: executions.length,
      runningAgents: byStatus.running.length
    });

    res.json({
      success: true,
      data: agentDetails
    });

  } catch (error) {
    structuredLogger.error('Failed to get cockpit agents data', error as Error, {
      orgId: req.headers['x-org-id']
    });

    res.status(500).json({
      error: 'Failed to get agents data',
      message: (error as Error).message
    });
  }
});

// GET /v1/cockpit/costs - Costes por org/playbook
router.get('/costs', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
    const period = req.query.period as string || 'monthly';

    // Calculate cost breakdown (simulated)
    const now = new Date();
    const costs = {
      current: {
        dailyCostEur: 1.25,
        weeklyCostEur: 8.75,
        monthlyCostEur: 35.50,
        yearlyProjectionEur: 426.00
      },
      budget: {
        monthlyLimitEur: 50.00,
        utilizationPct: 71.0,
        remainingEur: 14.50,
        daysRemaining: 12,
        projectedOverage: 0.00,
        status: 'ok' as 'ok' | 'warning' | 'critical'
      },
      breakdown: {
        byProvider: [
          { provider: 'mistral-local', costEur: 20.30, requests: 1250, percentage: 57.2 },
          { provider: 'azure-openai', costEur: 15.20, requests: 450, percentage: 42.8 }
        ],
        byCategory: [
          { category: 'ventas', costEur: 12.80, requests: 720, percentage: 36.1 },
          { category: 'finanzas', costEur: 10.50, requests: 580, percentage: 29.6 },
          { category: 'marketing', costEur: 8.20, requests: 340, percentage: 23.1 },
          { category: 'operaciones', costEur: 2.50, requests: 45, percentage: 7.0 },
          { category: 'soporte_qa', costEur: 1.50, requests: 15, percentage: 4.2 }
        ],
        byPlaybook: [
          { playbook: 'dunning-automation', costEur: 15.25, executions: 45, percentage: 43.0 },
          { playbook: 'lead-qualification', costEur: 12.10, executions: 38, percentage: 34.1 },
          { playbook: 'invoice-processing', costEur: 8.15, executions: 22, percentage: 22.9 }
        ]
      },
      trends: {
        dailyTrend: [
          { date: '2025-01-08', costEur: 1.15 },
          { date: '2025-01-07', costEur: 1.35 },
          { date: '2025-01-06', costEur: 0.95 },
          { date: '2025-01-05', costEur: 1.25 },
          { date: '2025-01-04', costEur: 1.45 },
          { date: '2025-01-03', costEur: 1.05 },
          { date: '2025-01-02', costEur: 0.85 }
        ],
        weeklyTrend: [
          { week: '2025-W01', costEur: 8.75 },
          { week: '2024-W52', costEur: 7.25 },
          { week: '2024-W51', costEur: 9.15 },
          { week: '2024-W50', costEur: 6.85 }
        ]
      },
      alerts: [
        {
          type: 'budget_warning',
          message: 'Monthly budget 70% utilized',
          severity: 'medium',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        }
      ],
      timestamp: new Date().toISOString()
    };

    // Update budget status based on utilization
    if (costs.budget.utilizationPct >= 90) {
      costs.budget.status = 'critical';
    } else if (costs.budget.utilizationPct >= 80) {
      costs.budget.status = 'warning';
    }

    // Add FinOps headers
    const costEur = 0.004;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': costs.budget.utilizationPct.toFixed(1),
      'X-Latency-ms': '180',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId
    });

    structuredLogger.info('Cockpit costs retrieved', {
      orgId,
      correlationId,
      monthlyCost: costs.current.monthlyCostEur,
      budgetUtilization: costs.budget.utilizationPct,
      budgetStatus: costs.budget.status
    });

    res.json({
      success: true,
      data: costs
    });

  } catch (error) {
    structuredLogger.error('Failed to get cockpit costs', error as Error, {
      orgId: req.headers['x-org-id']
    });

    res.status(500).json({
      error: 'Failed to get costs data',
      message: (error as Error).message
    });
  }
});

// GET /v1/cockpit/system - System metrics and health
router.get('/system', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();

    // Get detailed health status
    const healthStatus = await healthModeManager.getDetailedHealth();
    
    // Get SSE connection stats
    const sseStats = sseManager.getStats();
    
    // Get system performance metrics
    const performance = systemMetrics.get('api-performance');
    
    // Memory and process info
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const systemInfo = {
      health: healthStatus,
      performance: {
        ...performance,
        memory: {
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          externalMB: Math.round(memoryUsage.external / 1024 / 1024),
          rssMB: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        cpu: {
          userMs: Math.round(cpuUsage.user / 1000),
          systemMs: Math.round(cpuUsage.system / 1000)
        },
        uptime: {
          seconds: Math.round(process.uptime()),
          hours: Math.round(process.uptime() / 3600 * 100) / 100
        }
      },
      connections: sseStats,
      queues: Array.from(queueStats.values()),
      timestamp: new Date().toISOString()
    };

    // Add FinOps headers
    const costEur = 0.002;
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': '0.4',
      'X-Latency-ms': '65',
      'X-Route': 'local',
      'X-Correlation-Id': correlationId,
      'X-System-Mode': healthStatus.mode
    });

    structuredLogger.info('Cockpit system metrics retrieved', {
      orgId,
      correlationId,
      systemMode: healthStatus.mode,
      memoryUsageMB: systemInfo.performance.memory.heapUsedMB,
      sseClients: sseStats.totalClients
    });

    res.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    structuredLogger.error('Failed to get cockpit system data', error as Error, {
      orgId: req.headers['x-org-id']
    });

    res.status(500).json({
      error: 'Failed to get system data',
      message: (error as Error).message
    });
  }
});

// POST /v1/cockpit/alerts/acknowledge - Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const orgId = req.headers['x-org-id'] as string || 'org-demo';
    const userId = req.headers['x-user-id'] as string || 'system';

    // Simulate alert acknowledgment
    const alert = {
      id: alertId,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: userId,
      status: 'acknowledged'
    };

    structuredLogger.info('Alert acknowledged', {
      orgId,
      userId,
      alertId
    });

    // Broadcast acknowledgment via SSE
    sseManager.broadcastToOrg(orgId, {
      event: 'alert_acknowledged',
      data: alert
    }, 'alert_acknowledged');

    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully'
    });

  } catch (error) {
    structuredLogger.error('Failed to acknowledge alert', error as Error, {
      orgId: req.headers['x-org-id'],
      alertId: req.params.alertId
    });

    res.status(500).json({
      error: 'Failed to acknowledge alert',
      message: (error as Error).message
    });
  }
});

export { router as cockpitRouter };
