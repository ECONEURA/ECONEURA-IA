import { structuredLogger } from './structured-logger.js';

// Companies Taxonomy & Views Service - PR-37
// Sistema completo de taxonomía y vistas de empresas

interface Company {
  id: string;
  organizationId: string;
  name: string;
  legalName: string;
  code: string;
  type: 'corporation' | 'llc' | 'partnership' | 'sole_proprietorship' | 'non_profit' | 'government' | 'other';
  status: 'active' | 'inactive' | 'suspended' | 'merged' | 'acquired' | 'dissolved';
  
  // Basic Information
  basicInfo: {
    foundedYear?: number;
    headquarters: {
      address: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    website?: string;
    description?: string;
    mission?: string;
    vision?: string;
  };
  
  // Business Information
  businessInfo: {
    industry: string;
    subIndustry?: string;
    businessModel: 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'saas' | 'ecommerce' | 'consulting' | 'manufacturing' | 'other';
    revenueModel: 'subscription' | 'transaction' | 'advertising' | 'freemium' | 'licensing' | 'consulting' | 'other';
    employeeCount?: number;
    annualRevenue?: number;
    currency: string;
    marketCap?: number;
    fundingStage?: 'bootstrap' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'series_d' | 'ipo' | 'acquired';
    lastFundingAmount?: number;
    lastFundingDate?: string;
  };
  
  // Taxonomy Classification
  taxonomy: {
    primaryCategory: string;
    secondaryCategories: string[];
    tags: string[];
    keywords: string[];
    naicsCode?: string;
    sicCode?: string;
    isicCode?: string;
    customClassification?: string;
  };
  
  // Financial Information
  financialInfo: {
    creditRating?: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';
    riskLevel: 'low' | 'medium' | 'high' | 'very_high';
    paymentTerms: {
      standardDays: number;
      earlyPaymentDiscount?: number;
      latePaymentPenalty?: number;
    };
    bankingInfo?: {
      bankName?: string;
      accountNumber?: string;
      routingNumber?: string;
      swiftCode?: string;
    };
  };
  
  // Contact Information
  contactInfo: {
    primaryContact: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
    billingContact?: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
    technicalContact?: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
    addresses: {
      type: 'headquarters' | 'billing' | 'shipping' | 'office' | 'warehouse';
      address: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
      isPrimary: boolean;
    }[];
  };
  
  // Relationships
  relationships: {
    parentCompany?: string;
    subsidiaries: string[];
    partners: string[];
    competitors: string[];
    suppliers: string[];
    customers: string[];
  };
  
  // Social Media & Online Presence
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    other?: Record<string, string>;
  };
  
  // Compliance & Certifications
  compliance: {
    certifications: string[];
    licenses: string[];
    regulatoryCompliance: string[];
    dataProtectionCompliance: string[];
    lastAuditDate?: string;
    nextAuditDate?: string;
  };
  
  // Performance Metrics
  metrics: {
    customerSatisfaction?: number;
    netPromoterScore?: number;
    marketShare?: number;
    growthRate?: number;
    profitability?: number;
    lastUpdated: string;
  };
  
  // Metadata
  metadata: {
    source: string;
    lastVerified: string;
    dataQuality: 'high' | 'medium' | 'low';
    customFields?: Record<string, any>;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface CompanyView {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'standard' | 'custom' | 'analytical' | 'comparative' | 'dashboard';
  isDefault: boolean;
  isPublic: boolean;
  
  // View Configuration
  configuration: {
    filters: {
      industry?: string[];
      status?: string[];
      type?: string[];
      size?: string[];
      location?: string[];
      tags?: string[];
      customFilters?: Record<string, any>;
    };
    sorting: {
      field: string;
      direction: 'asc' | 'desc';
    };
    grouping?: {
      field: string;
      enabled: boolean;
    };
    pagination: {
      pageSize: number;
      maxResults?: number;
    };
  };
  
  // Display Settings
  displaySettings: {
    columns: {
      field: string;
      label: string;
      visible: boolean;
      width?: number;
      order: number;
    }[];
    layout: 'table' | 'grid' | 'list' | 'kanban';
    theme?: 'light' | 'dark' | 'auto';
  };
  
  // Permissions
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canShare: string[];
  };
  
  // Analytics
  analytics: {
    viewCount: number;
    lastViewed: string;
    averageViewTime: number;
    userEngagement: number;
  };
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CompanyTaxonomy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'industry' | 'size' | 'geography' | 'custom' | 'hierarchical';
  
  // Taxonomy Structure
  structure: {
    categories: {
      id: string;
      name: string;
      description?: string;
      parentId?: string;
      level: number;
      path: string;
      children?: string[];
      metadata?: Record<string, any>;
    }[];
    rules: {
      field: string;
      operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'in' | 'not_in';
      value: any;
      categoryId: string;
    }[];
  };
  
  // Classification Engine
  classification: {
    autoClassification: boolean;
    confidenceThreshold: number;
    machineLearningEnabled: boolean;
    lastTrainingDate?: string;
    accuracy?: number;
  };
  
  // Usage Statistics
  statistics: {
    totalCompanies: number;
    classifiedCompanies: number;
    unclassifiedCompanies: number;
    accuracy: number;
    lastUpdated: string;
  };
  
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CompanyReport {
  id: string;
  organizationId: string;
  reportType: 'taxonomy_analysis' | 'company_portfolio' | 'market_analysis' | 'competitive_analysis' | 'financial_summary';
  name: string;
  description?: string;
  
  // Report Configuration
  configuration: {
    filters: Record<string, any>;
    grouping: string[];
    metrics: string[];
    timeRange: {
      startDate: string;
      endDate: string;
    };
    format: 'json' | 'csv' | 'pdf' | 'excel';
  };
  
  // Report Data
  data: {
    summary: Record<string, any>;
    details: any[];
    charts?: any[];
    insights?: string[];
  };
  
  // Metadata
  generatedBy: string;
  generatedAt: string;
  expiresAt?: string;
  isScheduled: boolean;
  scheduleConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
}

class CompaniesTaxonomyService {
  private companies: Map<string, Company> = new Map();
  private views: Map<string, CompanyView> = new Map();
  private taxonomies: Map<string, CompanyTaxonomy> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Companies Taxonomy & Views Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Demo companies
    const company1: Company = {
      id: 'comp_1',
      organizationId: 'demo-org-1',
      name: 'TechCorp Solutions',
      legalName: 'TechCorp Solutions S.L.',
      code: 'TCS001',
      type: 'corporation',
      status: 'active',
      basicInfo: {
        foundedYear: 2015,
        headquarters: {
          address: 'Calle Tecnología 123',
          city: 'Madrid',
          state: 'Madrid',
          country: 'Spain',
          postalCode: '28001',
          coordinates: {
            latitude: 40.4168,
            longitude: -3.7038
          }
        },
        website: 'https://techcorp.com',
        description: 'Empresa líder en soluciones tecnológicas para empresas',
        mission: 'Transformar el mundo a través de la tecnología',
        vision: 'Ser la empresa de tecnología más innovadora de Europa'
      },
      businessInfo: {
        industry: 'Technology',
        subIndustry: 'Software Development',
        businessModel: 'b2b',
        revenueModel: 'subscription',
        employeeCount: 150,
        annualRevenue: 5000000,
        currency: 'EUR',
        marketCap: 25000000,
        fundingStage: 'series_b',
        lastFundingAmount: 5000000,
        lastFundingDate: '2023-06-15'
      },
      taxonomy: {
        primaryCategory: 'Technology',
        secondaryCategories: ['Software', 'B2B', 'SaaS'],
        tags: ['enterprise', 'cloud', 'ai', 'innovation'],
        keywords: ['software', 'technology', 'enterprise', 'cloud', 'ai'],
        naicsCode: '541511',
        sicCode: '7371',
        isicCode: '6201'
      },
      financialInfo: {
        creditRating: 'A',
        riskLevel: 'low',
        paymentTerms: {
          standardDays: 30,
          earlyPaymentDiscount: 2,
          latePaymentPenalty: 1.5
        }
      },
      contactInfo: {
        primaryContact: {
          name: 'Carlos Ruiz',
          title: 'CEO',
          email: 'carlos.ruiz@techcorp.com',
          phone: '+34 91 123 4567'
        },
        billingContact: {
          name: 'Ana Martín',
          title: 'CFO',
          email: 'ana.martin@techcorp.com',
          phone: '+34 91 123 4568'
        },
        addresses: [
          {
            type: 'headquarters',
            address: 'Calle Tecnología 123',
            city: 'Madrid',
            state: 'Madrid',
            country: 'Spain',
            postalCode: '28001',
            isPrimary: true
          }
        ]
      },
      relationships: {
        subsidiaries: ['comp_2'],
        partners: ['comp_3', 'comp_4'],
        competitors: ['comp_5'],
        suppliers: ['comp_6'],
        customers: ['comp_7', 'comp_8']
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/company/techcorp-solutions',
        twitter: 'https://twitter.com/techcorp',
        github: 'https://github.com/techcorp'
      },
      compliance: {
        certifications: ['ISO 9001', 'ISO 27001', 'SOC 2'],
        licenses: ['Software License'],
        regulatoryCompliance: ['GDPR', 'LOPD'],
        dataProtectionCompliance: ['GDPR']
      },
      metrics: {
        customerSatisfaction: 4.5,
        netPromoterScore: 75,
        marketShare: 15,
        growthRate: 25,
        profitability: 18,
        lastUpdated: oneMonthAgo.toISOString()
      },
      metadata: {
        source: 'CRM',
        lastVerified: oneMonthAgo.toISOString(),
        dataQuality: 'high'
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    const company2: Company = {
      id: 'comp_2',
      organizationId: 'demo-org-1',
      name: 'GreenTech Innovations',
      legalName: 'GreenTech Innovations S.L.',
      code: 'GTI002',
      type: 'corporation',
      status: 'active',
      basicInfo: {
        foundedYear: 2020,
        headquarters: {
          address: 'Avenida Verde 456',
          city: 'Barcelona',
          state: 'Cataluña',
          country: 'Spain',
          postalCode: '08001',
          coordinates: {
            latitude: 41.3851,
            longitude: 2.1734
          }
        },
        website: 'https://greentech.com',
        description: 'Soluciones sostenibles para un futuro mejor',
        mission: 'Crear tecnología que respete el medio ambiente',
        vision: 'Liderar la revolución verde tecnológica'
      },
      businessInfo: {
        industry: 'Clean Technology',
        subIndustry: 'Renewable Energy',
        businessModel: 'b2b',
        revenueModel: 'licensing',
        employeeCount: 45,
        annualRevenue: 1200000,
        currency: 'EUR',
        fundingStage: 'series_a',
        lastFundingAmount: 2000000,
        lastFundingDate: '2023-03-20'
      },
      taxonomy: {
        primaryCategory: 'Clean Technology',
        secondaryCategories: ['Renewable Energy', 'Sustainability', 'B2B'],
        tags: ['green', 'sustainability', 'renewable', 'energy'],
        keywords: ['green technology', 'sustainability', 'renewable energy', 'clean tech'],
        naicsCode: '221119',
        sicCode: '4911'
      },
      financialInfo: {
        creditRating: 'BBB',
        riskLevel: 'medium',
        paymentTerms: {
          standardDays: 45,
          earlyPaymentDiscount: 1.5,
          latePaymentPenalty: 2.0
        }
      },
      contactInfo: {
        primaryContact: {
          name: 'Laura Sánchez',
          title: 'Founder & CEO',
          email: 'laura.sanchez@greentech.com',
          phone: '+34 93 987 6543'
        },
        addresses: [
          {
            type: 'headquarters',
            address: 'Avenida Verde 456',
            city: 'Barcelona',
            state: 'Cataluña',
            country: 'Spain',
            postalCode: '08001',
            isPrimary: true
          }
        ]
      },
      relationships: {
        parentCompany: 'comp_1',
        partners: ['comp_9', 'comp_10'],
        competitors: ['comp_11'],
        suppliers: ['comp_12'],
        customers: ['comp_13', 'comp_14']
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/company/greentech-innovations',
        twitter: 'https://twitter.com/greentech',
        instagram: 'https://instagram.com/greentech'
      },
      compliance: {
        certifications: ['ISO 14001', 'EMAS', 'Green Business Certification'],
        licenses: ['Environmental License'],
        regulatoryCompliance: ['Environmental Regulations'],
        dataProtectionCompliance: ['GDPR']
      },
      metrics: {
        customerSatisfaction: 4.8,
        netPromoterScore: 85,
        marketShare: 8,
        growthRate: 45,
        profitability: 12,
        lastUpdated: oneMonthAgo.toISOString()
      },
      metadata: {
        source: 'CRM',
        lastVerified: oneMonthAgo.toISOString(),
        dataQuality: 'high'
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.companies.set(company1.id, company1);
    this.companies.set(company2.id, company2);

    // Demo views
    const view1: CompanyView = {
      id: 'view_1',
      organizationId: 'demo-org-1',
      name: 'All Companies',
      description: 'Vista por defecto con todas las empresas',
      type: 'standard',
      isDefault: true,
      isPublic: true,
      configuration: {
        filters: {},
        sorting: {
          field: 'name',
          direction: 'asc'
        },
        pagination: {
          pageSize: 50
        }
      },
      displaySettings: {
        columns: [
          { field: 'name', label: 'Company Name', visible: true, order: 1 },
          { field: 'industry', label: 'Industry', visible: true, order: 2 },
          { field: 'status', label: 'Status', visible: true, order: 3 },
          { field: 'employeeCount', label: 'Employees', visible: true, order: 4 },
          { field: 'annualRevenue', label: 'Revenue', visible: true, order: 5 }
        ],
        layout: 'table'
      },
      permissions: {
        canView: ['all'],
        canEdit: ['admin'],
        canDelete: ['admin'],
        canShare: ['admin']
      },
      analytics: {
        viewCount: 150,
        lastViewed: now.toISOString(),
        averageViewTime: 300,
        userEngagement: 0.85
      },
      createdBy: 'system',
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.views.set(view1.id, view1);

    // Demo taxonomies
    const taxonomy1: CompanyTaxonomy = {
      id: 'tax_1',
      organizationId: 'demo-org-1',
      name: 'Industry Classification',
      description: 'Clasificación por industria y sector',
      type: 'industry',
      structure: {
        categories: [
          {
            id: 'cat_1',
            name: 'Technology',
            description: 'Empresas de tecnología y software',
            level: 1,
            path: 'Technology',
            children: ['cat_2', 'cat_3']
          },
          {
            id: 'cat_2',
            name: 'Software Development',
            description: 'Desarrollo de software',
            parentId: 'cat_1',
            level: 2,
            path: 'Technology > Software Development'
          },
          {
            id: 'cat_3',
            name: 'Hardware',
            description: 'Hardware y dispositivos',
            parentId: 'cat_1',
            level: 2,
            path: 'Technology > Hardware'
          },
          {
            id: 'cat_4',
            name: 'Clean Technology',
            description: 'Tecnología limpia y sostenible',
            level: 1,
            path: 'Clean Technology',
            children: ['cat_5']
          },
          {
            id: 'cat_5',
            name: 'Renewable Energy',
            description: 'Energías renovables',
            parentId: 'cat_4',
            level: 2,
            path: 'Clean Technology > Renewable Energy'
          }
        ],
        rules: [
          {
            field: 'businessInfo.industry',
            operator: 'equals',
            value: 'Technology',
            categoryId: 'cat_1'
          },
          {
            field: 'businessInfo.subIndustry',
            operator: 'equals',
            value: 'Software Development',
            categoryId: 'cat_2'
          }
        ]
      },
      classification: {
        autoClassification: true,
        confidenceThreshold: 0.8,
        machineLearningEnabled: true,
        lastTrainingDate: oneMonthAgo.toISOString(),
        accuracy: 0.92
      },
      statistics: {
        totalCompanies: 2,
        classifiedCompanies: 2,
        unclassifiedCompanies: 0,
        accuracy: 0.92,
        lastUpdated: oneMonthAgo.toISOString()
      },
      isActive: true,
      createdBy: 'system',
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.taxonomies.set(taxonomy1.id, taxonomy1);
  }

  // Company Management
  async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const now = new Date().toISOString();
    const newCompany: Company = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...companyData,
      createdAt: now,
      updatedAt: now
    };

    // Auto-classify company
    await this.autoClassifyCompany(newCompany);

    this.companies.set(newCompany.id, newCompany);
    structuredLogger.info('Company created', { 
      companyId: newCompany.id, 
      organizationId: newCompany.organizationId,
      name: newCompany.name,
      industry: newCompany.businessInfo.industry
    });

    return newCompany;
  }

  async getCompany(companyId: string): Promise<Company | undefined> {
    return this.companies.get(companyId);
  }

  async getCompanies(organizationId: string, filters: {
    industry?: string;
    status?: string;
    type?: string;
    size?: string;
    location?: string;
    tags?: string[];
    search?: string;
    limit?: number;
  } = {}): Promise<Company[]> {
    let companies = Array.from(this.companies.values())
      .filter(c => c.organizationId === organizationId);

    if (filters.industry) {
      companies = companies.filter(c => c.businessInfo.industry === filters.industry);
    }

    if (filters.status) {
      companies = companies.filter(c => c.status === filters.status);
    }

    if (filters.type) {
      companies = companies.filter(c => c.type === filters.type);
    }

    if (filters.size) {
      companies = companies.filter(c => {
        const employees = c.businessInfo.employeeCount || 0;
        switch (filters.size) {
          case 'startup': return employees < 50;
          case 'small': return employees >= 50 && employees < 200;
          case 'medium': return employees >= 200 && employees < 1000;
          case 'large': return employees >= 1000;
          default: return true;
        }
      });
    }

    if (filters.location) {
      companies = companies.filter(c => 
        c.basicInfo.headquarters.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
        c.basicInfo.headquarters.country.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      companies = companies.filter(c => 
        filters.tags!.some(tag => c.taxonomy.tags.includes(tag))
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      companies = companies.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.legalName.toLowerCase().includes(searchLower) ||
        c.basicInfo.description?.toLowerCase().includes(searchLower) ||
        c.taxonomy.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }

    if (filters.limit) {
      companies = companies.slice(0, filters.limit);
    }

    return companies.sort((a, b) => a.name.localeCompare(b.name));
  }

  // View Management
  async createView(viewData: Omit<CompanyView, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyView> {
    const now = new Date().toISOString();
    const newView: CompanyView = {
      id: `view_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...viewData,
      createdAt: now,
      updatedAt: now
    };

    this.views.set(newView.id, newView);
    structuredLogger.info('Company view created', { 
      viewId: newView.id, 
      organizationId: newView.organizationId,
      name: newView.name,
      type: newView.type
    });

    return newView;
  }

  async getViews(organizationId: string, filters: {
    type?: string;
    isPublic?: boolean;
    createdBy?: string;
    limit?: number;
  } = {}): Promise<CompanyView[]> {
    let views = Array.from(this.views.values())
      .filter(v => v.organizationId === organizationId);

    if (filters.type) {
      views = views.filter(v => v.type === filters.type);
    }

    if (filters.isPublic !== undefined) {
      views = views.filter(v => v.isPublic === filters.isPublic);
    }

    if (filters.createdBy) {
      views = views.filter(v => v.createdBy === filters.createdBy);
    }

    if (filters.limit) {
      views = views.slice(0, filters.limit);
    }

    return views.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Taxonomy Management
  async createTaxonomy(taxonomyData: Omit<CompanyTaxonomy, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompanyTaxonomy> {
    const now = new Date().toISOString();
    const newTaxonomy: CompanyTaxonomy = {
      id: `tax_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...taxonomyData,
      createdAt: now,
      updatedAt: now
    };

    this.taxonomies.set(newTaxonomy.id, newTaxonomy);
    structuredLogger.info('Company taxonomy created', { 
      taxonomyId: newTaxonomy.id, 
      organizationId: newTaxonomy.organizationId,
      name: newTaxonomy.name,
      type: newTaxonomy.type
    });

    return newTaxonomy;
  }

  async getTaxonomies(organizationId: string, filters: {
    type?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<CompanyTaxonomy[]> {
    let taxonomies = Array.from(this.taxonomies.values())
      .filter(t => t.organizationId === organizationId);

    if (filters.type) {
      taxonomies = taxonomies.filter(t => t.type === filters.type);
    }

    if (filters.isActive !== undefined) {
      taxonomies = taxonomies.filter(t => t.isActive === filters.isActive);
    }

    if (filters.limit) {
      taxonomies = taxonomies.slice(0, filters.limit);
    }

    return taxonomies.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Auto-classification
  async autoClassifyCompany(company: Company): Promise<void> {
    const taxonomies = Array.from(this.taxonomies.values())
      .filter(t => t.organizationId === company.organizationId && t.isActive);

    for (const taxonomy of taxonomies) {
      if (taxonomy.classification.autoClassification) {
        const classification = await this.classifyCompany(company, taxonomy);
        if (classification.confidence >= taxonomy.classification.confidenceThreshold) {
          // Apply classification
          company.taxonomy.primaryCategory = classification.category;
          company.taxonomy.secondaryCategories = classification.secondaryCategories;
          company.taxonomy.tags = [...company.taxonomy.tags, ...classification.tags];
        }
      }
    }
  }

  async classifyCompany(company: Company, taxonomy: CompanyTaxonomy): Promise<{
    category: string;
    secondaryCategories: string[];
    tags: string[];
    confidence: number;
  }> {
    // Simulate classification logic
    let confidence = 0;
    let category = 'Unclassified';
    const secondaryCategories: string[] = [];
    const tags: string[] = [];

    // Industry-based classification
    if (company.businessInfo.industry === 'Technology') {
      category = 'Technology';
      confidence = 0.9;
      if (company.businessInfo.subIndustry === 'Software Development') {
        secondaryCategories.push('Software Development');
        tags.push('software', 'development');
      }
    } else if (company.businessInfo.industry === 'Clean Technology') {
      category = 'Clean Technology';
      confidence = 0.9;
      if (company.businessInfo.subIndustry === 'Renewable Energy') {
        secondaryCategories.push('Renewable Energy');
        tags.push('renewable', 'energy', 'sustainability');
      }
    }

    // Business model classification
    if (company.businessInfo.businessModel === 'b2b') {
      tags.push('b2b');
    } else if (company.businessInfo.businessModel === 'b2c') {
      tags.push('b2c');
    }

    // Size classification
    const employees = company.businessInfo.employeeCount || 0;
    if (employees < 50) {
      tags.push('startup');
    } else if (employees < 200) {
      tags.push('small-business');
    } else if (employees < 1000) {
      tags.push('medium-business');
    } else {
      tags.push('large-business');
    }

    return {
      category,
      secondaryCategories,
      tags,
      confidence
    };
  }

  // Reports
  async generateCompanyReport(organizationId: string, reportType: string, configuration: any, generatedBy: string): Promise<CompanyReport> {
    const companies = Array.from(this.companies.values()).filter(c => c.organizationId === organizationId);
    
    let summary: any = {};
    let details: any[] = [];
    let insights: string[] = [];

    switch (reportType) {
      case 'taxonomy_analysis':
        const taxonomyStats = companies.reduce((acc, c) => {
          acc[c.taxonomy.primaryCategory] = (acc[c.taxonomy.primaryCategory] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        summary = {
          totalCompanies: companies.length,
          classifiedCompanies: companies.filter(c => c.taxonomy.primaryCategory !== 'Unclassified').length,
          taxonomyDistribution: taxonomyStats,
          averageDataQuality: companies.reduce((sum, c) => {
            const quality = c.metadata.dataQuality === 'high' ? 1 : c.metadata.dataQuality === 'medium' ? 0.5 : 0;
            return sum + quality;
          }, 0) / companies.length
        };
        details = companies.map(c => ({
          id: c.id,
          name: c.name,
          industry: c.businessInfo.industry,
          category: c.taxonomy.primaryCategory,
          tags: c.taxonomy.tags,
          dataQuality: c.metadata.dataQuality
        }));
        insights = [
          `${summary.classifiedCompanies} de ${summary.totalCompanies} empresas están clasificadas`,
          `La industria más común es ${Object.keys(taxonomyStats).reduce((a, b) => taxonomyStats[a] > taxonomyStats[b] ? a : b)}`,
          `Calidad promedio de datos: ${(summary.averageDataQuality * 100).toFixed(1)}%`
        ];
        break;

      case 'company_portfolio':
        const portfolioStats = {
          totalCompanies: companies.length,
          activeCompanies: companies.filter(c => c.status === 'active').length,
          totalRevenue: companies.reduce((sum, c) => sum + (c.businessInfo.annualRevenue || 0), 0),
          totalEmployees: companies.reduce((sum, c) => sum + (c.businessInfo.employeeCount || 0), 0),
          averageSatisfaction: companies.reduce((sum, c) => sum + (c.metrics.customerSatisfaction || 0), 0) / companies.length
        };

        summary = portfolioStats;
        details = companies.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          industry: c.businessInfo.industry,
          revenue: c.businessInfo.annualRevenue,
          employees: c.businessInfo.employeeCount,
          satisfaction: c.metrics.customerSatisfaction
        }));
        insights = [
          `${portfolioStats.activeCompanies} empresas activas de ${portfolioStats.totalCompanies} total`,
          `Ingresos totales: €${portfolioStats.totalRevenue.toLocaleString()}`,
          `Satisfacción promedio: ${portfolioStats.averageSatisfaction.toFixed(1)}/5`
        ];
        break;
    }

    const report: CompanyReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      reportType: reportType as any,
      name: `${reportType.replace('_', ' ').toUpperCase()} Report`,
      configuration,
      data: {
        summary,
        details,
        insights
      },
      generatedBy,
      generatedAt: new Date().toISOString(),
      isScheduled: false
    };

    structuredLogger.info('Company report generated', { 
      reportId: report.id, 
      organizationId,
      reportType,
      companiesCount: companies.length
    });

    return report;
  }

  // Statistics
  async getCompanyStats(organizationId: string) {
    const companies = Array.from(this.companies.values()).filter(c => c.organizationId === organizationId);
    const views = Array.from(this.views.values()).filter(v => v.organizationId === organizationId);
    const taxonomies = Array.from(this.taxonomies.values()).filter(t => t.organizationId === organizationId);

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentCompanies = companies.filter(c => new Date(c.createdAt) >= last30Days);

    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter(c => c.status === 'active').length,
      totalViews: views.length,
      publicViews: views.filter(v => v.isPublic).length,
      activeTaxonomies: taxonomies.filter(t => t.isActive).length,
      classifiedCompanies: companies.filter(c => c.taxonomy.primaryCategory !== 'Unclassified').length,
      averageDataQuality: companies.reduce((sum, c) => {
        const quality = c.metadata.dataQuality === 'high' ? 1 : c.metadata.dataQuality === 'medium' ? 0.5 : 0;
        return sum + quality;
      }, 0) / companies.length,
      last30Days: {
        newCompanies: recentCompanies.length,
        newViews: views.filter(v => new Date(v.createdAt) >= last30Days).length,
        newTaxonomies: taxonomies.filter(t => new Date(t.createdAt) >= last30Days).length
      },
      byIndustry: companies.reduce((acc, c) => {
        acc[c.businessInfo.industry] = (acc[c.businessInfo.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: companies.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: companies.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySize: companies.reduce((acc, c) => {
        const employees = c.businessInfo.employeeCount || 0;
        let size = 'unknown';
        if (employees < 50) size = 'startup';
        else if (employees < 200) size = 'small';
        else if (employees < 1000) size = 'medium';
        else size = 'large';
        acc[size] = (acc[size] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byDataQuality: companies.reduce((acc, c) => {
        acc[c.metadata.dataQuality] = (acc[c.metadata.dataQuality] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const companiesTaxonomyService = new CompaniesTaxonomyService();
