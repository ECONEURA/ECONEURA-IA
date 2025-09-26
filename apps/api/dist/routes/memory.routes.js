import { Router } from 'express';

import { memoryController } from '../controllers/memory.controller.js';
const router = Router();
router.post('/put', memoryController.putMemory.bind(memoryController));
router.post('/query', memoryController.queryMemory.bind(memoryController));
router.get('/stats/:tenantId', memoryController.getMemoryStats.bind(memoryController));
router.post('/cleanup', memoryController.cleanupMemories.bind(memoryController));
export default router;
//# sourceMappingURL=memory.routes.js.map