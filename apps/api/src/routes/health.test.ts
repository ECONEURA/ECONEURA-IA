import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import { apiRouter } from './index.js'

const app = express()
app.use('/api', apiRouter)

describe('Health endpoint', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)
    
    expect(response.body).toMatchObject({
      status: 'healthy',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    })
  })

  it('should return valid timestamp', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)
    
    const timestamp = new Date(response.body.timestamp)
    expect(timestamp.getTime()).toBeGreaterThan(0)
  })
})



