/**
 * Bootstrap Example - Integrating Enhanced Logging and Environment Validation
 * 
 * This file demonstrates how to integrate the new logging and environment validation
 * into the API service startup process. 
 * 
 * TO INTEGRATE: Import and use these patterns in your main index.ts or server startup file
 */

import { apiLogger } from '@econeura/shared/logging/enhanced';

import { env, serverConfig } from './config/env.js';

/**
 * Example startup sequence with structured logging
 */
export async function bootstrapApiService() {
  const startTime = Date.now();
  
  try {
    // 1. Log startup initiation
    apiLogger.logStartup('Starting API service', {
      phase: 'initialization',
      config: {
        port: serverConfig.port,
        environment: env.NODE_ENV,
        database: env.DATABASE_URL ? 'configured' : 'missing',
        redis: env.REDIS_URL ? 'configured' : 'missing',
      }
    });

    // 2. Environment validation (already done in env.ts, but log the result)
    apiLogger.logEnvValidation('Environment variables validated', {
      status: 'success',
      warnings: env.NODE_ENV === 'development' ? ['Running in development mode'] : []
    });

    // 3. Database connection example
    apiLogger.logStartup('Connecting to database', { phase: 'database' });
    // Your database connection code here...
    // await connectToDatabase(dbConfig.url);
    apiLogger.logDatabaseConnection('Database connected', { 
      status: 'connected',
      latency_ms: 50 // Example latency
    });

    // 4. Redis connection example  
    apiLogger.logStartup('Connecting to Redis', { phase: 'redis' });
    // Your Redis connection code here...
    // await connectToRedis(redisConfig.url);
    apiLogger.logRedisConnection('Redis connected', {
      status: 'connected', 
      latency_ms: 25 // Example latency
    });

    // 5. Initialize middleware and routes
    apiLogger.logStartup('Setting up middleware and routes', { phase: 'middleware' });
    // Your middleware setup here...

    // 6. Start server
    apiLogger.logStartup('Starting HTTP server', { phase: 'server' });
    // Your server startup code here...
    // const server = app.listen(serverConfig.port, serverConfig.host);

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

    // Setup graceful shutdown
    setupGracefulShutdown();

    return { success: true, port: serverConfig.port };

  } catch (error) {
    const failureTime = Date.now() - startTime;
    apiLogger.error('API service startup failed', error as Error, {
      startup_phase: 'error',
      duration_ms: failureTime,
    });
    
    // Exit with non-zero code as required by the specification
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handling
 */
function setupGracefulShutdown() {
  const shutdownHandler = async (signal: string) => {
    const shutdownStart = Date.now();
    
    apiLogger.logShutdown('Received shutdown signal', { reason: signal });
    
    try {
      // Close database connections
      apiLogger.info('Closing database connections');
      // await closeDatabaseConnections();
      
      // Close Redis connections  
      apiLogger.info('Closing Redis connections');
      // await closeRedisConnections();
      
      // Stop accepting new requests
      apiLogger.info('Stopping HTTP server');
      // server.close();

      const shutdownTime = Date.now() - shutdownStart;
      apiLogger.logShutdown('Graceful shutdown completed', {
        reason: signal,
        duration_ms: shutdownTime,
      });
      
      process.exit(0);
    } catch (error) {
      apiLogger.error('Error during shutdown', error as Error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    apiLogger.error('Uncaught exception', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    apiLogger.error('Unhandled rejection', reason as Error, {
      promise: promise.toString()
    });
    process.exit(1);
  });
}

/**
 * Example usage in your main index.ts:
 * 
 * import { bootstrapApiService } from './bootstrap.example.js';
 * 
 * bootstrapApiService().catch((error) => {
 *   console.error('Failed to start API service:', error);
 *   process.exit(1);
 * });
 */
