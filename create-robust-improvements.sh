#!/bin/bash

echo "🚀 CREANDO 10 MEJORAS ROBUSTAS PARA ECONEURA..."

# Crear directorio de mejoras
mkdir -p apps/api/src/lib/improvements

# 1. Graceful Shutdown Service
echo "🔄 Creando Graceful Shutdown Service..."
cat > apps/api/src/lib/graceful-shutdown.service.ts << 'GRACEFUL_EOF'
import { EventEmitter } from 'events';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface ShutdownConfig {
  timeout: number;
  signals: string[];
  cleanupTasks: Array<() => Promise<void>>;
}

export class GracefulShutdownService extends EventEmitter {
  private config: ShutdownConfig;
  private isShuttingDown = false;
  private cleanupTasks: Array<() => Promise<void>> = [];

  constructor(config: ShutdownConfig) {
    super();
    this.config = config;
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    this.config.signals.forEach(signal => {
      process.on(signal, () => this.shutdown(signal));
    });
  }

  async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`🔄 Received ${signal}, starting graceful shutdown...`);
    
    try {
      // Execute cleanup tasks
      for (const task of this.cleanupTasks) {
        await Promise.race([
          task(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Cleanup timeout')), this.config.timeout)
          )
        ]);
      }
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  addCleanupTask(task: () => Promise<void>): void {
    this.cleanupTasks.push(task);
  }
}

export const gracefulShutdownService = new GracefulShutdownService({
  timeout: 30000,
  signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
  cleanupTasks: []
});
GRACEFUL_EOF

# 2. Request Tracing Service
echo "🔍 Creando Request Tracing Service..."
cat > apps/api/src/lib/request-tracing.service.ts << 'TRACING_EOF'
import { v4 as uuidv4 } from 'uuid';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  metadata: Record<string, any>;
}

export class RequestTracingService {
  private traces: Map<string, TraceContext> = new Map();

  createTrace(operation: string, metadata: Record<string, any> = {}): TraceContext {
    const traceId = uuidv4();
    const spanId = uuidv4();
    
    const trace: TraceContext = {
      traceId,
      spanId,
      operation,
      startTime: Date.now(),
      metadata
    };

    this.traces.set(traceId, trace);
    return trace;
  }

  createSpan(traceId: string, operation: string, metadata: Record<string, any> = {}): TraceContext {
    const parentTrace = this.traces.get(traceId);
    if (!parentTrace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    const spanId = uuidv4();
    const span: TraceContext = {
      traceId,
      spanId,
      parentSpanId: parentTrace.spanId,
      operation,
      startTime: Date.now(),
      metadata
    };

    return span;
  }

  finishTrace(traceId: string, metadata: Record<string, any> = {}): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const duration = Date.now() - trace.startTime;
    
    // Update metrics
    prometheus.register.getSingleMetric('request_duration_seconds')?.observe({
      operation: trace.operation
    }, duration / 1000);

    this.traces.delete(traceId);
  }
}

export const requestTracingService = new RequestTracingService();
TRACING_EOF

# 3. Configuration Validation Service
echo "⚙️ Creando Configuration Validation Service..."
cat > apps/api/src/lib/config-validation.service.ts << 'CONFIG_EOF'
import { z } from 'zod';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface ConfigSchema {
  [key: string]: z.ZodTypeAny;
}

export class ConfigValidationService {
  private schemas: Map<string, ConfigSchema> = new Map();

  registerSchema(name: string, schema: ConfigSchema): void {
    this.schemas.set(name, schema);
  }

  validateConfig(name: string, config: any): { success: boolean; data?: any; errors?: string[] } {
    const schema = this.schemas.get(name);
    if (!schema) {
      return { success: false, errors: [`Schema ${name} not found`] };
    }

    try {
      const result = z.object(schema).parse(config);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  validateEnvironment(): { success: boolean; errors?: string[] } {
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'JWT_SECRET'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      return { 
        success: false, 
        errors: [`Missing required environment variables: ${missing.join(', ')}`]
      };
    }

    return { success: true };
  }
}

export const configValidationService = new ConfigValidationService();
CONFIG_EOF

echo "✅ MEJORAS ROBUSTAS CREADAS!"
