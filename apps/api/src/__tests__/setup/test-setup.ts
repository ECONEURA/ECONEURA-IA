// ============================================================================
// TEST SETUP - Configuración global para todos los tests
// ============================================================================

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { getDatabaseService } from '../../lib/database.service.js';
import { getRedisService } from '../../lib/redis.service.js';
import { structuredLogger } from '../../lib/structured-logger.js';

// ========================================================================
// CONFIGURACIÓN GLOBAL DE TESTS
// ========================================================================

beforeAll(async () => {
  // Configurar logger para tests
  structuredLogger.level = 'error'; // Solo errores en tests

  // Inicializar servicios de base de datos
  try {
    const db = getDatabaseService();
    await db.initialize();

    const redis = getRedisService();
    await redis.connect();

    console.log('✅ Test setup completed');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Limpiar recursos
  try {
    const db = getDatabaseService();
    await db.close();

    const redis = getRedisService();
    await redis.disconnect();

    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

beforeEach(async () => {
  // Limpiar base de datos antes de cada test
  const db = getDatabaseService();
  await db.cleanup();
});

afterEach(async () => {
  // Limpiar Redis después de cada test
  const redis = getRedisService();
  await redis.flushAll();
});

// ========================================================================
// UTILIDADES DE TEST
// ========================================================================

export const testUtils = {
  // Generar datos de prueba
  generateTestUser: (overrides: any = {}) => ({
    id: crypto.randomUUID(),
    organizationId: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  generateTestCompany: (overrides: any = {}) => ({
    id: crypto.randomUUID(),
    organizationId: crypto.randomUUID(),
    name: `Test Company ${Date.now()}`,
    email: `company-${Date.now()}@example.com`,
    phone: '+1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  generateTestContact: (overrides: any = {}) => ({
    id: crypto.randomUUID(),
    organizationId: crypto.randomUUID(),
    companyId: crypto.randomUUID(),
    firstName: 'Test',
    lastName: 'Contact',
    email: `contact-${Date.now()}@example.com`,
    phone: '+1234567890',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Esperar con timeout
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Validar respuesta de API
  validateApiResponse: (response: any, expectedStatus: number = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success');
    if (expectedStatus === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
    }
  },

  // Validar paginación
  validatePagination: (response: any) => {
    expect(response.body.data).toHaveProperty('pagination');
    expect(response.body.data.pagination).toHaveProperty('page');
    expect(response.body.data.pagination).toHaveProperty('limit');
    expect(response.body.data.pagination).toHaveProperty('total');
    expect(response.body.data.pagination).toHaveProperty('totalPages');
  }
};

// ========================================================================
// MOCKS GLOBALES
// ========================================================================

// Mock de servicios externos
export const mockExternalServices = {
  azureOpenAI: {
    generateText: vi.fn().mockResolvedValue('Mocked AI response'),
    analyzeSentiment: vi.fn().mockResolvedValue({
      sentiment: 'positive',
      confidence: 0.85,
      emotions: ['joy', 'satisfaction']
    })
  },

  emailService: {
    sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-id' })
  },

  smsService: {
    sendSMS: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-id' })
  }
};

// ========================================================================
// CONFIGURACIÓN DE AMBIENTE DE TEST
// ========================================================================

export const testConfig = {
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/econeura_test',
    maxConnections: 5
  },
  redis: {
    url: process.env.TEST_REDIS_URL || 'redis://localhost:6379/1'
  },
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 10000
  }
};

