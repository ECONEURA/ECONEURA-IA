import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Validación de respuestas del API
 */

// Interfaz base para respuestas
export interface APIResponse<T> {
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

// Schema base para respuestas paginadas
export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) => 
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number().int().positive(),
      perPage: z.number().int().positive(),
      total: z.number().int().nonnegative()
    })
  });

// Schema base para respuestas simples
export const SingleResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: itemSchema
  });

// Función helper para validar respuestas
export function validateResponse<T>(
  response: unknown,
  schema: z.ZodType<T>
): T {
  const result = schema.safeParse(response);
  
  if (!result.success) {
    throw new ValidationError(
      'Invalid API response format',
      { errors: result.error.errors }
    );
  }
  
  return result.data;
}

// Validador de respuestas HTTP
export class ResponseValidator {
  // Validar status code
  static validateStatus(status: number, expected: number | number[]): void {
    const expectedCodes = Array.isArray(expected) ? expected : [expected];
    
    if (!expectedCodes.includes(status)) {
      throw new ValidationError(
        `Unexpected status code: ${status}`,
        { expected: expectedCodes }
      );
    }
  }

  // Validar headers requeridos
  static validateHeaders(
    headers: Headers,
    required: string[]
  ): void {
    const missing = required.filter(header => !headers.has(header));
    
    if (missing.length > 0) {
      throw new ValidationError(
        'Missing required headers',
        { missing }
      );
    }
  }

  // Validar formato de fecha
  static validateDate(value: string): Date {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      throw new ValidationError(
        'Invalid date format',
        { value }
      );
    }
    
    return date;
  }

  // Validar UUID
  static validateUUID(value: string): boolean {
    const uuidRegex = 
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      throw new ValidationError(
        'Invalid UUID format',
        { value }
      );
    }
    
    return true;
  }

  // Validar email
  static validateEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(value)) {
      throw new ValidationError(
        'Invalid email format',
        { value }
      );
    }
    
    return true;
  }

  // Validar rango numérico
  static validateNumberRange(
    value: number,
    min?: number,
    max?: number
  ): boolean {
    if (min !== undefined && value < min) {
      throw new ValidationError(
        'Value below minimum',
        { value, min }
      );
    }
    
    if (max !== undefined && value > max) {
      throw new ValidationError(
        'Value above maximum',
        { value, max }
      );
    }
    
    return true;
  }

  // Validar longitud de string
  static validateLength(
    value: string,
    min?: number,
    max?: number
  ): boolean {
    if (min !== undefined && value.length < min) {
      throw new ValidationError(
        'String too short',
        { value: value.length, min }
      );
    }
    
    if (max !== undefined && value.length > max) {
      throw new ValidationError(
        'String too long',
        { value: value.length, max }
      );
    }
    
    return true;
  }
}
