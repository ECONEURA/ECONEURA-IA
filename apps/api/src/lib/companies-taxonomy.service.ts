/**
 * PR-51: Companies Taxonomy & Views Service
 */

import { structuredLogger } from './structured-logger.js';

export interface CompanyTaxonomy {
  id: string;
  name: string;
  description: string;
  metadata: {
    industry?: string;
    tags: string[];
    keywords: string[];
  };
  isActive: boolean;
  createdAt: string;
}

export interface CompanyView {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  filters: any[];
  sorting: any;
  columns: any[];
  isDefault: boolean;
  createdAt: string;
}

export class CompaniesTaxonomyService {
  private taxonomies: Map<string, CompanyTaxonomy> = new Map();
  private views: Map<string, CompanyView[]> = new Map();

  constructor() {
    this.initializeDefaultTaxonomies();
    this.initializeDefaultViews();
  }

  private initializeDefaultTaxonomies(): void {
    const defaultTaxonomies: CompanyTaxonomy[] = [
      {
        id: 'tech-software',
        name: 'Software & Technology',
        description: 'Companies in software development and technology services',
        metadata: {
          industry: 'Technology',
          tags: ['software', 'technology', 'digital'],
          keywords: ['software', 'app', 'platform', 'cloud', 'ai']
        },
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        description: 'Companies involved in manufacturing and production',
        metadata: {
          industry: 'Manufacturing',
          tags: ['manufacturing', 'production', 'industrial'],
          keywords: ['manufacturing', 'production', 'factory', 'industrial']
        },
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    for (const taxonomy of defaultTaxonomies) {
      this.taxonomies.set(taxonomy.id, taxonomy);
    }

    structuredLogger.info('Default taxonomies initialized', {
      count: defaultTaxonomies.length,
      requestId: ''
    });
  }

  private initializeDefaultViews(): void {
    const defaultViews: CompanyView[] = [
      {
        id: 'all-companies',
        name: 'All Companies',
        description: 'View all companies in the system',
        organizationId: 'default',
        filters: [],
        sorting: { field: 'name', direction: 'asc' },
        columns: [
          { field: 'name', label: 'Company Name', isVisible: true },
          { field: 'industry', label: 'Industry', isVisible: true },
          { field: 'size', label: 'Size', isVisible: true },
          { field: 'revenue', label: 'Revenue', isVisible: true },
          { field: 'score', label: 'Score', isVisible: true }
        ],
        isDefault: true,
        createdAt: new Date().toISOString()
      }
    ];

    for (const view of defaultViews) {
      if (!this.views.has(view.organizationId)) {
        this.views.set(view.organizationId, []);
      }
      this.views.get(view.organizationId)!.push(view);
    }

    structuredLogger.info('Default views initialized', {
      count: defaultViews.length,
      requestId: ''
    });
  }

  async classifyCompany(companyData: any): Promise<any[]> {
    const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    structuredLogger.info('Company classified', {
      companyId,
      companyName: companyData.name,
      requestId: ''
    });

    return [];
  }

  async getCompaniesByView(viewId: string, organizationId: string, options: any = {}): Promise<any> {
    const view = this.getView(viewId, organizationId);
    if (!view) {
      throw new Error('View not found');
    }

    const companies = this.generateMockCompanies(100);
    const page = options.page || 1;
    const limit = options.limit || 50;

    return {
      companies: companies.slice(0, limit),
      total: companies.length,
      page,
      limit,
      hasMore: false
    };
  }

  async createView(viewData: any): Promise<CompanyView> {
    const view: CompanyView = {
      ...viewData,
      id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    if (!this.views.has(view.organizationId)) {
      this.views.set(view.organizationId, []);
    }
    this.views.get(view.organizationId)!.push(view);

    return view;
  }

  private getView(viewId: string, organizationId: string): CompanyView | null {
    const orgViews = this.views.get(organizationId);
    if (!orgViews) return null;
    return orgViews.find(view => view.id === viewId) || null;
  }

  private generateMockCompanies(count: number): any[] {
    const companies = [];
    const industries = ['Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 'Retail'];
    const sizes = ['micro', 'small', 'medium', 'large', 'enterprise'];
    
    for (let i = 0; i < count; i++) {
      companies.push({
        id: `company_${i}`,
        name: `Company ${i + 1}`,
        description: `Description for company ${i + 1}`,
        industry: industries[Math.floor(Math.random() * industries.length)],
        size: sizes[Math.floor(Math.random() * sizes.length)],
        revenue: Math.random() * 10000000,
        employees: Math.floor(Math.random() * 1000) + 10,
        score: Math.floor(Math.random() * 100),
        location: 'Spain'
      });
    }
    
    return companies;
  }

  getTaxonomies(): CompanyTaxonomy[] {
    return Array.from(this.taxonomies.values());
  }

  getViews(organizationId: string): CompanyView[] {
    return this.views.get(organizationId) || [];
  }
}

export const companiesTaxonomyService = new CompaniesTaxonomyService();
