export * from './types.js';
export * from './registry.js';

// Re-export commonly used types and instances
export {
  AgentCategory,
  type AgentDescriptor,
  type AgentContext,
  type AgentResult,
  type AgentExecutionRequest,
  type AgentExecutionRecord,
  type AgentCategoryType,
  AGENT_REGISTRY,
  AgentRegistryManager,
  agentRegistry,
} from './registry.js';