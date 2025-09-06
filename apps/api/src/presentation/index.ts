// ============================================================================
// PRESENTATION LAYER EXPORTS
// ============================================================================

// DTOs
export * from './dto/user.dto.js';
export * from './dto/organization.dto.js';
export * from './dto/company.dto.js';
export * from './dto/contact.dto.js';

// Controllers
export { UserController } from './controllers/user.controller.js';
export { CompanyController } from './controllers/company.controller.js';
export { ContactController } from './controllers/contact.controller.js';

// Middleware
export { validateRequest } from './middleware/validation.middleware.js';
export { responseHandler } from './middleware/response.middleware.js';
export { errorHandler, notFoundHandler, asyncHandler } from './middleware/error.middleware.js';

// Routes
export { createUserRoutes } from './routes/user.routes.js';
export { createCompanyRoutes } from './routes/company.routes.js';
export { createContactRoutes } from './routes/contact.routes.js';

// Types
export type { ValidationSchema } from './middleware/validation.middleware.js';
export type { ApiResponse } from './middleware/response.middleware.js';
export type { ApiError } from './middleware/error.middleware.js';
