import dotenv from 'dotenv';
dotenv.config();
export const config = {
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/econeura',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key',
    COMPRESSION_LEVEL: parseInt(process.env.COMPRESSION_LEVEL || '6'),
    CACHE_TTL: parseInt(process.env.CACHE_TTL || '300'),
    ENABLE_METRICS: process.env.ENABLE_METRICS !== 'false',
    ENABLE_COMPRESSION: process.env.ENABLE_COMPRESSION !== 'false',
    ENABLE_CACHE: process.env.ENABLE_CACHE !== 'false',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test'
};
//# sourceMappingURL=environment.js.map