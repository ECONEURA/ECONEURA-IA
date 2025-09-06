import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { z } from 'zod';

// ============================================================================
// COMPANY ROUTES
// ============================================================================

export const createCompanyRoutes = (companyController: CompanyController): Router => {
  const router = Router();

  // ========================================================================
  // COMPANY MANAGEMENT ROUTES
  // ========================================================================

  // POST /companies - Create company
  router.post('/',
    validateRequest({
      body: z.object({
        organizationId: z.string().uuid(),
        name: z.string().min(1).max(200),
        legalName: z.string().max(200).optional(),
        type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor']),
        status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead']),
        size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']),
        industry: z.string().min(1).max(100),
        source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other']),
        website: z.string().url().optional(),
        email: z.string().email().optional(),
        phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
        address: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          state: z.string().optional(),
          postalCode: z.string().min(1),
          country: z.string().min(1),
          countryCode: z.string().length(2)
        }).optional(),
        billingAddress: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          state: z.string().optional(),
          postalCode: z.string().min(1),
          country: z.string().min(1),
          countryCode: z.string().length(2)
        }).optional(),
        shippingAddress: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          state: z.string().optional(),
          postalCode: z.string().min(1),
          country: z.string().min(1),
          countryCode: z.string().length(2)
        }).optional(),
        taxId: z.string().min(5).max(20).optional(),
        vatNumber: z.string().min(8).max(15).optional(),
        registrationNumber: z.string().max(50).optional(),
        description: z.string().max(1000).optional(),
        annualRevenue: z.object({
          amount: z.number().min(0),
          currency: z.string().length(3)
        }).optional(),
        employeeCount: z.number().int().min(0).max(1000000).optional(),
        foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
        parentCompanyId: z.string().uuid().optional(),
        assignedUserId: z.string().uuid().optional(),
        nextFollowUpDate: z.coerce.date().optional(),
        leadScore: z.number().int().min(0).max(100).optional(),
        settings: z.object({
          notifications: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            push: z.boolean().optional()
          }).optional(),
          preferences: z.object({
            language: z.string().length(2).optional(),
            timezone: z.string().optional(),
            currency: z.string().length(3).optional(),
            dateFormat: z.string().optional()
          }).optional(),
          customFields: z.record(z.any()).optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().optional()
        }).optional()
      })
    }),
    companyController.createCompany.bind(companyController)
  );

  // PUT /companies/:companyId - Update company
  router.put('/:companyId',
    validateRequest({
      params: z.object({
        companyId: z.string().uuid()
      }),
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        legalName: z.string().max(200).optional(),
        type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor']).optional(),
        status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead']).optional(),
        size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
        industry: z.string().min(1).max(100).optional(),
        source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other']).optional(),
        website: z.string().url().optional(),
        email: z.string().email().optional(),
        phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
        address: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          state: z.string().optional(),
          postalCode: z.string().min(1),
          country: z.string().min(1),
          countryCode: z.string().length(2)
        }).optional(),
        billingAddress: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          state: z.string().optional(),
          postalCode: z.string().min(1),
          country: z.string().min(1),
          countryCode: z.string().length(2)
        }).optional(),
        shippingAddress: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          state: z.string().optional(),
          postalCode: z.string().min(1),
          country: z.string().min(1),
          countryCode: z.string().length(2)
        }).optional(),
        taxId: z.string().min(5).max(20).optional(),
        vatNumber: z.string().min(8).max(15).optional(),
        registrationNumber: z.string().max(50).optional(),
        description: z.string().max(1000).optional(),
        annualRevenue: z.object({
          amount: z.number().min(0),
          currency: z.string().length(3)
        }).optional(),
        employeeCount: z.number().int().min(0).max(1000000).optional(),
        foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
        parentCompanyId: z.string().uuid().optional(),
        assignedUserId: z.string().uuid().optional(),
        nextFollowUpDate: z.coerce.date().optional(),
        leadScore: z.number().int().min(0).max(100).optional(),
        settings: z.object({
          notifications: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            push: z.boolean().optional()
          }).optional(),
          preferences: z.object({
            language: z.string().length(2).optional(),
            timezone: z.string().optional(),
            currency: z.string().length(3).optional(),
            dateFormat: z.string().optional()
          }).optional(),
          customFields: z.record(z.any()).optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().optional()
        }).optional()
      })
    }),
    companyController.updateCompany.bind(companyController)
  );

  // DELETE /companies/:companyId - Delete company
  router.delete('/:companyId',
    validateRequest({
      params: z.object({
        companyId: z.string().uuid()
      })
    }),
    companyController.deleteCompany.bind(companyController)
  );

  // ========================================================================
  // COMPANY QUERY ROUTES
  // ========================================================================

  // GET /companies/:companyId - Get company by ID
  router.get('/:companyId',
    validateRequest({
      params: z.object({
        companyId: z.string().uuid()
      })
    }),
    companyController.getCompanyById.bind(companyController)
  );

  // GET /companies/organization/:organizationId - Get companies by organization
  router.get('/organization/:organizationId',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    companyController.getCompaniesByOrganization.bind(companyController)
  );

  // GET /companies/organization/:organizationId/search - Search companies
  router.get('/organization/:organizationId/search',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      }),
      query: z.object({
        query: z.string().optional(),
        type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor']).optional(),
        status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead']).optional(),
        size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
        industry: z.string().optional(),
        source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other']).optional(),
        assignedUserId: z.string().uuid().optional(),
        parentCompanyId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
        hasParentCompany: z.boolean().optional(),
        isAssigned: z.boolean().optional(),
        leadScoreMin: z.coerce.number().int().min(0).max(100).optional(),
        leadScoreMax: z.coerce.number().int().min(0).max(100).optional(),
        revenueMin: z.coerce.number().min(0).optional(),
        revenueMax: z.coerce.number().min(0).optional(),
        currency: z.string().length(3).optional(),
        employeeCountMin: z.coerce.number().int().min(0).optional(),
        employeeCountMax: z.coerce.number().int().min(0).optional(),
        foundedYearMin: z.coerce.number().int().min(1800).optional(),
        foundedYearMax: z.coerce.number().int().min(1800).optional(),
        lastContactAfter: z.coerce.date().optional(),
        lastContactBefore: z.coerce.date().optional(),
        nextFollowUpAfter: z.coerce.date().optional(),
        nextFollowUpBefore: z.coerce.date().optional(),
        createdAfter: z.coerce.date().optional(),
        createdBefore: z.coerce.date().optional(),
        updatedAfter: z.coerce.date().optional(),
        updatedBefore: z.coerce.date().optional(),
        tags: z.array(z.string()).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.enum(['name', 'type', 'status', 'size', 'industry', 'source', 'leadScore', 'annualRevenue', 'employeeCount', 'foundedYear', 'lastContactDate', 'nextFollowUpDate', 'createdAt', 'updatedAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    companyController.searchCompanies.bind(companyController)
  );

  // ========================================================================
  // COMPANY STATISTICS ROUTES
  // ========================================================================

  // GET /companies/organization/:organizationId/stats - Get company statistics
  router.get('/organization/:organizationId/stats',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    companyController.getCompanyStats.bind(companyController)
  );

  // ========================================================================
  // COMPANY FILTER ROUTES
  // ========================================================================

  // GET /companies/organization/:organizationId/type/:type - Get companies by type
  router.get('/organization/:organizationId/type/:type',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid(),
        type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor'])
      })
    }),
    companyController.getCompaniesByType.bind(companyController)
  );

  // GET /companies/organization/:organizationId/status/:status - Get companies by status
  router.get('/organization/:organizationId/status/:status',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid(),
        status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead'])
      })
    }),
    companyController.getCompaniesByStatus.bind(companyController)
  );

  // GET /companies/organization/:organizationId/industry/:industry - Get companies by industry
  router.get('/organization/:organizationId/industry/:industry',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid(),
        industry: z.string()
      })
    }),
    companyController.getCompaniesByIndustry.bind(companyController)
  );

  // GET /companies/organization/:organizationId/assigned/:userId - Get companies by assigned user
  router.get('/organization/:organizationId/assigned/:userId',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid(),
        userId: z.string().uuid()
      })
    }),
    companyController.getCompaniesByAssignedUser.bind(companyController)
  );

  // ========================================================================
  // FOLLOW-UP ROUTES
  // ========================================================================

  // GET /companies/organization/:organizationId/overdue-follow-up - Get companies overdue for follow-up
  router.get('/organization/:organizationId/overdue-follow-up',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    companyController.getOverdueForFollowUp.bind(companyController)
  );

  // GET /companies/organization/:organizationId/scheduled-follow-up/:date - Get companies scheduled for follow-up
  router.get('/organization/:organizationId/scheduled-follow-up/:date',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid(),
        date: z.coerce.date()
      })
    }),
    companyController.getScheduledForFollowUp.bind(companyController)
  );

  // ========================================================================
  // LEAD SCORING ROUTES
  // ========================================================================

  // GET /companies/organization/:organizationId/high-score-leads - Get high score leads
  router.get('/organization/:organizationId/high-score-leads',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      }),
      query: z.object({
        minScore: z.coerce.number().int().min(0).max(100).default(70)
      })
    }),
    companyController.getHighScoreLeads.bind(companyController)
  );

  // GET /companies/organization/:organizationId/medium-score-leads - Get medium score leads
  router.get('/organization/:organizationId/medium-score-leads',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    companyController.getMediumScoreLeads.bind(companyController)
  );

  // GET /companies/organization/:organizationId/low-score-leads - Get low score leads
  router.get('/organization/:organizationId/low-score-leads',
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    companyController.getLowScoreLeads.bind(companyController)
  );

  // ========================================================================
  // BULK OPERATION ROUTES
  // ========================================================================

  // PUT /companies/bulk/update - Bulk update companies
  router.put('/bulk/update',
    validateRequest({
      body: z.object({
        companyIds: z.array(z.string().uuid()).min(1).max(100),
        updates: z.object({
          name: z.string().min(1).max(200).optional(),
          legalName: z.string().max(200).optional(),
          type: z.enum(['customer', 'supplier', 'partner', 'prospect', 'competitor']).optional(),
          status: z.enum(['active', 'inactive', 'suspended', 'prospect', 'lead']).optional(),
          size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
          industry: z.string().min(1).max(100).optional(),
          source: z.enum(['website', 'referral', 'cold_call', 'email', 'social_media', 'event', 'other']).optional(),
          website: z.string().url().optional(),
          email: z.string().email().optional(),
          phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional(),
          taxId: z.string().min(5).max(20).optional(),
          vatNumber: z.string().min(8).max(15).optional(),
          registrationNumber: z.string().max(50).optional(),
          description: z.string().max(1000).optional(),
          annualRevenue: z.object({
            amount: z.number().min(0),
            currency: z.string().length(3)
          }).optional(),
          employeeCount: z.number().int().min(0).max(1000000).optional(),
          foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
          parentCompanyId: z.string().uuid().optional(),
          assignedUserId: z.string().uuid().optional(),
          nextFollowUpDate: z.coerce.date().optional(),
          leadScore: z.number().int().min(0).max(100).optional(),
          settings: z.object({
            notifications: z.object({
              email: z.boolean().optional(),
              sms: z.boolean().optional(),
              push: z.boolean().optional()
            }).optional(),
            preferences: z.object({
              language: z.string().length(2).optional(),
              timezone: z.string().optional(),
              currency: z.string().length(3).optional(),
              dateFormat: z.string().optional()
            }).optional(),
            customFields: z.record(z.any()).optional(),
            tags: z.array(z.string()).optional(),
            notes: z.string().optional()
          }).optional()
        })
      })
    }),
    companyController.bulkUpdateCompanies.bind(companyController)
  );

  // DELETE /companies/bulk/delete - Bulk delete companies
  router.delete('/bulk/delete',
    validateRequest({
      body: z.object({
        companyIds: z.array(z.string().uuid()).min(1).max(100)
      })
    }),
    companyController.bulkDeleteCompanies.bind(companyController)
  );

  return router;
};
