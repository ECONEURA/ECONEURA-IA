// ============================================================================
// PRESENTATION LAYER EXPORTS
// ============================================================================

// Base DTOs
export * from './dto/base.dto.js';

// DTOs
export * from './dto/user.dto.js';
export * from './dto/organization.dto.js';
export * from './dto/company.dto.js';
export * from './dto/contact.dto.js';
export * from './dto/product.dto.js';

// Base Controller
export { BaseController } from './controllers/base.controller.js';

// Controllers
export { UserController } from './controllers/user.controller.js';
export { CompanyController } from './controllers/company.controller.js';
export { ContactController } from './controllers/contact.controller.js';
export { ProductController } from './controllers/product.controller.js';

// Base Middleware
export * from './middleware/base.middleware.js';

// Middleware
export { validateRequest } from './middleware/validation.middleware.js';
export { responseHandler } from './middleware/response.middleware.js';
export { errorHandler, notFoundHandler, asyncHandler } from './middleware/error.middleware.js';

// Routes
export { createUserRoutes } from './routes/user.routes.js';
export { createCompanyRoutes } from './routes/company.routes.js';
export { createContactRoutes } from './routes/contact.routes.js';
export { createProductRoutes } from './routes/product.routes.js';

// Types
export type { ValidationSchema } from './middleware/validation.middleware.js';
export type { ApiResponse } from './middleware/response.middleware.js';
export type { ApiError } from './middleware/error.middleware.js';

// Re-export shared utilities for convenience
export * from '../shared/index.js';
