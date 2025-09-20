import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    PORT: z.coerce.number().min(1).max(65535).default(3001),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().min(1, 'Database URL is required'),
    PRISMA_LOG_LEVEL: z.enum(['info', 'query', 'warn', 'error']).default('warn'),
    REDIS_URL: z.string().min(1, 'Redis URL is required'),
    REDIS_PASSWORD: z.string().optional(),
    JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().default('24h'),
    BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
    EMAIL_SMTP_URL: z.string().url().optional(),
    EMAIL_FROM: z.string().email().optional(),
    OPENAI_API_KEY: z.string().optional(),
    AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
    AZURE_OPENAI_API_KEY: z.string().optional(),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    SENTRY_DSN: z.string().url().optional(),
    PROMETHEUS_ENABLED: z.coerce.boolean().default(true),
    METRICS_PORT: z.coerce.number().min(1).max(65535).default(9090),
    ENABLE_API_DOCS: z.coerce.boolean().default(true),
    ENABLE_RATE_LIMITING: z.coerce.boolean().default(true),
    ENABLE_CORS: z.coerce.boolean().default(true),
    REQUEST_TIMEOUT: z.coerce.number().min(1000).default(30000),
    MAX_REQUEST_SIZE: z.string().default('10mb'),
    SKIP_AUTH: z.coerce.boolean().default(false),
    CHAOS_ENABLED: z.coerce.boolean().default(false),
    DEFAULT_ORG_ID: z.string().optional(),
    ENABLE_MULTI_TENANT: z.coerce.boolean().default(true),
});
function validateEnv() {
    try {
        const parsed = envSchema.parse(process.env);
        if (parsed.NODE_ENV === 'production') {
            if (!parsed.JWT_SECRET || parsed.JWT_SECRET.length < 64) {
                throw new Error('Production requires JWT_SECRET with at least 64 characters');
            }
            if (!parsed.DATABASE_URL.includes('ssl=true') && !parsed.DATABASE_URL.includes('sslmode=require')) {
                console.warn('⚠️  Production database connection should use SSL');
            }
            if (parsed.SKIP_AUTH) {
                throw new Error('SKIP_AUTH cannot be true in production');
            }
        }
        return parsed;
    }
    catch (error) {
        console.error('❌ Environment validation failed:');
        if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        }
        else {
            console.error(`  - ${error.message}`);
        }
        console.error('\n💡 Check your .env file and ensure all required variables are set.');
        process.exit(1);
    }
}
export const env = validateEnv();
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';
export const dbConfig = {
    url: env.DATABASE_URL,
    logLevel: env.PRISMA_LOG_LEVEL,
};
export const redisConfig = {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
};
export const jwtConfig = {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
};
export const serverConfig = {
    port: env.PORT,
    host: env.HOST,
    timeout: env.REQUEST_TIMEOUT,
    maxRequestSize: env.MAX_REQUEST_SIZE,
};
//# sourceMappingURL=env.js.map