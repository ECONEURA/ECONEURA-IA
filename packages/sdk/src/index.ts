// Main exports
export {
  ECONEURAClient,
  createECONEURAClient,
  econeuraClient,
  defaultConfig,
  ECONEURAError,
} from './client.js';

// Type exports
export type {
  ECONEURAClientConfig,
  MemoryPutRequest,
  MemoryPutResponse,
  MemoryQueryRequest,
  MemoryQueryResponse,
  MemoryStatsResponse,
  MemoryCleanupResponse,
  ProblemDetails,
} from './client.js';

// Schema exports
export {
  MemoryPutRequestSchema,
  MemoryPutResponseSchema,
  MemoryQueryRequestSchema,
  MemoryQueryResponseSchema,
  MemoryStatsResponseSchema,
  MemoryCleanupResponseSchema,
  ProblemDetailsSchema,
} from './client.js';