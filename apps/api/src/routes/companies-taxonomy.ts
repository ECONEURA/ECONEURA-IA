import { Router } from 'express';
import { z } from 'zod';
import { companiesTaxonomyService } from '../lib/companies-taxonomy.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const companiesTaxonomyRouter = Router();

// Validation schemas
const GetCompaniesSchema = z.object({
  organizationId: z.string().min(1),
  industry: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'merged', 'acquired', 'dissolved']).optional(),
  type: z.enum(['corporation', 'llc', 'partnership', 'sole_proprietorship', 'non_profit', 'government', 'other']).optional(),
  size: z.enum(['startup', 'small', 'medium', 'large']).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateCompanySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  legalName: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['corporation', 'llc', 'partnership', 'sole_proprietorship', 'non_profit', 'government', 'other']),
  status: z.enum(['active', 'inactive', 'suspended', 'merged', 'acquired', 'dissolved']).default('active'),
  basicInfo: z.object({
    foundedYear: z.coerce.number().int().positive().optional(),
    headquarters: z.object({
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      country: z.string().min(1),
      postalCode: z.string().min(1),
      coordinates: z.object({
        latitude: z.coerce.number(),
        longitude: z.coerce.number(),
      }).optional(),
    }),
    website: z.string().url().optional(),
    description: z.string().optional(),
    mission: z.string().optional(),
    vision: z.string().optional(),
  }),
  businessInfo: z.object({
    industry: z.string().min(1),
    subIndustry: z.string().optional(),
    businessModel: z.enum(['b2b', 'b2c', 'b2b2c', 'marketplace', 'saas', 'ecommerce', 'consulting', 'manufacturing', 'other']),
    revenueModel: z.enum(['subscription', 'transaction', 'advertising', 'freemium', 'licensing', 'consulting', 'other']),
    employeeCount: z.coerce.number().int().nonnegative().optional(),
    annualRevenue: z.coerce.number().nonnegative().optional(),
    currency: z.string().length(3),
    marketCap: z.coerce.number().nonnegative().optional(),
    fundingStage: z.enum(['bootstrap', 'seed', 'series_a', 'series_b', 'series_c', 'series_d', 'ipo', 'acquired']).optional(),
    lastFundingAmount: z.coerce.number().nonnegative().optional(),
    lastFundingDate: z.string().datetime().optional(),
  }),
  taxonomy: z.object({
    primaryCategory: z.string().optional(),
    secondaryCategories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
    naicsCode: z.string().optional(),
    sicCode: z.string().optional(),
    isicCode: z.string().optional(),
    customClassification: z.string().optional(),
  }),
  financialInfo: z.object({
    creditRating: z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D']).optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'very_high']).default('medium'),
    paymentTerms: z.object({
      standardDays: z.coerce.number().int().positive(),
      earlyPaymentDiscount: z.coerce.number().positive().optional(),
      latePaymentPenalty: z.coerce.number().positive().optional(),
    }),
    bankingInfo: z.object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
      swiftCode: z.string().optional(),
    }).optional(),
  }),
  contactInfo: z.object({
    primaryContact: z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
    }),
    billingContact: z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
    }).optional(),
    technicalContact: z.object({
      name: z.string().min(1),
      title: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
    }).optional(),
    addresses: z.array(z.object({
      type: z.enum(['headquarters', 'billing', 'shipping', 'office', 'warehouse']),
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      country: z.string().min(1),
      postalCode: z.string().min(1),
      isPrimary: z.boolean(),
    })).min(1),
  }),
  relationships: z.object({
    parentCompany: z.string().optional(),
    subsidiaries: z.array(z.string()).default([]),
    partners: z.array(z.string()).default([]),
    competitors: z.array(z.string()).default([]),
    suppliers: z.array(z.string()).default([]),
    customers: z.array(z.string()).default([]),
  }).optional(),
  socialMedia: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    youtube: z.string().url().optional(),
    github: z.string().url().optional(),
    other: z.record(z.string()).optional(),
  }).optional(),
  compliance: z.object({
    certifications: z.array(z.string()).default([]),
    licenses: z.array(z.string()).default([]),
    regulatoryCompliance: z.array(z.string()).default([]),
    dataProtectionCompliance: z.array(z.string()).default([]),
    lastAuditDate: z.string().datetime().optional(),
    nextAuditDate: z.string().datetime().optional(),
  }).optional(),
  metrics: z.object({
    customerSatisfaction: z.coerce.number().min(1).max(5).optional(),
    netPromoterScore: z.coerce.number().min(0).max(100).optional(),
    marketShare: z.coerce.number().min(0).max(100).optional(),
    growthRate: z.coerce.number().optional(),
    profitability: z.coerce.number().optional(),
  }).optional(),
  metadata: z.object({
    source: z.string().min(1),
    dataQuality: z.enum(['high', 'medium', 'low']).default('medium'),
    customFields: z.record(z.any()).optional(),
  }),
});

const GetViewsSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['standard', 'custom', 'analytical', 'comparative', 'dashboard']).optional(),
  isPublic: z.coerce.boolean().optional(),
  createdBy: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateViewSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['standard', 'custom', 'analytical', 'comparative', 'dashboard']),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  configuration: z.object({
    filters: z.record(z.any()).default({}),
    sorting: z.object({
      field: z.string().min(1),
      direction: z.enum(['asc', 'desc']),
    }),
    grouping: z.object({
      field: z.string().min(1),
      enabled: z.boolean(),
    }).optional(),
    pagination: z.object({
      pageSize: z.coerce.number().int().positive(),
      maxResults: z.coerce.number().int().positive().optional(),
    }),
  }),
  displaySettings: z.object({
    columns: z.array(z.object({
      field: z.string().min(1),
      label: z.string().min(1),
      visible: z.boolean(),
      width: z.coerce.number().int().positive().optional(),
      order: z.coerce.number().int().positive(),
    })).min(1),
    layout: z.enum(['table', 'grid', 'list', 'kanban']),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
  }),
  permissions: z.object({
    canView: z.array(z.string()).default(['all']),
    canEdit: z.array(z.string()).default(['admin']),
    canDelete: z.array(z.string()).default(['admin']),
    canShare: z.array(z.string()).default(['admin']),
  }),
  createdBy: z.string().min(1),
});

const GetTaxonomiesSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['industry', 'size', 'geography', 'custom', 'hierarchical']).optional(),
  isActive: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateTaxonomySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['industry', 'size', 'geography', 'custom', 'hierarchical']),
  structure: z.object({
    categories: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.string().optional(),
      level: z.coerce.number().int().nonnegative(),
      path: z.string().min(1),
      children: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    })).min(1),
    rules: z.array(z.object({
      field: z.string().min(1),
      operator: z.enum(['equals', 'contains', 'starts_with', 'ends_with', 'regex', 'in', 'not_in']),
      value: z.any(),
      categoryId: z.string().min(1),
    })).default([]),
  }),
  classification: z.object({
    autoClassification: z.boolean().default(true),
    confidenceThreshold: z.coerce.number().min(0).max(1).default(0.8),
    machineLearningEnabled: z.boolean().default(false),
    lastTrainingDate: z.string().datetime().optional(),
    accuracy: z.coerce.number().min(0).max(1).optional(),
  }),
  isActive: z.boolean().default(true),
  createdBy: z.string().min(1),
});

const GenerateReportSchema = z.object({
  organizationId: z.string().min(1),
  reportType: z.enum(['taxonomy_analysis', 'company_portfolio', 'market_analysis', 'competitive_analysis', 'financial_summary']),
  configuration: z.record(z.any()).default({}),
  generatedBy: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Company Management
companiesTaxonomyRouter.get('/companies', async (req, res) => {
  try {
    const filters = GetCompaniesSchema.parse(req.query);
    const companies = await companiesTaxonomyService.getCompanies(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        companies,
        total: companies.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting companies', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

companiesTaxonomyRouter.get('/companies/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const company = await companiesTaxonomyService.getCompany(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      data: company,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting company', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

companiesTaxonomyRouter.post('/companies', async (req, res) => {
  try {
    const companyData = CreateCompanySchema.parse(req.body);
    const company = await companiesTaxonomyService.createCompany(companyData);
    
    res.status(201).json({
      success: true,
      data: company,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating company', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// View Management
companiesTaxonomyRouter.get('/views', async (req, res) => {
  try {
    const filters = GetViewsSchema.parse(req.query);
    const views = await companiesTaxonomyService.getViews(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        views,
        total: views.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting views', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

companiesTaxonomyRouter.post('/views', async (req, res) => {
  try {
    const viewData = CreateViewSchema.parse(req.body);
    const view = await companiesTaxonomyService.createView(viewData);
    
    res.status(201).json({
      success: true,
      data: view,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating view', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Taxonomy Management
companiesTaxonomyRouter.get('/taxonomies', async (req, res) => {
  try {
    const filters = GetTaxonomiesSchema.parse(req.query);
    const taxonomies = await companiesTaxonomyService.getTaxonomies(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        taxonomies,
        total: taxonomies.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting taxonomies', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

companiesTaxonomyRouter.post('/taxonomies', async (req, res) => {
  try {
    const taxonomyData = CreateTaxonomySchema.parse(req.body);
    const taxonomy = await companiesTaxonomyService.createTaxonomy(taxonomyData);
    
    res.status(201).json({
      success: true,
      data: taxonomy,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating taxonomy', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Reports
companiesTaxonomyRouter.post('/reports', async (req, res) => {
  try {
    const reportData = GenerateReportSchema.parse(req.body);
    const report = await companiesTaxonomyService.generateCompanyReport(
      reportData.organizationId,
      reportData.reportType,
      reportData.configuration,
      reportData.generatedBy
    );
    
    res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error generating company report', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
companiesTaxonomyRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await companiesTaxonomyService.getCompanyStats(organizationId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting company stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
companiesTaxonomyRouter.get('/health', async (req, res) => {
  try {
    const stats = await companiesTaxonomyService.getCompanyStats('demo-org-1');
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        totalCompanies: stats.totalCompanies,
        activeCompanies: stats.activeCompanies,
        totalViews: stats.totalViews,
        activeTaxonomies: stats.activeTaxonomies,
        classifiedCompanies: stats.classifiedCompanies,
        averageDataQuality: stats.averageDataQuality,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking companies health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { companiesTaxonomyRouter };
