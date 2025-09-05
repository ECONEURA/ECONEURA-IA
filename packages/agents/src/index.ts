/**
 * ECONEURA Agents Package
 * 
 * Exports agent types, registry, and execution utilities
 */

export * from './types.js';
export * from './registry.js';

// Re-export commonly used items for convenience
export {
  AGENTS_REGISTRY,
  getAgentById,
  getAgentsByCategory,
  getAllCategories,
  getRegistryStats,
} from './registry.js';

export type {
  AgentDescriptor,
  AgentContext,
  AgentResult,
  AgentPolicy,
  AgentCategoryType,
  AgentExecutionRequest,
  AgentExecutionStatusType,
  AgentExecutionRecord,
} from './types.js';