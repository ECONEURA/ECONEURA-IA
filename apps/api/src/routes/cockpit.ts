import express from 'express';
import { agentExecutor } from '@econeura/agents';

const router = express.Router();

// GET /v1/cockpit/overview - Main cockpit overview
router.get('/overview', async (req, res) => {
  try {
    const userOrgId = req.headers['x-org-id'] as string;
    
    if (!userOrgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-org-id header is required'
      });
    }
    
    // Get agent execution stats
    const agentStats = agentExecutor.getExecutionStats(userOrgId);
    
    // Get running executions
    const runningExecutions = agentExecutor.getExecutionsByStatus('running').length;
    const failedExecutions = agentExecutor.getExecutionsByStatus('failed').length;
    
    // Mock additional metrics (in real implementation, these would come from actual services)
    const overview = {
      timestamp: new Date().toISOString(),
      organizationId: userOrgId,
      
      // Agent metrics
      agents: {
        totalExecutions: agentStats.total,
        runningExecutions,
        failedExecutions,
        completedExecutions: agentStats.byStatus.completed || 0,
        avgExecutionTime: Math.round(agentStats.avgExecutionTime),
        totalCost: agentStats.totalCost,
        topAgents: Object.entries(agentStats.byAgent)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([agentId, count]) => ({ agentId, executions: count })),
      },
      
      // System health metrics (mock data)
      system: {
        health: 'healthy',
        uptime: Math.floor(process.uptime()),
        memoryUsage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        activeConnections: Math.floor(Math.random() * 100) + 50,
      },
      
      // Queue metrics (mock data)
      queues: {
        pending: Math.floor(Math.random() * 20),
        processing: runningExecutions,
        failed: failedExecutions,
        retries: Math.floor(Math.random() * 5),
      },
      
      // Performance metrics (mock data)
      performance: {
        p95ResponseTime: Math.floor(Math.random() * 200) + 100,
        requestsPerMinute: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.random() * 0.05, // 0-5% error rate
        cacheHitRate: 0.85 + Math.random() * 0.1, // 85-95% cache hit rate
      },
      
      // Budget and cost metrics
      budget: {
        monthlyLimit: 50.0, // €50 monthly limit from MEGA PROMPT
        spent: agentStats.totalCost,
        remaining: 50.0 - agentStats.totalCost,
        percentUsed: (agentStats.totalCost / 50.0) * 100,
        alerts: agentStats.totalCost > 40 ? ['approaching_limit'] : [],
      },
      
      // Upcoming tasks (mock data)
      upcomingTasks: {
        dunningDue7Days: Math.floor(Math.random() * 10),
        invoicesDue: Math.floor(Math.random() * 25),
        scheduledReports: Math.floor(Math.random() * 5),
      },
    };
    
    res.json(overview);
    
    // Add cost tracking headers
    res.set('X-Est-Cost-EUR', '0.001'); // Minimal cost for dashboard view
    res.set('X-Budget-Pct', overview.budget.percentUsed.toFixed(1));
    res.set('X-Latency-ms', '50');
    res.set('X-Route', 'cockpit-overview');
    res.set('X-Correlation-Id', `cockpit_${Date.now()}`);
    
  } catch (error) {
    console.error('Error getting cockpit overview:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/cockpit/agents - Detailed agent status
router.get('/agents', async (req, res) => {
  try {
    const userOrgId = req.headers['x-org-id'] as string;
    
    if (!userOrgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-org-id header is required'
      });
    }
    
    // Get detailed agent statistics
    const stats = agentExecutor.getExecutionStats(userOrgId);
    const runningExecutions = agentExecutor.getExecutionsByStatus('running');
    const failedExecutions = agentExecutor.getExecutionsByStatus('failed');
    const recentExecutions = agentExecutor.getExecutionsByOrg(userOrgId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 20);
    
    const agentDetails = {
      timestamp: new Date().toISOString(),
      organizationId: userOrgId,
      
      summary: {
        totalExecutions: stats.total,
        avgExecutionTime: Math.round(stats.avgExecutionTime),
        totalCost: stats.totalCost,
        statusBreakdown: stats.byStatus,
      },
      
      running: runningExecutions.map(exec => ({
        id: exec.id,
        agentId: exec.agentId,
        startedAt: exec.startedAt,
        duration: Date.now() - exec.startedAt.getTime(),
      })),
      
      failed: failedExecutions.slice(0, 10).map(exec => ({
        id: exec.id,
        agentId: exec.agentId,
        startedAt: exec.startedAt,
        error: exec.error,
        retryCount: exec.retryCount,
      })),
      
      recentExecutions: recentExecutions.map(exec => ({
        id: exec.id,
        agentId: exec.agentId,
        status: exec.status,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        executionTimeMs: exec.executionTimeMs,
        costEur: exec.costEur,
      })),
      
      agentBreakdown: Object.entries(stats.byAgent).map(([agentId, count]) => ({
        agentId,
        executions: count,
        // Calculate success rate (mock for now)
        successRate: 0.85 + Math.random() * 0.1,
        avgCost: stats.totalCost / stats.total || 0,
      })),
    };
    
    res.json(agentDetails);
    
    // Add cost tracking headers
    res.set('X-Est-Cost-EUR', '0.002');
    res.set('X-Latency-ms', '75');
    res.set('X-Route', 'cockpit-agents');
    
  } catch (error) {
    console.error('Error getting agent details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/cockpit/costs - Cost breakdown and budget status
router.get('/costs', async (req, res) => {
  try {
    const userOrgId = req.headers['x-org-id'] as string;
    const { period = 'month' } = req.query;
    
    if (!userOrgId) {
      return res.status(400).json({
        error: 'Missing organization ID',
        message: 'x-org-id header is required'
      });
    }
    
    const stats = agentExecutor.getExecutionStats(userOrgId);
    
    // Calculate period-based costs (mock implementation)
    const now = new Date();
    const periodStart = period === 'week' 
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    
    const costDetails = {
      timestamp: new Date().toISOString(),
      organizationId: userOrgId,
      period: period as string,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      
      budget: {
        limit: 50.0, // €50 monthly limit
        spent: stats.totalCost,
        remaining: 50.0 - stats.totalCost,
        percentUsed: (stats.totalCost / 50.0) * 100,
        projectedSpend: stats.totalCost * 1.2, // Simple projection
      },
      
      breakdown: {
        byAgent: Object.entries(stats.byAgent).map(([agentId, count]) => ({
          agentId,
          executions: count,
          estimatedCost: (stats.totalCost / stats.total) * count,
        })).sort((a, b) => b.estimatedCost - a.estimatedCost),
        
        byProvider: [
          { provider: 'mistral-local', cost: stats.totalCost * 0.3, percentage: 30 },
          { provider: 'azure-openai', cost: stats.totalCost * 0.7, percentage: 70 },
        ],
        
        byCategory: [
          { category: 'ventas', cost: stats.totalCost * 0.25, executions: Math.floor(stats.total * 0.25) },
          { category: 'marketing', cost: stats.totalCost * 0.20, executions: Math.floor(stats.total * 0.20) },
          { category: 'operaciones', cost: stats.totalCost * 0.30, executions: Math.floor(stats.total * 0.30) },
          { category: 'finanzas', cost: stats.totalCost * 0.15, executions: Math.floor(stats.total * 0.15) },
          { category: 'soporte_qa', cost: stats.totalCost * 0.10, executions: Math.floor(stats.total * 0.10) },
        ],
      },
      
      trends: {
        dailyCosts: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cost: (stats.totalCost / 7) * (0.8 + Math.random() * 0.4),
        })),
      },
      
      alerts: [
        ...(stats.totalCost > 40 ? ['Budget usage above 80%'] : []),
        ...(stats.totalCost > 45 ? ['Budget usage above 90%'] : []),
        ...(stats.totalCost >= 50 ? ['Budget limit reached'] : []),
      ],
    };
    
    res.json(costDetails);
    
    // Add cost tracking headers
    res.set('X-Est-Cost-EUR', '0.001');
    res.set('X-Budget-Pct', costDetails.budget.percentUsed.toFixed(1));
    res.set('X-Latency-ms', '60');
    res.set('X-Route', 'cockpit-costs');
    
  } catch (error) {
    console.error('Error getting cost details:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /v1/cockpit/health - System health status
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      
      services: {
        api: {
          status: 'healthy',
          uptime: Math.floor(process.uptime()),
          responseTime: Math.floor(Math.random() * 50) + 10,
        },
        database: {
          status: 'healthy',
          connections: Math.floor(Math.random() * 20) + 5,
          queryTime: Math.floor(Math.random() * 30) + 5,
        },
        agents: {
          status: 'healthy',
          running: agentExecutor.getExecutionsByStatus('running').length,
          queued: agentExecutor.getExecutionsByStatus('pending').length,
        },
        ai_providers: {
          mistral: {
            status: Math.random() > 0.1 ? 'healthy' : 'degraded',
            latency: Math.floor(Math.random() * 200) + 100,
          },
          azure_openai: {
            status: Math.random() > 0.05 ? 'healthy' : 'degraded',
            latency: Math.floor(Math.random() * 500) + 200,
          },
        },
      },
      
      metrics: {
        memoryUsage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
        },
        cpuUsage: Math.floor(Math.random() * 50) + 10, // Mock CPU usage
        diskUsage: Math.floor(Math.random() * 30) + 20, // Mock disk usage
      },
      
      alerts: [
        // Add any system alerts here
      ],
    };
    
    // Set overall status based on service health
    const hasUnhealthyServices = Object.values(healthStatus.services).some(service => 
      typeof service === 'object' && service.status !== 'healthy'
    );
    
    if (hasUnhealthyServices) {
      healthStatus.status = 'degraded';
    }
    
    res.json(healthStatus);
    
    // Add headers
    res.set('X-System-Mode', healthStatus.status);
    res.set('X-Est-Cost-EUR', '0.001');
    res.set('X-Route', 'cockpit-health');
    
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;