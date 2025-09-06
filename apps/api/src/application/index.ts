// ============================================================================
// APPLICATION LAYER EXPORTS
// ============================================================================

// Base Use Case
export { BaseUseCase } from './use-cases/base.use-case.js';
export type { BaseRequest, BaseResponse, BaseError } from './use-cases/base.use-case.js';

// Use Cases
export { CreateUserUseCase } from './use-cases/user/create-user.use-case.js';
export { UpdateUserUseCase } from './use-cases/user/update-user.use-case.js';
export { DeleteUserUseCase } from './use-cases/user/delete-user.use-case.js';
export { CreateCompanyUseCase } from './use-cases/company/create-company.use-case.js';
export { UpdateCompanyUseCase } from './use-cases/company/update-company.use-case.js';
export { CreateContactUseCase } from './use-cases/contact/create-contact.use-case.js';
export { UpdateContactUseCase } from './use-cases/contact/update-contact.use-case.js';
export { CreateProductUseCase } from './use-cases/product/create-product.use-case.js';
export { UpdateProductUseCase } from './use-cases/product/update-product.use-case.js';

// Application Services
export { UserApplicationService } from './services/user.application.service.js';

// Types
export type { CreateUserRequest, CreateUserResponse } from './use-cases/user/create-user.use-case.js';
export type { UpdateUserRequest, UpdateUserResponse } from './use-cases/user/update-user.use-case.js';
export type { DeleteUserRequest, DeleteUserResponse } from './use-cases/user/delete-user.use-case.js';
export type { CreateCompanyRequest, CreateCompanyResponse } from './use-cases/company/create-company.use-case.js';
export type { UpdateCompanyRequest, UpdateCompanyResponse } from './use-cases/company/update-company.use-case.js';
export type { CreateContactRequest, CreateContactResponse } from './use-cases/contact/create-contact.use-case.js';
export type { UpdateContactRequest, UpdateContactResponse } from './use-cases/contact/update-contact.use-case.js';
export type { CreateProductRequest, CreateProductResponse } from './use-cases/product/create-product.use-case.js';
export type { UpdateProductRequest, UpdateProductResponse } from './use-cases/product/update-product.use-case.js';
export type { UserSearchOptions, UserListResponse, UserStatsResponse } from './services/user.application.service.js';

// Re-export shared utilities for convenience
export * from '../shared/index.js';
