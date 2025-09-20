// ============================================================================
// ECONEURA API CONTRACTS - TYPED SCHEMAS & SDK
// ============================================================================

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const BaseResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  requestId: z.string(),
  timestamp: z.string(),
  processingTime: z.number().optional()
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().optional(),
  totalPages: z.number().optional(),
  hasNext: z.boolean().optional(),
  hasPrev: z.boolean().optional()
});

export const PaginatedResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.any()),
  pagination: PaginationSchema
});

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  organizationId: z.string().uuid().optional(),
  rememberMe: z.boolean().default(false),
  mfaToken: z.string().optional()
});

export const LoginResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    organizationId: z.string().uuid(),
    roles: z.array(z.string()),
    permissions: z.array(z.string())
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer')
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer')
});

export const LogoutRequestSchema = z.object({
  sessionId: z.string().optional()
});

export const CreateApiKeyRequestSchema = z.object({
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  expiresIn: z.number().min(1).max(365).default(90) // days
});

export const ApiKeyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  key: z.string(),
  permissions: z.array(z.string()),
  expiresAt: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().optional()
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  organizationId: z.string().uuid(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
  lastLoginAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationId: z.string().uuid(),
  roles: z.array(z.string()).default([])
});

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  roles: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

// ============================================================================
// ORGANIZATION SCHEMAS
// ============================================================================

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  domain: z.string().optional(),
  settings: z.record(z.any()).default({}),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateOrganizationRequestSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  domain: z.string().optional(),
  settings: z.record(z.any()).default({})
});

export const UpdateOrganizationRequestSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional(),
  settings: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
});

// ============================================================================
// CRM SCHEMAS
// ============================================================================

export const ContactSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  organizationId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateContactRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({})
});

export const UpdateContactRequestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional()
});

export const DealSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  value: z.number().min(0),
  currency: z.string().default('USD'),
  stage: z.string(),
  probability: z.number().min(0).max(100).default(0),
  contactId: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  expectedCloseDate: z.string().optional(),
  customFields: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateDealRequestSchema = z.object({
  title: z.string().min(1, 'Deal title is required'),
  description: z.string().optional(),
  value: z.number().min(0, 'Deal value must be positive'),
  currency: z.string().default('USD'),
  stage: z.string().min(1, 'Deal stage is required'),
  probability: z.number().min(0).max(100).default(0),
  contactId: z.string().uuid().optional(),
  expectedCloseDate: z.string().optional(),
  customFields: z.record(z.any()).default({})
});

export const UpdateDealRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().min(0).optional(),
  currency: z.string().optional(),
  stage: z.string().min(1).optional(),
  probability: z.number().min(0).max(100).optional(),
  contactId: z.string().uuid().optional(),
  expectedCloseDate: z.string().optional(),
  customFields: z.record(z.any()).optional()
});

// ============================================================================
// ERP SCHEMAS
// ============================================================================

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  sku: z.string(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  category: z.string().optional(),
  organizationId: z.string().uuid(),
  isActive: z.boolean().default(true),
  customFields: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('USD'),
  category: z.string().optional(),
  customFields: z.record(z.any()).default({})
});

export const UpdateProductRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  sku: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  customFields: z.record(z.any()).optional()
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  customerId: z.string().uuid(),
  organizationId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  total: z.number().min(0),
  currency: z.string().default('USD'),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    total: z.number().min(0)
  })),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }).optional(),
  customFields: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateOrderRequestSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    price: z.number().min(0)
  })).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1)
  }).optional(),
  customFields: z.record(z.any()).default({})
});

export const UpdateOrderRequestSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1)
  }).optional(),
  customFields: z.record(z.any()).optional()
});

// ============================================================================
// AI SCHEMAS
// ============================================================================

export const AIRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  context: z.record(z.any()).optional()
});

export const AIResponseSchema = z.object({
  id: z.string().uuid(),
  prompt: z.string(),
  response: z.string(),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number()
  }),
  cost: z.number().min(0),
  processingTime: z.number(),
  createdAt: z.string()
});

// ============================================================================
// WEBHOOK SCHEMAS
// ============================================================================

export const WebhookSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  organizationId: z.string().uuid(),
  isActive: z.boolean().default(true),
  secret: z.string().optional(),
  headers: z.record(z.string()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const CreateWebhookRequestSchema = z.object({
  name: z.string().min(1, 'Webhook name is required'),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  headers: z.record(z.string()).default({})
});

export const UpdateWebhookRequestSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
  headers: z.record(z.string()).optional()
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedResponse<T = any> = Omit<BaseResponse, 'data'> & {
  data: T[];
  pagination: Pagination;
};

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequestSchema>;
export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;

export type Contact = z.infer<typeof ContactSchema>;
export type CreateContactRequest = z.infer<typeof CreateContactRequestSchema>;
export type UpdateContactRequest = z.infer<typeof UpdateContactRequestSchema>;

export type Deal = z.infer<typeof DealSchema>;
export type CreateDealRequest = z.infer<typeof CreateDealRequestSchema>;
export type UpdateDealRequest = z.infer<typeof UpdateDealRequestSchema>;

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;

export type AIRequest = z.infer<typeof AIRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;

export type Webhook = z.infer<typeof WebhookSchema>;
export type CreateWebhookRequest = z.infer<typeof CreateWebhookRequestSchema>;
export type UpdateWebhookRequest = z.infer<typeof UpdateWebhookRequestSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
};

export const validateResponse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Response validation error: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
};
