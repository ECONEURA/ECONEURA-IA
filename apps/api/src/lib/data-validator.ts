import { prometheus } from '../middleware/observability.js';

import { logger } from './logger.js';

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
  strict?: boolean; // If true, reject unknown fields
  sanitize?: boolean; // If true, sanitize input data
}

export interface ValidationStats {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  averageValidationTime: number;
  mostCommonErrors: Array<{ field: string; count: number }>;
}

export class DataValidator {
  private schemas: Map<string, ValidationSchema> = new Map();
  private stats: ValidationStats;
  private validationHistory: Array<{ timestamp: number; success: boolean; duration: number; errors: ValidationError[] }> = [];

  constructor() {
    this.stats = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      mostCommonErrors: []
    };

    logger.info('Data Validator initialized', {
      features: [
        'schema_validation',
        'custom_validators',
        'data_transformation',
        'sanitization',
        'statistics',
        'prometheus_metrics'
      ]
    });
  }

  /**
   * Register a validation schema
   */
  registerSchema(schema: ValidationSchema): void {
    this.schemas.set(schema.name, schema);
    
    logger.info('Validation schema registered', {
      name: schema.name,
      rulesCount: schema.rules.length,
      strict: schema.strict,
      sanitize: schema.sanitize
    });
  }

  /**
   * Unregister a validation schema
   */
  unregisterSchema(name: string): void {
    const schema = this.schemas.get(name);
    if (schema) {
      this.schemas.delete(name);
      logger.info('Validation schema unregistered', { name });
    }
  }

  /**
   * Validate data against a schema
   */
  async validate(schemaName: string, data: any): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const schema = this.schemas.get(schemaName);
      if (!schema) {
        throw new Error(`Validation schema '${schemaName}' not found`);
      }

      const errors: ValidationError[] = [];
      let validatedData = { ...data };

      // Check for unknown fields if strict mode is enabled
      if (schema.strict) {
        const knownFields = new Set(schema.rules.map(rule => rule.field));
        const unknownFields = Object.keys(data).filter(field => !knownFields.has(field));
        
        if (unknownFields.length > 0) {
          errors.push({
            field: 'unknown_fields',
            message: `Unknown fields: ${unknownFields.join(', ')}`,
            value: unknownFields
          });
        }
      }

      // Validate each field
      for (const rule of schema.rules) {
        const fieldValue = data[rule.field];
        const fieldErrors = await this.validateField(rule, fieldValue, data);
        errors.push(...fieldErrors);

        // Transform value if validation passed and transform is defined
        if (fieldErrors.length === 0 && rule.transform) {
          validatedData[rule.field] = rule.transform(fieldValue);
        }
      }

      // Sanitize data if enabled
      if (schema.sanitize) {
        validatedData = this.sanitizeData(validatedData);
      }

      const isValid = errors.length === 0;
      const duration = Date.now() - startTime;

      // Update statistics
      this.updateStats(isValid, duration, errors);
      this.recordValidation(schemaName, isValid, duration, errors);

      // Record metrics
      this.recordMetrics(schemaName, isValid, duration);

      logger.debug('Data validation completed', {
        schemaName,
        isValid,
        errorsCount: errors.length,
        duration
      });

      return {
        valid: isValid,
        errors,
        data: isValid ? validatedData : undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Data validation failed', {
        schemaName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      this.updateStats(false, duration, []);
      this.recordMetrics(schemaName, false, duration);

      return {
        valid: false,
        errors: [{
          field: 'validation_error',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        }]
      };
    }
  }

  /**
   * Validate a single field
   */
  private async validateField(rule: ValidationRule, value: any, allData: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check if field is required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} is required`,
        value,
        rule: 'required'
      });
      return errors; // No need to check other rules if field is missing
    }

    // Skip validation if field is not required and value is empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    const typeError = this.validateType(rule, value);
    if (typeError) {
      errors.push(typeError);
      return errors; // No need to check other rules if type is wrong
    }

    // Length validation for strings
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} must be at least ${rule.minLength} characters long`,
          value,
          rule: 'minLength'
        });
      }
      
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} must be no more than ${rule.maxLength} characters long`,
          value,
          rule: 'maxLength'
        });
      }
    }

    // Numeric validation
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} must be at least ${rule.min}`,
          value,
          rule: 'min'
        });
      }
      
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} must be no more than ${rule.max}`,
          value,
          rule: 'max'
        });
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} format is invalid`,
        value,
        rule: 'pattern'
      });
    }

    // Custom validation
    if (rule.customValidator) {
      try {
        const result = rule.customValidator(value);
        if (result !== true) {
          errors.push({
            field: rule.field,
            message: typeof result === 'string' ? result : rule.message || `${rule.field} validation failed`,
            value,
            rule: 'custom'
          });
        }
      } catch (error) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} custom validation failed`,
          value,
          rule: 'custom'
        });
      }
    }

    return errors;
  }

  /**
   * Validate data type
   */
  private validateType(rule: ValidationRule, value: any): ValidationError | null {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be a string`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be a number`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be a boolean`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be an array`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be an object`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be a valid email address`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be a valid URL`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUuid(value)) {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be a valid UUID`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'date':
        if (!this.isValidDate(value)) {
          return {
            field: rule.field,
            message: rule.message || `${rule.field} must be a valid date`,
            value,
            rule: 'type'
          };
        }
        break;

      case 'custom':
        // Custom type validation is handled by customValidator
        break;
    }

    return null;
  }

  /**
   * Check if value is a valid email
   */
  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Check if value is a valid URL
   */
  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if value is a valid UUID
   */
  private isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Check if value is a valid date
   */
  private isValidDate(value: any): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    
    return false;
  }

  /**
   * Sanitize input data
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/[<>]/g, '');
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Update validation statistics
   */
  private updateStats(success: boolean, duration: number, errors: ValidationError[]): void {
    this.stats.totalValidations++;
    
    if (success) {
      this.stats.successfulValidations++;
    } else {
      this.stats.failedValidations++;
    }

    // Update average validation time
    const totalTime = this.stats.averageValidationTime * (this.stats.totalValidations - 1) + duration;
    this.stats.averageValidationTime = totalTime / this.stats.totalValidations;

    // Update most common errors
    errors.forEach(error => {
      const existing = this.stats.mostCommonErrors.find(e => e.field === error.field);
      if (existing) {
        existing.count++;
      } else {
        this.stats.mostCommonErrors.push({ field: error.field, count: 1 });
      }
    });

    // Sort by count and keep top 10
    this.stats.mostCommonErrors.sort((a, b) => b.count - a.count);
    this.stats.mostCommonErrors = this.stats.mostCommonErrors.slice(0, 10);
  }

  /**
   * Record validation for history
   */
  private recordValidation(schemaName: string, success: boolean, duration: number, errors: ValidationError[]): void {
    this.validationHistory.push({
      timestamp: Date.now(),
      success,
      duration,
      errors
    });

    // Keep only last 1000 validations
    if (this.validationHistory.length > 1000) {
      this.validationHistory = this.validationHistory.slice(-1000);
    }
  }

  /**
   * Record metrics
   */
  private recordMetrics(schemaName: string, success: boolean, duration: number): void {
    if (success) {
      prometheus.validationSuccess.inc({ schema: schemaName });
    } else {
      prometheus.validationFailure.inc({ schema: schemaName });
    }
    
    prometheus.validationDuration.observe({ schema: schemaName }, duration / 1000);
    prometheus.validationTotal.inc({ schema: schemaName });
  }

  /**
   * Get validation statistics
   */
  getStats(): ValidationStats {
    return { ...this.stats };
  }

  /**
   * Get schema by name
   */
  getSchema(name: string): ValidationSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * Get all schemas
   */
  getAllSchemas(): ValidationSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get validation history
   */
  getValidationHistory(limit: number = 100): Array<{ timestamp: number; success: boolean; duration: number; errors: ValidationError[] }> {
    return this.validationHistory.slice(-limit);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.schemas.clear();
    this.validationHistory = [];

    logger.info('Data Validator destroyed');
  }
}

// Export Prometheus metrics
export const validationMetrics = {
  validationTotal: new prometheus.Counter({
    name: 'econeura_validation_total',
    help: 'Total number of validations',
    labelNames: ['schema']
  }),
  validationSuccess: new prometheus.Counter({
    name: 'econeura_validation_success_total',
    help: 'Total number of successful validations',
    labelNames: ['schema']
  }),
  validationFailure: new prometheus.Counter({
    name: 'econeura_validation_failure_total',
    help: 'Total number of failed validations',
    labelNames: ['schema']
  }),
  validationDuration: new prometheus.Histogram({
    name: 'econeura_validation_duration_seconds',
    help: 'Validation duration in seconds',
    labelNames: ['schema'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  })
};

// Export singleton instance
export const dataValidator = new DataValidator();
