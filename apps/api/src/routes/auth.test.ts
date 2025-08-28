import request from 'supertest'
import express from 'express'
import { authRouter } from './auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  }
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  }
})

// Setup Express app for testing
const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

describe('Auth API', () => {
  let prisma: any
  
  beforeAll(() => {
    prisma = new PrismaClient()
    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Test User',
        role: 'admin',
        isActive: true,
        organizationId: 'org-1',
        organization: {
          id: 'org-1',
          name: 'Test Org',
        },
      }

      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        deviceName: 'Test Device',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest',
        refreshToken: 'refresh-token',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)
      prisma.session.create.mockResolvedValue(mockSession)
      prisma.auditLog.create.mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'org-1',
        organizationName: 'Test Org',
      })
    })

    it('should fail with invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })

      expect(response.status).toBe(401)
      expect(response.body.detail).toBe('Credenciales inválidas')
    })

    it('should fail with inactive user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        isActive: false,
      }

      prisma.user.findUnique.mockResolvedValue(mockUser)

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })

      expect(response.status).toBe(403)
      expect(response.body.detail).toBe('Cuenta desactivada')
    })

    it('should validate input data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: '123', // Too short
        })

      expect(response.status).toBe(400)
      expect(response.body.detail).toContain('Validation error')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          isActive: true,
          organizationId: 'org-1',
          organization: {
            id: 'org-1',
            name: 'Test Org',
          },
        },
      }

      prisma.session.findFirst.mockResolvedValue(mockSession)
      prisma.session.update.mockResolvedValue({
        ...mockSession,
        refreshToken: 'new-refresh-token',
        lastUsedAt: new Date(),
      })

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.refreshToken).not.toBe('valid-refresh-token')
    })

    it('should fail with invalid refresh token', async () => {
      prisma.session.findFirst.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })

      expect(response.status).toBe(401)
      expect(response.body.detail).toBe('Token de actualización inválido')
    })

    it('should fail with expired refresh token', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        refreshToken: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // Expired
        isRevoked: false,
      }

      prisma.session.findFirst.mockResolvedValue(mockSession)

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'expired-token',
        })

      expect(response.status).toBe(401)
      expect(response.body.detail).toBe('Token de actualización expirado')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const mockSession = {
        id: 'session-1',
        userId: 'user-1',
      }

      // Mock JWT verification
      const token = jwt.sign({ userId: 'user-1', sessionId: 'session-1' }, 'test-secret')
      
      prisma.session.update.mockResolvedValue(mockSession)
      prisma.auditLog.create.mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Sesión cerrada exitosamente')
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true },
      })
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'org-1',
        organization: {
          id: 'org-1',
          name: 'Test Org',
        },
        permissions: ['users:read', 'users:write'],
      }

      const token = jwt.sign({ userId: 'user-1', sessionId: 'session-1' }, 'test-secret')
      
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'org-1',
        organizationName: 'Test Org',
        permissions: ['users:read', 'users:write'],
      })
    })

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/auth/sessions', () => {
    it('should return user sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          isCurrentSession: true,
        },
        {
          id: 'session-2',
          deviceName: 'Mobile App',
          ipAddress: '10.0.0.1',
          userAgent: 'MobileApp/1.0',
          createdAt: new Date(Date.now() - 86400000),
          lastUsedAt: new Date(Date.now() - 3600000),
          isCurrentSession: false,
        },
      ]

      const token = jwt.sign({ userId: 'user-1', sessionId: 'session-1' }, 'test-secret')
      
      prisma.session.findMany.mockResolvedValue(mockSessions)

      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(2)
      expect(response.body[0].isCurrentSession).toBe(true)
    })
  })

  describe('POST /api/auth/sessions/:sessionId/revoke', () => {
    it('should revoke session successfully', async () => {
      const token = jwt.sign({ userId: 'user-1', sessionId: 'session-1' }, 'test-secret')
      
      prisma.session.update.mockResolvedValue({})
      prisma.auditLog.create.mockResolvedValue({})

      const response = await request(app)
        .post('/api/auth/sessions/session-2/revoke')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Sesión revocada exitosamente')
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: {
          id: 'session-2',
          userId: 'user-1',
        },
        data: { isRevoked: true },
      })
    })

    it('should not allow revoking current session', async () => {
      const token = jwt.sign({ userId: 'user-1', sessionId: 'session-1' }, 'test-secret')
      
      const response = await request(app)
        .post('/api/auth/sessions/session-1/revoke')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(400)
      expect(response.body.detail).toBe('No puedes revocar la sesión actual')
    })
  })
})