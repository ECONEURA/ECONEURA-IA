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
