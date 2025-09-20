export interface ValidationConfig {
    strict: boolean;
    sanitize: boolean;
    transform: boolean;
    customValidators: Record<string, (value: any) => boolean>;
    errorMessages: Record<string, string>;
}
export interface ValidationResult<T = any> {
    success: boolean;
    data?: T;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    sanitized: boolean;
    transformed: boolean;
}
export interface ValidationError {
    field: string;
    code: string;
    message: string;
    value: any;
    path: string[];
}
export interface ValidationWarning {
    field: string;
    message: string;
    suggestion: string;
}
export declare class ValidationManagerService {
    private static instance;
    private schemas;
    private configs;
    private customValidators;
    private constructor();
    static getInstance(): ValidationManagerService;
    private initializeDefaultSchemas;
    private initializeDefaultConfigs;
    private initializeCustomValidators;
    validate<T>(schemaName: string, data: any, options?: Partial<ValidationConfig>): Promise<ValidationResult<T>>;
    validateFields(schemaName: string, fields: Record<string, any>): Promise<Record<string, ValidationResult>>;
    private sanitizeData;
    private sanitizeString;
    private runCustomValidators;
    private generateWarnings;
    private getErrorMessage;
    private validateTaxId;
    private validateWebsite;
    private recordValidationMetrics;
    getValidationStats(): Record<string, any>;
}
export declare const validationManagerService: ValidationManagerService;
//# sourceMappingURL=validation-manager.service.d.ts.map