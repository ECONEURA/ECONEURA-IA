import { z } from 'zod';

// Base schemas
export const UUIDSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime();
export const EmailSchema = z.string().email();/;
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);
export const URLSchema = z.string().url();
export const CountryCodeSchema = z.string().length(2);
/
// Response schemas
export const PaginationSchema = z.object({;
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative()
});

export const ErrorResponseSchema = z.object({;
  type: z.string().url(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string(),
  traceId: z.string().optional()
});
/