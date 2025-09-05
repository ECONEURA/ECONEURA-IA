/**
 * ECONEURA API Server - Minimal Version
 * 
 * This is a minimal version of the API server that focuses on:
 * 1. Health endpoint (<200ms, no DB/external calls)
 * 2. Agents registry and execution endpoints
 * 3. Basic CORS and security
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration for Azure deployment
const allowedOrigins = [
  'https://www.econeura.com',
  'https://econeura-web-dev-dpehcua9augngbcb.northeurope-01.azurewebsites.net',
  'http://localhost:3000', // For development
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-Id', 'X-User-Id', 'X-Correlation-Id', 'X-Request-Id'],
  exposedHeaders: ['X-Est-Cost-EUR', 'X-Budget-Pct', 'X-Latency-ms', 'X-Route', 'X-Correlation-Id'],
}));

// Basic request logging
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// =============================================================================
// HEALTH ENDPOINT (ECONEURA SPEC COMPLIANT)
// =============================================================================

app.get("/health", (req, res) => {
  // ECONEURA spec: /health MUST NOT touch DB/externals and respond <200ms
  const ts = new Date().toISOString();
  const version = process.env.npm_package_version || "1.0.0";
  
  res.status(200).json({
    status: "ok",
    ts,
    version
  });
});

// Basic ping endpoint
app.get("/v1/ping", (req, res) => {
  res.status(200).json({
    status: "ok",
    ts: new Date().toISOString(),
    message: "pong"
  });
});

// =============================================================================
// AGENTS REGISTRY (MOCK IMPLEMENTATION)
// =============================================================================

// Mock agents registry for testing
const mockAgentsRegistry = [
  {
    id: 'lead-enrich',
    name: 'Lead Enrichment',
    description: 'Enriquece información de leads con datos públicos y scoring',
    category: 'ventas',
    version: '1.0.0',
    costHint: '€0.05 per enrichment',
    tags: ['lead', 'enrichment', 'scoring'],
    deprecated: false,
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 5000,
      requiresApproval: false,
      costCategory: 'medium',
    },
  },
  {
    id: 'segment-build',
    name: 'Segment Builder',
    description: 'Construye segmentos de audiencia basados en criterios',
    category: 'marketing',
    version: '1.0.0',
    costHint: '€0.10 per segment',
    tags: ['marketing', 'segmentation', 'audience'],
    deprecated: false,
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 3000,
      requiresApproval: false,
      costCategory: 'medium',
    },
  },
  {
    id: 'ticket-triage',
    name: 'Ticket Triage',
    description: 'Clasifica y prioriza tickets de soporte automáticamente',
    category: 'operaciones',
    version: '1.0.0',
    costHint: '€0.01 per triage',
    tags: ['operations', 'support', 'triage'],
    deprecated: false,
    policy: {
      maxExecutionTimeMs: 8000,
      maxRetries: 1,
      retryDelayMs: 2000,
      requiresApproval: false,
      costCategory: 'low',
    },
  },
  {
    id: 'invoice-extract',
    name: 'Invoice Data Extraction',
    description: 'Extrae datos estructurados de facturas PDF/imagen',
    category: 'finanzas',
    version: '1.0.0',
    costHint: '€0.25 per extraction',
    tags: ['finance', 'ocr', 'extraction'],
    deprecated: false,
    policy: {
      maxExecutionTimeMs: 45000,
      maxRetries: 2,
      retryDelayMs: 5000,
      requiresApproval: false,
      costCategory: 'high',
    },
  },
  {
    id: 'bug-triage',
    name: 'Bug Triage',
    description: 'Clasifica y prioriza bugs automáticamente',
    category: 'soporte_qa',
    version: '1.0.0',
    costHint: '€0.02 per triage',
    tags: ['qa', 'bug', 'triage'],
    deprecated: false,
    policy: {
      maxExecutionTimeMs: 12000,
      maxRetries: 1,
      retryDelayMs: 3000,
      requiresApproval: false,
      costCategory: 'low',
    },
  },
];

// Get all agents or filter by category
app.get("/v1/agents", (req, res) => {
  try {
    const { category } = req.query;
    
    let agents = mockAgentsRegistry;
    if (category) {
      agents = mockAgentsRegistry.filter(agent => agent.category === category);
    }
    
    const categories = [...new Set(mockAgentsRegistry.map(agent => agent.category))];
    const stats = {
      total: mockAgentsRegistry.length,
      byCategory: categories.reduce((acc, cat) => {
        acc[cat] = mockAgentsRegistry.filter(a => a.category === cat).length;
        return acc;
      }, {} as Record<string, number>),
    };
    
    res.json({
      success: true,
      data: {
        agents,
        count: agents.length,
        categories,
        stats,
      }
    });
  } catch (error) {
    console.error('Failed to get agents registry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific agent
app.get("/v1/agents/:agentId", (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = mockAgentsRegistry.find(a => a.id === agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Failed to get agent details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute agent
app.post("/v1/agents/run", async (req, res) => {
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] as string || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { agentId, inputs, context } = req.body;
    
    if (!agentId || !inputs) {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'agentId and inputs are required' 
      });
    }
    
    const agent = mockAgentsRegistry.find(a => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    if (agent.deprecated) {
      return res.status(410).json({ 
        error: 'Agent deprecated', 
        message: `Agent ${agentId} is deprecated and no longer available` 
      });
    }
    
    // Mock execution
    const executionTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    const executionTimeMs = Date.now() - startTime;
    const costEur = parseFloat((Math.random() * 0.5 + 0.01).toFixed(4)); // €0.01-€0.51
    
    // Mock result based on agent type
    let mockResult;
    switch (agentId) {
      case 'lead-enrich':
        mockResult = {
          enrichedData: {
            fullName: `Enriched User for ${inputs.email || 'unknown'}`,
            title: 'Sales Manager',
            company: {
              name: inputs.company || 'Unknown Company',
              domain: inputs.email ? inputs.email.split('@')[1] : 'example.com',
              industry: 'Technology',
              size: 'medium',
            },
            score: Math.floor(Math.random() * 40) + 60,
          },
          confidence: 0.85,
        };
        break;
      
      case 'segment-build':
        mockResult = {
          segmentId: `seg_${Date.now()}`,
          size: Math.floor(Math.random() * 10000) + 1000,
          criteria: inputs.criteria || {},
          estimatedReach: Math.floor(Math.random() * 5000) + 500,
          confidence: 0.82,
        };
        break;
      
      case 'ticket-triage':
        mockResult = {
          priority: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
          category: ['technical', 'billing', 'account', 'feature-request'][Math.floor(Math.random() * 4)],
          assignedTeam: ['tier1', 'tier2', 'billing', 'engineering'][Math.floor(Math.random() * 4)],
          estimatedResolutionTime: Math.floor(Math.random() * 20) + 2,
          tags: ['support', 'automated-triage'],
        };
        break;
      
      default:
        mockResult = {
          message: `Agent ${agentId} executed successfully`,
          timestamp: new Date().toISOString(),
        };
    }
    
    // Add FinOps headers
    const budgetPct = Math.random() * 30 + 10; // 10-40% budget usage
    
    res.set({
      'X-Est-Cost-EUR': costEur.toFixed(4),
      'X-Budget-Pct': budgetPct.toFixed(1),
      'X-Latency-ms': executionTimeMs.toString(),
      'X-Route': 'agent-execution',
      'X-Correlation-Id': correlationId,
    });
    
    res.json({
      success: true,
      data: {
        executionId: correlationId,
        agentId,
        result: {
          success: true,
          data: mockResult,
          costEur,
          executionTimeMs,
        },
        executionTimeMs,
        costEur,
      }
    });
    
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    
    console.error('Agent execution failed:', error);
    
    res.status(500).json({ 
      error: 'Agent execution failed', 
      message: (error as Error).message,
      correlationId,
    });
  }
});

// Get agent execution status (mock)
app.get("/v1/agents/runs/:executionId", (req, res) => {
  try {
    const { executionId } = req.params;
    
    const mockExecution = {
      id: executionId,
      agentId: 'lead-enrich',
      status: 'completed',
      inputs: { email: 'test@example.com' },
      outputs: { enrichedData: { score: 85 } },
      context: {
        orgId: 'default',
        userId: 'system',
        correlationId: executionId,
      },
      startedAt: new Date(Date.now() - 5000).toISOString(),
      completedAt: new Date().toISOString(),
      costEur: 0.05,
      executionTimeMs: 1500,
      retryCount: 0,
    };
    
    res.json({
      success: true,
      data: mockExecution
    });
  } catch (error) {
    console.error('Failed to get agent execution status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cockpit overview endpoint
app.get("/v1/cockpit/overview", (req, res) => {
  try {
    const overview = {
      agents: {
        total: mockAgentsRegistry.length,
        byCategory: {
          ventas: 1,
          marketing: 1,
          operaciones: 1,
          finanzas: 1,
          soporte_qa: 1,
        },
        running: Math.floor(Math.random() * 10) + 1,
        failed: Math.floor(Math.random() * 3),
        completed: Math.floor(Math.random() * 50) + 20,
      },
      queues: {
        pending: Math.floor(Math.random() * 15) + 5,
        processing: Math.floor(Math.random() * 8) + 2,
        failed: Math.floor(Math.random() * 3),
      },
      performance: {
        cacheHitRate: (Math.random() * 0.3 + 0.7).toFixed(2), // 70-100%
        p95ResponseTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
        errorRate5xx: (Math.random() * 0.02).toFixed(4), // 0-2%
      },
      budget: {
        current: Math.floor(Math.random() * 30) + 10, // 10-40 EUR
        limit: 50, // 50 EUR
        percentage: Math.floor(Math.random() * 30) + 20, // 20-50%
      },
      dunning: {
        upcoming7Days: Math.floor(Math.random() * 12) + 3,
        overdue: Math.floor(Math.random() * 5) + 1,
      },
    };
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Failed to get cockpit overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent categories endpoint
app.get("/v1/agents/categories", (req, res) => {
  try {
    const categories = ['ventas', 'marketing', 'operaciones', 'finanzas', 'soporte_qa'];
    
    const categoriesWithStats = categories.map(category => ({
      name: category,
      count: mockAgentsRegistry.filter(a => a.category === category).length,
      agents: mockAgentsRegistry
        .filter(a => a.category === category)
        .map(agent => ({
          id: agent.id,
          name: agent.name,
          costHint: agent.costHint,
          deprecated: agent.deprecated,
        })),
    }));
    
    res.json({
      success: true,
      data: {
        categories: categoriesWithStats,
        total: categories.length,
      }
    });
  } catch (error) {
    console.error('Failed to get agent categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (err.message?.includes('CORS')) {
    statusCode = 403;
    message = 'CORS policy violation';
  }
  
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
  });
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 ECONEURA API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Agents endpoint: http://localhost:${PORT}/v1/agents`);
  console.log(`📈 Cockpit overview: http://localhost:${PORT}/v1/cockpit/overview`);
  console.log(`⚡ Ready to serve requests`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

export default app;