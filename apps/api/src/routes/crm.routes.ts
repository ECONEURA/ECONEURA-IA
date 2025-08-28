import { Router } from 'express';
import { authenticate, authorize, requireOrganizationScope } from '../middleware/auth';
import { validate, validatePagination } from '../middleware/validation';
import {
  // Contact schemas
  CreateContactSchema,
  UpdateContactSchema,
  ContactQuerySchema,
  ContactParamsSchema,
  // Company schemas
  CreateCompanySchema,
  UpdateCompanySchema,
  CompanyQuerySchema,
  CompanyParamsSchema,
  // Deal schemas
  CreateDealSchema,
  UpdateDealSchema,
  DealQuerySchema,
  DealParamsSchema,
  // Activity schemas
  CreateActivitySchema,
  UpdateActivitySchema,
  ActivityQuerySchema,
  ActivityParamsSchema,
  // Label schemas
  CreateLabelSchema,
  UpdateLabelSchema,
  LabelQuerySchema,
  LabelParamsSchema
} from '../schemas/crm.schemas';

// Import controllers
import * as contactsController from '../controllers/contacts.controller';
import * as companiesController from '../controllers/companies.controller';
import * as dealsController from '../controllers/deals.controller';
import * as activitiesController from '../controllers/activities.controller';
import * as labelsController from '../controllers/labels.controller';

const router = Router();

// Apply authentication and organization scope to all CRM routes
router.use(authenticate);
router.use(requireOrganizationScope);

// =============================================================================
// CONTACTS ROUTES
// =============================================================================

/**
 * @route GET /crm/contacts
 * @desc Get all contacts with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/contacts',
  validate(ContactQuerySchema, 'query'),
  validatePagination,
  contactsController.getContacts
);

/**
 * @route GET /crm/contacts/:id
 * @desc Get single contact by ID
 * @access Private (authenticated users)
 */
router.get('/contacts/:id',
  validate(ContactParamsSchema, 'params'),
  contactsController.getContact
);

/**
 * @route POST /crm/contacts
 * @desc Create new contact
 * @access Private (authenticated users)
 */
router.post('/contacts',
  validate(CreateContactSchema, 'body'),
  contactsController.createContact
);

/**
 * @route PUT /crm/contacts/:id
 * @desc Update existing contact
 * @access Private (authenticated users)
 */
router.put('/contacts/:id',
  validate(ContactParamsSchema, 'params'),
  validate(UpdateContactSchema, 'body'),
  contactsController.updateContact
);

/**
 * @route DELETE /crm/contacts/:id
 * @desc Delete contact
 * @access Private (authenticated users)
 */
router.delete('/contacts/:id',
  validate(ContactParamsSchema, 'params'),
  contactsController.deleteContact
);

/**
 * @route POST /crm/contacts/:id/labels
 * @desc Add labels to contact
 * @access Private (authenticated users)
 */
router.post('/contacts/:id/labels',
  validate(ContactParamsSchema, 'params'),
  contactsController.addContactLabels
);

/**
 * @route DELETE /crm/contacts/:id/labels
 * @desc Remove labels from contact
 * @access Private (authenticated users)
 */
router.delete('/contacts/:id/labels',
  validate(ContactParamsSchema, 'params'),
  contactsController.removeContactLabels
);

// =============================================================================
// COMPANIES ROUTES
// =============================================================================

/**
 * @route GET /crm/companies
 * @desc Get all companies with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/companies',
  validate(CompanyQuerySchema, 'query'),
  validatePagination,
  companiesController.getCompanies
);

/**
 * @route GET /crm/companies/stats
 * @desc Get company statistics
 * @access Private (authenticated users)
 */
router.get('/companies/stats',
  companiesController.getCompanyStats
);

/**
 * @route GET /crm/companies/:id
 * @desc Get single company by ID
 * @access Private (authenticated users)
 */
router.get('/companies/:id',
  validate(CompanyParamsSchema, 'params'),
  companiesController.getCompany
);

/**
 * @route POST /crm/companies
 * @desc Create new company
 * @access Private (authenticated users)
 */
router.post('/companies',
  validate(CreateCompanySchema, 'body'),
  companiesController.createCompany
);

/**
 * @route PUT /crm/companies/:id
 * @desc Update existing company
 * @access Private (authenticated users)
 */
router.put('/companies/:id',
  validate(CompanyParamsSchema, 'params'),
  validate(UpdateCompanySchema, 'body'),
  companiesController.updateCompany
);

/**
 * @route DELETE /crm/companies/:id
 * @desc Delete company
 * @access Private (authenticated users)
 */
router.delete('/companies/:id',
  validate(CompanyParamsSchema, 'params'),
  companiesController.deleteCompany
);

/**
 * @route POST /crm/companies/:id/labels
 * @desc Add labels to company
 * @access Private (authenticated users)
 */
router.post('/companies/:id/labels',
  validate(CompanyParamsSchema, 'params'),
  companiesController.addCompanyLabels
);

/**
 * @route DELETE /crm/companies/:id/labels
 * @desc Remove labels from company
 * @access Private (authenticated users)
 */
router.delete('/companies/:id/labels',
  validate(CompanyParamsSchema, 'params'),
  companiesController.removeCompanyLabels
);

// =============================================================================
// DEALS ROUTES
// =============================================================================

/**
 * @route GET /crm/deals
 * @desc Get all deals with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/deals',
  validate(DealQuerySchema, 'query'),
  validatePagination,
  dealsController.getDeals
);

/**
 * @route GET /crm/deals/pipeline
 * @desc Get deals pipeline/funnel stats
 * @access Private (authenticated users)
 */
router.get('/deals/pipeline',
  dealsController.getDealsPipeline
);

/**
 * @route GET /crm/deals/:id
 * @desc Get single deal by ID
 * @access Private (authenticated users)
 */
router.get('/deals/:id',
  validate(DealParamsSchema, 'params'),
  dealsController.getDeal
);

/**
 * @route POST /crm/deals
 * @desc Create new deal
 * @access Private (authenticated users)
 */
router.post('/deals',
  validate(CreateDealSchema, 'body'),
  dealsController.createDeal
);

/**
 * @route PUT /crm/deals/:id
 * @desc Update existing deal
 * @access Private (authenticated users)
 */
router.put('/deals/:id',
  validate(DealParamsSchema, 'params'),
  validate(UpdateDealSchema, 'body'),
  dealsController.updateDeal
);

/**
 * @route DELETE /crm/deals/:id
 * @desc Delete deal
 * @access Private (authenticated users)
 */
router.delete('/deals/:id',
  validate(DealParamsSchema, 'params'),
  dealsController.deleteDeal
);

/**
 * @route POST /crm/deals/:id/labels
 * @desc Add labels to deal
 * @access Private (authenticated users)
 */
router.post('/deals/:id/labels',
  validate(DealParamsSchema, 'params'),
  dealsController.addDealLabels
);

/**
 * @route DELETE /crm/deals/:id/labels
 * @desc Remove labels from deal
 * @access Private (authenticated users)
 */
router.delete('/deals/:id/labels',
  validate(DealParamsSchema, 'params'),
  dealsController.removeDealLabels
);

// =============================================================================
// ACTIVITIES ROUTES
// =============================================================================

/**
 * @route GET /crm/activities
 * @desc Get all activities with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/activities',
  validate(ActivityQuerySchema, 'query'),
  validatePagination,
  activitiesController.getActivities
);

/**
 * @route GET /crm/activities/stats
 * @desc Get activity statistics
 * @access Private (authenticated users)
 */
router.get('/activities/stats',
  activitiesController.getActivityStats
);

/**
 * @route GET /crm/activities/upcoming
 * @desc Get upcoming activities (due within next 7 days)
 * @access Private (authenticated users)
 */
router.get('/activities/upcoming',
  activitiesController.getUpcomingActivities
);

/**
 * @route GET /crm/activities/:id
 * @desc Get single activity by ID
 * @access Private (authenticated users)
 */
router.get('/activities/:id',
  validate(ActivityParamsSchema, 'params'),
  activitiesController.getActivity
);

/**
 * @route POST /crm/activities
 * @desc Create new activity
 * @access Private (authenticated users)
 */
router.post('/activities',
  validate(CreateActivitySchema, 'body'),
  activitiesController.createActivity
);

/**
 * @route PUT /crm/activities/:id
 * @desc Update existing activity
 * @access Private (authenticated users)
 */
router.put('/activities/:id',
  validate(ActivityParamsSchema, 'params'),
  validate(UpdateActivitySchema, 'body'),
  activitiesController.updateActivity
);

/**
 * @route DELETE /crm/activities/:id
 * @desc Delete activity
 * @access Private (authenticated users)
 */
router.delete('/activities/:id',
  validate(ActivityParamsSchema, 'params'),
  activitiesController.deleteActivity
);

// =============================================================================
// LABELS ROUTES
// =============================================================================

/**
 * @route GET /crm/labels
 * @desc Get all labels with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/labels',
  validate(LabelQuerySchema, 'query'),
  validatePagination,
  labelsController.getLabels
);

/**
 * @route GET /crm/labels/stats
 * @desc Get label statistics
 * @access Private (authenticated users)
 */
router.get('/labels/stats',
  labelsController.getLabelStats
);

/**
 * @route GET /crm/labels/:id
 * @desc Get single label by ID
 * @access Private (authenticated users)
 */
router.get('/labels/:id',
  validate(LabelParamsSchema, 'params'),
  labelsController.getLabel
);

/**
 * @route POST /crm/labels
 * @desc Create new label
 * @access Private (authenticated users)
 */
router.post('/labels',
  validate(CreateLabelSchema, 'body'),
  labelsController.createLabel
);

/**
 * @route PUT /crm/labels/:id
 * @desc Update existing label
 * @access Private (authenticated users)
 */
router.put('/labels/:id',
  validate(LabelParamsSchema, 'params'),
  validate(UpdateLabelSchema, 'body'),
  labelsController.updateLabel
);

/**
 * @route DELETE /crm/labels/:id
 * @desc Delete label
 * @access Private (authenticated users)
 */
router.delete('/labels/:id',
  validate(LabelParamsSchema, 'params'),
  labelsController.deleteLabel
);

/**
 * @route POST /crm/labels/bulk
 * @desc Bulk operations for labels
 * @access Private (Admin users only)
 */
router.post('/labels/bulk',
  authorize(['admin', 'manager']),
  labelsController.bulkLabelOperations
);

export default router;