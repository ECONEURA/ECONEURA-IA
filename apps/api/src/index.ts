import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { apiRouter } from './routes'
import { problemJsonMiddleware } from './middleware/problem-json.js'
import { env } from '@econeura/shared'

const app = express()
const PORT = env().PORT

// Middleware
app.use(helmet())
app.use(cors({
  origin: env().FRONTEND_URL,
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api', apiRouter)

// Problem+JSON error handling (must be last)
app.use(problemJsonMiddleware)

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📚 API documentation: http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...')
  process.exit(0)
})

startServer()