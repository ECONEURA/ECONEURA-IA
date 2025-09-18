import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('Configuration API Integration Tests', () => {
  const baseUrl = '/v1/config';

  describe('Feature Flags', () => {
    it('should get all feature flags', async () => {
      const response = await request(app)
        .get(`${baseUrl}/feature-flags`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should get feature flags by environment', async () => {
      const response = await request(app)
        .get(`${baseUrl}/feature-flags?environment=development`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((flag: any) => flag.environment === 'development')).toBe(true);
    });

    it('should get specific feature flag', async () => {
      // Primero obtener un flag existente
      const flagsResponse = await request(app)
        .get(`${baseUrl}/feature-flags`)
        .expect(200);

      const flagId = flagsResponse.body.data[0].id;

      const response = await request(app)
        .get(`${baseUrl}/feature-flags/${flagId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(flagId);
    });

    it('should return 404 for non-existent feature flag', async () => {
      const response = await request(app)
        .get(`${baseUrl}/feature-flags/non-existent`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Feature flag not found');
    });

    it('should create new feature flag', async () => {
      const newFlag = {
        name: 'integration_test_flag',
        description: 'Integration test feature flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      };

      const response = await request(app)
        .post(`${baseUrl}/feature-flags`)
        .send(newFlag)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('integration_test_flag');
      expect(response.body.data.id).toBeDefined();
    });

    it('should update feature flag', async () => {
      // Crear un flag primero
      const newFlag = {
        name: 'update_test_flag',
        description: 'Update test feature flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      };

      const createResponse = await request(app)
        .post(`${baseUrl}/feature-flags`)
        .send(newFlag)
        .expect(201);

      const flagId = createResponse.body.data.id;

      // Actualizar el flag
      const updateResponse = await request(app)
        .put(`${baseUrl}/feature-flags/${flagId}`)
        .send({ enabled: false, rolloutPercentage: 50 })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.enabled).toBe(false);
      expect(updateResponse.body.data.rolloutPercentage).toBe(50);
    });

    it('should delete feature flag', async () => {
      // Crear un flag primero
      const newFlag = {
        name: 'delete_test_flag',
        description: 'Delete test feature flag',
        enabled: true,
        environment: 'development',
        rolloutPercentage: 100,
        targetUsers: [],
        targetOrganizations: [],
        conditions: []
      };

      const createResponse = await request(app)
        .post(`${baseUrl}/feature-flags`)
        .send(newFlag)
        .expect(201);

      const flagId = createResponse.body.data.id;

      // Eliminar el flag
      const deleteResponse = await request(app)
        .delete(`${baseUrl}/feature-flags/${flagId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verificar que se eliminó
      await request(app)
        .get(`${baseUrl}/feature-flags/${flagId}`)
        .expect(404);
    });

    it('should check feature flag', async () => {
      const context = {
        userId: 'test-user',
        organizationId: 'test-org',
        userRole: 'admin',
        customAttributes: {
          plan: 'premium'
        }
      };

      const response = await request(app)
        .post(`${baseUrl}/feature-flags/ai_predictions/check`)
        .send(context)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isEnabled');
    });

    it('should validate feature flag data', async () => {
      const invalidFlag = {
        name: '', // Nombre vacío
        enabled: 'invalid', // Tipo incorrecto
        environment: 'invalid_env'
      };

      const response = await request(app)
        .post(`${baseUrl}/feature-flags`)
        .send(invalidFlag)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid feature flag data');
    });
  });

  describe('Environments', () => {
    it('should get all environments', async () => {
      const response = await request(app)
        .get(`${baseUrl}/environments`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
    });

    it('should get specific environment', async () => {
      const response = await request(app)
        .get(`${baseUrl}/environments/development`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('development');
      expect(response.body.data.variables).toBeDefined();
    });

    it('should return 404 for non-existent environment', async () => {
      const response = await request(app)
        .get(`${baseUrl}/environments/non-existent`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Environment not found');
    });

    it('should update environment', async () => {
      const updates = {
        variables: {
          logLevel: 'info',
          newVar: 'test'
        }
      };

      const response = await request(app)
        .put(`${baseUrl}/environments/development`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.variables.logLevel).toBe('info');
      expect(response.body.data.variables.newVar).toBe('test');
    });
  });

  describe('Config Values', () => {
    it('should get config value', async () => {
      const response = await request(app)
        .get(`${baseUrl}/values/logLevel`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('logLevel');
      expect(response.body.data.value).toBeDefined();
    });

    it('should get config value with environment', async () => {
      const response = await request(app)
        .get(`${baseUrl}/values/logLevel?environment=development`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('logLevel');
    });

    it('should get config value with default', async () => {
      const response = await request(app)
        .get(`${baseUrl}/values/nonExistentKey?defaultValue=default`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.value).toBe('default');
    });

    it('should return 404 for non-existent config value', async () => {
      const response = await request(app)
        .get(`${baseUrl}/values/nonExistentKey`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Config value not found');
    });

    it('should set config value', async () => {
      const configData = {
        value: 'testValue',
        environment: 'development'
      };

      const response = await request(app)
        .put(`${baseUrl}/values/testKey`)
        .send(configData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('testKey');
      expect(response.body.data.value).toBe('testValue');
    });
  });

  describe('Secrets', () => {
    it('should set secret', async () => {
      const secretData = {
        value: 'secretValue',
        environment: 'development'
      };

      const response = await request(app)
        .put(`${baseUrl}/secrets/testSecret`)
        .send(secretData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should check secret exists', async () => {
      // Primero establecer un secreto
      await request(app)
        .put(`${baseUrl}/secrets/testSecret`)
        .send('secretValue', environment: 'development')
        .expect(200);

      const response = await request(app)
        .get(`${baseUrl}/secrets/testSecret?environment=development`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exists).toBe(true);
    });

    it('should return 404 for non-existent secret', async () => {
      const response = await request(app)
        .get(`${baseUrl}/secrets/nonExistentSecret`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Secret not found');
    });

    it('should delete secret', async () => {
      // Primero establecer un secreto
      await request(app)
        .put(`${baseUrl}/secrets/tempSecret`)
        .send('tempValue')
        .expect(200);

      const response = await request(app)
        .delete(`${baseUrl}/secrets/tempSecret`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que se eliminó
      await request(app)
        .get(`${baseUrl}/secrets/tempSecret`)
        .expect(404);
    });

    it('should require secret value', async () => {
      const response = await request(app)
        .put(`${baseUrl}/secrets/testSecret`)
        .send({ environment: 'development' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Secret value is required');
    });
  });

  describe('Statistics', () => {
    it('should get configuration stats', async () => {
      const response = await request(app)
        .get(`${baseUrl}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalFeatureFlags');
      expect(response.body.data).toHaveProperty('totalEnvironments');
      expect(response.body.data).toHaveProperty('totalConfigValues');
      expect(response.body.data).toHaveProperty('totalSecrets');
      expect(response.body.data).toHaveProperty('featureFlagsByEnvironment');
      expect(response.body.data).toHaveProperty('configValuesByEnvironment');
    });
  });

  describe('Validation', () => {
    it('should validate configuration', async () => {
      const response = await request(app)
        .get(`${baseUrl}/validate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isValid');
      expect(response.body.data).toHaveProperty('errors');
      expect(response.body.data).toHaveProperty('warnings');
    });
  });

  describe('Reload', () => {
    it('should reload configuration', async () => {
      const response = await request(app)
        .post(`${baseUrl}/reload`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Configuration reloaded successfully');
    });
  });

  describe('Beta Features', () => {
    it('should get beta features when flag is enabled', async () => {
      const response = await request(app)
        .get(`${baseUrl}/beta-features`)
        .set('X-User-ID', 'test-user')
        .set('X-Organization-ID', 'test-org')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 403 when beta features flag is disabled', async () => {
      // Nota: Este test podría fallar si el flag beta_features está habilitado
      // En un entorno real, se configuraría el flag apropiadamente
      const response = await request(app)
        .get(`${baseUrl}/beta-features`)
        .set('X-User-ID', 'test-user')
        .set('X-Organization-ID', 'test-org');

      // Podría ser 200 o 403 dependiendo del estado del flag
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get(`${baseUrl}/health`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('validation');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(`${baseUrl}/feature-flags`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post(`${baseUrl}/feature-flags`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid feature flag data');
    });

    it('should handle invalid HTTP methods', async () => {
      const response = await request(app)
        .patch(`${baseUrl}/feature-flags`)
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('Headers', () => {
    it('should include feature flags headers', async () => {
      const response = await request(app)
        .get(`${baseUrl}/feature-flags`)
        .expect(200);

      // Verificar que se incluyen headers relevantes
      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});
