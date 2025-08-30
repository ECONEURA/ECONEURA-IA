import express from "express";
import cors from "cors";
import { logger } from "./lib/logger.js";
import { metrics } from "./lib/metrics.js";
import { tracing } from "./lib/tracing.js";
import { 
  observabilityMiddleware, 
  errorObservabilityMiddleware, 
  healthCheckMiddleware,
  startCleanupScheduler,
  startSystemMetricsScheduler
} from "./middleware/observability.js";

const app = express();

// Middleware básico
app.use(cors({ 
  origin: [/localhost:3000$/, /127.0.0.1:3000$/], 
  credentials: false 
}));
app.use(express.json({ limit: "2mb" }));

// Middleware de observabilidad
app.use(observabilityMiddleware);
app.use(healthCheckMiddleware);

// Logging básico (reemplazado por observabilityMiddleware)
app.use((req, res, next) => {
  // El logging ahora se maneja en observabilityMiddleware
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Health endpoints avanzados
app.get("/health/live", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "api-express",
    uptime: process.uptime()
  });
});

app.get("/health/ready", async (req, res) => {
  try {
    // Verificar base de datos (simulado por ahora)
    const dbStatus = 'ok'; // En producción, aquí haríamos SELECT 1
    
    // Verificar colas/eventos básicos (simulado)
    const queueStatus = 'ok';
    
    // Verificar integraciones externas
    const integrationsStatus = 'ok';
    
    const overallStatus = dbStatus === 'ok' && queueStatus === 'ok' && integrationsStatus === 'ok';
    
    if (overallStatus) {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "api-express",
        checks: {
          database: dbStatus,
          queues: queueStatus,
          integrations: integrationsStatus
        }
      });
    } else {
      res.status(503).json({
        status: "error",
        timestamp: new Date().toISOString(),
        service: "api-express",
        checks: {
          database: dbStatus,
          queues: queueStatus,
          integrations: integrationsStatus
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      service: "api-express",
      error: "Health check failed"
    });
  }
});

// Demo AI Chat con observabilidad
app.post("/v1/ai/chat", async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ 
      error: "Message is required" 
    });
  }

  // Simulación de respuesta AI con observabilidad
  const startTime = Date.now();
  
  try {
    // Simular procesamiento de IA
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const duration = Date.now() - startTime;
    const tokens = Math.floor(message.length / 4) + Math.floor(Math.random() * 100);
    const cost = tokens * 0.00001; // Simulación de costo
    
    // Registrar métricas de IA
    metrics.recordAIRequest('demo-gpt-4o-mini', 'demo', tokens, cost, duration);
    
    // Registrar log de IA
    logger.aiRequest('demo-gpt-4o-mini', 'demo', tokens, cost, duration, {
      requestId: (req as any).requestId,
      traceId: (req as any).traceContext?.traceId
    });

    const response = {
      id: `msg_${Date.now()}`,
      message: `Demo response to: "${message}"`,
      timestamp: new Date().toISOString(),
      model: "demo-gpt-4o-mini",
      tokens,
      cost: cost.toFixed(6)
    };

    return res.json(response);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Registrar error de IA
    logger.aiError(error.message || 'Unknown error', 'demo-gpt-4o-mini', {
      requestId: (req as any).requestId,
      traceId: (req as any).traceContext?.traceId
    });
    
    return res.status(500).json({ 
      error: "AI processing failed",
      message: error.message || 'Unknown error'
    });
  }
});

// Demo Search con observabilidad
app.get("/v1/search", (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ 
      error: "Query parameter 'q' is required" 
    });
  }

  // Simulación de búsqueda
  const results = {
    query: q,
    results: [
      { id: 1, title: `Demo result for: ${q}`, content: "This is a demo search result" },
      { id: 2, title: `Another result for: ${q}`, content: "Another demo search result" }
    ],
    total: 2
  };

  return res.json(results);
});

// Demo Interactions
app.get("/v1/interactions", (req, res) => {
  // Simulación de interacciones CRM
  const interactions = [
    {
      id: "int_1",
      customer_id: "cust_1",
      type: "email",
      status: "completed",
      summary: "Customer inquiry about pricing",
      created_at: new Date().toISOString()
    },
    {
      id: "int_2", 
      customer_id: "cust_2",
      type: "call",
      status: "pending",
      summary: "Follow-up call scheduled",
      created_at: new Date().toISOString()
    }
  ];

  res.json({ interactions });
});

// Demo Products
app.get("/v1/products", (req, res) => {
  // Simulación de productos
  const products = [
    {
      id: "prod_1",
      name: "Demo Product 1",
      sku: "DEMO001",
      price: 99.99,
      stock: 50
    },
    {
      id: "prod_2",
      name: "Demo Product 2", 
      sku: "DEMO002",
      price: 149.99,
      stock: 25
    }
  ];

  res.json({ products });
});

// Demo Metrics
app.get("/metrics", (req, res) => {
  const metricsData = {
    requests_total: 1000,
    requests_per_minute: 15,
    average_response_time: 120,
    error_rate: 0.02,
    active_connections: 5
  };

  res.json(metricsData);
});

// Demo Dashboard
app.get("/dashboard", (req, res) => {
  const dashboard = {
    overview: {
      total_customers: 150,
      total_products: 45,
      total_sales: 12500,
      active_interactions: 8
    },
    recent_activity: [
      { type: "new_customer", message: "New customer registered", timestamp: new Date().toISOString() },
      { type: "sale", message: "Sale completed", timestamp: new Date().toISOString() }
    ]
  };

  res.json(dashboard);
});

// Analytics Endpoint
app.get('/v1/analytics/overview', (req, res) => {
  const now = new Date();
  const analytics = {
    timestamp: now.toISOString(),
    period: 'last_30_days',
    crm: {
      total_interactions: Math.floor(Math.random() * 1000) + 200,
      active_deals: Math.floor(Math.random() * 50) + 10,
      conversion_rate: (Math.random() * 0.3 + 0.1).toFixed(3),
      avg_deal_value: (Math.random() * 50000 + 10000).toFixed(2),
      top_sources: ['Website', 'Referral', 'Social Media', 'Cold Call']
    },
    erp: {
      total_invoices: Math.floor(Math.random() * 500) + 100,
      paid_invoices: Math.floor(Math.random() * 400) + 80,
      outstanding_amount: (Math.random() * 100000 + 50000).toFixed(2),
      avg_payment_time: Math.floor(Math.random() * 15) + 5,
      top_products: ['Product A', 'Product B', 'Service C']
    },
    inventory: {
      total_products: Math.floor(Math.random() * 200) + 50,
      low_stock_alerts: Math.floor(Math.random() * 10) + 2,
      total_value: (Math.random() * 500000 + 200000).toFixed(2),
      turnover_rate: (Math.random() * 0.8 + 0.2).toFixed(3)
    },
    ai: {
      total_requests: Math.floor(Math.random() * 5000) + 1000,
      chat_sessions: Math.floor(Math.random() * 200) + 50,
      image_generations: Math.floor(Math.random() * 100) + 20,
      tts_requests: Math.floor(Math.random() * 50) + 10,
      total_tokens: Math.floor(Math.random() * 100000) + 20000,
      estimated_cost: (Math.random() * 200 + 50).toFixed(2),
      cache_hit_rate: (Math.random() * 0.4 + 0.3).toFixed(3)
    },
    performance: {
      api_p95_latency: Math.floor(Math.random() * 200 + 100),
      ai_p95_latency: Math.floor(Math.random() * 2000 + 1000),
      error_rate: (Math.random() * 0.02).toFixed(4),
      uptime_percentage: (Math.random() * 5 + 95).toFixed(2)
    }
  };
  
  res.json({
    success: true,
    message: 'Analytics Overview',
    data: analytics
  });
});

// System Metrics
app.get('/v1/metrics/system', (req, res) => {
  const systemMetrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    performance: {
      api_requests_per_minute: Math.floor(Math.random() * 100) + 20,
      ai_requests_per_minute: Math.floor(Math.random() * 30) + 5,
      avg_response_time_ms: Math.floor(Math.random() * 200) + 50,
      error_rate_percent: (Math.random() * 2).toFixed(2),
      active_connections: Math.floor(Math.random() * 50) + 10
    },
    cache: {
      hit_rate: (Math.random() * 0.6 + 0.3).toFixed(3),
      total_entries: Math.floor(Math.random() * 1000) + 200,
      memory_usage_mb: (Math.random() * 50 + 10).toFixed(2),
      evictions_per_minute: Math.floor(Math.random() * 10) + 1
    }
  };
  
  res.json({
    success: true,
    message: 'System Metrics',
    data: systemMetrics
  });
});

// Alerts and Notifications
app.get('/v1/alerts/active', (req, res) => {
  const alerts = [
    {
      id: 'alert-001',
      type: 'warning',
      severity: 'medium',
      title: 'Low Stock Alert',
      message: 'Product "Widget Pro" is running low on stock (5 units remaining)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      category: 'inventory',
      actionable: true,
      action_url: '/inventory/products/widget-pro'
    },
    {
      id: 'alert-002',
      type: 'info',
      severity: 'low',
      title: 'AI Budget Warning',
      message: 'AI usage is at 85% of monthly budget',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      category: 'ai',
      actionable: true,
      action_url: '/admin/finops'
    },
    {
      id: 'alert-003',
      type: 'error',
      severity: 'high',
      title: 'Payment Failed',
      message: 'Invoice #INV-2024-001 payment failed - retry scheduled',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      category: 'finance',
      actionable: true,
      action_url: '/finance/invoices/INV-2024-001'
    }
  ];
  
  res.json({
    success: true,
    message: 'Active Alerts',
    data: {
      total: alerts.length,
      by_severity: {
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      alerts: alerts
    }
  });
});

// Business Reports and KPIs
app.get('/v1/reports/kpis', (req, res) => {
  const kpis = {
    timestamp: new Date().toISOString(),
    period: 'current_month',
    sales: {
      total_revenue: (Math.random() * 500000 + 200000).toFixed(2),
      total_orders: Math.floor(Math.random() * 1000) + 200,
      avg_order_value: (Math.random() * 500 + 200).toFixed(2),
      growth_rate: (Math.random() * 0.3 - 0.1).toFixed(3), // Can be negative
      top_customers: [
        { name: 'Enterprise Corp', revenue: (Math.random() * 50000 + 20000).toFixed(2) },
        { name: 'Startup Inc', revenue: (Math.random() * 30000 + 15000).toFixed(2) },
        { name: 'SMB Solutions', revenue: (Math.random() * 20000 + 10000).toFixed(2) }
      ]
    },
    crm: {
      total_leads: Math.floor(Math.random() * 500) + 100,
      conversion_rate: (Math.random() * 0.4 + 0.1).toFixed(3),
      avg_sales_cycle_days: Math.floor(Math.random() * 30) + 15,
      customer_satisfaction: (Math.random() * 2 + 3).toFixed(1), // 3-5 scale
      churn_rate: (Math.random() * 0.1).toFixed(3)
    },
    operations: {
      inventory_turnover: (Math.random() * 8 + 2).toFixed(2),
      order_fulfillment_rate: (Math.random() * 0.1 + 0.95).toFixed(3),
      avg_delivery_time_days: (Math.random() * 3 + 1).toFixed(1),
      supplier_performance: (Math.random() * 0.2 + 0.8).toFixed(3)
    },
    financial: {
      gross_margin: (Math.random() * 0.4 + 0.3).toFixed(3),
      net_profit_margin: (Math.random() * 0.2 + 0.1).toFixed(3),
      cash_flow: (Math.random() * 100000 + 50000).toFixed(2),
      outstanding_receivables: (Math.random() * 200000 + 100000).toFixed(2),
      days_sales_outstanding: Math.floor(Math.random() * 30) + 15
    }
  };
  
  res.json({
    success: true,
    message: 'Business KPIs Report',
    data: kpis
  });
});

// Endpoints de observabilidad
app.get('/v1/observability/logs', (req, res) => {
  const logs = logger.getStats();
  res.json({
    success: true,
    message: 'Logger Statistics',
    data: logs
  });
});

app.get('/v1/observability/metrics', (req, res) => {
  const metricsData = metrics.getMetricsSummary();
  res.json({
    success: true,
    message: 'Metrics Summary',
    data: metricsData
  });
});

app.get('/v1/observability/metrics/prometheus', (req, res) => {
  const prometheusData = metrics.exportPrometheus();
  res.setHeader('Content-Type', 'text/plain');
  res.send(prometheusData);
});

app.get('/v1/observability/traces', (req, res) => {
  const traces = tracing.exportTraces();
  res.json({
    success: true,
    message: 'Traces Export',
    data: traces
  });
});

app.get('/v1/observability/traces/stats', (req, res) => {
  const stats = tracing.getStats();
  res.json({
    success: true,
    message: 'Traces Statistics',
    data: stats
  });
});

// Error handling con observabilidad
app.use(errorObservabilityMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: "Not found",
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 4000;

// Iniciar schedulers de observabilidad
startCleanupScheduler();
startSystemMetricsScheduler();

app.listen(PORT, () => {
  logger.info(`🚀 API Server running on port ${PORT}`, {
    port: Number(PORT),
    environment: process.env.NODE_ENV || 'development'
  });
  
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Chat: http://localhost:${PORT}/v1/ai/chat`);
  console.log(`🔍 Search: http://localhost:${PORT}/v1/search`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`📊 Observability: http://localhost:${PORT}/v1/observability`);
});