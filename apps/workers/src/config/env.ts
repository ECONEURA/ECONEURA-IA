import { z } from 'zod';

/**
 * Environment Variables Schema for Workers Service
 * Validates all critical environment variables at startup
 */

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3002),
  
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  REDIS_URL: z.string().min(1, 'Redis URL is required'),
  
  // Queue Configuration
  QUEUE_NAME: z.string().default('econeura-jobs'),
  QUEUE_CONCURRENCY: z.coerce.number().min(1).max(50).default(5),
  QUEUE_MAX_ATTEMPTS: z.coerce.number().min(1).max(10).default(3),
  QUEUE_DELAY: z.coerce.number().min(0).default(0),
  
  // Job Processing
  JOB_TIMEOUT: z.coerce.number().min(1000).default(300000), // 5 minutes
  BATCH_SIZE: z.coerce.number().min(1).max(1000).default(100),
  
  // Monitoring & Metrics
  METRICS_PORT: z.coerce.number().min(1).max(65535).default(9091),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // External Services
  EMAIL_SMTP_URL: z.string().url().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  
  // Performance
  MEMORY_LIMIT: z.string().default('512mb'),
  CPU_LIMIT: z.coerce.number().min(0.1).max(4).default(1),
  
  // Feature Flags
  ENABLE_CRON_JOBS: z.coerce.boolean().default(true),
  ENABLE_HEALTH_CHECKS: z.coerce.boolean().default(true),
  
  // Security
  WORKER_SECRET: z.string().optional(),
  
  // Development/Testing
  DISABLE_WORKERS: z.coerce.boolean().default(false),
});

export type WorkerEnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables for workers
 * @throws {Error} If validation fails
 */
function validateWorkerEnv(): WorkerEnvConfig {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Additional validation for workers
    if (parsed.NODE_ENV === 'production') {
      if (parsed.QUEUE_CONCURRENCY > 20) {
        console.warn('⚠️  High concurrency in production may impact performance');
      }
      
      if (!parsed.WORKER_SECRET) {
        console.warn('⚠️  WORKER_SECRET not set for production workers');
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Worker environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(`  - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.error('\n💡 Check your .env file and ensure all required worker variables are set.');
    process.exit(1);
  }
}

/**
 * Validated worker environment configuration
 */
export const workerEnv = validateWorkerEnv();

// Helper functions
export const isDevelopment = () => workerEnv.NODE_ENV === 'development';
export const isProduction = () => workerEnv.NODE_ENV === 'production';
export const isTest = () => workerEnv.NODE_ENV === 'test';

// Export worker-specific configs
export const queueConfig = {
  name: workerEnv.QUEUE_NAME,
  concurrency: workerEnv.QUEUE_CONCURRENCY,
  maxAttempts: workerEnv.QUEUE_MAX_ATTEMPTS,
  delay: workerEnv.QUEUE_DELAY,
  timeout: workerEnv.JOB_TIMEOUT,
} as const;

export const workerServerConfig = {
  port: workerEnv.PORT,
  metricsPort: workerEnv.METRICS_PORT,
} as const;

