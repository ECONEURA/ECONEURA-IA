import { z } from 'zod';
import { metrics } from '@econeura/shared/src/metrics/index.js';

import { structuredLogger } from './structured-logger.js';
export class ValidationManagerService {
    static instance;
    schemas = new Map();
    configs = new Map();
    customValidators = new Map();
    constructor() {
        this.initializeDefaultSchemas();
        this.initializeDefaultConfigs();
        this.initializeCustomValidators();
    }
    static getInstance() {
        if (!ValidationManagerService.instance) {
            ValidationManagerService.instance = new ValidationManagerService();
        }
        return ValidationManagerService.instance;
    }
    initializeDefaultSchemas() {
        this.schemas.set('user', z.object({
            id: z.string().uuid().optional(),
            email: z.string().email().transform(val => val.toLowerCase().trim()),
            name: z.string().min(2).max(100).transform(val => this.sanitizeString(val)),
            phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
            age: z.number().int().min(18).max(120).optional(),
            role: z.enum(['admin', 'user', 'manager']).default('user'),
            preferences: z.object({
                notifications: z.boolean().default(true),
                language: z.string().length(2).default('es'),
                timezone: z.string().default('Europe/Madrid')
            }).optional(),
            metadata: z.record(z.any()).optional()
        }));
        this.schemas.set('company', z.object({
            id: z.string().uuid().optional(),
            name: z.string().min(2).max(200).transform(val => this.sanitizeString(val)),
            taxId: z.string().regex(/^[A-Z0-9]{9,15}$/),
            email: z.string().email().transform(val => val.toLowerCase().trim()),
            phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
            address: z.object({
                street: z.string().min(5).max(200),
                city: z.string().min(2).max(100),
                postalCode: z.string().regex(/^\d{5}$/),
                country: z.string().length(2).default('ES')
            }),
            industry: z.string().min(2).max(100).optional(),
            size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
            website: z.string().url().optional(),
            metadata: z.record(z.any()).optional()
        }));
        this.schemas.set('transaction', z.object({
            id: z.string().uuid().optional(),
            amount: z.number().positive().transform(val => Math.round(val * 100) / 100),
            currency: z.string().length(3).default('EUR'),
            type: z.enum(['income', 'expense', 'transfer']),
            category: z.string().min(2).max(50),
            description: z.string().max(500).transform(val => this.sanitizeString(val)),
            date: z.string().datetime().transform(val => new Date(val)),
            tags: z.array(z.string()).optional(),
            metadata: z.record(z.any()).optional()
        }));
        this.schemas.set('contact', z.object({
            id: z.string().uuid().optional(),
            firstName: z.string().min(1).max(100).transform(val => this.sanitizeString(val)),
            lastName: z.string().min(1).max(100).transform(val => this.sanitizeString(val)),
            email: z.string().email().transform(val => val.toLowerCase().trim()),
            phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
            company: z.string().min(2).max(200).optional(),
            position: z.string().min(2).max(100).optional(),
            source: z.enum(['website', 'referral', 'cold_call', 'event', 'other']).optional(),
            status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'closed']).default('new'),
            notes: z.string().max(1000).optional(),
            metadata: z.record(z.any()).optional()
        }));
        this.schemas.set('product', z.object({
            id: z.string().uuid().optional(),
            name: z.string().min(2).max(200).transform(val => this.sanitizeString(val)),
            description: z.string().max(1000).optional(),
            price: z.number().positive().transform(val => Math.round(val * 100) / 100),
            currency: z.string().length(3).default('EUR'),
            category: z.string().min(2).max(50),
            sku: z.string().min(3).max(50).transform(val => val.toUpperCase()),
            stock: z.number().int().min(0).default(0),
            active: z.boolean().default(true),
            tags: z.array(z.string()).optional(),
            metadata: z.record(z.any()).optional()
        }));
    }
    initializeDefaultConfigs() {
        this.configs.set('user', {
            strict: true,
            sanitize: true,
            transform: true,
            customValidators: {
                emailDomain: (email) => !email.includes('tempmail') && !email.includes('10minutemail'),
                nameFormat: (name) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)
            },
            errorMessages: {
                email: 'Email inválido o no permitido',
                name: 'Nombre debe contener solo letras y espacios',
                phone: 'Formato de teléfono inválido'
            }
        });
        this.configs.set('company', {
            strict: true,
            sanitize: true,
            transform: true,
            customValidators: {
                taxIdFormat: (taxId) => this.validateTaxId(taxId),
                websiteAccessible: (url) => this.validateWebsite(url)
            },
            errorMessages: {
                taxId: 'NIF/CIF inválido',
                website: 'Sitio web no accesible'
            }
        });
        this.configs.set('transaction', {
            strict: true,
            sanitize: true,
            transform: true,
            customValidators: {
                amountRange: (amount) => amount >= 0.01 && amount <= 1000000,
                futureDate: (date) => date <= new Date()
            },
            errorMessages: {
                amount: 'Cantidad debe estar entre 0.01 y 1,000,000',
                date: 'Fecha no puede ser futura'
            }
        });
    }
    initializeCustomValidators() {
        this.customValidators.set('spanishPhone', (phone) => {
            return /^(\+34|0034|34)?[6-9]\d{8}$/.test(phone.replace(/\s/g, ''));
        });
        this.customValidators.set('spanishPostalCode', (code) => {
            return /^\d{5}$/.test(code);
        });
        this.customValidators.set('spanishTaxId', (taxId) => {
            return this.validateTaxId(taxId);
        });
        this.customValidators.set('strongPassword', (password) => {
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
        });
    }
    async validate(schemaName, data, options = {}) {
        const startTime = Date.now();
        const schema = this.schemas.get(schemaName);
        const config = { ...this.configs.get(schemaName), ...options };
        if (!schema) {
            throw new Error(`Schema '${schemaName}' not found`);
        }
        const result = {
            success: false,
            errors: [],
            warnings: [],
            sanitized: false,
            transformed: false
        };
        try {
            if (config.sanitize) {
                data = this.sanitizeData(data);
                result.sanitized = true;
            }
            const zodResult = schema.safeParse(data);
            if (!zodResult.success) {
                result.errors = zodResult.error.errors.map(err => ({
                    field: err.path.join('.'),
                    code: err.code,
                    message: this.getErrorMessage(err.code, err.path.join('.'), config.errorMessages),
                    value: err.input,
                    path: err.path.map(String)
                }));
            }
            else {
                result.data = zodResult.data;
                result.transformed = true;
            }
            if (result.data && config.customValidators) {
                const customErrors = await this.runCustomValidators(result.data, config.customValidators);
                result.errors.push(...customErrors);
            }
            result.warnings = this.generateWarnings(result.data, schemaName);
            result.success = result.errors.length === 0;
            this.recordValidationMetrics(schemaName, result.success, Date.now() - startTime);
            structuredLogger.debug('Validation completed', {
                schema: schemaName,
                success: result.success,
                errors: result.errors.length,
                warnings: result.warnings.length,
                duration: Date.now() - startTime
            });
            return result;
        }
        catch (error) {
            structuredLogger.error('Validation error', {
                schema: schemaName,
                error: error instanceof Error ? error.message : String(error)
            });
            result.errors.push({
                field: 'system',
                code: 'VALIDATION_ERROR',
                message: 'Error interno de validación',
                value: data,
                path: []
            });
            return result;
        }
    }
    async validateFields(schemaName, fields) {
        const results = {};
        const schema = this.schemas.get(schemaName);
        if (!schema) {
            throw new Error(`Schema '${schemaName}' not found`);
        }
        for (const [fieldName, value] of Object.entries(fields)) {
            try {
                const fieldSchema = schema.shape[fieldName];
                if (fieldSchema) {
                    const result = fieldSchema.safeParse(value);
                    results[fieldName] = {
                        success: result.success,
                        data: result.success ? result.data : undefined,
                        errors: result.success ? [] : [{
                                field: fieldName,
                                code: result.error.errors[0]?.code || 'INVALID',
                                message: result.error.errors[0]?.message || 'Invalid value',
                                value,
                                path: [fieldName]
                            }],
                        warnings: [],
                        sanitized: false,
                        transformed: result.success
                    };
                }
            }
            catch (error) {
                results[fieldName] = {
                    success: false,
                    errors: [{
                            field: fieldName,
                            code: 'VALIDATION_ERROR',
                            message: 'Error de validación',
                            value,
                            path: [fieldName]
                        }],
                    warnings: [],
                    sanitized: false,
                    transformed: false
                };
            }
        }
        return results;
    }
    sanitizeData(data) {
        if (typeof data === 'string') {
            return this.sanitizeString(data);
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }
        if (data && typeof data === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeData(value);
            }
            return sanitized;
        }
        return data;
    }
    sanitizeString(str) {
        return str
            .trim()
            .replace(/[<>]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s@.-]/g, '');
    }
    async runCustomValidators(data, validators) {
        const errors = [];
        for (const [validatorName, validator] of Object.entries(validators)) {
            try {
                const isValid = validator(data);
                if (!isValid) {
                    errors.push({
                        field: 'custom',
                        code: validatorName.toUpperCase(),
                        message: `Validación personalizada falló: ${validatorName}`,
                        value: data,
                        path: []
                    });
                }
            }
            catch (error) {
                errors.push({
                    field: 'custom',
                    code: 'VALIDATOR_ERROR',
                    message: `Error en validador personalizado: ${validatorName}`,
                    value: data,
                    path: []
                });
            }
        }
        return errors;
    }
    generateWarnings(data, schemaName) {
        const warnings = [];
        switch (schemaName) {
            case 'user':
                if (data?.email && data.email.includes('gmail.com')) {
                    warnings.push({
                        field: 'email',
                        message: 'Email personal detectado',
                        suggestion: 'Considera usar email corporativo'
                    });
                }
                break;
            case 'company':
                if (data?.website && !data.website.startsWith('https://')) {
                    warnings.push({
                        field: 'website',
                        message: 'Sitio web sin HTTPS',
                        suggestion: 'Implementa certificado SSL'
                    });
                }
                break;
        }
        return warnings;
    }
    getErrorMessage(code, field, errorMessages) {
        return errorMessages[code] || errorMessages[field] || `Campo ${field} inválido`;
    }
    validateTaxId(taxId) {
        const cleanTaxId = taxId.replace(/[^A-Z0-9]/g, '');
        if (cleanTaxId.length !== 9)
            return false;
        const letter = cleanTaxId[8];
        const numbers = cleanTaxId.substring(0, 8);
        if (!/^[0-9]{8}$/.test(numbers))
            return false;
        const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        const expectedLetter = letters[parseInt(numbers) % 23];
        return letter === expectedLetter;
    }
    async validateWebsite(url) {
        try {
            const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    recordValidationMetrics(schemaName, success, duration) {
        metrics.validationAttempts.inc({ schema: schemaName, success: success.toString() });
        metrics.validationDuration.observe({ schema: schemaName }, duration);
    }
    getValidationStats() {
        return {
            totalValidations: 0,
            successRate: 0,
            averageDuration: 0,
            schemas: Array.from(this.schemas.keys())
        };
    }
}
export const validationManagerService = ValidationManagerService.getInstance();
//# sourceMappingURL=validation-manager.service.js.map