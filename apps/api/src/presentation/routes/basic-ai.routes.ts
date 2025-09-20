import { Router } from 'express';
import { basicAIController } from '../controllers/basic-ai.controller.js';
import { jwtAuthMiddleware } from '../../middleware/auth.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit-org.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { responseMiddleware } from '../middleware/response.middleware.js';
import { errorMiddleware } from '../middleware/error.middleware.js';

// ============================================================================
// BASIC AI ROUTES - PR-16
// ============================================================================

const router = Router();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Aplicar middleware de autenticación a todas las rutas
router.use(jwtAuthMiddleware);

// Aplicar middleware de rate limiting específico para IA
router.use(rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Too many AI requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
}));

// Aplicar middleware de respuesta
router.use(responseMiddleware);

// ============================================================================
// AI GENERATION ROUTES
// ============================================================================

/**
 * @route POST /api/ai/generate
 * @desc Generate AI response based on prompt
 * @access Private
 * @body { prompt: string, sessionId?: string, options?: object }
 */
router.post('/generate', 
  validationMiddleware({
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
  }),
  basicAIController.generateResponse.bind(basicAIController)
);

// ============================================================================
// SESSION MANAGEMENT ROUTES
// ============================================================================

/**
 * @route POST /api/ai/sessions
 * @desc Create new AI session
 * @access Private
 * @body { preferences?: object }
 */
router.post('/sessions',
  validationMiddleware({
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
  }),
  basicAIController.createSession.bind(basicAIController)
);

/**
 * @route GET /api/ai/sessions/:sessionId/history
 * @desc Get session history
 * @access Private
 * @params { sessionId: string }
 */
router.get('/sessions/:sessionId/history',
  validationMiddleware({
    params: {
      sessionId: { type: 'string', required: true }
    }
  }),
  basicAIController.getSessionHistory.bind(basicAIController)
);

/**
 * @route DELETE /api/ai/sessions/:sessionId
 * @desc Clear session data
 * @access Private
 * @params { sessionId: string }
 */
router.delete('/sessions/:sessionId',
  validationMiddleware({
    params: {
      sessionId: { type: 'string', required: true }
    }
  }),
  basicAIController.clearSession.bind(basicAIController)
);

// ============================================================================
// SYSTEM ROUTES
// ============================================================================

/**
 * @route GET /api/ai/health
 * @desc Get AI service health status
 * @access Public
 */
router.get('/health', basicAIController.getHealthStatus.bind(basicAIController));

/**
 * @route GET /api/ai/capabilities
 * @desc Get AI service capabilities
 * @access Public
 */
router.get('/capabilities', basicAIController.getCapabilities.bind(basicAIController));

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Aplicar middleware de manejo de errores
router.use(errorMiddleware);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export { router as basicAIRoutes };

