import { apiLogger } from '@econeura/shared/logging/enhanced';

import { env, serverConfig } from './config/env.js';
export async function bootstrapApiService() {
    const startTime = Date.now();
    try {
        apiLogger.logStartup('Starting API service', {
            phase: 'initialization',
            config: {
                port: serverConfig.port,
                environment: env.NODE_ENV,
                database: env.DATABASE_URL ? 'configured' : 'missing',
                redis: env.REDIS_URL ? 'configured' : 'missing',
            }
        });
        apiLogger.logEnvValidation('Environment variables validated', {
            status: 'success',
            warnings: env.NODE_ENV === 'development' ? ['Running in development mode'] : []
        });
        apiLogger.logStartup('Connecting to database', { phase: 'database' });
        apiLogger.logDatabaseConnection('Database connected', {
            status: 'connected',
            latency_ms: 50
        });
        apiLogger.logStartup('Connecting to Redis', { phase: 'redis' });
        apiLogger.logRedisConnection('Redis connected', {
            status: 'connected',
            latency_ms: 25
        });
        apiLogger.logStartup('Setting up middleware and routes', { phase: 'middleware' });
        apiLogger.logStartup('Starting HTTP server', { phase: 'server' });
        const totalStartupTime = Date.now() - startTime;
        apiLogger.logStartup('API service started successfully', {
            phase: 'complete',
            duration_ms: totalStartupTime,
            config: {
                port: serverConfig.port,
                host: serverConfig.host,
                environment: env.NODE_ENV,
            }
        });
        setupGracefulShutdown();
        return { success: true, port: serverConfig.port };
    }
    catch (error) {
        const failureTime = Date.now() - startTime;
        apiLogger.error('API service startup failed', error, {
            startup_phase: 'error',
            duration_ms: failureTime,
        });
        process.exit(1);
    }
}
function setupGracefulShutdown() {
    const shutdownHandler = async (signal) => {
        const shutdownStart = Date.now();
        apiLogger.logShutdown('Received shutdown signal', { reason: signal });
        try {
            apiLogger.info('Closing database connections');
            apiLogger.info('Closing Redis connections');
            apiLogger.info('Stopping HTTP server');
            const shutdownTime = Date.now() - shutdownStart;
            apiLogger.logShutdown('Graceful shutdown completed', {
                reason: signal,
                duration_ms: shutdownTime,
            });
            process.exit(0);
        }
        catch (error) {
            apiLogger.error('Error during shutdown', error);
            process.exit(1);
        }
    };
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('uncaughtException', (error) => {
        apiLogger.error('Uncaught exception', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        apiLogger.error('Unhandled rejection', reason, {
            promise: promise.toString()
        });
        process.exit(1);
    });
}
//# sourceMappingURL=bootstrap.example.js.map