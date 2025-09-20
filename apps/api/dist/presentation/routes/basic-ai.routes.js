import { Router } from 'express';
import { basicAIController } from '../controllers/basic-ai.controller.js';
import { jwtAuthMiddleware } from '../../middleware/auth.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit-org.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { responseMiddleware } from '../middleware/response.middleware.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
const router = Router();
router.use(jwtAuthMiddleware);
router.use(rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many AI requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
}));
router.use(responseMiddleware);
router.post('/generate', validationMiddleware({
    body: {
        prompt: { type: 'string', required: true, minLength: 1, maxLength: 5000 },
        sessionId: { type: 'string', required: false },
        options: {
            type: 'object',
            required: false,
            properties: {
                maxTokens: { type: 'number', min: 1, max: 4000 },
                temperature: { type: 'number', min: 0, max: 2 },
                includeAnalysis: { type: 'boolean' },
                includeSuggestions: { type: 'boolean' }
            }
        }
    }
}), basicAIController.generateResponse.bind(basicAIController));
router.post('/sessions', validationMiddleware({
    body: {
        preferences: {
            type: 'object',
            required: false,
            properties: {
                language: { type: 'string' },
                responseStyle: { type: 'string', enum: ['formal', 'casual', 'technical'] },
                maxLength: { type: 'number', min: 100, max: 2000 }
            }
        }
    }
}), basicAIController.createSession.bind(basicAIController));
router.get('/sessions/:sessionId/history', validationMiddleware({
    params: {
        sessionId: { type: 'string', required: true }
    }
}), basicAIController.getSessionHistory.bind(basicAIController));
router.delete('/sessions/:sessionId', validationMiddleware({
    params: {
        sessionId: { type: 'string', required: true }
    }
}), basicAIController.clearSession.bind(basicAIController));
router.get('/health', basicAIController.getHealthStatus.bind(basicAIController));
router.get('/capabilities', basicAIController.getCapabilities.bind(basicAIController));
router.use(errorMiddleware);
export { router as basicAIRoutes };
//# sourceMappingURL=basic-ai.routes.js.map