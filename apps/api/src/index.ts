import express from "express";
import cors from "cors";

const app = express();

// Middleware básico
app.use(cors({ origin: [/localhost:3000$/], credentials: false }));
app.use(express.json({ limit: "2mb" }));

// Health check básico
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0"
  });
});

// Endpoint básico de IA
app.post("/v1/ai/chat", (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      error: "Missing prompt",
      message: "Prompt is required"
    });
  }

  // Respuesta simulada para demo
  res.json({
    success: true,
    data: {
      response: `Demo response to: "${prompt}"`,
      model: "gpt-4o-mini",
      tokens: prompt.length,
      cost: 0.001
    }
  });
});

// Endpoint básico de búsqueda
app.get("/v1/search", (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({
      error: "Missing query",
      message: "Query parameter 'q' is required"
    });
  }

  // Respuesta simulada para demo
  res.json({
    success: true,
    data: {
      results: [
        {
          title: `Demo result for: ${q}`,
          snippet: `This is a demo search result for the query "${q}"`,
          url: "https://demo.example.com"
        }
      ],
      total: 1
    }
  });
});

// Endpoint básico de interacciones
app.get("/v1/interactions", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "1",
        type: "email",
        content: "Demo interaction 1",
        createdAt: new Date().toISOString()
      },
      {
        id: "2", 
        type: "call",
        content: "Demo interaction 2",
        createdAt: new Date().toISOString()
      }
    ],
    count: 2
  });
});

// Endpoint básico de productos
app.get("/v1/products", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "1",
        name: "Demo Product 1",
        sku: "DEMO-001",
        price: 99.99,
        stock: 10
      },
      {
        id: "2",
        name: "Demo Product 2", 
        sku: "DEMO-002",
        price: 149.99,
        stock: 5
      }
    ],
    count: 2
  });
});

// Métricas básicas
app.get("/metrics", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.end(`
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 10
http_requests_total{method="POST",status="200"} 5

# HELP ai_requests_total Total number of AI requests
# TYPE ai_requests_total counter
ai_requests_total{model="gpt-4o-mini"} 3

# HELP search_requests_total Total number of search requests  
# TYPE search_requests_total counter
search_requests_total 2
  `);
});

// Dashboard básico
app.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      general: {
        totalRequests: 15,
        uniqueUsers: 3,
        errorRate: 0,
        avgLatency: 150
      },
      ai: {
        totalRequests: 3,
        totalCost: 0.003,
        popularModels: {
          "gpt-4o-mini": 3
        }
      },
      search: {
        totalRequests: 2,
        popularQueries: {
          "demo": 2
        }
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    }
  });
});

// Error handling básico
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Metrics: http://localhost:${PORT}/metrics`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📈 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🤖 AI Chat: POST http://localhost:${PORT}/v1/ai/chat`);
  console.log(`🔍 Search: GET http://localhost:${PORT}/v1/search?q=query`);
  console.log(`📞 Interactions: GET http://localhost:${PORT}/v1/interactions`);
  console.log(`📦 Products: GET http://localhost:${PORT}/v1/products`);
});