// ============================================================================
// SHARED LAYER EXPORTS
// ============================================================================

// ========================================================================
// UTILITIES
// ========================================================================

// Validation utilities
export * from './utils/validation.utils.js';

// Error utilities
export * from './utils/error.utils.js';

// ========================================================================
// TYPES
// ========================================================================

export type {
  ValidationError,
  ValidationResult
} from './utils/validation.utils.js';

export type {
  BaseError,
  ValidationError as ValidationErrorType,
  NotFoundError,
  ConflictError,
  BusinessError,
  ExternalError,
  ErrorResponse
} from './utils/error.utils.js';

export {
  ErrorType,
  ErrorCode
} from './utils/error.utils.js';
