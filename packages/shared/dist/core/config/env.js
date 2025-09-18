import { z } from 'zod';
export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    PORT: z.coerce.number().default(3000),
    API_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('24h'),
    OPENAI_API_KEY: z.string().optional(),
    AZURE_OPENAI_API_KEY: z.string().optional(),
    AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
    SENTRY_DSN: z.string().url().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    CORS_ORIGINS: z.string().transform(str => str.split(',')).default('*'),
    ALLOWED_DOMAINS: z.string().transform(str => str.split(',')).optional(),
    ENABLE_AI: z.coerce.boolean().default(true),
    ENABLE_METRICS: z.coerce.boolean().default(true),
    ENABLE_TRACING: z.coerce.boolean().default(false)
});
export function loadEnvConfig() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
        }
        throw error;
    }
}
//# sourceMappingURL=env.js.map