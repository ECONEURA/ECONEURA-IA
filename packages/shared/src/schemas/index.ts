import { z } from 'zod';

// Re-exportar todos los schemas por dominio
export * from './base';
export * from './ai';
export * from './crm';
export * from './flows';
export * from './integrations';
export * from './org';

// Validadores de alto nivel
export const validateRequest = <T extends z.ZodType>(schema: T, data: unknown): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.issues));
  }
  return result.data;
};

// Funciones helper para validación
export const validateId = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^\+?[\d\s-()]{8,20}$/.test(phone);
};

// Constantes de validación
export const VALIDATION_CONSTANTS = {
  MAX_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_MESSAGE_LENGTH: 4000,
  MAX_METADATA_SIZE: 10000, // bytes
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
