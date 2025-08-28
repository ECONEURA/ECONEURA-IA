import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  avatarUrl: z.string().url().optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).default('pending'),
  emailVerified: z.boolean().default(false),
  emailVerifiedAt: z.string().datetime().optional(),
  lastLoginAt: z.string().datetime().optional(),
  passwordChangedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

// Organization schemas
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  timezone: z.string().default('Europe/Madrid'),
  locale: z.enum(['es-ES', 'en-US']).default('es-ES'),
  currency: z.string().length(3).default('EUR'),
  
  // Billing info
  taxId: z.string().max(50).optional(),
  billingEmail: z.string().email().optional(),
  billingAddress: z.object({
    line1: z.string().max(200),
    line2: z.string().max(200).optional(),
    city: z.string().max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20),
    country: z.string().max(100),
  }).optional(),
  
  // Subscription info
  plan: z.enum(['trial', 'starter', 'professional', 'enterprise']).default('trial'),
  planExpiresAt: z.string().datetime().optional(),
  maxUsers: z.number().int().min(1).default(5),
  maxStorage: z.number().int().min(0).default(10737418240), // 10GB in bytes
  
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

// UserOrganization schemas (many-to-many relationship)
export const UserOrganizationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  roleId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
  joinedAt: z.string().datetime(),
  leftAt: z.string().datetime().nullable().optional(),
  status: z.enum(['active', 'inactive', 'invited']).default('active'),
  invitedByUserId: z.string().uuid().optional(),
  invitedAt: z.string().datetime().optional(),
  inviteToken: z.string().optional(),
  inviteExpiresAt: z.string().datetime().optional(),
});

// Role schemas
export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isSystem: z.boolean().default(false),
  organizationId: z.string().uuid().nullable().optional(), // null for system roles
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Permission schemas
export const PermissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100), // e.g., "crm:contacts:view"
  resource: z.string().min(1).max(100), // e.g., "crm:contacts"
  action: z.string().min(1).max(50), // e.g., "view"
  description: z.string().max(500).optional(),
  createdAt: z.string().datetime(),
});

// RolePermission schemas (many-to-many)
export const RolePermissionSchema = z.object({
  id: z.string().uuid(),
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
  scope: z.enum(['organization', 'own']).default('organization'),
  conditions: z.record(z.unknown()).optional(), // JSON conditions for fine-grained control
  createdAt: z.string().datetime(),
});

// Session schemas
export const DeviceSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  deviceId: z.string().min(1).max(255),
  deviceName: z.string().max(255).optional(),
  deviceType: z.enum(['web', 'mobile', 'tablet', 'desktop', 'api']).default('web'),
  userAgent: z.string().max(1000).optional(),
  ipAddress: z.string().max(45),
  location: z.object({
    country: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().datetime(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.string().datetime(),
  refreshTokenVersion: z.number().int().default(0),
  
  lastActivityAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable().optional(),
  revokedReason: z.string().max(500).optional(),
});

// Auth request/response schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  organizationSlug: z.string().min(3).max(50).optional(),
  deviceId: z.string().min(1).max(255).optional(),
  deviceName: z.string().max(255).optional(),
  rememberMe: z.boolean().default(false),
});

export const LoginResponseSchema = z.object({
  user: UserSchema,
  organization: OrganizationSchema,
  permissions: z.array(z.string()),
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    tokenType: z.literal('Bearer'),
  }),
  session: z.object({
    id: z.string().uuid(),
    deviceId: z.string(),
    createdAt: z.string().datetime(),
  }),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
  deviceId: z.string().min(1).max(255).optional(),
});

export const RefreshTokenResponseSchema = z.object({
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    tokenType: z.literal('Bearer'),
  }),
});

export const LogoutRequestSchema = z.object({
  refreshToken: z.string().optional(),
  allDevices: z.boolean().default(false),
});

export const MeResponseSchema = z.object({
  user: UserSchema,
  organization: OrganizationSchema,
  role: RoleSchema,
  permissions: z.array(z.string()),
  sessions: z.array(z.object({
    id: z.string().uuid(),
    deviceName: z.string().optional(),
    deviceType: z.string(),
    lastActivityAt: z.string().datetime(),
    isCurrent: z.boolean(),
  })),
});

export const SessionsResponseSchema = z.object({
  sessions: z.array(DeviceSessionSchema.omit({
    accessToken: true,
    refreshToken: true,
  }).extend({
    isCurrent: z.boolean(),
  })),
  total: z.number().int(),
});

// Audit log schemas
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
  action: z.string().max(100), // e.g., "invoice.approved", "user.login"
  resource: z.string().max(100), // e.g., "invoice", "user"
  resourceId: z.string().uuid().optional(),
  
  changes: z.object({
    before: z.record(z.unknown()).optional(),
    after: z.record(z.unknown()).optional(),
  }).optional(),
  
  metadata: z.object({
    ipAddress: z.string().max(45).optional(),
    userAgent: z.string().max(1000).optional(),
    sessionId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
  }).optional(),
  
  result: z.enum(['success', 'failure']),
  errorMessage: z.string().max(1000).optional(),
  
  createdAt: z.string().datetime(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type UserOrganization = z.infer<typeof UserOrganizationSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type RolePermission = z.infer<typeof RolePermissionSchema>;
export type DeviceSession = z.infer<typeof DeviceSessionSchema>;

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;

export type AuditLog = z.infer<typeof AuditLogSchema>;