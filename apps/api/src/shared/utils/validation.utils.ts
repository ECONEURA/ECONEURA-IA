import { z } from 'zod';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

// ========================================================================
// COMMON VALIDATION SCHEMAS
// ========================================================================

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const EmailSchema = z.string().email('Invalid email format');

export const PhoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format');

export const WebsiteSchema = z.string().url('Invalid website URL');

export const CurrencySchema = z.string().length(3, 'Currency must be a 3-letter code');

export const LanguageSchema = z.string().length(2, 'Language must be a 2-letter code');

export const CountryCodeSchema = z.string().length(2, 'Country code must be 2 characters');

export const NameSchema = z.string()
  .min(1, 'Name is required')
  .max(200, 'Name cannot exceed 200 characters');

export const DescriptionSchema = z.string()
  .max(1000, 'Description cannot exceed 1000 characters')
  .optional();

export const NotesSchema = z.string()
  .max(5000, 'Notes cannot exceed 5000 characters')
  .optional();

export const TagsSchema = z.array(z.string()).optional();

export const CustomFieldsSchema = z.record(z.any()).optional();

// ========================================================================
// ADDRESS VALIDATION
// ========================================================================

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  countryCode: CountryCodeSchema
});

// ========================================================================
// MONEY VALIDATION
// ========================================================================

export const MoneySchema = z.object({
  amount: z.number().min(0, 'Amount cannot be negative'),
  currency: CurrencySchema
});

// ========================================================================
// PAGINATION VALIDATION
// ========================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20)
});

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ========================================================================
// DATE VALIDATION
// ========================================================================

export const DateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export const DateSchema = z.coerce.date();

// ========================================================================
// SOCIAL MEDIA VALIDATION
// ========================================================================

export const SocialMediaSchema = z.object({
  linkedin: z.string().url('Invalid LinkedIn URL').optional(),
  twitter: z.string().url('Invalid Twitter URL').optional(),
  facebook: z.string().url('Invalid Facebook URL').optional(),
  instagram: z.string().url('Invalid Instagram URL').optional(),
  youtube: z.string().url('Invalid YouTube URL').optional(),
  tiktok: z.string().url('Invalid TikTok URL').optional(),
  other: z.record(z.string()).optional()
});

// ========================================================================
// NOTIFICATION PREFERENCES VALIDATION
// ========================================================================

export const NotificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  phone: z.boolean().optional()
});

// ========================================================================
// USER PREFERENCES VALIDATION
// ========================================================================

export const UserPreferencesSchema = z.object({
  language: LanguageSchema.optional(),
  timezone: z.string().optional(),
  currency: CurrencySchema.optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional()
});

// ========================================================================
// VALIDATION FUNCTIONS
// ========================================================================

export const validateUUID = (value: string): boolean => {
  return UUIDSchema.safeParse(value).success;
};

export const validateEmail = (value: string): boolean => {
  return EmailSchema.safeParse(value).success;
};

export const validatePhone = (value: string): boolean => {
  return PhoneSchema.safeParse(value).success;
};

export const validateWebsite = (value: string): boolean => {
  return WebsiteSchema.safeParse(value).success;
};

export const validateCurrency = (value: string): boolean => {
  return CurrencySchema.safeParse(value).success;
};

export const validateLanguage = (value: string): boolean => {
  return LanguageSchema.safeParse(value).success;
};

export const validateCountryCode = (value: string): boolean => {
  return CountryCodeSchema.safeParse(value).success;
};

export const validateName = (value: string): boolean => {
  return NameSchema.safeParse(value).success;
};

export const validateDescription = (value: string): boolean => {
  return DescriptionSchema.safeParse(value).success;
};

export const validateNotes = (value: string): boolean => {
  return NotesSchema.safeParse(value).success;
};

export const validateTags = (value: string[]): boolean => {
  return TagsSchema.safeParse(value).success;
};

export const validateCustomFields = (value: Record<string, any>): boolean => {
  return CustomFieldsSchema.safeParse(value).success;
};

export const validateAddress = (value: any): boolean => {
  return AddressSchema.safeParse(value).success;
};

export const validateMoney = (value: any): boolean => {
  return MoneySchema.safeParse(value).success;
};

export const validatePagination = (value: any): boolean => {
  return PaginationSchema.safeParse(value).success;
};

export const validateSort = (value: any): boolean => {
  return SortSchema.safeParse(value).success;
};

export const validateDateRange = (value: any): boolean => {
  return DateRangeSchema.safeParse(value).success;
};

export const validateDate = (value: any): boolean => {
  return DateSchema.safeParse(value).success;
};

export const validateSocialMedia = (value: any): boolean => {
  return SocialMediaSchema.safeParse(value).success;
};

export const validateNotificationPreferences = (value: any): boolean => {
  return NotificationPreferencesSchema.safeParse(value).success;
};

export const validateUserPreferences = (value: any): boolean => {
  return UserPreferencesSchema.safeParse(value).success;
};

// ========================================================================
// VALIDATION ERROR UTILITIES
// ========================================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const createValidationError = (field: string, message: string, value?: any): ValidationError => ({
  field,
  message,
  value
});

export const createValidationResult = (isValid: boolean, errors: ValidationError[]): ValidationResult => ({
  isValid,
  errors
});

export const validateField = (field: string, value: any, validator: (value: any) => boolean, message: string): ValidationError | null => {
  if (!validator(value)) {
    return createValidationError(field, message, value);
  }
  return null;
};

export const validateRequired = (field: string, value: any): ValidationError | null => {
  if (value === undefined || value === null || value === '') {
    return createValidationError(field, `${field} is required`);
  }
  return null;
};

export const validateMinLength = (field: string, value: string, minLength: number): ValidationError | null => {
  if (value && value.length < minLength) {
    return createValidationError(field, `${field} must be at least ${minLength} characters long`);
  }
  return null;
};

export const validateMaxLength = (field: string, value: string, maxLength: number): ValidationError | null => {
  if (value && value.length > maxLength) {
    return createValidationError(field, `${field} cannot exceed ${maxLength} characters`);
  }
  return null;
};

export const validateMin = (field: string, value: number, min: number): ValidationError | null => {
  if (value !== undefined && value < min) {
    return createValidationError(field, `${field} must be at least ${min}`);
  }
  return null;
};

export const validateMax = (field: string, value: number, max: number): ValidationError | null => {
  if (value !== undefined && value > max) {
    return createValidationError(field, `${field} cannot exceed ${max}`);
  }
  return null;
};

export const validateRange = (field: string, value: number, min: number, max: number): ValidationError | null => {
  if (value !== undefined && (value < min || value > max)) {
    return createValidationError(field, `${field} must be between ${min} and ${max}`);
  }
  return null;
};

export const validateEnum = (field: string, value: any, allowedValues: any[]): ValidationError | null => {
  if (value !== undefined && !allowedValues.includes(value)) {
    return createValidationError(field, `${field} must be one of: ${allowedValues.join(', ')}`);
  }
  return null;
};

export const validateArray = (field: string, value: any[], minLength?: number, maxLength?: number): ValidationError | null => {
  if (!Array.isArray(value)) {
    return createValidationError(field, `${field} must be an array`);
  }

  if (minLength !== undefined && value.length < minLength) {
    return createValidationError(field, `${field} must have at least ${minLength} items`);
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return createValidationError(field, `${field} cannot have more than ${maxLength} items`);
  }

  return null;
};

export const validateObject = (field: string, value: any): ValidationError | null => {
  if (value !== undefined && (typeof value !== 'object' || value === null || Array.isArray(value))) {
    return createValidationError(field, `${field} must be an object`);
  }
  return null;
};

export const validateBoolean = (field: string, value: any): ValidationError | null => {
  if (value !== undefined && typeof value !== 'boolean') {
    return createValidationError(field, `${field} must be a boolean`);
  }
  return null;
};

export const validateNumber = (field: string, value: any): ValidationError | null => {
  if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
    return createValidationError(field, `${field} must be a number`);
  }
  return null;
};

export const validateString = (field: string, value: any): ValidationError | null => {
  if (value !== undefined && typeof value !== 'string') {
    return createValidationError(field, `${field} must be a string`);
  }
  return null;
};

// ========================================================================
// BULK VALIDATION UTILITIES
// ========================================================================

export const validateBulk = (validators: (() => ValidationError | null)[]): ValidationResult => {
  const errors: ValidationError[] = [];

  for (const validator of validators) {
    const error = validator();
    if (error) {
      errors.push(error);
    }
  }

  return createValidationResult(errors.length === 0, errors);
};

export const validateFields = (fieldValidators: Record<string, (() => ValidationError | null)[]>): ValidationResult => {
  const errors: ValidationError[] = [];

  for (const [field, validators] of Object.entries(fieldValidators)) {
    for (const validator of validators) {
      const error = validator();
      if (error) {
        errors.push(error);
      }
    }
  }

  return createValidationResult(errors.length === 0, errors);
};

// ========================================================================
// CONDITIONAL VALIDATION UTILITIES
// ========================================================================

export const validateConditional = (
  condition: boolean,
  validator: () => ValidationError | null
): ValidationError | null => {
  if (condition) {
    return validator();
  }
  return null;
};

export const validateIf = (
  value: any,
  validator: (value: any) => ValidationError | null
): ValidationError | null => {
  if (value !== undefined && value !== null && value !== '') {
    return validator(value);
  }
  return null;
};

// ========================================================================
// SANITIZATION UTILITIES
// ========================================================================

export const sanitizeString = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};

export const sanitizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

export const sanitizePhone = (value: string): string => {
  return value.replace(/[\s\-\(\)]/g, '');
};

export const sanitizeWebsite = (value: string): string => {
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return `https://${value}`;
  }
  return value;
};

export const sanitizeTags = (tags: string[]): string[] => {
  return tags;
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0)
    .filter((tag, index, array) => array.indexOf(tag) === index);
};

export const sanitizeCustomFields = (fields: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    const sanitizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
};
