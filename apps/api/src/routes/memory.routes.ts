import { Router } from 'express';
import { MemoryController } from '../controllers/memory.controller';
import { validateMemoryPut, validateMemoryQuery } from '../middleware/validation.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();
const memoryController = new MemoryController();

/**
 * @swagger
 * /v1/memory/put:
 *   post:
 *     summary: Store or update memory entry
 *     description: Store or update a memory entry with vector embeddings, text, and metadata
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - userId
 *               - agentId
 *               - namespace
 *             properties:
 *               tenantId:
 *                 type: string
 *                 description: Tenant identifier
 *                 example: "tenant-123"
 *               userId:
 *                 type: string
 *                 description: User identifier
 *                 example: "user-456"
 *               agentId:
 *                 type: string
 *                 description: Agent identifier
 *                 example: "agent-789"
 *               namespace:
 *                 type: string
 *                 description: Memory namespace
 *                 example: "conversations"
 *               vector:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Vector embeddings (optional)
 *                 example: [0.1, 0.2, 0.3, 0.4, 0.5]
 *               text:
 *                 type: string
 *                 description: Text content (optional)
 *                 example: "User asked about pricing"
 *               ttlSec:
 *                 type: number
 *                 description: Time to live in seconds (optional)
 *                 example: 3600
 *               meta:
 *                 type: object
 *                 description: Additional metadata (optional)
 *                 example: {"source": "chat", "timestamp": "2024-01-10T10:00:00Z"}
 *     responses:
 *       200:
 *         description: Memory entry stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: string
 *                   description: Memory entry ID
 *                   example: "mem-abc123"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/put', 
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 100 }), // 100 requests per minute
  validateMemoryPut,
  memoryController.putMemory.bind(memoryController)
);

/**
 * @swagger
 * /v1/memory/query:
 *   post:
 *     summary: Query memory entries
 *     description: Search memory entries by query string with optional filters
 *     tags: [Memory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - tenantId
 *                 - namespace
 *                 - query
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   description: Tenant identifier
 *                   example: "tenant-123"
 *                 userId:
 *                   type: string
 *                   description: User identifier (optional filter)
 *                   example: "user-456"
 *                 agentId:
 *                   type: string
 *                   description: Agent identifier (optional filter)
 *                   example: "agent-789"
 *                 namespace:
 *                   type: string
 *                   description: Memory namespace
 *                   example: "conversations"
 *                 query:
 *                   type: string
 *                   description: Search query
 *                   example: "pricing information"
 *                 topK:
 *                   type: number
 *                   description: Maximum number of results
 *                   example: 10
 *                   default: 5
 *     responses:
 *       200:
 *         description: Memory entries found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "mem-abc123"
 *                       score:
 *                         type: number
 *                         description: Similarity score
 *                         example: 0.95
 *                       text:
 *                         type: string
 *                         example: "User asked about pricing"
 *                       meta:
 *                         type: object
 *                         example: {"source": "chat", "timestamp": "2024-01-10T10:00:00Z"}
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.post('/query',
  authenticateToken,
  rateLimit({ windowMs: 60000, max: 200 }), // 200 requests per minute
  validateMemoryQuery,
  memoryController.queryMemory.bind(memoryController)
);

export default router;
