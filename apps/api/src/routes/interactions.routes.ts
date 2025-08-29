import { Router } from 'express';
import { InteractionsController } from '../controllers/interactions.controller';

const router = Router();
const controller = new InteractionsController();

/**
 * @openapi
 * components:
 *   schemas:
 *     Interaction:
 *       type: object
 *       required:
 *         - id
 *         - org_id
 *         - type
 *         - created_by
 *         - created_at
 *         - updated_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the interaction
 *         org_id:
 *           type: string
 *           description: Organization ID for RLS
 *         company_id:
 *           type: string
 *           format: uuid
 *           description: Associated company ID
 *         contact_id:
 *           type: string
 *           format: uuid
 *           description: Associated contact ID
 *         deal_id:
 *           type: string
 *           format: uuid
 *           description: Associated deal ID
 *         type:
 *           type: string
 *           enum: [email, call, meeting, note, task]
 *           description: Type of interaction
 *         subject:
 *           type: string
 *           description: Subject or title of the interaction
 *         content:
 *           type: string
 *           description: Content or description of the interaction
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           default: pending
 *           description: Current status of the interaction
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *           description: Priority level of the interaction
 *         due_date:
 *           type: string
 *           format: date-time
 *           description: Due date for the interaction
 *         completed_at:
 *           type: string
 *           format: date-time
 *           description: When the interaction was completed
 *         assigned_to:
 *           type: string
 *           format: uuid
 *           description: User assigned to the interaction
 *         created_by:
 *           type: string
 *           format: uuid
 *           description: User who created the interaction
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         metadata:
 *           type: object
 *           description: Additional metadata for the interaction
 *     
 *     CreateInteraction:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         company_id:
 *           type: string
 *           format: uuid
 *         contact_id:
 *           type: string
 *           format: uuid
 *         deal_id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [email, call, meeting, note, task]
 *         subject:
 *           type: string
 *         content:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         due_date:
 *           type: string
 *           format: date-time
 *         assigned_to:
 *           type: string
 *           format: uuid
 *         metadata:
 *           type: object
 *     
 *     UpdateInteraction:
 *       type: object
 *       properties:
 *         company_id:
 *           type: string
 *           format: uuid
 *         contact_id:
 *           type: string
 *           format: uuid
 *         deal_id:
 *           type: string
 *           format: uuid
 *         type:
 *           type: string
 *           enum: [email, call, meeting, note, task]
 *         subject:
 *           type: string
 *         content:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         due_date:
 *           type: string
 *           format: date-time
 *         completed_at:
 *           type: string
 *           format: date-time
 *         assigned_to:
 *           type: string
 *           format: uuid
 *         metadata:
 *           type: object
 *     
 *     InteractionSummary:
 *       type: object
 *       properties:
 *         summary:
 *           type: string
 *           description: AI-generated summary of interactions
 *         insights:
 *           type: array
 *           items:
 *             type: string
 *           description: Key insights about patterns and trends
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *           description: Actionable recommendations for follow-up
 */

/**
 * @openapi
 * /api/interactions:
 *   get:
 *     summary: Get all interactions with filters
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-org-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID for RLS
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *       - in: query
 *         name: contact_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by contact ID
 *       - in: query
 *         name: deal_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by deal ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [email, call, meeting, note, task]
 *         description: Filter by interaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of interactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Interaction'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', controller.getInteractions.bind(controller));

/**
 * @openapi
 * /api/interactions/{id}:
 *   get:
 *     summary: Get a single interaction by ID
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-org-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID for RLS
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Interaction ID
 *     responses:
 *       200:
 *         description: Interaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Interaction'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', controller.getInteraction.bind(controller));

/**
 * @openapi
 * /api/interactions:
 *   post:
 *     summary: Create a new interaction
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-org-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID for RLS
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID creating the interaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInteraction'
 *     responses:
 *       201:
 *         description: Interaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Interaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', controller.createInteraction.bind(controller));

/**
 * @openapi
 * /api/interactions/{id}:
 *   put:
 *     summary: Update an interaction
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-org-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID for RLS
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Interaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInteraction'
 *     responses:
 *       200:
 *         description: Interaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Interaction'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', controller.updateInteraction.bind(controller));

/**
 * @openapi
 * /api/interactions/{id}:
 *   delete:
 *     summary: Delete an interaction
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-org-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID for RLS
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Interaction ID
 *     responses:
 *       204:
 *         description: Interaction deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', controller.deleteInteraction.bind(controller));

/**
 * @openapi
 * /api/interactions/summary:
 *   get:
 *     summary: Get AI-generated summary of interactions
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-org-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID for RLS
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by company ID
 *       - in: query
 *         name: contact_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by contact ID
 *       - in: query
 *         name: deal_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by deal ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: AI-generated summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/InteractionSummary'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/summary', controller.getInteractionSummary.bind(controller));

export default router;
