import { Router } from 'express';
import { memoryController } from '../controllers/memory.controller.js';

const router = Router();

// POST /v1/memory/put
router.post('/put', memoryController.putMemory.bind(memoryController));

// POST /v1/memory/query
router.post('/query', memoryController.queryMemory.bind(memoryController));

// GET /v1/memory/stats/:tenantId
router.get('/stats/:tenantId', memoryController.getMemoryStats.bind(memoryController));

// POST /v1/memory/cleanup
router.post('/cleanup', memoryController.cleanupMemories.bind(memoryController));

export default router;