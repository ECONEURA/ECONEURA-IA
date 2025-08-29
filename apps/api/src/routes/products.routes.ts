import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller.js';

const router = Router();
const controller = new ProductsController();

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         org_id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *         category:
 *           type: string
 *         unit_price:
 *           type: number
 *           format: decimal
 *         cost_price:
 *           type: number
 *           format: decimal
 *         currency:
 *           type: string
 *           default: EUR
 *         unit:
 *           type: string
 *           default: piece
 *         stock_quantity:
 *           type: integer
 *           default: 0
 *         min_stock_level:
 *           type: integer
 *           default: 0
 *         supplier_id:
 *           type: string
 *           format: uuid
 *         is_active:
 *           type: boolean
 *           default: true
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
 *         - sku
 *         - unit_price
 *     
 *     CreateProduct:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *         category:
 *           type: string
 *         unit_price:
 *           type: number
 *         cost_price:
 *           type: number
 *         currency:
 *           type: string
 *         unit:
 *           type: string
 *         stock_quantity:
 *           type: integer
 *         min_stock_level:
 *           type: integer
 *         supplier_id:
 *           type: string
 *           format: uuid
 *         is_active:
 *           type: boolean
 *         metadata:
 *           type: object
 *       required:
 *         - name
 *         - sku
 *         - unit_price
 *     
 *     UpdateProduct:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         sku:
 *           type: string
 *         category:
 *           type: string
 *         unit_price:
 *           type: number
 *         cost_price:
 *           type: number
 *         currency:
 *           type: string
 *         unit:
 *           type: string
 *         stock_quantity:
 *           type: integer
 *         min_stock_level:
 *           type: integer
 *         supplier_id:
 *           type: string
 *           format: uuid
 *         is_active:
 *           type: boolean
 *         metadata:
 *           type: object
 */

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Get all products with filters and pagination
 *     tags: [Products]
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
 *         description: Number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of products to skip
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by supplier ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in product names
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
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
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
router.get('/', controller.getProducts.bind(controller));

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Products]
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
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', controller.getProduct.bind(controller));

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
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
 *         description: User ID creating the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProduct'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', controller.createProduct.bind(controller));

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
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
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProduct'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', controller.updateProduct.bind(controller));

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
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
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', controller.deleteProduct.bind(controller));

/**
 * @openapi
 * /api/products/categories:
 *   get:
 *     summary: Get all product categories
 *     tags: [Products]
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
 *         description: List of product categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/categories', controller.getProductCategories.bind(controller));

/**
 * @openapi
 * /api/products/low-stock:
 *   get:
 *     summary: Get products with low stock
 *     tags: [Products]
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
 *         description: List of products with low stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/low-stock', controller.getLowStockProducts.bind(controller));

export default router;
