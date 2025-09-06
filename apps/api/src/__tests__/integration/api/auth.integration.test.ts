// ============================================================================
// AUTH INTEGRATION TESTS - Tests de integración para autenticación
// ============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';
import { getDatabaseService } from '../../../lib/database.service.js';
import { testUtils } from '../setup/test-setup.js';

// ========================================================================
// CONFIGURACIÓN DE TESTS
// ========================================================================

describe('Auth Integration Tests', () => {
  let db: any;
  let testUser: any;
  let testOrganization: any;

  beforeAll(async () => {
    db = getDatabaseService();
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Limpiar base de datos
    await db.cleanup();
    
    // Crear organización de prueba
    testOrganization = await db.organizations.create({
      id: crypto.randomUUID(),
      name: 'Test Organization',
      email: 'test@organization.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Crear usuario de prueba
    testUser = await db.users.create({
      id: crypto.randomUUID(),
      organizationId: testOrganization.id,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedpassword',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail with invalid email', async () => {
      const loginData = {
        email: 'invalid@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail with missing email', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');
    });

    it('should fail with missing password', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password is required');
    });

    it('should fail with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email format');
    });
  });

  describe('POST /v1/auth/register', () => {
    it('should register successfully with valid data', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        organizationName: 'New Organization'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    it('should fail with existing email', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        organizationName: 'Test Organization'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(registerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User already exists');
    });

    it('should fail with weak password', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: '123',
        firstName: 'New',
        lastName: 'User',
        organizationName: 'New Organization'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password must be at least 8 characters');
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Primero hacer login
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should logout successfully', async () => {
      // Primero hacer login
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return user profile with valid token', async () => {
      // Primero hacer login
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to login endpoint', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Hacer múltiples requests rápidos
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/v1/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // Al menos uno debería ser rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});

