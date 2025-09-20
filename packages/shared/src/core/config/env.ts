import { z } from 'zod';

/**
 * Environment configuration schema
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API Configuration
  PORT: z.coerce.number().default(3000),
  API_URL: z.string().url().optional(),
  
  // Database Configuration
  DATABASE_URL: z.string().url(),
  
  // Redis Configuration
  REDIS_URL: z.string().url().optional(),
  
  // Auth Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // AI Configuration
  OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  
  // Security
  CORS_ORIGINS: z.string().transform(str => str.split(',')).default('*'),
  ALLOWED_DOMAINS: z.string().transform(str => str.split(',')).optional(),
  
  // Feature Flags
  ENABLE_AI: z.coerce.boolean().default(true),
  ENABLE_METRICS: z.coerce.boolean().default(true),
  ENABLE_TRACING: z.coerce.boolean().default(false)
});

/**
 * Environment configuration type
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
    }
    throw error;
  }
}
