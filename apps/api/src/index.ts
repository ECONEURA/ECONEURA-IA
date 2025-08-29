import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import rateLimit from 'express-rate-limit'
import basicAuth from 'express-basic-auth'
import { ai } from './routes/ai.js'
import { search } from './routes/search.js'
import { registry } from './lib/observe.js'

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(bodyParser.json({ limit: '2mb' }))
app.use(rateLimit({ windowMs: 60_000, max: 180, keyGenerator: (req) => (req.headers['x-org-id'] as string) || req.ip }))

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// Metrics (protected)
app.get('/metrics', basicAuth({ users: { admin: process.env.METRICS_PWD || 'metrics' }, challenge: true }), async (_req, res) => {
  res.setHeader('Content-Type', registry.contentType)
  res.end(await registry.metrics())
})

// Routes
app.use('/v1/ai', ai)
app.use('/v1/search', search)

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received')
  process.exit(0)
})

startServer()