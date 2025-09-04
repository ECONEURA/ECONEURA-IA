import { z } from 'zod';

// JWT Payload Schema
export const jwtPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  organizationId: z.string().uuid(),
  role: z.enum(['admin', 'user', 'viewer']),
  permissions: z.array(z.string()),
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

// Auth Request Schema
export const authRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthRequest = z.infer<typeof authRequestSchema>;

// Auth Response Schema
export const authResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['admin', 'user', 'viewer']),
    organizationId: z.string().uuid(),
  }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
