import { z } from 'zod';
export interface ConfigSchema {
    [key: string]: z.ZodTypeAny;
}
export declare class ConfigValidationService {
    private schemas;
    registerSchema(name: string, schema: ConfigSchema): void;
    validateConfig(name: string, config: any): {
        success: boolean;
        data?: any;
        errors?: string[];
    };
    validateEnvironment(): {
        success: boolean;
        errors?: string[];
    };
}
export declare const configValidationService: ConfigValidationService;
//# sourceMappingURL=config-validation.service.d.ts.map