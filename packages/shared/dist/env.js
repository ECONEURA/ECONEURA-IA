export const Env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    AAD_REQUIRED: process.env.AAD_REQUIRED || 'false',
    REDIS_URL: process.env.REDIS_URL || '',
    POSTGRES_URL: process.env.POSTGRES_URL || '',
    MAKE_SIGNING_SECRET: process.env.MAKE_SIGNING_SECRET || 'dev',
    USE_LOCAL_MISTRAL: process.env.USE_LOCAL_MISTRAL || 'false',
};
import { z } from 'zod';
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    PGHOST: z.string().min(1).optional().default('localhost'),
    PGUSER: z.string().min(1).optional().default('postgres'),
    PGPASSWORD: z.string().min(1).optional().default('postgres'),
    PGDATABASE: z.string().min(1).optional().default('econeura_dev'),
    PGPORT: z.string().transform(Number).pipe(z.number().positive()).optional().default('5432'),
    MISTRAL_BASE_URL: z.string().url().default('http://mistral:8080'),
    AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
    AZURE_OPENAI_API_VERSION: z.string().default('2024-02-15-preview'),
    AZURE_OPENAI_DEPLOYMENT: z.string().default('gpt-4o-mini'),
    AZURE_OPENAI_API_KEY: z.string().optional(),
    AI_MONTHLY_CAP_EUR: z.string().transform(Number).pipe(z.number().positive()).default('50'),
    USE_LOCAL_MISTRAL: z.string().optional(),
    AZURE_TENANT_ID: z.string().optional(),
    AZURE_CLIENT_ID: z.string().optional(),
    AZURE_CLIENT_SECRET: z.string().optional(),
    GRAPH_DEFAULT_TEAM_ID: z.string().optional(),
    GRAPH_DEFAULT_CHANNEL_ID: z.string().optional(),
    MAKE_WEBHOOK_HMAC_SECRET: z.string().optional(),
    MAKE_ALLOWED_IPS: z.string().optional(),
    REDIS_URL: z.string().optional(),
    BFF_TARGET_API: z.string().url().default('http://localhost:3001'),
    PORT: z.string().transform(Number).pipe(z.number().positive()).default('3001'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});
let envCache = null;
export function env() {
    if (envCache) {
        return envCache;
    }
    try {
        envCache = envSchema.parse(process.env);
        return envCache;
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.errors.map(err => err.path.join('.'));
            throw new Error(`Missing or invalid environment variables: ${missingVars.join(', ')}`);
        }
        throw error;
    }
}
export const getEnv = env;
//# sourceMappingURL=env.js.map