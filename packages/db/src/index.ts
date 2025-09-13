// ============================================================================
// ECONEURA DATABASE PACKAGE
// ============================================================================
// Main exports for the database package
// Includes schema, database service, and utilities
// ============================================================================

// Schema exports
export * from './schema/index.js';

// Database service exports
export * from './database.js';

// Migration utilities
export { migrate } from 'drizzle-orm/postgres-js/migrator';
export { sql } from 'drizzle-orm';

// Re-export common Drizzle utilities
export { 
  eq, 
  ne, 
  gt, 
  gte, 
  lt, 
  lte, 
  like, 
  ilike, 
  inArray, 
  notInArray, 
  isNull, 
  isNotNull,
  and,
  or,
  not,
  desc,
  asc,
  count,
  sum,
  avg,
  max,
  min
} from 'drizzle-orm';