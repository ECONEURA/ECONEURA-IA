import { describe, it, expect, beforeEach } from 'vitest';
import { CompaniesTaxonomyService } from '../../../lib/companies-taxonomy.service.js';

describe('CompaniesTaxonomyService', () => {
  let service: CompaniesTaxonomyService;

  beforeEach(() => {
    service = new CompaniesTaxonomyService();
  });

  describe('getTaxonomies', () => {
    it('should return all taxonomies', () => {
      const taxonomies = service.getTaxonomies();

      expect(taxonomies).toBeDefined();
      expect(Array.isArray(taxonomies)).toBe(true);
      expect(taxonomies.length).toBeGreaterThan(0);

      // Check structure of first taxonomy
      const firstTaxonomy = taxonomies[0];
      expect(firstTaxonomy).toHaveProperty('id');
      expect(firstTaxonomy).toHaveProperty('name');
      expect(firstTaxonomy).toHaveProperty('description');
      expect(firstTaxonomy).toHaveProperty('metadata');
      expect(firstTaxonomy).toHaveProperty('isActive');
      expect(firstTaxonomy).toHaveProperty('createdAt');
    });

    it('should return taxonomies with correct metadata structure', () => {
      const taxonomies = service.getTaxonomies();
      const taxonomy = taxonomies[0];

      expect(taxonomy.metadata).toHaveProperty('tags');
      expect(taxonomy.metadata).toHaveProperty('keywords');
      expect(Array.isArray(taxonomy.metadata.tags)).toBe(true);
      expect(Array.isArray(taxonomy.metadata.keywords)).toBe(true);
    });
  });

  describe('getViews', () => {
    it('should return views for existing organization', () => {
      const views = service.getViews('default');

      expect(views).toBeDefined();
      expect(Array.isArray(views)).toBe(true);
      expect(views.length).toBeGreaterThan(0);

      // Check structure of first view
      const firstView = views[0];
      expect(firstView).toHaveProperty('id');
      expect(firstView).toHaveProperty('name');
      expect(firstView).toHaveProperty('description');
      expect(firstView).toHaveProperty('organizationId');
      expect(firstView).toHaveProperty('filters');
      expect(firstView).toHaveProperty('sorting');
      expect(firstView).toHaveProperty('columns');
      expect(firstView).toHaveProperty('isDefault');
      expect(firstView).toHaveProperty('createdAt');
    });

    it('should return empty array for non-existing organization', () => {
      const views = service.getViews('non-existing-org');

      expect(views).toBeDefined();
      expect(Array.isArray(views)).toBe(true);
      expect(views.length).toBe(0);
    });
  });

  describe('createView', () => {
    it('should create a new view successfully', async () => {
      const viewData = {
        name: 'Test View',
        description: 'A test view',
        organizationId: 'test-org',
        filters: [],
        sorting: { field: 'name', direction: 'asc' },
        columns: [
          { field: 'name', label: 'Name', isVisible: true }
        ],
        isDefault: false
      };

      const view = await service.createView(viewData);

      expect(view).toBeDefined();
      expect(view.id).toBeDefined();
      expect(view.name).toBe(viewData.name);
      expect(view.description).toBe(viewData.description);
      expect(view.organizationId).toBe(viewData.organizationId);
      expect(view.createdAt).toBeDefined();
    });

    it('should add view to organization views', async () => {
      const viewData = {
        name: 'Test View 2',
        description: 'Another test view',
        organizationId: 'test-org-2',
        filters: [],
        sorting: { field: 'name', direction: 'asc' },
        columns: [],
        isDefault: false
      };

      await service.createView(viewData);
      const views = service.getViews('test-org-2');

      expect(views.length).toBe(1);
      expect(views[0].name).toBe(viewData.name);
    });
  });

  describe('classifyCompany', () => {
    it('should classify a company successfully', async () => {
      const companyData = {
        name: 'Test Company',
        description: 'A test company',
        industry: 'Technology',
        keywords: ['software', 'ai']
      };

      const classifications = await service.classifyCompany(companyData);

      expect(classifications).toBeDefined();
      expect(Array.isArray(classifications)).toBe(true);
    });

    it('should handle company data with minimal information', async () => {
      const companyData = {
        name: 'Minimal Company'
      };

      const classifications = await service.classifyCompany(companyData);

      expect(classifications).toBeDefined();
      expect(Array.isArray(classifications)).toBe(true);
    });
  });

  describe('getCompaniesByView', () => {
    it('should return companies for existing view', async () => {
      const result = await service.getCompaniesByView('all-companies', 'default', {
        page: 1,
        limit: 10
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('companies');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('hasMore');

      expect(Array.isArray(result.companies)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.limit).toBe('number');
      expect(typeof result.hasMore).toBe('boolean');
    });

    it('should throw error for non-existing view', async () => {
      await expect(
        service.getCompaniesByView('non-existing-view', 'default');
      ).rejects.toThrow('View not found');
    });

    it('should return companies with correct structure', async () => {
      const result = await service.getCompaniesByView('all-companies', 'default', {
        page: 1,
        limit: 5
      });

      if (result.companies.length > 0) {
        const company = result.companies[0];
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('description');
        expect(company).toHaveProperty('industry');
        expect(company).toHaveProperty('size');
        expect(company).toHaveProperty('revenue');
        expect(company).toHaveProperty('employees');
        expect(company).toHaveProperty('score');
        expect(company).toHaveProperty('location');
      }
    });

    it('should respect pagination parameters', async () => {
      const result = await service.getCompaniesByView('all-companies', 'default', {
        page: 1,
        limit: 3
      });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
      expect(result.companies.length).toBeLessThanOrEqual(3);
    });
  });

  describe('default taxonomies initialization', () => {
    it('should have tech-software taxonomy', () => {
      const taxonomies = service.getTaxonomies();
      const techTaxonomy = taxonomies.find(t => t.id === 'tech-software');

      expect(techTaxonomy).toBeDefined();
      expect(techTaxonomy?.name).toBe('Software & Technology');
      expect(techTaxonomy?.metadata.industry).toBe('Technology');
      expect(techTaxonomy?.isActive).toBe(true);
    });

    it('should have manufacturing taxonomy', () => {
      const taxonomies = service.getTaxonomies();
      const manufacturingTaxonomy = taxonomies.find(t => t.id === 'manufacturing');

      expect(manufacturingTaxonomy).toBeDefined();
      expect(manufacturingTaxonomy?.name).toBe('Manufacturing');
      expect(manufacturingTaxonomy?.metadata.industry).toBe('Manufacturing');
      expect(manufacturingTaxonomy?.isActive).toBe(true);
    });
  });

  describe('default views initialization', () => {
    it('should have all-companies view', () => {
      const views = service.getViews('default');
      const allCompaniesView = views.find(v => v.id === 'all-companies');

      expect(allCompaniesView).toBeDefined();
      expect(allCompaniesView?.name).toBe('All Companies');
      expect(allCompaniesView?.isDefault).toBe(true);
      expect(allCompaniesView?.organizationId).toBe('default');
    });
  });
});
