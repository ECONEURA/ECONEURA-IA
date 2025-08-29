import { Router } from 'express';
import { SuppliersController } from '../controllers/suppliers.controller.js';

const router = Router();
const controller = new SuppliersController();

/**
 * @openapi
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         org_id:
 *           type: string
 *         name:
 *           type: string
 *         contact_person:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *           format: uri
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             postal_code:
 *               type: string
 *             country:
 *               type: string
 *         tax_id:
 *           type: string
 *         payment_terms:
 *           type: string
 *           default: 30 days
 *         credit_limit:
 *           type: number
 *           format: decimal
 *         currency:
 *           type: string
 *           default: EUR
 *         is_active:
 *           type: boolean
 *           default: true
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         notes:
 *           type: string
 *         metadata:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - org_id
 *         - name
 *     
 *     CreateSupplier:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         contact_person:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *           format: uri
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             postal_code:
 *               type: string
 *             country:
 *               type: string
 *         tax_id:
 *           type: string
 *         payment_terms:
 *           type: string
 *         credit_limit:
 *           type: number
 *         currency:
 *           type: string
 *         is_active:
 *           type: boolean
 *         rating:
 *           type: integer
 *         notes:
 *           type: string
 *         metadata:
 *           type: object
 *       required:
 *         - name
 *     
 *     UpdateSupplier:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         contact_person:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         website:
 *           type: string
 *           format: uri
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             postal_code:
 *               type: string
 *             country:
 *               type: string
 *         tax_id:
 *           type: string
 *         payment_terms:
 *           type: string
 *         credit_limit:
 *           type: number
 *         currency:
 *           type: string
 *         is_active:
 *           type: boolean
 *         rating:
 *           type: integer
 *         notes:
 *           type: string
 *         metadata:
 *           type: object
 */

/**
 * @openapi
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers with filters and pagination
 *     tags: [Suppliers]
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
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of suppliers to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of suppliers to skip
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in supplier names
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
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
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
router.get('/', controller.getSuppliers.bind(controller));

/**
 * @openapi
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get a single supplier by ID
 *     tags: [Suppliers]
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
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', controller.getSupplier.bind(controller));

/**
 * @openapi
 * /api/suppliers:
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
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
 *         description: User ID creating the supplier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSupplier'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', controller.createSupplier.bind(controller));

/**
 * @openapi
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update a supplier
 *     tags: [Suppliers]
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
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSupplier'
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', controller.updateSupplier.bind(controller));

/**
 * @openapi
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete a supplier
 *     tags: [Suppliers]
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
 *         description: Supplier ID
 *     responses:
 *       204:
 *         description: Supplier deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', controller.deleteSupplier.bind(controller));

/**
 * @openapi
 * /api/suppliers/stats:
 *   get:
 *     summary: Get supplier statistics
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-org-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID for RLS
 *     responses:
 *       200:
 *         description: Supplier statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_suppliers:
 *                       type: integer
 *                     active_suppliers:
 *                       type: integer
 *                     avg_rating:
 *                       type: number
 *                     total_credit_limit:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/stats', controller.getSupplierStats.bind(controller));

export default router;
