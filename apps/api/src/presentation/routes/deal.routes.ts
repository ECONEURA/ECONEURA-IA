import { Router } from 'express';

import { DealController } from '../controllers/deal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  CreateDealSchema,
  CreateLeadSchema,
  CreateQualifiedSchema,
  CreateProposalSchema,
  CreateNegotiationSchema,
  UpdateDealSchema,
  UpdateStageSchema,
  UpdateStatusSchema,
  UpdatePrioritySchema,
  UpdateValueSchema,
  UpdateProbabilitySchema,
  SetExpectedCloseDateSchema,
  SetNextStepSchema,
  AddTagSchema,
  RemoveTagSchema,
  AddCompetitorSchema,
  RemoveCompetitorSchema,
  AddDecisionMakerSchema,
  RemoveDecisionMakerSchema,
  SetCustomFieldSchema,
  RemoveCustomFieldSchema,
  DealIdParamSchema,
  DealContactIdParamSchema,
  DealCompanyIdParamSchema,
  DealUserIdParamSchema,
  DealSearchQuerySchema,
  DealFiltersQuerySchema,
  DealBulkUpdateSchema,
  DealBulkDeleteSchema,
  DealStageParamSchema,
  DealStatusParamSchema,
  DealPriorityParamSchema,
  DealSourceParamSchema,
  DealValueRangeQuerySchema,
  DealProbabilityRangeQuerySchema,
  DealExpectedCloseQuerySchema,
  DealClosedInPeriodQuerySchema
} from '../dto/deal.dto.js';

// ============================================================================
// DEAL ROUTES
// ============================================================================

export function createDealRoutes(dealController: DealController): Router {
  const router = Router();

  // ========================================================================
  // AUTHENTICATION AND AUTHORIZATION MIDDLEWARE
  // ========================================================================

  // All routes require authentication
  router.use(authenticate);

  // ========================================================================
  // CREATE DEAL ROUTES
  // ========================================================================

  // POST /deals - Create a new deal
  router.post(
    '/',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateDealSchema),
    dealController.createDeal.bind(dealController)
  );

  // POST /deals/leads - Create a lead
  router.post(
    '/leads',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateLeadSchema),
    dealController.createLead.bind(dealController)
  );

  // POST /deals/qualified - Create a qualified deal
  router.post(
    '/qualified',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateQualifiedSchema),
    dealController.createQualified.bind(dealController)
  );

  // POST /deals/proposals - Create a proposal
  router.post(
    '/proposals',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateProposalSchema),
    dealController.createProposal.bind(dealController)
  );

  // POST /deals/negotiations - Create a negotiation
  router.post(
    '/negotiations',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateNegotiationSchema),
    dealController.createNegotiation.bind(dealController)
  );

  // ========================================================================
  // READ DEAL ROUTES
  // ========================================================================

  // GET /deals - Get all deals for organization
  router.get(
    '/',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/stats - Get deal statistics
  router.get(
    '/stats',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealFiltersQuerySchema, 'query'),
    dealController.getDealStats.bind(dealController)
  );

  // GET /deals/pipeline - Get pipeline data
  router.get(
    '/pipeline',
    authorize(['admin', 'manager', 'user']),
    dealController.getPipelineData.bind(dealController)
  );

  // GET /deals/forecast - Get sales forecast
  router.get(
    '/forecast',
    authorize(['admin', 'manager', 'user']),
    dealController.getSalesForecast.bind(dealController)
  );

  // GET /deals/conversion-rates - Get conversion rates
  router.get(
    '/conversion-rates',
    authorize(['admin', 'manager', 'user']),
    dealController.getConversionRates.bind(dealController)
  );

  // GET /deals/dashboard - Get dashboard data
  router.get(
    '/dashboard',
    authorize(['admin', 'manager', 'user']),
    dealController.getDashboardData.bind(dealController)
  );

  // GET /deals/:id - Get deal by ID
  router.get(
    '/:id',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    dealController.getDealById.bind(dealController)
  );

  // ========================================================================
  // UPDATE DEAL ROUTES
  // ========================================================================

  // PUT /deals/:id - Update deal
  router.put(
    '/:id',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(UpdateDealSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/stage - Update deal stage
  router.patch(
    '/:id/stage',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(UpdateStageSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/status - Update deal status
  router.patch(
    '/:id/status',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(UpdateStatusSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/priority - Update deal priority
  router.patch(
    '/:id/priority',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(UpdatePrioritySchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/value - Update deal value
  router.patch(
    '/:id/value',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(UpdateValueSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/probability - Update deal probability
  router.patch(
    '/:id/probability',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(UpdateProbabilitySchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/expected-close-date - Set expected close date
  router.patch(
    '/:id/expected-close-date',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(SetExpectedCloseDateSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/next-step - Set next step
  router.patch(
    '/:id/next-step',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(SetNextStepSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/tags - Add tag
  router.patch(
    '/:id/tags',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(AddTagSchema),
    dealController.updateDeal.bind(dealController)
  );

  // DELETE /deals/:id/tags - Remove tag
  router.delete(
    '/:id/tags',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(RemoveTagSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/competitors - Add competitor
  router.patch(
    '/:id/competitors',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(AddCompetitorSchema),
    dealController.updateDeal.bind(dealController)
  );

  // DELETE /deals/:id/competitors - Remove competitor
  router.delete(
    '/:id/competitors',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(RemoveCompetitorSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/decision-makers - Add decision maker
  router.patch(
    '/:id/decision-makers',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(AddDecisionMakerSchema),
    dealController.updateDeal.bind(dealController)
  );

  // DELETE /deals/:id/decision-makers - Remove decision maker
  router.delete(
    '/:id/decision-makers',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(RemoveDecisionMakerSchema),
    dealController.updateDeal.bind(dealController)
  );

  // PATCH /deals/:id/custom-fields - Set custom field
  router.patch(
    '/:id/custom-fields',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(SetCustomFieldSchema),
    dealController.updateDeal.bind(dealController)
  );

  // DELETE /deals/:id/custom-fields - Remove custom field
  router.delete(
    '/:id/custom-fields',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealIdParamSchema, 'params'),
    validateRequest(RemoveCustomFieldSchema),
    dealController.updateDeal.bind(dealController)
  );

  // ========================================================================
  // DELETE DEAL ROUTES
  // ========================================================================

  // DELETE /deals/:id - Delete deal
  router.delete(
    '/:id',
    authorize(['admin', 'manager']),
    validateRequest(DealIdParamSchema, 'params'),
    dealController.deleteDeal.bind(dealController)
  );

  // ========================================================================
  // CONTACT-SPECIFIC ROUTES
  // ========================================================================

  // GET /contacts/:contactId/deals - Get deals by contact
  router.get(
    '/contacts/:contactId/deals',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealContactIdParamSchema, 'params'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByContact.bind(dealController)
  );

  // ========================================================================
  // COMPANY-SPECIFIC ROUTES
  // ========================================================================

  // GET /companies/:companyId/deals - Get deals by company
  router.get(
    '/companies/:companyId/deals',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealCompanyIdParamSchema, 'params'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByCompany.bind(dealController)
  );

  // ========================================================================
  // STAGE-SPECIFIC ROUTES
  // ========================================================================

  // GET /deals/stage/:stage - Get deals by stage
  router.get(
    '/stage/:stage',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealStageParamSchema, 'params'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/status/:status - Get deals by status
  router.get(
    '/status/:status',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealStatusParamSchema, 'params'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/priority/:priority - Get deals by priority
  router.get(
    '/priority/:priority',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealPriorityParamSchema, 'params'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/source/:source - Get deals by source
  router.get(
    '/source/:source',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealSourceParamSchema, 'params'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // ========================================================================
  // VALUE AND PROBABILITY ROUTES
  // ========================================================================

  // GET /deals/value-range - Get deals by value range
  router.get(
    '/value-range',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealValueRangeQuerySchema, 'query'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/probability-range - Get deals by probability range
  router.get(
    '/probability-range',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealProbabilityRangeQuerySchema, 'query'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/high-value - Get high value deals
  router.get(
    '/high-value',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/high-probability - Get high probability deals
  router.get(
    '/high-probability',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // ========================================================================
  // TIME-BASED ROUTES
  // ========================================================================

  // GET /deals/expected-to-close - Get deals expected to close
  router.get(
    '/expected-to-close',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealExpectedCloseQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/overdue - Get overdue deals
  router.get(
    '/overdue',
    authorize(['admin', 'manager', 'user']),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/expected-this-month - Get deals expected this month
  router.get(
    '/expected-this-month',
    authorize(['admin', 'manager', 'user']),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/expected-this-quarter - Get deals expected this quarter
  router.get(
    '/expected-this-quarter',
    authorize(['admin', 'manager', 'user']),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/expected-this-year - Get deals expected this year
  router.get(
    '/expected-this-year',
    authorize(['admin', 'manager', 'user']),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /deals/closed-in-period - Get deals closed in period
  router.get(
    '/closed-in-period',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealClosedInPeriodQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // ========================================================================
  // USER-SPECIFIC ROUTES
  // ========================================================================

  // GET /users/:userId/deals - Get deals by user
  router.get(
    '/users/:userId/deals',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealUserIdParamSchema, 'params'),
    validateRequest(DealSearchQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /users/:userId/overdue - Get overdue deals by user
  router.get(
    '/users/:userId/overdue',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealUserIdParamSchema, 'params'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /users/:userId/won - Get won deals by user
  router.get(
    '/users/:userId/won',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealUserIdParamSchema, 'params'),
    validateRequest(DealClosedInPeriodQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // GET /users/:userId/lost - Get lost deals by user
  router.get(
    '/users/:userId/lost',
    authorize(['admin', 'manager', 'user']),
    validateRequest(DealUserIdParamSchema, 'params'),
    validateRequest(DealClosedInPeriodQuerySchema, 'query'),
    dealController.getDealsByOrganization.bind(dealController)
  );

  // ========================================================================
  // BULK OPERATION ROUTES
  // ========================================================================

  // PUT /deals/bulk - Bulk update deals
  router.put(
    '/bulk',
    authorize(['admin', 'manager']),
    validateRequest(DealBulkUpdateSchema),
    dealController.updateDeal.bind(dealController)
  );

  // DELETE /deals/bulk - Bulk delete deals
  router.delete(
    '/bulk',
    authorize(['admin', 'manager']),
    validateRequest(DealBulkDeleteSchema),
    dealController.deleteDeal.bind(dealController)
  );

  return router;
}
