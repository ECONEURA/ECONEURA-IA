import { Router } from 'express';
import { InteractionController } from '../controllers/interaction.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  CreateInteractionSchema,
  CreateScheduledInteractionSchema,
  CreateTaskSchema,
  CreateNoteSchema,
  CreateFollowUpSchema,
  UpdateInteractionSchema,
  UpdateStatusSchema,
  UpdatePrioritySchema,
  ScheduleInteractionSchema,
  CompleteInteractionSchema,
  SetNextActionSchema,
  AddTagSchema,
  RemoveTagSchema,
  SetCustomFieldSchema,
  RemoveCustomFieldSchema,
  InteractionIdParamSchema,
  InteractionOrganizationIdParamSchema,
  InteractionContactIdParamSchema,
  InteractionCompanyIdParamSchema,
  InteractionUserIdParamSchema,
  InteractionSearchQuerySchema,
  InteractionFiltersQuerySchema,
  InteractionBulkUpdateSchema,
  InteractionBulkDeleteSchema,
  InteractionTypeParamSchema,
  InteractionStatusParamSchema,
  InteractionPriorityParamSchema,
  InteractionScheduledQuerySchema,
  InteractionUpcomingQuerySchema
} from '../dto/interaction.dto.js';

// ============================================================================
// INTERACTION ROUTES
// ============================================================================

export function createInteractionRoutes(interactionController: InteractionController): Router {
  const router = Router();

  // ========================================================================
  // AUTHENTICATION AND AUTHORIZATION MIDDLEWARE
  // ========================================================================

  // All routes require authentication
  router.use(authenticate);

  // ========================================================================
  // CREATE INTERACTION ROUTES
  // ========================================================================

  // POST /interactions - Create a new interaction
  router.post(
    '/',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateInteractionSchema),
    interactionController.createInteraction.bind(interactionController)
  );

  // POST /interactions/scheduled - Create a scheduled interaction
  router.post(
    '/scheduled',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateScheduledInteractionSchema),
    interactionController.createScheduledInteraction.bind(interactionController)
  );

  // POST /interactions/tasks - Create a task
  router.post(
    '/tasks',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateTaskSchema),
    interactionController.createTask.bind(interactionController)
  );

  // POST /interactions/notes - Create a note
  router.post(
    '/notes',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateNoteSchema),
    interactionController.createNote.bind(interactionController)
  );

  // POST /interactions/follow-ups - Create a follow-up
  router.post(
    '/follow-ups',
    authorize(['admin', 'manager', 'user']),
    validateRequest(CreateFollowUpSchema),
    interactionController.createFollowUp.bind(interactionController)
  );

  // ========================================================================
  // READ INTERACTION ROUTES
  // ========================================================================

  // GET /interactions - Get all interactions for organization
  router.get(
    '/',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/stats - Get interaction statistics
  router.get(
    '/stats',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionFiltersQuerySchema, 'query'),
    interactionController.getInteractionStats.bind(interactionController)
  );

  // GET /interactions/dashboard - Get dashboard data
  router.get(
    '/dashboard',
    authorize(['admin', 'manager', 'user']),
    interactionController.getDashboardData.bind(interactionController)
  );

  // GET /interactions/:id - Get interaction by ID
  router.get(
    '/:id',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    interactionController.getInteractionById.bind(interactionController)
  );

  // ========================================================================
  // UPDATE INTERACTION ROUTES
  // ========================================================================

  // PUT /interactions/:id - Update interaction
  router.put(
    '/:id',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(UpdateInteractionSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // PATCH /interactions/:id/status - Update interaction status
  router.patch(
    '/:id/status',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(UpdateStatusSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // PATCH /interactions/:id/priority - Update interaction priority
  router.patch(
    '/:id/priority',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(UpdatePrioritySchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // PATCH /interactions/:id/schedule - Schedule interaction
  router.patch(
    '/:id/schedule',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(ScheduleInteractionSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // PATCH /interactions/:id/complete - Complete interaction
  router.patch(
    '/:id/complete',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(CompleteInteractionSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // PATCH /interactions/:id/next-action - Set next action
  router.patch(
    '/:id/next-action',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(SetNextActionSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // PATCH /interactions/:id/tags - Add tag
  router.patch(
    '/:id/tags',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(AddTagSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // DELETE /interactions/:id/tags - Remove tag
  router.delete(
    '/:id/tags',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(RemoveTagSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // PATCH /interactions/:id/custom-fields - Set custom field
  router.patch(
    '/:id/custom-fields',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(SetCustomFieldSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // DELETE /interactions/:id/custom-fields - Remove custom field
  router.delete(
    '/:id/custom-fields',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionIdParamSchema, 'params'),
    validateRequest(RemoveCustomFieldSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // ========================================================================
  // DELETE INTERACTION ROUTES
  // ========================================================================

  // DELETE /interactions/:id - Delete interaction
  router.delete(
    '/:id',
    authorize(['admin', 'manager']),
    validateRequest(InteractionIdParamSchema, 'params'),
    interactionController.deleteInteraction.bind(interactionController)
  );

  // ========================================================================
  // CONTACT-SPECIFIC ROUTES
  // ========================================================================

  // GET /contacts/:contactId/interactions - Get interactions by contact
  router.get(
    '/contacts/:contactId/interactions',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionContactIdParamSchema, 'params'),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByContact.bind(interactionController)
  );

  // ========================================================================
  // COMPANY-SPECIFIC ROUTES
  // ========================================================================

  // GET /companies/:companyId/interactions - Get interactions by company
  router.get(
    '/companies/:companyId/interactions',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionCompanyIdParamSchema, 'params'),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByCompany.bind(interactionController)
  );

  // ========================================================================
  // TYPE-SPECIFIC ROUTES
  // ========================================================================

  // GET /interactions/type/:type - Get interactions by type
  router.get(
    '/type/:type',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionTypeParamSchema, 'params'),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/status/:status - Get interactions by status
  router.get(
    '/status/:status',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionStatusParamSchema, 'params'),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/priority/:priority - Get interactions by priority
  router.get(
    '/priority/:priority',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionPriorityParamSchema, 'params'),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // ========================================================================
  // TIME-BASED ROUTES
  // ========================================================================

  // GET /interactions/scheduled - Get scheduled interactions
  router.get(
    '/scheduled',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionScheduledQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/upcoming - Get upcoming interactions
  router.get(
    '/upcoming',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionUpcomingQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/overdue - Get overdue interactions
  router.get(
    '/overdue',
    authorize(['admin', 'manager', 'user']),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/completed - Get completed interactions
  router.get(
    '/completed',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionScheduledQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // ========================================================================
  // TASK-SPECIFIC ROUTES
  // ========================================================================

  // GET /interactions/tasks - Get all tasks
  router.get(
    '/tasks',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/tasks/overdue - Get overdue tasks
  router.get(
    '/tasks/overdue',
    authorize(['admin', 'manager', 'user']),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/tasks/upcoming - Get upcoming tasks
  router.get(
    '/tasks/upcoming',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionUpcomingQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // ========================================================================
  // FOLLOW-UP ROUTES
  // ========================================================================

  // GET /interactions/follow-ups - Get all follow-ups
  router.get(
    '/follow-ups',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/follow-ups/overdue - Get overdue follow-ups
  router.get(
    '/follow-ups/overdue',
    authorize(['admin', 'manager', 'user']),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /interactions/follow-ups/upcoming - Get upcoming follow-ups
  router.get(
    '/follow-ups/upcoming',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionUpcomingQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // ========================================================================
  // USER-SPECIFIC ROUTES
  // ========================================================================

  // GET /users/:userId/interactions - Get interactions by user
  router.get(
    '/users/:userId/interactions',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionUserIdParamSchema, 'params'),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /users/:userId/tasks - Get tasks by user
  router.get(
    '/users/:userId/tasks',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionUserIdParamSchema, 'params'),
    validateRequest(InteractionSearchQuerySchema, 'query'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // GET /users/:userId/overdue - Get overdue interactions by user
  router.get(
    '/users/:userId/overdue',
    authorize(['admin', 'manager', 'user']),
    validateRequest(InteractionUserIdParamSchema, 'params'),
    interactionController.getInteractionsByOrganization.bind(interactionController)
  );

  // ========================================================================
  // BULK OPERATION ROUTES
  // ========================================================================

  // PUT /interactions/bulk - Bulk update interactions
  router.put(
    '/bulk',
    authorize(['admin', 'manager']),
    validateRequest(InteractionBulkUpdateSchema),
    interactionController.updateInteraction.bind(interactionController)
  );

  // DELETE /interactions/bulk - Bulk delete interactions
  router.delete(
    '/bulk',
    authorize(['admin', 'manager']),
    validateRequest(InteractionBulkDeleteSchema),
    interactionController.deleteInteraction.bind(interactionController)
  );

  return router;
}
