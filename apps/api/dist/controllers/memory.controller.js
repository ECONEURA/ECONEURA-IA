import { memoryService } from '../services/memory.service.js';
export class MemoryController {
    async putMemory(req, res) {
        try {
            const idempotencyKey = req.headers['x-idempotency-key'];
            const request = req.body;
            const result = await memoryService.putMemory(request, idempotencyKey);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error in putMemory:', error);
            if (error instanceof Error && error.message.includes('Validation error')) {
                res.status(400).json({
                    type: 'https://econeura/errors/validation-error',
                    title: 'Validation Error',
                    status: 400,
                    detail: error.message,
                    instance: req.path,
                });
                return;
            }
            res.status(500).json({
                type: 'https://econeura/errors/internal-error',
                title: 'Internal Server Error',
                status: 500,
                detail: 'An unexpected error occurred',
                instance: req.path,
            });
        }
    }
    async queryMemory(req, res) {
        try {
            const request = req.body;
            const result = await memoryService.queryMemory(request);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error in queryMemory:', error);
            if (error instanceof Error && error.message.includes('Validation error')) {
                res.status(400).json({
                    type: 'https://econeura/errors/validation-error',
                    title: 'Validation Error',
                    status: 400,
                    detail: error.message,
                    instance: req.path,
                });
                return;
            }
            res.status(500).json({
                type: 'https://econeura/errors/internal-error',
                title: 'Internal Server Error',
                status: 500,
                detail: 'An unexpected error occurred',
                instance: req.path,
            });
        }
    }
    async getMemoryStats(req, res) {
        try {
            const { tenantId } = req.params;
            if (!tenantId) {
                res.status(400).json({
                    type: 'https://econeura/errors/validation-error',
                    title: 'Validation Error',
                    status: 400,
                    detail: 'tenantId is required',
                    instance: req.path,
                });
                return;
            }
            const result = await memoryService.getMemoryStats(tenantId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error in getMemoryStats:', error);
            res.status(500).json({
                type: 'https://econeura/errors/internal-error',
                title: 'Internal Server Error',
                status: 500,
                detail: 'An unexpected error occurred',
                instance: req.path,
            });
        }
    }
    async cleanupMemories(req, res) {
        try {
            const result = await memoryService.cleanupExpiredMemories();
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error in cleanupMemories:', error);
            res.status(500).json({
                type: 'https://econeura/errors/internal-error',
                title: 'Internal Server Error',
                status: 500,
                detail: 'An unexpected error occurred',
                instance: req.path,
            });
        }
    }
}
export const memoryController = new MemoryController();
//# sourceMappingURL=memory.controller.js.map