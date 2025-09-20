import { z } from 'zod';
export class ConfigValidationService {
    schemas = new Map();
    registerSchema(name, schema) {
        this.schemas.set(name, schema);
    }
    validateConfig(name, config) {
        const schema = this.schemas.get(name);
        if (!schema) {
            return { success: false, errors: [`Schema ${name} not found`] };
        }
        try {
            const result = z.object(schema).parse(config);
            return { success: true, data: result };
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    success: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                };
            }
            return { success: false, errors: ['Unknown validation error'] };
        }
    }
    validateEnvironment() {
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
//# sourceMappingURL=config-validation.service.js.map