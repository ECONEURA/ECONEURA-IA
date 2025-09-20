import { structuredLogger } from './structured-logger.js';
export class CompaniesTaxonomyService {
    taxonomies = new Map();
    views = new Map();
    constructor() {
        this.initializeDefaultTaxonomies();
        this.initializeDefaultViews();
    }
    initializeDefaultTaxonomies() {
        const defaultTaxonomies = [
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
    initializeDefaultViews() {
        const defaultViews = [
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
            this.views.get(view.organizationId).push(view);
        }
        structuredLogger.info('Default views initialized', {
            count: defaultViews.length,
            requestId: ''
        });
    }
    async classifyCompany(companyData) {
        const companyId = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        structuredLogger.info('Company classified', {
            companyId,
            companyName: companyData.name,
            requestId: ''
        });
        return [];
    }
    async getCompaniesByView(viewId, organizationId, options = {}) {
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
    async createView(viewData) {
        const view = {
            ...viewData,
            id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString()
        };
        if (!this.views.has(view.organizationId)) {
            this.views.set(view.organizationId, []);
        }
        this.views.get(view.organizationId).push(view);
        return view;
    }
    getView(viewId, organizationId) {
        const orgViews = this.views.get(organizationId);
        if (!orgViews)
            return null;
        return orgViews.find(view => view.id === viewId) || null;
    }
    generateMockCompanies(count) {
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
    getTaxonomies() {
        return Array.from(this.taxonomies.values());
    }
    getViews(organizationId) {
        return this.views.get(organizationId) || [];
    }
}
export const companiesTaxonomyService = new CompaniesTaxonomyService();
//# sourceMappingURL=companies-taxonomy.service.js.map