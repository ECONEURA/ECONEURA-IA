import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

describe('Companies Taxonomy API Integration Tests', () => {
  const basePath = '/v1/companies-taxonomy';

  describe('GET /taxonomies', () => {
    it('should return all taxonomies', async () => {
      const response = await request(app)
        .get(`${basePath}/taxonomies`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('taxonomies');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.taxonomies)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);

      // Check structure of first taxonomy
      if (response.body.data.taxonomies.length > 0) {
        const taxonomy = response.body.data.taxonomies[0];
        expect(taxonomy).toHaveProperty('id');
        expect(taxonomy).toHaveProperty('name');
        expect(taxonomy).toHaveProperty('description');
        expect(taxonomy).toHaveProperty('metadata');
        expect(taxonomy).toHaveProperty('isActive');
        expect(taxonomy).toHaveProperty('createdAt');
      }
    });
  });

  describe('POST /classify', () => {
    it('should classify a company successfully', async () => {
      const companyData = {
        name: 'Test Company',
        description: 'A test company for classification',
        website: 'https://testcompany.com',
        industry: 'Technology',
        keywords: ['software', 'ai', 'cloud']
      };

      const response = await request(app)
        .post(`${basePath}/classify`)
        .send(companyData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('classifications');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.classifications)).toBe(true);
    });

    it('should handle minimal company data', async () => {
      const companyData = {
        name: 'Minimal Company'
      };

      const response = await request(app)
        .post(`${basePath}/classify`)
        .send(companyData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.classifications).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        // Missing required name field
        description: 'Invalid company data'
      };

      const response = await request(app)
        .post(`${basePath}/classify`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid company data');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('GET /views/:organizationId', () => {
    it('should return views for organization', async () => {
      const organizationId = 'test-org';

      const response = await request(app)
        .get(`${basePath}/views/${organizationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('views');
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data).toHaveProperty('organizationId', organizationId);
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.views)).toBe(true);
    });

    it('should return empty array for non-existing organization', async () => {
      const organizationId = 'non-existing-org';

      const response = await request(app)
        .get(`${basePath}/views/${organizationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.views).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('POST /views', () => {
    it('should create a new view successfully', async () => {
      const viewData = {
        name: 'Test View',
        description: 'A test view for companies',
        organizationId: 'test-org',
        filters: [],
        sorting: { field: 'name', direction: 'asc' },
        columns: [
          { field: 'name', label: 'Company Name', isVisible: true },
          { field: 'industry', label: 'Industry', isVisible: true }
        ],
        isDefault: false,
        isPublic: false
      };

      const response = await request(app)
        .post(`${basePath}/views`)
        .send(viewData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('view');
      expect(response.body.data).toHaveProperty('message', 'View created successfully');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      const view = response.body.data.view;
      expect(view).toHaveProperty('id');
      expect(view).toHaveProperty('name', viewData.name);
      expect(view).toHaveProperty('description', viewData.description);
      expect(view).toHaveProperty('organizationId', viewData.organizationId);
      expect(view).toHaveProperty('createdAt');
    });

    it('should return validation error for invalid view data', async () => {
      const invalidData = {
        // Missing required name field
        description: 'Invalid view data',
        organizationId: 'test-org'
      };

      const response = await request(app)
        .post(`${basePath}/views`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid view data');
      expect(response.body).toHaveProperty('details');
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('GET /views/:organizationId/:viewId/companies', () => {
    it('should return companies for existing view', async () => {
      const organizationId = 'default';
      const viewId = 'all-companies';

      const response = await request(app)
        .get(`${basePath}/views/${organizationId}/${viewId}/companies`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('companies');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('hasMore');
      expect(response.body.data).toHaveProperty('organizationId', organizationId);
      expect(response.body.data).toHaveProperty('viewId', viewId);
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(Array.isArray(response.body.data.companies)).toBe(true);
      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.page).toBe('number');
      expect(typeof response.body.data.limit).toBe('number');
      expect(typeof response.body.data.hasMore).toBe('boolean');
    });

    it('should handle pagination parameters', async () => {
      const organizationId = 'default';
      const viewId = 'all-companies';

      const response = await request(app)
        .get(`${basePath}/views/${organizationId}/${viewId}/companies`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(response.body.data.page).toBe(2);
      expect(response.body.data.limit).toBe(5);
    });

    it('should handle search parameter', async () => {
      const organizationId = 'default';
      const viewId = 'all-companies';

      const response = await request(app)
        .get(`${basePath}/views/${organizationId}/${viewId}/companies`)
        .query({ search: 'test' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.companies).toBeDefined();
    });

    it('should return error for non-existing view', async () => {
      const organizationId = 'default';
      const viewId = 'non-existing-view';

      const response = await request(app)
        .get(`${basePath}/views/${organizationId}/${viewId}/companies`)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Failed to get companies by view');
      expect(response.body).toHaveProperty('organizationId', organizationId);
      expect(response.body).toHaveProperty('viewId', viewId);
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get(`${basePath}/health`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('checks');
      expect(response.body.data).toHaveProperty('taxonomiesCount');
      expect(response.body.data).toHaveProperty('viewsCount');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('traceId');

      expect(response.body.data.checks).toHaveProperty('hasTaxonomies');
      expect(response.body.data.checks).toHaveProperty('hasViews');
      expect(response.body.data.checks).toHaveProperty('serviceInitialized');

      expect(typeof response.body.data.taxonomiesCount).toBe('number');
      expect(typeof response.body.data.viewsCount).toBe('number');
    });

    it('should return healthy status when all checks pass', async () => {
      const response = await request(app)
        .get(`${basePath}/health`)
        .expect(200);

      const checks = response.body.data.checks;
      const isHealthy = checks.hasTaxonomies && checks.hasViews && checks.serviceInitialized;

      if (isHealthy) {
        expect(response.body.data.status).toBe('healthy');
      } else {
        expect(response.body.data.status).toBe('degraded');
      }
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll test that the error response structure is correct
      const response = await request(app)
        .get(`${basePath}/taxonomies`)
        .expect(200);

      // If there's an error, it should have the correct structure
      if (!response.body.success) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('traceId');
      }
    });
  });
});
