export interface ValidationRule {
    field: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'uuid' | 'date' | 'custom';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    customValidator?: (value: any) => boolean | string;
    message?: string;
    transform?: (value: any) => any;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    data?: any;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
    rule?: string;
}
export interface ValidationSchema {
    name: string;
    rules: ValidationRule[];
    strict?: boolean;
    sanitize?: boolean;
}
export interface ValidationStats {
    totalValidations: number;
    successfulValidations: number;
    failedValidations: number;
    averageValidationTime: number;
    mostCommonErrors: Array<{
        field: string;
        count: number;
    }>;
}
export declare class DataValidator {
    private schemas;
    private stats;
    private validationHistory;
    constructor();
    registerSchema(schema: ValidationSchema): void;
    unregisterSchema(name: string): void;
    validate(schemaName: string, data: any): Promise<ValidationResult>;
    private validateField;
    private validateType;
    private isValidEmail;
    private isValidUrl;
    private isValidUuid;
    private isValidDate;
    private sanitizeData;
    private updateStats;
    private recordValidation;
    private recordMetrics;
    getStats(): ValidationStats;
    getSchema(name: string): ValidationSchema | undefined;
    getAllSchemas(): ValidationSchema[];
    getValidationHistory(limit?: number): Array<{
        timestamp: number;
        success: boolean;
        duration: number;
        errors: ValidationError[];
    }>;
    destroy(): void;
}
export declare const validationMetrics: {
    validationTotal: any;
    validationSuccess: any;
    validationFailure: any;
    validationDuration: any;
};
export declare const dataValidator: DataValidator;
//# sourceMappingURL=data-validator.d.ts.map